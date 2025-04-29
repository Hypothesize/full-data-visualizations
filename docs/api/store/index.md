# Store

> **NOTE:** Visualizations reference a global store instance that's created automatically. When I mention "the store" below, I'm referring to that global store instance.

The store is responsible for virtually everything data-related. It acts as an intermediary between (1) the visualizations, (2) the computations and the Web Workers in which those computations run, and (3) the browser's local storage. It also provides an image directory path and a web worker script bundle directory path to the visualizations. Its duties primarily include these things:

- When "core" data is passed to a function that creates a visualization (e.g., `SnapshotVisualization`), the newly-made visualization passes that core data to the store for safekeeping. The store makes that core data available to other visualizations that might be instantiated later.
- When a visualization needs some particular computation to be run on the core data, it requests the results of that computation from the store. The store then determines whether or not the computation needs to be run (or re-run); i.e., it makes a decision either (1) to hand over the cached results of a previous run of the computation, or (2) to re-run the computation and then to hand over the new results. It makes this decision based on whether or not the core data set has changed since the last time the computation was run. The store strives to be as "lazy" as possible and only runs computations exactly when they're needed. This means that, even if the core data changes, no computation will be re-run until a newly-instantiated visualization requests the results of that computation.
- For every change made to the core data, and for every computation that's run, the core data and all computation results are cached to the browser's storage. By default, the storage back-end is an `IndexedDB` database. However, `localStorage` can also be used, though it often doesn't work very well (or at all) for large datasets. When the page is reloaded, all cached data and computation results are pulled out of the browser's storage so that the store can continue functioning as though there had been no interruption.
- It provides the base URL at which the web app is served (e.g., "/whatever"), the directory path relative to the base URL in which images are stored (e.g., "path/to/images"), and the directory path relative to the base URL in which web worker script bundles are stored (e.g., "path/to/worker-bundles").

In general, you probably won't need to create new stores, and the primary interaction you'll have with the global store, if any, will be setting the base URL, the image directory path, and the worker script bundle directory path.

## Example usage

Here's an example of how you'll most likely want to use the store.

```js
import { Store, Visualizations } from "hypothesize-visualizations"

!(async () => {
  // get a reference to the global store instance
  const { store } = Store

  // set the relevant paths so that the visualizations know where to look for
  // their various resources
  store.baseURL = "/some/base/url"
  store.imageDir = "path/to/images"
  store.workerBundleDir = "path/to/worker-bundles"

  // then create a visualization!
  const vis = await Visualizations.SnapshotVisualization({
    el: "#some-container",
    data: await getDataSomehow(),
  })
})()
```

## Constructor

### `Store([options])`

Can optionally accept an `options` object with the following key-value pairs:

