(async () => {
    const tester = expect(4, "seek test");


    let sdata = stanz({
        name: 1,
        target: 2,
        childs: [{
            name: "1",
            target: 1
        }, {
            name: 11
        }, {
            name: 12,
            target: "not",
            childs: [{ name: 121 },
            { name: 122 }, 123]
        }],
        0: {
            name: 2,
            target: 0,
            0: {
                name: 21
            },
            1: {
                name: 22
            }
        },
        1: {
            name: 3,
            childs: [{
                target: 1,
                name: "1"
            }]
        }
    });

    // let datas = sdata.seek((e) => e.name == 1);
    let datas = sdata.seek('name==1');

    tester.ok(datas.length == 3 && !!datas[0].target && !!datas[1].target && !!datas[2].target, "seek datas ok");
    tester.ok(sdata.seek(e => "target" in e).length == 5, "seek datas ok 2");
    tester.ok(sdata.seek('target').length == 4, "seek datas ok 3");
    tester.ok(sdata.seek("childs.length").length == 3, "seek datas ok 4");
})();