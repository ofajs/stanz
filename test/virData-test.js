(() => {
    let tester = expect(9, 'virData test');

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
        type: "mapKey",
        mapping: {
            selected: "flash"
        }
    });

    let virB = a.virData({
        // 映射
        type: "mapValue",
        key: "selected",
        mapping: {
            0: 100,
            1: 101,
            2: 102,
            3: 103,
            4: 104
        }
    });

    a.val = "change a val";
    tester.ok(a.val == "change a val", 'change val ok');
    tester.ok(virA.val == "change a val", 'sync virData change val ok 1');
    tester.ok(virB.val == "change a val", 'sync virData change val ok 2');

    tester.ok(virA.d.flash == 2, 'virData mapKey data ok');
    tester.ok(virB.d.selected == 102, 'virData mapValue data ok');

    a.d.selected = 3;

    tester.ok(virA.d.flash == 3, 'virData mapKey sync ok 1');
    tester.ok(virB.d.selected == 103, 'virData mapValue sync ok 1');

    virA.d.flash = 4;

    tester.ok(virA.d.flash == 4, 'virData mapKey sync ok 2');
    tester.ok(virB.d.selected == 104, 'virData mapValue sync ok 2');

})();