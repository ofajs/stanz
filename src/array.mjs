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

const holder = Symbol("placeholder");

function compareArrays(oldArray, newArray) {
  const backupNewArray = Array.from(newArray);
  const backupOldArray = Array.from(oldArray);
  const deletedItems = [];
  const addedItems = new Map();

  const oldLen = oldArray.length;
  for (let i = 0; i < oldLen; i++) {
    const oldItem = oldArray[i];
    const newIndex = backupNewArray.indexOf(oldItem);
    if (newIndex > -1) {
      backupNewArray[newIndex] = holder;
    } else {
      deletedItems.push(oldItem);
    }
  }

  const newLen = newArray.length;
  for (let i = 0; i < newLen; i++) {
    const newItem = newArray[i];
    const oldIndex = backupOldArray.indexOf(newItem);
    if (oldIndex > -1) {
      backupOldArray[oldIndex] = holder;
    } else {
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
