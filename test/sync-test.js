(() => {
    let tester = expect(12, 'sync test');

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

    let d = stanz({
        temp: a[2].object
    });

    // 单项同步数据
    a.watch(e => {
        e.modifys.forEach(trend => {
            b.entrend(trend)
        });
    });

    // 同步数据
    c.sync(a);

    // 映射同步数据
    d.sync(a, {
        temp: "2"
    });

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
        tester.ok(d.temp[0].val == "change [2][0]", "entrend ok 2");

        tester.ok(a[1].val == "new [1]", 'splice ok');
        tester.ok(b[1].val == "new [1]", 'entrend arrayMethod ok');
        tester.ok(c[1].val == "new [1]", 'sync arrayMethod ok 2');
    }, 100);

    // 删除记录
    delete a.val;

    setTimeout(() => {
        tester.ok(!('val' in a), 'delete ok');
        tester.ok(!('val' in b), 'sync delete ok1');
        tester.ok(!('val' in c), 'sync delete ok2');
    }, 100);


    let sObj = stanz([{
        val: 222
    }, {
        val: 555
    }, {
        val: 333
    }, {
        val: 111
    }, {
        val: 444
    }])

    let sObj2 = sObj.clone();
    let sObj3 = sObj.clone();

    sObj.sync(sObj2);
    sObj2.sync(sObj3);

    sObj.sort((a, b) => {
        return a.val - b.val;
    });

    setTimeout(() => {
        tester.ok(sObj[0].val == 111, 'sort ok');
        tester.ok(sObj2[0].val == 111, 'sort sync ok 1');
        tester.ok(sObj3[0].val == 111, 'sort sync ok 2');
    }, 100);

})();