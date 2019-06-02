# stanz 文档

### [stanz的方法（数据绑定特有）](method_about_data.md)

### [stanz常用方法](method_about_other.md)

### [stanz的属性](attr_des.md)

## stanz对象特性

虽然方法名是 `sync`，但过程是异步的；

```javascript
let a = stanz({
    val:"I am val"
});

let b = stanz({
    val:"b val"
});

a.sync(b);

console.log(a.val); // => "I am val"
console.log(b.val); // => "b val"

a.val = "change a val";

console.log(a.val); // => "change a val"
console.log(b.val); // => "b val"

setTimeout(()=>{
    console.log(b.val); // => "change a val"
},0);
```

在 stanz 早期的版本，`sync` 的确是完全同步的方案，但导致了性能问题，比如同步改动数据多次，完全同步化的方案会多次的触发数据同步操作；采用异步的方案后，就只会产生一次变动操作；

sync的实现原理是基于 `watch` 方法； `watch` 方法本身也是异步的callback传递函数；基础 watch 后性能更好；

### status属性

`root` 代表自身数据根对象；

`binding` 代表时子对象，绑定别的stanz对象上；

`destory` 已被摧毁的对象，数据绑定和事件绑定之类的状态数据都会被回收；

```javascript
let a = stanz({
    val: "I am a",
    data: {
        title: "data title"
    }
});

// 提前拿出来
let data = a.data;

console.log(a.status); // root
console.log(a.data.status); // => binding

// 删除data
a.removeByKey("data");
// a.data.remove();

console.log(data.status); // => destory
```

## 注意事项

### 不要直接赋值其他已绑定父级的stanz对象

```javascript
let a = stanz({
    val: "I am a",
    data: {
        title: "title a"
    }
});

let b = stanz({
    val: "I am b"
});

b.other = a.data;

console.log(a.data); // => undefined
console.log(b.other);
// => {
//     val: "I am b"
// }
```

直接赋值已绑定的对象，赋值将会被剥夺；

如果只是想让另个对象获取相应的值，可以使用 `object` 或 `clone()` 获取的数据设置；

```javascript
b.other = a.data.object;
// 或者
b.other = a.data.clone();
```
