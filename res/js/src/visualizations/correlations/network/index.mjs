// ========================================================================= //
// <style> ----------------------------------------------------------------- //
// ========================================================================= //

const css = /* css */ `
	.hvis-correlations-network-vis .hvis-collapsible {
		margin-bottom: 0;
	}

	.hvis-correlations-network-vis .hvis-root {
		position: relative;
	}

	.hvis-correlations-network-vis .hvis-controls-container {
		position: absolute;
		top: calc(var(--padding) / 2);
		left: calc(var(--padding) / 2);
		z-index: 999;
	}

	.hvis-correlations-network-vis .hvis-field {
		margin-bottom: var(--padding);
	}

	.hvis-correlations-network-vis .hvis-field .hvis-label {
		display: block;
		margin-bottom: calc(var(--padding) / 4);
		font-weight: bold;
	}

	.hvis-correlations-network-vis .hvis-correlations-legend-container {
		position: absolute;
		top: calc(var(--padding) / 2);
		right: calc(var(--padding) / 2);
		z-index: 999;
	}

	.hvis-correlations-network-vis .hvis-cytoscape-container {
		width: 100%;
		height: auto;
	}
`

// ========================================================================= //
// <template> -------------------------------------------------------------- //
// ========================================================================= //

const template = /* html */ `
	<div class="hvis-correlations-network-vis">
    <div v-if="typeof error === 'string'" class="hvis-card is-warning" style="margin-bottom: 2rem">
			<div class="hvis-card-content">
				<div class="hvis-content" style="display: flex; flex-direction: column; gap: 1rem"> 
					<p style="margin: auto">A network visualization could not be generated for this dataset</p>
				</div>
			</div>
		</div>
		<div v-else-if="isComputing">
			<hvis-progress
				:message="progress.message"
				:percent="progress.percent">
			</hvis-progress>
		</div>

		<div v-else>
			<hvis-collapsible
				:start-expanded="true"
				@collapsed="recomputeViewportBounds"
				@expanded="recomputeViewportBounds"
				title="Settings">
				<div class="hvis-field">
					<label class="hvis-label">Mode</label>

					<div class="hvis-select">
						<select v-model="chosenModeOption">
							<option
								:key="modeOption.value"
								:value="modeOption.value"
								v-for="modeOption in modeOptions">
								{{ modeOption.name }}
							</option>
						</select>
					</div>
				</div>

				<div class="hvis-field">
					<label class="hvis-label">Node layout algorithm</label>

					<div class="hvis-select">
						<select v-model="chosenNodeLayoutAlgorithm">
							<option
								:key="algorithm.value"
								:value="algorithm.value"
								v-for="algorithm in nodeLayoutAlgorithms">
								{{ algorithm.name }}
							</option>
						</select>
					</div>
				</div>

				<div class="hvis-row">
					<div
						class="hvis-row-item"
						v-if="chosenModeOption === 'regularPairwiseCorrelationMode'">
						<div class="hvis-field">
							<label class="hvis-label">Max p-value</label>

							<div class="hvis-control">
								<input
									@blur="parsePValue"
									@keydown.enter="parsePValueAndSelect"
									max="1"
									min="0"
									step="0.01"
									type="number"
									v-model="maxPValueTemp" />
							</div>
						</div>
					</div>

					<div
						class="hvis-row-item hvis-row-item-skinny"
						v-if="chosenModeOption === 'regularPairwiseCorrelationMode'">
						<span class="hvis-icon">
							<i class="la-link las"></i>
						</span>
					</div>

					<div class="hvis-row-item">
						<div class="hvis-field">
							<label class="hvis-label">Min correlation magnitude</label>

							<div class="hvis-control">
								<input
									@blur="parseMinEdgeWeight"
									@keydown.enter="parseMinEdgeWeightAndSelect"
									max="1"
									min="0"
									step="0.01"
									type="number"
									v-model="minEdgeWeightTemp" />
							</div>
						</div>
					</div>

					<div class="hvis-row-item hvis-row-item-skinny">
						<span class="hvis-icon">
							<i class="la-link las"></i>
						</span>
					</div>

					<div class="hvis-row-item">
						<div class="hvis-field">
							<label class="hvis-label">Max number of edges</label>

							<div class="hvis-control">
								<input
									@blur="parseMaxEdgeCount"
									@keydown.enter="parseMaxEdgeCountAndSelect"
									min="0"
									step="1"
									type="number"
									v-model="maxEdgeCountTemp" />
							</div>
						</div>
					</div>
				</div>
			</hvis-collapsible>

			<div class="hvis-root">
				<div class="hvis-cytoscape-container" ref="container"></div>

				<div class="hvis-controls-container">
					<button @click="resetView">
						Reset view
					</button>
				</div>

				<div class="hvis-correlations-legend-container">
					<hvis-correlations-legend
						:color-negative="colors.positive"
						:color-positive="colors.negative"
						:points="points"
						@hovered-over-value="highlightRValue">
					</hvis-correlations-legend>
				</div>
			</div>
		</div>
	</div>
`

