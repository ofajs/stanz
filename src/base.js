((root, factory) => {
  "use strict";
  if (typeof exports === "object") {
    module.exports = factory();
  } else if (typeof define === "function" && define.amd) {
    define(factory);
  } else {
    root.stanz = factory();
  }
})(this, () => {
  "use strict";

  //<o:start--xdata.js-->

  //<!--public-->

  //<!--main-->

  //<!--method-->

  //<!--array-->

  //<o:end--xdata.js-->

  const stanz = (obj) => createXData(obj, "root");

  Object.assign(stanz, {
    version: "{{version}}",
    v: "{{versionCode}}",
    isxdata,
  });

  return stanz;
});
