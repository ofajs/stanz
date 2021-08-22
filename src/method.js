extend(XData.prototype, {
    seek(expr) {
        let arr = [];

        if (!isFunction(expr)) {
            let f = new Function(`with(this){return ${expr}}`)
            expr = _this => {
                try {
                    return f.call(_this, _this);
                } catch (e) { }
            };
        }

        if (expr.call(this, this)) {
            arr.push(this);
        }

        Object.values(this).forEach(e => {
            if (isxdata(e)) {
                arr.push(...e.seek(expr));
            }
        });

        return arr;
    },
    // watch异步收集版本
    watchTick(func, time) {
        return this.watch(collect(func, time));
    },
    // 监听直到表达式成功
    watchUntil(expr) {
        let isFunc = isFunction(expr);
        if (!isFunc && /[^=><]=[^=]/.test(expr)) {
            throw 'cannot use single =';
        }

        return new Promise(resolve => {
            // 忽略错误
            let exprFun = isFunc ? expr.bind(this) : new Function(`
        try{with(this){
            return ${expr}
        }}catch(e){}`).bind(this);

            let f;
            const wid = this.watch(f = () => {
                let reVal = exprFun();
                if (reVal) {
                    this.unwatch(wid);
                    resolve(reVal);
                }
            });
            f();
        });
    },
    // 监听相应key
    watchKey(obj, immediately) {
        if (immediately) {
            Object.keys(obj).forEach(key => obj[key].call(this, this[key]));
        }

        let oldVal = {};
        Object.entries(this).forEach(([k, v]) => {
            oldVal[k] = v;
        });
        return this.watch(collect((arr) => {
            Object.keys(obj).forEach(key => {
                // 当前值
                let val = this[key];

                if (oldVal[key] !== val) {
                    obj[key].call(this, val);
                } else if (isxdata(val)) {
                    // 判断改动arr内是否有当前key的改动
                    let hasChange = arr.some(e => {
                        let p = e.path[1];

                        // if (p == oldVal[key]) {
                        return p == val;
                    });

                    if (hasChange) {
                        obj[key].call(this, val);
                    }
                }

                oldVal[key] = val;
            });
        }));
    },
    // 转换为json数据
    toJSON() {
        let obj = {};

        let isPureArray = true;
        let maxId = 0;

        Object.keys(this).forEach(k => {
            let val = this[k];

            if (!/\D/.test(k)) {
                k = parseInt(k);
                if (k > maxId) {
                    maxId = k;
                }
            } else {
                isPureArray = false;
            }

            if (isxdata(val)) {
                val = val.toJSON();
            }

            obj[k] = val;
        });

        if (isPureArray) {
            obj.length = maxId + 1;
            obj = Array.from(obj);
        }

        const xid = this.xid;
        defineProperties(obj, {
            xid: {
                get: () => xid
            }
        });

        return obj;
    },
    // 转为字符串
    toString() {
        return JSON.stringify(this.toJSON());
    }
});