const getRandomId = () => Math.random().toString(32).substr(2);
let objectToString = Object.prototype.toString;
const getType = value => objectToString.call(value).toLowerCase().replace(/(\[object )|(])/g, '');
const isUndefined = val => val === undefined;
const isFunction = val => getType(val).includes("function");
const cloneObject = obj => obj instanceof XData ? obj.object : JSON.parse(JSON.stringify(obj));

const nextTick = (() => {
    let isDebug = document.currentScript.getAttribute("debug") !== null;
    if (isDebug) {
        let nMap = new Map();
        return (fun, key) => {
            if (!key) {
                key = getRandomId();
            }

            let timer = nMap.get(key);
            clearTimeout(timer);
            nMap.set(key, setTimeout(() => {
                fun();
                nMap.delete(key);
            }));
        };
    }

    // 定位对象寄存器
    let nextTickMap = new Map();

    const pnext = (func) => Promise.resolve().then(() => func())

    if (typeof process === "object" && process.nextTick) {
        pnext = process.nextTick;
    }

    let inTick = false;
    return (fun, key) => {
        if (!key) {
            key = getRandomId();
        }

        nextTickMap.set(key, { key, fun });

        if (inTick) {
            return;
        }

        inTick = true;

        pnext(() => {
            if (nextTickMap.size) {
                nextTickMap.forEach(({ key, fun }) => {
                    try {
                        fun();
                    } catch (e) {
                        console.error(e);
                    }
                    nextTickMap.delete(key);
                });
            }

            nextTickMap.clear();
            inTick = false;
        });
    };
})();

// 触发update事件
const emitUpdate = (target, name, args, assingData, beforeCall) => {
    let mid;

    if (target._modifyId) {
        mid = target._modifyId;
    } else {
        mid = getRandomId();
    }

    getXDataProp(target, MODIFYIDS).push(mid);
    recyclModifys(target);

    // 事件冒泡
    let event = new XEvent({
        type: "update",
        target: target[PROXYTHIS] || target
    });

    Object.defineProperties(event, {
        trend: {
            get() {
                return new XDataTrend(event);
            }
        }
    });

    assingData && Object.assign(event, assingData);

    // 设置modify数据
    event.modify = {
        name,
        args: args.map(e => {
            if (e instanceof XData) {
                return e.object;
            } else if (e instanceof Object) {
                return cloneObject(e);
            }
            return e;
        }),
        mid
    };

    beforeCall && (beforeCall(event));

    // 冒泡update
    target.emit(event);
}

// 清理modifys
let recyTimer, recyArr = new Set();
const recyclModifys = (xobj) => {
    // 不满50个别瞎折腾
    if (xobj[MODIFYIDS].length < 50) {
        return;
    }

    clearTimeout(recyTimer);
    recyArr.add(xobj);
    recyTimer = setTimeout(() => {
        let copyRecyArr = Array.from(recyArr);
        setTimeout(() => {
            copyRecyArr.forEach(e => recyclModifys(e));
        }, 1000);
        recyArr.forEach(e => {
            let modifys = e[MODIFYIDS]
            // 清除掉一半
            modifys.splice(0, Math.ceil(modifys.length / 2));
        });
        recyArr.clear();
    }, 3000)
}

const clearXMirror = (xobj) => {
    xobj.index = undefined;
    xobj.parent = undefined;
    // xobj[XMIRROR_SELF].mirrorHost.off("update", xobj[XMIRRIR_BIND_UPDATA]);
    xobj[XMIRROR_SELF].mirrorHost.off("update", xobj[XMIRRIR_UPDATA_BINDER]);
    xobj[XMIRROR_SELF].mirrorHost = undefined;
}

// 清理XData数据
const clearXData = (xobj) => {
    if (xobj instanceof XMirror) {
        clearXMirror(xobj);
        return;
    }
    if (!(xobj instanceof XData)) {
        return;
    }
    let _this = xobj[XDATASELF];
    if (_this) {
        try {
            // 防止index和parent被重定向导致失败
            _this.index = undefined;
            _this.parent = undefined;
        } catch (e) { }
    }

    // 解除virData绑定
    // if (xobj instanceof VirData) {
    //     let { mappingXData } = xobj;
    //     let tarHostData = mappingXData[VIRDATAHOST].find(e => e.data === _this);
    //     let { leftUpdate, rightUpdate } = tarHostData;
    //     xobj.off("update", rightUpdate);
    //     mappingXData.off("update", leftUpdate);
    //     _this.mappingXData = null;
    // }

    // 清除sync
    if (_this[SYNCSHOST]) {
        for (let [oppXdata, e] of _this[SYNCSHOST]) {
            xobj.unsync(oppXdata);
        }
    }

    // if (_this[VIRDATAHOST]) {
    //     _this[VIRDATAHOST].forEach(e => {
    //         let { data, leftUpdate, rightUpdate } = e;
    //         data.off("update", rightUpdate);
    //         _this.off("update", leftUpdate);
    //         data.mappingXData = null;
    //     });
    //     _this[VIRDATAHOST].splice(0);
    // }

    // 触发清除事件
    _this.emit("clearxdata");

    _this[WATCHHOST] && _this[WATCHHOST].clear();
    _this[EVENTS] && _this[EVENTS].clear();
    // _this[WATCHEXPRHOST] && _this[WATCHEXPRHOST].clear();

    // 子数据也全部回收
    // Object.keys(_this).forEach(key => {
    //     let val = _this[key];
    //     if (/\D/.test(key) && val instanceof XData) {
    //         clearXData(val);
    //     }
    // });
    // _this.forEach(e => clearXData(e));
}

/**
 * 生成XData数据
 * @param {Object} obj 对象值，是Object就转换数据
 * @param {Object} options 附加信息，记录相对父层的数据
 */
const createXData = (obj, options) => {
    if (obj instanceof XMirror) {
        return obj;
    }
    let redata = obj;
    switch (getType(obj)) {
        case "object":
        case "array":
            redata = new XData(obj, options);
            break;
    }

    return redata;
};

/**
 * 将 stanz 转换的对象再转化为 children 结构的对象
 * @param {Object} obj 目标对象
 * @param {String} childKey 数组寄存属性
 */
const toNoStanz = (obj, childKey) => {
    if (obj instanceof Array) {
        return obj.map(e => toNoStanz(e, childKey));
    } else if (obj instanceof Object) {
        let newObj = {};
        let childs = [];
        Object.keys(obj).forEach(k => {
            if (!/\D/.test(k)) {
                childs.push(toNoStanz(obj[k], childKey));
            } else {
                newObj[k] = toNoStanz(obj[k]);
            }
        });
        if (childs.length) {
            newObj[childKey] = childs;
        }
        return newObj;
    } else {
        return obj;
    }
}

// seekdata是否符合条件
function judgeSeekData(val, expr) {
    if (!(val instanceof XData)) {
        return false;
    }
    try {
        return expr.call(val, val)
    } catch (e) { }
}

// 鉴定的方法
let seekFunc = (val, expr, arr) => {
    if (judgeSeekData(val, expr)) {
        arr.push(val);
    }

    if (val instanceof XData) {
        arr.push(...val.seek(expr, false));
    }
}