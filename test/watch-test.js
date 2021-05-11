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

    const d = stanz({
        val: "I am d"
    });

    // 只会执行一次
    d.watchUntil(`val == 1`).then(e => {
        tester.ok(e === true && d.val == '1', "watchUntil is ok");
    });

    d.val = 2;


    setTimeout(() => {
        d.val = "1";
        setTimeout(() => {
            d.val = "3";
            setTimeout(() => {
                // 因为只会执行一次，所以不会触发这个了
                d.val = 1;
            }, 100);
        }, 100);
    }, 500);

    let a2 = stanz({
        obj: {
            a: 2,
            arr: [{ val: 1 }, { val: 2 }, { val: 3 }, { val: 4 }]
        }
    });

    a2.watch("obj.arr", e => {
        tester.ok(e.expr == "obj.arr" && e.trends.length == 2, "watch point key ok 2");
    });

    a2.obj.a = 3;
    a2.obj.arr.reverse();
    a2.obj.arr[0].val = 400;




    let g_val = "";
    let g = stanz({
        get val() {
            return g_val;
        },
        set val(val) {
            g_val = val;
        }
    });
    g.watch("val", e => {
        tester.ok(e.trends.length == 1 && e.val == "change val" && e.old === "", "watch get set object ok");
    });

    g.val = "change val";

})();