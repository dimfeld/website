---
title: "Starting with Solana, Part 4 - A Todo List with Rewards"
date: 2021-11-05
tags: Solana, web3
---

In [part 3](starting_with_solana_part03) we looked at testing and deploying our Solana program. I was going to put
together an article about using Svelte with Solana for part 4, but that will wait for part 5 instead while we focus on
making a more interesting Solana program -- a todo list where anyone can add an item and attach a reward for
completion.

# Program Structure

The program workflow will look something like this:

1. Someone creates a list. 
2. A second person adds an item to the list.
3. When the task is done, the list owner marks it finished.
4. The person who added the item also marks it finished.
5. The token balance on the item is transferred to the list owner. 

Our program will have four instructions to manage a list and its items:

- NewList to make a new todo list.
- Add to add an item to a list.
- Cancel to delete an item, unfinished, and return the reward to the item creator.
- Finish to remove an item and transfer the reward when both the list's owner and the item's creator agree it's finished.

::: warn

The Finish instruction's escrow mechanism is intentionally simple to avoid overloading this post with new information.
Real programs would want to use something more secure. [paulx's blog](https://paulx.dev/blog/2021/01/14/programming-on-solana-an-introduction/)
has a thorough explanation of how to do it right.

:::

## Program-Derived Addresses

With this program, each todo list is a Solana account, and each item in the list is also an account. Anyone can add an
item with an attached token balance, and when the list owner and the item creator both mark it finished, the item’s balance transfers
to the list owner’s account as a reward.

Normally, to use such a list you would need to know two public keys, one for the list’s owner and another for the list
itself. But Solana lets us use [program derived
addresses](https://docs.solana.com/developing/programming-model/calling-between-programs#program-derived-addresses)
(PDAs) as a
better solution. These addresses are calculated from a hash of the program ID and various “seed” values which can include
public keys or other strings of bytes, up to 32 bytes each.

::: note

Don’t worry if this seems complex right now. PDAs are a big part of Solana, but once we use them below it will make more
sense.

:::


Solana also requires that program derived addresses can not have an associated private key, and it enforces this by
checking that that they are not valid values on the [ed25519 elliptical curve](https://en.wikipedia.org/wiki/EdDSA) used
to generate keys. After calculating the hash above, a “bump” value is added to the hash until a value is found that is
not on the curve. This bump starts at 255 and is decremented until it finds a value not on the curve, and that
becomes the actual address.

It’s not guaranteed that this “check and decrement” bump process will generate a valid PDA, but the chances are very high, and importantly
it is deterministic — given a program ID and seeds, the same PDA will always be derived. And since the
address is not a real public key, it’s guaranteed that the program from which the PDA came is the only thing that can
generate a signed transaction from it.

## Returning Errors

The program may need to return some custom errors when things go wrong. Anchor has an `#[error]` macro
to allow this, and we can place it on an enum to create the error values and associated error messages.

The error functionality here is not very expressive; the Solana program itself can only return a number, and so
the error messages themselves are stored in the generated Anchor IDL file and translated by the Anchor runtime. This means that
your error messages can only be static strings, without any associated data or other formatting capability.

```rust
#[error]
pub enum TodoListError {
    #[msg("This list is full")]
    ListFull,
    #[msg("Bounty must be enough to mark account rent-exempt")]
    BountyTooSmall,
    #[msg("Only the list owner or item creator may cancel an item")]
    CancelPermissions,
    #[msg("Only the list owner or item creator may finish an item")]
    FinishPermissions,
    #[msg("Item does not belong to this todo list")]
    ItemNotFound,
    #[msg("Specified list owner does not match the pubkey in the list")]
    WrongListOwner,
    #[msg("Specified item creator does not match the pubkey in the item")]
    WrongItemCreator,
}
```

# Test Infrastructure

Of course, we also need tests for all this. I put together a few utility functions to perform
common operations which you may also find useful. Feel free to copy them into your own tests if you'd like.

First, we define our imports and set up the Anchor provider and program.

```js
const anchor = require('@project-serum/anchor');
const BN = require('bn.js');
const expect = require('chai').expect;
const { SystemProgram, LAMPORTS_PER_SOL } = anchor.web3;

const provider = anchor.Provider.env();
anchor.setProvider(provider);
const mainProgram = anchor.workspace.Todo;
```

Our tests need to check that the program is transferring balances around properly, so
the `getAccountBalance` function handles that. User accounts also pay small transaction
fees, so the `expectBalance` function wraps the proper call to check a balance with a bit of slack
to account for that. Each of these functions is small, but together they are called about 50 times
so the savings and convenience adds up.

```js
async function getAccountBalance(pubkey) {
  let account = await provider.connection.getAccountInfo(pubkey);
  return account?.lamports ?? 0;
}

function expectBalance(actual, expected, message, slack=20000) {
  expect(actual, message).within(expected - slack, expected + slack)
}
```

Most of the tests simulate multiple users interacting with a contract. For this we have the
`createUser` function which makes a user account with an airdropped balance and an anchor `Provider`
for the user. The `createUsers` function makes multiple users in parallel to speed up tests a bit.

Each Anchor `Program` instance is linked to a particular `Provider`, which is in turn linked to a particular user and wallet.
To make it easier to call a program from various users, the `programForUser` function creates a new `Program` instance,
based on `mainProgram` but with the given user's `Provider`.

```js
async function createUser(airdropBalance) {
  airdropBalance = airdropBalance ?? 10 * LAMPORTS_PER_SOL;
  let user = anchor.web3.Keypair.generate();
  let sig = await provider.connection.requestAirdrop(
    user.publicKey, airdropBalance);
  await provider.connection.confirmTransaction(sig);

  let wallet = new anchor.Wallet(user);
  let userProvider = new anchor.Provider(provider.connection,
    wallet, provider.opts);

  return {
    key: user,
    wallet,
    provider: userProvider,
  };
}

function createUsers(numUsers) {
  let promises = [];
  for(let i = 0; i < numUsers; i++) {
    promises.push(createUser());
  }

  return Promise.all(promises);
}

function programForUser(user) {
  return new anchor.Program(mainProgram.idl, mainProgram.programId,
    user.provider);
}
```

The full test file can be found on this [Github
repository](https://github.com/dimfeld/starting-with-solana/blob/master/tests/todo.js) and
I'll walk through the parts relevant to specific instructions in later sections.

# Creating a List

Anyone can run the `NewList` instruction to create a new todo list. The `TodoList` account structure holds all the
information for a list, including the list's owner and name, how many items it can hold, and references to the accounts
for each item in the list. Finally it also holds the bump value that was used to calculate its PDA, which feeds into
Anchor's autogenerated verification processes.

The address for the todo list is calculated from a combination of the owner's pubkey and the name of the list, so a user
could also create different lists with different names.

## TodoList Data Structure

```rust
#[account]
pub struct TodoList {
    pub list_owner: Pubkey,
    pub bump: u8,
    pub capacity: u16,
    pub name: String,
    pub lines: Vec<Pubkey>,
}
```

We also add a function to calculate the space needed for a TodoList structure. We could do this all
within Anchor's `account` macro but this is much easier to manage. Remember that accounts that don't have any
dynamically-sized data (Strings or Vecs) can just `#[derive(Default)]` to have Anchor automatically calculate the
size.

```rust
impl TodoList {
    fn space(name: &str, capacity: u16) -> usize {
        // discriminator + owner pubkey + bump + capacity
        8 + 32 + 1 + 2 +
            // name string
            4 + name.len() +
            // vec of item pubkeys
            4 + (capacity as usize) * std::mem::size_of::<Pubkey>()
    }
}
```

## NewList Instruction Accounts

There's a lot going on in the `#[account]` macro for the NewList instruction so we'll go over them one by one.

```rust
fn name_seed(name: &str) -> &[u8] {
    let b = name.as_bytes();
    if b.len() > 32 { &b[0..32] } else { b }
}

#[derive(Accounts)]
#[instruction(name: String, capacity: u16, list_bump: u8)]
pub struct NewList<'info> {
    #[account(init, payer=user,
      space=TodoList::space(&name, capacity),
      seeds=[
        b"todolist",
        user.to_account_info().key.as_ref(),
        name_seed(&name)
      ],
      bump=list_bump)]
    pub list: Account<'info, TodoList>,
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}
```

The `#[instruction]` macro tells Anchor to deserialize the instruction arguments inside the autogenerated code so that
the rest of the `#[account]` macros here can use their values. Note that Anchor doesn't verify that the
arguments listed in `#[instruction]` actually match the arguments in the implementation function.

- `init` and `payer` are the same as before -- they tell Anchor to create the specified account and who should
pay for it.
- `space` just calls `TodoList::space`, which we wrote above.
- `seeds` tells Anchor that this account is a PDA and lists the seed values which are hashed to calculate it. Anchor
    generates code to rederive the PDA from the seeds and ensure that they match the passed-in value.
    Each seed value can be no more than 32 bytes, so the `name_seed` function helps with that.
- `bump` is also used by Anchor's PDA verification to avoid using a "check and decrement" loop to find the right bump value,
  which can be costly when operating under Solana's strict
  computation budget. In most cases the caller will run the loop to find a proper bump value, since it tends
  to be operating in an environment such as a web browser where an extra `for` loop doesn't matter much, and in many
  cases it would have already had the bump value on hand.

## NewList Implementation

Finally, we write the actual implementation. Not much to do here; we just copy the instruction's arguments
into the TodoList data structure.

```rust
#[program]
pub mod todo {
    pub fn new_list(
        ctx: Context<NewList>,
        name: String,
        capacity: u16,
        account_bump: u8,
    ) -> ProgramResult {
        // Create a new account
        let list = &mut ctx.accounts.list;
        list.list_owner = *ctx.accounts.user.to_account_info().key;
        list.bump = account_bump;
        list.name = name;
        list.capacity = capacity;
        Ok(())
    }
}
```

## Testing List Creation

Every test needs to create a list, and the `createList` function makes that reusable.

The list account is a PDA, so the first step is to calculate its value. We pass the program ID and the seed values to `findProgramAddress`, and it
returns the calculated PDA and the bump value used to calculate it. From there, we can call `newList`.
Finally, the function fetches the data from the initialized list and returns it.


```js
async function createList(owner, name, capacity=16) {
  const [listAccount, bump] = await anchor.web3.PublicKey.findProgramAddress([
    "todolist",
    owner.key.publicKey.toBytes(),
    name.slice(0, 32)
  ], mainProgram.programId);

  let program = programForUser(owner);
  await program.rpc.newList(name, capacity, bump, {
    accounts: {
      list: listAccount,
      user: owner.key.publicKey,
      systemProgram: SystemProgram.programId,
    },
  });

  let list = await program.account.todoList.fetch(listAccount);
  return { publicKey: listAccount, data: list };
}
```

With that out of the way, the actual test is small. We create the user, create the list, and then
check that all the fields of the empty list look like what we expect.

```js
describe('new list', () => {
  it('creates a list', async () => {
    const owner = await createUser();
    let list = await createList(owner, 'A list');

    expect(list.data.listOwner.toString(), 'List owner is set')
      .equals(owner.key.publicKey.toString());
    expect(list.data.name, 'List name is set').equals('A list');
    expect(list.data.lines.length, 'List has no items').equals(0);
  });
});
```

# Adding an Item

Anyone can call the `Add` instruction against any todo list. The arguments are the item name and the number of tokens for the item bounty. The account's
pubkey will also be added to the main todo list account.

## ListItem Data Structure

Each list item keeps track of who created it and who has marked it finished. The reward amount is just the balance on
the account, so we don't need to explicitly track it here. As before, there's a `space` function to better colocate
the space calculation with the actual list of fields.

```rust
#[account]
pub struct ListItem {
    pub creator: Pubkey,
    pub creator_finished: bool,
    pub list_owner_finished: bool,
    pub name: String,
}

impl ListItem {
    fn space(name: &str) -> usize {
        // discriminator + creator pubkey + 2 bools + name string
        8 + 32 + 1 + 1 + 4 + name.len()
    }
}
```

## Add Accounts

Once again, the `list` account includes the necessary `seeds` and `bump` to verify the PDA. We also
pass the list owner's pubkey and the list name to assist in verifying the PDA address. The `item`
account initializes the new list with enough space to hold the name and other data.

Here we also see Anchor's `@` macro syntax. This can be used in a constraint to tell it
to return a particular error instead of the default error for that constraint type.

Another new thing here is the `UncheckedAccount` type used for `list_owner`. Despite the type name, this really means an
account that Anchor doesn't try to deserialize into a structure. In this case, we use it because we just need the
`AccountInfo` for the account to use it in the PDA verification.

```rust
#[derive(Accounts)]
#[instruction(list_name: String, item_name: String, bounty: u64)]
pub struct Add<'info> {
    #[account(
      mut,
      has_one=list_owner @ TodoListError::WrongListOwner,
      seeds=[
        b"todolist",
        list_owner.to_account_info().key.as_ref(),
        name_seed(&list_name)
      ],
      bump=list.bump)]
    pub list: Account<'info, TodoList>,
    pub list_owner: UncheckedAccount<'info>,
    // 8 byte discriminator,
    #[account(init, payer=user, space=ListItem::space(&item_name))]
    pub item: Account<'info, ListItem>,
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}
```

## Add Implementation

The add function both adds the new item to the list and attaches the reward amount to the item.

```rust
pub fn add(
    ctx: Context<Add>,
    _list_name: String,
    item_name: String,
    bounty: u64,
) -> ProgramResult {
    let user = &ctx.accounts.user;
    let list = &mut ctx.accounts.list;
    let item = &mut ctx.accounts.item;

    // Check that the list isn't already full.
    if list.lines.len() >= list.capacity as usize {
        return Err(TodoListError::ListFull.into());
    }

    list.lines.push(*item.to_account_info().key);
    item.name = item_name;
    item.creator = *user.to_account_info().key;

    // Move the bounty to the account. We account for the rent amount
    // that Anchor's init already transferred into the account.
    let account_lamports = **item.to_account_info().lamports.borrow();
    let transfer_amount = bounty
        .checked_sub(account_lamports)
        .ok_or(TodoListError::BountyTooSmall)?;

    if transfer_amount > 0 {
        invoke(
            &transfer(
                user.to_account_info().key,
                item.to_account_info().key,
                transfer_amount,
            ),
            &[
                user.to_account_info(),
                item.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;
    }

    Ok(())
}
```

Anchor initializes an account with enough lamports to mark the account as rent-exempt, so we calculate
how many more lamports should be transferred to equal the total reward amount, and 
[`invoke`](https://docs.rs/solana-sdk/1.8.2/solana_sdk/program/fn.invoke.html) the
[`transfer`](https://docs.rs/solana-sdk/1.8.2/solana_sdk/system_instruction/fn.transfer.html)
instruction on the system program to actually move the balance onto the item's account.

## Testing Item Addition

Once again, we'll create a utility function to add items to a list. You could use a PDA here for the item account, but
we don't bother since the keys are stored in the list account anyway. This `addItem` function is similar to `newList` -- we
call the instruction to add the item to the list and then fetch the account data for both the list and the item.

```js
async function addItem({list, user, name, bounty}) {
  const itemAccount = anchor.web3.Keypair.generate();
  let program = programForUser(user);
  await program.rpc.add(list.data.name, name, new BN(bounty), {
    accounts: {
      list: list.publicKey,
      listOwner: list.data.listOwner,
      item: itemAccount.publicKey,
      user: user.key.publicKey,
      systemProgram: SystemProgram.programId,
    },
    signers: [
      user.key,
      itemAccount,
    ]
  });

  let [listData, itemData] = await Promise.all([
    program.account.todoList.fetch(list.publicKey),
    program.account.listItem.fetch(itemAccount.publicKey),
  ]);

  return {
    list: {
      publicKey: list.publicKey,
      data: listData,
    },
    item: {
      publicKey: itemAccount.publicKey,
      data: itemData,
    }
  };
}
```

So first, a test to check that adding items actually works.

```js
describe('add', () => {
  it('Anyone can add an item to a list', async () => {
    const [owner, adder] = await createUsers(2);

    const adderStartingBalance = await getAccountBalance(adder.key.publicKey);
    const list = await createList(owner, 'list');
    const result = await addItem({
      list,
      user: adder,
      name: 'Do something',
      bounty: 1 * LAMPORTS_PER_SOL
    });

    expect(result.list.data.lines,
      'Item is added').deep.equals([result.item.publicKey]);
    expect(result.item.data.creator.toString(),
      'Item marked with creator').equals(adder.key.publicKey.toString());
    expect(result.item.data.creatorFinished,
      'creator_finished is false').equals(false);
    expect(result.item.data.listOwnerFinished,
      'list_owner_finished is false').equals(false);
    expect(result.item.data.name,
      'Name is set').equals('Do something');
    expect(await getAccountBalance(result.item.publicKey),
      'List account balance').equals(1 * LAMPORTS_PER_SOL);

    let adderNewBalance = await getAccountBalance(adder.key.publicKey);
    expectBalance(adderStartingBalance - adderNewBalance, 
      LAMPORTS_PER_SOL,
      'Number of lamports removed from adder is equal to bounty');

    // Test that another add works
    const again = await addItem({ 
      list,
      user: adder,
      name: 'Another item',
      bounty: 1 * LAMPORTS_PER_SOL
    });
    expect(again.list.data.lines, 'Item is added')
      .deep.equals([result.item.publicKey, again.item.publicKey]);
  });
});
```

We should also test that any error conditions are properly checked. This test
creates a list, fills it to capacity, and then checks that additional add operations fail.

```js
it('fails if the list is full', async () => {
  const MAX_LIST_SIZE = 4;
  const owner = await createUser();
  const list = await createList(owner, 'list', MAX_LIST_SIZE);

  // Add 4 items, in parallel for speed.
  await Promise.all(new Array(MAX_LIST_SIZE).fill(0).map((_, i) => {
    return addItem({
      list,
      user: owner,
      name: `Item ${i}`,
      bounty: 1 * LAMPORTS_PER_SOL,
    });
  }));

  const adderStartingBalance = await getAccountBalance(owner.key.publicKey);

  // Now the list should be full.
  try {
    let addResult = await addItem({
      list,
      user: owner,
      name: 'Full item',
      bounty: 1 * LAMPORTS_PER_SOL,
    });

    console.dir(addResult, { depth: null });
    expect.fail('Adding to full list should have failed');
  } catch(e) {
    expect(e.toString()).contains('This list is full');
  }

  let adderNewBalance = await getAccountBalance(owner.key.publicKey);
  expect(adderStartingBalance,
    'Adder balance is unchanged').equals(adderNewBalance);
});
```

There are various ways to check an error condition, but the test here calls the failing function
from within a `try` block, and then calls `expect.fail` to fail the test if `addItem` doesn't throw an exception. In the
`catch` block we then check that the error message matches the one we expected to see.

In the [actual file](https://github.com/dimfeld/starting-with-solana/blob/master/tests/todo.js)
I also tested creating an item with a too-small reward, which should also throw an error.

# Cancelling an Item

Either the list's owner or the creator of an item can cancel the item, in which case the reward tokens are
returned to the item's creator.

## Cancel Instruction Accounts

This should look familiar by now. The main addition here is the `item_creator` account, which we need to
transfer the item's balance back to its creator. The `address` constraint in the account macro
checks that the address of `item.creator` is the same as `item_creator`.

Also note that we need to mark
`item_creator` with `mut` -- although we don't modify its data, transferring a balance to an account requires
it to be writable. Solana validators use the "read-only vs. writable" distinction to allow multiple transactions
to use accounts that are only used in read-only mode at a particular time. This is a similar concept to an
`RWMutex` or Rust's mutable borrow model, if you're familiar with those.

From here on I'll omit the `seeds` and `bump` from the account macro to save some space, but they are
identical to the values in the `Add` instruction.

```rust
#[derive(Accounts)]
#[instruction(list_name: String)]
pub struct Cancel<'info> {
    #[account(mut, 
      has_one=list_owner @ TodoListError::WrongListOwner,
      ... omitted seeds and bump for brevity)]
    pub list: Account<'info, TodoList>,
    pub list_owner: UncheckedAccount<'info>,
    #[account(mut)]
    pub item: Account<'info, ListItem>,
    #[account(mut, address=item.creator @ TodoListError::WrongItemCreator)]
    pub item_creator: UncheckedAccount<'info>,
    pub user: Signer<'info>,
}
```

## Cancel Implementation

The cancel instruction performs two checks:

- The caller is either the list owner or the item creator
- The cancelled item is actually in this todo list.

```rust
pub fn cancel(ctx: Context<Cancel>, _list_name: String) -> ProgramResult {
    let list = &mut ctx.accounts.list;
    let item = &mut ctx.accounts.item;
    let item_creator = &ctx.accounts.item_creator;

    let user = ctx.accounts.user.to_account_info().key;

    if &list.list_owner != user && &item.creator != user {
        return Err(TodoListError::CancelPermissions.into());
    }

    if !list.lines.contains(item.to_account_info().key) {
        return Err(TodoListError::ItemNotFound.into());
    }

    // Return the tokens to the item creator
    item.close(item_creator.to_account_info())?;

    let item_key = ctx.accounts.item.to_account_info().key;
    list.lines.retain(|key| key != item_key);

    Ok(())
}
```

Here we use `item.close` to tell Anchor/Solana to delete the account and also transfer any balance on it
to the `item_creator` account. The final step is to actually remove the item from the list. Rust's `Vec::retain`
works similarly to a `filter` operation except it modifies the list in place.

## Testing Cancellation

In the interest of space I'll only show the full code here for one of the passing tests. We create the list and
item, do a quick check that it works right, and then cancel the item, checking again that the balance
was returned and the item is removed.

```js
it('List owner can cancel an item', async () => {
  const [owner, adder] = await createUsers(2);
  const list = await createList(owner, 'list');

  const adderStartingBalance = await getAccountBalance(adder.key.publicKey);

  const result = await addItem({
    list,
    user: adder,
    bounty: LAMPORTS_PER_SOL,
    name: 'An item',
  });

  const adderBalanceAfterAdd = await getAccountBalance(adder.key.publicKey);

  expect(result.list.data.lines,
    'Item is added to list').deep.equals([result.item.publicKey]);
  expect(adderBalanceAfterAdd,
    'Bounty is removed from adder').lt(adderStartingBalance);

  const cancelResult = await cancelItem({
    list,
    item: result.item,
    itemCreator: adder,
    user: owner,
  });

  const adderBalanceAfterCancel = await getAccountBalance(adder.key.publicKey);
  expectBalance(adderBalanceAfterCancel,
    adderBalanceAfterAdd + LAMPORTS_PER_SOL,
    'Cancel returns bounty to adder');
  expect(cancelResult.list.data.lines,
    'Cancel removes item from list').deep.equals([]);
});
```

In the actual test file we run the same test but with the list owner cancelling the item, and then there
are three error checking tests:

- Other users can not cancel an item -- Similar to the above except we create a third user and try it have it cancel the
    item.
- The `item_creator` account must match the `creator` field on the item.
- The item must be in the list -- Here we create two lists, add an item to one of them, but then pass the account of the
    other list when trying to cancel the item.

# Finishing an Item

We're almost done! The Finish instruction awards an item's balance to the list owner when both the item creator and the list owner mark it finished.

::: warn

Once again, a reminder that this is not a proper escrow implementation and there are all sorts of ways to exploit it.

:::

## Finish Instruction Accounts

Once again, we have the accounts for the list, the list owner, the item, and the user initiating the transaction.

```rust
#[derive(Accounts)]
#[instruction(list_name: String)]
pub struct Finish<'info> {
    #[account(mut, 
      has_one=list_owner @ TodoListError::WrongListOwner,
      ... omitted seeds and bump for brevity)]
    pub list: Account<'info, TodoList>,
    #[account(mut)]
    pub list_owner: UncheckedAccount<'info>,
    #[account(mut)]
    pub item: Account<'info, ListItem>,
    pub user: Signer<'info>,
}
```

## Finish Implementation

The finish process sets the `creator_finished` flag or the `list_owner_finished` flag depending
on who called it. If both of the flags are set, then the item is finished.

Finishing the item looks very similar to the cancel instruction, except we transfer the item's reward
to the list owner.

```rust
pub fn finish(ctx: Context<Finish>, _list_name: String) -> ProgramResult {
    let item = &mut ctx.accounts.item;
    let list = &mut ctx.accounts.list;
    let user = ctx.accounts.user.to_account_info().key;

    if !list.lines.contains(item.to_account_info().key) {
        return Err(TodoListError::ItemNotFound.into());
    }

    let is_item_creator = &item.creator == user;
    let is_list_owner = &list.list_owner == user;

    if !is_item_creator && !is_list_owner {
        return Err(TodoListError::FinishPermissions.into());
    }

    if is_item_creator {
        item.creator_finished = true;
    }

    if is_list_owner {
        item.list_owner_finished = true;
    }

    if item.creator_finished && item.list_owner_finished {
        let item_key = item.to_account_info().key;
        list.lines.retain(|key| key != item_key);
        item.close(ctx.accounts.list_owner.to_account_info())?;
    }

    Ok(())
}
```

## Testing Finish

We can test the finish instruction using a very similar process. We create a list, add an item, and then
try various ways to call finish.

The first test has the list owner call finish first, then the item creator.

```js
it('List owner then item creator', async () => {
  const [owner, adder] = await createUsers(2);

  const list = await createList(owner, 'list');
  const ownerInitial = await getAccountBalance(owner.key.publicKey);

  const bounty = 5 * LAMPORTS_PER_SOL;
  const { item } = await addItem({
    list,
    user: adder,
    bounty,
    name: 'An item',
  });

  expect(await getAccountBalance(item.publicKey),
    'initialized account has bounty').equals(bounty);

  const firstResult = await finishItem({
    list,
    item,
    user: owner,
    listOwner: owner,
  });

  expect(firstResult.list.data.lines,
    'Item still in list after first finish').deep.equals([item.publicKey]);
  expect(firstResult.item.data.creatorFinished,
    'Creator finish is false after owner calls finish').equals(false);
  expect(firstResult.item.data.listOwnerFinished,
    'Owner finish flag gets set after owner calls finish').equals(true);
  expect(await getAccountBalance(firstResult.item.publicKey),
    'Bounty remains on item after one finish call').equals(bounty);

  const finishResult = await finishItem({
    list,
    item,
    user: adder,
    listOwner: owner,
    expectAccountClosed: true,
  });

  expect(finishResult.list.data.lines,
    'Item removed from list after both finish').deep.equals([]);
  expect(await getAccountBalance(finishResult.item.publicKey),
    'Bounty remains on item after one finish call').equals(0);
  expectBalance(await getAccountBalance(owner.key.publicKey),
    ownerInitial + bounty, 'Bounty transferred to owner');
});
```

In the Github repository, we also test the opposite order of calls to `finish`, which should end in the same result.

The error checks here are similar to those for the cancel instruction:

- Disallowed users can not call finish
- The list owner account must match the owner recorded on the list
- Calling finish on an item not in the list does not work.
- Calling finish on an already-finished item does not work.

# Next Steps

And that's it! A lot of code here but hopefully it gives you a good idea on how a slightly more complex contract
would fit together. In part 5 we'll finally build a Svelte-based web interface to the todo list.
