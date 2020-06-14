---
title: Add Actions to Your State Machines
date: 2020-06-12
draft: true
summary: Integrating more logic into your state machines
frontPageSummary: making state machines actually do useful things
cardImage: simple-state-machines-diagram.png
series: State Machines
---

In the [previous article](simple_state_machines), we looked at how to transition a set of boolean flags into a simple state machine. In this article, we'll take it a step further with a different example, and look at linking states to actual actions.

# The State Machine

FundTheRebuild.com is a website designed to highlight GoFundMe campaigns that haven't gone viral and need a bit of extra attention. The "Add a Cause" page allows people to submit their own campaigns.

When opening the page, users see a text box where they can paste the URL of a GoFundMe campaign. Upon submitting the form, the Javascript in the browser will try to download details about the supplied campaign. If it is valid, the user can then click an "Add" button to confirm, at which point that campaign is sent into a queue to be approved and added to the site.

The initial implementation of the Add page uses a basic state machine with seven states:

- Idle - When the page has just loaded
- Searching - When the code is searching for a campaign
- Search Error - If the URL does not lead to a valid GoFundMe campaign
- Search Found - Show the campaign that we found
- Submitting - User clicked the Add button
- Submit Failed - Something went wrong while submitting.
- Submit Succeeded

Aside from the error states, the state machine proceeds through the states in the order they are listed above.

While the state machine simplifies the logic of figuring out what to display on the screen, just showing different things on the screen is usually not enough. Most applications need to talk to a server or otherwise interact with the user too. Currently the code manually manages the actions that occur as the states change:

```js
async function submitCampaign() {
  stepState('submit')
  try {
    await client.post('/api/submit-campaign', { json: campaign });
    stepState('submit-succeeded');
  } catch(e) {
    stepState('submit-failed');
  }
}

async function findCampaign(url) {
  stepState('search');
  try {
    currentCampaign = await client.get('/api/get-campaign',
      { searchParams: { campaign: url } }).json();
    stepState('search-succeeded');
  } catch(e) {
    stepState('search-failed');
  }
}
```

This mostly works fine, but it has issues. In the previous article, we established a model where we could send any event to the state machine at any time, and it would take the correct action given the current state. Future additions to the code need to make sure to always use these functions instead of just sending events to the state machine, so that the network requests actually happen.

Worse, these functions perform the network request without any regard for if the state machine actually entered the appropriate state. We could add extra logic to fix that, but it's essentially duplicating the logic that is already in the state machine -- another source for bugs.

# Adding Actions

The more we can do things by only talking to the state machine, the better, but we obviously can't give up useful things like network requests. So we'll integrate actions and their corresponding state transitions into the state machine itself.

Accounting for when actions can run, we end up with four types of actions:

- Synchronous actions that happen during a specific transition
- Synchronous actions that happen when entering a state
- Synchronous actions that happen when leaving a state
- Asynchronous actions that happen during a state

Synchronous actions are any "plain" Javascript code that modifies some of the "context" variables in the module (e.g. `(event) => count += event.data`), while asynchronous actions would be anything involving Promises, callbacks, setTimeout, etc.

Here we've limited asynchronous actions to running inside states. It's possible for transitions to trigger asynchronous actions, of course, but that causes some complications, such as leaving the state machine in between states while the transition runs, and having to deal specially with errors. So we'll only officially support asynchronous actions on states themselves.

## A Quick Digression into State Machine Theory

Traditionally, there are two types of state machines that differ primarily in how they treat actions. A Moore state machine performs actions based on the state it's in, and a Mealy state machine places the actions on the transitions between states. It's possible to create any state machine using either paradigm, and to translate either type of state machine into the other by adding or removing states and moving around the actions.

This distinction really matters most when putting a state machine into hardware, where adding extra configurability comes with a cost. For modern programming languages, a hybrid approach that allows actions either on transitions or on the states themselves works just fine.

# Adding Synchronous Actions

There's not much to synchronous actions, so let's add those first. To recap, the state machine configuration has a list of states, and each state has a list of which transition it takes when it receives a event.

```js
{
  IDLE: {
    'find-campaign': 'SEARCHING',
  }
}
```

It's straightforward to support the various actions. While we're at it, we'll also add support for global fallback event handlers. These handlers will run if the current state does not handle an event.

```js
{
  // Allow defining global handlers
  on: {
    'cancel': {
      target: 'IDLE',
      action: ({ event, data}) => { ... },
    }
  },
  states: {
    IDLE: {
      entry: ({event, data}) => { ... },
      exit: ({event, data}) => { ... },
      on: {
        'search': {
          target: 'SEARCHING',
          action: ({event, data}) => { ... }
        }
    }
  }
}
```

