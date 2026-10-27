/**
 * Created by yaxi on 2015-07-28.
 */
var chatUtils = {
    cssStyleColorMaps:{
        "19CAA6":"-22px 0px" ,
        "00b45f":"-44px 0px" ,
        "b50e03":"-66px 0px" ,
        "f49300":"-88px 0px" ,
        "9ec100":"-110px 0px" ,
        "00cccd":"-132px 0px" ,
        "5b799a":"-154px 0px" ,
        "871F78":"-176px 0px"
    },
    emojiFaces: [
        ['smile', 'smiley', 'laughing', 'blush'],
        ['heart_eyes', 'smirk', 'flushed', 'kissing_heart'],
        ['grin', 'wink', 'stuck_out_tongue_winking_eye', 'stuck_out_tongue_closed eyes'],
        ['sleeping', 'worried', 'expressionless', 'sweat_smile'],
        ['joy', 'cold_sweat', 'sob', 'angry'],
        ['mask', 'scream', 'sunglasses', 'heart'],
        ['broken_heart', 'star', 'anger', 'exclamation'],
        ['question', 'zzz', 'thumbsup', 'thumbsdown'],
        ['ok_hand', 'punch', 'yeah', 'clap'],
        ['muscle', 'pray', 'skull', 'trollface']
    ],

    initFace: function () {
        $("#face-con ul").html("");
        var x = 25, y = 25;
        for (var i = 0; i < chatUtils.emojiFaces.length; i++) {
            for (var j = 0; j < chatUtils.emojiFaces[i].length; j++) {
                var li = '<li title="' + chatUtils.emojiFaces[i][j] + '"><span onclick="window.getEmojiCode(\'' + chatUtils.emojiFaces[i][j] + '\')" title="' + chatUtils.emojiFaces[i][j] + '" class="emoji-face" style="background-position: ' + (-(x * j)) + 'px ' + (-(y * i)) + 'px;"></span></li>';
                $("#face-con ul").append(li);
            }
        }
    },
    regExpEmoji: function (message) {
        if(message == ""){
            return "";
        }
        var convert = true;
        if("string" == typeof message){
            convert = true;
        }else{
            convert = (message.showHtml ==true ||  message.showHtml == "true")? false : true;
            message = message.content;
        }
        if(convert){
            message = message.replace(/</g, "&lt;");
            message = message.replace(/>/g, "&gt;");
        }
        message = message.replace(/\r\n/g, "</br>");
        message = message.replace(/\r/g, "</br>");
        message = message.replace(/\n/g, "</br>");
        var x = 25, y = 25;
        for (var i = 0; i < chatUtils.emojiFaces.length; i++) {
            for (var j = 0; j < chatUtils.emojiFaces[i].length; j++) {
                var span = '<span class="emoji-face" style="background-position: ' + (-(x * j)) + 'px ' + (-(y * i)) + 'px;"></span>';
                var pattern = new RegExp(":" + chatUtils.emojiFaces[i][j] + ":", "g")
                if (message == undefined || message == null || message == "") return;
                message = message.replace(pattern, span);
            }
        }
        return message;
    },

    isFromMobile: function(){
        var agent = navigator.userAgent.toLowerCase();
        var ipad = agent.match(/(ipad).*os\s([\d_]+)/),
            isIphone = !ipad && agent.match(/(iphone\sos)\s([\d_]+)/),
            isAndroid = agent.match(/(android)\s+([\d.]+)/),
            isWinPhone = agent.match(/(windows mobile)\s+([\d.]+)/),
            isMobile = ipad || isIphone || isAndroid || isWinPhone;
        if(isMobile){
            return true;
        }
        return false;
    },

    getImgHtml: function(imgUrl){
        imgUrl = chatUtils.replaceImQiniuDomain(imgUrl, "fs-im-kefu.7moor.com");
        return "<a class ='a_msg_imgandfile' target='_blank' href='"+imgUrl+"'><img class='image' src='"+imgUrl+"?imageView2/2/w/100'></a>";
    },

    getFileHtml: function(content){
        var params = content.split("?fileName=");
        var url = params[0];
        var fileName = "文件";
        var fileSize = "";
        if(params[1]){
            var params2 = params[1].split("?fileSize=");
            fileName = params2[0];
            fileSize = params2[1];
        }
        return "<a class ='a_msg_imgandfile' target='_blank' href='"+url+"'>"+fileName+"</a>";
    },

    getPTag: function () {
        var tag = "";
        if ($.browser.msie && ($.browser.version == "6.0" || $.browser.version == "7.0")) {
            tag = "<i></i>";
        }
        return tag;
    },
    getPTagEle: function () {
        var tag = null;
        if ($.browser.msie && ($.browser.version == "6.0" || $.browser.version == "7.0")) {
            tag = document.createElement("p");
        }
        return tag;
    },
    changeBackgroundColor: function(obj){
        if(chatUtils.cssStyleColorMaps.hasOwnProperty(styleColor)){
            $(obj).css("background-color", "#"+styleColor);
        }else{
            $(obj).css("background-color", "#19CAA6");
        }
    },
    getTimestamp: function () {
        return new Date().getTime();
    },

    getCurrentDate: function () {
        var date = new Date();
        var year = date.getFullYear();
        var month = date.getMonth();
        var day = date.getDate();
        month = month + 1 > 9 ? month + 1 : '0' + (month + 1);
        day = day > 9 ? day : '0' + day;
        return year + "-" + month + "-" + day;
    },

    getCurrentDateTime: function () {
        var date = new Date();
        var hour = date.getHours();
        var minutes = date.getMinutes();
        var seconds = date.getSeconds();
        hour = hour > 9 ? hour : '0' + hour;
        minutes = minutes > 9 ? minutes : '0' + minutes;
        seconds = seconds > 9 ? seconds : '0' + seconds;
        return hour + ":" + minutes + ":" + seconds;
    },

    validateImageType: function(imageType){
        return imageType.indexOf("jpg") == -1 && imageType.indexOf("png") == -1
            && imageType.indexOf("bmp") == -1 && imageType.indexOf("jpeg") == -1
            && imageType.indexOf("gif") == -1
    },
    getCookie: function (key) {
        var strCookie = document.cookie;
        var arrCookie = strCookie.split("; ");
        for (var i = 0; i < arrCookie.length; i++) {
            var arr = arrCookie[i].split("=");
            if (arr[0] == key)
                return arr[1];
        }
        return "";
    },

    setCookie: function (obj, value, exp, domain) {
        var cookieTime = 24 * 60 * 60 * 1000;
        if (exp) {
            cookieTime = cookieTime * exp;
        }
        var d = new Date();
        d.setTime(d.getTime() + cookieTime);
        var cookieExpires = "; expires=" + d.toGMTString();
        var domainStr = "";
        if (domain && domain != undefined) {
            domainStr = "; domain=" + domain;
        }
        if ("string" == typeof obj) {
            document.cookie = obj + "=" + encodeURIComponent(value) + cookieExpires + domainStr + "; path=/";
        } else {
            for (var key in obj) {
                document.cookie = key + "=" + encodeURIComponent(obj[key]) + cookieExpires + domainStr + "; path=/";
            }
        }

    },

    parseQuerystring: function () {
        var href = window.location.href;
        var queryStr = href.substr(href.indexOf("?") + 1);
        if ("string" != typeof queryStr)return {};
        var queryStr = queryStr.trim();
        if ("" === queryStr)return {};

        var json = {};
        try {
            for (var pairs = queryStr.split("&"), i = 0; i < pairs.length; i++) {
                var kv = pairs[i].split("=");
                kv[0] && kv[1] && (json[kv[0]] = decodeURIComponent(kv[1]))
            }
        } catch (e) {

        }
        return json;
    },

    getShowTimeVal: function (dateTime) {
        if (!dateTime || dateTime == undefined || dateTime == 'undefined' || dateTime == 'Invalid date') return "";
        var showtime = "";
        if (chatUtils.getCurrentDate() == dateTime.split(" ")[0]) {
            showtime = dateTime.split(" ")[1];
        } else {
            showtime = dateTime;
        }
        return showtime;
    },

    appendServiceChatMsg: function (companyName, msg, prepend, sys_msg) {
        if(!msg || msg == ""){
            return;
        }
        if (prepend) {
            //判断是否为系统消息
            $(".conversation").prepend(
                "<li class='chatmsg'>" +
                "<p class='service-name'>" + companyName + "</p>" +
                "<div class='outer-left'>" + chatUtils.getPTag() +
                "<div class='service'><pre>" + chatUtils.regExpEmoji(msg) + "</pre></div>" +
                "</div>" + chatUtils.getPTag() +
                "</li>");

        } else {
            if(!sys_msg){
                $(".conversation").append(
                    "<li class='chatmsg'>" +
                    "<p class='service-name'>" + companyName + "</p>" +
                    "<div class='outer-left'>" + chatUtils.getPTag() +
                    "<div class='service'><pre>" + chatUtils.regExpEmoji(msg) + "</pre></div>" +
                    "</div>" + chatUtils.getPTag() +
                    "</li>");
            }else{
                $(".conversation").append(
                    "<li class='chatmsg'>" +
                    "<p class='service-name'>" + companyName + "</p>" + msg +
                    chatUtils.getPTag() +
                    "</li>");
                chatUtils.scrollMsgBoxToBottom();
            }

            if(msg.contentType && msg.contentType == "image"){
                window.setTimeout(function(){
                    chatUtils.scrollMsgBoxToBottom();
                },500);
            }else{
                chatUtils.scrollMsgBoxToBottom();
            }
        }
    },

    appendCustomerChatMsg: function (msg, prepend, prefix) {
        if(!msg || msg == ""){
            return;
        }
        if(prefix == undefined){
            prefix = "";
        }

        if (prepend) {
            $(".conversation").prepend(
                "<li class='chatmsg'>" +
                "<div class='outer-right'>" + chatUtils.getPTag() +
                "<div class='customer' style='align-content: right'>" + prefix + "<pre>"+ chatUtils.regExpEmoji(msg) + "</pre></div>" +
                "</div>" + chatUtils.getPTag() +
                "</li>");

        } else {
            $(".conversation").append(
                "<li class='chatmsg'>" +
                "<div class='outer-right'>" + chatUtils.getPTag() +
                "<div class='customer' style='align-content: right'>" + prefix + "<pre>"+ chatUtils.regExpEmoji(msg) + "</pre></div>" +
                "</div>" + chatUtils.getPTag() +
                "</li>");
            if(msg.contentType && msg.contentType == "image"){
                window.setTimeout(function(){
                    chatUtils.scrollMsgBoxToBottom();
                },500);
            }else{
                chatUtils.scrollMsgBoxToBottom();
            }
        }
    },

    appendGreySystemMsg: function (msg, prepend) {
        if (prepend) {
            $(".conversation").prepend("<li class='showtime'>" + msg + "</li>");
        } else {
            $(".conversation").append("<li class='showtime'>" + msg + "</li>");
        }

    },

    showNoticeMsg: function(msg, showTime){
        $(".sys-msg").stop(true, true);
        $(".sys-msg").hide();
        $(".sys-msg").html(msg).show(300).delay(showTime).hide(300, null, function(){
            $(".sys-msg").html("");
            showSysMsg();
        });
    },

    //将msgbox层的滚动条下拉到最底处
    scrollMsgBoxToBottom: function () {
        $("#wrap").scrollTop(document.getElementById("wrap").scrollHeight);
    },

    ajaxJsonPRequest: function(url, method, timeout, successCallback, errorCallback){
        $.ajax({
            type: method,
            url: url,
            timeout: timeout,
            cache: false,
            dataType: "jsonp",
            jsonp: "callback",
            success: successCallback,
            error: errorCallback,
        });
    },

    ajaxRequest: function(url, method, timeout, data, successCallback, errorCallback){
        var ajaxParam = {
            type: method,
            url: url,
            timeout: timeout,
            cache: false,
            success: successCallback,
            error: errorCallback
        };
        if(data){
            ajaxParam.data = data;
        }
        $.ajax(ajaxParam);
    },

    generateShortUuid : function(uuid){
        var arry =  [ "a", "b", "c", "d", "e", "f",
            "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s",
            "t", "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5",
            "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "I",
            "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V",
            "W", "X", "Y", "Z" ];
        uuid = uuid.replace(/-/g, "");
        var shortBuffer = '';
        for (var i = 0; i < 8; i++) {
            var str = uuid.substring(i * 4, i * 4 + 4);
            var x = parseInt(str, 16);
            shortBuffer += (arry[x % 0x3E]);
        }
        return shortBuffer;
    },
    replaceImQiniuDomain: function (filePath, replaceDomain) {
        var regex = /(http:\/\/7xntwc(.*)clouddn.com\/)|(http:\/\/7xntwc(.*)qiniucdn.com\/)/;
        var newFilePath = filePath.replace(regex, "https://"+replaceDomain+"/");
        newFilePath = newFilePath.replace("http://"+replaceDomain+"/", "https://"+replaceDomain+"/");
        return newFilePath;
    }

};


