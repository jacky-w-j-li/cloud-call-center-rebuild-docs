var phone_data = {};
var _phone_url;
var _phone_iccCount = 0;
var _phone_isWaitingEvent = false;

var _phone_unregister = 0;
var _phone_peerstate = 1;
var _phone_dialing = 2;
var _phone_innerDialing = 3;
var _phone_belling = 4;
var _phone_innerBelling = 5;
var _phone_listening = 6;
var _phone_talking = 7;
var _phone_threeWayTalking = 8;
var _phone_innerTalking = 9;
var _phone_dialTalking = 10;
var _phone_listened = 11;
var _phone_transferBelling = 12;
var _phone_transferDialing = 13;
var _phone_transfer = 14;
var _phone_dialoutTransfer = 15;
var _phone_systemBusy = 99;
var _phone_currentState;
var _phone_stateBeforeHold;

var _phone_stateDescription = ["unregister", "peerstate", "dialing", "innerDialing", "belling", "innerBelling", "listening", "talking", "threeWayTalking", "innerTalking", "dialTalking", "listened", "transferBelling", "transferDialing", "transfer", "dialTransfer"];

var _phone_peersFromSip = [];
var phone_peers = [];
var phone_queues = [];
var phone_serviceNos = [];
var phone_accountCalls = [];

var _phone_isSettingbusy = false;
var _phone_isRelogin = false;

var phone_pbxs = [];
var _phone_callObject = {};
var _phone_isInvestigatting = false;

function phone_register(config) {
    _phone_url = config.proxy_url;
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
    if(session.user.isAdmin && session.user.isAdmin == true) {
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
                    window.location=document.location.href;;
//                    alert("您的账户通话座席登录数已达最大或者已经到期,请使用无通话方式登录或联系管理员");
                } else if (code == 602) {
                    alert("您的账户无通话座席登录数已达最大或者已经到期,请使用软电话/网关/直线方式登录或联系管理员");
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
                    alert("登录失败" + code + ",通话功能将不能使用,请联系管理员");
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
            _phone_init(config);
            _phone_waitEvent();


            if(session.user.channelMail===false||session.user.channelWx===false){
                var _d1={
                    channelMail:session.user.channelMail===false?false:true,
                    channelWx:session.user.channelWx===false?false:true
                }
                syncChannelSet(_d1,function(){});
            }


//                var curpbx = {
//                    sipConfigId: phone_data.pbx_in_ip,
//                    pbxNick: config.pbxNick,
//                    proxyUrl: _phone_url,
//                    sessionId: _response.SessionID,
//                    isWaitingPbxEvent: false,
//                    isMonitorLogOff: false
//                };
//                phone_pbxs[phone_data.pbx_in_ip] = curpbx;



//                //allpbx
//                var curpbx = {
//                    sipConfigId: "10.1.1.140",
//                    pbxNick: "北京pbx0",
//                    proxyUrl: _phone_url,
//                    sessionId: _response.SessionID,
//                    isWaitingPbxEvent: false,
//                    isMonitorLogOff: false
//                };
//                phone_pbxs["10.1.1.140"] = curpbx;


//                var curpbx = {
//                    sipConfigId: "1.1.1.100",
//                    pbxNick: "北京pbx0",
//                    proxyUrl: _phone_url,
//                    sessionId: _response.SessionID,
//                    isWaitingPbxEvent: false,
//                    isMonitorLogOff: false,
//                    monitor: false
//                };
//                phone_pbxs["1.1.1.100"] = curpbx;
//
//                var otherpbx1 = {
//                    sipConfigId: "1.1.1.102",
//                    pbxNick: "上海pbx0",
//                    proxyUrl: "http://10.8.15.33:81/",
//                    sessionId: "",
//                    isWaitingPbxEvent: false,
//                    isMonitorLogOff: false,
//                    monitor: false
//                }
//                phone_pbxs["1.1.1.102"] = otherpbx1;
        }
    };
    var onerror = function() {
        alert('请求超时，请检查本地网络');
    };
    _phone_sendAction(phoneJson, onload, onerror);
}

function _phone_sendAction(jsonData, onload, onerror) {
    var json = $.toJSON(jsonData);
    var timeout = 15000;
    if(jsonData.Timeout != undefined) {
        timeout = jsonData.Timeout;
    }
    $.ajax({
        type: "get",
        url: _phone_url,
        timeout: timeout,
        cache: false,
        data: {json: json},
        dataType: "jsonp",
        jsonp: "callbackName",
        success: onload,
        error: onerror
    });
}

function _phone_init(config) {
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
//    console.info("_phone_init==============");
//    console.dir(phone_data.phonebarConfig);
//    console.dir(config)
//    console.info(_phone_unregister)

    _phone_currentState = _phone_unregister;
    phone_publishEvent("toolbarupdate", [_phone_stateDescription[_phone_currentState], ""]);
}


function phone_toMenu(exten, displayName){
    softphonebar_closeModel();
    _softphonebar_showToMenu(displayName);
    var phoneJson = {
        Command: "Action",
        Action: "IvrMenu",
        ActionID: "IvrMenu" + Math.random(),
        Channel: phone_data._otherChannel,
        Context: exten,
        PBX: phone_data.pbx_in_ip,
        Account: phone_data.accountId
    };
    var onload = function(response) {
        if(response.Succeed) {
            utils.showSucc("来电正在转验证，请稍后");
            softphonebar_closeModel();
        } else {
            softphonebar_close();
            utils.showError("转IVR菜单失败");
            if(response.Expired) {
                _phone_relogin();
            }
        }
    };
    var error = function() {
        softphonebar_close();
        utils.showError("转IVR菜单失败");
    };
    _phone_sendAction(phoneJson, onload, error);
}

function _phone_waitEvent() {
    if(_phone_isWaitingEvent)
        return;
    _phone_isWaitingEvent = true;
    var phoneJson = {
        Command: "Action",
        Action: "GetState",
        ActionID: "GetState" + Math.random(),
        SessionID: phone_data.uniqueId,
        User: phone_data.userId
    };
    var onload = function(response) {
        _phone_iccCount = 0;
        _phone_display("");
        if(!response)
            return;
        var datas = response;
        var _response = datas.Response;
        if (!_response)
            _response = datas;
        if (_response.Succeed && !_response.HasEvent) {
        } else if (!_response.Succeed) {
            if(_response.Expired) {
                _phone_relogin();
                _phone_isWaitingEvent = false;
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
                _phone_isWaitingEvent = false;
                session.logined = false;
                window.location='./';
                return;
            } else {
                var events = datas.Event;
                if(events != null) {
                    _phone_eventHandler(events, false);
                }
            }
        }
        _phone_isWaitingEvent = false;
        _phone_waitEvent();
    };
    var onerror = function() {
        _phone_isWaitingEvent = false;
        window.setTimeout(function() {
            _phone_iccCount++;
            if(_phone_iccCount > 3)
                _phone_display("连接服务器超时，可能是您的网络问题，正在尝试重新连接...");
            _phone_waitEvent();
        }, 1000);
    };
    _phone_sendAction(phoneJson, onload, onerror);
}

function _phone_relogin() {
    if(!phone_data.user)
        return;
    if(_phone_isRelogin)
        return;
    _phone_isRelogin = true;
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
            if(_phone_currentState == _phone_peerstate) {
                if(phone_data.busyType == "0")
                    phone_setBusy(false, "0");
                else if(phone_data.busyType != "99")
                    phone_setBusy(true, phone_data.busyType);

            }
            _phone_waitEvent();
        }
        _phone_isRelogin = false;
    };
    var onerror = function() {
        alert('请求超时，请检查本地网络');
        _phone_isRelogin = false;
    };
    _phone_sendAction(phoneJson, onload, onerror);
}

function _phone_display(msg) {
    //TODO show message in main.html
//    $("#info_notify").html(msg);
    if(msg){
        $().alertmessage('showError', msg);
    }
}

function _phone_eventHandler(evtJsons, isMonitorOnly) {
    $.each(evtJsons, function(i, item) {
        _phone_newEvent(item, isMonitorOnly);
    });
}

function _phone_newEvent(evtJson, isMonitorOnly) {
//    console.dir(evtJson);
    if(!isMonitorOnly)
        _phone_stateProcess(evtJson);
    _phone_monitorProcess(evtJson);
}

