(() => {
    let tester = expect(4, 'sync test');

    let a = stanz({
        val: "I am a",
        0: {
            val: "0000",
            selected: 1
        },
        1: {
            val: "[1]"
        },
        2: {
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

    // 克隆数据
    let c = a.clone();

    // 单项同步数据
    a.on('watch', e => {
        b.entrend(e.trend)
    });

    // 同步数据
    c.sync(a);

    // 改动
    a[2][0].val = "change [2][0]";

    // 删除某个数
    a.splice(1, 1, {
        val: "new [1]"
    });

    // 是异步改动的，所以加setTimeout
    setTimeout(() => {
        tester.ok(a[2][0].val == "change [2][0]", "change data ok");
        tester.ok(b[2][0].val == "change [2][0]", "entrend ok");

        tester.ok(a[1].val == "new [1]", 'splice ok');
        tester.ok(b[1].val == "new [1]", 'entrend arrayMethod ok');
    }, 10);

    window.a = a;

})();