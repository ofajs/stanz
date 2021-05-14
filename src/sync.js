/**
 * 根据key值同步数据
 * @param {String} key 要同步的key
 * @param {Trend} e 趋势数据
 * @param {XData} xdata 同步覆盖的数据对象
 */
const pubSyncByKey = (key, e, xdata) => {
    e.trends.forEach(trend => {
        if (trend.fromKey === key) {
            xdata.entrend(trend);
        }
    });
}

/**
 * 根据key数组同步数据
 * @param {String} keyArr 要同步的key数组
 * @param {Trend} e 趋势数据
 * @param {XData} xdata 同步覆盖的数据对象
 */
const pubSyncByArray = (keyArr, e, xdata) => {
    e.trends.forEach(trend => {
        if (keyArr.includes(trend.fromKey)) {
            xdata.entrend(trend);
        }
    });
}

/**
 * 根据映射对象同步数据
 * @param {Map} optMap key映射对象
 * @param {Trend} e 趋势数据
 * @param {XData} xdata 同步覆盖的数据对象
 */
const pubSyncByObject = (optMap, e, xdata) => {
    let cloneTrends = cloneObject(e.trends);
    cloneTrends.forEach(trend => {
        trend = new XDataTrend(trend);
        let { fromKey } = trend;
        // 修正key值
        if (!isUndefined(fromKey)) {
            let mKey = optMap.get(fromKey)
            if (mKey) {
                trend.fromKey = mKey;
                xdata.entrend(trend);
            }
        }
    });
}

/**
 * 转换可以直接设置在XData上的值
 * @param {*} value 如果是XData，转换为普通对象数据
 */
const getNewSyncValue = (value) => {
    (value instanceof XData) && (value = value.object);
    return value;
};

// const virDataTrans = (self, target, callback) => {
//     Object.keys(self).forEach(key => {
//         let val = self[key];

//         if (val instanceof Object) {
//             if (!target[key]) {
//                 if (target.setData) {
//                     target.setData(key, {})
//                 } else {
//                     target[key] = {};
//                 }
//             }

//             let vdata = target[key];

//             virDataTrans(val, vdata, callback);
//         } else {
//             let keyValue = callback([key, val], {
//                 self, target
//             });
//             if (keyValue) {
//                 let [newKey, newValue] = keyValue;
//                 target[newKey] = newValue;
//             }
//         }
//     });
// }

// const entrendByCall = (target, e, callback) => {
//     let { trend } = e;
//     if (trend) {
//         switch (trend.name) {
//             case "setData":
//                 let value = trend.args[1];
//                 if (value instanceof Object) {
//                     let obj = {};
//                     virDataTrans(value, obj, callback);
//                     trend.args[1] = obj;
//                 } else if (!isUndefined(value)) {
//                     trend.args = callback(trend.args, {
//                         event: e
//                     });
//                 }
//                 break;
//             default:
//                 // 其他数组的话，修正参数
//                 trend.args = trend.args.map(value => {
//                     let nVal = value;
//                     if (value instanceof Object) {
//                         nVal = {};
//                         virDataTrans(value, nVal, callback);
//                     }
//                     return nVal;
//                 });
//                 break;
//         }
//         target.entrend(trend);
//     }
// }

