setNotEnumer(XDataFn, {
    seek(expr) {
        // 代表式的组织化数据
        let exprObjArr = [];

        let hostKey;
        let hostKeyArr = expr.match(/(^[^\[\]])\[.+\]/);
        if (hostKeyArr && hostKeyArr.length >= 2) {
            hostKey = hostKeyArr[1];
        }

        // 分析expr字符串数据
        let garr = expr.match(/\[.+?\]/g);

        garr.forEach(str => {
            str = str.replace(/\[|\]/g, "");
            let strarr = str.split(/(=|\*=|:=|~=)/);

            let param_first = strarr[0];

            switch (strarr.length) {
                case 3:
                    if (param_first) {
                        exprObjArr.push({
                            type: "keyValue",
                            k: param_first,
                            eqType: strarr[1],
                            v: strarr[2]
                        });
                    } else {
                        exprObjArr.push({
                            type: "hasValue",
                            eqType: strarr[1],
                            v: strarr[2]
                        });
                    }
                    break;
                case 1:
                    exprObjArr.push({
                        type: "hasKey",
                        k: param_first
                    });
                    break;
            }
        });

        // 要返回的数据
        let redata;

        exprObjArr.forEach((exprObj, i) => {
            let exprKey = exprObj.k,
                exprValue = exprObj.v,
                exprType = exprObj.type,
                exprEqType = exprObj.eqType;

            switch (i) {
                case 0:
                    // 初次查找数据
                    redata = seekData(this, exprObj);
                    break;
                default:
                    // 筛选数据
                    redata = redata.filter(tarData => conditData(exprKey, exprValue, exprType, exprEqType, tarData) ? tarData : undefined);
            }
        });

        // hostKey过滤
        if (hostKey) {
            redata = redata.filter(e => (e.hostkey == hostKey) ? e : undefined);
        }

        return redata;
    },
    watch(expr, callback, arg3) {
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
            watchType = "watchOri";
        } else if (/\[.+\]/.test(expr)) {
            watchType = "seekOri";
        } else {
            watchType = "watchKey";
        }

        // 获取相应队列数据
        let tarExprObj = this[WATCHHOST].get(expr);
        if (!tarExprObj) {
            tarExprObj = new Set();

            this[WATCHHOST].set(expr, tarExprObj);
        }

        // 要保存的对象数据
        let saveObj = {
            modifys: [],
            isNextTick: 0,
            callback,
            // updateFunc
        };

        // 添加保存对象
        tarExprObj.add(saveObj);

        // 更新函数
        let updateFunc;

        // 根据类型调整
        switch (watchType) {
            case "watchOri":
                this.on('update', updateFunc = (e) => {
                    // 添加trend数据
                    saveObj.modifys.push(e.trend);

                    // 判断是否进入nextTick
                    if (saveObj.isNextTick) {
                        return;
                    }

                    // 锁上
                    saveObj.isNextTick = 1;

                    nextTick(() => {
                        // 监听整个数据
                        saveObj.callback.call(this, {
                            modifys: Array.from(saveObj.modifys)
                        });

                        // 事后清空modifys
                        saveObj.modifys.length = 0;

                        // 解锁
                        saveObj.isNextTick = 0;
                    });
                });
                break;
            case "watchKey":
                this.on('update', updateFunc = e => {
                    let {
                        trend
                    } = e;

                    if (trend.fromKey != expr) {
                        return;
                    }

                    // 添加改动
                    saveObj.modifys.push(trend);

                    // 判断是否进入nextTick
                    if (saveObj.isNextTick) {
                        return;
                    }

                    // 锁上
                    saveObj.isNextTick = 1;

                    nextTick(() => {
                        // 获取值
                        let val = this[expr];

                        // 监听整个数据
                        saveObj.callback.call(this, {
                            expr,
                            val,
                            modifys: Array.from(saveObj.modifys)
                        }, val);

                        // 事后清空modifys
                        saveObj.modifys.length = 0;

                        // 解锁
                        saveObj.isNextTick = 0;
                    });
                });

                let val = this[expr];
                (arg3 === true) && callback.call(this, {
                    expr,
                    val,
                    modifys: []
                }, val);
                break;
            case "seekOri":
                // 先记录旧的数据
                let sData = saveObj.oldVals = this.seek(expr);

                this.on('update', updateFunc = e => {
                    // 判断是否进入nextTick
                    if (saveObj.isNextTick) {
                        return;
                    }

                    // 锁上
                    saveObj.isNextTick = 1;

                    nextTick(() => {
                        let {
                            oldVals
                        } = saveObj;

                        let sData = this.seek(expr);

                        // 判断是否相等
                        let isEq = 1;
                        if (sData.length != oldVals.length) {
                            isEq = 0;
                        }
                        isEq && sData.some((e, i) => {
                            if (!(oldVals[i] == e)) {
                                isEq = 0;
                                return true;
                            }
                        });

                        // 不相等就触发callback
                        if (!isEq) {
                            saveObj.callback.call(this, {
                                expr,
                                old: oldVals,
                                val: sData
                            }, sData);
                        }

                        // 替换旧值
                        saveObj.oldVals = sData;

                        // 解锁
                        saveObj.isNextTick = 0;
                    });
                });

                // 执行初始callback
                callback({
                    expr,
                    val: sData
                }, sData);
                break;
        }

        // 设置绑定update的函数
        saveObj.updateFunc = updateFunc;
    },
    // 注销watch
    unwatch(expr, callback) {
        // 调整参数
        let arg1Type = getType(expr);
        if (/function/.test(arg1Type)) {
            callback = expr;
            expr = "";
        }

        let tarExprObj = this[WATCHHOST].get(expr);

        if (tarExprObj) {
            // 搜索相应的saveObj
            let saveObj;
            Array.from(tarExprObj).some(e => {
                if (e.callback === callback) {
                    saveObj = e;
                    return;
                }
            });

            if (saveObj) {
                // 去除update监听
                this.off('update', saveObj.updateFunc);

                // 删除对象
                tarExprObj.delete(saveObj);

                // 判断arr是否清空，是的话回收update事件绑定
                if (!tarExprObj.size) {
                    delete this[WATCHHOST].delete(expr);
                }
            } else {
                console.warn(`can't find this watch callback => `, callback);
            }
        }

        return this;
    },
    entrend(options) {
        // 目标数据
        let target = this;

        let {
            modifyId
        } = options;

        if (!modifyId) {
            throw "illegal trend data";
        }

        // 获取target
        options.keys.forEach(k => {
            target = target[k];
        });

        if (target) {
            // 添加_entrendModifyId
            target._entrendModifyId = modifyId;

            switch (options.genre) {
                case "arrayMethod":
                    target[options.methodName](...options.args);
                    break;
                case "delete":
                    delete target[options.key];
                    break;
                default:
                    target[options.key] = options.value;
                    break;
            }
        } else {
            console.warn(`data not found => `, this, options);
        }

        return this;
    },
    // 同步数据的方法
    sync(xdata, options, cover) {
        let optionsType = getType(options);

        let watchFunc, oppWatchFunc;

        switch (optionsType) {
            case "string":
                // 单键覆盖
                if (cover) {
                    xdata[options] = this[options];
                }

                this.watch(watchFunc = e => {
                    e.modifys.forEach(trend => {
                        if (trend.fromKey == options) {
                            xdata.entrend(trend);
                        }
                    });
                });
                xdata.watch(oppWatchFunc = e => {
                    e.modifys.forEach(trend => {
                        if (trend.fromKey == options) {
                            this.entrend(trend);
                        }
                    });
                });
                break;
            case "array":
                // 数组内的键覆盖
                if (cover) {
                    options.forEach(k => {
                        xdata[k] = this[k];
                    });
                }

                this.watch(watchFunc = e => {
                    e.modifys.forEach(trend => {
                        if (options.includes(trend.fromKey)) {
                            xdata.entrend(trend);
                        }
                    });
                });
                xdata.watch(oppWatchFunc = e => {
                    e.modifys.forEach(trend => {
                        if (options.includes(trend.fromKey)) {
                            this.entrend(trend);
                        }
                    });
                });
                break;
            case "object":
                let optionsKeys = Object.keys(options);

                // 映射key来绑定值
                let resOptions = {};

                // 映射对象内的数据合并
                if (cover) {
                    optionsKeys.forEach(k => {
                        let oppK = options[k];
                        xdata[oppK] = this[k];
                        resOptions[oppK] = k;
                    });
                } else {
                    optionsKeys.forEach(k => {
                        resOptions[options[k]] = k;
                    });
                }

                this.watch(watchFunc = e => {
                    e.modifys.forEach(trend => {
                        trend = cloneObject(trend);
                        let keysOne = trend.fromKey;

                        if (options.hasOwnProperty(keysOne)) {
                            if (isUndefined(trend.keys[0])) {
                                trend.key = options[keysOne];
                            } else {
                                trend.keys[0] = options[keysOne];
                            }
                            xdata.entrend(trend);
                        }
                    });
                });

                xdata.watch(watchFunc = e => {
                    e.modifys.forEach(trend => {

                        trend = cloneObject(trend);

                        let keysOne = trend.fromKey;

                        if (resOptions.hasOwnProperty(keysOne)) {
                            if (isUndefined(trend.keys[0])) {
                                trend.key = resOptions[keysOne];
                            } else {
                                trend.keys[0] = resOptions[keysOne];
                            }
                            this.entrend(trend);
                        }
                    });
                });

                break;
            default:
                // undefined
                if (cover) {
                    xdata.extend(this.object);
                }

                this.watch(watchFunc = e => {
                    e.modifys.forEach(trend => {
                        xdata.entrend(trend);
                    });
                });
                xdata.watch(oppWatchFunc = e => {
                    e.modifys.forEach(trend => {
                        this.entrend(trend);
                    });
                });
                break;
        }

        // 双方添加数据对称记录
        this[SYNCHOST].set(xdata, {
            // opp: xdata,
            oppWatchFunc,
            watchFunc
        });
        xdata[SYNCHOST].set(this, {
            // opp: this,
            oppWatchFunc: watchFunc,
            watchFunc: oppWatchFunc
        });

        return this;
    },
    // 注销sync绑定
    unsync(xdataObj) {
        let syncData = this[SYNCHOST].get(xdataObj);

        if (syncData) {
            let {
                oppWatchFunc,
                watchFunc
            } = syncData;

            // 解除绑定的watch函数
            this.unwatch(watchFunc);
            xdataObj.unwatch(oppWatchFunc);
            this[SYNCHOST].delete(xdataObj);
            xdataObj[SYNCHOST].delete(this);
        } else {
            console.warn("not found => ", xdataObj);
        }

        return this;
    },
    virData(options) {
        // 转换为xdata
        let cloneData = this.object;
        mapData(cloneData, options);
        cloneData = createXData(cloneData);

        let {
            mapping,
            type,
            key
        } = options;

        let reserveMapping = {};

        Object.keys(mapping).forEach(k => {
            let k2 = mapping[k];
            !isUndefined(k2) && (reserveMapping[k2] = k);
        });

        let _thisUpdateFunc, selfUpdataFunc;
        switch (type) {
            case "mapKey":
                this.on('update', _thisUpdateFunc = e => {
                    let {
                        trend
                    } = e;

                    trend = cloneObject(trend);

                    // 修正trend的数据
                    if (trend.args) {
                        mapData(trend.args, options);
                    } else if (trend.value) {
                        mapData(trend.value, options);
                    }

                    let tarKey = mapping[trend.key];
                    if (!isUndefined(tarKey)) {
                        // 修正trend数据
                        trend.key = tarKey;
                    }
                    cloneData.entrend(trend);
                });
                cloneData.on('update', selfUpdataFunc = e => {
                    let {
                        trend
                    } = e;

                    trend = cloneObject(trend);

                    if (trend.args) {
                        mapData(trend.args, {
                            type,
                            // key,
                            mapping: reserveMapping
                        });
                    } else if (trend.value) {
                        mapData(trend.value, {
                            type,
                            // key,
                            mapping: reserveMapping
                        });
                    }

                    let tarKey = reserveMapping[trend.key];

                    if (!isUndefined(tarKey)) {
                        trend.key = tarKey;
                    }
                    this.entrend(trend);
                });
                break;
            case "mapValue":
                this.on('update', _thisUpdateFunc = e => {
                    let {
                        trend
                    } = e;

                    trend = cloneObject(trend);

                    // 修正trend的数据
                    if (trend.args) {
                        mapData(trend.args, options);
                    } else if (trend.value) {
                        mapData(trend.value, options);
                    }

                    if (trend.key == key) {
                        let val = trend.value;
                        if (mapping.hasOwnProperty(val)) {
                            // 修正value
                            trend.value = mapping[val];
                        }
                    }

                    // 同步
                    cloneData.entrend(trend);

                });
                cloneData.on('update', selfUpdataFunc = e => {
                    let {
                        trend
                    } = e;

                    trend = cloneObject(trend);

                    if (trend.args) {
                        mapData(trend.args, {
                            type,
                            key,
                            mapping: reserveMapping
                        });
                    } else if (trend.value) {
                        mapData(trend.value, {
                            type,
                            key,
                            mapping: reserveMapping
                        });
                    }

                    if (trend.key == key) {
                        let val = trend.value;
                        if (reserveMapping.hasOwnProperty(val)) {
                            // 修正value
                            trend.value = reserveMapping[val];
                        }
                    }

                    // 同步
                    this.entrend(trend);
                });
                break;
        }

        // 修正remove方法
        defineProperty(cloneData, "remove", {
            value(...args) {
                if (!args.length) {
                    // 确认删除自身，清除this的函数
                    this.off('update', _thisUpdateFunc);
                    cloneData.off('update', selfUpdataFunc);
                    _thisUpdateFunc = selfUpdataFunc = cloneData = null;
                }
                XDataFn.remove.call(cloneData, ...args);
            }
        });

        return cloneData;
    },
    // 删除相应Key的值
    removeByKey(key) {
        // 删除子数据
        if (/\D/.test(key)) {
            // 非数字
            delete this[key];
        } else {
            // 纯数字，术语数组内元素，通过splice删除
            this.splice(parseInt(key), 1);
        }
    },
    // 删除值
    remove(value) {
        if (isUndefined(value)) {
            // 删除自身
            let {
                parent
            } = this;

            if (parent) {
                // 删除
                parent.removeByKey(this.hostkey);
            } else {
                clearXData(this);
            }
        } else {
            if (isXData(value)) {
                (value.parent == this) && this.removeByKey(value.hostkey);
            } else {
                let tarId = this.indexOf(value);
                if (tarId > -1) {
                    this.removeByKey(tarId);
                }
            }
        }
    },
    // 添加到前面
    before(data) {
        if (/\D/.test(this.hostkey)) {
            console.error(`can't use before in this data =>`, this, data);
            throw "";
        }
        this.parent.splice(this.hostkey, 0, data);
        return this;
    },
    // 添加到后面
    after(data) {
        if (/\D/.test(this.hostkey)) {
            console.error(`can't use after in this data =>`, this, data);
            throw "";
        }
        this.parent.splice(this.hostkey + 1, 0, data);
        return this;
    },
    // push的去重版本
    add(data) {
        !this.includes(data) && this.push(data);
    },
    clone() {
        return createXData(this.object);
    },
    reset(value) {
        let valueKeys = Object.keys(value);

        // 删除本身不存在的key
        Object.keys(this).forEach(k => {
            if (!valueKeys.includes(k) && k !== "length") {
                delete this[k];
            }
        });

        assign(this, value);
        return this;
    },
    extend(...args) {
        assign(this, ...args);
    }
});


defineProperties(XDataFn, {
    // 直接返回object
    "object": {
        get() {
            let obj = {};

            Object.keys(this).forEach(k => {
                let val = this[k];

                if (isXData(val)) {
                    obj[k] = val.object;
                } else {
                    obj[k] = val;
                }
            });

            return obj;
        }
    },
    "string": {
        get() {
            return JSON.stringify(this.object);
        }
    },
    "root": {
        get() {
            let root = this;
            while (root.parent) {
                root = root.parent;
            }
            return root;
        }
    },
    "prev": {
        get() {
            if (!/\D/.test(this.hostkey) && this.hostkey > 0) {
                return this.parent[this.hostkey - 1];
            }
        }
    },
    "next": {
        get() {
            if (!/\D/.test(this.hostkey)) {
                return this.parent[this.hostkey + 1];
            }
        }
    }
});