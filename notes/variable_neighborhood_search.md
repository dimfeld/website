---
title: Variable Neighborhood Search
date: 2018-11-19
summary: A technique for solving NP-complete problems with multiple local minima
confidence: Not an expert, but I've read a bunch of papers and written an implementation. I assume a passing familiarity with terminology around gradient descent.
---

There are some old notes I've cleaned up a little and copied here in preparation for maybe writing a longer article.

Variable Neighborhood Search (VNS) is an approximation algorithm based on three observations.

1. A local minimum with respect to one neighborhood structure is not necessarily so for another.
2. A global minimum is a local minimum with respect to all possible neighborhood structures.
3. For many problems, local minima with respect to one or several neighborhoods are relatively close to each other.

A "neighborhood" is simply a function that takes in the state and returns a modified version of that state.

# Initalization Choices

- /f/  - the scoring function
- X - The set of possibilities
- N(x) - the neighborhood structure
- x - the initial solution

# Algorithms

The overall algorithm is made up of a few different subalgorithms, which combine to create a few different variations on the technique.

## Variable Neighborhood Descent (VND)

A standard way to search through a space is the steepest descent heuristic. This is most well-known from training neural nets though the technique predates it.

The steps for basic Steepest Descent are:

1. Given an existing state x of the data, find x’ = the smallest value of f(x) for all perturbations in N(x).
2. If f(x’) < f(x), set x = x’ and repeat step 1. Otherwise stop.

Since it may not be feasible to iterate over every possible neighborhood perturbation in every iteration, an alternative is to stop after you find the first perturbation that results in a score reduction.

VND is based on fact 1. Since a local optimum for one type of move may not be a local optimum for another type of move, we can combine descent heuristics to get closer to the global optimum.

### Steps for VND

0. Initialize: Choose set of neighborhoods that will be used and find the initial solution x.
1. Start with the first neighborhood.
2. *Local Search*: Find the best neighbor x’ of x using the steepest descent method with the current neighborhood.
3. If x’ is better than x, then x' becomes the new value of x, and go back to step 1. Otherwise go to the next neighborhood and go to step 2.

This brings up a number of questions.

- What is the complexity of the different neighborhoods? -- Moves that take too many operations may be very slow to converge and actually require more time than the exact solution in some cases.
- What is the best order to apply them? -- Often moves are ordered by the complexity of their application. Some variants apply all the moves at once, so long as descent is made for some neighborhood in the series.
- Are these moves sufficient to throughly explore the region? -- Too-simple moves may not leave a “narrow valley”
- How precise a solution do we need?

As an example of VND for placing facilities in a region, we might have two neighborhood structures. The first does a greedy search for placing a new facility and the other does an interchange, moving an existing facility elsewhere. These two would be applied in turn until the algorithm halts.

## Reduced Variable Neighborhood Search

Assume we’ve found a local minimum. We want to leave this valley and find a deeper one, if it exists.

### Motivations

- Which direction to go? -- Simplest answer is to choose randomly
- How far? -- Since local minima tend to be close together, we should start with small steps.
- If the moves don’t get us out of the valley, how do we modify them? -- Go farther! Usually this takes the form of each of the neighborhood structures building upon the previous one to create a larger or more complex move (this is called nesting).

### Steps
			* 	Init: Select a set of neighborhood structures, find initial solution, choose stopping condition, etc.
			* 	1. Select neighborhood 1
			* 	2. *Shaking*: Take a randomly selected change from the current neighborhood.
			* 	3. If it’s better, use it and go back to step 1
			* 	4. Otherwise, check the stopping condition, and then go to the next structure and go to step 2.

## Basic Variable Neighborhood Search
		* 	This combines the VND and RVNS methods above into a single method so that we have systematic movement around the current local minimum and also the possibility of a random jump into a better minimum.
		▾	Steps
			* 	Init: Select neighborhoods N (1 to kmax), initial solution x, stopping condition.
			* 	1. Set k = 1
			* 	2. Shaking: x’ = a random move in Nk.
			* 	3. Local Search: x’’ = the result of the local search from x’
			* 	4. If x’’ is better than x, set x = x’’ and jump to step 1.
			* 	5. Otherwise increment k. If k = kmax, check the stopping condition and jump back to step 1.

## General Variable Neighborhood Search
		* 	This is the general one to use when you don’t have a specific reason to do otherwise. It is similar to the basic VNS, but uses VND as the local search step. We may use different neighborhood selections for the shaking step and the VND step, but it is not required.
### Neighborhood Selection
		▾	What properties of the neighborhoods are mandatory to be able to find a near-optimal solution
			* 	The union of all the neighborhoods should cover the entire set of feasible solutions to guarantee this.
		* 	What properties are helpful for finding a near-optimal solution?
		▾	Should neighborhoods be nested, and if not, how should they be ordered?
			* 	Nesting can easily be done by performing a type of move, and then having the next neighborhood make a similar move
		▾	What are desirable properties of neighborhood size?
			* 	Size should go up as we iterate through neighborhoods.

## Skewed VNS
		* 	Some problems have local minima that are spaced far apart, and so if we happen to jump into one we probably want to explore around there.
		* 	With an extremely large neighborhood, we might jump into one of these other minima, and so it can be desirable to try out a not-quite-the-best solution if it’s sufficiently far away from the current best solution.
		* 	In this method, after we move we check if the candidate solution is better than or worse-but-within-a-tolerance of the best solution, and if it is then we move the search space to it.
		* 	Throughout the process, we remember the best solution even if we’re not currently looking at it.
		▾	Should we do this?
			* 	The easiest way to answer the question is to run VNS for a short period of time from a bunch of different starting conditions and see if they end up in very different states with good solutions.

## Variable Neighborhood Decomposition Search
		* 	This scheme changes the local search option to select a subset of the space relating to the space modified by the neighborhood and optimize just that region. The optimization process used can be VNS again, applied to just that region.

# Further Research for Approaching a Problem with VNS
		▾	Initialization Conditions
			* 	VNS results tend to not be too dependent on the initialization conditions, so long as the neighborhoods are defined well, and so simpler conditions are better.
		▾	Neighborhood Selection
			* 	Do research on the neighborhoods used by other approaches to the problem. They tend to be reusable in VNS.
		▾	Distribution of Neighborhoods
			* 	Should neighborhoods be assigned to the local search phase, the shaking phase, or both?
		▾	Ancillary Tests
			* 	Some additional logic can be used to make the “random” selection less random, if we know some useful things about the problem that can help with selection.
