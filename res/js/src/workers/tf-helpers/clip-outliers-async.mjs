import {
  assert,
  isArray,
  isNumber,
  isUndefined,
  median,
  reshape,
  shape,
} from "@jrc03c/js-math-tools"

import { unpack } from "./unpack.mjs"
import * as tf from "@tensorflow/tfjs"

function isBinary(xflat) {
  for (let i = 0; i < xflat.length; i++) {
    if (xflat[i] !== 0 && xflat[i] !== 1) {
      return false
    }
  }

  return true
}

const tfClipOutliersAsync = unpack(async (x, maxScore) => {
  assert(
    isArray(x),
    "The first argument passed into the `tfClipOutliersAsync` function must be an array, DataFrame, Series, or Tensor!",
  )

  assert(
    isUndefined(maxScore) || isNumber(maxScore),
    "The second argument passed into the `tfClipOutliersAsync` function must be undefined, null, or a number!",
  )

  maxScore = maxScore || 5
  const xShape = shape(x)
  const xFlat = tf.util.flatten(x)
  const xValues = []
  const xNanValues = []

  xFlat.forEach((v, i) => {
    if (isNaN(v)) {
      xNanValues.push({ index: i, value: v })
    } else {
      xValues.push(v)
    }
  })

  if (isBinary(xFlat)) {
    return x
  }

  const m = median(xValues)

  const mad = median(
    tf.tidy(() => {
      return tf.tensor1d(xValues, "float32").sub(m).abs().arraySync()
    }),
  )

  const xValuesClipped = tf.tidy(() => {
    return tf
      .clipByValue(xValues, m - maxScore * mad, m + maxScore * mad)
      .arraySync()
  })

  xNanValues.forEach(v => {
    xValuesClipped.splice(v.index, 0, v.value)
  })

  return reshape(xValuesClipped, xShape)
})

export { tfClipOutliersAsync }