function _phone_stateProcess(evtJson) {
    if(evtJson.Event == "NewMail"){
//        alert(evtJson.Event);
        console.log(evtJson);
        handler.callMail.dispatch(evtJson);
        return;
    }else if(evtJson.Event == "RecycleNewMail"){
//        alert(evtJson.Event);
        console.log(evtJson);
        handler.callMail.emailItemRemove(evtJson);
        return;
    }else if(evtJson.Event == "NewWeixin"){
        console.log(evtJson);
        handler.callWeixin.dispatch(evtJson);
        return;
    }else if(evtJson.Event == "NewWebchat"){
        //console.log(evtJson);
        //handler.webchat.dispatch(evtJson);
        return;
    }

    if(evtJson.Event == "taskCreate"){
        handler.task.taskCreateEvtHandler(evtJson);
        return;
    } else if(evtJson.Event == "taskComplete"){
        handler.task.taskCompleteEvtHandler(evtJson);
        return;
    } else if(evtJson.Event == "custAssign"){
        handler.customer.custAssignEvtHandler(evtJson);
        return;
    } else if(evtJson.Event == "businessAssignRole"){
        handler.business.busAssignRoleEvtHandler(evtJson);
        return;
    } else if(evtJson.Event == "businessAssign"){
        handler.business.busAssignEvtHandler(evtJson);
        return;
    }

    _phone_super(evtJson);
    switch(_phone_currentState) {
        case _phone_unregister:
            if(evtJson.Event == "PeerStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.PeerStatus == "Registered") {
                        _phone_currentState = _phone_peerstate;
                        _phone_update(evtJson);
                    }
                }
            } else if(evtJson.Event == "UserStatus") {
                if(phone_data.userId == evtJson.UserID) {
                    if(phone_data.sipNo != evtJson.SipNum) {
                        if(evtJson.PeerStatus == "Registered") {
                            _phone_currentState = _phone_peerstate;
                            _phone_update(evtJson);
                        }
                    }
                }
            }
            break;
        case _phone_peerstate:
            if (evtJson.Event == "UserBusy") {
                if (phone_data.userId == evtJson.UserID) {
                    phone_data.busyType = evtJson.BusyType;
                    _phone_currentState = _phone_peerstate;
                    _phone_update(evtJson);
                }
            } else if (evtJson.Event == "ChannelStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.ChannelStatus == "Hangup") {
                        _phone_currentState = _phone_peerstate;
                        _phone_update(evtJson);
                    } else if(evtJson.ChannelStatus == "Ringing") {
                        if(evtJson.LinkedChannel.ChannelType == "normal") {
                            _phone_currentState = _phone_belling;
                            _phone_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "inner") {
                            _phone_currentState = _phone_innerBelling;
                            _phone_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "transfer"){
                            _phone_currentState = _phone_transferBelling;
                            _phone_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "dialTransfer") {
                            _phone_currentState = _phone_transferDialing;
                            _phone_update(evtJson);
                        }
                    } else if(evtJson.ChannelStatus == "Ring") {
                        if(evtJson.ChannelType == "dialout") {
                            _phone_currentState = _phone_dialing;
                            _phone_update(evtJson);
                        } else if(evtJson.ChannelType == "inner") {
                            _phone_currentState = _phone_innerDialing;
                            _phone_update(evtJson);
                        } else if(evtJson.ChannelType == "listen") {
                            _phone_currentState = _phone_listening;
                            _phone_update(evtJson);
                        }
                    } else if(evtJson.ChannelStatus == "Link") {
                        if(evtJson.LinkedChannel.ChannelType == "normal") {
                            _phone_currentState = _phone_talking;
                            _phone_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "threeWayCall") {
                            _phone_currentState = _phone_threeWayTalking;
                            _phone_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "inner") {
                            _phone_currentState = _phone_innerTalking;
                            _phone_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "dialout") {
                            _phone_currentState = _phone_dialTalking;
                            _phone_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "transfer") {
                            _phone_currentState = _phone_transfer;
                            _phone_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "dialTransfer") {
                            _phone_currentState = _phone_dialoutTransfer;
                            _phone_update(evtJson);
                        }
                    } else if(evtJson.ChannelStatus == "Up") {
                        if(evtJson.ChannelType == "listen") {
                            _phone_currentState = _phone_listened;
                            _phone_update(evtJson);
                        }
                    }
                }
            } else if(evtJson.Event == "PeerStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.PeerStatus != "Registered") {
                        _phone_currentState = _phone_unregister;
                        _phone_update(evtJson);
                    }
                }
            }
            break;
        case _phone_dialing:
            if(evtJson.Event == "ChannelStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.ChannelStatus == "Hangup") {
                        _phone_currentState = _phone_peerstate;
                        _phone_update(evtJson);
                    } else if(evtJson.ChannelStatus == "Link") {
                        if(evtJson.ChannelType == "dialout") {
                            _phone_currentState = _phone_dialTalking;
                            _phone_update(evtJson);
                        }
                    }
                }
            }
            break;
        case _phone_innerDialing:
            if(evtJson.Event == "ChannelStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.ChannelStatus == "Hangup") {
                        _phone_currentState = _phone_peerstate;
                        _phone_update(evtJson);
                    } else if(evtJson.ChannelStatus == "Link") {
                        if(evtJson.ChannelType == "inner") {
                            _phone_currentState = _phone_innerTalking;
                            _phone_update(evtJson);
                        }
                    }
                }
            }
            break;
        case _phone_belling:
            if(evtJson.Event == "ChannelStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.ChannelStatus == "Hangup") {
                        _phone_currentState = _phone_peerstate;
                        _phone_update(evtJson);
                    } else if(evtJson.ChannelStatus == "Link") {
                        if(evtJson.LinkedChannel.ChannelType == "normal") {
                            _phone_currentState = _phone_talking;
                            _phone_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "threeWayCall") {
                            _phone_currentState = _phone_threeWayTalking;
                            _phone_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "transfer") {
                            _phone_currentState = _phone_transfer;
                            _phone_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "dialTransfer") {
                            _phone_currentState = _phone_dialoutTransfer;
                            _phone_update(evtJson);
                        }
                    }
                }
            }
            break;
        case _phone_innerBelling:
            if(evtJson.Event == "ChannelStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.ChannelStatus == "Hangup") {
                        _phone_currentState = _phone_peerstate;
                        _phone_update(evtJson);
                    } else if(evtJson.ChannelStatus == "Link") {
                        if(evtJson.LinkedChannel.ChannelType == "threeWayCall") {
                            _phone_currentState = _phone_threeWayTalking;
                            _phone_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "inner") {
                            _phone_currentState = _phone_innerTalking;
                            _phone_update(evtJson);
                        }
                    }
                }
            }
            break;
        case _phone_listening:
            if(evtJson.Event == "ChannelStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.ChannelStatus == "Hangup") {
                        _phone_currentState = _phone_peerstate;
                        _phone_update(evtJson);
                    } else if(evtJson.ChannelStatus == "Up") {
                        if(evtJson.ChannelType == "listen") {
                            _phone_currentState = _phone_listened;
                            _phone_update(evtJson);
                        }
                    }
                }
            }
            break;
        case _phone_talking:
            if(evtJson.Event == "ChannelStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.ChannelStatus == "Hangup") {
                        _phone_currentState = _phone_peerstate;
                        _phone_update(evtJson);
                    } else if(evtJson.ChannelStatus == "Link") {
                        if(evtJson.LinkedChannel.ChannelType == "ThreeWayCall") {
                            _phone_currentState = _phone_threeWayTalking;
                            _phone_update(evtJson);
                        }
                    }
                }
            }
            break;
        case _phone_transfer:
            if(evtJson.Event == "ChannelStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.ChannelStatus == "Hangup") {
                        _phone_currentState = _phone_peerstate;
                        _phone_update(evtJson);
                    } else if(evtJson.ChannelStatus == "Link") {
                        if(evtJson.LinkedChannel.ChannelType == "ThreeWayCall") {
                            _phone_currentState = _phone_threeWayTalking;
                            _phone_update(evtJson);
                        }
                    }
                }
            }
            break;
        case _phone_dialoutTransfer:
            if(evtJson.Event == "ChannelStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.ChannelStatus == "Hangup") {
                        _phone_currentState = _phone_peerstate;
                        _phone_update(evtJson);
                    } else if(evtJson.ChannelStatus == "Link") {
                        if(evtJson.LinkedChannel.ChannelType == "ThreeWayCall") {
                            _phone_currentState = _phone_threeWayTalking;
                            _phone_update(evtJson);
                        }
                    }
                }
            }
            break;
        case _phone_threeWayTalking:
            if(evtJson.Event == "ChannelStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.ChannelStatus == "Hangup") {
                        _phone_currentState = _phone_peerstate;
                        _phone_update(evtJson);
                    }
                }
            }
            break;
        case _phone_innerTalking:
            if(evtJson.Event == "ChannelStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.ChannelStatus == "Hangup") {
                        _phone_currentState = _phone_peerstate;
                        _phone_update(evtJson);
                    }
                }
            }
            break;
        case _phone_dialTalking:
            if(evtJson.Event == "ChannelStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.ChannelStatus == "Hangup") {
                        _phone_currentState = _phone_peerstate;
                        _phone_update(evtJson);
                    } else if(evtJson.ChannelStatus == "Link") {
                        if(evtJson.LinkedChannel.ChannelType == "ThreeWayCall") {
                            _phone_currentState = _phone_threeWayTalking;
                            _phone_update(evtJson);
                        }
                    }
                }
            }
            break;
        case _phone_listened:
            if(evtJson.Event == "ChannelStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.ChannelStatus == "Hangup") {
                        _phone_currentState = _phone_peerstate;
                        _phone_update(evtJson);
                    }
                }
            }
            break;
        case _phone_transferBelling:
            if(evtJson.Event == "ChannelStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.ChannelStatus == "Hangup") {
                        _phone_currentState = _phone_peerstate;
                        _phone_update(evtJson);
                    } else if(evtJson.ChannelStatus == "Link") {
                        if(evtJson.LinkedChannel.ChannelType == "normal") {
                            _phone_currentState = _phone_talking;
                            _phone_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "threeWayCall") {
                            _phone_currentState = _phone_threeWayTalking;
                            _phone_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "transfer") {
                            _phone_currentState = _phone_transfer;
                            _phone_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "dialTransfer") {
                            _phone_currentState = _phone_dialoutTransfer;
                            _phone_update(evtJson);
                        }
                    }
                }
            }
            break;
        case _phone_transferDialing:
            if(evtJson.Event == "ChannelStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.ChannelStatus == "Hangup") {
                        _phone_currentState = _phone_peerstate;
                        _phone_update(evtJson);
                    } else if(evtJson.ChannelStatus == "Link") {
                        if(evtJson.LinkedChannel.ChannelType == "normal") {
                            _phone_currentState = _phone_talking;
                            _phone_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "threeWayCall") {
                            _phone_currentState = _phone_threeWayTalking;
                            _phone_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "transfer") {
                            _phone_currentState = _phone_transfer;
                            _phone_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "dialTransfer") {
                            _phone_currentState = _phone_dialoutTransfer;
                            _phone_update(evtJson);
                        }
                    }
                }
            }
            break;
    }

}

