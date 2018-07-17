((glo) => {
    let tester = expect(1, 'trend test');

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
        d: ['11111', '22222222', {
            val: "d_val"
        }]
    });
    window.tdata = tdata;

    tdata.trend(e => {
        debugger
    });

    tester.ok(1, 'asd');
})(window);