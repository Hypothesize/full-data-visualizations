import { max, min, range } from "@jrc03c/js-math-tools"

function linspace(a, b, n) {
  return range(a, b, (b - a) / n)
}

class ArrayNumeric extends Array {
  static fromValues(values) {
    return new ArrayNumeric(...values)
  }

  static fromRange(a, b, config) {
    if (config.mode === "count") {
      return ArrayNumeric.fromValues(linspace(a, b, config.count))
    }
  }

  get min() {
    const shouldDropNaNs = true
    return min(this, shouldDropNaNs)
  }

  get max() {
    const shouldDropNaNs = true
    return max(this, shouldDropNaNs)
  }
}

export { ArrayNumeric }
