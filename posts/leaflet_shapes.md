---
title: Zoom-Independent Shapes in Leaflet
date: 2020-07-30
cardImage: leaflet-map-arrows.png
cardImageFilter: saturate(200%)
---

The Leaflet JavaScript library is a great base for writing advanced map-based web applications. Leaflet map shapes are defined via latitude and longitude coordinates, which means that they scale in size as the map is zoomed in and out. In most cases this is ok, but sometimes it’s undesirable, so we’ll look at a way to make shapes that stay the same size regardless of the map zoom level.

Say we draw a line between two related places, and want to place arrows on that line to indicate the direction of the relationship. Just as the width of lines is controlled by the `weight` option and is expressed in pixels, we want to be able to express our arrow size in pixels, so that the arrows will be a reasonable size regardless of how far the map is zoomed in.

Leaflet doesn’t offer any automatic way to make our shapes the same size regardless of zoom level. But it’s not too hard to recalculate the arrow size when the zoom level changes, and Leaflet has functions that make this easy.


![Interactive popups in Leaflet](leaflet-map-zoom.gif)

The `layerPointToLatLng` and `latLngToLayerPoint` functions translate points between the latitude/longitude coordinate and actual pixel points on the map. These functions do all the work of accounting for zoom level, the current map location view, and so on.

To keep things simple, our arrows will just be triangles placed on top of the lines. So the process is:
1. Translate the line coordinates into pixels.
2. Figure out where on the line the arrow should go and what its angle should be.
3. Calculate the pixel coordinates of the other parts of the arrow
4. Translate it all back to latitude and longitude.
5. Update the arrow shape with these points.

Our function’s arguments are the line coordinates. It then returns a function which will calculate the coordinates for the arrow shapes. This function can then be called any time we need to update our shapes.

```js
// Length of the sides of the arrow
const arrowSideLength = 15;
 // The angle of the arrow sides from the tip
const arrowSideAngle = Math.PI / 8;
// The height of the arrow from base to tip.
const arrowHeight = arrowSideLength * Math.cos(arrowSideAngle);

function lineCoordinates(map, from, to) {
  let fromPointOrig = map.latLngToLayerPoint(from);
  let toPointOrig = map.latLngToLayerPoint(to);
  let lineAngle = Math.atan2(
	toPointOrig.y - fromPointOrig.y,
    toPointOrig.x - fromPointOrig.x
  );

  return function calculatePoints() {
    return {
	  line: [ from, to ],
      arrow: ... // TBD
    };
  };
}
```

The line coordinates aren’t touched here, but in other applications we may want to alter them slightly so we’ll return then from the function as well.

Let’s start out by making a single arrow and putting it at the center of the line.

One important note when doing this: when calculating points along the line, we must use pixels instead of geo coordinates. Doing it in latitude/longitude space will cause your arrows to drift around the line and the angles to be slightly off, due to differences in the spherical mapping of geo coordinates compared to the planar coordinate space of pixels.

Since we have to convert to pixel coordinates anyway, this is just a matter of making sure to do that first and use the pixel numbers for all the math.

It also looks best to move the arrow a little bit back along the line, so that the center of the arrow is centered on the line, not the point of the arrow. For long lines this doesn’t matter much, but if you don’t do it then the arrow can look very out of place on shorter lines.

```js
// Calculate how much to bump the arrow.
let xBump = Math.cos(lineAngle) * (arrowHeight / 2);
let yBump = Math.sin(lineAngle) * (arrowHeight / 2);

return function calculatePoints() {
  // Get the current pixel coordinates of the ends of the line.
  let toPoint = map.latLngToLayerPoint(to);
  let fromPoint = map.latLngToLayerPoint(from);

  // The arrow will be in the center of the line.
  let arrowTipPixels = L.point(
    (toPoint.x + fromPoint.x) / 2 - xBump,
    (toPoint.y + fromPoint.y) / 2 - yBump,
  );

  let arrowTip = map.layerPointToLatLng(arrowTipPixels);

  // We'll fill this in next.
  let leftPoint = ...;
  let rightPoint = ...;

  return {
	line: [ from, to ],
    arrow: [
	  [ leftPoint, arrowTip, rightPoint ]
	],
  };
};
```

