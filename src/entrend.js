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
        modifyId = getRandomId();
    } else {
        // 查看是否已经存在这个modifyId了，存在就不折腾
        if (target[MODIFYIDHOST].has(modifyId)) {
            return;
        };
    }

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

            break;
    }

    target.emit(eveObj);

    return true;
}