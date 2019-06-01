# stanz 5

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

(当前项目 `dist/stanz.js` 文件)

## stanz 是干什么的？

stanz 能够创建更容易同步数据的对象；没有复杂的状态容器操作，也能很好的同步数据业务；

```javascript
let a = stanz({
    val:"I am val"
});

let b = stanz({
    val:"b val"
});

console.log(a.val); // => "I am val"
console.log(b.val); // => "b val"

// 绑定数据对象
a.sync(b);

a.val = "change a val";

setTimeout(()=>{
    console.log(a.val); // => "change a val"
    console.log(b.val); // => "change a val"
},0);
```

只要改变了数据，相应的数据对象也会同步数据；（数据同步过程是异步的）

直接改变数据，就会同步到另一个数据上；没有订阅之类的操作；

stanz 创建的是 ArrayLike 对象，既可以当 `Object` 使用，也可以当 `Array` 使用；

```javascript
let arr = stanz([200, 100, 400, 300]);

arr.splice(1,1);

console.log(arr); // => [200, 400, 300]

arr.sort()

console.log(arr); // => [200, 300, 400]
```

可以通过 object 创建数组结构，同时具有数组和对象两种功能

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
    // 这里的 watch 绑定的方法会异步触发，同线程改动中后，异步只会触发一次变动函数
});

// 这样是监听整个 a 对象
a.watch((e) => {
    console.log(e.modifys.length);
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

// 这样是监听整个 a 对象
a.watch((e) => {
    console.log("e记录了变动，变动数为 : ", e.modifys.length);
    // => "e记录了变动，变动数为 : 3"
});

a.b.val = "change val1";
a.b.val = "change val2";
a.b.val = "change val3";
```

关于更多 `stanz` 的使用方法，参考下面文档；

[stanz中文文档](doc/cn/)

关于更多 `stanz` 的应用场景，请参考 [`Xhear`](https://github.com/kirakiray/Xhear)，[`Xhear`](https://github.com/kirakiray/Xhear) 就是基于 `stanz`开发，能够不使用预编译方案(nodejs webpack)，打造超大型的web应用；
