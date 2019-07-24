// get 可直接获取的正则
// const GET_REG = /^_.+|^parent$|^index$|^length$|^object$/;
const GET_REG = /^_.+|^index$|^length$|^object$/;
// set 不能设置的Key的正则
const SET_NO_REG = /^parent$|^index$|^length$|^object$/

let XDataHandler = {
    get(target, key, value, receiver) {
        // 私有变量直接通过
        if (typeof key === "symbol" || GET_REG.test(key)) {
            return Reflect.get(target, key, value, receiver);
        }

        return target.getData(key);
    },
    set(target, key, value, receiver) {
        // 私有变量直接通过
        // 数组函数运行中直接通过
        if (typeof key === "symbol" || /^_.+/.test(key)) {
            return Reflect.set(target, key, value, receiver);
        }

        if (SET_NO_REG.test(key)) {
            console.warn(`you can't set this key in XData => `, key);
            return false;
        }

        return target.setData(key, value)
    }
};