// public function
const getRandomId = () => Math.random().toString(32).substr(2);
// const getRandomId = (len = 40) => {
//     return Array.from(crypto.getRandomValues(new Uint8Array(len / 2)), dec => ('0' + dec.toString(16)).substr(-2)).join('');
// }
var objectToString = Object.prototype.toString;
var getType = (value) =>
    objectToString
    .call(value)
    .toLowerCase()
    .replace(/(\[object )|(])/g, "");
const isFunction = (d) => getType(d).search("function") > -1;
var isEmptyObj = (obj) => !Object.keys(obj).length;
const defineProperties = Object.defineProperties;
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const isxdata = (obj) => obj instanceof XData;

const isDebug = document.currentScript.getAttribute("debug") !== null;

const nextTick = (() => {
    if (isDebug) {
        let nMap = new Map();
        return (fun, key) => {
            if (!key) {
                key = getRandomId();
            }

            let timer = nMap.get(key);
            clearTimeout(timer);
            nMap.set(
                key,
                setTimeout(() => {
                    fun();
                    nMap.delete(key);
                })
            );
        };
    }

    let nextTickMap = new Map();

    let pnext = (func) => Promise.resolve().then(() => func());

    if (typeof process === "object" && process.nextTick) {
        pnext = process.nextTick;
    }

    let inTick = false;
    return (fun, key) => {
        if (!key) {
            key = getRandomId();
        }

        nextTickMap.set(key, {
            key,
            fun,
        });

        if (inTick) {
            return;
        }

        inTick = true;

        pnext(() => {
            if (nextTickMap.size) {
                nextTickMap.forEach(({
                    key,
                    fun
                }) => {
                    try {
                        fun();
                    } catch (e) {
                        console.error(e);
                    }
                    nextTickMap.delete(key);
                });
            }

            nextTickMap.clear();
            inTick = false;
        });
    };
})();

// Collects the data returned over a period of time and runs it once as a parameter after a period of time.
const collect = (func, time) => {
    let arr = [];
    let timer;
    const reFunc = (e) => {
        arr.push({
            ...e
        });
        if (time) {
            clearTimeout(timer);
            timer = setTimeout(() => {
                func(arr);
                arr.length = 0;
            }, time);
        } else {
            nextTick(() => {
                func(arr);
                arr.length = 0;
            }, reFunc);
        }
    };

    return reFunc;
};

// Enhanced methods for extending objects
const extend = (_this, proto, descriptor = {}) => {
    Object.keys(proto).forEach((k) => {
        let {
            get,
            set,
            value
        } = getOwnPropertyDescriptor(proto, k);

        if (value) {
            if (_this.hasOwnProperty(k)) {
                _this[k] = value;
            } else {
                Object.defineProperty(_this, k, {
                    ...descriptor,
                    value,
                });
            }
        } else {
            Object.defineProperty(_this, k, {
                ...descriptor,
                get,
                set,
            });
        }
    });
};


const XDATASELF = Symbol("self");
const PROXYSELF = Symbol("proxy");
const WATCHS = Symbol("watchs");
const CANUPDATE = Symbol("can_update");

const cansetXtatus = new Set(["root", "sub", "revoke"]);

const emitUpdate = (target, opts, path, unupdate) => {
    if (path && path.includes(target[PROXYSELF])) {
        console.warn("Circular references appear");
        return;
    }
    let new_path;
    if (!path) {
        new_path = opts.path = [target[PROXYSELF]];
    } else {
        new_path = opts.path = [target[PROXYSELF], ...path];
    }

    // trigger watch callback
    target[WATCHS].forEach((f) => f(opts));

    if (unupdate || target._unupdate) {
        return;
    }

    // Bubbling change events to the parent object
    target.owner &&
        target.owner.forEach((parent) =>
            emitUpdate(parent, opts, new_path.slice())
        );
};

