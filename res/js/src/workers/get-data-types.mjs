import {
  assert,
  flatten,
  isArray,
  isBoolean,
  isDataFrame,
  isSeries,
  isUndefined,
  inferType,
} from "@jrc03c/js-math-tools"

import { isInWebWorker } from "../utils/is-in-web-worker.mjs"
import { resurrect } from "../utils/resurrect.mjs"
import * as Bee from "@jrc03c/bee"

// infers data as one of these types:
// - boolean
// - date
// - float
// - integer
// - null
// - object
// - string

function getDataTypes(x, shouldInferPerCell) {
  if (isDataFrame(x)) {
    return x.apply(col => getDataTypes(col, shouldInferPerCell))
  }

  if (isSeries(x)) {
    const out = x.copy()
    out.values = getDataTypes(out.values, shouldInferPerCell)
    return out
  }

  assert(
    isArray(x),
    "The first argument passed into the `getDataTypes` function should be an array, Series, or DataFrame!",
  )

  assert(
    isUndefined(shouldInferPerCell) || isBoolean(shouldInferPerCell),
    "The second argument passed into the `getDataTypes` function should be a boolean or undefined!",
  )

  // per-cell inference
  if (shouldInferPerCell) {
    return flatten(x).map(v => {
      const results = inferType(v)

      if (results.type === "number") {
        if (results.isInteger) {
          results.type = "integer"
        } else {
          results.type = "float"
        }

        delete results.isInteger
      }

      return results
    })
  }

  // per-array inference
  else {
    const results = inferType(x)
    let shouldConvertToInt = false

    if (results.type === "number") {
      let ints = 0
      let floats = 0

      results.values.forEach(v => {
        if (parseInt(v) === v) {
          ints++
        } else {
          floats++
        }
      })

      shouldConvertToInt = ints > floats
    }

    return results.values.map(v => {
      return {
        type:
          results.type === "number"
            ? shouldConvertToInt
              ? "integer"
              : "float"
            : results.type,

        value: shouldConvertToInt ? parseInt(v) : v,
      }
    })
  }
}

if (isInWebWorker()) {
  const drone = new Bee.Drone()

  drone.on("get-data-types", async (request, response) => {
    return response.send(
      getDataTypes(
        resurrect(request.data.data),
        request.data.shouldInferPerCell,
      ),
    )
  })
}

export { getDataTypes }
