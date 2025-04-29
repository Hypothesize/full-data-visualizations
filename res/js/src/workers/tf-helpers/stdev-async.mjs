import { assert, isArray } from "@jrc03c/js-math-tools"
import { tfDropNaNAsync } from "./drop-nan-async.mjs"
import { unpack } from "./unpack.mjs"
import * as tf from "@tensorflow/tfjs"

const tfStdevAsync = unpack(m => {
  return new Promise((resolve, reject) => {
    try {
      const tensors = []

      try {
        assert(
          isArray(m),
          "The value passed into the `tfStdevAsync` function must be an array, a Series, a DataFrame, or a Tensor!",
        )

        tfDropNaNAsync(m).then(m => {
          tensors.push(m)

          return tf.tidy(() => {
            const out = tf
              .sqrt(tf.mean(tf.pow(tf.sub(m, tf.mean(m)), 2)))
              .arraySync()

            resolve(out)

            tensors.forEach(t => {
              try {
                t.dispose()
              } catch (e) {}
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

export { tfStdevAsync }
