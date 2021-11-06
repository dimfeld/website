---
title: Starting with Solana, Part 2 - Anchor's Account Macros
date: 2021-10-26
tags: Solana, web3
---

[Last time](starting_with_solana_part01), we set up our Solana and Anchor toolchains, and started to create a simple Solana program, following
[Nader Dabit's tutorial](https://dev.to/dabit3/the-complete-guide-to-full-stack-solana-development-with-react-anchor-rust-and-phantom-3291).
The end of the post started to look into what a Solana "Account" actually is, so we'll continue there with the Anchor framework's
`#[account]` macro.

There are actually 2 `#[account]` macros in Anchor. One is used on `Account` structures to facilitate reading and writing Accounts
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

A Solana program's input is just a raw buffer of bytes containing account public keys and various information for the program,
and the [official Solana SDK](https://docs.rs/solana-sdk/1.8.1/solana_sdk/index.html) provides a function to extract [some
basic information](https://docs.solana.com/developing/on-chain-programs/developing-rust#data-types) from that buffer.

```rust
pub unsafe fn deserialize<'a>(
    input: *mut u8
) -> (&'a Pubkey, Vec<AccountInfo<'a>, Global>, &'a [u8])
```

Anchor automatically calls this function and then goes a step further. Each instruction in an Anchor program has a related
structure which defines the format of all the information, and
the `Accounts` trait determines how this structure can be created from the result of the `deserialize` function.
The derivation macro for this trait does a lot of heavy lifting, so we'll skip some of the details for now.

The structure for the `create` instruction in the tutorial looks like this.

```rust
#[derive(Accounts)]
pub struct Create<'info> {
    #[account(init, payer = user, space = 8 + 8)]
    pub base_account: Account<'info, BaseAccount>,
    pub user: Signer<'info>,
    pub system_program: Program <'info, System>,
}
```

Anchor's `Accounts` trait requires one function: `try_accounts`.

```rust
pub trait Accounts<'info>: ToAccountMetas + ToAccountInfos<'info> + Sized {
    fn try_accounts(
        program_id: &Pubkey,
        accounts: &mut &[AccountInfo<'info>],
        ix_data: &[u8]
    ) -> Result<Self, ProgramError>;
}
```

`try_accounts` takes an array of expected `AccountInfo` structures, and expects the implementor (almost always
automatically done through the macro) to take the expected number of accounts from the front of the list and then
change the reference to point to the remaining slice of the list. This feels a lot more like C than Rust, but
given the Solana VM's [strict execution limits](https://docs.solana.com/developing/programming-model/runtime#compute-budget) it makes sense,
and everything using Anchor is autogenerating it anyway so the bug risk is fairly low. Both structures such as `Create`
and the Account structures such as `Account` and `Signer` implement this trait and try_accounts.

In `Create`, `base_account` is the structure we looked at above, which holds the actual counter value. The `Accounts` derive macro
provides its own version of an `account` macro that can specify information on each field of the structure, and the
invocation on `base_account` has three arguments.

- `init` tells Anchor that calling this instruction should create an account corresponding to the `BaseAccount` structure. The account is
  initialized with the 8-byte discriminator and the rest of the buffer is zeroed out.
- `payer` indicates which account provides the tokens (called lamports) to pay for the newly-created account's rent. Here, it's the `user` account listed
  next in the structure. Anchor will transfer two year's worth of lamports from the payer into the account so that it can be rent-exempt.
- `space` is the number of bytes required to store the account's data. This is specified when the account is created and can never be changed.
  Again, Anchor needs 8 bytes and then the rest is the space taken up by the serialized structure. You can omit this and Anchor will automatically
  calculate the needed space, but if your structure includes dynamically sized values such as Strings or Vecs then this won't work right.

Next, the `user` account is a `Signer` type. In Solana, a [Signer](https://docs.solana.com/developing/programming-model/accounts#signers)
is an account accompanied by a digital signature indicating that the account's owner has authorized the transaction. (As opposed to someone
else passing that account's address into the program.) Signer's implementation of `try_accounts` verifies that the referenced account
also signed the transaction.

Finally, there is a reference to the system program. Solana's system program [provides various services](https://docs.rs/solana-sdk/1.8.1/solana_sdk/system_instruction/enum.SystemInstruction.html)
such as creating accounts, transferring lamports between accounts, and more.

The `account` macro [has many other useful attributes](https://docs.rs/anchor-lang/0.18.0/anchor_lang/derive.Accounts.html), and some common ones are:

- `#[account(mut)]` tells Anchor that your instruction may alter the account, so it should serialize the account structure
  back to the input buffer, where Solana will update its data if allowed.
- `#[account(signer)]` verifies that an account is also the signer. The `Signer` structure type we used above
  also does this, but it doesn't actually deserialize the account contents from the buffer, so this can be used
  if you need to use a type other than `Signer`.
- `#[account(close=target)]` tells the program to close the account when the instruction finishes, and transfer
  its lamports to the account specified by `target`.
- `#[acccount(has_one=target)]` enforces that the field name inside the account matches the account given with the same name
  in the `Accounts structure`. So in the above example, we could add a `user` field to `BaseAccount`, and then
  `#[account(has_one=user)]` on the `base_account` field would add a check
  that `base_account.user == user`.
- `#[account(owner=target)]` is similar to `has_one`, but it checks that the account's owner is equal to the account
  given in the field.

There are some more but these seem to be the most useful ones.

That's it for this part. Next up, we'll go back to implementing and testing the tutorial program.

[Part 3](starting_with_solana_part03) is up now!
