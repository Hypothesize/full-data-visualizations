# Quick start

**1. Install the library.**

```bash
npm install --save git+ssh://git@github.com/willfind/hypothesize-full-data-visualizations
```

**2. Include the library's stylesheet.**

```html
<link
  href="node_modules/hypothesize-visualizations/res/css/global.css"
  rel="stylesheet"
  type="text/css" />
```

See [the styles and themes documentation](../api/styles-and-themes/index.md) for more info.

**3. Import the relevant pieces of the library.**

```js
// some-file.js
import { Store, Visualizations } from "hypothesize-visualizations"
```

**4. Declare resource paths.**

```js
// get a reference to the global store instance
const { store } = Store

// set the base URL from which the web app is served (if necessary)
store.baseURL = "/"

// set the directory path where the visualizations' UI images live
// (feel free to move the images and update this path accordingly!)
store.imageDir = "node_modules/hypothesize-visualizations/res/img"

// set the directory path where the visualizations' worker script bundles live
// (feel free to move the script bundles and update this path accordingly!)
store.workerBundleDir =
  "node_modules/hypothesize-visualizations/dist/worker-bundles"
```

See [the store documentation](../api/store/index.md) for more info.

**5. Load a dataset.**

```js
import { DataFrame } from "@jrc03c/js-math-tools"

let df

// option #1: pass a 2-dimensional array, and then optionally set the row and
// column names
df = new DataFrame([
  [1.2, "a", true, ...],
  [3.4, "b", false, ...],
  [5.6, "c", true, ...],
  ...
])

df.columns = ["col1", "col2", "col3", ...]
df.index = ["row1", "row2", "row3", ...]

// option #2: pass an object whose key-value pairs are column names and 1-
// dimensional arrays, respectively; and then optionally set the row names
df = new DataFrame({
  "col1": [1.2, 3.4, 5.6, ...],
  "col2": ["a", "b", "c", ...],
  "col3": [true, false, true, ...],
  ...
})

df.index = ["row1", "row2", "row3", ...]
```

See [the DataFrame documentation](https://github.com/jrc03c/monorepo/tree/main/packages/js-math-tools#dataframex) for more info.

**6. (Optional) Load or compute the dataset's data types.**

Note that the `DataFrame` containing data types must be the same shape and have the same column and row names as the core dataset `DataFrame`!

```js
const dfTypes = new DataFrame({
  columns: ["col1", "col2", "col3", ...],
  index: ["row1", "row2", "row3", ...],
  values: [
    [
      { type: "float", value: 1.2 },
      { type: "string", value: "a" },
      { type: "boolean", value: true },
      ...
    ],
    [
      { type: "float", value: 3.4 },
      { type: "string", value: "b" },
      { type: "boolean", value: false },
      ...
    ],
    [
      { type: "float", value: 5.6 },
      { type: "string", value: "c" },
      { type: "boolean", value: true },
      ...
    ],
    ...
  ],
})

dfTypes.columns = data.columns.slice()
dfTypes.index = data.index.slice()
```

**7. Create a visualization.**

```js
const { SnapshotVisualization } = Visualizations

SnapshotVisualization({
  el: "#some-container",
  data: df,
  dataTypes: dfTypes, // (if created in the previous step)
}).then(vis => {
  // when you're done with the visualization, unmount it:
  // vis.unmount()
})
```

See [the visualization API documentation](../api/visualizations/index.md) for more info.
