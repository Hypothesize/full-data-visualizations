import { assert, isArray, shape } from "@jrc03c/js-math-tools"
import { tfSVDAsync } from "./svd-async.mjs"
import { unpack } from "./unpack.mjs"
import * as tf from "@tensorflow/tfjs"

const tfInvertAsync = unpack(async x => {
  assert(
    isArray(x) && shape(x).length === 2,
    "The value passed into the `tfInvertAsync` function must be a 2-dimensional array, a DataFrame, or a 2-dimensional Tensor!",
  )

  const { u, s, v } = await tfSVDAsync(x)

  return tf.tidy(() =>
    tf
      .tensor(v)
      .dot(tf.tensor(1).divNoNan(tf.transpose(tf.clipByValue(s, 0, Infinity))))
      .dot(tf.transpose(u))
      .arraySync(),
  )
})

export { tfInvertAsync }
