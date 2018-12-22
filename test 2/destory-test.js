(() => {
    let tester = expect(2, 'destory test');

    let a = stanz({
        id: "A",
        val: "I am a",
        0: {
            id: "B",
            val: "0000"
        },
        1: {
            id: "C",
            val: "11111111",
            0: {
                id: "D",
                val: "childs 0"
            }
        }
    });

    a[1].one("destory", e => {
        tester.ok(1, 'destory ok 1');
    });

    a[1][0].one("destory", e => {
        tester.ok(1, 'destory ok 2');
    });

    a[1] = {
        id: "C2",
        val: "change B2"
    }
})();