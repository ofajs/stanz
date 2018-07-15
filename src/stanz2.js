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
        if (!data._canEmitWatch) {
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
    }

    // 删除xdata
    let removeXData = (data) => {
        // 删除 root 上的备份
        delete data._root._cache[data._id];

        for (let k in data) {
            debugger
        }
    }

    // 代理对象
    let XObjectHandler = {
        set: function (target, key, value, receiver) {
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
        },
        deleteProperty(target, key) {
            // 获取旧值
            let oldVal = target[key];

            // 删除 root 上的备份
            removeXData(target[key]);

            // 默认行为
            let reValue = Reflect.deleteProperty(target, key);

            // 触发改动事件
            emitChange(target, key, undefined, oldVal, "delete");

            return reValue;
        }
    }

    // 主体xObject
    let XObject = function (root, host, key) {
        defineProperties(this, {
            '_id': {
                value: root ? getRandomId() : "0"
            },
            '_obs': {
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
            root._cache[this._id] = this;
        } else {
            defineProperty(this, '_cache', {
                value: {}
            });
        }

        // this._canEmitWatch = 0;
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

    let createXData = (obj, root, host, key) => {
        switch (getType(obj)) {
            case "object":
                return createXObject(obj, root, host, key);
            case "array":
                break;
        }
        return obj;
    }

    // init
    glo.stanz = (obj) => {
        return createXData(obj);
    }
})(window);