import { expect, test } from "@jrc03c/fake-jest"
import { isString, random, range } from "@jrc03c/js-math-tools"
import { randomString } from "@jrc03c/js-crypto-helpers"
import { stringify } from "@jrc03c/js-text-tools"
import { urlPathJoin } from "./url-path-join.mjs"

function stringifyIfNotString(x) {
  if (isString(x)) {
    return x
  } else {
    return stringify(x)
  }
}

test("test that the `urlPathJoin` function works as expected", () => {
  range(0, 100).forEach(() => {
    const parts = range(0, parseInt(random() * 10) + 1).map(() =>
      randomString(parseInt(random() * 16 + 1))
    )

    const x = parts.map(p => {
      range(0, parseInt(random() * 3)).forEach(() => {
        p = "/" + p
      })

      range(0, parseInt(random() * 3)).forEach(() => {
        p = p + "/"
      })

      return p
    })

    const yTrue = (x[0].startsWith("/") ? "/" : "") + parts.join("/")
    const yPred = urlPathJoin(...x)
    expect(yPred).toBe(yTrue)
  })

  const wrongs = [
    0,
    1,
    2.3,
    -2.3,
    Infinity,
    -Infinity,
    NaN,
    "foo",
    true,
    false,
    null,
    undefined,
    Symbol.for("Hello, world!"),
    [2, 3, 4],
    [
      [2, 3, 4],
      [5, 6, 7],
    ],
    x => x,
    function (x) {
      return x
    },
    { hello: "world" },
  ]

  range(0, 100).forEach(() => {
    const x = range(0, parseInt(random() * 16) + 1).map(
      () => wrongs[parseInt(random() * wrongs.length)]
    )

    const yTrue = x.map(v => stringifyIfNotString(v)).join("/")
    const yPred = urlPathJoin(...x)
    expect(yPred).toBe(yTrue)
  })

  // special case: if the first part starts with a forward slash, then keep it!
  const a = ["/foo", "bar", "baz"]
  const bTrue = "/foo/bar/baz"
  const bPred = urlPathJoin(...a)
  expect(bPred).toBe(bTrue)

  const c = ["foo", "bar", "baz"]
  const dTrue = "foo/bar/baz"
  const dPred = urlPathJoin(...c)
  expect(dPred).toBe(dTrue)
})