// ========================================================================= //
// <script> ---------------------------------------------------------------- //
// ========================================================================= //

import { clamp, set, sort } from "@jrc03c/js-math-tools"
import { CollapsibleComponent } from "../../../components/collapsible.mjs"
import { CorrelationsLegendComponent } from "../legend.mjs"
import { createApp } from "vue/dist/vue.esm-bundler.js"
import { createVueComponentWithCSS } from "@jrc03c/vue-component-with-css"
import { debounce, getCSSVariableValue } from "../../../utils/index.mjs"
import { ElementsHelper } from "./elements-helper.mjs"
import { pause } from "@jrc03c/pause"
import { ProgressComponent } from "../../../components/progress.mjs"
import { store } from "../../../store/index.mjs"
import cytoscape from "cytoscape"
import CytoscapeCola from "cytoscape-cola"
import CytoscapeCoseBilkent from "cytoscape-cose-bilkent"
import CytoscapeEuler from "cytoscape-euler"
import CytoscapeFcose from "cytoscape-fcose"
import CytoscapeKlay from "cytoscape-klay"
import { partial } from "filesize"

cytoscape.use(CytoscapeCola)
cytoscape.use(CytoscapeCoseBilkent)
cytoscape.use(CytoscapeEuler)
cytoscape.use(CytoscapeFcose)
cytoscape.use(CytoscapeKlay)
cytoscape.warnings(false)

