# stanz 方法介绍2

其他常用方法；

## on
## off
## one
## emit

基础的事件模型的方法；

```javascript
let a = stanz({
    val: "I am a"
});

let fun;
a.on('testEvent', fun = (e, data) => {
    console.log(e, data);
    // => XDataEvent{type:"testEvent",...} , {
    //     state: "100"
    // }
});

a.emit('testEvent', {
    state: "100"
});

// 注销事件
a.off('testEvent', fun);
```

跟jQ和Node类似，提供了事件机制，`one` 就 `on` 的一次性版本；

stanz数据改动会有个 `update` 事件，记录着数据变动；

```javascript
let a = stanz({
    val: "I am a",
    data: {
        title: "title a"
    },
    0: {
        tag: "p-ele",
        text: "I am ele"
    }
});

console.log("before change");

a.on("update", (e) => {
    console.log(e);
});

a.data.title = "change title a";
a[0].text = "change text";

console.log("after change");

// 打印顺序如下
// "before change"
// XDataEvent{type:"update",keys:["data"],...}
// XDataEvent{type:"update",keys:[0],...}
// "after change"
```

stanz 的事件是会冒泡的，并且 `update` 事件会和改动同步，update冒泡完毕才会往下走；

实战stanz中并不需要使用XDataEvent，详细XDataEvent信息请在控制台debug查看；

## 数组上的方法

stanz对象本来就是 `ArrayLike`，可以使用：'concat', 'every', 'filter', 'find', 'findIndex', 'forEach', 'map', 'slice', 'some', 'indexOf', 'includes', 'join','pop', 'push', 'reverse', 'splice', 'shift', 'unshift', 'sort'；

数据绑定之间的 stanz对象，使用数组方法也将被同步；

## entrend

传入 `trend` 数据的入口方法；

```javascript
let a = stanz({
    val: "I am a"
});

let b = stanz({
    val: "I am b"
});

a.on("update", eve => {
    b.entrend(eve.trend);
});

a.val = "change val";

console.log(a.val); // => change val
console.log(b.val); // => change val
```

这个是 单向的 同步型 同步数据流方法；`sync` 的简化版；同步数据时，请使用 `sync` 方法；entrend入口是留给跨端数据同步用的；

## clone

深拷贝出一个stanz数据；

```javascript
let a = stanz({
    val:"I am a"
});

// 拷贝
let b = a.clone();

console.log(a.val); // => "I am a"
console.log(b.val); // => "I am a"
console.log(a === b); // => false
```

## remove

删除自身或者数组数据内的值；

```javascript
let a = stanz({
    val:"I am a",
    0: "Its0",
    1: {
        val: "Its 1"
    },
    2: {
        val: "Its 2"
    },
    3: "Its3"
});

// a[1]删除自身
a[1].remove();

// 删除 val
a.remove("val");

console.log(a);
// =>
// {
//     0: "Its0",
//     1: {
//         "val": "Its 2"
//     },
//     2: "Its3",
// }
```

## add

数组方法 `push` 的去重版本；模仿 `Map` 数据的操作；同样的也能使用 `delete` `has` 操作；

```javascript
let a = stanz(["AA","BB"]);

// 添加CC
a.add("CC");

// 已存在AA了，不会被添加
a.add("AA");

console.log(a);
// =>
// {
//     "0": "AA",
//     "1": "BB",
//     "2": "CC"
// }
```

## before
## after

数据前置或后置；

```javascript
let a = stanz({
    0: {
        val: "I am 0"
    },
    1: {
        val: "I am 1"
    },
    2: {
        val: "I am 2"
    }
});

console.log(a[1].val);

// 放在 a[1] 的后面
a[1].after({
    val: "after 1"
});
// 放在 a[1] 的前面
a[1].before({
    val: "before 1"
});

console.log(a);
// => {
//     "0": {
//         "val": "I am 0"
//     },
//     "1": {
//         "val": "before 1"
//     },
//     "2": {
//         "val": "I am 1"
//     },
//     "3": {
//         "val": "after 1"
//     },
//     "4": {
//         "val": "I am 2"
//     }
// };
```

用起来是不是跟jQ一样爽；