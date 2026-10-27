/**
 * Created by chenguang on 9/18/15.
 */
function phone_dialout(phoneNum,cdrVariable) {
    if (/^\d+$/.test(phoneNum)) {
      var call_type = "";
        if(phoneNum.length < 5 && phoneNum.length != 4) {
            var peer = _cti_getUserFromExten(phoneNum);
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
                        _cti_relogin();
                    }
                }
            } catch(e) {
            }
        }
        var onerror = function() {};
        _cti_sendAction(phoneJson, onload, onerror);
        return true;
    } else {
        alert("请输入正确的电话号码");
        return false;
    }
}
function showDialoutUrlInPopupCust(data){
    //外呼弹屏数据
    var dialoutUrls = getCache('dialoutUrls',null,true);
    for(var i=0; i<dialoutUrls.length;i++){
        if(dialoutUrls[i].enable=="true"){
            var dialoutUrl=dialoutUrls[i];
        }
    }
    var phoneNum= data.CalledNo;
    if(isHasFunc("func_dial_popup")){
        if(dialoutUrl){
            if(dialoutUrl && dialoutUrl !=""){
                var business={};
                if(dialoutUrl.type == '1') {
                    business.callType = "dialoutUrlIn";
                    business.type =dialoutUrl.type;
                } else if(dialoutUrl.type == '2') {
                    business.callType = "dialoutUrlOut";
                    business.type = dialoutUrl.type;
                    if (dialoutUrl.outOpenType) {
                        business.outOpenType = dialoutUrl.outOpenType;
                    }
                }
                business.url = dialoutUrl.url;
                if(business.callType == 'dialoutUrlIn') {
                    var right = $(".right-column");
                    right.empty();
                    right.css("overflow-y", "hidden");
                    right.html("<div style='background-color: #fff;width: 100%;height:100%' id=\"call_detail_pane\"></div>");
                }
                //callsheetId
                var callId = data.CallSheetID;
                var phoneNum = data.CalledNo;
                if(business.callType == 'dialoutUrlIn') {
                    handler.customer.showDialoutUrlInPopupCust(callId, phoneNum, function(){}, business.url, data);
                } else if(business.callType == 'dialoutUrlOut'){
                    handler.customer.showCallUrlOutPopupCust(callId, phoneNum, function(){}, business, data);
                } else {
                    handler.call.showPopupCust(callId, phoneNum, data.queue,data);
                }
            }
        }else{
            handler.call.showDialPopupCust(phoneNum);
        }

    }

}

function phone_setBusy(isBusy, busyType) {
    if(_cti_isSettingbusy)
        return;
    else
        _cti_isSettingbusy = true;
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
                _cti_relogin();
            }
        }
        _cti_isSettingbusy = false;
    }
    var onerror = function() {
        _cti_isSettingbusy = false;
    };
    _cti_sendAction(phoneJson, onload, onerror);
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
                _cti_relogin();
            }
        }
    }
    _cti_sendAction(phoneJson, onload, function(){});
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
            _cti_stateBeforeHold = _cti_currentState;
            phone_publishEvent("toolbarupdate", ["hold", ""]);
        } else {
            //TODO callObject = {};
            if(response.Expired) {
                _cti_relogin();
            }
        }
    }
    _cti_sendAction(phoneJson, onload, function(){});
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
            phone_publishEvent("toolbarupdate", [_cti_stateDescription[_cti_stateBeforeHold], ""]);
        } else {
            if(response.Expired) {
                _cti_relogin();
            }
        }
    }
    _cti_sendAction(phoneJson, onload, function(){});
}

function phone_mark() {
    var phoneJson = {
        Command: "Action",
        Action: "SetVar",
        ActionID: "SetVar" + Math.random(),
        Channel: phone_data._curChannel,
        UserID: phone_data.userId,
        PBX: phone_data.pbx_in_ip,
        Account: phone_data.accountId,
    };
    var modelLabel=$(".cdr-model-label>input:checked");
    var callID=$("#setCallLabel").attr("call");
    var labelId='';
    var labelIdObj={};
    var labelIdArray=[];
    labelIdObj.callID=callID;
    for(var i=0;i<modelLabel.length;i++){
        labelId+=modelLabel[i].getAttribute('ds_data')+"##";
        labelIdArray.push(modelLabel[i].getAttribute('ds_data'));
    }
    labelIdObj.labelIdArray=labelIdArray
    window.localStorage.setItem("labelIdObj",JSON.stringify(labelIdObj));
    phoneJson.Value="LABELS"+labelId;
    var onload = function(response){
        if(!response.Succeed) {
            //TODO callObject = {};
            if(response.Expired) {
                _cti_relogin();
            }
        }
    }
    _cti_sendAction(phoneJson, onload, function(){});
}

