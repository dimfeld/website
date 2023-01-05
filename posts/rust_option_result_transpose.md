---
title: Switching Result and Option in Rust with Transpose
date: 2023-01-05
tags: Rust
---

When writing Rust code, it's common to have an `Option` value that you want to map through some fallible operation. For example, you have an `Option<String>` and you want to parse it as an integer. You could do something like this:

```rust
fn parse_maybe_int(s: Option<String>) -> Option<Result<i32, ParseIntError>> {
    s.map(|s| s.parse::<i32>())
}
```

But this gets awkward if you want to return an error when the parsing fails, but don't want to unwrap the `Option` just yet. When I first started writing Rust I would use the match syntax to take care of it.

```rust
let input = Some("3".to_string());
let value = match parse_maybe_int(input) {
    Some(Ok(value)) => value,
    Some(Err(e)) => return Err(e),
    None => None,
};
```

But one of Rust's best features is the `?`  operator, which allows you to unwrap a `Result` and return if it's an error.
So having to write this match every time gets old quick.

Fortunately, there's a method in the standard library that addresses this exact problem. When you have an
`Option<Result<T, _>>` or a `Result<Option<T>, _>` you can use the `transpose` method to swap the `Result` and `Option`.

```rust
let input = Some("3".to_string());
let value = parse_maybe_int(input).transpose()?;
```

And then from there, you can build the transpose straight into the method:

```rust
fn parse_maybe_int(s: Option<String>) -> Result<Option<i32>, ParseIntError> {
    s.map(|s| s.parse::<i32>()).transpose()
}

let input = Some("3".to_string());
let value = parse_maybe_int(input)?;
```

Much better.  I haven't seen `transpose` mentioned much, but I've found it very useful, so I hope this helps someone.
