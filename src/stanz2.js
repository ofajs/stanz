((glo) => {
    "use strict";
    // public function
    // 获取随机id
    const getRandomId = () => Math.random().toString(32).substr(2);
    let objectToString = Object.prototype.toString;
    const getType = value => objectToString.call(value).toLowerCase().replace(/(\[object )|(])/g, '');

    let {
        defineProperty,
        defineProperties,
        assign
    } = Object

    // COMMON
    // 事件key
    const XDATAEVENTS = "_events_" + getRandomId();
    // 数据绑定记录
    const XDATASYNCS = "_syncs_" + getRandomId();
    // 数据entrend id记录
    const XDATATRENDIDS = "_trend_" + getRandomId();

    // function
    let isXData = (obj) => obj instanceof XData;
    let deepClone = obj => obj && JSON.parse(JSON.stringify(obj));
    // 异步执行函数
    let nextTick;
    (() => {
        // 函数容器
        let funcs = [];
        // 异步是否开启
        let runing = 0;
        nextTick = callback => {
            funcs.push(callback);
            if (!runing) {
                setTimeout(() => {
                    runing = 0;
                    funcs.forEach(func => func());
                }, 0);
            }
            runing = 1;
        }
    })();
    // business function
    // 获取事件寄宿对象
    const getEventObj = (tar, eventName) => tar[XDATAEVENTS][eventName] || (tar[XDATAEVENTS][eventName] = []);

    // 触发事件
    const emitXDataEvent = (tar, eventName, args) => {
        let eveArr = getEventObj(tar, eventName);

        // 遍历事件对象
        eveArr.forEach(callback => {
            callback(...args);
        });
    }

    // 绑定事件
    const onXDataEvent = (tar, eventName, callback) => getEventObj(tar, eventName).push(callback);

    // 注销事件
    const unXDataEvent = (tar, eventName, callback) => {
        let eveArr = getEventObj(tar, eventName);
        let id = eveArr.indexOf(callback);
        eveArr.splice(id, 1);
    };

    // class
    function XData(obj, host, hostkey) {
        defineProperties(this, {
            "_id": {
                value: obj._id || getRandomId()
            },
            // 事件寄宿对象
            [XDATAEVENTS]: {
                value: {}
            },
            // 数据绑定记录
            [XDATASYNCS]: {
                value: []
            },
            // entrend id 记录
            [XDATATRENDIDS]: {
                value: []
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
                // 根对象
                "root": {
                    value: host.root || host
                },
                // 父层对象
                "host": {
                    value: host
                },
                "hostkey": {
                    value: hostkey
                }
            });
        }

        Object.keys(obj).forEach(k => {
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
                this[k] = createXData(value, this, k);
            }
        });
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
        }
    });

    // 原型链衔接
    XData.prototype = XDataFn;

    // 原型链上的方法
    let XDataProto = {
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
        // 重置数据
        reset(value) {
            let valueKeys = Object.keys(value);

            // 删除本身不存在的key
            Object.keys(this).forEach(k => {
                if (valueKeys.indexOf(k) === -1) {
                    delete this[k];
                }
            });

            assign(this, value);
            return this;
        },
        // 传送器入口
        entrend(trendData) {
            let tar = this;
            let lastId = trendData.keys.length - 1;
            let key;
            trendData.keys.forEach((tKey, i) => {
                if (i < lastId) {
                    tar = tar[tKey];
                    key = tKey;
                }
                // else if (i === lastId) {
                //     tar[tKey] = trendData.val;
                // }
            });

            // 临时数组
            let tempArr = tar.slice();

            switch (trendData.type) {
                case "sort":
                    // 设定禁止事件驱动
                    this._inMethod = "sort";

                    // 修正顺序
                    trendData.order.forEach((e, i) => {
                        tar[e] = tempArr[i];
                    });

                    // 开启事件驱动
                    delete this._inMethod;
                    break;
                default:
                    // 最终设置
                    tar[key] = trendData.val;
            }
        },
        // 同步数据
        sync(target, options) {
            let func1, func2;
            switch (getType(options)) {
                case "object":
                    break;
                case "array":
                    break;
                case "string":
                    break;
                default:
                    // undefined
                    func1 = e => this.entrend(e.trend);
                    func2 = e => target.entrend(e.trend);
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
        },
        // 超找数据
        seek() {},
        // 异步监听数据变动
        listen() {},
        // 取消监听数据变动
        unlisten() {},
        // 克隆对象，为了更好理解，还是做成方法获取
        clone() {
            return createXData(this.object);
        },
        // 更新后的数组方法
        sort(...args) {
            // 设定禁止事件驱动
            this._inMethod = "sort";

            // 记录id顺序
            let ids = this.map(e => e._id);

            // 执行默认方法
            let reValue = Array.prototype.sort.apply(this, args);

            // 开启事件驱动
            delete this._inMethod;

            // 记录新顺序
            let new_ids = this.map(e => e._id);

            // 记录顺序置换
            let order = [];
            ids.forEach((e, index) => {
                let newIndex = new_ids.indexOf(e);
                order[index] = newIndex;
            });

            // 手动触发事件
            emitChange(this, undefined, this, this, "sort", {
                keys: [],
                type: "sort",
                order
            });

            return reValue
        }
    };

    // 设置 XDataFn
    Object.keys(XDataProto).forEach(k => {
        defineProperty(XDataFn, k, {
            value: XDataProto[k]
        });
    });

    // 更新数组方法
    // ['sort', 'splice'].forEach(k => {
    //     let oldFunc = Array.prototype[k];
    //     defineProperty(XDataFn, k, {
    //         value(...args) {
    //             // 设定禁止触发
    //             this._inMethod = 1;
    //             let reValue = oldFunc.apply(this, args);
    //             delete this._inMethod;
    //             return reValue
    //         }
    //     });
    // });

    // 触发器
    const emitChange = (tar, key, val, oldVal, type, trend) => {
        // watch option
        let watchOption = {
            oldVal,
            type
        };

        // 自身watch option
        let selfOption = {
            key,
            val,
            type,
            oldVal
        };

        if (trend) {
            (key !== undefined) && trend.keys.unshift(key);
        } else {
            let keys = [key];
            trend = {
                keys,
                type
            };
            defineProperties(trend, {
                val: {
                    value: val,
                    enumerable: true
                },
                oldVal: {
                    value: oldVal,
                    enumerable: true
                }
            });
        }

        watchOption.trend = trend;
        selfOption.trend = trend;

        // watch处理
        emitXDataEvent(tar, "watch-" + key, [val, watchOption]);
        emitXDataEvent(tar, "watch-", [selfOption]);

        // 冒泡
        let {
            host,
            hostkey
        } = tar;

        if (host) {
            emitChange(host, hostkey, tar, tar, "update", deepClone(trend));
        }
    }

    // Handler
    const XDataHandler = {
        set(target, key, value, receiver) {
            // 判断不是下划线开头的属性，才触发改动事件
            if (!/^_.+/.test(key) && !target._inMethod) {
                let oldVal = target[key];
                let type = target.hasOwnProperty(key) ? "update" : "new";

                let reValue = createXData(value, receiver, key);

                // 执行默认操作
                // 赋值
                Reflect.set(target, key, reValue, receiver);

                // 触发改动
                (value !== oldVal) && emitChange(target, key, value, oldVal, type);

                return true;
            }
            return Reflect.set(target, key, value, receiver);
        },
        deleteProperty(target, key) {
            return Reflect.deleteProperty(target, key);
        }
    };


    // main
    const createXData = (obj, host, hostkey) => {
        if (obj instanceof Object) {
            let xdata = new XData(obj, host, hostkey);
            return new Proxy(xdata, XDataHandler);
        }
        return obj;
    }

    // init
    glo.stanz = (obj, opts) => {
        let reObj = createXData(obj);
        return reObj;
    }

})(window);