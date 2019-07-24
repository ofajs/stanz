# stanz 6

stanz 是 JavaScript 新的数据对象，融合 `Object` 和 `Array` 的优点，并将数据同步功能集于一身；

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

setTimeout(() => {
    // 异步查看是
    console.log(a.val); // => "change the val"
    console.log(a.val); // => "change the val"
});
```

模拟类DOM功能，可以像操作DOM的方式操纵数据；

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