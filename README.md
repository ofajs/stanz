# Stanz 8

## Using the documentation

- [简体中文](./docs/cn/README.md)

## Introduction

Stanz is a JavaScript library for monitoring property changes in objects and arrays and executing corresponding actions when properties change.

### Features and Advantages

- Lightweight and easy-to-use library
- Supports observing property changes in objects and arrays
- Supports asynchronous observation and batch event triggering
- Compatible with existing JavaScript code and frameworks, no dependencies

## Installation

You can install the Stanz library using the following methods:
- Directly include it in HTML:

```html
<script src="https://cdn.jsdelivr.net/npm/stanz/dist/stanz.min.js"></script>
```

- Install via npm:

```bash
npm install stanz
# Or using yarn: yarn add stanz
```

## Basic Concepts

Before using the Stanz library, it's important to understand some basic concepts: 
- **Instance** : The object or array instance that Stanz operates on. 
- **Watch** : Use the `watch` method to monitor changes in instance properties.<!-- - **Path**: The location of a property in the instance, which can be specified using dot notation. -->

Please open the debug mode and visit the corresponding file in the [examples](https://github.com/kirakiray/stanz/tree/main/examples) directory to quickly understand the usage of stanz. Click [here](https://kirakiray.github.io/stanz/examples/watch.html) to access the online example of "watch", which is particularly useful for understanding the functionality of stanz.

## Creating an Instance

To use the Stanz library, you first need to create an instance object. You can create an instance object using the `stanz` function.

```javascript
const stanz = require("stanz"); // If using HTML, you can directly use `stanz`

const data = stanz({
  name: "John",
  age: 30,
});

console.log(data.name); // Output: John
console.log(data.age); // Output: 30
```


## Observing Property Changes

You can use the `watch` method to observe property changes in instance objects. When the value of a property changes, the corresponding callback function will be triggered.

```javascript
const data = stanz({
  name: "John",
  age: 30,
});

data.watch((e) => {
  console.log("Property changed:", e);
});

data.name = "Mike"; // Property changed: { type: "set", path: [], name: "name", value: "Mike", oldValue: "John" }
```

In the example above, we use the `watch` method to observe property changes in the `data` instance object. When the value of the `name` property changes, the triggered callback function will output the corresponding change information.

## Observing Property Changes in Sub-objects

The `watch` method can also observe property changes in sub-objects, including nested sub-objects. When the value of a property in a sub-object changes, the corresponding callback function will be triggered.

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
  console.log("Property changed:", e);
});

data.mother.age = 51; // Property changed: { type: "set", path: [Proxy(mother)], name: "age", value: 51, oldValue: 50 }
```

The above example demonstrates how to use the `watch` method to observe property changes in the `data` instance object. When the `age` property of the `mother` object changes, the corresponding change information will be output.
## Not Observing Properties Starting with "_"

By default, Stanz instances do not observe properties starting with "*". These properties are considered private. Modifying properties starting with "*" or their sub-object properties will not trigger the `watch` function.

```javascript
const data = stanz({
  name: "John",
  _age: 30,
});

data.watch((e) => {
  console.log("Property changed:", e);
});

data._age = 51; // Does not trigger the watch function
```


## Observing Array Changes

The Stanz library not only supports observing property changes in objects but also in arrays.

```javascript
const data = stanz([1, 2, 3]);

data.watch((e) => {
  console.log("Array changed:", e);
});

data.push(4); // Array changed: { type: "array", name: "push", target: [1, 2, 3, 4], path: [], args: [4] }
```

In the example above, we use the `watch` method to observe changes in the `data` array. When the `push` method is called to add a new element to the array, the corresponding change information will be output.

Similarly, you can also observe property changes in sub-objects:

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
  console.log("Property changed:", e);
});

data.children.push({
  name: "Jack",
  age: 1,
}); // Array changed: { type: "array", name: "push", target: Proxy(children), path: [Proxy(children)], args: [{name:"Jack",age:1}] }
```


## Observing Property Deletions

In addition to observing property modifications, you can also observe property deletions by using the `delete` keyword.

```javascript
const data = stanz({
  name: "John",
  age: 30,
});

data.watch((e) => {
  console.log("Property changed:", e);
});

delete data.name; // Property changed: { type: "delete", target: Proxy(data), path: [], value: undefined, oldValue: "John" }
```

The above example demonstrates how to observe property deletions using the `watch` method. When the `name` property is deleted, the corresponding change information will be output.
## Update Control

The Stanz library allows control over property updates. You can temporarily disable triggering callback functions for property updates using the `_update` property.

```javascript
const data = stanz({
  name: "John",
  age: 30,
});

data.watch((e) => {
  console.log("Property changed:", e);
});

data._update = false;

data.name = "Mike"; // Does not trigger the property change callback

data._update = true;

data.name = "Tom"; // Property changed: { type: "set", target: { name: "Tom", age: 30 }, path: ["name"], value: "Tom", oldValue: "John" }
```



In the example above, we use the `_update` property to control property updates. When it is set to `false`, the callback function for property changes will not be triggered. When it is set to `true`, the callback function for property changes will be triggered.

## Unwatching

In addition to deleting specific watchers, you can also cancel the observation of properties by calling the `unwatch` method.

```javascript
const data = stanz({
  name: "John",
  age: 30,
});

const wid = data.watch((e) => {
  console.log("Property changed:", e);
});

data.name = "Mike"; // Property changed: { type: "set", target: { name: "Mike", age: 30 }, path: ["name"], value: "Mike", oldValue: "John" }

data.unwatch(wid); // Cancel observation of all properties

data.name = "Tom"; // No longer outputs property change information
```

The above example demonstrates how to cancel the observation of properties by calling the `unwatch` method. After canceling the observation, modifications to the properties will no longer trigger the corresponding callback function.

[Advanced Stanz](./docs/en/more.md)