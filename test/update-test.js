(() => {
    let tester = expect(11, 'update test');

    let a = stanz({
        id: "A",
        val: "I am a",
        nd: {
            val: "I am nd",
            ndInner: {
                val: "I am ndInner"
            }
        },
        ud: {
            _unBubble: ["val"],
            val: "I am ud"
        },
        ud2: {
            _update: false,
            val: "I am ud2"
        },
        0: {
            id: "B",
            val: "0000"
        },
        1: {
            id: "C",
            val: "11111111",
            0: {
                id: "D",
                val: "childs 0"
            }
        }
    });

    a.one("update", function (e) {
        // console.log(e);
        tester.ok(JSON.stringify(e.keys) == "[1,0]", "keys ok");
        tester.ok(e.modify.name == "setData", "setData ok");
        let args = e.modify.args;
        tester.ok(args[0] == "val", "key ok");
        tester.ok(args[1] == "change childs 0", "value ok");
        tester.ok(e.oldValue == "childs 0", "oldVal ok");
    });

    a[1][0].val = "change childs 0";

    // 监听数组变动
    a.one("update", e => {
        // console.log(e);
        tester.ok(JSON.stringify(e.keys) == "[1]", "push method keys ok");
        tester.ok(e.modify.name == "push", "push method methodName ok");
    });

    a[1].push({
        id: "E",
        val: "new val"
    });

    let errfun;
    a.one('update', errfun = e => {
        // 这个变动是不能触发的
        tester.ok(false, `can't update`)
    });


    a.ud.one("update", e => {
        tester.ok(true, `a.ud update`)
    });

    // 设置同样的值，不会触发update改动
    a.val = "I am a";

    // ud属性在 _unBubble 内，可以出发ud的update，但不会再向上冒泡
    a.ud.val = "change ud val";

    // ud2对象有 _update = false，内部也不会触发冒泡
    a.ud2.val = "change ud 2";

    let obj = a.object;
    tester.ok(!obj.ud.val && !obj.ud2, "_unBubble and _update=false is Succeed");

    // 监听子数组old值变化
    let b = stanz({
        arr: [222, 333, 111]
    });

    b.watch("arr", (e, arr) => {
        tester.ok(JSON.stringify(e.old) === JSON.stringify([222, 333, 111]), "watch old object ok");
        tester.ok(b.arr == arr, "value ok");
    });

    b.arr.unshift(5555, 9);
    b.arr.sort();
})();