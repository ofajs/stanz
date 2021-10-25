(() => {
    const tester = expect(1, "other test");


    let aaa = stanz({
        val: "aaa"
    });

    let count = 0;
    aaa.watch(e => {
        if (count) {
            throw "loop test error";
        }
        tester.ok(count === 0, "loop test ok");
        count++;
    });

    let bbb = stanz({
        aaa,
        val: "bbb"
    });

    let ccc = stanz({
        bbb,
        val: "ccc"
    });

    aaa.ccc = ccc;
})();