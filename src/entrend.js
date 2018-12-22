// 主体entrend方法
const entrend = (options) => {
    let {
        target,
        key,
        value,
        receiver,
        modifyId,
        genre
    } = options;

    // 判断modifyId
    if (!modifyId) {
        // 生成随机modifyId
        modifyId = getRandomId();
    } else {
        // 查看是否已经存在这个modifyId了，存在就不折腾
        if (receiver[MODIFYIDHOST].has(modifyId)) {
            return;
        };
    }

    // 自身添加modifyId
    receiver[MODIFYIDHOST].add(modifyId);

    // 准备打扫函数
    clearModifyIdHost(receiver);

    // 返回的数据
    let reData = true;

    // 事件实例生成
    let eveObj = new XDataEvent('update', receiver);

    switch (genre) {
        case "handleSet":
            // 获取旧的值
            var oldVal = target[key];

            // 如果相等的话，就不要折腾了
            if (oldVal === value) {
                return true;
            }

            // 如果value是XData就删除原来的数据，自己变成普通对象
            if (isXData(value)) {
                let valueObject = value.object;
                value.remove();
                value = valueObject
            }

            let isFirst;
            // 判断是否初次设置
            if (!target.hasOwnProperty(key)) {
                isFirst = 1;
            }

            // 设置值
            target[key] = createXData(value, {
                parent: receiver,
                hostkey: key
            });

            // 添加修正数据
            eveObj.modify = {
                // change 改动
                // set 新增值
                genre: isFirst ? "new" : "change",
                key,
                value,
                oldVal,
                modifyId
            };
            break;
        case "handleDelete":
            // 没有值也不折腾了
            if (!target.hasOwnProperty(key)) {
                return true;
            }

            // 获取旧的值
            var oldVal = target[key];

            // 删除值
            delete target[key];

            // 清理数据
            clearXData(oldVal);

            // 添加修正数据
            eveObj.modify = {
                // change 改动
                // set 新增值
                genre: "delete",
                key,
                oldVal,
                modifyId
            };
            break;
        case "arrayMethod":
            let {
                methodName,
                args
            } = options;

            // 根据方法对新添加参数修正
            switch (methodName) {
                case "splice":
                case "push":
                case "unshift":
                    args = args.map(e => {
                        if (isXData(e)) {
                            let eObj = e.object;
                            e.remove();
                            e = eObj;
                        }
                        return createXData(e);
                    });
            }

            // 设置不可执行setHandler
            receiver[RUNARRMETHOD] = 1;

            // 对sort方法要特殊处理，已应对sort函数参数的问题
            if (methodName == "sort" && !(args[0] instanceof Array)) {
                // 备份
                let backupTarget = receiver.slice();

                // 运行方法
                reData = arrayFn[methodName].apply(receiver, args);

                // 转换成数组
                let newArg0 = [],
                    putId = getRandomId();
                backupTarget.forEach(e => {
                    // 查找id
                    let id = reData.indexOf(e);

                    // 清空相应的数组内数据
                    reData[id] = putId;

                    // 加入新数组
                    newArg0.push(id);
                });

                // 修正参数
                args = [newArg0];
            } else {
                // 运行方法
                reData = arrayFn[methodName].apply(receiver, args);
            }

            // 复原状态
            delete receiver[RUNARRMETHOD];

            // 根据方法是否清除返回的数据
            switch (methodName) {
                case "splice":
                case "pop":
                case "shift":
                    // 清理被裁剪的数据
                    reData.forEach(e => {
                        clearXData(e);
                    });
                    break;
            }

            // 添加修正数据
            eveObj.modify = {
                // change 改动
                // set 新增值
                genre: "arrayMethod",
                methodName,
                modifyId,
                args
            };

            break;
    }

    receiver.emit(eveObj);

    return reData;
}

// 清理modifyIdHost的方法，每次清理一半，少于2个就一口气清理
const clearModifyIdHost = (xdata) => {
    // 判断是否开始打扫了
    if (xdata[MODIFYTIMER]) {
        return;
    }

    // 琐起清洁器
    xdata[MODIFYTIMER] = 1;

    let clearFunc = () => {
        // 获取存量长度
        let {
            size
        } = xdata[MODIFYIDHOST];

        if (size > 2) {
            // 清理一半数量，从新跑回去清理函数
            let halfSzie = Math.floor(size / 2);

            // 清理一半数量的modifyId
            xdata[MODIFYIDHOST].forEach((e, i) => {
                if (i < halfSzie) {
                    xdata[MODIFYIDHOST].delete(e);
                }
            });

            // 计时递归
            setTimeout(clearFunc, 3000);
        } else {
            // 小于两个就清理掉啦
            xdata[MODIFYIDHOST].clear();
            // 解锁
            xdata[MODIFYTIMER] = 0;
            // 清理函数
            clearFunc = null;
        }
    }

    setTimeout(clearFunc, 3000);
}