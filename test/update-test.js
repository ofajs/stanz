(() => {
    let tester = expect(8, 'update test');

    let a = stanz({
        id: "A",
        val: "I am a",
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

    a.one("update", e => {
        console.log(e);
        tester.ok(JSON.stringify(e.keys) == "[1,0]", "keys ok");
        tester.ok(e.modify.genre == "change", "genre ok");
        tester.ok(e.modify.key == "val", "key ok");
        tester.ok(e.modify.value == "change childs 0", "value ok");
        tester.ok(e.modify.oldVal == "childs 0", "oldVal ok");
    });

    a[1][0].val = "change childs 0";

    // 监听数组变动
    a.one("update", e => {
        tester.ok(JSON.stringify(e.keys) == "[1]", "push method keys ok");
        tester.ok(e.modify.genre == "arrayMethod", "push method genre ok");
        tester.ok(e.modify.methodName == "push", "push method methodName ok");
    });

    a[1].push({
        id: "E",
        val: "new val"
    });

    console.log(a);
})();