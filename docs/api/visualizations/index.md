### Visualizations

> 🚨 **IMPORTANT:** 🚨 It's very important to set up the store correctly before creating visualizations! Please be sure to read [the store documentation](../store/index.md) before proceeding.

All of the visualizations share the same basic API: they are called as functions and optionally passed an `options` object containing key-value pairs, like this:

<!-- prettier-ignore -->
```js
const options = {
  // ...
}

await Visualization(options)
```

The following `options` keys and values are used by all visualizations. The documentation for each individual visualization down below only describes those keys that are _not_ present on this basic `options` object.

- `colors` = the colors that will be used in the visualization; the nature of the required value differs from visualization to visualization
- `data` = the core dataset as a [`DataFrame`](https://github.com/jrc03c/monorepo/tree/main/packages/js-math-tools#dataframex) instance
- `dataTypes` = the data types of the core dataset as a [`DataFrame`](https://github.com/jrc03c/monorepo/tree/main/packages/js-math-tools#dataframex) instance; each value in the `DataFrame` must be an object with these properties:
  - `type` = a string representing the data type of the value; must be one of `"boolean"`, `"date"`, `"float"`, `"integer"`, `"null"`, `"object"`, or `"string"`
  - `value` = the corresponding value in the core dataset
- `el` = the element in which to embed the visualization; can either be an `Element` or a selector in string form (e.g., `"#my-element"`)
- `shouldReturnComponentOnly` = a boolean; if `true`, then a Vue component is returned; otherwise, a Vue app is returned; the default value is `false`

> 🚨 **IMPORTANT:** 🚨 If you want to use a visualization in a standalone way (i.e., not as part of a larger Vue app), then you'll want to leave `shouldReturnComponentOnly` set to `false` so that a Vue _app_ is returned rather than a Vue _component_. For embedding these visualizations in Hypothesize, you'll almost certainly want to use the visualizations in a standalone way (i.e., as an app) and should therefore leave this value set to `false`.

Here's a fuller example:

<!-- prettier-ignore -->
```js
// get the core data as a DataFrame instance
const coreData = getCoreDataSomehow()

// construct an options object
const options = {
  colors: { ... },
  data: coreData,
  el: "#some-element",
}

// create the visualization
const vis = await Visualization(options)

// then, when you're done with the visualization:
vis.unmount()
```

As mentioned above, the thing returned from the `Visualization` function in this example is a Vue _app_ (not a Vue _component_). Generally, you probably won't need to know much about how Vue apps work; but [here](https://vuejs.org/api/application.html) is the Vue app documentation if you want more info.

#### `CorrelationGridVisualization([options])`

Returns a `Promise` that resolves to a correlation grid visualization app (or component). Accepts the basic `options` object described above with no additional key-value pairs. See the ["Styles and themes"](../styles-and-themes/index.md#correlationsgridvisualization) page for more info about the colors that can be passed into this constructor.

#### `CorrelationNetworkVisualization([options])`

Returns a `Promise` that resolves to a correlation network visualization app (or component). Accepts the basic `options` object described above with no additional key-value pairs. See the ["Styles and themes"](../styles-and-themes/index.md#correlationsnetworkvisualization) page for more info about the colors that can be passed into this constructor.

#### `DistributionsVisualization([options])`

> **NOTE:** This visualization contains multiple individual distribution visualizations. If you only want to draw a single variable's distribution, use one of the single distribution visualizations (`DistributionContinuousVisualization`, `DistributionDiscreteVisualization`, or `DistributionVisualization`) documented below.

Returns a `Promise` that resolves to a distributions visualization app (or component). Accepts the basic `options` object described above with no additional key-value pairs. See the ["Styles and themes"](../styles-and-themes/index.md#distributionsvisualization) page for more info about the colors that can be passed into this constructor.

Note that this is actually a _collection_ of individual `Distribution` visualizations (one per variable). Each individual `Distribution` visualization sub-type is documented below, though I don't know how likely it is that you'll use them individually outside the context of a `DistributionsVisualization` (plural) visualization.

##### `DistributionContinuousVisualization`

Returns a `Promise` that resolves to a continuous distribution visualization app (or component). Accepts the basic `options` object described above along with the following additional key-value pairs:

- `dataType` = a string representing the type of data; will usually be `"number"`, but can also be `"date"`; the default is `"number"`
- `points` = a 2-dimensional array of numbers representing (_x_, _y_) pairs to plot; the shape should be (_p_, 2) where _p_ is the number of points to plot; the default is an empty array

##### `DistributionDiscreteVisualization`

Returns a `Promise` that resolves to a discrete distribution visualization app (or component). Accepts the basic `options` object described above along with the following additional key-value pairs:

- `dataType` = a string representing the type of data (e.g., `"number"`, `"string"`, `"date"`, etc.)
- `points` = a 2-dimensional array of numbers representing (_value_, _count_) pairs to plot where _value_ can be any kind of data (e.g., strings, numbers, dates, etc.); the shape should be (_p_, 2) where _p_ is the number of points to plot; the default is an empty array

##### `DistributionVisualization`

Returns a `Promise` that resolves to a distribution visualization app (or component). Whether the distribution should be drawn discretely or continuously depends on the value of the `distributionType` option described below. Accepts the basic `options` object described above along with the following additional key-value pairs:

- `dataType` = a string representing the type of data (e.g., `"number"`, `"string"`, `"date"`, etc.); the default is `"number"`
- `distributionType` = a string representing the kind of distribution to be drawn; can be `"continuous"` or `"discrete"`; the default is an empty string, meaning that the distribution will not be drawn
- `points` = a 2-dimensional array of values to plot; the exact kinds of values allowed are dependent on the kind of distribution being plotted; the default is an empty array
- `title` = a string representing the name of the variable whose distribution is being drawn; the default is `"Variable"`

Note that this visualization is nothing more than a wrapper around the `DistributionContinuousVisualization` and `DistributionDiscreteVisualization` visualizations. It chooses to use one or the other depending on the values in the `options` object.

#### `KMeansVisualization([options])`

Returns a `Promise` that resolves to a K-means visualization app (or component). Accepts the basic `options` object described above with no additional key-value pairs. See the ["Styles and themes"](../styles-and-themes/index.md#kmeansvisualization) page for more info about the colors that can be passed into this constructor.

#### `PCAVisualization([options])`

Returns a `Promise` that resolves to a PCA visualization app (or component). Accepts the basic `options` object described above with no additional key-value pairs. See the ["Styles and themes"](../styles-and-themes/index.md#pcavisualization) page for more info about the colors that can be passed into this constructor.

#### `SnapshotVisualization([options])`

Returns a `Promise` that resolves to a snapshot visualization app (or component). Accepts the basic `options` object described above with no additional key-value pairs. See the ["Styles and themes"](../styles-and-themes/index.md#snapshotvisualization) page for more info about the colors that can be passed into this constructor.
