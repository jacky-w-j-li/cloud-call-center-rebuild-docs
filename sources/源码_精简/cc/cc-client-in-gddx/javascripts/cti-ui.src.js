/**
 * Created by chenguang on 9/18/15.
 */
var _cti_ui_state = new Array();
var _cti_ui_desc = new Array();

var _cti_ui_countTimer = 0;
var _cti_ui_calculagraph;
var _cti_ui_otherstateref;
var _cti_ui_curstateref;
var _cti_ui_timestateref;
var _cti_ui_callstateref;
var _softphone_phonestate_dropdown;
var _cti_ui_dialogBoxRemain = 40000;
var _cti_ui_notifyDialogInterval;
var  softphonebar_count = 0;
var _cti_ui_monitorTimersHandle;
var _cti_ui_monitorTimers = [];
var _softphoneBar_replaceAll = new RegExp("\\.","g");
var _softphoneBar_replaceAll_bak = new RegExp("\\_","g");
var _cti_ui_peer_index = 0;
var _cti_ui_queue_index = 0;
var _cti_ui_serviceNo_index = 0;
var _cti_ui_all_queue_obj = {};
var _cti_ui_last_state;

_cti_ui_desc["unregister"] = "未连接";
_cti_ui_desc["peerstate"] = "空闲";
_cti_ui_desc["dialing"] = "呼叫中";
_cti_ui_desc["innerDialing"] = "呼叫中";
_cti_ui_desc["belling"] = "来电振铃";
_cti_ui_desc["innerBelling"] = "来电振铃";
_cti_ui_desc["listening"] = "监听振铃";
_cti_ui_desc["talking"] = "普通通话";
_cti_ui_desc["threeWayTalking"] = "三方通话";
_cti_ui_desc["innerTalking"] = "内部通话";
_cti_ui_desc["dialTalking"] = "外呼通话";
_cti_ui_desc["listened"] = "监听中";
_cti_ui_desc["hold"] = "保持";
_cti_ui_desc["consultTalking"] = "普通通话";
_cti_ui_desc["dialTransfer"] = "外呼转接通话";
_cti_ui_desc["transfer"] = "转接通话";
_cti_ui_desc["offline"] = "离线接听";
_cti_ui_desc["ready"] = "签出";
_cti_ui_desc["transferBelling"] = "转接振铃";
_cti_ui_desc["transferDialing"] = "转接振铃";

_cti_ui_state["unregister"] = ["dialoutDisable", "transferDisable", "holdDisable", "threewayDisable", "SmsEnable"];
_cti_ui_state["peerstate"] = ["dialoutEnable", "transferDisable", "holdDisable", "threewayDisable", "consultDisable", "SmsEnable"];
_cti_ui_state["dialing"] = ["hangupEnable", "transferDisable", "holdDisable", "threewayDisable", "SmsEnable","setCallLabel"];
_cti_ui_state["innerDialing"] = ["hangupEnable", "transferDisable", "holdDisable", "threewayDisable", "SmsEnable"];
_cti_ui_state["belling"] = ["dialoutDisable", "transferDisable", "holdDisable", "threewayDisable", "SmsEnable"];
_cti_ui_state["innerBelling"] = ["dialoutDisable", "transferDisable", "holdDisable", "threewayDisable", "SmsEnable"];
_cti_ui_state["transferBelling"] = ["dialoutDisable", "transferDisable", "holdDisable", "threewayDisable", "SmsEnable"];
_cti_ui_state["transferDialing"] = ["dialoutDisable", "transferDisable", "holdDisable", "threewayDisable", "SmsEnable"];
_cti_ui_state["listening"] = ["hangupEnable", "SmsEnable"];
_cti_ui_state["talking"] = ["hangupEnable", "transferEnable", "holdEnable", "threewayDisable","ivrMenuEnable", "consultEnable", "InvestigateEnable", "SmsEnable","setCallLabel"];
_cti_ui_state["threeWayTalking"] = ["hangupEnable", "transferDisable", "holdDisable", "threewayDisable", "SmsEnable","setCallLabel"];
_cti_ui_state["innerTalking"] = ["hangupEnable", "transferDisable", "holdDisable", "threewayDisable", "SmsEnable"];
_cti_ui_state["dialTalking"] = ["hangupEnable", "transferEnable","ivrMenuEnable", "holdEnable", "threewayDisable", "consultEnable" , "InvestigateEnable", "SmsEnable","setCallLabel"];
_cti_ui_state["listened"] = ["hangupEnable", "SmsEnable"];
_cti_ui_state["hold"] = ["dialoutDisable", "recoverEnable", "transferDisable", "threewayDisable", "SmsEnable"];
_cti_ui_state["consultTalking"] = ["consultThreeWayCallEnable", "consultTransferEnable", "stopConsultEnable", "hangupEnable", "SmsEnable","setCallLabel"];
_cti_ui_state["transfer"] = ["hangupEnable", "holdEnable", "transferEnable", "consultEnable", "InvestigateEnable", "ivrMenuEnable", "SmsEnable", "threewayDisable","setCallLabel"];
_cti_ui_state["dialTransfer"] = ["hangupEnable", "holdEnable", "transferEnable", "consultEnable", "InvestigateEnable", "ivrMenuEnable", "SmsEnable", "threewayDisable","setCallLabel"];

function softphonebar_init() {
    _cti_ui_timestateref = $("#softphone_timer");
    _cti_ui_callstateref = $("#softphone_phonestate");
    _cti_ui_otherstateref = $("#softphone_otherstate");
    _softphone_phonestate_dropdown = $("#softphone_phonestate_dropdown");

    phone_registerEvent("toolbarupdate", _cti_ui_toolbarupdate);
    phone_registerEvent("transfering", _cti_ui_transfering);
    phone_registerEvent("ivrMenuTransfering", _cti_ui_ivrMenuTransfering);

    phone_registerEvent("EvtMonitorServiceNo", _cti_ui_onServiceNoChanged);
    phone_registerEvent("EvtMonitorQueue", _cti_ui_onQueueChanged);
    phone_registerEvent("EvtMonitorPeer", _cti_ui_onPeerChanged);
    phone_registerEvent("EvtEndListen", _cti_ui_onEndListen);
    phone_registerEvent("EvtAccountCalls", _cti_ui_onAccountCalls);

    phone_registerEvent("EvtRing", _cti_ui_evtRing);

    //$("#dialout_input_pop").live("focus", function (e) {
    //    var phoneCookie = DS.getCookie("phoneNum");
    //    //_cti_ui_Autocomplete(phoneCookie);
    //    _cti_ui_Autocomplete_new(phoneCookie);
    //});

    $("#dialout_input_pop").live("focus", function () {
        if($("#phone-num-autoComplate").css("display")=="none"){
            $("#cdr_history-item").show();
        }
    });
}

function _cti_ui_toolbarupdate(event, state, timestamp) {
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
//        $("#softphonebar_callState").html(_cti_ui_desc[state]);
//    }
//    $("#softphonebar_states").html(stateHtml + dropdownHtml);
    if(!_cti_ui_last_state){
        _cti_ui_last_state = state;
    }
    _cti_ui_switchState(state, timestamp);
}

function _cti_ui_switchState(state, timestamp) {
    $("#softphone-bar #phone_bar .phone_btn_action").each(function() {
        var id = $(this).attr("id");
        if(_cti_ui_state[state].indexOf(id) < 0) {
            $(this).css('display', 'none');
        } else {
            $(this).css('display', 'inline-block');
        }
    });
    if(state == "unregister") {
        softphonebar_show_icon('unregister');
        _cti_ui_timestateref.css('display', 'none');
    } else {
        _cti_ui_timestateref.css('display', 'inline-block');
    }

    _softphone_phonestate_dropdown.find("a:first-child").removeClass('btn-success').removeClass('btn-warning').addClass('btn-danger');
    _cti_ui_callstateref.css("color", "#FFFFFF");

    var resetTimer = false;
    if(state == "peerstate") {
        if(_cti_ui_last_state != state){
            resetTimer = true;
        }
        softphonebar_show_icon('busy');
        $('#dialout_input').empty();
        if(phone_data.busyType == "99") {
            _cti_ui_systemBusy();
            _cti_ui_callstateref.css("padding-right", "8px");
        } else if(phone_data.busyType == "0") {
            _softphone_phonestate_dropdown.find("a:first-child").removeClass('btn-danger').removeClass('btn-warning').addClass('btn-success');
            _cti_ui_callstateref.css("color", "#FFFFFF");
            _cti_ui_callstateref.css("padding-right", "12px");
            softphonebar_show_icon('idle');
        }
        var html = "";
        _cti_ui_callstateref.html(phone_data.phonebarConfig[phone_data.busyType]);
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
        _cti_ui_otherstateref.html(html);
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

        _cti_ui_callstateref.html(_cti_ui_desc[state]);
        if(state == 'hold'){
            _cti_ui_callstateref.css("padding-right", "20px");
        }else{
            _cti_ui_callstateref.css("padding-right", "8px");
        }
        $("#softphone_phonestate_dropdown .caret").css('display', 'none');
        $("#softphone_phonestate_dropdown .state_line").css('display', 'none');
    }
    if($("#dialoutEnable").is(":hidden")){
        $(".dialoutPopoverHtml").popover('hide');
    }
    if(phone_data.busyType == "99"){
        _softphonebar_countTimer = 0;
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
            _cti_ui_countTimer = 0;
        else
            _cti_ui_countTimer = oldTime;
    } else {
        if(resetTimer){
            _cti_ui_countTimer = 0;
        }
    }
    if(_cti_ui_calculagraph != null)
        window.clearInterval(_cti_ui_calculagraph);
    _cti_ui_calculagraph = window.setInterval(function(){
        _cti_ui_doCallTimer();
    }, 1000);
    _cti_ui_last_state = state;
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
   /* if(isHasFunc("func_dial_popup")){
        handler.call.showDialPopupCust(phoneNum);
    }*/
    phone_dialout(phoneNum,cdrVariable);
    _cti_ui_phonenumRember(phoneNum);
    $("#dialout_input").html(desc);

    $(".dialoutPopoverHtml").popover('hide');
}

function softphonebar_dialout(phoneNum,cdrVariable) {
    phoneNum = utils.strTrimAll(phoneNum);
    phoneNum=getEncryptTel(phoneNum);
    //console.info("phoneNum===="+phoneNum)
    phone_dialout(phoneNum,cdrVariable);

    var desc=checkHideTel(phoneNum);
    $("#dialout_input").val(desc);
    $("#dialout_input").html(desc);
    $(".dialoutPopoverHtml").popover('hide');
}

function softphonebar_transfer(phoneNum) {
    if(/^\d+$/.test(phoneNum)) {
        phone_transfer("9" + phoneNum, "number");
    } else {
        $().alertmessage('showError', '座席不存在或座席输入不正确');
    }
}

