let XDataHandler = {
    set(target, key, value, receiver) {
        // 私有变量直接通过
        // 数组函数运行中直接通过
        if (/^_.+/.test(key) || target[RUNARRMETHOD]) {
            return Reflect.set(target, key, value, receiver);
        }

        // 其他方式就要通过主体entrend调整
        return entrend({
            genre: "handleSet",
            target,
            key,
            value,
            receiver
        });
    },
    deleteProperty(target, key) {
        // 私有变量直接通过
        // 数组函数运行中直接通过
        if (/^_.+/.test(key) || target[RUNARRMETHOD]) {
            return Reflect.deleteProperty(target, key);
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
            target,
            key,
            receiver
        });
    }
};