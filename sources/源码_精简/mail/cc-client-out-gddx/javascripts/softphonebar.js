var _softphonebar_state = new Array();
var _softphonebar_desc = new Array();

var _softphonebar_countTimer = 0;
var _softphonebar_calculagraph;
var _softphonebar_otherstateref;
var _softphonebar_curstateref;
var _softphonebar_timestateref;
var _softphonebar_callstateref;
var _softphone_phonestate_dropdown;
var _softphonebar_dialogBoxRemain = 40000;
var _softphonebar_notifyDialogInterval;
var  softphonebar_count = 0;
var _softphonebar_monitorTimersHandle;
var _softphonebar_monitorTimers = [];
var _softphoneBar_replaceAll = new RegExp("\\.","g");
var _softphoneBar_replaceAll_bak = new RegExp("\\_","g");
var _softphonebar_peer_index = 0;
var _softphonebar_queue_index = 0;
var _softphonebar_serviceNo_index = 0;
var _softphonebar_all_queue_obj = {};
var _softphonebar_last_state;

_softphonebar_desc["unregister"] = "未连接";
_softphonebar_desc["peerstate"] = "空闲";
_softphonebar_desc["dialing"] = "呼叫中";
_softphonebar_desc["innerDialing"] = "呼叫中";
_softphonebar_desc["belling"] = "来电振铃";
_softphonebar_desc["innerBelling"] = "来电振铃";
_softphonebar_desc["listening"] = "监听振铃";
_softphonebar_desc["talking"] = "普通通话";
_softphonebar_desc["threeWayTalking"] = "三方通话";
_softphonebar_desc["innerTalking"] = "内部通话";
_softphonebar_desc["dialTalking"] = "外呼通话";
_softphonebar_desc["listened"] = "监听中";
_softphonebar_desc["hold"] = "保持";
_softphonebar_desc["consultTalking"] = "普通通话";
_softphonebar_desc["dialTransfer"] = "外呼转接通话";
_softphonebar_desc["transfer"] = "转接通话";
_softphonebar_desc["offline"] = "离线接听";
_softphonebar_desc["ready"] = "签出";
_softphonebar_desc["transferBelling"] = "转接振铃";
_softphonebar_desc["transferDialing"] = "转接振铃";

_softphonebar_state["unregister"] = ["dialoutDisable", "transferDisable", "holdDisable", "threewayDisable", "SmsEnable"];
_softphonebar_state["peerstate"] = ["dialoutEnable", "transferDisable", "holdDisable", "threewayDisable", "consultDisable", "SmsEnable"];
_softphonebar_state["dialing"] = ["hangupEnable", "transferDisable", "holdDisable", "threewayDisable", "SmsEnable"];
_softphonebar_state["innerDialing"] = ["hangupEnable", "transferDisable", "holdDisable", "threewayDisable", "SmsEnable"];
_softphonebar_state["belling"] = ["dialoutDisable", "transferDisable", "holdDisable", "threewayDisable", "SmsEnable"];
_softphonebar_state["innerBelling"] = ["dialoutDisable", "transferDisable", "holdDisable", "threewayDisable", "SmsEnable"];
_softphonebar_state["transferBelling"] = ["dialoutDisable", "transferDisable", "holdDisable", "threewayDisable", "SmsEnable"];
_softphonebar_state["transferDialing"] = ["dialoutDisable", "transferDisable", "holdDisable", "threewayDisable", "SmsEnable"];
_softphonebar_state["listening"] = ["hangupEnable", "SmsEnable"];
_softphonebar_state["talking"] = ["hangupEnable", "transferEnable", "holdEnable", "threewayDisable","ivrMenuEnable", "consultEnable", "InvestigateEnable", "SmsEnable"];
_softphonebar_state["threeWayTalking"] = ["hangupEnable", "transferDisable", "holdDisable", "threewayDisable", "SmsEnable"];
_softphonebar_state["innerTalking"] = ["hangupEnable", "transferDisable", "holdDisable", "threewayDisable", "SmsEnable"];
_softphonebar_state["dialTalking"] = ["hangupEnable", "transferEnable","ivrMenuEnable", "holdEnable", "threewayDisable", "consultEnable" , "InvestigateEnable", "SmsEnable"];
_softphonebar_state["listened"] = ["hangupEnable", "SmsEnable"];
_softphonebar_state["hold"] = ["dialoutDisable", "recoverEnable", "transferDisable", "threewayDisable", "SmsEnable"];
_softphonebar_state["consultTalking"] = ["consultThreeWayCallEnable", "consultTransferEnable", "stopConsultEnable", "hangupEnable", "SmsEnable"];
_softphonebar_state["transfer"] = ["hangupEnable", "holdEnable", "transferEnable", "consultEnable", "InvestigateEnable", "ivrMenuEnable", "SmsEnable", "threewayDisable"];
_softphonebar_state["dialTransfer"] = ["hangupEnable", "holdEnable", "transferEnable", "consultEnable", "InvestigateEnable", "ivrMenuEnable", "SmsEnable", "threewayDisable"];

function softphonebar_init() {
    _softphonebar_timestateref = $("#softphone_timer");
    _softphonebar_callstateref = $("#softphone_phonestate");
    _softphonebar_otherstateref = $("#softphone_otherstate");
    _softphone_phonestate_dropdown = $("#softphone_phonestate_dropdown");

    phone_registerEvent("toolbarupdate", _softphonebar_toolbarupdate);
    phone_registerEvent("transfering", _softphonebar_transfering);
    phone_registerEvent("ivrMenuTransfering", _softphonebar_ivrMenuTransfering);

    phone_registerEvent("EvtMonitorServiceNo", _softphonebar_onServiceNoChanged);
    phone_registerEvent("EvtMonitorQueue", _softphonebar_onQueueChanged);
    phone_registerEvent("EvtMonitorPeer", _softphonebar_onPeerChanged);
    phone_registerEvent("EvtEndListen", _softphonebar_onEndListen);
    phone_registerEvent("EvtAccountCalls", _softphonebar_onAccountCalls);

    phone_registerEvent("EvtRing", _softphonebar_evtRing);
}

function _softphonebar_toolbarupdate(event, state, timestamp) {
    //console.info(state);
//    $("#softphonebar_states").empty();
//    var dropdownHtml = "";
//    var stateHtml = "";
//    if(state == "peerstate") {
//        for(var i in phone_data.phonebarConfig) {
//            if(i != "99" && i != phone_data.busyType) {
//                var isBusy = true;
//                if(i == "0") {
//                    isBusy = false;
//                }
//                stateHtml += "<li onclick=\"phone_setBusy("+isBusy+", "+i+");\"><a href=\"#\">"+phone_data.phonebarConfig[i]+"</a></li>";
//            }
//        }
//        if(phone_data.busyType == "0") {
//            $("#softphonebar_peerState .state").css("color","teal");
//        } else {
//            $("#softphonebar_peerState .state").css("color","#CC0000");
//        }
//        $("#softphonebar_peerState").css("display", "block");
//        $("#softphonebar_callState").css("display", "none");
//        $("#softphonebar_peerState .state").html(phone_data.phonebarConfig[phone_data.busyType]);
//        //$("#softphonebar_curState").html(phone_data.phonebarConfig[phone_data.busyType]);
//    } else {
//        $("#softphonebar_peerState").css("display", "none");
//        $("#softphonebar_callState").css("display", "block");
//        $("#softphonebar_callState").html(_softphonebar_desc[state]);
//    }
//    $("#softphonebar_states").html(stateHtml + dropdownHtml);
    if(!_softphonebar_last_state){
        _softphonebar_last_state = state;
    }
    _softphonebar_switchState(state, timestamp);
}

function _softphonebar_switchState(state, timestamp) {
    $("#softphone-bar #phone_bar .phone_btn_action").each(function() {
        var id = $(this).attr("id");
        if(_softphonebar_state[state].indexOf(id) < 0) {
            $(this).css('display', 'none');
        } else {
            $(this).css('display', 'inline-block');
        }
    });
    if(state == "unregister") {
        softphonebar_show_icon('unregister');
        _softphonebar_timestateref.css('display', 'none');
    } else {
        _softphonebar_timestateref.css('display', 'inline-block');
    }

    _softphone_phonestate_dropdown.find("a:first-child").removeClass('btn-success').removeClass('btn-warning').addClass('btn-danger');
    _softphonebar_callstateref.css("color", "#FFFFFF");

    var resetTimer = false;
    if(state == "peerstate") {
        if(_softphonebar_last_state != state){
            resetTimer = true;
        }
        softphonebar_show_icon('busy');
        $('#dialout_input').empty();
        if(phone_data.busyType == "99") {
            _softphonebar_systemBusy();
            _softphonebar_callstateref.css("padding-right", "8px");
        } else if(phone_data.busyType == "0") {
            _softphone_phonestate_dropdown.find("a:first-child").removeClass('btn-danger').removeClass('btn-warning').addClass('btn-success');
            _softphonebar_callstateref.css("color", "#FFFFFF");
            _softphonebar_callstateref.css("padding-right", "12px");
            softphonebar_show_icon('idle');
        }
        var html = "";
        _softphonebar_callstateref.html(phone_data.phonebarConfig[phone_data.busyType]);
        for(var i in phone_data.phonebarConfig) {
            if(i != "99" && i!="98" && i!="97" && i != phone_data.busyType) {
                var isBusy = true;
                var color = "#B30000";
                if(i == "0") {
                    isBusy = false;
                    color = "#468847";
                }
                html += "<li><a href='#' style=\"color:"+color+";font-weight:bold;\" onclick=\"phone_setBusy("+isBusy+", "+i+")\">"+phone_data.phonebarConfig[i]+"</a></li>";
            }
        }
        _softphonebar_otherstateref.html(html);
        $("#softphone_phonestate_dropdown .caret").css('display', 'inline-block');
        $("#softphone_phonestate_dropdown .state_line").css('display', 'inline-block');
    } else {
        if(state == "unregister"){
            softphonebar_show_icon('unregister');
        }else{
            softphonebar_show_icon('busy');
        }

        if(state == 'unregister' || state == 'ready'){
            $('#dialout_input').empty();
            _softphone_phonestate_dropdown.find("a:first-child").removeClass('btn-success').removeClass('btn-warning').addClass('btn-danger');
        }else if(state == 'peerstate'){
            $('#dialout_input').empty();
            _softphone_phonestate_dropdown.find("a:first-child").removeClass('btn-danger').removeClass('btn-warning').addClass('btn-success');
        }else{
            _softphone_phonestate_dropdown.find("a:first-child").removeClass('btn-success').removeClass('btn-danger').addClass('btn-warning');
        }

        _softphonebar_callstateref.html(_softphonebar_desc[state]);
        if(state == 'hold'){
            _softphonebar_callstateref.css("padding-right", "20px");
        }else{
            _softphonebar_callstateref.css("padding-right", "8px");
        }
        $("#softphone_phonestate_dropdown .caret").css('display', 'none');
        $("#softphone_phonestate_dropdown .state_line").css('display', 'none');
    }
    if($("#dialoutEnable").is(":hidden")){
        $(".dialoutPopoverHtml").popover('hide');
    }
    if(phone_data.busyType == "99"){
        return;
    }
    if(timestamp == "continueTime") {
        return;
    }
    if(timestamp != "") {
        var date = new Date();
        var identity = date.valueOf();
        var oldTime = ((identity-phone_data.currentServerTime) - parseFloat(timestamp)*1000)/1000;
        if(oldTime < 0)
            _softphonebar_countTimer = 0;
        else
            _softphonebar_countTimer = oldTime;
    } else {
        if(resetTimer){
            _softphonebar_countTimer = 0;
        }
    }
    if(_softphonebar_calculagraph != null)
        window.clearInterval(_softphonebar_calculagraph);
    _softphonebar_calculagraph = window.setInterval(function(){
        _softphonebar_doCallTimer();
    }, 1000);
    _softphonebar_last_state = state;
}

