---
title: Avoiding Deadlock from Rayon Thread Pool Exhaustion
date: 2023-01-09
tags: Rust
---

[Rayon](https://github.com/rayon-rs/rayon/) has a well-deserved reputation as one of the most useful Rust libraries. Its most famous feature is the ability to
parallelize almost any iterator computation by simply calling `par_iter()` instead of `iter()`. This is a groundbreaking feature among
programming languages in its class. 

It transparently handles deciding how much to parallelize the iteration, spreading the data out to multiple threads, and then recombining
everything at the end. It even maintains a pool of precreated threads, so that you can use `par_iter` liberally without having
to worry about the overhead of creating and destroying threads.

But this thread pool did lead to an unexpected problem recently when I used Rayon in a [data processing pipeline](https://github.com/dimfeld/perceive/blob/fa4f742d5d7a40b288d430f0df2a879df08772d1/crates/perceive-core/sources/pipeline/reprocess.rs#L85).

## Pipeline Design

The pipeline code is part of a [search project](https://github.com/dimfeld/perceive) I've been working on. The project uses an article parser for HTML -- think reader mode in your browser or [Readwise](https://readwise.io/read) -- and the pipeline is designed to reprocess scanned data after installing an improved version of the parser.

There are four stages here:

1. Read the items from the database
2. Reprocess the content for each item, and send it to the next stage.
3. If an item's processed output has changed with the new code, run it through the machine learning model to generate embeddings for
   semantic search.
4. Update the database with the new information.

Stage 2 uses Rayon to parallelize the processing algorithm across batches of content. 
I didn't know it at the time, but stage 3 also uses Rayon when tokenizing the input to the ML model (which uses the excellent
[rust-bert](https://github.com/guillaume-be/rust-bert/) crate). 
The [flume](https://github.com/zesterer/flume) crate provides channels to pass data from one stage to another.

But the pipeline would sometimes stall, with no obvious indication of problems other than a lack of progress and
the CPU/GPU utilization dropping to zero.

## Debugging

Since GPU support for Mac in `libtorch` is still encountering some minor issues here and there, I first suspected that might have been the problem,
and so I resorted to the time-honored technique of sprinkling `dbg!` statements throughout the code to print to
the console as things happened.

This finally narrowed it down to the model's tokenizer starting to run, but never completing. But this part of the code was pure Rust and just did a bunch of string processing, with no `torch` code involved at all.

This seemed the least likely place for the pipeline to stall, until I looked into the tokenizer code itself and
saw that it was using Rayon as well. Armed with this revelation and no other ideas of what could possibly be
happening, I formed a theory.

### The Problem

The ML model processes items in batches of 64 at a time, and running with an M1 Pro GPU this could take five to six
seconds for an average batch. When the pipeline is working, it looks something like this:

1. Stage 2 sends a bunch of content to stage 3 through a channel.
2. Stage 3 reads the channel, and when it has accumulated 64 items that need to be run through the ML model, it processes them as a batch.
3. While the batch is processing, stage 2 continues to output content and fills up the channel again.
4. This repeats until all the items are processed.

Depending on the thread scheduling, it could be possible for stage 2 to fill up the channel again between the time when stage
3 would read items from the channel, and when it would actually start processing a batch. 

So finally -- and I should have just done this first -- I loaded the program into the debugger, ran until it got stuck, and halted the program.
As the debugger showed all the threads and their call stacks, I could see that stage 2 was running a bunch of Rayon threads, all waiting to output data into the full channel.

Stage 3's threads were in some Rayon code, waiting for a free thread from Rayon's thread pool to run on. But it couldn't get one until stage 2's code stopped blocking, and
they couldn't become unblocked until stage 3 processed its batch and consumed more data from the channel: a classic deadlock.

It turns out that the Rayon docs [do actually warn about this
too](https://docs.rs/rayon/latest/rayon/fn.join.html#warning-about-blocking-io), albeit in a less commonly used function.

## Fixing the Problem

I didn't want to give up the parallelism in stage 2, because depending on how many of the items were different after
reprocessing, it could actually be the bottleneck. Fortunately Rayon provides a simple solution by allowing manual
creation of additional thread pools.

So stage 2 started out looking something like this:

```rust
// Simplified for readability
fn reprocess(
    db_items_rx: flume::Receiver<Vec<Item>>,
    processed_tx: flume::Sender<ScanItem>,
) -> Result<()> {
    for batch in db_items_rx {
        batch.into_par_iter().try_for_each(|mut item| {
            let processed_item = reprocess(item)?;
            processed_tx.send(processed_item)
            Ok(())
        })?;
    }

    Ok(())
}
```

And with the new thread pool, it changed to this:

```rust
fn reprocess(
    db_items_rx: flume::Receiver<Vec<Item>>,
    processed_tx: flume::Sender<ScanItem>,
) -> Result<()> {
    let pool = rayon::ThreadPoolBuilder::new().build()?;

    pool.install(|| {
        for batch in db_items_rx {
            batch.into_par_iter().try_for_each(|mut item| {
                let result = scanner.reprocess(&mut item)?;
                processed_tx.send(processed_item)
                Ok(())
            })?;
        }

        Ok(())
    })?;

    Ok(())
}
```

The `ThreadPool::install` function takes a closure, and registers the thread pool so that any uses of Rayon inside that closure will use it instead of the global thread pool.

With that small change, everything worked properly.

## Alternative Solutions

For a data pipeline like this, the auto-parallelism of Rayon is arguably not even a good fit, since the pipeline stages are long-lived and well defined.
Another solution would be to manually create the threads for each pipeline stage.

Since channel senders and receivers in `flume` (and most other channel libraries) can be cloned while referencing the same channel, this doesn't
take much effort, and would look something like this:

```rust
std::thread::scope(|scope| {
    const NUM_THREADS: usize = 4;
    let stage_tasks = itertools::repeat_n((db_items_rx, processed_tx), NUM_THREADS)
        .into_iter()
        .map((|db_items_rx, processed_tx)| {
            scope.spawn(|| reprocess(db_items_rx, processed_tx))   
        })
        .collect::<Vec<_>>();

    // Spawn other tasks, handle thread results, etc.
});
```

## Takeaways

Thread pools are great, but can cause problems when multiple pieces of code with control flow dependencies are sharing
the same pool. 

Use the debugger as a first resort! VS Code's Rust debugging support works great. I believe NeoVim's support is quite good now too,
but I haven't tried it yet.


