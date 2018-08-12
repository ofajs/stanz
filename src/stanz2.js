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
    const XDATAEVENTS = "_events_" + getRandomId();

    // function
    // let isXData = (obj) => (obj instanceof XObject) || (obj instanceof XArray);
    let deepClone = obj => obj && JSON.parse(JSON.stringify(obj));


    // business function
    // 触发事件
    const emitXDataEvent = (tar, eventName, data) => {

    }

    // 绑定事件
    const onXDataEvent = (tar, eventName, data) => {

    }

    // class
    function XData(obj, host) {
        defineProperties(this, {
            "_id": {
                value: obj._id || getRandomId()
            },
            // 事件寄宿对象
            [XDATAEVENTS]: {
                value: {}
            }
        });

        Object.keys(obj).forEach(k => {
            // 获取值，getter,setter
            let {
                get,
                set,
                value
            } = Object.getOwnPropertyDescriptor(obj, k);

            if (get || set) {

            } else {
                this[k] = value;
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
        watch() {},
        // 取消监听
        unwatch() {},
        // 重置数据
        reset() {},
        // 传送器callback
        trend() {},
        // 注销传送器callback
        untrend() {},
        // 传送器入口
        entrend() {},
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

    // Handler
    const XDataHandler = {
        set(target, key, value, receiver) {
            return Reflect.set(target, key, value, receiver);
        },
        deleteProperty(target, key) {
            return Reflect.deleteProperty(target, key);
        }
    };


    // main
    const createXData = (obj) => {
        if (obj instanceof Object) {
            let xdata = new XData(obj);
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