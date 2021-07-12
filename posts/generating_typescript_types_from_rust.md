---
title: Generating Typescript Types from Rust Source
date: 2021-07-12
tags: Rust,Typescript
---

For [Ergo](https://github.com/dimfeld/ergo) I’m writing the back end in Rust with a front end in Svelte and Typescript. Since Rust is a strongly-typed language, I must have accurate type definitions for each input and output of the server's endpoints, and since Typescript is a mostly-strongly-typed language, I naturally would like to use those types in the front end as well.

But if you have even a passing familiarity with Rust and Typescript, you know that their type syntax is very different. What to do? It would work to manually update types on both ends, but this gets old fast and runs the risk of them getting out of sync. An automatic solution would be much better, and we can accomplish this by taking advantage of the JSON Schema format. 

JSON Schema is a way of attaching type information to a JSON object. A schema can define the fields of an object, which are optional, the types of those fields, and more. 

There is a lot of tooling around JSON Schema, and so we can use it as an intermediate format between the backend and the front end types. 

In Rust, we import the schemars crate, which provides a JsonSchema trait and a macro to derive it. 

Then, we just need to write the schemas out to a file. Again, schemars makes this easy. Each schema file contains both the root type, and any other types contained within (which must also derive the JsonSchema trait). It also supports common packages like chrono and smallvec. 

Now we have our JSON schema files, and so it’s type to generate Typescript definitions from them. For this, we can use the aptly-named json-schema-to-typescript package. 

While this package contains some helper functions to make it really easy to convert a JSON schema file into a typescript type, we can run into problems as we add more types. 

The package writes out a type for each type it finds in the schema, so if you’re have two schema files generated from Rust types that both contain the same nested type, you’ll end up with duplicates in your Typesxript definitions. A bit of extra calculation solves that. 

First, we read in all the schemas and generate type definitions for each one. 

Next, split on the word “export” to get each individual type on its own. This is kind of a hack but definitely the easiest way to go about it without modifying the package. 

Finally, we add each type definition into a Set to deduplicate it, and write the contents of the Set out to a file. I’ve added an extra check to skip the write if the output matches the existing file to prevent web bundles from thinking something changed if it didn’t actually change. This is a relatively slow, hacky way to implement such a check but with the number of types I’m working with the performance impact is negligible. 

So far I’ve just been writing all the types into a single file named api_types.ts. This keeps things simple insofar as there’s no need to make sure that each file correctly imports types from the other files. 

And one last step: automate it. We can put these commands into our package.json and then use the cargo watch command to rerun the entire process any time a rust file changes.

I have an example application that does this type generation (and nothing else) at https://github.com/dimfeld/rust-types-to-typescript-example.
