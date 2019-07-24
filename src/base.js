/*!
 * stanz
 */
((root, factory) => {
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

    return obj => createXData(obj)[PROXYTHIS];
});