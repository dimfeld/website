---
title: SWR-Style Fetching with XState State Machines
date: 2020-07-20
draft: true
cardImage:
summary: Using state machines to intelligently refresh your data
frontPageSummary: using state machines to intelligently refresh your data
confidence: I’ve been using a variation of the code described here for a while in my company’s web application.
---

In this blog post, we'll use the [XState](https://xstate.js.org) library to create a state machine that implements a stale-while-revalidate data fetcher with automatic refresh when the data becomes stale.

<div class="my-2 border bg-gray-100 p-4 shadow-lg" data-component="SwrXstateExample">

Check it out at the [example website](https://swr-xstate.imfeld.dev).

</div>

> The code for this post is in [this Github repository](https://www.github.com/dimfeld/swr-xstate). If you’re already familiar with the concept of SWR, feel free to skip down to the [design section](#overview-of-the-design). And if you just want to get to the state machine part, go to [the Implementation](#implementation). Otherwise keep reading!

# What is SWR and Why is It Useful?

_Stale-while-revalidate_, or SWR, is a data fetching strategy that allows cached data to be shown to the user as soon as possible, while also arranging to fetch the latest data if the cached version is out of date. Mostly seen for HTTP caches, the [`react-query`](https://github.com/tannerlinsley/react-query) and [`SWR`](https://github.com/vercel/swr) React libraries have made such strategies easier to implement in the front end.


## Showing the Latest Data

Modern web applications spend a lot of time fetching data to display to the user. But once fetched, the data is not automatically updated, even if it has changed in the meantime. This doesn’t always matter but can be important to the user experience.

Imagine a data analysis application with a list of reports that can be run from various places in the application. If we are using the application and another teammate adds or removes a report, that change should be reflected for everyone else without having to reload the tab.

Some solutions to this use websockets, server-sent events, or other technologies to push changes from the server to the browser in real-time. But these solutions can add a fair amount of complexity and scaling challenges to the application, with little benefit in most cases.

SWR takes a much simpler strategy. Our state machine will periodically fetch new data so long as something in the application is still interested in it. Some other SWR implementations act as more of a proxy, waiting for actual requests for the data and then deciding when to fetch updated data and when to just go to the cache.

The choice between these two styles of SWR fetching depends on the nature of your application and each particular piece of data, as well as what type of code is actually consuming the data from the fetcher. I'm usually using Svelte stores. They make it easy to tell when something is listening to the store's data, so the automatic periodic refresh makes the most sense.

## Better Behavior on Initial Load

Loading the data for the first time presents a smaller, but still important, challenge.  Some sites use server-side rendering (SSR) to decrease latency by putting together the entire initial page on the server.

But this isn’t always a great solution. The initial data for the page being loaded may take a while to build, or maybe the web framework in use doesn’t support SSR. And of course, SSR is completely uninvolved once a SPA-style application has loaded.

So there are three options when the user switches to a new page:

* Do nothing (or show a loading indicator) while the data loads, and then switch pages once the data arrives.
* Switch pages right away, but show a loading indicator while we wait for the data.
* Save what we showed last time on the page, and load that from a local cache while we wait for the new data to arrive.

SWR uses this third approach. The Twitter iOS app is a well-known example. When you open it or switch back to the main timeline view from elsewhere, it shows whatever you had been looking at and then fetches the new tweets in the background. Once that loads, it shows a notification at the top that there are new tweets to look at.

# SWR’s Behavior

The SWR technique combines these two data fetching behaviors to provide a nice experience for the user. It follows this sequence of events:

1. If there is locally cached data, return that first so that the user sees something useful right away.
2. If enough time has passed since the locally cached data was fetched, call it “stale” and fetch the data again.
3. Periodically, fetch the data again as it becomes stale, so long as the SWR process is active.

Most SWR libraries also postpone fetching if the browser window is not focused or the internet connection is offline. This avoids needless fetching just because someone left their computer on and idle. Once the browser tab is active again, it will fetch more data if it is time to do so.

# Overview of the design

The SWR fetcher will support these features:

* Track “online” and browser tab focus state to know when to pause refreshing. We don’t want to refresh if there’s no network connection or the user isn’t using the application.
* The library client can send events to the state machine to indicate that it should not fetch right now.
	* The user may not be logged in, or may not be permitted to see a particular class of data.
  * We may just be in a part of the application that doesn't need this data.
* The time between refreshes is configurable.
	* Depending on the nature of the data, it could be a few seconds, a minute, an hour, or even a day between refreshes.
  * If the state machine is enabled, it automatically fetches data again when the specified amount of time has passed.
* The client can supply a function that is called initially to get the “stale” data, if there is any.
* The details of fetching the data are left up to the client. The only requirement is that the fetch function returns a promise that resolves to the data.
	* The fetch function can also return  a special`UNMODIFIED` value to indicate that no new data was present. This usually will happen when the fetch request uses etags or the `If-Modified-Since` header and the server indicates that the data has not changed.
* The fetcher is provided with a function that it calls when new data has arrived or an error occurred.
* When an error occurs, fetching retries automatically using an exponential backoff timer.

The popular SWR libraries support some other features that we won't implement here:

* Cache management
* Handling multiple clients for a particular piece of data with a single state machine.
* Paged/infinite "fetch more" functionality.
* Merge pending mutations to the data with the last data receievd from the server.

Most of these features can be added on top without modifying the fetcher state machine, and I may cover adding them in a future article.

# When to Fetch

First, the fetcher waits until enough time has elapsed since the previous fetch. If you know that you need to fetch right now, you can tell it to do so with a _force refresh_ event.

Next, we make sure the browser tab is focused and internet is available. We don’t want to fetch if nobody is paying attention or if it’s going to fail anyway. The fetcher must also be enabled. Typically this means that the user is in a part of the application that uses the data.

In Svelte, for example, the fetcher might be hooked up to a store. When the store gets its first subscriber, we enable the fetcher, and when it goes back to zero subscribers, we disable the fetcher again since nothing is using the data anymore.

In addition to being enabled, the fetcher must be _permitted_ to operate. This works a lot like the _enabled_ setting, but it also ignores the _force refresh_ event. We might not permit fetches if the user isn’t logged in yet, or if we don’t yet have some other necessary information needed to fetch properly.

## Retrying on error

When a fetch fails, the state machine will automatically retry. It uses an exponential back off, which means that after each failed fetch it will wait twice as long as the previous attempt.

So it might retry after 1 second, then 2 seconds if it is still failing, then 4 seconds, and so on. There is also a maximum retry period so that we don’t end up waiting hours to retry.

# Quick XState Overview

[XState](https://xstate.js.org) is a Javascript library for implementing [Statecharts](https://statecharts.github.io/), which are finite state machines extended with a bunch of useful functionality. While the previous articles in this series have focused on implementing state machines from scratch, for anything complex I find XState to be a great framework to build with.

XState’s configuration format is pretty similar to the format I described in my previous state machine blog posts. If you haven't read those posts, you should be able to pick it up pretty quick.

## Events

Events are just values sent to the state machine to trigger some behavior. Each state handles events with its own set of transitions and actions, and the state machine may also define global handlers that run if the current state doesn’t handle an event.

An XState machine has a `send` function to send it events. An event can also include some data, and the actions triggered by an event can see that data and act appropriately.

## Actions

Actions are one way for state machines to interact with the rest of the system. They can be triggered by actions, or run as part of entering or leaving a state.

XState has special action types to do things like sending events or updating the state machine's context. Actions can also just be normal functions. For our SWR fetcher, all the actions will either be normal functions that call the `receive` callback , or special `assign` actions that update the internal context.

More details about actions at [Actions | XState Docs](https://xstate.js.org/docs/guides/actions.html).


## State Definitions

The state definitions define how the state machine responds to events at certain times. States in XState can also trigger actions or run asynchronous processes such as promises.

The current state is an output of the state machine. That is, users of a state machine can see what the state is and base their own behavior on it.

## State Machine Context

Context is just an arbitrary data structure associated with the state machine. A useful way to think about context is that while the states are finite, the context is for the infinite data. This includes things such as timestamps, counters, and other associated data, that are tedious or impossible to represent with just a state diagram.

The context can be used to alter the behavior of the state machine, and it is also visible to users of the state machine.

# Implementation

## Options when Creating a Fetcher

When creating a fetcher, you can pass options to configure its behavior:

- `fetcher` is a function that retrieves the data. The state machine will call this function on every refresh.
- `receive` is a function called by the fetcher when it has received some data or encountered an error. Effectively, the output of the fetcher.
- `initialData` is an optional function that returns the data to be used before the first fetch has succeeded.  If provided, the fetcher calls this function when it is first created. This will generally be read from some sort of cache.
- `key` is a value that gets passed to the `fetcher` and `initialData` functions. The fetcher doesn’t use it otherwise.
- `name` is a string used for debug output. It defaults to `key` if not provided.
- `autoRefreshPeriod` determines how long to wait before refreshing the data again.
- `maxBackoff` is the longest amount of time to wait between fetches when retrying after errors.
- `initialPermitted` and `initialEnabled` indicate if the fetcher should be permitted and enabled when it is created. They default to `true`, but if `false` the state machine will wait for the relevant events to be able to fetch.

## State Machine Context

Our fetcher keeps these values in the context:

* `lastRefresh` records when the previous refresh occurred. This allows us to calculate when the next refresh should take place.
* `retries` is a count of how many times we’ve failed to fetch and tried again.
* `reportedError` indicates if we have failed and reported a fetch error. This is done so that we don’t report the same error over and over again.
* `storeEnabled`, `browserEnabled`, and `permitted` keep track of whether or not the store is allowed to refresh. While these are also associated with states in the machine, some events can force a refresh, and then it’s useful to look at these flags to see which state to go back to after the refresh is done.

# The States

Despite all this exposition and design work, the actual state machine ends up fairly simple. There are just six states and some supporting logic.

## maybeStart

This is the initial state, and the state machine also returns to it whenever it may need to schedule another fetch. It exists so that the other states can transition here to figure out what to do next, instead of reimplementing the logic everywhere.

In state chart parlance, a state that immediately transitions to some other state is called a _condition state_.

```js
maybeStart: {
  always: [
    { cond: 'not_permitted_to_refresh', target: 'notPermitted' },
    { cond: 'can_enable', target: 'waitingForRefresh' },
    { target: 'disabled' },
  ],
},
```

The `always` key tells XState to run these transitions immediately, without waiting for any event or delay. If the values in the context indicate that refreshing is not currently allowed, it goes to the `notPermitted` or `disabled` states. If refreshing is allowed right now, it transitions to `waitingToRefresh`.

### XState Guards

These transitions use the `cond` keyword, which indicates a condition that must be true for the transition to run. XState calls rhese conditions _guards_, and they look like this on our state machine configuration.

```js
guards: {
    not_permitted_to_refresh: (ctx) => !ctx.permitted,
    permitted_to_refresh: (ctx) => ctx.permitted,
    can_enable: (ctx) => {
      if (!ctx.storeEnabled || !ctx.permitted) {
        return false;
      }

      if (!ctx.lastRefresh) {
        // Refresh if we haven’t loaded any data yet.
        return true;
      }

      // Finally, we can enable if the browser tab is active.
      return ctx.browserEnabled;
    },
  },
```

We have two guards related to whether the state machine is permitted to refresh or not, and another that checks all the conditions related to whether or not the fetcher can schedule a fetch.

### Global Event Handlers

The state machine’s global event handlers all update context information related to whether fetching is allowed or not, and then transition into the `maybeStart` state to figure out what to do next.

Since these handlers are defined outside of any state, they run whenever the current state does not have its own handler for an event.

```js
on: {
    FETCHER_ENABLED: { target: 'maybeStart', actions: 'updateStoreEnabled' },
    SET_PERMITTED: { target: 'maybeStart', actions: 'updatePermitted' },
    BROWSER_ENABLED: {
      target: 'maybeStart',
      actions: 'updateBrowserEnabled',
    },
  },

```

## notPermitted and disabled

The `maybeStart` state transitions to these states if fetching is not currently allowed. In the `notPermitted` state, nothing is allowed to happen except the global event handlers. This state also clears information about the last refresh and sends a `null` data to the receive function.

In the `disabled` state, the state machine is sitting idle until it receives the necessary events to schedule a fetch again. But the client may trigger a refresh using the `FORCE_REFRESH` event even though refreshing would not occur automatically.

```js
// Not permitted to refresh, so ignore everything except the global events that might permit us to refresh.
notPermitted: {
  entry: ['clearData', 'clearLastRefresh'],
},
// Store is disabled, but still permitted to refresh so we honor the FORCE_REFRESH event.
disabled: {
  on: {
    FORCE_REFRESH: {
      target: 'refreshing',
      cond: 'permitted_to_refresh',
    },
  },
},
```

## waitingForRefresh

While refreshing is enabled, the state machine waits in the `waitingForRefresh` state until it is time to refresh. A `FORCE_REFRESH` event may still trigger a refresh immediately.

```js
waitingForRefresh: {
  on: {
    FORCE_REFRESH: 'refreshing',
  },
  after: {
    nextRefreshDelay: 'refreshing',
  },
}
```

### Delays

The `after` key on a state can define behaviors to happen after a certain amount of time if nothing else caused a transition first. Like any transition, these can be guarded with a `cond` value if desired.

Delays can either be fixed or variable. A fixed delay simply has the delay value as the key.

```js
after: {
  400: 'slowLoading'
}
```

XState also supports dynamic delays, and that is what we use here. Dynamic delays are defined in the `delays` section of the state machine configuration, and each delay function returns the number of milliseconds to wait. The `waitingForRefresh` state uses the `nextRefreshDelay` function.

```js
delays: {
  nextRefreshDelay: (context) => {
    let timeSinceRefresh = Date.now() - context.lastRefresh;
    let remaining = autoRefreshPeriod - timeSinceRefresh;
    return Math.max(remaining, 0);
  },
  errorBackoffDelay: /* details later */,
},
```

The function itself is pretty simple. It looks at how long ago the previous refresh happened, and how long it should wait until the next refresh is due.

Notably, delays use the `setTimeout` function, and all major browser implementations use a signed 32-bit integer to time the delay. This means that delays longer than about 24 days will roll over and cause incorrect behavior. So if you really want to delay that long for some reason you’ll need to build extra code to make it work.

## refreshing

The `refreshing` state calls the suppled `fetcher` function and notifies the client when it has new data.

```js
refreshing: {
  on: {
    // Ignore the events while we're refreshing but still update the
    // context so we know where to go next.
    FETCHER_ENABLED: { target: undefined, actions: 'updateStoreEnabled' },
    SET_PERMITTED: { target: undefined, actions: 'updatePermitted' },
    BROWSER_ENABLED: {
      target: undefined,
      actions: 'updateBrowserEnabled',
    },
  },
  // An XState "service" definition
  invoke: {
    id: 'refresh',
    src: 'refresh',
    onDone: {
      target: 'maybeStart',
      actions: 'refreshDone',
    },
    onError: {
      target: 'errorBackoff',
      actions: 'reportError',
    },
  },
},
```

### Global Event Handler Overrides

The `refreshing` state defines handlers for the enabling events that still call the relevant actions but have no target.

This way the context still updates so that `maybeStart` can do the right thing next time, but we don’t interrupt the fetch by leaving the state too soon if the state machine is disabled while a fetch occurs.

### XState Services

XState uses _services_ to perform asynchronous operations. There are a few different types of services:

* A `Promise` runs and then resolves or rejects.
* An _Observable_, such as that implemented in the `rxjs` library, can send multiple events and then finish.
* A service can also be an entire state machine in itself, which communicates back and forth with the current state machine. The service is considered finished when the invoked machine enters its final state.

The `invoke` object on a state defines a service. Its `src` key indicates which service to invoke, and depending on the type of service, the  `onDone` and `onError` define the next transitions and actions to take.

We use only one service here, which calls the `fetcher` function supplied by the client and returns its promise.

```js
services: {
  refresh: () => fetcher(key),
},
```

### Handling the Result

The result handlers are relatively simple.

When the fetch succeeds, the state machine executes the `refreshDone` action and then returns to `maybeStart` to figure out what to do next.

```js
onDone: {
  target: 'maybeStart',
  actions: 'refreshDone',
},
```

The `refreshDone` action records when the refresh occurred, clears the retry information, and then calls the `receive` callback. This is done as an `assign` action so its return value is merged with the existing context.


```js
refreshDone: assign((context, event) => {
  let lastRefresh = Date.now();
  let updated = {
    lastRefresh,
    retries: 0,
    reportedError: false,
  };

  if(event.data !== UNMODIFIED && context.permitted) {
    receive({ data: event.data, timestamp: lastRefresh });
  }

  return updated;
})
```

If the fetch returns an error, then we record it and get ready to try again.  The `errorBackoff` state, described below, handles waiting for the next retry.

```js
onError: {
  target: 'errorBackoff',
  actions: 'reportError',
},
```

The `reportError` action notifies the client if it hasn’t already done so.

```js
reportError: assign((context: Context, event) => {
  // Ignore the error if it happened because the browser went offline while fetching.
  // Otherwise report it.
  if (
    !context.reportedError &&
    browserStateModule.isOnline() // See the Github repo for this function
  ) {
    receive({ error: event.data });
  }
  return {
    reportedError: true,
  };
}),

```

## errorBackoff

When a fetch fails, the state machine enters the error backoff state, which waits to try again with a longer delay for each retry.

```js
errorBackoff: {
  entry: ‘incrementRetry’,
  after: {
    errorBackoffDelay: ‘refreshing’,
  },
},
```

`incrementRetry` just adds one to the retry count:

```js
incrementRetry: assign({ retries: (context) => context.retries + 1 }),
```

And the `errorBackoffDelay` function calculates how long to wait using an exponential backoff algorithm:

```js
delays: {
  errorBackoffDelay: (context, event) => {
    const baseDelay = 200;
    const delay = baseDelay * (2 ** context.retries);
    return Math.min(delay, maxBackoff);
  },
}
```

# All done!

And that’s that. What could have been a complex piece of code with a bunch of fiddly bits and conditions is quite straightforward and easy to understand when implemented as a state machine.

You can find the full version of the code here at [this Github repository](https://www.github.com/dimfeld/swr-xstate).

There’s a lot more functionality supported in [XState](https://xstate.js.org) that I haven’t covered here. You can have hierarchies of states, parallel or nested state machines, and keep a state history, among other great features.

Keep checking this site or follow me on [Twitter](https://www.twitter.com/dimfeld) to see when I post my next state machine article: how to test state machines like this without going crazy!
