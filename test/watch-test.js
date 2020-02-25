(() => {
    let tester = expect(9, 'watch test');

    let a = stanz({
        val: "I am a",
        0: {
            val: "0000",
            selected: 1
        },
        1: {
            val: "11111111",
            selected: 0,
            0: {
                val: "childs 0",
                selected: 0
            }
        },
        p1: {
            p11: {
                val: "I am p11"
            }
        }
    });

    a.one('update', e => {
        // 快速的改动只会触发一次，val是最后设置的结果
        tester.ok(e.target.val == "change 1-0", "change value ok");
        tester.ok(e.keys[0] == 1, "change value key ok");
    });

    // 整体watch
    a.watch((e) => {
        tester.ok(e.trends.length == 6, "watch trends length ok");
    });

    // watch key
    a.watch("1", (e) => {
        tester.ok(e.trends.length == 3, "watch key trends length ok");
    });

    let cid = 0;
    let callFunc;
    a.watch('[selected=1]', callFunc = e => {
        switch (cid) {
            case 0:
                tester.ok(e.val[0] == a[0], "watch ok 1");
                break;
            case 1:
                tester.ok(e.old[0] == a[0], "watch old ok");
                tester.ok(e.val[0] == a[1], "watch ok 2");
                a.unwatch('[selected=1]', callFunc);
                break;
            case 2:
                // unwatch test
                throw "error";
        }
        cid++;
    }, true);

    a.watch("p1.p11.val", (e, val) => {
        tester.ok(val === "change p1.p11.val 2", "watch point key ok");
    });

    // 同时修改，只会触发最后一个
    a[1][0].val = "change 1-0";
    a[1][0].val = "change 1-0 2";
    a[0].selected = 0;
    a[1].selected = 1;
    a.p1.p11.val = "change p1.p11.val";
    a.p1.p11 = { val: "change p1.p11.val 2" };

    let b = stanz({
        0: {
            val: "i am zero"
        },
        b1: {
            val: "i am b1"
        },
        c: {
            val: "i am c"
        }
    });

    b.watch(/[\d]/, e => {
        tester.ok(e.trends.length === 2, "RegExp watch ok");
    });

    b[0].val = "change 0 val";
    b["b1"].val = "change b1 val";
    b["c"].val = "change c val";

})();