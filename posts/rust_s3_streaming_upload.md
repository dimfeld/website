---
title: Streaming S3 Uploads in Rust
summary: Managing buffers for multipart uploads
frontPageSummary: managing buffers for multipart uploads
tags: Rust
date: 2021-06-28
---

Amazon’s S3 API makes it easy to upload large files, but it gets harder with dynamically generated data since S3 wants to know up front how much data you're going to upload, and you might not know that until you're done generating it. This might occur when streaming data from some other source or recording live media, for example.

The multipart upload API fixes this somewhat -- you still have to know the size of each part as you upload it, but you can have up to 10,000 parts and you don't have to know in advance how many parts you will upload. The one complication with the multipart API is that each part must be at least 5MB.

With this in mind, streaming data to the multipart upload API involves gathering data buffers as they are generated and periodically uploading the accumulated data as a new S3 part when it reaches a certain threshold size, while also making sure to honor the minimum part size.

Let’s look at some scenarios with a threshold size of 50MB. In all these cases, the uploader receives a stream of byte chunks, which it groups into S3 parts of approximately the threshold size.

- The total amount of data is 75MB. The first 50MB gets uploaded as a part and the last 25MB is uploaded as the second part.
- The total amount of data is 120 MB. Similar, with two 50MB parts and one 20MB part.
- The total amount of data is 30MB. In this case we don’t hit the threshold, so the easiest thing to do is just skip the multipart upload process and do a single put operation instead.
- The total amount of data is 3MB. As in the above case, the stream ends and we haven't yet uploaded any parts, so we just do a standard "put object" request, which doesn't have the 5MB minimum size that multipart uploads enforce.
- The total amount of data is 102MB, so we have two 50MB parts and one 2MB part. But parts must be at least 5 MB. Uh oh...

