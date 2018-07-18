((glo) => {
    let tester = expect(5, 'trend test');

    let tdata = stanz({
        a: "aaaa",
        av: "",
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
        d: ['11111', '22222222', {
            val: "d_val"
        }]
    });
    window.tdata = tdata;

    let tdata_2 = stanz(tdata.toObject());

    window.tdata_2 = tdata_2;

    // 数据修正
    tdata.sync(tdata_2);

    // 监听tdata_2
    tdata_2.observe(d => {
        tester.ok(1, 'observe ok , key:' + d.key);
    });

    // 改变tdata，后续也会改变tdata_2
    tdata.b.val = "change b";

    tester.ok(tdata.b.val == "change b", 'syncData ok1');
    tester.ok(tdata_2.b.val == "change b", 'syncData ok2');

    // 解除绑定
    tdata_2.unsync(tdata);

    // 再次改变，这里不会绑定
    tdata.a = "change a 2";

    tester.ok(tdata.a == "change a 2", 'syncData ok3');
    tester.ok(tdata_2.a == "aaaa", 'syncData ok4');


})(window);