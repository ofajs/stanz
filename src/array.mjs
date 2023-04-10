import { clearData } from "./accessor.mjs";
import { SELF, PROXY } from "./main.mjs";
import { getType } from "./public.mjs";

const mutatingMethods = [
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "reverse",
  "sort",
  "fill",
  "copyWithin",
];

function compareArrays(oldArray, newArray) {
  const deletedItems = [];
  const addedItems = new Map();

  for (let i = 0; i < oldArray.length || i < newArray.length; i++) {
    const oldItem = oldArray[i];
    const newItem = newArray[i];

    if (oldItem !== undefined && !newArray.includes(oldItem)) {
      deletedItems.push(oldItem);
    }

    if (newItem !== undefined && !oldArray.includes(newItem)) {
      addedItems.set(i, newItem);
    }
  }

  return { deletedItems, addedItems };
}

export default (Stanz) => {
  const fn = Stanz.prototype;
  const arrayFn = Array.prototype;

  mutatingMethods.forEach((methodName) => {
    if (fn[methodName]) {
      Object.defineProperty(fn, methodName, {
        value(...args) {
          const backupArr = Array.from(this);

          const reval = arrayFn[methodName].apply(this[SELF], args);

          const { deletedItems, addedItems } = compareArrays(backupArr, this);

          // Refactoring objects as proxy instances
          for (let [key, value] of addedItems) {
            const type = getType(value);
            if (type === "object" || type === "array") {
              this[key] = value;
            }
          }

          for (let item of deletedItems) {
            clearData(item, this);
          }

          if (reval === this[SELF]) {
            return this[PROXY];
          }

          return reval;
        },
      });
    }
  });
};
