((glo) => {
    // public function
    // 获取随机id
    const getRandomId = () => Math.random().toString(32).substr(2);
    let objectToString = Object.prototype.toString;
    const getType = value => objectToString.call(value).toLowerCase().replace(/(\[object )|(])/g, '');
    let deepClone = obj => obj instanceof Object ? JSON.parse(JSON.stringify(obj)) : obj;

    // 异步执行的清理函数
    // 执行函数后，5000毫秒清理一次
    let clearTick;
    (() => {
        // 函数容器
        let funcs = [];
        // 异步是否开启
        let runing = 0;
        clearTick = callback => {
            funcs.push(callback);
            if (!runing) {
                setTimeout(() => {
                    runing = 0;
                    let b_funcs = funcs;
                    funcs = [];
                    b_funcs.forEach(func => func());
                }, 5000);
            }
            runing = 1;
        }
    })();

    let {
        defineProperty,
        defineProperties,
        assign
    } = Object

    // COMMON
    // 事件key
    const XDATAEVENTS = "_events_" + getRandomId();
    // 数据entrend id记录
    const XDATATRENDIDS = "_trend_" + getRandomId();
    // 获取xdata元数据的方法名
    const GETXDATA = "_getxdata_" + getRandomId();
    // 数据绑定记录
    const XDATASYNCS = "_syncs_" + getRandomId();

    // business function
    // 获取事件寄宿对象
    const getEventObj = (tar, eventName) => tar[XDATAEVENTS][eventName] || (tar[XDATAEVENTS][eventName] = []);

    // 绑定事件
    const onXDataEvent = (tar, eventName, callback) => getEventObj(tar, eventName).push(callback);

    // 注销事件
    const unXDataEvent = (tar, eventName, callback) => {
        let eveArr = getEventObj(tar, eventName);
        let id = eveArr.indexOf(callback);
        eveArr.splice(id, 1);
    };

    // 触发事件
    const emitXDataEvent = (tar, eventName, args) => {
        let eveArr = getEventObj(tar, eventName);

        // 遍历事件对象
        eveArr.forEach(callback => {
            callback.apply(tar, args);
        });
    }

    // trend清理器
    const trendClear = (tar, tid) => {
        tar[XDATATRENDIDS].push(tid);
        if (!tar._trendClear) {
            tar._trendClear = 1;
            clearTick(() => {
                tar[XDATATRENDIDS].length = 0;
                tar._trendClear = 0;
            });
        }
    }

    // 解析 trend data 到最终对象
    let detrend = (tar, trendData) => {
        let key;

        // 数组last id
        let lastId = trendData.keys.length - 1;
        trendData.keys.forEach((tKey, i) => {
            if (i < lastId) {
                tar = tar[tKey];
            }
            key = tKey;
        });

        return {
            target: tar,
            key,
            value: (lastId >= 0) ? tar[key] : undefined
        };
    }

    // 不触发emitChange运行xdata的方法
    const runXDataMethod = (xdata, callback) => {
        xdata._pausedEmit = 1;
        callback();
        delete xdata._pausedEmit;
    }

    // 触发冒泡事件
    const emitChange = (options) => {
        let {
            target,
            key,
            value,
            oldVal,
            type,
            trendData
        } = options;

        // 判断没有禁止触发
        if (target._pausedEmit) {
            return;
        }

        // 深克隆的 trendData
        let cloneTrendData = deepClone(trendData);

        if (key !== undefined) {
            // 属性数据变动
            // 添加key
            cloneTrendData.keys.unshift(key);

            // 触发事件
            // watch处理
            emitXDataEvent(target, "watch-" + key, [value, {
                oldVal,
                type,
                trend: cloneTrendData
            }]);
            emitXDataEvent(target, "watch-", [{
                key,
                val: value,
                type,
                oldVal,
                trend: cloneTrendData
            }]);
        } else {
            // 自身对象变动
            // 运行数组的方法才会跑到这里
            let watchOptions = {
                type,
                trend: cloneTrendData
            };

            switch (trendData.type) {
                case "sort":
                    assign(watchOptions, {
                        sort: cloneTrendData.sort
                    });
                    break;
                case "array-method":
                    assign(watchOptions, {
                        args: cloneTrendData.args,
                        methodName: cloneTrendData.methodName
                    });
                    break;
            }
            // 触发事件
            // watch处理
            emitXDataEvent(target, "watch-", []);
        }

        let {
            _host,
            _hostkey
        } = target;

        // 冒泡
        if (_host) {
            emitChange({
                target: _host,
                key: _hostkey,
                value: target,
                oldVal: target,
                type: "update",
                trendData: cloneTrendData
            });
        }
    }

    // 数组原型对象
    let arrayFn = Array.prototype;

    // 修改数据的函数
    const setXData = (options) => {
        // 获取参数
        let {
            xdata,
            key,
            value,
            // proxy对象
            receiver,
            // 设置数据的状态类型
            type,
            // 设置动作的唯一id
            tid,
            // 排序数据
            sort,
            // 是否已经运行过
            // isRunned,
            // 参数数组
            args,
            // 数组方法名
            methodName
        } = options;

        // 修正tid
        tid = tid || getRandomId();

        if (xdata[XDATATRENDIDS].includes(tid)) {
            return;
        }

        // 添加tid
        trendClear(xdata, tid);

        // 更新类型
        type = type || (xdata.hasOwnProperty(key) ? "update" : "new");

        // trend数据
        let trendData = {
            tid,
            type,
            keys: []
        };

        // emitChange options
        let emitOptions = {
            target: receiver,
            key,
            // value: target[key],
            // oldVal,
            type,
            trendData
        };

        // 根据类型更新
        switch (type) {
            case "new":
            case "update":
                // 获取旧的值
                let oldVal = xdata[key];

                // 有改动才会向下走哈
                if (oldVal == value) {
                    return;
                }

                // 生成新的值
                let newVal = createXData(value, receiver, key);
                if (xdata._exkeys && xdata._exkeys.includes(key)) {
                    // 只修改准入值
                    xdata[key] = newVal;
                } else {
                    Reflect.set(xdata, key, newVal, receiver);
                }
                trendData.val = value;

                // 设置当前值和旧值
                assign(emitOptions, {
                    value: xdata[key],
                    oldVal
                });
                break;
            case "delete":
                debugger
                break;
            case "sort":
                // 判断没有排序过
                // 排序处理
                (!options.isRunned) && runXDataMethod(xdata, () => {
                    // 克隆数组对象
                    let cloneArr = xdata.slice();

                    sort.forEach((e, i) => {
                        receiver[i] = cloneArr[e];
                    });
                });

                // 数组记录
                trendData.sort = sort;
                break;
            case "array-method":
                // 数组方法运行
                (!options.isRunned) && runXDataMethod(xdata, () => {
                    arrayFn[methodName].apply(receiver, args);
                });
                assign(trendData, {
                    args,
                    methodName
                });
                break;
        }

        // 触发事件
        emitChange(emitOptions);
    }

    // handler
    const XDataHandler = {
        set(xdata, key, value, receiver) {
            if (!/^_.+/.test(key)) {
                // 设置数据
                setXData({
                    xdata,
                    key,
                    value,
                    receiver
                });
                return true;
            }
            return Reflect.set(xdata, key, value, receiver);
        },
        deleteProperty(xdata, key) {
            if (!/^_.+/.test(key)) {
                // 删除数据
                setXData({
                    xdata,
                    key,
                    value: undefined,
                    receiver: xdata,
                    type: "delete"
                });
                return true;
            }
            return Reflect.deleteProperty(xdata, key);
        }
    };

    // class
    function XData(obj, host, key) {
        defineProperties(this, {
            // 唯一id
            _id: {
                value: obj._id || getRandomId()
            },
            // 事件寄宿对象
            [XDATAEVENTS]: {
                value: {}
            },
            // entrend id 记录
            [XDATATRENDIDS]: {
                value: []
            },
            // 数据绑定记录
            [XDATASYNCS]: {
                value: []
            },
            // 是否开启trend清洁
            _trendClear: {
                writable: true,
                value: 0
            },
            // 获取xdata源对象
            [GETXDATA]: {
                get: () => this
            }
        });

        // 判断是否有host
        if (host) {
            defineProperties(this, {
                // 父层对象
                _host: {
                    writable: true,
                    value: host
                },
                _hostkey: {
                    writable: true,
                    value: key
                }
            });
        }

        // 获取关键key数组
        let keys = Object.keys(obj);
        if (getType(obj) === "array") {
            keys.push('length');
        }

        let proxyThis = new Proxy(this, XDataHandler);

        keys.forEach(k => {
            // 获取值，getter,setter
            let {
                get,
                set,
                value
            } = Object.getOwnPropertyDescriptor(obj, k);

            if (get || set) {
                defineProperty(this, k, {
                    get,
                    set
                });
            } else {
                // 设置属性
                this[k] = createXData(value, proxyThis, k);
            }
        });

        return proxyThis;
    }

    // xdata的原型
    let XDataFn = Object.create(arrayFn);
    defineProperties(XDataFn, {
        // 直接获取字符串
        "string": {
            get() {
                return JSON.stringify(this);
            }
        },
        // 直接获取对象类型
        "object": {
            get() {
                return deepClone(this);
            }
        },
        "root": {
            get() {
                let tempHost = this._host,
                    root;
                while (tempHost) {
                    root = tempHost;
                    tempHost = tempHost._host;
                }
                return root;
            }
        },
        // 从根目录上的属性专递key
        "keylist": {
            get() {
                let tar = this;
                let reArr = [];
                while (tar._host) {
                    reArr.unshift(tar._hostkey);
                    tar = tar._host;
                }
                return reArr;
            }
        }
    });

    // 原型链上的方法
    let XDataProto = {
        // trend入口修改内部数据的方法
        entrend(trendData) {
            // 解析出最终要修改的对象
            let {
                target,
                key,
                value
            } = detrend(this, trendData);

            switch (trendData.type) {
                case "new":
                case "update":
                    // 普通的更新数据
                    setXData({
                        xdata: target[GETXDATA],
                        key,
                        value: trendData.val,
                        receiver: target,
                        type: trendData.type,
                        tid: trendData.tid
                    });
                    break;
                case "sort":
                    // value才是真正的target
                    // 进行顺序设置
                    setXData({
                        xdata: value[GETXDATA],
                        receiver: value,
                        type: "sort",
                        // 顺序数据
                        sort: trendData.sort,
                        tid: trendData.tid
                    });
                    break;
                case "array-method":
                    // value才是真正的target
                    // 数组方法型的更新
                    setXData({
                        xdata: value[GETXDATA],
                        receiver: value,
                        type: "array-method",
                        // 数组方法
                        methodName: trendData.methodName,
                        args: trendData.args,
                        tid: trendData.tid
                    });
            }

        },
        // 解析trend数据
        detrend(trendData) {
            return detrend(this, trendData);
        },
        // 监听变化
        watch(key, callback) {
            let arg1Type = getType(key);
            if (arg1Type === "object") {
                for (let k in key) {
                    this.watch(k, key[k]);
                }
                return this;
            } else if (arg1Type.search('function') > -1) {
                callback = key;
                key = "";
            }
            onXDataEvent(this, 'watch-' + key, callback);
            return this;
        },
        // 取消监听
        unwatch(key, callback) {
            let arg1Type = getType(key);
            if (arg1Type === "object") {
                for (let k in key) {
                    this.unwatch(k, key[k]);
                }
                return this;
            } else if (arg1Type.search('function') > -1) {
                callback = key;
                key = "";
            }
            unXDataEvent(this, 'watch-' + key, callback);
            return this;
        },
        // 同步数据
        sync(target, options) {
            let func1, func2;
            switch (getType(options)) {
                case "object":
                    let reverseOptions = {};
                    for (let k in options) {
                        reverseOptions[options[k]] = k;
                    }
                    // 不需要保留trend的参数，所以直接深复制
                    func1 = e => {
                        let trendData = deepClone(e.trend);
                        let replaceKey = reverseOptions[e.key];
                        if (replaceKey !== undefined) {
                            trendData.keys[0] = replaceKey;
                            this.entrend(trendData);
                        }
                    }
                    func2 = e => {
                        let trendData = deepClone(e.trend);
                        let replaceKey = options[e.key];
                        if (replaceKey !== undefined) {
                            trendData.keys[0] = replaceKey;
                            target.entrend(trendData);
                        }
                    }
                    break;
                case "array":
                    func1 = e => {
                        if (options.includes(e.key)) {
                            this.entrend(deepClone(e.trend));
                        }
                    }
                    func2 = e => {
                        if (options.includes(e.key)) {
                            target.entrend(deepClone(e.trend));
                        }
                    }
                    break;
                case "string":
                    func1 = e => {
                        if (e.key === options) {
                            this.entrend(deepClone(e.trend));
                        }
                    }
                    func2 = e => {
                        if (e.key === options) {
                            target.entrend(deepClone(e.trend));
                        }
                    }
                    break;
                default:
                    // undefined
                    func1 = e => this.entrend(deepClone(e.trend));
                    func2 = e => target.entrend(deepClone(e.trend));
            }

            // 绑定函数
            target.watch(func1);
            this.watch(func2);

            let bid = getRandomId();

            // 留下案底
            target[XDATASYNCS].push({
                bid,
                options,
                opp: this,
                func: func1
            });
            this[XDATASYNCS].push({
                bid,
                options,
                opp: target,
                func: func2
            });
            return this;
        },
        // 取消数据同步
        unsync(target, options) {
            // 内存对象和行为id
            let syncObjId = this[XDATASYNCS].findIndex(e => e.opp === target && e.options === options);

            if (syncObjId > -1) {
                let syncObj = this[XDATASYNCS][syncObjId];

                // 查找target相应绑定的数据
                let tarSyncObjId = target[XDATASYNCS].findIndex(e => e.bid === syncObj.bid);
                let tarSyncObj = target[XDATASYNCS][tarSyncObjId];

                // 取消绑定函数
                this.unwatch(syncObj.func);
                target.unwatch(tarSyncObj.func);

                // 各自从数组删除
                this[XDATASYNCS].splice(syncObjId, 1);
                target[XDATASYNCS].splice(tarSyncObjId, 1);
            } else {
                console.log('not found =>', target);
            }
            return this;
        },
        // 克隆对象，为了更好理解，还是做成方法获取
        clone() {
            return createXData(this.object);
        },
        // 排序方法
        // 需要特别处理，因为参数可能是函数
        // 函数会有变数，不能带函数作为参数，故直接传送排序后的顺序
        sort(...args) {
            // 记录id顺序
            let ids = this.map(e => e._id);
            let xdata = this[GETXDATA];

            // 执行默认方法
            let reValue;
            runXDataMethod(xdata, () => {
                reValue = arrayFn.sort.apply(this, args);
            });


            // 记录新顺序
            let new_ids = this.map(e => e._id);

            // 记录顺序置换
            let sort = [];
            ids.forEach((e, index) => {
                let newIndex = new_ids.indexOf(e);
                sort[index] = newIndex;
            });

            // 进行顺序设置
            setXData({
                xdata: xdata,
                receiver: this,
                type: "sort",
                // 顺序数据
                sort,
                // 已经排序过
                isRunned: 1
            });

            return reValue;
        }
    };

    // 设置 XDataFn
    Object.keys(XDataProto).forEach(k => {
        defineProperty(XDataFn, k, {
            value: XDataProto[k]
        });
    });

    ['splice', 'shift', 'unshfit', 'push', 'pop', 'fill', 'reverse', 'copyWithin'].forEach(methodName => {
        // 重构数组方法
        XDataFn[methodName] && defineProperty(XDataFn, methodName, {
            value(...args) {
                // 数组方法
                setXData({
                    xdata: this[GETXDATA],
                    receiver: this,
                    type: "array-method",
                    methodName,
                    args
                });

                return 100;
            }
        });
    });

    // 原型链衔接
    XData.prototype = XDataFn;

    // main 
    const createXData = (obj, host, key) => {
        if (obj instanceof XData) {
            obj._host = host;
            obj._hostkey = key;
            return obj;
        }
        switch (getType(obj)) {
            case "array":
            case "object":
                return new XData(obj, host, key);
        }
        return obj;
    }

    // init
    glo.stanz = (obj, opts) => createXData(obj);
    stanz.detrend = detrend;

})(window);