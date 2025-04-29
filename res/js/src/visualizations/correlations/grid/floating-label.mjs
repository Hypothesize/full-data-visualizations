// ========================================================================= //
// <style> ----------------------------------------------------------------- //
// ========================================================================= //

const css = /* css */ `
	.hvis-floating-label {
		position: fixed;
		padding: 1em;
		border: 2px solid black;
		border-radius: 4px;
		background-color: white;
		color: black;
		z-index: 1000;
		text-align: center;
		font-size: 10px;
		font-family: monospace;
		word-wrap: break-word;
		pointer-events: none;
	}
`

// ========================================================================= //
// <template> -------------------------------------------------------------- //
// ========================================================================= //

const template = /* html */ `
	<div :style="style" class="hvis-floating-label" v-html="content"></div>
`

// ========================================================================= //
// <script> ---------------------------------------------------------------- //
// ========================================================================= //

import { createVueComponentWithCSS } from "@jrc03c/vue-component-with-css"

const FloatingLabelComponent = createVueComponentWithCSS({
  name: "hvis-floating-label",
  template,

  props: {
    content: { type: String, default: "" },
    "h-align": { type: String, default: "center" },
    "v-align": { type: String, default: "middle" },
    width: { type: Number, default: null },
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
  },

  data() {
    return {
      css,
      innerHeight: null,
      innerWidth: 100,
      innerX: 0,
      innerY: 0,
      shouldUpdate: true,
      style: "",
    }
  },

  methods: {
    recomputeValues() {
      const rect = this.$el.getBoundingClientRect()
      this.innerWidth = Math.max(rect.width, this.width)
      this.innerHeight = rect.height

      this.innerX = this.x
      if (this.hAlign === "center") this.innerX -= this.innerWidth / 2
      if (this.hAlign === "right") this.innerX -= this.innerWidth

      this.innerY = this.y
      if (this.vAlign === "middle") this.innerY -= this.innerHeight / 2
      if (this.vAlign === "bottom") this.innerY -= this.innerHeight

      let style = ""
      style += `left: ${this.innerX}px;`
      style += `top: ${this.innerY}px;`

      if (this.width) {
        style += `width: ${this.innerWidth}px;`
        style += `min-width: ${this.innerWidth}px;`
        style += `max-width: ${this.innerWidth}px;`
      }

      this.style = style
    },
  },

  mounted() {
    const loop = () => {
      if (this.shouldUpdate) {
        window.requestAnimationFrame(loop)
      }

      this.recomputeValues()
    }

    loop()
  },

  beforeUnmount() {
    this.shouldUpdate = false
  },
})

export { FloatingLabelComponent }