function phone_consult(phoneNum, mode) {
    //TODO ask how to solve
    if(mode == "number") {
        if(phoneNum.length <= 5) {
            phoneNum = phoneNum.substr(1);
            _cti_ui_showConsult("工号 " + phoneNum + " ");
        } else
            _cti_ui_showConsult(phoneNum + " ");
    } else if(mode == "skillgroup") {
        _cti_ui_showConsult(phoneNum + " ");
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
                _cti_relogin();
            }
        }
    }
    var error = function() {
        softphonebar_close();
        utils.showError("咨询失败");
    }
    _cti_sendAction(phoneJson, onload, error);
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
                _cti_relogin();
            }
        }
    }
    var error = function() {
        utils.showError("结束咨询通话失败");
    }
    _cti_sendAction(phoneJson, onload, error);
}

function phone_investigate(nodeNum) {
    if(_cti_isInvestigatting)
        return;
    _cti_isInvestigatting = true;
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
    if(nodeNum && nodeNum != ''){
        phoneJson.Context = phone_data.accountId+"-"+nodeNum+"-satisfaction";
    }
    var onload = function(response) {
        softphonebar_closeModel();
        if(response.Succeed) {
            //console.dir('转调查成功!');
        } else {
            if(response.Expired) {
                _cti_relogin();
            }
        }
        _cti_isInvestigatting = false;
    }
    var error = function() {
        _cti_isInvestigatting = false;
    }
    _cti_sendAction(phoneJson, onload, error);
}

function phone_transfer(phoneNum, mode) {
    softphonebar_closeModel();
    if(mode == "number") {
        if(phoneNum.length <= 5) {
            phoneNum = phoneNum.substr(1);
            _cti_ui_showTranster("工号 " + phoneNum + " ");
        } else
            _cti_ui_showTranster(phoneNum + " ");
    } else if(mode == "skillgroup") {
        _cti_ui_showTranster(phoneNum + " ");
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
                _cti_relogin();
            }
        }
    };
    var error = function() {
        softphonebar_close();
        utils.showError("转接失败");
    };
    _cti_sendAction(phoneJson, onload, error);
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
                    _cti_relogin();
                }
            }
        };
        var error = function() {
            softphonebar_close();
            utils.showError("取消转接失败");
        };
        _cti_sendAction(phoneJson, onload, error);
    }
}

function phone_threewaycall(phoneNum) {
    softphonebar_closeModel();
    if(phoneNum.length <= 5) {
        phoneNum = phoneNum.substr(1);
        _cti_ui_showTranster("工号 " + phoneNum + " ");
    } else {
        phoneNum = phoneNum.substr(1);
        _cti_ui_showTranster(phoneNum + " ");
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
                _cti_relogin();
            }
        }
    };
    var error = function() {
        softphonebar_close();
        utils.showError("三方通话失败");
    };
    _cti_sendAction(phoneJson, onload, error);
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
                _cti_updateQueueInfo();
            }
        } else {
            if(response.Expired) {
                _cti_relogin();
            }
        }
    }
    var error = function() {
    }
    _cti_sendAction(phoneJson, onload, error);
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
                _cti_updateQueueInfo();
            }
        } else {
            if(response.Expired) {
                _cti_relogin();
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
                _cti_relogin();
            }
        }
    }
    var error = function() {
    }
    _cti_sendAction(phoneJson, onload, error);
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
                _cti_relogin();
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
    _cti_sendAction(phoneJson, onload, error);
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
                _cti_relogin();
            }
        }
    }
    var error = function() {
    }
    _cti_sendAction(phoneJson, onload, error);
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
                _cti_relogin();
            }
        }
    }
    var error = function() {
    }
    _cti_sendAction(phoneJson, onload, error);
    return true;
}

