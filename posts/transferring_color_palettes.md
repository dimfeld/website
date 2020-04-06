---
title: Shifting Color Palettes using the LCH Color Space
date: 2020-04-03
# updated: 2020-02-27
status: Not fully confident that this is the right way to do it, but I like the results I got this time.
---

Almost every web developer has heard of the RGB system of representing colors, which is a direct corollary to how colors are representing in video hardware. Many of us are familiar with HSL as well, in which a color is represented by hue (representing the raw color), saturation (representing how much white is mixed in to the color), and lightness.

These methods have served us well enough, but ultimately they are not very useful when you want to take a color value, modify it in some way, and have a good idea of how the resulting color will look. In the color world, they say that these color spaces are not perceptually uniform.

This is a well-known problem, and I most recently encountered it on the Tailwind CSS website when I was looking up how to [create my own color palette](https://tailwindcss.com/docs/customizing-colors#generating-custom-color-palettes) in the same way that Tailwind's built-in palettes work.

> Bad news: color is complicated and we've yet to find a tool that does a good job generating these sorts of color palettes. We picked all of Tailwind's default colors by hand, balancing them by eye. Sorry!

At work, our existing site uses the Angular Material Blue-Gray palette, mostly the primary `500` color. I tried copying the entire palette into my Tailwind CSS config, but as more colors were used the results looked drab. Worse, the Tailwind UI components that I have been using tend to use `600` as their primary shade, so everything was rather dark without extra work to shift the color palette.

The entire Material blue-gray palette:
<div class="flex">
<div class="h-12 w-12" style="background-color:#eceff1"></div>
<div class="h-12 w-12" style="background-color:#cfd8dc"></div>
<div class="h-12 w-12" style="background-color:#b0bec5"></div>
<div class="h-12 w-12" style="background-color:#90a4ae"></div>
<div class="h-12 w-12" style="background-color:#78909c"></div>
<div class="h-12 w-12" style="background-color:#607d8b"></div>
<div class="h-12 w-12" style="background-color:#546e7a"></div>
<div class="h-12 w-12" style="background-color:#455a64"></div>
<div class="h-12 w-12" style="background-color:#37474f"></div>
<div class="h-12 w-12" style="background-color:#263238"></div>
</div>


So I was left with the question of how to make a palette which is consistent with the existing website, but also looks like something that I would want to use. My initial decision was just to punt on the decision and figure it out later.

A few days later, Lea Verou wrote a [blog post](http://lea.verou.me/2020/04/lch-colors-in-css-what-why-and-how/) about using the LCH color space in CSS, and also published a great [color tool](https://css.land/lch/) for playing with LCH. LCH, like the somewhat-better-known color space LAB, is a perceptually uniform color space, meaning the human eye perceives a change in the lightness value independent of the other two values of the color. If you're curious about more details, Lea's post does a great job of explaining LCH and how it differs from RGB and HSL.

This seemed like the answer to my dilemna, so I gave it a try. I started with Material blue-gray 500, RGB value `#607d8b`:
<div style="background-color:#607d8b" class="w-12 h-12"></div>

Plugging that into Lea's color picker give an LCH value of `lch(50.534% 13.837 234.058)`. The first value there is the lightness, and the second and third values are the "Chroma" and "Hue," somewhat similar to the Saturation and Hue of HSL. (Again, Lea's post explains this better.)

From there, I took the Tailwind UI "indigo" color palette as my base and copied each color into the LCH color tool. Here, I only cared about getting the lightness values:

<div class="flex flex-col sm:ml-4 my-4">
<div class="flex items-center"><div class="mr-4 bg-indigo-50 h-12 w-12"></div> 50 -- 96.372% lightness</div>
<div class="flex items-center"><div class="mr-4 bg-indigo-100 h-12 w-12"></div> 100 -- 93.54% lightness</div>
<div class="flex items-center"><div class="mr-4 bg-indigo-200 h-12 w-12"></div> 200 -- 87.18% lightness</div>
<div class="flex items-center"><div class="mr-4 bg-indigo-300 h-12 w-12"></div> 300 -- 79.92% lightness</div>
<div class="flex items-center"><div class="mr-4 bg-indigo-400 h-12 w-12"></div> 400 -- 67.781% lightness</div>
<div class="flex items-center"><div class="mr-4 bg-indigo-500 h-12 w-12"></div> 500 -- 53.349% lightness</div>
<div class="flex items-center"><div class="mr-4 bg-indigo-600 h-12 w-12"></div> 600 -- 42.773% lightness</div>
<div class="flex items-center"><div class="mr-4 bg-indigo-700 h-12 w-12"></div> 700 -- 37.477% lightness</div>
<div class="flex items-center"><div class="mr-4 bg-indigo-800 h-12 w-12"></div> 800 -- 29.641% lightness</div>
<div class="flex items-center"><div class="mr-4 bg-indigo-900 h-12 w-12"></div> 900 -- 23.662% lightness</div>
</div>

From there, I used the LCH color tool to create a palette with the Chroma and Hue value of the Material Blue-Gray 500 color, but the lightness values taken from Tailwind's Indigo palette. LCH is not yet widely supported in browsers, so I copied the RGB values out of the tool, and put the resulting palette into my Tailwind config.

```js
lchBlueGray: {
  50: 'rgb(91.1% 96.96% 100%)',
  100: 'rgb(83.93% 94.59% 100%)',
  200: 'rgb(75.61% 87.74% 93.82%)',
  300: 'rgb(67.77% 79.75% 85.73%)',
  400: 'rgb(55.01% 66.73% 72.52%)',
  500: 'rgb(40.41% 51.84% 57.38%)',
  600: 'rgb(30.15% 41.39% 46.73%)',
  700: 'rgb(25.15% 36.32% 41.54%)',
  800: 'rgb(17.9% 29.04% 34.08%)',
  900: 'rgb(12.44% 23.68% 28.56%)',
}
```

And this is how it looks! I like this better because the different shades retain more of the blue of the middle color, while I didn't have to guess to make the brightness match the existing palettes that the Tailwind UI components come with.
<div class="flex">
<div class="h-12 w-12" style="background-color:rgb(91.1% 96.96% 100%)"></div>
<div class="h-12 w-12" style="background-color:rgb(83.93% 94.59% 100%)"></div>
<div class="h-12 w-12" style="background-color:rgb(75.61% 87.74% 93.82%)"></div>
<div class="h-12 w-12" style="background-color:rgb(67.77% 79.75% 85.73%)"></div>
<div class="h-12 w-12" style="background-color:rgb(55.01% 66.73% 72.52%)"></div>
<div class="h-12 w-12" style="background-color:rgb(40.41% 51.84% 57.38%)"></div>
<div class="h-12 w-12" style="background-color:rgb(30.15% 41.39% 46.73%)"></div>
<div class="h-12 w-12" style="background-color:rgb(25.15% 36.32% 41.54%)"></div>
<div class="h-12 w-12" style="background-color:rgb(17.9% 29.04% 34.08%)"></div>
<div class="h-12 w-12" style="background-color:rgb(12.44% 23.68% 28.56%)"></div>
</div>

Compared to the Material Blue-Gray palette I was coming from:

<div class="flex">
<div class="h-12 w-12" style="background-color:#eceff1"></div>
<div class="h-12 w-12" style="background-color:#cfd8dc"></div>
<div class="h-12 w-12" style="background-color:#b0bec5"></div>
<div class="h-12 w-12" style="background-color:#90a4ae"></div>
<div class="h-12 w-12" style="background-color:#78909c"></div>
<div class="h-12 w-12" style="background-color:#607d8b"></div>
<div class="h-12 w-12" style="background-color:#546e7a"></div>
<div class="h-12 w-12" style="background-color:#455a64"></div>
<div class="h-12 w-12" style="background-color:#37474f"></div>
<div class="h-12 w-12" style="background-color:#263238"></div>
</div>

And once again, Tailwinds UI's Indigo:

<div class="flex">
<div class="bg-indigo-50 h-12 w-12"></div>
<div class="bg-indigo-100 h-12 w-12"></div>
<div class="bg-indigo-200 h-12 w-12"></div>
<div class="bg-indigo-300 h-12 w-12"></div>
<div class="bg-indigo-400 h-12 w-12"></div>
<div class="bg-indigo-500 h-12 w-12"></div>
<div class="bg-indigo-600 h-12 w-12"></div>
<div class="bg-indigo-700 h-12 w-12"></div>
<div class="bg-indigo-800 h-12 w-12"></div>
<div class="bg-indigo-900 h-12 w-12"></div>
</div>

Many thanks to [Lea Verou](https://twitter.com/LeaVerou) for putting together such an easy-to-use tool!