class XData {
    constructor(obj, status) {
        let proxy_self;

        if (obj.get) {
            proxy_self = new Proxy(this, {
                get: obj.get,
                ownKeys: obj.ownKeys,
                getOwnPropertyDescriptor: obj.getOwnPropertyDescriptor,
                set: xdataHandler.set,
            });

            delete obj.get;
            delete obj.ownKeys;
            delete obj.getOwnPropertyDescriptor;
        } else {
            proxy_self = new Proxy(this, xdataHandler);
        }

        // status of the object
        let xtatus = status;

        // Attributes that are available for each instance
        defineProperties(this, {
            [XDATASELF]: {
                value: this,
            },
            [PROXYSELF]: {
                value: proxy_self,
            },
            // Each object must have an id
            xid: {
                value: "x_" + getRandomId(),
            },
            _xtatus: {
                get() {
                    return xtatus;
                },
                set(val) {
                    if (!cansetXtatus.has(val)) {
                        throw {
                            target: proxy_self,
                            desc: `xtatus not allowed to be set ${val}`,
                        };
                    }
                    const size = this.owner.size;

                    if (val === "revoke" && size) {
                        throw {
                            target: proxy_self,
                            desc: "the owner is not empty",
                        };
                    } else if (xtatus === "revoke" && val !== "revoke") {
                        if (!size) {
                            fixXDataOwner(this);
                        }
                    } else if (xtatus === "sub" && val === "root") {
                        throw {
                            target: proxy_self,
                            desc: "cannot modify sub to root",
                        };
                    }
                    xtatus = val;
                },
            },
            // Save all parent objects
            owner: {
                configurable: true,
                writable: true,
                value: new Set(),
            },
            length: {
                configurable: true,
                writable: true,
                value: 0,
            },
            // Save the object of the listener function
            [WATCHS]: {
                value: new Map(),
            },
            [CANUPDATE]: {
                writable: true,
                value: 0,
            },
        });

        let maxNum = -1;
        Object.keys(obj).forEach((key) => {
            let descObj = getOwnPropertyDescriptor(obj, key);
            let {
                value,
                get,
                set
            } = descObj;

            if (key === "get") {
                return;
            }
            if (!/\D/.test(key)) {
                key = parseInt(key);
                if (key > maxNum) {
                    maxNum = key;
                }
            }
            if (get || set) {
                defineProperties(this, {
                    [key]: descObj,
                });
            } else {
                // Set the function directly
                proxy_self[key] = value;
            }
        });

        if (maxNum > -1) {
            this.length = maxNum + 1;
        }

        this[CANUPDATE] = 1;

        return proxy_self;
    }

    watch(callback) {
        const wid = "e_" + getRandomId();

        this[WATCHS].set(wid, callback);

        return wid;
    }

    unwatch(wid) {
        return this[WATCHS].delete(wid);
    }

    setData(key, value) {
        let valueType = getType(value);
        if (valueType == "array" || valueType == "object") {
            value = createXData(value, "sub");

            // Adding a parent object to an object
            value.owner.add(this);
        }

        let oldVal;
        const descObj = Object.getOwnPropertyDescriptor(this, key);
        const p_self = this[PROXYSELF];
        try {
            // The case of only set but not get
            oldVal = p_self[key];
        } catch (err) {}

        if (oldVal === value) {
            return true;
        }

        let reval;
        if (descObj && descObj.set) {
            descObj.set.call(p_self, value);
            reval = true;
        } else {
            reval = Reflect.set(this, key, value);
        }

        if (this[CANUPDATE]) {
            // Need bubble processing after changing data
            emitUpdate(this, {
                xid: this.xid,
                name: "setData",
                args: [key, value],
            });
        }

        clearXDataOwner(oldVal, this);

        return reval;
    }

    // Proactively trigger update events
    // Convenient get type data trigger watch
    update(opts = {}) {
        emitUpdate(
            this,
            Object.assign({}, opts, {
                xid: this.xid,
                isCustom: true,
            })
        );
    }

    delete(key) {
        // The _ prefix or symbol can be deleted directly
        if (/^_/.test(key) || typeof key === "symbol") {
            return Reflect.deleteProperty(this, key);
        }

        if (!key) {
            return false;
        }

        // Adjustment of internal data, not using proxy objects
        const _this = this[XDATASELF];

        let val = _this[key];
        // Clear the parent on the owner
        clearXDataOwner(val, _this);

        let reval = Reflect.deleteProperty(_this, key);

        // Bubbling behavior after data changes
        emitUpdate(this, {
            xid: this.xid,
            name: "delete",
            args: [key],
        });

        return reval;
    }
}

// Proxy Handler for relaying XData
const xdataHandler = {
    set(target, key, value, receiver) {
        if (typeof key === "symbol") {
            return Reflect.set(target, key, value, receiver);
        }

        // Set properties with _ prefix directly
        if (/^_/.test(key)) {
            if (!target.hasOwnProperty(key)) {
                defineProperties(target, {
                    [key]: {
                        writable: true,
                        configurable: true,
                        value,
                    },
                });
            } else {
                Reflect.set(target, key, value, receiver);
            }
            return true;
        }

        try {
            return target.setData(key, value);
        } catch (e) {
            throw {
                desc: `failed to set ${key}`,
                key,
                value,
                target: receiver,
            };
        }
    },
    deleteProperty: function(target, key) {
        return target.delete(key);
    },
};

// Clear xdata's owner data
const clearXDataOwner = (xdata, parent) => {
    if (!isxdata(xdata)) {
        return;
    }

    const {
        owner
    } = xdata;
    owner.delete(parent);

    if (!owner.size) {
        xdata._xtatus = "revoke";
        Object.values(xdata).forEach((child) => {
            clearXDataOwner(child, xdata[XDATASELF]);
        });
    }
};

