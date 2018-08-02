(() => {
    let tester = expect(9, '基础测试 (watch)');

    let obj = {
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
    }

    let tdata = stanz(obj);
    window.tdata = tdata;

    let tdata2 = stanz({
        otherA: "i tdata2"
    });
    window.tdata2 = tdata2;

    tdata.sync(tdata2, {
        a: 'otherA'
    });

    let tdata3 = stanz({
        value: "tdata3"
    });
    window.tdata3 = tdata3;

    tdata.sync(tdata3, {
        a: "value"
    });

    tester.ok(tdata._id === obj._id, 'id ok');

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


    tester.ok(tdata3.value === "change a2", 'sync data ok');

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

    let id = 0;
    tdata.watch('c', (val, e) => {
        switch (id) {
            case 0:
                tester.ok(e.type == "delete", "delete type ok");
                break;
            case 1:
                tester.ok(e.type == "new", "add value type ok");
                break
        }
        id++;
    });

    // 删除
    delete tdata.c;

    // 再设定
    tdata.c = {
        backup: {
            val: "I am c.backup"
        },
        val: "I am new c"
    };
})();