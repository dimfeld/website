---
title: Starting with Solana, Part 3 - Testing a Solana Program
summary: Testing a Solana Program
frontPageSummary: testing a Solana program
date: 2021-10-27
tags: Solana, web3
---

[In part 2](starting_with_solana_part02), we took a look at the account macros that Anchor uses to get data in and out of your Solana program.
Now let's go back to [Nader Dabit's tutorial](https://dev.to/dabit3/the-complete-guide-to-full-stack-solana-development-with-react-anchor-rust-and-phantom-3291)
and finish our first program.

To recap, the Rust source for the program looks like this.

```rust
use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod p0001 {
    use super::*;
    pub fn create(ctx: Context<Create>) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;
        base_account.count = 0;
        Ok(())
    }

    pub fn increment(ctx: Context<Increment>) -> ProgramResult {
        let base_account = &mut ctx.accounts.base_account;
        base_account.count += 1;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Create<'info> {
    #[account(init, payer=user, space= 8 + 8)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
}

#[account]
pub struct BaseAccount {
    pub count: u64,
}
```

# Setting The Program ID

Again, the `anchor build` command will compile the program and generate a keypair that can be used to deploy it. Since Anchor's template always has the same
program ID at the top, we need to take the ID from the generated keypair and use it in our program.

The build output tells us where to find it.

```shell
The program address will default to this keypair (override with --program-id):
  /home/projects/solana/p0001/target/deploy/p0001-keypair.json
```

The keypair JSON file is actually an array of numbers, designed to conveniently translate into a byte array. But the `solana` CLI command
can extract the public key -- which is also the address -- for us.

```
$ solana address -k target/deploy/p0001-keypair.json
6UrdK99AdvoFdM8WrteDfK9XS2ENSLEHFkXDSmMPryk
```

Here, your value should be different from the one I have. The address needs to go in two places:

- The `declare_id!` macro at the top of our program's source code.
- The `Anchor.toml` file under the key with the same name as your program.

```toml
# Anchor.toml first section
[programs.localnet]
p0001 = "6UrdK99AdvoFdM8WrteDfK9XS2ENSLEHFkXDSmMPryk"
```

:::: warn

The keypair file will persist across builds, but a new one with a different address will be generated if you delete it.

::::

# Writing a Test

Anchor generates a test file for us, but you may remember from [part 1](starting_with_solana_part01) that it doesn't do much. Nader's article creates a test
that calls both of the instructions and verifies that they work, so let's walk through that.

The shell of the test imports the Anchor framework JavaScript files and gets the program ready to run. The tests default to using the `mocha` test framework,
so the `it` function defines a test and `describe` can be used to group tests together.

```js
const assert = require('assert');
const anchor = require('@project-serum/anchor');
const { SystemProgram } = anchor.web3;

describe('p0001', () => {
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.p0001;
  // To be filled in by the create test and used by the increment test.
  let _baseAccount;

  // Tests here
});
```

We then have two tests, one for each instruction. More complex instructions might require multiple tests.

## Testing the Create Instruction

The first test calls the create instruction, then gets the data for the created account
and verifies that it exists and has a zero value for `count`.

```js
it('Creates a counter', async () => {
  const baseAccount = anchor.web3.Keypair.generate();
  await program.rpc.create({
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    },
    signers: [baseAccount],
  });

  // The account should have been created.
  const account = await program.account.baseAccount.fetch(
    baseAccount.publicKey
  );
  console.log('Initial count: ', account.count.toString());
  assert.ok(account.count.toString() == 0);
  _baseAccount = baseAccount;
});
```

Notice that although the system program has a fixed ID, we do still have to pass its address into the program.

Be sure that you are _not_ running a local copy of `solana-test-validator`, and then use `anchor test` to run your test.

:::: note

Mocha needs to be installed globally, using `npm install -g mocha` or your package manager of choice. If you get the error below,
that may be your problem.

```
$ anchor test
... other build output
> Failed to run test: mocha -t 1000000 tests/: No such file or directory (os error 2)
```

::::

One oddity here is that `count` in our Rust program is a number, but the test calls `toString()` on it. Because JavaScript numbers are
64-bit floating point values, it can only accurately represent up to 53 bits worth of integers, so Anchor deserializes any value of 64 bits or above
as a [bn.js](https://www.npmjs.com/package/bn.js) BigNum object.

```
> console.dir(account.count);
BN { negative: 0, words: [ 0, 0, 0 ], length: 1, red: null }

> console.log(account.count.toString());
0
```

## Testing the Increment Instructions

The next test is for the increment instruction, which reuses the `baseAccount` from the first test.

```js
it('Increments a counter', async () => {
  const baseAccount = _baseAccount;
  await program.rpc.increment({
    accounts: {
      baseAccount: baseAccount.publicKey,
    },
  });

  const account = await program.account.baseAccount.fetch(
    baseAccount.publicKey
  );
  console.log('After increment: ', account.count.toString());
  assert.ok(account.count.toString() == 1);
});
```

Not much to say about this one.

# Deploy to Localhost

With `solana-test-validator` running on your local machine, you can deploy the contract.

```
$ anchor deploy
Deploying workspace: http://localhost:8899
Upgrade authority: /home/projects/.config/solana/id.json
Deploying program "p0001"...
Program path: /home/projects/solana/p0001/target/deploy/p0001.so...
Program Id: 6UrdK99AdvoFdM8WrteDfK9XS2ENSLEHFkXDSmMPryk

Deploy success
```

In [part 4](starting_with_solana_part04) we'll take the lessons learned in these first three parts and create a
todo list application with attached rewards. [Check it out now!](starting_with_solana_part04)
