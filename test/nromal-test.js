(() => {
    let tester = expect(2, 'normal test');

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
        }
    });

    a.push(b);

    tester.ok(a[1][0].root == a, "root ok");
    tester.ok(b.root == a, "root ok 2");

})();