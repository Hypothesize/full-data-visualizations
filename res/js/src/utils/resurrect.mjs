import { DataFrame, shape } from "@jrc03c/js-math-tools"

function resurrect(data) {
  if (data instanceof DataFrame) {
    return data
  }

  if (shape(data.values).length === 1) {
    data.values = data.values.map(v => [v])
  }

  const out = new DataFrame(data.values)

  if (data.columns) {
    out.columns = data.columns
  }

  if (data.index) {
    out.index = data.index
  }

  return out
}

export { resurrect }
