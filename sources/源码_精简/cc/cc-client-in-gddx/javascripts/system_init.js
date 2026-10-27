var pushServerUrl = "http://114.215.205.38:5006";
var serverDiffTime = 0;
var slib = {
    l1: [
        "jqueryui/custom/custom.js",
        "javascripts/ds_framework/dishui.js",
        "javascripts/frmCheck.js",
        "javascripts/uuid.js",
        "javascripts/draw.js",
        "javascripts/m7_util_src.js",
        "javascripts/cti-ui.src.js",
        "javascripts/cti-core-model.js",
        "javascripts/cti-action-monitor.js",
        "javascripts/cc_src.js",
        "javascripts/cc-core-handler.js",
        "javascripts/bootstrap.js",
        "javascripts/bootstrap-switch.min.js"
    ],
    l2:[
        "javascripts/cc-cust.js"
    ],
    l3: [
        "javascripts/call.js",
        "javascripts/callMail.js",
        "javascripts/config/mailSign.js",
        "javascripts/callWeixin.js",
        "javascripts/channelHistory.js",
        "javascripts/workflow_src.js",
        "javascripts/workflow_util_src.js",
        "javascripts/config/business.js",
        "javascripts/config/callConfig.js",
        "javascripts/config/ivrProcess.js",
        "javascripts/config/customer.js",
        "javascripts/config/role.js",
        "javascripts/config/channel/channel.js",
        "javascripts/config/channelDic.js",
        "javascripts/config/dic.js",
        "javascripts/config/user.js",
        "javascripts/config/department.js",
        "javascripts/config/questionnaire.js",
        "javascripts/config/qualityCheck.js",
        "javascripts/config/account.js",
        "javascripts/sms.js",
        "javascripts/customerTask.js",
        "javascripts/customerTitket.js",
        "javascripts/questionnaire.js",
        "javascripts/task.js",
        "javascripts/cti-report.js",
        "javascripts/webchat.js",
        "javascripts/email.js",
        "javascripts/handler/account.js",
        "javascripts/handler/licence.js",
        "javascripts/customerApprovalBusiness.js",
        "javascripts/config/customerCommon.js",
        "javascripts/config/customerApproval.js"
    ],
    l4:[
        "javascripts/businessReport.js",
        "javascripts/customerReport.js",
        "javascripts/callReport.js",
        "javascripts/imReport.js",
        "javascripts/emailReport.js",
        "javascripts/cti-cdr.js",
        "javascripts/questionnaireReport.js",
        "javascripts/batch.js",
        "javascripts/batch2.js",
        "javascripts/callRecord.js",
        "javascripts/config/interfaceUrl.js",
        "javascripts/config/callEvent.js",
        "third-lib/kindeditor/kindeditor-min.js",
        "third-lib/kindeditor/lang/zh_CN.js",
        "javascripts/qiniu/plupload/plupload.full.min.js",
        "javascripts/qiniu/plupload/i18n/zh_CN.js",
        "javascripts/qiniu/ui.js",
        "javascripts/qiniu/qiniu.js",
        "javascripts/qiniu/highlight/highlight.js",
        "javascripts/knowledge/km-main.js",
        "javascripts/knowledge/km-dic.js",
        "javascripts/7moorPush.js",
        "javascripts/notify.js",
        "javascripts/jquery.jmp3.js",
        "javascripts/imMonitor.js",
        "javascripts/workbench.js",
        "javascripts/jquery.alertmessage.js",
        "javascripts/ace/ace.js",
        "javascripts/ace/mode-javascript.js",
        "jPicker/jpicker-1.1.6.min.js",
        "javascripts/mermaid/mermaid.min.js"
    ]
};
var loadRs = function(){

    $LAB
        .script(slib.l1)
        .wait()
        .script(slib.l2)
        .wait()
        .script(slib.l3)
        .wait()
        .script(slib.l4)
        .wait(function(){
            $.fn.modal.Constructor.prototype.enforceFocus = function () {};
            $(".load_value").animate({top:"20%",opacity:"0"},1000);
            init();
            setTimeout(function(){
                $(".login_panel").animate({opacity:"1"},1000);
                $(".load_value").remove();
            },500);
        });
}

$LAB
    .script("javascripts/jquery.js")
    .script("javascripts/config/business/jquery-ui.js")
    .wait(function(){
        var datar = {localTime:new Date().getTime()};
        $.ajax({
            type:"GET",
            url :"./public?action=system.getUpNf&data="+JSON.stringify(datar),
            success : function(data , status , xhr){
                if(data.serverDiffTime){
                    serverDiffTime = data.serverDiffTime;
                }
                if(data && data.success && data.isNew){
                    var list = data.list || [];
                    if(list.length > 0){
                        for(var l in slib){
                            var libs = slib[l] || [];
                            for(var s in libs){
                                var scr = libs[s];
                                for(var u in list){
                                    if(scr == list[u].js){
                                        scr = scr + "?_v=" + list[u].date;
                                        libs[s] = scr;
                                        break;
                                    }
                                }
                            }
                        }
                    }

                }
                if(data.ccPushUrl){
                    pushServerUrl = data.ccPushUrl;
                }

                loadRs();
            },
            error : function(){
                loadRs();
            }
        });
    })
    .script("jqueryui/ui/minified/i18n/jquery.ui.datepicker-zh-CN.min.js")
    .script("javascripts/jquery-ui-timepicker-addon.min.js")
    .script("javascripts/jquery-ui-timepicker-zh-CN.js")
    //.script("javascripts/jquery.alertmessage.js")
    .script("javascripts/highcharts.js")
    .script("javascripts/ds_framework/template-native.js")
    .script("javascripts/jquery.json.min.js")
    .script("javascripts/jquery.tmpl.min.js")
    .script("javascripts/json2.js")
    .script("javascripts/socket.io.js")
    .script("javascripts/ZeroClipboard.min.js")
    .script("javascripts/base64.min.js")
    .script("javascripts/bootstrap-multiselect.js")