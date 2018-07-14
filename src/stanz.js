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
        emitWatch(data, key, val, {
            oldVal,
            type
        });

        data._obs.forEach(func => {
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

        _host && emitChange(_host.target, _host.key, data, data, "updateHost");
    }

    // 删除xdata
    let removeXData = (data) => {
        // 删除 root 上的备份
        delete data._root._cache[data._id];

        // 删除宿主上的备份
        let {
            _host
        } = data;
        let id = _host.target._keys.indexOf(_host.key);
        _host.target._keys.splice(id, 1);
        delete _host.target[_host.key];

        // 判断是否有子XData
        data._keys.forEach(k => {
            let tar = data[k];
            if (tar instanceof XData) {
                removeXData(tar);
            }
        });
    }

    // class
    function XData(obj, root, host, key) {
        defineProperties(this, {
            '_id': {
                value: root ? getRandomId() : "0"
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
                value = new XData(value, this._root || this, this, key);

                // 注册_cache
                value._root._cache[value._id] = value;
            }

            let oriData = value;

            defineProperty(this, key, {
                enumerable: true,
                configurable: true,
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
            for (let k in obj) {
                if (this._keys.indexOf(k) > -1) {
                    this.set(k, obj[k]);
                }
            }
        },
        // 完全重建值
        reset() {

        },
        // 删除值
        remove(key) {
            if (key) {
                let oldVal = this[key];
                if (oldVal instanceof XData) {
                    removeXData(oldVal);
                } else {
                    delete this[key];
                }
                emitChange(this, key, undefined, oldVal, 'delete');
            }
        },
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
        // 触发watch监听
        emit(key) {
            key && emitChange(this, key, this[key], this[key], "emit");
        },
        // 同步数据
        sync(key, func) {

        },
        // 取消同步
        unSync(key, func) {

        },
        // 视奸
        observe(func) {
            func && this._obs.push(func);
        },
        unobserve(func) {
            let id = this._obs.indexOf(func);
            (id > -1) && this._obs.splice(id, 1);
        }
    };

    // 设置在 prototype 上
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