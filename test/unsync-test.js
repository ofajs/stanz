(() => {
    let tester = expect(2, 'unsync test');

    let a = stanz({
        val: "I am a"
    });

    let b = stanz({
        val: "I am b"
    });

    debugger

    a.sync(b);

    debugger

    // a.unsync(b);
    a.remove();

    debugger

})();