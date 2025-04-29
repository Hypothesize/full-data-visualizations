import {
  cast,
  DataFrame,
  isEqual,
  isUndefined,
  range,
} from "@jrc03c/js-math-tools"

import { getDataTypes } from "./get-data-types.mjs"
import { makeKey } from "@jrc03c/make-key"

function stringify(x) {
  if (x instanceof Date) {
    return x.toJSON()
  }

  if (typeof x === "undefined") {
    return "undefined"
  }

  if (typeof x === "object") {
    if (x === null) {
      return "null"
    } else {
      return JSON.stringify(x)
    }
  }

  return x.toString()
}

test("tests that data types can be inferred correctly", () => {
  // data types:
  // - boolean
  // - date
  // - float
  // - integer
  // - null
  // - object
  // - string

  // per-cell inference
  const booleans1 = [
    { type: "boolean", value: true },
    { type: "boolean", value: true },
    { type: "boolean", value: false },
    { type: "integer", value: 234 },
    { type: "boolean", value: true },
  ]

  const booleans2 = [
    { type: "boolean", value: "yes", inferred: true },
    { type: "boolean", value: "no", inferred: false },
    { type: "boolean", value: "yes", inferred: true },
    { type: "boolean", value: "yes", inferred: true },
    { type: "boolean", value: "yes", inferred: true },
  ]

  const now = new Date()

  const dates = [
    { type: "date", value: new Date(parseInt(Math.random() * now)) },
    { type: "boolean", value: false },
    { type: "date", value: new Date(parseInt(Math.random() * now)) },
    { type: "date", value: new Date(parseInt(Math.random() * now)) },
    { type: "date", value: new Date(parseInt(Math.random() * now)) },
  ]

  const floats = [
    { type: "float", value: -4.3 },
    { type: "float", value: -2.1 },
    { type: "null", value: NaN, inferred: null },
    { type: "float", value: 2.1 },
    { type: "float", value: 4.3 },
  ]

  const integers = [
    { type: "integer", value: 5 },
    { type: "integer", value: 10 },
    { type: "integer", value: 15 },
    { type: "integer", value: 20 },
    { type: "date", value: new Date(parseInt(Math.random() * now)) },
  ]

  const nulls = [
    { type: "string", value: "Hello, world!" },
    { type: "null", value: undefined, inferred: null },
    { type: "null", value: "", inferred: null },
    { type: "null", value: NaN, inferred: null },
    { type: "null", value: null, inferred: null },
  ]

  const objects = [
    { type: "object", value: { name: "Alice", age: 9 } },
    { type: "float", value: 234.456 },
    { type: "object", value: { name: "Cassandra", age: 27 } },
    { type: "object", value: { name: "Dylan", age: 36 } },
    { type: "object", value: { name: "Eleanor", age: 45 } },
  ]

  const strings = [
    { type: "string", value: makeKey(16) },
    { type: "string", value: makeKey(16) },
    { type: "string", value: makeKey(16) },
    { type: "string", value: makeKey(16) },
    { type: "boolean", value: "YES", inferred: true },
  ]

  const x = new DataFrame({
    booleans1: booleans1.map(v => stringify(v.value)),
    booleans2: booleans2.map(v => stringify(v.value)),
    dates: dates.map(v => stringify(v.value)),
    floats: floats.map(v => stringify(v.value)),
    integers: integers.map(v => stringify(v.value)),
    nulls: nulls.map(v => stringify(v.value)),
    objects: objects.map(v => stringify(v.value)),
    strings: strings.map(v => stringify(v.value)),
  })

  const yTrue = new DataFrame({
    booleans1: booleans1.map(v => {
      return {
        type: v.type,
        value:
          v.type === "null"
            ? v.inferred
            : !isUndefined(v.inferred)
              ? v.inferred
              : v.value,
      }
    }),

    booleans2: booleans2.map(v => {
      return {
        type: v.type,
        value:
          v.type === "null"
            ? v.inferred
            : !isUndefined(v.inferred)
              ? v.inferred
              : v.value,
      }
    }),

    dates: dates.map(v => {
      return {
        type: v.type,
        value:
          v.type === "null"
            ? v.inferred
            : !isUndefined(v.inferred)
              ? v.inferred
              : v.value,
      }
    }),

    floats: floats.map(v => {
      return {
        type: v.type,
        value:
          v.type === "null"
            ? v.inferred
            : !isUndefined(v.inferred)
              ? v.inferred
              : v.value,
      }
    }),

    integers: integers.map(v => {
      return {
        type: v.type,
        value:
          v.type === "null"
            ? v.inferred
            : !isUndefined(v.inferred)
              ? v.inferred
              : v.value,
      }
    }),

    nulls: nulls.map(v => {
      return {
        type: v.type,
        value:
          v.type === "null"
            ? v.inferred
            : !isUndefined(v.inferred)
              ? v.inferred
              : v.value,
      }
    }),

    objects: objects.map(v => {
      return {
        type: v.type,
        value:
          v.type === "null"
            ? v.inferred
            : !isUndefined(v.inferred)
              ? v.inferred
              : v.value,
      }
    }),

    strings: strings.map(v => {
      return {
        type: v.type,
        value:
          v.type === "null"
            ? v.inferred
            : !isUndefined(v.inferred)
              ? v.inferred
              : v.value,
      }
    }),
  })

  const yPred = getDataTypes(x, true)

  range(0, x.shape[0]).forEach(i => {
    range(0, x.shape[1]).forEach(j => {
      const vTrue = yTrue.values[i][j]
      const vPred = yPred.values[i][j]
      expect(isEqual(vTrue, vPred)).toBe(true)
    })
  })

  expect(isEqual(yTrue.columns, yPred.columns)).toBe(true)
  expect(isEqual(yTrue.index, yPred.index)).toBe(true)

  // per-column inference
  const yTrue2 = new DataFrame({
    booleans1: booleans1.map(v => {
      return {
        type: "boolean",
        value: cast(v.value, "boolean"),
      }
    }),

    booleans2: booleans2.map(v => {
      return {
        type: "boolean",
        value: cast(v.value, "boolean"),
      }
    }),

    dates: dates.map(v => {
      return {
        type: "date",
        value: cast(v.value, "date"),
      }
    }),

    floats: floats.map(v => {
      return {
        type: "float",
        value: cast(v.value, "number"),
      }
    }),

    integers: integers.map(v => {
      return {
        type: "integer",
        value: parseInt(cast(v.value, "number")),
      }
    }),

    nulls: nulls.map(v => {
      return {
        type: "null",
        value: cast(v.value, "null"),
      }
    }),

    objects: objects.map(v => {
      return {
        type: "object",
        value: cast(v.value, "object"),
      }
    }),

    strings: strings.map(v => {
      return {
        type: "string",
        value: cast(v.value, "string"),
      }
    }),
  })

  const yPred2 = getDataTypes(x)

  range(0, x.shape[0]).forEach(i => {
    range(0, x.shape[1]).forEach(j => {
      const vTrue = yTrue2.values[i][j]
      const vPred = yPred2.values[i][j]
      expect(isEqual(vTrue, vPred)).toBe(true)
    })
  })

  expect(isEqual(yTrue2.columns, yPred2.columns)).toBe(true)
  expect(isEqual(yTrue2.index, yPred2.index)).toBe(true)
})
