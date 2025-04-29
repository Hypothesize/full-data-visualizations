import {
  assert,
  clamp,
  isArray,
  isUndefined,
  shape,
} from "@jrc03c/js-math-tools"

import { tfDropNaNPairwiseAsync } from "./drop-nan-pairwise-async.mjs"
import { tfNormalizeAsync } from "./normalize-async.mjs"
import { unpack } from "./unpack.mjs"
import * as tf from "@tensorflow/tfjs"

const tfCorrelAsync = unpack((a, b) => {
  return new Promise((resolve, reject) => {
    try {
      const tensors = []

      try {
        if (isUndefined(b)) {
          b = a
        }

        assert(
          isArray(a),
          "The first argument passed into the `tfCorrelAsync` function must be a 1-dimensional array, a Series, or 1-dimensional Tensor!",
        )

        assert(
          isArray(b),
          "The second argument passed into the `tfCorrelAsync` function must be a 1-dimensional array, a Series, or a 1-dimensional Tensor!",
        )

        assert(
          shape(a).length === 1,
          "The first argument passed into the `tfCorrelAsync` function must be a 1-dimensional array, a Series, or a 1-dimensional Tensor!",
        )

        assert(
          shape(b).length === 1,
          "The second argument passed into the `tfCorrelAsync` function must be a 1-dimensional array, a Series, or a 1-dimensional Tensor!",
        )

        assert(
          a.length === b.length,
          "The two vectors passed into the `tfCorrelAsync` function must have the same length!",
        )

        tfDropNaNPairwiseAsync(a, b).then(cleaned => {
          if (tf.util.flatten(cleaned).length === 0) {
            return resolve(NaN)
          }

          a = cleaned[0]
          b = cleaned[1]

          tfNormalizeAsync(a).then(a => {
            tfNormalizeAsync(b).then(b => {
              a = tf.tensor1d(a, "float32")
              b = tf.tensor1d(b, "float32")

              tensors.push(a)
              tensors.push(b)

              const temp = tf.tidy(() => a.dot(b).div(a.shape[0]).arraySync())
              const out = clamp(temp, -1, 1)
              resolve(out)

              tensors.forEach(t => {
                try {
                  t.dispose()
                } catch (e) {}
              })
            })
          })
        })
      } catch (e) {
        tensors.forEach(t => {
          try {
            t.dispose()
          } catch (e) {}
        })

        throw e
      }
    } catch (e) {
      return reject(e)
    }
  })
})

export { tfCorrelAsync }
