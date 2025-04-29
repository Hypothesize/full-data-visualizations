import { argmin, chop, max, min } from "@jrc03c/js-math-tools"

function getTicks(x, density) {
  const xmax = max(x)
  const xmin = min(x)
  const xrange = xmax - xmin
  const oom = Math.floor(Math.log(xrange) / Math.log(10))
  const step1 = Math.pow(10, oom - 1)
  const step2 = step1 * 2
  const step3 = step1 * 5
  const step4 = Math.pow(10, oom)
  const step5 = step4 * 2
  const step6 = step4 * 5
  const steps = [step1, step2, step3, step4, step5, step6]

  const step =
    steps[argmin(steps.map(step => Math.abs(xrange / step - density)))]

  const tmin = step * Math.ceil(xmin / step)
  const tmax = step * Math.floor(xmax / step)
  const ticks = []

  for (let t = tmin; t <= tmax; t += step) {
    if (chop(t) !== 0) {
      ticks.push(t)
    }
  }

  return ticks
}

export { getTicks }
