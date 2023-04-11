(() => {
    const tester = expect(8, "delete test");

    const a = stanz({
        c1: {
            val: "i am c1"
        },
        val: "I am a"
    });
    const c1 = a.c1;

    tester.ok(c1.owner.size === 1, "c1 owner size ok 1");

    // 重复使用
    const b = stanz({
        c1, val: "I am b"
    });

    tester.ok(c1.owner.size === 2, "c1 owner size ok 2");

    a.watch(e => {
        tester.ok(e.name == "delete" && e.args[0] == 'c1', "delete ok 1");
    });
    b.watch(e => {
        tester.ok(e.name == "delete" && e.args[0] == 'c1', "delete ok 2");
    });

    c1.watch(e => {
        tester.ok(true, "watch ok");
    });

    // 删除当前属性
    a.delete("c1");
    // delete a.c1;

    tester.ok(c1.owner.size === 1, "c1 owner size ok 3");

    delete b.c1;

    tester.ok(c1.owner.size === 0, "c1 owner size ok 4");

    c1.val = 'change val';

    tester.ok(!a.c1 && !b.c1, "is clear");
})();