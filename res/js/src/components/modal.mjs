// ========================================================================= //
// <style> ----------------------------------------------------------------- //
// ========================================================================= //

const css = /* css */ `
	.hvis-modal-component {
		display: none;
	}

	.hvis-modal-component.is-active {
		display: unset;
	}

	.hvis-modal-component,
	.hvis-modal-background,
	.hvis-modal-content {
		position: fixed;
		left: 0;
		top: 0;
		width: 100vw;
		min-width: 100vw;
		max-width: 100vw;
		height: 100vh;
		min-height: 100vh;
		max-height: 100vh;
		overflow: hidden;
		z-index: 999996;
	}

	.hvis-modal-component .hvis-modal-background {
		background-color: rgba(0, 0, 0, 0.67);
		z-index: 999997;
	}

	.hvis-modal-component .hvis-modal-content {
		z-index: 999998;
		pointer-events: none;
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		justify-content: center;
		align-content: center;
		align-items: center;
	}

	.hvis-modal-component .hvis-modal-content > * {
		z-index: 999999;
		pointer-events: all;
		width: fit-content;
		min-width: 384px;
		max-width: 768px;
		height: fit-content;
		min-height: fit-content;
		max-height: calc(100vh - calc(var(--padding) * 4));
		overflow-y: auto;
	}

	@media (max-width: 512px) {
		.hvis-modal-component .hvis-modal-content > * {
			width: calc(100vw - calc(var(--padding) * 4));
			min-width: calc(100vw - calc(var(--padding) * 4));
			max-width: calc(100vw - calc(var(--padding) * 4));
		}
	}
`

// ========================================================================= //
// <template> -------------------------------------------------------------- //
// ========================================================================= //

const template = /* html */ `
	<div :class="{ 'is-active': isActive }" class="hvis-modal-component">
		<div @click="$emit('close')" class="hvis-modal-background"></div>

		<div class="hvis-modal-content">
			<slot></slot>
		</div>
	</div>
`

// ========================================================================= //
// <script> ---------------------------------------------------------------- //
// ========================================================================= //

import { createApp } from "vue/dist/vue.esm-bundler.js"
import { createVueComponentWithCSS } from "@jrc03c/vue-component-with-css"

async function ModalComponent(options) {
  options = options || {}

  const component = createVueComponentWithCSS({
    name: "hvis-modal",
    emits: ["close"],
    template,

    props: {
      "is-active": {
        type: Boolean,
        default: () =>
          typeof options.isActive === "undefined" ? false : options.isActive,
      },
    },

    methods: {
      onKeyDown(event) {
        if (event.key === "Escape") {
          this.$emit("close")
        }
      },
    },

    data() {
      return {
        css,
      }
    },

    mounted() {
      window.addEventListener("keydown", this.onKeyDown)
    },

    beforeUnmount() {
      window.removeEventListener("keydown", this.onKeyDown)
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

export { ModalComponent }
