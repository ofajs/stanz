# stanz 文档

## stanz对象特性

虽然方法名是 `sync`，但是过程其实是异步的；

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

在 stanz 早期的版本，`sync` 方法不是异步的数据同步，导致了很多问题；切换回异步方案后，这类的问题就避免了；后续会详细跟你讨论这类问题；