function isInWebWorker() {
  return (
    typeof self !== "undefined" &&
    typeof WorkerGlobalScope !== "undefined" &&
    self instanceof WorkerGlobalScope
  )
}

export { isInWebWorker }