So when entering the IDLE state, the state machine runs the entry action, and when leaving it, the machine runs the exit action. When the `search` event comes in, the machine runs the associated action and then changes to the `SEARCHING` state.

All action functions are passed the name of the event that caused the transition, and the data associated with the event, if any.

The `stepState` function is updated to handle these too:

```js
function stepState(event, data) {
  let stateInfo = stateMachine.states[currentState];

  let next = stateInfo.on[event];
  if(!next) {
    // No transition for this event in the current state. Check the global handlers.
    next = stateMachine.on[event];
  }

  if(!next) {
    // No global handler for this event, and no handler in the current state, so ignore it.
    return;
  }

  runTransition(stateInfo, next, { event, data });
}

function runTransition(stateInfo, transition, eventData) {
	let targetState = transition.target;

	// If we're leaving this state, run the exit action first.
	if(stateInfo.exit && targetState) stateInfo.exit(eventData);

	// Run the transition action if there is one.
	if(transition.action) {
    transition.action(data);
  }

	if(!targetState) {
    // If the transition has no target, then it's just an action, so return.
		return;
  }

	// Update the state if the transition has a target.
	currentState = targetState;

	// And then run the next state's entry action, if there is one.
  let nextStateInfo = states[currentState];
  if(nextStateInfo.entry) nextStateInfo.entry();
}
```

Note that both the action and the target on a transition are optional. If a transition just wants to alter a variable and stay in the current state, that's fine.


# Adding Asynchronous Actions

Asynchronous actions take a little more care. They can succeed or fail, and other events may occur while they are running. We should handle all of these cases.

```js
{
  on: {
    search: { target: 'SEARCHING' },
  },
  states: {
    SEARCHING: {
      entry: entryFn, // runs first
      action: {
        handler: ({event, data}, abortController) => asyncFunction(),
        success: { target: 'SEARCH-FOUND', action: searchFoundAction },
        failure: { target: 'SEARCH-FAILED', action: searchFailedAction },
      },
      exit: exitFn, // runs last
    }
  }
}
```

The action on the `SEARCHING` state specifies a handler and which transitions to run when the handler succeeds or fails. The success action is called with the handler's result as its argument, while the failure handler receives whatever error was thrown.

If an event arrives that results in a state transition while the asynchronous action is running, the state machine will attempt to abort the asynchronous action, and it passes the `abortController` argument to the action handler to facilitiate this. An [`AbortController`'s](https://developer.mozilla.org/en-US/docs/Web/API/AbortController), which can be provided to a network request or otherwise handled to cancel the ongoing operation.

So lt's implement all this.

```js
var currentAbortController;

function runTransition(stateInfo, transition, eventData) {
  let targetState = transition.target;

  // Run the exit action
  if(stateInfo.exit && targetState) {
    if(currentAbortController) {
      // We're transitioning to another state, so try to abort the action if
      // it hasn't finished running yet.
      currentAbortController.abort();
    }

    stateInfo.exit();
  }

  // Run the transition's action, if it has one.
  if(transition.action) {
    transition.action(eventData);
  }

  if(!targetState) {
    // If the transition has no target, then it's just an action, so return.
    return;
  }

  // Update the state if the transition has a target
  currentState = targetState;

  // And then run the next state's entry action, if there is one.
  let nextStateInfo = states[currentState];
  if(nextStateInfo.entry) nextStateInfo.entry(eventData);

  // Run the asynchronous action if there is one.
  let asyncAction = nextStateInfo.action;
  if(asyncAction) {
    // Create a new abort controller and save it.
    let abort = currentAbortController = new AbortController();
    asyncAction.fn(eventData, abort)
      .then((result) => {
        // If the request aborted, ignore it. This means that another event
        // came in and we've already transitioned elsewhere.
        if(abort.signal.aborted) { return; }

        // Run the success transition
        if(asyncAction.success) {
          runTransition(nextStateInfo, asyncAction.success,
            { event: 'async-success', data: result });
        }
      })
      .catch((e) => {
        if(abort.signal.aborted) { return; }

        // Run the failure transition
        if(asyncAction.failure) {
          runTransition(nextStateInfo, asyncAction.failure,
            { event: 'async-failure', data: e });
        }
      });
  }
}
```

So with all that, our "Add a Cause" page has all of its logic embedded into the state machine, and robustness returns to the code. Anything that needs to be done can be accomplished by sending events to the state machine, and the logic embedded therein will make sure that the right thing happens. Let's take one last look at the updated code.
