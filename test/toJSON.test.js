const { default: stanz } = require("../dist/stanz");
// const stanz = require("../src/base.cjs");

console.log("stanz => ", stanz);

test("to json test object", () => {
  const d = stanz({
    val: "asdasd",
  });

  expect(d.toJSON()).toEqual({
    val: "asdasd",
  });
});
