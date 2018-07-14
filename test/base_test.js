(() => {
    let tester = expect(5, '基础测试 (watch)');

    let tdata = stanz({
        a: "aaaa",
        b: {
            val: "I am b"
        },
        c: {
            c1: {
                val: "I am c1"
            },
            c2: {
                val: "c2 222222"
            }
        }
    });

    window.tdata = tdata;

    let aFunc;
    tdata.watch('a', aFunc = (val, e) => {
        tester.ok(val === "change a", 'watch ok1');
        tester.ok(e.oldVal === "aaaa", 'watch ok2');
    });

    // 修改a
    tdata.set("a", "change a");

    // 注销后不再触发
    tdata.unwatch('a', aFunc);
    tdata.set("a", "change a2");

    tdata.watch('b', (d, e) => {
        tester.ok(d.val === "change b.val", 'watch ok 5');
    });
    tdata.b.watch('val', (val, e) => {
        tester.ok(val === "change b.val", 'watch ok3');
        tester.ok(e.oldVal === "I am b", 'watch ok4');
    });

    tdata.b.set('val', "change b.val");

})();