(() => {
    const tester = expect(5, "watch test");

    let c6val = "c6 val";

    let a = stanz({
        c1: {
            val: "i am c1"
        },
        c2: [1, 2, 3],
        c3: [{ val: "c2_1" }, { val: "c2_2" }],
        c4: "1111",
        c6: {
            get val() {
                return c6val;
            },
            set val(value) {
                c6val = value;
            }
        },
        _c7: {
            val: "I am _c7"
        }
    });

    // window.a = a;

    let c = 0;
    let wid = a.watch(function (e) {
        if (c) {
            tester.ok(false, "can not trigger this function");
        }
        c++;
        tester.ok(e.name == "setData" && e.args[0] == "c5", "set data ok 1");

    });

    a.c1.watch(e => {
        tester.ok(e.name == "setData" && e.args[0] == "aaa", "set data ok 2");
    });

    nexter(() => {
        a.c5 = {
            val: "I am c5"
        };

        // 注销watch
        let result = a.unwatch(wid);
        tester.ok(result, "unwatch ok");

        a.c1.aaa = {
            val: "aaaaaaaaaaa"
        };

        a.watch(e => {
            tester.ok(e.name == "setData" && e.args[0] == 'val' && e.args[1] == 'change c6 val', "watch description object ok");
        });

        a.c6.val = "change c6 val";

        tester.ok(a._c7.val == "I am _c7" && !stanz.isxdata(a._c7), "a._c7 is ok");
    });
})();