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

test("accessor test set object", () => {
  const d = stanz({
    o1: {
      val: "I am o1",
    },
  });

  d.o2 = {
    val: "I am o2",
  };

  const o3 = stanz({
    val: "I am o3",
  });

  d.o3 = o3;

  const a1 = stanz([100, 200, 300]);

  d.a1 = a1;

  expect(d.o1.owner.has(d)).toBe(true);
  expect(d.o2.owner.has(d)).toBe(true);
  expect(d.o3).toBe(o3);
  expect(d.o3.owner.has(d)).toBe(true);
  expect(d.a1).toBe(a1);
  expect(d.a1.owner.has(d)).toBe(true);

  const { o1, o2 } = d;

  expect(o1.owner.size === 1).toBe(true);
  expect(o2.owner.size === 1).toBe(true);
  expect(o3.owner.size === 1).toBe(true);

  delete d.o1;
  delete d.o2;
  delete d.o3;

  expect(o1.owner.size === 0).toBe(true);
  expect(o2.owner.size === 0).toBe(true);
  expect(o3.owner.size === 0).toBe(true);
});
