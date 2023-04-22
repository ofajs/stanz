import { isObject } from "./public.mjs";
import Stanz, { PROXY, isxdata } from "./main.mjs";
import { emitUpdate } from "./watch.mjs";

const { defineProperties } = Object;

export const setData = ({ target, key, value, receiver, type, succeed }) => {
  let data = value;
  if (isxdata(data)) {
    data._owner.push(receiver);
  } else if (isObject(value)) {
    data = new Stanz(value);
    data._owner.push(receiver);
  }

  const oldValue = receiver[key];
  const isSame = oldValue === value;

  if (!isSame && isxdata(oldValue)) {
    clearData(oldValue, receiver);
  }

  const reval = succeed(data);

  !isSame &&
    !target.__unupdate &&
    emitUpdate({
      type: type || "set",
      target: receiver,
      currentTarget: receiver,
      name: key,
      value,
      oldValue,
    });

  return reval;
};

export const clearData = (val, target) => {
  if (isxdata(val)) {
    const index = val._owner.indexOf(target);
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
      return setData({
        target,
        key,
        value,
        receiver,
        succeed(data) {
          return Reflect.set(target, key, data, receiver);
        },
      });
    } catch (error) {
      const err = new Error(`failed to set ${key} \n ${error.stack}`);

      Object.assign(err, {
        key,
        value,
        target: receiver,
        error,
      });

      throw err;
    }
  },
  deleteProperty(target, key) {
    if (/^_/.test(key)) {
      return Reflect.deleteProperty(target, key);
    }

    return setData({
      target,
      key,
      value: undefined,
      receiver: target[PROXY],
      type: "delete",
      succeed() {
        return Reflect.deleteProperty(target, key);
      },
    });
  },
};
