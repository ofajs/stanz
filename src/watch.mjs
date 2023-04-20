import { getRandomId, debounce } from "./public.mjs";
import { WATCHS } from "./main.mjs";
const { assign, freeze } = Object;

class Watcher {
  constructor(opts) {
    assign(this, opts);
    freeze(this);
  }

  hasModified(key) {
    if (this.path.length) {
      const target = this.path[0];
      return this.currentTarget[key] === target;
    } else {
      return this.hasReplaced(key);
    }
  }

  hasReplaced(key) {
    if (this.type === "set" && !this.path.length && this.name === key) {
      return true;
    }

    return false;
  }
}

class Watchers extends Array {
  constructor(arr) {
    super(...arr);
  }

  hasModified(key) {
    return this.some((e) => e.hasModified(key));
  }

  hasReplaced(key) {
    return this.some((e) => e.hasReplaced(key));
  }
}

export const emitUpdate = ({
  type,
  currentTarget,
  target,
  name,
  value,
  oldValue,
  args,
  path = [],
}) => {
  if (path && path.includes(currentTarget)) {
    console.warn("Circular references appear");
    return;
  }

  let options = {
    type,
    target,
    name,
    oldValue,
    value,
  };

  if (type === "array") {
    delete options.value;
    options.args = args;
  }

  if (currentTarget._hasWatchs) {
    const watcher = new Watcher({
      currentTarget,
      ...options,
      path: [...path],
    });

    currentTarget[WATCHS].forEach((func) => {
      func(watcher);
    });
  }

  currentTarget._update &&
    currentTarget.owner.forEach((parent) => {
      emitUpdate({
        currentTarget: parent,
        ...options,
        path: [currentTarget, ...path],
      });
    });
};

export default {
  watch(callback) {
    const wid = "w-" + getRandomId();

    this[WATCHS].set(wid, callback);

    return wid;
  },

  unwatch(wid) {
    return this[WATCHS].delete(wid);
  },

  watchTick(callback) {
    return this.watch(
      debounce((arr) => {
        callback(new Watchers(arr));
      })
    );
  },
};
