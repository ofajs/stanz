# Advanced Stanz

## Checking for Property Modifications

You can determine whether a property has been modified by observing the Watcher instance returned by the watch function. The `hasModified` method of the Watcher can be used to check if a property has been modified, while the `hasReplaced` method is used to check if a property has been replaced.

Here's an example code:

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

In the above example, we observe the property changes of the `data` object and the `data.mother` object. By using the `hasModified` and `hasReplaced` methods of the Watcher instance, we can determine whether the properties have been modified.

## Asynchronous Change Listening

The previous `watch` method was synchronous, triggering the observation function immediately upon property changes. However, with the `watchTick` method, you can collect multiple Watcher instances within a certain time frame and return them together as a Watchers instance group.

You can use the same methods, such as `hasModified` and `hasReplaced`, on the returned Watchers instance group as you would with a single Watcher.

Here's an example code:

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

In the above example, we use the `watchTick` method to set a time interval. Within this interval, all Watcher instances will be collected and returned as a Watchers instance group.

You can also specify the triggering time for the `watchTick` method by providing a time interval:

```javascript
data.watchTick((watchers) => {
  // Executes only once within 500 milliseconds
}, 500);
```


## Dot-Style Key Paths

Dot-style key paths are a way to specify the location of a property within an object or array in the Stanz library. Using dot-style key paths allows you to precisely specify the position of the property you want to observe or manipulate.

### Using Dot-Style Key Paths

In the Stanz library, you can use dot-style key paths in multiple places, such as observing property changes or setting property values.

### Observing Property Changes

Observing property changes using dot-style key paths is a common use case. By specifying the dot-style key path of a property within the observation function, you can only observe changes to specific properties.

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
    console.log("Changes in address.city:", e.hasModified("address.city")); // true
    console.log("Changes in address.city:", e.hasReplaced("address.city")); // true
});

data.address.city = "London";
```

In the above example, we use the dot-style key path `"address.city"` to observe changes to the `address.city` property within the `data` object. When the value of the `address.city` property changes, the observation function is triggered, and the corresponding change information is outputted.

### Setting and Retrieving Property Values

Dot-style key paths can also be used to set property values. By specifying the dot-style key path of a property, you can accurately locate the property to be set and modify its value.

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
console.log(data.address.city); // Output: London
```

In the above example, we use the dot-style key path `"address.city"` to set the value of the `address.city` property within the `data` object to `"London"`. By calling the `set` method and specifying the dot-style key path and the value to be set, we successfully modify the value of the property.

Please note that when using dot-style key paths, ensure the correctness of the path and appropriately nest the levels based on the object structure.