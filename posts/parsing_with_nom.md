---
title: Parsing with Nom
date: 2021-02-01
tags: Rust
---

Writing a parser can seem intimidating if you haven't done it before. It conjures visions of complicated code like compilers, powered by obscure grammars that feed into arcane tools and generate thousands of lines of unreadable code.

But it doesn't have to be that way. Parser combinator libraries such as [nom](https://docs.rs/nom) simply present a library of small functions that each do one thing,
and then allow you to put them together to create a full parser.

I recently built a [utility to export a Roam Research graph to HTML](https://github.com/dimfeld/export-roam-notes), and part of this task involved parsing the Roam
markdown-like format. I've annotated the file below so you can see how it all fits together.

::: side-by-side

Import all the parsers and combinators.

```rust
use nom::{
    branch::alt,
    bytes::complete::{is_not, tag, take_until, take_while1},
    character::complete::{char, multispace0},
    character::{is_newline, is_space},
    combinator::{all_consuming, map, map_parser, opt, recognize},
    error::context,
    sequence::{delimited, pair, preceded, separated_pair, terminated, tuple},
    IResult,
};
use urlocator::{UrlLocation, UrlLocator};
```

The output is a `Vec<Expression>`. Some expressions, such as `Bold`, contain other expressions.
Other expressions such as `Image` just render out straight HTML.

```rust
#[derive(Debug, PartialEq, Eq)]
pub enum Expression<'a> {
    Text(&'a str),
    RawHyperlink(&'a str),
    Image {
        alt: &'a str,
        url: &'a str,
    },
    BraceDirective(&'a str),
    Table,
    PageEmbed(&'a str),
    BlockEmbed(&'a str),
    TripleBacktick(&'a str),
    SingleBacktick(&'a str),
    Hashtag(&'a str, bool),
    Link(&'a str),
    MarkdownLink {
        title: &'a str,
        url: &'a str,
    },
    BlockRef(&'a str),
    Attribute {
        name: &'a str,
        value: Vec<Expression<'a>>,
    },
    Bold(Vec<Expression<'a>>),
    Italic(Vec<Expression<'a>>),
    Strike(Vec<Expression<'a>>),
    Highlight(Vec<Expression<'a>>),
    BlockQuote(Vec<Expression<'a>>),
    HRule,
}
```

First, a small utility function to match on any non-whitespace character.

```rust
fn nonws_char(c: char) -> bool {
    !is_space(c as u8) && !is_newline(c as u8)
}
```

Our first parser, `word`, just gets a word. `take_while1(nonws_char)` creates a parser that reads at least one character matching `nonws_char`.

Each parser follows this format. It takes the input as an argument, and returns a `IResult<REM, DATA>`, where `REM` is the remaining unparsed portion of the string, with the same type as `input`, and `DATA` is the type that a parser returns. The built-in parsers also work with this type of return value, so we don't have to do anything special here.

```rust
fn word(input: &str) -> IResult<&str, &str> {
    take_while1(nonws_char)(input)
}
```

When parsing strings like `[[a title]]`, we use the `fenced` parser. This one looks for a string matching `start` and grabs the input until it sees a string matching `end`. The `tuple` combinator
combines the parsers inside it, and then we use the `map` combinator to pull out just the
middle item captured by `take_until`.

Nom provides a `delimited` parser that works similarly to our `fenced` parser, but `fenced` works better when the ending pattern is more than one character and the text in the middle can be anything.

```rust
fn fenced<'a>(start: &'a str, end: &'a str) -> impl FnMut(&'a str) -> IResult<&'a str, &'a str> {
    map(tuple((tag(start), take_until(end), tag(end))), |x| x.1)
}
```

`style` is a general parser used for parsing styles like `**bold**` and `__italic__`, which are delimited by characters and then can have arbitrary other expressions inside them.

For this we use `map_parser`, which works much like Rust's `Result::and_then`. It takes the result of the first parser and tries to apply the second parser to it. If both parsers succeed, then it returns the value. The `parse_inline` parser is a general parser for almost any expression, and we define it later in this file.

This is also an example of a function that doesn't parse input itself, but returns another parser.

```rust
fn style<'a>(boundary: &'a str) 
      -> impl FnMut(&'a str) 
          -> IResult<&'a str, Vec<Expression<'a>>> {
    map_parser(fenced(boundary, boundary), parse_inline)
}
```

`link` is for links to internal Roam pages, and just uses the fenced parser.


```rust
fn link(input: &str) -> IResult<&str, &str> {
    fenced("[[", "]]")(input)
}
```

`markdown_link` is for external links. It uses the `pair` combinator which works similarly to `tuple` but for just two parsers next to each other. This returns a tuple consisting of the link title and the URL.

```rust
fn markdown_link(input: &str) -> IResult<&str, (&str, &str)> {
    pair(
        fenced("[", "]"),
        delimited(char('('), is_not(")"), char(')')),
    )(input)
}
```

Some Roam directives, such as hashtags, can look like either `#hashtag` or `#[[hashtag]]`. For this we have the `link_or_word` parser, which can extract either of these formats. The `alt` combinator tries to run each parser listed, and returns the result of the first one that matches.

```rust
fn link_or_word(input: &str) -> IResult<&str, &str> {
    alt((link, word))(input)
}
```

Sometimes we need to look for a particular `link_or_word` inside a directive such as `{{table}}` or `{{[[table]]}}`. `fixed_link_or_word` handles that case.

```rust
fn fixed_link_or_word<'a>(word: &'a str) -> impl FnMut(&'a str) -> IResult<&'a str, &'a str> {
    alt((tag(word), delimited(tag("[["), tag(word), tag("]]"))))
}
```

`hashtag` parses `#tag` or `#[[tag]`. It also handles the special `#.tag` syntax, using the `opt` combinator to mark the `.` as optional, and returns the presence of the dot as a `bool`.

```rust
fn hashtag(input: &str) -> IResult<&str, (&str, bool)> {
    map(
        preceded(char('#'), pair(opt(tag(".")), link_or_word)),
        |(has_dot, tag)| (tag, has_dot.is_some()),
    )(input)
}
```

Now that we've built up a lot of our base parsers, it's easy to set them up for various types of syntax.

```rust
fn triple_backtick(input: &str) -> IResult<&str, &str> {
    fenced("```", "```")(input)
}

fn single_backtick(input: &str) -> IResult<&str, &str> {
    delimited(char('`'), is_not("`"), char('`'))(input)
}

// Parse `((reference))`
fn block_ref(input: &str) -> IResult<&str, &str> {
    fenced("((", "))")(input)
}

fn bold(input: &str) -> IResult<&str, Vec<Expression>> {
    style("**")(input)
}

fn italic(input: &str) -> IResult<&str, Vec<Expression>> {
    style("__")(input)
}

fn strike(input: &str) -> IResult<&str, Vec<Expression>> {
    style("~~")(input)
}

fn highlight(input: &str) -> IResult<&str, Vec<Expression>> {
    style("^^")(input)
}
```

Special handling for the contents of certain `{{...}}` directives. Anything we don't handle
just ends up as a `BraceDirective`.

```rust
fn brace_directive_contents(input: &str) -> IResult<&str, Expression> {
    alt((
        map(fixed_link_or_word("table"), |_| Expression::Table),
        map(
            separated_pair(
                fixed_link_or_word("embed"),
                terminated(tag(":"), multispace0),
                alt((
                    map(block_ref, Expression::BlockEmbed),
                    map(link, Expression::PageEmbed),
                )),
            ),
            |(_, e)| e,
        ),
        map(link_or_word, Expression::BraceDirective),
    ))(input)
}
```

This one finds brace directives and uses the above `brace_directive_contents` to extract the
inside. The `all_consuming` combinator used here indicates that the parser it wraps must use the entire
input.

```rust
fn brace_directive(input: &str) -> IResult<&str, Expression> {
    map(
        tuple((
            tag("{{"),
            map(take_until("}}"), |inner: &str| {
                // Try to parse a link from the brace contents. If these fail, just return the raw contents.
                let inner = inner.trim();
                all_consuming(brace_directive_contents)(inner)
                    .map(|x| x.1)
                    .unwrap_or_else(|_| Expression::BraceDirective(inner))
            }),
            tag("}}"),
        )),
        |x| x.1,
    )(input)
}
```

`preceded` creates a parser that matches if the second argument is preceded by the first argument.

```rust
/// Parses `![alt](url)`
fn image(input: &str) -> IResult<&str, (&str, &str)> {
    preceded(char('!'), markdown_link)(input)
}
```

The `raw_url` parser is an example of using some external code to parse a particular string,
rather than just the ones built in to nom. Here we are looking for URLs that occur in the
content but are not explicitly tagged as such.

We iterate manually through the characters in the input, and use the `UrlLocator`
crate to see if we have found a URL. Once we have made a decision, we return an `Ok` with
the URL contents, or a `nom::error::Error`, which indicates that the parser did not match.
I cheated a little bit here and just reused one of the built-in nom error codes.

```rust
/// Parses urls not inside a directive
fn raw_url(input: &str) -> IResult<&str, &str> {
    let mut locator = UrlLocator::new();
    let mut end = 0;
    for c in input.chars() {
        match locator.advance(c) {
            UrlLocation::Url(s, _e) => {
                end = s as usize;
            }
            UrlLocation::Reset => break,
            UrlLocation::Scheme => {}
        }
    }

    if end > 0 {
        Ok((&input[end..], &input[0..end]))
    } else {
        Err(nom::Err::Error(nom::error::Error::new(
            input,
            nom::error::ErrorKind::RegexpFind,
        )))
    }
}
```

Getting close to the end! This function combines a bunch of the above
parsers together into a single parser that can find various types of
directives.

```rust
fn directive(input: &str) -> IResult<&str, Expression> {
    alt((
        map(triple_backtick, Expression::TripleBacktick),
        map(single_backtick, Expression::SingleBacktick),
        brace_directive,
        map(hashtag, |(v, dot)| Expression::Hashtag(v, dot)),
        map(link, Expression::Link),
        map(block_ref, Expression::BlockRef),
        map(image, |(alt, url)| Expression::Image { alt, url }),
        map(markdown_link, |(title, url)| Expression::MarkdownLink {
            title,
            url,
        }),
        map(context("bold", bold), Expression::Bold),
        map(italic, Expression::Italic),
        map(strike, Expression::Strike),
        map(highlight, Expression::Highlight),
        map(raw_url, Expression::RawHyperlink),
    ))(input)
}
```

This is probably the most complex of all the parsers. `nom`'s included parsers don't do well
with the case of "parse plain text until you find any valid directive," so this
function accomplishes that.

For each character, we see if it matches any of the directive
parsers. If so, then we add two items to our list of expressions: all the plain text preceding
the directive, and the directive itself. If not, then we just go on to the next character and try again.

```rust
/// Parse a line of text, counting anything that doesn't match a directive as plain text.
fn parse_inline(input: &str) -> IResult<&str, Vec<Expression>> {
    let mut output = Vec::with_capacity(4);

    let mut current_input = input;

    while !current_input.is_empty() {
        let mut found_directive = false;
        for (current_index, _) in current_input.char_indices() {
            // println!("{} {}", current_index, current_input);
            match directive(&current_input[current_index..]) {
                Ok((remaining, parsed)) => {
                    // println!("Matched {:?} remaining {}", parsed, remaining);
                    let leading_text = &current_input[0..current_index];
                    if !leading_text.is_empty() {
                        output.push(Expression::Text(leading_text));
                    }
                    output.push(parsed);

                    current_input = remaining;
                    found_directive = true;
                    break;
                }
                Err(nom::Err::Error(_)) => {
                    // None of the parsers matched at the current position, so this character is just part of the text.
                    // The iterator will go to the next character so there's nothing to do here.
                }
                Err(e) => {
                    // On any other error, just return the error.
                    return Err(e);
                }
            }
        }

        if !found_directive {
            output.push(Expression::Text(current_input));
            break;
        }
    }

    Ok(("", output))
}

/// Parses `Name:: Arbitrary [[text]]`
fn attribute(input: &str) -> IResult<&str, (&str, Vec<Expression>)> {
    // Roam doesn't trim whitespace on the attribute name, so we don't either.
    separated_pair(is_not(":`"), tag("::"), preceded(multispace0, parse_inline))(input)
}
```

Finally, there are a few directives that are only valid if they constitute the entire line.
We put these in the top-level `parse` function and surround them with `all_consuming` to
make sure that they actually use the entire line.

```rust
pub fn parse(input: &str) -> Result<Vec<Expression>, nom::Err<nom::error::Error<&str>>> {
    alt((
        map(all_consuming(tag("---")), |_| vec![Expression::HRule]),
        map(all_consuming(preceded(tag("> "), parse_inline)), |values| {
            vec![Expression::BlockQuote(values)]
        }),
        map(all_consuming(attribute), |(name, value)| {
            vec![Expression::Attribute { name, value }]
        }),
        all_consuming(parse_inline),
    ))(input)
    .map(|(_, results)| results)
}
```

:::

And that's it! A long file, but it actually wasn't too hard to put together a piece at a time. Overall,
I quite liked building a parser this way and I will definitely look to using `nom` again whenever
I have a similar need.
