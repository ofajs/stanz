- 以下是关于Stanz库的使用文档的大纲： 
1. 简介
   - 介绍Stanz库的作用和目的
   - 提供Stanz库的特点和优势 
2. 安装
   - 提供安装Stanz库的方法和要求 
3. 基本概念
   - 介绍Stanz库中的基本概念，例如"实例"、"观察"和"路径"等 
4. 创建实例
   - 展示如何使用Stanz库创建实例对象
   - 提供创建实例的示例代码和说明 
5. 观察属性变化 
   - 解释如何使用`watch`方法观察实例对象的属性变化
   - 提供观察属性变化的示例代码和说明
   - 观察子对象的属性变化并包含示例代码
6. 观察数组变化 
   - 说明如何使用`watch`方法观察实例对象中数组的变化
   - 提供观察数组变化的示例代码和说明 
7. 删除属性观察 
   - 解释如何使用`watch`方法观察属性的删除操作
   - 提供删除属性观察的示例代码和说明 
8. 更新控制 
   - 介绍如何使用`_update`属性控制属性对象的更新
   - 提供更新控制的示例代码和说明 
9. 取消观察 
   - 说明如何使用`unwatch`方法取消属性的观察
   - 提供取消观察的示例代码和说明 
10. 异步观察 
    - 解释如何使用`watchTick`方法实现异步观察
    - 提供异步观察的示例代码和说明 
11. Watcher函数 
    - 介绍`watcher`函数的使用和功能 
    - 提供使用`watcher`函数的示例代码和说明 
12. Watchers函数 
    - 解释`watchers`函数的使用和功能 
    - 提供使用`watchers`函数的示例代码和说明 
13. 点式键路径观察
    - 说明如何使用点式键路径观察属性的变化
    - 提供点式键路径观察的示例代码和说明 
    - get 和 set 方法使用
14. 总结和进阶
    - 总结Stanz库的主要功能和用法
    - 提供进一步学习Stanz库的资源和建议

# Stanz

## 简介

Stanz 是一个 JavaScript 库，它可以监视对象和数组的属性变化，以便在属性发生变化时执行相应的操作。

### 特点和优势

- 轻量级且易于使用的库
- 支持观察对象和数组的属性变化
- 支持异步观察和批量触发事件
- 没有依赖关系，可以与现有的 JavaScript 代码和框架兼容

## 安装

可以通过以下方法安装 Stanz 库：

- 直接在html引入

```html
<script src="https://cdn.jsdelivr.net/npm/stanz/dist/stanz.min.js"></script>
```

- 使用 npm 安装

```
npm install stanz
<!-- yarn add stanz -->
```

## 基本概念

在使用 Stanz 库之前，了解一些基本概念是很重要的： 

- **实例** ：Stanz 库操作的对象或数组实例。 
- **观察** ：通过 `watch` 方法来监视实例属性的变化。 
- **路径** ：属性在实例中的位置，可以使用点式键路径来指定。

## 创建实例

要使用 Stanz 库，首先需要创建一个实例对象。可以使用 `stanz` 函数来创建实例对象。

```javascript
const stanz = require("stanz");

const data = stanz({
  name: "John",
  age: 30,
});

console.log(data.name); // 输出: John
console.log(data.age); // 输出: 30
```

## 观察属性变化

可以使用 `watch` 方法来观察实例对象的属性变化。当属性的值发生变化时，将触发相应的回调函数。

```javascript
const data = stanz({
  name: "John",
  age: 30,
});

data.watch((e) => {
  console.log("属性发生变化：", e);
});

data.name = "Mike"; // 属性发生变化： { type: "set", path: [], name:"name", value: "Mike", oldValue: "John" }
```

在上面的示例中，我们使用 `watch` 方法来观察 `data` 实例对象的属性变化。当 `name` 属性的值发生变化时，将输出相应的变化信息。

## 观察子对象的变化

watch 也会观察子对象（包括多层子对象）的变化；当子对象属性值发生变化时，也会触发响应的回调函数；

```javascript
const data = stanz({
  name: "John",
  age: 30,
  mother: {
    name: "Jennifer",
    age: 50,
  },
});

data.watch((e) => {
  console.log("Properties changed:", e);
});

data.mother.age = 51; // 属性发生变化： { type: "set", path: [Proxy(mother)], name:"age", value: 51, oldValue: 50 }
```

## _开头的属性不会被观察

Stanz 的实例默认 `_` 开头的属性为私有属性，改动`_`开头的属性或它的子对象属性，都不会触发 `watch` 函数；

```javascript
const data = stanz({
  name: "John",
  _age: 30,
});

data.watch((e) => {
  console.log("Properties changed:", e);
});

data._age = 51; // 不会触发 watch 函数
```

## 观察数组变化

Stanz 库不仅支持观察对象的属性变化，还可以观察数组的变化。

