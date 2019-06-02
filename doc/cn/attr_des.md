# stanz 的属性

## stanzObj.object

直接获取转换成普通的对象；（非stanz对象）

## stanzObj.string

直接获取对象转换的字符串，有点像 `JSON.stringify`转换的数据；

## hostkey

在父层中使用的key；

## parent

对象的父层对象；

## root

数据对象的根对象；

## prev

对象在数组内的前一个对象；

## next

对象在数组内的后一个对象；

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