function softphonebar_show_icon(type){
    if(type == 'idle'){
        $('.dh_state_idle').show();
        $('.dh_state_sx').hide();
        $('.dh_state_busy').hide();
    }else if(type == 'busy'){
        $('.dh_state_busy').show();
        $('.dh_state_idle').hide();
        $('.dh_state_sx').hide();
    }else{
        $('.dh_state_sx').show();
        $('.dh_state_busy').hide();
        $('.dh_state_idle').hide();
    }
}

function softphonebar_dialout_popup(phoneNum,cdrVariable) {
    phoneNum = utils.strTrimAll(phoneNum);
    var desc=checkHideTel(phoneNum);
    if(isHasFunc("func_dial_popup")){
        handler.call.showDialPopupCust(phoneNum);
    }
    phone_dialout(phoneNum,cdrVariable);
    $("#dialout_input").html(desc);

    $(".dialoutPopoverHtml").popover('hide');
}

function softphonebar_dialout(phoneNum,cdrVariable,flag) {
    phoneNum = utils.strTrimAll(phoneNum);
    phoneNum=getEncryptTel(phoneNum);
    //console.info("phoneNum===="+phoneNum)
    phone_dialout(phoneNum,cdrVariable,flag);
    var desc=checkHideTel(phoneNum);
    $("#dialout_input").val(desc);
    $("#dialout_input").html(desc);
    $(".dialoutPopoverHtml").popover('hide');
}

function softphonebar_transfer(phoneNum) {
    if(/^\d+$/.test(phoneNum)) {
        phone_transfer("9" + phoneNum, "number");
    }
}

function softphonebar_consult(phoneNum) {
    if(/^\d+$/.test(phoneNum)) {
        phone_consult("9" + phoneNum, "number");
    }
}

function softphonebar_threewaycall() {
    phone_threewaycall("912345");
}

function softphonebar_threewaycall(phoneNum) {
    if(/^\d+$/.test(phoneNum)) {
        phone_threewaycall("9" + phoneNum);
    }
}

function _softphonebar_showTranster(destExten) {
    _softphonebar_dialogBoxRemain = 40000;
    softphonebar_count = 1;
    var bodyMsg = "<div style='height:20px;overflow:hidden;text-align:center'>" +
        "<img src='./img/client/loading.gif' style='float:left;margin-top:5px;' />" +
        "<div id='softphonebar.msg' style='float:left;color:#666666;padding-left:5px;'></div>" +
        "<div style='clear:both;height:1px;overflow:hidden'>&nbsp;</div></div>";
    utils.showBox(310, 40, bodyMsg);
    _softphonebar_notifyDialogInterval = setInterval(function(){
        var cancelHtml = "<a href=\"javascript:phone_cancelTransfer();\" style=\"margin-left:3px;cursor:pointer;font-weight:bold;color:red;text-decoration:underline;\">取消</a>";
        _softphonebar_checkLoadingHide(destExten, cancelHtml);
    }, 1000);
}

function _softphonebar_checkLoadingHide(destExten, cancelHtml) {
    var count = softphonebar_count ++;
    var html = "正在等待<span style='color:#3fb23f;font-weight:bold'>"+destExten+ "</span>接听，" + "请稍后<span style='font-weight:bold'>(00:" + (count<10?("0"+count):count) +")</span>" + cancelHtml;
    document.getElementById("softphonebar.msg").innerHTML = html;
    if(_softphonebar_dialogBoxRemain <= 0){
        softphonebar_close();
    }
    _softphonebar_dialogBoxRemain -= 1000;
}

function softphonebar_close() {
    if(_softphonebar_notifyDialogInterval)
        clearInterval(_softphonebar_notifyDialogInterval);
    utils.closeBox();
}

function softphonebar_closeModel() {
    if($('#softphone_threewaycall'))
        $('#softphone_threewaycall').modal('hide');
    if($('#softphone_transfer'))
        $('#softphone_transfer').modal('hide');
    if($('#softphone_consult'))
        $('#softphone_consult').modal('hide');
    if($('#softphone_ivrMenu'))
        $('#softphone_ivrMenu').modal('hide');
}

function _softphonebar_transfering(event, value) {
    if(value == "TransferSuccess") {
        softphonebar_close();
        utils.showSucc("转接成功");
    } else if (value == "TransferFailed") {
        softphonebar_close();
        utils.showError("转接失败");
    }
}

function _softphonebar_showToMenu(displayname) {
    _softphonebar_dialogBoxRemain = 40000;
    softphonebar_count = 1;
    var bodyMsg = "<div style='height:20px;overflow:hidden;text-align:center'>" +
        "<img src='./img/client/loading.gif' style='float:left;margin-top:5px;' />" +
        "<div id='softphonebar.msg' style='float:left;color:#666666;padding-left:5px;'></div>" +
        "<div style='clear:both;height:1px;overflow:hidden'>&nbsp;</div></div>";
    utils.showBox(310, 40, bodyMsg);
    _softphonebar_notifyDialogInterval = setInterval(function(){
        _softphonebar_checkMenuLoadingHide(displayname, "");
    }, 1000);
}

function _softphonebar_checkMenuLoadingHide(destExten, cancelHtml) {
    var count = softphonebar_count ++;
    var html = "正在等待转<span style='color:#3fb23f;font-weight:bold'>"+destExten+ "</span>，" + "请稍后<span style='font-weight:bold'>(00:" + (count<10?("0"+count):count) +")</span>" + cancelHtml;
    document.getElementById("softphonebar.msg").innerHTML = html;
    if(_softphonebar_dialogBoxRemain <= 0){
        softphonebar_close();
    }
    _softphonebar_dialogBoxRemain -= 1000;
}

function _softphonebar_ivrMenuTransfering(event, json){
    if(json.Event == "IvrMenuEnd"){
        softphonebar_close();
        if(json.VAL_OF_IVR_MENU){
            var outIvrRefused = json.VAL_OF_IVR_MENU;
            if(outIvrRefused == "DTSF"){
                outIvrRefused = "转第三方系统失败！";
                utils.showError(outIvrRefused);
            }else{
                utils.showConfirm(outIvrRefused);
            }
        }
    }
}

function _softphonebar_showConsult(destExten) {
    _softphonebar_dialogBoxRemain = 40000;
    softphonebar_count = 1;
    var bodyMsg = "<div style='height:20px;overflow:hidden;text-align:center'>" +
        "<img src='./img/client/loading.gif' style='float:left;margin-top:5px;' />" +
        "<div id='softphonebar.msg' style='float:left;color:#666666;padding-left:5px;'></div>" +
        "<div style='clear:both;height:1px;overflow:hidden'>&nbsp;</div></div>";
    utils.showBox(310, 40, bodyMsg);
    _softphonebar_notifyDialogInterval = setInterval(function(){
        _softphonebar_checkLoadingHide(destExten, "");
    }, 1000);
}

function _softphonebar_onServiceNoChanged(event, monitorServiceNo) {
    if(!monitorServiceNo || !monitorServiceNo.serviceNo)
        return;
    var curRow = $("#monitor_serviceNo_" + monitorServiceNo.serviceNo);
    if(curRow.html() == null) {
        _softphonebar_createRow(monitorServiceNo, 'serviceNo');
    } else {
        _softphonebar_updateRow(monitorServiceNo, curRow, 'serviceNo')
    }

    _softphonebar_monitoringOnServiceNoChanged(monitorServiceNo);
}

function _softphonebar_onQueueChanged(event, monitorQueue, type) {
    if(!monitorQueue || !monitorQueue.queueId)
        return;
    var curRow = $("#monitor_queue_" + monitorQueue.queueId);
    if(curRow.html() == null) {
        _softphonebar_createRow(monitorQueue, 'queueId');
    } else {
        _softphonebar_updateRow(monitorQueue, curRow, 'queueId')
    }
    if(type == "needWaitCount") {
        if(phone_queues) {
            var totalQueueWait = 0;
            var pbx;
            for(var j in phone_queues) {
                var item = phone_queues[j];
                totalQueueWait = totalQueueWait + item.queueWaitCount;
                pbx = item.pbx;
            }
            //$("#monitor_waitCountTotal_" + pbx.replace(_softphoneBar_replaceAll, "_")).html(totalQueueWait);
            $("#monitor_waitCountTotal").html(totalQueueWait);
        }
    }
    _softphonebar_queue(monitorQueue);
}

function _softphonebar_queue(queue) {
//    console.info("_softphonebar_queue========");
//    console.dir(queue)
    if(queue.members[phone_data.sipNo] == undefined)
        return;
    if(!session.myQueue){
        session.myQueue=[];
    }
    var count=0;
    for (var i = 0; i < session.myQueue.length; i++) {
        var qid = session.myQueue[i];
        if(qid==queue.queueId){
            count++;
            break;
        }
    }
    if(!count){
        session.myQueue.push(queue.queueId);
    }
    var qName=$("#my_queue_info").find(".myQueue_name").text();
    if(qName==''||qName==queue.queueName){
        _changeMyQueue(queue);
    }
//    $("#queue_popover").attr("data-content",$("#my_queue_info").find("#myQueue_menu").html());
}
function _changeMyQueue(queue){
    var qName=$("#my_queue_info").find(".myQueue_name");
    qName.text(queue.queueName);
    $("#my_queue_info").attr("queueId",queue.queueId);
    var queueDom = $("#icc_statistics_queue_" + queue.queueId);
    if(queueDom.length > 0) {
//        if($("#icc_statistics_name_" + queue.queueId))
//            $("#icc_statistics_name_" + queue.queueId).html(queue.queueName);
        if($("#icc_statistics_idle_" + queue.queueId))
            $("#icc_statistics_idle_" + queue.queueId).html(queue.idleAgentCount);
        if($("#icc_statistics_wait_" + queue.queueId))
            $("#icc_statistics_wait_" + queue.queueId).html(queue.queueWaitCount);
    } else {
        _softphonebar_all_queue_obj[queue.queueId] = queue.queueWaitCount;
        var maqCount = 0;
        $.each(_softphonebar_all_queue_obj, function(key, val){
           maqCount += val;
        });
        var color = "#7CA8C9";
        if(maqCount > 0){
            color = "#FF0000";
        }
        $("#user_queue").html('<span style="color:'+color+'">'+maqCount+'</span>');
//        var htmls = [];
////        htmls.push("<div>技能组名:<span id=\"icc_statistics_name_" + queue.queueId+"\">" + queue.queueName + "</span></div>");
////        htmls.push("<div>空闲座席数&nbsp;<span class='label' id=\"icc_statistics_idle_" + queue.queueId+"\">" + queue.idleAgentCount + "</span></div>");
////        htmls.push("<div>排队数&nbsp;<span class='label' id=\"icc_statistics_wait_" + queue.queueId+"\">" + queue.queueWaitCount + "</span></div>");
////        htmls.push("<div class=\"clear5\"></div>")
//
////        htmls.push('<span class="label label-success" title="空闲座席数" id="icc_statistics_idle_'+queue.queueId+'">'+queue.idleAgentCount+'</span>&nbsp;&nbsp;');
////        htmls.push('<span class="label label-warning" title="排队数" id="icc_statistics_wait_' + queue.queueId+'">'+ queue.queueWaitCount +'</span>');
//
//        htmls.push('<span title="空闲座席数" id="icc_statistics_idle_'+queue.queueId+'">'+queue.idleAgentCount+'</span>/');
//        htmls.push('<span title="排队数" id="icc_statistics_wait_' + queue.queueId+'">'+ queue.queueWaitCount +'</span>');
//        var elementDiv = document.createElement("span");
//        elementDiv.id = "icc_statistics_queue_" + queue.queueId;
//        elementDiv.innerHTML = htmls.join("");
//        $("#user_queue").html(elementDiv);
    }
}

