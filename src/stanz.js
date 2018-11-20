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

    //改良异步方法
    const nextTick = (() => {
        let isTick = false;
        let nextTickArr = [];
        return (fun) => {
            if (!isTick) {
                isTick = true;
                setTimeout(() => {
                    for (let i = 0; i < nextTickArr.length; i++) {
                        nextTickArr[i]();
                    }
                    nextTickArr = [];
                    isTick = false;
                }, 0);
            }
            nextTickArr.push(fun);
        };
    })();

    // common
    const EVES = "_eves_" + getRandomId();
    const RUNARRMETHOD = "_runarrmethod_" + getRandomId();
    const WATCHTIMEOUTDATA = "_watchtimeout_" + getRandomId();
    const WATCHFUNCHOST = "_watch_func_" + getRandomId();

    // business function
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
                        if (tarValue instanceof XData && tarValue.findIndex(e => e == exprValue) > -1) {
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
                            if (tarValue instanceof XData && tarValue.findIndex(e => e == exprValue) > -1) {
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
                if (exprKey in tarData) {
                    reData = 1;
                }
                break;
        }

        return reData;
    }

    // 查找数据
    const seekData = (data, exprObj) => {
        let arr = [];

        // 关键数据
        let exprKey = exprObj.k,
            exprValue = exprObj.v,
            exprType = exprObj.type,
            exprEqType = exprObj.eqType;

        Object.keys(data).forEach(k => {
            let tarData = data[k];

            if (tarData instanceof XData) {
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

    // main class
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

    // defineProperties(XDataEvent.prototype, {
    //     trend: {
    //         get() {}
    //     }
    // });

    function XData(obj, options = {}) {
        // 生成代理对象
        let proxyThis = new Proxy(this, XDataHandler);

        // 数组的长度
        let length = 0;

        // 非数组数据合并
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
            status: "root",
            // 设置数组长度
            length,
            // 事件寄宿对象
            [EVES]: {},
            // watch 的 timeout 寄宿器
            [WATCHTIMEOUTDATA]: {},
            // watch寄宿对象
            [WATCHFUNCHOST]: {}
        };

        if (options.parent) {
            opt.status = "binding";
            opt.parent = options.parent;
            opt.hostkey = options.hostkey;
        }

        // 设置不可枚举数据
        setNotEnumer(this, opt);

        // 返回Proxy对象
        return proxyThis;
    }
    let XDataFn = XData.prototype = {};

    // 数组通用方法
    // 可运行的方法
    ['concat', 'every', 'filter', 'find', 'findIndex', 'forEach', 'map', 'slice', 'some'].forEach(methodName => {
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

    // 会影响数组结构的方法
    ['pop', 'push', 'reverse', 'sort', 'splice', 'shift', 'unshift'].forEach(methodName => {
        let arrayFnFunc = Array.prototype[methodName];
        if (arrayFnFunc) {
            defineProperty(XDataFn, methodName, {
                writable: true,
                value(...args) {
                    // 设置不可执行setHandler
                    this[RUNARRMETHOD] = 1;

                    let redata = arrayFnFunc.apply(this, args);

                    // 事件实例生成
                    let eveObj = new XDataEvent('update', this);

                    eveObj.modify = {
                        // change 改动
                        // set 新增值
                        genre: "arrayMethod",
                        methodName,
                        args,
                        // modifyId: getRandomId()
                    };

                    this.emit(eveObj);

                    // 还原可执行setHandler
                    delete this[RUNARRMETHOD];
                    return redata;
                }
            });
        }
    });

    // 获取事件数组
    const getEvesArr = (tar, eventName) => tar[EVES][eventName] || (tar[EVES][eventName] = []);

    // 设置数组上的方法
    setNotEnumer(XDataFn, {
        // 事件注册
        on(eventName, callback, options = {}) {
            let eves = getEvesArr(this, eventName);

            // 判断是否相应id的事件绑定
            let oid = options.id;
            if (!isUndefined(oid)) {
                let tarId = eves.findIndex(e => e.eventId == oid);
                (tarId > -1) && eves.splice(tarId, 1);
            }

            // 事件数据记录
            callback && eves.push({
                callback,
                eventId: options.id,
                onData: options.data,
                one: options.one
            });

            return this;
        },
        one(eventName, callback, options = {}) {
            options.one = 1;
            return this.on(eventName, callback, options);
        },
        off(eventName, callback, options = {}) {
            let eves = getEvesArr(this, eventName);
            eves.some((opt, index) => {
                // 想等值得删除
                if (opt.callback === callback && opt.eventId === options.id && opt.onData === options.data) {
                    eves.splice(index, 1);
                    return true;
                }
            });
            return this;
        },
        emit(eventName, emitData, options = {}) {
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

            // 设置emit上的bubble
            if (options.bubble == false) {
                eventObj.bubble = false;
            }

            // 修正currentTarget
            eventObj.currentTarget = this;

            // 获取事件队列数组
            eves = getEvesArr(this, eventName);

            // 删除的个数
            let deleteCount = 0;

            // 事件数组触发
            Array.from(eves).some((opt, index) => {
                // 触发callback
                // nextTick(() => {
                // 如果cancel就不执行了
                if (eventObj.cancel) {
                    return true;
                }

                // 添加数据
                let args = [eventObj];
                !isUndefined(opt.onData) && (eventObj.data = opt.onData);
                !isUndefined(opt.eventId) && (eventObj.eventId = opt.eventId);
                !isUndefined(opt.one) && (eventObj.one = opt.one);
                !isUndefined(emitData) && (args.push(emitData));

                opt.callback.apply(this, args);

                // 删除多余数据
                delete eventObj.data;
                delete eventObj.eventId;
                delete eventObj.one;
                // });

                // 判断one
                if (opt.one) {
                    eves.splice(index - deleteCount, 1);
                    deleteCount++;
                }
            });

            // 冒泡触发
            if (eventObj.bubble && !eventObj.cancel) {
                let {
                    parent
                } = this;
                if (parent) {
                    // nextTick(() => {
                    eventObj.keys.unshift(this.hostkey);
                    // });
                    parent.emit(eventObj, emitData);
                }
            }

            return this;
        },
        // 删除值
        remove(key) {
            if (isUndefined(key)) {

            } else {

            }
        },
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
        // 插入trend数据
        entrend(options) {

        },
        // 同步数据
        sync(xdataObj) {

        },
        watch(arg1, arg2) {
            let expr, callback;
            let arg1Type = getType(arg1);
            let arg2Type = getType(arg2);

            if (/function/.test(arg1Type)) {
                callback = arg1;
            }

            if (arg1Type == "string") {
                expr = arg1;
                callback = arg2;
            }

            if (!expr && callback) {
                this.on('watch', callback);
            } else if (expr && callback) {
                // 获取一次初始数据
                let hostArr = this[WATCHFUNCHOST] = (this[WATCHFUNCHOST] = []);

                // 记录之前的数据
                let beforeValue = '[]';

                // 寄宿在watch方法上的函数
                let watchCall = e => {
                    // 查找数据
                    let seekData = this.seek(expr);
                    let seekDataStr = JSON.stringify(seekData);

                    // 对比数据
                    if (seekDataStr !== beforeValue) {
                        callback(seekData);
                        beforeValue = seekDataStr;
                    }
                };
                this.on('watch', watchCall);

                // 记录数据
                hostArr.push({
                    expr,
                    callback,
                    watchCall
                });

                // 先记录一次数据
                watchCall()
            }
        },
        unwatch() {

        }
    });


    defineProperties(XDataFn, {
        // 直接返回object
        "object": {
            get() {
                let obj = {};

                Object.keys(this).forEach(k => {
                    let val = this[k];

                    if (val instanceof XData) {
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
        }
    });

    // 私有属性正则
    const PRIREG = /^_.+|^parent$|^hostkey$|^status$|^length$/;

    // handler
    let XDataHandler = {
        set(xdata, key, value, receiver) {
            // 判断是否属于xdata数据
            if (value instanceof XData) {
                debugger
            }

            // 数据转换
            let newValue = createXData(value, {
                parent: receiver,
                hostkey: key
            });

            let oldVal = xdata[key];

            if (!xdata[RUNARRMETHOD]) {
                // 相同值就别瞎折腾了
                if (oldVal === newValue) {
                    return true;
                }

                if (oldVal instanceof XData) {
                    if (newValue instanceof XData && oldVal.string === newValue.string) {
                        // 同是object
                        return true;
                    }
                }

                if (!PRIREG.test(key)) {
                    // 事件实例生成
                    let eveObj = new XDataEvent('update', receiver);

                    let isFirst;
                    // 判断是否初次设置
                    if (!(key in xdata)) {
                        isFirst = 1;
                    }

                    // 添加修正数据
                    eveObj.modify = {
                        // change 改动
                        // set 新增值
                        genre: isFirst ? "set" : "change",
                        key,
                        value,
                        oldVal,
                        // modifyId: getRandomId()
                    };

                    // 触发事件
                    receiver.emit(eveObj);

                    // watch 事件触发
                    // 获取相应的 watch timeout 对象数据
                    let watch_timeout_data = xdata[WATCHTIMEOUTDATA][key];
                    if (!watch_timeout_data) {
                        // 是初始改动
                        watch_timeout_data = xdata[WATCHTIMEOUTDATA][key] = {
                            // 最开始旧的值
                            initData: oldVal,
                            // 前一次值
                            beforeData: oldVal,
                            // 是否第一次
                            isFirst
                        };
                    } else {
                        // 修正上一次的值
                        watch_timeout_data.beforeData = oldVal;
                    }

                    clearTimeout(watch_timeout_data.timeout)
                    watch_timeout_data.timeout = setTimeout(() => {
                        let {
                            initData,
                            isFirst
                        } = watch_timeout_data;

                        // 判断相对初始值，是否有改动过
                        if (initData !== value || (initData instanceof XData && newValue instanceof XData && initData.string !== newValue.string)) {
                            // 事件实例生成
                            let eveObj = new XDataEvent('watch', receiver);

                            // 添加修正数据
                            eveObj.modify = {
                                // change 改动
                                // set 新增值
                                genre: isFirst ? "set" : "change",
                                key,
                                value,
                                // 最开始的 value 才是 oldVal
                                oldVal: watch_timeout_data.initData,
                                // modifyId: getRandomId()
                            };

                            // 触发事件
                            receiver.emit(eveObj);
                        }

                        // 删除组数据
                        delete xdata[WATCHTIMEOUTDATA][key];
                    }, 0);
                }
            }

            let redata = Reflect.set(xdata, key, newValue, receiver);

            return redata;
        },
        deleteProperty(xdata, key) {
            // if (!PRIREG.test(key)) {
            //     // 删除数据
            //     debugger
            //     return true;
            // }
            return Reflect.deleteProperty(xdata, key);
        }
    };

    // main 

    // init
    glo.stanz = (obj = {}) => createXData(obj);
})(window);