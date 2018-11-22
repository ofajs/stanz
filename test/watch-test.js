(() => {
    let tester = expect(6, 'watch test');

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
        }
    });

    a.one('update', e => {
        // 快速的改动只会触发一次，val是最后设置的结果
        tester.ok(e.target.val == "change 1-0", "change value ok");
        tester.ok(e.keys[0] == 1, "change value key ok");
    });

    a.watch((e) => {
        tester.ok(e.modifys.length == 4, "watch modifys length ok");
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
                debugger
                break;
        }
        cid++;
    });

    // 同时修改，只会触发最后一个
    a[1][0].val = "change 1-0";
    a[1][0].val = "change 1-0 2";
    a[0].selected = 0;
    a[1].selected = 1;
})();