(() => {
    let tester = expect(10, 'seek test');

    let a = stanz({
        val: "I am a",
        d: {
            val: "I am d",
            selected: 2,
            t: [111, 222, 333, 444]
        },
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
    tester.ok(a.seek('[selected]').length == 4, 'length ok 3');
    tester.ok(a.seek('[selected][val=0000]')[0] == a[0], 'mult data ok 1');
    tester.ok(a.seek('[val=0000][selected]').length == 1, 'length ok 4');
    tester.ok(a.seek('[=0]').length == 2, 'length ok 5');
    tester.ok(a.seek('[=0][val=11111111]').length == 1, 'mult mark length ok');
    tester.ok(a.seek('d[selected]')[0] == a.d, 'hostKey mark ok');
    tester.ok(a.seek('d[selected]').length == 1, 'hostKey mark length ok');
    tester.ok(a.seek('[t:=333]')[0] == a.d, 'mark ":" ok');
})();