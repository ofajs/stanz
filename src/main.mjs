import { getRandomId, isxdata } from "./public.mjs";
import { handler } from "./accessor.mjs";
import reBuildProto from "./array.mjs";
const { defineProperties, getOwnPropertyDescriptor } = Object;

export const SELF = Symbol("self");
export const PROXY = Symbol("proxy");

export default class Stanz extends Array {
  constructor(data) {
    super();

    const proxySelf = new Proxy(this, handler);

    defineProperties(this, {
      xid: { value: data.xid || getRandomId() },
      // Save all parent objects
      _owner: {
        configurable: true,
        writable: true,
        value: [],
        // value: new Set(),
      },
      owner: {
        get() {
          return new Set(this._owner);
        },
      },
      [SELF]: { get: () => this },
      [PROXY]: { get: () => proxySelf },
    });

    Object.keys(data).forEach((key) => {
      const descObj = getOwnPropertyDescriptor(data, key);
      let { value, get, set } = descObj;

      if (get || set) {
        defineProperties(this, {
          [key]: descObj,
        });
      } else {
        // Set the function directly
        proxySelf[key] = value;
      }
    });

    return proxySelf;
  }

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
  }
}

reBuildProto(Stanz);
