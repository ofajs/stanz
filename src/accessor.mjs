import { getType } from "./public.mjs";
import Stanz from "./main.mjs";

const { defineProperties } = Object;

const setData = (target, key, value, receiver) => {
  let data = value;
  if (getType(value) === "object") {
    data = new Stanz(value);
    data.owner.add(receiver);
  }
  return Reflect.set(target, key, data, receiver);
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
};
