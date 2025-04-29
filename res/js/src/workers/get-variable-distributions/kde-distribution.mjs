import { ArrayNumeric } from "./array-numeric.mjs"
import { Distribution } from "./distribution.mjs"
import { divide, log } from "@jrc03c/js-math-tools"

const ascendingNumericSort = (a, b) => a - b
const log16 = x => divide(log(x), log(16))
const sqrTwoPi = Math.sqrt(2 * Math.PI)
const UNIFORM_RANGE_MARGIN = 0.05

const KernelType = {
  KernelGaussian: "KernelGaussian",
  KernelRectangle: "KernelRectangle",
  KernelTriangle: "KernelTriangle",
  KernelDiscrete: "KernelDiscrete",
}

const kernelFunctions = {
  KernelGaussian: x => {
    return (1.0 / sqrTwoPi) * Math.exp((-x * x) / 2)
  },

  KernelRectangle: x => {
    return +(Math.abs(x) < 1) * 0.5
  },

  KernelDiscrete: x => {
    return +(Math.abs(x) < 1) * 0.5
  },

  KernelTriangle: x => {
    return +(Math.abs(x) < 1) * (1 - Math.abs(x))
  },
}

function furthestIndex(arr, refVal, refIndex, direction) {
  let furthestIndex = refIndex
  let testedIndex = direction === "left" ? --refIndex : ++refIndex
  let testedVal = arr[testedIndex]

  while (testedVal === refVal) {
    furthestIndex = testedIndex
    testedIndex = direction === "left" ? --refIndex : ++refIndex
    testedVal = arr[testedIndex]
  }

  return furthestIndex
}

function binarySearch(array, target) {
  // Define Start and End Index
  let startIndex = 0
  let endIndex = array.length - 1

  // While Start Index is less than or equal to End Index
  while (startIndex <= endIndex) {
    // Define Middle Index (This will change when comparing )
    const middleIndex = Math.floor((startIndex + endIndex) / 2)

    // Compare Middle Index with Target for match
    if (array[middleIndex] === target) {
      return { index: Math.max(middleIndex, 0), exactMatch: true }
    }

    // Search Right Side Of Array
    if (target > array[middleIndex]) {
      // Assign Start Index and increase the Index by 1 to narrow search
      startIndex = middleIndex + 1
    }

    // Search Left Side Of Array
    if (target < array[middleIndex]) {
      // Assign End Index and increase the Index by 1 to narrow search
      endIndex = middleIndex - 1
    }
  }

  // Target not found, return the index closest to the value
  return {
    exactMatch: false,

    index:
      Math.abs(array[startIndex] - target) < Math.abs(array[endIndex] - target)
        ? Math.max(startIndex, 0)
        : Math.max(endIndex, 0),
  }
}

function getFurthestMinMaxIndexes(array, min, max) {
  const minSearchResult = binarySearch(array, min)

  const minIndex = minSearchResult.exactMatch
    ? minSearchResult.index
    : furthestIndex(array, min, minSearchResult.index, "left")

  const maxSearchResult = binarySearch(array, max)

  const maxIndex = maxSearchResult.exactMatch
    ? maxSearchResult.index
    : furthestIndex(array, min, maxSearchResult.index, "right")

  return [minIndex, maxIndex]
}

// I just implemented dummy versions of these classes since I didn't have
// access to the dependencies! I hope I got their functionalities right!
class Tuple extends Array {}

class KdeDistribution extends Distribution {
  constructor(column, vector, kernelName, bandwidth, range) {
    super(column, vector)
    this._kernelFn = kernelFunctions[kernelName]
    this._kernelName = kernelName
    this._bandwidth = Math.max(bandwidth, 1e-16)
    this._range = range
    this._lengthDividedByLengthMinusOne = vector.length / (vector.length - 1)
    this._vectorTimesBw = vector.length * this._bandwidth
    this._vectorMinusOneTimesBw = (vector.length - 1) * this._bandwidth
  }

  get customParams() {
    return {
      bandwidth: this._bandwidth,
      kernel: this._kernelName,
    }
  }

  get description() {
    switch (this._kernelName) {
      case KernelType.KernelGaussian:
        return `Gaussian Kernel Density Estimation is a non-parametric way to estimate the probability density function of a random variable using a Gaussian function`
      case KernelType.KernelRectangle:
        return `Rectangle Kernel Density Estimation is a non-parametric way to estimate the probability density function of a random variable using a rectangular  window function`
      case KernelType.KernelTriangle:
        return `Triangle Kernel Density Estimation is a non-parametric way to estimate the probability density function of a random variable using a triangle function`
      case KernelType.KernelDiscrete:
        return `Kernel Density Estimation (KDE) is a non-parametric way to estimatethe probability density function of a random variable`
    }

    return null
  }

  get likelihood() {
    if (!this._likelihood) {
      const arr = new ArrayNumeric(this._vector)

      const likelihoods = arr
        .map(datum => {
          return Math.max(Math.log(this.XValidationDensityEst(datum)), log16)
        })
        .sort(ascendingNumericSort)

      const likelihoodLeft = likelihoods.removeSliceCounted(
        arr.length * 0.05,
        arr.length - 1,
      )

      this._likelihood = likelihoodLeft.sum()
    }

    return this._likelihood
  }

  get name() {
    switch (this._kernelName) {
      case KernelType.KernelGaussian:
        return KernelType.KernelGaussian
      case KernelType.KernelRectangle:
        return KernelType.KernelRectangle
      case KernelType.KernelTriangle:
        return KernelType.KernelTriangle
      case KernelType.KernelDiscrete:
        return KernelType.KernelDiscrete
    }

    return null
  }

  get seriesFn() {
    const max = this._column.max
    const min = this._column.min
    const densityFn = this.getDensityFnCore()
    const rangeMargin = (max - min) * 3 * UNIFORM_RANGE_MARGIN
    const range = this._range || [min - rangeMargin, max + rangeMargin]

    return numSeriesPoints => {
      const rawseries = ArrayNumeric.fromRange(range[0], range[1], {
        mode: "count",
        count: numSeriesPoints,
      })

      const series = rawseries.map(datum => {
        return new Tuple(datum, densityFn(datum))
      })

      return series
    }
  }

  getDensityFnCore(passedVector) {
    return x => {
      const multiplier = this._kernelName === "KernelGaussian" ? 2 : 1
      const min = x - this._bandwidth * multiplier
      const max = x + this._bandwidth * multiplier
      let vector

      if (passedVector === undefined) {
        const minMaxIndexes = getFurthestMinMaxIndexes(this._vector, min, max)

        vector = Object.assign(this._vector).slice(
          minMaxIndexes[0],
          minMaxIndexes[1] + 1,
        )
      } else {
        vector = passedVector
      }

      const result = vector.reduce((prev, curr) => {
        return (
          prev +
          this._kernelFn((x - curr) / this._bandwidth) / this._vectorTimesBw
        )
      }, 0)

      return result
    }
  }

  XValidationDensityEst(x) {
    const min = x - this._bandwidth
    const max = x + this._bandwidth
    const minMaxIndexes = getFurthestMinMaxIndexes(this._vector, min, max)
    const vector = this._vector.slice(minMaxIndexes[0], minMaxIndexes[1] + 1)

    return Math.max(
      this.getDensityFnCore(vector)(x) * this._lengthDividedByLengthMinusOne -
        this._kernelFn(0) / this._vectorMinusOneTimesBw,
      0,
    )
  }
}

export { KdeDistribution }
