(() => {
    let tester = expect(3, 'event test');


    let a = stanz({
        val: "I am a",
        0: {
            val: "0000"
        },
        1: {
            val: "11111111"
        }
    });

    let bindDataOptions = {
        data: "asdasd"
    };

    a.on('haha', function (e, data) {
        console.log(e);
        tester.ok(this === a, "this ok");
        tester.ok(e.data === bindDataOptions.data, 'binding data ok');
        tester.ok(data === "emit data", "emit data ok");
    }, bindDataOptions);


    a.emit('haha', "emit data");

    console.log(a);
})();