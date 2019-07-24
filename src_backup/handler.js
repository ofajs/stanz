// 私有属性正则
const PRIREG = /^_.+|^parent$|^hostkey$|^status$|^length$/;
let XDataHandler = {
    set(target, key, value, receiver) {
        // 私有变量直接通过
        // 数组函数运行中直接通过
        if (typeof key === "symbol" || PRIREG.test(key)) {
            return Reflect.set(target, key, value, receiver);
        }

        // 数组内组合，修改hostkey和parent
        if (target.hasOwnProperty(RUNARRMETHOD)) {
            if (isXData(value)) {
                value.parent = receiver;
                value.hostkey = key;
                value.status = "binding";
            }
            return Reflect.set(target, key, value, receiver);
        }

        // 获取到_entrendModifyId就立刻删除
        let modifyId = target._entrendModifyId;
        if (modifyId) {
            delete target._entrendModifyId;
        }

        // 其他方式就要通过主体entrend调整
        return entrend({
            genre: "handleSet",
            modifyId,
            target,
            key,
            value,
            receiver
        });
    },
    deleteProperty(target, key) {
        // 私有变量直接通过
        // 数组函数运行中直接通过
        if (typeof key === "symbol" || /^_.+/.test(key) || target.hasOwnProperty(RUNARRMETHOD)) {
            return Reflect.deleteProperty(target, key);
        }

        // 获取到_entrendModifyId就立刻删除
        let modifyId = target._entrendModifyId;
        if (modifyId) {
            delete target._entrendModifyId;
        }

        // 获取receiver
        let receiver;

        if (target.parent) {
            receiver = target.parent[target.hostkey];
        } else {
            Object.values(target).some(e => {
                if (isXData(e)) {
                    receiver = e.parent;
                    return true;
                }
            });

            if (!receiver) {
                receiver = new Proxy(target, XDataHandler);
            }
        }

        return entrend({
            genre: "handleDelete",
            modifyId,
            target,
            key,
            receiver
        });
    }
};