const XDATASELF = Symbol("self");
const WATCHS = Symbol("watchs");
const WATCHRELYS = Symbol("relys");

// 添加watch依赖对象
const addWatchRely = (needDeepTarget, needAddTargets) => {
    Object.values(needDeepTarget).forEach(target => {
        if (isxdata(target)) {
            let selfRelys = target[WATCHRELYS];

            // 添加到依赖
            needAddTargets.forEach(t => selfRelys.add(t));

            debugger
        }
    });
}

// 取消watch依赖对象
const removeWatchRely = (target, relyarget) => {

}

// 触发watch监听
const emitWatch = (d, modifyData) => {

    // d[WATCHRELYS].forEach(target => {
    //     const watchs = target[WATCHS];
    //     let { calls, modifys } = watchs;
    //     modifys.push(modifyData);

    //     nextTick(() => {
    //         calls.forEach(f => f(modifys.slice()))
    //         modifys.length = 0;
    //     }, watchs);
    // })
}

class XData {
    constructor(obj) {
        let p_self;
        if (obj.get) {
            p_self = new Proxy(this, {
                get: obj.get,
                set: xdataHandler.set
            });
        } else {
            p_self = new Proxy(this, xdataHandler);
        }

        defineProperties(this, {
            xid: {
                // 对象专属id
                value: "x_" + getRandomId()
            },
            [XDATASELF]: {
                value: this
            },
            [WATCHS]: {
                // watch相关的寄宿对象数据
                value: {
                    // self: this,
                    // 存放watch函数
                    calls: new Map(),
                    // 改动数据存放处
                    modifys: []
                }
            },
            [WATCHRELYS]: {
                // 需要被触发 watch 的上级对象
                value: new Set()
            },
            length: {
                // 数组长度
                writable: true,
                value: 0
            },
            _updata: {
                // 能否触发更新数据事件
                writable: true,
                value: false
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

        this._updata = true;

        if (maxNum > -1) {
            this.length = maxNum + 1;
        }

        return p_self;
    }

    // 设置是数据
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

        if (value instanceof Object) {
            value = new XData(value);

            if (this[WATCHS].calls.size) {
                // 向子集添加watch对象数据
                // addWatchRely(value, this);
                debugger
            }
        }

        let oldValue = this[key];

        let reval = Reflect.set(this, key, value);

        if (this._updata) {
            emitWatch(this, {
                methodName: "setData",
                key,
                value,
                oldValue,
                xid: this.xid,
                mid: getTimeId()
            });
        }

        return reval;
    }

    // 去除数据
    remove(key) {

    }

    watch(callback) {
        let wid = "w_" + getRandomId();

        this[WATCHS].calls.set(wid, callback);

        addWatchRely(this, [this, ...this[WATCHRELYS]]);

        return wid;
    }

    unwatch(wid) {
        return this[WATCHS].calls.delete(wid);
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


const createXData = (obj) => new XData(obj);