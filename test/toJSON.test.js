const { default: stanz } = require("../dist/stanz");

console.log("stanz => ", stanz);

test("toJson test array", () => {
  const d = stanz([100]);

  expect(d.toJSON()).toEqual([100]);
});

test("toJson test object", () => {
  const d = stanz({
    val: "asdasd",
  });

  expect(d.toJSON()).toEqual({
    val: "asdasd",
  });
});

test("toJson test object mix array", () => {
  const d = stanz({
    val: "asdasd",
  });

  d.push(100);

  expect(d.toJSON()).toEqual({
    0: 100,
    val: "asdasd",
  });
});

test("toJson object has xid", () => {
  const d = stanz({
    val: "asdasd",
  });

  expect(d.toJSON().xid).toEqual(d.xid);
});
