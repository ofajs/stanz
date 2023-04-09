const { default: stanz } = require("../dist/stanz");

test("accessor test set and get", () => {
  const d = stanz({
    get a() {
      return (this._a || 0) + 1;
    },
    set a(val) {
      this._a = val;
    },
  });

  expect(d.a).toEqual(1);

  d.a = 100;

  expect(d.a).toEqual(101);
});

test("accessor test _", () => {
  const d = stanz({
    a: 222,
    _b: 111,
  });

  expect(d.a).toEqual(222);

  expect(d._b).toEqual(111);

  const keys = Object.keys(d);

  expect(keys).toContain("a");
  expect(keys).not.toContain("_b");
});
