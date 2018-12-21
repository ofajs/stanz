((glo) => {
    // public function
// 获取随机id
const getRandomId = () => Math.random().toString(32).substr(2);
let objectToString = Object.prototype.toString;
const getType = value => objectToString.call(value).toLowerCase().replace(/(\[object )|(])/g, '');
const isUndefined = val => val === undefined;

let {
    defineProperty,
    defineProperties,
    assign
} = Object;

// 克隆object
const cloneObject = obj => JSON.parse(JSON.stringify(obj));

// 设置不可枚举的方法
const setNotEnumer = (tar, obj) => {
    for (let k in obj) {
        defineProperty(tar, k, {
            // enumerable: false,
            writable: true,
            value: obj[k]
        });
    }
}

// common
const EVES = "_eves_" + getRandomId();

    function XData(obj, options = {}) {
    // let proxyThis = new Proxy(this, XDataHandler);
    let proxyThis = this;

    // 数组的长度
    let length = 0;

    // 数据合并
    Object.keys(obj).forEach(k => {
        // 值
        let value = obj[k];

        if (!/\D/.test(k)) {
            // 数字key
            k = parseInt(k);

            if (k >= length) {
                length = k + 1;
            }
        }

        // 设置值
        this[k] = createXData(value, {
            parent: proxyThis,
            hostkey: k
        });
    });

    let opt = {
        // status: "root",
        // 设置数组长度
        length,
        // 事件寄宿对象
        [EVES]: new Map()
    };

    // 设置不可枚举数据
    setNotEnumer(this, opt);

    // 设置专属值
    defineProperties(this, {
        status: {
            writable: true,
            value: options.parent ? "binding" : "root"
        },
        parent: {
            writable: true,
            value: options.parent
        },
        hostkey: {
            writable: true,
            value: options.hostkey
        }
    });

    return proxyThis;
}

let XDataFn = XData.prototype = {};


function XDataEvent(type, target) {
    let enumerable = true;
    defineProperties(this, {
        type: {
            enumerable,
            value: type
        },
        keys: {
            enumerable,
            value: []
        },
        target: {
            enumerable,
            value: target
        },
        bubble: {
            enumerable,
            writable: true,
            value: true
        },
        cancel: {
            enumerable,
            writable: true,
            value: false
        },
        currentTarget: {
            enumerable,
            writable: true,
            value: target
        }
    });
}

defineProperties(XDataEvent.prototype, {
    // trend数据，用于给其他数据同步用的
    trend: {
        get() {
            let {
                modify
            } = this;

            if (!modify) {
                return;
            }

            let reobj = {
                genre: modify.genre,
                keys: this.keys.slice()
            };

            defineProperty(reobj, "oldVal", {
                value: modify.oldVal
            });

            switch (modify.genre) {
                case "arrayMethod":
                    var {
                        methodName,
                        args,
                        modifyId
                    } = modify;

                    assign(reobj, {
                        methodName,
                        args,
                        modifyId
                    });
                    break;
                default:
                    var {
                        value,
                        modifyId
                    } = modify;

                    if (isXData(value)) {
                        value = value.object;
                    }
                    assign(reobj, {
                        key: modify.key,
                        value,
                        modifyId
                    });
                    break;
            }

            return reobj;
        }
    }
});

    // 获取事件数组
const getEvesArr = (tar, eventName) => {
    let eves = tar[EVES];
    let tarSetter = eves.get(eventName);

    if (!tarSetter) {
        tarSetter = new Set();
        eves.set(eventName, tarSetter);
    }

    return tarSetter;
};

setNotEnumer(XDataFn, {
    // 事件注册
    on(eventName, callback, data) {
        let count;
        // 判断是否对象传入
        if (getType(eventName) == "object") {
            let eveONObj = eventName;
            eventName = eveONObj.event;
            callback = eveONObj.callback;
            data = eveONObj.data;
            count = eveONObj.count;
        }

        // 分解id参数
        let spIdArr = eventName.split('#');
        let eventId;
        if (1 in spIdArr) {
            eventId = spIdArr[1];
            eventName = spIdArr[0];
        }

        // 获取事件寄宿对象
        let eves = getEvesArr(this, eventName);

        if (!isUndefined(eventId)) {
            // 判断是否存在过这个id的事件注册过
            // 注册过这个id的把旧的删除
            Array.from(eves).some((opt) => {
                // 想等值得删除
                if (opt.eventId === eventId) {
                    eves.delete(opt);
                    return true;
                }
            });
        }

        // 事件数据记录
        callback && eves.add({
            eventName,
            callback,
            data,
            eventId,
            count
        });

        return this;
    },
    // 注册触发一次的事件
    one(eventName, callback, data) {
        if (getType(eventName) == "object") {
            eventName.count = 1;
            this.on(eventName);
        } else {
            this.on({
                event: eventName,
                callback,
                data
            });
        }
        return this;
    },
    off(eventName, callback) {
        // 判断是否对象传入
        if (getType(eventName) == "object") {
            let eveONObj = eventName;
            eventName = eveONObj.event;
            callback = eveONObj.callback;
        }
        let eves = getEvesArr(this, eventName);
        Array.from(eves).some((opt) => {
            // 想等值得删除
            if (opt.callback === callback) {
                eves.delete(opt);
                return true;
            }
        });
        return this;
    },
    emit(eventName, emitData) {
        let eves, eventObj;

        if (eventName instanceof XDataEvent) {
            // 直接获取对象
            eventObj = eventName;

            // 修正事件名变量
            eventName = eventName.type;
        } else {
            // 生成emitEvent对象
            eventObj = new XDataEvent(eventName, this);
        }

        // 修正currentTarget
        eventObj.currentTarget = this;

        // 获取事件队列数组
        eves = getEvesArr(this, eventName);

        // 事件数组触发
        Array.from(eves).some((opt) => {
            // 触发callback
            // 如果cancel就不执行了
            if (eventObj.cancel) {
                return true;
            }

            // 添加数据
            let args = [eventObj];
            !isUndefined(opt.data) && (eventObj.data = opt.data);
            !isUndefined(opt.eventId) && (eventObj.eventId = opt.eventId);
            !isUndefined(opt.count) && (eventObj.count = opt.count);
            !isUndefined(emitData) && (args.push(emitData));

            opt.callback.apply(this, args);

            // 删除多余数据
            delete eventObj.data;
            delete eventObj.eventId;
            delete eventObj.count;

            // 判断次数
            if (opt.count) {
                opt.count--;
                if (opt.count <= 0) {
                    eves.delete(opt);
                }
            }
        });

        // 冒泡触发
        if (eventObj.bubble && !eventObj.cancel) {
            let {
                parent
            } = this;
            if (parent) {
                eventObj.keys.unshift(this.hostkey);
                parent.emit(eventObj, emitData);
            }
        }

        return this;
    }
});

    let XDataHandler = {
    set(xdata, key, value, receiver) {
        return Reflect.set(xdata, key, value, receiver)
    },
    deleteProperty(xdata, key) {
        return Reflect.deleteProperty(xdata, key);
    }
};

    // 生成xdata对象
const createXData = (obj, options) => {
    let redata = obj;
    switch (getType(obj)) {
        case "object":
        case "array":
            redata = new XData(obj, options);
            break;
    }

    return redata;
};

    glo.stanz = (obj) => createXData(obj);

})(window);