(() => {
    let a = stanz({
        val: "a"
    });

    a.on("update", () => {
        throw "update";
    });

    a.watch(() => {
        throw "watch";
    });

    let clone_a = a.clone();

    clone_a.on("update", e => {
        throw "update 2";
    });

    a.sync(clone_a);

    let vdata1 = a.virData({
        mapKey: {
            val: "haha"
        }
    });

    vdata1.remove();

    a.remove();
})();