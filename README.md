# stanz 6

stanz 是一种 JavaScript 新的数据类型，没有复杂的状态容器操作，也能很好的同步数据业务；

融合 `Object` 和 `Array` 的优点，并将数据同步功能集于一身；

```javascript
let a = stanz({
    val: "I am a"
});

let b = stanz({
    val: "I am b"
});

// 同步操作
a.sync(b);

a.val = "change the val";

// 数组操作
a.push({
    name:"div"
});

setTimeout(() => {
    console.log(a.val); // => "change the val"
    console.log(b.val); // => "change the val"
    console.log(a[0].name); // => "div"
    console.log(b[0].name); // => "div"
    console.log(a == b); // false
});
```

## 如何使用 stanz?

直接外部引用资源

```html
<head>
    ...
    <script src="stanz.js"></script>
    ...
</head>
```

然后下面开始使用。

## stanz能干什么？

除了上面的数据同步功能，还能模拟类DOM功能，可以像操作DOM的方式操纵数据；

```javascript
let a = stanz({
    name: "div",
    0: {
        name: "span"
    },
    1: {
        name: "i"
    }
});

console.log(a[1].name); // => i
console.log(a.length); // => 2

a[0].after({
    name: "p"
});

console.log(a[1].name); // => p
console.log(a.length); // => 3
```

可以通过 object 创建数组结构，同时具有数组和对象两种特性；

```javascript
let arr = stanz({
    0: {
        count: 200
    },
    1: {
        count: 300
    },
    2: {
        count: 100
    },
    val: "I am arr"
});

console.log(arr.length); // => 3
console.log(arr.val); // => "I am arr"

// 排序操作
arr.sort((a, b) => a.count - b.count);

console.log(arr); 
// => {
//     0: {
//         count: 100
//     },
//     1: {
//         count: 200
//     },
//     2: {
//         count: 300
//     },
//     val: "I am arr"
// }
```

提供了优化过的对象监听方法

```javascript
let a = stanz({
    val: "I am val"
});

// 这里是监听 a 的 val属性 的值
a.watch("val", (e, val) => {
    console.log(e, val);
    // val => "change val2"
    // 这里的 watch 绑定的方法会异步触发，同线程改动中后，只会触发一次异步变动函数
});

// 这样是监听整个 a 对象
a.watch((e) => {
    console.log(e.trends.length);
    // => 2
});

a.val = "change val";
a.val = "change val2";
```

stanz对象内的对象，也会被初始化成stanz对象，并且改动会触发类似 `DOM` 的冒泡机制；

```javascript
let a = stanz({
    val: "I am val",
    b: {
        val: "I am b"
    }
});

a.on("update",e=>{
    console.log("update!!"); // 这里会同步触发3次
});

// 这样是监听整个 a 对象
a.watch((e) => {
    console.log("e记录了变动，变动数为 : ", e.trends.length);
    // => "e记录了变动，变动数为 : 3"
});

// 虽然改动的是a.b.val，但是 update 事件会向上冒泡
a.b.val = "change val1";
a.b.val = "change val2";
a.b.val = "change val3";
```

(当前项目 `dist/stanz.js` 文件)

关于更多 `stanz` 的使用方法，参考下面文档；

[stanz中文文档](doc/cn/)

<!-- ### 数组对象操作，为什么采用类DOM的方案，而不是采用JS Object标准？

为了使 trend 功能实现起来更简单；

如果多个对象可以同时拥有一个对象，远程的对象数据就没办法同步；

如果要实现同时拥有对象，并且远程能够同步，必须先实现一个 Object VM，在进行VM上的对象映射同步，但这样会让工程变得特别的复杂；

而 `trend`远程同步 是 stanz 的重要特性，所以采用类DOM的方案；

等作者想到办法降低工程复杂度后，下一版本会采用JS Object标准。 -->