function _softphonebar_onPeerChanged(event, monitorPeer) {
    if(!monitorPeer || !monitorPeer.userId)
        return;
    if(monitorPeer.user.indexOf("admin") != -1)
        return;
    if(session.user.type != "admin" && session.user.scope.call != 'all'){
        var isFind = false;
        var lowUsers = session.user.moduleUsers.call;
        for(var i=0;i<lowUsers.length;i++){
            if(lowUsers[i] == monitorPeer.userId){
                isFind = true;
                break;
            }
        }
        if(!isFind) return;
    }
    var curRow = $("#monitor_peer_" + monitorPeer.userId);
    if(curRow.html() == null) {
        _softphonebar_createRow(monitorPeer, 'userId');
    } else {
        _softphonebar_updateRow(monitorPeer, curRow, 'userId')
    }
    _softphonebar_info(monitorPeer);
}

function _softphonebar_info(obj) {
//    var userId = obj.userId;
//    if(userId != session.user._id)
//        return;
//    if(phone_data.extenType == "sip") {
//        $("#user_loginType").text("软电话")
//    } else if(phone_data.extenType == "gateway") {
//        $("#user_loginType").text("语音网关")
//    } else if(phone_data.extenType == "Local") {
//        $("#user_loginType").text(session.user.mobile);
//    }
    //$("#user_status").text(obj.status);
    var userId = obj.userId;
    if(userId != session.user._id)
        return;
    var status = obj.status;
    var inComplete = obj.InComplete;
    var inCalls = obj.InCalls;
    var outComplete = obj.OutComplete;
    //var TransferComplete = obj.TransferComplete
    var outCalls = obj.OutCalls;
    var dialoutTimeLength = _softphonebar_getDialoutTime(obj.DialoutTimeLength||0);
    var dialinTimeLength = _softphonebar_getDialoutTime(obj.DialinTimeLength||0);

    if(phone_data.extenType == "sip") {
        $("#user_status").text('('+status+')');
        status = "电脑("+status+")";
    } else if(phone_data.extenType == "gateway") {
        $("#user_status").text('('+status+')');
        status = "话机("+status+")";
    } else if(phone_data.extenType == "Local") {
        status = session.user.mobile;
    }
    handler.workbench.inComplete = inComplete;
    handler.workbench.inCalls = inCalls;
    handler.workbench.outComplete = outComplete;
    handler.workbench.outCalls = outCalls;
    handler.workbench.dialoutTimeLength = obj.DialoutTimeLength||0;
    handler.workbench.dialinTimeLength = obj.DialinTimeLength||0;
    $("#icc_statistics_inComplete").text(inComplete);
    $('#workbench-inbound-count').html(inComplete);
    $('#workbench-inbound-total').html(inCalls);
    var inRate = '';
    if(inCalls!=0){
        inRate = (inComplete/inCalls*100).toFixed(0) + '%';
    }
    $('#workbench-inbound-rate').html(inRate);
    $('#workbench-outbound-count').html(outComplete);
    $('#workbench-outbound-total').html(outCalls);
    //var outRate = '';
    //if(outCalls!=0){
    //    outRate = (outComplete/outCalls*100).toFixed(0) + '%';
    //}
    //$('#workbench-outbound-rate').html(outRate);
    if(obj.DialinTimeLength != 0){
        $('#workbench-inbound-dialinTime').html(_softphonebar_getTimerSimple(Math.ceil(obj.DialinTimeLength / 1000)));
        $('#workbench-inbound-averageDialinTime').html(_softphonebar_getTimerSimple(Math.ceil(obj.DialinTimeLength/1000/inComplete)));
    }
    if(obj.DialoutTimeLength != 0){
        $('#workbench-outbound-dialoutTime').html(_softphonebar_getTimerSimple(Math.ceil(obj.DialoutTimeLength / 1000)));
        $('#workbench-outbound-averageDialoutTime').html(_softphonebar_getTimerSimple(Math.ceil(obj.DialoutTimeLength/1000/outComplete)));
    }
}

function _softphonebar_monitorInit() {
    _softphonebar_peer_index = 0;
    _softphonebar_queue_index = 0;
    _softphonebar_serviceNo_index = 0;
    //init serviceNo
    if(phone_serviceNos) {
        for(var i in phone_serviceNos) {
            var item = phone_serviceNos[i];
            if(!item || !item.serviceNo)
                continue;
            var curRow = $("#monitor_serviceNo_" + item.serviceNo);
            if(curRow.html() == null) {
                _softphonebar_createRow(item, 'serviceNo');
            } else {
                _softphonebar_updateRow(item, curRow, 'serviceNo')
            }
        }
    }

    if(phone_queues) {
        for(var i in phone_queues) {
            var item = phone_queues[i];
            if(!item || !item.queueId)
                continue;
            var curRow = $("#monitor_queue_" + item.queueId);
            if(curRow.html() == null) {
                _softphonebar_createRow(item, 'queueId');
            } else {
                _softphonebar_updateRow(item, curRow, 'queueId')
            }
        }
    }

    if(phone_peers) {
        for(var i in phone_peers) {
            var item = phone_peers[i];
            if(!item || !item.userId)
                continue;
            if(item.user.indexOf("admin") != -1)
                continue;
            if(session.user.type != "admin" && session.user.scope.call != 'all'){
                var isFind = false;
                var lowUsers = session.user.moduleUsers.call;
                for(var i=0;i<lowUsers.length;i++){
                    if(lowUsers[i] == item.userId){
                        isFind = true;
                        break;
                    }
                }
                if(!isFind) continue;
            }
            var curRow = $("#monitor_peer_" + item.userId);
            if(curRow.html() == null) {
                _softphonebar_createRow(item, 'userId');
            } else {
                _softphonebar_updateRow(item, curRow, 'userId')
            }
            _softphonebar_info(item);
        }
    }
    _softphonebar_setInterval();
    _softphonebar_loadMonitorAgent();
    for(var i in phone_pbxs) {
        _softphonebar_updatePeerNum(i);
    }
}

function softphonebar_getpbxid(pbx) {
    return pbx.replace(_softphoneBar_replaceAll, "_");
}

function _softphonebar_getpbx(pbxid) {
    return pbxid.replace(_softphoneBar_replaceAll_bak, ".");
}

function _softphonebar_createRow(item, key) {
    if(key == 'serviceNo') {
        var tdHtml = "";
        if((_softphonebar_serviceNo_index++)%2 == 0) {
            tdHtml = "<tr id=\"monitor_serviceNo_"+ item.serviceNo+"\">";
        } else {
            tdHtml = "<tr id=\"monitor_serviceNo_"+ item.serviceNo+"\" class=\"odd\">";
        }
        if(item.displayName && item.displayName != ''){
            tdHtml += "<td>"+item.serviceNo+"（"+item.displayName+"）</td><td>"+item.inCalls+"</td><td>"+item.inLost+"</td><td>"+item.inComplete+"</td></tr>";
        }else{
            tdHtml += "<td>"+item.serviceNo+"</td><td>"+item.inCalls+"</td><td>"+item.inLost+"</td><td>"+item.inComplete+"</td></tr>";
        }
        $('#monitor_serviceNo > tbody:last').append(tdHtml);
    } else if(key == 'queueId') {
        var tdHtml = "";
        if((_softphonebar_queue_index++)%2 == 0) {
            tdHtml = "<tr id=\"monitor_queue_" + item.queueId + "\">";
        } else {
            tdHtml = "<tr id=\"monitor_queue_" + item.queueId + "\" class=\"odd\">";
        }
        var waitCountTd = "";
        if(item.queueWaitCount > 0) {
            waitCountTd = "<td style='color:red;'>"+item.queueWaitCount+"</td>";
        } else {
            waitCountTd = "<td>"+item.queueWaitCount+"</td>";
        }
        tdHtml += "<td class=\"ellipsis\" title=\""+item.queueName+"\">"+item.queueName+"</td><td>"+item.idleAgentCount+"</td><td class=\"ellipsis\" title=\""+_softphonebar_getQueuePeer(item)+"\">"+item.totalAgentCount + _softphonebar_getQueuePeer(item) +"</td>" +
            waitCountTd + "<td>"+(item.totalCalls - item.abadonedCalls)+"</td></tr>";
        $('#monitor_queue > tbody:last').append(tdHtml);
    } else if(key == 'userId') {
        var tdHtml = "";
        if((_softphonebar_peer_index++)%2 == 0) {
            tdHtml = "<tr id=\"monitor_peer_" + item.userId+"\">";
        } else {
            tdHtml = "<tr id=\"monitor_peer_" + item.userId+"\" class=\"odd\">";
        }
        var claim = im_agents[item.userId]?im_agents[item.userId].claim:0;
        var dealing = im_agents[item.userId]?im_agents[item.userId].dealing:0;
        var autoClaim = im_agents[item.userId]?im_agents[item.userId].autoClaim:undefined;

        tdHtml += "<td class=\"ellipsis\" title='"+item.DisplayName+"'>"+item.DisplayName+"</td><td>"+item.exten+"</td>" +
            "<td>"+_softphonebar_displayExtenType(item)+"</td>" +
            "<td class='cdr-status'>" + _softphonebar_displayStatus(item) + "</td><td id=\""+item.userId+"_timer\"></td><td>" + _softphonebar_getDialoutTime(item.DialoutTimeLength) + "</td><td class=\"ellipsis\" title=\""+_softphonebar_displayQueueName(item.queueName)+"\">" + _softphonebar_displayQueueName(item.queueName) + "</td>" +
            "<td>"+item.callNo+"</td>" +
            "<td style='display:none' class='im_monitor_agent_claim smtd'>" + claim+ "</td>" +
            "<td style='display:none' class='im_monitor_agent_dealing smtd'>" + dealing  + "</td>" +
            "<td style='display:none' class='im_monitor_agent_autoClaim smtd'>" + render.monitor.renderAutoClaimDispaly(autoClaim)  + "</td>" +

            "<td class='cdr-operation'><div class='op-group'><ul><li id=\""+item.userId+"_listen_disable\" class=\"disabled\">监听</li>" +
            "<li id=\""+item.userId+"_listen\" style=\"display:none;\" onclick=\"_softphonebar_listen('"+item.channel+"', '"+item.userId+"')\">监听</li>" +
            "<li id=\""+item.userId+"_endlisten\" style=\"display:none;\" onclick=\"_softphonebar_endListen()\">结束监听</li>" +
            "<li id=\""+item.userId+"_forceHangup_disable\" class=\"disabled\">强拆</li>" +
            "<li id=\""+item.userId+"_forceHangup\" style=\"display:none;\" onclick=\"_softphonebar_forceHangup('"+item.channel+"', '" + item.pbx + "')\">强拆</li>" +
            "<li id=\""+item.userId+"_loot_disable\" class=\"disabled\">抢接</li>" +
            "<li id=\""+item.userId+"_loot\" style=\"display:none;\" onclick=\"_softphonebar_loot('"+item.linkedChannel+"')\">抢接</li>" +
            "<li id=\""+item.userId+"_kick_disable\" class=\"disabled\">签出</li>" +
            "<li id=\""+item.userId+"_kick\" style=\"display:none;\" onclick=\"_softphonebar_kick('"+item.userId+"')\">签出</li>" +
            "<li id=\""+item.userId+"_pick_disable\" class=\"disabled\">签入手机</li>" +
            "<li id=\""+item.userId+"_pick\" style=\"display:none;\" onclick=\"_softphonebar_pick('"+item.userId+"')\">签入手机</li>" +
            "<li id=\""+item.userId+"_pick_gateway_disable\" class=\"disabled\">签入SIP话机</li>" +
            "<li id=\""+item.userId+"_pick_gateway\" style=\"display:none;\" onclick=\"_softphonebar_pick('"+item.userId+"','gateway')\">签入SIP话机</li>" +
            "</ul></div></td></tr>";
        $('#monitor_peer > tbody:last').append(tdHtml);

        if(item.login && item.timestamp) {
            var date = new Date();
            var identity = date.valueOf();
            var oldTime = ((identity - phone_data.currentServerTime) - parseFloat(item.timestamp)*1000)/1000;
            if(oldTime < 0) {
                oldTime = 0;
            }
            var countTimer = {
                count:oldTime
            }
            _softphonebar_monitorTimers[item.userId]= countTimer;
        }

        _softphonebar_controlMonitor(item);
    }
}

