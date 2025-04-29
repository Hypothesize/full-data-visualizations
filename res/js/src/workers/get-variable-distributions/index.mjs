import { ArrayNumeric } from "./array-numeric.mjs"

import {
  cast,
  count,
  DataFrame,
  dropMissing,
  dropNaN,
  inferType,
  int,
  isDataFrame,
  isNumber,
  isUndefined,
  max,
  sort,
  sum,
} from "@jrc03c/js-math-tools"

import { DistributionResult } from "./distribution-result.mjs"
import { hunterChainSort } from "@jrc03c/js-data-science-helpers"
import { isInWebWorker } from "../../utils/is-in-web-worker.mjs"
import { KdeDistribution } from "./kde-distribution.mjs"
import { resurrect } from "../../utils/index.mjs"
import { symmetrize } from "../tf-helpers/symmetrize.mjs"
import { tfGetCorrelationMatrixAsync } from "../tf-helpers/get-correlation-matrix-async.mjs"
import * as Bee from "@jrc03c/bee"

// valid types:
// - boolean
// - date
// - null
// - number
//   - integer
//   - float
// - object
// - string

const demographicsPhrases = [
  "age",
  "agnostic",
  "atheist",
  "buddh",
  "child",
  "children",
  "christ",
  "city",
  "valueslege",
  "country",
  "date of birth",
  "dependents",
  "education",
  "employed",
  "employment",
  "ethnicity",
  "female",
  "gender",
  "hindu",
  "income",
  "islam",
  "jew",
  "job",
  "location",
  "male",
  "marital",
  "married",
  "muslim",
  "pay",
  "race",
  "relationship",
  "religion",
  "religious",
  "salary",
  "sex",
  "sikh",
  "trans",
  "wealth",
  "year of birth",
  "years old",
  "yob",
  "zip",
]

function hasFewUniqueValues(x, n, p) {
  // returns a boolean indicating whether or not the `n` most frequent values
  // account for at least `p` percent of all values in `x`

  x = x.filter(v => !isUndefined(v) && (!isNumber(v) || v.toString() !== "NaN"))
  n = n || 7
  p = p || 0.95

  const counts = sort(count(x).toArray(), (a, b) => b.count - a.count)
  return sum(counts.slice(0, n).map(c => c.count)) / x.length >= p
}

function getContinuousDistributionResult(name, type, x) {
  const vector = ArrayNumeric.fromValues(x)
  const valuesumn = vector
  const bandwidth = (vector.max - vector.min) / 10

  const kde = new KdeDistribution(
    valuesumn,
    vector,
    "KernelGaussian",
    bandwidth,
    null,
  )

  const numberOfSeriesPoints = 250
  const points = kde.seriesFn(numberOfSeriesPoints)
  const yvalues = points.map(p => p[1])
  const ymax = max(yvalues)

  points.forEach(p => {
    p[1] /= ymax
  })

  return new DistributionResult(name, points, type, "continuous")
}

function getDiscreteDistributionResult(
  name,
  type,
  x,
  topNToCount,
  percentThreshold,
) {
  topNToCount = topNToCount || 7
  percentThreshold = percentThreshold || 0.95
  const counts = sort(count(x).toArray(), (a, b) => b.count - a.count)

  let othersCount = 0
  let s = 0
  let done = false

  const topNCounts = counts.filter((c, i) => {
    s += c.count / x.length

    if (!done) {
      if (s > percentThreshold || i >= topNToCount) {
        done = true
      }

      return true
    } else {
      othersCount += c.count
      return false
    }
  })

  topNCounts.sort((a, b) => {
    if (
      type === "boolean" ||
      type === "date" ||
      type === "float" ||
      type === "integer" ||
      type === "number"
    ) {
      return a.value - b.value
    } else {
      return b.count - a.count
    }
  })

  if (othersCount > 0) {
    topNCounts.push({
      value: "Other",
      count: othersCount,
    })
  }

  const points = topNCounts.map(c => [c.value, c.count])
  return new DistributionResult(name, points, type, "discrete")
}

function getMostCommonDataTypeForColumn(x, column, dataTypeCache) {
  if (dataTypeCache[column]) {
    return dataTypeCache[column]
  }

  const type = sort(
    count(x.get(column).values.map(v => v?.type)).toArray(),
    (a, b) => b.count - a.count,
  )[0].value

  dataTypeCache[column] = type
  return type
}

