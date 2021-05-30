const XDATASELF = Symbol("self");
const WATCHS = Symbol("watchs");
const CANUPDATE = Symbol("can_update");

const emitUpdate = (target, opts) => {
    // 触发callback
    target[WATCHS].forEach(f => f(opts))

    // 向上冒泡
    target.owner.forEach(parent => emitUpdate(parent, opts));
}

class XData {
    constructor(obj) {
        if (isxdata(obj)) {
            return obj;
        }

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

        // 每个对象的专属id
        defineProperties(this, {
            [XDATASELF]: {
                value: this
            },
            // 每个对象必有的id
            xid: {
                value: "x_" + getRandomId()
            },
            // 所有父层对象存储的位置
            // 拥有者对象
            owner: {
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
                this.setData(key, value);
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
        // 确认key是隐藏属性
        if (/^_/.test(key)) {
            defineProperties(this, {
                [key]: {
                    writable: true,
                    configurable: true,
                    value
                }
            })
            return true;
        }

        let valueType = getType(value);
        if (valueType == "array" || valueType == "object") {
            // if (value instanceof Object) {
            value = new XData(value, this);

            // 设置父层的key
            value.owner.add(this);
        }

        const oldVal = this[key];

        let reval = Reflect.set(this, key, value);

        if (this[CANUPDATE] || this._update === false) {
            // 改动冒泡
            emitUpdate(this, {
                xid: this.xid,
                name: "setData",
                args: [key, value]
            });
        }

        if (isxdata(oldVal)) {
            oldVal.owner.delete(this);
        }

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
        if (isxdata(val)) {
            // 清除owner上的父层
            val.owner.delete(_this);
        }

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
        return target.setData(key, value);
    },
    deleteProperty: function (target, key) {
        return target.delete(key);
    }
}

const createXData = (obj) => {
    return new XData(obj);
};