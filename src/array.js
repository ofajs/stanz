// Submerged hooks that do not affect the original structure of the data
[
  "concat",
  "every",
  "filter",
  "find",
  "findIndex",
  "forEach",
  "map",
  "slice",
  "some",
  "indexOf",
  "lastIndexOf",
  "includes",
  "join",
].forEach((methodName) => {
  let arrayFnFunc = Array.prototype[methodName];
  if (arrayFnFunc) {
    defineProperties(XData.prototype, {
      [methodName]: { value: arrayFnFunc },
    });
  }
});

const arraySplice = Array.prototype.splice;

extend(XData.prototype, {
  splice(index, howmany, ...items) {
    let self = this[XDATASELF];

    // Fix the properties of new objects
    items = items.map((e) => {
      let valueType = getType(e);
      if (valueType == "array" || valueType == "object") {
        e = createXData(e, "sub");
        e.owner.add(self);
      }

      return e;
    });

    const b_howmany =
      getType(howmany) == "number" ? howmany : this.length - index;

    // Follow the native split method
    const rmArrs = arraySplice.call(self, index, b_howmany, ...items);

    rmArrs.forEach((e) => clearXDataOwner(e, self));

    emitUpdate(this, {
      xid: this.xid,
      name: "splice",
      args: [index, howmany, ...items],
    });

    return rmArrs;
  },
  unshift(...items) {
    this.splice(0, 0, ...items);
    return this.length;
  },
  push(...items) {
    this.splice(this.length, 0, ...items);
    return this.length;
  },
  shift() {
    return this.splice(0, 1)[0];
  },
  pop() {
    return this.splice(this.length - 1, 1)[0];
  },
});

["sort", "reverse"].forEach((methodName) => {
  const arrayFnFunc = Array.prototype[methodName];

  if (arrayFnFunc) {
    defineProperties(XData.prototype, {
      [methodName]: {
        value(...args) {
          let reval = arrayFnFunc.apply(this[XDATASELF], args);

          emitUpdate(this, {
            xid: this.xid,
            name: methodName,
          });

          return reval;
        },
      },
    });
  }
});
