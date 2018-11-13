(() => {
    let tester = expect(2, 'seek test');

    let a = stanz({
        val: "I am a",
        0: {
            val: "0000",
            selected: 1
        },
        1: {
            val: "11111111",
            selected: 0,
            0: {
                val: "childs 0",
                selected: 0
            }
        }
    });

    let arr = a.seek('[selected=1]');
})();