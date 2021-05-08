/*!
 * stanz v6.2.0
 * https://github.com/kirakiray/stanz
 * 
 * (c) 2018-2021 YAO
 * Released under the MIT License.
 */
((root, factory) => {
    "use strict"
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.stanz = factory();
    }
})(this, () => {
    "use strict";

    //<o:start--xdata.js-->
    const getRandomId = () => Math.random().toString(32).substr(2);
    let objectToString = Object.prototype.toString;
    const getType = value => objectToString.call(value).toLowerCase().replace(/(\[object )|(])/g, '');
    const isUndefined = val => val === undefined;
    const isFunction = val => getType(val).includes("function");
    const cloneObject = obj => obj instanceof XData ? obj.object : JSON.parse(JSON.stringify(obj));

    const nextTick = (() => {
        let isDebug = document.currentScript.getAttribute("debug") !== null;
        if (isDebug) {
            let nMap = new Map();
            return (fun, key) => {
                if (!key) {
                    key = getRandomId();
                }

                let timer = nMap.get(key);
                clearTimeout(timer);
                nMap.set(key, setTimeout(() => {
                    fun();
                    nMap.delete(key);
                }));
            };
        }

        // 定位对象寄存器
        let nextTickMap = new Map();

        let pnext = (func) => Promise.resolve().then(() => func())

        if (typeof process === "object" && process.nextTick) {
            pnext = process.nextTick;
        }

        let inTick = false;
        return (fun, key) => {
            if (!key) {
                key = getRandomId();
            }

            nextTickMap.set(key, {
                key,
                fun
            });

            if (inTick) {
                return;
            }

            inTick = true;

            pnext(() => {
                if (nextTickMap.size) {
                    nextTickMap.forEach(({
                        key,
                        fun
                    }) => {
                        try {
                            fun();
                        } catch (e) {
                            console.error(e);
                        }
                        nextTickMap.delete(key);
                    });
                }

                nextTickMap.clear();
                inTick = false;
            });
        };
    })();

    // 触发update事件
    const emitUpdate = (target, name, args, assingData, beforeCall) => {
        let mid;

        if (target._modifyId) {
            mid = target._modifyId;
        } else {
            mid = getRandomId();
        }

        getXDataProp(target, MODIFYIDS).push(mid);
        recyclModifys(target);

        // 事件冒泡
        let event = new XEvent({
            type: "update",
            target: target[PROXYTHIS] || target
        });

        Object.defineProperties(event, {
            trend: {
                get() {
                    return new XDataTrend(event);
                }
            }
        });

        assingData && Object.assign(event, assingData);

        // 设置modify数据
        event.modify = {
            name,
            args: args.map(e => {
                if (e instanceof XData) {
                    return e.object;
                } else if (e instanceof Object) {
                    return cloneObject(e);
                }
                return e;
            }),
            mid
        };

        beforeCall && (beforeCall(event));

        // 冒泡update
        target.emit(event);
    }

    // 清理modifys
    let recyTimer, recyArr = new Set();
    const recyclModifys = (xobj) => {
        // 不满50个别瞎折腾
        if (xobj[MODIFYIDS].length < 50) {
            return;
        }

        clearTimeout(recyTimer);
        recyArr.add(xobj);
        recyTimer = setTimeout(() => {
            let copyRecyArr = Array.from(recyArr);
            setTimeout(() => {
                copyRecyArr.forEach(e => recyclModifys(e));
            }, 1000);
            recyArr.forEach(e => {
                let modifys = e[MODIFYIDS]
                // 清除掉一半
                modifys.splice(0, Math.ceil(modifys.length / 2));
            });
            recyArr.clear();
        }, 3000)
    }

    const clearXMirror = (xobj) => {
        xobj.index = undefined;
        xobj.parent = undefined;
        xobj[XMIRROR_SELF].mirrorHost.off("update", xobj[XMIRRIR_BIND_UPDATA]);
        xobj[XMIRROR_SELF].mirrorHost = undefined;
    }

    // 清理XData数据
    const clearXData = (xobj) => {
        if (xobj instanceof XMirror) {
            clearXMirror(xobj);
            return;
        }
        if (!(xobj instanceof XData)) {
            return;
        }
        let _this = xobj[XDATASELF];
        if (_this) {
            try {
                // 防止index和parent被重定向导致失败
                _this.index = undefined;
                _this.parent = undefined;
            } catch (e) {}
        }

        // 解除virData绑定
        if (xobj instanceof VirData) {
            let {
                mappingXData
            } = xobj;
            let tarHostData = mappingXData[VIRDATAHOST].find(e => e.data === _this);
            let {
                leftUpdate,
                rightUpdate
            } = tarHostData;
            xobj.off("update", rightUpdate);
            mappingXData.off("update", leftUpdate);
            _this.mappingXData = null;
        }

        // 清除sync
        if (_this[SYNCSHOST]) {
            for (let [oppXdata, e] of _this[SYNCSHOST]) {
                xobj.unsync(oppXdata);
            }
        }

        if (_this[VIRDATAHOST]) {
            _this[VIRDATAHOST].forEach(e => {
                let {
                    data,
                    leftUpdate,
                    rightUpdate
                } = e;
                data.off("update", rightUpdate);
                _this.off("update", leftUpdate);
                data.mappingXData = null;
            });
            _this[VIRDATAHOST].splice(0);
        }

        // 触发清除事件
        _this.emit("clearxdata");

        _this[WATCHHOST] && _this[WATCHHOST].clear();
        _this[EVENTS] && _this[EVENTS].clear();
        // _this[WATCHEXPRHOST] && _this[WATCHEXPRHOST].clear();

        // 子数据也全部回收
        // Object.keys(_this).forEach(key => {
        //     let val = _this[key];
        //     if (/\D/.test(key) && val instanceof XData) {
        //         clearXData(val);
        //     }
        // });
        // _this.forEach(e => clearXData(e));
    }

    /**
     * 生成XData数据
     * @param {Object} obj 对象值，是Object就转换数据
     * @param {Object} options 附加信息，记录相对父层的数据
     */
    const createXData = (obj, options) => {
        if (obj instanceof XMirror) {
            return obj;
        }
        let redata = obj;
        switch (getType(obj)) {
            case "object":
            case "array":
                redata = new XData(obj, options);
                break;
        }

        return redata;
    };

    /**
     * 将 stanz 转换的对象再转化为 children 结构的对象
     * @param {Object} obj 目标对象
     * @param {String} childKey 数组寄存属性
     */
    const toNoStanz = (obj, childKey) => {
        if (obj instanceof Array) {
            return obj.map(e => toNoStanz(e, childKey));
        } else if (obj instanceof Object) {
            let newObj = {};
            let childs = [];
            Object.keys(obj).forEach(k => {
                if (!/\D/.test(k)) {
                    childs.push(toNoStanz(obj[k], childKey));
                } else {
                    newObj[k] = toNoStanz(obj[k]);
                }
            });
            if (childs.length) {
                newObj[childKey] = childs;
            }
            return newObj;
        } else {
            return obj;
        }
    }

    // common
    const EVENTS = Symbol("events");

    // 获取事件队列
    const getEventsArr = (eventName, tar) => {
        let eventHost = tar[EVENTS];

        if (!eventHost) {
            eventHost = new Map();
            Object.defineProperty(tar, EVENTS, {
                value: eventHost
            });
        }

        let tarEves = eventHost.get(eventName);
        if (!tarEves) {
            tarEves = [];
            eventHost.set(eventName, tarEves);
        }
        return tarEves;
    };

    /**
     * 转换为事件对象
     * @param {String|XEvent} eventName 事件对象或事件名
     * @param {Object} _this 目标元素
     */
    const transToEvent = (eventName, _this) => {
        let event;
        // 不是实例对象的话，重新生成
        if (!(eventName instanceof XEvent)) {
            event = new XEvent({
                type: eventName,
                target: _this[PROXYTHIS] || _this
            });
        } else {
            event = eventName;
            eventName = event.type;
        }
        return event;
    }

    /**
     * 事件触发器升级版，可设置父节点，会模拟冒泡操作
     * @class XEmiter
     * @constructor
     * @param {Object} options 
     */
    class XEmiter {
        constructor(options = {}) {
            Object.defineProperties(this, {
                // 记录事件用的Map对象
                // [EVENTS]: {
                //     value: new Map()
                // },
                // 父对象
                parent: {
                    writable: true,
                    value: options.parent,
                    configurable: true
                },
                index: {
                    writable: true,
                    value: options.index,
                    configurable: true
                }
            });
        }

        /**
         * 注册事件
         * @param {String} type 注册的事件名
         * @param {Function} callback 注册事件的回调函数
         * @param {Object} data 注册事件的自定义数据
         */
        on(type, callback, data) {
            this.addListener({
                type,
                data,
                callback
            });
        }

        /**
         * 注册一次性事件
         * @param {String} type 注册的事件名
         * @param {Function} callback 注册事件的回调函数
         * @param {Object} data 注册事件的自定义数据
         */
        one(type, callback, data) {
            this.addListener({
                count: 1,
                type,
                data,
                callback
            });
        }

        /**
         * 外部注册事件统一到内部的注册方法
         * @param {Object} opts 注册事件对象参数
         */
        addListener(opts = {}) {
            let {
                type,
                data,
                callback,
                // 事件可触发次数
                count = Infinity,
                eventId
            } = opts;

            if (!type) {
                throw {
                    desc: "addListener no type",
                    options: opts
                };
            }

            // 分解id参数
            let spIdArr = type.split('#');
            if (1 in spIdArr) {
                type = spIdArr[0];
                eventId = spIdArr[1];
            }

            let evesArr = getEventsArr(type, this);

            if (!isUndefined(eventId)) {
                // 判断是否存在过这个id的事件注册过
                // 注册过这个id的把旧的删除
                Array.from(evesArr).some((opt) => {
                    // 想等值得删除
                    if (opt.eventId === eventId) {
                        let id = evesArr.indexOf(opt);
                        if (id > -1) {
                            evesArr.splice(id, 1);
                        }
                        return true;
                    }
                });
            }

            callback && evesArr.push({
                type,
                data,
                callback,
                eventId,
                count
            });
        }

        /**
         * 注销事件
         * @param {String} eventName 需要注销的事件名
         * @param {Function} callback 注销的事件函数
         */
        off(eventName, callback) {
            if (!eventName) {
                return;
            }
            if (callback) {
                let evesArr = getEventsArr(eventName, this);
                let tarId = evesArr.findIndex(e => e.callback == callback);
                (tarId > -1) && evesArr.splice(tarId, 1);
            } else {
                // this[EVENTS] && this[EVENTS].delete(eventName);
                // 防止误操作，必须填入event
                throw {
                    desc: `off must have callback`
                };
            }
        }

        /**
         * 触发事件
         * 不会触发冒泡
         * @param {String|XEvent} eventName 触发的事件名
         * @param {Object} emitData 触发事件的自定义数据
         */
        emitHandler(eventName, emitData) {
            let event = transToEvent(eventName, this);
            eventName = event.type;

            let evesArr = getEventsArr(eventName, this);

            // 需要去除的事件对象
            let needRmove = [];

            // 修正currentTarget
            event.currentTarget = this[PROXYTHIS] || this;

            // 触发callback函数
            evesArr.some(e => {
                e.data && (event.data = e.data);
                e.eventId && (event.eventId = e.eventId);

                // 中转确认对象
                let middleObj = {
                    self: this,
                    event,
                    emitData
                };

                let isRun = e.before ? e.before(middleObj) : 1;

                isRun && e.callback.call(this[PROXYTHIS] || this, event, emitData);

                e.after && e.after(middleObj);

                delete event.data;
                delete event.eventId;

                e.count--;

                if (!e.count) {
                    needRmove.push(e);
                }

                if (event.cancel) {
                    return true;
                }
            });

            delete event.currentTarget;

            // 去除count为0的事件记录对象
            needRmove.forEach(e => {
                let id = evesArr.indexOf(e);
                (id > -1) && evesArr.splice(id, 1);
            });

            return event;
        }

        /**
         * 触发事件
         * 带有冒泡状态
         * @param {String|XEvent} eventName 触发的事件名
         * @param {Object} emitData 触发事件的自定义数据
         */
        emit(eventName, emitData) {
            let event = this.emitHandler(eventName, emitData);

            // 判断父层并冒泡
            if (event.bubble && !event.cancel) {
                let {
                    parent
                } = this;

                if (parent) {
                    event.keys.unshift(this.index);
                    parent.emit(event, emitData);
                }
            }
        }
    }

    /**
     * 事件记录对象
     * @class XEvent
     * @constructor
     * @param {String} type 事件名称
     */
    class XEvent extends XEmiter {
        constructor(opt) {
            super();
            this.type = opt.type;
            this.target = opt.target;
            this._bubble = true;
            this._cancel = false;
            this.keys = [];
        }

        get bubble() {
            return this._bubble;
        }
        set bubble(val) {
            if (this._bubble === val) {
                return;
            }
            this.emitHandler(`set-bubble`, val);
            this._bubble = val;
        }
        get cancel() {
            return this._cancel;
        }
        set cancel(val) {
            if (this._cancel === val) {
                return;
            }
            this.emitHandler(`set-cancel`, val);
            this._cancel = val;
        }
    }

    // get 可直接获取的正则
    // const GET_REG = /^_.+|^parent$|^index$|^length$|^object$/;
    const GET_REG = /^_.+|^index$|^length$|^object$|^getData$|^setData$/;
    // set 不能设置的Key的正则
    const SET_NO_REG = /^parent$|^index$|^length$|^object$/

    let XDataHandler = {
        get(target, key, receiver) {
            // 私有变量直接通过
            if (typeof key === "symbol" || GET_REG.test(key)) {
                return Reflect.get(target, key, receiver);
            }

            return target.getData(key);
        },
        set(target, key, value, receiver) {
            // 私有变量直接通过
            // 数组函数运行中直接通过
            if (typeof key === "symbol") {
                return Reflect.set(target, key, value, receiver);
            }

            return target.setData(key, value)
        }
    };

    const PROXYTHIS = Symbol("proxyThis");

    // 未Proxy时的自身
    const XDATASELF = Symbol("XDataSelf");

    // watch寄存数据
    const WATCHHOST = Symbol("WatchHost");

    // modifyId寄存
    const MODIFYIDS = Symbol("ModifyIDS");

    // sync寄存
    const SYNCSHOST = Symbol("SyncHost");

    // virData寄存器
    const VIRDATAHOST = Symbol("VirDataHost");

    // watchExpr寄存器
    // const WATCHEXPRHOST = Symbol("watchExprHost");

    const STANZID = Symbol("StanzID");


    /**
     * 获取对象内置数据
     * 这个操作是为了节省内存用的
     * @param {XData} target 目标元素
     * @param {Symbol} key 需要获取的元素key
     */
    const getXDataProp = (target, key) => {
        let value = target[key];

        if (!value) {
            switch (key) {
                case WATCHHOST:
                case SYNCSHOST:
                    value = new Map();
                    break;
                case MODIFYIDS:
                case VIRDATAHOST:
                    value = [];
                    break;
            }
            Object.defineProperty(target, key, {
                value
            });
        }

        return value;
    }

    const hasElement = typeof Element !== "undefined";

    /**
     * 事件触发器升级版，可设置父节点，会模拟冒泡操作
     * @class
     * @constructor
     * @param {Object} obj 合并到实例上的数据对象
     * @param {Object} opts 合并选项
     * @returns {ArrayLike} 当前实例，会根据XData上的
     */
    class XData extends XEmiter {
        constructor(obj, opts = {}) {
            super(opts);

            let proxyThis = new Proxy(this, XDataHandler);

            // 重新计算当前数据的数组长度
            let length = 0;

            // 数据合并
            Object.keys(obj).forEach(k => {
                // 值
                let value = obj[k];

                if (/^\_/.test(k) || (hasElement && value instanceof Element)) {
                    // this[k] = obj[k];
                    Object.defineProperty(this, k, {
                        configurable: true,
                        writable: true,
                        value
                    });
                    return;
                }

                if (!/\D/.test(k)) {
                    // 数字key进行length长度计算
                    k = parseInt(k);

                    if (k >= length) {
                        length = k + 1;
                    }
                }

                if (value instanceof XMirror) {
                    this[k] = value;
                    value.parent = this;
                    value.index = k;
                } else if (value instanceof Object) {
                    this[k] = new XData(value, {
                        parent: this,
                        index: k
                    });
                } else {
                    this[k] = value;
                }
            });

            const xid = getRandomId();

            Object.defineProperties(this, {
                [XDATASELF]: {
                    get: () => this
                },
                [PROXYTHIS]: {
                    value: proxyThis
                },
                [STANZID]: {
                    value: xid
                },
                xid: {
                    get() {
                        return xid;
                    }
                },
                // [WATCHHOST]: {
                //     value: new Map()
                // },
                // [MODIFYIDS]: {
                //     value: []
                // },
                // [SYNCSHOST]: {
                //     value: new Map()
                // },
                _modifyId: {
                    value: null,
                    writable: true
                },
                // 当前实例数组长度
                length: {
                    configurable: true,
                    writable: true,
                    value: length
                }
            });
        }

        /**
         * 合并数据到实例对象
         * @param {Object} opts 设置当前数据
         */
        setData(key, value) {
            if (SET_NO_REG.test(key)) {
                console.warn(`you can't set this key in XData => `, key);
                return false;
            }

            if (/^_.+/.test(key)) {
                Object.defineProperty(this, key, {
                    configurable: true,
                    writable: true,
                    value
                })
                return true;
            }

            let _this = this[XDATASELF];

            // 是否 point key
            if (/\./.test(key)) {
                let kMap = key.split(".");
                let lastId = kMap.length - 1;
                kMap.some((k, i) => {
                    if (i == lastId) {
                        key = k;
                        return true;
                    }
                    _this = _this[k];
                });
                _this.setData(key, value);
                return true;
            }

            if (getType(key) === "string") {
                let oldVal = _this[key];

                if (value === oldVal) {
                    // 一样还瞎折腾干嘛
                    return true;
                }

                if (oldVal instanceof XData) {
                    oldVal = oldVal.object;
                }

                if (value instanceof XMirror) {
                    if (value.parent) {
                        // 去除旧的依赖
                        value.remove();
                    }
                    value.parent = _this;
                    value.index = key;
                } else if (value instanceof XData) {
                    if (value[XDATASELF]) {
                        value = value[XDATASELF];
                    }
                    if (value.parent) {
                        // 去除旧的依赖
                        value.remove();
                    }
                    value.parent = _this;
                    value.index = key;
                } else if (value instanceof Object) {
                    // 如果是Object就转换数据
                    value = createXData(value, {
                        parent: _this,
                        index: key
                    });
                }

                _this[key] = value;

                emitUpdate(_this, "setData", [key, value], {
                    oldValue: oldVal
                });

                return true;

            } else if (key instanceof Object) {
                let data = key;
                Object.keys(data).forEach(key => {
                    let value = data[key];

                    _this.setData(key, value);
                });

                return true;
            }
        }

        /**
         * 获取相应数据，相比直接获取，会代理得到数组类型相应的index的值
         * @param {String} keyName 获取当前实例相应 key 的数据
         */
        getData(keyName) {
            let target;
            if (keyName.includes && keyName.includes(".")) {
                let attrNameArr = keyName.split(".");
                target = this;
                do {
                    let key = attrNameArr.shift();
                    target = target[key];
                } while (attrNameArr.length)
            } else {
                target = this[keyName]
            }

            if (target instanceof XData) {
                target = target[PROXYTHIS];
            }

            return target;
        }

        /**
         * 删除相应Key或自身
         * @param {String|NUmber|Undefined} key 需要删除的key
         */
        remove(key) {
            if (isUndefined(key)) {
                // 删除自身
                let {
                    parent
                } = this;

                if (parent) {
                    parent.remove(this.index);
                } else {
                    clearXData(this);
                }
            } else {
                let oldVal = this[key];

                // 删除子数据
                if (/\D/.test(key)) {
                    // 非数字
                    delete this[key];

                    clearXData(oldVal);

                    emitUpdate(this, "remove", [key]);
                } else {
                    // 纯数字，术语数组内元素，通过splice删除
                    this.splice(parseInt(key), 1);
                }
            }
        }

        /**
         *  深度清除当前对象，所有子对象数据也会被深度清除
         */
        deepClear() {
            // 清除非数字键
            Object.keys(this).forEach(key => {
                if (/\D/.test(key)) {
                    let obj = this[key];

                    if (obj instanceof XData) {
                        obj.deepClear();
                    }

                    if (obj instanceof XMirror) {
                        clearXData(obj);
                    }
                }
            });

            // 数组键内深度清除对象
            this.forEach(obj => {
                if (obj instanceof XData) {
                    obj.deepClear();
                }
                if (obj instanceof XMirror) {
                    clearXData(obj);
                }
            });

            // 清除自身
            clearXData(this);
        }

        /**
         * 从 Set 参考的方法，push的去从版
         * @param {*} value 需要添加的数据
         */
        add(value) {
            !this.includes(value) && this.push(value);
        }

        /**
         * 从 Set 参考的方法
         * @param {*} value 需要删除的数据
         */
        delete(value) {
            let tarId = this.indexOf(value);

            if (tarId > -1) {
                this.splice(tarId, 1);
            }
        }

        /**
         * 是否包含当前值
         * 同数组方法includes，好歹has只有三个字母，用起来方便
         * @param {*} value 数组内的值
         */
        has(value) {
            return this.includes(value);
        }

        /**
         * 从 Set 参考的方法
         */
        clear() {
            this.splice(0, this.length);
        }

        /**
         * 向前插入数据
         * 当前数据必须是数组子元素
         * @param {Object} data 插入的数据
         */
        before(data) {
            if (/\D/.test(this.index)) {
                throw {
                    text: `It must be an array element`,
                    target: this,
                    index: this.index
                };
            }
            this.parent.splice(this.index, 0, data);
            return this;
        }

        /**
         * 向后插入数据
         * 当前数据必须是数组子元素
         * @param {Object} data 插入的数据
         */
        after(data) {
            if (/\D/.test(this.index)) {
                throw {
                    text: `It must be an array element`,
                    target: this,
                    index: this.index
                };
            }
            this.parent.splice(this.index + 1, 0, data);
            return this;
        }

        clone() {
            return createXData(cloneObject(this))[PROXYTHIS];
        }

        // 在emitHandler后做中间件
        emitHandler(eventName, emitData) {
            let event = transToEvent(eventName, this);

            // 过滤unBubble和update的数据
            if (event.type === "update") {
                let {
                    _unBubble,
                    _update,
                    _unpush
                } = this;
                let {
                    fromKey
                } = event.trend;
                if (_update === false || (_unBubble && _unBubble.includes(fromKey))) {
                    event.bubble = false;
                    // return event;
                }

                if (_unpush && _unpush.includes(fromKey)) {
                    Object.defineProperty(event, "_unpush", {
                        value: true
                    });
                }
            }

            XEmiter.prototype.emitHandler.call(this, event, emitData);

            return event;
        }

        // 转换为children属性机构的数据
        noStanz(opts = {
            childKey: "children"
        }) {
            return toNoStanz(this.object, opts.childKey);
        }

        /**
         * 转换为普通 object 对象
         * @property {Object} object
         */
        get object() {
            let obj = {};

            let isPureArray = true;

            let {
                _unBubble = []
            } = this;

            // 遍历合并数组，并判断是否有非数字
            Object.keys(this).forEach(k => {
                if (/^_/.test(k) || !/\D/.test(k) || _unBubble.includes(k)) {
                    return;
                }

                let val = this[k];

                if (val instanceof XData || val instanceof XMirror) {
                    // 禁止冒泡
                    if (val._update === false) {
                        return;
                    }

                    val = val.object;
                }

                obj[k] = val;

                isPureArray = false;
            });
            this.forEach((val, k) => {
                if (val instanceof XData || val instanceof XMirror) {
                    val = val.object;
                }
                obj[k] = val;
            });

            // 转换为数组格式
            if (isPureArray) {
                obj.length = this.length;
                obj = Array.from(obj);
            }

            return obj;
        }

        get string() {
            return JSON.stringify(this.object);
        }

        toJSON() {
            return JSON.stringify(this.object);
        }

        /**
         * 获取根节点
         * @property {XData} root
         */
        get root() {
            let root = this;
            while (root.parent) {
                root = root.parent;
            }
            return root;
        }

        /**
         * 获取前一个相邻数据
         * @property {XData} prev
         */
        get prev() {
            if (!/\D/.test(this.index) && this.index > 0) {
                return this.parent.getData(this.index - 1);
            }
        }

        /**
         * 获取后一个相邻数据
         * @property {XData} after
         */
        get next() {
            if (!/\D/.test(this.index)) {
                return this.parent.getData(this.index + 1);
            }
        }

        /**
         * 获取镜像对象；
         */
        get mirror() {
            return new XMirror(this);
        }

        /**
         * 根据keys获取目标对象
         * @param {Array} keys 深度键数组
         */
        getTarget(keys) {
            let target = this;
            if (keys.length) {
                keys.some(k => {
                    if (!target) {
                        console.warn("getTarget failure");
                        return true;
                    }
                    target = target[k];
                });
            }
            return target;
        }

        /**
         * 监听当前对象的值
         * 若只传callback，就监听当前对象的所有变化
         * 若 keyName，则监听对象的相应 key 的值
         * @param {string} expr 监听键值
         * @param {Function} callback 相应值变动后出发的callback
         * @param {Boolean} ImmeOpt 是否立刻触发callback
         */
        watch(expr, callback, ImmeOpt) {
            // 调整参数
            let arg1Type = getType(expr);
            if (arg1Type === "object") {
                Object.keys(expr).forEach(k => {
                    this.watch(k, expr[k], callback);
                });
                return;
            } else if (/function/.test(arg1Type)) {
                ImmeOpt = callback;
                callback = expr;
                expr = "";
            }

            // 根据参数调整类型
            let watchType;

            if (expr === "") {
                watchType = "watchSelf";
            } else if (expr instanceof RegExp) {
                watchType = "watchKeyReg";
            } else if (/\./.test(expr)) {
                watchType = "watchPointKey";
            } else {
                watchType = "watchKey";
            }

            // let targetHostObj = this[WATCHHOST].get(expr);
            // if (!targetHostObj) {
            //     targetHostObj = new Set();
            //     this[WATCHHOST].set(expr, targetHostObj)
            // }

            let targetHostObj = getXDataProp(this, WATCHHOST).get(expr);
            if (!targetHostObj) {
                targetHostObj = new Set();
                getXDataProp(this, WATCHHOST).set(expr, targetHostObj)
            }

            let cacheObj = {
                trends: [],
                callback,
                expr,
                push(t) {
                    this.trends.push(t);
                }
            };

            targetHostObj.add(cacheObj);

            let updateMethod;

            let callSelf = this[PROXYTHIS];
            switch (watchType) {
                case "watchSelf":
                    // 监听自身
                    updateMethod = e => {
                        cacheObj.push(e.trend);

                        nextTick(() => {
                            callback.call(callSelf, {
                                trends: Array.from(cacheObj.trends)
                            }, callSelf);

                            cacheObj.trends.length = 0;
                        }, cacheObj);
                    };

                    if (ImmeOpt === true) {
                        callback.call(callSelf, {
                            trends: []
                        }, callSelf);
                    }
                    break;
                case "watchKey":
                case "watchKeyReg":
                    // 监听key
                    updateMethod = e => {
                        let {
                            trend
                        } = e;
                        if ((watchType === "watchKeyReg" && expr.test(trend.fromKey)) || trend.fromKey == expr) {
                            cacheObj.push(e.trend);

                            if (!cacheObj.cacheOld) {
                                // 获取旧值
                                cacheObj._oldVal = e.oldValue instanceof XData ? e.oldValue.object : e.oldValue;
                                cacheObj.cacheOld = true;
                            }

                            nextTick(() => {
                                let val = this[expr];

                                callback.call(callSelf, {
                                    expr,
                                    val,
                                    // old: cacheObj.trends[0].args[1],
                                    old: cacheObj._oldVal,
                                    trends: Array.from(cacheObj.trends)
                                }, val);

                                cacheObj.trends.length = 0;
                                cacheObj._oldVal = cacheObj.cacheOld = false;
                            }, cacheObj);
                        }
                    };

                    if (ImmeOpt === true) {
                        callback.call(callSelf, {
                            expr,
                            val: callSelf[expr],
                            trends: []
                        }, callSelf[expr]);
                    }
                    break;
                case "watchPointKey":
                    let pointKeyArr = expr.split(".");
                    let oldVal = this.getTarget(pointKeyArr);
                    oldVal = oldVal instanceof XData ? oldVal.object : oldVal;

                    updateMethod = e => {
                        let {
                            trend
                        } = e;

                        let trendKeys = trend.keys.slice();

                        // 补充回trend缺失的末尾key（由于setData会导致末尾Key的失去）
                        if (trendKeys.length < pointKeyArr.length) {
                            trendKeys.push(trend.finalSetterKey)
                        }

                        if (JSON.stringify(pointKeyArr) === JSON.stringify(trendKeys.slice(0, pointKeyArr.length))) {
                            let newVal;
                            try {
                                newVal = this.getTarget(pointKeyArr);
                            } catch (e) {}
                            if (newVal !== oldVal) {
                                cacheObj.push(trend);
                                nextTick(() => {
                                    newVal = this.getTarget(pointKeyArr);

                                    (newVal !== oldVal) && callback.call(callSelf, {
                                        expr,
                                        old: oldVal,
                                        // val: newVal instanceof XData ? newVal[PROXYTHIS] : newVal,
                                        trends: Array.from(cacheObj.trends)
                                    }, newVal);

                                    cacheObj.trends.length = 0;
                                }, cacheObj);
                            }
                        }
                    }

                    if (ImmeOpt === true) {
                        callback.call(callSelf, {
                            expr,
                            val: oldVal
                        }, oldVal);
                    }
                    break;
            }

            this.on("update", updateMethod);

            cacheObj.updateMethod = updateMethod;

            return this;
        }

        /**
         * 取消watch监听
         * @param {string} expr 监听值
         * @param {Function} callback 监听callback
         */
        unwatch(expr, callback) {
            // 调整参数
            let arg1Type = getType(expr);
            if (arg1Type === "object") {
                Object.keys(expr).forEach(k => {
                    this.unwatch(k, expr[k]);
                });
                return this;
            } else if (/function/.test(arg1Type)) {
                callback = expr;
                expr = "";
            }

            let targetHostObj = getXDataProp(this, WATCHHOST).get(expr);

            if (targetHostObj) {
                let cacheObj = Array.from(targetHostObj).find(e => e.callback === callback && e.expr === expr);

                // 清除数据绑定
                if (cacheObj) {
                    cacheObj.updateMethod && this.off("update", cacheObj.updateMethod);
                    targetHostObj.delete(cacheObj);
                    (!targetHostObj.size) && (getXDataProp(this, WATCHHOST).delete(expr));
                }
            }

            return this;
        }

        /**
         * 监听表达式内容，有变化则触发callback
         * @param {String} expr 要监听的函数表达式
         * @param {Function} callback 监听后返回的数据
         */
        // watchExpr(expr, callback) {
        //     let exprHost = this[WATCHEXPRHOST] || (this[WATCHEXPRHOST] = new Map());

        //     // 根据表达式获取数组对象
        //     let targetExprHost = exprHost.get(expr);

        //     if (targetExprHost) {
        //         targetExprHost.push(callback);
        //         return;
        //     }

        //     targetExprHost = [];

        //     // 表达式生成函数
        //     const exprFun = new Function(`
        //     try{with(this){
        //         return ${expr}
        //     }}catch(err){
        //         console.error({
        //             desc:"Execution error",
        //             expr:${expr},
        //             target:this,
        //             error:err
        //         });
        //     }`).bind(this);

        //     let old_val;

        //     this.watch(e => {
        //         let reVal = exprFun();

        //         if (old_val !== reVal) {
        //             targetExprHost.forEach(func => {
        //                 func(reVal, e);
        //             })
        //             old_val = reVal;
        //         }
        //     });
        // }

        /**
         * 监听表达式为正确时就返回成功
         * @param {String} expr 监听表达式
         */
        watchUntil(expr) {
            if (/[^=]=[^=]/.test(expr)) {
                throw 'cannot use single =';
            }
            return new Promise(resolve => {
                let f;
                // 忽略错误
                let exprFun = new Function(`
            try{with(this){
                return ${expr}
            }}catch(e){}`).bind(this);
                this.watch(f = () => {
                    let reVal = exprFun();
                    if (reVal) {
                        this.unwatch(f);
                        resolve(reVal);
                    }
                }, true);
            });
        }

        /**
         * 趋势数据的入口，用于同步数据
         * @param {Object} trend 趋势数据
         */
        entrend(trend) {
            let {
                mid,
                keys,
                name,
                args,
                _unpush
            } = trend;

            if (_unpush) {
                // 不同步的就返回
                return;
            }

            let {
                _unpull
            } = this;
            let fkey = getFromKey(trend);
            if (_unpull && _unpull.includes(fkey)) {
                return;
            }

            if (!mid) {
                throw {
                    text: "Illegal trend data"
                };
            }

            // 获取相应目标，并运行方法
            let target = this.getTarget(keys);

            if (target) {
                let targetSelf = target[XDATASELF];
                if (getXDataProp(targetSelf, MODIFYIDS).includes(mid)) {
                    return false;
                }

                targetSelf._modifyId = mid;
                // target._modifyId = mid;
                targetSelf[name](...args);
                targetSelf._modifyId = null;
            }

            return true;
        }
    }

    const getFromKey = (_this) => {
        let keyOne = _this.keys[0];

        if (isUndefined(keyOne) && (_this.name === "setData" || _this.name === "remove")) {
            keyOne = _this.args[0];
        }

        return keyOne;
    }

    /**
     * trend数据class，记录趋势数据
     * XData的每次数据变动（值变动或数组变动），都会生成趋势数据
     * @class XDataTrend
     * @constructor
     */
    class XDataTrend {
        constructor(xevent) {
            if (xevent instanceof XEvent) {
                // 元对象数据会被修改，必须深克隆数据
                let {
                    modify: {
                        name,
                        args,
                        mid
                    },
                    keys
                } = cloneObject(xevent);
                let {
                    _unpush
                } = xevent;
                // let { modify: { name, args, mid }, keys, _unpush } = xevent;

                if (_unpush) {
                    Object.defineProperty(this, "_unpush", {
                        value: true
                    });
                }

                Object.assign(this, {
                    name,
                    args,
                    mid,
                    keys
                });

            } else {
                Object.assign(this, xevent);
            }
        }

        /**
         * 转换后的字符串
         */
        get string() {
            return JSON.stringify(this);
        }

        get finalSetterKey() {
            switch (this.name) {
                case "remove":
                case "setData":
                    return this.args[0];
            }
        }

        get fromKey() {
            return getFromKey(this);

            // let keyOne = this.keys[0];

            // if (isUndefined(keyOne) && (this.name === "setData" || this.name === "remove")) {
            //     keyOne = this.args[0];
            // }

            // return keyOne;
        }

        set fromKey(keyName) {
            let keyOne = this.keys[0];

            if (!isUndefined(keyOne)) {
                this.keys[0] = keyName;
            } else if (this.name === "setData" || this.name === "remove") {
                this.args[0] = keyName;
            }
        }
    }

    /**
     * XData的镜像对象
     * 镜像对象跟xdata公用一份，不会复制双份数据；
     * 可嵌入到其他对象内而不影响使用
     */
    // class XMirror extends XEmiter {
    class XMirror {
        constructor(xdata) {
            // super({});

            this[XMIRROR_SELF] = this;
            this.mirrorHost = xdata;
            this.parent = undefined;
            this.index = undefined;

            let updateFunc = (e) => {
                if (this.parent) {
                    emitUpdate(this.parent, "", [], {}, (e2) => {
                        Object.assign(e2, {
                            keys: cloneObject(e.keys),
                            modify: cloneObject(e.modify),
                            currentTarget: e.currentTarget,
                            target: e.target,
                            oldValue: e.oldValue
                        });
                        e2.keys.unshift(this.index);
                    });
                }
            }
            xdata.on("update", updateFunc);

            this[XMIRRIR_UPDATA_BINDER] = updateFunc;

            return new Proxy(this, XMirrorHandler);
        }

        remove(key) {
            return XData.prototype.remove.call(this, key);
        }
    }

    // XMirror实例的
    const XMIRRIR_UPDATA_BINDER = Symbol("XMirrorUpdataBinder");
    const XMIRROR_SELF = Symbol("XMirror_self");

    // 可访问自身的key
    const XMIRRIR_CANSET_KEYS = new Set(["index", "parent", "remove", XMIRRIR_UPDATA_BINDER, XMIRROR_SELF]);

    // 绑定行为的方法名，在清除时同步清除绑定的方法
    // const XMIRRIR_RECORD_NAME = new Set(["on", "watch"]);

    const XMirrorHandler = {
        get(target, key, receiver) {
            if (XMIRRIR_CANSET_KEYS.has(key)) {
                return target[key];
            }
            let r_val = target.mirrorHost[key];

            if (isFunction(r_val)) {
                r_val = r_val.bind(target.mirrorHost);
            }

            return r_val;
        },
        set(target, key, value, receiver) {
            if (XMIRRIR_CANSET_KEYS.has(key)) {
                target[key] = value;
                return true;
            }
            return target.mirrorHost.setData(key, value);
        }
    };

    /**
     * 根据key值同步数据
     * @param {String} key 要同步的key
     * @param {Trend} e 趋势数据
     * @param {XData} xdata 同步覆盖的数据对象
     */
    const pubSyncByKey = (key, e, xdata) => {
        e.trends.forEach(trend => {
            if (trend.fromKey === key) {
                xdata.entrend(trend);
            }
        });
    }

    /**
     * 根据key数组同步数据
     * @param {String} keyArr 要同步的key数组
     * @param {Trend} e 趋势数据
     * @param {XData} xdata 同步覆盖的数据对象
     */
    const pubSyncByArray = (keyArr, e, xdata) => {
        e.trends.forEach(trend => {
            if (keyArr.includes(trend.fromKey)) {
                xdata.entrend(trend);
            }
        });
    }

    /**
     * 根据映射对象同步数据
     * @param {Map} optMap key映射对象
     * @param {Trend} e 趋势数据
     * @param {XData} xdata 同步覆盖的数据对象
     */
    const pubSyncByObject = (optMap, e, xdata) => {
        let cloneTrends = cloneObject(e.trends);
        cloneTrends.forEach(trend => {
            trend = new XDataTrend(trend);
            let {
                fromKey
            } = trend;
            // 修正key值
            if (!isUndefined(fromKey)) {
                let mKey = optMap.get(fromKey)
                if (mKey) {
                    trend.fromKey = mKey;
                    xdata.entrend(trend);
                }
            }
        });
    }

    /**
     * 转换可以直接设置在XData上的值
     * @param {*} value 如果是XData，转换为普通对象数据
     */
    const getNewSyncValue = (value) => {
        (value instanceof XData) && (value = value.object);
        return value;
    };

    const virDataTrans = (self, target, callback) => {
        Object.keys(self).forEach(key => {
            let val = self[key];

            if (val instanceof Object) {
                if (!target[key]) {
                    if (target.setData) {
                        target.setData(key, {})
                    } else {
                        target[key] = {};
                    }
                }

                let vdata = target[key];

                virDataTrans(val, vdata, callback);
            } else {
                let keyValue = callback([key, val], {
                    self,
                    target
                });
                if (keyValue) {
                    let [newKey, newValue] = keyValue;
                    target[newKey] = newValue;
                }
            }
        });
    }

    const entrendByCall = (target, e, callback) => {
        let {
            trend
        } = e;
        if (trend) {
            switch (trend.name) {
                case "setData":
                    let value = trend.args[1];
                    if (value instanceof Object) {
                        let obj = {};
                        virDataTrans(value, obj, callback);
                        trend.args[1] = obj;
                    } else if (!isUndefined(value)) {
                        trend.args = callback(trend.args, {
                            event: e
                        });
                    }
                    break;
                default:
                    // 其他数组的话，修正参数
                    trend.args = trend.args.map(value => {
                        let nVal = value;
                        if (value instanceof Object) {
                            nVal = {};
                            virDataTrans(value, nVal, callback);
                        }
                        return nVal;
                    });
                    break;
            }
            target.entrend(trend);
        }
    }

    const SyncMethods = {
        /**
         * 同步数据
         * @param {XData} xdata 需要同步的数据
         */
        sync(xdata, opts, isCoverRight) {
            let optsType = getType(opts);

            let leftFun, rightFun;

            switch (optsType) {
                case "string":
                    if (isCoverRight) {
                        xdata.setData(opts, getNewSyncValue(this[opts]));
                    }

                    leftFun = e => pubSyncByKey(opts, e, xdata)
                    rightFun = e => pubSyncByKey(opts, e, this)
                    break;
                case "array":
                    if (isCoverRight) {
                        opts.forEach(key => {
                            xdata.setData(key, getNewSyncValue(this[key]));
                        });
                    }

                    leftFun = e => pubSyncByArray(opts, e, xdata)
                    rightFun = e => pubSyncByArray(opts, e, this)
                    break;
                case "object":
                    let optMap = new Map(Object.entries(opts));
                    let resOptsMap = new Map(Object.entries(opts).map(arr => arr.reverse()));

                    if (isCoverRight) {
                        Object.keys(opts).forEach(key => {
                            xdata.setData(opts[key], getNewSyncValue(this[key]));
                        });
                    }

                    leftFun = e => pubSyncByObject(optMap, e, xdata)
                    rightFun = e => pubSyncByObject(resOptsMap, e, this)
                    break
                default:
                    if (isCoverRight) {
                        let obj = this.object;

                        Object.keys(obj).forEach(k => {
                            xdata.setData(k, obj[k]);
                        });
                    }

                    leftFun = e => e.trends.forEach(trend => xdata.entrend(trend))
                    rightFun = e => e.trends.forEach(trend => this.entrend(trend))
                    break;
            }

            this.watch(leftFun);
            xdata.watch(rightFun);

            let sHost = getXDataProp(this, SYNCSHOST);

            // 把之前的绑定操作清除
            if (sHost.has(xdata)) {
                this.unsync(xdata);
            }

            // 记录信息
            sHost.set(xdata, {
                selfWatch: leftFun,
                oppWatch: rightFun
            });
            getXDataProp(xdata, SYNCSHOST).set(this, {
                selfWatch: rightFun,
                oppWatch: leftFun
            });
        },
        /**
         * 取消同步数据
         * @param {XData} xdata 需要取消同步的数据
         */
        unsync(xdata) {
            let syncData = getXDataProp(this, SYNCSHOST).get(xdata);

            if (syncData) {
                let {
                    selfWatch,
                    oppWatch
                } = syncData;
                this.unwatch(selfWatch);
                xdata.unwatch(oppWatch);
                getXDataProp(this, SYNCSHOST).delete(xdata);
                getXDataProp(xdata, SYNCSHOST).delete(this);
            }
        },
        /**
         * 生成虚拟数据
         */
        virData(leftCall, rightCall) {
            // 初始生成数据
            let vdata = new VirData(this[XDATASELF], {});
            let arg1Type = getType(leftCall);
            let mapOpts = leftCall;

            if (arg1Type == "object") {
                if ("mapKey" in mapOpts) {
                    let mappingOpt = Object.entries(mapOpts.mapKey);
                    let mapping = new Map(mappingOpt);
                    let resMapping = new Map(mappingOpt.map(e => e.reverse()));

                    leftCall = ([key, value]) => {
                        if (mapping.has(key)) {
                            return [mapping.get(key), value];
                        }
                        return [key, value];
                    }
                    rightCall = ([key, value]) => {
                        if (resMapping.has(key)) {
                            return [resMapping.get(key), value];
                        }
                        return [key, value];
                    }
                } else if ("mapValue" in mapOpts) {
                    let tarKey = mapOpts.key;
                    let mappingOpt = Object.entries(mapOpts.mapValue);
                    let mapping = new Map(mappingOpt);
                    let resMapping = new Map(mappingOpt.map(e => e.reverse()));

                    leftCall = ([key, value]) => {
                        if (key === tarKey && mapping.has(value)) {
                            return [key, mapping.get(value)];
                        }
                        return [key, value];
                    }
                    rightCall = ([key, value]) => {
                        if (key === tarKey && resMapping.has(value)) {
                            return [key, resMapping.get(value)];
                        }
                        return [key, value];
                    }
                }
            }
            // 转换数据
            virDataTrans(this, vdata, leftCall);

            let leftUpdate, rightUpdate;

            this.on("update", leftUpdate = e => entrendByCall(vdata, e, leftCall));
            vdata.on("update", rightUpdate = e => entrendByCall(this, e, rightCall));

            // 记录信息
            getXDataProp(this, VIRDATAHOST).push({
                data: vdata,
                leftUpdate,
                rightUpdate
            });

            return vdata[PROXYTHIS];
        }
    };

    Object.keys(SyncMethods).forEach(methodName => {
        Object.defineProperty(XData.prototype, methodName, {
            writable: true,
            value: SyncMethods[methodName]
        });
    });

    class VirData extends XData {
        constructor(xdata, ...args) {
            super(...args);
            Object.defineProperty(this, "mappingXData", {
                writable: true,
                value: xdata
            });
        }
    }

    // 重构Array的所有方法

    // 不影响数据原结构的方法，重新做钩子
    ['concat', 'every', 'filter', 'find', 'findIndex', 'forEach', 'map', 'slice', 'some', 'indexOf', 'lastIndexOf', 'includes', 'join'].forEach(methodName => {
        let arrayFnFunc = Array.prototype[methodName];
        if (arrayFnFunc) {
            Object.defineProperty(XData.prototype, methodName, {
                value(...args) {
                    return arrayFnFunc.apply(this, args);
                }
            });
        }
    });

    // 触发updateIndex事件
    const emitXDataIndex = (e, index, oldIndex) => {
        if ((e instanceof XData || e instanceof XMirror) && index !== oldIndex) {
            e.index = index;
            e.emitHandler("updateIndex", {
                oldIndex,
                index
            });
        }
    }

    // 几个会改变数据结构的方法
    ['pop', 'push', 'reverse', 'splice', 'shift', 'unshift'].forEach(methodName => {
        // 原来的数组方法
        let arrayFnFunc = Array.prototype[methodName];

        if (arrayFnFunc) {
            Object.defineProperty(XData.prototype, methodName, {
                value(...args) {
                    // 重构新参数
                    let newArgs = [];

                    let _this = this[XDATASELF];

                    let oldValue = _this.object;

                    args.forEach(val => {
                        if (val instanceof XData) {
                            let xSelf = val[XDATASELF];
                            xSelf.remove();
                            newArgs.push(xSelf);
                        } else if (val instanceof XMirror) {
                            val.parent = _this;
                            newArgs.push(val);
                        } else {
                            // 转化内部数据
                            let newVal = createXData(val, {
                                parent: _this
                            });
                            newArgs.push(newVal);
                        }
                    });

                    // pop shift splice 的返回值，都是被删除的数据，内部数据清空并回收
                    let returnVal = arrayFnFunc.apply(_this, newArgs);

                    // 重置index
                    _this.forEach((e, i) => {
                        let oldIndex = e.index;
                        emitXDataIndex(e, i, oldIndex);
                    });

                    // 删除returnVal的相关数据
                    switch (methodName) {
                        case "shift":
                        case "pop":
                            if (returnVal instanceof XData || returnVal instanceof XMirror) {
                                clearXData(returnVal);
                            }
                            break;
                        case "splice":
                            returnVal.forEach(e => {
                                if (e instanceof XData || e instanceof XMirror) {
                                    clearXData(e);
                                }
                            });
                    }

                    emitUpdate(_this, methodName, args, {
                        oldValue
                    });

                    return returnVal;
                }
            });
        }
    });

    Object.defineProperties(XData.prototype, {
        sort: {
            value(arg) {
                let args = [];
                let _this = this[XDATASELF];
                let oldValue = _this.object;
                let oldThis = Array.from(_this);
                if (isFunction(arg) || !arg) {
                    Array.prototype.sort.call(_this, arg);

                    // 重置index
                    // 记录重新调整的顺序
                    _this.forEach((e, i) => {
                        let oldIndex = e.index;
                        emitXDataIndex(e, i, oldIndex);
                    });
                    let orders = oldThis.map(e => e.index);
                    args = [orders];
                    oldThis = null;
                } else if (arg instanceof Array) {
                    arg.forEach((aid, id) => {
                        let tarData = _this[aid] = oldThis[id];
                        let oldIndex = tarData.index;
                        emitXDataIndex(tarData, aid, oldIndex);
                    });
                    args = [arg];
                }

                emitUpdate(_this, "sort", args, {
                    oldValue
                });

                return this;
            }
        }
    });
    //<o:end--xdata.js-->

    let stanz = obj => createXData(obj)[PROXYTHIS];

    stanz.version = "6.2.0";
    stanz.v = 6002000;

    return stanz;
});