# stanz 方法介绍1

stanz 数据绑定精华方法；

## sync

同步数据的方法，最基础的案例如下：

```javascript
let a = stanz({
    val:"I am val",
    color:"red"
});

let b = stanz({
    val:"b val",
    color:"blue"
});

console.log(a.val); // => "I am val"
console.log(b.val); // => "b val"
console.log(a.color); // => "red"
console.log(b.color); // => "blue"

// 绑定数据对象
a.sync(b);

// 属性变动
a.val = "change a val";
b.color = "yellow";

setTimeout(()=>{
    console.log(a.val); // => "change a val"
    console.log(b.val); // => "change a val"
    console.log(a.color); // => "yellow"
    console.log(b.color); // => "yellow"
},0);
```

数据的同步是双向的；并且会同步所有值；

sync 可以接受三个参数；第二个是筛选参数，第三个是覆盖参数；

第二个筛选参数可以是3种情况；

`string` 字符串，只会同步字符串内的key的值；

`array` 数组，是 `string` 基础上的封装，只有数组内的 key 才会同步；

```javascript
let a = stanz({
    val:"I am val",
    color:"red"
});

let b = stanz({
    val:"b val",
    color:"blue"
});

console.log(a.val); // => "I am val"
console.log(b.val); // => "b val"
console.log(a.color); // => "red"
console.log(b.color); // => "blue"

// 绑定数据对象
a.sync(b,"val");
// a.sync(b,["val"]); // 效果同上

// 属性变动
a.val = "change a val";
b.color = "yellow";

setTimeout(()=>{
    console.log(a.val); // => "change a val"
    console.log(b.val); // => "change a val"
    console.log(a.color); // => "red"
    console.log(b.color); // => "yellow"
    // 这里只同步的 val 的值， color没有同步
},0);
```

`object` 对象，则会映射相应key上的值，如下；

```javascript
let a = stanz({
    tag: "text"
});

let b = stanz({
    type: "input"
});

console.log(a.tag); // => "text"
console.log(a.type); // => "input"

a.sync(b, {
    "tag": "type"
})

a.tag = "textarea";

setTimeout(()=>{
    console.log(a.tag); // => "textarea"
    console.log(a.type); // => "textarea"
},0);
```

第三个参数是是否覆盖数据；

```javascript
let a = stanz({
    val: "I am a"
});

let b = stanz({
    val: "Its b"
});

console.log(a.val); // => "I am a"
console.log(b.val); // => "Its b"

// 完全覆盖
a.sync(b, null, true);

setTimeout(() => {
    console.log(a.val); // => "I am a"
    console.log(b.val); // => "I am a"
}, 0);
```

当我不想用第二个参数是，设置成null，a的数据就会完全覆盖到b上；

当然第二参数你也可以设置进去，就只会覆盖筛选的值；

### 数组型变动也会同步

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

// 深克隆一个对象，得到和arr一样的值，是深拷贝的；
let cloneArr = arr.clone();

// 同步
arr.sync(cloneArr);

// 删除第二个
arr.splice(1, 1);
arr.val = "change val";

console.log(arr);
// => {
//     0: {
//         count: 200
//     },
//     1: {
//         count: 100
//     },
//     val: "change val"
// }

console.log(cloneArr);
// => {
//     0: {
//         count: 200
//     },
//     1: {
//         count: 100
//     },
//     val: "change val"
// }
```

但记住，一定要保持两个数组stanz对象的值是相等的，不然同步过程会出错；`clone` 方法能完全克隆出相同的对象；

## unsync

去除同步对象，用 `sync` 同步过的对象，使用 `unsync` 解除同步；

```javascript
let a = stanz({
    val: "I am a"
});

let b = stanz({
    val: "Its b"
});

// 完全覆盖
a.sync(b);

// 解除同步
a.unsync(b);
// b.unsync(a); // 这个效果是一样的
```

只需要传入需要解除绑定的对象即可，不需要传回 `sync`时候的参数；

## watch

监听对象的数据变动；

```javascript
let a = stanz({
    val: "I am val"
});

// 这里是监听 a 的 val属性 的值，下面同步的修改数据n次，也只会异步触发一次变动函数
a.watch("val", (e, val) => {
    console.log(e, val);
    // val => "change val4"
    // 这里的 watch 绑定的方法会异步触发，同线程改动中后，异步只会触发一次变动函数
});

// 这样是监听整个 a 对象，下面同步的修改数据n次，也只会异步触发一次变动函数
a.watch((e) => {
    console.log(e.trends.length); // => 4 // 记录了4次的变动，详细信息请debug
    console.log(a.val); // => "change val4"
});

a.val = "change val";
a.val = "change val2";
a.val = "change val3";
a.val = "change val4";
```

也会触发类似冒泡的机制；

```javascript
let a = stanz({
    val: "I am val",
    c:{
        val:"It's c"
    }
});

// 这个watch不会被触发，因为没有改变val
a.watch("val", (e, val) => {
    // 这个 console 不会被触发，因为没有val
    console.log(e, val);
});

