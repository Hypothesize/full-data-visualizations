// ========================================================================= //
// <style> ----------------------------------------------------------------- //
// ========================================================================= //

const css = /* css */ ``

// ========================================================================= //
// <template> -------------------------------------------------------------- //
// ========================================================================= //

const template = /* html */ `
	<div class="hvis-pca-vis">
		<div v-if="!loadings">
			<hvis-progress
				:message="
					'Computing PCA loadings... (' + percent.toFixed(2) + '%)'
				"
				:percent="percent">
			</hvis-progress>
		</div>

		<div v-else>
			<hvis-pca-factor-vis
				:color-negative="colors.negative"
				:color-positive="colors.positive"
				:key="col"
				:loadings="loadings.get(null,col)"
				@rename="onRename(col, $event)"
				v-for="col in loadings.columns">
			</hvis-pca-factor-vis>
		</div>
	</div>
`

// ========================================================================= //
// <script> ---------------------------------------------------------------- //
// ========================================================================= //

import { createApp } from "vue/dist/vue.esm-bundler.js"
import { createVueComponentWithCSS } from "@jrc03c/vue-component-with-css"
import { getCSSVariableValue } from "../../utils/get-css-variable-value.mjs"
import { PCAFactorVisualization } from "./factor.mjs"
import { ProgressComponent } from "../../components/progress.mjs"
import { range } from "@jrc03c/js-math-tools"
import { saveCSV } from "@jrc03c/js-csv-helpers/browser"
import { store } from "../../store/index.mjs"

async function PCAVisualization(options) {
  options = options || {}

  if (options.data) {
    await store.setCoreData(options.data, options.customHash)
  }

  if (options.dataTypes) {
    await store.setCoreDataTypes(options.dataTypes)
  }

  const component = createVueComponentWithCSS({
    name: "hvis-pca-vis",

    components: {
      "hvis-pca-factor-vis": await PCAFactorVisualization({
        ...options,
        shouldReturnComponentOnly: true,
      }),
      "hvis-progress": await ProgressComponent({
        shouldReturnComponentOnly: true,
      }),
    },

    template,

    data() {
      return {
        colors: {
          negative:
            options.colors && options.colors.negative
              ? options.colors.negative
              : getCSSVariableValue("--vis-pca-color-negative") || "orange",
          positive:
            options.colors && options.colors.positive
              ? options.colors.positive
              : getCSSVariableValue("--vis-pca-color-positive") || "dodgerblue",
        },
        css,
        loadings: options.loadings || null,
        percent: 0,
      }
    },

    methods: {
      download() {
        saveCSV("loadings.csv", this.loadings, { index: true })
      },

      async onRename(columnName, newColumnName) {
        const index = this.loadings._columns.indexOf(columnName)
        this.loadings._columns[index] = newColumnName
        await store.setPCALoadings(this.loadings)
      },

      range,
    },

    async mounted() {
      const loadings =
        options.pcaLoadings ||
        (await store.getPCALoadings(null, progress => {
          this.percent = progress.progress * 100
        }, options.customHash))

      if (!loadings) {
        return
      }

      this.loadings = loadings
    }
  })

  if (options.shouldReturnComponentOnly) {
    return component
  }

  const app = createApp({
    components: {
      "hvis-pca-vis": component,
    },

    template: `
			<hvis-pca-vis></hvis-pca-vis>
		`,
  })

  if (options.el) {
    app.mount(options.el)
  }

  return app
}

export { PCAVisualization }
