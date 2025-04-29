import { parseCSSColorList } from "./parse-css-color-list.mjs"

test("tests that the `parseCSSColorList` function works as expected", () => {
  const xtrue = [
    "red",
    "orange",
    "#f0f0f0f",
    "rgb(12, 34, 56)",
    "hsla(var(--hue-angle), 100%, 50%, 0.5)",
    "#333",
    "dodgerblue",
    "hsl(90.75deg, 100%, calc(var(--lightness) * 3.5))",
    "rgba(12.3, 45.6, 78.9, 0.12345)",
  ]

  const xpred = parseCSSColorList(xtrue.join(", "))
  expect(xpred.length).toBe(xtrue.length)

  for (let i = 0; i < xtrue.length; i++) {
    expect(xpred[i]).toBe(xtrue[i])
  }
})

test("tests that the `parseCSSColorList` function throws errors at appropriate times", () => {
  const wrongs = [
    0,
    1,
    2.3,
    -2.3,
    234n,
    -234n,
    Infinity,
    -Infinity,
    NaN,
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
    new Date(),
  ]

  for (const value of wrongs) {
    expect(() => parseCSSColorList(value)).toThrow()
  }
})
