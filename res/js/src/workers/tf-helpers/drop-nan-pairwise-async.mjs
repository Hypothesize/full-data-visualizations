import {
  assert,
  isArray,
  isNumber,
  shape,
  transpose,
} from "@jrc03c/js-math-tools"

import { unpack } from "./unpack.mjs"
import * as tf from "@tensorflow/tfjs"

const tfDropNaNPairwiseAsync = unpack(async (a, b) => {
  const tensors = []

  try {
    assert(
      isArray(a),
      "The first argument passed into the `tfDropNaNPairwiseAsync` function must be a 1-dimensional array, a Series, or a 1-dimensional Tensor!",
    )

    assert(
      isArray(b),
      "The second argument passed into the `tfDropNaNPairwiseAsync` function must be a 1-dimensional array, a Series, or a 1-dimensional Tensor!",
    )

    assert(
      shape(a).length === 1,
      "The first argument passed into the `tfDropNaNPairwiseAsync` function must be a 1-dimensional array, a Series, or a 1-dimensional Tensor!",
    )

    assert(
      shape(b).length === 1,
      "The second argument passed into the `tfDropNaNPairwiseAsync` function must be a 1-dimensional array, a Series, or a 1-dimensional Tensor!",
    )

    assert(
      a.length === b.length,
      "The two vectors passed into the `tfDropNaNPairwiseAsync` function must have the same length!",
    )

    const mask = tf.tensor2d(
      a.map((v1, i) => {
        const v2 = b[i]

        if (isNumber(v1) && isNumber(v2)) {
          return [1, 1]
        } else {
          return [0, 0]
        }
      }),
      null,
      "bool",
    )

    tensors.push(mask)

    const c = tf.tensor2d(transpose([a, b]), [a.length, 2], "float32")

    tensors.push(c)

    const dropped = await tf.booleanMaskAsync(c, mask)
    tensors.push(dropped)

    const out = tf.tidy(() =>
      dropped
        .reshape([parseInt(dropped.shape[0] / 2), 2])
        .transpose()
        .arraySync(),
    )

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

export { tfDropNaNPairwiseAsync }
