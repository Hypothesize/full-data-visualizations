// The purpose of this function is to correct small floating-point errors in
// matrices so that they appear perfectly symmetrical to the `hunterChainSort`
// function (from @jrc03c/js-data-science-helpers). It accomplishes this by
// merely averaging the values at corresponding points (i.e., x[i][j] and
// x[j][i]).

// NOTE: This function will probably turn any non-numerical values into NaNs;
// it's really only intended for use on numerical data!

import {
  assert,
  DataFrame,
  isArray,
  isEqual,
  ndarray,
  shape,
} from "@jrc03c/js-math-tools"

import * as tf from "@tensorflow/tfjs"

function symmetrize(x) {
  if (x instanceof DataFrame) {
    const out = new DataFrame(symmetrize(x.values))

    if (!isEqual(x.index, x.columns)) {
      console.warn(
        "The `DataFrame` you passed into the `symmetrize` function had mismatched row and column names. We have automatically replaced the row names with the column names so that they match.",
      )
    }

    out.index = x.columns.slice()
    out.columns = x.columns.slice()
    return out
  }

  if (x instanceof tf.Tensor) {
    return tf.tensor(symmetrize(x.arraySync()))
  }

  assert(
    isArray(x),
    "The value passed into the `symmetrize` function must be a 2-dimensional array, a DataFrame, or a 2-dimensional Tensor!",
  )

  const xShape = shape(x)

  assert(
    xShape.length === 2,
    "The value passed into the `symmetrize` function must be a 2-dimensional array, a DataFrame, or a 2-dimensional Tensor!",
  )

  assert(
    xShape[0] == xShape[1],
    "The value passed into the `symmetrize` function must be a 2-dimensional array, a DataFrame, or a 2-dimensional tf.Tensor!",
  )

  const out = ndarray(xShape)

  for (let i = 0; i < x.length; i++) {
    for (let j = i; j < x[i].length; j++) {
      const v = (x[i][j] + x[j][i]) / 2
      out[i][j] = v
      out[j][i] = v
    }
  }

  return out
}

export { symmetrize }
