---
title: CSS Grid
date: 2020-08-30
tags: CSS, cheat_sheet
---

This is a compressed version of the overview at https://scotch.io/tutorials/deep-dive-into-css-grid-2.


# Definitions

“Grid lines“ are like lines between cells on a spreadsheet.
“Grid tracks” are the rows and columns in the grid, where the content actually goes.
Cells are the individual spaces in the tracks where content goes.
Areas are cells combined together when they span more than one row or column.

# Settings

`display:grid` sets the element to be a container for a grid layout.

## `fr` units

These units are new for Grid layout. `fr` stands for fraction, and `1fr` represents one unit of space out of the sum of the `fr` units.

So `3fr 4fr 3fr` would be 10 in all with the space allocated proportionally.

When fixed units are used alongside fractions, the fixed units get their space and the rest is allocated proportionally to the fractions.

## Column and Row Sizes


`grid-template-columns` defines the grid column layout. It takes a variety of values. `100px 100px 100px` defines three columns each of 100px width, for example.

`grid-template-rows` works just like `grid-template-columns` but for rows.

If either rows or columns is omitted, the widest/longest element in the row or column is used for all elements.

`grid-template` is shorthand for rows, columns, and `grid-template-areas`

`grid-auto-columns` defines the size of columns not explicitly specified in the template. Likewise for `grid-auto-rows`

`grid-auto-flow` defines how grid cells are added into the grid. `row` is the default which means that they go horizontally filling a row first and then going on to the next row. `column` can also be used to go vertically.

`grid-row-gap` and `grid-column-gap` define spacing between cells

`minmax(min, max)` sets flexible sizing, with the size clamped to the values given

`width: auto` tells the item to use as much space as possible given the constraints of the other items.

`width: fitcontent(200px)` works like `auto` but with a maximum size


## Placing Cells

Grid items can use `grid-row-start` and `grid-row-end` to define starting and ending grid indexes to span multiple grid spaces.

`grid-row` and `grid-column` are shorthand for the start and end properties

`grid-column: 3 / 5` would start at column 3 and end at column 5

`grid-area: rowstart / columnstart / rowend / columnend` can also be used

You can use negative numbers to indicate offsets from the end: `1 / -1` would span the entire row or column.

Instead of absolute widths you can use `span` to indicate widths.

`3 / span 2` to start at 3 with a width of 2, or `span 2/ 5` to end at 5 and go back 2 from there.

`grid-auto-flow: dense` can allow the grid system to place cells in the first empty grid spot, even if it’s before other items in the logical order.

`order` sets the order in which cells appear if you want to do so explicitly.

## grid-template-area

This allows you to name different areas of the grid

```css
grid-template-areas:
  "header     header   header"
  "sidebar-1  content  sidebar-2"
  "footer     footer   footer";
```

When cells have the same name, CSS combines them into a single area that spans multiple cells.
You can then use `grid-area: thename` to indicate that an element should go in a particular grid spot.
A `.` can indicate that a cell should be empty.

`grid-template` combines the areas and the sizes into a single setting.

```css
grid-template:
  "header header header" 80px
  "nav article article" 200px
   / 100px auto;
```

 The size at each line is the height of the row, and then the sizes after the slash at the end are the column widths.

## Repeating

`repeat` just repeats some layout some number of times.

`repeat(3, 1fr 2fr)`  expands to `1fr 2fr 1fr 2fr 1fr 2fr`

`repeat` can be interspersed with other values too

`repeat(auto-fill, values)` repeats the values as much as possible without overflowing.

`auto-fit` works like `auto-fill` but empty tracks are collapsed.

`grid-template-columns: repeat(auto-fill, minmax(50px, 1fr))` is a commonly-used technique to fit as many equally-spaced columns as possible, keeping a minimum width too.
