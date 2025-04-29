import {
  count,
  DataFrame,
  flatten,
  int,
  isEqual,
  isUndefined,
  normal,
  random,
  range,
  sort,
} from "@jrc03c/js-math-tools"

import { getDataTypes } from "../get-data-types.mjs"
import { getVariableDistributions } from "./index.mjs"
import { makeKey } from "@jrc03c/make-key"

test("tests that boolean distributions can be computed correctly", async () => {
  const x = new DataFrame({
    x: range(0, 1000).map(() =>
      random() < 0.01 ? null : random() < random() ? true : false,
    ),
  })

  const counts = count(x.values).toArray()

  const points = [
    [false, counts.find(c => c.value === false).count],
    [true, counts.find(c => c.value === true).count],
  ]

  const yPred = (await getVariableDistributions(x, getDataTypes(x)))[0]
  yPred.points = sort(yPred.points, (a, b) => a[0] - b[0])
  expect(yPred.name).toBe("x")
  expect(isEqual(points, yPred.points)).toBe(true)
  expect(yPred.dataType).toBe("boolean")
  expect(yPred.distributionType).toBe("discrete")
  expect(yPred.isADemographicVariable).toBe(false)
})

test("tests that binary distributions can be computed correctly", async () => {
  const x = new DataFrame({
    x: range(0, 1000).map(() =>
      random() < 0.01 ? null : random() < random() ? 1 : 0,
    ),
  })

  const counts = count(x.values).toArray()

  const points = [
    [0, counts.find(c => c.value === 0).count],
    [1, counts.find(c => c.value === 1).count],
  ]

  const yPred = structuredClone(
    (await getVariableDistributions(x, getDataTypes(x)))[0],
  )

  yPred.points = sort(yPred.points, (a, b) => a[0] - b[0])
  expect(yPred.name).toBe("x")
  expect(isEqual(points, yPred.points)).toBe(true)
  expect(yPred.dataType).toBe("integer")
  expect(yPred.distributionType).toBe("discrete")
  expect(yPred.isADemographicVariable).toBe(false)
})

test("tests that date distributions from a small set can be computed correctly", async () => {
  const datesSet = range(0, 7).map(
    () => new Date(int(random() * new Date().getTime())),
  )

  const x = new DataFrame({
    x: range(0, 1000).map(() =>
      random() < 0.01 ? null : datesSet[int(random() * datesSet.length)],
    ),
  })

  const counts = count(
    x.get("x").values.map(v => {
      try {
        return v.getTime()
      } catch (e) {
        return v
      }
    }),
  ).toArray()

  const points = sort(counts, (a, b) => a.value - b.value)
    .filter(c => c.value !== null)
    .map(c => [c.value, c.count])

  const yPred = (await getVariableDistributions(x, getDataTypes(x)))[0]
  yPred.points = sort(yPred.points, (a, b) => a[0] - b[0])
  expect(yPred.name).toBe("x")
  expect(isEqual(points, yPred.points)).toBe(true)
  expect(yPred.dataType).toBe("date")
  expect(yPred.distributionType).toBe("discrete")
  expect(yPred.isADemographicVariable).toBe(false)
})

test("tests that date distributions of all unique values can be computed correctly", async () => {
  const x = new DataFrame({
    x: range(0, 1000).map(() =>
      random() < 0.01 ? null : new Date(int(random() * new Date().getTime())),
    ),
  })

  const yPred = (await getVariableDistributions(x, getDataTypes(x)))[0]

  flatten(yPred.points).forEach(v => {
    expect(typeof v).toBe("number")
  })

  expect(yPred.name).toBe("x")
  expect(yPred.dataType).toBe("date")
  expect(yPred.distributionType).toBe("continuous")
  expect(yPred.isADemographicVariable).toBe(false)
})

test("tests that distributions of null values are not computed at all", async () => {
  const nulls = [null, undefined, NaN]

  const x = new DataFrame({
    x: range(0, 1000).map(() => nulls[int(random() * nulls.length)]),
  })

  const yPred = await getVariableDistributions(x, getDataTypes(x))
  expect(yPred.length).toBe(0)
})

test("tests that integer distributions from a small set can be computed correctly", async () => {
  const intsSet = range(-3, 4)

  const x = new DataFrame({
    x: range(0, 1000).map(() =>
      random() < 0.01 ? null : intsSet[int(random() * intsSet.length)],
    ),
  })

  const counts = count(
    flatten(x.values)
      .filter(v => !isUndefined(v))
      .filter(v => typeof v !== "number" || v.toString() !== "NaN"),
  ).toArray()

  const points = sort(counts, (a, b) => a.value - b.value).map(c => [
    c.value,
    c.count,
  ])

  const yPred = structuredClone(
    (await getVariableDistributions(x, getDataTypes(x)))[0],
  )

  yPred.points = sort(yPred.points, (a, b) => a[0] - b[0])
  expect(yPred.name).toBe("x")
  expect(isEqual(points, yPred.points)).toBe(true)
  expect(yPred.dataType).toBe("integer")
  expect(yPred.distributionType).toBe("discrete")
  expect(yPred.isADemographicVariable).toBe(false)
})

