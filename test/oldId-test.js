// (() => {
let tester = expect(4, 'watch test2');
let xd = stanz({
    a: {
        val: "I am a"
    }
});

// 数据就同步
let xd2 = xd.clone();
xd.sync(xd2);

let oldId1 = xd.a._id;

xd.watch('a', (val, e) => {
    tester.ok(e.trend.oldId == oldId1, "oldId ok1")
});

xd.watch((e) => {
    tester.ok(e.trend.oldId == oldId1, "oldId ok2")
});

let oldId2 = xd2.a._id;

xd2.watch('a', (val, e) => {
    tester.ok(e.trend.oldId == oldId2, "oldId ok3")
});

xd2.watch((e) => {
    tester.ok(e.trend.oldId == oldId2, "oldId ok4")
});



xd.a = {
    val: "change a val"
};
// })();