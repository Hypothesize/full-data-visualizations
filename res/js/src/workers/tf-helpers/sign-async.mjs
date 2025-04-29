import {
  assert,
  isArray,
  isNumber,
  reshape,
  shape,
} from "@jrc03c/js-math-tools"

import { unpack } from "./unpack.mjs"
import * as tf from "@tensorflow/tfjs"

const tfSignAsync = unpack(async x => {
  if (isNumber(x)) {
    if (x > 0) {
      return 1
    }

    if (x < 0) {
      return -1
    }

    return 0
  }

  assert(
    isArray(x),
    "The value passed into the `tfSignAsync` function must be a number, an array, a Series, a DataFrame, or a Tensor!",
  )

  const xShape = shape(x)
  const xFlat = tf.util.flatten(x)
  const nans = []

  xFlat.forEach((v, i) => {
    if (!isNumber(v)) {
      nans.push({ value: v, index: i })
    }
  })

  return tf.tidy(() => {
    const out = tf.tensor(xFlat).abs().divNoNan(xFlat).arraySync()

    nans.forEach(v => {
      out[v.index] = v.value
    })

    return reshape(out, xShape)
  })
})

export { tfSignAsync }