test("tests that integer distributions of all unique values can be computed correctly", async () => {
  const x = new DataFrame({
    x: sort(range(0, 1000), () => Math.random() * 2 - 1),
  })

  const yPred = structuredClone(
    (await getVariableDistributions(x, getDataTypes(x)))[0],
  )

  flatten(yPred.points).forEach(v => {
    expect(typeof v).toBe("number")
  })

  expect(yPred.name).toBe("x")
  expect(yPred.dataType).toBe("integer")
  expect(yPred.distributionType).toBe("continuous")
  expect(yPred.isADemographicVariable).toBe(false)
})

test("tests that float distributions from a small set can be computed correctly", async () => {
  const floatSet = normal(7)

  const x = new DataFrame({
    x: range(0, 1000).map(() =>
      random() < 0.01 ? null : floatSet[int(random() * floatSet.length)],
    ),
  })

  const counts = count(
    flatten(x.values)
      .filter(v => !isUndefined(v))
      .filter(v => typeof v !== "number" || v.toString() !== "NaN"),
  ).toArray()

  const points = sort(counts, (a, b) => a.value - b.value).map(c => [
    c.value,
    c.count,
  ])

  const yPred = structuredClone(
    (await getVariableDistributions(x, getDataTypes(x)))[0],
  )

  yPred.points = sort(yPred.points, (a, b) => a[0] - b[0])
  expect(yPred.name).toBe("x")
  expect(isEqual(points, yPred.points)).toBe(true)
  expect(yPred.dataType).toBe("float")
  expect(yPred.distributionType).toBe("discrete")
  expect(yPred.isADemographicVariable).toBe(false)
})

test("tests that integer distributions of all unique values can be computed correctly", async () => {
  const x = new DataFrame({ x: normal(1000) })

  const yPred = structuredClone(
    (await getVariableDistributions(x, getDataTypes(x)))[0],
  )

  flatten(yPred.points).forEach(v => {
    expect(typeof v).toBe("number")
  })

  expect(yPred.name).toBe("x")
  expect(yPred.dataType).toBe("float")
  expect(yPred.distributionType).toBe("continuous")
  expect(yPred.isADemographicVariable).toBe(false)
})

test("tests that object distributions from a small set can be computed correctly", async () => {
  const objsSet = range(0, 7).map(() => ({
    x: normal(),
    y: normal(),
    z: normal(),
  }))

  const x = new DataFrame({
    x: range(0, 1000).map(() =>
      random() < 0.01 ? null : objsSet[int(random() * objsSet.length)],
    ),
  })

  const counts = count(flatten(x.values).filter(v => v !== null)).toArray()

  const points = sort(counts, (a, b) => b.count - a.count).map(c => [
    c.value,
    c.count,
  ])

  const yPred = structuredClone(
    (await getVariableDistributions(x, getDataTypes(x)))[0],
  )

  yPred.points = sort(yPred.points, (a, b) => b[1] - a[1])
  expect(yPred.name).toBe("x")
  expect(isEqual(points, yPred.points)).toBe(true)
  expect(yPred.dataType).toBe("object")
  expect(yPred.distributionType).toBe("discrete")
  expect(yPred.isADemographicVariable).toBe(false)
})

test("tests that object distributions of all unique values are not computed at all", async () => {
  const x = new DataFrame({
    x: range(0, 1000).map(() =>
      random() < 0.01 ? null : { x: normal(), y: normal(), z: normal() },
    ),
  })

  const yPred = structuredClone(
    await getVariableDistributions(x, getDataTypes(x)),
  )

  expect(yPred.length).toBe(0)
})

test("tests that string distributions from a small set can be computed correctly", async () => {
  const stringsSet = range(0, 7).map(() => makeKey(8))

  const x = new DataFrame({
    x: range(0, 1000).map(() =>
      random() < 0.01 ? null : stringsSet[int(random() * stringsSet.length)],
    ),
  })

  const counts = count(flatten(x.values).filter(v => v !== null)).toArray()

  const points = sort(counts, (a, b) => b.count - a.count).map(c => [
    c.value,
    c.count,
  ])

  const yPred = structuredClone(
    (await getVariableDistributions(x, getDataTypes(x)))[0],
  )

  yPred.points = sort(yPred.points, (a, b) => b[1] - a[1])
  expect(yPred.name).toBe("x")
  expect(isEqual(points, yPred.points)).toBe(true)
  expect(yPred.dataType).toBe("string")
  expect(yPred.distributionType).toBe("discrete")
  expect(yPred.isADemographicVariable).toBe(false)
})

test("tests that string distributions of all unique values are not computed at all", async () => {
  const x = new DataFrame({
    x: range(0, 1000).map(() => (random() < 0.01 ? null : makeKey(8))),
  })

  const yPred = structuredClone(
    await getVariableDistributions(x, getDataTypes(x)),
  )

  expect(yPred.length).toBe(0)
})