// Fix xdata's owner data
const fixXDataOwner = (xdata) => {
    if (xdata._xtatus === "revoke") {
        // 重新修复状态
        Object.values(xdata).forEach((e) => {
            if (isxdata(e)) {
                fixXDataOwner(e);
                e.owner.add(xdata);
                e._xtatus = "sub";
            }
        });
    }
};

const createXData = (obj, status = "root") => {
    if (isxdata(obj)) {
        obj._xtatus = status;
        return obj;
    }
    return new XData(obj, status);
};


extend(XData.prototype, {
    seek(expr) {
        let arr = [];

        if (!isFunction(expr)) {
            let f = new Function(`with(this){return ${expr}}`);
            expr = (_this) => {
                try {
                    return f.call(_this, _this);
                } catch (e) {}
            };
        }

        if (expr.call(this, this)) {
            arr.push(this);
        }

        Object.values(this).forEach((e) => {
            if (isxdata(e)) {
                arr.push(...e.seek(expr));
            }
        });

        return arr;
    },
    // watch asynchronous collection version
    watchTick(func, time) {
        return this.watch(collect(func, time));
    },
    // Listening until the expression succeeds
    watchUntil(expr) {
        let isFunc = isFunction(expr);
        if (!isFunc && /[^=><]=[^=]/.test(expr)) {
            throw "cannot use single =";
        }

        return new Promise((resolve) => {
            // Ignore errors
            let exprFun = isFunc ?
                expr.bind(this) :
                new Function(`
        try{with(this){
            return ${expr}
        }}catch(e){}`).bind(this);

            let f;
            const wid = this.watchTick(
                (f = () => {
                    let reVal = exprFun();
                    if (reVal) {
                        this.unwatch(wid);
                        resolve(reVal);
                    }
                })
            );
            f();
        });
    },
    // Listen to the corresponding key
    watchKey(obj, immediately) {
        if (immediately) {
            Object.keys(obj).forEach((key) => obj[key].call(this, this[key]));
        }

        let oldVal = {};
        Object.keys(obj).forEach((key) => {
            oldVal[key] = this[key];
        });

        return this.watch(
            collect((arr) => {
                Object.keys(obj).forEach((key) => {
                    let val = this[key];
                    let old = oldVal[key];

                    if (old !== val) {
                        obj[key].call(this, val, {
                            old
                        });
                    } else if (isxdata(val)) {
                        // Whether the current array has changes to this key
                        let hasChange = arr.some((e) => {
                            let p = e.path[1];

                            return p == val;
                        });

                        if (hasChange) {
                            obj[key].call(this, val, {
                                old
                            });
                        }
                    }

                    oldVal[key] = val;
                });
            })
        );
    },
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

            if (isxdata(val)) {
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
    },
    toString() {
        return JSON.stringify(this.toJSON());
    },
});


// Submerged hooks that do not affect the original structure of the data
[
    "concat",
    "every",
    "filter",
    "find",
    "findIndex",
    "forEach",
    "map",
    "slice",
    "some",
    "indexOf",
    "lastIndexOf",
    "includes",
    "join",
].forEach((methodName) => {
    let arrayFnFunc = Array.prototype[methodName];
    if (arrayFnFunc) {
        defineProperties(XData.prototype, {
            [methodName]: {
                value: arrayFnFunc
            },
        });
    }
});

const arraySplice = Array.prototype.splice;

extend(XData.prototype, {
    splice(index, howmany, ...items) {
        let self = this[XDATASELF];

        // Fix the properties of new objects
        items = items.map((e) => {
            let valueType = getType(e);
            if (valueType == "array" || valueType == "object") {
                e = createXData(e, "sub");
                e.owner.add(self);
            }

            return e;
        });

        const b_howmany =
            getType(howmany) == "number" ? howmany : this.length - index;

        // Follow the native split method
        const rmArrs = arraySplice.call(self, index, b_howmany, ...items);

        rmArrs.forEach((e) => clearXDataOwner(e, self));

        emitUpdate(this, {
            xid: this.xid,
            name: "splice",
            args: [index, howmany, ...items],
        });

        return rmArrs;
    },
    unshift(...items) {
        this.splice(0, 0, ...items);
        return this.length;
    },
    push(...items) {
        this.splice(this.length, 0, ...items);
        return this.length;
    },
    shift() {
        return this.splice(0, 1)[0];
    },
    pop() {
        return this.splice(this.length - 1, 1)[0];
    },
});

["sort", "reverse"].forEach((methodName) => {
    const arrayFnFunc = Array.prototype[methodName];

    if (arrayFnFunc) {
        defineProperties(XData.prototype, {
            [methodName]: {
                value(...args) {
                    let reval = arrayFnFunc.apply(this[XDATASELF], args);

                    emitUpdate(this, {
                        xid: this.xid,
                        name: methodName,
                    });

                    return reval;
                },
            },
        });
    }
});