---
title: Rust Selective Closure Capture
date: 2020-08-10
tags: rust
---

Sometimes in Rust you have a closure that needs to move some values but not others. If all the values satisfy the `Copy` trait this is easy, but that is usually not the case.

You can solve this problem by creating new bindings for the by-reference values, so that the closure moves the references instead of the original value. It's not pretty but it works well.

```rust
let threads = vec![("referrers", "s"), ("referrals", "o")];

crossbeam::thread::scope(|s| {
    for (description, field) in threads {
        // Get variables that we want to borrow explicitly as references so
        // that the closure moves only the references.
        let input_path = &input_path;
        let output_path = &output_path;
        let logger = &logger;
        let file_prefix = &file_prefix;
        s.spawn(move |_| {
            write_data(
                &logger,
                description,
                &input_path,
                &output_path,
                file_prefix.as_str(),
                field
            );
        });
    }
})
.unwrap();
```
