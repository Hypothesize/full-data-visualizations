// ========================================================================= //
// <style> ----------------------------------------------------------------- //
// ========================================================================= //

const css = /* css */ `
	.hvis-collapsible-component {
		margin-bottom: var(--padding);
	}

	.hvis-collapsible-component .hvis-collapsible-header {
		background-color: var(--color-gray-12);
		padding: var(--padding);
		cursor: pointer;
		user-select: none;
	}

	.hvis-collapsible-component .hvis-collapsible-header:hover {
		filter: brightness(105%);
	}

	.hvis-collapsible-component .hvis-collapsible-header:active {
		filter: brightness(90%);
	}

	.hvis-collapsible-component .hvis-collapsible-header.is-expanded {
		border-radius: var(--border-radius) var(--border-radius) 0 0;
	}

	.hvis-collapsible-component .hvis-collapsible-header.is-collapsed {
		border-radius: var(--border-radius);
	}

	.hvis-collapsible-component .hvis-collapsible-header .hvis-collapsible-title b {
		font-family: var(--font-family-title);
		font-weight: var(--font-weight-title);
	}

	.hvis-collapsible-component .hvis-collapsible-header img.hvis-icon {
		opacity: 0.5;
	}

	.hvis-collapsible-component .hvis-collapsible-content {
		background-color: var(--color-gray-13);
		padding: var(--padding);
		border-radius: 0 0 var(--border-radius) var(--border-radius);
	}

	.hvis-collapsible-component .hvis-collapsible-component .hvis-collapsible-content {
		background-color: var(--color-gray-12);
	}

	.hvis-chevron-down,
	.hvis-chevron-up {
		width: 1.5em;
		min-width: 1.5em;
		max-width: 1.5em;
		height: auto;
		min-height: auto;
		max-height: auto;
		opacity: 0.5;
	}

	.hvis-chevron-down {
		transform: rotate(180deg);
	}
`

// ========================================================================= //
// <template> -------------------------------------------------------------- //
// ========================================================================= //

const template = /* html */ `
	<div class="hvis-collapsible-component">
		<div
			:class="{ 'is-collapsed': !isExpanded, 'is-expanded': isExpanded }"
			@click="toggle"
			class="hvis-collapsible-header hvis-row">
			<div class="hvis-collapsible-title">
				<b>
					{{ title }}
				</b>
			</div>

			<div>
				<img
					:src="chevronUpImageURL"
					class="hvis-icon"
					v-if="isExpanded">

				<img
					:src="chevronDownImageURL"
					class="hvis-icon"
					v-else>
			</div>
		</div>

		<div class="hvis-collapsible-content" v-if="isExpanded">
			<slot></slot>
		</div>
	</div>
`

// ========================================================================= //
// <script> ---------------------------------------------------------------- //
// ========================================================================= //

import { createApp } from "vue/dist/vue.esm-bundler.js"
import { createVueComponentWithCSS } from "@jrc03c/vue-component-with-css"
import { store } from "../store/index.mjs"
import { urlPathJoin } from "../utils/index.mjs"

async function CollapsibleComponent(options) {
  options = options || {}

  const component = createVueComponentWithCSS({
    name: "hvis-collapsible",
    emits: ["collapsed", "expanded"],
    template,

    props: {
      "start-expanded": {
        type: Boolean,
        required: false,
        default: () =>
          typeof options.startExpanded === "undefined"
            ? true
            : options.startExpanded,
      },

      title: {
        type: String,
        required: false,
        default: () => options.title || "Title",
      },
    },

    data() {
      return {
        css,
        isExpanded: true,
      }
    },

    computed: {
      chevronDownImageURL() {
        return urlPathJoin(store.baseURL, store.imageDir, "chevron-down.svg")
      },

      chevronUpImageURL() {
        return urlPathJoin(store.baseURL, store.imageDir, "chevron-up.svg")
      },
    },

    methods: {
      toggle() {
        this.isExpanded = !this.isExpanded
        this.$emit(this.isExpanded ? "expanded" : "collapsed")
      },
    },

    mounted() {
      this.isExpanded = this.startExpanded
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

export { CollapsibleComponent }