function phone_toMenu(exten, displayName){
    softphonebar_closeModel();
    _cti_ui_showToMenu(displayName);
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
                _cti_relogin();
            }
        }
    };
    var error = function() {
        softphonebar_close();
        utils.showError("转IVR菜单失败");
    };
    _cti_sendAction(phoneJson, onload, error);
}

function _cti_monitorServiceNo(evtJson) {
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
                _cti_eventHandler(events, true);
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
    var onload = function(response) {
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
    _cti_sendAction(phoneJson, onload, onerror);
}

function phone_switch_exten_type(extenType) {
    var extenNum = null;
    var users=session.user;
    if(extenType == 'gateway'){
            if(users.hasOwnProperty("gatewayLoginWay")){
                if(users.gatewayLoginWay){
                    if(!session.user.gatewayExten || session.user.gatewayExten == ''){
                        alert("您没有设置语音网关sip号！");
                        return;
                    }else{
                        extenNum = session.user.gatewayExten;
                    }
                }else{
                    alert("该接听方式已经被限制，请更换其他接听方式！");
                    return;
                }
            }else{
                if(!session.user.gatewayExten || session.user.gatewayExten == ''){
                    alert("您没有设置语音网关sip号！");
                    return;
                }else{
                    extenNum = session.user.gatewayExten;
                }
            }

    }else if(extenType == 'Local'){
            if(users.hasOwnProperty("localLoginWay")){
                if(users.localLoginWay){
                    if(!session.user.mobile || session.user.mobile == ''){
                        alert("您的直线号码为空，请您配置好直线号码并重新登录！");
                        return;
                    }else{
                        extenNum = session.user.mobileExten;
                    }
                }else{
                    alert("该接听方式已经被限制，请更换其他接听方式！");
                    return;
                }
            }else{
                if(!session.user.mobile || session.user.mobile == ''){
                    alert("您的直线号码为空，请您配置好直线号码并重新登录！");
                    return;
                }else{
                    extenNum = session.user.mobileExten;
                }
            }

    }else{
            if(users.hasOwnProperty("sipLoginWay")){
                if(users.sipLoginWay){
                    extenNum = session.user.sipExten;
                }else{
                    alert("该接听方式已经被限制，请更换其他接听方式！");
                    return;
                }
            }else{
                extenNum = session.user.sipExten;
            }


    }
    console.log("登录方式变更["+extenType+"-"+extenNum+"]");
    var phoneJson = {
        Command: "Action",
        Action: "SetExtenType",
        ActionID: "SetExtenType" + Math.random(),
        PBX: session.user.pbx,
        Account: session.user.account,
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
    _cti_sendAction(phoneJson, onload, error);
    return true;
}

function _cti_eventHandler(evtJsons, isMonitorOnly) {
    $.each(evtJsons, function(i, item) {
        _cti_newEvent(item, isMonitorOnly);
    });
}

function _cti_newEvent(evtJson, isMonitorOnly) {
    if(!isMonitorOnly)
        _cti_stateProcess(evtJson);
    _cti_monitorProcess(evtJson);
}

function _cti_stateProcess(evtJson) {
    if(evtJson.Event == "RecycleNewMail"){
        console.log(evtJson);
        handler.callMail.emailItemRemove(evtJson);
        return;
    }
    else if(evtJson.Event == "NewWebchat"){
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

    _cti_super(evtJson);
    switch(_cti_currentState) {
        case _cti_unregister:
            if(evtJson.Event == "PeerStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.PeerStatus == "Registered") {
                        _cti_currentState = _cti_peerstate;
                        _cti_update(evtJson);
                    }
                }
            } else if(evtJson.Event == "UserStatus") {
                if(phone_data.userId == evtJson.UserID) {
                    if(phone_data.sipNo != evtJson.SipNum) {
                        if(evtJson.PeerStatus == "Registered") {
                            _cti_currentState = _cti_peerstate;
                            _cti_update(evtJson);
                        }
                    }
                }
            }
            break;
        case _cti_peerstate:
            if (evtJson.Event == "UserBusy") {
                if (phone_data.userId == evtJson.UserID) {
                    phone_data.busyType = evtJson.BusyType;
                    _cti_currentState = _cti_peerstate;
                    _cti_update(evtJson);
                }
            } else if (evtJson.Event == "ChannelStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.ChannelStatus == "Hangup") {
                        _cti_currentState = _cti_peerstate;
                        _cti_update(evtJson);
                    } else if(evtJson.ChannelStatus == "Ringing") {
                        if(evtJson.LinkedChannel.ChannelType == "normal") {
                            _cti_currentState = _cti_belling;
                            _cti_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "inner") {
                            _cti_currentState = _cti_innerBelling;
                            _cti_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "transfer"){
                            _cti_currentState = _cti_transferBelling;
                            _cti_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "dialTransfer") {
                            _cti_currentState = _cti_transferDialing;
                            _cti_update(evtJson);
                        }
                    } else if(evtJson.ChannelStatus == "Ring") {
                        if(evtJson.ChannelType == "dialout") {
                            _cti_currentState = _cti_dialing;
                            _cti_update(evtJson);
                        } else if(evtJson.ChannelType == "inner") {
                            _cti_currentState = _cti_innerDialing;
                            _cti_update(evtJson);
                        } else if(evtJson.ChannelType == "listen") {
                            _cti_currentState = _cti_listening;
                            _cti_update(evtJson);
                        }
                    } else if(evtJson.ChannelStatus == "Link") {
                        if(evtJson.LinkedChannel.ChannelType == "normal") {
                            _cti_currentState = _cti_talking;
                            _cti_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "threeWayCall") {
                            _cti_currentState = _cti_threeWayTalking;
                            _cti_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "inner") {
                            _cti_currentState = _cti_innerTalking;
                            _cti_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "dialout") {
                            _cti_currentState = _cti_dialTalking;
                            _cti_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "transfer") {
                            _cti_currentState = _cti_transfer;
                            _cti_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "dialTransfer") {
                            _cti_currentState = _cti_dialoutTransfer;
                            _cti_update(evtJson);
                        }
                    } else if(evtJson.ChannelStatus == "Up") {
                        if(evtJson.ChannelType == "listen") {
                            _cti_currentState = _cti_listened;
                            _cti_update(evtJson);
                        }
                    }
                }
            } else if(evtJson.Event == "PeerStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.PeerStatus != "Registered") {
                        _cti_currentState = _cti_unregister;
                        _cti_update(evtJson);
                    }
                }
            }
            break;
        case _cti_dialing:
            if(evtJson.Event == "ChannelStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.ChannelStatus == "Hangup") {
                        _cti_currentState = _cti_peerstate;
                        _cti_update(evtJson);
                    } else if(evtJson.ChannelStatus == "Link") {
                        if(evtJson.ChannelType == "dialout") {
                            _cti_currentState = _cti_dialTalking;
                            _cti_update(evtJson);
                        }
                    }
                }
            }
            break;
        case _cti_innerDialing:
            if(evtJson.Event == "ChannelStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.ChannelStatus == "Hangup") {
                        _cti_currentState = _cti_peerstate;
                        _cti_update(evtJson);
                    } else if(evtJson.ChannelStatus == "Link") {
                        if(evtJson.ChannelType == "inner") {
                            _cti_currentState = _cti_innerTalking;
                            _cti_update(evtJson);
                        }
                    }
                }
            }
            break;
        case _cti_belling:
            if(evtJson.Event == "ChannelStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.ChannelStatus == "Hangup") {
                        _cti_currentState = _cti_peerstate;
                        _cti_update(evtJson);
                    } else if(evtJson.ChannelStatus == "Link") {
                        if(evtJson.LinkedChannel.ChannelType == "normal") {
                            _cti_currentState = _cti_talking;
                            _cti_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "threeWayCall") {
                            _cti_currentState = _cti_threeWayTalking;
                            _cti_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "transfer") {
                            _cti_currentState = _cti_transfer;
                            _cti_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "dialTransfer") {
                            _cti_currentState = _cti_dialoutTransfer;
                            _cti_update(evtJson);
                        }
                    }
                }
            }
            break;
        case _cti_innerBelling:
            if(evtJson.Event == "ChannelStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.ChannelStatus == "Hangup") {
                        _cti_currentState = _cti_peerstate;
                        _cti_update(evtJson);
                    } else if(evtJson.ChannelStatus == "Link") {
                        if(evtJson.LinkedChannel.ChannelType == "threeWayCall") {
                            _cti_currentState = _cti_threeWayTalking;
                            _cti_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "inner") {
                            _cti_currentState = _cti_innerTalking;
                            _cti_update(evtJson);
                        }
                    }
                }
            }
            break;
        case _cti_listening:
            if(evtJson.Event == "ChannelStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.ChannelStatus == "Hangup") {
                        _cti_currentState = _cti_peerstate;
                        _cti_update(evtJson);
                    } else if(evtJson.ChannelStatus == "Up") {
                        if(evtJson.ChannelType == "listen") {
                            _cti_currentState = _cti_listened;
                            _cti_update(evtJson);
                        }
                    }
                }
            }
            break;
        case _cti_talking:
            if(evtJson.Event == "ChannelStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.ChannelStatus == "Hangup") {
                        _cti_currentState = _cti_peerstate;
                        _cti_update(evtJson);
                    } else if(evtJson.ChannelStatus == "Link") {
                        if(evtJson.LinkedChannel.ChannelType == "ThreeWayCall") {
                            _cti_currentState = _cti_threeWayTalking;
                            _cti_update(evtJson);
                        }
                    }
                }
            }
            break;
        case _cti_transfer:
            if(evtJson.Event == "ChannelStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.ChannelStatus == "Hangup") {
                        _cti_currentState = _cti_peerstate;
                        _cti_update(evtJson);
                    } else if(evtJson.ChannelStatus == "Link") {
                        if(evtJson.LinkedChannel.ChannelType == "ThreeWayCall") {
                            _cti_currentState = _cti_threeWayTalking;
                            _cti_update(evtJson);
                        }
                    }
                }
            }
            break;
        case _cti_dialoutTransfer:
            if(evtJson.Event == "ChannelStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.ChannelStatus == "Hangup") {
                        _cti_currentState = _cti_peerstate;
                        _cti_update(evtJson);
                    } else if(evtJson.ChannelStatus == "Link") {
                        if(evtJson.LinkedChannel.ChannelType == "ThreeWayCall") {
                            _cti_currentState = _cti_threeWayTalking;
                            _cti_update(evtJson);
                        }
                    }
                }
            }
            break;
        case _cti_threeWayTalking:
            if(evtJson.Event == "ChannelStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.ChannelStatus == "Hangup") {
                        _cti_currentState = _cti_peerstate;
                        _cti_update(evtJson);
                    }
                }
            }
            break;
        case _cti_innerTalking:
            if(evtJson.Event == "ChannelStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.ChannelStatus == "Hangup") {
                        _cti_currentState = _cti_peerstate;
                        _cti_update(evtJson);
                    }
                }
            }
            break;
        case _cti_dialTalking:
            if(evtJson.Event == "ChannelStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.ChannelStatus == "Hangup") {
                        _cti_currentState = _cti_peerstate;
                        _cti_update(evtJson);
                    } else if(evtJson.ChannelStatus == "Link") {
                        if(evtJson.LinkedChannel.ChannelType == "ThreeWayCall") {
                            _cti_currentState = _cti_threeWayTalking;
                            _cti_update(evtJson);
                        }
                    }
                }
            }
            break;
        case _cti_listened:
            if(evtJson.Event == "ChannelStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.ChannelStatus == "Hangup") {
                        _cti_currentState = _cti_peerstate;
                        _cti_update(evtJson);
                    }
                }
            }
            break;
        case _cti_transferBelling:
            if(evtJson.Event == "ChannelStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.ChannelStatus == "Hangup") {
                        _cti_currentState = _cti_peerstate;
                        _cti_update(evtJson);
                    } else if(evtJson.ChannelStatus == "Link") {
                        if(evtJson.LinkedChannel.ChannelType == "normal") {
                            _cti_currentState = _cti_talking;
                            _cti_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "threeWayCall") {
                            _cti_currentState = _cti_threeWayTalking;
                            _cti_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "transfer") {
                            _cti_currentState = _cti_transfer;
                            _cti_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "dialTransfer") {
                            _cti_currentState = _cti_dialoutTransfer;
                            _cti_update(evtJson);
                        }
                    }
                }
            }
            break;
        case _cti_transferDialing:
            if(evtJson.Event == "ChannelStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    if(evtJson.ChannelStatus == "Hangup") {
                        _cti_currentState = _cti_peerstate;
                        _cti_update(evtJson);
                    } else if(evtJson.ChannelStatus == "Link") {
                        if(evtJson.LinkedChannel.ChannelType == "normal") {
                            _cti_currentState = _cti_talking;
                            _cti_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "threeWayCall") {
                            _cti_currentState = _cti_threeWayTalking;
                            _cti_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "transfer") {
                            _cti_currentState = _cti_transfer;
                            _cti_update(evtJson);
                        } else if(evtJson.LinkedChannel.ChannelType == "dialTransfer") {
                            _cti_currentState = _cti_dialoutTransfer;
                            _cti_update(evtJson);
                        }
                    }
                }
            }
            break;
    }

}

