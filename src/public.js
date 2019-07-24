const getRandomId = () => Math.random().toString(32).substr(2);
let objectToString = Object.prototype.toString;
const getType = value => objectToString.call(value).toLowerCase().replace(/(\[object )|(])/g, '');
const isUndefined = val => val === undefined;
const isFunction = val => getType(val).includes("function");
const cloneObject = obj => JSON.parse(JSON.stringify(obj));

const nextTick = (() => {
    let inTick = false;

    // 定位对象寄存器
    let nextTickMap = new Map();

    return (fun, key) => {
        if (!inTick) {
            inTick = true;
            setTimeout(() => {
                if (nextTickMap.size) {
                    nextTickMap.forEach(cFun => {
                        cFun();
                    });
                }

                nextTickMap.clear();
                inTick = false;
            }, 0);
        }

        if (!key) {
            key = getRandomId();
        }

        nextTickMap.set(key, fun);
    };
})();

// 触发update事件
const emitUpdate = (target, name, args, assingData) => {
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
        args: cloneObject(args),
        mid
    };

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

// 清理XData数据
const clearXData = (xobj) => {
    if (!(xobj instanceof XData)) {
        return;
    }
    let _this = xobj[XDATASELF];
    if (_this) {
        _this.index = undefined;
        _this.parent = undefined;
    }

    // 解除virData绑定
    if (xobj instanceof VirData) {
        let { mappingXData } = xobj;
        let tarHostData = mappingXData[VIRDATAHOST].find(e => e.data === _this);
        let { leftUpdate, rightUpdate } = tarHostData;
        xobj.off("update", rightUpdate);
        mappingXData.off("update", leftUpdate);
        _this.mappingXData = null;
    }

    // 清除sync
    if (_this[SYNCSHOST]) {
        for (let [oppXdata, e] of _this[SYNCSHOST]) {
            _this.unsync(oppXdata);
        }
    }

    if (_this[VIRDATAHOST]) {
        _this[VIRDATAHOST].forEach(e => {
            let { data, leftUpdate, rightUpdate } = e;
            data.off("update", rightUpdate);
            _this.off("update", leftUpdate);
            data.mappingXData = null;
        });
        _this[VIRDATAHOST].splice(0);
    }
    _this[WATCHHOST] && _this[WATCHHOST].clear();
    _this[EVENTS] && _this[EVENTS].clear();
}

/**
 * 生成XData数据
 * @param {Object} obj 对象值，是Object就转换数据
 * @param {Object} options 附加信息，记录相对父层的数据
 */
const createXData = (obj, options) => {
    let redata = obj;
    switch (getType(obj)) {
        case "object":
        case "array":
            redata = new XData(obj, options);
            break;
    }

    return redata;
};