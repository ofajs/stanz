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
// 事件寄宿对象key
const EVES = "_eves_" + getRandomId();
// 是否在数组方法执行中key
const RUNARRMETHOD = "_runarrmethod_" + getRandomId();
// 存放modifyId的寄宿对象key
const MODIFYHOST = "_modify_" + getRandomId();

// business function
let isXData = obj => obj instanceof XData;

// 按条件判断数据是否符合条件
const conditData = (exprKey, exprValue, exprType, exprEqType, tarData) => {
    let reData = 0;

    // 搜索数据
    switch (exprType) {
        case "keyValue":
            let tarValue = tarData[exprKey];
            switch (exprEqType) {
                case "=":
                    if (tarValue == exprValue) {
                        reData = 1;
                    }
                    break;
                case ":=":
                    if (isXData(tarValue) && tarValue.findIndex(e => e == exprValue) > -1) {
                        reData = 1;
                    }
                    break;
                case "*=":
                    if (getType(tarValue) == "string" && tarValue.search(exprValue) > -1) {
                        reData = 1;
                    }
                    break;
                case "~=":
                    if (getType(tarValue) == "string" && tarValue.split(' ').findIndex(e => e == exprValue) > -1) {
                        reData = 1;
                    }
                    break;
            }
            break;
        case "hasValue":
            switch (exprEqType) {
                case "=":
                    if (Object.values(tarData).findIndex(e => e == exprValue) > -1) {
                        reData = 1;
                    }
                    break;
                case ":=":
                    Object.values(tarData).some(tarValue => {
                        if (isXData(tarValue) && tarValue.findIndex(e => e == exprValue) > -1) {
                            reData = 1;
                            return true;
                        }
                    });
                    break;
                case "*=":
                    Object.values(tarData).some(tarValue => {
                        if (getType(tarValue) == "string" && tarValue.search(exprValue) > -1) {
                            reData = 1;
                            return true;
                        }
                    });
                    break;
                case "~=":
                    Object.values(tarData).some(tarValue => {
                        if (getType(tarValue) == "string" && tarValue.split(' ').findIndex(e => e == exprValue) > -1) {
                            reData = 1;
                            return true;
                        }
                    });
                    break;
            }
            break;
        case "hasKey":
            if (tarData.hasOwnProperty(exprKey)) {
                reData = 1;
            }
            break;
    }

    return reData;
}

