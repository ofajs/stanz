// 数组通用方法
// 可运行的方法
['concat', 'every', 'filter', 'find', 'findIndex', 'forEach', 'map', 'slice', 'some', 'indexOf', 'includes', 'join'].forEach(methodName => {
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

// 设置 ArrayFn
const arrayFn = {};

// 几个会改变数据结构的方法
['pop', 'push', 'reverse', 'splice', 'shift', 'unshift', 'sort'].forEach(methodName => {
    // 原来的数组方法
    let arrayFnFunc = Array.prototype[methodName];

    arrayFn[methodName] = arrayFnFunc;

    // 存在方法的情况下加入
    if (arrayFnFunc) {
        defineProperty(XDataFn, methodName, {
            writable: true,
            value(...args) {
                // 获取到_entrendModifyId就立刻删除
                let modifyId = this._entrendModifyId;
                if (modifyId) {
                    delete this._entrendModifyId;
                }

                // 其他方式就要通过主体entrend调整
                return entrend({
                    genre: "arrayMethod",
                    args,
                    methodName,
                    modifyId,
                    receiver: this
                });
            }
        });
    }
});

assign(arrayFn, {
    // 改良的sort方法，可以直接传入置换顺序对象
    sort(func) {
        if (func instanceof Array) {
            let backupThis = this.slice();

            func.forEach((k, i) => {
                this[k] = backupThis[i];
            });

            return this;
        } else {
            // 参数和原生sort无区别，直接代入
            return Array.prototype.sort.call(this, func);
        }
    }
});