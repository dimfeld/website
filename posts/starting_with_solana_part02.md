---
title: Starting with Solana, Part 2
date: 2021-10-24
tags: Solana, web3, cryptocurrency
---

[Last time](starting_with_solana_part01), we set up our Solana and Anchor toolchains, and started to create a simple Solana program, following
[Nader Dabit's tutorial](https://dev.to/dabit3/the-complete-guide-to-full-stack-solana-development-with-react-anchor-rust-and-phantom-3291).
The end of the post started to look into what a Solana "Account" actually is, so we'll continue there with the Anchor framework's
`#[account]` macro.

There are actually 2 `#[account]` macros in Anchor. One is used on Account structures to facilitate reading and writing Accounts
from their raw data into Rust structures. The other is used in conjunction with the `Accounts` trait derive macro, which is placed
on structures used for instruction inputs.

# `#[account]` on an Account Structure

The macro invocation on the `BaseAccount` struct marks it as actually being used as
an account, and generates some code to copy between the raw account data and the Rust structure. From Solana's point of
view, an account is just a raw buffer of bytes. Anchor has its own `AccountSerialize` and `AccountDeserialize` traits,
similar to (but simpler and more specialized than) the Rust `serde` crate's `Serialize` and `Deserialize` traits.

With the [`cargo expand`](https://github.com/dtolnay/cargo-expand) command we can take a look at the code generated for the
`BaseAccount` struct, which looks like this.

```rust
#[account]
pub struct BaseAccount {
    pub count: u64,
}
```

First, the code to write the Rust `BaseAccount` structure to a raw account buffer.

```rust
#[automatically_derived]
impl anchor_lang::AccountSerialize for BaseAccount {
    fn try_serialize<W: std::io::Write>(
        &self,
        writer: &mut W,
    ) -> std::result::Result<(), ProgramError> {
        writer
            .write_all(&[16, 90, 130, 242, 159, 10, 232, 133])
            .map_err(|_| anchor_lang::__private::ErrorCode::AccountDidNotSerialize)?;
        AnchorSerialize::serialize(self, writer)
            .map_err(|_| anchor_lang::__private::ErrorCode::AccountDidNotSerialize)?;
        Ok(())
    }
}
```

It first writes a discriminator, 8 bytes taken from a SHA256 hash of the name of the struct ("BaseAccount" in this case).
This adds a check that the data you're about to read is actually a `BaseAccount`. I imagine it doesn't do anything from a
security standpoint since it's easy to copy, but it at least catches mistakes in sending the wrong type of Account to the program.

You can pass a namespace string value into the account macro, which will be prefixed to the struct's name when generating the
discriminator to reduce the chances of your struct having the same discriminator as a struct from someone else's program.
This is in the source code but doesn't appear to be documented, so I'm not sure if it's a good idea to use this namespace feature right now.

Next, some code to actually write the data in the call to `AnchorSerialize::serialize`. The generated `BorshSerialize` trait
implementation handles this. [Borsh](https://borsh.io/) is a binary data serialization framework with an extra focus on security.

```rust
impl borsh::ser::BorshSerialize for BaseAccount
where
    u64: borsh::ser::BorshSerialize,
{
    fn serialize<W: borsh::maybestd::io::Write>(
        &self,
        writer: &mut W,
    ) -> ::core::result::Result<(), borsh::maybestd::io::Error> {
        borsh::BorshSerialize::serialize(&self.count, writer)?;
        Ok(())
    }
}
```

Since the structure has just one field, you can see it's just writing self.count to the passed in writer.

Deserializing the struct from the raw account buffer is similar. It first checks that the discriminator value matches, then
calls `AnchorDeserialize::deserialize` to read in the actual data.

```rust
#[automatically_derived]
impl anchor_lang::AccountDeserialize for BaseAccount {
    fn try_deserialize(buf: &mut &[u8]) -> std::result::Result<Self, ProgramError> {
        if buf.len() < [16, 90, 130, 242, 159, 10, 232, 133].len() {
            return Err(anchor_lang::__private::ErrorCode::AccountDiscriminatorNotFound.into());
        }
        let given_disc = &buf[..8];
        if &[16, 90, 130, 242, 159, 10, 232, 133] != given_disc {
            return Err(anchor_lang::__private::ErrorCode::AccountDiscriminatorMismatch.into());
        }
        Self::try_deserialize_unchecked(buf)
    }
    fn try_deserialize_unchecked(buf: &mut &[u8]) -> std::result::Result<Self, ProgramError> {
        let mut data: &[u8] = &buf[8..];
        AnchorDeserialize::deserialize(&mut data)
            .map_err(|_| anchor_lang::__private::ErrorCode::AccountDidNotDeserialize.into())
    }
}

impl borsh::de::BorshDeserialize for BaseAccount
where
    u64: borsh::BorshDeserialize,
{
    fn deserialize(buf: &mut &[u8]) -> ::core::result::Result<Self, borsh::maybestd::io::Error> {
        Ok(Self {
            count: borsh::BorshDeserialize::deserialize(buf)?,
        })
    }
}
```

# Deriving the `Accounts` trait
