/**
 * Created by chenguang on 9/18/15.
 */
var phone_data = {};
var _cti_url;
var _cti_reconnection_count = 0;
var _cti_is_waiting_event = false;

var _cti_unregister = 0;
var _cti_peerstate = 1;
var _cti_dialing = 2;
var _cti_innerDialing = 3;
var _cti_belling = 4;
var _cti_innerBelling = 5;
var _cti_listening = 6;
var _cti_talking = 7;
var _cti_threeWayTalking = 8;
var _cti_innerTalking = 9;
var _cti_dialTalking = 10;
var _cti_listened = 11;
var _cti_transferBelling = 12;
var _cti_transferDialing = 13;
var _cti_transfer = 14;
var _cti_dialoutTransfer = 15;
var _cti_systemBusy = 99;
var _cti_currentState;
var _cti_linked = false;//通话是否接通标志变量
var _cti_stateBeforeHold;

var _cti_stateDescription = ["unregister", "peerstate", "dialing", "innerDialing", "belling", "innerBelling", "listening", "talking", "threeWayTalking", "innerTalking", "dialTalking", "listened", "transferBelling", "transferDialing", "transfer", "dialTransfer"];

var _phone_peersFromSip = [];
var phone_peers = [];
var phone_queues = [];
var phone_serviceNos = [];
var phone_accountCalls = [];

var _cti_isSettingbusy = false;
var _cti_isRelogin = false;

var phone_pbxs = [];
var _phone_callObject = {};
var _cti_isInvestigatting = false;

function cti_register(config) {
    _cti_url = config.proxy_url;
    var phoneJson = {
        Command: "Action",
        Action: "Login",
        ActionID: "Login" + Math.random(),
        ExtenType: config.extenType,
        Password: config.password,
        BusyType: config.busyType,
        Monitor: config.monitor,
        User: config.user,
        AppVersion: 'service'
    };
    if((session.user.isAdmin && session.user.isAdmin == true) || session.phoneTokenInUse == true) {
        phoneJson = {
            Command: "Action",
            Action: "Login",
            ActionID: "Login" + Math.random(),
            PBX: config.curPbx,
            Account: session.account.account,
            Password : "7pu3refwds98172e",
            UserID : "2387rufhinjvcx73rfws",
            MonitorUser : true
        }
        config.userId = "2387rufhinjvcx73rfws";
    }
    var onload = function(response) {
        var _response = response;
        //console.dir(_response);
        if (!_response.Succeed) {
            var code = _response.Result;
            if (code) {
                if (code == 601) {
                    alert("您的账户通话座席登录数已达最大或者已经到期,请联系管理员");
                    session.logined = false;
                    window.location=document.location.href;
                } else if (code == 602) {
                    alert("您的账户无通话座席登录数已达最大或者已经到期,请使用软电话/SIP话机/直线方式登录或联系管理员");
                    session.logined = false;
                    window.location=document.location.href;
                } else if(code == 500) {
                    if(config.extenType == 'Local'){
                        alert("您的还没有绑定手机号码,不能以直线方式登陆");
                        session.logined = false;
                        window.location=document.location.href;
                    }else{
                        alert("您的网关还没有绑定,请拨打0000进行绑定");
                    }
                } else if(code == 406){
                    alert("您账号的版本与系统版本不符，请确认登陆地址是您账号所对应的版本！");
                    session.logined = false;
                    window.location=document.location.href;
                    location.reload();
                }else {
                    alert("登录失败" + code + ",通话功能不能使用,请联系管理员");
                    if(code == '400'){
                        session.logined = false;
                        window.location=document.location.href;
                        location.reload();
                    }
                }
            }
        } else if (_response.SessionID) {
            config.uniqueId = _response.SessionID;
            var date = new Date();
            var identity = date.valueOf();
            config.currentServerTime = identity - _response.Timestamp * 1000;
            config.phonebarConfig = _response.PhonebarConfig;
            config.autoBusyTime = _response.AutoBusyTime;
            if(_response.UserID){
                config.userId = _response.UserID;
            }
            if(_response.PBX){
                config.pbx_in_ip = _response.PBX;
            }
            if(_response.Account){
                config.accountId = _response.Account;
            }
            config.loginName = config.User || config.user;
            config.sipNo = _response.SipNum;
            config.monitorUser = _response.MonitorUser;
            config.monitorPassword = _response.MonitorPassword;

            softphonebar_init();
            _cti_init(config);
            _cti_waitEvent();

            if(session.user.channelMail===false||session.user.channelWx===false){
                var _d1={
                    channelMail:session.user.channelMail===false?false:true,
                    channelWx:session.user.channelWx===false?false:true
                }
                syncChannelSet(_d1,function(){});
            }
        }
    };
    var onerror = function() {
        alert('请求超时，请检查本地网络');
    };
    _cti_sendAction(phoneJson, onload, onerror);
}

function _cti_sendAction(jsonData, onload, onerror) {
    var json = $.toJSON(jsonData);
    var timeout = 15000;
    if(jsonData.Timeout != undefined) {
        timeout = jsonData.Timeout;
    }
    $.ajax({
        type: "get",
        url: _cti_url,
        timeout: timeout,
        cache: false,
        data: {json: json},
        dataType: "jsonp",
        jsonp: "callbackName",
        success: onload,
        error: onerror
    });
}

