// ========================================================================= //
// <style> ----------------------------------------------------------------- //
// ========================================================================= //

const css = /* css */ ``

// ========================================================================= //
// <template> -------------------------------------------------------------- //
// ========================================================================= //

const template = /* html */ `
	<div class="hvis-distribution-discrete-vis" ref="container"></div>
`

// ========================================================================= //
// <script> ---------------------------------------------------------------- //
// ========================================================================= //

import { createApp } from "vue/dist/vue.esm-bundler.js"
import { createHighDPICanvas } from "@jrc03c/create-high-dpi-canvas"
import { createVueComponentWithCSS } from "@jrc03c/vue-component-with-css"
import { debounce, unproxify } from "../../utils/index.mjs"
import { formatDate } from "./format-date.mjs"
import { getTicks } from "./get-ticks.mjs"
import { isUndefined, max, remap } from "@jrc03c/js-math-tools"
import { stringify } from "@jrc03c/js-text-tools"

async function DistributionDiscreteVisualization(options) {
  options = options || {}

  const component = createVueComponentWithCSS({
    name: "hvis-distribution-discrete",
    template,

    props: {
      colors: {
        required: false,
        default: () => options.colors || ["purple"],
      },

      "data-type": {
        type: String,
        required: false,
        default: () => options.dataType || "number",
      },

      points: {
        type: Array,
        required: false,
        default: () => options.points || [],
      },
    },

    data() {
      return {
        css,
      }
    },

    methods: {
      redraw() {
        if (!this.$refs || !this.$refs.container) return

        const colors =
          typeof this.colors === "string" ? [this.colors] : this.colors

        const rect = this.$refs.container.getBoundingClientRect()
        const width = rect.width
        const height = 256
        const padding = 32
        const canvas = createHighDPICanvas(width, height)
        const context = canvas.getContext("2d")
        this.$refs.container.innerHTML = ""
        this.$refs.container.appendChild(canvas)

        // draw axes
        context.strokeStyle = "gray"
        context.lineWidth = 2

        context.beginPath()
        context.moveTo(padding, padding)
        context.lineTo(padding, height - padding)
        context.stroke()

        context.beginPath()
        context.moveTo(padding, height - padding)
        context.lineTo(width - padding, height - padding)
        context.stroke()

        // draw ticks
        const points = this.points.filter(p => {
          if (isUndefined(p) || isUndefined(p[0]) || isNaN(p[1])) {
            return false
          }

          if (p[0].toString().toLowerCase() === "other") {
            if (isUndefined(p[1]) || p[1] === 0) {
              return false
            }
          }

          return true
        })

        const counts = points.map(p => p[1])
        const ymax = max(counts)
        const yticks = getTicks(counts.concat([0]), 5)

        context.font = "12px monospace"
        context.textAlign = "center"
        context.textBaseline = "top"
        context.fillStyle = "gray"
        context.textBaseline = "middle"

        yticks.forEach(ty => {
          const y = remap(ty, 0, ymax, height - padding, padding)
          context.beginPath()
          context.moveTo(padding - 4, y)
          context.lineTo(padding + 4, y)
          context.stroke()

          const tyFormatted = parseFloat(ty.toFixed(4))
          context.textAlign = "left"
          context.fillText(tyFormatted, padding + 8, y)
        })

        // draw bars and labels
        context.font = "12px monospace"
        const w = remap(1, 0, points.length, 0, width - 2 * padding) / 2

        const texts = points.map(p => {
          const value = p[0]

          try {
            if (this.dataType === "date") {
              return formatDate(value)
            }

            if (this.dataType === "object" && typeof value === "object") {
              if (value === null) {
                return null
              }

              return stringify(unproxify(value))
            }
          } catch (e) {}

          return value.toString()
        })

        const textIsTooWide = texts.some(text => {
          return context.measureText(text).width > w - 8
        })

        const maxChars = (() => {
          let text = "0"

          while (context.measureText(text + "0").width < height - 2 * padding) {
            text += "0"
          }

          return text.length
        })()

        points.forEach((p, i) => {
          const count = p[1]
          const label = texts[i]
          const x = remap(i + 1, 0, points.length + 1, padding, width - padding)

          // bar
          const h = remap(count, 0, ymax, 0, height - 2 * padding)
          context.fillStyle = colors[i % colors.length]
          context.strokeStyle = colors[i % colors.length]
          context.globalAlpha = 0.25
          context.fillRect(x - w / 2, height - padding - h, w, h)
          context.globalAlpha = 1
          context.strokeRect(x - w / 2, height - padding - h, w, h)

          // label
          context.fillStyle = "gray"
          context.save()

          if (textIsTooWide) {
            const textIsTooTall =
              context.measureText(label).width > height - 2 * padding

            context.textAlign = "left"
            context.translate(x, height - padding - 8)
            context.rotate(-Math.PI / 2)

            context.fillText(
              textIsTooTall ? label.substring(0, maxChars - 3) + "..." : label,
              0,
              0,
            )
          } else {
            context.textAlign = "center"
            context.translate(x, height - padding + 14)
            context.fillText(label, 0, 0)
          }

          context.restore()
        })
      },
    },

    mounted() {
      this.redraw = debounce(this.redraw, 100, this)
      this.redraw()
      window.addEventListener("resize", this.redraw)
    },

    beforeUnmount() {
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

export { DistributionDiscreteVisualization }
