(() => {
    let tester = expect(4, 'sync test');

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

    // 克隆数据
    let b = a.clone();

    // 单项同步数据
    a.on('watch', e => {
        b.entrend(e.trend);
    });

    // 改动
    a[1][0].val = "change [1][0]";

    // 是异步改动的，所以加setTimeout
    setTimeout(() => {
        tester.ok(a[1][0].val == "change [1][0]", "change data ok");
        tester.ok(b[1][0].val == "change [1][0]", "entrend ok");
    }, 10);

})();