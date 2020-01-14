/**
 * stanz 6.1.4
 * a data synchronization library
 */
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

    //---xdata-start---
    //<!--public-->

    //<!--emiter-->

    //<!--handler-->

    //<!--main-->

    //<!--sync-->

    //<!--reBuildArray-->
    //---xdata-end---

    let stanz = obj => createXData(obj)[PROXYTHIS];

    stanz.v = 6001004

    return stanz;
});