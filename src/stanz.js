// 树形数据库
((glo) => {
    // 获取随机id
    const getRandomId = () => Math.random().toString(32).substr(2);
    let objectToString = Object.prototype.toString;
    const getType = value => objectToString.call(value).toLowerCase().replace(/(\[object )|(])/g, '');

    let {
        defineProperty,
        defineProperties
    } = Object

    // function
    // 触发watch改动函数
    let emitWatch = (data, key, val, oldVal) => {
        let watchArr = data._watch[key];
        if (watchArr) {
            watchArr.forEach(func => {
                func(val, oldVal);
            });
        }
    }

    // 触发改动
    let emitChange = (data, key, val, oldVal, type = "update") => {
        emitWatch(data, key, val, oldVal);

        data._obs.forEach(func => {
            func({
                type,
                key,
                val: d,
                oldVal
            });
        });
    }

    // class
    function XData(obj, root, host) {
        defineProperties(this, {
            '_id': {
                value: getRandomId()
            },
            '_keys': {
                value: []
            },
            '_obs': {
                value: []
            },
            '_watch': {
                value: {}
            }
        });

        if (root) {
            defineProperty(this, '_root', {
                value: root
            });
            defineProperty(this, '_host', {
                value: host
            });
        } else {
            defineProperty(this, '_cache', {
                value: {}
            });
        }

        obj && this.set(obj);
    }

    let XDataFn = {
        // 设置
        set(key, value) {
            switch (getType(key)) {
                case "object":
                    for (let i in key) {
                        this.set(i, key[i]);
                    }
                    return;
                case "array":
                    key.forEach(k => this.set(k));
                    return;
            }

            let {
                _keys
            } = this;

            if (_keys.indexOf(key) > -1) {
                this[key] = value;
                return;
            }

            _keys.push(key);

            if (getType(value) == "object") {
                value = new XData(value, this._root || this, this);

                // 注册_cache
                value._root._cache[value._id] = value;
            }

            let oriData = value;

            defineProperty(this, key, {
                enumerable: true,
                get() {
                    return oriData;
                },
                set(d) {
                    let oldVal = oriData;
                    oriData = d;

                    if (oldVal !== d) {
                        emitChange(this, key, d, oldVal);
                    }
                }
            });

            emitChange(this, key, value, undefined, "new");
        },
        // 覆盖旧的值
        cover(obj) {

        },
        // 完全重建值
        reset() {

        },
        // 删除值
        remove(key) {

        },
        // 监听
        watch(key, func) {
            let watchArr = data._watch[key] || (data._watch[key] = []);
            watchArr.push(func);
        },
        // 取消监听
        unwatch(key, func) {
            let watchArr = data._watch[key] || (data._watch[key] = []);
            let id = watchArr.indexOf(func);
            id > -1 && watchArr.splice(id, 1);
        },
        // 触发watch监听
        emit(key) {
            emitChange(this, key, this[key], this[key], "emit");
        },
        // 同步数据
        sync(key, func) {

        },
        // 取消同步
        unSync(key, func) {

        },
        // 视奸
        observe(func) {
            this._obs.push(func);
        },
        unobserve(func) {
            let id = this._obs.indexOf(func);
            (id > -1) && this._obs.splice(id, 1);
        }
    };

    for (let k in XDataFn) {
        defineProperty(XData.prototype, k, {
            value: XDataFn[k]
        });
    }

    // init
    let stanz = (obj) => {
        return new XData(obj);
    }

    glo.stanz = stanz;
})(window);