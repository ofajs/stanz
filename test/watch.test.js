const { default: stanz } = require("../dist/stanz");

test("watch base test", () => {
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
});
