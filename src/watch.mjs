import { getRandomId } from "./public.mjs";
import { WATCHS } from "./main.mjs";

const emitUpdate = () => {
    
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
