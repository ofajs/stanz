import Stanz from "./main.mjs";
export const getRandomId = () => Math.random().toString(32).slice(2);

export const isxdata = (val) => val instanceof Stanz;

const objectToString = Object.prototype.toString;
export const getType = (value) =>
  objectToString
    .call(value)
    .toLowerCase()
    .replace(/(\[object )|(])/g, "");

export const isObject = (obj) => {
  const type = getType(obj);
  return type === "array" || type === "object";
};
