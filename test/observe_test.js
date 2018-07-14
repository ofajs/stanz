(() => {
    let tester = expect(2, 'observe test');

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

    tdata.a = "change a";

    tdata.c.c1.val = "change c.c1.val";

    tdata.unobserve(obsFun);

    // 因为取消监听了，所以不会触发
    tdata.a = "change a2";
})();