function _cti_monitorProcess(evtJson) {
    _cti_monitorPeer(evtJson);
    _cti_monitorQueue(evtJson);
    _cti_monitorServiceNo(evtJson);
    _cti_monitorAccount(evtJson);

}

function _cti_monitorPeer(evtJson) {
    if (evtJson.Event == "ChannelStatus") {
        if(evtJson.ChannelStatus == "Hangup"){
            $('#cdr_label_modal_del').modal('hide');
            if(evtJson.UserID == undefined)
                return;
        }
        var peer = _cti_getUserFromSip(evtJson.Exten);
        if(!peer)
            return;
        if(evtJson.ChannelStatus == "Down"){
            peer.callStatus = "Down";
            peer.channel = evtJson.Channel;
            _cti_updateQueueInfo();
        } else if(evtJson.ChannelStatus == "Ring") {
            var labelCallId=evtJson.Data.CallSheetID;
            if(labelCallId){
                $("#setCallLabel").attr("call",labelCallId);
            }
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
            if(evtJson.ChannelType == "dialout"){
                if(evtJson.UserID == session.id){
                    if(evtJson.Data.CallSheetID){
                            handler.cdr.showDialoutData(evtJson)
                    }
                }
            }
        } else if(evtJson.ChannelStatus == "Ringing") {
            var labelCallId=evtJson.Data.CallSheetID;
            if(labelCallId){
                $("#setCallLabel").attr("call",labelCallId);
            }
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
            var labelCallId=evtJson.Data.CallSheetID?evtJson.Data.CallSheetID:evtJson.LinkedChannel.Data.CallSheetID;
            if(labelCallId){
                $("#setCallLabel,#phone_bar").attr("call",labelCallId);
            }
            _cti_linked = true;
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
            _cti_linked = false;
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
                    && (_cti_stateDescription[_cti_currentState] == "listening" || _cti_stateDescription[_cti_currentState] == "listened")) {
                    phone_hangup();
                }
            }
            peer.callNo = "";
            peer.callStatus = "Idle";
            peer.timestamp = evtJson.Timestamp;
            peer.channel = "";
            peer.linkedChannel = "";
            peer.queueName = "";
            _cti_updateQueueInfo();
            phone_publishEvent("EvtMonitorPeer", [peer]);
            if(evtJson.ChannelType == "dialout" && _cti_linked){
                handler.cdr.hideCallBackLeakListItem(evtJson.Data.ListenExten);
            }
            _cti_linked = false;
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
                _cti_updateUserSip(evtJson.SipNum, peer);
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
                _cti_updateUserSip(evtJson.SipNum, peer);
            if (!peer.sipNo) {
                peer.callStatus = "Idle";
                peer.callNo = "";
            }
            phone_publishEvent("EvtMonitorPeer", [peer]);
            _cti_updateQueueInfo();
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
            _cti_updateQueueInfo();
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
            _cti_updateQueueInfo();
        }
    } else if(evtJson.Event == "UserSignIn") {
        if(phone_peers[evtJson.UserID]) {
            var peer = phone_peers[evtJson.UserID];
            peer.extenType = evtJson.ExtenType;
            peer.login = evtJson.Login;
            peer.sipNo = evtJson.SipNum;
            phone_publishEvent("EvtMonitorPeer", [peer]);
            _cti_updateQueueInfo();
        }
    } else if(evtJson.Event == "UserSignOut") {
        if(phone_peers[evtJson.UserID]) {
            var peer = phone_peers[evtJson.UserID];
            peer.extenType = evtJson.ExtenType;
            peer.sipNo = evtJson.SipNum;
            peer.login = evtJson.Login;
            phone_publishEvent("EvtMonitorPeer", [peer]);
            _cti_updateQueueInfo();
        }
    } else if(evtJson.Event == "PeerStatus") {
        var isRegistered = false;
        if(evtJson.PeerStatus == "Registered")
            isRegistered = true;
        var peer = _cti_getUserFromSip(evtJson.Exten);
        if(peer){
            peer.register = isRegistered;
            peer.status = evtJson.Status;
            phone_publishEvent("EvtMonitorPeer", [peer]);
            _cti_updateQueueInfo();
        }
    }
}

