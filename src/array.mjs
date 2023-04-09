import { SELF, PROXY } from "./main.mjs";

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

export default (Stanz) => {
  const fn = Stanz.prototype;
  const arrayFn = Array.prototype;

  mutatingMethods.forEach((methodName) => {
    if (fn[methodName]) {
      Object.defineProperty(fn, methodName, {
        value(...args) {
          const reval = arrayFn[methodName].apply(this[SELF], args);
          if (reval === this[SELF]) {
            return this[PROXY];
          }

          return reval;
        },
      });
    }
  });
};
