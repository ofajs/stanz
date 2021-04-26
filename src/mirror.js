/**
 * XData的镜像对象
 * 镜像对象跟xdata公用一份，不会复制双份数据；
 * 可嵌入到其他对象内而不影响使用
 */
// class XMirror extends XEmiter {
class XMirror {
    constructor(xdata) {
        // super({});

        this[XMIRROR_SELF] = this;
        this.mirrorHost = xdata;
        this.parent = undefined;
        this.index = undefined;

        let updateFunc = (e) => {
            if (this.parent) {
                emitUpdate(this.parent, "", [], {}, (e2) => {
                    Object.assign(e2, {
                        keys: cloneObject(e.keys),
                        modify: cloneObject(e.modify),
                        currentTarget: e.currentTarget,
                        target: e.target,
                        oldValue: e.oldValue
                    });
                    e2.keys.unshift(this.index);
                });
            }
        }
        xdata.on("update", updateFunc);

        this[XMIRRIR_UPDATA_BINDER] = updateFunc;

        return new Proxy(this, XMirrorHandler);
    }

    remove(key) {
        return XData.prototype.remove.call(this, key);
    }
}

// XMirror实例的
const XMIRRIR_UPDATA_BINDER = Symbol("XMirrorUpdataBinder");
const XMIRROR_SELF = Symbol("XMirror_self");

// 可访问自身的key
const XMIRRIR_CANSET_KEYS = new Set(["index", "parent", "remove", XMIRRIR_UPDATA_BINDER, XMIRROR_SELF]);

// 绑定行为的方法名，在清除时同步清除绑定的方法
// const XMIRRIR_RECORD_NAME = new Set(["on", "watch"]);

const XMirrorHandler = {
    get(target, key, receiver) {
        if (XMIRRIR_CANSET_KEYS.has(key)) {
            return target[key];
        }
        let r_val = target.mirrorHost[key];

        if (isFunction(r_val)) {
            r_val = r_val.bind(target.mirrorHost);
        }

        return r_val;
    },
    set(target, key, value, receiver) {
        if (XMIRRIR_CANSET_KEYS.has(key)) {
            target[key] = value;
            return true;
        }
        return target.mirrorHost.setData(key, value);
    }
};