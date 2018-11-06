(() => {
    let tester = expect(5, 'update test');

    let a = stanz({
        val: "I am a",
        0: {
            val: "0000"
        },
        1: {
            val: "11111111",
            0: {
                val: "childs 0"
            }
        }
    });

    a.on("update", e => {
        console.log(e);
        tester.ok(JSON.stringify(e.keys) == "[1,0]", "keys ok");
        tester.ok(e.modify.genre == "change", "genre ok");
        tester.ok(e.modify.key == "val", "key ok");
        tester.ok(e.modify.value == "change childs 0", "value ok");
        tester.ok(e.modify.oldVal == "childs 0", "oldVal ok");
    });

    a[1][0].val = "change childs 0";

    console.log(a);

})();