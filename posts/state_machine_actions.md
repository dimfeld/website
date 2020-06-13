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

```jsx
async function submitCampaign() {
  state = SUBMITTING;
  try {
    await client.post('/api/submit-campaign', { json: campaign });
    state = SUBMITTED;
  } catch(e) {
    state = SUBMIT_ERROR;
  }
}

async function findCampaign(url) {
  state = SEARCHING;
  try {
    currentCampaign = await client.get('/api/get-campaign',
      { searchParams: { campaign: url } }).json();
    state = SEARCH_FOUND;
  } catch(e) {
    state = SEARCH_ERROR;
  }
}
```

This works fine, but if a future update adds more ways to submit or search for campaigns, we have to be sure that every one of them uses these functions. Any other transition that moves into the `SEARCHING` or `SUBMITTING` state will update what the user sees in the browser, but nothing useful will actually happen. This breaks the model established earlier in which we send events to the state machine and can trust that the behavior will be correct.

# Adding Actions

The more we can do things by only talking to the state machine, the better, but we still need to be able to do things like network requests. The obvious solution here is to integrate the actions and their corresponding state transitions into the state machine itself.

We have two types of actions:

- Synchronous actions that just run computations and update variables.
- Asynchronous actions such as network requests and database accesses.

In state machine theory, a Moore state machine performs actions based on the state it's in, and a Mealy state machine places the actions on the transitions between states. It's possible to reconfigure either type of state machine into the other by adding or removing states.

But this distinction really matters most when putting a state machine into hardware, where adding extra configurability comes with a cost. For modern programming languages, a hybrid approach that allows actions either on transitions or on the states themselves works just fine.

So we end up with four types of actions:

- Synchronous actions that happen during a specific transition
- Synchronous actions that happen when entering a state
- Synchronous actions that happen when leaving a state
- Asynchronous actions that happen during a state

It's possible for transitions to trigger asynchronous actions, of course, but that causes some complications, such as leaving the state machine in between states while the transition runs, and having to deal specially with errors. So we'll only officially support asynchronous actions on states themselves.

## Adding Synchronous Actions

There's not much to synchronous actions, so let's add those first. To recap, the state machine configuration has a list of states, and each state has a list of which transition it takes when it receives a event.

```jsx
{
  IDLE: {
    'find-campaign': 'SEARCHING',
  }
}
```

It's straightforward to support the various actions.

```jsx
{
  IDLE: {
    entry: entryFunction,
    exit: exitFunction,
    on: {
      'find-campaign': {
        target: 'SEARCHING',
				action: (eventData) => {... }
      }
   }
}
```

So when entering the IDLE state, the state machine runs `entryFunction`, and when leaving it, the machine runs `exitFunction`. When the `find-campaign` event comes in, the machine runs the associated action and also passes any data that was associated with the event.

The `step` function is updated to handle these too:

```jsx
function stepState(event, data) {
  let stateInfo = states[currentState];

  let next = stateInfo.on[event];
  if(!next) {
    // No transition, so nothing to do.
    return;
  }

  runTransition(stateInfo, next, data);
}

function runTransition(stateInfo, transition, eventData) {
	let targetState = transition.target;

	// Execute the exit action
	if(stateInfo.exit && targetState) stateInfo.exit();

	// If there's a transition action, execute it.
	if(transition.action) {
    transition.action(data);
  }

	if(!targetState) {
    // If the transition has no target, then it's just an action, so return.
		return;
  }

	// Update the state if the transition has a target
	currentState = targetState;

	// And then run the next state's entry action, if there is one.
  let nextStateInfo = states[currentState];
  if(nextStateInfo.entry) nextStateInfo.entry();
}
```

## Adding Asynchronous Actions

Asynchronous actions take a little more care. They can succeed or fail, and other events may occur while they are running. We should handle all of these cases.

```jsx
SEARCHING: {
  action: {
		success: { target: 'SEARCH-FOUND', action: searchFoundAction },
    failure: { target: 'SEARCH-FAILED', action: searchFailedAction },
		fn: asyncFunction
  }
}

var currentAbortController;

function runTransition(stateInfo, transition, eventData) {
	let targetState = transition.target;

	// Execute the exit action
	if(stateInfo.exit && targetState) {
		if(currentAbortController) {
	    // We're transitioning to another state, so try to abort the action if
			// it hasn't finished running yet.
	    currentAbortController.abort();
	  }

		stateInfo.exit();
	}

  // If there's a transition action, execute it.
	if(transition.action) {
    transition.action(data);
  }

	if(!targetState) {
    // If the transition has no target, then it's just an action, so return.
		return;
  }

	// Update the state if the transition has a target
	currentState = targetState;

	// And then run the next state's entry action, if there is one.
  let nextStateInfo = states[currentState];
  if(nextStateInfo.entry) nextStateInfo.entry();

	// Run the asynchronous action if there is one.
  let asyncAction = nextStateInfo.action;
	if(asyncAction) {
    let abort = currentAbortController = new AbortController();
    asyncAction.fn(abort.signal)
			.then((result) => {
        if(abort.signal.aborted) { return; }

        runTransition(nextStateInfo, asyncAction.success, result);
      })
			.catch((e) => {
        // If the request aborted, ignore it. This means that another event
				// came in and we've already transitioned elsewhere.
				if(abort.signal.aborted) { return; }

				runTransition(nextStateInfo, asyncAction.failure, e);
      });
  }
}
```

When the asynchronous action runs, the associated success and failure items are treated as normal transitions, and so we can use the same `runTransition` function that we wrote above. If the action is running and an event arrives that causes a transition, we try to abort the action as well.
