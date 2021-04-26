((root, factory) => {
    "use strict"
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.stanz = factory();
    }
})(this, () => {
    "use strict";

    //<o:start--xdata.js-->
    //<!--public-->

    //<!--emiter-->

    //<!--handler-->

    //<!--main-->

    //<!--mirror-->

    //<!--sync-->

    //<!--reBuildArray-->
    //<o:end--xdata.js-->

    let stanz = obj => createXData(obj)[PROXYTHIS];

    stanz.version = "{{version}}";
    stanz.v = "{{versionCode}}";

    return stanz;
});