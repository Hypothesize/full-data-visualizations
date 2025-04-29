import {
  assert,
  correl,
  count,
  DataFrame,
  inferType,
  isArray,
  isDataFrame,
  isFunction,
  isJagged,
  isNumber,
  isUndefined,
  shape,
  sort,
  sum,
} from "@jrc03c/js-math-tools"

import {
  getOneHotEncodings,
  isWholeNumber,
} from "@jrc03c/js-data-science-helpers"

import { stringify } from "@jrc03c/js-text-tools"
import { tfGetCorrelationMatrixAsync } from "./get-correlation-matrix-async.mjs"

async function tfConvertToNumericalAsync(df, config) {
  config = config || {}

  const maxUniqueValues = isNumber(config.maxUniqueValues)
    ? config.maxUniqueValues
    : 7

  const minNonMissingValues = isNumber(config.minNonMissingValues)
    ? config.minNonMissingValues
    : 15

  const maxCorrelationThreshold = isNumber(config.maxCorrelationThreshold)
    ? config.maxCorrelationThreshold
    : 1 - 1e-5

  const progress = config.progress || null

  if (isArray(df)) {
    assert(
      shape(df).length === 2 && !isJagged(df),
      "The `tfConvertToNumericalAsync` function only works on non-jagged 2-dimensional arrays and DataFrames!",
    )

    return tfConvertToNumericalAsync(new DataFrame(df))
  }

  assert(
    isDataFrame(df),
    "You must pass a DataFrame into the `tfConvertToNumericalAsync` function!",
  )

  assert(
    isWholeNumber(maxUniqueValues),
    "`maxUniqueValues` must be a whole number!",
  )

  assert(
    isWholeNumber(minNonMissingValues),
    "`minNonMissingValues` must be a whole number!",
  )

  assert(
    isNumber(maxCorrelationThreshold),
    "`maxCorrelationThreshold` must be a number!",
  )

  if (!isUndefined(progress)) {
    assert(isFunction(progress), "If defined, `progress` must be a function!")
  }

  // types:
  // - boolean
  // - bigint
  // - date
  // - null
  // - number
  // - object
  // - string

  let out = {}
  const shouldIgnoreNaNs = true

  df.apply((col, colIndex) => {
    if (progress) {
      progress((0.5 * colIndex) / df.columns.length)
    }

    const inferred = inferType(col.values)

    if (inferred.type === "boolean") {
      inferred.values = inferred.values.map(v => (v ? 1 : 0))
    }

    if (inferred.type === "date") {
      inferred.values = inferred.values.map(v => {
        try {
          return v.getTime()
        } catch (e) {
          return NaN
        }
      })
    }

    if (inferred.type === "null") {
      return
    }

    if (inferred.type === "number" || inferred.type === "bigint") {
      // don't do anything
    }

    if (inferred.type === "object") {
      inferred.values = inferred.values.map(v => stringify(v))
    }

    if (inferred.type === "string") {
      // don't do anything
    }

    const nonMissingValues = inferred.values.filter(v => !isUndefined(v))

    if (
      inferred.values.length - nonMissingValues.length >
      minNonMissingValues.length
    ) {
      return
    }

    // one-hot encode
    if (inferred.type !== "boolean") {
      const counts = sort(
        count(nonMissingValues)
          .toArray()
          .filter(item => !isUndefined(item.value) && isNumber(item.count)),
        (a, b) => b.count - a.count,
      )

      const topNPercent =
        sum(
          counts.slice(0, maxUniqueValues).map(item => item.count),
          shouldIgnoreNaNs,
        ) / nonMissingValues.length

      if (topNPercent >= 0.9) {
        if (counts.length < 2) {
          return
        }

        const oneHotEncodings = getOneHotEncodings(col.name, inferred.values)

        // check that the one-hot encoded columns are not highly correlated
        // with any existing columns, and then put them in the output
        // dictionary
        while (Object.keys(oneHotEncodings).length > 0) {
          const key = Object.keys(oneHotEncodings)[0]
          const values = oneHotEncodings[key]
          delete oneHotEncodings[key]

          const otherColNames = Object.keys(out)

          for (let i = 0; i < otherColNames.length; i++) {
            const otherColValues = out[otherColNames[i]]
            const r = correl(values, otherColValues, shouldIgnoreNaNs)

            if (r > maxCorrelationThreshold) {
              return
            }
          }

          out[key] = values
        }

        return
      }

      if (inferred.type === "object" || inferred.type === "string") {
        return
      }
    }

    if (
      inferred.type === "boolean" ||
      inferred.type === "date" ||
      inferred.type === "number" ||
      inferred.type === "bigint"
    ) {
      // store in output dictionary
      out[col.name] = inferred.values
    }
  })

  // check for high correlations with other columns
  out = new DataFrame(out)
  const corr = await tfGetCorrelationMatrixAsync(out.values)
  let duplicateCols = new Set()

  for (let i = 0; i < corr.length; i++) {
    for (let j = 0; j < i; j++) {
      const c = corr[i][j]

      if (c > maxCorrelationThreshold) {
        duplicateCols.add(out.columns[j])
      }
    }

    if (progress) {
      progress(0.5 + (0.25 * i) / (corr.length - 1))
    }
  }

  // drop nans
  let rowsToKeep = new Set()
  let colsToKeep = new Set()

  for (let i = 0; i < out.values.length; i++) {
    const row = out.values[i]
    let rowContainsNaNs = false

    for (let j = 0; j < row.length; j++) {
      const value = row[j]

      if (isNumber(value)) {
        colsToKeep.add(out.columns[j])
      } else {
        rowContainsNaNs = true
      }
    }

    if (!rowContainsNaNs) {
      rowsToKeep.add(out.index[i])
    }

    if (progress) {
      progress(0.75 + (0.25 * i) / (out.values.length - 1))
    }
  }

  duplicateCols = Array.from(duplicateCols)
  rowsToKeep = Array.from(rowsToKeep)

  colsToKeep = Array.from(colsToKeep).filter(
    col => !duplicateCols.includes(col),
  )

  out = out.get(rowsToKeep, colsToKeep)

  if (progress) {
    progress(1)
  }

  return out
}

export { tfConvertToNumericalAsync }
