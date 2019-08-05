// get 可直接获取的正则
// const GET_REG = /^_.+|^parent$|^index$|^length$|^object$/;
const GET_REG = /^_.+|^index$|^length$|^object$/;
// set 不能设置的Key的正则
const SET_NO_REG = /^parent$|^index$|^length$|^object$/

let XDataHandler = {
    get(target, key, receiver) {
        // 私有变量直接通过
        if (typeof key === "symbol" || GET_REG.test(key)) {
            return Reflect.get(target, key, receiver);
        }

        return target.getData(key);
    },
    set(target, key, value, receiver) {
        // 私有变量直接通过
        // 数组函数运行中直接通过
        if (typeof key === "symbol") {
            return Reflect.set(target, key, value, receiver);
        }

        return target.setData(key, value)
    }
};