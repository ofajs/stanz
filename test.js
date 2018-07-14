(() => {
    let tester = expect(1, '基础测试');


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

    console.log(tdata);

    tdata
})();