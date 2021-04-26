(() => {
    let tester = expect(6, 'mirror test');

    let a = stanz({
        a: "aaaaaa",
        a0: {
            a1: {
                val: "I am a"
            }
        }
    });

    window.b = stanz({
        b: "bbbb",
        b0: a.a0.mirror,
        b2: {
            val: "b222"
        }
    });

    let c = stanz({
        c: "ccccccc",
        c0: {}
    });

    let d = stanz([111]);

    // b.b0 = a.a0.mirror;
    c.c0.c1 = a.a0.mirror;
    d.push(a.a0.mirror);

    a.watch((e) => {
        tester.ok(JSON.stringify(e.trends[0].args) == "[\"val\",\"change val\"]" && JSON.stringify(e.trends[0].keys) == "[\"a0\",\"a1\"]", "a watch ok");
    });
    a.a0.watch(e => {
        tester.ok(JSON.stringify(e.trends[0].args) == "[\"val\",\"change val\"]" && JSON.stringify(e.trends[0].keys) == JSON.stringify(e.trends[0].keys), "a.a0 watch ok");
    });
    b.watch((e) => {
        tester.ok(JSON.stringify(e.trends[0].args) == "[\"val\",\"change val\"]" && JSON.stringify(e.trends[0].keys) == "[\"b0\",\"a1\"]", "b watch ok");
    });
    b.watch("b2", (e) => {
        tester.ok(false, "this can not be emit");
        throw "this can not be emit";
    });
    b.watch("b0", (e) => {
        tester.ok(JSON.stringify(e.trends[0].args) == "[\"val\",\"change val\"]" && JSON.stringify(e.trends[0].keys) == "[\"b0\",\"a1\"]", "b watch key ok");
    });
    c.watch((e) => {
        tester.ok(JSON.stringify(e.trends[0].args) == "[\"val\",\"change val\"]" && JSON.stringify(e.trends[0].keys) == "[\"c0\",\"c1\",\"a1\"]", "c watch ok");
    });
    d.watch(e => {
        tester.ok(JSON.stringify(e.trends[0].args) == "[\"val\",\"change val\"]" && JSON.stringify(e.trends[0].keys) == "[1,\"a1\"]", "d watch ok");
    });

    setTimeout(() => {
        a.a0.a1.val = 'change val';
    }, 100);
})();