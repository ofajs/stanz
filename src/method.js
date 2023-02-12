extend(XData.prototype, {
  seek(expr) {
    let arr = [];

    if (!isFunction(expr)) {
      let f = new Function(`with(this){return ${expr}}`);
      expr = (_this) => {
        try {
          return f.call(_this, _this);
        } catch (e) {}
      };
    }

    if (expr.call(this, this)) {
      arr.push(this);
    }

    Object.values(this).forEach((e) => {
      if (isxdata(e)) {
        arr.push(...e.seek(expr));
      }
    });

    return arr;
  },
  // watch asynchronous collection version
  watchTick(func, time) {
    return this.watch(collect(func, time));
  },
  // Listening until the expression succeeds
  watchUntil(expr) {
    let isFunc = isFunction(expr);
    if (!isFunc && /[^=><]=[^=]/.test(expr)) {
      throw "cannot use single =";
    }

    return new Promise((resolve) => {
      // Ignore errors
      let exprFun = isFunc
        ? expr.bind(this)
        : new Function(`
        try{with(this){
            return ${expr}
        }}catch(e){}`).bind(this);

      let f;
      const wid = this.watchTick(
        (f = () => {
          let reVal = exprFun();
          if (reVal) {
            this.unwatch(wid);
            resolve(reVal);
          }
        })
      );
      f();
    });
  },
  // Listen to the corresponding key
  watchKey(obj, immediately) {
    if (immediately) {
      Object.keys(obj).forEach((key) => obj[key].call(this, this[key]));
    }

    let oldVal = {};
    Object.keys(obj).forEach((key) => {
      oldVal[key] = this[key];
    });

    return this.watch(
      collect((arr) => {
        Object.keys(obj).forEach((key) => {
          let val = this[key];
          let old = oldVal[key];

          if (old !== val) {
            obj[key].call(this, val, { old });
          } else if (isxdata(val)) {
            // Whether the current array has changes to this key
            let hasChange = arr.some((e) => {
              let p = e.path[1];

              return p == val;
            });

            if (hasChange) {
              obj[key].call(this, val, { old });
            }
          }

          oldVal[key] = val;
        });
      })
    );
  },
  toJSON() {
    let obj = {};

    let isPureArray = true;
    let maxId = 0;

    Object.keys(this).forEach((k) => {
      let val = this[k];

      if (!/\D/.test(k)) {
        k = parseInt(k);
        if (k > maxId) {
          maxId = k;
        }
      } else {
        isPureArray = false;
      }

      if (isxdata(val)) {
        val = val.toJSON();
      }

      obj[k] = val;
    });

    if (isPureArray) {
      obj.length = maxId + 1;
      obj = Array.from(obj);
    }

    const xid = this.xid;
    defineProperties(obj, {
      xid: {
        get: () => xid,
      },
    });

    return obj;
  },
  toString() {
    return JSON.stringify(this.toJSON());
  },
});