//全局变量
var cookie_sid = undefined,         // 该次会话的sessionId,从cookie中读取
    isShowHistory = true,           // 跟cookie_sid联合使用判断是否需要展示历史消息，用它判断主要是考虑重连时的情况判断
    since = undefined,              // 记录上一条客服人员消息记录的时间戳
    lastMsgId = undefined,          // 记录上一条客服人员消息记录的messageId
    lastSocketId = undefined,       // 记录上一次socket连接成功时的socketId
    kefu = undefined,               // 记录聊天框中展示的客服人员名称
    companyName = undefined,        // 记录聊天框中展示的公司名
    socket = undefined,             // 记录当次的socket连接对象
    msgArrs = [],                   // 记录系统消息，比如由哪个客服服务
    lastTime = undefined,           // 记录当次历史消息记录中最早的一条消息记录的时间戳
    lastDateTime = undefined,       // 记录当次历史消息记录中最早的一条消息记录的日期时间
    g_since = undefined,            // 记录聊天过程中的展示时间信息时刻的时间戳，用来有频率的展示时间信息
    show_kefu = true,          // 是否展示了由哪个客服服务的系统消息
    lastTimeForSendMsg = undefined, // 上一次用户发送消息时的时间戳
    intervalTime = 600000,          // 10分钟
    chatFinish = false,             // 终结的标志
    retryCount = 0,
    chatTimer = undefined,
    startChat = false,              // 用于用户发言间隔计时，从客服开始说话开始计时
    networkFlag = true,             // 网络好坏的判断
    submitSystemMsg = -1,            // 是否发送系统消息
    tokenTimer,                     // token,用来校验信息的合法性
    token = "",                     // token,用来校验信息的合法性
    tokenTime = "",                 // tokenTime,用来校验信息的合法性
    isRobot = true,                 // 是不是机器人
    webIMCsrDic = undefined,         //满意度字典项
    isInvestigate = true,
    toPeer = "",
    chatWithKefu = false,
    evaluateDo = true,
    qaCatalogList = [],
    globalSet = {},//全局性设置,是否展示留言等
    questionPage = 1,               //问题页面
    questionFlag= true,
    sendsysmsg = false,
    showAgentName = false,
    uploader,
    typeNoticeNum= 0,
    typeNoticeTimerId = null,
    chatbox_input_isFinish = true,
    noRobot = false;

$("#mtypelist li").live("click", function(){
    $(".chattype").hide();
    var data = $(this).attr("ds_data");
    toPeer = data;
    initChat();
});

