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
            if (/^\_/.test(k)) {
                // this[k] = obj[k];
                Object.defineProperty(this, k, {
                    configurable: true,
                    writable: true,
                    value: obj[k]
                });
                return;
            }
            // 值
            let value = obj[k];

            if (!/\D/.test(k)) {
                // 数字key进行length长度计算
                k = parseInt(k);

                if (k >= length) {
                    length = k + 1;
                }
            }

            if (value instanceof Object) {
                this[k] = new XData(value, {
                    parent: this,
                    index: k
                });
            } else {
                this[k] = value;
            }
        });

        Object.defineProperties(this, {
            [XDATASELF]: {
                get: () => this
            },
            [PROXYTHIS]: {
                value: proxyThis
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

        if (getType(key) === "string") {
            let oldVal = _this[key];

            if (value === oldVal) {
                // 一样还瞎折腾干嘛
                return;
            }

            // 去除旧的依赖
            if (value instanceof XData) {
                value = value[XDATASELF];
                value.remove();

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
        let target = this[keyName];

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

    /**
     * 转换为普通 object 对象
     * @property {Object} object
     */
    get object() {
        let obj = {};

        let isPureArray = true;

        // 遍历合并数组，并判断是否有非数字
        Object.keys(this).forEach(k => {
            if (/^_/.test(k) || !/\D/.test(k)) {
                return;
            }
            isPureArray = false;

            let val = this[k];

            if (val instanceof XData) {
                val = val.object;
            }

            obj[k] = val;
        });
        this.forEach((val, k) => {
            if (val instanceof XData) {
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
     * 根据keys获取目标对象
     * @param {Array} keys 深度键数组
     */
    getTarget(keys) {
        let target = this;
        if (keys.length) {
            keys.forEach(k => {
                target = target[k];
            });
        }
        return target;
    }

    /**
     * 查询符合条件的对象
     * @param {String|Function} expr 需要查询的对象特征
     */
    seek(expr) {
        let arg1Type = getType(expr);

        if (arg1Type === "function") {
            let arr = [];

            let f = val => {
                if (val instanceof XData) {
                    let isAgree = expr(val);

                    isAgree && (arr.push(val));

                    // 深入查找是否有符合的
                    let meetChilds = val.seek(expr);

                    arr = [...arr, ...meetChilds];
                }
            }

            // 专门为Xhear优化的操作
            // 拆分后，Xhear也能为children进行遍历
            Object.keys(this).forEach(k => {
                if (/\D/.test(k)) {
                    f(this[k]);
                }
            });
            this.forEach(f);

            f = null;

            return arr;
        } else if (arg1Type === "string") {
            // 判断是否符合条件
            if (/^\[.+\]$/) {
                expr = expr.replace(/[\[\]]/g, "");

                let exprArr = expr.split("=");

                let fun;

                if (exprArr.length == 2) {
                    let [key, value] = exprArr;
                    fun = data => data[key] == value;
                } else {
                    let [key] = exprArr;
                    fun = data => Object.keys(data).includes(key);
                }

                return this.seek(fun);
            }
        }
    }

    /**
     * 监听当前对象的值
     * 若只传callback，就监听当前对象的所有变化
     * 若 keyName，则监听对象的相应 key 的值
     * 若 seek 的表达式，则监听表达式的值是否有变化
     * @param {string} expr 监听键值，可以是 keyName 可以是 seek表达式
     * @param {Function} callback 相应值变动后出发的callback
     * @param {Boolean} ImmeOpt 是否即可触发callback
     */
    watch(expr, callback, ImmeOpt) {
        // 调整参数
        let arg1Type = getType(expr);
        if (arg1Type === "object") {
            Object.keys(expr).forEach(k => {
                this.watch(k, expr[k]);
            });
            return;
        } else if (/function/.test(arg1Type)) {
            callback = expr;
            expr = "";
        }

        // 根据参数调整类型
        let watchType;

        if (expr == "") {
            watchType = "watchSelf";
        } else if (/\[.+\]/.test(expr)) {
            watchType = "seekData";
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
            trends: [], callback, expr
        };

        targetHostObj.add(cacheObj);

        let updateMethod;

        switch (watchType) {
            case "watchSelf":
                // 监听自身
                updateMethod = e => {
                    cacheObj.trends.push(e.trend);

                    nextTick(() => {
                        callback.call(this, {
                            trends: Array.from(cacheObj.trends)
                        }, this);

                        cacheObj.trends.length = 0;
                    }, cacheObj);
                };

                if (ImmeOpt === true) {
                    callback.call(this, {
                        trends: []
                    }, this);
                }
                break;
            case "watchKey":
                // 监听key
                updateMethod = e => {
                    let { trend } = e;
                    if (trend.fromKey == expr) {
                        cacheObj.trends.push(e.trend);

                        nextTick(() => {
                            let val = this[expr];

                            callback.call(this, {
                                expr,
                                val,
                                trends: Array.from(cacheObj.trends)
                            }, val);

                            cacheObj.trends.length = 0;
                        }, cacheObj);
                    }
                };

                if (ImmeOpt === true) {
                    callback.call(this, {
                        expr,
                        val: this[expr],
                        trends: []
                    }, this[expr]);
                }
                break;
            case "seekData":
                let oldVals = this.seek(expr);
                updateMethod = e => {
                    nextTick(() => {
                        let tars = this.seek(expr);
                        let isEqual = 1;

                        if (tars.length === oldVals.length) {
                            tars.some(e => {
                                if (!oldVals.includes(e)) {
                                    isEqual = 0;
                                    return true;
                                }
                            });
                        } else {
                            isEqual = 0;
                        }

                        // 有变动就触发
                        !isEqual && callback.call(this, {
                            expr,
                            old: oldVals,
                            val: tars
                        }, tars);

                        oldVals = tars;
                    }, cacheObj);
                };

                if (ImmeOpt === true) {
                    callback.call(this, {
                        expr,
                        old: oldVals,
                        val: oldVals
                    }, oldVals);
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
                this.off("update", cacheObj.updateMethod);
                targetHostObj.delete(cacheObj);
                (!targetHostObj.size) && (getXDataProp(this, WATCHHOST).delete(expr));
            }
        }

        return this;
    }

    /**
     * 趋势数据的入口，用于同步数据
     * @param {Object} trend 趋势数据
     */
    entrend(trend) {
        let { mid, keys, name, args } = trend;

        if (!mid) {
            throw {
                text: "Illegal trend data"
            };
        }

        if (getXDataProp(this, MODIFYIDS).includes(mid)) {
            return false;
        }

        // 获取相应目标，并运行方法
        let target = this.getTarget(keys);
        let targetSelf = target[XDATASELF];
        targetSelf._modifyId = mid;
        // target._modifyId = mid;
        targetSelf[name](...args);
        targetSelf._modifyId = null;

        return true;
    }
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
            let { modify: { name, args, mid }, keys } = cloneObject(xevent);

            Object.assign(this, {
                name, args, mid, keys
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
        let keyOne = this.keys[0];

        if (isUndefined(keyOne) && (this.name === "setData" || this.name === "remove")) {
            keyOne = this.args[0];
        }

        return keyOne;
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