---
title: ACID Database Semantics
date: 2020-11-20
---

## Atomicity

Changes within a transaction are all-or-nothing.

This lets you make multiple changes without having to handle failure at each point.

## Consistency

Each transaction leaves the database in a valid state.

There's no way to violate a `unique` constraint, for example.

You can take advantage of this through `unique` constraints and also through `serializable` isolation level transaction.

## Isolation

Transactions work on snapshots and two transactions executing at the same time don't interfere with each other.

There are a few different levels of isolation which exhibit different interaction phenomena.

### Interactions

#### Dirty Read

In this case, a read from one transaction can read data written by another ongoing transaction. In Postgres, this never actually happens, but the standard allows it in "read uncommitted" mode.

#### Nonrepeatable Read

When a transaction commits, other transactions then start to see that data. So a transaction may read the same data twice with different results if another transaction commits while it's running.

#### Phantom Read

Similar to nonrepeatable read, but affecting the set of rows returned by a query instead of just the data in those rows.

#### Serialization Anomaly

A successful group of transactions may leave the database in a state different from if they ran serially.

### Isolation Levels

#### Serializable

None of the interactions will occur. The result is the same as if all the transactions ran one at a time.

Realistically, this is implemented by cancelling transactions that would otherwise violate this. The client can then retry the transaction.

#### Repeatable Read

By the standard, this allows Phantom Read and Serialization Anomaly interactions to occur.

In Postgres, only Serialization Anomaly will actually occur.

As with "serializable," the client should be prepared to retry the transaction.

#### Read Committed

Nonrepeatable Read, Phantom Read, and Serialization Anomaly can occur.

In Postgres this is the default.

#### Read Uncommitted

All of these interactions are possible.

Postgres doesn't actually implement this, so asking for it gives you the "Read Comitted" behavior.

## Performance

There are performance implications to higher isolation levels, of course, but there are some ways to help here.

* Transactions can be declared as read only, which simplifies the tracking.
* Limit the number of connections.
* Transactions should not be long-running.
* Don't use `SELECT FOR UPDATE` and similar locking techniques, inside serializable transactions because the transaction semantics already provide similar protections.
* Sequential scans greatly increase the risk of serialization failures, so queries should use index scans whenever possible.

## Durability

Committed transactions can not be lost. Instead of fsyncing all the time, this is often implemented using a WAL which is faster to write to, and that allows recovery of any committed data in the canonical data store that was lost in a crash or unexpected reboot.
