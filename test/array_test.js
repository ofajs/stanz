(() => {
    let tester = expect(5, 'array test');

    let tdata = stanz({
        a: "aaaa",
        b: {
            val: "I am b"
        }
    });

    let tdata2 = stanz(tdata.toObject());
    tdata2.sync(tdata);

    let obsFucn;
    tdata.observe(obsFucn = e => {
        tester.ok(e.type == "new", 'observe type ok ');
    });

    tdata.arr = ['111', '222', {
        val: "I am arr1 number3"
    }];

    tdata.unobserve(obsFucn);

    tdata.observe(obsFucn = e => {
        tester.ok(e.type == "uparray", 'observe type ok 2');
        // tester.ok(e.type == "uphost", 'observe type ok 2');
    });

    tdata.watch('arr', (val, e) => {
        tester.ok(e.type == "uparray", 'observe type ok 1');
        // tester.ok(e.type == "uphost", 'observe type ok 1');
    });

    tdata.arr.splice(1, 0, {
        aaa: "aaaaa"
    });

    tester.ok(tdata.arr.length == 4, 'data array ok');

    tester.ok(tdata2.arr.length == 4, 'sync array ok');

    // tdata.arr.splice(1, 0, {
    //     val: "I am new arr element"
    // });
})();