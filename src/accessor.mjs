import { isxdata, isObject } from "./public.mjs";
import Stanz, { PROXY } from "./main.mjs";

const { defineProperties } = Object;

export const setData = (target, key, value, receiver) => {
  let data = value;
  if (isxdata(data)) {
    data._owner.push(receiver);
  } else if (isObject(value)) {
    data = new Stanz(value);
    data._owner.push(receiver);
  }

  const oldData = receiver[key];

  if (isxdata(oldData)) {
    clearData(oldData, target);
  }

  return Reflect.set(target, key, data, receiver);
};

export const clearData = (val, target) => {
  if (isxdata(val)) {
    const index = val._owner.indexOf(target[PROXY]);
    if (index > -1) {
      val._owner.splice(index, 1);
    } else {
      console.error({
        desc: "This data is wrong, the owner has no boarding object at the time of deletion",
        target,
        mismatch: val,
      });
    }
  }
};

export const handler = {
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
      return setData(target, key, value, receiver);
    } catch (error) {
      throw {
        desc: `failed to set ${key}`,
        key,
        value,
        target: receiver,
        error,
      };
    }
  },
  deleteProperty(target, key) {
    clearData(target[key], target);
    return Reflect.deleteProperty(target, key);
  },
};
