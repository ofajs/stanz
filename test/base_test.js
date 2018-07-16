(() => {
    let tester = expect(9, '基础测试 (watch)');

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

    let aFunc;
    tdata.watch('a', aFunc = (val, e) => {
        tester.ok(val === "change a", 'watch ok1');
        tester.ok(e.oldVal === "aaaa", 'watch ok2');
    });

    // 修改a
    tdata.a = "change a";

    // 注销后不再触发
    tdata.unwatch('a', aFunc);
    tdata.a = "change a2";

    let watch_bfunc;
    tdata.watch('b', watch_bfunc = (d, e) => {
        tester.ok(d.val === "change b.val", 'watch ok 5');
    });

    tdata.b.watch('val', (val, e) => {
        tester.ok(val === "change b.val", 'watch ok3');
        tester.ok(e.oldVal === "I am b", 'watch ok4');
    });

    tdata.b.val = "change b.val";
    tdata.unwatch('b', watch_bfunc);

    // 确认数量正确
    tester.ok(Object.keys(tdata._cache).length === 4, "_cache ok 1");

    // 删除
    delete tdata.c;

    // 删除后的数量也正确
    tester.ok(Object.keys(tdata._cache).length === 1, "_cache ok 2");

    // 再设定
    tdata.c = {
        backup: {
            val: "I am c.backup"
        },
        val: "I am new c"
    };

    // 再设定后数量正确
    tester.ok(Object.keys(tdata._cache).length === 3, "_cache ok 3");

    // 替换对象测试
    tdata.b = {
        val_2: "change b",
        bobj: {
            val: "I am b obj"
        }
    };

    tester.ok(Object.keys(tdata._cache).length === 4, "replace object ok");

})();