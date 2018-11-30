(() => {
    let tester = expect(8, 'normal test');

    let a = stanz({
        val: "I am a",
        d: {
            val: "I am d",
            selected: 2,
            t: [111, 222, 333, 444]
        },
        0: {
            v: "I am 0",
            val: "0000",
            selected: 1,
            ha: [333]
        },
        1: {
            val: "11111111",
            selected: "0",
            0: {
                val: "am I childs 0?",
                selected: 0
            }
        }
    });

    let b = stanz({
        val: "I am b",
        obj: {
            val: "b val"
        },
        aMoveObj: {
            val: "I am move Obj"
        }
    });

    let mobj = b.aMoveObj;

    a.push(b);

    tester.ok(a[1][0].root == a, "root ok");
    tester.ok(b.root == a, "root ok 2");
    tester.ok(b.hostkey == 2, "key ok");

    let c = stanz(["111", "222", "333"]);
    c.add("444");
    tester.ok(c.length == 4, "add ok 1");
    c.add("333");
    tester.ok(c.length == 4, "add ok 2");
    c.remove("333");
    tester.ok(c.length == 3, "remove ok");

    // 从别处拿走
    a.moveObj = b.aMoveObj;
    tester.ok(!b.aMoveObj, "move's delete ok");
    tester.ok(a.moveObj === mobj, "move's add ok");

})();