// ========================================================================= //
// <style> ----------------------------------------------------------------- //
// ========================================================================= //

const css = /* css */ ``

// ========================================================================= //
// <template> -------------------------------------------------------------- //
// ========================================================================= //

const template = /* html */ `
	<hvis-collapsible :title="title">
		<div class="hvis-distribution-vis">
			<hvis-distribution-continuous
				:color="colorContinuous"
				:data-type="dataType"
				:points="points"
				v-if="distributionType === 'continuous'">
			</hvis-distribution-continuous>

			<hvis-distribution-discrete
				:colors="colorsDiscrete"
				:data-type="dataType"
				:points="points"
				v-else>
			</hvis-distribution-discrete>
		</div>
	</hvis-collapsible>
`

// ========================================================================= //
// <script> ---------------------------------------------------------------- //
// ========================================================================= //

import { CollapsibleComponent } from "../../components/collapsible.mjs"
import { createApp } from "vue/dist/vue.esm-bundler.js"
import { createVueComponentWithCSS } from "@jrc03c/vue-component-with-css"
import { DistributionContinuousVisualization } from "./continuous.mjs"
import { DistributionDiscreteVisualization } from "./discrete.mjs"

async function DistributionVisualization(options) {
  options = options || {}

  const component = createVueComponentWithCSS({
    name: "hvis-distribution",

    components: {
      "hvis-collapsible": await CollapsibleComponent({
        shouldReturnComponentOnly: true,
      }),
      "hvis-distribution-continuous": await DistributionContinuousVisualization(
        {
          ...options,
          shouldReturnComponentOnly: true,
        },
      ),
      "hvis-distribution-discrete": await DistributionDiscreteVisualization({
        ...options,
        shouldReturnComponentOnly: true,
      }),
    },

    template,

    props: {
      "color-continuous": {
        type: String,
        required: false,
        default: () => options.color || "blue",
      },

      "colors-discrete": {
        required: false,
        default: () => options.color || ["purple"],
      },

      "data-type": {
        type: String,
        required: false,
        default: () => options.dataType || "number",
      },

      "distribution-type": {
        type: String,
        required: false,
        default: () => options.distributionType || "",
      },

      points: {
        type: Array,
        required: false,
        default: () => options.points || [],
      },

      title: {
        type: String,
        required: false,
        default: () => options.title || "Variable",
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

export { DistributionVisualization }
