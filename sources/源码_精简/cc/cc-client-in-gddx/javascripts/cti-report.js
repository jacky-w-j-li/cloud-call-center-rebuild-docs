handler.report = {
    report_main:function(){
        var pane=$("#view_nav_report");
        var menus = [
            'call_report',
            'im_report',
            'mail_report',
            'customer_report',
            'business_report',
            'im_report_csr',
            'im_report_session_time',
            'ques_report'


        ];
        for(var i=0; i<menus.length; i++){
            if(!isHasMenu(menus[i])){
                pane.find(".report_tab>.tab_" + menus[i]).remove();
            }else{
                pane.find(".report_tab>.tab_" + menus[i]).show();
            }
        }

        pane.find(".report_tab").find("li:first>a").click();
    },
    showTab:function(data,src) {
//        var pane=$("#view_"+data);
        if(data == "call_report"){
            handler.swapTab(data, 'report/callReport/call_report_main');
        }else if(data == "im_report"){
            handler.swapTab(data, 'report/im/im_report_main');
        }else if(data == "mail_report"){
            handler.swapTab(data, 'report/mail/mail_report_main');
        }else if(data == "customer_report"){
            handler.swapTab(data, 'report/customer/customer_report_main');
        }else if(data == "business_report"){
            handler.swapTab(data, 'report/business/business_report_main');
        }else if (data == 'callin_report') {
            handler.swapTab(data, 'report/callReport/callin_report');
        } else if(data == 'questionnaire_report') {
            handler.swapTab(data, 'report/questionnaire/questionnaire_report')
        } else if (data == 'call_report_relay_area') {
            handler.swapTab(data, 'report/callReport/call_report_relay_area');
        } else if (data == 'callout_report') {
            handler.swapTab(data, 'report/callReport/callout_report');
        } else if (data == 'call_report_dialout_area') {
            handler.swapTab(data, 'report/callReport/call_report_dialout_area');
        } else if (data == 'queue_report') {
            handler.swapTab(data, 'report/callReport/queue_report');
        } else if (data == 'call_report_queue_time') {
            handler.swapTab(data, 'report/callReport/call_report_queue_time');
        } else if (data == 'call_report_agent') {
            handler.swapTab(data, 'report/callReport/call_report_agent');
        } else if (data == 'call_report_approve_survey') {
            handler.swapTab(data, 'report/callReport/call_report_approve_survey');
        } else if (data == 'im_report_message') {
            handler.swapTab(data, 'report/im/im_report_message');
        } else if (data == 'im_report_business_analyse') {
            handler.swapTab(data, 'report/im/im_report_business');
        } else if (data == 'im_report_agent') {
            handler.swapTab(data, 'report/im/im_report_agent');
        } else if (data == 'mail_report_agent') {
            handler.swapTab(data, 'report/mail/mail_report_agent');
        }else if (data == "customer_report_increase") {
            handler.swapTab(data, 'report/customer/customer_report_increase');
        } else if (data == "business_report_analyse") {
            handler.swapTab(data, 'report/business/business_report_analyse');
        } else if (data == "business_report_agent") {
            handler.swapTab(data, 'report/business/business_report_agent');
        } else if(data == 'im_report_csr'){
            handler.swapTab(data, 'report/im/im_report_csr');
        }else if(data == 'im_report_csr_channel'){
            handler.swapTab(data, 'report/im/im_report_csr_channel');
        }else if(data == 'customer_report_status'){
            handler.swapTab(data, 'report/customer/customer_report_status');
        }else if(data == 'im_report_session_time'){
            handler.swapTab(data, 'report/im/im_report_session_time');
        }else if(data == 'im_report_source_from'){
            handler.swapTab(data, 'report/im/im_report_source_from');
        }else if(data == 'im_report_engine'){
            handler.swapTab(data, 'report/im/im_report_engine');
        }else if(data == 'im_report_area'){
            handler.swapTab(data, 'report/im/im_report_area');
        }else if(data == 'im_report_keyword'){
            handler.swapTab(data, 'report/im/im_report_keyword');
        }else if(data == 'im_report_website'){
            handler.swapTab(data, 'report/im/im_report_website');
        }else if(data == 'questionnaire_report_return'){
            handler.swapTab(data, 'report/questionnaire/questionnaire_report_return');
        }else if(data == 'questionnaire_report_question_detail'){
            handler.swapTab(data, 'report/questionnaire/questionnaire_report_question_detail');
        }else if(data == 'customer_report_status'){
            handler.swapTab(data, 'report/customer/customer_report_status');
        }else if(data == 'customer_report_sale_agent'){
            handler.swapTab(data,'report/customer/customer_report_sale_agent');
        }else if(data == 'customer_report_sale'){
            handler.swapTab(data,'report/customer/customer_report_sale');
        }
    },

    customer_report:function(menu){
        var tmpl=getCache('custTmpls')[0];
        var pane=$("#" + menu + "_report_pane");
        pane.find("input[name='dbType']").val(tmpl._id);
        var status = tmpl.status;
        var headTmp = "<th>_name</th>";
        var html = "";
        for (var k in status) {
            html += headTmp.replace(/_name/g, status[k]);
        }
        pane.find("table").find("thead").find("tr").append(html);
        pane.find(".form_query_button").click();
    },


    business_report: function (menu) {
        var tags = getCache("tags");
        var headTmp = "<th>_name</th>";
        var html = "";
        for (var tagKey in tags) {
            html += headTmp.replace(/_name/g, tags[tagKey]);
        }
        $("#" + menu + "_report_pane").find("table").find("thead").find("tr").append(html);

        $("#" + menu + "_report_pane").find(".form_query_button").click();
    }

}



