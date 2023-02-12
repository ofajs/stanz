// public function
const getRandomId = () => Math.random().toString(32).substr(2);
// const getRandomId = (len = 40) => {
//     return Array.from(crypto.getRandomValues(new Uint8Array(len / 2)), dec => ('0' + dec.toString(16)).substr(-2)).join('');
// }
var objectToString = Object.prototype.toString;
var getType = (value) =>
  objectToString
    .call(value)
    .toLowerCase()
    .replace(/(\[object )|(])/g, "");
const isFunction = (d) => getType(d).search("function") > -1;
var isEmptyObj = (obj) => !Object.keys(obj).length;
const defineProperties = Object.defineProperties;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const isxdata = (obj) => obj instanceof XData;

const isDebug = document.currentScript.getAttribute("debug") !== null;

const nextTick = (() => {
  if (isDebug) {
    let nMap = new Map();
    return (fun, key) => {
      if (!key) {
        key = getRandomId();
      }

      let timer = nMap.get(key);
      clearTimeout(timer);
      nMap.set(
        key,
        setTimeout(() => {
          fun();
          nMap.delete(key);
        })
      );
    };
  }

  let nextTickMap = new Map();

  let pnext = (func) => Promise.resolve().then(() => func());

  if (typeof process === "object" && process.nextTick) {
    pnext = process.nextTick;
  }

  let inTick = false;
  return (fun, key) => {
    if (!key) {
      key = getRandomId();
    }

    nextTickMap.set(key, {
      key,
      fun,
    });

    if (inTick) {
      return;
    }

    inTick = true;

    pnext(() => {
      if (nextTickMap.size) {
        nextTickMap.forEach(({ key, fun }) => {
          try {
            fun();
          } catch (e) {
            console.error(e);
          }
          nextTickMap.delete(key);
        });
      }

      nextTickMap.clear();
      inTick = false;
    });
  };
})();

// Collects the data returned over a period of time and runs it once as a parameter after a period of time.
const collect = (func, time) => {
  let arr = [];
  let timer;
  const reFunc = (e) => {
    arr.push({ ...e });
    if (time) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        func(arr);
        arr.length = 0;
      }, time);
    } else {
      nextTick(() => {
        func(arr);
        arr.length = 0;
      }, reFunc);
    }
  };

  return reFunc;
};

// Enhanced methods for extending objects
const extend = (_this, proto, descriptor = {}) => {
  Object.keys(proto).forEach((k) => {
    let { get, set, value } = getOwnPropertyDescriptor(proto, k);

    if (value) {
      if (_this.hasOwnProperty(k)) {
        _this[k] = value;
      } else {
        Object.defineProperty(_this, k, {
          ...descriptor,
          value,
        });
      }
    } else {
      Object.defineProperty(_this, k, {
        ...descriptor,
        get,
        set,
      });
    }
  });
};