function _phone_monitorProcess(evtJson) {
    _phone_monitorPeer(evtJson);
    _phone_monitorQueue(evtJson);
    _phone_monitorServiceNo(evtJson);
    _phone_monitorAccount(evtJson);
}

function _phone_monitorPeer(evtJson) {
//    console.info("_phone_monitorPeer=============");
//    console.dir(evtJson)
    if (evtJson.Event == "ChannelStatus") {
        if(evtJson.ChannelStatus == "Hangup"){
            if(evtJson.UserID == undefined)
                return;
        }
        var peer = _phone_getUserFromSip(evtJson.Exten);
        if(!peer)
            return;
        if(evtJson.ChannelStatus == "Down"){
            peer.callStatus = "Down";
            peer.channel = evtJson.Channel;
            _phone_updateQueueInfo();
        } else if(evtJson.ChannelStatus == "Ring") {
            peer.callStatus = "Ring";
            peer.called = false;
            peer.C5Status = evtJson.C5Status;
            peer.timestamp = evtJson.Timestamp;
            peer.channel = evtJson.Channel;
            peer.queueName = "";
            if(evtJson.C5Status == "OutboundCall"
                || evtJson.C5Status == "InboundCall"
                || evtJson.C5Status == "listen"){
                peer.callNo = evtJson.Data.ListenExten;
            } else if(evtJson.FromDid)
                peer.callNo = evtJson.FromDid;
            phone_publishEvent("EvtMonitorPeer", [peer]);
        } else if(evtJson.ChannelStatus == "Ringing") {
            peer.called = true;
            peer.callStatus = "Ringing";
            peer.C5Status = evtJson.C5Status;
            peer.channel = evtJson.Channel;
            peer.linkedChannel = evtJson.LinkedChannel.Channel;
            if(evtJson.LinkedChannel) {
                peer.queueName = evtJson.LinkedChannel.QueueName;
            }
            if(evtJson.ChannelType == "dialTransfer")
                peer.callNo = evtJson.FromDid;
            else
                peer.callNo = evtJson.FromCid;
            peer.timestamp = evtJson.Timestamp;
            phone_publishEvent("EvtMonitorPeer", [peer]);
        } else if(evtJson.ChannelStatus == "Up") {
            if(evtJson.ChannelType == "listen"){
                peer.callNo = evtJson.Data.ListenExten;
                peer.timestamp = evtJson.Timestamp;
                peer.C5Status = evtJson.C5Status;
                peer.callStatus = evtJson.ChannelType;
                peer.linked = true;
                peer.channel = evtJson.Channel;
                phone_publishEvent("EvtMonitorPeer", [peer]);
            }
        } else if(evtJson.ChannelStatus == "Link") {
            peer.timestamp = evtJson.Timestamp;
            peer.C5Status = evtJson.C5Status;
            linked = true;
            peer.channel = evtJson.Channel;
            peer.linkedChannel = evtJson.LinkedChannel.Channel;
            peer.callStatus = evtJson.ChannelType;
            if(evtJson.LinkedChannel) {
                peer.queueName = evtJson.LinkedChannel.QueueName;
            }
            if(evtJson.ChannelType == "dialout"
                || evtJson.ChannelType == "dialTransfer")
                peer.callNo = evtJson.LinkedChannel.FromDid;
            else
                peer.callNo = evtJson.LinkedChannel.FromCid;
            phone_publishEvent("EvtMonitorPeer", [peer]);
        } else if(evtJson.ChannelStatus == "Unlink") {

        } else if(evtJson.ChannelStatus == "Hangup"){
            if (evtJson.ChannelType == "listen") {
                if(phone_data._curChannel == evtJson.Channel) {
                    if (evtJson.ChannelType == "listen") {
                        phone_data._otherChannel = "";
                        phone_publishEvent("EvtEndListen", []);
                    }
                }
            }
            if(peer.channel == evtJson.Channel) {
                if(phone_data._otherChannel == evtJson.Channel
                    && (_phone_stateDescription[_phone_currentState] == "listening" || _phone_stateDescription[_phone_currentState] == "listened")) {
                    phone_hangup();
                }
            }
            peer.callNo = "";
            peer.callStatus = "Idle";
            peer.timestamp = evtJson.Timestamp;
            peer.channel = "";
            peer.linkedChannel = "";
            peer.queueName = "";
            _phone_updateQueueInfo();
            phone_publishEvent("EvtMonitorPeer", [peer]);
        }
    } else if(evtJson.Event == "UserStatus") {
        var isRegistered = false;
        if(evtJson.PeerStatus == "Registered")
            isRegistered = true;
        if(!phone_peers[evtJson.UserID]) {
            var peer = {
                exten:evtJson.Exten,
                sipNo:evtJson.SipNum,
                name:evtJson.User,
                DisplayName: evtJson.DisplayName,
                loginExten:evtJson.LoginExten,
                peerStatus:evtJson.PeerStatus,
                status:evtJson.Status,
                C5Status:evtJson.C5Status,
                busy:evtJson.Busy,
                extenType:evtJson.ExtenType,
                login:evtJson.Login,
                userId:evtJson.UserID,
                user:evtJson.User,
                localNo:evtJson.Local,
                register: isRegistered,
                InCalls: evtJson.InCalls,
                InComplete: evtJson.InComplete,
                TransferComplete: evtJson.TransferComplete,
                OutCalls: evtJson.OutCalls,
                OutComplete: evtJson.OutComplete,
                DialinTimeLength: evtJson.DialinTimeLength,
                DialoutTimeLength: evtJson.DialoutTimeLength,
                linked:false,
                channel:"",
                linkedChannel:"",
                called:false,
                callStatus:"Idle",
                callNo:"",
                timestamp:evtJson.Login?(evtJson.BusyTimestamp):"",
                busyTimestamp:evtJson.BusyTimestamp,
                loginTimestamp:evtJson.LoginTimestamp,
                busyType:evtJson.BusyType,
                //pinyin: cnToSpell.getSpell(evtJson.DisplayName),
                pbx: evtJson.PBX
            };
            phone_peers[evtJson.UserID] = peer;
            if(evtJson.SipNum)
                _phone_updateUserSip(evtJson.SipNum, peer);
            phone_publishEvent("EvtMonitorPeer", [peer]);
        } else {
            var peer = phone_peers[evtJson.UserID];
            peer.peerStatus = evtJson.PeerStatus;
            peer.status = evtJson.Status;
            peer.exten = evtJson.Exten;
            peer.sipNo = evtJson.SipNum;
            peer.C5Status = evtJson.C5Status;
            peer.busy = evtJson.Busy;
            peer.extenType = evtJson.ExtenType;
            peer.login = evtJson.Login;
            peer.loginExten = evtJson.LoginExten;
            peer.name = evtJson.User;
            peer.DisplayName = evtJson.DisplayName;
            peer.userId = evtJson.UserID;
            peer.user = evtJson.User;
            peer.localNo = evtJson.Local;
            peer.register = isRegistered;
            peer.InCalls = evtJson.InCalls;
            peer.InComplete = evtJson.InComplete;
            peer.TransferComplete = evtJson.TransferComplete;
            peer.DialinTimeLength = evtJson.DialinTimeLength;
            peer.DialoutTimeLength = evtJson.DialoutTimeLength;
            peer.OutCalls = evtJson.OutCalls;
            peer.OutComplete = evtJson.OutComplete;
            peer.busyTimestamp=evtJson.BusyTimestamp;
            peer.loginTimestamp=evtJson.LoginTimestamp;
            peer.busyType=evtJson.BusyType;
            peer.timestamp = peer.login?(peer.busyTimestamp):"";
//            if(peer.DisplayName != evtJson.DisplayName)
//                peer.pinyin = cnToSpell.getSpell(evtJson.DisplayName);
            if(evtJson.SipNum)
                _phone_updateUserSip(evtJson.SipNum, peer);
            if (!peer.sipNo) {
                peer.callStatus = "Idle";
                peer.callNo = "";
            }
            phone_publishEvent("EvtMonitorPeer", [peer]);
            _phone_updateQueueInfo();
        }
    } else if(evtJson.Event == "UserBusy") {
        if(phone_peers[evtJson.UserID]) {
            var peer = phone_peers[evtJson.UserID];
            peer.busy = evtJson.Busy;
            peer.busyType=evtJson.BusyType;
            peer.busyTimestamp = evtJson.BusyTimestamp;
            peer.timestamp = peer.login?(peer.busyTimestamp):"";
            peer.loginTimestamp = evtJson.LoginTimestamp;
            phone_publishEvent("EvtMonitorPeer", [peer]);
            _phone_updateQueueInfo();
        }
    } else if(evtJson.Event == "UserCallsUpdate") {
        if(phone_peers[evtJson.UserID]) {
            var peer = phone_peers[evtJson.UserID];
            peer.InCalls = evtJson.InCalls;
            peer.InComplete = evtJson.InComplete;
            peer.TransferComplete = evtJson.TransferComplete;
            peer.DialoutTimeLength = evtJson.DialoutTimeLength;
            peer.DialinTimeLength = evtJson.DialinTimeLength;
            peer.OutCalls = evtJson.OutCalls;
            peer.OutComplete = evtJson.OutComplete;
            phone_publishEvent("EvtMonitorPeer", [peer]);
            _phone_updateQueueInfo();
        }
    } else if(evtJson.Event == "UserSignIn") {
        if(phone_peers[evtJson.UserID]) {
            var peer = phone_peers[evtJson.UserID];
            peer.extenType = evtJson.ExtenType;
            peer.login = evtJson.Login;
            peer.sipNo = evtJson.SipNum;
            phone_publishEvent("EvtMonitorPeer", [peer]);
            _phone_updateQueueInfo();
        }
    } else if(evtJson.Event == "UserSignOut") {
        if(phone_peers[evtJson.UserID]) {
            var peer = phone_peers[evtJson.UserID];
            peer.extenType = evtJson.ExtenType;
            peer.sipNo = evtJson.SipNum;
            peer.login = evtJson.Login;
            phone_publishEvent("EvtMonitorPeer", [peer]);
            _phone_updateQueueInfo();
        }
    } else if(evtJson.Event == "PeerStatus") {
        var isRegistered = false;
        if(evtJson.PeerStatus == "Registered")
            isRegistered = true;
        var peer = _phone_getUserFromSip(evtJson.Exten);
        if(peer){
            peer.register = isRegistered;
            peer.status = evtJson.Status;
            phone_publishEvent("EvtMonitorPeer", [peer]);
            _phone_updateQueueInfo();
        }
    }
}

