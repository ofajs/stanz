/*!
 * stanz v7.0.0
 * https://github.com/kirakiray/stanz
 * 
 * (c) 2018-2021 YAO
 * Released under the MIT License.
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

    //<o:start--xdata.js-->

    // public function
    const getRandomId = () => Math.random().toString(32).substr(2);
    // const getRandomId = (len = 40) => {
    //     return Array.from(crypto.getRandomValues(new Uint8Array(len / 2)), dec => ('0' + dec.toString(16)).substr(-2)).join('');
    // }
    var objectToString = Object.prototype.toString;
    var getType = value => objectToString.call(value).toLowerCase().replace(/(\[object )|(])/g, '');
    const isFunction = d => getType(d).search('function') > -1;
    var isEmptyObj = obj => !Object.keys(obj).length;
    const defineProperties = Object.defineProperties;
    const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
    const isxdata = obj => obj instanceof XData;

    const isDebug = document.currentScript.getAttribute("debug") !== null;

    // 改良异步方法
    const nextTick = (() => {
        if (isDebug) {
            let nMap = new Map();
            return (fun, key) => {
                if (!key) {
                    key = getRandomId();
                }

                let timer = nMap.get(key);
                clearTimeout(timer);
                nMap.set(key, setTimeout(() => {
                    fun();
                    nMap.delete(key);
                }));
            };
        }

        // 定位对象寄存器
        let nextTickMap = new Map();

        let pnext = (func) => Promise.resolve().then(() => func())

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
                fun
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

    // 在tick后运行收集的函数数据
    const collect = (func) => {
        let arr = [];
        const reFunc = e => {
            arr.push(Object.assign({}, e));
            // arr.push(e);
            nextTick(() => {
                func(arr);
                arr.length = 0;
            }, reFunc);
        }

        return reFunc;
    }

    // 扩展对象
    const extend = (_this, proto, descriptor = {}) => {
        Object.keys(proto).forEach(k => {
            // 获取描述
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
    }

    const startTime = Date.now();
    // 获取高精度的当前时间
    // const getTimeId = () => startTime + performance.now();
    // const getTimeId = () => Date.now().toString(32);
    // const getTimeId = () => performance.now().toString(32);


    const XDATASELF = Symbol("self");
    const PROXYSELF = Symbol("proxy");
    const WATCHS = Symbol("watchs");
    const CANUPDATE = Symbol("can_update");

    const cansetXtatus = new Set(["root", "sub", "revoke"]);

    const emitUpdate = (target, opts, path) => {
        let new_path;
        if (!path) {
            new_path = opts.path = [target[PROXYSELF]];
        } else {
            new_path = opts.path = [target[PROXYSELF], ...path];
        }

        // 触发callback
        target[WATCHS].forEach(f => f(opts))

        // 向上冒泡
        target.owner && target.owner.forEach(parent => emitUpdate(parent, opts, new_path.slice()));
    }

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

            // 当前对象所处的状态
            let xtatus = status;

            // 每个对象的专属id
            defineProperties(this, {
                [XDATASELF]: {
                    value: this
                },
                [PROXYSELF]: {
                    value: proxy_self
                },
                // 每个对象必有的id
                xid: {
                    value: "x_" + getRandomId()
                },
                // 当前所处的状态
                _xtatus: {
                    get() {
                        return xtatus;
                    },
                    set(val) {
                        if (!cansetXtatus.has(val)) {
                            throw {
                                target: proxy_self,
                                desc: `xtatus not allowed to be set ${val}`
                            };
                        }
                        const size = this.owner.size;

                        if (val === "revoke" && size) {
                            throw {
                                target: proxy_self,
                                desc: "the owner is not empty"
                            };
                        } else if (xtatus === "revoke" && val !== "revoke") {
                            if (!size) {
                                fixXDataOwner(this);
                            }
                        } else if (xtatus === "sub" && val === "root") {
                            throw {
                                target: proxy_self,
                                desc: "cannot modify sub to root"
                            };
                        }
                        xtatus = val;
                    }
                },
                // 所有父层对象存储的位置
                // 拥有者对象
                owner: {
                    configurable: true,
                    writable: true,
                    value: new Set()
                },
                // 数组对象
                length: {
                    configurable: true,
                    writable: true,
                    value: 0
                },
                // 监听函数
                [WATCHS]: {
                    value: new Map()
                },
                [CANUPDATE]: {
                    writable: true,
                    value: 0
                }
            });

            let maxNum = -1;
            Object.keys(obj).forEach(key => {
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
                    // 通过get set 函数设置
                    defineProperties(this, {
                        [key]: descObj
                    });
                } else {
                    // 直接设置函数
                    // this.setData(key, value);
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

                // 设置父层的key
                value.owner.add(this);
            }

            const oldVal = this[key];

            if (oldVal === value) {
                return true;
            }

            let reval = Reflect.set(this, key, value);

            // if (this[CANUPDATE] || this._update === false) {
            if (this[CANUPDATE]) {
                // 改动冒泡
                emitUpdate(this, {
                    xid: this.xid,
                    name: "setData",
                    args: [key, value]
                });
            }

            clearXDataOwner(oldVal, this);

            return reval;
        }

        delete(key) {
            // 确认key是隐藏属性
            if (/^_/.test(key) || typeof key === "symbol") {
                return Reflect.deleteProperty(this, key);
            }

            if (!key) {
                return false;
            }

            // 无proxy自身
            const _this = this[XDATASELF];

            let val = _this[key];
            // 清除owner上的父层
            // val.owner.delete(_this);
            clearXDataOwner(val, _this);

            let reval = Reflect.deleteProperty(_this, key);

            // 改动冒泡
            emitUpdate(this, {
                xid: this.xid,
                name: "delete",
                args: [key]
            });

            return reval;
        }
    }

    // 中转XBody的请求
    const xdataHandler = {
        set(target, key, value, receiver) {
            if (typeof key === "symbol") {
                return Reflect.set(target, key, value, receiver);
            }

            // 确认key是隐藏属性
            if (/^_/.test(key)) {
                if (!target.hasOwnProperty(key)) {
                    defineProperties(target, {
                        [key]: {
                            writable: true,
                            configurable: true,
                            value
                        }
                    })
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
                    target: receiver
                };
            }
        },
        deleteProperty: function(target, key) {
            return target.delete(key);
        }
    }

    // 清除xdata的owner数据
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
            Object.values(xdata).forEach(child => {
                clearXDataOwner(child, xdata[XDATASELF]);
            });
        }
    }

    // 修正xdata的owner数据
    const fixXDataOwner = (xdata) => {
        if (xdata._xtatus === "revoke") {
            // 重新修复状态
            Object.values(xdata).forEach(e => {
                if (isxdata(e)) {
                    fixXDataOwner(e);
                    e.owner.add(xdata);
                    e._xtatus = "sub";
                }
            });
        }
    }

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
                let f = new Function(`with(this){return ${expr}}`)
                expr = _this => {
                    try {
                        return f.call(_this, _this);
                    } catch (e) {}
                };
            }

            if (expr.call(this, this)) {
                arr.push(this);
            }

            Object.values(this).forEach(e => {
                if (isxdata(e)) {
                    arr.push(...e.seek(expr));
                }
            });

            return arr;
        },
        // watch异步收集版本
        watchTick(func) {
            return this.watch(collect(func));
        },
        // 监听直到表达式成功
        watchUntil(expr) {
            if (/[^=><]=[^=]/.test(expr)) {
                throw 'cannot use single =';
            }

            return new Promise(resolve => {
                // 忽略错误
                let exprFun = new Function(`
        try{with(this){
            return ${expr}
        }}catch(e){}`).bind(this);

                let f;
                const wid = this.watch(f = () => {
                    let reVal = exprFun();
                    if (reVal) {
                        this.unwatch(wid);
                        resolve(reVal);
                    }
                });
                f();
            });
        },
        // 监听相应key
        watchKey(obj, immediately) {
            if (immediately) {
                Object.keys(obj).forEach(key => obj[key].call(this, this[key]));
            }

            let oldVal = {};
            // Object.entries(this).forEach(([k, v]) => {
            //     oldVal[k] = v;
            // });
            return this.watch(collect((arr) => {
                Object.keys(obj).forEach(key => {
                    // 当前值
                    let val = this[key];

                    if (oldVal[key] !== val) {
                        obj[key].call(this, val);
                    } else if (isxdata(val)) {
                        // 判断改动arr内是否有当前key的改动
                        let hasChange = arr.some(e => {
                            let p = e.path[1];

                            // if (p == oldVal[key]) {
                            return p == val;
                        });

                        if (hasChange) {
                            obj[key].call(this, val);
                        }
                    }

                    oldVal[key] = val;
                });
            }));
        },
        // 转换为json数据
        toJSON() {
            let obj = {};

            let isPureArray = true;
            let maxId = 0;

            Object.keys(this).forEach(k => {
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
                    get: () => xid
                }
            });

            return obj;
        },
        // 转为字符串
        toString() {
            return JSON.stringify(this.toJSON());
        }
    });

    // 不影响数据原结构的方法，重新做钩子
    ['concat', 'every', 'filter', 'find', 'findIndex', 'forEach', 'map', 'slice', 'some', 'indexOf', 'lastIndexOf', 'includes', 'join'].forEach(methodName => {
        let arrayFnFunc = Array.prototype[methodName];
        if (arrayFnFunc) {
            defineProperties(XData.prototype, {
                [methodName]: {
                    value: arrayFnFunc
                }
            });
        }
    });

    // 原生splice方法
    const arraySplice = Array.prototype.splice;

    extend(XData.prototype, {
        splice(index, howmany, ...items) {
            let self = this[XDATASELF];

            // items修正
            items = items.map(e => {
                let valueType = getType(e);
                if (valueType == "array" || valueType == "object") {
                    e = createXData(e, "sub");
                    e.owner.add(self);
                }

                return e;
            })

            let b_howmany = getType(howmany) == 'number' ? howmany : (this.length - index);

            // 套入原生方法
            let rmArrs = arraySplice.call(self, index, b_howmany, ...items);

            // rmArrs.forEach(e => isxdata(e) && e.owner.delete(self));
            rmArrs.forEach(e => clearXDataOwner(e, self));

            // 改动冒泡
            emitUpdate(this, {
                xid: this.xid,
                name: "splice",
                args: [index, howmany, ...items]
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
        }
    });

    ['sort', 'reverse'].forEach(methodName => {
        // 原来的数组方法
        const arrayFnFunc = Array.prototype[methodName];

        if (arrayFnFunc) {
            defineProperties(XData.prototype, {
                [methodName]: {
                    value(...args) {
                        let reval = arrayFnFunc.apply(this[XDATASELF], args)

                        emitUpdate(this, {
                            xid: this.xid,
                            name: methodName
                        });

                        return reval;
                    }
                }
            });
        }
    });

    //<o:end--xdata.js-->

    const stanz = obj => createXData(obj, "root");

    Object.assign(stanz, {
        version: "7.0.0",
        v: 7000000,
        isxdata,
        // collect
    });

    return stanz;
});