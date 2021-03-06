---
title: Reading the "CRDTs for Mortals" Example Code
date: 2020-09-03
tags: CRDTs, state
---

I recently watched [CRDTs for Mortals](https://www.dotconferences.com/2019/12/james-long-crdts-for-mortals) by James Long, in which he details how he designed the "local-first" data management for his personal finance application.

The whole idea of this is that you shouldn't need to constantly have an internet connection to have a good experience using the application. Multiple applications can work with the same data and sync them only occasionally, accounting for possibly long periods of offline work in which syncing can not be done.

It's a huge pain to manually write conflict-resolution code. Even if it appears simple at first, more and more edges cases will appear and almost certainly cause bugs and lost or incorrect data. So we need some data structures to facilitate safe syncing without needing to reimplement a new, bespoke version of this code every time.

This is what James describes in his talk, and he graciously also provided an [example application](https://github.com/jlongster/crdt-example-app/) that implements this type of code.

> Note: I've been familiar with the basics of CRDTs for a while, so if I appear to skip over any basic concepts here it was not intentional. Please [let me know](https://www.twitter.com/dimfeld) if something is confusing and I can add more detail.

# CRDTs

The data is represented as a bunch of "conflict-free replicated data types," or CRDTs. A CRDT has a few important properties when being applied to the data:

- It is commutative, which means that (like addition or multiplication) it doesn't matter which one comes first. A + B + C has the same result as C + B + A.
- It is idempotent, which means that applying a CRDT that has already been applied to the state will not change the state again.

Essentially, this means that we can apply a CRDT to our state without needing to do any special checking of if we've seen that operation already, or needing to figure out how it interacts with other operations that we may have applied before seeing this one. The CRDT code handles those details for us, so sync operations can just apply anything coming in from the sever and it will work correctly.

# Logical Clocks

> Implemented at [timestamp.js](https://github.com/jlongster/crdt-example-app/blob/master/shared/timestamp.js)

This is an implementation of a hybrid logical clock (HLC), which combines physical time with a logical clock to get the advantages of both.
 HLCs are described in [this article](https://muratbuffalo.blogspot.com/2014/07/hybrid-logical-clocks.html) by Murat Demirbas, one of its inventors. Jared Forsyth also wrote an [excellent summary](https://jaredforsyth.com/posts/hybrid-logical-clocks/).


Physical time is nice because it gets you an ordering of events that doesn't require any communication between clients. If you are offline and make some edits on your phone in the morning and then on a tablet in the afternoon, when they both sync the edits will appear in the right order, and the edits made later will override edits made earlier.

The downside of physical time is that it can be [very unreliable](https://github.com/aphyr/distsys-class#wall-clocks) and the difference in clocks between two computers can be much more than you would expect. In an extreme case, operations that are erroneously set years into the future would be permanent until actual time catches up.

Logical clocks create an ordering of events without the need for a central clock, and if one operation was caused by another, it is guaranteed to have a later value of the clock than the operation that caused it.

The downside of logical clocks appears in cases like the above scenario, where the logical clock can't tell if edits to the same field made on your phone or your tablet happened first.

This isn't really a problem for automated distributed systems, but for systems that take input from a potentially-offline person, it can be an issue.  Depending on which syncs first, the changes you made in the morning may overwrite the changes you made in the afternoon. The logical clock doesn't really care which came first since the edits all happened independently of each other from its perspective, and it doesn't interact with your brain.

A hybrid logical clock attempts to solve a lot of these problems by  syncing all clients to the latest physical clock of any client and then using a logical clock after that to order events when everything is synced up. This explanation is overly simple but the blogs I referenced at the start of this section do a great job of explaining it in depth.

The short version is that a hybrid logical clock contains three elements:

1. The "wall clock" time, which the greater of the local time and the highest wall clock time seen in any received message.
2. A "logical time" counter that starts at 0. This is incremented on every message created or received, and then set back to 0 when the wall clock time moves forward. If the clock imports the wall time of a received message, then it also uses the logical clock value from that message.
3. The node ID, which is usually a UUID generated by the client.

# Merkle Tree

> Implemented at [merkle.js](https://github.com/jlongster/crdt-example-app/blob/master/shared/merkle.js)

A [merkle tree](https://en.wikipedia.org/wiki/Merkle_tree) is maintained alongside the state, and used to facilitate syncing. It provides a relatively quick way to see if two versions of the state are the same, and if not, where the earliest divergence takes place.

This implementation is a ternary trie. Each key uses a base 3 timestamp with minute resolution for its keys. The value is the hash of the entire timestamp (clock time, logical time, and node ID).

Each node contains a hash value that is an XOR of the hashes of all the writes that have happened on that timestamp. When adding a new node, the write process walks down the tree and XORs its timestamp along the way into each node it traverses.

When syncing, we compare the client’s tree with the server’s tree and look for the first timestamp with a differing hash, and this gives us a lower bound on the messages that need to be synced.

# Data Format

This application uses two CRDT types: A grow-only set and a last-write-wins (LWW) map.

The set contains all the CRDT commands that have come in. Each command in the set is a write to one of the maps.

A command lists the table, the row ID, the column, and the value to write. If the timestamp is greater than the latest seen timestamp for that table/row/column, then the write takes effect. Otherwise it is ignored.

This works well for structured data. It probably doesn't work well for collaborative editing of prose where you want edits to the same areas to be combined rather than last-write-wins.

# Applying Messages

> Implemented at [sync.js](https://github.com/jlongster/crdt-example-app/blob/3acd31069db65607bacd88a71c89fb43e53b6ec8/client/sync.js#L70)

Reading through your entire set of CRDTs every time you want to read your state is not very efficient, so this implementation materializes the CRDTs into a snapshot of the latest state as messages arrive.

The example app's implementation in intentionally inefficient in favor of being simple and understandable.

Every time a batch of messages comes in, it sorts the existing messages by timestamp and finds the latest message corresponding to the same location as each incoming message.
Then for each incoming message it compares the timestamp of the latest message to the new message. If the incoming message is newer or there is no match, it applies the message.
It also hashes every non-duplicate message into the merkle tree. This allows consistency checking and also speeds up the sync process after being offline.

# Client Database Implementation

> Implemented at [db.js](https://github.com/jlongster/crdt-example-app/blob/master/client/db.js)

Writing to the database actually takes the form of sending messages into the sync engine, which sends the messages to the server and also applies the added messages just like any other received message.

Like other CRDT systems, deletes are handled by setting a value in a tombstone column. Reading is just reading like normal, except that you need to check that the the tombstone column is not set.

# Server Implementation

> Implemented at [server/index.js](https://github.com/jlongster/crdt-example-app/blob/3acd31069db65607bacd88a71c89fb43e53b6ec8/server/index.js#L97)

The server has a database that stores both the messages and the merkle trees. Messages are namespaced so that there can be multiple copies of the state for each one. A namespace might be an account ID, for example. Each namespace has its own merkle tree.

The server has a single useful endpoint, `/sync`, which handles both sending and receiving messages. Every message that comes in and hasn't been seen before goed into the database and into the merkle tree.

When the server syncs messages down to a client, it compares the client’s merkle tree with its own to find the earliest timestamp that differs, and sends all the messages since that timestamp.

# Questions

These questions apply more to scaling real implementations of CRDT-based state than to this particular example.

Are there performance implications to sending the entire Merkle tree on every sync request? I'm guessing that it takes a while before this becomes an issue but eventually it could.

Same question for the number of CRDT operations growing since the set of operations never shrinks.

I believe some implementations tackle this through some sort of "convergence" of the state that it knows all possible clients will have. So CRDTs before a certain timestamp are all merged into a single base state object and then the additional CRDTs after this are applied upon that base state.
Deciding when to do this and where to set that minimum timestamp are, of course, significant challenges. You probably have to reject any updates that come in for timestamps before that time, and tell clients that you inadvertently missed to just drop their changes and update to the latest state.

