(() => {
    let tester = expect(10, 'observe test');

    let tdata = stanz({
        a: "aaaa",
        b: {
            val: "I am b"
        },
        c: {
            c1: {
                val: "I am c1"
            },
            c2: {
                val: "c2 222222"
            }
        },
        d: {
            val: "I am d",
            selected: 1
        }
    });

    let obsFun;
    tdata.observe(obsFun = e => {
        tester.ok(1, 'observer key:' + e.key);
    });

    let obsFun2;
    tdata.observe(obsFun2 = e => {
        tester.ok(e.type == "update", 'observer type => key:' + e.key);
    });

    tdata.a = "change a";

    tdata.unobserve(obsFun2);


    tdata.observe(obsFun2 = e => {
        tester.ok(e.type == "uphost", 'observer type => key:' + e.key);
    });

    tdata.c.c1.val = "change c.c1.val";

    tdata.unobserve(obsFun2);

    tdata.unobserve(obsFun);

    // 因为取消监听了，所以不会触发
    tdata.a = "change a2";

    // 删除监听
    let obsFun3;
    tdata.observe(obsFun3 = e => {
        tester.ok(e.type == "delete", 'observe delete ok');
    });
    tdata.watch('c', (val, e) => {
        tester.ok(e.type == "delete", 'watch delete ok');
    });

    delete tdata.c;

    tdata.unobserve(obsFun3);

    let obsFunc4;
    tdata.listen(obsFunc4 = data => {
        // 和observe不同，只会异步触发一次
        tester.ok(tdata === data, 'listen ok');
    });
    tdata.a1 = "a1";
    tdata.a2 = "a2";
    tdata.unlisten(obsFunc4);

    // 监听selected=1的对象是否发生变化
    tdata.listen('[selected=1]', obsFunc4 = (d, e) => {
        // 和observe不同，只会异步触发一次
        tester.ok(tdata === d, 'selected change ok1');
        tester.ok(e.oldTarget[0] === tdata.d, 'selected change ok2');
        tester.ok(e.target[0] === tdata.b, 'selected change ok3');
    });

    // 删除旧的
    delete tdata.d.selected

    // 变成新的
    tdata.b.selected = 1;

})();