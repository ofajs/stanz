# Stanz 使用文档
  
## 简介

Stanz 是一个 JavaScript 库，用于监视对象和数组的属性变化，并在属性变化时执行相应的操作。

### 特点和优势

- 轻量级且易于使用的库
- 支持观察对象和数组的属性变化
- 支持异步观察和批量触发事件
- 兼容现有的 JavaScript 代码和框架，无依赖关系

## 安装

您可以通过以下方法安装 Stanz 库：
- 在 HTML 中直接引入：

```html
<script src="https://cdn.jsdelivr.net/npm/stanz/dist/stanz.min.js"></script>
```

- 使用 npm 安装：

```bash
npm install stanz
# 或者使用 yarn： yarn add stanz
```

## 基本概念

在使用 Stanz 库之前，了解一些基本概念是很重要的： 
- **实例** ：Stanz 库操作的对象或数组实例。 
- **观察** ：使用 `watch` 方法来监视实例属性的变化。 
<!-- - **路径** ：属性在实例中的位置，可以使用点式键路径来指定。 -->

请打开调试模式后，访问 [stanz的例子](https://github.com/ofajs/stanz/tree/main/examples) 目录中的对应文件，以便您快速理解stanz的用途。点击进入 [watch](https://kirakiray.github.io/stanz/examples/watch.html) 的在线案例；

## 创建实例

要使用 Stanz 库，首先需要创建一个实例对象。可以使用 `stanz` 函数来创建实例对象。

```javascript
const stanz = require("stanz"); // 如果是html引入，直接使用 stanz 即可

const data = stanz({
  name: "John",
  age: 30,
});

console.log(data.name); // 输出: John
console.log(data.age); // 输出: 30
```


## 观察属性变化

您可以使用 `watch` 方法来观察实例对象的属性变化。当属性的值发生变化时，将触发相应的回调函数。

```javascript
const data = stanz({
  name: "John",
  age: 30,
});

data.watch((e) => {
  console.log("属性发生变化：", e);
});

data.name = "Mike"; // 属性发生变化： { type: "set", path: [], name: "name", value: "Mike", oldValue: "John" }
```

在上述示例中，我们使用 `watch` 方法观察了 `data` 实例对象的属性变化。当 `name` 属性的值发生变化时，触发的回调函数将输出相应的变化信息。

## 观察子对象的属性变化

`watch` 方法还可以观察子对象的属性变化，包括多层嵌套子对象。当子对象的属性值发生变化时，同样会触发相应的回调函数。

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
  console.log("属性发生变化：", e);
});

data.mother.age = 51; // 属性发生变化： { type: "set", path: [Proxy(mother)], name: "age", value: 51, oldValue: 50 }
```

以上示例展示了如何使用 `watch` 方法观察 `data` 实例对象的属性变化，其中 `mother` 对象的 `age` 属性发生变化时，将输出相应的变化信息。

## 不观察以 `_` 开头的属性

Stanz 的实例默认不会观察以 `_` 开头的属性，这些属性被视为私有属性。修改以 `_` 开头的属性或其子对象属性时，不会触发 `watch` 函数。

```javascript
const data = stanz({
  name: "John",
  _age: 30,
});

data.watch((e) => {
  console.log("属性发生变化：", e);
});

data._age = 51; // 不会触发 watch 函数
```


## 观察数组变化

Stanz 库不仅支持观察对象属性的变化，还可以观察数组的变化。

```javascript
const data = stanz([1, 2, 3]);

data.watch((e) => {
  console.log("数组发生变化：", e);
});

data.push(4); // 数组发生变化： { type: "array", name: "push", target: [1, 2, 3, 4], path: [], args: [4] }
```

在上述示例中，我们使用 `watch` 方法观察了 `data` 数组的变化。当调用 `push` 方法向数组添加新元素时，将输出相应的变化信息。

同样地，也可以观察子对象的属性变化：

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
  console.log("属性发生变化：", e);
});

data.children.push({
  name: "Jack",
  age: 1,
}); // 数组发生变化： { type: "array", name: "push", target: Proxy(children), path: [Proxy(children)], args: [{name:"Jack",age:1}] }
```

## 删除属性的观察

除了观察属性的修改，还可以观察属性的删除变动。

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

以上示例展示了如何使用 `watch` 方法观察属性的删除变动，其中 `name` 属性被删除时，将输出相应的变化信息。

## 更新控制

Stanz 库允许控制属性的更新过程。可以通过 `_update` 属性来临时禁用属性的触发回调函数。

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

在上述示例中，我们使用 `_update` 属性来控制属性的更新过程。将其设置为 `false` 时，属性变化的回调函数不会被触发。再将其设置为 `true` 时，属性变化的回调函数将被触发。

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

上述示例演示了如何通过调用 `unwatch` 方法取消对属性的观察。在取消观察后，对属性的修改将不再触发相应的回调函数。

点此进入 [进阶文档](./more.md)