function _softphonebar_updateRow(item, curRow, key) {
    if(key == 'serviceNo') {
        if(item.displayName && item.displayName != ''){
            var tdHtml = "<td>"+item.serviceNo+"（"+item.displayName+"）</td><td>"+item.inCalls+"</td><td>"+item.inLost+"</td><td>"+item.inComplete+"</td>";
        }else{
            var tdHtml = "<td>"+item.serviceNo+"</td><td>"+item.inCalls+"</td><td>"+item.inLost+"</td><td>"+item.inComplete+"</td>";
        }
        curRow.html(tdHtml);
    } else if(key == 'queueId') {
        var waitCountTd = "";
        if(item.queueWaitCount > 0) {
            waitCountTd = "<td style='color:red;'>"+item.queueWaitCount+"</td>";
        } else {
            waitCountTd = "<td>"+item.queueWaitCount+"</td>";
        }
        var tdHtml = "<td class=\"ellipsis\" title=\""+item.queueName+"\">"+item.queueName+"</td><td>"+item.idleAgentCount+"</td><td class=\"ellipsis\" title=\""+_softphonebar_getQueuePeer(item)+"\">"+item.totalAgentCount + _softphonebar_getQueuePeer(item) +"</td>" + waitCountTd + "<td>"+(item.totalCalls - item.abadonedCalls)+"</td>";
        curRow.html(tdHtml);
    } else if(key == 'userId') {
        var tdHtml = "<td class=\"ellipsis\" title='"+item.DisplayName+"'>"+item.DisplayName+"</td><td>"+item.exten+"</td><td>"+_softphonebar_displayExtenType(item)+"</td>" +
            "<td class='cdr-status'>" + _softphonebar_displayStatus(item) + "</td><td id=\""+item.userId+"_timer\"><td>" + _softphonebar_getDialoutTime(item.DialoutTimeLength) + "</td><td class=\"ellipsis\" title=\""+_softphonebar_displayQueueName(item.queueName)+"\">" + _softphonebar_displayQueueName(item.queueName) + "</td>" +
            "</td><td>"+item.callNo+"</td>" +
            "<td style='display:none' class='im_monitor_agent_claim smtd'>" + im_agents[item.userId].claim + "</td>" +
            "<td style='display:none' class='im_monitor_agent_dealing smtd'>" + im_agents[item.userId].dealing  + "</td>" +
            "<td style='display:none' class='im_monitor_agent_autoClaim smtd'>" + render.monitor.renderAutoClaimDispaly(im_agents[item.userId].autoClaim)  + "</td>" +
            "<td class='cdr-operation'><div class='op-group'><ul><li id=\""+item.userId+"_listen_disable\" class=\"disabled\">监听</li>" +
            "<li id=\""+item.userId+"_listen\" style=\"display:none;\" onclick=\"_softphonebar_listen('"+item.channel+"', '"+item.userId+"')\">监听</li>" +
            "<li id=\""+item.userId+"_endlisten\" style=\"display:none;\" onclick=\"_softphonebar_endListen()\">结束监听</li>" +
            "<li id=\""+item.userId+"_forceHangup_disable\" class=\"disabled\">强拆</li>" +
            "<li id=\""+item.userId+"_forceHangup\"  style=\"display:none;\" onclick=\"_softphonebar_forceHangup('"+item.channel+"', '" + item.pbx + "')\">强拆</li>" +
            "<li id=\""+item.userId+"_loot_disable\" class=\"disabled\">抢接</li>" +
            "<li id=\""+item.userId+"_loot\" style=\"display:none;\" onclick=\"_softphonebar_loot('"+item.linkedChannel+"')\">抢接</li>" +
            "<li id=\""+item.userId+"_kick_disable\" class=\"disabled\">签出</li>" +
            "<li id=\""+item.userId+"_kick\" style=\"display:none;\" onclick=\"_softphonebar_kick('"+item.userId+"')\">签出</li>" +
            "<li id=\""+item.userId+"_pick_disable\" class=\"disabled\">签入手机</li>" +
            "<li id=\""+item.userId+"_pick\" style=\"display:none;\" onclick=\"_softphonebar_pick('"+item.userId+"')\">签入手机</li>" +
            "<li id=\""+item.userId+"_pick_gateway_disable\" class=\"disabled\">签入SIP话机</li>" +
            "<li id=\""+item.userId+"_pick_gateway\" style=\"display:none;\" onclick=\"_softphonebar_pick('"+item.userId+"','gateway')\">签入SIP话机</li></ul></div>" +
            "</td>";
        curRow.html(tdHtml);

//        if(item.login && item.timestamp) {
        //for offline show stateTime
        if(item.timestamp && item.extenType) {
            var date = new Date();
            var identity = date.valueOf();
            var oldTime = ((identity - phone_data.currentServerTime) - parseFloat(item.timestamp)*1000)/1000;
            if(oldTime < 0) {
                oldTime = 0;
            }
            var countTimer = {
                count: oldTime
            };
            _softphonebar_monitorTimers[item.userId] = countTimer;
        } else {
            delete _softphonebar_monitorTimers[item.userId];
            $("#" + item.userId + "_timer").text("");
        }
        _softphonebar_controlMonitor(item);
        //_softphonebar_updatePeerNum(item.pbx);
    }
}
/* 加载座席 */
function _softphonebar_loadMonitorAgent(){
    var users = getCache("agents");

    utils.loadSearchInput({ id: "monitor_agent_state_owner_select_user",
        width: "120",
        height: "14",
        tip: "按姓名,拼音,工号搜索",
        data: users,
        listField: ["displayName", "exten"],
        userIdField: "_id",
        searchField: ["displayName", "exten", "pinyin"],
        pinyinField: ["displayName"],
        showAllList: true,
        callbackFuc: function (object) {
            $("#monitor_agent_state_owner_select_input").val(object._id);
            $("#monitor_agent_state_owner_select_user_input").val(object.displayName);

            softphonebar_select();
        },
        onKeyChanged: function () {
            if ($("#monitor_agent_state_owner_select_user_input").val() != "") {
                $("#monitor_agent_state_owner_select_input").val("serachInputNoresult");
            } else {
                $("#monitor_agent_state_owner_select_input").val("");
                softphonebar_select();
            }
        }
    });

    $("#monitor_peer_checkbox").click(function(){
        softphonebar_select();
    });
}
/* 监控筛选显示座席 */
function softphonebar_select() {

    var agents = new Array();

    var choose_agent = document.getElementById("monitor_agent_state_owner_select_input");
    var choose_agent_id = choose_agent.value;

    if(choose_agent_id)
        agents.push(choose_agent_id);

    var includeSubordinate = document.getElementById("monitor_peer_checkbox").checked;
    if(choose_agent_id && includeSubordinate){
        var agentList = getCache("agents");
        //session.user
        if(session.user.type == "admin" || session.user.scope.call == 'all'){

        }

        var getAgent=function(pid){
            for (var i = 0; i < agentList.length; i++) {
                var obj = agentList[i];
                if(obj.parentId && obj.parentId==pid){
                    agents.push(obj._id);
                    getAgent(obj._id);
                }
            }
        }
        getAgent(choose_agent_id);
    }

    _softphonebar_showAgentsChange(agents);
}
function _softphonebar_showAgentsChange(agents) {
    var trs = $("table[id=monitor_peer] > tbody").children("tr");

    var ifInclude = function(agentId){
        var flag = false;
        if(agents.length > 0){
            for(var i in agents){
                if(agents[i] == agentId){
                    flag = true;
                    //agents.remove(i);
                    break;
                }
            }
        }else{
            flag = true;
        }
        return flag;
    }

    for (var i = 0; i < trs.length; i++) {
        var tr = trs[i];
        var userid = trs[i].id.replace("monitor_peer_", "");
        if (userid && ifInclude(userid)) {
            $(tr).css("display", "");
        } else {
            $(tr).css("display", "none");
        }
    }
}

function _softphonebar_kick(userId) {
    phone_kick(userId);
}

function _softphonebar_pick(userId,extenType) {
    phone_pick(userId,extenType);
}

