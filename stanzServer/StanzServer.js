const stanz = require("../dist/stanz"),
    WebSocket = require('faye-websocket'),
    http = require('http');

// 获取fromKey
const getFromKey = (trend) => {
    let keyOne = trend.keys[0];

    if (keyOne === undefined && (trend.name === "setData" || trend.name === "remove")) {
        keyOne = trend.args[0];
    }

    return keyOne;
}

class StanzServer {
    constructor(data) {
        // 主体stanz对象
        let stanzData = this.stanz = stanz(data || {});

        // 主体server
        let server = this.server = http.createServer();

        // ws仓库
        let hosts = new Set();

        // 服务端推送机制
        stanzData.watch(e => {
            let { trends } = e;
            hosts.forEach(hostObj => {
                let { permitData } = hostObj;

                let filterTrends = trends;

                // 存在unPull时过滤数据
                if (permitData !== true) {
                    filterTrends = trends.filter(trend => {
                        let keyOne = getFromKey(trend);

                        if (permitData.canPull) {
                            if (!permitData.canPull.includes(keyOne)) {
                                return false;
                            }
                        } else if (permitData.unPull && permitData.unPull.includes(keyOne)) {
                            return false;
                        }

                        return true;
                    });
                }

                filterTrends.length && hostObj.send({
                    type: "update",
                    trends: filterTrends
                });
            });
        });

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


                let ws = new WebSocket(request, socket, body);
                let hostObj = new StanzHost(ws);

                // 挂载授权数据
                hostObj.permitData = permitData;

                ws.on('message', (event) => {
                    let data = JSON.parse(event.data);
                    switch (data.type) {
                        case "update":
                            // 源装载数据
                            data.trends.forEach(e => {
                                if (permitData !== true) {
                                    let { canPush, unPush } = permitData;
                                    // 获取改正的字段
                                    let keyOne = getFromKey(e);

                                    if (canPush) {
                                        // 允许加入的字段
                                        if (!canPush.includes(keyOne)) {
                                            return;
                                        }
                                    } else if (unPush) {
                                        // 不允许加入的字段
                                        // 在unPush内的，不进行推送
                                        if (unPush.includes(keyOne)) {
                                            return;
                                        }
                                    }
                                }
                                stanzData.entrend(e);
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

                let sendData = stanzData.clone();

                // 修正推送数据
                if (permitData.canPull) {
                    Object.keys(sendData).filter(k => {
                        if (!permitData.canPull.includes(k)) {
                            sendData.remove(k);
                        }
                    });
                } else if (permitData.unPull) {
                    permitData.unPull.forEach(k => {
                        sendData.remove(k);
                    });
                }

                // 初始化数据发送
                hostObj.send({
                    type: "init",
                    d: sendData.object
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