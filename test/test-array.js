(() => {
    const tester = expect(6, "array test");

    let a = stanz([{
        val: 2
    }, {
        val: 3
    }, {
        val: 4
    }, {
        val: 1
    }]);

    // window.a = a;

    let i = 0;
    a.watch(e => {
        switch (i) {
            case 0:
                tester.ok(e.name == "splice" && e.args[0] === 0 && e.args[1] === 0, "unshift succeed");
                break;
            case 1:
                tester.ok(e.name == "splice" && e.args[0] === 2 && e.args[1] === 1 && e.args[2].val == 100, "splice succeed");
                break;
        }

        console.log("watch a => ", e);
        i++;
    });

    a.unshift({
        val: 5
    });

    let s_data = a[2];

    tester.ok(s_data.owner.size === 1, "owner ok 1");

    a.splice(2, 1, { val: 100 });

    tester.ok(s_data.owner.size === 0, "owner ok 2");

    tester.ok(a[2].val == 100, "a[2].val ok");

    let b = stanz([2, 3, 4, 1, 6, 5]);

    b.sort();

    tester.ok(b.join(",") == "1,2,3,4,5,6", 'sort ok');

})();