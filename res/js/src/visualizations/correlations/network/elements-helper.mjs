import { truncate } from "../../../utils/index.mjs"

// NOTE: This helper class holds every candidate edge (i.e., every pair of
// columns in the correlation matrix) in a set of parallel typed arrays rather
// than as objects. Only the handful of edges that survive the user's filtering
// rules are ever materialized as objects for Cytoscape. That matters a lot for
// wide datasets: a 500-column matrix has ~125k candidate pairs, but we only
// ever draw a few dozen of them.
class ElementsHelper {
  // correlation modes
  static PARTIAL_CORRELATION_MODE = "partial correlation mode"
  static REGULAR_PAIRWISE_CORRELATION_MODE = "regular pairwise correlation mode"

  // filtration modes
  // (i.e., modes for filtering out edges and nodes)
  static EDGE_COUNT_MODE = "edge count mode"
  static EDGE_WEIGHT_MODE = "edge weight mode"
  static P_VALUE_MODE = "p-value mode"

  // colors
  static COLOR_NEGATIVE = "orange"
  static COLOR_POSITIVE = "blue"

  _correlationMode = ElementsHelper.PARTIAL_CORRELATION_MODE
  _maxEdgeCount = 40
  _maxPValue = 0.05
  _minEdgeWeight = 0

  // the candidate edges, stored columnar-style; `_count` is how many of the
  // preallocated slots are actually in use
  _count = 0
  _pValue = new Float64Array(0)
  _src = new Int32Array(0)
  _tgt = new Int32Array(0)
  _weight = new Float64Array(0)

  // node names, indexed by the values in `_src` / `_tgt`
  _colNames = []
  _rowNames = []
  _truncationMode = null

  // the edges materialized by the most recent `getElements` call
  _lastEdges = []

  filtrationMode = null

  constructor(correlationMode) {
    this.correlationMode = correlationMode
  }

  get correlationMode() {
    return this._correlationMode
  }

  set correlationMode(mode) {
    this._correlationMode = mode
    this.filtrationMode = null
  }

  get maxEdgeCount() {
    return this._maxEdgeCount
  }

  set maxEdgeCount(count) {
    this._maxEdgeCount = count
    this.filtrationMode = ElementsHelper.EDGE_COUNT_MODE
  }

  get maxPValue() {
    return this._maxPValue
  }

  set maxPValue(p) {
    this._maxPValue = p
    this.filtrationMode = ElementsHelper.P_VALUE_MODE
  }

  get minEdgeWeight() {
    return this._minEdgeWeight
  }

  set minEdgeWeight(weight) {
    this._minEdgeWeight = weight
    this.filtrationMode = ElementsHelper.EDGE_WEIGHT_MODE
  }

  // Loads a whole correlation matrix at once. Only the upper triangle is
  // walked, so each pair is recorded exactly once and we never have to build
  // (and then discard) a reversed edge name to deduplicate.
  addMatrix(values, rowNames, colNames, pValues, truncationMode) {
    const n = Math.min(rowNames.length, colNames.length)
    const capacity = (n * (n - 1)) / 2

    this._rowNames = rowNames
    this._colNames = colNames
    this._truncationMode = truncationMode
    this._pValue = new Float64Array(capacity)
    this._src = new Int32Array(capacity)
    this._tgt = new Int32Array(capacity)
    this._weight = new Float64Array(capacity)

    let k = 0

    for (let i = 0; i < n; i++) {
      const row = values[i]
      const pRow = pValues ? pValues[i] : null

      for (let j = i + 1; j < n; j++) {
        const weight = row[j]

        // don't create edges with abs(weight) < 0.001 (or with weights that
        // aren't real numbers at all)
        if (!Number.isFinite(weight) || Math.abs(weight) < 0.001) continue

        this._src[k] = i
        this._tgt[k] = j
        this._weight[k] = weight
        this._pValue[k] = pRow ? pRow[j] : NaN
        k++
      }
    }

    this._count = k
    this._lastEdges = []
    return this
  }

