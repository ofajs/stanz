/**
 * stanz 6.0.1
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
    //<!--public-->

    //<!--emiter-->

    //<!--handler-->

    //<!--main-->

    //<!--sync-->

    //<!--reBuildArray-->

    let stanz = obj => createXData(obj)[PROXYTHIS];

    stanz.v = 60001

    return stanz;
});