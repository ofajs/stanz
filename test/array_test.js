(() => {
    let tester = expect(3, 'array test');

    let tdata = stanz({
        a: "aaaa",
        b: {
            val: "I am b"
        }
    });

    window.tdata = tdata;

    tester.ok(Object.keys(tdata._cache).length == 1, 'add array _cache ok 1')

    let obsFucn;
    tdata.observe(obsFucn = e => {
        tester.ok(e.type == "new", 'observe type ok ');
    });

    tdata.arr = ['111', '222', {
        val: "I am arr1 number3"
    }];

    tester.ok(Object.keys(tdata._cache).length == 3, 'add array _cache ok 2')

    tdata.unobserve(obsFucn);

})();