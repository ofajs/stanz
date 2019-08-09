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
 * 触发事件
 * 不会触发冒泡
 * @param {String|XEvent} eventName 触发的事件名
 * @param {Object} emitData 触发事件的自定义数据
 */
const emitHandler = (eventName, emitData, _this) => {
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

    let evesArr = getEventsArr(eventName, _this);

    // 需要去除的事件对象
    let needRmove = [];

    // 修正currentTarget
    event.currentTarget = _this[PROXYTHIS] || _this;

    // 触发callback函数
    evesArr.some(e => {
        e.data && (event.data = e.data);
        e.eventId && (event.eventId = e.eventId);
        e.callback.call(_this[PROXYTHIS] || _this, event, emitData);
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
            this[EVENTS] && this[EVENTS].delete(eventName);
        }
    }

    /**
     * 触发事件
     * 不会触发冒泡
     * @param {String|XEvent} eventName 触发的事件名
     * @param {Object} emitData 触发事件的自定义数据
     */
    emitHandler(eventName, emitData) {
        emitHandler(eventName, emitData, this);
    }

    /**
     * 触发事件
     * 带有冒泡状态
     * @param {String|XEvent} eventName 触发的事件名
     * @param {Object} emitData 触发事件的自定义数据
     */
    emit(eventName, emitData) {
        let event = emitHandler(eventName, emitData, this);

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