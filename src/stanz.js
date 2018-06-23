((glo) => {
    // base function
    // 获取类型
    let objectToString = Object.prototype.toString;
    const getType = value => objectToString.call(value).toLowerCase().replace(/(\[object )|(])/g, '');
    const {
        defineProperty,
        assign
    } = Object;

    const getChangeArr = (_this, key) => {
        let {
            __s
        } = _this;

        return __s[key] || (__s[key] = []);
    }

    // base class
    // 特殊对象
    var StanzObject = function (obj) {
        let sObj = {};
        defineProperty(this, "__s", {
            get: () => sObj
        });
        
        for (let k in obj) {
            this.set(k, obj[k]);
        }
    };
    StanzObject.prototype = {
        // 设置属性的方法
        set(key, val) {
            let type = getType(val);

            if (!(val instanceof StanzObject) && !(val instanceof StanzArray)) {
                switch (type) {
                    case "object":
                        val = new StanzObject(val);
                        break;
                    case "array":
                        val = new StanzArray(val);
                }
            }

            let changeArr = getChangeArr(this, key);

            defineProperty(this, key, {
                configurable: true,
                enumerable: true,
                get() {
                    return val;
                },
                set(v) {
                    let beforeVal = val
                    val = v;
                    changeArr.forEach(func => {
                        func(v, beforeVal, v);
                    });
                }
            });

            return val;
        },
        // 监听改动
        watch(key, func) {
            getChangeArr(this, key).push(func)
        },
        // 取消监听
        unwatch(key, func) {
            let changeArr = getChangeArr(this, key);
            if (func) {
                // 移除相应函数
                let id = changeArr.indexOf(func);
                changeArr.splice(id, 1);
            } else if (key) {
                // 移除所有函数
                changeArr.splice(0, changeArr.length)
            }
        }
    };

    // 特殊数组
    var StanzArray = function (arr) {
        this.splice(0, 0, ...arr);
    }
    let StanzArrayFn = StanzArray.prototype = Object.create(Array.prototype);
    assign(StanzArrayFn, {
        // 查找某个因素
        find(expr) {

        },
        // 映射元素的方法，机的要设置
        upon(func) {
            this._uponFunc = func;
            this.forEach(e => func(e));
        }
    });

    // base data
    let stanzDatabase = new StanzObject({});

    //main
    let stanz = (obj, options) => {
        let defaults = {
            // 唯一key
            id: "",
            // 为了覆盖数据，区分覆盖时机
            mark: "",
            // 直接进行描述
            descript: ""
        };
        assign(defaults, options);

        // 返回目标对象
        let tar;

        if (!(obj instanceof StanzObject) && !(obj instanceof StanzArray)) {
            // 类型
            let type = getType(obj);

            // 根据类型进行初始化
            switch (type) {
                case "object":
                    tar = new StanzObject(obj);
                    break;
                case "array":
                    tar = new StanzArray(obj);
                default:
                    console.error('it must be normal object or array => ', obj);
            }
        }

        return tar;
    }

    assign(stanz, {
        // 转换
        from: (...args) => stanz(...args),
        // 根据id获取数据
        get(id) {},
        // 获取描述
        getDescById(id) {},
        // 设置描述映射对象
        setMapping(obj) {}
    });

    // 获取基础数据对象
    defineProperty(stanz, 'data', {
        get: () => stanzDatabase
    });

    // init
    glo.stanz = stanz;
})(window);