var init = function(){
    companyName = querys.companyName || "系统";
    toPeer = toPeer || selectPeer;

    if((toPeer == "undefined" || !toPeer) && peers && peers.length > 0){
        if(peers.length >1 ){
            var consultPane = $("#mtypelist");
            consultPane.html("");
            $(".chattype").show();
            var item = '<li ds_data="__id">__name</li>';
            for(var i =0; i< peers.length; i++){

                consultPane.append(item.replace(new RegExp("__id",'g'),peers[i].id).replace(new RegExp("__name",'g'),peers[i].name));
            }

        }else{
            $(".chattype").hide();
            toPeer = peers[0].id;
            initChat();
        }
    }else{
        initChat();
    }
    $("#chatbox_input").removeAttr("disabled");
    $("#chatmsg_submit").removeAttr("disabled");
    $(".ser-company").css("display", "none");
    $(".logo").css("display", "none");
    $("#connect-info").css("display", "block");
    $("#connect-info").html("连接中...");
}
var initChat = function () {
    var newchatUrl = msg_config.proxyMsgUrl + "/chat";
    cookie_sid = chatUtils.getCookie(msg_config.chatCK + msg_config.accessId) || undefined;

    socket = io.connect(msg_config.socketUrl, {
        "force new connection": true,
        reconnectionDelay: 2000,
        timeout:5000,
        query: {accessId: msg_config.accessId, lastSocketId: lastSocketId}
    });

    //认证成功
    socket.on("connect", function () {

    });

    //认证失败
    socket.on("error", function () {
        $(".ser-company").css("display", "none");
        $(".logo").css("display", "none");
        $("#connect-info").html("抱歉，连接认证失败");
    });
    var isSelfDefine = false;
    if(clientId){
        cookie_sid = clientId +"@"+ chatUtils.generateShortUuid(msg_config.accessId);
        isSelfDefine = true;
    }

    socket.on("token", function(tokenData){
        token = tokenData.token;
        tokenTime = tokenData.tokenTime;
    });

    //获取全局设置
    chatUtils.ajaxRequest(newchatUrl, "POST",3000,{data:JSON.stringify({action:'getWebchatGlobleConfig',accessId:msg_config.accessId})}, function(data){
        if(data && data.success){
            globalSet = data.globalSet;
            if(!globalSet.leavemsgTip || globalSet.leavemsgTip == ""){
                globalSet.leavemsgTip = "请留言~";
            }
        }
    });

    //建立socket连接的讯号
    socket.on("socketId", function (socketData) {
        var data = {
            action: "newChat",
            accessId: msg_config.accessId,
            socketId: socketData.socketId,
            key: socketData.key,
            sid: cookie_sid,
            isSelfDefine: isSelfDefine,
            fromUrl: fromUrl,
            urlTitle: encodeURIComponent(urlTitle),
            platform: chatUtils.isFromMobile()? "wap" : "pc",
            toPeer: toPeer,
            otherParams: otherParams,
            lastSocketId: lastSocketId || "",
            seoSource: msg_config.seoSource,
            seoKeywords: msg_config.seoKeywords,
            noRobot : noRobot
        };
        chatUtils.ajaxRequest(newchatUrl, "POST", 3000, {data: JSON.stringify(data)}, function(chatData){
            if (!chatData.success) {
                $("#connect-info").html("非常抱歉，连接失败，如有必要请直接电话联系");
                socket.disconnect();
                retryCount=4;
                return;
            };
            //isRobot = chatData.robot ? true: false;
            socket.emit("token", chatData.sid);

            companyName = chatData.companyName;
            showAgentName = chatData.showAgentName;
            $("#connect-info").css("display", "none");
            $("#ser-company").css("display", "block");
            $(".logo").css("display", "block");
            $("#ser-company").html(companyName);
            if(chatData.companyLogo && $.trim(chatData.companyLogo) != ""){
                $("#logo").attr("src",chatData.companyLogo);
            }else{
                $("#logo").attr("src", "https://fs-test.7moor.com/N00000000264/webchatConfig/2015-08-21/1440149238506/d15a14a0-47e6-11e5-99ce-53231b224927.png");
            }
            if (cookie_sid == undefined || cookie_sid == "undefined") {
                show_kefu = false;
                if(!chatData.robot){
                    $(".sys-msg").stop(true, true);
                    $(".sys-msg").hide();
                    $(".sys-msg").html("系统正在为您分配客服,请稍等...").show(300).delay(1000).hide(300, null, function(){
                        $(".sys-msg").html("");
                        showSysMsg();
                    });
                }else{
                    showSysMsg();
                }
            }

            //当socket重连时，收取未读消息
            if (lastSocketId != undefined && lastSocketId != socketData.socketId) {
                var req = {
                    action: "getMsg",
                    accessId: accessId,
                    sid: cookie_sid,
                    type: "out",
                    status: "undeal",
                    showAgentName: chatData.showAgentName,
                    _t: chatUtils.getTimestamp(),
                    platform:chatUtils.isFromMobile()? "wap" : "pc",
                    since: since
                };
                getMsg(req);
            }
            lastSocketId = socketData.socketId;

            //历史消息
            if (cookie_sid && cookie_sid != undefined && cookie_sid != "undefined" && isShowHistory) {
                var req = {
                    action: "getMsg",
                    accessId: accessId,
                    sid: cookie_sid,
                    pageSize: 20,
                    history: true,
                    companyName: companyName,
                    _t: chatUtils.getTimestamp(),
                    platform: chatUtils.isFromMobile()? "wap" : "pc",
                    robot: chatData.robot,
                    lastTime: chatData.createTimeStamp
                };
                getMsg(req);
            }

            evaluateDo = true;
            isShowHistory = false;

            if (!isSelfDefine && (cookie_sid == undefined || cookie_sid != chatData.sid)) {
                var key = msg_config.chatCK + accessId;
                chatUtils.setCookie(key, chatData.sid, 7);
            }
            cookie_sid = chatData.sid;
            //$('#allQuestion').hide();
            var dataCSR = {
                action: "getImCsrConfig",
                accessId: msg_config.accessId,
                socketId: socketData.socketId,
                key: socketData.key,
                sid: cookie_sid,
                page:1
            };
            chatUtils.ajaxRequest(newchatUrl, "POST", 3000, {data: JSON.stringify(dataCSR)}, function(chatData1){
                qaCatalogList = chatData1.catalogList;
                if(qaCatalogList.length){
                    var ol_pane=$('#allQuestion').find('.question_groups').find('ul');
                    var _quti='';
                    for(var i=0;i<qaCatalogList.length;i++){
                        var _question=qaCatalogList[i];
                        //var num=i+1;
                        _quti+='<li id="'+_question._id+'">'+_question.name+'</li>'
                    }
                    ol_pane.html(_quti);

                    $('.question_groups li').each(function(){
                        $(this).click(function(){
                            var e=$(this);
                            questionPage = 1;
                            //questionFlag = true;
                            $(".question_common").animate({scrollTop:0},0);
                            sedQuestion(e);
                        })
                    });

                    var totalheight = 0;
                    var quest_com=$('.question_common');
                    totalheight = parseFloat(quest_com.height()) + parseFloat(quest_com.scrollTop());
                    quest_com.scroll( function() {
                        totalheight = parseFloat(quest_com.height()) + parseFloat(quest_com.scrollTop());
                        if(totalheight>=$('.question_lis').height()){
                            //questionFlag = true;
                            sedQuestion();
                        }
                    });
                }else{
                    $('#question-btn').hide();
                }

                if(chatData1.csrDic){
                    webIMCsrDic = chatData1.csrDic;

                    var con_path=$('#launch_evaluation .esc_form_easy');
                    var tmpl='<div class="esc_mask"></div><div class="wrap_title">感谢您使用我们的服务，请为此次服务进行评价</div>';
                    con_path.html(tmpl);
                    $.each(webIMCsrDic,function(index,value){
                        con_path.append('<label><input type="radio" name="satisfaction" value="'+value.name+'" key="'+value.key+'"/>'+value.name+'</label>');
                    });
                    var esc_path=$('#esc_form .evaluates li');
                    esc_path.html(' ');
                    var reason_path=$('#esc_form .esc_form_reson');
                    reason_path.html(' ');
                    $.each(webIMCsrDic,function(index,value){
                        esc_path.append('<label><input type="radio" name="name[]" value="'+value.name+'" index="'+ value.index +'"key="'+value.key+'" />'+value.name+'</label>');
                        var reasons=[];
                        reasons=value.reason;
                        var sum='';
                        for(var i=0;i<reasons.length;i++){
                            sum+='<li><label><input type="radio" name="reason[]" index="'+i+'" value="'+reasons[i]+'">'+reasons[i]+'</label></li>';
                        }
                        reason_path.append('<ul class="reasons" index="'+value.index+'">'+sum+'</ul>');
                    });
                }
            });
        }, function (xhr, status, error) {
            if (xhr.statusText != 'success') {
                $("#connect-info").html('请求超时或网络问题,' + status || error);
            }
        });

    });

    socket.on("getMsg", function (data) {
        if (data == 100) {
            if(!startChat){
                lastTimeForSendMsg = chatUtils.getTimestamp();  //初始化为当前时间
                showWarmTip();//当超过一定时间，用户没有发送消息时，直接断开
                startChat = true;
            }
            var req = {
                action: "getMsg",
                accessId: accessId,
                sid: cookie_sid,
                type: "out",
                status: "undeal",
                _t: chatUtils.getTimestamp(),
                platform: chatUtils.isFromMobile()? "wap" : "pc"
            };
            if(!networkFlag){
                req.since = since;
            }
            getMsg(req);
            $(".sys-msg").hide(300);
            $(".sys-msg").html("");
            //window.parent && window.parent.postMessage && (window.parent.postMessage("newMsg", "*"));
        } else if (data.sig == 101) {
            var tmp = kefu;
            kefu = data.su;
            if ("string" != typeof data.su || data.su == "undefined" || data.su == "") {
                kefu = companyName;
            }
            msgArrs.push({type: data.type, kefu: kefu, queueNum: data.queueNum || 0});
            if(tmp == undefined){
                showSysMsg();
            }
            if(tmp && tmp!="" && tmp!="undefined" && data.su != tmp){
                showSysMsg();
            }
            if (!show_kefu || data.type == "redirect" || data.type == "finish" || data.type == "offline" || data.type == "queueNum") {
                showSysMsg();
            }
        }else if (data.sig == 102) {
            msgArrs.push({type: data.type});
            showSysMsg();
        }else if(data == 200){
            var path_con=$('#launch_evaluation').html();
            chatUtils.appendServiceChatMsg("", path_con, false, true);
            $('.esc_form_easy label').each(function(){
                $(this).click(function(e){
                    if(e.target.nodeName=="LABEL") {
                        return;
                    }else if(evaluateDo){
                        $('.esc_form_easy .esc_mask').show();
                        $(this).closest('#wrap').find('#appraise_easy').click();
                        evaluateDo = false;
                    }
                })
            })
        }else if(data.sig == 201){
            isInvestigate = data.isInvestigate;
        }
    });


};


$(".leave_btn").live("click",function(){
    var form = $(this).closest("form[name='leaveMsgForm']");
    submitLeaveMsg(form);
});

$("#leavemsg_content").focus(function(){
    if($("#leavemsg_content").val() == (globalSet.leavemsgTip || "请留言～")){
        $("#leavemsg_content").toggleClass("grey");
        $("#leavemsg_content").val("");
    }

});
$("#leavemsg_content").blur(function(){
    if($("#leavemsg_content").val() == ""){
        $("#leavemsg_content").toggleClass("grey");
        $("#leavemsg_content").val(globalSet.leavemsgTip || "请留言～");
    }
});

$("#leavemsg_phone").focus(function(){
    if($("#leavemsg_phone").val() == "联系电话～"){
        $("#leavemsg_phone").toggleClass("grey");
        $("#leavemsg_phone").val("");
    }
});
$("#leavemsg_phone").blur(function(){
    if($("#leavemsg_phone").val() == ""){
        $("#leavemsg_phone").toggleClass("grey");
        $("#leavemsg_phone").val("联系电话～");
    }

});

$("#leavemsg_email").focus(function(){
    if($("#leavemsg_email").val() == "邮箱～"){
        $("#leavemsg_email").toggleClass("grey");
        $("#leavemsg_email").val("");
    }
});
$("#leavemsg_email").blur(function(){
    if($("#leavemsg_email").val() == ""){
        $("#leavemsg_email").toggleClass("grey");
        $("#leavemsg_email").val("邮箱～");
    }
});

$('#question-btn').bind("click",function(){
    $('#allQuestion').toggle();
});

function sedQuestion (event){
    //event = window.event || arguments[0];
    var _obj = event;
    var _id = '';
    if(_obj){
        $(_obj).addClass('active').siblings().removeClass("active");
        _id = $(_obj).attr('id');
    }else{
        _id = $('.quest_con_id').attr('name');
    }
    if(!_id){
        return;
    }
    var newquwsUrl = msg_config.proxyMsgUrl + "/chat";
    //var _id=$(_obj).attr('id');
    var dataqstFirst = {
        accessId: msg_config.accessId,
        cid     : _id,
        action  : "pullQAMsg",
        qaType  : "queryItemListInf",
        page    : questionPage,
        limit   : 30
    };
    if(questionFlag){
        questionFlag = false;
        chatUtils.ajaxRequest(newquwsUrl, "POST", 3000, {data: JSON.stringify(dataqstFirst)}, function(questData1){
            var temp= [];
            if(questData1){

                temp = questData1.list;
                var _pane=$('.question_common').find('ul');
                var _con=' ';
                _pane.closest('.question_common').find('.quest_con_id').attr('name',_id);

                for(var i=0;i<temp.length;i++){
                    var _sub=temp[i];
                    //var num=i+1;
                    _con += '<li id="'+_sub._id+'">'+_sub.title+'</li>';
                }
                if(_obj){
                    _pane.html(' ');
                    _pane.html(_con);
                }else{
                    _pane.append(_con);
                }
                questionPage+=1;
                _con=' ';
                questionFlag = true;
                $('.question_common li').each(function(){
                    $(this).click(function(){
                        var e=$(this);
                        if($('#allQuestion:visible').length){
                            submitQuestion(e);
                            $(this).closest('#allQuestion').hide();
                        }
                    })
                });
            }
        })
    }

};