function _softphonebar_updatePeerNum(pbx) {
    var idleNum = 0;
    var totalNum = 0;
    var onlineNum = 0;
    for(var i in phone_peers) {
        var item = phone_peers[i];
        if(item.pbx != pbx)
            continue;
        var peerState = _softphonebar_displayStatus(item);
        if(item.user != null) {
            if(item.user.indexOf('admin') != -1) {
                continue;
            }
        }
        totalNum++;
        if(peerState != _softphonebar_desc["offline"]
            && peerState != _softphonebar_desc["unregister"]
            && peerState != _softphonebar_desc["ready"]) {
            onlineNum++;
            if(peerState.indexOf(_softphonebar_desc["peerstate"]) > 0) {
                idleNum++;
            }
        }
    }
    $("#monitor_countAll_" + softphonebar_getpbxid(pbx)).html(totalNum);
    $("#monitor_onlineCount_" + softphonebar_getpbxid(pbx)).html(onlineNum);
    $("#monitor_idleCount_" + softphonebar_getpbxid(pbx)).html(idleNum);
}

function _softphonebar_displayExtenType(peer) {
    var displayExtenType = "";
    if(peer.extenType == 'sip') {
        displayExtenType = "软电话";
    } else if(peer.extenType == 'gateway') {
        displayExtenType = "SIP话机";
    } else if(peer.extenType == 'Local') {
        displayExtenType = peer.localNo;
    } else if(peer.extenType == 'none') {
        displayExtenType = "无电话接入";
    }
    return displayExtenType;
}

function _softphonebar_getQueuePeer(item) {
    var queue = phone_queues[item.queueId];
    var members;
    var curPeer;
    var tipTitle = "";
    if(queue) {
        members = queue.members;
        var hasNoName = false;
        for(var j in members) {
            curPeer = _phone_getUserFromSip(j);
            if(curPeer && session.user.type != "admin" && session.user.scope.call != 'all'){
                var isFind = false;
                var lowUsers = session.user.moduleUsers.call;
                for(var i=0;i<lowUsers.length;i++){
                    if(lowUsers[i] == curPeer.userId){
                        isFind = true;
                        break;
                    }
                }
                if(!isFind) {
                    hasNoName = true;
                    continue;
                };
            }
            if(curPeer != null) {
                tipTitle += (curPeer.DisplayName + ",");
            }else{
                hasNoName = true;
            }
        }
        if(tipTitle != "") {
            if(hasNoName){
                tipTitle = "(" + tipTitle + "...)";
            }else{
                tipTitle = "(" + tipTitle.substring(0, tipTitle.lastIndexOf(",")) + ")";
            }
        }else{
            if(hasNoName){
                tipTitle = "(...)";
            }
        }
    }
    return tipTitle;
}

function _softphonebar_displayStatus(peer) {
    var displayName = '';
    if(peer.login && peer.extenType != 'none') {
        if((peer.extenType == 'sip' || peer.extenType == 'gateway') && peer.register == false) {
            displayName = _softphonebar_desc["unregister"];
        } else if(peer.callStatus == 'Idle') {
//            console.info(phone_data.phonebarConfig[peer.busyType]);
            if(peer.busyType == "0")
                displayName = _softphonebar_getColor(phone_data.phonebarConfig[peer.busyType], "0");
            else
                displayName = _softphonebar_getColor(phone_data.phonebarConfig[peer.busyType], "1");
        } else if(peer.callStatus=='Ring') {
            displayName = _softphonebar_getColor(_softphonebar_desc["dialing"], "2");
        } else if(peer.callStatus=='Ringing') {
            displayName = _softphonebar_getColor(_softphonebar_desc["belling"], "2");
        } else if(peer.callStatus=='inner') {
            displayName = _softphonebar_getColor(_softphonebar_desc["innerTalking"], "2");
        } else if(peer.callStatus=='normal') {
            displayName = _softphonebar_getColor(_softphonebar_desc["talking"], "2");
        } else if(peer.callStatus=='dialout') {
            displayName = _softphonebar_getColor(_softphonebar_desc["dialTalking"], "2");
        } else if(peer.callStatus=='dialTransfer') {
            displayName = _softphonebar_getColor(_softphonebar_desc["dialTransfer"], "2");
        } else if(peer.callStatus=='transfer') {
            displayName = _softphonebar_getColor(_softphonebar_desc["transfer"], "2");
        } else if(peer.callStatus=='listen') {
            displayName = _softphonebar_getColor(_softphonebar_desc["listened"], "2");
        }
        //validate?
    } else if(peer.login && peer.extenType == 'none') {
        displayName = '';
    } else {
        if(peer.callStatus=='Ring') {
            displayName = _softphonebar_getColor(_softphonebar_desc["dialing"], "2");
        } else if(peer.callStatus=='Ringing') {
            displayName = _softphonebar_getColor(_softphonebar_desc["belling"], "2");
        } else if(peer.callStatus=='inner') {
            displayName = _softphonebar_getColor(_softphonebar_desc["innerTalking"], "2");
        } else if(peer.callStatus=='normal') {
            displayName = _softphonebar_getColor(_softphonebar_desc["talking"], "2");
        } else if(peer.callStatus=='dialout') {
            displayName = _softphonebar_getColor(_softphonebar_desc["dialTalking"], "2");
        } else if(peer.callStatus=='dialTransfer') {
            displayName = _softphonebar_getColor(_softphonebar_desc["dialTransfer"], "2");
        } else if(peer.callStatus=='transfer') {
            displayName = _softphonebar_getColor(_softphonebar_desc["transfer"], "2");
        } else if(peer.callStatus=='listen') {
            displayName = _softphonebar_getColor(_softphonebar_desc["listened"], "2");
        } else {
            if(!peer.login && (peer.extenType=='gateway' || peer.extenType=='Local')) {
                displayName = _softphonebar_desc["offline"];
            } else {
                displayName = _softphonebar_desc["ready"];
            }
        }
    }
    return displayName;
}

function _softphonebar_getColor(content, type) {
    if(type == "0") {
        return "<span class=\"cdr-green\"></span>"+content;
    } else if(type == "1") {
        return "<span class=\"cdr-red\"></span>"+content;
    } else if(type == "2") {
        return "<span class=\"cdr-orange\"></span>"+content;
    } else {
        return "<span></span>"+content;
    }
}

function _softphonebar_getInComCount(item) {
    return "普通来电数:"+ item.InComplete + "\r\n" + "转接来电数:" + item.TransferComplete;
}

function _softphonebar_displayQueueName(queueName) {
    if(queueName == undefined) {
        queueName = "";
    }
    //TODO
    return queueName;
}

function _softphonebar_setInterval() {
    if(_softphonebar_monitorTimersHandle) {
        window.clearInterval(_softphonebar_monitorTimersHandle);
    }
    _softphonebar_monitorTimersHandle = window.setInterval("_softphonebar_monitorDoCallTimer()", 1000);
}

function _softphonebar_monitorDoCallTimer() {
    if(_softphonebar_monitorTimers){
        for(var i in _softphonebar_monitorTimers) {
            var timerTd = $("#" + i + "_timer");
            if(timerTd != null) {
                timerTd.text(_softphonebar_getTimer(_softphonebar_monitorTimers[i].count));
                _softphonebar_monitorTimers[i].count++;
            }
        }
    }
}

function _softphonebar_getDialoutTime(dialoutLength) {
    var time = Math.ceil(dialoutLength / 1000);
    return _softphonebar_getTimer(time - 1);
}

function _softphonebar_getStatus(peer) {
    if(!peer.login && !(peer.extenType=='gateway' || peer.extenType=='Local')) {
        return "";
    } else {
        return peer.status;
    }
}

function _softphonebar_listen(curChannel, userId) {
    var peer = phone_peers[userId];
    if(peer == null) {
        utils.showError("监听失败!");
        return;
    }
    if(phone_data.busyType == "0") {
        utils.showError("请先将电话置为忙碌");
        return;
    }
    if(phone_data.extenType == "none") {
        utils.showError("执行该操作必须以电话方式登录");
        return;
    }
    if(peer.userId == phone_data.userId) {
        utils.showError("不允许对自身进行操作");
        return;
    }
    if(peer.callStatus != "webcall"
        && peer.callStatus != "inner"
        && peer.callStatus !="normal"
        && peer.callStatus !="dialout"
        && peer.callStatus !="dialTransfer"
        && peer.callStatus !="transfer") {
        utils.showError("该状态不允许监听");
        return;
    }
    var listen = phone_listen(curChannel);
    if(listen) {
        $("#" + userId + "_listen").css("display", "none");
        $("#" + userId + "_endlisten").css("display", "");
        /*$("#" + userId + "_loot").attr("class", "btn btn-mini disabled");*/
        $("#" + userId + "_loot").css("display", "none");
    }
}

function _softphonebar_endListen() {
    phone_hangup();
}

function _softphonebar_forceHangup(curChannel, pbx) {
    if(pbx == phone_data.pbx_in_ip)
        phone_hangupChannel(curChannel);
    else
        phone_hangupChannelFromPbx(curChannel, pbx);
}

function _softphonebar_loot(linkedChannel) {
    phone_loot(linkedChannel);
}

function _softphonebar_controlMonitor(peer) {
    if (peer.userId == phone_data.userId
        || (!peer.login && peer.extenType!='Local'  && peer.extenType != 'gateway')) {
        $("#" + peer.userId + "_kick_disable").css("display", "");
        $("#" + peer.userId + "_kick").css("display", "none");
    } else {
        $("#" + peer.userId + "_kick_disable").css("display", "none");
        $("#" + peer.userId + "_kick").css("display", "");
    }
    if(peer.userId == phone_data.userId
        || peer.login || (!peer.login && peer.extenType == "Local")
        || (!peer.login && peer.extenType == 'gateway')) {
        $("#" + peer.userId + "_pick_disable").css("display", "");
        $("#" + peer.userId + "_pick").css("display", "none");
        $("#" + peer.userId + "_pick_gateway_disable").css("display", "");
        $("#" + peer.userId + "_pick_gateway").css("display", "none");
    } else {
        $("#" + peer.userId + "_pick_disable").css("display", "none");
        $("#" + peer.userId + "_pick").css("display", "");
        $("#" + peer.userId + "_pick_gateway_disable").css("display", "none");
        $("#" + peer.userId + "_pick_gateway").css("display", "");
    }
    if(peer.callStatus != "listen" && peer.callStatus != "Idle") {
        $("#" + peer.userId + "_forceHangup_disable").css("display", "none");
        $("#" + peer.userId + "_forceHangup").css("display", "");
    } else {
        $("#" + peer.userId + "_forceHangup_disable").css("display", "");
        $("#" + peer.userId + "_forceHangup").css("display", "none");
    }
    if(phone_data.extenType == "none"
        || peer.userId == phone_data.userId || _softphonebar_isCalling(phone_data.userId) || !_softphonebar_isCalling(peer.userId)) {
        $("#" + peer.userId + "_loot_disable").css("display", "");
        $("#" + peer.userId + "_loot").css("display", "none");
    } else {
        $("#" + peer.userId + "_loot_disable").css("display", "none");
        $("#" + peer.userId + "_loot").css("display", "");
    }
    if(phone_data.extenType != "none" && peer.userId != phone_data.userId
        && !_softphonebar_isCalling(phone_data.userId)
        && (peer.callStatus == "webcall" || peer.callStatus == "inner" || peer.callStatus =="normal" || peer.callStatus=="dialout" || peer.callStatus =="dialTransfer" || peer.callStatus =="transfer")) {
        $("#" + peer.userId + "_listen_disable").css("display", "none");
        $("#" + peer.userId + "_listen").css("display", "");
    } else {
        $("#" + peer.userId + "_listen_disable").css("display", "");
        $("#" + peer.userId + "_listen").css("display", "none");
    }
    if(peer.pbx != phone_data.pbx_in_ip) {
        $("#" + peer.userId + "_loot_disable").css("display", "none");
        $("#" + peer.userId + "_loot").css("display", "none");
        $("#" + peer.userId + "_listen_disable").css("display", "none");
        $("#" + peer.userId + "_listen").css("display", "none");
    }
    if (!peer.sipNo) {
        $("#" + peer.userId + "_pick_disable").css("display", "none");
        $("#" + peer.userId + "_pick").css("display", "");
        $("#" + peer.userId + "_pick_gateway_disable").css("display", "none");
        $("#" + peer.userId + "_pick_gateway").css("display", "");
        $("#" + peer.userId + "_kick_disable").css("display", "");
        $("#" + peer.userId + "_kick").css("display", "none");
        $("#" + peer.userId + "_loot_disable").css("display", "");
        $("#" + peer.userId + "_loot").css("display", "none");
        $("#" + peer.userId + "_forceHangup_disable").css("display", "");
        $("#" + peer.userId + "_forceHangup").css("display", "none");
        $("#" + peer.userId + "_listen_disable").css("display", "");
        $("#" + peer.userId + "_listen").css("display", "none");
        $("#" + peer.userId + "_endlisten").css("display", "none");
    }
}