async function getVariableDistributions(data, dataTypes, config, progress) {
  if (progress) {
    progress(0)
  }

  if (!isDataFrame(data)) {
    data = resurrect(data)
  }

  if (!isDataFrame(dataTypes)) {
    dataTypes = resurrect(dataTypes)
  }

  config = config || {}
  const topNToCount = config.topNToCount || 7

  // get distributions
  const dataTypeCache = {}
  const demographicVariables = []
  const continuousVariables = []
  const discreteVariables = []
  const datesHolder = {}

  data.apply((col, i) => {
    if (progress) {
      progress(i / data.columns.length)
    }

    // get distribution
    let values, type

    if (dataTypes.columns.indexOf(col.name) > -1) {
      values = dropMissing(col.values)
      type = getMostCommonDataTypeForColumn(dataTypes, col.name, dataTypeCache)
    } else {
      const inferred = inferType(col.values)
      values = inferred.values
      type = inferred.type
    }

    if (type === "integer") {
      values = int(dropNaN(cast(dropMissing(values), "number")))
    } else if (type === "float" || type === "number") {
      values = dropNaN(cast(dropMissing(values), "number"))
    } else {
      values = dropMissing(cast(values, type))
    }

    let result

    if (col.length === 0) {
      return
    }

    if (type === "boolean") {
      result = getDiscreteDistributionResult(
        col.name,
        type,
        values,
        topNToCount,
      )
    }

    if (type === "date") {
      const times = cast(col.values, "date").map(d => (d ? d.getTime() : null))
      const nonMissingTimes = dropMissing(times)
      datesHolder[col.name] = times

      if (hasFewUniqueValues(times, topNToCount)) {
        result = getDiscreteDistributionResult(
          col.name,
          type,
          nonMissingTimes,
          topNToCount,
        )
      } else {
        result = getContinuousDistributionResult(
          col.name,
          type,
          nonMissingTimes,
        )
      }
    }

    if (type === "null") {
      return
    }

    if (type === "number" || type === "integer" || type === "float") {
      if (hasFewUniqueValues(values, topNToCount)) {
        result = getDiscreteDistributionResult(
          col.name,
          type,
          values,
          topNToCount,
        )
      } else {
        result = getContinuousDistributionResult(col.name, type, values)
      }
    }

    if (type === "object") {
      if (hasFewUniqueValues(values, topNToCount)) {
        result = getDiscreteDistributionResult(
          col.name,
          type,
          values,
          topNToCount,
        )
      } else {
        return
      }
    }

    if (type === "string") {
      if (hasFewUniqueValues(values, topNToCount)) {
        result = getDiscreteDistributionResult(
          col.name,
          type,
          values,
          topNToCount,
        )
      } else {
        return
      }
    }

    // categorize distribution
    if (!result || !result.name) {
      throw new Error(
        `The column "${col.name}" produced no distribution result! (${result})`,
      )
    }

    const resultNameLower = result.name.toLowerCase()

    const isDemographic = demographicsPhrases.some(p =>
      resultNameLower.includes(p),
    )

    if (isDemographic) {
      result.isADemographicVariable = true
      demographicVariables.push(result)
    } else if (result.distributionType === "continuous") {
      continuousVariables.push(result)
    } else {
      discreteVariables.push(result)
    }
  })

  // sort demographic and discrete variables alphabetically by name
  demographicVariables.sort((a, b) => (a.name < b.name ? -1 : 1))
  discreteVariables.sort((a, b) => (a.name < b.name ? -1 : 1))

  // sort continuous variables by relatedness
  if (continuousVariables.length > 1) {
    const continuousVariableNames = continuousVariables.map(v => v.name)

    const continuousData = data.get(continuousVariableNames).apply(col => {
      if (
        getMostCommonDataTypeForColumn(data, col.name, dataTypeCache) === "date"
      ) {
        return datesHolder[col.name]
      }

      return col.values
    })

    const c = new DataFrame(await tfGetCorrelationMatrixAsync(continuousData))
    c.columns = continuousVariableNames
    c.index = continuousVariableNames
    const cSorted = hunterChainSort(symmetrize(c))

    if (progress) {
      progress(1)
    }

    return demographicVariables
      .concat(
        cSorted.index.map(name =>
          continuousVariables.find(v => v.name === name),
        ),
      )
      .concat(discreteVariables)
  } else {
    if (progress) {
      progress(1)
    }

    return demographicVariables
      .concat(continuousVariables)
      .concat(discreteVariables)
  }
}

if (isInWebWorker()) {
  const drone = new Bee.Drone()

  drone.on("get-variable-distributions", async (request, response) => {
    const out = await getVariableDistributions(
      request.data.data,
      request.data.dataTypes,
      request.data.config,
      p => {
        drone.emit("get-variable-distributions-progress", {
          progress: p,
          type: "info",
          message: `Getting variable distributions... (${(100 * p).toFixed(2)}%)`,
        })
      },
    )

    return response.send(out)
  })
}

export { getVariableDistributions }
