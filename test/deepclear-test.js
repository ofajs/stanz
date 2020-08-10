(() => {
    let tester = expect(5, 'deepclear test');

    let data = stanz({
        a: {
            val: "i am a"
        },
        0: {
            val: "i am 0"
        }
    });

    data.watch(() => {
        tester.ok(false, "It's un emit");
    });

    let data2 = data.clone();

    data.sync(data2);

    let a = stanz({
        val: "new a"
    });

    data.a.sync(a);

    setTimeout(() => {
        // 深度清除
        data.deepClear();

        // 修改
        data.a.val = "change a";
        data[0].val = "change 0";
        setTimeout(() => {
            tester.ok(data.a.val === "change a", "change a ok");
            tester.ok(data2.a.val === "i am a", "deepclear ok 1");
            tester.ok(a.val === "new a", "deepclear ok 2");
            tester.ok(data[0].val == "change 0", "change 0 ok");
            tester.ok(data2[0].val == "i am 0", "deepclear ok 3");
        }, 50);
    }, 50);

})();