function _softphonebar_monitoringInit() {
    for(var i in phone_pbxs) {
        var pbxid = i.replace(_softphoneBar_replaceAll, "_");
        _softphonebar_initInCallChart(pbxid);
        _softphonebar_initOutCallChart(pbxid);
    }
    if(phone_accountCalls) {
        for(var i in phone_accountCalls) {
            var accountCall = phone_accountCalls[i];
            if(accountCall) {
                var curPbxId = i.replace(_softphoneBar_replaceAll, "_");
                _softphonebar_toDrawingTodayPandectChart(accountCall.inCalls, accountCall.inComplete, accountCall.outCalls, accountCall.outComplete, curPbxId);
                _softphonebar_toDrawingInCallChart(accountCall.inCalls, accountCall.inCallsPerHour, accountCall.inCompletePerHour, curPbxId);
                _softphonebar_toShowInCallChart(curPbxId);
                _softphonebar_toDrawingOutCallChart(accountCall.outCalls, accountCall.outCallsPerHour, accountCall.outCompletePerHour, curPbxId);
                _softphonebar_toShowOutCallChart(curPbxId);
            }
        }
    }
    if(phone_serviceNos) {
        for(var i in phone_serviceNos) {
            var monitorServiceNo = phone_serviceNos[i];
            _softphonebar_toDrawingServiceNumberChart(monitorServiceNo.serviceNo , monitorServiceNo.inCalls , monitorServiceNo.inLost, monitorServiceNo.inComplete, (monitorServiceNo.pbx).replace(_softphoneBar_replaceAll, "_"));
        }
    }
}

function _softphonebar_isCalling(userId) {
    var peer = phone_peers[userId];
    if(peer) {
        if(peer.callStatus=='Ring'
            || peer.callStatus=='Ringing' || peer.callStatus=='inner'
            ||peer.callStatus=='normal'||peer.callStatus=='dialout'||peer.callStatus=='dialTransfer'
            ||peer.callStatus=='transfer'||peer.callStatus=='listen') {
            return true;
        }
    }
    return false;
}

function _softphonebar_onEndListen(event) {
    for(var id in phone_peers) {
        if(_softphonebar_isCalling(id)) {
            $("#" + id + "_listen_disable").css("display", "none");
            $("#" + id + "_listen").css("display", "");
            $("#" + id + "_loot_disable").css("display", "none");
            $("#" + id + "_loot").css("display", "");
        } else {
            $("#" + id + "_listen_disable").css("display", "");
            $("#" + id + "_listen").css("display", "none");
            $("#" + id + "_loot_disable").css("display", "");
            $("#" + id + "_loot").css("display", "none");
        }
        $("#" + id + "_endlisten").css("display", "none");
    }
}

function _softphonebar_getTimer(countTimer) {
    var minute = "0";
    var second = "0";
    var hour = "0";
    countTimer = parseInt(countTimer) + 1;
    hour = parseInt(countTimer/3600);
    minute = parseInt((countTimer%3600)/60);
    second = (countTimer%3600)%60;

    var mtime = (hour<10)? "0" + hour : hour;
    mtime += ":";
    mtime += (minute<10)? "0" + minute : minute;
    mtime += ":";
    mtime += (second<10)? "0" + second : second;
    return mtime;
}


function _softphonebar_evtRing(event, callObject) {
    //console.dir(callObject);
    handler.call.call(callObject);
}


function _softphonebar_doCallTimer() {
    _softphonebar_timestateref.html(_softphonebar_getTimer(_softphonebar_countTimer));
    _softphonebar_countTimer ++;
}

function _softphonebar_getTimer(countTimer) {
    var minute = "0";
    var second = "0";
    var hour = "0";
    countTimer = parseInt(countTimer) + 1;
    hour = parseInt(countTimer/3600);
    minute = parseInt((countTimer%3600)/60);
    second = (countTimer%3600)%60;

    var mtime = (hour<10)? "0" + hour : hour;
    mtime += ":";
    mtime += (minute<10)? "0" + minute : minute;
    mtime += ":";
    mtime += (second<10)? "0" + second : second;
    return mtime;
}
function _softphonebar_getTimerSimple(countTimer) {
    var minute = "";
    var second = "";
    var hour = "";
    countTimer = parseInt(countTimer);
    hour = parseInt(countTimer/3600);
    minute = parseInt((countTimer%3600)/60);
    second = (countTimer%3600)%60;
    if(hour == 0)
        hour = "";
    if(minute == 0)
        minute = "";
    if(second == 0)
        second = "";
    var mtime = (hour>0)? hour+":" : hour;
    mtime += (minute>0)? minute+":" : minute;
    mtime += (second>0)? second : second;
    return mtime;
}
function _softphonebar_systemBusy() {
    var autoBusyTime = phone_data.autoBusyTime;
    if(autoBusyTime < 1)
        return;
    _softphonebar_callstateref.html(phone_data.phonebarConfig["99"]);
    if(_softphonebar_calculagraph != null) {
        window.clearInterval(_softphonebar_calculagraph);
    }
    _softphonebar_calculagraph = window.setInterval(function(){
        autoBusyTime--;
        _softphonebar_autoBusyTime(autoBusyTime);
    }, 1000);
}
function _softphonebar_autoBusyTime(autoBusyTime) {
    var minute = "0";
    var second = "0";
    var hour = "0";
    if(autoBusyTime >= 60*60) {
        hour = parseInt(autoBusyTime / (60*60));
        minute = parseInt((autoBusyTime - hour*(60*60)) / (60));
        second = autoBusyTime - hour*(60*60) - minute*(60);
    } else if(autoBusyTime >= 60 && (autoBusyTime < 60*60)) {
        hour = "0";
        minute = parseInt(autoBusyTime / 60);
        second = autoBusyTime - minute * 60;
    } else if(0 < autoBusyTime < 60) {
        hour = "0";
        minute = "0";
        second = autoBusyTime;
    } else if(autoBusyTime <= 0) {
        hour = "0";
        minute = "0";
        second = "0";
    }
    if(hour < 0) {
        hour = 0;
    }
    if(minute < 0) {
        minute = 0;
    }
    if(second < 0) {
        second = 0;
    }
    _softphonebar_timestateref.html(((hour<10)?("0"+hour):hour) + ":" + ((minute<10)?("0"+minute):minute) + ":" + ((second<10)?("0"+second):second));
}

function _softphonebar_toDrawingServiceNumberChart(serviceNo , inCalls , inLost, inComplete, curPbx){
    var sn = $("#" + curPbx + "_ServiceNumberChart");
    if(serviceNo != undefined) {
        var snChart = document.createElement("div");
        if(inCalls == 0){
            snChart.id = curPbx + "_snChart" + serviceNo;
            snChart.setAttribute("class", "snChartItem");
            snChart.style.background = "none repeat scroll 0 0 #ffffff";
            snChart.innerHTML = '<div class="snChartNumber">服务号：' + serviceNo + '</div> <div class="snChartDiagram" style="text-align:center; border:dashed 1px #ccc; background-color:#f2f6fb;" > 呼入数量为空  </div> <div class="snChartSum"> 总计：' + inCalls + '</div> <div class="clear"></div>';
            sn.append(snChart);
        }else if(inCalls == inComplete){
            snChart.id = curPbx + "_snChart" + serviceNo;
            snChart.setAttribute("class", "snChartItem");
            snChart.style.background = "none repeat scroll 0 0 #ffffff";
            snChart.innerHTML = '<div class="snChartNumber">服务号：' + serviceNo + '</div> <div class="snChartDiagram" > <div style="width:100%; "  class="snChartComplete">' +inComplete + " (100%)" + '</div> <div style="display:none; " class="snChartLost"></div> </div> <div class="snChartSum"> 总计：' + inCalls + '</div> <div class="clear"></div>';
            sn.append(snChart);
        }else if(inCalls == inLost){
            snChart.id = curPbx + "_snChart" + serviceNo;
            snChart.setAttribute("class", "snChartItem");
            snChart.style.background = "none repeat scroll 0 0 #ffffff";
            snChart.innerHTML = '<div class="snChartNumber">服务号：' + serviceNo + '</div> <div class="snChartDiagram" > <div style=" display:none;"  class="snChartComplete"></div> <div style="width:100%; " class="snChartLost">' + inLost + " (100%)" + '</div> </div> <div class="snChartSum"> 总计：' + inCalls + '</div> <div class="clear"></div>';
            sn.append(snChart);
        }else{
            var sinCallCpt,sinCallLst,inCallCpt,inCallLst;
            var perInComplete = Math.round((inComplete/inCalls)*100);
            if(perInComplete < 15){
                sinCallCpt = 15;
                sinCallLst = 85;
            }else if(perInComplete > 85){
                sinCallCpt = 85;
                sinCallLst = 15;
            }else{
                sinCallCpt = perInComplete;
                sinCallLst = 100 - perInComplete;
            }
            inCallCpt = perInComplete.toString();
            inCallLst = (100 - perInComplete).toString();

            snChart.id = curPbx + "_snChart" + serviceNo;
            snChart.setAttribute("class", "snChartItem");
            snChart.style.background = "none repeat scroll 0 0 #ffffff";
            snChart.innerHTML = '<div class="snChartNumber">服务号：' + serviceNo
                + '</div> <div class="snChartDiagram" > <div style="width:' + sinCallCpt
                + '%; "  class="snChartComplete">' +inComplete + " (" + inCallCpt + "%)"
                + '</div> <div style="width:' + sinCallLst + '%; " class="snChartLost">'
                + inLost + " (" + inCallLst + "%)" + '</div> </div> <div class="snChartSum"> 总计：'
                + inCalls + '</div> <div class="clear"></div>';
            sn.append(snChart);
        }
    }
}

