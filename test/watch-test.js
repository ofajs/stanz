// (() => {
let tester = expect(4, 'watch test');
let obj = {
    a: "aaa",
    b: "bbbb",
    c: {
        val: "I am c",
        c_c: {
            val: "I am cc"
        }
    },
    d: {
        val: "I am d"
    },
    0: {
        val: 100
    },
    1: {
        val: 150
    },
    2: {
        val: 50
    },
    length: 3
};

let xd = stanz(obj);

let xd2 = xd.clone();

let xd3 = xd.clone();

// 数据绑定
xd.sync(xd2);
xd2.sync(xd3);

xd.watch('a', (value, e) => {
    tester.ok(value === "change a", "watch [a] ok");
});

// 改动
xd.a = "change a";

tester.ok(xd.a === "change a", "value [a] ok1");
tester.ok(xd2.a === "change a", "value [a] ok2");
tester.ok(xd3.a === "change a", "value [a] ok3");

xd.watch((e) => {
    console.log('watch self => ', e);
});

// 排序
xd.sort((a, b) => {
    return a.val > b.val;
});
// })();