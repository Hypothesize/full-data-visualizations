import { assert, isArray, isEqual, shape } from "@jrc03c/js-math-tools"
import { tfDropNaNPairwiseAsync } from "./drop-nan-pairwise-async.mjs"
import { tfSignAsync } from "./sign-async.mjs"
import { unpack } from "./unpack.mjs"
import * as tf from "@tensorflow/tfjs"

const tfRScoreAsync = unpack(async (a, b) => {
  assert(
    isArray(a),
    "The first value passed into the `tfRScoreAsync` function must be an array, a Series, a DataFrame, or a Tensor!",
  )

  assert(
    isArray(b),
    "The second value passed into the `tfRScoreAsync` function must be an array, a Series, a DataFrame, or a Tensor!",
  )

  assert(
    isEqual(shape(a), shape(b)),
    `The two tensors passed into the \`tfRScoreAsync\` function must have the same shape! ([${shape(
      a,
    ).join(", ")}] vs. [${shape(b).join(", ")}])`,
  )

  a = tf.util.flatten(a)
  b = tf.util.flatten(b)

  const clean = await tfDropNaNPairwiseAsync(a, b)

  a = tf.tensor1d(clean[0], "float32")
  b = tf.tensor1d(clean[1], "float32")

  const tensors = [a, b]

  try {
    const num = tf.tidy(() => a.sub(b).pow(2).sum())
    tensors.push(num)

    const den = tf.tidy(() => a.sub(tf.mean(a)).pow(2).sum())
    tensors.push(den)

    const r2 = tf.tidy(() => tf.tensor(1).sub(num.divNoNan(den)))
    tensors.push(r2)

    const r2Sign = await tfSignAsync(r2)

    return tf.tidy(() => {
      const out = tf.tensor(r2Sign).mul(r2.abs().sqrt()).arraySync()

      tensors.forEach(t => {
        try {
          t.dispose()
        } catch (e) {}
      })

      return out
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

export { tfRScoreAsync }