function submitLeaveMsg(form){
    var emailReg = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
    var phoneReg = /((\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$)/;

    var leavemsg_content_input = form.find("textarea[name='leavemsg_content']");
    var leavemsg_phone_input = form.find("input[name='leavemsg_phone']");
    var leavemsg_email_input = form.find("input[name='leavemsg_email']");
    var leavemsg_content = $.trim(leavemsg_content_input.val());
    var leavemsg_phone = $.trim(leavemsg_phone_input.val());
    var leavemsg_email = $.trim(leavemsg_email_input.val());
    if($("#leavemsg_content").hasClass("grey") || leavemsg_content == ""){
        $(".tips").html("请填写留言内容").show().delay(1000).fadeOut(500);
        return;
    }
    if(($("#leavemsg_phone").hasClass("grey") && $("#leavemsg_email").hasClass("grey")) || (leavemsg_phone == "" && leavemsg_email == "")){
        $(".tips").html("请务必留下您的任意一个联系方式").show().delay(1000).fadeOut(500);
        return;
    }

    if(!$("#leavemsg_phone").hasClass("grey") && leavemsg_phone != "" && !phoneReg.test(leavemsg_phone)){
        $(".tips").html("电话格式不正确").show().delay(1000).fadeOut(500);
        return;
    }
    if(!$("#leavemsg_email").hasClass("grey") && leavemsg_email != "" && !emailReg.test(leavemsg_email)){
        $(".tips").html("邮箱格式不正确").show().delay(1000).fadeOut(500);
        return;
    }
    if($("#leavemsg_phone").hasClass("grey")){
        leavemsg_phone = "";
    }

    if($("#leavemsg_email").hasClass("grey")){
        leavemsg_email = "";
    }

    $(".leave_btn").attr("disabled", "disabled");
    var msg = {
        action:"leaveMsg",
        message:leavemsg_content,
        phone:leavemsg_phone,
        email:leavemsg_email,
        platform:chatUtils.isFromMobile()? "wap" : "pc",
        accessId:accessId,
        fromUrl:fromUrl.replace("&", "###"),
        urlTitle: urlTitle,
        sid:cookie_sid,
        token: token,
        tokenTime:tokenTime,
        toPeer: toPeer,
        seoSource: msg_config.seoSource,
        seoKeywords: msg_config.seoKeywords
    };
    $.ajax({
        type: "POST",
        url: msg_config.proxyMsgUrl + "/chat",
        timeout: 5000,
        cache: false,
        data: {data: JSON.stringify(msg)},
        success: function (data) {
            $(".leave_btn").removeAttr("disabled");
            if (!data.success) {
                $(".tips").html("非常抱歉！系统或网络问题导致消息发送失败。").show().delay(1500).fadeOut(500);
                return;
            }

            $(".tips").addClass("ok");
            $(".tips").html("留言成功").show().delay(1500).fadeOut(500);
        },
        error: function () {
            $(".leave_btn").removeAttr("disabled");
            $(".tips").html("非常抱歉！系统或网络问题导致消息发送失败。").show().delay(1500).fadeOut(1000);
            retryCount++;
        }
    });
}

function showSysMsg() {
    while (msgArrs.length > 0) {
        var msg = msgArrs[msgArrs.length-1];
        msgArrs = [];
        if (msg.type == "claim") {
            isRobot = false;
            show_kefu = true;
            $(".sys-msg").stop(true, true);
            $(".sys-msg").hide();
            $(".queueNum").closest("li").remove();
            chatUtils.appendGreySystemMsg("客服“" + msg.kefu + "”为您服务");
            $(".queueNum").remove();
            $(".msg-toolbar").find(".manual").remove();
        } else if (msg.type == "redirect") {
            show_kefu = true;
            $(".sys-msg").stop(true, true);
            $(".sys-msg").hide();
            chatUtils.appendGreySystemMsg("接下来由客服“" + msg.kefu + "”为您服务");

        } else if (msg.type == "finish") {
            chatFinish = true;
            $("#chatbox_input").blur();
            $(".queueNum").closest("li").remove();
            kefu = undefined;
            chatUtils.appendGreySystemMsg(chatUtils.getCurrentDateTime());
            chatUtils.appendServiceChatMsg(companyName, "【系统消息】会话已被系统终结，如有需要，欢迎再联系我们");
            socket.disconnect();
            $(".footer").prepend("<div class='chat-finish'>会话结束了</div>");
            clearTimeout(chatTimer);
        }else if(msg.type == "robot"){
            if(msg.kefu && msg.kefu!=companyName){
                isRobot = true;
                show_kefu = true;
                $(".sys-msg").stop(true, true);
                $(".sys-msg").hide();
                chatUtils.appendGreySystemMsg("机器人小智将为您服务");
                var manual = $(".msg-toolbar").find(".manual");
                if(manual.length <= 0){
                    $(".msg-toolbar").append("<div class=\"manual\">转人工服务</div>");
                }
            }else{
                $(".sys-msg").stop(true, true);
                $(".sys-msg").hide();
                $(".sys-msg").html("机器人小智初始化失败,接下来将人工为您服务").show(300).delay(3000).hide(300, null, function(){
                    $(".sys-msg").html("");
                });
            }

        }else if(msg.type == "offline"){
            socket.disconnect();
            cookie_sid = null;

            var manual = $(".msg-toolbar").find(".manual");
            if(globalSet.isLeaveMsg == "1"){
                if(manual.length>0){
                    $(".manual").html("留言");
                    $(".manual").attr("leavemsg", "true");
                }else{
                    $(".msg-toolbar").append("<div class=\"manual\" leavemsg=\"true\">留言</div>");
                }
                $(".sys-msg").stop(true, true);
                $(".sys-msg").hide();
                $(".sys-msg").html("客服不在线, 请留言给我们，我们将尽快给您回复").show(300).delay(3000).hide(300, null, function(){
                    $(".manual").click();
                    $(".sys-msg").html("");
                });
            }else{
                chatUtils.appendServiceChatMsg(companyName, globalSet.msg || "");
                $(".footer").prepend("<div class='chat-finish'>会话结束了</div>");
                chatFinish = true;
            }

        }else if(msg.type == "online"){
            $(".sys-msg").stop(true, true);
            $(".sys-msg").hide();
            $(".sys-msg").html("系统正在为您分配客服,请稍等...").show(100).delay(3000).hide(300, null, function(){
                $(".sys-msg").html("");
                show_kefu= false;
                showSysMsg();
            });


            if(token){
                submitSysMsg();
            }else{
                if(submitSystemMsg == -1){
                    submitSystemMsg = window.setInterval('submitSysMsg()', 1000);
                }

            }
        }else if(msg.type == "queueNum"){
            if(globalSet.queueNumSwitch){
                if(msg.queueNum > 0){
                    // 排队人数在99以上时，置为99+
                    if (msg.queueNum > 99) {
                        msg.queueNum = '99+';
                    }
                    var oldNumStr = $(".queueNum:last").find("font").text();
                    var oldNum = 0;

                    // 判断是否已经在排队
                    if(oldNumStr){
                        // 99+的处理
                        if (oldNumStr === '99+') {
                            oldNum = '99+';
                        } else {
                            oldNum =  parseInt(oldNumStr);
                        }

                        //判断排队人数是否变化
                        if(oldNum!=msg.queueNum){
                            $(".queueNum").closest("li").remove();
                            chatUtils.appendGreySystemMsg("<label class = 'queueNum' >您当前排在第 <font  color='red'>"+msg.queueNum+"</font>位，请耐心等候</label>");
                        }
                    }else{
                        chatUtils.appendGreySystemMsg("<label class = 'queueNum' >您当前排在第 <font  color='red'>"+msg.queueNum+"</font>位，请耐心等候</label>");
                    }
                }else{
                    //不需要排队
                }
            }
        }else if(msg.type == "typeNotice"){
            var str = "客服正在输入...";
            typeNoticeNum++;
            if ($(".sys-msg").html() != str) {
                $(".sys-msg").stop(true, true);
                $(".sys-msg").hide();
            }
            $(".sys-msg").html(str).show(300);
            setTimeout(function () {
                if (typeNoticeNum-- <= 1) {
                    $(".sys-msg").hide(300);
                    $(".sys-msg").html("");
                }
            }, 3000)
        }else if(msg.type == "vipAssignFail"){
            //todo
            $(".chat-isAcceptOther").show();
            $(".vipAssignFail").show();
            //关闭此会话
            if(socket){
                socket.disconnect();
            }
        }
        break;
    }
    chatUtils.scrollMsgBoxToBottom();
}

var t_img; // 定时器
var isLoad = true; // 控制变量
function isImgLoad(callback){
    $('.cover').each(function(){
        if(this.height === 0){
            isLoad = false;
            return false;
        }
    });

    if(isLoad){
        clearTimeout(t_img); // 清除定时器
        callback();
    }else{
        isLoad = true;
        t_img = setTimeout(function(){
            isImgLoad(callback); // 递归扫描
        },500);
    }
}

function getMsg(req) {
    var getMsgUrl = msg_config.proxyMsgUrl + "/chat?data=" + JSON.stringify(req);
    chatUtils.ajaxJsonPRequest(getMsgUrl, "GET", 5000, function (data) {
        var msgArr = data.data;
        if ("undefined" == typeof msgArr || null == msgArr || msgArr == "null" || msgArr == undefined)
            msgArr = [];
        if (req.history) {
            var c_since = undefined;
            var his_since = undefined;
            var his_lastMsgId = undefined;
            if (msgArr.length > 0) {
                var displayName = msgArr[0].kefu;
                if (displayName == undefined || displayName == "undefined" || displayName == "") {
                    displayName = companyName;
                }
                lastTime = msgArr[msgArr.length - 1].when;
            }

            if (msgArr.length > 0) {
                chatUtils.appendGreySystemMsg("——  以上是历史消息  ——", true);
                since = msgArr[0].when;
                lastMsgId = msgArr[0]._id;
            }

            for (var i = 0; i < msgArr.length; i++) {

                if (i == 0) {
                    c_since = msgArr[i].when;
                }
                if (c_since != undefined && c_since - msgArr[i].when > intervalTime) {
                    var showtime = chatUtils.getShowTimeVal(msgArr[i - 1].dateTime);
                    chatUtils.appendGreySystemMsg(showtime, true);
                    c_since = msgArr[i].when;
                }

                var type = msgArr[i].type;
                if (type == "out") {
                    if (his_since && msgArr[i].when > his_since && his_lastMsgId == msgArr[i]._id) {
                        continue;
                    }
                    if(msgArr[i].contentType == "image"){
                        msgArr[i].content = chatUtils.getImgHtml(msgArr[i].content);
                        msgArr[i].showHtml = true;
                    }else if(msgArr[i].contentType == "file"){
                        msgArr[i].content = chatUtils.getFileHtml(msgArr[i].content);
                        msgArr[i].showHtml = true;
                    }
                    chatUtils.appendServiceChatMsg(displayName, msgArr[i] , true);
                    $(".a_msg_imgandfile").parents(".outer-right").addClass("img-file");
                    his_lastMsgId = msgArr[i]._id;
                    his_since = msgArr[i].when;
                } else if (type == "in") {
                    if(msgArr[i].notShow == true || msgArr[i].notShow == "true"){
                        continue;
                    }
                    if(msgArr[i].contentType == "image"){
                        msgArr[i].content = chatUtils.getImgHtml(msgArr[i].content);
                        msgArr[i].showHtml = true;
                    }else if(msgArr[i].contentType == "file"){
                        msgArr[i].content = chatUtils.getFileHtml(msgArr[i].content);
                        msgArr[i].showHtml = true;
                    }
                    chatUtils.appendCustomerChatMsg(msgArr[i], true);
                    $(".a_msg_imgandfile").parents(".outer-right").addClass("img-file");
                }

                if (i == msgArr.length - 1) {
                    var showtime = chatUtils.getShowTimeVal(msgArr[i].dateTime);
                    chatUtils.appendGreySystemMsg(showtime, true);
                    c_since = msgArr[i].when;
                }

            }
            if (msgArr.length >= 20) {
                chatUtils.appendGreySystemMsg("<a href='javascript:void(0)' id='show-more'>查看更多历史消息</a>", true);
            } else if (msgArr.length > 0) {
                chatUtils.appendGreySystemMsg("没有更多了", true);
            }
            // 判断图片加载状况，加载完成后回调
            isImgLoad(function(){
                chatUtils.scrollMsgBoxToBottom();
            });

        } else {
            if ("string" != typeof kefu || kefu == "undefined" || kefu == "") {
                kefu = companyName;
            }
            if(!isRobot && msgArr.length>0 && msgArr[0].user != "system" && msgArr[0].showHtml == false){
                chatWithKefu = true;
            }
            for (var i = 0; i < msgArr.length; i++) {
                //客服名称单独显示
                var kefuName = null;
                if(kefu!=companyName){
                    var userInfo = msgArr[0].users;
                    if(userInfo && msgArr[i].userId && userInfo[msgArr[i].userId]){
                        if(showAgentName){
                            kefuName =userInfo[msgArr[i].userId].displayName;
                        }else{
                            kefuName =userInfo[msgArr[i].userId].exten;
                        }
                    }
                }
                if (msgArr[i].when < since && lastMsgId == msgArr[i]._id) {
                    continue;
                }
                if (g_since != undefined && chatUtils.getTimestamp() - g_since > intervalTime / 2) { //5分钟展示一次时间
                    chatUtils.appendGreySystemMsg(chatUtils.getCurrentDateTime());
                    g_since = chatUtils.getTimestamp();
                }else if(g_since == undefined){
                    chatUtils.appendGreySystemMsg(chatUtils.getCurrentDateTime());
                    g_since = chatUtils.getTimestamp();
                }
                if(msgArr[i].contentType == "image"){
                    msgArr[i].content = chatUtils.getImgHtml(msgArr[i].content);
                    msgArr[i].showHtml = true;
                }else if(msgArr[i].contentType == "file"){
                    msgArr[i].content = chatUtils.getFileHtml(msgArr[i].content);
                    msgArr[i].showHtml = true;
                }
                chatUtils.appendServiceChatMsg(msgArr[i].user == "system" ?companyName :(kefuName|| kefu),  msgArr[i]);
                lastMsgId = msgArr[i]._id;
                since = msgArr[i].when;
                networkFlag = true;
            }
            lastTimeForSendMsg = chatUtils.getTimestamp();
            if(msgArr.length>0 && !$("#chat-voice").hasClass("close")){
                try{
                    $("#warning-tone")[0].play();
                }catch(e){

                }

            }
        }

    },function (xhr, status, error) {
        if(!req.history){
            networkFlag = false;
        }

        if (xhr.statusText != 'success') {
            $(".sys-msg").html('请求超时或网络问题,获取消息失败' + status || error).show(300).delay(5000).hide(300, null, function(){
                $(".sys-msg").html("");
            });
        }
    });


    if (req.history) {
        if(!req.robot){
            $(".sys-msg").html("系统正在为您分配客服,请稍等...").show(300).delay(1000).hide(300, null, function(){
                $(".sys-msg").html("");
            });
            showSysMsg();
        }else{
            show_kefu = false;
            showSysMsg();
        }

        //show_kefu = true;
    }
    //showSysMsg();
};

$("#show-more").live("click", function () {
    $("#show-more").html("<img src='../images/loading.gif'/>");
    var m_since = lastTime;
    var scrollHeight = document.getElementById("wrap").scrollHeight;
    var req = {
        action: "getMsg",
        accessId: accessId,
        sid: cookie_sid,
        pageSize: 20,
        history: true,
        lastTime: lastTime
    };
    var moreUrl = msg_config.proxyMsgUrl + "/chat?data=" + JSON.stringify(req);
    chatUtils.ajaxJsonPRequest(moreUrl, "GET", 5000, function (data) {
        $("#show-more").parent().remove();
        var msgArr = data.data;
        if ("undefined" == typeof msgArr || null == msgArr || msgArr == "null" || msgArr == undefined)
            msgArr = [];

        if (msgArr.length > 0) {
            var displayName = msgArr[0].kefu;
            if (displayName == undefined || displayName == "undefined" || displayName == "") {
                displayName = companyName;
            }
            lastTime = msgArr[msgArr.length - 1].when;
            lastDateTime = msgArr[msgArr.length - 1].dateTime;
        }

        for (var i = 0; i < msgArr.length; i++) {
            var type = msgArr[i].type;

            if (m_since != undefined && m_since - msgArr[i].when > intervalTime) {
                var showtime = "";
                if (i == 0) {
                    showtime = chatUtils.getShowTimeVal(lastDateTime);
                } else {
                    showtime = chatUtils.getShowTimeVal(msgArr[i - 1].dateTime);
                }

                chatUtils.appendGreySystemMsg(showtime, true);
                m_since = msgArr[i].when;
            }
            if (type == "out") {
                if(msgArr[i].contentType == "image"){
                    msgArr[i].content = chatUtils.getImgHtml(msgArr[i].content);
                    msgArr[i].showHtml = true;
                }else if(msgArr[i].contentType == "file"){
                    msgArr[i].content = chatUtils.getFileHtml(msgArr[i].content);
                    msgArr[i].showHtml = true;
                }
                chatUtils.appendServiceChatMsg(displayName, msgArr[i], true);
                $(".a_msg_imgandfile").parents(".outer-right").addClass("img-file");

            } else if (type == "in") {
                if(msgArr[i].notShow == true || msgArr[i].notShow == "true"){
                    continue;
                }
                if(msgArr[i].contentType == "image"){
                    msgArr[i].content = chatUtils.getImgHtml(msgArr[i].content);
                    msgArr[i].showHtml = true;
                }else if(msgArr[i].contentType == "file"){
                    msgArr[i].content = chatUtils.getFileHtml(msgArr[i].content);
                    msgArr[i].showHtml = true;
                }
                chatUtils.appendCustomerChatMsg(msgArr[i], true);
                $(".a_msg_imgandfile").parents(".outer-right").addClass("img-file");
            }
            if (i == msgArr.length - 1) {
                var showtime = chatUtils.getShowTimeVal(msgArr[i].dateTime);
                chatUtils.appendGreySystemMsg(showtime, true);
                m_since = msgArr[i].when;
            }
            $("#wrap").scrollTop(document.getElementById("wrap").scrollHeight - scrollHeight);
        }

        if (msgArr.length >= 20) {
            chatUtils.appendGreySystemMsg("<a href='javascript:void(0)' id='show-more'>查看更多历史消息</a>", true);
        } else {
            chatUtils.appendGreySystemMsg("没有更多了", true);
        }

    }, function (xhr, status, error) {
        $("#show-more").html("加载失败");
    });

});


window.submitMsg = function () {
    chatbox_input_isFinish = true;
    if ($("#chatbox_input").css("color") == "rgb(153, 153, 153)" || $("#chatbox_input").css("color") == "#999" || $("#chatbox_input").val() == "") {
        return;
    }
    if (chatFinish) {
        var message = $("#chatbox_input").val();
        $("#chatbox_input").val("");
        chatUtils.appendCustomerChatMsg(message, false, "<span class='icon-warn'></span>");
        $(".a_msg_imgandfile").parents(".outer-right").addClass("img-file");
        chatUtils.scrollMsgBoxToBottom();
        return;
    }
    var content = $("#chatbox_input").val();
    var msg = {
        sid: cookie_sid,
        accessId: msg_config.accessId,
        content: encodeURIComponent(content),
        contentType: "text",
        action: "newMsg",
        token: token,
        tokenTime:tokenTime
    };

    if (retryCount >= 3) {
        $(".sys-msg").html("非常抱歉，建议您尝试稍后重新打开会话窗口进行咨询").show(300).delay(5000).hide(300, null, function(){
            $(".sys-msg").html("");
        });
        return;
    }
    var submitData = {data: JSON.stringify(msg)};
    sendMsg(submitData, content,function(){
        $("#chatbox_input").val("");
    });
};

function submitQuestion (event){
    //event = window.event || arguments[0];
    var _obj = event;
    var content = "【常见问题推送】"+$(_obj).text();
    var _id=$(_obj).attr('id');
    var msg = {
        sid: cookie_sid,
        accessId: msg_config.accessId,
        content: encodeURIComponent(content),
        contentType: "text",
        action: "pullQAMsg",
        token: token,
        tokenTime:tokenTime,
        qaType : "getKmDetailInf",
        qaItemInfoId:_id
    };
    var submitData = {data: JSON.stringify(msg)};
    sendMsg(submitData, content);

}

function sendMsg(submitData, content, callback){
    var submitUrl = msg_config.proxyMsgUrl + "/chat";
    chatUtils.ajaxRequest(submitUrl, "POST", 3000, submitData, function (data) {
        if (!data.success) {
            $(".sys-msg").html(data.message || "非常抱歉！系统或网络问题导致消息发送失败。").show(300).delay(5000).hide(300, null, function(){
                $(".sys-msg").html("");
            });
            retryCount++;
            return;
        }
        if(retryCount>0){
            retryCount--;
        }

        if(callback){
            callback();
        }
        lastTimeForSendMsg = chatUtils.getTimestamp();
        if (g_since != undefined && chatUtils.getTimestamp() - g_since > intervalTime / 2) { //5分钟展示一次时间
            chatUtils.appendGreySystemMsg(chatUtils.getCurrentDateTime());
        }else if(g_since == undefined){
            chatUtils.appendGreySystemMsg(chatUtils.getCurrentDateTime());
            g_since = chatUtils.getTimestamp();
        }

        if(content){
            chatUtils.appendCustomerChatMsg(content);
            $(".a_msg_imgandfile").parents(".outer-right").addClass("img-file");
        }
        g_since = chatUtils.getTimestamp();
        if(!isRobot){
            chatWithKefu = true;
        }
    }, function () {
        $(".sys-msg").html("非常抱歉！系统或网络问题导致消息发送失败。").show(300).delay(5000).hide(300, null, function(){
            $(".sys-msg").html("");
        });
        retryCount++;
    });
}

//必须分配座席了才会有这个提醒
var showBreakTips = false;
window.showWarmTip = function () {
    var nowTime = chatUtils.getTimestamp();
    var preLen = globalSet.break_len-globalSet.break_tips_len;
    if (globalSet.break_tips_len>=0 && lastTimeForSendMsg && (nowTime - lastTimeForSendMsg > ((globalSet.break_len-globalSet.break_tips_len) * 60000))&& kefu && kefu != companyName) {
        if(!showBreakTips){
            chatUtils.appendGreySystemMsg(chatUtils.getCurrentDateTime());
            chatUtils.appendServiceChatMsg(kefu, globalSet.break_tips || "【系统消息】由于很久没有收到您的消息，系统已自动关闭会话。如有需要，请再联系我们。");
            showBreakTips = true;
        }
        if(globalSet.break_len && nowTime - lastTimeForSendMsg >= (globalSet.break_len*60000)){
            $("#chatbox_input").blur();
            kefu = undefined;
            socket.disconnect();
            $(".footer").prepend("<div class='chat-finish'>会话结束了</div>");
            chatFinish = true;
            clearTimeout(chatTimer);
        }
    }else{
        showBreakTips = false;
    }

    chatTimer = setTimeout('showWarmTip()', 5000);
};

tokenTimer = setInterval(function(){
    if(socket && cookie_sid){
        socket.emit("token", cookie_sid);
    }
}, 300000);

$(".chat-min").live("click", function () {
    window.parent && window.parent.postMessage && (window.parent.postMessage("hideChatBox", "*"));
});

$(".chat-close").live("click", function () {
    $(".vipAssignFail").hide();
    if(chatFinish || $(this).attr("isleavePage") ||!toPeer){
        //webIMCsrDic = undefined;
        resetConfig();
    }else{
        if(isInvestigate == false ||!webIMCsrDic||webIMCsrDic.length==0|| !chatWithKefu){
            $('.judegClose').show();
        }else{
            //评价li的点击事件
            $('#imcsr .evaluates input').each(function(){
                $(this).click(function(){
                    var index=$(this).attr('index');
                    var a=parseInt(index);
                    $('.reasons[index='+a+']').addClass('active').siblings().removeClass("active");
                })
            });
            var _input=$('#imcsr .evaluates input');
            if(_input.length>0){
                _input[0].click();
            }
            //原因li的点击事件
            $('#imcsr .reasons input').each(function(){
                $(this).click(function(){
                    $(this).closest("li").addClass("active").siblings().removeClass("active");
                });
            });
            $('#imcsr .reasons input').each(function(){
                $(this).closest("li").removeClass("active");
            });
            $(".isClose").show();
            $(".isClose").find('.proposal').val('');
        }
    }
});

$(".chatCancelBtn").live("click", function(){
    $(".isClose").hide();
});
$(".judegCancelBtn").live("click", function(){
    $(".judegClose").hide();
});

$(".chatCloseBtn").live("click", function(){
    $(".sys-msg").stop(true, true);
    $(".sys-msg").hide();
    $(".sys-msg").html("");
    $(".conversation").html("");
    $(".isClose").hide();
    //webIMCsrDic = undefined;
    if(uploader){
        uploader.stop();
    }
    resetConfig();
});
$(".judegCloseBtn").live("click", function(){
    $(".sys-msg").stop(true, true);
    $(".sys-msg").hide();
    $(".sys-msg").html("");
    $(".conversation").html("");
    $(".judegClose").hide();
    //webIMCsrDic = undefined;
    if(uploader){
        uploader.stop();
    }
    resetConfig();
});

$(".acceptOtherAgent").live("click", function(){

    var data = {
        action: "acceptOtherAgent",
        sid: cookie_sid,
        accessId:msg_config.accessId
    };
    var newchatUrl = msg_config.proxyMsgUrl + "/chat";
    chatUtils.ajaxRequest(newchatUrl, "POST", 3000, {data: JSON.stringify(data)}, function(result){
        if(result.success){
            $(".vipAssignFail").hide();
            $(".sys-msg").stop(true, true);
            $(".sys-msg").hide();
            $(".sys-msg").html("");
            $(".conversation").html("");
            $(".isClose").hide();
            $(".judegClose").hide();
            $(".chat-isAcceptOther").hide();
            //webIMCsrDic = undefined;
            if(uploader){
                uploader.stop();
            }
            var toPeerTemp = toPeer;
            toPeer=toPeerTemp;
            //显示技能组选择界面，或者按单一技能组进行处理。
            otherParams = JSON.parse(otherParams);
            otherParams.agent="";
            otherParams = JSON.stringify(otherParams);
            resetConfigData();
            noRobot=true;
            initChat();
        }else{
            $(".tips").html("非常抱歉！系统或网络问题导致接入其他坐席失败，请刷新页面重新接入").show().delay(1500).fadeOut(500);
        }
    })
});
$(".refusedOtherAgent").live("click", function(){
    $(".chat-isAcceptOther").hide();
    $(".sys-msg").stop(true, true);
    $(".sys-msg").hide();
    $(".sys-msg").html("");
    $(".conversation").html("");
    $(".vipAssignFail").hide();
    if(uploader){
        uploader.stop();
    }
    resetConfig();
});

$("#chat-voice").live("click", function(){
    $(this).toggleClass("close");
});

$("#chatbox_input").focus(function () {
    if ($("#chatbox_input").css("color") == "rgb(153, 153, 153)" || $("#chatbox_input").css("color") == "#999") {
        $("#chatbox_input").val("");
        $("#chatbox_input").css("color", "#333");
    }
    $("#face-con").css("display", "none");
    $("#allQuestion").hide();
    $(".face-con").animate({top: '0px', height: "0px"});
});

$("#chatbox_input").blur(function () {
    if ($("#chatbox_input").val() == "") {
        $("#chatbox_input").css("color", "#999");
        $("#chatbox_input").val("说点什么吧...");
    }
});

$("#face-btn").click(function () {
    var display = $("#face-con").css("display");
    if (display == "block") {
        $(".face-con").animate({top: '0px', height: "0px"});
        $("#face-con").css("display", "none");
    } else {
        $(".face-con").animate({top: '-85px', opacity: '0.8', height: "85px", width: "100%"});
        $("#face-con").css("display", "block");
        if ($("#chatbox_input").css("color") == "rgb(153, 153, 153)" || $("#chatbox_input").css("color") == "#999")
            $("#chatbox_input").val("");
        $("#chatbox_input").css("color", "#333");
    }
});


$("#face-btn,#image-btn,#file-btn,#question-btn").hover(
    function () {
        chatUtils.changeBackgroundColor(this);
    },
    function () {
        $(this).css("background-color", "#7d7d7d");
    }
);

$("#chatmsg_submit").click(function () {
    submitMsg();
});
$("#appraise,#appraise_easy").click(function () {
    var way='',key='',value='',reason='',proposal='';
    var _close;//判断是否关闭窗口
    var label = new Array();
    if($(this).attr('way')=='in'){
        _close=true;
        way='in';
        var esc_form_pane=$(this).closest('#esc_form');
        key= esc_form_pane.find('.evaluates').find('input:checked').attr('key');
        value = esc_form_pane.find('.evaluates').find('input:checked').attr('value');
        reason = esc_form_pane.find('ul.active').find('li.active').find('input').attr('value');
        label.push(reason);//欢迎为我们的服务提建议
        var _text = esc_form_pane.find('.proposal').val();
        if(_text=="欢迎为我们的服务提建议"){
            proposal='';
        }else{
            proposal=_text;
        }
    }else{
        way = 'out';
        //key = $(this).closest('#wrap').find('.esc_form_easy').find('input:checked').attr('key');
        //value= $(this).closest('#wrap').find('.esc_form_easy').find('input:checked').attr('value');
        var _check = $(this).closest('#wrap').find('.esc_form_easy').find('input:checked');
        var check_num = _check.length-1;
        key = $(_check[check_num]).attr('key');
        value = $(_check[check_num]).attr('value');
    }
    var msg = {
        sid          : cookie_sid,
        accessId     : msg_config.accessId,
        way          : way,
        satisfaction : encodeURIComponent(value),
        proposal     : encodeURIComponent(proposal),
        label        : label,
        appraiseKey  : key,
        action       : "sendWebCSRMsg",
        token        : token,
        tokenTime    : tokenTime
    };
    var submitUrl = msg_config.proxyMsgUrl + "/chat";
    var submitData = {data: JSON.stringify(msg)};
    chatUtils.ajaxRequest(submitUrl, "POST", 3000, submitData, function (data) {
        if (!data.success) {
            $(".sys-msg").html(data.message || "非常抱歉！系统或网络问题导致消息发送失败。").show(300).delay(5000).hide(300, null, function(){
                $(".sys-msg").html("");
            });
            return;
        }
        $(".isClose").hide();
        if(_close){
            $(".sys-msg").stop(true, true);
            $(".sys-msg").hide();
            $(".sys-msg").html("");
            $(".conversation").html("");
            resetConfig();
        }else{
            chatUtils.appendGreySystemMsg("评价成功", false);
        }
        isInvestigate = false;

    }, function () {
        $(".sys-msg").html("非常抱歉！系统或网络问题导致消息发送失败。").show(300).delay(5000).hide(300, null, function(){
            $(".sys-msg").html("");
        });

    });
});

var convertManual = false;
$(".manual").live("click", function(){
    if($(this).attr("leavemsg") == "true"){
        $(".chatcontainer").fadeOut(500, function(){
            $("textarea[name=leavemsg_content]").val(globalSet.leavemsgTip || "请留言~");
            $(".leave-msg-box").fadeIn(500);
        });

        return;
    }
    if(convertManual){
        $(".sys-msg").stop(true, true);
        $(".sys-msg").hide();
        $(".sys-msg").html("系统已帮您转接客服").show(300).delay(3000).hide(300, null, function(){
            $(".sys-msg").html("");
        });
        return;
    }
    var msg ={
        sid: cookie_sid,
        action:"convertManual"
    };
    var convertUrl = msg_config.proxyMsgUrl + "/chat";
    var convertData = {data: JSON.stringify(msg)};
    chatUtils.ajaxRequest(convertUrl, "POST", 3000, convertData, function (data) {
        if (!data.success) {
            if(globalSet.isLeaveMsg == "1"){
                $(".manual").html("留言");
                $(".manual").attr("leavemsg", "true");
                $(".sys-msg").stop(true, true);
                $(".sys-msg").hide();
                $(".sys-msg").html("非常抱歉！客服不在线，请留言给我们。").show(300).delay(3000).hide(300, null, function(){
                    $(".manual").click();
                    $(".sys-msg").html("");
                });
            }else{
                chatUtils.appendServiceChatMsg(companyName, globalSet.msg || "");
                $(".footer").prepend("<div class='chat-finish'>会话结束了</div>");
                chatFinish = true;
            }

            return;
        }
        isRobot = false;
        convertManual = true;
        $(".sys-msg").stop(true, true);
        $(".sys-msg").hide();
        $(".sys-msg").html("系统正在为您分配客服,请稍等...").show(300).delay(3000).hide(300, null, function(){
            $(".sys-msg").html("");
            show_kefu= false;
            showSysMsg();
        });

        submitSysMsg();

    }, function () {
        $(".sys-msg").html("非常抱歉！系统繁忙，转人工服务失败，请稍后再试").show(300).delay(3000).hide(300, null, function(){
            $(".sys-msg").html("");
        });
    });
});

function submitSysMsg(sid){
    if(sendsysmsg){
        return;
    }
    if(token || submitSystemMsg != -1){
        window.clearInterval(submitSystemMsg);
    }else{
        return;
    }

    var msg = {
        sid: sid ? sid: cookie_sid,
        accessId: msg_config.accessId,
        content: "会话来源于<a target='_blank' href='"+fromUrl+"'>"+(urlTitle||fromUrl)+"</a>",
        contentType: "text",
        action: "newMsg",
        showHtml:true,
        notShow: true,
        token: token,
        tokenTime:tokenTime
    };

    var submitUrl = msg_config.proxyMsgUrl + "/chat";
    var submitData = {data: JSON.stringify(msg)};
    chatUtils.ajaxRequest(submitUrl, "POST", 3000, submitData, function(data){sendsysmsg = true;}, function(){});
}

$("#image-btn").live("click", function(){
    var fileInput = document.getElementById("picture");
    fileInput.click();
});

$("#image-btn input").live("change", function(){
    if(chatFinish){
        return false;
    }
    uploadFile();
});


/**
 * 加载七牛上传组件
 * @param url
 * @param callback
 */
function loadQNJs(url, callback) {
    var HEAD = document.getElementsByTagName("head").item(0) || document.documentElement;
    var script = document.createElement("script");
    script.setAttribute("type", "text/javascript");
    script.onload = script.onreadystatechange = function () { //Attach handlers for all browsers
        if (!/*@cc_on!@*/0 || this.readyState == "loaded" || this.readyState == "complete") {
            this.onload = this.onreadystatechange = null;
            this.parentNode.removeChild(this);
            if (typeof(callback) == "function") callback();
        }
    };
    script.setAttribute("src", url);
    HEAD.appendChild(script);
}


function getCurrentDate(){
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth();
    var day = date.getDate();
    var hour = date.getHours();
    var minites = date.getMinutes();
    var second = date.getSeconds();
    month = month + 1 > 9 ? month + 1 : '0' + (month + 1);
    day = day > 9 ? day : '0' + day;
    hour = hour > 9 ? hour : '0' + hour;
    minites = minites > 9 ? minites : '0' + minites;
    second = second > 9 ? second : '0' + second;
    return year + "-" + month + "-" + day + " " + hour + ":" + minites + ":" + second;
}


var initupload = function(){
    var fileInput = $("#file-btn");
    var progressId = 'file_upload';
    uploader = QiniuWebchat.uploader({
        runtimes: 'html5,flash,html4',
        browse_button: 'file-btn-img',
        multi_selection: false,
        max_file_size: '20mb',
        flash_swf_url: '/javascripts/qiniu/plupload/Moxie.swf',
        dragdrop: false,
        uptoken_url: msg_config.proxyMsgUrl + '/chat?data={"action":"qiniu.getUptokenFromCustomer"}',
        domain: "https://fs-im-kefu.7moor.com/",
        unique_names: false,
        save_key: false,
        auto_start: true,
        get_new_uptoken: true,
        filters: {},
        init: {
            'FilesAdded': function (up, files) {
                plupload.each(files, function(file) {
                    if (file.size > 20 * 1024 * 1024){
                        chatUtils.showNoticeMsg("上传文件太大，超过20M", 3000);
                        return;
                    }
                    var time = chatUtils.getTimestamp();
                    file.timestamp = time;
                    lastTimeForSendMsg = chatUtils.getTimestamp();
                    chatUtils.appendCustomerChatMsg({contentType:"image",showHtml:true, content:'<a class ="a_msg_imgandfile" target="_blank" href="javascript:void(0);"><img id="img'+time+'" src="../images/uploading.gif"></a>'});
                    $(".a_msg_imgandfile").parents(".outer-right").addClass("img-file");
                    chatUtils.scrollMsgBoxToBottom();
                });
                //$("#file-btn div").remove();
                //initupload();
            },
            'BeforeUpload': function (up, file) {
                var progress = new FileProgress(file, progressId);
                var chunk_size = plupload.parseSize(this.getOption('chunk_size'));
                if (up.runtime === 'html5' && chunk_size) {
                    progress.setChunkProgess(chunk_size);
                }
            },
            'UploadProgress': function (up, file) {
                if(chatFinish){
                    up.stop();
                    chatUtils.showNoticeMsg("上传中断", 3000);
                    $("#img" + file.timestamp).attr("src", "../images/uploadError.png");
                }
            },
            'UploadComplete': function () {

            },
            'FileUploaded': function (up, file, info) {
                var time = chatUtils.getTimestamp();
                var domain = up.getOption('domain');
                var res = JSON.parse(info);
                var sourceLink = domain + res.key; //获取上传成功后的文件的Url

                function bytesToSize(bytes) {
                    if (bytes === 0) return '0 B';
                    var k = 1024, // or 1024
                        sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
                        i = Math.floor(Math.log(bytes) / Math.log(k));
                    return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
                }
                var fileSize = bytesToSize(file.size);
                var sendData = {
                    sid: cookie_sid,
                    accessId: msg_config.accessId,
                    contentType: 'file',
                    action: 'newMsg',
                    timestamp: time,
                    token: token,
                    tokenTime: tokenTime,
                    content:sourceLink+"?fileName="+file.name+"?fileSize="+fileSize
                }
                var moreUrl = msg_config.proxyMsgUrl + "/chat";
                var submitData = {data: JSON.stringify(sendData)};
                chatUtils.ajaxRequest(moreUrl, "POST", 5000,submitData, function (result) {
                    if(result.success){
                        //文件上传成功
                        $("#img" + file.timestamp).closest("a").attr("href",sourceLink);
                        $("#img" + file.timestamp).closest("a").text(file.name);
                        $("#img" + file.timestamp).remove();
                        chatUtils.scrollMsgBoxToBottom();
                    }else{
                        $("#img" + file.timestamp).attr("src", "../images/uploadError.png");
                        chatUtils.appendGreySystemMsg(chatUtils.getCurrentDateTime());
                        chatUtils.appendGreySystemMsg("服务异常，文件发送失败");
                        chatUtils.scrollMsgBoxToBottom();
                    }
                });
                lastTimeForSendMsg = chatUtils.getTimestamp();
            },
            'Error': function (up,file, err, errTip) {
                $("#img" + file.timestamp).attr("src", "../images/uploadError.png");
                chatUtils.appendGreySystemMsg(chatUtils.getCurrentDateTime());
                chatUtils.appendGreySystemMsg("服务异常，文件发送失败");
                chatUtils.scrollMsgBoxToBottom();
            },
            'Key': function (up, file) {
                var date = getCurrentDate();
                var today = new Date();
                var time = today.getTime();
                var fileName = file.name;
                var fileSuffix = "";
                if (fileName) {
                    fileSuffix = fileName.substring(fileName.lastIndexOf('.'), fileName.length);
                }
                var key = "im/" + accessId + "/" + date + "/" + time + "/" + file.name;
                return key;
            }
        }
    });
}

$("#file-btn").live("click", function(){
    var fileInput = $("#file-btn");
    //判断是否是已经初始化过的
    if (!fileInput.is(".qnInited") && !fileInput.is(".qnIniting")) {
        //加载文件上传js
        fileInput.addClass("qnIniting");
        chatUtils.showNoticeMsg("正在初始化文件上传组件，请稍等。。。",10000);
        loadQNJs("/javascripts/qiniu/plupload/plupload.full.min.js", function () {
            loadQNJs("/javascripts/qiniu/plupload/i18n/zh_CN.js", function () {
                loadQNJs("/javascripts/qiniu/ui.js", function () {
                    loadQNJs("/javascripts/qiniu/highlight/highlight.js", function () {
                        loadQNJs("/javascripts/qiniu/qiniu.js", function () {
                            initupload();
                            fileInput.addClass("qnInited");
                            fileInput.removeClass("qnIniting");
                            $(".sys-msg").html("");
                            chatUtils.showNoticeMsg("文件上传组件加载完成，请重新点击上传按钮",5000);
                        });
                    });
                });
            });
        });
    }
});





$("#chatbox_input")[0].onpaste=function(e){
    uploadClipboardFile(e);
};

function uploadFile() {
    var file = document.getElementById('picture').files[0];
    if (file) {
        if (chatUtils.validateImageType(file.type.toLowerCase())) {
            chatUtils.showNoticeMsg("只允许上传jpg，jpeg，bmp，png，gif类型的图片", 3000);
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            chatUtils.showNoticeMsg("上传文件太大，超过10M", 3000);
            return;
        }

        var xhr = new XMLHttpRequest();
        var fd = new FormData();
        var time = chatUtils.getTimestamp();
        var sendData = {
            sid: cookie_sid,
            accessId: msg_config.accessId,
            contentType: 'image',
            action: 'newMsg',
            timestamp: time,
            token: token,
            tokenTime: tokenTime
        }
        fd.append('data', JSON.stringify(sendData));
        fd.append("picToUpload", document.getElementById('picture').files[0]);

        /* event listners */
        xhr.upload.addEventListener("progress", uploadImgProgress, false);
        xhr.addEventListener("load", uploadImgComplete, false);
        xhr.addEventListener("error", uploadImgFailed, false);
        xhr.addEventListener("abort", uploadImgCanceled, false);
        /* Be sure to change the url below to the url of your upload server side script */
        xhr.open("POST", msg_config.proxyMsgUrl + "/chat");
        xhr.send(fd);
        lastTimeForSendMsg = chatUtils.getTimestamp();
        chatUtils.appendCustomerChatMsg({
            contentType: "image",
            showHtml: true,
            content: '<a class ="a_msg_imgandfile" target="_blank" href="javascript:void(0);"><img id="img' + time + '" src="../images/uploading.gif"></a>'
        });
        $(".a_msg_imgandfile").parents(".outer-right").addClass("img-file");
        chatUtils.scrollMsgBoxToBottom();
    }

}

function uploadClipboardFile(e) {
    var clipboardData = e.clipboardData || e.originalEvent.clipboardData;
    if(clipboardData.items){
        var ele = e.clipboardData.items;
        for (var i = 0; i < ele.length; ++i) {
            if ( ele[i].kind == 'file' && ele[i].type.indexOf('image/') !== -1 ) {
                var blob1 = ele[i].getAsFile();
                blob1.name="clipboard"+new Date().getTime()+".png";
                blob1.fileName="clipboard"+new Date().getTime()+".png";

                var xhr = {};
                if (window.XMLHttpRequest) {
                    xhr = new XMLHttpRequest();
                } else {
                    xhr = new ActiveXObject("Microsoft.XMLHTTP");
                }
                var xhr = new XMLHttpRequest();
                var fd = new FormData();
                var time = chatUtils.getTimestamp();
                var sendData = {
                    sid: cookie_sid,
                    accessId:msg_config.accessId,
                    contentType:'image',
                    action:'newMsg',
                    timestamp: time,
                    token:token,
                    tokenTime:tokenTime
                }
                fd.append('data', JSON.stringify(sendData));
                fd.append("picToUpload", blob1);
                fd.append("isClipboard", true);

                /* event listners */
                xhr.upload.addEventListener("progress", uploadImgProgress, false);
                xhr.addEventListener("load", uploadImgComplete, false);
                xhr.addEventListener("error", uploadImgFailed, false);
                xhr.addEventListener("abort", uploadImgCanceled, false);
                /* Be sure to change the url below to the url of your upload server side script */
                xhr.open("POST", msg_config.proxyMsgUrl + "/chat");
                xhr.send(fd);
                lastTimeForSendMsg = chatUtils.getTimestamp();
                chatUtils.appendCustomerChatMsg({contentType:"image",showHtml:true, content:'<a class ="a_msg_imgandfile" target="_blank" href=""><img id="img'+time+'" src="../images/uploading.gif"></a>'});
                $(".a_msg_imgandfile").parents(".outer-right").addClass("img-file");
                chatUtils.scrollMsgBoxToBottom();
                break;
            }

        }
    }else if($("#chatbox_input").attr("clipboard_remind")!="1"){
        $("#chatbox_input").attr("clipboard_remind","1");
        chatUtils.showNoticeMsg("您使用的浏览器暂不支持粘贴截图功能", 3000);

    }
}


function uploadImgProgress(evt) {

}

function uploadImgComplete(evt) {
    if(evt.target.status == 200){
        var res = JSON.parse(evt.target.responseText);
        if(res.success){
            $("#img" + res.timestamp).attr("src", res.content+"?imageView2/2/w/100");
            $("#img" + res.timestamp).parent("a").attr("href", res.content);
            chatUtils.scrollMsgBoxToBottom();
        }else{
            $("#img" + res.timestamp).attr("src", "../images/uploadError.png");
            chatUtils.appendGreySystemMsg(chatUtils.getCurrentDateTime());
            chatUtils.appendGreySystemMsg(res.message);
            chatUtils.scrollMsgBoxToBottom();
        }
    }else{
        chatUtils.appendGreySystemMsg(chatUtils.getCurrentDateTime());
        chatUtils.appendGreySystemMsg("服务异常，图片发送失败");
        chatUtils.scrollMsgBoxToBottom();
    }

    $("#picture").remove();
    $("#image-btn").append('<input style="display: none;" accept="image/jpeg,image/jpg,image/gif,image/png,image/bmp" type="file" id="picture" name="picture">');

}

function uploadImgFailed(evt) {
    chatUtils.showNoticeMsg("上传失败，可以尝试重新上传", 3000);
    $("#picture").remove();
    $("#image-btn").append('<input style="display: none;" accept="image/*" type="file" id="picture" name="picture">');
}


function uploadImgCanceled(evt) {
    chatUtils.showNoticeMsg("上传失败，可以尝试重新上传", 3000);
    $("#picture").remove();
    $("#image-btn").append('<input style="display: none;" accept="image/*" type="file" id="picture" name="picture">');
}

function resetConfig(){
    if(socket){
        socket.disconnect();
    }
    cookie_sid = undefined, isShowHistory = true, since = undefined,msgArrs=[],sendsysmsg=false,
        lastMsgId = undefined, lastSocketId = undefined, kefu = undefined, companyName = undefined,
        lastTime = undefined, g_since = undefined, show_kefu = true, chatFinish = false, retryCount = 0, startChat=false;
    lastTimeForSendMsg = undefined, networkFlag = true,convertManual=false, submitSystemMsg = -1, isRobot= true, toPeer = "", webIMCsrDic = undefined, chatWithKefu=false,showBreakTips=false,noRobot=false;
    $(".face-con").animate({top: '0px', height: "0px"});
    $("#face-con").css("display", "none");
    $("#chatbox_input").val("");
    $(".footer").find(".chat-finish").remove();
    $(".manual").remove();
    $(".leave-msg-box").css("display", "none");
    $(".chatcontainer").css("display", "block");
    $("#esc_form").find('.proposal').val('欢迎为我们的服务提建议');
    clearTimeout(chatTimer);
    window.parent && window.parent.postMessage && (window.parent.postMessage("closeChatBox", "*"));
    $('#allQuestion').hide();
    $(".chat-isAcceptOther").hide();
    $('.question_common ul').html(' ');
}
function resetConfigData(){
    cookie_sid = undefined, isShowHistory = true, since = undefined,msgArrs=[],sendsysmsg=false,
        lastMsgId = undefined, lastSocketId = undefined, kefu = undefined,
        lastTime = undefined, g_since = undefined, show_kefu = true, chatFinish = false, retryCount = 0, startChat=false;
    lastTimeForSendMsg = undefined, networkFlag = true,convertManual=false, submitSystemMsg = -1, isRobot= true, toPeer = "", webIMCsrDic = undefined, chatWithKefu=false,showBreakTips=false,noRobot=false;
}


function getMsgFromParent(b) {
    var data = b.data;
    var source = b.source;
    var origin = b.origin;
    if (data == "chat_open") {
        if(serviceStates == 1){
            init();
        }else{
            //init();
        }

    }else if(data.indexOf("qimoClientId_") != -1){
        clientId = data.substring("qimoClientId_".length);
        if(clientId == "undefined"){
            clientId = "";
        }
    }else if(data.indexOf("selectPeer_") != -1){
        toPeer = data.substring("selectPeer_".length);
    }else if(data.indexOf("qimoClientOtherParams_") != -1){
        otherParams = decodeURIComponent(data.substring("qimoClientOtherParams_".length));
        if(otherParams == "undefined"){
            otherParams = "";
        }
    }
}
$(document).ready(function () {
    //init 表情
    window.getEmojiCode = function (code) {
        $("#chatbox_input").val($("#chatbox_input").val() + ":" + code + ":");
    };
    chatUtils.initFace();
    //init 聊天窗口
    if (window.addEventListener) {
        window.addEventListener("message", getMsgFromParent);
    } else {
        window.attachEvent("onmessage", getMsgFromParent);
    }
    //ie6/7 window open方式启动聊天窗口
    newwin && newwin == "true" && serviceStates == 1 && (init());

    wapPage && (init());
    //快捷键方式
    $(document).keypress(function (e) {
        if(chatFinish){
            return;
        }
        if (e.ctrlKey) {
            return;
        }
        if (e.which == 13 || e.which == 10) {
            e.preventDefault();
            submitMsg();
        }
    });

    $(document).keypress(function (e) {
        if(chatFinish){
            return;
        }
        if (e.ctrlKey && (e.which == 13 || e.which == 10)) {
            e.preventDefault();
            $("#chatbox_input").val($("#chatbox_input").val() + "\r\n");
        }
    });

    var statStr = '';
    window.onblur = function(){
        statStr = "blur";
        $("#chat-voice").removeClass("close");

    }
    window.onfocus = function(){
        statStr = "focus";
        $("#chat-voice").addClass("close")
    }

    //window.parent.onblur = function(){
    //    statStr = "blur";
    //    $("#chat-voice").removeClass("close");
    //
    //}
    //window.parent.onfocus = function(){
    //    statStr = "focus";
    //    $("#chat-voice").addClass("close")
    //}
});


/**
 * 预知聊天内容
 */
function typeNotice(checkTime,isBlur){
    var content = $("#chatbox_input").val();
    var content_old = $("#chatbox_input").attr("content_old");
    var timestamp = new Date().getTime();
    var timestamp_old = $("#chatbox_input").attr("timestamp_old");
    if ($("#chatbox_input").css("color") == "rgb(153, 153, 153)" || $("#chatbox_input").css("color") == "#999") {
        content = "";
    }
    if(typeNoticeTimerId){
        clearTimeout(typeNoticeTimerId);
    }
    if(!chatbox_input_isFinish && (!isBlur || content_old != content)){
        if((timestamp-timestamp_old)>=checkTime  || !timestamp_old){
            $("#chatbox_input").attr("content_old",content);
            $("#chatbox_input").attr("timestamp_old",timestamp);
            var url = msg_config.proxyMsgUrl + "/chat";
            var msg={
                action:"typeNotice",
                _id: cookie_sid,
                content: encodeURIComponent(content)
            };
            var submitData = {data: JSON.stringify(msg)};
            chatUtils.ajaxRequest(url, "POST", 5000,submitData, function (result) {

            })
        }else{
            var ttime = 3000;
            if(timestamp_old){
                ttime =  3000-(timestamp-timestamp_old);
            }
            typeNoticeTimerId = setTimeout(function(){
                typeNotice(0);
            },ttime);
        }
    }

}


$("#chatbox_input").keyup(function(e){
    if(e.keyCode!=13){
        if($("#chatbox_input").val()!=""){
            chatbox_input_isFinish = false;
        }
        typeNotice(3000);
    }
});
$("#chatbox_input").blur(function(e){
    typeNotice(3000,true);
});
