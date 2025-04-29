import { assert, isArray, shape } from "@jrc03c/js-math-tools"
import { pValue } from "@jrc03c/js-data-science-helpers"
import { unpack } from "./unpack.mjs"

const tfPValueAsync = unpack(async (a, b) => {
  assert(
    isArray(a),
    "The first value passed into the `tfPValueAsync` function must be a 1-dimensional array, a Series, or a 1-dimensional Tensor!",
  )

  assert(
    isArray(b),
    "The second value passed into the `tfPValueAsync` function must be a 1-dimensional array, a Series, or a 1-dimensional Tensor!",
  )

  assert(
    shape(a).length === 1,
    "The first value passed into the `tfPValueAsync` function must be a 1-dimensional array, a Series, or a 1-dimensional Tensor!",
  )

  assert(
    shape(b).length === 1,
    "The second value passed into the `tfPValueAsync` function must be a 1-dimensional array, a Series, or a 1-dimensional Tensor!",
  )

  assert(
    a.length === b.length,
    "The two vectors passed into the `tfPValueAsync` function must have the same length!",
  )

  // NOTE: It turns out that the @jrc03c/js-data-science-helpers `pValue`
  // function is faster than the TensorFlow version previously defined below!
  // So, for now, this function is just a wrapper around the `pValue` function.
  return pValue(a, b, true)
})

export { tfPValueAsync }
