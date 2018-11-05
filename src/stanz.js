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
    } = Object;

    // 设置不可枚举的方法
    const setNotEnumer = (tar, obj) => {
        for (let k in obj) {
            defineProperty(tar, k, {
                // enumerable: false,
                writable: true,
                value: obj[k]
            });
        }
    }

    //改良异步方法
    const nextTick = (() => {
        let isTick = false;
        let nextTickArr = [];
        return (fun) => {
            if (!isTick) {
                isTick = true;
                setTimeout(() => {
                    for (let i = 0; i < nextTickArr.length; i++) {
                        nextTickArr[i]();
                    }
                    nextTickArr = [];
                    isTick = false;
                }, 0);
            }
            nextTickArr.push(fun);
        };
    })();

    // business function
    function XData(obj) {
        // 数组的长度
        let length = 0;

        // 非数组数据合并
        Object.keys(obj).forEach(k => {
            // 值
            let value = obj[k];

            if (!/\D/.test(k)) {
                // 数字key
                k = parseInt(k);

                if (k >= length) {
                    length = k + 1;
                }
            }

            // 设置值
            this[k] = value;
        });

        // 设置数组长度
        setNotEnumer(this, {
            length
        });
    }
    let XDataFn = {};
    XData.prototype = XDataFn;

    // 数组通用方法
    // 可运行的方法
    ['concat', 'every', 'filter', 'find', 'findIndex', 'forEach', 'map', 'slice', 'some'].forEach(methodName => {
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

    // 会影响数组结构的方法
    ['pop', 'push', 'reverse', 'sort', 'splice', 'shift', 'unshift'].forEach(methodName => {
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

    // 设置数组上的方法
    setNotEnumer(XDataFn, {
        // 设置值得方法
        set(key, value) {

        }
    });

    // main 
    const createXData = (obj) => new XData(obj);

    // init
    glo.stanz = (obj = {}) => createXData(obj);
})(window);