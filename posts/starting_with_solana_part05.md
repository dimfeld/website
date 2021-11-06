---
title: Starting with Solana, Part 5
summary: Using Svelte with Solana
frontPageSummary: using Svelte with Solana
date: 2021-11-07
draft: true
tags: Solana, Svelte, web3, cryptocurrency
---

In [part 3](starting_with_solana_part03) we looked at testing and deploying our Solana program.

The final section of [Nader's tutorial](https://dev.to/dabit3/the-complete-guide-to-full-stack-solana-development-with-react-anchor-rust-and-phantom-3291) modifies the Solana program to hold a list of strings in each account and puts together a React app to communicate with the program. Here I'll do something similar, but use [SvelteKit](https://kit.svelte.dev) for the browser side of it.

# Updating the Program

First let's update our program to so something a bit more interesting. The new program source looks very similar to the previous one, except it takes a string as an argument and adds it to a `Vec<String>` stored in the account. We also increase the acocunt size to allow up to 128 bytes of string data.

```rust
use anchor_lang::prelude::*;

declare_id!("AWRV5Lh6E83jQ4UytWhFuRwUzZNV4VvnyQJrGGSFTRhK");

#[program]
pub mod p0001 {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>, first_line: String) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;
        base_account.lines.push(first_line);
        Ok(())
    }

    pub fn add(ctx: Context<Add>, line: String) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;
        base_account.lines.push(line);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer=user, space=8+128)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Add<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
}

#[account]
pub struct BaseAccount {
    pub lines: Vec<String>,
}
```

Normally you would update the test as well for the new behavior. I'll skip that here since we covered testing in part 3 and
the process here is pretty much the same.

# Setting up Solana in Svelte

Now we'll create the project and install the Solana dependencies. I'm using the [pnpm](https://pnpm.io) package manager and installing [TailwindCSS](https://tailwindcss.com) as well but of course that's optional.

```shell
# SvelteKit equivalent of create-react-app
pnpm init svelte@next

# These are the options I chose
✔ Which Svelte app template? › Skeleton project
✔ Use TypeScript? … Yes
✔ Add ESLint for code linting? …  Yes
✔ Add Prettier for code formatting? … Yes

# Add tailwindcss if you like.
pnpx svelte-add@latest tailwindcss

# Packages to use Solana, Anchor, and interface with wallets.
yarn add @project-serum/anchor @solana/web3.js \
  @solana/wallet-adapter-wallets @solana/wallet-adapter-base

# Polyfill since the @ledger code assumes it exists
yarn add buffer
```

## Workarounds

- Define process.version to "1000"
- Add `Buffer` to the global namespace.
- Add eventemitter3 to optimizeDeps.include
- Define global.TextDecoder to just TextDecoder
- Import wallet adapters only on the client.

# Wallet Adapters

Solana's wallet packages provide a bunch of premade React and Vue components for interacting with wallets. There is actually a Svelte store wrapper
in progress, but the [package is not yet published](https://github.com/solana-labs/wallet-adapter/tree/master/packages/core/svelte) as of this writing. That's ok! It gives us some incentive to dig deeper into the guts of how things work.

The `@solana/wallet-adapter-wallets` package provides functions to interface with various wallet browser extensions.
There are a bunch of them but here we'll just use `getPhantomWallet`. In a real project you would have a list of most or all of them.

To actually use the wallet, I've [created a Svelte store](https://github.com/dimfeld/starting-with-solana/blob/master/app/src/lib/wallets.ts) to wrap the wallets and manage the connections. This store
works similarly to the store in development but has a slightly different abstraction to better integrate with the component lifecycle and simplify the code.

```svelte
<script lang="ts">
  import { getPhantomWallet } from '@solana/wallet-adapter-wallets';
  import { createWalletStore, WalletConnectionState, walletConnectionStateLabels } from '$lib/wallets';

  const walletList = [getPhantomWallet()];
  const wallet = createWalletStore({
    wallets: walletList,
    autoconnect: true,
  });
</script>

{#if $wallet.state === WalletConnectionState.connected}
```

## Creating a list

## Adding to the List

# Managing Account Size

Adding strings to the account works all right for a bit, but remember that Solana requires you to declare the amount of storage in an account when it's created, with no way to change it after.
One simple way to do this without moving to a multiple-account storage model is track when the account space is filling up and then drop old strings as needed.

How do we know how much space we're actually using in our account? Since Anchor serializes account data using [Borsh](https:///borsh.io), we can look at the specification and count it up.

A dynamically sized list (e.g. a Rust `Vec`) takes 4 bytes for the length plus the contents of each item. Likewise, strings use 4 bytes for the string length plus the number of bytes for the UTF8 encoded string. Add 8 bytes at the start for the Anchor discriminator value, and we get:

- 8 bytes for the Anchor discriminator
- 4 bytes to count the number of strings
- For each string:
  - 4 bytes for the string length
  - The number of bytes in the string
