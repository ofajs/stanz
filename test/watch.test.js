const { default: stanz } = require("../dist/stanz");

test("watch modified values", () => {
  const d = stanz({
    val: "I am d",
    obj: {
      val: "I am obj",
      sub: {
        val: "I am sub",
      },
    },
  });

  const d2 = stanz({
    val: "I am e",
    inner: {
      val: "I am Inner",
    },
  });

  const obj = d.obj;
  d.push(obj);

  const sub = d.obj.sub;

  d2.inner.obj = obj;

  let i = 0;

  d.watch((e) => {
    i++;
    if (i === 1) {
      expect(e.target).toBe(d);
      expect(e.path.length).toBe(0);
    } else if (i === 2) {
      expect(e.target).toBe(obj);
      expect(e.path.length).toBe(1);
    } else if (i === 3) {
      expect(e.target).toBe(sub);
      expect(e.path.length).toBe(2);
    }
  });

  d2.watch((e) => {
    if (i === 2) {
      expect(e.target).toBe(obj);
      expect(e.path.length).toBe(2);
    } else if (i === 3) {
      expect(e.target).toBe(sub);
      expect(e.path.length).toBe(3);
    }
  });

  d.val = "change d val";
  obj.val = "change obj val";
  sub.val = "change sub val";

  expect(i).toBe(3);
});

test("watch array change", () => {
  const d = stanz([
    { val: "I am v0" },
    { val: "I am v1" },
    { val: "I am v2" },
    { val: "I am v3", arr: [{ val: "v3 sub 0" }, { val: "v3 sub 1" }] },
    [{ val: "I am v4 sub1" }, { val: "I am v4 sub2" }],
  ]);

  let i = 0;
  d.watch((e) => {
    i++;
    if (i === 1) {
      expect(e.args).toEqual([{ val: "v3 after push" }]);
      expect(e.path.length).toBe(2);
    } else if (i === 2) {
      expect(e.args).toEqual([{ val: "v4 after push" }]);
      expect(e.path.length).toBe(1);
    } else if (i === 3) {
      expect(e.args).toEqual([{ val: "I am v5" }]);
      expect(e.path.length).toBe(0);
    }
  });

  d[3].arr.push({
    val: "v3 after push",
  });

  d[3].push({
    val: "v4 after push",
  });

  d.push({
    val: "I am v5",
  });

  expect(i).toBe(3);
});
