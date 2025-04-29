import { assert, isArray, isNumber } from "@jrc03c/js-math-tools"
import { unpack } from "./unpack.mjs"
import * as tf from "@tensorflow/tfjs"

const tfDropNaNAsync = unpack(async x => {
  const tensors = []

  try {
    assert(
      isArray(x),
      "The value passed into the `tfDropNaNAsync` function must be an array, a Series, a DataFrame, or a Tensor!",
    )

    const xflat = tf.util.flatten(x)
    const xtf = tf.tensor1d(xflat, "float32")
    tensors.push(xtf)

    const mask = tf.tensor1d(
      xflat.map(v => (isNumber(v) ? 1 : 0)),
      "bool",
    )

    tensors.push(mask)

    const dropped = await tf.booleanMaskAsync(xtf, mask)
    tensors.push(dropped)

    const out = dropped.arraySync()

    tensors.forEach(t => {
      try {
        t.dispose()
      } catch (e) {}
    })

    return out
  } catch (e) {
    tensors.forEach(t => {
      try {
        t.dispose()
      } catch (e) {}
    })

    throw e
  }
})

export { tfDropNaNAsync }
