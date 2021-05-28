const WATCHS = Symbol("watchs");
const CANUPDATE = Symbol("can_update");
const XDATASELF = Symbol("self");

// 获取事件对象
const getEves = (target, ckey) => {
    const watchs = target[WATCHS];
    let eveSets = watchs.get(ckey);

    if (!eveSets) {
        eveSets = new Map();
        watchs.set(ckey, eveSets);
    }

    return eveSets;
}

class Trend {
    constructor(obj) {
        Object.assign(this, obj);
    }
    get fromKey() {
        if (this.keys.length) {
            return this.keys[0];
        }
        if (this.methodName == "setData") {
            return this.args[0];
        }
    }
}

// 触发update
const emitUpdate = ({ target, methodName, args, keys = [], val, oldVal, mid }) => {
    if (!target[CANUPDATE] || target._update === false) {
        return;
    }

    if (!mid) {
        mid = getTimeId();
    }

    let trendData = new Trend({
        methodName,
        args,
        keys,
        val,
        oldVal,
        mid
    });

    let { fromKey } = trendData;

    if (target[WATCHS].get(fromKey)) {
        let tWatchs = getEves(target, fromKey);

        for (let [watchId, callback] of tWatchs) {
            callback(trendData);
        }
    }

    let selfWatchs = getEves(target, "");

    selfWatchs.forEach(func => {
        func(trendData);
    });

    // 向上冒泡
    for (let [parent, index] of target.owner) {
        let n_keys = keys.slice();
        n_keys.unshift(index);
        emitUpdate({
            target: parent,
            methodName,
            args,
            keys: n_keys,
            val,
            oldVal,
            mid
        });
    }

    return true;
}

class XData {
    constructor(obj) {
        if (isxdata(obj)) {
            return obj;
        }

        // 对象专属id
        const xid = "x_" + getRandomId();

        // 每个对象的专属id
        defineProperties(this, {
            [XDATASELF]: {
                value: this
            },
            // 每个对象必有的id
            xid: {
                get: () => xid
            },
            // 所有父层对象存储的位置
            // 拥有者对象
            owner: {
                value: new Map()
            },
            // 数组对象
            length: {
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

        if (obj.get) {
            return new Proxy(this, {
                get: obj.get,
                set: xdataHandler.set
            });
        }

        this[CANUPDATE] = 1;

        return new Proxy(this, xdataHandler);
    }

    /**
     * 给对象设置值
     * @param {String|Number|Symbol} key 设置在对象上的key
     * @param {*} val 设置的值
     */
    setData(key, val) {
        // 确认key是隐藏属性
        if (/^_/.test(key)) {
            defineProperties(this, {
                [key]: {
                    writable: true,
                    configurable: true,
                    value: val
                }
            })
            return true;
        }

        if (val instanceof Object) {
            val = new XData(val, this);

            // 设置父层的key
            // val.owner.set(this, { key, self: this });
            val.owner.set(this, key);
            // val._parent = this;
            // val._index = key;
        }

        let oldVal = this[key];

        let reval = Reflect.set(this, key, val);

        // change事件冒泡
        emitUpdate({
            target: this,
            methodName: 'setData',
            args: [key, val],
            keys: [],
            val,
            oldVal
        });

        // if (isxdata(oldVal)) {
        //     oldVal.owner.delete(this);
        // }

        return reval;
    }

    /**
     * 监听表达式是否符合条件
     * @param {String} expr 监听表达式
     * @param {Function} func 监听函数
     * @return {String} 监听事件id
     */
    watch(expr, func) {
        if (isFunction(expr) && !func) {
            func = expr;
            expr = "";
        }

        let eves = getEves(this, expr);

        // 建档
        let eid = "e_" + getRandomId();
        eves.set(eid, func)

        return eid;
    }

    /**
     * 取消监听某个事件
     * @param {String} wid 注销监听的id
     */
    unwatch(wid) {
        let removeSucceed = false;
        this[WATCHS].forEach(e => {
            if (removeSucceed) return;

            if (e.has(wid)) {
                e.delete(wid);
                removeSucceed = true;
            }
        });
        if (!removeSucceed) {
            console.warn(`unwatch fail => ${wid}`);
        }
        return removeSucceed;
    }

    remove(key) {
        // 确认key是隐藏属性
        if (/^_/.test(key) || typeof key === "symbol") {
            return Reflect.deleteProperty(this, key);
        }

        if (key) {
            // 删除相应子属性的值
            let val = this[key];
            if (isxdata(val)) {
                // 清除父层痕
                for (let [parent, index] of val.owner) {
                    if (parent.xid === this.xid) {
                        val.owner.delete(parent);
                        Reflect.deleteProperty(parent, index);
                        return emitUpdate({
                            target: this,
                            methodName: 'remove',
                            args: [key],
                            keys: [],
                            val: undefined,
                            oldVal: val
                        });
                    }
                }
            }
            return true;
        } else {
            throw {
                desc: "remove method need key",
                target: this
            };
        }
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
        return target.remove(key);
    }
}

const createXData = (obj) => {
    return new XData(obj);
};