  // Sorts and filters the candidate edges according to the current filtration
  // mode, returning the indices of the survivors. Sorting an array of indices
  // (rather than an array of edge objects) keeps this cheap even when there
  // are hundreds of thousands of candidates.
  _selectIndices() {
    const byPValue = (a, b) => this._pValue[a] - this._pValue[b]

    const byWeight = (a, b) =>
      Math.abs(this._weight[b]) - Math.abs(this._weight[a])

    // in partial correlation mode there are no p-values to sort by, so we
    // always fall back to edge weight
    const isPartial =
      this.correlationMode === ElementsHelper.PARTIAL_CORRELATION_MODE

    let indices = new Int32Array(this._count)
    for (let i = 0; i < this._count; i++) indices[i] = i

    // in p-value filtration mode, we sort the edges by p-value (ascending) and
    // drop all of the edges with p-value > maxPValue
    if (this.filtrationMode === ElementsHelper.P_VALUE_MODE) {
      indices.sort(byPValue)
      indices = indices.filter(i => this._pValue[i] <= this.maxPValue)
    }

    // in edge weight filtration mode, we sort the edges by weight (descending)
    // and drop all of the edges with abs(weight) < minEdgeWeight
    else if (this.filtrationMode === ElementsHelper.EDGE_WEIGHT_MODE) {
      indices.sort(byWeight)

      indices = indices.filter(
        i => Math.abs(this._weight[i]) > this.minEdgeWeight,
      )
    }

    // in edge count mode, we sort all of the edges
    // (1) by p-value (ascending) if in regular pairwise correlation mode or
    // (2) by weight (descending) if in partial correlation mode
    else if (this.filtrationMode === ElementsHelper.EDGE_COUNT_MODE) {
      indices.sort(isPartial ? byWeight : byPValue)
    }

    // in the first-run mode, we sort all of the edges the same way as in edge
    // count mode, and then also drop all edges with p-value > maxPValue
    else {
      indices.sort(isPartial ? byWeight : byPValue)

      if (!isPartial) {
        indices = indices.filter(i => this._pValue[i] <= this.maxPValue)
      }
    }

    // the edge count is a hard ceiling in every mode; without it, a permissive
    // p-value or weight filter would hand Cytoscape every edge in the matrix
    if (indices.length > this.maxEdgeCount) {
      indices = indices.slice(0, this.maxEdgeCount)
    }

    this._recordStats(indices)
    return indices
  }

  // Records the settings implied by the edges we're about to return, so that
  // the other inputs in the UI describe what's actually on screen. The setting
  // the user just changed is deliberately left alone.
  _recordStats(indices) {
    let maxPValue = -Infinity
    let minEdgeWeight = Infinity

    for (const i of indices) {
      const p = this._pValue[i]
      const weight = Math.abs(this._weight[i])
      if (p > maxPValue) maxPValue = p
      if (weight < minEdgeWeight) minEdgeWeight = weight
    }

    // (in partial correlation mode there are no p-values, and with an empty
    // result there's nothing to describe, so we leave the settings as they are)
    if (
      Number.isFinite(maxPValue) &&
      this.filtrationMode !== ElementsHelper.P_VALUE_MODE
    ) {
      this._maxPValue = maxPValue
    }

    if (
      Number.isFinite(minEdgeWeight) &&
      this.filtrationMode !== ElementsHelper.EDGE_WEIGHT_MODE
    ) {
      this._minEdgeWeight = minEdgeWeight
    }

    this._maxEdgeCount = indices.length
  }

  _makeEdge(sourceName, targetName, weight, pValue) {
    const a = Math.abs(weight) * 0.85 + 0.15

    return {
      type: "edge",

      data: {
        id: sourceName + "-" + targetName,
        source: sourceName,
        target: targetName,
        weight,
        weightLabel: weight.toNonZeroFixed(2),
        pValue,
      },

      style: {
        width: Math.abs(weight) * 20 + 1,
        "line-color":
          weight < 0
            ? ElementsHelper.COLOR_NEGATIVE
            : ElementsHelper.COLOR_POSITIVE,
        "line-opacity": a,
        "line-style": "solid",
        "line-dash-pattern": [10, 10],
      },
    }
  }

  _makeNode(name) {
    return {
      type: "node",

      data: {
        id: name,
        longName: truncate(name, 32, this._truncationMode),
        shortName: truncate(name, 16, this._truncationMode),
        fullName: name,
      },
    }
  }

  // Returns the edges produced by the most recent `getElements` call. (It
  // doesn't recompute anything; `getElements` is what does the work.)
  getEdges() {
    return this._lastEdges
  }

  getElements() {
    const indices = this._selectIndices()
    const nodes = new Map()
    const edges = []

    // only those nodes which have at least one edge end up in the map
    for (const i of indices) {
      const sourceName = this._rowNames[this._src[i]]
      const targetName = this._colNames[this._tgt[i]]

      if (!nodes.has(sourceName)) {
        nodes.set(sourceName, this._makeNode(sourceName))
      }

      if (!nodes.has(targetName)) {
        nodes.set(targetName, this._makeNode(targetName))
      }

      edges.push(
        this._makeEdge(
          sourceName,
          targetName,
          this._weight[i],
          this._pValue[i],
        ),
      )
    }

    this._lastEdges = edges
    return Array.from(nodes.values()).concat(edges)
  }
}

export { ElementsHelper }
