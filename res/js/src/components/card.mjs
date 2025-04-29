// -----------------------------------------------------------------------------
// CSS
// -----------------------------------------------------------------------------

const css = /* css */ `
  .hvis-card {
    background-color: white;
    padding: var(--padding);
    border-radius: var(--border-radius);
    box-shadow: var(--box-shadow);
  }

  .hvis-card .hvis-card-header {
    margin-bottom: var(--padding);
  }

  .hvis-card .hvis-card-header .hvis-card-header-title {
    font-family: var(--font-family-title);
    font-weight: var(--font-weight-title);
    font-size: var(--font-size-4);
  }

  .hvis-card hr {
    height: var(--line-thickness);
    margin: var(--padding) 0;
    padding: 0;
    border: 0;
    background-color: var(--color-gray-13);
  }

  .hvis-card .hvis-card-content .hvis-content {
    font-family: var(--font-family-body);
    font-weight: var(--font-weight-body); 
    font-size: var(--font-size-5);
  }
`

// -----------------------------------------------------------------------------
// HTML
// -----------------------------------------------------------------------------

const template = /* html */ `
  <div class="hvis-card">
    <header class="hvis-card-header">
      <div class="hvis-card-header-title">
        {{ title }}
      </div>
    </header>

    <hr>

    <div class="hvis-card-content">
      <div class="hvis-content">
        <slot></slot>
      </div>
    </div>
  </div>
`

// -----------------------------------------------------------------------------
// JS
// -----------------------------------------------------------------------------

import { createApp } from "vue/dist/vue.esm-bundler.js"
import { createVueComponentWithCSS } from "@jrc03c/vue-component-with-css"

async function CardComponent(options) {
  options = options || {}

  const component = createVueComponentWithCSS({
    name: "hvis-card",
    template,

    props: {
      title: {
        type: String,
        required: false,
        default: () => options.title || "Info",
      },
    },

    data() {
      return {
        css,
      }
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

export { CardComponent }