::: note
A couple readers pointed out that the S3 multipart upload API does allow the *final* part to be less than 5 MB, and [Ian O'Connell](https://twitter.com/0x138) on Twitter was kind
enough to put together a working example of successfully uploading multipart objects with with a small final part. I suspect my initial attempt at writing this code had
some other sort of bug that also disappeared when I refactored it to account for small part sizes.

This means that the extra work to check for minimum part size is not needed in this code. I've left the code itself unchanged in case you find the buffer splitting techniques
useful for some other context.
:::

We can't predict that the last part will be only 2MB, so we have to maintain some reserve to make sure that we'll always have 5MB of data waiting to upload. The algorithm looks roughly like this:

1. Receive data buffers from the stream and save them into a list.
2. If the amount of data accumulated is less than 50MB, go back to step 1.
3. Remove buffers from the list, keeping just enough buffers so that there is at least 5MB (the minimum part size) remaining.
4. Start a new multipart upload if it hasn’t been started yet.
5. Upload the removed buffers to S3 as a new part.

When the stream ends, you send all the remaining buffers to S3 as another part, and since you made sure to always keep 5MB of data in reserve, the last part will always be at least that large, regardless of how much data actually came in.

So in our 122MB example, the first two parts will be the threshold size (50MB) minus 5MB, and the final part will contain the remaining data. This comes out to approximately 45MB, 45MB, and 12MB.

This mostly works, but can still fall apart if an especially large buffer arrives, such as if the stream includes a 52MB buffer. This one buffer is above the threshold size, so it's enough to trigger an upload, but removing it from the list could leave less than 5MB reserved.

The solution is to split the buffer. We send 47MB to S3 while leaving 5MB left in our buffer list to maintain the minimum reserve requirement. Fortunately, the Rust `bytes` crate allows splitting buffers like this via an internally-maintained reference count, so we don’t have to copy all that data around more than necessary. (As noted in the callout above, this turns out to not be necessary.)

With the algorithm figured out, let's take a look at the code.

::: side-by-side

```rust
use crate::Error; // An error defined elsewhere with `thiserror`
use anyhow::anyhow;
use bytes::Bytes;
use std::collections::VecDeque;
use tokio::task::JoinHandle;

/// Buffer 50MB per upload part. S3 allows up to 10000 parts which gives us a total
/// limit of 500GB per file.
const BUFFER_LIMIT: usize = 50 * 1024 * 1024;
const MIN_PART_SIZE: usize = 5 * 1024 * 1024;

async fn run_upload(
    client: rusoto_s3::S3Client,
    bucket: String,
    key: String,
    mut source: impl Stream<Item=Result<Bytes, Error>>,
) -> Result<(), (Option<String>, Error)> {
    // The ID of the multipart upload, once we start it.
    let mut upload_id: Option<String> = None;
    // A list of uploaded parts, needed when we complete the upload
    // at the end.
    let mut uploaded_parts = Vec::new();
    let mut part_number = 1;
    // Buffers waiting to be uploaded.
    let mut buffers = VecDeque::new();
    // The total number of bytes stored in `buffers`.
    let mut outstanding_data = 0;

    loop {
```

Pull buffers out of the stream until we've accumulated at least `BUFFER_LIMIT` bytes.

```rust
        while let Some(data) = source.recv().await {
            let data = data.map_err(|e| (upload_id.clone(), e))?;
            outstanding_data += data.len();
            buffers.push_back(data);

            if outstanding_data >= BUFFER_LIMIT {
                break;
            }
        }

```

If the stream ended and we also have no more buffers waiting, then we're done.

```rust
        if buffers.len() == 0 {
            // No more data.
            break;
        }

```

To upload a part, we first need to get the ID for the multipart upload, or start the
multipart upload if we haven't done so yet.

If the stream ended before we could start the multipart upload, then we call `simple_upload` (see below)
to just upload our data with the normal S3 "put object" API.

If not, then we call the S3 API to create a new multipart upload.

```rust
        let stream_ended = outstanding_data < BUFFER_LIMIT;

        let current_upload_id = match &upload_id {
            Some(u) => u.clone(),
            None => {
                if stream_ended {
                    // The stream ended before we started the
                    // multipart upload so just do a simple upload.
                    return simple_upload(client, bucket, object,
                            buffers, outstanding_data)
                        .await
                        .map_err(|e| (None, e));
                }

                let create_request = rusoto_s3::CreateMultipartUploadRequest {
                    bucket: bucket.clone(),
                    key: key.clone(),
                    ..Default::default()
                };
                let upload = client
                    .create_multipart_upload(create_request)
                    .await
                    .map_err(|e| {
                        (
                            None,
                            Error::WriteError {
                                bucket: bucket.clone(),
                                key: key.clone(),
                                source: e.into(),
                            },
                        )
                    })?;
                let id = upload.upload_id.unwrap();
                upload_id = Some(id.clone());
                id
            }
        };

```

Next, we put together a list of buffers to send in this part.

If the stream has ended, then this is all the buffers we have.

```rust
        let (this_part_buffers, this_part_size) = if stream_ended {
            // Just move everything into the buffer
            let bufs = buffers.drain(..).collect::<Vec<_>>();
            let this_part_size = outstanding_data;
            outstanding_data = 0;
            (bufs, this_part_size)
        } else {
```

If the stream hasn't ended, then this isn't the final part.

Get buffers from the list, making sure to leave at least 5MB worth so that we are guaranteed to have
enough data to upload the final part.

```rust
            let mut this_part_buffers = Vec::new();
            let mut this_part_size = 0;
            while outstanding_data - buffers.front().map(|b| b.len()).unwrap_or(0) > MIN_PART_SIZE {
                let buffer = buffers.pop_front().unwrap();
                this_part_size += buffer.len();
                outstanding_data -= buffer.len();
                this_part_buffers.push(buffer);
            }

```

Handle the buffer-splitting case. This happens if the next buffer in the list is large enough that pulling it off would leave
less than 5MB reserved, but we also haven't
read enough data for the current part to be large enough.

As mentioned above, this turns out to not be necessary, but I've left it here
for reference in case you find the technique useful elsewhere.

```rust
            if this_part_size < MIN_PART_SIZE {
                let buffer = buffers.front_mut().unwrap();
                let write_buffer = buffer.split_to(MIN_PART_SIZE - this_part_size);
                this_part_size += write_buffer.len();
                outstanding_data -= write_buffer.len();
                this_part_buffers.push(write_buffer);
            }

            (this_part_buffers, this_part_size)
        };

```

A quick consistency check to make sure that we did things right.

```rust
        let actual_part_sizes = this_part_buffers
            .iter()
            .map(|b| b.len())
            .sum::<usize>();

        if actual_part_sizes != this_part_size {
            return Err((
                upload_id.clone(),
                Error::WriteError {
                    bucket: bucket.clone(),
                    key: key.clone(),
                    source: anyhow!(
                        "Had size {} but calculated size {}",
                        actual_part_sizes,
                        this_part_size
                    ),
                },
            ));
        }
```

And now we're ready to upload a part. This is done with a retry function since S3
will occasionally return a transient error during an upload.

```rust
        let uploaded_part = retry_with_data(
                this_part_buffers, |buffers| {

            let client = client.clone();
            let bucket = bucket.clone();
            let key = key.clone();
            let current_upload_id = current_upload_id.clone();
            async move {
                let bytes_stream = futures::stream::iter(buffers);
                let req = rusoto_s3::UploadPartRequest {
                    bucket,
                    key,
                    upload_id: current_upload_id,
                    content_length: Some(this_part_size as i64),
                    part_number,
                    body: Some(rusoto_core::ByteStream::new(bytes_stream)),
                    ..Default::default()
                };
                client.upload_part(req).await
            }
        })
        .await
        .map_err(|e| {
            (
                upload_id.clone(),
                Error::WriteError {
                    bucket: bucket.clone(),
                    key: key.clone(),
                    source: e.into(),
                },
            )
        })?;

```

S3 returns an `e_tag` for the part, which we'll need later.

```rust
        uploaded_parts.push(rusoto_s3::CompletedPart {
            part_number: Some(part_number),
            e_tag: uploaded_part.e_tag,
        });

        part_number += 1;
    }

```

Here we're done with our loop, so we just send a "complete upload" request to finish things off.

```rust
    if let Some(upload_id) = upload_id {
        let upload_summary = rusoto_s3::CompletedMultipartUpload {
            parts: Some(uploaded_parts),
        };

        let complete_request = rusoto_s3::CompleteMultipartUploadRequest {
            upload_id: upload_id.clone(),
            bucket: bucket.clone(),
            key: key.clone(),
            multipart_upload: Some(upload_summary),
            ..Default::default()
        };

        client
            .complete_multipart_upload(complete_request)
            .await
            .map_err(|e| {
                (
                    Some(upload_id),
                    Error::WriteError {
                        bucket,
                        key,
                        source: e.into(),
                    },
                )
            })?;
    }

    Ok(())
}

```

And here is the other function used when we ended up with just a small amount of data. It does a single
"put object" call to upload the data all at once.

```rust
async fn simple_upload(
    client: S3Client,
    bucket: String,
    key: String,
    buffers: VecDeque<Bytes>,
    total_length: usize,
) -> Result<()> {
    let buffers = buffers.into_iter().collect::<Vec<_>>();
    retry_with_data(buffers, |data| {
        let client = client.clone();
        let bucket = bucket.clone();
        let key = key.clone();
        async move {
            let request = rusoto_s3::PutObjectRequest {
                bucket,
                key,
                body: Some(rusoto_core::ByteStream::new(futures::stream::iter(data))),
                content_length: Some(total_length as i64),
                ..Default::default()
            };

            client.put_object(request).await
        }
    })
    .await
    .map_err(|e| Error::WriteError {
        bucket,
        key,
        source: e.into(),
    })?;

    Ok(())
}

```

Finally, the function that runs the upload. This both starts a new task in the Tokio runtime to handle the
upload, and handles aborting the upload in case of an error.

```rust
pub fn start_upload_task(
        client: rusoto_s3::Client,
        bucket: String,
        key: String,
        source: impl Stream<Item=Result<Bytes, std::io::Error>>
    ) -> JoinHandle<anyhow::Result<()>> {

    tokio::task::spawn(async move {
        let result = run_upload(client.clone(), bucket, key, source).await;
        match result {
            Ok(_) => Ok(()),
            Err((upload_id, e)) => {
                if let Some(upload_id) = upload_id {
                    let cancel_request = rusoto_s3::AbortMultipartUploadRequest {
                        bucket: bucket.clone(),
                        key: key.clone(),
                        upload_id,
                        ..Default::default()
                    };

                    client.abort_multipart_upload(cancel_request).await.ok();
                }
                Err(e)
            }
        }
    })
}
```

:::

S3 will keep uploaded parts from an unfinished multipart upload around forever if it is not explicitly aborted and the S3 bucket, so it's important to handle that.

Buckets can also have lifecycle rules to purge unfinished uploads after a certain amount of time. This is also advisable in case the abort request doesn't reach S3 for some reason.
