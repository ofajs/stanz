const stanz = require("../dist/stanz"),
    WebSocket = require('faye-websocket'),
    http = require('http');

class StanzServer {
    constructor(data) {
        // 主体stanz对象
        let stanzData = this.stanz = stanz(data || {});

        // 主体server
        let server = this.server = http.createServer();

        // ws仓库
        let hosts = new Set();

        // 转链 websocket
        server.on('upgrade', async (request, socket, body) => {
            if (WebSocket.isWebSocket(request)) {
                // 授权数据
                let permitData = await this.onpermit(request);

                if (!permitData) {
                    // 授权不通过
                    socket.end();
                    return;
                }

                if (permitData != true) {
                    // 设置授权数据
                }

                let ws = new WebSocket(request, socket, body);
                let hostObj = new StanzHost(ws);

                ws.on('message', (event) => {
                    let data = JSON.parse(event.data);
                    switch (data.type) {
                        case "update":
                            // 源装载数据
                            data.trends.forEach(e => stanzData.entrend(e));

                            // 给其他ws数据发送
                            hosts.forEach(e => {
                                if (e != hostObj) {
                                    e.send(data);
                                }
                            });
                            break;
                        case "ping":
                            hostObj.send({ type: "pong" });
                            break;
                        case "msg":
                            this.onmsg && this.onmsg(data.data, hostObj);
                            break;
                    }
                });

                ws.on('close', function (event) {
                    ws = null;
                    hosts.delete(hostObj);
                    console.log('close => ', hosts);
                });

                // 添加进仓库
                hosts.add(hostObj);

                console.log('add => ', hosts);

                // 初始化数据发送
                hostObj.send({
                    type: "init",
                    d: stanzData.object
                });
            }
        });
    }

    // 监听服务器
    listen(port = 8000) {
        this.server.listen(port);
    }

    // 允许加入callback
    onpermit(request) {
        return new Promise(res => res(true));
    }
}

class StanzHost {
    constructor(ws) {
        this.ws = ws;
    }

    // 发送数据
    send(data) {
        this.ws.send(JSON.stringify(data));
    }
}

module.exports = StanzServer;