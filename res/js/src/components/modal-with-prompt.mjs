// -----------------------------------------------------------------------------
// CSS
// -----------------------------------------------------------------------------

const css = /* css */ `
	.hvis-modal-with-prompt .hvis-button-row {
		margin-top: var(--padding);
		gap: calc(var(--line-thickness) * 2);
	}

	@media (max-width: 512px) {
		.hvis-modal-with-prompt .hvis-button-row {
			display: flex;
			flex-direction: column;
			flex-wrap: nowrap;
			justify-content: flex-start;
			align-content: stretch;
			align-items: stretch;
		}

		.hvis-modal-with-prompt .hvis-button-row button {
			width: 100%;
			min-width: 100%;
			max-width: 100%;
		}
	}
`

// -----------------------------------------------------------------------------
// HTML
// -----------------------------------------------------------------------------

const template = /* html */ `
  <hvis-modal :is-active="isActive" @close="cancel" class="hvis-modal-with-prompt">
    <hvis-card :title="title">
      <div class="hvis-content">
        <slot></slot>
      </div>

      <div class="hvis-button-row hvis-row-right">
        <button :class="{ ['is-' + cancelButtonType]: true }" @click="cancel">
          {{ cancelButtonLabel }}
        </button>

        <button :class="{ ['is-' + confirmButtonType]: true }" @click="confirm">
          {{ confirmButtonLabel }}
        </button>
      </div>
    </hvis-card>
  </hvis-modal>
`

// -----------------------------------------------------------------------------
// JS
// -----------------------------------------------------------------------------

import { CardComponent } from "./card.mjs"
import { createApp } from "vue/dist/vue.esm-bundler.js"
import { createVueComponentWithCSS } from "@jrc03c/vue-component-with-css"
import { ModalComponent } from "./modal.mjs"

async function ModalWithPromptComponent(options) {
  options = options || {}

  const component = createVueComponentWithCSS({
    name: "hvis-modal-with-prompt",
    emits: ["cancel", "confirm"],

    components: {
      "hvis-card": await CardComponent({ shouldReturnComponentOnly: true }),
      "hvis-modal": await ModalComponent({ shouldReturnComponentOnly: true }),
    },

    props: {
      "cancel-button-label": {
        type: String,
        required: false,
        default: () => options.cancelButtonLabel || "Cancel",
      },

      "cancel-button-type": {
        type: String,
        required: false,
        default: () => options.cancelButtonType || "gray",
      },

      "confirm-button-label": {
        type: String,
        required: false,
        default: () => options.confirmButtonLabel || "Okay",
      },

      "confirm-button-type": {
        type: String,
        required: false,
        default: () => options.confirmButtonType || "dark",
      },

      "is-active": {
        type: Boolean,
        required: false,
        default: () =>
          typeof options.isActive === "undefined" ? false : options.isActive,
      },

      title: {
        type: String,
        required: false,
        default: () => options.title || "Confirm",
      },
    },

    template,

    data() {
      return {
        css,
      }
    },

    methods: {
      cancel() {
        this.$emit("cancel")
      },

      confirm() {
        this.$emit("confirm")
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

export { ModalWithPromptComponent }
