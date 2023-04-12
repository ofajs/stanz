import { stanz } from "./main.mjs";
export default stanz;

if (typeof global !== "undefined") {
  global.stanz = stanz;
}
