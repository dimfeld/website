---
title: Interactive Visualizations with Crossfilter
date: 2020-05-19
confidence: In progress and largely untested so far
---

[Crossfilter](https://crossfilter.github.io/crossfilter/) is a library for helping to manage data with multiple linked visualizations. Selecting a range of data on one graph will filter for that range on all the graphs. The official example on the Crossfilter home page has bar graphs of airplane travel statistics, with histogram graphs for things like distance traveled, how late the flight was, and the time of day it flew.

Selecting 10AM through 11AM on the "time of day" graph will cause all the other graphs to also filter on flights from those times, while still retaining their own groupings over that data. And filters can be set on each graph, with all of them applying appropriately to all the data. This is where the magic of crossfilter really comes in. It manages all the filter changes for you in a fairly transparent process.

So let's get into it. [`crossfilter`](https://github.com/crossfilter/crossfilter/wiki/API-Reference#wiki-crossfilter) is the primary object and it owns the data. You can give it an array of data as you create the `crossfilter`, or use the `add` and `remove` functions to modify the list of data after creation.

A `crossfilter` object on its own isn't too useful. To do anything with the data, you create dimensions on the crossfilter, and groups on the dimensions.

A `dimension` creates an ordering on the objects in the data. Often the dimension just exposes a single value from the object: `cf.dimension((d) => d.value)`. But the function can do whatever you want, so long as it returns the same value each time it is called for an object.

Dimensions have `top` and `bottom` functions that can be used to get the first and last N values in the dimension that are not filtered out.


## Groups and Reducers

Once you have a dimension, you [create groups](https://github.com/crossfilter/crossfilter/wiki/API-Reference#wiki-dimension_group) from that dimension: `dim.group((value) => Math.floor(value / 10))`. A group takes all the values from the dimension and puts them into bins according to the value returned by the group function.

Sometimes, you want every value in the dimension to be its own bin. This is common in the case where the dimension is a category and only have a few values. For this case, you can just pass nothing to the group function: `dim.group()`.

For each bin, the group creates a value by summing over all the objects that fall into the bin. The default is to just count the number of values in the bin. But you can control this in other ways. The [`group.reduce`](https://github.com/crossfilter/crossfilter/wiki/API-Reference#wiki-group_reduce) function can control how the bin's accumulated value is modified as items are added and removed. Notably, reducers are passed the entire object, not just the dimension value.

Crossfilter also provides simple functions for the most common cases. If the bin's value should be the sum of all the `total` values in the data objects, `group.reduceSum((d) => d.total)` can do this instead of defining multiple functions for the standard `reduce` function.

Groups expose the `all` function for returning all the bins, or the `top` or `bottom` functions can be used when you only want certain groups.

```js
const data = [
  { value: 15, total: 20 },
  { value: 17, total: 10 },
  { value: 25, total: 3 },
  { value: 27, total: 5 },
  { value: 23, total: 7 },
];

const cf = crossfilter(data);
const valDim = cf.dimension((d) => d.value);
const valGroup = valDim.group((value) => Math.floor(value / 10) * 10).reduceSum((d) => d.total);

valGroup.all() === [
  { key: 1, value: 30 }, // Sum of the first two items
  { key: 2, value: 15 },
]
```

## Filtering

Filtering is done on the dimensions, and affects which values go into the all of the crossfilter's groups. Dimensions can be filtered on a single value, or on a range of values. You can pass a function as well though this is discouraged for large datasets as it prevents some performance optimizations.

Notably, the values for a particular group will be filtered by all the active filters **except** for the dimension that it belongs to. Going back to the airplane example, if you filter by arrival time, distance flown, and how late the flight was, the group for the arrival time will only have the filters for distance and lateness applied to it. This allows the graph to more clearly show which arrival time values are filtered or not, as seen in the official example where active values are blue and inactive values are gray.

`dim.filterAll()` can be used to remove a filter on a dimension.

## Reacting to changes

The easiest way is to use `cf.onChange(handler)`. Crossfilter passes a value to the handler that says whether the change was data being added or removed, or a change in the filters.