function _cti_monitorQueue(evtJson) {
    if(evtJson.Event == "QueueParams") {
        var queueItem = {};
        queueItem = _cti_queryQueueItem(evtJson);
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
        var queueItem = _cti_queryQueueItem(evtJson);
        if(queueItem) {
            if(!queueItem.members[evtJson.Exten]){
                queueItem.members[evtJson.Exten] = evtJson.Exten;  //change
                queueItem.totalAgentCount++;
                _cti_updateQueueInfo();
            }
        }
    } else if(evtJson.Event == "QueueMemberRemoved"){
        var queueItem = _cti_queryQueueItem(evtJson);
        if(queueItem){
            if(queueItem.members[evtJson.Exten]){
                delete queueItem.members[evtJson.Exten];
                queueItem.totalAgentCount--;
                phone_publishEvent("EvtMonitorQueue", [queueItem, "noNeedWaitCount"]);
            }
        }
    } else if(evtJson.Event == "Join"){
        var queueItem = _cti_queryQueueItem(evtJson);
        if(queueItem) {
            queueItem.queueWaitCount++;
            phone_publishEvent("EvtMonitorQueue", [queueItem, "needWaitCount"]);
        }
    } else if(evtJson.Event == "Leave"){
        var queueItem = _cti_queryQueueItem(evtJson);
        if(queueItem) {
            queueItem.totalCalls++;
            queueItem.queueWaitCount--;
            if(queueItem.queueWaitCount < 0)
                queueItem.queueWaitCount = 0;
            phone_publishEvent("EvtMonitorQueue", [queueItem, "needWaitCount"]);
        }
    } else if(evtJson.Event == "QueueCallerAbandon"){
        var queueItem = _cti_queryQueueItem(evtJson);
        if(queueItem){
            queueItem.abadonedCalls++;
            phone_publishEvent("EvtMonitorQueue", [queueItem, "noNeedWaitCount"]);
        }
    }
}

