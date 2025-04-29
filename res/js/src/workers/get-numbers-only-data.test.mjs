import { getNumbersOnlyData } from "./get-numbers-only-data.mjs"
import { isDataFrame, isNumber } from "@jrc03c/js-math-tools"
import { loadCSV } from "@jrc03c/js-csv-helpers/node"
import path from "node:path"

test("tests that the `getNumbersOnlyData` function works as expected", async () => {
  const data = await loadCSV(
    path.join(import.meta.dirname, "..", "data", "mixed.csv"),
  )

  const numbersOnlyData = await getNumbersOnlyData(data)

  expect(isDataFrame(numbersOnlyData)).toBe(true)
  expect(numbersOnlyData.shape[0]).toBeGreaterThan(0)
  expect(numbersOnlyData.shape[1]).toBeGreaterThan(0)

  for (let i = 0; i < numbersOnlyData.values.length; i++) {
    for (let j = 0; j < numbersOnlyData.values[i].length; j++) {
      expect(isNumber(numbersOnlyData.values[i][j])).toBe(true)
    }
  }
})
