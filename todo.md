# to do

## visualizations

- make everything theme-able
  - remove bulma and all of its classes
  - un-style everything that doesn't absolutely need it (e.g., buttons can be plain ol' buttons) since the hypothesize stylesheets will take care of most common elements
  - use css variables not only in the normal ways but also in canvas visualizations (so that the team doesn't have to pass in css in addition to other arguments when initializing a visualization)
  - find / create an accessible color palette
  - make sure that all components have been given font families, weights, and sizes
  - make sure that all components use css variables and not hard-coded values
    - but also make sure that they don't override global variables unless necessary
- make sure that all visualizations resize on _both_ window resize _and_ container resize!
- make sure that all components' names and css classes match; for example, if a component has a name of "h-modal", then it should have an "h-modal" css class as well; also make sure that css names are consistent, since right now the naming is all over the place!
- make sure that css rules are properly nested so that they don't leak in or out easily
- maybe set a max width on visualizations? some of theme seem absurd when too wide
- (nice-to-have but not necessary) make plots expandable to take up the full viewport (i.e., a "full-screen" button)?

### correlation network

- non-determinism in the correlation network visualization means that ui test coverage is difficult or impossible

### correlation grid

- change the background of the download for the correlations chart from transparent to white
- color nan correlations in gray, and make sure that they're hoverable (since right now they throw an error when the mouse moves over them) — but are there still any cases where nans are possible? be sure to check spencer's email in which he describes performing an eigenvalue decomposition and correcting for negative eigenvalues so that the original matrix becomes invertible (i.e., becomes non-positive-definite).
- (nice-to-have but not necessary) hide the floating labels when the mouse moves over the row and column labels (i.e., not just when it exits the canvas)
- (nice-to-have but not necessary) should the "download" button download only the correlations as a csv, or should it also download the plot as an image (since the plot is usually too big to fit into its containing element and thus is partially rendered, making it impossible to save the full plot by right-clicking on the canvas to download the image)?
- (nice-to-have but not necessary) show spinner when rendering

### distributions

- don't include in the charts columns that have fewer than 5 values total
- make sure the ticks are always rounded to 2 decimal places
- change "text variables" to "text and date variables" (which technically isn't part of the visualizations; it's a navigation item in the distributions view)
- (nice-to-have but not necessary) show values on hover
- (nice-to-have but not necessary) make charts draggably expandable vertically so that values can be expanded if they're truncated

### k-means

- k-means canvas isn't resizing correctly when page (or container) resizes
- make table first row and first column sticky
- fix progress bar; it's jumping back and forth rather than moving forward all the time
- non-determinism in k-means means that ui test coverage is difficult or impossible
- improve mouse collision detection (since right now it's hard to select among overlapping clusters)
- figure out why cluster renaming modal is so slow!
- maybe drop nan values before or after running the algorithm? this most recent time, the algorithm finished, but nothing displayed in the canvas...
- make sure that these render correctly on hi-dpi screens
- show a spinner or something when loading a table after clicking on a cluster
- (nice-to-have but not necessary) should the "download" button download only the correlations as a csv, or should it also download the plot as an image (since the plot is usually too big to fit into its containing element and thus is partially rendered, making it impossible to save the full plot by right-clicking on the canvas to download the image)?

### pca

- font sizes are mixed (e.g., labels are very small, but ticks are very large)
- figure out why the circles look aliased
- improve the look of the click animations

### snapshot

- (nice-to-have but not necessary) add hoverability to show column name, row number (or index name), and value (?)

## computations

- move all `drone.emit` calls out of functions and replace them with progress callbacks; then pass `drone.emit`-based functions as those progress callbacks
- make sure all functions have unit tests
- double-check: where / when are we supposed to clip outliers? and am i doing that already?
- i made the following note, but i can't now remember why i wrote it down. it doesn't seem to make sense in retrospect, but i'm sure i must've noticed a problem in a particular case. note: "update `infertype` function to parse arrays as objects (though they should _not_ be used in dataframe contexts because of dimensionality issues)."
- change the way the "float" and "int" functions work in js-math-tools such that float(x) == cast(x, "float") and int(x) == cast(x, "int")? of course, "float" and "int" aren't yet listed as valid data types for casting, so that'll have to be added too, i guess...
- check for constant & highly-correlated columns _after_ one-hot-encoding in the `converttonumerical` function!
- make a small change to make to my pseudo-inverse formula: after performing svd, set any negative values in s to 0; then return v @ s^-1 @ u^t.
- long-running operations:
  - add operations to queue; run in background while ui remains free (?)
  - add cancel button (?)
  - run in parallel (?)
- test out setting the backend to webgl, cpu, and/or wasm
- make sure that all functions handle nan values correctly
  - if necessary and possible, drop nans (including pairwise)
  - and if a function returns a same-sized matrix as its input, then make sure that nan values aren't moved or changed

## other / miscellaneous

- read through all of spencer's emails to make sure i fixed everything!
- also check work notes repo / overview.md file for additional notes & bugs!
- document which features the hypothesize team needs to remove (e.g., the type inference stuff, since they have their own)
