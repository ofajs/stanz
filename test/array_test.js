(() => {
    let tester = expect(10, 'array and seek test');

    let obj = {
        a: "aaaa",
        b: {
            val: "I am b"
        },
        c: {
            arr: [1, 22, 333, 4444]
        },
        obj1: true
    }

    let tdata = stanz(obj);

    // window.tdata = tdata;

    let tdata2 = stanz(tdata.toObject());
    tdata2.iam = "I am tdata2";
    tdata2.sync(tdata);

    let obsFucn;
    tdata.observe(obsFucn = e => {
        tester.ok(e.type == "new", 'observe type ok ');
    });

    tdata.arr = ['111', '222', {
        val: "I am arr1 number3",
        aa: "aaaaa"
    }];

    tdata.unobserve(obsFucn);

    tdata.observe(obsFucn = e => {
        // tester.ok(e.type == "uparray", 'observe type ok 2');
        tester.ok(e.type == "uphost", 'observe type ok 2');
    });

    tdata.watch('arr', (val, e) => {
        // tester.ok(e.type == "uparray", 'observe type ok 1');
        tester.ok(e.type == "uphost", 'observe type ok 1');
    });

    tdata.arr.splice(1, 1, {
        aa: "aaaaa",
        b: "bbb"
    });

    tester.ok(tdata.arr.length == 3, 'data array ok');

    tester.ok(tdata2.arr.length == 3, 'sync array ok');

    tdata.unobserve(obsFucn);

    let obj2 = {
        aa: "aaaaa",
        carr: "I am c arr"
    };
    tdata.c.arr.splice(1, 1, obj2);

    tester.ok(tdata.c.arr[1]._id === obj2._id, "id ok");

    tester.ok(tdata.seek(tdata.arr[1]._id) === tdata.arr[1], "seek id ok");

    tester.ok(tdata.seek('[val]').length == 2, 'seek data ok 1');

    tester.ok(tdata.seek('[aa=aaaaa]').length == 3, 'seek data ok 2');

    tester.ok(tdata.seek('[aa=aaaaa][b=bbb]').length == 1, 'seek data ok 3');

    // tdata.arr.splice(1, 0, {
    //     val: "I am new arr element"
    // });
})();