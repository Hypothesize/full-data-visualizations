// NOTE: I created this function to make it easier to copy Vue component data
// before sending it to the Web Worker. Any objects and arrays stored in Vue
// component data are automatically converted to Proxy instances, which I
// assume is what gives Vue some of its reactivity to object changes. However,
// the browser was throwing an error any time I tried to send such data to the
// Web Worker. So, this function just "unpacks" a deeply nested Proxy object
// (i.e., a Proxy that contains other Proxy objects, ad infinitum) and returns
// a plain JS object.
function unproxify(x) {
  if (x === null) {
    return null
  }

  if (typeof x !== "object") {
    return x
  }

  if (x instanceof Array) {
    return x.map(v => unproxify(v))
  }

  const out = {}

  Object.keys(x).forEach(key => {
    out[key] = unproxify(x[key])
  })

  return out
}

export { unproxify }