function softphonebar_consult(phoneNum) {
    if(/^\d+$/.test(phoneNum)) {
        phone_consult("9" + phoneNum, "number");
    } else {
        $().alertmessage('showError', '座席不存在或座席输入不正确');
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

function _cti_ui_showTranster(destExten) {
    _cti_ui_dialogBoxRemain = 40000;
    softphonebar_count = 1;
    var bodyMsg = "<div style='height:20px;overflow:hidden;text-align:center'>" +
        "<img src='./img/client/loading.gif' style='float:left;margin-top:5px;' />" +
        "<div id='softphonebar.msg' style='float:left;color:#666666;padding-left:5px;'></div>" +
        "<div style='clear:both;height:1px;overflow:hidden'>&nbsp;</div></div>";
    utils.showBox(310, 40, bodyMsg);
    _cti_ui_notifyDialogInterval = setInterval(function(){
        var cancelHtml = "<a href=\"javascript:phone_cancelTransfer();\" style=\"margin-left:3px;cursor:pointer;font-weight:bold;color:red;text-decoration:underline;\">取消</a>";
        _cti_ui_checkLoadingHide(destExten, cancelHtml);
    }, 1000);
}

function _cti_ui_checkLoadingHide(destExten, cancelHtml) {
    var count = softphonebar_count ++;
    var html = "正在等待<span style='color:#3fb23f;font-weight:bold'>"+destExten+ "</span>接听，" + "请稍后<span style='font-weight:bold'>(00:" + (count<10?("0"+count):count) +")</span>" + cancelHtml;
    document.getElementById("softphonebar.msg").innerHTML = html;
    if(_cti_ui_dialogBoxRemain <= 0){
        softphonebar_close();
    }
    _cti_ui_dialogBoxRemain -= 1000;
}

function softphonebar_close() {
    if(_cti_ui_notifyDialogInterval)
        clearInterval(_cti_ui_notifyDialogInterval);
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
    if($('#softphone_investigate'))
        $('#softphone_investigate').modal('hide');
}

function _cti_ui_transfering(event, value) {
    if(value == "TransferSuccess") {
        softphonebar_close();
        utils.showSucc("转接成功");
    } else if (value == "TransferFailed") {
        softphonebar_close();
        utils.showError("转接失败");
    }
}

function _cti_ui_showToMenu(displayname) {
    _cti_ui_dialogBoxRemain = 40000;
    softphonebar_count = 1;
    var bodyMsg = "<div style='height:20px;overflow:hidden;text-align:center'>" +
        "<img src='./img/client/loading.gif' style='float:left;margin-top:5px;' />" +
        "<div id='softphonebar.msg' style='float:left;color:#666666;padding-left:5px;'></div>" +
        "<div style='clear:both;height:1px;overflow:hidden'>&nbsp;</div></div>";
    utils.showBox(310, 40, bodyMsg);
    _cti_ui_notifyDialogInterval = setInterval(function(){
        _cti_ui_checkMenuLoadingHide(displayname, "");
    }, 1000);
}

function _cti_ui_checkMenuLoadingHide(destExten, cancelHtml) {
    var count = softphonebar_count ++;
    var html = "正在等待转<span style='color:#3fb23f;font-weight:bold'>"+destExten+ "</span>，" + "请稍后<span style='font-weight:bold'>(00:" + (count<10?("0"+count):count) +")</span>" + cancelHtml;
    document.getElementById("softphonebar.msg").innerHTML = html;
    if(_cti_ui_dialogBoxRemain <= 0){
        softphonebar_close();
    }
    _cti_ui_dialogBoxRemain -= 1000;
}

function _cti_ui_ivrMenuTransfering(event, json){
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

function _cti_ui_showConsult(destExten) {
    _cti_ui_dialogBoxRemain = 40000;
    softphonebar_count = 1;
    var bodyMsg = "<div style='height:20px;overflow:hidden;text-align:center'>" +
        "<img src='./img/client/loading.gif' style='float:left;margin-top:5px;' />" +
        "<div id='softphonebar.msg' style='float:left;color:#666666;padding-left:5px;'></div>" +
        "<div style='clear:both;height:1px;overflow:hidden'>&nbsp;</div></div>";
    utils.showBox(310, 40, bodyMsg);
    _cti_ui_notifyDialogInterval = setInterval(function(){
        _cti_ui_checkLoadingHide(destExten, "");
    }, 1000);
}

function _cti_ui_onServiceNoChanged(event, monitorServiceNo) {
    if(!monitorServiceNo || !monitorServiceNo.serviceNo)
        return;
    var curRow = $("#monitor_serviceNo_" + monitorServiceNo.serviceNo);
    if(curRow.html() == null) {
        _cti_ui_createRow(monitorServiceNo, 'serviceNo');
    } else {
        _cti_ui_updateRow(monitorServiceNo, curRow, 'serviceNo');
    }

    _cti_ui_monitoringOnServiceNoChanged(monitorServiceNo);
}

function _cti_ui_onQueueChanged(event, monitorQueue, type) {
    if(!monitorQueue || !monitorQueue.queueId)
        return;
    var curRow = $("#monitor_queue_" + monitorQueue.queueId);
    if(curRow.html() == null) {
        _cti_ui_createRow(monitorQueue, 'queueId');
    } else {
        _cti_ui_updateRow(monitorQueue, curRow, 'queueId')
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
    _cti_ui_queue(monitorQueue);
}

function _cti_ui_queue(queue) {
//    console.info("_cti_ui_queue========");
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
        _cti_ui_all_queue_obj[queue.queueId] = queue.queueWaitCount;
        var maqCount = 0;
        $.each(_cti_ui_all_queue_obj, function(key, val){
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

function _cti_ui_onPeerChanged(event, monitorPeer) {
    if(!monitorPeer || !monitorPeer.userId)
        return;
    if(monitorPeer.user.indexOf("admin") != -1)
        return;
    if(session.user.type != "admin" && session.user.scope.call  != 'all'){
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
        _cti_ui_createRow(monitorPeer, 'userId');
    } else {
        _cti_ui_updateRow(monitorPeer, curRow, 'userId')
    }
    var accontcallouts = 0;
    var acountcalloutcomplete = 0;
    for(var i in phone_peers){
        var item = phone_peers[i];
        accontcallouts += item.OutCalls;
        acountcalloutcomplete += item.OutComplete;
    }
    $("#monitor_account tbody").html("<tr><td>"+accontcallouts+"</td><td>"+acountcalloutcomplete+"</td></tr>");

    _cti_ui_info(monitorPeer);
}

function _cti_ui_info(obj) {
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
    var dialoutTimeLength = _cti_ui_getDialoutTime(obj.DialoutTimeLength||0);
    var dialinTimeLength = _cti_ui_getDialoutTime(obj.DialinTimeLength||0);

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
        $('#workbench-inbound-dialinTime').html(_cti_ui_getTimerSimple(Math.ceil(obj.DialinTimeLength / 1000)));
        $('#workbench-inbound-averageDialinTime').html(_cti_ui_getTimerSimple(Math.ceil(obj.DialinTimeLength/1000/inComplete)));
    }
    if(obj.DialoutTimeLength != 0){
        $('#workbench-outbound-dialoutTime').html(_cti_ui_getTimerSimple(Math.ceil(obj.DialoutTimeLength / 1000)));
        $('#workbench-outbound-averageDialoutTime').html(_cti_ui_getTimerSimple(Math.ceil(obj.DialoutTimeLength/1000/outComplete)));
    }
}

function _cti_ui_monitorInit() {
    _cti_ui_peer_index = 0;
    _cti_ui_queue_index = 0;
    _cti_ui_serviceNo_index = 0;
    //init serviceNo
    if(phone_serviceNos) {
        for(var i in phone_serviceNos) {
            var item = phone_serviceNos[i];
            if(!item || !item.serviceNo)
                continue;
            var curRow = $("#monitor_serviceNo_" + item.serviceNo);
            if(curRow.html() == null) {
                _cti_ui_createRow(item, 'serviceNo');
            } else {
                _cti_ui_updateRow(item, curRow, 'serviceNo')
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
                _cti_ui_createRow(item, 'queueId');
            } else {
                _cti_ui_updateRow(item, curRow, 'queueId')
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
                _cti_ui_createRow(item, 'userId');
            } else {
                _cti_ui_updateRow(item, curRow, 'userId')
            }
            var accontcallouts = 0;
            var acountcalloutcomplete = 0;
            for(var i in phone_peers){
                var item = phone_peers[i];
                accontcallouts += item.OutCalls;
                acountcalloutcomplete += item.OutComplete;
            }
            $("#monitor_account tbody").html("<tr><td>"+accontcallouts+"</td><td>"+acountcalloutcomplete+"</td></tr>");
            _cti_ui_info(item);
        }
    }
    _cti_ui_setInterval();
    _cti_ui_loadMonitorAgent();
    _cti_ui_loadMonitorAgentState();
    for(var i in phone_pbxs) {
        _cti_ui_updatePeerNum(i);
    }
}

function softphonebar_getpbxid(pbx) {
    return pbx.replace(_softphoneBar_replaceAll, "_");
}

function _cti_ui_getpbx(pbxid) {
    return pbxid.replace(_softphoneBar_replaceAll_bak, ".");
}

function _cti_ui_createRow(item, key) {
    if(key == 'serviceNo') {
        var tdHtml = "";
        if(item.displayName && item.displayName != ''){
            tdHtml += "<tr id=\"monitor_serviceNo_"+ item.serviceNo+"\"><td>"+item.serviceNo+"（"+item.displayName+"）</td><td>"+item.inCalls+"</td><td>"+item.inLost+"</td><td>"+item.inComplete+"</td></tr>";
        }else{
            tdHtml += "<tr id=\"monitor_serviceNo_"+ item.serviceNo+"\"><td>"+item.serviceNo+"</td><td>"+item.inCalls+"</td><td>"+item.inLost+"</td><td>"+item.inComplete+"</td></tr>";
        }
        $('#monitor_serviceNo > tbody:last').append(tdHtml);
    } else if(key == 'queueId') {
        var tdHtml = "";
        var waitCountTd = "";
        if(item.queueWaitCount > 0) {
            waitCountTd = "<td style='color:red;'>"+item.queueWaitCount+"</td>";
        } else {
            waitCountTd = "<td>"+item.queueWaitCount+"</td>";
        }
        tdHtml += "<tr id=\"monitor_queue_" + item.queueId + "\"><td class=\"ellipsis\" title=\""+item.queueName+"\">"+item.queueName+"</td><td>"+item.idleAgentCount+"</td><td class=\"ellipsis\" title=\""+_cti_ui_getQueuePeer(item)+"\">"+item.totalAgentCount + _cti_ui_getQueuePeer(item) +"</td>" +
            waitCountTd + "<td>"+(item.totalCalls - item.abadonedCalls)+"</td></tr>";
        $('#monitor_queue > tbody:last').append(tdHtml);
    } else if(key == 'userId') {
        var tdHtml = "";
        var claim = im_agents[item.userId]?im_agents[item.userId].claim:0;
        var dealing = im_agents[item.userId]?im_agents[item.userId].dealing:0;
        var autoClaim = im_agents[item.userId]?im_agents[item.userId].autoClaim:undefined;
        var mailAutoClaim = im_agents[item.userId]?im_agents[item.userId].mailAutoClaim:undefined;

        tdHtml += "<tr id=\"monitor_peer_" + item.userId+"\"><td class=\"ellipsis\" title='"+item.DisplayName+"'>"+item.DisplayName+"</td><td>"+item.exten+"</td>" +
            "<td class='smmtd'>"+_cti_ui_displayExtenType(item)+"</td>" +
            "<td class='cdr-status'>" + _cti_ui_displayStatus(item) + "</td><td id=\""+item.userId+"_timer\"></td><td>" + _cti_ui_getDialoutTime(item.DialoutTimeLength) + "</td><td class=\"ellipsis\" title=\""+_cti_ui_displayQueueName(item.queueName)+"\">" + _cti_ui_displayQueueName(item.queueName) + "</td>" +
            "<td>"+item.callNo+"</td>" +
            "<td class='smtd'>"+item.InComplete+"</td><td class='smtd'>"+item.OutCalls+"</td><td class='smtd'>"+item.OutComplete+"</td>"+
            "<td class='im_monitor_agent_claim smtd'>" + claim+ "</td>" +
            "<td class='im_monitor_agent_dealing smtd'>" + dealing  + "</td>" +
            "<td class='im_monitor_agent_autoClaim smtd'>" + render.monitor.renderAutoClaimDispaly(autoClaim)  + "</td>" +
            "<td class='im_monitor_agent_mailAutoClaim smtd'>" + render.monitor.renderAutoClaimDispaly(mailAutoClaim)  + "</td>" +
            "<td class='cdr-operation'><div class='op-group'><ul><li id=\""+item.userId+"_listen_disable\" class=\"disabled\">监听</li>" +
            "<li id=\""+item.userId+"_listen\" style=\"display:none;\" onclick=\"_cti_ui_listen('"+item.channel+"', '"+item.userId+"')\">监听</li>" +
            "<li id=\""+item.userId+"_endlisten\" style=\"display:none;\" onclick=\"_cti_ui_endListen()\">结束监听</li>" +
            "<li id=\""+item.userId+"_forceHangup_disable\" class=\"disabled\">强拆</li>" +
            "<li id=\""+item.userId+"_forceHangup\" style=\"display:none;\" onclick=\"_cti_ui_forceHangup('"+item.channel+"', '" + item.pbx + "')\">强拆</li>" +
            "<li id=\""+item.userId+"_loot_disable\" class=\"disabled\">抢接</li>" +
            "<li id=\""+item.userId+"_loot\" style=\"display:none;\" onclick=\"_cti_ui_loot('"+item.linkedChannel+"')\">抢接</li>" +
            "<li id=\""+item.userId+"_kick_disable\" class=\"disabled\">签出</li>" +
            "<li id=\""+item.userId+"_kick\" style=\"display:none;\" onclick=\"_cti_ui_kick('"+item.userId+"')\">签出</li>" +
            "<li id=\""+item.userId+"_pick_disable\" class=\"disabled\">签入手机</li>" +
            "<li id=\""+item.userId+"_pick\" style=\"display:none;\" onclick=\"_cti_ui_pick('"+item.userId+"')\">签入手机</li>" +
            "<li id=\""+item.userId+"_pick_gateway_disable\" class=\"disabled\">签入SIP话机</li>" +
            "<li id=\""+item.userId+"_pick_gateway\" style=\"display:none;\" onclick=\"_cti_ui_pick('"+item.userId+"','gateway')\">签入SIP话机</li>" +
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
            _cti_ui_monitorTimers[item.userId]= countTimer;
        }

        _cti_ui_controlMonitor(item);
    }
}

function _cti_ui_updateRow(item, curRow, key) {
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
        var tdHtml = "<td class=\"ellipsis\" title=\""+item.queueName+"\">"+item.queueName+"</td><td>"+item.idleAgentCount+"</td><td class=\"ellipsis\" title=\""+_cti_ui_getQueuePeer(item)+"\">"+item.totalAgentCount + _cti_ui_getQueuePeer(item) +"</td>" + waitCountTd + "<td>"+(item.totalCalls - item.abadonedCalls)+"</td>";
        curRow.html(tdHtml);
    } else if(key == 'userId') {
        var tdHtml = "<td class=\"ellipsis\" title='"+item.DisplayName+"'>"+item.DisplayName+"</td><td>"+item.exten+"</td><td class='smmtd'>"+_cti_ui_displayExtenType(item)+"</td>" +
            "<td class='cdr-status'>" + _cti_ui_displayStatus(item) + "</td><td id=\""+item.userId+"_timer\"><td>" + _cti_ui_getDialoutTime(item.DialoutTimeLength) + "</td><td class=\"ellipsis\" title=\""+_cti_ui_displayQueueName(item.queueName)+"\">" + _cti_ui_displayQueueName(item.queueName) + "</td>" +
            "</td><td>"+item.callNo+"</td>" +
            "<td class='smtd'>"+item.InComplete+"</td><td class='smtd'>"+item.OutCalls+"</td><td class='smtd'>"+item.OutComplete+"</td>"+
            "<td class='im_monitor_agent_claim smtd'>" + im_agents[item.userId].claim + "</td>" +
            "<td class='im_monitor_agent_dealing smtd'>" + im_agents[item.userId].dealing  + "</td>" +
            "<td class='im_monitor_agent_autoClaim smtd'>" + render.monitor.renderAutoClaimDispaly(im_agents[item.userId].autoClaim)  + "</td>" +
            "<td class='im_monitor_agent_mailAutoClaim smtd'>" + render.monitor.renderAutoClaimDispaly(im_agents[item.userId].mailAutoClaim)  + "</td>" +
            "<td class='cdr-operation'><div class='op-group'><ul><li id=\""+item.userId+"_listen_disable\" class=\"disabled\">监听</li>" +
            "<li id=\""+item.userId+"_listen\" style=\"display:none;\" onclick=\"_cti_ui_listen('"+item.channel+"', '"+item.userId+"')\">监听</li>" +
            "<li id=\""+item.userId+"_endlisten\" style=\"display:none;\" onclick=\"_cti_ui_endListen()\">结束监听</li>" +
            "<li id=\""+item.userId+"_forceHangup_disable\" class=\"disabled\">强拆</li>" +
            "<li id=\""+item.userId+"_forceHangup\"  style=\"display:none;\" onclick=\"_cti_ui_forceHangup('"+item.channel+"', '" + item.pbx + "')\">强拆</li>" +
            "<li id=\""+item.userId+"_loot_disable\" class=\"disabled\">抢接</li>" +
            "<li id=\""+item.userId+"_loot\" style=\"display:none;\" onclick=\"_cti_ui_loot('"+item.linkedChannel+"')\">抢接</li>" +
            "<li id=\""+item.userId+"_kick_disable\" class=\"disabled\">签出</li>" +
            "<li id=\""+item.userId+"_kick\" style=\"display:none;\" onclick=\"_cti_ui_kick('"+item.userId+"')\">签出</li>" +
            "<li id=\""+item.userId+"_pick_disable\" class=\"disabled\">签入手机</li>" +
            "<li id=\""+item.userId+"_pick\" style=\"display:none;\" onclick=\"_cti_ui_pick('"+item.userId+"')\">签入手机</li>" +
            "<li id=\""+item.userId+"_pick_gateway_disable\" class=\"disabled\">签入SIP话机</li>" +
            "<li id=\""+item.userId+"_pick_gateway\" style=\"display:none;\" onclick=\"_cti_ui_pick('"+item.userId+"','gateway')\">签入SIP话机</li></ul></div>" +
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
            _cti_ui_monitorTimers[item.userId] = countTimer;
        } else {
            delete _cti_ui_monitorTimers[item.userId];
            $("#" + item.userId + "_timer").text("");
        }
        _cti_ui_controlMonitor(item);
        //_cti_ui_updatePeerNum(item.pbx);
    }
}
/* 加载座席 */
function _cti_ui_loadMonitorAgent(){
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

/* 加载座席状态 */
function _cti_ui_loadMonitorAgentState(){

    var users =new Array();
    for(var i in phone_data.phonebarConfig) {
        var obj={_id:i,state:phone_data.phonebarConfig[i]};
        users.push(obj);
    }
    users.pop();
    var obj1={_id:"online",state:"在线"};
    var obj2={_id:"outline",state:"签出"};
    var obj3={_id:"outlinelistion",state:"离线接听"};
    users.push(obj3);
    users.push(obj1);
    users.push(obj2);
    utils.loadSearchInput({ id: "monitor_agent_state_owner_select_state",
        width: "120",
        height: "14",
        tip: "按状态搜索",
        data: users,
        listField: ["state"],
        userIdField: "_id",
        showAllList: true,
        callbackFuc: function (object) {
            $("#monitor_agent_state_user_input").val(object._id);
            $("#monitor_agent_state_owner_select_state_input").val(object.state);

            softphonebar_select();
        },
        onKeyChanged: function () {
            if ($("#monitor_agent_state_owner_select_state_input").val() != "") {
                $("#monitor_agent_state_user_input").val("serachInputNoresult");
            } else {
                $("#monitor_agent_state_user_input").val("");
                softphonebar_select();
            }
        }
    });
}
/* 加载座席状态 */
function _cti_ui_loadMonitorAgentState(){

    var users =new Array();
    for(var i in phone_data.phonebarConfig) {
        var obj={_id:i,state:phone_data.phonebarConfig[i]};
        users.push(obj);
    }
    users.pop();
    var obj1={_id:"online",state:"在线"};
    var obj2={_id:"outline",state:"签出"};
    var obj3={_id:"outlinelistion",state:"离线接听"};
    users.push(obj3);
    users.push(obj1);
    users.push(obj2);
    utils.loadSearchInput({ id: "monitor_agent_state_owner_select_state",
        width: "120",
        height: "14",
        tip: "按状态搜索",
        data: users,
        listField: ["state"],
        userIdField: "_id",
        showAllList: true,
        callbackFuc: function (object) {
            $("#monitor_agent_state_user_input").val(object._id);
            $("#monitor_agent_state_owner_select_state_input").val(object.state);

            softphonebar_select();
        },
        onKeyChanged: function () {
            if ($("#monitor_agent_state_owner_select_state_input").val() != "") {
                $("#monitor_agent_state_user_input").val("serachInputNoresult");
            } else {
                $("#monitor_agent_state_user_input").val("");
                softphonebar_select();
            }
        }
    });
}
/* 监控筛选显示座席 */
function softphonebar_select() {

    var agents = new Array();
    var choose_agent = document.getElementById("monitor_agent_state_owner_select_input");
    var choose_state = document.getElementById("monitor_agent_state_owner_select_state_input");

    var choose_state = document.getElementById("monitor_agent_state_owner_select_state_input");
    var choose_agent_id = choose_agent.value;
    var choose_state_str = choose_state.value;

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

    _cti_ui_showAgentsChange(agents,choose_state_str);
}
function _cti_ui_showAgentsChange(agents,states) {
    var trs = $("table[id=monitor_peer] > tbody").children("tr");
    var users =new Array();
    for(var i in phone_data.phonebarConfig) {
        users.unshift(phone_data.phonebarConfig[i]);
    }
    users.shift();
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
        var tds=tr.childNodes[3];
        var userid = trs[i].id.replace("monitor_peer_", "");
        var state = states;
        if(!states){
            state=tds.innerText;
        }
        if(states == "在线"){
            if (userid && ifInclude(userid)&&tds.innerText) {
                for(var j=0;j<users.length;j++){
                    if(tds.innerText == users[j]){
                        $(tr).css("display", "");
                    }else {
                        $(tr).css("display", "none");
                    }
                }
            } else {
                $(tr).css("display", "none");
            }
        }else{
            if (userid && ifInclude(userid) && tds.innerText && state == tds.innerText) {
                $(tr).css("display", "");
            } else {
                $(tr).css("display", "none");
            }
        }
        if(states == "在线"){
            if (userid && ifInclude(userid)&&tds.innerText) {
                for(var j=0;j<users.length;j++){
                    if(tds.innerText == users[j]){
                        $(tr).css("display", "");
                    }else {
                        $(tr).css("display", "none");
                    }
                }
            } else {
                $(tr).css("display", "none");
            }
        }else{
            if (userid && ifInclude(userid) && tds.innerText && state == tds.innerText) {
                $(tr).css("display", "").addClass("trvis");
            } else {
                $(tr).css("display", "none").removeClass("trvis");
            }
        }
    }
}
function _cti_ui_kick(userId) {
    phone_kick(userId);
}

function _cti_ui_pick(userId,extenType) {
    phone_pick(userId,extenType);
}

function _cti_ui_updatePeerNum(pbx) {
    var idleNum = 0;
    var totalNum = 0;
    var onlineNum = 0;
    for(var i in phone_peers) {
        var item = phone_peers[i];
        if(item.pbx != pbx)
            continue;
        var peerState = _cti_ui_displayStatus(item);
        if(item.user != null) {
            if(item.user.indexOf('admin') != -1) {
                continue;
            }
        }
        totalNum++;
        if(peerState != _cti_ui_desc["offline"]
            && peerState != _cti_ui_desc["unregister"]
            && peerState != _cti_ui_desc["ready"]) {
            onlineNum++;
            if(peerState.indexOf(_cti_ui_desc["peerstate"]) > 0) {
                idleNum++;
            }
        }
    }
    $("#monitor_countAll_" + softphonebar_getpbxid(pbx)).html(totalNum);
    $("#monitor_onlineCount_" + softphonebar_getpbxid(pbx)).html(onlineNum);
    $("#monitor_idleCount_" + softphonebar_getpbxid(pbx)).html(idleNum);
}

function _cti_ui_displayExtenType(peer) {
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

function _cti_ui_getQueuePeer(item) {
    var queue = phone_queues[item.queueId];
    var members;
    var curPeer;
    var tipTitle = "";
    if(queue) {
        members = queue.members;
        var hasNoName = false;
        for(var j in members) {
            curPeer = _cti_getUserFromSip(j);
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

function _cti_ui_displayStatus(peer) {
    var displayName = '';
    if(peer.login && peer.extenType != 'none') {
        if((peer.extenType == 'sip' || peer.extenType == 'gateway') && peer.register == false) {
            displayName = _cti_ui_desc["unregister"];
        } else if(peer.callStatus == 'Idle') {
//            console.info(phone_data.phonebarConfig[peer.busyType]);
            if(peer.busyType == "0")
                displayName = _cti_ui_getColor(phone_data.phonebarConfig[peer.busyType], "0");
            else
                displayName = _cti_ui_getColor(phone_data.phonebarConfig[peer.busyType], "1");
        } else if(peer.callStatus=='Ring') {
            displayName = _cti_ui_getColor(_cti_ui_desc["dialing"], "2");
        } else if(peer.callStatus=='Ringing') {
            displayName = _cti_ui_getColor(_cti_ui_desc["belling"], "2");
        } else if(peer.callStatus=='inner') {
            displayName = _cti_ui_getColor(_cti_ui_desc["innerTalking"], "2");
        } else if(peer.callStatus=='normal') {
            displayName = _cti_ui_getColor(_cti_ui_desc["talking"], "2");
        } else if(peer.callStatus=='dialout') {
            displayName = _cti_ui_getColor(_cti_ui_desc["dialTalking"], "2");
        } else if(peer.callStatus=='dialTransfer') {
            displayName = _cti_ui_getColor(_cti_ui_desc["dialTransfer"], "2");
        } else if(peer.callStatus=='transfer') {
            displayName = _cti_ui_getColor(_cti_ui_desc["transfer"], "2");
        } else if(peer.callStatus=='listen') {
            displayName = _cti_ui_getColor(_cti_ui_desc["listened"], "2");
        }
        //validate?
    } else if(peer.login && peer.extenType == 'none') {
        displayName = '';
    } else {
        if(peer.callStatus=='Ring') {
            displayName = _cti_ui_getColor(_cti_ui_desc["dialing"], "2");
        } else if(peer.callStatus=='Ringing') {
            displayName = _cti_ui_getColor(_cti_ui_desc["belling"], "2");
        } else if(peer.callStatus=='inner') {
            displayName = _cti_ui_getColor(_cti_ui_desc["innerTalking"], "2");
        } else if(peer.callStatus=='normal') {
            displayName = _cti_ui_getColor(_cti_ui_desc["talking"], "2");
        } else if(peer.callStatus=='dialout') {
            displayName = _cti_ui_getColor(_cti_ui_desc["dialTalking"], "2");
        } else if(peer.callStatus=='dialTransfer') {
            displayName = _cti_ui_getColor(_cti_ui_desc["dialTransfer"], "2");
        } else if(peer.callStatus=='transfer') {
            displayName = _cti_ui_getColor(_cti_ui_desc["transfer"], "2");
        } else if(peer.callStatus=='listen') {
            displayName = _cti_ui_getColor(_cti_ui_desc["listened"], "2");
        } else {
            if(!peer.login && (peer.extenType=='gateway' || peer.extenType=='Local')) {
                displayName = _cti_ui_desc["offline"];
            } else {
                displayName = _cti_ui_desc["ready"];
            }
        }
    }
    return displayName;
}

function _cti_ui_getColor(content, type) {
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

function _cti_ui_getInComCount(item) {
    return "普通来电数:"+ item.InComplete + "\r\n" + "转接来电数:" + item.TransferComplete;
}

function _cti_ui_displayQueueName(queueName) {
    if(queueName == undefined) {
        queueName = "";
    }
    //TODO
    return queueName;
}

function _cti_ui_setInterval() {
    if(_cti_ui_monitorTimersHandle) {
        window.clearInterval(_cti_ui_monitorTimersHandle);
    }
    _cti_ui_monitorTimersHandle = window.setInterval("_cti_ui_monitorDoCallTimer()", 1000);
}

function _cti_ui_monitorDoCallTimer() {
    if(_cti_ui_monitorTimers){
        for(var i in _cti_ui_monitorTimers) {
            var timerTd = $("#" + i + "_timer");
            if(timerTd != null) {
                timerTd.text(_cti_ui_getTimer(_cti_ui_monitorTimers[i].count));
                _cti_ui_monitorTimers[i].count++;
            }
        }
    }
}

function _cti_ui_getDialoutTime(dialoutLength) {
    var time = Math.ceil(dialoutLength / 1000);
    return _cti_ui_getTimer(time - 1);
}

function _cti_ui_getStatus(peer) {
    if(!peer.login && !(peer.extenType=='gateway' || peer.extenType=='Local')) {
        return "";
    } else {
        return peer.status;
    }
}

function _cti_ui_listen(curChannel, userId) {
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

function _cti_ui_endListen() {
    phone_hangup();
}

function _cti_ui_forceHangup(curChannel, pbx) {
    if(pbx == phone_data.pbx_in_ip)
        phone_hangupChannel(curChannel);
    else
        phone_hangupChannelFromPbx(curChannel, pbx);
}

function _cti_ui_loot(linkedChannel) {
    phone_loot(linkedChannel);
}

function _cti_ui_controlMonitor(peer) {
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
        || peer.userId == phone_data.userId || _cti_ui_isCalling(phone_data.userId) || !_cti_ui_isCalling(peer.userId)) {
        $("#" + peer.userId + "_loot_disable").css("display", "");
        $("#" + peer.userId + "_loot").css("display", "none");
    } else {
        $("#" + peer.userId + "_loot_disable").css("display", "none");
        $("#" + peer.userId + "_loot").css("display", "");
    }
    if(phone_data.extenType != "none" && peer.userId != phone_data.userId
        && !_cti_ui_isCalling(phone_data.userId)
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

function _cti_ui_monitoringInit() {
    for(var i in phone_pbxs) {
        var pbxid = i.replace(_softphoneBar_replaceAll, "_");
        //_cti_ui_initInCallChart(pbxid);
        //_cti_ui_initOutCallChart(pbxid);
    }
    if(phone_accountCalls) {
        for(var i in phone_accountCalls) {
            var accountCall = phone_accountCalls[i];
            if(accountCall) {
                var curPbxId = i.replace(_softphoneBar_replaceAll, "_");
                _cti_ui_toDrawingTodayPandectChart(accountCall.inCalls, accountCall.inComplete, accountCall.outCalls, accountCall.outComplete, curPbxId);
                _cti_ui_toDrawingInCallChart(accountCall.inCalls, accountCall.inCallsPerHour, accountCall.inCompletePerHour, curPbxId);
                //_cti_ui_toShowInCallChart(curPbxId);
                _cti_ui_toDrawingOutCallChart(accountCall.outCalls, accountCall.outCallsPerHour, accountCall.outCompletePerHour, curPbxId);
                //_cti_ui_toShowOutCallChart(curPbxId);
            }
        }
    }
    if(phone_serviceNos) {
        for(var i in phone_serviceNos) {
            var monitorServiceNo = phone_serviceNos[i];
            _cti_ui_toDrawingServiceNumberChart(monitorServiceNo.serviceNo , monitorServiceNo.inCalls , monitorServiceNo.inLost, monitorServiceNo.inComplete, (monitorServiceNo.pbx).replace(_softphoneBar_replaceAll, "_"));
        }

    }
    if(im_accessNos){
        for(var i in im_accessNos) {
            var monitoImAccessNO = im_accessNos[i];
            _cti_ui_toDrawingImAccessChart(monitoImAccessNO);
        }
    }
}

function _cti_ui_isCalling(userId) {
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

function _cti_ui_onEndListen(event) {
    for(var id in phone_peers) {
        if(_cti_ui_isCalling(id)) {
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

function _cti_ui_getTimer(countTimer) {
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


function _cti_ui_evtRing(event, callObject) {
    //console.dir(callObject);
    handler.call.call(callObject);
}


function _cti_ui_doCallTimer() {
    _cti_ui_timestateref.html(_cti_ui_getTimer(_cti_ui_countTimer));
    _cti_ui_countTimer ++;
}

function _cti_ui_getTimer(countTimer) {
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
function _cti_ui_getTimerSimple(countTimer) {
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
function _cti_ui_systemBusy() {
    var autoBusyTime = phone_data.autoBusyTime;
    if(autoBusyTime < 1)
        return;
    _cti_ui_callstateref.html(phone_data.phonebarConfig["99"]);
    if(_cti_ui_calculagraph != null) {
        window.clearInterval(_cti_ui_calculagraph);
    }
    _cti_ui_calculagraph = window.setInterval(function(){
        autoBusyTime--;
        _cti_ui_autoBusyTime(autoBusyTime);
    }, 1000);
}
function _cti_ui_autoBusyTime(autoBusyTime) {
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
    _cti_ui_timestateref.html(((hour<10)?("0"+hour):hour) + ":" + ((minute<10)?("0"+minute):minute) + ":" + ((second<10)?("0"+second):second));
}

//function _cti_ui_toDrawingServiceNumberChart(serviceNo , inCalls , inLost, inComplete, curPbx){
//    var sn = $("#" + curPbx + "_ServiceNumberChart");
//    if(serviceNo != undefined) {
//        var snChart = document.createElement("div");
//        if(inCalls == 0){
//            snChart.id = curPbx + "_snChart" + serviceNo;
//            snChart.setAttribute("class", "snChartItem");
//            snChart.style.background = "none repeat scroll 0 0 #ffffff";
//            snChart.innerHTML = '<div class="snChartNumber">服务号：' + serviceNo + '</div> <div class="snChartDiagram" style="text-align:center; border:dashed 1px #ccc; background-color:#f2f6fb;" > 1呼入数量为空  </div> <div class="snChartSum"> 总计：' + inCalls + '</div> <div class="clear"></div>';
//            sn.append(snChart);
//        }else if(inCalls == inComplete){
//            snChart.id = curPbx + "_snChart" + serviceNo;
//            snChart.setAttribute("class", "snChartItem");
//            snChart.style.background = "none repeat scroll 0 0 #ffffff";
//            snChart.innerHTML = '<div class="snChartNumber">服务号：' + serviceNo + '</div> <div class="snChartDiagram" > <div style="width:100%; "  class="snChartComplete">' +inComplete + " (100%)" + '</div> <div style="display:none; " class="snChartLost"></div> </div> <div class="snChartSum"> 总计：' + inCalls + '</div> <div class="clear"></div>';
//            sn.append(snChart);
//        }else if(inCalls == inLost){
//            snChart.id = curPbx + "_snChart" + serviceNo;
//            snChart.setAttribute("class", "snChartItem");
//            snChart.style.background = "none repeat scroll 0 0 #ffffff";
//            snChart.innerHTML = '<div class="snChartNumber">服务号：' + serviceNo + '</div> <div class="snChartDiagram" > <div style=" display:none;"  class="snChartComplete"></div> <div style="width:100%; " class="snChartLost">' + inLost + " (100%)" + '</div> </div> <div class="snChartSum"> 总计：' + inCalls + '</div> <div class="clear"></div>';
//            sn.append(snChart);
//        }else{
//            var sinCallCpt,sinCallLst,inCallCpt,inCallLst;
//            var perInComplete = Math.round((inComplete/inCalls)*100);
//            if(perInComplete < 15){
//                sinCallCpt = 15;
//                sinCallLst = 85;
//            }else if(perInComplete > 85){
//                sinCallCpt = 85;
//                sinCallLst = 15;
//            }else{
//                sinCallCpt = perInComplete;
//                sinCallLst = 100 - perInComplete;
//            }
//            inCallCpt = perInComplete.toString();
//            inCallLst = (100 - perInComplete).toString();
//
//            snChart.id = curPbx + "_snChart" + serviceNo;
//            snChart.setAttribute("class", "snChartItem");
//            snChart.style.background = "none repeat scroll 0 0 #ffffff";
//            snChart.innerHTML = '<div class="snChartNumber">服务号：' + serviceNo
//                + '</div> <div class="snChartDiagram" > <div style="width:' + sinCallCpt
//                + '%; "  class="snChartComplete">' +inComplete + " (" + inCallCpt + "%)"
//                + '</div> <div style="width:' + sinCallLst + '%; " class="snChartLost">'
//                + inLost + " (" + inCallLst + "%)" + '</div> </div> <div class="snChartSum"> 总计：'
//                + inCalls + '</div> <div class="clear"></div>';
//            sn.append(snChart);
//        }
//    }
//}
//

//图表监控改 服务号 多渠道
function _cti_ui_toDrawingServiceNumberChart(serviceNo , inCalls , inLost, inComplete, curPbx){
    var sn = $("#" + curPbx + "_ServiceNumberChart");
    if(serviceNo != undefined) {
        var snChart = document.createElement("div");
        if(inCalls == 0){
            snChart.id = curPbx + "_snChart" + serviceNo;
            snChart.setAttribute("class", "snChartItem row-fluid");
            snChart.style.background = "none repeat scroll 0 0 #ffffff";
            snChart.innerHTML = '<div class="snChartNumber col-xs-3 col-sm-3 col-md-3 col-lg-3">服务号：' + serviceNo + '</div><div class="col-xs-9 col-sm-9 col-md-9 col-lg-9"><div class="snChartDiagram" style="text-align:center; -webkit-border-radius: 10px;-moz-border-radius: 10px;border-radius: 10px; background-color:#eee;" >  </div> <div class="snChartSum"> 总数：' + inCalls + '</div></div><div class="clear"></div>';
            sn.append(snChart);
        }else if(inComplete == inCalls){
            snChart.id = curPbx + "_snChart" + serviceNo;
            snChart.setAttribute("class", "snChartItem");
            snChart.style.background = "none repeat scroll 0 0 #ffffff";
            snChart.innerHTML = '<div class="snChartNumber col-xs-3 col-sm-3 col-md-3 col-lg-3">服务号：' + serviceNo + '</div> <div class="col-xs-9 col-sm-9 col-md-9 col-lg-9"><div class="snChartDiagram" > <div style="width:100%; -webkit-border-radius: 10px;-moz-border-radius: 10px;border-radius: 10px;"  class="snChartComplete">接通数：' +inComplete + " (100%)" + '</div> <div style="display:none; " class="snChartLost"></div> </div> <div class="snChartSum"> 总数：' + inCalls + '</div> </div><div class="clear"></div>';
            sn.append(snChart);
        } else{
            var sinCallCpt,inCallCpt;
            var perInComplete = Math.round((inComplete/inCalls)*100);
            if(perInComplete < 20){
                sinCallCpt = 20;
            } else{
                sinCallCpt = perInComplete;
            }
            if(perInComplete>100){
                sinCallCpt = 100;
            }
            inCallCpt = perInComplete.toString();
            snChart.id = curPbx + "_snChart" + serviceNo;
            snChart.setAttribute("class", "snChartItem");
            snChart.style.background = "none repeat scroll 0 0 #ffffff";
            snChart.innerHTML = '<div class="snChartNumber col-xs-3 col-sm-3 col-md-3 col-lg-3">服务号：' + serviceNo
                + '</div> <div class="col-xs-9 col-sm-9 col-md-9 col-lg-9"><div class="snChartDiagram" > <div style="min-width: 135px;width:' + sinCallCpt
                + '%; "  class="snChartComplete">接通数：' +inComplete + " (" + inCallCpt + "%)"
                + '</div>  </div> <div class="snChartSum"> 总数：'
                + inCalls + '</div> </div><div class="clear"></div>';
            sn.append(snChart);
        };
    }
}
function _cti_ui_toDrawingServiceNumberChartUpdata(serviceNo , inCalls , inLost, inComplete, curPbx){
    if(serviceNo != undefined) {
        var snChart = $('#'+curPbx + "_snChart" + serviceNo)[0];
        if(inCalls == 0){
            snChart.setAttribute("class", "snChartItem");
            snChart.style.background = "none repeat scroll 0 0 #ffffff";
            snChart.innerHTML = '<div class="snChartNumber col-xs-3 col-sm-3 col-md-3 col-lg-3">服务号：' + serviceNo + '</div> <div class="col-xs-9 col-sm-9 col-md-9 col-lg-9"><div class="snChartDiagram" style="text-align:center; -webkit-border-radius: 10px;-moz-border-radius: 10px;border-radius: 10px; background-color:#eee;" >  </div> <div class="snChartSum"> 总数：' + inCalls + '</div></div> <div class="clear"></div>';
        }else if(inComplete == inCalls){
            snChart.setAttribute("class", "snChartItem");
            snChart.style.background = "none repeat scroll 0 0 #ffffff";
            snChart.innerHTML = '<div class="snChartNumber col-xs-3 col-sm-3 col-md-3 col-lg-3">服务号：' + serviceNo + '</div> <div class="col-xs-9 col-sm-9 col-md-9 col-lg-9"><div class="snChartDiagram" > <div style="width:100%; -webkit-border-radius: 10px;-moz-border-radius: 10px;border-radius: 10px;"  class="snChartComplete">接通数：' +inComplete + " (100%)" + '</div> <div style="display:none; " class="snChartLost"></div> </div> <div class="snChartSum"> 总数：' + inCalls + '</div> </div><div class="clear"></div>';

        } else{
            var sinCallCpt,inCallCpt;
            var perInComplete = Math.round((inComplete/inCalls)*100);
            if(perInComplete < 20){
                sinCallCpt = 20;
            } else{
                sinCallCpt = perInComplete;
            }
            if(perInComplete>100){
                sinCallCpt = 100;
            }
            inCallCpt = perInComplete.toString();
            snChart.setAttribute("class", "snChartItem");
            snChart.style.background = "none repeat scroll 0 0 #ffffff";
            snChart.innerHTML = '<div class="snChartNumber col-xs-3 col-sm-3 col-md-3 col-lg-3">服务号：' + serviceNo
                + '</div> <div class="col-xs-9 col-sm-9 col-md-9 col-lg-9"><div class="snChartDiagram" > <div style="min-width: 135px;width:' + sinCallCpt
                + '%; "  class="snChartComplete">接通数：' +inComplete + " (" + inCallCpt + "%)"
                + '</div>  </div> <div class="snChartSum"> 总数：'
                + inCalls + '</div> </div><div class="clear"></div>';
        };
    }
}
function _cti_ui_toDrawingImAccessChart(ImAccess) {

    var name = ImAccess.name;
    var platform = ImAccess.platform;
    var accessId = ImAccess.accessId;
    var accessSession = ImAccess.accessSession;
    var closeSession = ImAccess.closeSession;
    var ia = $("#_ImAccessChart");
    if (accessId != undefined) {
        var iaChart = document.createElement("div");
        if (accessSession == 0) {
              iaChart.id = "_iaChart" + accessId;
              iaChart.setAttribute("class", "snChartItem");
            iaChart.style.background = "none repeat scroll 0 0 #ffffff";
           iaChart.innerHTML = '<div class="iaChartNumber col-xs-3 col-sm-3 col-md-3 col-lg-3" data-original-title="tooltip" title="'+ name + '（' + render.monitor.renderAccessNoTypeDispaly(platform) + '）' +'">接入号：' + name + '（' + render.monitor.renderAccessNoTypeDispaly(platform) + '）' + '</div> <div class="col-xs-9 col-sm-9 col-md-9 col-lg-9"><div class="snChartDiagram" style="text-align:center; -webkit-border-radius: 10px;-moz-border-radius: 10px;border-radius: 10px; background-color:#eee;" >  </div> <div class="snChartSum"> 总数：' + accessSession + '</div> </div><div class="clear"></div>';
           ia.append(iaChart);
        } else if (closeSession == accessSession ) {
            iaChart.id = "_iaChart" + accessId;
            iaChart.setAttribute("class", "snChartItem");
            iaChart.style.background = "none repeat scroll 0 0 #ffffff";
            iaChart.innerHTML = '<div class="snChartNumber col-xs-3 col-sm-3 col-md-3 col-lg-3" data-original-title="tooltip" title="'+ name + '（' + render.monitor.renderAccessNoTypeDispaly(platform) + '）' +'">接入号：' + name + '（' + render.monitor.renderAccessNoTypeDispaly(platform) + '）' + '</div><div class="col-xs-9 col-sm-9 col-md-9 col-lg-9"> <div class="snChartDiagram" > <div style="width:100%; -webkit-border-radius: 10px;-moz-border-radius: 10px;border-radius: 10px;"  class="snChartComplete">完成会话数：' + closeSession + " (100%)" + '</div> <div style="display:none; " class="snChartLost"></div> </div> <div class="snChartSum"> 总数：' + accessSession + '</div> </div><div class="clear"></div>';
            ia.append(iaChart);
        } else {
            var sinCallCpt, inCallCpt;
            var perInComplete = Math.round((closeSession / accessSession) * 100);
            if (perInComplete < 24) {
                sinCallCpt = 24;
            }else{
                sinCallCpt = perInComplete;
            };
            if(perInComplete>100){
                sinCallCpt = 100;
            }
            inCallCpt = perInComplete.toString();
            iaChart.id = "_iaChart" + accessId;
            iaChart.setAttribute("class", "snChartItem");
            iaChart.style.background = "none repeat scroll 0 0 #ffffff";
            iaChart.innerHTML = '<div class="snChartNumber col-xs-3 col-sm-3 col-md-3 col-lg-3" data-original-title="tooltip" title="'+ name + '（' + render.monitor.renderAccessNoTypeDispaly(platform) + '）' +'">接入号：' + name + '（' + render.monitor.renderAccessNoTypeDispaly(platform) + '）'
                + '</div><div class="col-xs-9 col-sm-9 col-md-9 col-lg-9"> <div class="snChartDiagram" > <div style="min-width: 150px;width:' + sinCallCpt
                + '%; "  class="snChartComplete">完成会话数：' + closeSession + " (" + inCallCpt + "%)"
                + '</div>  </div> <div class="snChartSum"> 总数：'
                + accessSession + '</div></div> <div class="clear"></div>';
            ia.append(iaChart);
        }
      }
    }
function _cti_ui_toDrawingImAccessChartUpdata(ImAccess) {

    var name = ImAccess.name;
    var platform = ImAccess.platform;
    var accessId = ImAccess.accessId;
    var accessSession = ImAccess.accessSession;
    var closeSession = ImAccess.closeSession;
    if (accessId != undefined) {
        var iaChart = $('#'+'_iaChart' + accessId)[0];
        if (accessSession == 0) {
            iaChart.setAttribute("class", "snChartItem");
            iaChart.style.background = "none repeat scroll 0 0 #ffffff";
            iaChart.innerHTML = '<div class="iaChartNumber col-xs-3 col-sm-3 col-md-3 col-lg-3" data-original-title="tooltip" title="'+ name + '（' + render.monitor.renderAccessNoTypeDispaly(platform) + '）' +'">接入号：' + name + '（' + render.monitor.renderAccessNoTypeDispaly(platform) + '）' + '</div> <div class="col-xs-9 col-sm-9 col-md-9 col-lg-9"><div class="snChartDiagram" style="text-align:center; -webkit-border-radius: 10px;-moz-border-radius: 10px;border-radius: 10px; background-color:#eee;" >  </div> <div class="snChartSum"> 总数：' + accessSession + '</div> </div><div class="clear"></div>';
        } else if (closeSession == accessSession ) {
            iaChart.setAttribute("class", "snChartItem");
            iaChart.style.background = "none repeat scroll 0 0 #ffffff";
            iaChart.innerHTML = '<div class="snChartNumber col-xs-3 col-sm-3 col-md-3 col-lg-3" data-original-title="tooltip" title="'+ name + '（' + render.monitor.renderAccessNoTypeDispaly(platform) + '）' +'">接入号：' + name + '（' + render.monitor.renderAccessNoTypeDispaly(platform) + '）' + '</div> <div class="col-xs-9 col-sm-9 col-md-9 col-lg-9" data-original-title="tooltip" title="'+ name + '（' + render.monitor.renderAccessNoTypeDispaly(platform) + '）' +'"><div class="snChartDiagram" > <div style="width:100%; -webkit-border-radius: 10px;-moz-border-radius: 10px;border-radius: 10px;"  class="snChartComplete">完成会话数：' + closeSession + " (100%)" + '</div> <div style="display:none; " class="snChartLost"></div> </div> <div class="snChartSum"> 总数：' + accessSession + '</div></div> <div class="clear"></div>';
        } else {
            var sinCallCpt, inCallCpt;
            var perInComplete = Math.round((closeSession / accessSession) * 100);
            if (perInComplete < 24) {
                sinCallCpt = 24;
            }else{
                sinCallCpt = perInComplete;
            };
            if(perInComplete>100){
                sinCallCpt = 100;
            }
            inCallCpt = perInComplete.toString();
            iaChart.setAttribute("class", "snChartItem");
            iaChart.style.background = "none repeat scroll 0 0 #ffffff";
            iaChart.innerHTML = '<div class="snChartNumber col-xs-3 col-sm-3 col-md-3 col-lg-3" data-original-title="tooltip" title="'+ name + '（' + render.monitor.renderAccessNoTypeDispaly(platform) + '）' +'">接入号：' + name + '（' + render.monitor.renderAccessNoTypeDispaly(platform) + '）'
                + '</div> <div class="col-xs-9 col-sm-9 col-md-9 col-lg-9"><div class="snChartDiagram" > <div style="min-width: 150px;width:' + sinCallCpt
                + '%; "  class="snChartComplete">完成会话数：' + closeSession + " (" + inCallCpt + "%)"
                + '</div>  </div> <div class="snChartSum"> 总数：'
                + accessSession + '</div></div> <div class="clear"></div>';
        }
    }
}
    function _cti_ui_monitoringOnServiceNoChanged(serviceNos) {
        var serviceNo = serviceNos.serviceNo;
        var inCalls = serviceNos.inCalls;
        var inComplete = serviceNos.inComplete;
        var inLost = serviceNos.inLost;
        var outCalls = serviceNos.outCalls;
        var outComplete = serviceNos.outComplete;
        var pbxId = (serviceNos.pbx).replace(_softphoneBar_replaceAll, "_");
        var updateBox = $("#" + pbxId + "_snChart" + serviceNo);
        if (updateBox.html() == null) {
            _cti_ui_toDrawingServiceNumberChart(serviceNo, inCalls, inLost, inComplete, pbxId);
        }else{
            _cti_ui_toDrawingServiceNumberChartUpdata(serviceNo, inCalls, inLost, inComplete, pbxId);
        }
        //if (inCalls == 0) {
        //    updateBox.css("background", "none repeat scroll 0 0 #ffffff");
        //    updateBox.html('<div class="snChartNumber">服务号：' + serviceNo + '</div> <div class="snChartDiagram" style="text-align:center; border:dashed 1px #ccc; background-color:#f2f6fb;" > 呼入数量为空  </div> <div class="snChartSum"> 总计：' + inCalls + '</div> <div class="clear"></div>');
        //} else {
        //    var sinCallCpt, sinCallLst, inCallCpt, inCallLst;
        //    var perInComplete = Math.round((inComplete / inCalls) * 100);
        //    if (perInComplete < 15) {
        //        sinCallCpt = 15;
        //        sinCallLst = 85;
        //    } else if (perInComplete > 85) {
        //        sinCallCpt = 85;
        //        sinCallLst = 15;
        //    } else {
        //        sinCallCpt = perInComplete;
        //        sinCallLst = 100 - perInComplete;
        //    }
        //    inCallCpt = perInComplete.toString();
        //    inCallLst = (100 - perInComplete).toString();
        //    updateBox.html('<div class="snChartNumber">服务号：' + serviceNo
        //        + '</div> <div class="snChartDiagram" > <div style="width:' + sinCallCpt
        //        + '%; "  class="snChartComplete">' + inComplete + " (" + inCallCpt + "%)"
        //        + '</div> <div style="width:' + sinCallLst + '%; " class="snChartLost">'
        //        + inLost + " (" + inCallLst + "%)" + '</div> </div> <div class="snChartSum"> 总计：'
        //        + inCalls + '</div> <div class="clear"></div>');
        //}
    }
function _cti_ui_monitoringOnImAccessChanged(ImAccess) {
    var updateBox = $("#_iaChart" + ImAccess.accessId);
    if (updateBox.html() == null) {
        _cti_ui_toDrawingImAccessChart(ImAccess);
    }else{
        _cti_ui_toDrawingImAccessChartUpdata(ImAccess);
    };

}

    function _cti_ui_onAccountCalls(event, accountCall) {
        var curPbxId = (accountCall.pbx).replace(_softphoneBar_replaceAll, "_");
        _cti_ui_toDrawingTodayPandectChart(accountCall.inCalls, accountCall.inComplete, accountCall.outCalls, accountCall.outComplete, curPbxId);
        //if ($("#" + curPbxId + "_TwentyFourHourInChart").html() == null) {
        //    return;
        //}
        _cti_ui_toDrawingInCallChart(accountCall.inCalls, accountCall.inCallsPerHour, accountCall.inCompletePerHour, curPbxId);
        //_cti_ui_toShowInCallChart(curPbxId);
        //if ($("#" + curPbxId + "_TwentyFourHourOutChart").html() == null) {
        //    return;
        //}
        _cti_ui_toDrawingOutCallChart(accountCall.outCalls, accountCall.outCallsPerHour, accountCall.outCompletePerHour, curPbxId);
        //_cti_ui_toShowOutCallChart(curPbxId);
    }

 //function _cti_ui_toDrawingInCallChart(inCalls, inCallsPerHour, inCompletePerHour, curPbx) {
 //       if (inCalls != 0) {
 //           var inCallSumArray, inCallCptArray = [];
 //           inCallSumArray = inCallsPerHour.split(",");
 //           inCallCptArray = inCompletePerHour.split(",");
 //           var inCallMax = 0;
 //           for (var i = 0; i < 24; i++) {
 //               inCallMax = Math.max(inCallMax, inCallSumArray[i]);
 //           }
 //           var b = inCallMax % 5;
 //           var mainLength = inCallMax - b + 5;
 //           var offsetCall = mainLength / 5;
 //           var topOffsetPercent = 180 / mainLength;
 //           for (var i = 0; i < 24; i++) {
 //               var sumrow = document.getElementById(curPbx + "_inCallsumrow_" + i);
 //               sumrow.setAttribute("call", inCallSumArray[i]);
 //               sumrow.style.height = Math.round(topOffsetPercent * inCallSumArray[i]) + "px";
 //               sumrow.style.top = 200 - Math.round(topOffsetPercent * inCallSumArray[i]) + "px";
 //
 //               var cptrow = document.getElementById(curPbx + "_inCallcptrow_" + i);
 //               cptrow.setAttribute("call", inCallCptArray[i]);
 //               cptrow.style.height = Math.round(topOffsetPercent * inCallCptArray[i]) + "px";
 //               cptrow.style.top = 200 - Math.round(topOffsetPercent * inCallCptArray[i]) + "px";
 //           }
 //           for (var i = 1; i < 6; i++) {
 //               var tity = document.getElementById(curPbx + "_inCalltity_" + i);
 //               var temp = offsetCall * ( 6 - i );
 //               tity.innerHTML = temp;
 //           }
 //       }
 //   }

//function _cti_ui_initInCallChart(curPbx) {
//    var ic = $("#" + curPbx + "_TwentyFourHourInChart");
//    var icArea = $("#" + curPbx + "_TwentyFourHourInCallChartArea");
//    for(var i = 0; i < 25; i++){
//        if(i == 24){
//            var timerow = document.createElement("div");
//            timerow.id = curPbx + "_inCalltimerow_" + i;
//            timerow.setAttribute("class", "callnum");
//            timerow.style.left = (26 * i) + "px";
//            timerow.style.width = "50px";
//            timerow.style.position = "absolute";
//            timerow.style.top = "205px";
//            timerow.innerHTML = "时间/时";
//            ic.append(timerow);
//        } else {
//            var sumrow = document.createElement("div");
//            sumrow.id = curPbx + "_inCallsumrow_" + i;
//            sumrow.setAttribute("class", "incallchartsumrow");
//            sumrow.setAttribute("call", 0);
//            sumrow.setAttribute("showTip", true);
//            sumrow.style.left = (26 * i) + "px";
//            sumrow.style.height = 0 + "px";
//            sumrow.style.width = "10px";
//            sumrow.style.border = "solid 0px #1280ef";
//            sumrow.style.position = "absolute";
//            sumrow.style.overflow = "hidden";
//            sumrow.style.background = "none repeat scroll 0 0 #1280ef";
//            sumrow.style.display = "block";
//            sumrow.style.top = 200 + "px";
//            sumrow.style.zIndex = "1";
//            icArea.append(sumrow);
//
//            var timerow = document.createElement("div");
//            timerow.id = curPbx + "_inCalltimerow_" + i;
//            timerow.setAttribute("class", "callnum");
//            timerow.style.left = (26 * i) + 3 + "px";
//            timerow.style.width = "10px";
//            timerow.style.textAlign = "center";
//            timerow.style.position = "absolute";
//            timerow.style.top = "205px";
//            timerow.innerHTML = i;
//            ic.append(timerow);
//
//            var cptrow = document.createElement("div");
//            cptrow.id = curPbx + "_inCallcptrow_" + i;
//            cptrow.setAttribute("class", "incallchartcptrow");
//            cptrow.setAttribute("call", 0);
//            cptrow.setAttribute("showTip", true);
//            cptrow.style.width = "10px";
//            cptrow.style.height = 0 + "px";
//            cptrow.style.border = "solid 0px #92be0f";
//            cptrow.style.position = "absolute";
//            cptrow.style.overflow = "hidden";
//            cptrow.style.background = "none repeat scroll 0 0 #92be0f";
//            cptrow.style.left = (26 * i) + 10 + "px";
//            cptrow.style.display = "block";
//            cptrow.style.top = 200 + "px";
//            cptrow.style.zIndex = "1";
//            icArea.append(cptrow);
//        }
//    }
//
//    for (var i = 0; i < 6; i++) {
//        if(i==0){
//            var tity = document.createElement("div");
//            tity.id = curPbx + "_inCalltity_" + i;
//            tity.setAttribute("class", "tity");
//            tity.style.width = "50px";
//            tity.style.position = "absolute";
//            tity.style.top = (36 * i) -5 + "px";
//            tity.style.left = "-40px";
//            tity.innerHTML = "数量/个";
//            ic.append(tity);
//        } else {
//            var tity = document.createElement("div");
//            tity.id = curPbx + "_inCalltity_" + i;
//            tity.setAttribute("class", "tity");
//            tity.style.width = "35px";
//            tity.style.position = "absolute";
//            tity.style.top = (36 * i) - 21 + "px";
//            tity.style.left = "-18px";
//            tity.style.right = "30px";
//            tity.innerHTML = 6 - i;
//            ic.append(tity);
//
//            var liney = document.createElement("div");
//            liney.id = curPbx + "_inCallliney_" + i;
//            liney.style.width = "620px";
//            liney.style.position = "absolute";
//            liney.style.borderTop = "1px dotted #B9B9B9";
//            liney.style.height = "1px";
//            liney.style.overflow = "hidden";
//            liney.style.top = (36 * i) -16 + "px";
//            liney.style.left = "0px";
//            icArea.append(liney);
//        }
//    }
//}

//图表监控 24小时分段呼入改
    function _cti_ui_toDrawingInCallChart(inCalls, inCallsPerHour, inCompletePerHour, curPbx) {
        var inCallSumArray = [],inCallLstArray = [], inCallCptArray = [];
        inCallSumArray = inCallsPerHour.split(",");
        inCallCptArray = inCompletePerHour.split(",");
        for(var i = 0 ;i<24;i++){
            inCallLstArray[i] = inCallSumArray[i] - inCallCptArray[i];
            inCallCptArray[i] = Number(inCallCptArray[i]);
        };
            var series =  [{
                name: '未接通数',
                data: inCallLstArray
            }, {
                name: '接通数',
                data: inCallCptArray
            }]
        var icArea = $("#" + curPbx + "_TwentyFourHourInCallChartArea");

            $(icArea).highcharts({
                chart: {
                    type: 'column',
                    animation: false
                },
                xAxis: {
                    categories: ['0','1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23']
                },
                yAxis: {
                    gridLineColor:'#7b7b7b',
                    allowDecimals: false,
                    title: {
                        text: ''
                    }
                },
                title: {
                    text: ''
                },
                legend:{
                    enabled:false
                },
                tooltip: {
                    style:{
                        color: '#fff',
                        fontSize: '12px',
                        padding: '8px'
                    },
                    formatter: function () {
                        return '呼入总数: ' + this.point.stackTotal+'<br/>'+
                            this.series.name + ': ' + this.y + '<br/>' ;
                    },
                    backgroundColor:'rgba(50, 50, 50, 0.85)',
                    borderColor:'rgba(50, 50, 50, 0.85)'
                },
                colors: [
                    '#eee',//第一个颜色，欢迎加入Highcharts学习交流群294191384
                    '#b1dd68',//第二个颜色
                ],
                plotOptions: {
                    column: {
                        stacking: 'normal',
                    },
                    series:{animation:false}
                },
                series:series
            });

    }
    function _cti_ui_toDrawingOutCallChart(outCalls, outCallsPerHour, outCompletePerHour, curPbx) {
        var outCallSumArray = [],outCallLstArray = [], outCallCptArray = [];
        outCallSumArray = outCallsPerHour.split(",");
        outCallCptArray = outCompletePerHour.split(",");
        for(var i = 0 ;i<24;i++){
        outCallLstArray[i] = outCallSumArray[i] - outCallCptArray[i];
        outCallCptArray[i] = Number(outCallCptArray[i]);
        }
        var series =  [{
        name: '未接通数',
        data: outCallLstArray
    }, {
        name: '接通数',
        data: outCallCptArray
    }]
    var icArea = $("#" + curPbx + "_TwentyFourHourOutCallChartArea");
    $(icArea).highcharts({
        chart: {
            type: 'column',
            animation: false
        },
        xAxis: {
            categories: ['0','1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23']
        },
        yAxis: {
            gridLineColor:'#7b7b7b',
            allowDecimals: false,
            title:''
        },
        title: {
            text: ''
        },
        legend:{
            enabled:false
        },
        tooltip: {
            style:{
                color: '#fff',
                fontSize: '12px',
                padding: '8px'
            },
            formatter: function () {
                return '呼出总数: ' + this.point.stackTotal+'<br/>'+
                    this.series.name + ': ' + this.y + '<br/>' ;
            },
            backgroundColor:'rgba(50, 50, 50, 0.85)',
            borderColor:'rgba(50, 50, 50, 0.85)'
        },
        colors: [
            '#eee',//第一个颜色，欢迎加入Highcharts学习交流群294191384
            '#b1dd68',//第二个颜色
        ],
        plotOptions: {
            column: {
                stacking: 'normal',
            },
            series:{animation:false}
        },
        series:series
    });

}

    //function _cti_ui_toShowInCallChart(curPbx) {
    //    var incalls = $("#" + curPbx + "_TwentyFourHourInCallChartArea div");
    //    incalls.each(function (i, incall) {
    //        if (!incall.getAttribute("showTip"))
    //            return;
    //
    //        incall.onmouseover = function () {
    //            var temp = this.id.split("_");
    //            var hour = temp[temp.length - 1];
    //            var type = temp[temp.length - 2];
    //            var pbx = this.id.substr(0, this.id.indexOf(type) - 1);
    //
    //            var times = this.getAttribute("call");
    //            var tipMessage = "";
    //            if (type == "inCallsumrow") {
    //                tipMessage = "今日" + hour + "时呼入" + times;
    //            } else if (type == "inCallcptrow") {
    //                tipMessage = "今日" + hour + "时已接" + times;
    //            }
    //            var liney = document.getElementById(pbx + "_inCallMouseTip");
    //            if (!liney) {
    //                liney = document.createElement("div");
    //                liney.id = pbx + "_inCallMouseTip";
    //
    //                liney.style.position = "absolute";
    //                liney.style.border = "1px dotted #FFFF99";
    //
    //                liney.style.padding = "3px";
    //
    //                liney.style.overflow = "hidden";
    //                liney.style.background = "none repeat scroll 0 0 #f8c713";
    //                liney.style.textAlign = "center";
    //                liney.style.zIndex = "2";
    //                var area = $("#" + pbx + "_TwentyFourHourInChart");
    //                area.append(liney);
    //            }
    //            liney.innerHTML = tipMessage;
    //            liney.style.top = $(this).position().top + "px";
    //            liney.style.left = $(this).position().left + 5 + "px";
    //            liney.style.visibility = "visible";
    //
    //            var timeText = document.getElementById(pbx + "_inCalltimerow_" + hour);
    //            if (timeText) {
    //                timeText.style.background = "none repeat scroll 0 0 #f8c713";
    //            }
    //        };
    //        incall.onmouseout = function () {
    //            var temp = this.id.split("_");
    //            var type = temp[temp.length - 2];
    //            var hour = temp[temp.length - 1];
    //            var pbx = this.id.substr(0, this.id.indexOf(type) - 1);
    //            var liney = document.getElementById(pbx + "_inCallMouseTip");
    //            if (liney) {
    //                liney.style.visibility = "hidden";
    //            }
    //            var timeText = document.getElementById(pbx + "_inCalltimerow_" + hour);
    //            if (timeText) {
    //                timeText.style.background = "";
    //            }
    //        };
    //    });
    //}

//function _cti_ui_initOutCallChart(curPbx){
//    var ic = $("#" + curPbx + "_TwentyFourHourOutChart");
//    var icArea = $("#" + curPbx + "_TwentyFourHourOutCallChartArea");
//    for(var i=0; i<25; i++){
//        if(i==24){
//            var timerow = document.createElement("div");
//            timerow.id = curPbx + "_outCalltimerow_" + i;
//            timerow.setAttribute("class", "callnum");
//            timerow.style.left = (26 * i) + "px";
//            timerow.style.width = "50px";
//            timerow.style.position = "absolute";
//            timerow.style.top = "205px";
//            timerow.innerHTML = "时间/时";
//            ic.append(timerow);
//        } else {
//            var sumrow = document.createElement("div");
//            sumrow.id = curPbx + "_outCallsumrow_" + i;
//            sumrow.setAttribute("class", "call");
//            sumrow.setAttribute("call", 0);
//            sumrow.setAttribute("showTip", true);
//            sumrow.style.left = 26*i + "px";
//            sumrow.style.height = 0 + "px";
//            sumrow.style.width = "10px";
//            sumrow.style.border = "solid 0px #1280ef";
//            sumrow.style.position = "absolute";
//            sumrow.style.overflow = "hidden";
//            sumrow.style.background = "none repeat scroll 0 0 #1280ef";
//            sumrow.style.display = "block";
//            sumrow.style.top = 200 + "px";
//            sumrow.style.zIndex = "1";
//            icArea.append(sumrow);
//
//            var timerow = document.createElement("div");
//            timerow.id = curPbx + "_outCalltimerow_" + i;
//            timerow.setAttribute("class", "callnum");
//            timerow.style.left = (26*i) + 3 + "px";
//            timerow.style.width = "10px";
//            timerow.style.position = "absolute";
//            timerow.style.top = "205px";
//            timerow.style.textAlign = "center";
//            timerow.innerHTML = i;
//            ic.append(timerow);
//
//            var cptrow = document.createElement("div");
//            cptrow.id = curPbx + "_outCallcptrow_" + i;
//            cptrow.setAttribute("class", "outcallchartcptrow");
//            cptrow.setAttribute("call", 0);
//            cptrow.setAttribute("showTip", true);
//            cptrow.style.width = "10px";
//            cptrow.style.height = 0 + "px";
//            cptrow.style.border = "solid 0px #f8c713";
//            cptrow.style.position = "absolute";
//            cptrow.style.overflow = "hidden";
//            cptrow.style.background = "none repeat scroll 0 0 #f8c713";
//            cptrow.style.left = 10 + 26*i + "px";
//            cptrow.style.display = "block";
//            cptrow.style.top = 200 + "px";
//            cptrow.style.zIndex = "1";
//            icArea.append(cptrow);
//        }
//    }
//
//    for (var i = 0; i < 6; i++) {
//        if(i == 0){
//            var tity = document.createElement("div");
//            tity.id = curPbx + "_outCalltity_"+i;
//            tity.setAttribute("class", "tity");
//            tity.style.width = "50px";
//            tity.style.position = "absolute";
//            tity.style.top = (36 * i) -5 + "px";
//            tity.style.left = "-40px";
//            tity.innerHTML = "数量/个";
//            ic.append(tity);
//        } else {
//            var tity = document.createElement("div");
//            tity.id = curPbx + "_outCalltity_"+i;
//            tity.setAttribute("class", "tity");
//            tity.style.width = "35px";
//            tity.style.position = "absolute";
//            tity.style.top = (36 * i) -21 + "px";
//            tity.style.left = "-18px";
//            tity.innerHTML = 6 - i;
//            ic.append(tity);
//
//            var liney = document.createElement("div");
//            liney.id = curPbx + "_outCallliney_" + i;
//            liney.setAttribute("class", "liney");
//            liney.style.width = "620px";
//            liney.style.position = "absolute";
//            liney.style.borderTop = "1px dotted #B9B9B9";
//            liney.style.height = "1px";
//            liney.style.overflow = "hidden";
//            liney.style.top = (36 * i) -16 + "px";
//            liney.style.left = "0px";
//            icArea.append(liney);
//        }
//    }
//}

    //function _cti_ui_toDrawingOutCallChart(outCalls, outCallsPerHour, outCompletePerHour, curPbx) {
    //    if (outCalls != 0) {
    //        var outCallSumArray, outCallCptArray = [];
    //        outCallSumArray = outCallsPerHour.split(",");
    //        outCallCptArray = outCompletePerHour.split(",");
    //        var outCallMax = 0;
    //        for (var i = 0; i < 24; i++) {
    //            outCallMax = Math.max(outCallMax, outCallSumArray[i]);
    //        }
    //        var b = outCallMax % 5;
    //        var mainLength = outCallMax - b + 5;
    //        var offsetCall = mainLength / 5;
    //        var topOffsetPercent = 180 / mainLength;
    //
    //        for (var i = 0; i < 24; i++) {
    //            var sumrow = document.getElementById(curPbx + "_outCallsumrow_" + i);
    //            sumrow.setAttribute("call", outCallSumArray[i]);
    //            sumrow.style.height = Math.round(topOffsetPercent * outCallSumArray[i]) + "px";
    //            sumrow.style.top = 200 - Math.round(topOffsetPercent * outCallSumArray[i]) + "px";
    //
    //            var cptrow = document.getElementById(curPbx + "_outCallcptrow_" + i);
    //            cptrow.setAttribute("call", outCallCptArray[i]);
    //            cptrow.style.height = Math.round(topOffsetPercent * outCallCptArray[i]) + "px";
    //            cptrow.style.top = 200 - Math.round(topOffsetPercent * outCallCptArray[i]) + "px";
    //        }
    //        for (var i = 1; i < 6; i++) {
    //            var tity = document.getElementById(curPbx + "_outCalltity_" + i);
    //            var temp = offsetCall * ( 6 - i );
    //            tity.innerHTML = temp;
    //        }
    //    }
    //}

    //function _cti_ui_toShowOutCallChart(curPbx) {
    //    var outcalls = $("#" + curPbx + "_TwentyFourHourOutCallChartArea div");
    //    outcalls.each(function (i, outcall) {
    //        if (!outcall.getAttribute("showTip"))
    //            return;
    //        outcall.onmouseover = function () {
    //            var temp = this.id.split("_");
    //            var hour = temp[temp.length - 1];
    //            var type = temp[temp.length - 2];
    //            var pbx = this.id.substr(0, this.id.indexOf(type) - 1);
    //
    //            var times = this.getAttribute("call");
    //            var tipMessage = "";
    //
    //            if (type == "outCallsumrow") {
    //                tipMessage = "今日" + hour + "时呼出" + times;
    //
    //            } else if (type == "outCallcptrow") {
    //                tipMessage = "今日" + hour + "时呼通" + times;
    //            }
    //
    //            var liney = document.getElementById(pbx + "_outCallMouseTip");
    //            if (!liney) {
    //                liney = document.createElement("div");
    //                liney.id = curPbx + "_outCallMouseTip";
    //                liney.style.position = "absolute";
    //                liney.style.border = "1px dotted #FFFF99";
    //                //liney.style.height = "18px";
    //                liney.style.padding = "3px";
    //                liney.style.overflow = "hidden";
    //                liney.style.background = "none repeat scroll 0 0 #f8c713";
    //                liney.style.textAlign = "center";
    //                liney.style.zIndex = "2";
    //                var area = $("#" + pbx + "_TwentyFourHourOutChart");
    //                area.append(liney);
    //            }
    //            liney.innerHTML = tipMessage;
    //            liney.style.top = $(this).position().top - 18 + "px";
    //            liney.style.left = $(this).position().left + 5 + "px";
    //            liney.style.visibility = "visible";
    //
    //            var timeText = document.getElementById(pbx + "_outCalltimerow_" + hour);
    //            if (timeText) {
    //                timeText.style.background = "none repeat scroll 0 0 #f8c713";
    //            }
    //        };
    //        outcall.onmouseout = function () {
    //            var temp = this.id.split("_");
    //            var type = temp[temp.length - 2];
    //            var hour = temp[temp.length - 1];
    //            var pbx = this.id.substr(0, this.id.indexOf(type) - 1);
    //            var liney = document.getElementById(pbx + "_outCallMouseTip");
    //            if (liney) {
    //                liney.style.visibility = "hidden";
    //            }
    //            var timeText = document.getElementById(pbx + "_outCalltimerow_" + hour);
    //            if (timeText) {
    //                timeText.style.background = "";
    //            }
    //        };
    //    });
    //}

//function _cti_ui_toDrawingTodayPandectChart(inCalls, inComplete, outCalls, outComplete, curPbx) {
//    $("#" + curPbx + "_today_call_sum").html("今日呼叫总量：" + (inCalls + outCalls));
//    $("#" + curPbx + "_today_call_in_sum").html("呼入总量：" + inCalls);
//    $("#" + curPbx + "_today_call_out_sum").html("呼出总量：" + outCalls);
//    if(inCalls == 0) {
//        $("#" + curPbx + "_todayChartInCallBox").html('<div class="callNullStyle" >呼入数据为空</div>');
//    } else {
//        var sinCallCpt,sinCallLst,inCallCpt,inCallLst;
//        var perInComplete = Math.round((inComplete/inCalls)*100);
//        if(perInComplete < 15){
//            sinCallCpt = 15;
//            sinCallLst = 85;
//        }else if(perInComplete > 85){
//            sinCallCpt = 85;
//            sinCallLst = 15;
//        }else{
//            sinCallCpt = perInComplete;
//            sinCallLst = 100 - perInComplete;
//        }
//        inCallCpt = perInComplete.toString();
//        inCallLst = (100 - perInComplete).toString();
//        $("#" + curPbx + "_todayChartInCallBox").html('<div id="'+curPbx+'_today_call_in_success" class="todayCallInSuccess" style="width:' + sinCallCpt + '%;" >'
//            + inComplete + '(' + inCallCpt + '%)' + '</div><div id="' + curPbx + '_today_call_in_failure" style="width:'
//            + sinCallLst + '%;" class="todayCallInFailure" >' + (inCalls - inComplete) + '(' + inCallLst + '%)' + '</div>');
//    }
//    if(outCalls == 0){
//        $("#" + curPbx + "_todayChartOutCallBox").html('<div class="callNullStyle" >呼出数据为空</div>');
//    } else {
//        var soutCallCpt,soutCallLst,outCallCpt,outCallLst;
//        var perOutComplete = Math.round((outComplete/outCalls)*100);
//        if(perOutComplete < 15){
//            soutCallCpt = 15;
//            soutCallLst = 85;
//        }else if(perOutComplete > 85){
//            soutCallCpt = 85;
//            soutCallLst = 15;
//        }else{
//            soutCallCpt = perOutComplete;
//            soutCallLst = 100 - perOutComplete;
//        }
//        outCallCpt = perOutComplete.toString();
//        outCallLst = (100 - perOutComplete).toString();
//        $("#" + curPbx + "_todayChartOutCallBox").html('<div id="' + curPbx + '_today_call_out_success" class="todayCallOutSuccess" style="width:' + soutCallCpt + '%;" >' + outComplete + '(' + outCallCpt + '%)' + '</div><div id="' + curPbx + '_today_call_out_failure" style="width:' + soutCallLst + '%;" class="todayCallOutFailure">' + (outCalls - outComplete) + '(' + outCallLst + '%)' + '</div>');
//    }
//}

//今日呼叫情况改
    function _cti_ui_toDrawingTodayPandectChart(inCalls, inComplete, outCalls, outComplete, curPbx) {

        $("#" + curPbx + "_today_call_sum").html("今日呼叫总量：" + (inCalls + outCalls));
        $("#" + curPbx + "_today_call_in_sum").html("呼入总量：" + inCalls);
        $("#" + curPbx + "_today_call_out_sum").html("呼出总量：" + outCalls);
            var inCallCpt, inCallLst;
            var perInComplete = Math.round((inComplete / inCalls) * 100);
            inCallCpt = perInComplete;
            inCallLst = (100 - perInComplete);
            if(inCalls == 0){
                inCallCpt = 100;
                inCallLst = 0;
            };
            var inCallLstNum = '呼入未接通：' + (inCalls - inComplete) + ' (' + inCallLst + '%)';
            var inCallCptNUm = '呼入接通：' + inComplete + ' (' + inCallCpt + '%)';

           $('#' + curPbx + "_todayChartInCallBox").highcharts({
                chart: {
                    type: 'pie',
                    style:{overflow:'visible',width:'100%'},
                    animation: false
                },
                tooltip: {
                    enabled: false
                },
                plotOptions: {
                    pie: {
                        allowPointSelect: false,
                        cursor: 'pointer',
                        dataLabels: {
                            enabled: false,
                        },
                        showInLegend: true
                    },
                    series:{animation:false}
                },
                legend: {
                    layout: 'vertical',
                    align: 'right',
                    verticalAlign: 'bottom',
                    symbolRadius: 5,
                    symbolHeight: 10,
                    symbolWidth: 10,
                    x: -20,
                    y: 0,
                    borderWidth: 0,
                    width:140,
                    itemStyle: {borderRadius: '50%',fontWeight: '100'},
                    floating: false,
                    useHTML: true
                },
                title: {
                    text: '今日呼入情况',
                    style: {"color": "#000", "fontSize": "12px","fontFamily":"宋体"},
                    align: 'left'
                },
                colors: [
                    '#b1dd68',//第一个颜色，欢迎加入Highcharts学习交流群294191384
                    '#e97a6f',//第二个颜色
                ],
                series: [{
                    type: 'pie',
                    data: [
                        [inCallCptNUm, inCallCpt],
                        [inCallLstNum, inCallLst],
                    ]
                }]
            });
            var outCallCpt, outCallLst;
            var perOutComplete = Math.round((outComplete / outCalls) * 100);
            outCallCpt = perOutComplete;
            outCallLst = (100 - perOutComplete);
            if(outCalls == 0){
                outCallCpt = 100;
                outCallLst = 0;
            };
            var outCallLstNum = '呼出未接通：' + (outCalls - outComplete) + ' (' + outCallLst + '%)';
            var outCallCptNum = '呼出接通：' + outComplete + ' (' + outCallCpt + '%)';
            $('#' + curPbx + "_todayChartOutCallBox").highcharts({
                chart: {
                    type: 'pie',
                    style:{overflow:'visible',width:'100%'},
                    animation: false
                },
                tooltip: {
                    enabled: false
                },
                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        dataLabels: {
                            enabled: false
                        },
                        showInLegend: true
                    },
                    series:{animation:false}
                },
                legend: {
                    layout: 'vertical',
                    align: 'right',
                    verticalAlign: 'bottom',
                    symbolRadius: 5,
                    symbolHeight: 10,
                    symbolWidth: 10,
                    x: -20,
                    y: 0,
                    borderWidth: 0,
                    width:140,
                    itemStyle: {borderRadius: '50%',fontWeight: '100'},
                    floating: false,
                    useHTML: true
                },
                title: {
                    text: '今日呼出情况',
                    style: {"color": "#000", "fontSize": "12px","fontFamily":"宋体"},
                    align: 'left'
                },
                colors: [
                    '#b1dd68',//第一个颜色，欢迎加入Highcharts学习交流群294191384
                    '#e97a6f',//第二个颜色
                ],
                series: [{
                    type: 'pie',
                    data: [
                        [outCallCptNum, outCallCpt],
                        [outCallLstNum, outCallLst],
                    ]
                }]
            });

    }

    //function _cti_ui_phonenumRember() {
    //
    //    var phoneNum = $("#dialout_input_pop").val().trim();
    //
    //    if (phoneNum == "")return;
    //
    //    var phoneCookie = DS.getCookie("phoneNum");
    //    var phoneNumArr = phoneCookie.split("%3B");
    //    var arrLength = phoneNumArr.length;
    //
    //    //DS.setCookie("phoneNum",phoneNum,30);
    //
    //    var sameFlag = false;
    //    if (arrLength != 0) {
    //        for (var index in phoneNumArr) {
    //            if (phoneNum == phoneNumArr[index])
    //                sameFlag = true;
    //        }
    //    }
    //
    //    if (!sameFlag) {
    //        if (arrLength < 3 && arrLength != 0) {
    //            var savedNum = phoneNumArr[0];
    //            for (var index in phoneNumArr) {
    //                if (index > 0)
    //                    savedNum = savedNum + ";" + phoneNumArr[index];
    //            }
    //            phoneNum = phoneNum + ";" + savedNum;
    //        } else if (arrLength == 3) {
    //            phoneNum = phoneNum + ";" + phoneNumArr[0] + ";" + phoneNumArr[1];
    //        }
    //
    //        DS.setCookie("phoneNum", phoneNum, 30);
    //    }
    //}

    function _cti_ui_Autocomplete(phoneCookie) {

        if (phoneCookie) {

            var phoneNumArr = phoneCookie.split("%3B");

            $("#dialout_input_pop").autocomplete(phoneNumArr, {
                width: 150,
                max: 3,
                minLength: 0,
                highlight: false,
                scroll: false,
                scrollHeight: 100,
                create: function (event, ui) {
                    $(this).bind("click", function () {
                        $(this).autocomplete("search", "");
                    });
                },
                source: function (request, response) {

                    var matcher = new RegExp("^" + $.ui.autocomplete.escapeRegex(request.term), "i");

                    if (request.term) {
                        response($.grep(phoneNumArr, function (item) {
                            return matcher.test(item);
                        }));
                    } else {
                        response(phoneNumArr);
                    }

                }
            });
        }
    }
    function _cti_ui_Autocomplete_new(phoneCookie){
        if (phoneCookie) {
                var phoneNumArr = phoneCookie.split("%3B");
                var str='';
                for(var i=0;i<phoneNumArr.length;i++){
                    if(phoneNumArr[i]!=''){
                    str+='<li class="ds_do_action" ds_action="cdr.checkPhoneNumToCallOut" state="" flag='+phoneNumArr[i]+'>'+phoneNumArr[i]+'</li>'
                    }
                }
            if($("#phone-num-autoComplate").length<=0){
                $("#dialoutEnable_tip_wrap .popover").append('<ul id="phone-num-autoComplate"></ul>');
            }
                $("#phone-num-autoComplate").html(str).hide();
        }else{
            if($("#phone-num-autoComplate").length<=0){
                $("#dialoutEnable_tip_wrap .popover").append('<ul id="phone-num-autoComplate"></ul>');
            }
        }
    }
    function softphonebar_judge() {
        var menuList = getCache('investigateList');
        var investigateFlag = isHasFunc("func_investigate_default_option_hide");
        if (menuList.length == 0) {
            phone_investigate();
        } else if (investigateFlag && menuList.length == 1) {
            phone_investigate(menuList[0].Exten);
        } else {
            $('#softphone_investigate').modal('show');
            $('#softphone_investigate').on('shown', function () {

                var ivrMenuHtml = '';

                if (!investigateFlag) {
                    ivrMenuHtml += "<tr style=\"height: 3px;\"><td>默认满意度</td><td><a href=\'javascript:phone_investigate()\'>转调查</a></td></tr>";
                }

                for (var i = 0; i < menuList.length; i++) {
                    ivrMenuHtml += "<tr style=\"height: 3px;\"><td>" + menuList[i].DisplayName + "</td><td><a href=\'javascript:phone_investigate(\"" + menuList[i].Exten + "\")\'>转调查</a></td></tr>";
                }
                $('#softphone_investigate_table_body').html(ivrMenuHtml);
            });

        }
    }

    function _cti_ui_phonenumRember(phoneNum) {

        //var phoneNum = $("#dialout_input").val().trim();

        if (phoneNum == "")return;

        var phoneCookie = DS.getCookie("phoneNum");
        var phoneNumArr = phoneCookie.split("%3B");
        var arrLength = phoneNumArr.length;

        //DS.setCookie("phoneNum",phoneNum,30);

        var sameFlag = false;
        if (arrLength != 0) {
            for (var index in phoneNumArr) {
                if (phoneNum == phoneNumArr[index])
                    sameFlag = true;
            }
        }

        if (!sameFlag) {
            if (arrLength < 5 && arrLength != 0) {
                var savedNum = phoneNumArr[0];
                for (var index in phoneNumArr) {
                    if (index > 0)
                        savedNum = savedNum + ";" + phoneNumArr[index];
                }
                phoneNum = phoneNum + ";" + savedNum;
            } else if (arrLength == 5) {
                phoneNum = phoneNum + ";" + phoneNumArr[0] + ";" + phoneNumArr[1]+";"+phoneNumArr[2]+";"+phoneNumArr[3];
            }

            DS.setCookie("phoneNum", phoneNum, 30);
        }
    }

    function _cti_ui_openConfigTableHeader(){
        var pane = $("#cti_ConfigTableHeader");
        pane.modal();
    }
    function _cti_saveTableHeader(){
        var pane = $("#cti_ConfigTableHeader_form");
        var data = DS.util.getDataOfForm(pane);
        var style = $("#cti_ConfigTableHeader_style");
        var html = "";
        var tdArr = [];
        var localArr = {};
        var id = session.id;
        var checkbox = pane.find("input[type=checkbox]");
        data.data.headers = new Array();
        for(var i=0; i < checkbox.length-1; i++){
            if (!checkbox[i].checked) {
                html += ",#monitor_peer tr td:nth-child("+(i+1)+"),#monitor_peer tr th:nth-child("+(i+1)+")";
            }
            tdArr.push({'name': checkbox[i].name, 'order': i + 1, 'show': checkbox[i].checked});
            data.data.headers.push({'name': checkbox[i].name, 'order': i + 1, 'show': checkbox[i].checked});
        }
        if(html){
            style.html(".hide"+html+"{display:none}");
        }else{
            style.html("");
        }
        localArr = {
            id: id,
            arr: tdArr
        };
        $('#cti_ConfigTableHeader').modal('hide');
        var action = {//提交表头
            action: 'app.report.saveTableHeader',
            data: data.data
        }
        DS.send(action, function (res) {
            if (!res.success) {
                $().alertmessage('showError', "上传表头信息失败");
                return;
            }
            $().alertmessage('success', "配置显示表头成功");
        });
        localStorage.monitor_tableHead=JSON.stringify(localArr);
    }
    function _cti_getTableHeader(){
        var pane = $("#cti_ConfigTableHeader_form");
        var style = $("#cti_ConfigTableHeader_style");
        var html = "";
        var localArr = {};
        var id = session.id;
        if(localStorage.monitor_tableHead && JSON.parse(localStorage.monitor_tableHead).id == id){
            var tdArr = JSON.parse(localStorage.monitor_tableHead).arr;//自定义表头本地
            for(var i=0; i < tdArr.length; i++){
                item = tdArr[i];
                var index = parseInt(item.order);
                if (!item.show && index>3) {
                    pane.find("input[type=checkbox]").eq(index-1).attr("checked",false);
                    html += ",#monitor_peer tr td:nth-child("+index+"),#monitor_peer tr th:nth-child("+index+")";
                }else if(item.show){
                    pane.find("input[type=checkbox]").eq(index-1).attr("checked",true);
                }
            }
            if(html){
                style.html(".hide"+html+"{display:none}");
            }else{
                style.html("");
            }
        }else{
            var action = {//获取表头
                action: 'app.report.getTableHeader',
                data: "im_monitor_agent"
            }
            DS.send(action, function (res) {
                if (res.success) {
                    var tdArr = res.data.Config; //自定义表头服务
                    localArr = {
                        id: id,
                        arr: tdArr
                    };
                    // pane.find("input[type=checkbox]").attr("checked","checked");
                    for(var i=0; i < tdArr.length; i++){
                        item = tdArr[i];
                        var index = parseInt(item.order);
                        if (!item.show && index>3) {
                            pane.find("input[type=checkbox]").eq(index-1).attr("checked",false);
                            html += ",#monitor_peer tr td:nth-child("+index+"),#monitor_peer tr th:nth-child("+index+")";
                        }
                    }
                    if(html){
                        style.html(".hide"+html+"{display:none}");
                    }
                    localStorage.monitor_tableHead=JSON.stringify(localArr);
                }else{
                    $().alertmessage('showError', "获取平台监控-表头显示配置失败!请重新配置!");
                }
            });
        }
    }
