# Styles and themes

There are two routes by which you can change the look of visualizations:

1. CSS rules and/or variables
2. color values passed to visualization functions in JS

Most visualizations consist of some HTML elements wrapped around a `<canvas>` element.

The first of the above options — CSS rules and/or variables — can modify both HTML elements _and_ colors drawn on canvases.

The second option — color values passed to visualization functions in JS — can _only_ modify colors drawn on canvases.

I recommend defining as many colors in CSS as possible and only using the JS option when necessary. I think this makes everything a bit tidier for two reasons: (1) CSS is where most style rules go anyway; and (2) colors defined in CSS can more easily be shared across contexts.

## CSS rules and variables

I tried to write as few styles as possible, hoping to leave the bulk of the styling work to the Hypothesize stylesheets; and I also tried to stick to styling HTML semantic elements rather than relying on classes — though I felt in the end that at least a few classes were necessary. The CSS rules and variables that are meant to apply globally across elements and visualizations are stored in `/res/css/global.css`.

Here are the variables (along with their default values) that can be overridden:

<!-- prettier-ignore -->
```css
:root {
  --border-radius: 4px;

  --box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.15);

  --color-danger-1: hsl(345deg, 85%, 5%);
  --color-danger-2: hsl(345deg, 85%, 12.5%);
  --color-danger-3: hsl(345deg, 85%, 20%);
  --color-danger-4: hsl(345deg, 85%, 27.5%);
  --color-danger-5: hsl(345deg, 85%, 35%);
  --color-danger-6: hsl(345deg, 85%, 42.5%);
  --color-danger-7: hsl(345deg, 85%, 50%);
  --color-danger-8: hsl(345deg, 85%, 57.5%);
  --color-danger-9: hsl(345deg, 85%, 65%);
  --color-danger-10: hsl(345deg, 85%, 72.5%);
  --color-danger-11: hsl(345deg, 85%, 80%);
  --color-danger-12: hsl(345deg, 85%, 87.5%);
  --color-danger-13: hsl(345deg, 85%, 95%);

  --color-gray-1: hsl(0deg, 0%, 5%);
  --color-gray-2: hsl(0deg, 0%, 12.5%);
  --color-gray-3: hsl(0deg, 0%, 20%);
  --color-gray-4: hsl(0deg, 0%, 27.5%);
  --color-gray-5: hsl(0deg, 0%, 35%);
  --color-gray-6: hsl(0deg, 0%, 42.5%);
  --color-gray-7: hsl(0deg, 0%, 50%);
  --color-gray-8: hsl(0deg, 0%, 57.5%);
  --color-gray-9: hsl(0deg, 0%, 65%);
  --color-gray-10: hsl(0deg, 0%, 72.5%);
  --color-gray-11: hsl(0deg, 0%, 80%);
  --color-gray-12: hsl(0deg, 0%, 87.5%);
  --color-gray-13: hsl(0deg, 0%, 95%);

  --color-info-1: hsl(210deg, 85%, 5%);
  --color-info-2: hsl(210deg, 85%, 12.5%);
  --color-info-3: hsl(210deg, 85%, 20%);
  --color-info-4: hsl(210deg, 85%, 27.5%);
  --color-info-5: hsl(210deg, 85%, 35%);
  --color-info-6: hsl(210deg, 85%, 42.5%);
  --color-info-7: hsl(210deg, 85%, 50%);
  --color-info-8: hsl(210deg, 85%, 57.5%);
  --color-info-9: hsl(210deg, 85%, 65%);
  --color-info-10: hsl(210deg, 85%, 72.5%);
  --color-info-11: hsl(210deg, 85%, 80%);
  --color-info-12: hsl(210deg, 85%, 87.5%);
  --color-info-13: hsl(210deg, 85%, 95%);

  --color-primary-1: hsl(270deg, 85%, 5%);
  --color-primary-2: hsl(270deg, 85%, 12.5%);
  --color-primary-3: hsl(270deg, 85%, 20%);
  --color-primary-4: hsl(270deg, 85%, 27.5%);
  --color-primary-5: hsl(270deg, 85%, 35%);
  --color-primary-6: hsl(270deg, 85%, 42.5%);
  --color-primary-7: hsl(270deg, 85%, 50%);
  --color-primary-8: hsl(270deg, 85%, 57.5%);
  --color-primary-9: hsl(270deg, 85%, 65%);
  --color-primary-10: hsl(270deg, 85%, 72.5%);
  --color-primary-11: hsl(270deg, 85%, 80%);
  --color-primary-12: hsl(270deg, 85%, 87.5%);
  --color-primary-13: hsl(270deg, 85%, 95%);

  --color-success-1: hsl(130deg, 75%, 5%);
  --color-success-2: hsl(130deg, 75%, 12.5%);
  --color-success-3: hsl(130deg, 75%, 20%);
  --color-success-4: hsl(130deg, 75%, 27.5%);
  --color-success-5: hsl(130deg, 75%, 35%);
  --color-success-6: hsl(130deg, 75%, 42.5%);
  --color-success-7: hsl(130deg, 75%, 50%);
  --color-success-8: hsl(130deg, 75%, 57.5%);
  --color-success-9: hsl(130deg, 75%, 65%);
  --color-success-10: hsl(130deg, 75%, 72.5%);
  --color-success-11: hsl(130deg, 75%, 80%);
  --color-success-12: hsl(130deg, 75%, 87.5%);
  --color-success-13: hsl(130deg, 75%, 95%);

  --color-warning-1: hsl(50deg, 100%, 5%);
  --color-warning-2: hsl(50deg, 100%, 12.5%);
  --color-warning-3: hsl(50deg, 100%, 20%);
  --color-warning-4: hsl(50deg, 100%, 27.5%);
  --color-warning-5: hsl(50deg, 100%, 35%);
  --color-warning-6: hsl(50deg, 100%, 42.5%);
  --color-warning-7: hsl(50deg, 100%, 50%);
  --color-warning-8: hsl(50deg, 100%, 57.5%);
  --color-warning-9: hsl(50deg, 100%, 65%);
  --color-warning-10: hsl(50deg, 100%, 72.5%);
  --color-warning-11: hsl(50deg, 100%, 80%);
  --color-warning-12: hsl(50deg, 100%, 87.5%);
  --color-warning-13: hsl(50deg, 100%, 95%);

  --font-family-body: Inter, Roboto, "Helvetica Neue", "Arial Nova", "Nimbus Sans", Arial, sans-serif;
  --font-family-code: monospace;
  --font-family-title: Seravek, "Gill Sans Nova", Ubuntu, Calibri, "DejaVu Sans", source-sans-pro, sans-serif;

  --font-size-1: 3rem;
  --font-size-2: 2.5rem;
  --font-size-3: 2rem;
  --font-size-4: 1.5rem;
  --font-size-5: 1rem;
  --font-size-6: 0.85rem;
  --font-size-7: 0.6rem;
  --font-weight-body: 400;
  --font-weight-code: 400;
  --font-weight-title: 700;

  --line-thickness: 2px;
  --padding: 1.5em;

  /* correlation grid visualization variables */
  --vis-corr-grid-color-negative: orange;
  --vis-corr-grid-color-positive: dodgerblue;

  /* correlation network visualization variables */
  --vis-corr-network-color-negative: orange;
  --vis-corr-network-color-positive: dodgerblue;

  /* distributions visualization variables */
  --vis-dists-colors-continuous:
    hsl(0deg, 100%, 50%),
    hsl(60deg, 100%, 50%),
    hsl(120deg, 100%, 50%),
    hsl(180deg, 100%, 50%),
    hsl(240deg, 100%, 50%),
    hsl(300deg, 100%, 50%);
  --vis-dists-colors-discrete:
    hsl(0deg, 100%, 25%),
    hsl(60deg, 100%, 25%),
    hsl(120deg, 100%, 25%),
    hsl(180deg, 100%, 25%),
    hsl(240deg, 100%, 25%),
    hsl(300deg, 100%, 25%);

  /* k-means visualization variables */
  --vis-k-means-color-background: #666666;
  --vis-k-means-colors-cluster:
    cyan,
    yellow,
    magenta,
    lime,
    orange,
    dodgerblue,
    gray;

  /* pca visualization variables */
  --vis-pca-color-negative: orange;
  --vis-pca-color-positive: dodgerblue;

  /* snapshot visualization variables */
  --vis-snapshot-color-boolean: hsl(348, 100%, 61%);
  --vis-snapshot-color-date: hsl(48, 100%, 67%);
  --vis-snapshot-color-empty: rgb(235, 235, 235);
  --vis-snapshot-color-float: hsl(204, 86%, 53%);
  --vis-snapshot-color-integer: hsl(204, 86%, 75%);
  --vis-snapshot-color-null: rgb(235, 235, 235);
  --vis-snapshot-color-number: hsl(204, 86%, 53%);
  --vis-snapshot-color-object: #b542e0;
  --vis-snapshot-color-string: hsl(141, 71%, 48%);
  --vis-snapshot-cell-border-thickness: 1px;
}
```

