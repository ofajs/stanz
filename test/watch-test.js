// (() => {
let tester = expect(18, 'watch test');
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

let xd4 = stanz({});

xd.sync(xd4, {
    "a": "aaa"
});

// 数据绑定
xd.sync(xd2);
xd2.sync(xd3);

let f;
xd.watch('a', f = (value, e) => {
    tester.ok(e.type === "update", "type update ok");
    tester.ok(value === "change a", "watch [a] ok");
});

// 改动
xd.a = "change a";

xd.unwatch('a', f);

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

// 检查排序
tester.ok(xd[0].val === 50 && xd[1].val === 100 && xd[2].val === 150, "sort ok1");
tester.ok(xd2.string === xd.string, "sync sort ok1");
tester.ok(xd3.string === xd.string, "sync sort ok2");

// 换成对象
xd.watch('a', f = (value, e) => {
    tester.ok(e.type === "update", "type update ok");
    tester.ok(value.string === `{"val":"I am a"}`, "watch [a] ok");
});

xd.a = {
    val: "I am a"
};
tester.ok(xd2.a.string === `{"val":"I am a"}`, "sync object ok1");
tester.ok(xd3.a.string === `{"val":"I am a"}`, "sync object ok2");

// 在设置一次会无效，因为对象结构是一样的
xd.a = {
    val: "I am a"
};

xd.unwatch('a', f);

xd.watch('a', f = (value, e) => {
    tester.ok(e.type === "delete", "type delete ok");
    tester.ok(!value, "watch [a] ok");
});

// 确认xd4
tester.ok(xd4.aaa.string === `{"val":"I am a"}`, "sync object ok3");


// 删除操作
delete xd.a;

tester.ok(xd2.a === undefined, "delete object ok1");
tester.ok(xd3.a === undefined, "delete object ok2");
tester.ok(xd4.aaa === undefined, "delete object sync ok");

// })();