```javascript
const data = stanz([1, 2, 3]);

data.watch((e) => {
  console.log("数组发生变化：", e);
});

data.push(4); // 数组发生变化： { type: "array", name:"push", target: [1, 2, 3, 4], path: [], args:[4]}
```

在上面的示例中，我们使用 `watch` 方法观察 `data` 数组的变化。当调用 `push` 方法向数组添加新元素时，将输出相应的变化信息。

同样的，观察子对象也是可以的；

```javascript
const data = stanz({
  name: "John",
  age: 30,
  children: [
    {
      name: "Tom",
      age: 6,
    },
  ],
});

data.watch((e) => {
  console.log("Properties changed:", e);
});

data.children.push({
  name: "Jack",
  age: 1,
}); // 数组发生变化： { type: "array", name:"push", target: Proxy(children), path: [Proxy(children)], args: [{name:"Jack",age:1}]}
```

## 删除属性

也可以观察删除属性的变动

```javascript
const data = stanz({
  name: "John",
  age: 30,
});

data.watch((e) => {
  console.log("属性发生变化：", e);
});

delete data.name; // 属性发生变化： { type: "delete", target: Proxy(data), path: [], value: undefined, oldValue: "John" }
```

同样适用于监听子对象；

## 更新控制

Stanz 库允许控制属性的更新过程。可以通过 `_update` 属性来暂时禁用属性的触发回调函数。

```javascript
const data = stanz({
  name: "John",
  age: 30,
});

data.watch((e) => {
  console.log("属性发生变化：", e);
});

data._update = false;

data.name = "Mike"; // 不触发属性变化的回调函数

data._update = true;

data.name = "Tom"; // 属性发生变化： { type: "set", target: { name: "Tom", age: 30 }, path: ["name"], value: "Tom", oldValue: "John" }
```

在上面的示例中，我们使用 `_update` 属性来控制属性的更新过程。将其设置为 `false` 时，属性变化的回调函数不会被触发。再将其设置为 `true` 时，属性变化的回调函数将被触发。

## 取消观察

除了删除特定观察器外，还可以通过调用 `unwatch` 方法来取消对属性的观察。

```javascript
const data = stanz({
  name: "John",
  age: 30,
});

const wid = data.watch((e) => {
  console.log("属性发生变化：", e);
});

data.name = "Mike"; // 属性发生变化： { type: "set", target: { name: "Mike", age: 30 }, path: ["name"], value: "Mike", oldValue: "John" }

data.unwatch(wid); // 取消对所有属性的观察

data.name = "Tom"; // 不再输出属性变化信息
```

# 进阶

## 判断属性是否有改动

通过 watch 参数的 `watcher.hasModified`；通过 `watcher.hasReplaced` 判断该属性是否被替换；

可以通过观察函数返回的 Watcher 实例，判断属性是否有改动：

```javascript
const data = stanz({
  name: "John",
  age: 30,
  mother: {
    name: "Jennifer",
    age: 50,
  },
});

data.mother.watch((watcher) => {
  console.log("data hasModified('age') => ", watcher.hasModified("age")); // true
  console.log("data hasReplaced('age') => ", watcher.hasReplaced("age")); // true
});

data.watch((watcher) => {
  console.log("data hasModified('name') => ", watcher.hasModified("name")); // false
  console.log("data hasModified('mother') => ", watcher.hasModified("mother")); // true
  console.log("data hasReplaced('mother') => ", watcher.hasReplaced("mother")); // false
});

data.mother.age = 52;
```

## 异步监听变动

之前 watch 方法是同步的监听的，每次改动都会触发 watch 函数；而通过 watchTick 收集指定时间内 Wathcer 实例，再一口气返回，而且返回的实例组为 Watchers；

Watchers 也可以使用和 Watcher 的方法，包括 `hasModified` 和 `hasReplaced`；

```javascript
const data = stanz({
  name: "John",
  age: 30,
  mother: {
    name: "Jennifer",
    age: 50,
  },
});

data.watchTick(watchers => {
  // 在同步线程内只会执行一次
  console.log("watchers.length => ",watchers.length); // => 3
  console.log('watchers.hasModified("name") => ',watchers.hasModified("name")); // => true
  console.log('watchers.hasReplaced("name") => ',watchers.hasReplaced("name")); // => true
  console.log('watchers.hasModified("mother") => ',watchers.hasModified("mother")); // => true
  console.log('watchers.hasReplaced("mother") => ',watchers.hasReplaced("mother")); // => false
});

data.name = "Joker";
data.mother.age = 56;
data.mother.name = 'Jennimer';
```

可以通过 `watchTick` 添加时间，会在指定时间内收集所有 Watcher 返回；

```javascript
data.watchTick(watchers => {
  // 在500毫秒内只会执行一次
}, 500);
```