function _softphonebar_monitoringOnServiceNoChanged(serviceNos) {
    var serviceNo = serviceNos.serviceNo;
    var inCalls = serviceNos.inCalls;
    var inComplete = serviceNos.inComplete;
    var inLost = serviceNos.inLost;
    var outCalls = serviceNos.outCalls;
    var outComplete = serviceNos.outComplete;

    var pbxId = (serviceNos.pbx).replace(_softphoneBar_replaceAll, "_");
    var updateBox = $("#" + pbxId + "_snChart" + serviceNo);
    if(updateBox.html() == null) {
        _softphonebar_toDrawingServiceNumberChart(serviceNo , inCalls , inLost, inComplete, pbxId);
        return;
    }
    if(inCalls == 0) {
        updateBox.css("background", "none repeat scroll 0 0 #ffffff");
        updateBox.html('<div class="snChartNumber">服务号：' + serviceNo + '</div> <div class="snChartDiagram" style="text-align:center; border:dashed 1px #ccc; background-color:#f2f6fb;" > 呼入数量为空  </div> <div class="snChartSum"> 总计：' + inCalls + '</div> <div class="clear"></div>');
    } else {
        var sinCallCpt,sinCallLst,inCallCpt,inCallLst;
        var perInComplete = Math.round((inComplete/inCalls)*100);
        if(perInComplete < 15){
            sinCallCpt = 15;
            sinCallLst = 85;
        }else if(perInComplete > 85){
            sinCallCpt = 85;
            sinCallLst = 15;
        }else{
            sinCallCpt = perInComplete;
            sinCallLst = 100 - perInComplete;
        }
        inCallCpt = perInComplete.toString();
        inCallLst = (100 - perInComplete).toString();
        updateBox.html('<div class="snChartNumber">服务号：' + serviceNo
            + '</div> <div class="snChartDiagram" > <div style="width:' + sinCallCpt
            + '%; "  class="snChartComplete">' +inComplete + " (" + inCallCpt + "%)"
            + '</div> <div style="width:' + sinCallLst + '%; " class="snChartLost">'
            + inLost + " (" + inCallLst + "%)" + '</div> </div> <div class="snChartSum"> 总计：'
            + inCalls + '</div> <div class="clear"></div>');
    }
}

function _softphonebar_onAccountCalls(event, accountCall) {
    var curPbxId = (accountCall.pbx).replace(_softphoneBar_replaceAll, "_");
    _softphonebar_toDrawingTodayPandectChart(accountCall.inCalls, accountCall.inComplete, accountCall.outCalls, accountCall.outComplete, curPbxId);
    if($("#" + curPbxId + "_TwentyFourHourInChart").html() == null) {
        return;
    }
    _softphonebar_toDrawingInCallChart(accountCall.inCalls, accountCall.inCallsPerHour, accountCall.inCompletePerHour, curPbxId);
    _softphonebar_toShowInCallChart(curPbxId);
    if($("#" + curPbxId + "_TwentyFourHourOutChart").html() == null) {
        return;
    }
    _softphonebar_toDrawingOutCallChart(accountCall.outCalls, accountCall.outCallsPerHour, accountCall.outCompletePerHour, curPbxId);
    _softphonebar_toShowOutCallChart(curPbxId);
}

function _softphonebar_toDrawingInCallChart(inCalls, inCallsPerHour, inCompletePerHour, curPbx){
    if(inCalls != 0){
        var inCallSumArray,inCallCptArray = [];
        inCallSumArray = inCallsPerHour.split(",");
        inCallCptArray = inCompletePerHour.split(",");
        var inCallMax = 0;
        for(var i = 0; i < 24; i++){
            inCallMax = Math.max(inCallMax, inCallSumArray[i]);
        }
        var b = inCallMax%5;
        var mainLength = inCallMax - b + 5;
        var offsetCall = mainLength/5;
        var topOffsetPercent = 180/mainLength;
        for(var i=0; i<24; i++){
            var sumrow = document.getElementById(curPbx + "_inCallsumrow_" + i);
            sumrow.setAttribute("call", inCallSumArray[i]);
            sumrow.style.height = Math.round(topOffsetPercent*inCallSumArray[i]) + "px";
            sumrow.style.top = 200 - Math.round(topOffsetPercent*inCallSumArray[i]) + "px";

            var cptrow = document.getElementById(curPbx + "_inCallcptrow_" + i);
            cptrow.setAttribute("call", inCallCptArray[i]);
            cptrow.style.height = Math.round(topOffsetPercent*inCallCptArray[i]) + "px";
            cptrow.style.top = 200 - Math.round(topOffsetPercent*inCallCptArray[i]) + "px";
        }
        for (var i = 1; i < 6; i++) {
            var tity = document.getElementById(curPbx + "_inCalltity_" + i);
            var temp = offsetCall * ( 6 - i );
            tity.innerHTML = temp;
        }
    }
}

function _softphonebar_initInCallChart(curPbx) {
    var ic = $("#" + curPbx + "_TwentyFourHourInChart");
    var icArea = $("#" + curPbx + "_TwentyFourHourInCallChartArea");
    for(var i = 0; i < 25; i++){
        if(i == 24){
            var timerow = document.createElement("div");
            timerow.id = curPbx + "_inCalltimerow_" + i;
            timerow.setAttribute("class", "callnum");
            timerow.style.left = (26 * i) + "px";
            timerow.style.width = "50px";
            timerow.style.position = "absolute";
            timerow.style.top = "205px";
            timerow.innerHTML = "时间/时";
            ic.append(timerow);
        } else {
            var sumrow = document.createElement("div");
            sumrow.id = curPbx + "_inCallsumrow_" + i;
            sumrow.setAttribute("class", "incallchartsumrow");
            sumrow.setAttribute("call", 0);
            sumrow.setAttribute("showTip", true);
            sumrow.style.left = (26 * i) + "px";
            sumrow.style.height = 0 + "px";
            sumrow.style.width = "10px";
            sumrow.style.border = "solid 0px #1280ef";
            sumrow.style.position = "absolute";
            sumrow.style.overflow = "hidden";
            sumrow.style.background = "none repeat scroll 0 0 #1280ef";
            sumrow.style.display = "block";
            sumrow.style.top = 200 + "px";
            sumrow.style.zIndex = "1";
            icArea.append(sumrow);

            var timerow = document.createElement("div");
            timerow.id = curPbx + "_inCalltimerow_" + i;
            timerow.setAttribute("class", "callnum");
            timerow.style.left = (26 * i) + 3 + "px";
            timerow.style.width = "10px";
            timerow.style.textAlign = "center";
            timerow.style.position = "absolute";
            timerow.style.top = "205px";
            timerow.innerHTML = i;
            ic.append(timerow);

            var cptrow = document.createElement("div");
            cptrow.id = curPbx + "_inCallcptrow_" + i;
            cptrow.setAttribute("class", "incallchartcptrow");
            cptrow.setAttribute("call", 0);
            cptrow.setAttribute("showTip", true);
            cptrow.style.width = "10px";
            cptrow.style.height = 0 + "px";
            cptrow.style.border = "solid 0px #92be0f";
            cptrow.style.position = "absolute";
            cptrow.style.overflow = "hidden";
            cptrow.style.background = "none repeat scroll 0 0 #92be0f";
            cptrow.style.left = (26 * i) + 10 + "px";
            cptrow.style.display = "block";
            cptrow.style.top = 200 + "px";
            cptrow.style.zIndex = "1";
            icArea.append(cptrow);
        }
    }

    for (var i = 0; i < 6; i++) {
        if(i==0){
            var tity = document.createElement("div");
            tity.id = curPbx + "_inCalltity_" + i;
            tity.setAttribute("class", "tity");
            tity.style.width = "50px";
            tity.style.position = "absolute";
            tity.style.top = (36 * i) -5 + "px";
            tity.style.left = "-40px";
            tity.innerHTML = "数量/个";
            ic.append(tity);
        } else {
            var tity = document.createElement("div");
            tity.id = curPbx + "_inCalltity_" + i;
            tity.setAttribute("class", "tity");
            tity.style.width = "35px";
            tity.style.position = "absolute";
            tity.style.top = (36 * i) - 21 + "px";
            tity.style.left = "-18px";
            tity.style.right = "30px";
            tity.innerHTML = 6 - i;
            ic.append(tity);

            var liney = document.createElement("div");
            liney.id = curPbx + "_inCallliney_" + i;
            liney.style.width = "620px";
            liney.style.position = "absolute";
            liney.style.borderTop = "1px dotted #B9B9B9";
            liney.style.height = "1px";
            liney.style.overflow = "hidden";
            liney.style.top = (36 * i) -16 + "px";
            liney.style.left = "0px";
            icArea.append(liney);
        }
    }
}

function _softphonebar_toShowInCallChart(curPbx){
    var incalls = $("#" + curPbx + "_TwentyFourHourInCallChartArea div");
    incalls.each(function(i, incall) {
        if(!incall.getAttribute("showTip"))
            return;

        incall.onmouseover = function() {
            var temp = this.id.split("_");
            var hour = temp[temp.length - 1];
            var type = temp[temp.length - 2];
            var pbx = this.id.substr(0, this.id.indexOf(type) - 1);

            var times = this.getAttribute("call");
            var tipMessage = "";
            if(type == "inCallsumrow" ){
                tipMessage = "今日" + hour + "时呼入" + times;
            } else if(type =="inCallcptrow"){
                tipMessage = "今日" + hour + "时已接" + times;
            }
            var liney = document.getElementById(pbx + "_inCallMouseTip");
            if(!liney) {
                liney = document.createElement("div");
                liney.id = pbx + "_inCallMouseTip";

                liney.style.position = "absolute";
                liney.style.border = "1px dotted #FFFF99";

                liney.style.padding = "3px";

                liney.style.overflow = "hidden";
                liney.style.background = "none repeat scroll 0 0 #f8c713";
                liney.style.textAlign = "center";
                liney.style.zIndex = "2";
                var area = $("#" + pbx + "_TwentyFourHourInChart");
                area.append(liney);
            }
            liney.innerHTML = tipMessage;
            liney.style.top = $(this).position().top +"px";
            liney.style.left = $(this).position().left + 5 + "px";
            liney.style.visibility = "visible";

            var timeText = document.getElementById(pbx + "_inCalltimerow_" + hour);
            if(timeText){
                timeText.style.background = "none repeat scroll 0 0 #f8c713";
            }
        };
        incall.onmouseout = function(){
            var temp = this.id.split("_");
            var type = temp[temp.length - 2];
            var hour = temp[temp.length - 1];
            var pbx = this.id.substr(0, this.id.indexOf(type) - 1);
            var liney = document.getElementById(pbx + "_inCallMouseTip");
            if(liney) {
                liney.style.visibility = "hidden";
            }
            var timeText = document.getElementById(pbx + "_inCalltimerow_" + hour);
            if(timeText){
                timeText.style.background = "";
            }
        };
    });
}

