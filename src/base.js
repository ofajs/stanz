/**
 * stanz 6.1.5
 * a data synchronization library
 * https://github.com/kirakiray/stanz
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

    stanz.v = 6001005

    return stanz;
});