function _phone_monitorQueue(evtJson) {
    if(evtJson.Event == "QueueParams") {
        var queueItem = {};
        queueItem = _phone_queryQueueItem(evtJson);
        if(queueItem) {
            if(evtJson.Removed) {
                queueItem.removed = true;
            }
            queueItem.queueName = evtJson.DisplayName;
            queueItem.idleAgentCount=evtJson.Members - evtJson.BusyMembers;
            queueItem.busyAgentCount=evtJson.BusyMembers;
            queueItem.totalAgentCount=evtJson.Members;
            queueItem.queueWaitCount=evtJson.Calls;
            queueItem.abadonedCalls=evtJson.Abandoned;
            queueItem.totalCalls=evtJson.TotalCalls;
            queueItem.DisplayName = evtJson.DisplayName;
            queueItem.members=[];
            for(var i in evtJson.QueueMember){
                var member = evtJson.QueueMember[i];
                queueItem.members[member] = member;
            }
            phone_publishEvent("EvtMonitorQueue", [queueItem, "needWaitCount"]);
        } else {
            queueItem = {
                queueName:evtJson.DisplayName,
                queueId:evtJson.Queue,
                idleAgentCount:evtJson.Members - evtJson.BusyMembers,
                busyAgentCount:evtJson.BusyMembers,
                totalAgentCount:evtJson.Members,
                queueWaitCount:evtJson.Calls,
                abadonedCalls:evtJson.Abandoned,
                DisplayName: evtJson.DisplayName,
                totalCalls:evtJson.TotalCalls,
                members:[],
                removed:false,
                pbx: evtJson.PBX
            };
            for(var i in evtJson.QueueMember){
                var member = evtJson.QueueMember[i];
                queueItem.members[member] = member;
            }
            phone_queues[evtJson.Queue] = queueItem;
            phone_publishEvent("EvtMonitorQueue", [queueItem, "needWaitCount"]);
        }
    } else if(evtJson.Event == "QueueMemberAdded") {
        var queueItem = _phone_queryQueueItem(evtJson);
        if(queueItem) {
            if(!queueItem.members[evtJson.Exten]){
                queueItem.members[evtJson.Exten] = evtJson.Exten;  //change
                queueItem.totalAgentCount++;
                _phone_updateQueueInfo();
            }
        }
    } else if(evtJson.Event == "QueueMemberRemoved"){
        var queueItem = _phone_queryQueueItem(evtJson);
        if(queueItem){
            if(queueItem.members[evtJson.Exten]){
                delete queueItem.members[evtJson.Exten];
                queueItem.totalAgentCount--;
                phone_publishEvent("EvtMonitorQueue", [queueItem, "noNeedWaitCount"]);
            }
        }
    } else if(evtJson.Event == "Join"){
        var queueItem = _phone_queryQueueItem(evtJson);
        if(queueItem) {
            queueItem.queueWaitCount++;
            phone_publishEvent("EvtMonitorQueue", [queueItem, "needWaitCount"]);
        }
    } else if(evtJson.Event == "Leave"){
        var queueItem = _phone_queryQueueItem(evtJson);
        if(queueItem) {
            queueItem.totalCalls++;
            queueItem.queueWaitCount--;
            if(queueItem.queueWaitCount < 0)
                queueItem.queueWaitCount = 0;
            phone_publishEvent("EvtMonitorQueue", [queueItem, "needWaitCount"]);
        }
    } else if(evtJson.Event == "QueueCallerAbandon"){
        var queueItem = _phone_queryQueueItem(evtJson);
        if(queueItem){
            queueItem.abadonedCalls++;
            phone_publishEvent("EvtMonitorQueue", [queueItem, "noNeedWaitCount"]);
        }
    }
}

function _phone_monitorAccount(evtJson) {
    if(evtJson.Event == "AccountStatus") {
        if(!phone_accountCalls[evtJson.PBX]){
            var account = {
                account: evtJson.Account,
                inCalls: evtJson.InCalls,
                outComplete: evtJson.OutComplete,
                inComplete: evtJson.InComplete,
                outCalls: evtJson.OutCalls,
                inCallsPerHour: evtJson.InCallsPerHour,
                currentOutCalls: evtJson.CurrentOutCalls,
                pbx: evtJson.PBX,
                inCompletePerHour: evtJson.InCompletePerHour,
                outCallsPerHour: evtJson.OutCallsPerHour,
                currentInCalls: evtJson.CurrentInCalls,
                outCompletePerHour: evtJson.OutCompletePerHour
            };
            phone_accountCalls[evtJson.PBX] = account;
            phone_publishEvent("EvtAccountCalls", [account]);
        } else {
            var account = phone_accountCalls[evtJson.PBX];
            account.account = evtJson.Account;
            account.inCalls = evtJson.InCalls;
            account.outComplete = evtJson.OutComplete;
            account.inComplete = evtJson.InComplete;
            account.outCalls = evtJson.OutCalls;
            account.inCallsPerHour = evtJson.InCallsPerHour;
            account.currentOutCalls = evtJson.CurrentOutCalls;
            account.pbx = evtJson.PBX;
            account.inCompletePerHour = evtJson.InCompletePerHour;
            account.outCallsPerHour = evtJson.OutCallsPerHour;
            account.currentInCalls = evtJson.CurrentInCalls;
            account.outCompletePerHour = evtJson.OutCompletePerHour;
            phone_publishEvent("EvtAccountCalls", [account]);
        }
    }

}

function _phone_queryQueueItem(evtJson) {
    return phone_queues[evtJson.Queue];
}

function phone_registerEvent(eventName, method) {
    $("#icc_event").on(eventName, method);
}

function phone_unregisterEvent(eventName) {
    $("#icc_event").unbind(eventName);
}

function phone_publishEvent(eventName, params) {
    try {
        $("#icc_event").trigger(eventName, params);
    } catch (e) {
        console.dir(e);
    }
}

function _phone_updateQueueInfo() {
    for(var i in phone_queues) {
        var queue = phone_queues[i];
        var members = queue.members;
        queue.busyAgentCount = 0;
        queue.idleAgentCount = 0;
        for(var j in members) {
            var peer = _phone_getUserFromSip(members[j]);
            if(peer){
                if(peer.extenType == "sip"){
                    if(!peer.register
                        || !peer.login
                        || peer.busy
                        || peer.callStatus != "Idle") {
                        queue.busyAgentCount++;
                    }else {
                        queue.idleAgentCount++;
                    }
                } else if(peer.extenType == "gateway"){
                    if(!peer.register
                        || peer.busy
                        || peer.callStatus != "Idle"){
                        queue.busyAgentCount++;
                    }else {
                        queue.idleAgentCount++;
                    }
                } else if(peer.extenType == "Local"){
                    if(peer.busy
                        || peer.callStatus != "Idle"){
                        queue.busyAgentCount++;
                    } else {
                        queue.idleAgentCount++;
                    }
                } else {
                    queue.busyAgentCount++;
                }
            } else {
                queue.idleAgentCount++;
            }
        }
        phone_publishEvent("EvtMonitorQueue", [queue, "noNeedWaitCount"]);
    }
}

