// ========================================================================= //
// <style> ----------------------------------------------------------------- //
// ========================================================================= //

const css = /* css */ ``

// ========================================================================= //
// <template> -------------------------------------------------------------- //
// ========================================================================= //

const template = /* html */ `
	<div class="hvis-distributions-vis">
		<div v-if="isLoading">
			<hvis-progress
				:percent="progress"
				message="Computing distributions...">
			</hvis-progress>
		</div>

		<div v-else>
			<hvis-collapsible
				title="Demographic Variables 🌎️"
				v-if="demographic && demographic.length > 0">
				<hvis-distribution
					:color-continuous="
						colors.continuous[
							demographic.indexOf(distribution) % colors.continuous.length
						]
					"
					:colors-discrete="colors.discrete"
					:data-type="distribution.dataType"
					:distribution-type="distribution.distributionType"
					:key="distribution.name"
					:points="distribution.points"
					:title="distribution.name.toString()"
					v-for="distribution in demographic">
				</hvis-distribution>
			</hvis-collapsible>

			<hvis-collapsible
				title="Continuous Variables 📈"
				v-if="continuous && continuous.length > 0">
				<hvis-distribution
					:color-continuous="
						colors.continuous[
							continuous.indexOf(distribution) % colors.continuous.length
						]
					"
					:data-type="distribution.dataType"
					:distribution-type="distribution.distributionType"
					:key="distribution.name"
					:points="distribution.points"
					:title="distribution.name.toString()"
					v-for="distribution in continuous">
				</hvis-distribution>
			</hvis-collapsible>

			<hvis-collapsible
				title="Discrete Variables 📊"
				v-if="discrete && discrete.length > 0">
				<hvis-distribution
					:colors-discrete="colors.discrete"
					:data-type="distribution.dataType"
					:distribution-type="distribution.distributionType"
					:key="distribution.name"
					:points="distribution.points"
					:title="distribution.name.toString()"
					v-for="distribution in discrete">
				</hvis-distribution>
			</hvis-collapsible>
		</div>
	</div>
`

// ========================================================================= //
// <script> ---------------------------------------------------------------- //
// ========================================================================= //

import { CollapsibleComponent } from "../../components/collapsible.mjs"
import { createApp } from "vue/dist/vue.esm-bundler.js"
import { createVueComponentWithCSS } from "@jrc03c/vue-component-with-css"
import { DistributionVisualization } from "./distribution.mjs"
import { getCSSVariableValue, parseCSSColorList } from "../../utils/index.mjs"
import { pause } from "@jrc03c/pause"
import { ProgressComponent } from "../../components/progress.mjs"
import { store } from "../../store/index.mjs"

async function DistributionsVisualization(options) {
  options = options || {}

  if (options.data) {
    await store.setCoreData(options.data)
  }

  if (options.dataTypes) {
    await store.setCoreDataTypes(options.dataTypes)
  }

  const component = createVueComponentWithCSS({
    name: "hvis-distributions-vis",

    components: {
      "hvis-collapsible": await CollapsibleComponent({
        shouldReturnComponentOnly: true,
      }),
      "hvis-distribution": await DistributionVisualization({
        ...options,
        shouldReturnComponentOnly: true,
      }),
      "hvis-progress": await ProgressComponent({
        shouldReturnComponentOnly: true,
      }),
    },

    template,

    data() {
      const continuousColorCSSVariables = parseCSSColorList(
        getCSSVariableValue("--vis-dists-colors-continuous") || "",
      )

      const discreteColorCSSVariables = parseCSSColorList(
        getCSSVariableValue("--vis-dists-colors-discrete") || "",
      )

      return {
        colors: {
          continuous:
            options.colors && options.colors.continuous
              ? options.colors.continuous
              : continuousColorCSSVariables.length > 0
                ? continuousColorCSSVariables
                : ["blue"],
          discrete:
            options.colors && options.colors.discrete
              ? options.colors.discrete
              : discreteColorCSSVariables.length > 0
                ? discreteColorCSSVariables
                : ["purple"],
        },
        config: {
          topNToCount: 7,
        },
        continuous: [],
        css,
        demographic: [],
        discrete: [],
        isLoading: false,
        progress: 0,
      }
    },

    async mounted() {
      this.isLoading = true

      const distributions =
        options.distributions ||
        (await store.getVariableDistributions(null, progress => {
          this.progress = progress.progress * 100
        }))

      if (!distributions) {
        return
      }

      for (const distro of distributions) {
        if (distro.isADemographicVariable) {
          this.demographic.push(distro)
        } else if (distro.distributionType === "continuous") {
          this.continuous.push(distro)
        } else {
          this.discrete.push(distro)
        }

        await pause(100)
      }

      this.isLoading = false
    },
  })

  if (options.shouldReturnComponentOnly) {
    return component
  }

  const app = createApp({
    components: {
      "hvis-distributions-vis": component,
    },

    template: `
			<hvis-distributions-vis></hvis-distributions-vis>
		`,
  })

  if (options.el) {
    app.mount(options.el)
  }

  return app
}

export { DistributionsVisualization }
