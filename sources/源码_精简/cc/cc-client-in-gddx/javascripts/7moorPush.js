/**
 * Created by chenguang on 8/31/15.
 */
handler.push = {
    lastSocketId: null,
    init: function () {
        var socket = io.connect(pushServerUrl, {
            "force new connection": true,reconnectionDelay:3000 ,query: {
                username: session.user.exten,
                password: session.user.password,
                account: session.user.account
            }
        });//socket服务，后面的参数是指disconnect后，再次connect时开启一个新的socket通道
        socket.on("connect", function (data) {
            //掉线自动登录后的处理,去判断在线客服是否存在窗口,然后去获取离线消息展示
            if(handler.push.lastSocketId != null){
                handler.webchat.processAutoOnlineAfterOffline();
            }
        });

        socket.on("error", function (data) {
            console.log('push connection error' + JSON.stringify(data));
        });
        socket.on("socketId", function (socketData) {
            var socketId = socketData.socketId;
            var port = socketData.port;
            var ip = socketData.ip;
            // do something...
            // 如建立跟后端服务的联系，他们之间可以用session维系
            // 后端可以维护这样的关系：{socketId:socketId, ip: ip, port:port, session:session}，
            // 后端服务就可以根据session找寻socketId, ip, port

            //掉线了,记住上一次用户的选择
            if(handler.push.lastSocketId != null){
                var status = "";
                if(handler.webchat.autoClaim == false){
                    status = "close";
                }else{
                    status = "open";
                }
                handler.webchat.updateAutoClaimWebchatSessionStatus(status);

                //added by wangyn 更新离线后上线邮件领取状态
                var emailStatus = "";
                if(handler.email.autoClaim == false){
                    emailStatus = "close";
                }else{
                    emailStatus = "open";
                }
                handler.email.updateAutoClaimEmailSessionStatus(emailStatus);
            }else{
                if(session.user.imClaimStatus == "close"){
                    handler.webchat.autoClaim = false;
                }
            }
            handler.push.lastSocketId = socketId;
            handler.push.newSocket(socketData, socketId);
        });
        socket.on("pushMsg", function (data, fn) {
            //回给服务器进行确认
            if (fn && typeof fn === 'function') {
                fn("success");
            }
            //todo
            // 这里是服务端接收到的事件，根据事件类型进行不同处理
            if (data.Event == 'NewWebchat' || data.Event == "BatchNewWebchat" || data.Event == "GroupMsg" || data.Event == 'NewNotify') {
                //do something...
                handler.webchat.dispatch(data);
            }else if (data.Event == 'ImMonitor'){
                im_monitor_eventProcess(data);
            } else if (data.Event == 'MailMonitor'){
                mail_monitor_eventProcess(data);
            } else if(data.Event == 'IvrSoundTransferNotify'){
                handler.config.callConfig.sound.uploadTransferSuccess(data);
            } else if(data.Event == "NewEmail" || data.Event == "NewEmailNotify"){
                handler.email.dispatch(data);
            } else if(data.Event == 'leakAssignMsg'){
                handler.cdr.dispatch(data.Data);
            } else if(data.Event == 'customerPlan'){
                var param=data.Data||{};
                var msg = "您的客户["+param.custName+"],有未完成的联系计划［" + param.remark + "],请及时查看!";
                dxmsgNotify(param.notifyTime,msg,null,"customerPlan",param);
                //console.info("notify customer plan::"+msg);
                // $().alertmessage('showNotify', msg);
            } else if(data.Event == 'quesNotify'){
                var param=data.Data||{};
                var msg = "您有问卷定于" + param.notifyTime + "回访，请及时回访";
                emitQuesNotify("您有一条问卷回访提醒", msg);
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
            }else if(data.Event == 'business'){
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
    newSocket: function (data, socketId) {
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
        });
    }
}