class DistributionResult {
  constructor(name, points, dataType, distributionType) {
    this.name = name
    this.points = points
    this.dataType = dataType
    this.distributionType = distributionType
    this.isADemographicVariable = false
  }
}

export { DistributionResult }
