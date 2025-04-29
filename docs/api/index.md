# API

- [Computations](./computations/index.md)
- [Store](./store/index.md)
- [Styles and themes](./styles-and-themes/index.md)
- [Visualizations](./visualizations/index.md)

In all of the documentation that follows, the phrase "core data" and the variable `coreData` refer to the central dataset from which all other datasets are derived; i.e., the data the user uploaded as a CSV, XLSX, etc.

Internally, most of the data is passed around as [`DataFrame`](https://github.com/jrc03c/monorepo/tree/main/packages/js-math-tools#dataframex) instances. The API for this class mimics the basics of [the pandas DataFrame class](https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.DataFrame.html).
