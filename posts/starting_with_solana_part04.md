---
title: Starting with Solana, Part 4
summary: Using Svelte with Solana
frontPageSummary: using Svelte with Solana
date: 2021-10-29
tags: Solana, Svelte, web3, cryptocurrency
---

In [part 3](starting_with_solana_part03) we looked at testing and deploying our Solana program.

The final section of [Nader's tutorial](https://dev.to/dabit3/the-complete-guide-to-full-stack-solana-development-with-react-anchor-rust-and-phantom-3291) modifies the Solana program to hold a list of strings in each account and puts together a React app to communicate with the program. Here I'll do something similar, but use [SvelteKit](https://kit.svelte.dev) for the browser side of it.

First we'll create the project and install the Solana dependencies. I'm using the [pnpm](https://pnpm.io) package manager and installing [TailwindCSS](https://tailwindcss.com) as well but of course that's optional.

```shell
# SvelteKit equivalent of create-react-app
pnpm init svelte@next

# These are the options I chose
✔ Which Svelte app template? › Skeleton project
✔ Use TypeScript? … Yes
✔ Add ESLint for code linting? …  Yes
✔ Add Prettier for code formatting? … Yes

# Add tailwindcss. Optional to you of course.
pnpx svelte-add@latest tailwindcss

# Packages to use Solana, Anchor, and interface with wallets.
pnpm add @project-serum/anchor @solana/web3.js \
  @solana/wallet-adapter-wallets @solana/wallet-adapter-base
```

Solana's wallet packages provide a bunch of premade React and Vue components for interacting with wallets, but nothing for Svelte yet.
That's ok! It gives us more incentive to dig deeper into the guts of how things work.

# Updating the Program

The new program source looks very similar to the previous one, except it takes a string as an argument and adds it to a `Vec<String>` stored in the account.

... TODO put in the code

# Solana in Svelte

## Adding the Wallet Interface

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

