const ascendingNumericSort = (a, b) => a - b

class Distribution {
  constructor(column, vector) {
    this._column = column
    this._vector = vector.sort(ascendingNumericSort)
  }

  get densityFnExt() {
    if (this._densityFnExt === undefined) {
      this._densityFnExt = Object.assign(
        this.getDensityFnCore(),
        {
          likelihood: this.likelihood,
          distribution: this.name,
          description: this.description,
          seriesFn: this.seriesFn,
        },
        this.customParams,
      )
    }

    return this._densityFnExt
  }
}

export { Distribution }
