(() => {
    let tester = expect(3, 'virData test');

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

    let virA = a.virData({
        // 映射
        type: "map",
        key: "selected",
        toKey: "flash"
    });

    tester.ok(virA.d.flash == 2, 'virData data ok');

    a.d.selected = 3;

    tester.ok(virA.d.flash == 3, 'virData sync ok');

    virA.d.flash = 4;

    tester.ok(virA.d.flash == 4, 'virData sync ok 2');

})();