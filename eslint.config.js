import globals from "globals"
import pluginJs from "@eslint/js"
import pluginVue from "eslint-plugin-vue"

export default [
  { files: ["**/*.{js,mjs,cjs,vue}"] },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        WorkerGlobalScope: "readonly",
      },
    },
    // rules: {
    //   "no-empty": ["error", { allowEmptyCatch: true }],
    //   "no-unused-vars": ["error", { caughtErrors: "none" }],
    // },
  },
  pluginJs.configs.recommended,
  ...pluginVue.configs["flat/essential"],
]
