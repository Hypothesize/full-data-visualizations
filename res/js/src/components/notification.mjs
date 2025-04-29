// -----------------------------------------------------------------------------
// CSS
// -----------------------------------------------------------------------------

const css = /* css */ `
  .hvis-notification {
    margin: 0 0 var(--padding) 0;
    padding: var(--padding);
    border-radius: var(--border-radius);
    background-color: var(--color-gray-13);
    font-family: var(--font-family-body);
    font-weight: var(--font-weight-body);
    font-size: var(--font-size-5);
  }

  .hvis-notification .hvis-close-button {
    float: right;
    margin:
      calc(var(--padding) / -2)
      calc(var(--padding) / -2)
      calc(var(--padding) / 2)
      calc(var(--padding) / 1);
    padding: 0;
    background-color: var(--color-gray-12);
  }

  .hvis-notification .hvis-close-button:hover {
    filter: brightness(102.5%);
  }

  .hvis-notification .hvis-close-button:active {
    filter: brightness(95%);
  }

  .hvis-notification.is-danger {
    background-color: var(--color-danger-13);
  }

  .hvis-notification.is-danger .hvis-close-button {
    background-color: var(--color-danger-12);
  }

  .hvis-notification.is-dark {
    background-color: var(--color-gray-3);
    color: white;
  }

  .hvis-notification.is-dark input,
  .hvis-notification.is-dark option,
  .hvis-notification.is-dark select,
  .hvis-notification.is-dark textarea {
    background-color: var(--color-gray-4);
    border: var(--line-thickness) solid var(--color-gray-5);
  }

  .hvis-notification.is-dark input:focus,
  .hvis-notification.is-dark option:focus,
  .hvis-notification.is-dark select:focus,
  .hvis-notification.is-dark textarea:focus {
    border: var(--line-thickness) solid var(--color-primary-7);
  }

  .hvis-notification.is-dark,
  .hvis-notification.is-dark * {
    color: white;
  }

  .hvis-notification.is-dark .hvis-close-button {
    background-color: var(--color-gray-4);
    color: white;
  }

  .hvis-notification.is-dark .hvis-close-button img.hvis-icon {
    filter: invert(100%);
  }

  .hvis-notification.is-gray {
    background-color: var(--color-gray-13);
  }

  .hvis-notification.is-gray .hvis-close-button {
    background-color: var(--color-gray-12);
  }

  .hvis-notification.is-info {
    background-color: var(--color-info-13);
  }

  .hvis-notification.is-info .hvis-close-button {
    background-color: var(--color-info-12);
  }

  .hvis-notification.is-primary {
    background-color: var(--color-primary-13);
  }

  .hvis-notification.is-primary .hvis-close-button {
    background-color: var(--color-primary-12);
  }

  .hvis-notification.is-success {
    background-color: var(--color-success-13);
  }

  .hvis-notification.is-success .hvis-close-button {
    background-color: var(--color-success-12);
  }

  .hvis-notification.is-warning {
    background-color: var(--color-warning-13);
  }

  .hvis-notification.is-warning .hvis-close-button {
    background-color: var(--color-warning-11);
  }
`

// -----------------------------------------------------------------------------
// HTML
// -----------------------------------------------------------------------------

const template = /* html */ `
  <div :class="{ ['is-' + type]: true }" class="hvis-notification" v-if="isActive">
    <button @click="close" class="hvis-close-button is-rounded" v-if="canBeClosed">
      <img
        :src="xImageURL"
        class="hvis-icon">
    </button>

    <div class="hvis-content">
      <slot></slot>
    </div>
  </div>
`

// -----------------------------------------------------------------------------
// JS
// -----------------------------------------------------------------------------

import { createApp } from "vue/dist/vue.esm-bundler.js"
import { createVueComponentWithCSS } from "@jrc03c/vue-component-with-css"
import { store } from "../store/index.mjs"
import { urlPathJoin } from "../utils/index.mjs"

async function NotificationComponent(options) {
  options = options || {}

  const component = createVueComponentWithCSS({
    name: "hvis-notification",
    emits: ["close"],
    template,

    props: {
      "can-be-closed": {
        type: Boolean,
        required: false,
        default: () =>
          typeof options.canBeClosed === "undefined"
            ? true
            : options.canBeClosed,
      },

      "is-active": {
        type: Boolean,
        required: false,
        default: () =>
          typeof options.isActive === "undefined" ? true : options.isActive,
      },

      type: {
        type: String,
        required: false,
        default: () => options.type || "gray",
        // other options include:
        // - danger
        // - dark
        // - info
        // - primary
        // - success
        // - warning
      },
    },

    data() {
      return {
        css,
      }
    },

    computed: {
      xImageURL() {
        return urlPathJoin(store.baseURL, store.imageDir, "x.svg")
      },
    },

    methods: {
      close() {
        this.$emit("close")
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

export { NotificationComponent }
