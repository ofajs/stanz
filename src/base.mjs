import Stanz from "./main.mjs";

const stanz = (data) => {
  return new Stanz(data);
};

export default stanz;

globalThis.stanz = stanz;
