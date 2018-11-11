(() => {
    let tester = expect(2, 'watch test');

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

    a.one('watch', e => {
        // 快速的改动只会触发一次，val是最后设置的结果
        tester.ok(e.target.val == "change 1-0 2", "watch ok");
    });

    a.watch((e) => {
        tester.ok(e.target.val == "change 1-0 2", "watch ok 2");
    });

    // 同时修改，只会触发最后一个
    a[1][0].val = "change 1-0";
    a[1][0].val = "change 1-0 2";
})();