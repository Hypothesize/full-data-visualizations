import {
  assert,
  isArray,
  identity,
  range,
  shape,
  sum,
  transpose,
} from "@jrc03c/js-math-tools"

import { tfPValueAsync } from "./p-value-async.mjs"
import { unpack } from "./unpack.mjs"

const tfGetPValueMatrixAsync = unpack((x, progress) => {
  return new Promise((resolve, reject) => {
    try {
      assert(
        isArray(x) && shape(x).length === 2,
        "The value passed into the `tfGetPValueMatrixAsync` function must be a 2-dimensional array, a DataFrame, or a 2-dimensional tf.Tensor!",
      )

      x = transpose(x)

      const totalSteps = sum(range(0, x.length)) * 2
      let step = 0

      const out = identity(x.length)
      const promises = []
      let resolvedPromiseCount = 0

      range(0, x.length).forEach(i => {
        range(i + 1, x.length).forEach(j => {
          const col1 = x[i]
          const col2 = x[j]
          const promise = tfPValueAsync(col1, col2)
          promises.push({ i, j, promise })

          if (progress) {
            step += 1
            progress(step / totalSteps)
          }
        })
      })

      promises.forEach(item => {
        item.promise
          .then(result => {
            out[item.i][item.j] = result
            out[item.j][item.i] = result
            resolvedPromiseCount++

            if (progress) {
              step += 1
              progress(step / totalSteps)
            }

            if (resolvedPromiseCount === promises.length) {
              resolve(out)
            }
          })
          .catch(e => {
            console.error("ERROR:", e)
            resolvedPromiseCount++

            if (resolvedPromiseCount === promises.length) {
              resolve(out)
            }
          })
      })
    } catch (e) {
      return reject(e)
    }
  })
})

export { tfGetPValueMatrixAsync }