async function CorrelationsNetworkVisualization(options) {
  options = options || {}

  if (options.data) {
    await store.setCoreData(options.data, options.customHash)
  }

  if (options.dataTypes) {
    await store.setCoreDataTypes(options.dataTypes)
  }

  const component = createVueComponentWithCSS({
    name: "hvis-correlations-network-vis",

    components: {
      "hvis-collapsible": await CollapsibleComponent({
        shouldReturnComponentOnly: true,
      }),
      "hvis-correlations-legend": await CorrelationsLegendComponent({
        shouldReturnComponentOnly: true,
      }),
      "hvis-progress": await ProgressComponent({
        shouldReturnComponentOnly: true,
      }),
    },

    template,

    data() {
      return {
        chosenModeOption: null,
        chosenNodeLayoutAlgorithm: null,
        colors: {
          negative:
            options.colors && options.colors.negative
              ? options.colors.negative
              : getCSSVariableValue("--vis-corr-network-color-negative") ||
              "orange",
          positive:
            options.colors && options.colors.positive
              ? options.colors.positive
              : getCSSVariableValue("--vis-corr-network-color-positive") ||
              "dodgerblue",
        },
        css,
        cy: null,
        helper: null,
        highlightedRValue: null,
        isComputing: false,
        justUpdatedMaxEdgeCount: false,
        justUpdatedMaxPValue: false,
        justUpdatedMinEdgeWeight: false,
        layout: null,
        maxEdgeCount: 40,
        maxEdgeCountTemp: 40,
        maxPValue: 1,
        maxPValueTemp: 1,
        minEdgeWeight: 0,
        minEdgeWeightTemp: 0,
        modeOptions: [
          { name: "Partial Correlation Mode", value: "partialCorrelationMode" },
          {
            name: "Regular Pairwise Correlation Mode",
            value: "regularPairwiseCorrelationMode",
          },
        ],
        nodeLayoutAlgorithms: [
          { name: "Breadth-first", value: "breadthfirst" },
          { name: "Circle", value: "circle" },
          { name: "Cola", value: "cola" },
          { name: "Concentric", value: "concentric" },
          { name: "CoSE-Bilkent", value: "cose-bilkent" },
          { name: "CoSE", value: "cose" },
          { name: "Euler", value: "euler" },
          { name: "fCoSE", value: "fcose" },
          { name: "Grid", value: "grid" },
          { name: "Klay", value: "klay" },
          { name: "Random", value: "random" },
        ],
        numberOfEdges: 0,
        numberOfNodes: 0,
        points: [],
        progress: {
          message: "Computing...",
          percent: 0,
        },
        error: null,
      }
    },

    watch: {
      chosenModeOption() {
        this.redraw()
      },

      chosenNodeLayoutAlgorithm() {
        if (!this.cy) return
        if (this.layout) this.layout.stop()
        this.layout = this.cy.elements().layout(this.layoutSettings)
        this.layout.run()
      },
    },

    computed: {
      layoutSettings() {
        return {
          name: this.chosenNodeLayoutAlgorithm,
          randomize: true,
          nodeDimensionsIncludeLabels: true,
          animate: false,

          stop() {
            if (!this.cy.width) return
            this.resetView()
          },
        }
      },
    },

    methods: {
      highlightRValue(r) {
        this.highlightedRValue = r

        const edges = this.cy.edges()
        const nodes = this.cy.nodes()
        const visibleNodes = []

        if (typeof r === "number") {
          Object.keys(edges).forEach(key => {
            const edge = edges[key]

            try {
              if (Math.abs(edge._private.data.weight - r) > 0.025) {
                edge.addClass("semitransparent-edge")
              } else {
                edge.removeClass("semitransparent-edge")

                const connectedNodes = edge.connectedNodes()

                Object.keys(connectedNodes).forEach(key2 => {
                  const node = connectedNodes[key2]
                  visibleNodes.push(node)
                })
              }
            } catch (e) { }
          })

          Object.keys(nodes).forEach(key => {
            const node = nodes[key]

            try {
              node.addClass("semitransparent-node")
            } catch (e) { }
          })

          visibleNodes.forEach(node => {
            try {
              node.removeClass("semitransparent-node")
            } catch (e) { }
          })
        } else {
          Object.keys(edges).forEach(key => {
            const edge = edges[key]

            try {
              edge.removeClass("semitransparent-edge")
            } catch (e) { }
          })

          Object.keys(nodes).forEach(key => {
            const node = nodes[key]

            try {
              node.removeClass("semitransparent-node")
            } catch (e) { }
          })
        }
      },

      parseMaxEdgeCount() {
        const count = clamp(parseInt(this.maxEdgeCountTemp), 0, Infinity)
        const shouldRedraw = count !== this.maxEdgeCount
        this.maxEdgeCount = count
        this.maxEdgeCountTemp = count
        this.justUpdatedMaxEdgeCount = shouldRedraw
        if (shouldRedraw) this.redraw()
      },

      parseMaxEdgeCountAndSelect(event) {
        this.parseMaxEdgeCount()

        setTimeout(() => {
          event.target.select()
        }, 100)
      },

      parseMinEdgeWeight() {
        const weight = clamp(
          parseFloat(parseFloat(this.minEdgeWeightTemp).toFixed(4)),
          0,
          1,
        )

        const shouldRedraw = weight !== this.minEdgeWeight
        this.minEdgeWeight = weight
        this.minEdgeWeightTemp = weight
        this.justUpdatedMinEdgeWeight = shouldRedraw
        if (shouldRedraw) this.redraw()
      },

      parseMinEdgeWeightAndSelect(event) {
        this.parseMinEdgeWeight()

        setTimeout(() => {
          event.target.select()
        }, 100)
      },

      parsePValue() {
        const p = clamp(
          parseFloat(parseFloat(this.maxPValueTemp).toFixed(4)),
          0,
          1,
        )

        const shouldRedraw = p !== this.maxPValue
        this.maxPValue = p
        this.maxPValueTemp = p
        this.justUpdatedMaxPValue = shouldRedraw
        if (shouldRedraw) this.redraw()
      },

      parsePValueAndSelect(event) {
        this.parsePValue()

        setTimeout(() => {
          event.target.select()
        }, 100)
      },

      recomputeViewportBounds() {
        if (!this.cy) return
        this.cy.unmount()

        setTimeout(() => {
          this.cy.mount(this.$refs.container)
        }, 10)
      },

      async redraw() {
        this.isComputing = true

        ElementsHelper.COLOR_NEGATIVE = this.colors.negative
        ElementsHelper.COLOR_POSITIVE = this.colors.positive

        const mode =
          this.chosenModeOption === "partialCorrelationMode"
            ? ElementsHelper.PARTIAL_CORRELATION_MODE
            : ElementsHelper.REGULAR_PAIRWISE_CORRELATION_MODE

        this.helper = new ElementsHelper(mode)

        if (this.justUpdatedMaxPValue) {
          this.helper.maxPValue = this.maxPValue
        }

        if (this.justUpdatedMinEdgeWeight) {
          this.helper.minEdgeWeight = this.minEdgeWeight
        }

        if (this.justUpdatedMaxEdgeCount) {
          this.helper.maxEdgeCount = this.maxEdgeCount
        }

        if (this.chosenModeOption === "partialCorrelationMode") {
          const partialCorrelations = await store.getPartialCorrelations(
            null,
            p => {
              this.progress.message = p.message
              this.progress.percent = p.progress * 100
            },
          )
          if (typeof partialCorrelations === "string") {
            this.error = partialCorrelations
            this.isComputing = false
            return
          }
          if (partialCorrelations.columns.length < 2) {
            this.error = "Not enough data to compute partial correlations."
            this.isComputing = false
            return
          }

          if (!partialCorrelations) {
            return
          }

          partialCorrelations.values.forEach((row, i) => {
            const rowName = partialCorrelations.index[i]

            row.forEach((value, j) => {
              if (i !== j) {
                const colName = partialCorrelations.columns[j]

                const node1 = this.helper.createNode(
                  rowName,
                  store.settings.truncationMode,
                )

                const node2 = this.helper.createNode(
                  colName,
                  store.settings.truncationMode,
                )

                this.helper.createEdge(node1, node2, value, value)
              }
            })
          })
        } else if (this.chosenModeOption === "regularPairwiseCorrelationMode") {
          const pValues = await store.getPValues(null, p => {
            this.progress.message = p.message
            this.progress.percent = (p.progress * 100) / 2
          })

          if (!pValues) {
            return
          }

          const regularCorrelations = await store.getRegularCorrelations(
            null,
            p => {
              this.progress.message = p.message
              this.progress.percent = (p.progress * 100) / 2 + 1 / 2
            },
          )

          if (!regularCorrelations) {
            return
          }

          regularCorrelations.values.forEach((row, i) => {
            const rowName = regularCorrelations.index[i]

            row.forEach((value, j) => {
              if (i !== j) {
                const colName = regularCorrelations.columns[j]
                const weight = value
                const pValue = pValues.values[i][j]

                const node1 = this.helper.createNode(
                  rowName,
                  store.settings.truncationMode,
                )

                const node2 = this.helper.createNode(
                  colName,
                  store.settings.truncationMode,
                )

                this.helper.createEdge(node1, node2, weight, weight, pValue)
              }
            })
          })
        }

        this.isComputing = false

        while (!this.$refs.container) {
          await pause(10)
        }

        const containerRect = this.$refs.container.getBoundingClientRect()
        this.$refs.container.style.height = `${containerRect.width}px`
        this.$refs.container.style["max-height"] = `75vh`

        if (this.cy) this.cy.destroy()

        this.cy = cytoscape({
          container: this.$refs.container,
          elements: this.helper.getElements(),
          wheelSensitivity: 0.5,

          style: [
            {
              selector: "node",
              style: {
                "background-color": "white",
                "border-color": "gray",
                "border-width": 3,
                label: "data(shortName)",
                "text-margin-y": -10,
                "text-events": "yes",
              },
            },

            {
              selector: ".labelled-node",
              style: {
                label: "data(fullName)",
              },
            },

            {
              selector: ".fully-labelled-node",
              style: {
                label: "data(fullName)",
              },
            },

            {
              selector: ".semitransparent-node",
              style: {
                opacity: 0.1,
              },
            },

            {
              selector: ".labelled-edge",
              style: {
                label: "data(weightLabel)",
              },
            },

            {
              selector: ".semitransparent-edge",
              style: {
                opacity: 0.1,
              },
            },
          ],
        })

        this.layout = this.cy.elements().layout(this.layoutSettings)
        this.layout.run()

        let selectedNode, selectedEdge

        this.cy.on("mousedown", "node", event => {
          this.cy.nodes().forEach(node => node.addClass("semitransparent-node"))
          selectedNode = event.target
          selectedNode.addClass("labelled-node")
          selectedNode.removeClass("semitransparent-node")
        })

        this.cy.on("mouseup", "node", () => {
          this.cy
            .nodes()
            .forEach(node => node.removeClass("semitransparent-node"))

          if (selectedNode) {
            selectedNode.removeClass("labelled-node")
          }

          selectedNode = null
        })

        this.cy.on("mousedown", "edge", event => {
          this.cy.edges().forEach(edge => edge.addClass("semitransparent-edge"))
          this.cy.nodes().forEach(node => node.addClass("semitransparent-node"))
          selectedEdge = event.target
          selectedEdge.addClass("labelled-edge")
          selectedEdge.removeClass("semitransparent-edge")
          selectedEdge.source().addClass("labelled-node")
          selectedEdge.source().removeClass("semitransparent-node")
          selectedEdge.target().addClass("labelled-node")
          selectedEdge.target().removeClass("semitransparent-node")
        })

        this.cy.on("mouseup", "edge", () => {
          this.cy
            .edges()
            .forEach(edge => edge.removeClass("semitransparent-edge"))
          this.cy
            .nodes()
            .forEach(node => node.removeClass("semitransparent-node"))
          this.cy.nodes().forEach(node => node.removeClass("labelled-node"))
          if (selectedEdge) selectedEdge.removeClass("labelled-edge")
          selectedEdge = null
        })

        this.justUpdatedMaxPValue = false
        this.justUpdatedMinEdgeWeight = false
        this.justUpdatedMaxEdgeCount = false

        const p = parseFloat(this.helper.maxPValue.toFixed(4))
        this.maxPValue = p
        this.maxPValueTemp = p

        const weight = parseFloat(this.helper.minEdgeWeight.toFixed(4))
        this.minEdgeWeight = weight
        this.minEdgeWeightTemp = weight

        const count = this.helper.maxEdgeCount
        this.maxEdgeCount = count
        this.maxEdgeCountTemp = count

        this.points = sort(
          set(this.helper.getEdges().map(edge => edge.data.weight)),
        )
      },

      resetView() {
        this.cy.fit(this.cy.width() * 0.15)
      },
    },

    async mounted() {
      await pause(100)

      this.chosenModeOption = "partialCorrelationMode"
      this.chosenNodeLayoutAlgorithm = "cola"

      this.nodeLayoutAlgorithms.sort((a, b) => {
        const aName = a.name.toLowerCase()
        const bName = b.name.toLowerCase()
        if (aName < bName) return -1
        if (aName > bName) return 1
        return 0
      })

      this.redraw = debounce(this.redraw, 100, this)
      this.redraw()

      window.addEventListener("resize", this.redraw)
    },

    beforeUnmount() {
      if (this.cy) {
        this.cy.destroy()
        this.cy = null
      }

      window.removeEventListener("resize", this.redraw)
    },
  })

  if (options.shouldReturnComponentOnly) {
    return component
  }

  const app = createApp(component)

  if (options.el) {
    app.mount(options.el)
  }

  return app
}

export { CorrelationsNetworkVisualization }