The main color palette for HTML elements currently look like this:

![](https://i.ibb.co/mRyc4sC/colors.png)

The styles that are specific to each visualization are mostly contained within the visualization's JS file. For example, the styles that are specific to the snapshot visualization are stored in the `/res/js/src/visualizations/snapshot.mjs` file (along with the relevant HTML and JS).

## Color values in JS

Every visualization's constructor has roughly the same signature: it takes an `options` object. See [the relevant docs page](../visualizations/index.md) for more info. For the purposes of styling the visualization itself, colors can be passed in a `colors` property in the `options` object, like this:

```js
new Visualization({
  colors: { ... },
})
```

However, the exact way this `colors` property must be defined differs from visualization to visualization. Those definitions are listed below.

Keep in mind that visualization colors can also be defined using the CSS variables mentioned above.

> **NOTE:** Values passed into the visualization function via the `options` object will take precedence over CSS variable values!

### `CorrelationsGridVisualization`

For the `CorrelationsGridVisualization`, the `colors` property must be an object with `positive` and `negative` properties, each of which represent a single color in any valid CSS format. For example:

```js
new CorrelationsGridVisualization({
  colors: {
    negative: "red",
    positive: "#0000bb",
  },
})
```

Alternatively, you can assign values to these CSS variables:

```css
:root {
  --vis-corr-grid-color-negative: red;
  --vis-corr-grid-color-positive: #0000bb;
}
```

### `CorrelationsNetworkVisualization`

For the `CorrelationsNetworkVisualization`, the `colors` property must be an object with `positive` and `negative` properties, each of which represent a single color in any valid CSS format. For example:

```js
new CorrelationsNetworkVisualization({
  colors: {
    negative: "hsl(45deg, 100%, 50%)",
    positive: "rgb(0, 255, 255)",
  },
})
```

Alternatively, you can assign values to these CSS variables:

```css
:root {
  --vis-corr-network-color-negative: red;
  --vis-corr-network-color-positive: #0000bb;
}
```

### `DistributionsVisualization`

For the `DistributionsVisualization`, the `colors` property must be an object with `continuous` and `discrete` properties, each of which represent an array of colors in any valid CSS format. For example:

```js
new DistributionsVisualization({
  colors: {
    continuous: ["red", "orange", "yellow"],
    discrete: ["green", "blue", "purple"],
  },
})
```

One `continuous` color is used for each continuous distribution visualization. So, in the example above, the first continuous distribution visualization would be red, the second would be orange, and the third would be yellow. If there are more than three continuous visualizations, then the colors are used again in the same order. For example, the fourth continuous distribution visualization would be red, the fifth would be orange, etc.

All of the `discrete` colors are used for each discrete distribution visualization; each bar in the visualization is given one color. Like the `continuous` colors, the `discrete` colors are used in order until exhausted, and then used again in the same order, _ad infinitum_. So, in the example above, the first bar of a discrete distribution visualization would be green, the second would be blue, the third would be purple, the fourth would be green, the fifth would be blue, etc.

These colors can also be defined via CSS variables:

<!-- prettier-ignore -->
```css
:root {
  --vis-dists-colors-continuous:
    hsl(0deg, 100%, 50%),
    hsl(60deg, 100%, 50%),
    hsl(120deg, 100%, 50%),
    hsl(180deg, 100%, 50%),
    hsl(240deg, 100%, 50%),
    hsl(300deg, 100%, 50%);
  --vis-dists-colors-discrete:
    hsl(0deg, 100%, 25%),
    hsl(60deg, 100%, 25%),
    hsl(120deg, 100%, 25%),
    hsl(180deg, 100%, 25%),
    hsl(240deg, 100%, 25%),
    hsl(300deg, 100%, 25%);
}
```

In both cases — either when passing colors via the `options` object in JS or when defining colors via CSS variables — the _number_ of colors is arbitrary. If you supply 20 colors but only end up drawing 3 variable distribution plots, then only the first 3 of the 20 colors will be used. Conversely, if you only supply 3 colors but end up drawing 20 variable distribution plots, then the 3 colors will be recycled over and over again in the same order until the number of plots is exhausted.

### `KMeansVisualization`

For the `KMeansVisualization`, the `colors` property must be an object with `background` and `cluster` properties. The `background` property represents a single string in any valid CSS format. The `cluster` property represents an array of strings in any valid CSS format. For example:

```js
new KMeansVisualization({
  colors: {
    background: "black",
    clusters: [
      "red",
      "orange",
      "yellow",
      "green",
      "blue",
      "purple",
      "brown",
      "pink",
      "white",
      "gray",
    ],
  },
})
```

Alternatively, you can assign values to these CSS variables:

<!-- prettier-ignore -->
```css
:root {
  --vis-k-means-color-background: #666666;
  --vis-k-means-colors-cluster:
    cyan,
    yellow,
    magenta,
    lime,
    orange,
    dodgerblue,
    gray;
}
```

As the names imply, the `background` color will be applied to the background of the visualization; and each cluster of points will receive one `cluster` color. If the number of clusters exceeds the number of colors, then the colors will be re-used in the same order. In both cases — either when passing colors via the `options` object in JS or when defining colors via CSS variables — the _number_ of colors listed for clusters is arbitrary.

### `PCAVisualization`

For the `PCAVisualization`, the `colors` property must be an object with `negative` and `positive` properties, each of which represent strings in any valid CSS format. For example:

```js
new PCAVisualization({
  colors: {
    negative: "orange",
    positive: "purple",
  },
})
```

Alternatively, you can assign values to these CSS variables:

```css
:root {
  --vis-pca-color-negative: orange;
  --vis-pca-color-positive: dodgerblue;
}
```

### `SnapshotVisualization`

For the `SnapshotVisualization`, the `colors` property must be an object with `boolean`, `date`, `empty`, `float`, `integer`, `object`, and `string` properties, each of which represents a string in any valid CSS format. For example:

```js
new SnapshotVisualization({
  colors: {
    boolean: "hsl(348, 100%, 61%)",
    date: "hsl(48, 100%, 67%)",
    empty: "rgb(235, 235, 235)", // (i.e., null, NaN, undefined, etc.)
    float: "hsl(204, 86%, 53%)",
    integer: "hsl(204, 86%, 75%)",
    object: "#b542e0",
    string: "hsl(141, 71%, 48%)",
  },
})
```

Alternatively, you can assign values to these CSS variables:

```css
:root {
  --vis-snapshot-color-boolean: hsl(348, 100%, 61%);
  --vis-snapshot-color-date: hsl(48, 100%, 67%);
  --vis-snapshot-color-empty: rgb(235, 235, 235);
  --vis-snapshot-color-float: hsl(204, 86%, 53%);
  --vis-snapshot-color-integer: hsl(204, 86%, 75%);
  --vis-snapshot-color-null: rgb(235, 235, 235);
  --vis-snapshot-color-number: hsl(204, 86%, 53%);
  --vis-snapshot-color-object: #b542e0;
  --vis-snapshot-color-string: hsl(141, 71%, 48%);
  --vis-snapshot-cell-border-thickness: 1px;
}
```
