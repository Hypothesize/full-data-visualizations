import {
  assert,
  isArray,
  isBoolean,
  isDataFrame,
  isFunction,
  isSeries,
  isUndefined,
} from "@jrc03c/js-math-tools"

import * as tf from "@tensorflow/tfjs"

function mapAsync(x, fn, mustRunInOrder) {
  if (isDataFrame(x) || isSeries(x)) {
    return mapAsync(x.values, fn, mustRunInOrder)
  }

  if (x instanceof tf.Tensor) {
    return mapAsync(x.arraySync(), fn, mustRunInOrder)
  }

  return new Promise((resolve, reject) => {
    try {
      assert(
        isArray(x),
        "The first argument passed into the `mapAsync` function must be an array, a Series, a DataFrame, or a Tensor!",
      )

      assert(
        isFunction(fn),
        "The second argument passed into the `mapAsync` function must be a function!",
      )

      assert(
        isUndefined(mustRunInOrder) || isBoolean(mustRunInOrder),
        "The third argument passed into the `mapAsync` function must be undefined or a boolean!",
      )

      // serial
      if (mustRunInOrder) {
        let isWorking = false
        let index = 0
        const out = []

        const interval = setInterval(() => {
          if (isWorking) return
          isWorking = true

          fn(x[index], index, x).then(result => {
            out.push(result)
            index++

            if (index >= x.length) {
              clearInterval(interval)
              resolve(out)
            } else {
              isWorking = false
            }
          })
        }, 0)
      }

      // parallel
      else {
        const out = []
        const promises = x.map(fn)
        let promiseCount = 0

        promises.forEach((p, i) => {
          p.then(result => {
            out[i] = result
            promiseCount++

            if (promiseCount === promises.length) {
              resolve(out)
            }
          })
        })
      }
    } catch (e) {
      return reject(e)
    }
  })
}

export { mapAsync }
