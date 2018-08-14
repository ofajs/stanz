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

    // function
    let isXData = (obj) => obj instanceof XData;
    let deepClone = obj => obj && JSON.parse(JSON.stringify(obj));

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

        },
        // 同步数据
        sync() {},
        // 取消数据同步
        unsync() {},
        // 超找数据
        seek() {},
        // 异步监听数据变动
        listen() {},
        // 取消监听数据变动
        unlisten() {}
    };

    // 设置 XDataFn
    Object.keys(XDataProto).forEach(k => {
        defineProperty(XDataFn, k, {
            value: XDataProto[k]
        });
    });

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
            trend.keys.unshift(key);
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
            if (!/^_.+/.test(key)) {
                let oldVal = target[key];
                let type = target.hasOwnProperty(key) ? "update" : "new";

                // 执行默认操作
                // 赋值
                Reflect.set(target, key, value, receiver);

                // 触发改动
                emitChange(target, key, value, oldVal, type);

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