function loadImage(path) {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image()
      img.onload = () => resolve(img)
      img.src = path
    } catch (e) {
      return reject(e)
    }
  })
}

export { loadImage }
