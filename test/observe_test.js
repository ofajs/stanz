(() => {
    let tester = expect(6, 'observe test');

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

})();