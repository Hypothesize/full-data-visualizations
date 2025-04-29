// ========================================================================= //
// <style> ----------------------------------------------------------------- //
// ========================================================================= //

const css = /* css */ `
	.hvis-progress,
	.hvis-progress progress {
		width: 100%;
	}

	.hvis-progress progress {
		margin-bottom: var(--padding);
		width: 100%;
		height: calc(var(--border-radius) * 2);
		border-radius: var(--border-radius);
		border: 0;
	}

	.hvis-progress progress[value] {
		background: var(--color-gray-13);
		color: var(--color-primary-6);
		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
		height: calc(var(--border-radius) * 2);
	}

	.hvis-progress progress[value]::-webkit-progress-bar {
		border-radius: var(--border-radius);
		background: var(--color-gray-13);
		height: calc(var(--border-radius) * 2);
	}

	.hvis-progress progress[value]::-webkit-progress-value {
		border-radius: var(--border-radius);
		background: var(--color-primary-6);
		height: calc(var(--border-radius) * 2);
	}

	.hvis-progress progress[value]::-moz-progress-bar {
		border-radius: var(--border-radius);
		background: var(--color-primary-6);
		height: calc(var(--border-radius) * 2);
	}

	.hvis-progress .hvis-row-left {
		gap: calc(var(--padding) / 2);
	}

	.hvis-progress .hvis-upload-logs-body {
		width: 100%;
		min-width: 100%;
		max-width: 100%;
		overflow-y: auto;
	}

	.hvis-progress .hvis-upload-logs-body .hvis-upload-logs-body-item {
		font-family: var(--font-family-code);
		font-weight: var(--font-weight-code);
		font-size: var(--font-size-6);
	}
`

// ========================================================================= //
// <template> -------------------------------------------------------------- //
// ========================================================================= //

const template = /* html */ `
	<div class="hvis-progress">
		<progress
			:value="percent"
			class="hvis-progress is-primary"
			max="100"
			v-if="percent >= 0">
			{{ percent }}%
		</progress>

		<p class="hvis-row-left" v-if="message && message.length > 0">
			<hvis-spinner :is-done="percent >= 100"></hvis-spinner>
			<span>{{ message }}</span>
		</p>

		<hvis-collapsible
			@expanded="scrollToBottom"
			id="upload-logs"
			title="Logs"
			v-if="logs && logs.length > 0">
			<div class="hvis-upload-logs-body" ref="uploadLogBody">
				<div
					:key="item.message"
					class="hvis-upload-logs-body-item"
					v-for="item in logs">
					{{ item.message }}
				</div>
			</div>
		</hvis-collapsible>
	</div>
`

// ========================================================================= //
// <script> ---------------------------------------------------------------- //
// ========================================================================= //

import { CollapsibleComponent } from "./collapsible.mjs"
import { createApp } from "vue/dist/vue.esm-bundler.js"
import { createVueComponentWithCSS } from "@jrc03c/vue-component-with-css"
import { SpinnerComponent } from "./spinner.mjs"

async function ProgressComponent(options) {
  options = options || {}

  const component = createVueComponentWithCSS({
    name: "hvis-progress",

    components: {
      "hvis-collapsible": await CollapsibleComponent({
        shouldReturnComponentOnly: true,
      }),
      "hvis-spinner": await SpinnerComponent({
        shouldReturnComponentOnly: true,
      }),
    },

    props: {
      logs: {
        type: Array,
        required: false,
        default: () => options.logs || [],
      },

      message: {
        type: String,
        required: false,
        default: () => options.message || "Loading...",
      },

      percent: {
        type: Number,
        required: false,
        default: () => options.percent || -1,
      },
    },

    template,

    data() {
      return {
        css,
        isAtBottomOfLog: true,
      }
    },

    methods: {
      scrollToBottom() {
        this.isAtBottomOfLog = true

        setTimeout(() => {
          try {
            this.$refs.uploadLogBody.scroll(0, 999999999)
          } catch (e) {}
        }, 10)
      },
    },

    watch: {
      logs: {
        deep: true,

        handler() {
          if (this.isAtBottomOfLog) {
            this.scrollToBottom()
          }
        },
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

export { ProgressComponent }
