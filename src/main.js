const XDATASELF = Symbol("self");
const PROXYSELF = Symbol("proxy");
const WATCHS = Symbol("watchs");
const CANUPDATE = Symbol("can_update");

const cansetXtatus = new Set(["root", "sub", "revoke"]);

const emitUpdate = (target, opts, path, unupdate) => {
    let new_path;
    if (!path) {
        new_path = opts.path = [target[PROXYSELF]];
    } else {
        new_path = opts.path = [target[PROXYSELF], ...path];
    }

    // 触发callback
    target[WATCHS].forEach(f => f(opts));

    if (unupdate || target._unupdate) {
        return;
    }

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
            let { value, get, set } = descObj;

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

        let oldVal;
        const descObj = Object.getOwnPropertyDescriptor(this, key);
        const p_self = this[PROXYSELF];
        try {
            // 为了只有 set 没有 get 的情况
            oldVal = p_self[key];
        } catch (err) { }

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

    // 主动触发更新事件
    // 方便 get 类型数据触发 watch 
    update(opts = {}) {
        emitUpdate(this, Object.assign({}, opts, {
            xid: this.xid,
            isCustom: true
        }));
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
                key, value,
                target: receiver
            };
        }
    },
    deleteProperty: function (target, key) {
        return target.delete(key);
    }
}

// 清除xdata的owner数据
const clearXDataOwner = (xdata, parent) => {
    if (!isxdata(xdata)) {
        return;
    }

    const { owner } = xdata;
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