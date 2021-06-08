---
title: Demystifying Actix Web Middleware
date: 2021-06-07
tags: Rust
# cardImage: leaflet_with_svelte_card.png
# cardImageFilter: saturate(200%)
---

For my [Ergo task orchestrator](https://github.com/dimfeld/ergo) side project, I've been writing the entire backend in Rust. As with any real project, this required writing some middleware, and while there are plenty of simple examples for [Actix Web](https://actix.rs), it took a bit more effort to figure out what  understand *why* things are done the way they are.

Javascript middleware often involves writing only a single function. The exact syntax differs between frameworks, but it usually looks something like this:

```javascript
async function middleware(request, response, next) {
  try {
    let session = request.cookies['sid'];
    if(session) {
      req.user = await getUser(session);
    }
  } catch(e) {
    return next(e);
  }

  next();
}

app.use(middleware);
```

As with many things in Rust, middleware for the Actix Web framework is rather more complex. It requires implementing [Transform](https://docs.rs/actix-web/4.0.0-beta.4/actix_web/dev/trait.Transform.html) and [Service](https://docs.rs/actix-web/4.0.0-beta.4/actix_web/dev/trait.Service.html) traits to get started, and you might also need an extractor that implements [FromRequest](https://docs.rs/actix-web/4.0.0-beta.4/actix_web/trait.FromRequest.html) to conveniently retrieve any extra data, such as the user object in the JS example above.

Actix provides a [wrap_fn](https://docs.rs/actix-web/4.0.0-beta.4/actix_web/struct.Scope.html#method.wrap_fn) helper to make middleware with only a closure, similar to the JS example. This works for any middleware that can be written as a closure, but otherwise it's not an option, so let's continue so we can see what's happening under the hood.

:::note 
In this post I'm using the middleware traits from `actix-service` version 2, used by `actix-web` 4.0 which is in beta as I write this. The primary difference from `actix-web` 3 is that the `Transform` trait used to have an associated `Transform::Request` type, but it is now a type parameter on the trait instead: `Transform<S, Req>`.  In actual use, this makes very little difference.
:::

So we need a `Transform`, a `Service`, and maybe an extractor, but how do they fit together? For many middlewares, most of the complexity turns out to be boilerplate, but it still helps to understand what that boilerplate is actually doing. First, let's take a step back and understand more generally what a `Service` represents.


# The Service Trait

Actix's `Service` represents anything that takes a request and returns a response. For HTTP, this includes both route handlers and middleware, but a Service doesn't have to be specific to HTTP. 

A middleware, then, is a special case of a `Service` that does some work and also calls another `Service`, which may be another layer of middleware or the endpoint handler.

:::note
This `Service` trait is identical to the `Service` traits in the  `hyper` and  `tower` crates. I hope that eventually they will all merge together to pull the trait from a single crate, which will make it easier to create middleware that supports multiple frameworks.
:::

Let's take a look at the trait itself. The [actual source file](https://github.com/actix/actix-net/blob/983abec77d3d57e13aaa4773e23befd1643bf914/actix-service/src/lib.rs#L93) has plenty of comments which I've truncated here for brevity.

```rust
pub trait Service<Req> {
    /// Responses given by the service.
    type Response;

    /// Errors produced by the service when polling readiness or executing call.
    type Error;

    /// The future response value.
    type Future: Future<Output = Result<Self::Response, Self::Error>>;

    /// Returns `Ready` when the service is able to process requests.
    fn poll_ready(&self, ctx: &mut task::Context<'_>) -> Poll<Result<(), Self::Error>>;

    /// Process the request and return the response asynchronously.
    fn call(&self, req: Req) -> Self::Future;
}
```


In actix-web middleware, `Response` should always be a `actix_web::dev::ServiceResponse` and `Error` should be an `actix_web::Error`.

Actix calls `poll_ready` to determine if the service is ready to be invoked. This might be useful, for example, when the service needs limit the number of total times that it is called simultaneously. Usually you don't need to provide your own implementation of this function, and `actix-service` version 2 provides the `forward_ready!` macro to delegate this function to the wrapped service.

The `call` function is where all the "real" functionality goes, and it isn't too different from the JavaScript example. You can inspect or mutate the request and response objects as needed, and invoke the wrapped service if appropriate. There are three main differences from the JavaScript style:

1. In most JS frameworks, the response object already exists and is passed into the middleware. Here, the response object is created by the wrapped service instead. The middleware can also create and return its own response object if appropriate.
2. Errors are handled in normal Rust fashion, by returning a `Result::Err` instead of overloading the `next` function used to invoke the wrapped service.
3. Since Rust is strongly typed, we can’t put extra data anywhere on the request. Instead, Actix has an "extension" mechanism to allow attaching extra data to the request for later retrieval. I'll show an example of this later on. 

# The Transform Trait

Now that we some idea of how `Service` works, where does `Transform` come in? Abstractly, it “transforms” a service by wrapping it in another service, but in our case it's easier to think of it as a factory.  The `Transform` implementation's only job is to create new middleware instances that wrap other services.

![Transform trait object flow](actix-middleware-transform.svg)

`Transform` has some associated types, which mostly describe the same types on the created middleware `Service`. The only new type is `InitError`, which indicates an error that might occur when creating the middleware instance, if any.

```rust
pub trait Transform<S, Req> {
    /// Responses produced by the service.
    type Response;

    /// Errors produced by the service.
    type Error;

    /// The `TransformService` value created by this factory
    type Transform: Service<Req, Response = Self::Response, Error = Self::Error>;

    /// Errors produced while building a transform service.
    type InitError;

    /// The future response value.
    type Future: Future<Output = Result<Self::Transform, Self::InitError>>;

    /// Creates and returns a new Transform component, asynchronously
    fn new_transform(&self, service: S) -> Self::Future;
}
```

There's a single function, `new_transform`, that creates a new instance of the middleware `Service`. The created middleware should wrap the service indicated by the `service` parameter.

`new_transform` returns a `Future` to allow some asynchronous work to be done while creating the middleware. We only need to create a new object, so we'll use a `Ready` future type to wrap the new middleware inside a future. This is similar to using Javascript's `Promise.resolve` to place a value inside a Promise.

# Implementing the Middleware
For [Ergo](https://github.com/dimfeld/ergo) the first middleware I created is an authenticator which fetches user data, and so I'll use that as the example here.

First, the middleware service structure. The middleware contains the service to be wrapped and an `AuthData` object, which has the logic for finding the user for each request.

```rust
pub type AuthenticationInfo = Rc<AuthenticationResult>;
pub struct AuthenticateMiddleware<S> {
    auth_data: Rc<AuthData>,
    service: Rc<S>,
}
```

`AuthenticationInfo` is a type alias that we’ll use later to make the information available to other parts of the app. We can use `Rc` instead of `Arc` here since Actix Web uses multiple single-thread runtimes and data won't be sent between threads.

Next, the `Service` implementation for the middleware. The `B` type parameter here represents the type of the body returned from the service, which we pass into the type signature of `ServiceResponse<B>` but don't otherwise care about in this case. 

```rust
impl<S, B> Service<ServiceRequest> for AuthenticateMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    actix_service::forward_ready!(service);
```

This first part of the implementation will be pretty much the same for most middleware. We use the aforementioned `forward_ready` to delegate `Service::poll_ready` to the wrapped service.

The only other notable thing is the use of `LocalBoxFuture` for the Future type, which makes it easier to use an `async` block without needing to deal with the opaque future types returned by `async` blocks. `LocalBoxFuture` is the non-`Send` version of `BoxFuture`, in the same way that `Rc` can be used instead of `Arc`.

```rust
    fn call(&self, req: ServiceRequest) -> Self::Future {
	// Clone the Rc pointers so we can move them into the async block.
        let srv = self.service.clone();
        let auth_data = self.auth_data.clone();

        async move {
            // Get the session cookie value, if it exists. 
            let id = req.get_identity();
            // See if we can match it to a user.
            let auth = auth_data.authenticate(id, &req).await?;
            if let Some(auth) = auth {
                // If we found a user, add it to the request extensions
                // for later retrieval.
                req.extensions_mut()
                  .insert::<AuthenticationInfo>(Rc::new(auth));
            }

            let res = srv.call(req).await?;

            Ok(res)
        }
        .boxed_local()
    }
}
```

This block gets the session ID from the request cookies, managed by the `actix-identity` middleware, and passes it to `AuthData::authenticate` which gets the user information from the database. If we found the user, then we use the extensions API to insert it into the request. Actix uses the `TypeId` of the type parameter as the key here, so it will later be retrieved using the same `AuthenticationInfo` type.

In this case, we don't throw an error on unauthenticated requests. Later code can decide if it requires a user or not.

Next, we have the factory object which implements `Transform`.

```rust
pub struct AuthenticateMiddlewareFactory {
    auth_data: Rc<AuthData>,
}

impl AuthenticateMiddlewareFactory {
    pub fn new(auth_data: AuthData) -> Self {
        AuthenticateMiddlewareFactory {
            auth_data: Rc::new(auth_data),
        }
    }
}

impl<S, B> Transform<S, ServiceRequest> for AuthenticateMiddlewareFactory
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = AuthenticateMiddleware<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(AuthenticateMiddleware {
            auth_data: self.auth_data.clone(),
            service: Rc::new(service),
        }))
    }
}
```

As discussed, the types mostly match those used for the middleware service type, and `new_transform` creates an instance of the middleware and uses `ready` to wrap it in a future.

Finally, we can add it to the server using `wrap`.

```rust
let authdata = AuthData::new(...);
let identity = actix_identity::IdentityService::new(...);

App::new().service(
  web::scope("/api")
    .wrap(AuthenticateMiddlewareFactory::new(
      authdata.clone()
    ))
    .wrap(identity)
    .wrap(TracingLogger::default())
    .configure(web_app_server::config)
    .configure(tasks::handlers::config)
    .configure(status_server::config)
  )
```

# Retrieving the User Information

Now that the middleware is installed, we can use it in a route handler, another middleware, or a request extractor.

The first two options involve using the request extensions API to look up the object with the correct type: `req.extensions().get::<AuthenticationInfo>()`. This uses the same `TypeId` key that we used when adding the information from the middleware.

Actix also makes heavy use of request extractors. Route handlers commonly use `Data`, `Path`, `Json`, or similar types to expose information from the request, and these types all implement the `FromRequest` trait. We can make our own implementation to ease the process of extracting the `AuthenticationInfo`.

```rust
pub struct Authenticated(AuthenticationInfo);

impl FromRequest for Authenticated {
    type Config = ();
    type Error = Error;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &actix_web::HttpRequest,
            payload: &mut actix_web::dev::Payload) -> Self::Future {

        let value = req.extensions().get::<AuthenticationInfo>().cloned();
        let result = match value {
            Some(v) => Ok(Authenticated(v)),
            None => Err(Error::AuthenticationError),
        };
        ready(result)
    }
}

impl std::ops::Deref for Authenticated {
    type Target = AuthenticationInfo;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
```

This function also uses the extensions API to get the user information, and then returns it inside a `Ready` future. We also implement `Deref` to make it easy to use the `AuthenticationInfo` object embedded in the `Authenticated` extractor.

The `Config` type is a bit confusing, and it appears to be a relic from a much older version of Actix Web. Nowadays, it is almost always the unit type, and in the few places where the type is used, its only purpose is to document a related type that the extractor uses. A [recent Github PR](https://github.com/actix/actix-web/pull/2233) suggests removing it completely. (If it has been removed by the time you read this and I haven't updated the blog post, please let me know!)

Now that we have our extractor, we can drop it into the argument list of any handler.

```rust
#[put("/tasks/{task_id}")]
async fn write_task_handler(
    task_id: Path<String>,
    app_data: AppStateData,
    payload: Json<SomeObject>,
    req: HttpRequest,
    auth: Authenticated,
) -> Result<impl Responder> {
    let org = auth.org_id();
    let user = auth.user_id();
    todo!();
}
```

A nice bonus here is that the request extractor both retrieves the authentication information and also verifies that a user was actually found. Its very presence in the function signature will make unauthenticated requests to that endpoint fail with an appropriate error.

I've also implemented a `MaybeAuthenticated` extractor, which works similarly but always succeeds and returns an `Option<AuthenticationInfo>`. This enables handlers that may customize their behavior for logged-in users, but also work with anonymous users.

```rust
pub struct MaybeAuthenticated(Option<AuthenticationInfo>);

impl FromRequest for MaybeAuthenticated {
    // ... all the same associated types go here
    fn from_request(req: &HttpRequest,
            _payload: &mut actix_web::dev::Payload) -> Self::Future {
        let value = req.extensions().get::<AuthenticationInfo>().cloned();
        ready(Ok(MaybeAuthenticated(value)))
    }
}
```

When writing this code, I found that the difficult part was understanding the purpose of the boilerplate and what it was doing, but actually writing the purpose-specific parts of the middleware wasn't too complex in the end. Hopefully this makes things easier to understand!