We have the arrow placed and the angles all ready, so now it’s just a matter of calculating where the other points on the arrow should go.

```js
const calcOffset = (angle) => {
  let x = arrowSideLength * Math.cos(angle);
  let y = arrowSideLength * Math.sin(angle);
  return L.point(x, y);
};

let leftOffset = calcOffset(lineAngle - arrowSideAngle);
let rightOffset = calcOffset(lineAngle + arrowSideAngle);

let leftPoint = map.layerPointToLatLng(arrowTipPixels.add(leftOffset));
let rightPoint = map.layerPointToLatLng(arrowTipPixels.add(rightOffset));

return {
  line: [ from, to ],
  arrow: [
    [ leftPoint, arrowTip, rightPoint, leftPoint ]
  ]
};
```

# Using It
For each line, we add it initially, and then also listen to `zoom` events from the map to update the arrow placement.

```js
let lines = [];

function createLine(from, to) {
	let calcLine = lineCoordinates(map, from, to);
    let paths = calcLine();
    let arrow = L.polyline(paths.arrow, { ...other options });
    let line = L.polyline(paths.line, { ... other options });

	arrow.addTo(map);
	line.addTo(map);

	lines.push({ line, arrow, calcLine });
}

map.addEventListener('zoom', () => {
  for(let { arrow, calcLine } of lines) {
	arrow.setLatLngs(linePath().arrow);
    arrow.redraw();
  }
});
```


# Multiple Arrows
This works fine. But for long lines that extend off the map, we may not see the arrow and so its usefulness is lost. One approach is to draw multiple arrows on the line. This requires just a few changes to our code above

First, we’ll need a way to decide how many arrows to draw on the line.

```js
const minArrowSpacing = 250; // in pixels
// If a line is shorter than this, omit it completely.
const omitArrowThreshold = 40;
let lineLength = Math.sqrt(
  (toPoint.x - fromPoint.x) ** 2 +
  (toPoint.y - fromPoint.y) ** 2
);

let numArrows = lineLength > omitArrowThreshold ?
 Math.max(Math.floor(lineLength / minArrowSpacing), 1) : 0;
```

Once we know how many arrows to draw, we space them evenly along the line.

```js
// Move the arrow by this much every time to get evenly spaced arrows.
let delta = L.point(
  (toPoint.x - fromPoint.x) / (numArrows + 1),
  (toPoint.y - fromPoint.y) / (numArrows + 1)
);

// Similar to before, except now we're starting at fromPoint
// and will add `delta` each time.
let arrowTipPixels = L.point(
  fromPoint.x + xBump,
  fromPoint.y - yBump
);

let arrowPaths = new Array(numArrows);
for(let i = 0; i < numArrows; ++i) {
  arrowTipPixels = arrowTipPixels.add(delta);

  let arrowTip = map.layerPointToLatLng(arrowTipPixels);
  let leftPoint = map.layerPointToLatLng(arrowTipPixels.add(leftOffset));
  let rightPoint = map.layerPointToLatLng(arrowTipPixels.add(rightOffset));
  arrowPaths[i] = [ leftPoint, arrowTip, rightPoint, leftPoint ];
}

return {
  line: [ from, to ],
  arrow: arrowPaths,
};
```

The code from above that uses this function remains the same. So with that, we are able to make shapes that retain their size regardless of zoom level, so we don’t have to worry about them being unusably small or ridiculously large. This technique isn’t always appropriate, but for the right use case, it can help a lot.

<div data-component="Repl" data-prop-id="92058b31e5424fc09b476795bb6cc59a">

You can check out a working example in the [Svelte REPL](https://svelte.dev/repl/92058b31e5424fc09b476795bb6cc59a?version=3.24.0).

</div>
