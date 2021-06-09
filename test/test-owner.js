(() => {
    const tester = expect(10, "owner test");

    const d = stanz({
        arr: [{
            val: 3,
            sub: {
                val: "val3_sub"
            }
        }, { val: 1 }, { val: 2 }]
    });

    const old_arr = d.arr;
    const old_arr_first = d.arr[0];
    const sub_obj = old_arr_first.sub;

    d.arr = d.arr.filter(e => {
        return e.val < 3;
    });

    tester.ok(old_arr.owner.size === 0, "clear owner ok 1");
    tester.ok(old_arr_first.owner.size === 0, "clear owner ok 2");
    tester.ok(d.arr[0].owner.size === 1, "clear owner ok 3");
    tester.ok(d.arr[0]._xtatus == "sub", "xtatus ok 1");

    tester.ok(d._xtatus === "root", "xtatus ok 2");
    tester.ok(old_arr._xtatus === "revoke", "xtatus ok 3");
    tester.ok(old_arr_first._xtatus === "revoke", "xtatus ok 4");

    let e = stanz({
        val: "eee"
    });
    e.d = d;
    old_arr._xtatus = "root";

    tester.ok(d._xtatus === "sub", "xtatus ok 5");
    tester.ok(old_arr_first.owner.size === 1, "fix owner ok 1");
    tester.ok(d.arr[0].owner.size === 2, "fix owner ok 2");
})();