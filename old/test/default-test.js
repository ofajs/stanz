(async () => {
    // const tester = expect(5, "method test");


})();

// (async () => {
//     const tester = expect(5, "safe mode test");

//     let a = stanz({
//         val: "a",
//         0: {
//             val: "i am 0"
//         },
//         get(target, property, receiver) {
//             if (property == "1") {
//                 return {
//                     val: "11111"
//                 };
//             }
//             return Reflect.get(target, property, receiver);
//         },
//         ownKeys(target) {
//             let keys = Reflect.ownKeys(target);
//             keys.splice(1, 0, "1");
//             return keys;
//         },
//         getOwnPropertyDescriptor(target, key) {
//             if (key == "1") {
//                 return {
//                     enumerable: true,
//                     configurable: true,
//                 }
//             }
//             return Reflect.getOwnPropertyDescriptor(target, key);
//         }
//     });

//     window.a = a;
// })();