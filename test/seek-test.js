let tester = expect(6, 'seek test');
let obj = {
    a: "aaa",
    b: "bbbb",
    c: {
        val: "I am c",
        selected: "1",
        c_c: {
            selected: 1,
            val: "I am cc"
        }
    },
    d: {
        selected: 0,
        val: "I am d"
    },
    0: {
        selected: 2,
        val: 100
    },
    1: {
        val: 150
    },
    2: {
        val: 50,
        haha: {
            selected: 1
        }
    },
    length: 3
};

let xd = stanz(obj);

let cc = xd.c.c_c;

tester.ok(cc === xd.seek(cc._id), "seek id ok");

let selectedArr = xd.seek('[selected=1]');
tester.ok(selectedArr.length === 3, "seek attr length ok");
tester.ok(selectedArr[0].selected == 1, "seek attr ok 1");
tester.ok(selectedArr[1].selected == 1, "seek attr ok 2");
tester.ok(selectedArr[2].selected == 1, "seek attr ok 3");

tester.ok(xd.seek('[selected]').length === 5, "seek attr ok 4");