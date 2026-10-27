/**
 * Created by chenguang on 8/31/15.
 */
handler.push = {
    init: function () {
        var socket = io.connect(pushServerUrl, {
            "force new connection": true,reconnectionDelay:3000 ,query: {
                username: session.user.exten,
                password: session.user.password,
                account: session.user.account
            }
        });//socket服务，后面的参数是指disconnect后，再次connect时开启一个新的socket通道
        socket.on("connect", function (data) {
            console.log("push connectioned");
        });

        socket.on("error", function (data) {
            console.log('push connection error' + JSON.stringify(data));
        });
        socket.on("socketId", function (socketData) {
            var socketId = socketData.socketId;
            var port = socketData.port;
            var ip = socketData.ip;

            //console.log(socketData);
            // do something...
            // 如建立跟后端服务的联系，他们之间可以用session维系
            // 后端可以维护这样的关系：{socketId:socketId, ip: ip, port:port, session:session}，
            // 后端服务就可以根据session找寻socketId, ip, port
            handler.push.newSocket(socketData);
        });
        socket.on("pushMsg", function (data) {
            //console.log(data);
            //todo
            // 这里是服务端接收到的事件，根据事件类型进行不同处理
            if (data.Event == 'NewWebchat') {
                //do something...
                handler.webchat.dispatch(data);
            } else if (data.Event == 'NewNotify') {
                handler.webchat.dispatch(data);
            } else if (data.Event == 'ImMonitor'){
                im_monitor_eventProcess(data);
            } else if(data.Event == 'IvrSoundTransferNotify'){
                handler.config.callConfig.sound.uploadTransferSuccess(data);
            } else if(data.Event == 'customerPlan'){
                var param=data.Data||{};
                var msg = "您的客户["+param.custName+"],有未完成的联系计划［" + param.remark + "],请及时查看!";
                dxmsgNotify(param.notifyTime,msg,null,"customerPlan",param);
                //console.info("notify customer plan::"+msg);
                // $().alertmessage('showNotify', msg);
            } else if(data.Event == 'saleChance'){
                var param=data.Data||{};
                //console.dir(param);
                var msg = param.content;
                var type = param.type;
                dxmsgNotify("商机提醒", msg,null,type,param);
                if(type=='approvalBusiness'||type=='updateOwner'||type=='assignOut'){
                    handler.customer.refreshCurrentCustomer(param.cid);
                }
                // console.info("notify saleChance::"+msg);
                // $().alertmessage('showNotify', msg);
            } else if(data.Event == 'business'){
                var param=data.Data||{};
                //console.dir(param);
                var msg = param.content;
                dxmsgNotify("工单提醒", msg,null,"business",param);
            }
            //更多业务处理...
        });

        //关闭事件时，调用socket的
        if (window.addEventListener) {
            window.addEventListener("close", function () {
                socket.disconnect();
            });
        } else {
            window.attachEvent("onclose", function () {
                socket.disconnect();
            });
        }
    },
    newSocket: function (data) {
        console.log('push server connection!');
        var action = {
            action: "app.push.pushSocketLogined",
            data: data
        }
        DS.send(action, function (res) {
            if (!res.success) {
                console.log('pushSocketLogined request failure: ' + res.message);
                return;
            }
            console.log('pushSocketLogined request success!');
        });
    }
}