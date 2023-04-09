import { getRandomId, isXdata } from "./public.mjs";
const { defineProperties } = Object;

export default class Stanz extends Array {
  constructor(data) {
    super();

    Object.assign(this, data);

    defineProperties(this, {
      xid: { value: getRandomId() },
    });
  }

  toJSON() {
    let obj = {};

    let isPureArray = true;
    let maxId = 0;

    Object.keys(this).forEach((k) => {
      let val = this[k];

      if (!/\D/.test(k)) {
        k = parseInt(k);
        if (k > maxId) {
          maxId = k;
        }
      } else {
        isPureArray = false;
      }

      if (isXdata(val)) {
        val = val.toJSON();
      }

      obj[k] = val;
    });

    if (isPureArray) {
      obj.length = maxId + 1;
      obj = Array.from(obj);
    }

    const xid = this.xid;
    defineProperties(obj, {
      xid: {
        get: () => xid,
      },
    });

    return obj;
  }
}