// 这样是监听整个 a 对象，下面同步的修改数据n次，也只会异步触发一次变动函数
a.watch((e) => {
    console.log(e.trends.length); // => 4 // 记录了4次的变动，详细信息请debug
    console.log(a.c.val); // => "change val4"
});

a.c.val = "change val";
a.c.val = "change val2";
a.c.val = "change val3";
a.c.val = "change val4";
```

当然 c 本身也会被实例化成 stanz对象，其本身也能使用watch方法；

```javascript
a.c.watch("val", (e, val) => {
    console.log(e, val);
});

a.c.watch((e) => {
    console.log(e.trends.length); 
});
```

### 带瞬时触发的 watch 绑定

```javascript    
let a = stanz({
    val: "I am val"
});

a.watch("val", (e, val) => {
    console.log("first => ", val);
}, true);

console.log("second");

// 打印的顺序如下
// "first => I am val"
// "second"
```

在 `watch` 监听某个属性时，允许传入第三个参数，可以瞬时触发 watch callback，把val值立刻带过来；这种做法主要方便数据的初始化运行；

## unwatch

跟 `watch` 相对应，用于取消 `watch`绑定的函数；

```javascript
let a = stanz({
    val: "I am val",
    c:{
        val:"It's c"
    }
});

let wCall = (e, val) => {
    console.log(e, val);
};
a.watch("val", wCall);

let wSelfCall = (e) => {
    console.log(e.trends.length); 
    console.log(a.c.val); 
}
a.watch(wSelfCall);

// 取消监听
a.unwatch("val", wCall);
a.unwatch(wSelfCall);
```

注意，`unwatch` 取消绑定传入的参数，必须与 `watch` 传入时的保持一致；

## seek

查找带有相应属性的子对象，相应的可以使用三种查找方式，看看下面案例就知道了；

```javascript
let obj = stanz({
    a: {
        selected: "1",
        child: {
            tag: "child",
            selected: 2
        }
    },
    b: {
        child: {
            tag: "child",
            selected: 1,
        }
    }
});

// 查找属性为selected == 1的对象，记住 = 后面不能出现字符引用
let selected1Arr = obj.seek(`[selected=1]`);

console.log(selected1Arr.length); // => 2
console.log(selected1Arr);
// selected1Arr 的两个值是 obj.a 和 obj.b.child
// =>[ obj.a , obj.b.child ]
// =>[ obj.a ]
```

## 混合 seek型参数的 watch

`watch` 方法可以使用 `seek` 的参数，达到动态监听值得变动；

```javascript
let obj = stanz({
    a: {
        val: "I am a",
        selected: 1
    },
    b: {
        val: "I am b",
        selected: 0
    },
    c: {
        val: "I am c",
        selected: 0
    }
});

let count = 1;
obj.watch('[selected=1]', (e, val) => {
    console.log(`count_${count} => `, val);
    count++;
},true);

console.log("second");

// 修改selected值
obj.a.selected = 0;
obj.b.selected = 1;

// 打印顺序如下
// count_1 =>  [{
//     val: "I am a",
//     selected: 1
// }]
//
// second
// 
// count_2 =>  [{
//     val: "I am b",
//     selected: 1
// }]
```

在后续操作 `[selected=1]` 的值发生改变时，会触发 `watch` 监听的数据，并通过第二个参数返回相对应的监听值（放在数组里）；

## virData

生成虚拟数据，可以建立值映射的数据对象；

```javascript
let obj = stanz({
    a: {
        val: "I am a",
        selected: 1
    },
    0: {
        tag: "p-text",
        val: "I am text"
    },
    1: {
        tag: "p-ele",
        val: "I am ele",
        0: {
            tag: "p-text",
            val: "text 2"
        },
        1: {
            tag: "p-pic",
            url: "http://asd.com/p.png"
        }
    }
});

// 获取映射数据
let mapData = obj.virData({
    // 映射
    key: "tag",
    mapValue: {
        "p-ele": "pre-ele",
        "p-text": "pre-text",
        "p-pic": "pre-pic"
    }
});

// 新添加
obj.push({
    tag: "p-ele",
    val: "new ele"
});

console.log(mapData);
// =>
// {
//     "0": {
//         "tag": "pre-text",
//         "val": "I am text"
//     },
//     "1": {
//         "0": {
//             "tag": "pre-text",
//             "val": "text 2"
//         },
//         "1": {
//             "tag": "pre-pic",
//             "url": "http://asd.com/p.png"
//         },
//         "tag": "pre-ele",
//         "val": "I am ele"
//     },
//     "2": {
//         "tag": "pre-ele",
//         "val": "new ele"
//     },
//     "a": {
//         "val": "I am a",
//         "selected": 1
//     }
// }
```

mapData本身也是 stanz对象，和元数据存在着绑定；和 `sync` 方法绑定数据不同的地方，在于 `virData` 生成的数据和元数据的数据绑定是同步绑定的；
