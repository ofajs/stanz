// 依赖 stanz.js
((glo, stanz) => {
    glo.stanzFromClient = (serverUrl) => new Promise(res => {
        // 返回数据
        let sobj;

        // 打开一个WebSocket:
        var ws = new WebSocket(serverUrl);

        // 回音收集对象
        let oldTrends = new Set();
        let oldTrendsClearTimer;

        // 响应onmessage事件:
        ws.onmessage = function (msg) {
            let data = JSON.parse(msg.data);
            switch (data.type) {
                case "init":
                    // 初始化数据
                    sobj = stanz(data.d);
                    sobj._clientData = {
                        ws
                    };

                    // 监听变动
                    sobj.watch(e => {
                        // 防回音装置，存在过的就不回音了
                        let { trends } = e;

                        trends = trends.filter(e2 => !oldTrends.has(e2.mid));

                        if (!trends.length) {
                            return;
                        }

                        ws.send(JSON.stringify({
                            type: "update",
                            trends
                        }));
                    });

                    res(sobj);
                    break;
                case "update":
                    let { trends } = data;

                    trends.forEach(e => {
                        oldTrends.add(e.mid);
                    });

                    // 接入数据
                    trends.forEach(e => sobj.entrend(e));

                    // 回音延迟3秒
                    clearTimeout(oldTrendsClearTimer);
                    oldTrendsClearTimer = setTimeout(() => {
                        oldTrends.clear();
                    }, 3000);
                    break;
            }
        };

        ws.onclose = () => {
            // 清理数据
            sobj._clientData = null;
        }

        // 定时发送ping
        setInterval(() => {
            ws.send(JSON.stringify({
                type: "ping"
            }));
        }, 30000);
    })
})(window, window.stanz);