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
    watch(expr, callback) {
        // 调整参数
        let arg1Type = getType(expr);
        if (/function/.test(arg1Type)) {
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
            tarExprObj = {
                // 是否已经有nextTick
                isNextTick: 0,
                // 事件函数存放数组
                arr: new Set(),
                // 空expr使用的数据
                modifys: [],
                // 注册的update事件函数
                // updateFunc
            }
            this[WATCHHOST].set(expr, tarExprObj);
        }

        // 添加callback
        tarExprObj.arr.add(callback);

        if (!tarExprObj.updateFunc) {
            let updateFunc;

            // 根据类型调整
            switch (watchType) {
                case "watchOri":
                    this.on('update', updateFunc = (e) => {
                        // 添加trend数据
                        tarExprObj.modifys.push(e.trend);

                        // 判断是否进入nextTick
                        if (tarExprObj.isNextTick) {
                            return;
                        }

                        // 锁上
                        tarExprObj.isNextTick = 1;

                        nextTick(() => {
                            // 监听整个数据
                            tarExprObj.arr.forEach(callback => {
                                callback.call(this, {
                                    modifys: Array.from(tarExprObj.modifys)
                                });
                            });

                            // 事后清空modifys
                            tarExprObj.modifys.length = 0;

                            // 解锁
                            tarExprObj.isNextTick = 0;
                        });
                    });
                    break;
                case "watchKey":
                    this.on('update', updateFunc = e => {
                        let {
                            trend
                        } = e;

                        if (trend.fromKey !== expr) {
                            return;
                        }

                        // 添加改动
                        tarExprObj.modifys.push(trend);

                        // 判断是否进入nextTick
                        if (tarExprObj.isNextTick) {
                            return;
                        }

                        // 锁上
                        tarExprObj.isNextTick = 1;

                        nextTick(() => {
                            // 监听整个数据
                            tarExprObj.arr.forEach(callback => {
                                callback.call(this, {
                                    expr,
                                    val: this[expr],
                                    modifys: Array.from(tarExprObj.modifys)
                                });
                            });

                            // 事后清空modifys
                            tarExprObj.modifys.length = 0;

                            // 解锁
                            tarExprObj.isNextTick = 0;
                        });
                    });
                    break;
                case "seekOri":
                    // 判断是否进入nextTick
                    if (tarExprObj.isNextTick) {
                        return;
                    }

                    // 先记录旧的数据
                    let oldVals = this.seek(expr);

                    // 锁上
                    tarExprObj.isNextTick = 1;

                    nextTick(() => {
                        let sData = this.seek(expr);

                        // 判断是否相等
                        let isEq = 1;
                        if (sData.length != oldVals.length) {
                            isEq = 0;
                        }
                        isEq && sData.some((e, i) => {
                            if (!isEqual(oldVals[i], e)) {
                                isEq = 0;
                                return true;
                            }
                        });

                        // 不相等就触发callback
                        if (!isEq) {
                            tarExprObj.arr.forEach(callback => {
                                callback.call(this, {
                                    expr,
                                    old: oldVals,
                                    val: sData
                                });
                            });
                        }

                        // 解锁
                        tarExprObj.isNextTick = 0;
                    });
                    break;
            }

            // 设置绑定update的函数
            tarExprObj.updateFunc = updateFunc;
        }

        // 判断是否expr
        if (watchType == "seekOri") {
            let sData = this.seek(expr);
            callback({
                expr,
                val: sData
            });
        }
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
            tarExprObj.arr.delete(callback);

            // 判断arr是否清空，是的话回收update事件绑定
            if (!tarExprObj.arr.length) {
                this.off('update', tarExprObj.updateFunc);
                delete tarExprObj.updateFunc;
                delete this[WATCHHOST].delete(expr);
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

        return this;
    },
    // 同步数据的方法
    sync(xdata, options, cover = false) {

    },
    unsync() {}
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
    }
});