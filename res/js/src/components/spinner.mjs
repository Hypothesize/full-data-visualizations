// -----------------------------------------------------------------------------
// CSS
// -----------------------------------------------------------------------------

const css = /* css */ `
	.hvis-spinner {
		animation-name: spin;
		animation-duration: 1.5s;
		animation-timing-function: linear;
		animation-delay: 0;
		animation-iteration-count: infinite;
		animation-direction: normal;
		animation-fill-mode: forwards;
		animation-play-state: running;
		transform-origin: 50% 50%;
		width: auto;
		height: 1.25em;
		position: relative;
		top: -0.125em;
	}

	.hvis-spinner-not-spinning {
		animation: none;
		opacity: 0.75;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
			opacity: 1;
		}

		50% {
			transform: rotate(180deg);
			opacity: 0.5;
		}

		100% {
			transform: rotate(360deg);
			opacity: 1;
		}
	}
`

// -----------------------------------------------------------------------------
// HTML
// -----------------------------------------------------------------------------

const template = /* html */ `
	<img
		:src="checkImageURL"
		class="hvis-spinner hvis-spinner-not-spinning"
		v-if="isDone">

	<img
		:src="syncImageURL"
		class="hvis-spinner"
		v-else>
`

// -----------------------------------------------------------------------------
// JS
// -----------------------------------------------------------------------------

import { createApp } from "vue/dist/vue.esm-bundler.js"
import { createVueComponentWithCSS } from "@jrc03c/vue-component-with-css"
import { store } from "../store/index.mjs"
import { urlPathJoin } from "../utils/index.mjs"

async function SpinnerComponent(options) {
  options = options || {}

  const component = createVueComponentWithCSS({
    name: "x-component",
    template,

    props: {
      "is-done": {
        type: Boolean,
        required: false,
        default: () => false,
      },
    },

    data() {
      return {
        css,
      }
    },

    computed: {
      checkImageURL() {
        return urlPathJoin(store.baseURL, store.imageDir, "check.svg")
      },

      syncImageURL() {
        return urlPathJoin(store.baseURL, store.imageDir, "sync.svg")
      },
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

export { SpinnerComponent }
