import {
  assert,
  isDataFrame,
  isFunction,
  isSeries,
} from "@jrc03c/js-math-tools"

import * as tf from "@tensorflow/tfjs"

// This function removes raw arrays from DataFrames and Series so that they
// won't cause problems for TensorFlow.
function unpack(fn) {
  assert(
    isFunction(fn),
    "The value passed into the `unpack` function must be a function!",
  )

  return function () {
    Object.keys(arguments).forEach(key => {
      const value = arguments[key]

      if (isDataFrame(value) || isSeries(value)) {
        arguments[key] = value.values
      } else if (value instanceof tf.Tensor) {
        arguments[key] = value.arraySync()
      }
    })

    return fn(...arguments)
  }
}

export { unpack }