// 查找数据
let seekData = (data, exprObj) => {
    let arr = [];

    // 关键数据
    let exprKey = exprObj.k,
        exprValue = exprObj.v,
        exprType = exprObj.type,
        exprEqType = exprObj.eqType;

    Object.keys(data).forEach(k => {
        let tarData = data[k];

        if (isXData(tarData)) {
            // 判断是否可添加
            let canAdd = conditData(exprKey, exprValue, exprType, exprEqType, tarData);

            // 允许就添加
            canAdd && arr.push(tarData);

            // 查找子项
            let newArr = seekData(tarData, exprObj);
            arr.push(...newArr);
        }
    });
    return arr;
}

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

    function XData(obj, options = {}) {
    let proxyThis = new Proxy(this, XDataHandler);
    // let proxyThis = this;

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
        [EVES]: new Map(),
        [MODIFYHOST]: new Set()
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

    // 主体entrend方法
const entrend = (options) => {
    let {
        target,
        key,
        value,
        receiver,
        modifyId,
        genre
    } = options;

    // 判断modifyId
    if (!modifyId) {
        modifyId = getRandomId();
    } else {
        // 查看是否已经存在这个modifyId了，存在就不折腾
        if (target[MODIFYHOST].has(modifyId)) {
            return;
        };
    }

    switch (genre) {
        case "handleSet":
            // 获取旧的值
            let oldVal = target[key];

            // 如果相等的话，就不要折腾了
            if (oldVal === value) {
                return true;
            }

            let isFirst;
            // 判断是否初次设置
            if (!target.hasOwnProperty(key)) {
                isFirst = 1;
            }

            // 设置值
            target[key] = createXData(value, {
                parent: receiver,
                hostkey: key
            });

            // 事件实例生成
            let eveObj = new XDataEvent('update', receiver);

            // 添加修正数据
            eveObj.modify = {
                // change 改动
                // set 新增值
                genre: isFirst ? "new" : "change",
                key,
                value,
                oldVal,
                modifyId
            };

            target.emit(eveObj);
            break;
    }

    return true;
}

    // 数组通用方法
// 可运行的方法
['concat', 'every', 'filter', 'find', 'findIndex', 'forEach', 'map', 'slice', 'some', 'indexOf', 'includes'].forEach(methodName => {
    let arrayFnFunc = Array.prototype[methodName];
    if (arrayFnFunc) {
        defineProperty(XDataFn, methodName, {
            writable: true,
            value(...args) {
                return arrayFnFunc.apply(this, args);
            }
        });
    }
});

    let XDataHandler = {
    set(target, key, value, receiver) {
        // 私有变量直接通过
        // 数组函数运行中直接通过
        if (/^_.+/.test(key) || target[RUNARRMETHOD]) {
            return Reflect.set(xdata, key, value, receiver);
        }

        // 其他方式就要通过主体entrend调整
        return entrend({
            genre: "handleSet",
            target,
            key,
            value,
            receiver
        });
    },
    deleteProperty(xdata, key) {
        return Reflect.deleteProperty(xdata, key);
    }
};

    setNotEnumer(XDataFn, {
    seek(expr) {
        // 代表式的组织化数据
        let exprObjArr = [];

        let hostKey;
        let hostKeyArr = expr.match(/(^[^\[\]])\[.+\]/);
        if (hostKeyArr && hostKeyArr.length >= 2) {
            hostKey = hostKeyArr[1];
        }

        // 分析expr字符串数据
        let garr = expr.match(/\[.+?\]/g);

        garr.forEach(str => {
            str = str.replace(/\[|\]/g, "");
            let strarr = str.split(/(=|\*=|:=|~=)/);

            let param_first = strarr[0];

            switch (strarr.length) {
                case 3:
                    if (param_first) {
                        exprObjArr.push({
                            type: "keyValue",
                            k: param_first,
                            eqType: strarr[1],
                            v: strarr[2]
                        });
                    } else {
                        exprObjArr.push({
                            type: "hasValue",
                            eqType: strarr[1],
                            v: strarr[2]
                        });
                    }
                    break;
                case 1:
                    exprObjArr.push({
                        type: "hasKey",
                        k: param_first
                    });
                    break;
            }
        });

        // 要返回的数据
        let redata;

        exprObjArr.forEach((exprObj, i) => {
            let exprKey = exprObj.k,
                exprValue = exprObj.v,
                exprType = exprObj.type,
                exprEqType = exprObj.eqType;

            switch (i) {
                case 0:
                    // 初次查找数据
                    redata = seekData(this, exprObj);
                    break;
                default:
                    // 筛选数据
                    redata = redata.filter(tarData => conditData(exprKey, exprValue, exprType, exprEqType, tarData) ? tarData : undefined);
            }
        });

        // hostKey过滤
        if (hostKey) {
            redata = redata.filter(e => (e.hostkey == hostKey) ? e : undefined);
        }

        return redata;
    },
});


defineProperties(XDataFn, {
    // 直接返回object
    "object": {
        get() {
            let obj = {};

            Object.keys(this).forEach(k => {
                let val = this[k];

                if (isXData(val)) {
                    obj[k] = val.object;
                } else {
                    obj[k] = val;
                }
            });

            return obj;
        }
    },
    "string": {
        get() {
            return JSON.stringify(this.object);
        }
    },
    "root": {
        get() {
            let root = this;
            while (root.parent) {
                root = root.parent;
            }
            return root;
        }
    }
});

    glo.stanz = (obj) => createXData(obj);

})(window);