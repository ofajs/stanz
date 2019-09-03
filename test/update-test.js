(() => {
    let tester = expect(8, 'update test');

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
            val: "I am ud"
        },
        _unBubble: ["ud"],
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

    window.a = a;

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

    // 设置同样的值，不会触发update改动
    a.val = "I am a";

    // ud属性在 _unBubble 内，所以不会冒泡
    a.ud.val = "change ud val";

    // ud2对象有 _update = false，内部也不会触发冒泡
    a.ud2.val = "change ud 2";

    let obj = a.object;
    tester.ok(!obj.ud && !obj.ud2, "unBubble and _update=false is Succeed");

    // stanz5开始，新对象也是新值，不能因为结构相同就不是，这样才更js
    // debugger
    // a[0] = {
    //     id: "B",
    //     val: "0000"
    // };

    // a.off('update', errfun);

    // a.one('update', e => {
    //     tester.ok(e.modify.genre == "delete", "delete genre ok");
    // });

    // delete a.nd.ndInner;

    // console.log(a);
})();