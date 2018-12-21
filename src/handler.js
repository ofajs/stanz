let XDataHandler = {
    set(xdata, key, value, receiver) {
        return Reflect.set(xdata, key, value, receiver)
    },
    deleteProperty(xdata, key) {
        return Reflect.deleteProperty(xdata, key);
    }
};