const SyncMethods = {
    /**
     * 同步数据
     * @param {XData} xdata 需要同步的数据
     */
    sync(xdata, opts, isCoverRight) {
        let optsType = getType(opts);

        let leftFun, rightFun;

        switch (optsType) {
            case "string":
                if (isCoverRight) {
                    xdata.setData(opts, getNewSyncValue(this[opts]));
                }

                leftFun = e => pubSyncByKey(opts, e, xdata)
                rightFun = e => pubSyncByKey(opts, e, this)
                break;
            case "array":
                if (isCoverRight) {
                    opts.forEach(key => {
                        xdata.setData(key, getNewSyncValue(this[key]));
                    });
                }

                leftFun = e => pubSyncByArray(opts, e, xdata)
                rightFun = e => pubSyncByArray(opts, e, this)
                break;
            case "object":
                let optMap = new Map(Object.entries(opts));
                let resOptsMap = new Map(Object.entries(opts).map(arr => arr.reverse()));

                if (isCoverRight) {
                    Object.keys(opts).forEach(key => {
                        xdata.setData(opts[key], getNewSyncValue(this[key]));
                    });
                }

                leftFun = e => pubSyncByObject(optMap, e, xdata)
                rightFun = e => pubSyncByObject(resOptsMap, e, this)
                break
            default:
                if (isCoverRight) {
                    let obj = this.object;

                    Object.keys(obj).forEach(k => {
                        xdata.setData(k, obj[k]);
                    });
                }

                leftFun = e => e.trends.forEach(trend => xdata.entrend(trend))
                rightFun = e => e.trends.forEach(trend => this.entrend(trend))
                break;
        }

        this.watch(leftFun);
        xdata.watch(rightFun);

        let sHost = getXDataProp(this, SYNCSHOST);

        // 把之前的绑定操作清除
        if (sHost.has(xdata)) {
            this.unsync(xdata);
        }

        // 记录信息
        sHost.set(xdata, {
            selfWatch: leftFun,
            oppWatch: rightFun
        });
        getXDataProp(xdata, SYNCSHOST).set(this, {
            selfWatch: rightFun,
            oppWatch: leftFun
        });
    },
    /**
     * 取消同步数据
     * @param {XData} xdata 需要取消同步的数据
     */
    unsync(xdata) {
        let syncData = getXDataProp(this, SYNCSHOST).get(xdata);

        if (syncData) {
            let { selfWatch, oppWatch } = syncData;
            this.unwatch(selfWatch);
            xdata.unwatch(oppWatch);
            getXDataProp(this, SYNCSHOST).delete(xdata);
            getXDataProp(xdata, SYNCSHOST).delete(this);
        }
    },
    /**
     * 生成虚拟数据
     */
    // virData(leftCall, rightCall) {
    //     // 初始生成数据
    //     let vdata = new VirData(this[XDATASELF], {});
    //     let arg1Type = getType(leftCall);
    //     let mapOpts = leftCall;

    //     if (arg1Type == "object") {
    //         if ("mapKey" in mapOpts) {
    //             let mappingOpt = Object.entries(mapOpts.mapKey);
    //             let mapping = new Map(mappingOpt);
    //             let resMapping = new Map(mappingOpt.map(e => e.reverse()));

    //             leftCall = ([key, value]) => {
    //                 if (mapping.has(key)) {
    //                     return [mapping.get(key), value];
    //                 }
    //                 return [key, value];
    //             }
    //             rightCall = ([key, value]) => {
    //                 if (resMapping.has(key)) {
    //                     return [resMapping.get(key), value];
    //                 }
    //                 return [key, value];
    //             }
    //         } else if ("mapValue" in mapOpts) {
    //             let tarKey = mapOpts.key;
    //             let mappingOpt = Object.entries(mapOpts.mapValue);
    //             let mapping = new Map(mappingOpt);
    //             let resMapping = new Map(mappingOpt.map(e => e.reverse()));

    //             leftCall = ([key, value]) => {
    //                 if (key === tarKey && mapping.has(value)) {
    //                     return [key, mapping.get(value)];
    //                 }
    //                 return [key, value];
    //             }
    //             rightCall = ([key, value]) => {
    //                 if (key === tarKey && resMapping.has(value)) {
    //                     return [key, resMapping.get(value)];
    //                 }
    //                 return [key, value];
    //             }
    //         }
    //     }
    //     // 转换数据
    //     virDataTrans(this, vdata, leftCall);

    //     let leftUpdate, rightUpdate;

    //     this.on("update", leftUpdate = e => entrendByCall(vdata, e, leftCall));
    //     vdata.on("update", rightUpdate = e => entrendByCall(this, e, rightCall));

    //     // 记录信息
    //     getXDataProp(this, VIRDATAHOST).push({
    //         data: vdata,
    //         leftUpdate, rightUpdate
    //     });

    //     return vdata[PROXYTHIS];
    // }
};

Object.keys(SyncMethods).forEach(methodName => {
    Object.defineProperty(XData.prototype, methodName, {
        writable: true,
        value: SyncMethods[methodName]
    });
});

// class VirData extends XData {
//     constructor(xdata, ...args) {
//         super(...args);
//         Object.defineProperty(this, "mappingXData", {
//             writable: true,
//             value: xdata
//         });
//     }
// }