- `localForageDriver` = the driver used by [localForage](https://github.com/localForage/localForage); value can be one of:
  - `localForage.INDEXEDDB` (default)
  - `localForage.LOCALSTORAGE`

## Properties

### (static) CORE_DATA_KEY

= `"/data/core-data"`

### (static) CORE_DATA_HASH_KEY

= `"/data/core-data-hash"`

### (static) CORE_DATA_TYPES_KEY

= `"/data/core-data-types"`

### (static) K_MEANS_RESULTS_KEY

= `"/data/k-means-results"`

### (static) NUMBERS_ONLY_CORE_DATA_KEY

= `"/data/numbers-only-core-data"`

### (static) PARTIAL_CORRELATIONS_KEY

= `"/data/partial-correlations"`

### (static) PCA_LOADINGS_KEY

= `"/data/pca-loadings"`

### (static) P_VALUES_KEY

= `"/data/p-values"`

### (static) REGULAR_CORRELATIONS_KEY

= `"/data/regular-correlations"`

### (static) SETTINGS_KEY

= `"/settings"`

### (static) VARIABLE_DISTRIBUTIONS_KEY

= `"/data/variable-distributions"`

### (instance) `baseURL`

A string representing the primary path, relative to a domain, at which the web app is served. For example, if the web app is served at https://hypothesize.io/some/base/url, then `baseURL` should be set to `"/some/base/url"`.

### (instance) `imageDir`

A string representing the path to the directory — relative to the `baseURL` — in which the visualizations' images live. These images are mainly small interface images, like chevrons, arrows, etc. If, for example, the `"chevron-up.svg"` image is served at https://hypothesize.io/some/base/url/here/are/images/chevron-up.svg, then `imageDir` should be set to `"here/are/images"`. (Remember that this path is relative to the `baseURL`!) The default value is `"res/img"`.

### (instance) `workerBundleDir`

A string representing the path to the directory — relative to the `baseURL` — in which the visualizations worker script bundles (i.e., the worker script bundles produced by `build.mjs`) live. If, for example, the `"get-data-types.js"` script bundle is served at https://hypothesize.io/some/base/url/cool/worker-bundles/get-data-types.js, then `workerBundleDir` should be set to `"cool/worker-bundles"`. (Remember that this path is relative to the `baseURL`!) The default value is `"dist/worker-bundles"`.

### (instance) `settings`

An object with the following key-value pairs:

- `truncationMode` = a string representing the location in a string where long variable names should be truncated; the value can be one of:
  - `"beginning"` (e.g., `"...YourFavoriteColor"`)
  - `"middle"` (e.g., `"whatIs...riteColor"`)
  - `"end"` (e.g., `"whatIsYourFav..."`; this is the default value)

## Methods

### `get(key)`

Returns a `Promise` that resolves to the value referenced by `key`.

### `getCoreData()`

Returns a `Promise` that resolves to the core data as a `DataFrame` instance.

### `getCoreDataTypes([coreData])`

Returns a `Promise` that resolves to the core data types as a `DataFrame` instance. Optionally accepts a `coreData` `DataFrame`. If a `coreData` value is passed, then that `coreData` is checked to see if it matches the cached core data and — if it doesn't match — triggers a re-run of the relevant computations. If a `coreData` value is not passed, then the cached core data is used.

### `getKMeansResults([coreData, settings, progress])`

Returns a `Promise` that resolves to the results returned from the `getKMeansResults` function. Can optionally accept a `coreData` `DataFrame`, a `settings` object, and a `progress` callback function.

The `settings` object can have the following key-value pairs:

- `ks` = an array of integers representing numbers of clusters to try (e.g., an array of `[2, 3, 4]` would mean that the K-means algorithm would try fitting the data with two, three, and four clusters respectively)
- `maxIterations` = the maximum number of iterations per fitting restart that can be used before the algorithm stops
- `maxRestarts` = the maximum number of fitting restarts that can be used before the algorithm stops

The `progress` callback function can take a single argument that is an object with the following key-value pairs:

- `message` = a string describing the state of the algorithm
- `progress` = a number between 0 and 1 representing the state of completion of the algorithm

### `getNumbersOnlyCoreData([coreDat, progress])`

Returns a `Promise` that resolves to a numbers-only version of `coreData` as a `DataFrame` instance. Can optionally accept a `coreData` `DataFrame` and a `progress` callback function.

The `progress` callback function can take a single argument that is an object with the following key-value pairs:

- `message` = a string describing the state of the algorithm
- `progress` = a number between 0 and 1 representing the state of completion of the algorithm

### `getPartialCorrelations([coreData, progress])`

Returns a `Promise` that resolves to a matrix of partial correlations as a `DataFrame` instance. Can optionally accept a `coreData` `DataFrame` and a `progress` callback function.

The `progress` callback function can take a single argument that is an object with the following key-value pairs:

- `message` = a string describing the state of the algorithm
- `progress` = a number between 0 and 1 representing the state of completion of the algorithm

### `getPCALoadings([coreData, progress])`

Returns a `Promise` that resolves to a matrix of PCA factor loadings as a `DataFrame` instance. Can optionally accept a `coreData` `DataFrame` and a `progress` callback function.

The `progress` callback function can take a single argument that is an object with the following key-value pairs:

- `message` = a string describing the state of the algorithm
- `progress` = a number between 0 and 1 representing the state of completion of the algorithm

### `getPValues([coreData, progress])`

Returns a `Promise` that resolves to a matrix of p-values as a `DataFrame` instance. Can optionally accept a `coreData` `DataFrame` and a `progress` callback function.

The `progress` callback function can take a single argument that is an object with the following key-value pairs:

- `message` = a string describing the state of the algorithm
- `progress` = a number between 0 and 1 representing the state of completion of the algorithm

### `getRegularCorrelations([coreData, progress])`

Returns a `Promise` that resolves to a matrix of correlations as a `DataFrame` instance. Can optionally accept a `coreData` `DataFrame` and a `progress` callback function.

The `progress` callback function can take a single argument that is an object with the following key-value pairs:

- `message` = a string describing the state of the algorithm
- `progress` = a number between 0 and 1 representing the state of completion of the algorithm

### `getSettings()`

Returns a `Promise` that resolves to a settings object that's the same as the store's `settings` property.

### `getVariableDistributions([coreData, progress])`

Returns a `Promise` that resolves to the results returned from the `getVariableDistributions` function. Can optionally accept a `coreData` `DataFrame` and a `progress` callback function.

The `progress` callback function can take a single argument that is an object with the following key-value pairs:

- `message` = a string describing the state of the algorithm
- `progress` = a number between 0 and 1 representing the state of completion of the algorithm

### `loadSettings()`

Returns a `Promise` that resolves when either the cached settings have been loaded into the store or the store has been assigned default settings values.

### `removeAllData()`

Returns a `Promise` that resolves after all cached data has been deleted.

### `set(key, value)`

Returns a `Promise` that resolves once the `key`-`value` pair have been cached.

### `setCoreData(coreData)`

Returns a `Promise` that resolves once the core dataset has been cached.

Note that this function also compares the given `coreData` value to the cached core dataset to determine whether or not to invalidate cached computation results.

### `setCoreDataTypes(coreDataTypes)`

Returns a `Promise` that resolves once the core dataset's types have been cached.

### `setKMeansResults(kMeansResults)`

Returns a `Promise` that resolves once K-means results have been cached.

### `setPartialCorrelations(partialCorrelations)`

Returns a `Promise` that resolves once the matrix of partial correlations has been cached.

### `setRegularCorrelations(regularCorrelations)`

Returns a `Promise` that resolves once the matrix of correlations has been cached.

### `setPCALoadings(pcaLoadings)`

Returns a `Promise` that resolves once the PCA factor loadings have been cached.

### `setPValues(pValues)`

Returns a `Promise` that resolves once the matrix of p-values has been cached.

### `setSettings(settings)`

Returns a `Promise` that resolves after the new settings have been cached and updated on the `store` instance.

### `setVariableDistributions(variableDistributions)`

Returns a `Promise` that resolves after the variable distributions have been cached.

### `shouldRecompute(coreData)`

Returns a `Promise` that resolves to a boolean indicating whether or not the cached computation results have been invalidated.