function _cti_monitorAccount(evtJson) {
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

function _cti_queryQueueItem(evtJson) {
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

function _cti_updateQueueInfo() {
    for(var i in phone_queues) {
        var queue = phone_queues[i];
        var members = queue.members;
        queue.busyAgentCount = 0;
        queue.idleAgentCount = 0;
        for(var j in members) {
            var peer = _cti_getUserFromSip(members[j]);
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

function _cti_update(evtJson) {
    var timestamp = "";
    if(evtJson.Event == "ChannelStatus") {
        if(evtJson.Timestamp)
            timestamp = evtJson.Timestamp;
    } else if(evtJson.Event == "UserStatus") {
        timestamp = (evtJson.Login? (evtJson.BusyTimestamp) : "");
    } else if(evtJson.Event == "UserBusy") {
        timestamp = evtJson.BusyTimestamp;
    }
    phone_publishEvent("toolbarupdate", [_cti_stateDescription[_cti_currentState], timestamp]);
    switch (_cti_currentState) {
        case _cti_unregister:
            break;
        case _cti_peerstate:
            if(evtJson.Event == "ChannelStatus") {
                if(evtJson.Exten == phone_data.sipNo) {
                    phone_data._curChannel = evtJson.Channel;
                    dsevent.publish(dsevent.evt.callItemRinged, {callId: evtJson.Data.CallSheetID});
                }
            }
            if(window.jQuery.fn.tooltip){
                $('#softphone_phonestate_dropdown').tooltip('destroy');
            }
            break;
        case _cti_dialing:
            phone_data._curChannel = evtJson.Channel;
            if(window.jQuery.fn.tooltip){
                if(evtJson.CalleeProvince != '')
                    $('#softphone_phonestate_dropdown').tooltip({placement:'bottom',trigger:'manual',title:evtJson.CalleeProvince+'  '+evtJson.CalleeCity}).tooltip('show');
            }
            $("#dial_popup_modal_callSheetID").val(evtJson.Data.CallSheetID);
            //TODO
            break;
        case _cti_innerDialing:
            phone_data._curChannel = evtJson.Channel;
            //TODO
            break;
        case _cti_belling:
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
        case _cti_innerBelling:
            phone_data._curChannel = evtJson.Channel;
            phone_data._otherChannel = evtJson.LinkedChannel.Channel;
            //TODO
            break;
        case _cti_listening:
            phone_data._curChannel = evtJson.Channel;
            //TODO
            break;
        case _cti_talking:
            phone_data._curChannel = evtJson.Channel;
            phone_data._otherChannel = evtJson.LinkedChannel.Channel;
            //TODO
            break;
        case _cti_transfer:
            phone_data._curChannel = evtJson.Channel;
            phone_data._otherChannel = evtJson.LinkedChannel.Channel;
            //TODO
            break;
        case _cti_dialoutTransfer:
            phone_data._curChannel = evtJson.Channel;
            phone_data._otherChannel = evtJson.LinkedChannel.Channel;
            //TODO
            break;
        case _cti_threeWayTalking:
            phone_data._curChannel = evtJson.Channel;
            phone_data._otherChannel = evtJson.LinkedChannel.Channel;
            //TODO
            break;
        case _cti_innerTalking:
            phone_data._curChannel = evtJson.Channel;
            phone_data._otherChannel = evtJson.LinkedChannel.Channel;
            //TODO
            break;
        case _cti_dialTalking:
            phone_data._curChannel = evtJson.Channel;
            phone_data._otherChannel = evtJson.LinkedChannel.Channel;
            if(window.jQuery.fn.tooltip){
                if(evtJson.CalleeProvince != ''){
                    $('#softphone_phonestate_dropdown').tooltip('destroy');
                    $('#softphone_phonestate_dropdown').tooltip({placement:'bottom',trigger:'hover',title:evtJson.CalleeProvince+'  '+evtJson.CalleeCity}).tooltip('show');;
                }
            }
            //TODO
            break;
        case _cti_listened:
            phone_data._curChannel = evtJson.Channel;
            break;
        case _cti_transferBelling:
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
        case _cti_transferDialing:
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

function _cti_getUserFromSip(sipNo) {
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

function _cti_updateUserSip(sipNo, peer) {
    //var peer = _phone_peersFromSip[sipNo];
    _phone_peersFromSip[sipNo] = peer;
}

function _cti_getUserFromExten(exten) {
    if(!phone_peers)
        return null;
    for(var i in phone_peers) {
        if(phone_peers[i].exten == exten) {
            return phone_peers[i];
        }
    }
    return null;
}

function _cti_super(evtJson) {
    if(evtJson.Event == "UserStatus") {
        if (phone_data.userId == evtJson.UserID) {
            phone_data.busyType = evtJson.BusyType;
            if(phone_data.sipNo != evtJson.SipNum) {
                phone_data.sipNo = evtJson.SipNum;
                if(evtJson.PeerStatus == "Unregistered") {
                    _cti_currentState = _cti_unregister;
                    _cti_update(evtJson);
                } else if(evtJson.PeerStatus == "Registered") {
                    _cti_currentState = _cti_peerstate;
                    _cti_update(evtJson);
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
        }
    } else if(evtJson.Event == "PeerStatus") {
        if(evtJson.Exten == phone_data.sipNo) {
            if(_cti_currentState != _cti_peerstate)
                return;
            if(phone_data.busyType == _cti_systemBusy)
                return;
            var peer = _cti_getUserFromSip(evtJson.Exten);
            if(peer)
                phone_publishEvent("toolbarupdate", [_cti_stateDescription[_cti_currentState], ""]);
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