function _phone_update(evtJson) {
    var timestamp = "";
    if(evtJson.Event == "ChannelStatus") {
        if(evtJson.Timestamp)
            timestamp = evtJson.Timestamp;
    } else if(evtJson.Event == "UserStatus") {
        timestamp = (evtJson.Login? (evtJson.BusyTimestamp) : "");
    } else if(evtJson.Event == "UserBusy") {
        timestamp = evtJson.BusyTimestamp;
    }
    phone_publishEvent("toolbarupdate", [_phone_stateDescription[_phone_currentState], timestamp]);
    switch (_phone_currentState) {
        case _phone_unregister:
            break;
        case _phone_peerstate:
            if(evtJson.Event == "ChannelStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    phone_data._curChannel = evtJson.Channel;
                    dsevent.publish(dsevent.evt.callItemRinged, {callId: evtJson.Data.CallSheetID});
                }
            }
            if(window.jQuery.fn.tooltip){
                $('#softphone_phonestate_dropdown_tip').tooltip('destroy');
            }
            break;
        case _phone_dialing:
            phone_data._curChannel = evtJson.Channel;
            if(window.jQuery.fn.tooltip){
                if(evtJson.CalleeProvince != '')
                    $('#softphone_phonestate_dropdown_tip').tooltip({placement:'bottom',trigger:'hover',title:evtJson.CalleeProvince+'  '+evtJson.CalleeCity});
            }
            //TODO
            break;
        case _phone_innerDialing:
            phone_data._curChannel = evtJson.Channel;
            //TODO
            break;
        case _phone_belling:
            phone_data._curChannel = evtJson.Channel;
            phone_data._otherChannel = evtJson.LinkedChannel.Channel;
            if (evtJson.Link) {
                var linkedChannel = evtJson.LinkedChannel;
                if(_phone_callObject.callId != linkedChannel.Uniqueid) {
                    _phone_callObject.callId = linkedChannel.Uniqueid;
                    var callsheetid = "",ivrkey = "";
                    _phone_callObject = {
                        originCallNo: linkedChannel.FromCid,
                        originCalledNo: linkedChannel.FromDid,
                        queue: linkedChannel.Queue,
                        offeringTime: _phone_dateParse(new Date(evtJson.Timestamp * 1000)),
                        callerProvince: decodeURIComponent(evtJson.CallerProvince),
                        callerCity: decodeURIComponent(evtJson.CallerCity)
                    };
                    if(linkedChannel.Data){
                        if(linkedChannel.Data.CallSheetID){
                            callsheetid = linkedChannel.Data.CallSheetID;
                            _phone_callObject.callSheetId = callsheetid;
                        }
                        if(linkedChannel.Data.IVRKEY){
                            ivrkey = linkedChannel.Data.IVRKEY;
                            _phone_callObject.ivrkey = ivrkey;
                        }
                        for (var key in linkedChannel.Data) {
                            if (key == "CallSheetID" || key == "callSheetID" || key == "IVRKEY") {
                                continue;
                            }
                            _phone_callObject[key] = linkedChannel.Data[key];
                        }
                    } else {
                        _phone_callObject.callSheetId = callsheetid;
                    }

                    var queue = phone_queues[_phone_callObject.queue];
                    if(queue) {
                        _phone_callObject.queueName = queue.queueName;
                    }
                    phone_publishEvent("EvtRing", [_phone_callObject]);
                }
            }
            break;
        case _phone_innerBelling:
            phone_data._curChannel = evtJson.Channel;
            phone_data._otherChannel = evtJson.LinkedChannel.Channel;
            //TODO
            break;
        case _phone_listening:
            phone_data._curChannel = evtJson.Channel;
            //TODO
            break;
        case _phone_talking:
            phone_data._curChannel = evtJson.Channel;
            phone_data._otherChannel = evtJson.LinkedChannel.Channel;
            //TODO
            break;
        case _phone_transfer:
            phone_data._curChannel = evtJson.Channel;
            phone_data._otherChannel = evtJson.LinkedChannel.Channel;
            //TODO
            break;
        case _phone_dialoutTransfer:
            phone_data._curChannel = evtJson.Channel;
            phone_data._otherChannel = evtJson.LinkedChannel.Channel;
            //TODO
            break;
        case _phone_threeWayTalking:
            phone_data._curChannel = evtJson.Channel;
            phone_data._otherChannel = evtJson.LinkedChannel.Channel;
            //TODO
            break;
        case _phone_innerTalking:
            phone_data._curChannel = evtJson.Channel;
            phone_data._otherChannel = evtJson.LinkedChannel.Channel;
            //TODO
            break;
        case _phone_dialTalking:
            phone_data._curChannel = evtJson.Channel;
            phone_data._otherChannel = evtJson.LinkedChannel.Channel;
            if(window.jQuery.fn.tooltip){
                if(evtJson.CalleeProvince != ''){
                    $('#softphone_phonestate_dropdown_tip').tooltip('destroy');
                    $('#softphone_phonestate_dropdown_tip').tooltip({placement:'bottom',trigger:'hover',title:evtJson.CalleeProvince+'  '+evtJson.CalleeCity});
                }
            }
            //TODO
            break;
        case _phone_listened:
            phone_data._curChannel = evtJson.Channel;
            break;
        case _phone_transferBelling:
            phone_data._curChannel = evtJson.Channel;
            phone_data._otherChannel = evtJson.LinkedChannel.Channel;
            if (evtJson.Link) {
                var linkedChannel = evtJson.LinkedChannel;
                if(_phone_callObject.callId != linkedChannel.Uniqueid) {
                    _phone_callObject.callId = linkedChannel.Uniqueid;
                    var callsheetid = "",ivrkey = "";
                    if(linkedChannel.Data && linkedChannel.Data.CallSheetID)
                        callsheetid = linkedChannel.Data.CallSheetID;
                    _phone_callObject = {
                        callSheetId: callsheetid,
                        originId: linkedChannel.Uniqueid,
                        originCallNo: linkedChannel.FromCid,
                        originCalledNo: linkedChannel.FromDid,
                        callType: linkedChannel.ChannelType,
                        callId: linkedChannel.Uniqueid,
                        queue: linkedChannel.Queue,
                        location: linkedChannel.Location,
                        offeringTime: _phone_dateParse(new Date(evtJson.Timestamp * 1000)),
                        callerProvince: decodeURIComponent(evtJson.CallerProvince),
                        callerProvinceCode: evtJson.CallerProvinceCode,
                        callerCity: decodeURIComponent(evtJson.CallerCity),
                        callerCityCode: evtJson.CallerCityCode,
                        data: {}
                    };
                    if (linkedChannel.Data) {
                        _phone_callObject.data = linkedChannel.Data;
                        _phone_callObject.data.callSheetId = callsheetid;
                        if(linkedChannel.Data.IVRKEY){
                            ivrkey = linkedChannel.Data.IVRKEY;
                            _phone_callObject.ivrkey = ivrkey;
                        }
                        for (var key in linkedChannel.Data) {
                            if (key == "CallSheetID" || key == "callSheetID" || key == "IVRKEY") {
                                continue;
                            }
                            _phone_callObject[key] = linkedChannel.Data[key];
                        }
                    }
                    var queue = phone_queues[_phone_callObject.queue];
                    if(queue) {
                        _phone_callObject.queueName = queue.queueName;
                    }
                    phone_publishEvent("EvtRing", [_phone_callObject]);
                }
            }
            break;
        case _phone_transferDialing:
            phone_data._curChannel = evtJson.Channel;
            phone_data._otherChannel = evtJson.LinkedChannel.Channel;
            if (evtJson.Link) {
                var linkedChannel = evtJson.LinkedChannel;
                if(_phone_callObject.callId != linkedChannel.Uniqueid) {
                    _phone_callObject.callId = linkedChannel.Uniqueid;
                    var callsheetid = "";
                    if(linkedChannel.Data && linkedChannel.Data.CallSheetID)
                        callsheetid = linkedChannel.Data.CallSheetID;
                    _phone_callObject = {
                        callSheetId: callsheetid,
                        originId: linkedChannel.Uniqueid,
                        originCallNo: linkedChannel.FromCid,
                        originCalledNo: linkedChannel.FromDid,
                        callType: linkedChannel.ChannelType,
                        callId: linkedChannel.Uniqueid,
                        queue: linkedChannel.Queue,
                        location: linkedChannel.Location,
                        offeringTime: _phone_dateParse(new Date(evtJson.Timestamp * 1000)),
                        callerProvince: decodeURIComponent(evtJson.CallerProvince),
                        callerProvinceCode: evtJson.CallerProvinceCode,
                        callerCity: decodeURIComponent(evtJson.CallerCity),
                        callerCityCode: evtJson.CallerCityCode,
                        data: {}
                    };
                    if (linkedChannel.Data) {
                        _phone_callObject.data = linkedChannel.Data;
                        _phone_callObject.data.callSheetId = callsheetid;
                    }
                    var queue = phone_queues[_phone_callObject.queue];
                    if(queue) {
                        _phone_callObject.queueName = queue.queueName;
                    }
                    phone_publishEvent("EvtRing", [_phone_callObject]);
                }
            }
            break;
    }
    //TODO publish
}

function _phone_getUserFromSip(sipNo) {
    var peer = _phone_peersFromSip[sipNo];
    if(peer == null || peer == "") {
        if(!phone_peers)
            return null;
        for(var i in phone_peers) {
            if(phone_peers[i].sipNo == sipNo) {
                _phone_peersFromSip[sipNo] = phone_peers[i];
                return _phone_peersFromSip[sipNo];
            }
        }
        return null;
    } else {
        return peer;
    }
}

function _phone_updateUserSip(sipNo, peer) {
    //var peer = _phone_peersFromSip[sipNo];
    _phone_peersFromSip[sipNo] = peer;
}

function _phone_getUserFromExten(exten) {
    if(!phone_peers)
        return null;
    for(var i in phone_peers) {
        if(phone_peers[i].exten == exten) {
            return phone_peers[i];
        }
    }
    return null;
}

function _phone_super(evtJson) {
    if(evtJson.Event == "UserStatus") {
        if (phone_data.userId == evtJson.UserID) {
            phone_data.busyType = evtJson.BusyType;
            if(phone_data.sipNo != evtJson.SipNum) {
                phone_data.sipNo = evtJson.SipNum;
                if(evtJson.PeerStatus == "Unregistered") {
                    _phone_currentState = _phone_unregister;
                    _phone_update(evtJson);
                } else if(evtJson.PeerStatus == "Registered") {
                    _phone_currentState = _phone_peerstate;
                    _phone_update(evtJson);
                }
            }
        }
    } else if(evtJson.Event == "UserBusy") {
        if(phone_data.userId == evtJson.UserID)
            phone_data.busyType = evtJson.BusyType;
    } else if(evtJson.Event == "ChannelStatus") {
        if(evtJson.Exten == phone_data.sipNo) {
            if(evtJson.ChannelStatus == "Unlink") {
                phone_data._curChannel = evtJson.Channel;
                phone_data._callId = "";
            }
            if(evtJson.ChannelStatus == "Unlink" || evtJson.ChannelStatus == "Hangup") {
                //console.info("Unlink============");
                //console.dir(evtJson)
                //座席外呼任务自动拨打下一个
/*                if(evtJson.Data.CallStatus){
                    if(evtJson.Data.CallStatus != "dealing" && evtJson.Data.CdrVar.lastIndexOf("SAMPLEID:") > -1){
                        handler.customer.task.callNextPhone(evtJson);
                    }
                }*/
            }
        }
    } else if(evtJson.Event == "PeerStatus") {
        if(evtJson.Exten == phone_data.sipNo) {
            if(_phone_currentState != _phone_peerstate)
                return;
            if(phone_data.busyType == _phone_systemBusy)
                return;
            var peer = _phone_getUserFromSip(evtJson.Exten);
            if(peer)
                phone_publishEvent("toolbarupdate", [_phone_stateDescription[_phone_currentState], ""]);
        }
    } else if(evtJson.Event == "TransferSuccess"
        || evtJson.Event == "TransferFailed") {
        evtJson.Type = "Transfer";
        if(evtJson.Investigate) {
            evtJson.Type = "Investigate";
        }
        phone_publishEvent("transfering", [evtJson.Event]);
    }else if(evtJson.Event == "IvrMenuEnd"){
        phone_publishEvent("ivrMenuTransfering", [evtJson]);
    }
}

