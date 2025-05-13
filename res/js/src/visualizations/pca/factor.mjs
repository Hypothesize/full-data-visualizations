// ========================================================================= //
// <style> ----------------------------------------------------------------- //
// ========================================================================= //

const css = /* css */ `
	.hvis-pca-factor-vis {
		border-radius: 4px;
		margin-bottom: 1.5em;
	}

	.hvis-pca-factor-vis .hvis-title {
		margin: 0;
	}

	.hvis-pca-factor-vis .hvis-row-centered {
		gap: calc(var(--padding) / 2);
	}

	.hvis-pca-factor-vis .hvis-title,
	.hvis-pca-factor-vis .hvis-title * {
		font-family: var(--font-family-title);
		font-weight: var(--font-weight-title);
	}

	.hvis-pca-factor-vis .hvis-title button {
		position: relative;
		top: -0.0625em;
	}

	.hvis-pca-factor-vis high-dpi-canvas {
		border-radius: var(--border-radius);
		overflow: hidden;
	}
`

// ========================================================================= //
// <template> -------------------------------------------------------------- //
// ========================================================================= //

const template = /* html */ `
	<div class="hvis-pca-factor-vis">
		<div class="hvis-title hvis-row-centered">
			<span>{{ title }}</span>

			<button @click="startRename" class="is-clear is-rounded">
				<img :src="editImageURL" class="hvis-icon">
			</button>
		</div>

		<div ref="container"></div>

		<hvis-modal-with-prompt
			:is-active="renameModalIsVisible"
			@cancel="cancelRename"
			@confirm="confirmRename"
			title="Rename">
			<p>Rename factor "{{ title }}" to:</p>

			<div>
				<input
					@keydown.enter="confirmRename"
					@keydown.escape="cancelRename"
					ref="renameInput"
					type="text"
					v-model="newFactorTitle" />
			</div>
		</hvis-modal-with-prompt>
	</div>
`

// ========================================================================= //
// <script> ---------------------------------------------------------------- //
// ========================================================================= //

import {
  abs,
  argmax,
  argmin,
  assert,
  int,
  isNumber,
  max,
  remap,
} from "@jrc03c/js-math-tools"

import { createApp } from "vue/dist/vue.esm-bundler.js"
import { createHighDPICanvas } from "@jrc03c/create-high-dpi-canvas"
import { createVueComponentWithCSS } from "@jrc03c/vue-component-with-css"
import { debounce, truncate, Vector2, urlPathJoin } from "../../utils/index.mjs"
import { ModalWithPromptComponent } from "../../components/modal-with-prompt.mjs"
import { Point } from "./point.mjs"
import { store } from "../../store/index.mjs"

