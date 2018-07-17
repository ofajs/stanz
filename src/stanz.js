((glo) => {
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

    let isXData = (obj) => (obj instanceof XObject) || (obj instanceof XArray);

    // 将xdata转换成字符串
    let XDataToObject = (xdata) => {
        let reObj;
        if (xdata instanceof Array) {
            reObj = [];
            xdata.forEach(e => {
                if (isXData(e)) {
                    reObj.push(XDataToObject(e));
                } else {
                    reObj.push(e);
                }
            });
        } else {
            reObj = {};
            for (let k in xdata) {
                let tar = xdata[k];
                if (isXData(tar)) {
                    reObj[k] = XDataToObject(tar);
                } else {
                    reObj[k] = tar;
                }
            }
        }
        return reObj;
    }

    // 触发watch改动函数
    let emitWatch = (data, key, val, e) => {
        let watchArr = data._watch[key];
        if (watchArr) {
            watchArr.forEach(func => {
                func(val, e);
            });
        }
    }

    // 触发改动
    let emitChange = (data, key, val, oldVal, type = "update") => {
        // 判断能否触发
        if (!data._canEmitWatch) {
            return;
        }

        // 判断值是否相等
        if (type !== "uphost" && val === oldVal) {
            return;
        }

        emitWatch(data, key, val, {
            oldVal,
            type
        });

        data['_obs'].forEach(func => {
            func({
                target: data,
                type,
                key,
                val,
                oldVal
            });
        });

        let {
            _host
        } = data;

        _host && emitChange(_host.target, _host.key, data, data, "uphost");

        // 触发变动参数监听
        if (type !== "uphost") {
            let {
                _trend
            } = data;

            _trend.forEach(func => {
                func({
                    id: data._id,
                    key,
                    val,
                    oldVal,
                    type
                });
            });
        }
    }

    // 代理对象
    let XObjectHandler = {
        set(target, key, value, receiver) {
            if (!/^_.+/.test(key)) {
                // 获取旧值
                let oldVal = target[key];

                let type = target.hasOwnProperty(key) ? "update" : "new";

                // 判断value是否object
                value = createXData(value, target._root || target, target, key);

                // 继承行为
                let reValue = Reflect.set(target, key, value, receiver);

                // 触发改动事件
                emitChange(target, key, value, oldVal, type);

                // 返回行为值
                return reValue;
            } else {
                return Reflect.set(target, key, value, receiver);
            }
        },
        deleteProperty(target, key) {
            if (!/^_.+/.test(key)) {
                // 获取旧值
                let oldVal = target[key];

                // 默认行为
                let reValue = Reflect.deleteProperty(target, key);

                // 触发改动事件
                emitChange(target, key, undefined, oldVal, "delete");

                return reValue;
            } else {
                return Reflect.deleteProperty(target, key);
            }
        }
    }

    // 主体xObject
    function XObject(root, host, key) {
        defineProperties(this, {
            '_id': {
                value: root ? getRandomId() : "0"
            },
            '_obs': {
                value: []
            },
            '_trend': {
                value: []
            },
            '_watch': {
                value: {}
            },
            '_canEmitWatch': {
                writable: !0,
                value: 0
            }
        });

        if (root) {
            defineProperty(this, '_root', {
                value: root
            });
            defineProperty(this, '_host', {
                value: {
                    target: host,
                    key
                }
            });
        } else {
            defineProperty(this, '_cache', {
                value: {}
            });
        }
    }

    let XObjectFn = {
        // 监听
        watch(key, func) {
            let watchArr = this._watch[key] || (this._watch[key] = []);
            func && watchArr.push(func);
        },
        // 取消监听
        unwatch(key, func) {
            let watchArr = this._watch[key] || (this._watch[key] = []);
            let id = watchArr.indexOf(func);
            id > -1 && watchArr.splice(id, 1);
        },
        // 视奸
        observe(func) {
            func && this['_obs'].push(func);
        },
        // 注销
        unobserve(func) {
            let id = this['_obs'].indexOf(func);
            (id > -1) && this['_obs'].splice(id, 1);
        },
        // 完全重置对象（为了使用同一个内存对象）
        reset(value, options) {

        },
        // 监听数据变动字符串流
        trend(func) {
            func && this['_trend'].push(func);
        },
        // 流入变动字符串流数据
        entrend(trendString) {

        },
        // 取消数据变动字符串流监听
        untrend(func) {
            let id = this['_trend'].indexOf(func);
            (id > -1) && this['_trend'].splice(id, 1);
        },
        // 单项同步
        syncTo(xdata) {

        },
        // 同步数据
        syncData(xdata) {

        },
        // 转换成普通对象
        toObject() {
            let reObj = XDataToObject(this);
            return reObj;
        },
        // 转换成json字符串
        // 会保留数组数据
        stringify() {
            let obj = XDataToObject(this);
            let reObj = JSON.stringify(obj);
            return reObj;
        }
    };

    // 设置在 prototype 上
    for (let k in XObjectFn) {
        defineProperty(XObject.prototype, k, {
            value: XObjectFn[k]
        });
    }

    // 生成对象
    let createXObject = (obj, root, host, key) => {
        // 转换对象数据
        let xobj = new XObject(root, host, key);

        let reObj = new Proxy(xobj, XObjectHandler)

        // 合并数据
        assign(reObj, obj);

        // 打开阀门
        xobj._canEmitWatch = 1;

        // 返回代理对象
        return reObj;
    }

    function XArray(...args) {
        XObject.apply(this, args);
    }

    let XArrayFn = Object.create(Array.prototype);

    for (let k in XObjectFn) {
        defineProperty(XArrayFn, k, {
            value: XObjectFn[k]
        });
    }

    XArray.prototype = XArrayFn;

    // 生成数组型对象
    let createXArray = (arr, root, host, key) => {
        let xarr = new XArray(root, host, key);

        let reObj = new Proxy(xarr, XObjectHandler);

        // 合并数据
        reObj.splice(0, 0, ...arr);

        // 打开阀门
        xarr._canEmitWatch = 1;

        return reObj;
    }

    let createXData = (obj, root, host, key) => {
        switch (getType(obj)) {
            case "object":
                return createXObject(obj, root, host, key);
            case "array":
                return createXArray(obj, root, host, key);
        }
        return obj;
    }

    // init
    glo.stanz = (obj) => {
        return createXData(obj);
    }
})(window);