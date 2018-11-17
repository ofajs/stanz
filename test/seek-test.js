(() => {
    let tester = expect(5, 'seek test');

    let a = stanz({
        val: "I am a",
        0: {
            val: "0000",
            selected: 1
        },
        1: {
            val: "11111111",
            selected: "0",
            0: {
                val: "childs 0",
                selected: 0
            }
        }
    });

    let arr = a.seek('[selected=1]');

    tester.ok(arr.length == 1, 'length ok 1');
    tester.ok(a.seek('[selected=0]').length == 2, 'length ok 2');
    tester.ok(a.seek('[selected]').length == 3, 'length ok 3');
    tester.ok(a.seek('[selected][val=0000]').length == 1, 'length ok 4');
    tester.ok(a.seek('[val=0000][selected]').length == 1, 'length ok 5');
})();