function phone_dialout(phoneNum,cdrVariable,flag) {
    if (/^\d+$/.test(phoneNum)) {
        var call_type = "";
        if(phoneNum.length < 5 && phoneNum.length != 4) {
            var peer = _phone_getUserFromExten(phoneNum);
            if(!peer) {
                phoneNum = "9" + phoneNum;
                call_type = "dialout";
            } else {
                call_type = "inner";
            }
        } else if(phoneNum.length == 4) {
            call_type = "inner";
        } else {
            phoneNum = "9" + phoneNum;
            call_type = "dialout";
        }
        var phoneJson = {
            Command: "Action",
            Action: "Originate",
            ActionID: "Originate" + Math.random(),
            Channel: "SIP/" + phone_data.sipNo,
            Context: phone_data.accountId,
            Exten: phoneNum,
            Priority: '1',
            UserID: phone_data.userId,
            Timeout: 60000,
            Async: "true",
            CallType: call_type,
            PBX: phone_data.pbx_in_ip,
            Account: phone_data.accountId,
            SessionID: phone_data.uniqueId
        };
        if(cdrVariable){
            phoneJson.HasCdrVar = "true";
            phoneJson.ActionID = cdrVariable + "@" + Math.random();
        }
        var onload = function(response) {
            try {
                if(!response.Succeed) {
                    if(response.Expired) {
                        _phone_relogin();
                    }
                }
            } catch(e) {
            }
        }
        var onerror = function() {};
        _phone_sendAction(phoneJson, onload, onerror);
        return true;
    } else {
        alert("请输入正确的电话号码");
        return false;
    }
}

function phone_setBusy(isBusy, busyType) {
    if(_phone_isSettingbusy)
        return;
    else
        _phone_isSettingbusy = true;
    var phoneJson = {
        Command: "Action",
        Action: "Busy",
        ActionID: "Busy" + Math.random(),
        Exten: phone_data.userId,
        Busy: isBusy,
        BusyType: "" +busyType,
        PBX: phone_data.pbx_in_ip,
        Account: phone_data.accountId,
        SessionID: phone_data.uniqueId
    };
    var onload = function(response){
        if(!response.Succeed) {
            if(response.Expired) {
                _phone_relogin();
            }
        }
        _phone_isSettingbusy = false;
    }
    var onerror = function() {
        _phone_isSettingbusy = false;
    };
    _phone_sendAction(phoneJson, onload, onerror);
}

function phone_hangup() {
    var phoneJson = {
        Command: "Action",
        Action: "Hangup",
        ActionID: "Hangup" + Math.random(),
        Channel: phone_data._curChannel,
        PBX: phone_data.pbx_in_ip,
        Account: phone_data.accountId,
        SessionID: phone_data.uniqueId
    };
    var onload = function(response){
        if(!response.Succeed) {
            //TODO callObject = {};
            if(response.Expired) {
                _phone_relogin();
            }
        }
    }
    _phone_sendAction(phoneJson, onload, function(){});
}

function phone_hold() {
    var phoneJson = {
        Command: "Action",
        Action: "Hold",
        ActionID: "Hold" + Math.random(),
        Channel: phone_data._otherChannel,
        UserID: phone_data.userId,
        PBX: phone_data.pbx_in_ip,
        Account: phone_data.accountId,
        SessionID: phone_data.uniqueId
    };
    var onload = function(response){
        if(response.Succeed) {
            _phone_stateBeforeHold = _phone_currentState;
            phone_publishEvent("toolbarupdate", ["hold", ""]);
        } else {
            //TODO callObject = {};
            if(response.Expired) {
                _phone_relogin();
            }
        }
    }
    _phone_sendAction(phoneJson, onload, function(){});
}

function phone_unhold() {
    var phoneJson = {
        Command: "Action",
        Action: "Unhold",
        ActionID: "Unhold" + Math.random(),
        Channel: phone_data._otherChannel,
        UserID: phone_data.userId,
        PBX: phone_data.pbx_in_ip,
        Account: phone_data.accountId,
        SessionID: phone_data.uniqueId
    };
    var onload = function(response){
        if(response.Succeed) {
            phone_publishEvent("toolbarupdate", [_phone_stateDescription[_phone_stateBeforeHold], ""]);
        } else {
            if(response.Expired) {
                _phone_relogin();
            }
        }
    }
    _phone_sendAction(phoneJson, onload, function(){});
}

function phone_consult(phoneNum, mode) {
    //TODO ask how to solve
    if(mode == "number") {
        if(phoneNum.length <= 5) {
            phoneNum = phoneNum.substr(1);
            _softphonebar_showConsult("工号 " + phoneNum + " ");
        } else
            _softphonebar_showConsult(phoneNum + " ");
    } else if(mode == "skillgroup") {
        _softphonebar_showConsult(phoneNum + " ");
    }
    var phoneJson = {
        Command: "Action",
        Action: "Consult",
        ActionID: "Consult" + Math.random(),
        FromExten: phone_data.sipNo,
        Exten: phoneNum,
        Timeout: 60000,
        UserID: phone_data.userId,
        PBX: phone_data.pbx_in_ip,
        Account: phone_data.accountId,
        SessionID: phone_data.uniqueId
    };
    var onload = function(response) {
        softphonebar_close();
        if(response.Succeed) {
            //TODO
            utils.showSucc("咨询成功");
            softphonebar_closeModel();
//            softphonebar_threewaycall();
            phone_publishEvent("toolbarupdate", ["consultTalking", "continueTime"]);
        } else {
            //TODO
            utils.showError("咨询失败");
            if(response.Expired) {
                _phone_relogin();
            }
        }
    }
    var error = function() {
        softphonebar_close();
        utils.showError("咨询失败");
    }
    _phone_sendAction(phoneJson, onload, error);
}

function phone_stopConsult() {
    var phoneJson = {
        Command: "Action",
        Action: "StopConsult",
        ActionID: "StopConsult" + Math.random(),
        FromExten: phone_data.sipNo,
        Timeout: 60000,
        UserID: phone_data.userId,
        PBX: phone_data.pbx_in_ip,
        Account: phone_data.accountId,
        SessionID: phone_data.uniqueId
    };
    var onload = function(response) {
        if(response.Succeed) {
            if(response.Message != undefined) {
                if(response.Message == "Idle") {
                    phone_publishEvent("toolbarupdate", ["peerstate", "continueTime"]);
                } else {
                    phone_publishEvent("toolbarupdate", ["talking", "continueTime"]);
                }
            } else {
                phone_publishEvent("toolbarupdate", ["talking", "continueTime"]);
            }
        } else {
            utils.showError("结束咨询通话失败");
            if(response.Expired) {
                _phone_relogin();
            }
        }
    }
    var error = function() {
        utils.showError("结束咨询通话失败");
    }
    _phone_sendAction(phoneJson, onload, error);
}

function phone_investigate() {
    if(_phone_isInvestigatting)
        return;
    _phone_isInvestigatting = true;
    var phoneJson = {
        Command: "Action",
        Action: "Transfer",
        ActionID: "Transfer" + Math.random(),
        Exten: 's',
        Channel: phone_data._otherChannel,
        Timeout: 60000,
        CallType: 'investigate',
        UserID: phone_data.userId,
        Context: phone_data.accountId + "-investigate",
        PBX: phone_data.pbx_in_ip,
        Account: phone_data.accountId,
        SessionID: phone_data.uniqueId
    };
    var onload = function(response) {
        if(response.Succeed) {
            //console.dir('转调查成功!');
        } else {
            if(response.Expired) {
                _phone_relogin();
            }
        }
        _phone_isInvestigatting = false;
    }
    var error = function() {
        _phone_isInvestigatting = false;
    }
    _phone_sendAction(phoneJson, onload, error);
}

function phone_transfer(phoneNum, mode) {
    softphonebar_closeModel();
    if(mode == "number") {
        if(phoneNum.length <= 5) {
            phoneNum = phoneNum.substr(1);
            _softphonebar_showTranster("工号 " + phoneNum + " ");
        } else
            _softphonebar_showTranster(phoneNum + " ");
    } else if(mode == "skillgroup") {
        _softphonebar_showTranster(phoneNum + " ");
    }
    var phoneJson = {
        Command: "Action",
        Action: "Transfer",
        ActionID: "Transfer" + Math.random(),
        Exten: phoneNum,
        Channel: phone_data._otherChannel,
        ExtraChannel: phone_data._curChannel,
        UserID: phone_data.userId,
        Context: phone_data.accountId,
        PBX: phone_data.pbx_in_ip,
        Account: phone_data.accountId,
        SessionID: phone_data.uniqueId
    };
    var onload = function(response) {
        if(response.Succeed) {
            //TODO
        } else {
            softphonebar_close();
            var message = "";
            if(response.Message == "310") {
                message = "未配置外呼线路";
            } else if(response.Message == "311"){
                message = "转接的用户忙";
            } else if(response.Message == "312"){
                message = "转接的用户未签入";
            } else if(response.Message == "313"){
                message = "转接的用户正在通话";
            } else if(response.Message == "314"){
                message = "转接的用户没有以通话方式登录";
            } else if(response.Message == "315"){
                message = "无法呼通转接的用户";
            } else if(response.Message == "316"){
                message = "转接用户不存在";
            } else {
                message = "";
            }
            if(message == "") {
                utils.showError("转接失败");
            } else {
                utils.showError("转接失败：" + message);
            }
            if(response.Expired) {
                _phone_relogin();
            }
        }
    };
    var error = function() {
        softphonebar_close();
        utils.showError("转接失败");
    };
    _phone_sendAction(phoneJson, onload, error);
}

