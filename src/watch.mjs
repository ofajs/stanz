import { getRandomId } from "./public.mjs";
import { WATCHS } from "./main.mjs";

export const emitUpdate = ({
  currentTarget,
  target,
  name,
  value,
  oldValue,
  path = [],
}) => {
  if (path && path.includes(currentTarget)) {
    console.warn("Circular references appear");
    return;
  }

  const options = {
    target,
    name,
    value,
    oldValue,
  };

  if (currentTarget._hasWatchs) {
    currentTarget[WATCHS].forEach((func) => {
      func({
        currentTarget,
        ...options,
        path: [...path],
      });
    });
  }

  currentTarget.owner.forEach((parent) => {
    emitUpdate({
      currentTarget: parent,
      ...options,
      path: [currentTarget, ...path],
    });
  });
};

export default (Stanz) => {
  Object.assign(Stanz.prototype, {
    watch(callback) {
      const wid = "w-" + getRandomId();

      this[WATCHS].set(wid, callback);

      return wid;
    },

    unwatch(wid) {
      return this[WATCHS].delete(wid);
    },
  });
};
