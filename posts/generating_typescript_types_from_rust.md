---
title: Synchronizing Rust Types with Typescript
date: 2021-07-12
tags: Rust,Typescript
---

For [Ergo](https://github.com/dimfeld/ergo) I’m writing the back end in Rust with a front end in Svelte and Typescript. Since Rust is a strongly-typed language, I already have accurate type definitions for each input and output of the server's endpoints, and since Typescript is a mostly-strongly-typed language, I naturally would like to use those types in the front end as well.

But if you have even a passing familiarity with Rust and Typescript, you know that their type syntax is very different. What to do? It would work to manually update types on both ends, but this gets old fast and runs the risk of them getting out of sync. An automatic solution would be much better, and we can accomplish this by taking advantage of the JSON Schema format. 

JSON Schema is a way of attaching type information to a JSON object. A schema can define the fields of an object, which are optional, the types of those fields, and more. There is a lot of tooling around JSON Schema, and so we can use it as an intermediate format between the back end types and the front end types. 

In Rust, we first start with the [`schemars`](https://docs.rs/schemars) crate, which provides a `JsonSchema` trait and a macro to derive it. Let's say we have a few types which
reference each other, and we want to create their analogs in the front end Typescript code.

```rust
use schemars::JsonSchema;
use chrono::{DateTime, Utc};

#[derive(Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "lowercase")]
enum Status {
    Processing,
    Success,
    Failure,
}

#[derive(JsonSchema)]
struct ActionLog {
    action: String,
    status: Status,
    timestamp: DateTime<Utc>,
}

#[derive(JsonSchema)]
struct InputLog {
    input: String,
    status: Status,
    timestamp: DateTime<Utc>,
    actions: Vec<ActionLog>,
}
```

`schemars` automatically detects `serde` renaming, so just as the `Status` enum's values will be converted to lowercase when converting to and from JSON,
the generated JSON schema will also use lowercase values. This is almost always what you want, but `schemars` does allow you to override this if you
have an exceptional case.

Once we have our types defined, we need to generate the schemas. `schemars` provides a `schema_for!` macro which generates the JSON Schema for us. 

```rust
use schemars::schema_for;

let schema = schema_for!(ActionLog);
let output = serde_json::to_string_pretty(schema).unwrap();
std::fs::write("action_log.json", output)?;

let schema = schema_for!(InputLog);
let output = serde_json::to_string_pretty(schema).unwrap();
std::fs::write("input_log.json", output)?;
```

This code can be in a subcommand of the main Rust application, or implemented as a separate binary.

Each schema file contains both the root type, and any other types contained within (which must also derive the `JsonSchema` trait). It also supports generating types for some common packages like `chrono` and `smallvec`. The schema generated for `ActionLog` looks like this.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ActionLog",
  "type": "object",
  "required": [
    "action",
    "status",
    "timestamp"
  ],
  "properties": {
    "action": {
      "type": "string"
    },
    "status": {
      "$ref": "#/definitions/Status"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time"
    }
  },
  "definitions": {
    "Status": {
      "type": "string",
      "enum": [
        "processing",
        "success",
        "failure"
      ]
    }
  }
}
```

As seen here, each schema file contains a root object and also definitions for the objects that it references. Now that we have the JSON schema files,
it’s time to generate Typescript definitions from them. For this, we can use the aptly-named [`json-schema-to-typescript`](https://github.com/bcherny/json-schema-to-typescript) package. 

While this package contains some helper functions to make it really easy to convert a JSON schema file into a typescript type, we can run into problems as we add more types. In the example above, both `InputLog` and `ActionLog` reference `Status`, and `InputLog` also references `ActionLog`. 

These references mean that we'll end up writing Typescript definitions for `Status` and `ActionLog` twice, which Typescript does not like. But with a bit of extra processing, we can avoid this problem.

::: side-by-side

First, we read in all the schemas and generate type definitions for each one. Each schema is stored in a `Map` object, and the 

```javascript
import * as fs from 'node:fs/promises';
import * as path from 'path';
import * as url from 'url';
import { compile } from 'json-schema-to-typescript';

const dirname = path.dirname(url.fileURLToPath(import.meta.url));

async function main() {
  let schemasPath = path.join(dirname, '..', 'schemas');
  let schemaFiles = (await fs.readdir(schemasPath)).filter((x) => x.endsWith('.json'));

   // Compile all types, stripping out duplicates. This is a bit dumb but the easiest way to
  // do it since we can't suppress generation of definition references.
  let compiledTypes = new Set();
  for (let filename of schemaFiles) {
    let filePath = path.join(schemasPath, filename);
    let schema = JSON.parse(await fs.readFile(filePath));
    let compiled = await compile(schema, schema.title, { bannerComment: '' });
```

Next, split on the word “export” to get each individual type on its own. This is kind of a hack but it's the easiest way to go about it without modifying the generator package itself. We add each type definition to a `Set` to ensure that each type will only be written once.

```javascript
    let eachType = compiled.split('export');
    for (let type of eachType) {
      if (!type) {
        continue;
      }
      compiledTypes.add('export ' + type.trim());
    }
  }
```

Finally, we write the contents of the `Set` out to a file. I’ve added an extra check to skip the write if the output matches the existing file to prevent web bundles from thinking something changed if it didn’t actually change. This is an inefficient way to implement such a check but with the number of types I’m working with the performance impact is negligible. 

```javascript
  let output = Array.from(compiledTypes).join('\n\n');
  let outputPath = path.join(dirname, 'src', 'api_types.ts');

  try {
    let existing = await fs.readFile(outputPath);
    if (existing == output) {
      // Skip writing if it hasn't changed, so that we don't confuse any sort
      // of incremental builds. This check isn't ideal but the script runs
      // quickly enough and rarely enough that it doesn't matter.
      console.log('Schemas are up to date');
      return;
    }
  } catch (e) {
    // It's fine if there's no output from a previous run.
    if (e.code !== 'ENOENT') {
      throw e;
    }
  }

  await fs.writeFile(outputPath, output);
  console.log(`Wrote Typescript types to ${outputPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

:::

So far I’ve just been writing all the types into a single file named `api_types.ts`. This keeps things simple since it avoids any need to ensure that files properly reference each other's types, but a larger application may need a smarter solution.

The output looks like you would expect, except for the additional `[k: string]: unknown` which just ensures that the object doesn't have any extra keys. I don't think the `json-schema-to-typescript` package
offers a way to omit this right now, but it could be filtered out when processing the text in the script above if you want.

```typescript
export type Status = "processing" | "success" | "failure";

export interface ActionLog {
  action: string;
  status: Status;
  timestamp: string;
  [k: string]: unknown;
}

export interface InputLog {
  actions: ActionLog[];
  input: string;
  status: Status;
  timestamp: string;
  [k: string]: unknown;
}
```

And one last step: automate it. We can put these commands into our package.json and then use the cargo watch command to rerun the entire process any time a rust file changes. If you don't have the `cargo watch` command, you can get it via `cargo install cargo-watch`.

```json
// front-end package.json
{
  "name": "web",
  "scripts": {
    "dev": "run-p dev:server dev:web",
    "dev:web": "a command that would run Vite, Snowpack, Webpack, etc.",
    "dev:server": "cargo watch --ignore web -s 'cd web && npm run generate-api-types'",
    "generate-api-types": "cargo run --release && node generate_api_types.js"
  }
}
```

I have an example Git repository that does this type generation at https://github.com/dimfeld/rust-types-to-typescript-example.
