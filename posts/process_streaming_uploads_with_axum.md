---
title: Process Streaming Uploads with Axum
date: 2022-11-26
tags: Rust
---

Many web services allow the user to upload a file and save it to some other place such as Amazon S3. Commonly, you can tell S3 to generate a special presigned URL which the client can use to upload the file to a specific location.

But sometimes you also want to be able to process the data as it streams through, which means it's easiest to handle it
yourself.

I had a need for this in my [Pic Store](/notes/projects_pic_store) project recently. When the user uploads an image, it passes the data through to the destination backing store, such as S3, but it also needs to calculate a hash of the image and figure out the format and dimensions.

This project uses the Rust [Axum](https://github.com/tokio-rs/axum) framework, but the same techniques work across other
frameworks as well.

# Receive the request as a stream

First, we set up our route handler with a streaming reader. Axum provides a `BodyStream` extractor which does the hard work for us.

``` rust
pub async fn upload_image(
  // Other data -- app state, user info, etc.
  State(state): State<AppState>,
  Authenticated(user): Authenticated,
  Path(image_id): Path<BaseImageId>,
  // The actual request body
  stream: BodyStream,
) -> Result<impl IntoResponse, Error> {
  let image_location = get_base_image(&state, &user, image_id).await?;
  todo!();
}

pub fn configure_router() -> Router {
    Router::new()
        .post('/images/:image_id/upload', upload_image)
        // And so on...
}
```

The handler starts by reading the database to figure out where the image should be stored, if the user has permission to upload this image, and so on. I'll skip over the details here since they're not really related, which means it's time to look at the data.

# Setting up the Destination Writer

There's a lot of ways to handle the S3 write, but my application needed something that could potentially talk to multiple storage services. The [object_store](https://docs.rs/object_store/latest/object_store/) crate is a good choice here. It's part of the Apache Arrow project so it sees active development, and I found it very easy to use.

Since we're streaming the data, we'll use a multipart upload which removes the need to buffer the data locally. The `object_store` transparently manages the buffers and metadata around the multipart upload process.

``` rust
let store = object_store::aws::AmazonS3Builder::new()
  .with_bucket_name(bucket)
  // Auth options go here too if you're using a fixed access key and secret.
  .build();

let (upload_id, mut writer) = operator.put_multipart(image_location).await?;
let upload_result = handle_body(&mut writer, stream).await;

todo!("Handle the result");

/// Handle the request body
async fn handle_body(
  writer: &mut Box<dyn AsyncWrite + Unpin + Send>,
  mut stream: BodyStream,
) -> Result<(String, ImageInfo), Error> {
  todo!();
}
```

The `put_multipart` function returns an object that implements [`AsyncWrite`](https://docs.rs/tokio/latest/tokio/io/trait.AsyncWrite.html), and also an upload ID. The upload ID can be used to cancel the multipart upload in case of an error.

We'll write a separate `handle_body` function to do the actual work here, so that we can easily catch any error that occurs and perform the cancellation.

# Handling the Data

Now that the writer is ready, we can also set up our other operations -- calculating the hash and figuring out the image format and dimensions.

## Accumulating the header

I used the [imageinfo](https://docs.rs/imageinfo) crate here to examine the image, and it requires just the first 1024 bytes of the file to accomplish this.

There's a good chance that the first chunk of the body will be larger than 1024 bytes, but we can't count on that, so we use a `Header` object to accumulate data until we have enough.

This is actually the most complicated block of code in this article, but all it's really doing is filling up a buffer and trying not to make more copies than it needs to. I'm including this since you might find it useful, but feel free to [skip to the next section](#consuming-the-stream) if you don't care about the details here.

``` rust
const HEADER_CAP: usize = 1024;

struct Header {
  buf: HeaderBuf,
}

enum HeaderBuf {
  Empty,
  Vec(Vec<u8>),
  Ref(Bytes),
}

impl Header {
  fn new() -> Header {
      Header {
          buf: HeaderBuf::Empty,
      }
  }

  fn as_slice(&self) -> &[u8] {
      match &self.buf {
          HeaderBuf::Vec(vec) => vec.as_slice(),
          HeaderBuf::Ref(bytes) => bytes.as_ref(),
          HeaderBuf::Empty => panic!("as_slice on empty header"),
      }
  }


  /// See if the buffer is full enough
  fn ready(&self) -> bool {
      let len = match &self.buf {
          HeaderBuf::Vec(vec) => vec.len(),
          HeaderBuf::Ref(bytes) => bytes.len(),
          HeaderBuf::Empty => 0,
      };

      len >= HEADER_CAP
  }

  /// Add more data to the header buffer.
  fn add_chunk(&mut self, bytes: &Bytes) {
      if self.ready() {
          return;
      }

      self.buf = match std::mem::replace(&mut self.buf, HeaderBuf::Empty) {
          // This is the first chunk.
          HeaderBuf::Empty => HeaderBuf::Ref(bytes.clone()),
          // It's already a Vec, so add an additional chunk to the Vec.
          HeaderBuf::Vec(mut vec) => {
              let needed = HEADER_CAP - vec.len();
              let actual = needed.min(bytes.len());
              vec.extend(bytes.slice(0..actual));
              HeaderBuf::Vec(vec)
          }
          HeaderBuf::Ref(first_bytes) => {
              // We had a first chunk of bytes but it wasn't big enough, so
              // create a new Vec from the first chunk...
              let mut vec = Vec::with_capacity(HEADER_CAP);
              vec.extend(first_bytes.iter().take(HEADER_CAP));

              // And then add the current chunk
              let needed = HEADER_CAP - vec.len();
              let actual = needed.min(bytes.len());
              vec.extend(bytes.slice(0..actual));

              HeaderBuf::Vec(vec)
          }
      };
  }

  /// Try to get the image information.
  fn parse(&self) -> Result<ImageInfo, ImageInfoError> {
      assert!(self.ready());
      let bytes = self.as_slice();
      ImageInfo::from_raw_data(bytes)
  }
}
```

## Consuming the Stream

With our header accumulation ready, we can fill in our `handle_body` function and actually consume the stream. First, we'll initialize our other data handling. I used [blake3](https://docs.rs/blake3) for the hash and the aforementioned [imageinfo](https://docs.rs/imageinfo) for the image processing.

``` rust
let mut hasher = blake3::Hasher::new();

let mut header = Header::new();
let mut info: Option<ImageInfo> = None;
```

The `Stream` abstraction provides a few ways to consume the data. For our purposes, a `while` loop is easiest. Each chunk then goes through the hasher and the image header object, and finally out to the writer.

``` rust
while let Some(chunk) = stream.try_next().await? {
  hasher.update(&chunk);

  if info.is_none() {
    header.add_chunk(&chunk);
    if header.ready() {
      let i = header.parse()?;
      info = Some(i);
    }
  }

  writer.write_all(&chunk).await?;
}
```

# Finishing up

Once the loop is done, we just have to clean things up. First we'll look at the results of our data processing tasks and return from `handle_body`.

``` rust
// Unwrap the `Option`, returning an error if we never saw enough data to fill the buffer.
let info = info
  .ok_or(Error::ImageHeaderDecode(ImageInfoError::UnrecognizedFormat))?;

// Get the calculated hash.
let hash = hasher.finalize();
let hash_hex = hash.to_string();

Ok((hash_hex, info))
```

Finally, we update our original call to `handle_body` to examine its result.

``` rust
let upload_result = handle_body(&mut writer, stream).await;
let (hash_hex, info) = match upload_result {
  Ok(data) => {
    writer.shutdown().await?;
    data
  }
  Err(e) => {
    store
      .abort_multipart(&image_location, &upload_id)
      .await
      .ok();
    return Err(e);
  }
};
```

If everything succeeded, we call [shutdown](https://docs.rs/tokio/latest/tokio/io/trait.AsyncWriteExt.html#method.shutdown), which closes the stream and ensures that all the data has been written. `object_store` requires that you explicitly shutdown the stream, since it also uses this opportunity to tell S3 that the upload is complete.

If something failed, then we just tell the store to abort the upload, which lets S3 know that it should purge the data uploaded so far.

And then we're done! My [actual application code](https://github.com/dimfeld/pic-store/blob/f76f4c903f22aafe62452060de65a1f03df360dc/api/src/routes/image/upload.rs) goes on to save the resulting metadata to the database and set up some background jobs to convert the image to other formats.

Handling streaming request bodies can feel like a daunting task. But I hope this has demonstrated how the Rust ecosystem provides great tools for making this an ergonomic and relatively painless process.

