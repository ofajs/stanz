import stanz from "../src/base.mjs";

test("to json test object", () => {
  const d = stanz({
    val: "asdasd",
  });

  expect(d.toJSON()).toEqual({
    val: "asdasd",
  });
});