function phone_cancelTransfer() {
    if (phone_data._otherChannel) {
        var phoneJson = {
            Command: "Action",
            Action: "CancelTransfer",
            ActionID: "CancelTransfer" + Math.random(),
            Channel: phone_data._otherChannel,
            PBX: phone_data.pbx_in_ip,
            Account: phone_data.accountId,
            SessionID: phone_data.uniqueId
        };
        var onload = function(response) {
            softphonebar_close();
            if(response.Succeed) {
                utils.showSucc("取消转接成功");
            } else {
                utils.showError("取消转接失败");
                if (response.Expired) {
                    _phone_relogin();
                }
            }
        };
        var error = function() {
            softphonebar_close();
            utils.showError("取消转接失败");
        };
        _phone_sendAction(phoneJson, onload, error);
    }
}

function phone_threewaycall(phoneNum) {
    softphonebar_closeModel();
    if(phoneNum.length <= 5) {
        phoneNum = phoneNum.substr(1);
        _softphonebar_showTranster("工号 " + phoneNum + " ");
    } else {
        phoneNum = phoneNum.substr(1);
        _softphonebar_showTranster(phoneNum + " ");
    }
    var phoneJson = {
        Command: "Action",
        Action: "ThreeWayCall",
        ActionID: "ThreeWayCall" + Math.random(),
        FromExten: phone_data.sipNo,
        Exten: phoneNum,
        Timeout: 60000,
        UserID: phone_data.userId,
        PBX: phone_data.pbx_in_ip,
        Account: phone_data.accountId,
        SessionID: phone_data.uniqueId
    };
    var onload = function(response) {
        softphonebar_close();
        if(response.Succeed) {
            utils.showSucc("三方通话成功");
            phone_publishEvent("toolbarupdate", ["threeWayTalking", ""]);
        } else {
            utils.showError("三方通话失败");
            if(response.Expired) {
                _phone_relogin();
            }
        }
    };
    var error = function() {
        softphonebar_close();
        utils.showError("三方通话失败");
    };
    _phone_sendAction(phoneJson, onload, error);
}

function phone_kick(userId) {
    var phoneJson = {
        Command: "Action",
        Action: "Kick",
        ActionID: "Kick" + Math.random(),
        Exten: userId,
        UserID: phone_data.userId,
        PBX: phone_data.pbx_in_ip,
        Account: phone_data.accountId,
        SessionID: phone_data.uniqueId
    };
    var onload = function(response) {
        if(response.Succeed) {
            var peer = phone_peers[userId];
            if(peer) {
                peer.C5Status = "";
                peer.callNo = "";
                peer.callStatus = "Idle";
                var date = new Date();
                var identity = date.valueOf();
                peer.timestamp = identity/1000;
                peer.channel = "";
                peer.linkedChannel = "";
                phone_publishEvent("EvtMonitorPeer", [peer]);
                _phone_updateQueueInfo();
            }
        } else {
            if(response.Expired) {
                _phone_relogin();
            }
        }
    }
    var error = function() {
    }
    _phone_sendAction(phoneJson, onload, error);
}

function phone_kickFromPbx(userId, pbx) {
    var phone_pbx = phone_pbxs[pbx];
    var url = phone_pbx.proxyUrl;
    var phoneJson = {
        Command: "Action",
        Action: "Kick",
        ActionID: "Kick" + Math.random(),
        Exten: userId,
        UserID: phone_data.userId,
        PBX: pbx,
        Account: phone_data.accountId,
        SessionID: phone_pbx.sessionId
    };
    var onload = function(response) {
        if(response.Succeed) {
            var peer = phone_peers[userId];
            if(peer) {
                peer.C5Status = "";
                peer.callNo = "";
                peer.callStatus = "Idle";
                var date = new Date();
                var identity = date.valueOf();
                peer.timestamp = identity/1000;
                peer.channel = "";
                peer.linkedChannel = "";
                phone_publishEvent("EvtMonitorPeer", [peer]);
                _phone_updateQueueInfo();
            }
        } else {
            if(response.Expired) {
                _phone_relogin();
            }
        }
    }
    var error = function() {
    }
    var json = $.toJSON(phoneJson);
    var timeout = 15000;
    $.ajax({
        type: "get",
        url: url,
        timeout: timeout,
        cache: false,
        data: {json: json},
        dataType: "jsonp",
        jsonp: "callbackName",
        success: onload,
        error: onerror
    });
}

function phone_pick(userId,extenType) {
    var peer = phone_peers[userId];
    if(!extenType){
        if(peer == null || peer.localNo == null || peer.localNo == ""){
            if(handler.config.callConfig){
                handler.config.callConfig.openLocalNumForPhonePick(userId);
            }else{
                utils.showSucc("不能对没有直线号码的座席做签入操作");
            }
            return;
        }
    }
    var phoneJson = {
        Command: "Action",
        Action: "SignIn",
        ActionID: "SignIn" + Math.random(),
        User: userId,
        UserID: phone_data.userId,
        PBX: phone_data.pbx_in_ip,
        Account: phone_data.accountId,
        SessionID: phone_data.uniqueId
    };
    if(extenType){
        phoneJson.ExtenType = extenType;
    }
    var onload = function(response) {
        if(response.Succeed) {
            utils.showSucc("座席签入成功");
        } else {
            if(extenType && extenType=='gateway'){
                if('isBeyond' in response){
                    utils.showError("当前在线座席总数已达最大值，无法再签入");
                }else{
                    utils.showError("该座席未绑定网关号或网关号未注册，无法签入");
                }
            }else{
                utils.showError("当前在线座席总数已达最大值，无法再签入");
            }
            if(response.Expired) {
                _phone_relogin();
            }
        }
    }
    var error = function() {
    }
    _phone_sendAction(phoneJson, onload, error);
}

function phone_pickFromPbx(userId, pbx) {
    var peer = phone_peers[userId];
    if(peer == null || peer.localNo == null || peer.localNo == ""){
        utils.showError("不能对没有直线号码的座席做签入操作");
        return;
    }
    var phone_pbx = phone_pbxs[pbx];
    var url = phone_pbx.proxyUrl;
    var phoneJson = {
        Command: "Action",
        Action: "SignIn",
        ActionID: "SignIn" + Math.random(),
        User: userId,
        UserID: phone_data.userId,
        PBX: pbx,
        Account: phone_data.accountId,
        SessionID: phone_pbx.sessionId
    };
    var onload = function(response) {
        if(response.Succeed) {
            utils.showSucc("座席签入成功");
        } else {
            utils.showError("当前在线座席总数已达最大值，无法再签入");
            if(response.Expired) {
                //TODO
                _phone_relogin();
            }
        }
    }
    var error = function() {
    }
    var json = $.toJSON(phoneJson);
    var timeout = 15000;
    $.ajax({
        type: "get",
        url: url,
        timeout: timeout,
        cache: false,
        data: {json: json},
        dataType: "jsonp",
        jsonp: "callbackName",
        success: onload,
        error: onerror
    });
}

function phone_hangupChannel(channel) {
    var phoneJson = {
        Command: "Action",
        Action: "Hangup",
        ActionID: "ForceHangup" + Math.random(),
        Channel: channel,
        UserID: phone_data.userId,
        PBX: phone_data.pbx_in_ip,
        Account: phone_data.accountId,
        SessionID: phone_data.uniqueId
    };
    var onload = function(response) {
    }
    var error = function() {
    }
    _phone_sendAction(phoneJson, onload, error);
}

function phone_hangupChannelFromPbx(channel, pbx) {
    var phone_pbx = phone_pbxs[pbx];
    var url = phone_pbx.proxyUrl;
    var phoneJson = {
        Command: "Action",
        Action: "Hangup",
        ActionID: "ForceHangup" + Math.random(),
        Channel: channel,
        UserID: phone_data.userId,
        PBX: pbx,
        Account: phone_data.accountId,
        SessionID: phone_pbx.sessionId
    };
    var onload = function(response) {
    }
    var error = function() {
    }
    var json = $.toJSON(phoneJson);
    var timeout = 15000;
    $.ajax({
        type: "get",
        url: url,
        timeout: timeout,
        cache: false,
        data: {json: json},
        dataType: "jsonp",
        jsonp: "callbackName",
        success: onload,
        error: onerror
    });
}

function phone_loot(channel) {
    if(phone_data.busyType == "0") {
        utils.showError("请先将电话置为忙碌");
        return;
    }
    var phoneJson = {
        Command: "Action",
        Action: "Transfer",
        ActionID: "Transfer" + Math.random(),
        Exten: phone_data.exten,
        Channel: channel,
        CallType: "Loot",
        Context: phone_data.accountId,
        UserID: phone_data.userId,
        PBX: phone_data.pbx_in_ip,
        Account: phone_data.accountId,
        SessionID: phone_data.uniqueId
    };
    var onload = function(response) {
        if(!response.Succeed) {
            if(response.Expired) {
                _phone_relogin();
            }
        }
    }
    var error = function() {
    }
    _phone_sendAction(phoneJson, onload, error);
}

