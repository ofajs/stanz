// 重构Array的所有方法

// 不影响数据原结构的方法，重新做钩子
['concat', 'every', 'filter', 'find', 'findIndex', 'forEach', 'map', 'slice', 'some', 'indexOf', 'lastIndexOf', 'includes', 'join'].forEach(methodName => {
    let arrayFnFunc = Array.prototype[methodName];
    if (arrayFnFunc) {
        Object.defineProperty(XData.prototype, methodName, {
            value(...args) {
                return arrayFnFunc.apply(this, args);
            }
        });
    }
});

// 几个会改变数据结构的方法
['pop', 'push', 'reverse', 'splice', 'shift', 'unshift'].forEach(methodName => {
    // 原来的数组方法
    let arrayFnFunc = Array.prototype[methodName];

    if (arrayFnFunc) {
        Object.defineProperty(XData.prototype, methodName, {
            value(...args) {
                // 重构新参数
                let newArgs = [];

                let _this = this[XDATASELF];

                args.forEach(val => {
                    if (val instanceof XData) {
                        let xSelf = val[XDATASELF];
                        xSelf.remove();
                        newArgs.push(xSelf);
                    } else {
                        // 转化内部数据
                        let newVal = createXData(val, {
                            parent: _this
                        });
                        newArgs.push(newVal);
                    }
                });

                // 返回值，都是被删除的数据，内部数据清空并回收
                let returnVal = arrayFnFunc.apply(_this, newArgs);

                // 重置index
                _this.forEach((e, i) => {
                    if (e instanceof XData) {
                        e.index = i;
                    }
                });

                // 删除returnVal的相关数据
                switch (methodName) {
                    case "shift":
                    case "pop":
                        if (returnVal instanceof XData) {
                            clearXData(returnVal);
                        }
                        break;
                    case "splice":
                        returnVal.forEach(e => {
                            if (e instanceof XData) {
                                clearXData(e);
                            }
                        });
                }

                emitUpdate(_this, methodName, args);

                return returnVal;
            }
        });
    }
});

Object.defineProperty(XData.prototype, "sort", {
    /**
     * 对数组进行排序操作
     * @param {Function|Array} arg 排序参数
     */
    value(arg) {
        let args = [arg];
        let _this = this[XDATASELF];
        let oldThis = Array.from(_this);
        if (isFunction(arg)) {
            Array.prototype.sort.call(_this, arg);

            // 重置index
            // 记录重新调整的顺序
            _this.forEach((e, i) => {
                if (e instanceof XData) {
                    e.index = i;
                }
            });
            let orders = oldThis.map(e => e.index);
            args = [orders];
            oldThis = null;
        } else if (arg instanceof Array) {
            arg.forEach((aid, id) => {
                let tarData = _this[aid] = oldThis[id];
                tarData.index = aid;
            });
        }

        emitUpdate(_this, "sort", args);

        return this;
    }
});