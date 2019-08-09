(() => {
    let tester = expect(11, 'event test');

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

    let bindDataOptions = {
        data: "asdasd",
        // 只执行一次
        one: 1
    };

    a.addListener({
        type: 'haha',
        callback(e, data) {
            // console.log(e);
            tester.ok(this === a, "this ok");
            tester.ok(e.data === bindDataOptions.data, 'binding data ok');
            tester.ok(data === "emit data", "emit data ok");
            tester.ok(JSON.stringify(e.keys) === "[1,0]", "keys ok 2");
            tester.ok(e.target === a[1][0], "target ok");
            tester.ok(e.currentTarget === a, "currentTarget ok");
        },
        count: 1,
        data: bindDataOptions.data
    });

    a[1].one('haha', e => {
        tester.ok(JSON.stringify(e.keys) === "[0]", "keys ok 1");
    });

    a[1][0].emit('haha', "emit data");

    // 第二次无效，因为是one
    a[1][0].emit('haha', "emit data");

    let etemp = 0;
    a.on('eveid_test#1111', e => {
        tester.ok(e.eventId == "1111", "eveid ok");
        tester.ok(!etemp++, "count ok");
    });

    a.emit('eveid_test');

    // 再次绑定，通过id覆盖旧的方法
    a.on('eveid_test#1111', e => {
        tester.ok(e.eventId == "1111", "eveid ok 2");
    });

    // 再次触发，eveid相同的事件会被覆盖
    a.emit('eveid_test');

    // 覆盖空值就会清除
    a.on('eveid_test#1111', null);

    // 因为清空就没什么触发了
    a.emit('eveid_test');

    // cancel test
    a.on("cancel_test", e => {
        tester.ok(true, "cancel ok");
        e.cancel = true;
    });
    a.on("cancel_test", e => {
        throw "cancel_test error";
    });

    a.emit("cancel_test");
})();