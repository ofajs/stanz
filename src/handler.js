let XDataHandler = {
    set(target, key, value, receiver) {
        // 私有变量直接通过
        // 数组函数运行中直接通过
        if (/^_.+/.test(key) || target[RUNARRMETHOD]) {
            return Reflect.set(xdata, key, value, receiver);
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
    deleteProperty(xdata, key) {
        return Reflect.deleteProperty(xdata, key);
    }
};