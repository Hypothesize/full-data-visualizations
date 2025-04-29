import {
  assert,
  isArray,
  isNumber,
  reshape,
  shape,
} from "@jrc03c/js-math-tools"

import { tfStdevAsync } from "./stdev-async.mjs"
import { unpack } from "./unpack.mjs"
import * as tf from "@tensorflow/tfjs"

const tfNormalizeAsync = unpack(async m => {
  const tensors = []

  try {
    assert(
      isArray(m),
      "The first value passed into the `tfNormalizeAsync` function must be an array, a Series, a DataFrame, or a Tensor!",
    )

    const mShape = shape(m)
    const mFlat = tf.util.flatten(m)
    const nans = []

    mFlat.forEach((v, i) => {
      if (!isNumber(v)) {
        nans.push({ value: v, index: i })
        mFlat[i] = 0
      }
    })

    m = tf.tensor(mFlat)
    tensors.push(m)

    const mMean = tf.tidy(() => tf.mean(mFlat).arraySync())
    const mStdev = await tfStdevAsync(mFlat)

    return tf.tidy(() => {
      const out = m.sub(mMean).div(mStdev).arraySync()

      nans.forEach(v => {
        out[v.index] = v.value
      })

      tensors.forEach(t => {
        try {
          t.dispose()
        } catch (e) {}
      })

      return reshape(out, mShape)
    })
  } catch (e) {
    tensors.forEach(t => {
      try {
        t.dispose()
      } catch (e) {}
    })

    throw e
  }
})

export { tfNormalizeAsync }
