const StanzServer = require("./StanzServer");

let server = new StanzServer({
    a: "I am a",
    b: {
        val: "I am b"
    },
    c: {
        0: {
            val: "c0"
        },
        1: {
            val: "c1"
        }
    }
});

// 启动服务器
server.listen(8000);

// other callbacl
server.onmsg = (d, hostObj) => {
    console.log("onmsg => ", d);

    // 返回数据
    setTimeout(() => {
        hostObj.send({
            type: "msg",
            data: {
                val: JSON.stringify(d)
            }
        });
    }, 1000);
}

console.log("server =>", server);