function phone_listen(curChannel) {
    var phoneJson = {
        Command: "Action",
        Action: "Originate",
        ActionID: "Originate" + Math.random(),
        Channel: "SIP/" + phone_data.sipNo,
        Application: "ChanSpy",
        Data: curChannel+"|q",
        Callerid: phone_data.sipNo,
        UserID: phone_data.userId,
        PBX: phone_data.pbx_in_ip,
        Account: phone_data.accountId,
        SessionID: phone_data.uniqueId
    };
    var onload = function(response) {
        if(response.Succeed) {
            phone_data._otherChannel = curChannel;
        } else {
            if(response.Expired) {
                _phone_relogin();
            }
        }
    }
    var error = function() {
    }
    _phone_sendAction(phoneJson, onload, error);
    return true;
}

function _phone_monitorServiceNo(evtJson) {
    if(evtJson.Event == "TrunkStatus") {
        var displayName;
        if(evtJson.DisplayName) {
            displayName = evtJson.DisplayName;
            if(utils.startWith(displayName, "serviceno-")) {
                displayName = "";
            }
        }
        if(!phone_serviceNos[evtJson.ServiceNo]){
            var serviceNo = {
                serviceNo: evtJson.ServiceNo,
                inCalls: evtJson.InCalls,
                inLost: evtJson.InLost,
                inComplete: evtJson.InComplete,
                outCalls: 0,
                outComplete: 0,
                displayName: displayName,
                pbx: evtJson.PBX
            };
            phone_serviceNos[evtJson.ServiceNo] = serviceNo;
        } else {
            var serviceNo = phone_serviceNos[evtJson.ServiceNo];
            serviceNo.inCalls = evtJson.InCalls,
                serviceNo.inLost = evtJson.InLost,
                serviceNo.inComplete = evtJson.InComplete,
                serviceNo.outCalls = 0,
                serviceNo.outComplete = 0,
                serviceNo.displayName = displayName
        }
        phone_publishEvent("EvtMonitorServiceNo", [phone_serviceNos[evtJson.ServiceNo]]);
    }
}

function phone_pbxMonitor(pbx) {
    for(var i in phone_pbxs) {
        if(i == phone_data.pbx_in_ip)
            continue;
        if(i == pbx) {
            if(!phone_pbxs[pbx].monitor)
                _phone_pbxMonitorResister(i);
        } else {
            if(phone_pbxs[pbx].monitor)
                _phone_pbxMonitorLogOff(i)
        }
    }
}

function _phone_pbxMonitorResister(pbx) {
    var phone_pbx = phone_pbxs[pbx];
    var url = phone_pbx.proxyUrl;
    var phoneJson = {
        Command: "Action",
        Action: "Login",
        ActionID: "Login" + Math.random(),
        PBX: pbx,
        Account: phone_data.accountId,
        UserID: phone_data.monitorUser,
        Password: phone_data.monitorPassword,
        MonitorUser: true,
        AppVersion: 'service'
    };
    var onload = function(response) {
        if(response.Succeed) {
            phone_pbxs[pbx].sessionId = response.SessionID;
            phone_pbxs[pbx].isWaitingPbxEvent = false;
            phone_pbxs[pbx].monitor = true;
            _phone_waitPbxEvent(pbx);
        } else {
            phone_pbxs[pbx].monitor = false;
        }
    };
    var onerror = function() {
        phone_pbxs[pbx].monitor = false;
        alert('请求超时，请检查本地网络');
    };
    var json = $.toJSON(phoneJson);
    var timeout = 15000;
    $.ajax({
        type: "get",
        url: url,
        timeout: timeout,
        cache: false,
        data: {json: json},
        dataType: "jsonp",
        jsonp: "callbackName",
        success: onload,
        error: onerror
    });
}

function _phone_waitPbxEvent(pbx) {
    var phone_pbx = phone_pbxs[pbx];
    if(!phone_pbx.monitor)
        return;
    if(phone_pbx.isWaitingPbxEvent)
        return;
    phone_pbx.isWaitingPbxEvent = true;
    var url = phone_pbx.proxyUrl;
    var phoneJson = {
        Command: "Action",
        Action: "GetState",
        ActionID: "GetState" + Math.random(),
        SessionID: phone_pbx.sessionId,
        User: phone_data.monitorUser
    };
    var onload = function(response) {
        if (!response) {
            return;
        }
        var _response = response.Response;
        if (!_response.Succeed) {
            if(_response.Expired) {
                phone_pbx.isWaitingPbxEvent = false;
                _phone_pbxMonitorResister(pbx, url);
                return;
            }
        } else if(_response.Succeed && _response.HasEvent) {
            var events = response.Event;
            if(events != null) {
                _phone_eventHandler(events, true);
            }
        }
        phone_pbx.isWaitingPbxEvent = false;
        _phone_waitPbxEvent(pbx);
    };
    var onerror = function() {
        phone_pbx.isWaitingPbxEvent = false;
    };
    var json = $.toJSON(phoneJson);
    var timeout = 15000;
    $.ajax({
        type: "get",
        url: url,
        timeout: timeout,
        cache: false,
        data: {json: json},
        dataType: "jsonp",
        jsonp: "callbackName",
        success: onload,
        error: onerror
    });
}

function _phone_pbxMonitorLogOff(pbx) {
    var phone_pbx = phone_pbxs[pbx];
    if(phone_pbx.isMonitorLogOff)
        return;
    phone_pbx.isMonitorLogOff = true;
    var url = phone_pbx.proxyUrl;
    var phoneJson = {
        Command: "Action",
        Action: "Logoff",
        ActionID: "Logoff" + Math.random(),
        SessionID: phone_pbx.sessionId
    };
    var onload = function(response) {
        phone_pbx.isMonitorLogOff = false;
        phone_pbx.monitor = false;
    };
    var onerror = function() {
        phone_pbx.isMonitorLogOff = false;
        phone_pbx.monitor = false;
    };
    var json = $.toJSON(phoneJson);
    var timeout = 15000;
    $.ajax({
        type: "get",
        url: url,
        timeout: timeout,
        cache: false,
        data: {json: json},
        dataType: "jsonp",
        jsonp: "callbackName",
        success: onload,
        error: onerror
    });
}

function _phone_dateParse(date) {
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var hour = date.getHours();
    var minute = date.getMinutes();
    var second = date.getSeconds();
    return year + "-" + (month > 9 ? month : "0" + month) + "-" + (day > 9 ? day : "0" + day) + " "
        + (hour > 9 ? hour : "0" + hour) + ":" + (minute > 9 ? minute : "0" + minute);
}

function phone_exit(removeQueue) {
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
    _phone_sendAction(phoneJson, onload, function(){});
}

function syncMailDeal(callback) {
    var phoneJson = {
        Command: "Action",
        Action: "AcceptMail",
        ActionID: "AcceptMail" + Math.random(),
        UserID: phone_data.userId,
        PBX: phone_data.pbx_in_ip,
        Account: phone_data.accountId,
        SessionID: phone_data.uniqueId
    };
    console.dir(phoneJson);
    var onload = function(response) {
        console.log(response);
//        alert(response.Message);
        try {
            if(response.Succeed) {
                if(typeof callback=='function'){
                    callback(response);
                }
            }else{
                $().alertmessage('showError', "同步ass失败");
            }
        } catch(e) {
        }
    }
    var onerror = function() {$().alertmessage('showError', "同步ass失败");};
    _phone_sendAction(phoneJson, onload, onerror);
}


function syncChannelSet(data,callback) {
    var phoneJson = {
        Command: "Action",
        Action: "SetMultiChannelReceiveStatus",
        ActionID: "SetMultiChannelReceiveStatus" + Math.random(),
        UserID: phone_data.userId,
        PBX: phone_data.pbx_in_ip,
        Account: phone_data.accountId,
        Mail: data.channelMail+"",
        Weixin: data.channelWx+"",
        SessionID: phone_data.uniqueId
    };
//    console.dir(phoneJson);
    var onload = function(response) {
//        console.log(response);
        if (response.Succeed) {
            if(typeof callback=='function'){
                callback(response);
            }
        }else{
            $().alertmessage('showError', "同步ass失败");
        }
    }
    var onerror = function() {
        $().alertmessage('showError', "同步ass失败");
    };
    _phone_sendAction(phoneJson, onload, onerror);
}

function phone_switch_exten_type(extenType) {
    var extenNum = null;
    if(extenType == 'gateway'){
        if(!session.user.gatewayExten || session.user.gatewayExten == ''){
            alert("您没有设置语音网关sip号！");
            return;
        }else{
            extenNum = session.user.gatewayExten;
        }
    }else if(extenType == 'Local'){
        if(!session.user.mobile || session.user.mobile == ''){
            alert("您的直线号码为空，请您配置好直线号码并重新登录！");
            return;
        }else{
            extenNum = session.user.mobileExten;
        }
    }else{
        extenNum = session.user.sipExten;
    }
    console.log("登录方式变更["+extenType+"-"+extenNum+"]");
    var phoneJson = {
        Command: "Action",
        Action: "SetExtenType",
        ActionID: "SetExtenType" + Math.random(),
        PBX: session.user.pbx,
        Account: session.user.accountId,
        User: phone_data.userId,
        ExtenType : extenType,
        LoginExten: extenNum
    };
    var onload = function(response) {
        if(response.Succeed) {
            console.log("变更接听方式成功！");

            phone_data.extenType = extenType;
            if(phone_data.extenType == "sip") {
                $("#user_exten_type").text("软电话")
            } else if(phone_data.extenType == "gateway") {
                $("#user_exten_type").text("SIP话机")
            } else if(phone_data.extenType == "Local") {
                $("#user_exten_type").text(session.user.mobile);
                $("#user_status").empty();
            }
            $().alertmessage('showSuccess', "变更接听方式成功!");
        } else {
            $().alertmessage('showError', "变更接听方式失败!");
            console.log("变更接听方式失败！"+response.Message);
        }
    }
    var error = function() {
        $().alertmessage('showError', "变更接听方式失败!");
        console.log("变更接听方式失败！");
    }
    _phone_sendAction(phoneJson, onload, error);
    return true;
}