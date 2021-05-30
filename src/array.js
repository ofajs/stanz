// 不影响数据原结构的方法，重新做钩子
['concat', 'every', 'filter', 'find', 'findIndex', 'forEach', 'map', 'slice', 'some', 'indexOf', 'lastIndexOf', 'includes', 'join'].forEach(methodName => {
    let arrayFnFunc = Array.prototype[methodName];
    if (arrayFnFunc) {
        defineProperties(XData.prototype, {
            [methodName]: { value: arrayFnFunc }
        });
    }
});

// 原生splice方法
const arraySplice = Array.prototype.splice;

extend(XData.prototype, {
    splice(index, howmany, ...items) {
        let self = this[XDATASELF];

        // items修正
        items = items.map(e => {
            let valueType = getType(e);
            if (valueType == "array" || valueType == "object") {
                e = new XData(e);
                e.owner.add(self);
            }

            return e;
        })

        // 套入原生方法
        let rmArrs = arraySplice.call(self, index, howmany, ...items);

        rmArrs.forEach(e => isxdata(e) && e.owner.delete(self));

        // 改动冒泡
        emitUpdate(this, {
            xid: this.xid,
            name: "splice",
            args: [index, howmany, ...items]
        });

        return rmArrs;
    },
    unshift(...items) {
        this.splice(0, 0, ...items);
        return this.length;
    },
    push(...items) {
        this.splice(this.length, 0, ...items);
        return this.length;
    },
    shift() {
        return this.splice(0, 1)[0];
    },
    pop() {
        return this.splice(this.length - 1, 1)[0];
    }
});

['sort', 'reverse'].forEach(methodName => {
    // 原来的数组方法
    const arrayFnFunc = Array.prototype[methodName];

    if (arrayFnFunc) {
        defineProperties(XData.prototype, {
            [methodName]: {
                value(...args) {
                    let reval = arrayFnFunc.apply(this[XDATASELF], args)

                    emitUpdate(this, {
                        xid: this.xid,
                        name: methodName
                    });

                    return reval;
                }
            }
        });
    }
});