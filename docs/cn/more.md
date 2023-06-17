# drill进阶

## 判断属性是否有改动

你可以通过观察函数返回的 Watcher 实例来判断属性是否发生了改动。使用 Watcher 的 `hasModified` 方法可以判断属性是否被修改过，而 `hasReplaced` 方法则用于判断属性是否被替换过。

下面是一个示例代码：

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

在上述示例中，我们观察了 `data` 对象和 `data.mother` 对象的属性变化。通过 Watcher 实例的 `hasModified` 和 `hasReplaced` 方法，我们可以判断属性是否发生了改动。

## 异步监听变动

之前的 `watch` 方法是同步的，每次属性变化都会立即触发观察函数。而通过 `watchTick` 方法，你可以在一定时间内收集多个 Watcher 实例，然后一起返回，形成一个 Watchers 实例组。

你可以对返回的 Watchers 实例组使用与单个 Watcher 相同的方法，例如 `hasModified` 和 `hasReplaced`。

下面是一个示例代码：

```javascript
const data = stanz({
  name: "John",
  age: 30,
  mother: {
    name: "Jennifer",
    age: 50,
  },
});

data.watchTick((watchers) => {
  console.log("watchers.length => ", watchers.length); // 3
  console.log('watchers.hasModified("name") => ', watchers.hasModified("name")); // true
  console.log('watchers.hasReplaced("name") => ', watchers.hasReplaced("name")); // true
  console.log('watchers.hasModified("mother") => ', watchers.hasModified("mother")); // true
  console.log('watchers.hasReplaced("mother") => ', watchers.hasReplaced("mother")); // false
});

data.name = "Joker";
data.mother.age = 56;
data.mother.name = "Jennimer";
```

在上述示例中，我们使用 `watchTick` 方法设置了一个时间间隔。在该时间间隔内，所有的 Watcher 实例都会被收集并作为一个 Watchers 实例组返回。

你还可以通过指定的时间间隔来设置 `watchTick` 方法的触发时间：

```javascript
data.watchTick((watchers) => {
  // 在500毫秒内只会执行一次
}, 500);
```


## 点式键路径

点式键路径是在 Stanz 库中用于指定属性在对象或数组中的位置的一种方式。通过点式键路径，你可以精确地指定要观察或操作的属性的位置。

### 使用点式键路径

在 Stanz 库中，你可以在多个地方使用点式键路径，例如观察属性变化、设置属性值等。

### 观察属性变化

使用点式键路径来观察属性的变化是一种常见的用法。通过在观察函数中指定属性的点式键路径，可以仅观察特定属性的变化。

```javascript
const data = stanz({
    name: "John",
    age: 30,
    address: {
        city: "New York",
        country: "USA",
    },
});

data.watch((e) => {
    console.log("address.city 变化：", e.hasModified("address.city")); // true
    console.log("address.city 变化：", e.hasReplaced("address.city")); // true
});

data.address.city = "London";
```

在上述示例中，我们使用点式键路径 `"address.city"` 来观察 `data` 对象中 `address.city` 属性的变化。当 `address.city` 属性的值发生改变时，观察函数将被触发，并输出相应的变化信息。

### 设置和获取属性值

点式键路径也可以用于设置属性的值。通过指定属性的点式键路径，你可以准确地定位要设置的属性，并修改其值。

```javascript
const data = stanz({
  name: "John",
  age: 30,
  address: {
    city: "New York",
    country: "USA",
  },
});

data.set("address.city", "London");
console.log(data.address.city); // 输出: London
```

在上述示例中，我们使用点式键路径 `"address.city"` 来设置 `data` 对象中 `address.city` 属性的值为 `"London"`。通过调用 `set` 方法并指定点式键路径和要设置的值，我们成功修改了属性的值。 

请注意，在使用点式键路径时要确保路径的正确性，并根据对象结构进行适当的层级嵌套。