async function PCAFactorVisualization(options) {
  options = options || {}

  const component = createVueComponentWithCSS({
    name: "hvis-pca-factor-vis",
    emits: ["rename"],

    components: {
      "hvis-modal-with-prompt": await ModalWithPromptComponent({
        shouldReturnComponentOnly: true,
      }),
    },

    template,

    props: {
      "color-negative": {
        type: String,
        required: false,
        default: () =>
          options.colors && options.colors.negative
            ? options.colors.negative
            : "orange",
      },

      "color-positive": {
        type: String,
        required: false,
        default: () =>
          options.colors && options.colors.positive
            ? options.colors.positive
            : "blue",
      },

      loadings: {
        type: Object,
        required: false,
        default: () => options.loadings || null,
      },
    },

    data() {
      return {
        css,
        newFactorTitle: "",
        renameModalIsVisible: false,
        title: "Factor 1",
        truncationMode: "end",
      }
    },

    computed: {
      editImageURL() {
        return urlPathJoin(store.baseURL, store.imageDir, "edit.svg")
      },
    },

    watch: {
      loadings() {
        this.redraw()
      },
    },

    methods: {
      cancelRename() {
        this.renameModalIsVisible = false
      },

      confirmRename() {
        this.renameModalIsVisible = false
        this.title = this.newFactorTitle
        this.$emit("rename", this.title)
      },

      redraw() {
        Point.COLOR_NEGATIVE = this.colorNegative
        Point.COLOR_POSITIVE = this.colorPositive

        // set title
        this.title = this.loadings.name

        // get width & height and reset container
        const container = this.$refs.container
        if (!container) return

        const containerRect = container.getBoundingClientRect()
        container.innerHTML = ""
        const width = int(containerRect.width)
        const height = max([int(width / 5.5), 150])

        // draw to offscreen canvas
        const offscreenCanvas = createHighDPICanvas(width, height)
        const offscreenContext = offscreenCanvas.getContext("2d")
        const padding = height / 4.5
        const fontSize = max([padding / 2, 10])
        const barHeight = height - 3 * padding - fontSize
        const loadings = this.loadings.values

        const points = loadings
          .filter(v => isNumber(v))
          .map((value, i) => {
            const fullName = this.loadings.index[i]
            const shortName = truncate(fullName, 16, this.truncationMode)
            const longName = truncate(fullName, 32, this.truncationMode)
            return new Point(shortName, longName, fullName, value)
          })

        offscreenContext.fillStyle = "rgb(235, 235, 235)"
        offscreenContext.fillRect(0, 0, width, height)

        offscreenContext.strokeStyle = "gray"
        offscreenContext.lineWidth = 2

        offscreenContext.beginPath()
        offscreenContext.moveTo(padding, height - padding - barHeight / 2)

        offscreenContext.lineTo(
          width - padding,
          height - padding - barHeight / 2,
        )

        offscreenContext.stroke()

        offscreenContext.fillStyle = "gray"
        offscreenContext.font = `${fontSize}px monospace`
        offscreenContext.textAlign = "center"
        offscreenContext.textBaseline = "middle"

        for (let i = -1; i <= 1; i += 0.5) {
          const x = remap(i, -1, 1, padding, width - padding)
          offscreenContext.beginPath()
          offscreenContext.moveTo(x, height - padding)
          offscreenContext.lineTo(x, height - padding - barHeight)
          offscreenContext.stroke()

          offscreenContext.fillText(
            i,
            x,
            height - 2 * padding - barHeight - fontSize / 2,
          )
        }

        points.sort(a => (a.isActivated ? 1 : -1))

        points.forEach(point =>
          point.display(offscreenContext, padding, barHeight),
        )

        // set up onscreen canvas
        const canvas = createHighDPICanvas(width, height)
        container.appendChild(canvas)

        // draw to onscreen canvas
        const context = canvas.getContext("2d")
        const mouse = { position: new Vector2(0, 0), isClicked: false }

        const lowestPointIndex = argmin(points.map(p => p.value))
        const highestPointIndex = argmax(points.map(p => p.value))

        assert(
          isNumber(lowestPointIndex),
          `The loadings for the factor "${this.loadings.name}" are all NaN values!`,
        )

        assert(
          isNumber(highestPointIndex),
          `The loadings for the factor "${this.loadings.name}" are all NaN values!`,
        )

        points[lowestPointIndex].isActivated = true
        points[highestPointIndex].isActivated = true

        const loop = () => {
          context.drawImage(offscreenCanvas.element, 0, 0, width, height)

          let pointClosestToMouse
          let pointClosestToMouseDistance = Infinity
          let hoveredPoint
          const activatedPoints = points.filter(p => p.isActivated)

          if (
            pointThatWasJustDeactivated &&
            Vector2.distance(mouse.position, deactivationPosition) >
            pointThatWasJustDeactivated.radius * 1.25
          ) {
            pointThatWasJustDeactivated = null
          }

          points
            .filter(point => {
              return point !== pointThatWasJustDeactivated
            })
            .forEach(point => {
              const dist = Vector2.distance(point.position, mouse.position)

              if (dist < pointClosestToMouseDistance) {
                pointClosestToMouse = point
                pointClosestToMouseDistance = dist
              }
            })

          if (
            pointClosestToMouse &&
            pointClosestToMouseDistance < pointClosestToMouse.radius * 1.25
          ) {
            hoveredPoint = pointClosestToMouse
          }

          if (hoveredPoint) {
            activatedPoints.forEach(point =>
              point.display(context, padding, barHeight, false, true),
            )

            hoveredPoint.display(context, padding, barHeight, true, false)
            document.body.style.cursor = "pointer"
          } else {
            activatedPoints.forEach(point =>
              point.display(
                context,
                padding,
                barHeight,
                false,
                mouseIsOverCanvas,
              ),
            )

            document.body.style.cursor = "default"
          }
        }

        let clickedPoint, mouseIsOverCanvas
        let pointThatWasJustDeactivated, deactivationPosition

        const onMouseMove = event => {
          mouse.position.x = event.offsetX
          mouse.position.y = event.offsetY
          loop()
        }

        const onMouseEnter = () => {
          mouseIsOverCanvas = true
          loop()
        }

        const onMouseLeave = () => {
          mouseIsOverCanvas = false
          loop()
        }

        const onMouseDown = () => {
          let pointClosestToMouse
          let pointClosestToMouseDistance = Infinity

          points.forEach(point => {
            const dist = Vector2.distance(point.position, mouse.position)

            if (dist < pointClosestToMouseDistance) {
              pointClosestToMouse = point
              pointClosestToMouseDistance = dist
            }
          })

          if (
            pointClosestToMouse &&
            pointClosestToMouseDistance < pointClosestToMouse.radius * 1.25
          ) {
            clickedPoint = pointClosestToMouse
            clickedPoint.isBeingClicked = true
          }

          loop()
        }

        const onMouseUp = () => {
          points.forEach(point => (point.isBeingClicked = false))

          if (clickedPoint) {
            if (
              Vector2.distance(mouse.position, clickedPoint.position) <
              clickedPoint.radius * 1.25
            ) {
              clickedPoint.isActivated = !clickedPoint.isActivated

              if (!clickedPoint.isActivated) {
                pointThatWasJustDeactivated = clickedPoint
                deactivationPosition = mouse.position.copy()
              } else {
                pointThatWasJustDeactivated = null
              }
            }
          }

          clickedPoint = null
          loop()
        }

        canvas.addEventListener("touchstart", event => {
          onMouseEnter()

          onMouseMove(
            new MouseEvent("mousemove", {
              clientX: event.touches[0].clientX,
              clientY: event.touches[0].clientY,
            }),
          )

          onMouseDown()
        })

        canvas.addEventListener("touchend", () => {
          onMouseLeave()
          onMouseUp()
        })

        canvas.addEventListener("mousemove", onMouseMove)
        canvas.addEventListener("mouseenter", onMouseEnter)
        canvas.addEventListener("mouseleave", onMouseLeave)
        canvas.addEventListener("mousedown", onMouseDown)
        canvas.addEventListener("mouseup", onMouseUp)

        loop()
      },

      startRename() {
        this.renameModalIsVisible = true
        this.newFactorTitle = this.title

        setTimeout(() => {
          this.$refs.renameInput.focus()
          this.$refs.renameInput.select()
        }, 100)
      },
    },

    mounted() {
      this.redraw()
      this.redraw = debounce(this.redraw, 100, this)
      window.addEventListener("resize", this.redraw)
    },

    unmounted() {
      window.removeEventListener("resize", this.redraw)
      store.resetQueen()
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

export { PCAFactorVisualization }
