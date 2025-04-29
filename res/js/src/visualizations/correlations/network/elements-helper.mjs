import { abs, max, min, sort } from "@jrc03c/js-math-tools"
import { truncate } from "../../../utils/index.mjs"

// NOTE: This helper class just exists to make sure that I don't create edges
// twice (once for each direction between nodes)! It also handles applying
// filtering rules to get edges and nodes based on user-defined settings.
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

  data = {
    edges: {},
    nodes: {},
  }

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

  createEdge(node1, node2, weight, weightFlipped, pValue) {
    // don't create edges with abs(weight) < 0.001
    if (Math.abs(weight) < 0.001) return

    const name = node1.data.id + "-" + node2.data.id
    const reverseName = node2.data.id + "-" + node1.data.id

    // if edge already exists, return it
    if (this.data.edges[name]) return this.data.edges[name]
    if (this.data.edges[reverseName]) return this.data.edges[reverseName]

    // otherwise, create edge
    const a = Math.abs(weight) * 0.85 + 0.15
    weightFlipped = weightFlipped || weight
    const weightsDoNotMatch = weight !== weightFlipped

    const edge = {
      type: "edge",

      data: {
        id: name,
        source: node1.data.id,
        target: node2.data.id,
        weight,
        weightLabel: parseFloat(weight).toNonZeroFixed(2),
        pValue,
      },

      style: {
        width: Math.abs(weight) * 20 + 1,
        "line-color":
          weight < 0
            ? ElementsHelper.COLOR_NEGATIVE
            : ElementsHelper.COLOR_POSITIVE,
        "line-opacity": a,
        "line-style": weightsDoNotMatch ? "dashed" : "solid",
        "line-dash-pattern": [10, 10],
      },
    }

    this.data.edges[name] = edge
    return edge
  }

  createNode(name, truncationMode) {
    // if node already exists, return it
    if (this.data.nodes[name]) return this.data.nodes[name]

    // otherwise, create node
    const node = {
      type: "node",

      data: {
        id: name,
        longName: truncate(name, 32, truncationMode),
        shortName: truncate(name, 16, truncationMode),
        fullName: name,
      },
    }

    this.data.nodes[name] = node
    return node
  }

  getEdges() {
    let edges = Object.keys(this.data.edges).map(name => this.data.edges[name])

    // in p-value filtration mode, we sort the edges by p-value (ascending) and
    // drop all of the edges with p-value > maxPValue;
    // if there are less than 40 left, then we simply return them;
    // otherwise, we take the top 40;
    // then, we record the min edge weight and count of the returned edges
    if (this.filtrationMode === ElementsHelper.P_VALUE_MODE) {
      edges = sort(edges, (a, b) => a.data.pValue - b.data.pValue)
      edges = edges.filter(edge => edge.data.pValue <= this.maxPValue)
      // if (edges.length > 40) edges = edges.slice(0, 40)
      this._minEdgeWeight = min(edges.map(edge => abs(edge.data.weight)))
      this._maxEdgeCount = edges.length
    }

    // in edge weight filtration mode, we sort the edges by weight (descending)
    // and drop all of the edges with abs(weight) < minEdgeWeight;
    // if there are less than 40 left, then we simply return them;
    // otherwise, we take the top 40;
    // then, we record the max p-value and the count of the returned edges
    else if (this.filtrationMode === ElementsHelper.EDGE_WEIGHT_MODE) {
      edges = sort(edges, (a, b) => abs(b.data.weight) - abs(a.data.weight))
      edges = edges.filter(edge => abs(edge.data.weight) > this.minEdgeWeight)
      // if (edges.length > 40) edges = edges.slice(0, 40)
      this._maxPValue = max(edges.map(edge => edge.data.pValue))
      this._maxEdgeCount = edges.length
    }

    // in edge count mode, we sort all of the edges
    // (1) by p-value (ascending) if in regular pairwise correlation mode or
    // (2) by weight (descending) if in partial correlation mode;
    // then, we return the top N edges;
    // then, we record the max p-value and the min edge weight
    // of the returned edges
    else if (this.filtrationMode === ElementsHelper.EDGE_COUNT_MODE) {
      if (this.correlationMode === ElementsHelper.PARTIAL_CORRELATION_MODE) {
        edges = sort(edges, (a, b) => abs(b.data.weight) - abs(a.data.weight))
      } else if (
        this.correlationMode ===
        ElementsHelper.REGULAR_PAIRWISE_CORRELATION_MODE
      ) {
        edges = sort(edges, (a, b) => a.data.pValue - b.data.pValue)
      }

      edges = edges.slice(0, this.maxEdgeCount)
      this._maxPValue = max(edges.map(edge => edge.data.pValue))
      this._minEdgeWeight = min(edges.map(edge => abs(edge.data.weight)))
      this._maxEdgeCount = edges.length
    }

    // in the first-run mode, we sort all of the edges
    // (1) by p-value (ascending) if in regular pairwise correlation mode or
    // (2) by weight (descending) if in partial correlation mode
    //     and then drop all edges with p-value > 0.05
    // then, we return the top N edges;
    // then, we record the max p-value and the min edge weight
    // of the returned edges
    else if (this.filtrationMode === null) {
      if (this.correlationMode === ElementsHelper.PARTIAL_CORRELATION_MODE) {
        edges = sort(edges, (a, b) => abs(b.data.weight) - abs(a.data.weight))
      } else if (
        this.correlationMode ===
        ElementsHelper.REGULAR_PAIRWISE_CORRELATION_MODE
      ) {
        edges = sort(edges, (a, b) => a.data.pValue - b.data.pValue)
        edges = edges.filter(edge => edge.data.pValue <= this.maxPValue)
      }

      edges = edges.slice(0, this.maxEdgeCount)
      this._maxPValue = max(edges.map(edge => edge.data.pValue))
      this._minEdgeWeight = min(edges.map(edge => abs(edge.data.weight)))
      this._maxEdgeCount = edges.length
    }

    return edges
  }

  getElements() {
    const edges = this.getEdges()
    const nodes = this.getNodes(edges)
    return nodes.concat(edges)
  }

  getNodes(edges) {
    // after the edges have been filtered using the relevant rules,
    // return only those nodes which have at least one edge
    const nodes = Object.keys(this.data.nodes).map(
      name => this.data.nodes[name],
    )

    return nodes.filter(node => {
      return edges.some(
        edge =>
          edge.data.source === node.data.id ||
          edge.data.target === node.data.id,
      )
    })
  }

  removeEdge(edge) {
    const name = edge.data.id
    const reverseName = edge.data.target + "-" + edge.data.source
    delete this.data.edges[name]
    delete this.data.edges[reverseName]
    return this
  }

  removeNode(node) {
    delete this.data.nodes[node.data.id]
    return this
  }
}

export { ElementsHelper }
