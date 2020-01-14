(() => {
    let tester = expect(17, 'virData test');

    let a = stanz({
        tag: "div",
        childs: {
            t1: {
                tag: "preview"
            }
        }
    });

    let b = a.clone();

    a.sync(b, ["tag"]);

    // let vdata = a.virData(([key, value], opt) => {
    //     if (key === "tag") {
    //         return ["type", value];
    //     }
    //     return [key, value];
    // }, ([key, value], opt) => {
    //     if (key === "type") {
    //         return ["tag", value];
    //     }
    //     return [key, value];
    // });


    let vdata2 = a.virData({
        mapKey: {
            tag: "type"
        }
    });

    let vdata = vdata2;

    let vdata3 = a.virData({
        key: "tag",
        mapValue: {
            head: "bigHead"
        }
    });

    tester.ok(vdata.type === "div", "virData ok 1");
    tester.ok(vdata.childs.t1.type === "preview", "virData ok 2");
    tester.ok(vdata2.childs.t1.type === "preview", "virData2 ok 1");

    a.tag = "span";

    tester.ok(a.tag === "span", "set ok");
    tester.ok(vdata.type === "span", "virData ok 3");
    setTimeout(() => {
        tester.ok(b.tag === "span", "sync ok");
    });

    a.head = {
        tag: "head",
        0: {
            tag: "head2"
        }
    };

    tester.ok(a.head.tag === "head", "set ok2");
    tester.ok(vdata.head.type === "head", "virData ok 4");
    tester.ok(a.head[0].tag === "head2", "set ok3");
    tester.ok(vdata.head[0].type === "head2", "virData ok 5");
    tester.ok(vdata2.head[0].type === "head2", "virData2 ok 2");

    a.push({
        tag: "footer",
        val: "I am fotter",
        childs: [{
            tag: 'c-footer'
        }]
    });

    tester.ok(a[0].tag === "footer", "set ok3");
    tester.ok(vdata[0].type === "footer", "virData ok 6");
    tester.ok(vdata[0].childs[0].type === "c-footer", "virData ok 7");
    tester.ok(vdata3.head.tag === "bigHead", "virData3 ok 1");

    // 联动改变
    vdata3.childs.t1.tag = "bigHead";
    tester.ok(a.childs.t1.tag === "head", "res virData ok 1");
    tester.ok(vdata2.childs.t1.type === "head", "res virData ok 2");

})();