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

    // business function
    function XData(obj, options = {}) {
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
            this[k] = value;
        });

        let opt = {
            status: "root",
            length,
            // 事件寄宿对象
            [EVES]: {}
        };

        if (options.parent) {
            opt.status = "binding";
            opt.parent = options.parent;
        }

        // 设置数组长度
        setNotEnumer(this, opt);
    }
    let XDataFn = {};
    XData.prototype = XDataFn;

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
                    return arrayFnFunc.apply(this, args);
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
            eves.push({
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
            eves.forEach((opt, index) => {
                // 想等值得删除
                if (opt.callback === callback && opt.eventId === options.id && opt.onData === options.data) {
                    eves.splice(index, 1);
                }
            });
            return this;
        },
        emit(eventName, emitData) {
            let eves = getEvesArr(this, eventName);
            eves.forEach(opt => {
                let args = [{
                    type: eventName,
                }];

                !isUndefined(opt.onData) && (args[0].data = opt.onData);
                !isUndefined(opt.eventId) && (args[0].eventId = opt.eventId);
                !isUndefined(opt.one) && (args[0].one = opt.one);
                !isUndefined(emitData) && (args.push(emitData));

                opt.callback.apply(this, args);
            });

            return this;
        },
        // 设置值得方法
        set(key, value) {

        },
        // 插入trend数据
        entrend(options) {

        }
    });

    // handler
    let XDataHandler = {
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
                    receiver: xdata,
                    type: "delete"
                });
                return true;
            }
            return Reflect.deleteProperty(xdata, key);
        }
    };

    // main 
    const createXData = (obj) => new XData(obj);

    // init
    glo.stanz = (obj = {}) => createXData(obj);
})(window);