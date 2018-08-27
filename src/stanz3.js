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
            callback(...args);
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
    const detrend = (tar, trendData) => {
        let key;

        // 数组last id
        let lastId = trendData.keys.length - 1;
        trendData.keys.forEach((tKey, i) => {
            if (i < lastId) {
                tar = tar[tKey];
            }
            key = tKey;
        });

        return [tar, key];
    }

    // 触发冒泡事件
    const emitChange = (options) => {
        let {
            target,
            key,
            oldVal,
            type,
            trendData
        } = options;

        // 深克隆的 trendData
        let cloneTrendData = deepClone(trendData);

        // 添加key
        cloneTrendData.keys.unshift(key);

        // 触发事件
        // watch处理
        emitXDataEvent(target, "watch-" + key, [target[key], {
            oldVal,
            type,
            trend: cloneTrendData
        }]);
        emitXDataEvent(target, "watch-", [{
            key,
            val: target[key],
            type,
            oldVal,
            trend: cloneTrendData
        }]);

        let {
            host,
            hostkey
        } = target;

        // 冒泡
        if (host) {
            emitChange({
                target: host,
                key: hostkey,
                value: target,
                oldVal: target,
                type: "update",
                trendData: cloneTrendData
            });
        }
    }

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
            tid
        } = options;

        // 修正tid
        tid = tid || getRandomId();

        if (xdata[XDATATRENDIDS].includes(tid)) {
            return;
        }

        // 添加tid
        trendClear(xdata, tid);

        // 获取旧的值
        let oldVal = xdata[key];

        // 有改动才会向下走哈
        if (oldVal == value) {
            return;
        }

        // 更新类型
        type = type || (xdata.hasOwnProperty(key) ? "update" : "new");

        // 生成新的值
        let newVal = createXData(value, receiver, key);
        let trendData = {
            tid,
            type,
            keys: []
        };

        // 根据类型更新
        switch (type) {
            case "new":
            case "update":
                debugger
                if (xdata._exkeys && xdata._exkeys.includes(key)) {
                    // 只修改准入值
                    xdata[key] = newVal;
                } else {
                    Reflect.set(xdata, key, newVal, receiver);
                }
                trendData.val = value;
                break;
            case "delete":
                debugger
                break;
            case "array-method":
                debugger
                break;
        }

        emitChange({
            target: xdata,
            key,
            value,
            oldVal,
            type,
            trendData
        });

        debugger
    }

    // handler
    const XDataHandler = {
        set(xdata, key, value, receiver) {
            if (!/^_.+/.test(key) || xdata._jumpset) {
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
                value: obj[XDATAEVENTS] || {}
            },
            // entrend id 记录
            [XDATATRENDIDS]: {
                value: obj[XDATATRENDIDS] || []
            },
            // 是否开启trend清洁
            _trendClear: {
                writable: true,
                value: 0
            }
        });

        // 设置id
        if (!obj._id) {
            defineProperty(obj, "_id", {
                value: this._id
            });
        }

        // 判断是否有host
        if (host) {
            defineProperties(this, {
                // 父层对象
                "host": {
                    writable: true,
                    value: host
                },
                "hostkey": {
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

        let _this = new Proxy(this, XDataHandler);

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
                this[k] = createXData(value, _this, k);
            }
        });

        return _this;
    }

    // xdata的原型
    let XDataFn = Object.create(Array.prototype);
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
                let tempHost = this.host,
                    root;
                while (tempHost) {
                    root = tempHost;
                    tempHost = tempHost.host;
                }
                return root;
            }
        },
        // 从根目录上的属性专递key
        "keylist": {
            get() {
                let tar = this;
                let reArr = [];
                while (tar.host) {
                    reArr.unshift(tar.hostkey);
                    tar = tar.host;
                }
                return reArr;
            }
        }
    });

    // 原型链上的方法
    let XDataProto = {
        // 入口修改内部数据的方法
        entrend(trendData) {
            // 解析出最终要修改的对象
            let [tar, key] = detrend(this, trendData);

            setXData({
                xdata: tar,
                key,
                value: trendData.val,
                receiver: tar,
                type: trendData.type,
                tid: trendData.tid
            });

            debugger
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
        // 克隆对象，为了更好理解，还是做成方法获取
        clone() {
            return createXData(this.object);
        },
    };

    // 设置 XDataFn
    Object.keys(XDataProto).forEach(k => {
        defineProperty(XDataFn, k, {
            value: XDataProto[k]
        });
    });

    // 原型链衔接
    XData.prototype = XDataFn;

    // main 
    const createXData = (obj, host, key) => {
        if (obj instanceof XData) {
            obj.host = host;
            obj.hostkey = key;
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

})(window);