function _softphonebar_initOutCallChart(curPbx){
    var ic = $("#" + curPbx + "_TwentyFourHourOutChart");
    var icArea = $("#" + curPbx + "_TwentyFourHourOutCallChartArea");
    for(var i=0; i<25; i++){
        if(i==24){
            var timerow = document.createElement("div");
            timerow.id = curPbx + "_outCalltimerow_" + i;
            timerow.setAttribute("class", "callnum");
            timerow.style.left = (26 * i) + "px";
            timerow.style.width = "50px";
            timerow.style.position = "absolute";
            timerow.style.top = "205px";
            timerow.innerHTML = "时间/时";
            ic.append(timerow);
        } else {
            var sumrow = document.createElement("div");
            sumrow.id = curPbx + "_outCallsumrow_" + i;
            sumrow.setAttribute("class", "call");
            sumrow.setAttribute("call", 0);
            sumrow.setAttribute("showTip", true);
            sumrow.style.left = 26*i + "px";
            sumrow.style.height = 0 + "px";
            sumrow.style.width = "10px";
            sumrow.style.border = "solid 0px #1280ef";
            sumrow.style.position = "absolute";
            sumrow.style.overflow = "hidden";
            sumrow.style.background = "none repeat scroll 0 0 #1280ef";
            sumrow.style.display = "block";
            sumrow.style.top = 200 + "px";
            sumrow.style.zIndex = "1";
            icArea.append(sumrow);

            var timerow = document.createElement("div");
            timerow.id = curPbx + "_outCalltimerow_" + i;
            timerow.setAttribute("class", "callnum");
            timerow.style.left = (26*i) + 3 + "px";
            timerow.style.width = "10px";
            timerow.style.position = "absolute";
            timerow.style.top = "205px";
            timerow.style.textAlign = "center";
            timerow.innerHTML = i;
            ic.append(timerow);

            var cptrow = document.createElement("div");
            cptrow.id = curPbx + "_outCallcptrow_" + i;
            cptrow.setAttribute("class", "outcallchartcptrow");
            cptrow.setAttribute("call", 0);
            cptrow.setAttribute("showTip", true);
            cptrow.style.width = "10px";
            cptrow.style.height = 0 + "px";
            cptrow.style.border = "solid 0px #f8c713";
            cptrow.style.position = "absolute";
            cptrow.style.overflow = "hidden";
            cptrow.style.background = "none repeat scroll 0 0 #f8c713";
            cptrow.style.left = 10 + 26*i + "px";
            cptrow.style.display = "block";
            cptrow.style.top = 200 + "px";
            cptrow.style.zIndex = "1";
            icArea.append(cptrow);
        }
    }

    for (var i = 0; i < 6; i++) {
        if(i == 0){
            var tity = document.createElement("div");
            tity.id = curPbx + "_outCalltity_"+i;
            tity.setAttribute("class", "tity");
            tity.style.width = "50px";
            tity.style.position = "absolute";
            tity.style.top = (36 * i) -5 + "px";
            tity.style.left = "-40px";
            tity.innerHTML = "数量/个";
            ic.append(tity);
        } else {
            var tity = document.createElement("div");
            tity.id = curPbx + "_outCalltity_"+i;
            tity.setAttribute("class", "tity");
            tity.style.width = "35px";
            tity.style.position = "absolute";
            tity.style.top = (36 * i) -21 + "px";
            tity.style.left = "-18px";
            tity.innerHTML = 6 - i;
            ic.append(tity);

            var liney = document.createElement("div");
            liney.id = curPbx + "_outCallliney_" + i;
            liney.setAttribute("class", "liney");
            liney.style.width = "620px";
            liney.style.position = "absolute";
            liney.style.borderTop = "1px dotted #B9B9B9";
            liney.style.height = "1px";
            liney.style.overflow = "hidden";
            liney.style.top = (36 * i) -16 + "px";
            liney.style.left = "0px";
            icArea.append(liney);
        }
    }
}

function _softphonebar_toDrawingOutCallChart(outCalls, outCallsPerHour, outCompletePerHour, curPbx){
    if(outCalls != 0){
        var outCallSumArray,outCallCptArray = [];
        outCallSumArray = outCallsPerHour.split(",");
        outCallCptArray = outCompletePerHour.split(",");
        var outCallMax = 0;
        for(var i=0; i<24; i++){
            outCallMax = Math.max(outCallMax, outCallSumArray[i]);
        }
        var b = outCallMax%5;
        var mainLength = outCallMax - b + 5;
        var offsetCall = mainLength/5;
        var topOffsetPercent = 180/mainLength;

        for(var i=0; i<24; i++){
            var sumrow = document.getElementById(curPbx + "_outCallsumrow_" + i);
            sumrow.setAttribute("call", outCallSumArray[i]);
            sumrow.style.height = Math.round(topOffsetPercent*outCallSumArray[i]) + "px";
            sumrow.style.top = 200 - Math.round(topOffsetPercent*outCallSumArray[i]) + "px";

            var cptrow = document.getElementById(curPbx + "_outCallcptrow_" + i);
            cptrow.setAttribute("call", outCallCptArray[i]);
            cptrow.style.height = Math.round(topOffsetPercent*outCallCptArray[i]) + "px";
            cptrow.style.top = 200 - Math.round(topOffsetPercent*outCallCptArray[i]) + "px";
        }
        for (var i = 1; i < 6; i++) {
            var tity = document.getElementById(curPbx + "_outCalltity_"+i);
            var temp = offsetCall * ( 6 - i );
            tity.innerHTML = temp;
        }
    }
}

function _softphonebar_toShowOutCallChart(curPbx) {
    var outcalls = $("#" + curPbx + "_TwentyFourHourOutCallChartArea div");
    outcalls.each(function(i, outcall) {
        if(!outcall.getAttribute("showTip"))
            return;
        outcall.onmouseover = function(){
            var temp = this.id.split("_");
            var hour = temp[temp.length - 1];
            var type = temp[temp.length - 2];
            var pbx = this.id.substr(0, this.id.indexOf(type) - 1);

            var times = this.getAttribute("call");
            var tipMessage = "";

            if(type == "outCallsumrow" ){
                tipMessage = "今日" + hour + "时呼出" + times;

            }else if(type =="outCallcptrow"){
                tipMessage = "今日" + hour + "时呼通" + times;
            }

            var liney = document.getElementById(pbx + "_outCallMouseTip");
            if(!liney) {
                liney = document.createElement("div");
                liney.id = curPbx + "_outCallMouseTip";
                liney.style.position = "absolute";
                liney.style.border = "1px dotted #FFFF99";
                //liney.style.height = "18px";
                liney.style.padding = "3px";
                liney.style.overflow = "hidden";
                liney.style.background = "none repeat scroll 0 0 #f8c713";
                liney.style.textAlign = "center";
                liney.style.zIndex = "2";
                var area = $("#" + pbx + "_TwentyFourHourOutChart");
                area.append(liney);
            }
            liney.innerHTML = tipMessage;
            liney.style.top = $(this).position().top - 18+"px";
            liney.style.left = $(this).position().left + 5 + "px";
            liney.style.visibility = "visible";

            var timeText = document.getElementById(pbx + "_outCalltimerow_" + hour);
            if(timeText){
                timeText.style.background = "none repeat scroll 0 0 #f8c713";
            }
        };
        outcall.onmouseout = function(){
            var temp = this.id.split("_");
            var type = temp[temp.length - 2];
            var hour = temp[temp.length - 1];
            var pbx = this.id.substr(0, this.id.indexOf(type) - 1);
            var liney = document.getElementById(pbx + "_outCallMouseTip");
            if(liney) {
                liney.style.visibility = "hidden";
            }
            var timeText = document.getElementById(pbx + "_outCalltimerow_" + hour);
            if(timeText){
                timeText.style.background = "";
            }
        };
    });
}

function _softphonebar_toDrawingTodayPandectChart(inCalls, inComplete, outCalls, outComplete, curPbx) {
    $("#" + curPbx + "_today_call_sum").html("今日呼叫总量：" + (inCalls + outCalls));
    $("#" + curPbx + "_today_call_in_sum").html("呼入总量：" + inCalls);
    $("#" + curPbx + "_today_call_out_sum").html("呼出总量：" + outCalls);
    if(inCalls == 0) {
        $("#" + curPbx + "_todayChartInCallBox").html('<div class="callNullStyle" >呼入数据为空</div>');
    } else {
        var sinCallCpt,sinCallLst,inCallCpt,inCallLst;
        var perInComplete = Math.round((inComplete/inCalls)*100);
        if(perInComplete < 15){
            sinCallCpt = 15;
            sinCallLst = 85;
        }else if(perInComplete > 85){
            sinCallCpt = 85;
            sinCallLst = 15;
        }else{
            sinCallCpt = perInComplete;
            sinCallLst = 100 - perInComplete;
        }
        inCallCpt = perInComplete.toString();
        inCallLst = (100 - perInComplete).toString();
        $("#" + curPbx + "_todayChartInCallBox").html('<div id="'+curPbx+'_today_call_in_success" class="todayCallInSuccess" style="width:' + sinCallCpt + '%;" >'
            + inComplete + '(' + inCallCpt + '%)' + '</div><div id="' + curPbx + '_today_call_in_failure" style="width:'
            + sinCallLst + '%;" class="todayCallInFailure" >' + (inCalls - inComplete) + '(' + inCallLst + '%)' + '</div>');
    }
    if(outCalls == 0){
        $("#" + curPbx + "_todayChartOutCallBox").html('<div class="callNullStyle" >呼出数据为空</div>');
    } else {
        var soutCallCpt,soutCallLst,outCallCpt,outCallLst;
        var perOutComplete = Math.round((outComplete/outCalls)*100);
        if(perOutComplete < 15){
            soutCallCpt = 15;
            soutCallLst = 85;
        }else if(perOutComplete > 85){
            soutCallCpt = 85;
            soutCallLst = 15;
        }else{
            soutCallCpt = perOutComplete;
            soutCallLst = 100 - perOutComplete;
        }
        outCallCpt = perOutComplete.toString();
        outCallLst = (100 - perOutComplete).toString();
        $("#" + curPbx + "_todayChartOutCallBox").html('<div id="' + curPbx + '_today_call_out_success" class="todayCallOutSuccess" style="width:' + soutCallCpt + '%;" >' + outComplete + '(' + outCallCpt + '%)' + '</div><div id="' + curPbx + '_today_call_out_failure" style="width:' + soutCallLst + '%;" class="todayCallOutFailure">' + (outCalls - outComplete) + '(' + outCallLst + '%)' + '</div>');
    }
}