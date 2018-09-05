(() => {
    let tester = expect(12, 'seek test');
    let obj = {
        a: "aaa",
        b: "bbbb",
        c: {
            val: "I am c",
            selected: "1",
            c_c: {
                selected: 1,
                a: 100,
                val: "I am cc",
            }
        },
        d: {
            selected: 0,
            val: "I am d"
        },
        e: {
            val: "I am e"
        },
        0: {
            selected: 2,
            val: 100
        },
        1: {
            aa: 1,
            val: 150
        },
        2: {
            val: 50,
            haha: {
                a: "100",
                selected: 1
            }
        },
        length: 3
    };

    let xd = stanz(obj);

    let xd2 = xd.clone();
    xd.sync(xd2);
    window.xd = xd;

    let cc = xd.c.c_c;

    tester.ok(cc === xd.seek(cc._id), "seek id ok");

    let selectedArr = xd.seek('[selected=1]');
    tester.ok(selectedArr.length === 3, "seek attr length ok");
    tester.ok(selectedArr[0].selected == 1, "seek attr ok 1");
    tester.ok(selectedArr[1].selected == 1, "seek attr ok 2");
    tester.ok(selectedArr[2].selected == 1, "seek attr ok 3");

    tester.ok(xd.seek('[selected]').length === 5, "seek attr ok 4");

    tester.ok(xd.seek('[selected][a=100]').length === 2, "seek attr ok 5");

    xd.listen(e => {
        // 替换原来的e add+1 remove+1
        // splice add+2 remove+1
        console.log('xd listen data =>', e);
        tester.ok(e.add.length == 3, 'xd listen add ok');
        tester.ok(e.remove.length == 2, 'xd listen remove ok');
    });

    // 同步数据一样的待遇
    xd2.listen(e => {
        // 替换原来的e add+1 remove+1
        // splice add+2 remove+1
        console.log('xd2 listen data =>', e);
        tester.ok(e.add.length == 3, 'xd2 listen add ok');
        tester.ok(e.remove.length == 2, 'xd2 listen remove ok');
    });

    xd.listen('[selected=2]', (val, e) => {
        let tar = val[0];
        tester.ok(tar.val == "I am d", 'listen ok');
    });

    // 修改两个select=2的相关数据
    xd[0].selected = 3;
    xd['d'].selected = 2;

    // 替换原来的d
    xd.e = {
        selected: 4
    };

    xd.splice(1, 1, {
        aa: 2
    }, {
        aa: 3
    });

    // 数组操作
    // xd.splice(1, 1, {
    //     val: "I am new data"
    // });
})();