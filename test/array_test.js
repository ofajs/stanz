(() => {
    let tester = expect(3, 'array test');

    let tdata = stanz({
        a: "aaaa",
        b: {
            val: "I am b"
        }
    });


    let obsFucn;
    tdata.observe(obsFucn = e => {
        tester.ok(e.type == "new", 'observe type ok ');
    });

    tdata.arr = ['111', '222', {
        val: "I am arr1 number3"
    }];

    tdata.unobserve(obsFucn);

    tdata.observe(obsFucn = e => {
        tester.ok(e.type == "uphost", 'observe type ok 2');
    });

    tdata.watch('arr', (val, e) => {
        tester.ok(e.type == "uphost", 'observe type ok 1');
    });

    tdata.arr.splice(1, 1, {
        aaa: "aaaaa"
    });

})();