function _cti_init(config) {
    phone_data.uniqueId = config.uniqueId;
    phone_data.currentServerTime = config.currentServerTime;
    phone_data.autoBusyTime = config.autoBusyTime;
    phone_data.userId = config.userId;
    phone_data.pbx_in_ip = config.pbx_in_ip;
    phone_data.accountId = config.accountId;
    phone_data.loginName = config.loginName;
    phone_data.sipNo = config.sipNo;
    phone_data.monitor = config.monitor;
    phone_data.user = config.user;
    phone_data.password = config.password;
    phone_data.extenType = config.extenType;
    phone_data.busyType = config.busyType;
    phone_data.monitorUser = config.monitorUser;
    phone_data.monitorPassword = config.monitorPassword;
    phone_data.exten = config.exten;

    phone_data.phonebarConfig = new Array();
    if(config.phonebarConfig) {
        var peerstates = config.phonebarConfig.split(",");
        for(var i = 0; i < peerstates.length; i++) {
            phone_data.phonebarConfig[peerstates[i].split(":")[0]] = peerstates[i].split(":")[1]
        }
    }
    _cti_currentState = _cti_unregister;
    phone_publishEvent("toolbarupdate", [_cti_stateDescription[_cti_currentState], ""]);
}

function _cti_waitEvent() {
    if(_cti_is_waiting_event)
        return;
    _cti_is_waiting_event = true;
    var phoneJson = {
        Command: "Action",
        Action: "GetState",
        ActionID: "GetState" + Math.random(),
        SessionID: phone_data.uniqueId,
        User: phone_data.userId
    };
    var onload = function(response) {
        _cti_reconnection_count = 0;
        _cti_display("");
        if(!response)
            return;
        var datas = response;
        var _response = datas.Response;
        if (!_response)
            _response = datas;
        if (_response.Succeed && !_response.HasEvent) {
        } else if (!_response.Succeed) {
            if(_response.Expired) {
                _cti_relogin();
                _cti_is_waiting_event = false;
                return;
            }
        } else {
            if(_response.Kick) {
                var comments = "";
                if(_response.Comments)
                    comments = _response.Comments;
                if(comments == "ukick" || comments == "ekick")
                    alert("您当前的会话已经失效,导致该问题的原因是别的座席使用相同的帐号（或相同的分机）登录了");
                else
                    alert("您当前的会话已经失效,导致该问题的原因可能是被管理员强制签出");
                _cti_is_waiting_event = false;
                session.logined = false;
                window.location='./';
                return;
            } else {
                var events = datas.Event;
                if(events != null) {
                    _cti_eventHandler(events, false);
                }
            }
        }
        _cti_is_waiting_event = false;
        _cti_waitEvent();
    };
    var onerror = function() {
        _cti_is_waiting_event = false;
        window.setTimeout(function() {
            _cti_reconnection_count++;
            if(_cti_reconnection_count > 3)
                _cti_display("连接服务器超时，可能是您的网络问题，正在尝试重新连接...");
            _cti_waitEvent();
        }, 1000);
    };
    _cti_sendAction(phoneJson, onload, onerror);
}

function _cti_relogin() {
    if(!phone_data.user)
        return;
    if(_cti_isRelogin)
        return;
    _cti_isRelogin = true;
    var phoneJson = {
        Command: "Action",
        Action: "Login",
        ActionID: "Login" + Math.random(),
        ExtenType: phone_data.extenType,
        Password: phone_data.password,
        BusyType: phone_data.busyType,
        Monitor: phone_data.monitor,
        User: phone_data.user,
        AppVersion: 'service'
    };
    var onload = function(response) {
        var _response = response;
        if (!_response.Succeed) {
            var code = _response.Result;
            if(code){
                if(code == 601) {
                    alert("您的账户通话座席登录数已达最大或者已经到期,请使用无通话方式登录或联系管理员");
                } else if(code == 602) {
                    alert("您的账户无通话座席登录数已达最大或者已经到期,请使用软电话/网关/直线方式登录或联系管理员");
                } else if(code == 500) {
                    alert("您的网关还没有绑定,请拨打0000进行绑定");
                } else if(code == 406) {
                    alert("您账号的版本与系统版本不符，请确认登陆地址是您账号所对应的版本！");
                    location.reload();
                } else {
                    alert("登录失败" + code + ",请联系管理员");
                }
            } else
                alert("您当前的会话已经失效,导致该问题的原因可能是被管理员强制签出");
        } else if (_response.SessionID) {
            phone_data.uniqueId = _response.SessionID;
            var date = new Date();
            var identity = date.valueOf();
            phone_data.currentServerTime = identity - _response.Timestamp * 1000;
            if(_cti_currentState == _cti_peerstate) {
                if(phone_data.busyType == "0")
                    phone_setBusy(false, "0");
                else if(phone_data.busyType != "99")
                    phone_setBusy(true, phone_data.busyType);

            }
            _cti_waitEvent();
        }
        _cti_isRelogin = false;
    };
    var onerror = function() {
        alert('请求超时，请检查本地网络');
        _cti_isRelogin = false;
    };
    _cti_sendAction(phoneJson, onload, onerror);
}

function _cti_display(msg) {
    //TODO show message in main.html
//    $("#info_notify").html(msg);
    if(msg){
        $().alertmessage('showError', msg);
    }
}

function cti_exit(removeQueue) {
    if(!phone_data.uniqueId) {
        phone_data = {};
        session.logined = false;
        if(session.user.proxyUrl){
            window.location=session.user.proxyUrl;
        }else{
            window.location='./';
        }
        return;
    }
    var phoneJson = {
        Command: "Action",
        Action: "Logoff",
        ActionID: "Logoff" + Math.random(),
        QueueRemove: removeQueue,
        User: phone_data.userId,
        PBX: phone_data.pbx_in_ip,
        Account: phone_data.accountId,
        SessionID: phone_data.uniqueId
    };
    var onload = function(response){
        phone_data = {};
        session.logined = false;
        if(session.user.proxyUrl){
            window.location=session.user.proxyUrl;
        }else{
            window.location='./';
        }
    }
    _cti_sendAction(phoneJson, onload, function(){});
}