const XDATASELF = Symbol("self");
const PROXYSELF = Symbol("proxy");
const WATCHS = Symbol("watchs");
const CANUPDATE = Symbol("can_update");

const cansetXtatus = new Set(["root", "sub", "revoke"]);

const emitUpdate = (target, opts, path, unupdate) => {
  if (path && path.includes(target[PROXYSELF])) {
    console.warn("Circular references appear");
    return;
  }
  let new_path;
  if (!path) {
    new_path = opts.path = [target[PROXYSELF]];
  } else {
    new_path = opts.path = [target[PROXYSELF], ...path];
  }

  // trigger watch callback
  target[WATCHS].forEach((f) => f(opts));

  if (unupdate || target._unupdate) {
    return;
  }

  // Bubbling change events to the parent object
  target.owner &&
    target.owner.forEach((parent) =>
      emitUpdate(parent, opts, new_path.slice())
    );
};

class XData {
  constructor(obj, status) {
    let proxy_self;

    if (obj.get) {
      proxy_self = new Proxy(this, {
        get: obj.get,
        ownKeys: obj.ownKeys,
        getOwnPropertyDescriptor: obj.getOwnPropertyDescriptor,
        set: xdataHandler.set,
      });

      delete obj.get;
      delete obj.ownKeys;
      delete obj.getOwnPropertyDescriptor;
    } else {
      proxy_self = new Proxy(this, xdataHandler);
    }

    // status of the object
    let xtatus = status;

    // Attributes that are available for each instance
    defineProperties(this, {
      [XDATASELF]: {
        value: this,
      },
      [PROXYSELF]: {
        value: proxy_self,
      },
      // Each object must have an id
      xid: {
        value: "x_" + getRandomId(),
      },
      _xtatus: {
        get() {
          return xtatus;
        },
        set(val) {
          if (!cansetXtatus.has(val)) {
            throw {
              target: proxy_self,
              desc: `xtatus not allowed to be set ${val}`,
            };
          }
          const size = this.owner.size;

          if (val === "revoke" && size) {
            throw {
              target: proxy_self,
              desc: "the owner is not empty",
            };
          } else if (xtatus === "revoke" && val !== "revoke") {
            if (!size) {
              fixXDataOwner(this);
            }
          } else if (xtatus === "sub" && val === "root") {
            throw {
              target: proxy_self,
              desc: "cannot modify sub to root",
            };
          }
          xtatus = val;
        },
      },
      // Save all parent objects
      owner: {
        configurable: true,
        writable: true,
        value: new Set(),
      },
      length: {
        configurable: true,
        writable: true,
        value: 0,
      },
      // Save the object of the listener function
      [WATCHS]: {
        value: new Map(),
      },
      [CANUPDATE]: {
        writable: true,
        value: 0,
      },
    });

    let maxNum = -1;
    Object.keys(obj).forEach((key) => {
      let descObj = getOwnPropertyDescriptor(obj, key);
      let { value, get, set } = descObj;

      if (key === "get") {
        return;
      }
      if (!/\D/.test(key)) {
        key = parseInt(key);
        if (key > maxNum) {
          maxNum = key;
        }
      }
      if (get || set) {
        defineProperties(this, {
          [key]: descObj,
        });
      } else {
        // Set the function directly
        proxy_self[key] = value;
      }
    });

    if (maxNum > -1) {
      this.length = maxNum + 1;
    }

    this[CANUPDATE] = 1;

    return proxy_self;
  }

  watch(callback) {
    const wid = "e_" + getRandomId();

    this[WATCHS].set(wid, callback);

    return wid;
  }

  unwatch(wid) {
    return this[WATCHS].delete(wid);
  }

  setData(key, value) {
    let valueType = getType(value);
    if (valueType == "array" || valueType == "object") {
      value = createXData(value, "sub");

      // Adding a parent object to an object
      value.owner.add(this);
    }

    let oldVal;
    const descObj = Object.getOwnPropertyDescriptor(this, key);
    const p_self = this[PROXYSELF];
    try {
      // The case of only set but not get
      oldVal = p_self[key];
    } catch (err) {}

    if (oldVal === value) {
      return true;
    }

    let reval;
    if (descObj && descObj.set) {
      descObj.set.call(p_self, value);
      reval = true;
    } else {
      reval = Reflect.set(this, key, value);
    }

    if (this[CANUPDATE]) {
      // Need bubble processing after changing data
      emitUpdate(this, {
        xid: this.xid,
        name: "setData",
        args: [key, value],
      });
    }

    clearXDataOwner(oldVal, this);

    return reval;
  }

  // Proactively trigger update events
  // Convenient get type data trigger watch
  update(opts = {}) {
    emitUpdate(
      this,
      Object.assign({}, opts, {
        xid: this.xid,
        isCustom: true,
      })
    );
  }

  delete(key) {
    // The _ prefix or symbol can be deleted directly
    if (/^_/.test(key) || typeof key === "symbol") {
      return Reflect.deleteProperty(this, key);
    }

    if (!key) {
      return false;
    }

    // Adjustment of internal data, not using proxy objects
    const _this = this[XDATASELF];

    let val = _this[key];
    // Clear the parent on the owner
    clearXDataOwner(val, _this);

    let reval = Reflect.deleteProperty(_this, key);

    // Bubbling behavior after data changes
    emitUpdate(this, {
      xid: this.xid,
      name: "delete",
      args: [key],
    });

    return reval;
  }
}

// Proxy Handler for relaying XData
const xdataHandler = {
  set(target, key, value, receiver) {
    if (typeof key === "symbol") {
      return Reflect.set(target, key, value, receiver);
    }

    // Set properties with _ prefix directly
    if (/^_/.test(key)) {
      if (!target.hasOwnProperty(key)) {
        defineProperties(target, {
          [key]: {
            writable: true,
            configurable: true,
            value,
          },
        });
      } else {
        Reflect.set(target, key, value, receiver);
      }
      return true;
    }

    try {
      return target.setData(key, value);
    } catch (e) {
      throw {
        desc: `failed to set ${key}`,
        key,
        value,
        target: receiver,
      };
    }
  },
  deleteProperty: function (target, key) {
    return target.delete(key);
  },
};

// Clear xdata's owner data
const clearXDataOwner = (xdata, parent) => {
  if (!isxdata(xdata)) {
    return;
  }

  const { owner } = xdata;
  owner.delete(parent);

  if (!owner.size) {
    xdata._xtatus = "revoke";
    Object.values(xdata).forEach((child) => {
      clearXDataOwner(child, xdata[XDATASELF]);
    });
  }
};

// Fix xdata's owner data
const fixXDataOwner = (xdata) => {
  if (xdata._xtatus === "revoke") {
    // Restoration status
    Object.values(xdata).forEach((e) => {
      if (isxdata(e)) {
        fixXDataOwner(e);
        e.owner.add(xdata);
        e._xtatus = "sub";
      }
    });
  }
};

const createXData = (obj, status = "root") => {
  if (isxdata(obj)) {
    obj._xtatus = status;
    return obj;
  }
  return new XData(obj, status);
};
