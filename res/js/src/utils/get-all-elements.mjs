function getAllElements(root) {
  root = root || document.body
  let out = [root]

  if (root.children) {
    Array.from(root.children).forEach(child => {
      out = out.concat(getAllElements(child))
    })
  }

  return out
}

export { getAllElements }
