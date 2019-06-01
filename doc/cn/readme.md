# stanz 文档

### [stanz的方法（数据相关）](method_about_data.md)

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