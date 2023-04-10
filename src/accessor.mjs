import { getType, isxdata } from "./public.mjs";
import Stanz, { PROXY } from "./main.mjs";

const { defineProperties } = Object;

const setData = (target, key, value, receiver) => {
  let data = value;
  const valType = getType(value);
  if (isxdata(data)) {
    data._owner.push(receiver);
  } else if (valType === "object" || valType === "array") {
    data = new Stanz(value);
    data._owner.push(receiver);
  }

  return data;
};

const clearData = (target, key) => {
  const val = target[key];

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
      const data = setData(target, key, value, receiver);
      return Reflect.set(target, key, data, receiver);
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
    clearData(target, key);
    return Reflect.deleteProperty(target, key);
  },
};
