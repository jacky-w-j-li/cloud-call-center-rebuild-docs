/**
 * Created by chenguang on 1/20/15.
 */
handler.sms = {
    splitCount:1,
    batchSplitCount:1,
    cid:"#view_sms",
    textCount:280,
    smsDataCache: {},
    mySmsDataCache: {},
    smsTemplateDataCache: {},
    smsCurTemplate:null,
    smsBatchCurTemplate:null,
    sms_main:function(menu){
        // var searchPane = $('#my_sms_form');
        // handler.sms.initSmsCondition(searchPane);
        // var btn=searchPane.find('.normal_search');
        // btn.click();
        var pane=$("#view_nav_sms");
        if(!isHasMenu("my_sms")){
            pane.find(".sms_tab>.tab_my_sms").remove();
        }else{
            pane.find(".sms_tab>.tab_my_sms").show();
        }
        if(!isHasMenu("all_sms")){
            pane.find(".sms_tab>.tab_all_sms").remove();
        }else{
            pane.find(".sms_tab>.tab_all_sms").show();
        }
        if(!isHasMenu("batch_send_sms")){
            pane.find(".sms_tab>.tab_mass_sms").remove();
        }else{
            pane.find(".sms_tab>.tab_mass_sms").show();
        }
        if(!isHasMenu("import_batch_send_sms")){
            pane.find(".sms_tab>.tab_import_mass_sms").remove();
        }else{
            pane.find(".sms_tab>.tab_import_mass_sms").show();
        }
        if(!isHasMenu("sms_template_query")){
            pane.find(".sms_tab>.tab_sms_template_query").remove();
        }else{
            pane.find(".sms_tab>.tab_sms_template_query").show();
        }
    },
    initSmsCondition: function (searchPane) {
        var container=searchPane.find(".advanced_search_pane");
        searchPane.find(".btn_advanced_search").bind("click",function(e){
            e.stopPropagation();
            var offset=searchPane.find(".quick_search").offset();
            container.css({top:offset.top+28+"px",left:offset.left+"px"});
            container.toggleClass("hidden");
        });
        var smsStatusHtml = handler.sms.getSmsStatusSelectorHtml('m7Status', '');
        container.find("select[name='m7Status']").get(0).outerHTML= smsStatusHtml;
        var data = {
            selectorName: 'sign',
            cacheType: 'smsSign',
            cacheItemName: 'name',
            cacheItemValue: 'subcode',
            selectorValue: ""
        }
        var options = handler.cdr.getCallSheetSelectorHtml(data);
        container.find("select[name='sign']").get(0).outerHTML= options;
    },
    initSmsCondition_table: function (mainPanelID) {
        var smsStatusHtml = handler.sms.getSmsStatusSelectorHtml('m7Status', '');
        if($('#' + mainPanelID + ' .sms_status_selector').length > 0)
            $('#' + mainPanelID + ' .sms_status_selector').get(0).outerHTML = smsStatusHtml;

        var data = {
            selectorName: 'sign',
            cacheType: 'smsSign',
            cacheItemName: 'name',
            cacheItemValue: 'subcode',
            selectorValue: ""
        }
        var options = handler.cdr.getCallSheetSelectorHtml(data);
        $('#'+mainPanelID+' .sms_sign_selector').html(options);
    },
    searchSmsCard: function(data, src) {
        if(src.hasClass("refresh")){
            var searchPane = $('#contact_list_sms');
            var param=handler._getSearchCondition(searchPane,"1")||{};
            var a=searchPane.find(".pagination li.active>a");
            if(a.length>0){
                param.page= a.attr("value");
            }
            handler.sms.querySmsList(param,null);
        }else{
//            setDateTimeCondition(data);
            handler.sms.querySmsList(data,src);
        }
    },
    querySmsList: function(data, src){
        data=data||{};
        var isAdvanceSearch=data.isAdvanceSearch;
        delete  data.isAdvanceSearch;
        var pane=$("#contact_list_sms");
        handler._setSearchCondition(data,pane);

        var frmId='frm_sms_normal_search';
        if(isAdvanceSearch=="1"){
            frmId = "frm_sms_advanced_search";
        }
        pane.find(".pagination").attr({for:frmId});
        var page=data.page;
        if(src && src.hasClass("page_on")){
            page=src.attr("value");
        }
        if(!page)page=1;
        data.page=page;
        data.pageSize = handler.cdr.queryPageSize;

        var action = {
            action: 'app.sms.queryAllSms',
            data: data
        }
        DS.send(action, function (res) {
            if (res.success) {
                DS.showSearchTips(pane.find("#"+frmId));
                var list = res.list;
                var count=res.count;
                var container=pane.find('.list-inside');
                if (list.length > 0){
                    var html = [];
                    for (var i = 0, len = list.length; i < len; i++) {
                        var row = list[i];
                        handler.sms._setItem(row);
                        html.push(template("tmpl_sms_item",row));
                    }
                    container.html(html.join(''));
                } else {
                    var html='<div class="alert">没有记录!</div>';
                    container.html(html);
                }
                DS.updatePagination(frmId, count, data.pageSize, data.page);
                pane.find('.advanced_search_pane').addClass("hidden");
            } else {
                $().alertmessage('showError', errMsg);
            }
        });
    },
    _setItem: function (data) {
        var _t=handler.formatShortTime(data.submitTime);
        data.shortTime=_t.name;

        var s=data.m7Status;
        data.statusDesc=handler.sms.getSmsStatusName(s);
        var cls="";
        if(s=='forbiddenWord'){
            cls='label-warning';
        }else if(s=='deliver'||s=='send'){
            cls='label-success';
        }else if(s=='sendFail' ||s=='undeliver'){
            cls='label-important';
        }else if(s=='ready'){
            cls='label-info';
        }
        data.statusClass=cls;

        data.agentDesc=handler.cdr.getAgentName(data.createUser);
    },
    showSmsDetail: function (data) {
        var currentSms = handler.sms.smsDataCache[data];
        if (!currentSms) {
            currentSms = handler.sms.mySmsDataCache[data];
        }
        if (currentSms) {
//            showCdrTel(currentSms);
            DS.getView('sms/show_sms_detail', function (view) {
                var html = '';
                html = DS.renderMethodViewNew(view, currentSms);
                var panel = $('#modal_panel');
                panel.empty();
                panel.append(html);
                $('#show_sms_detail_Modal').modal({'backdrop': 'static'});
            });
        } else {
            alert('系统获取短信详细信息失败，请重试。');
        }
    },
    showSmsDetail_table: function (data) {
        var currentSms = handler.sms.smsDataCache[data];
        if (!currentSms) {
            currentSms = handler.sms.mySmsDataCache[data];
        }
        if (currentSms) {
            DS.getView('sms/show_sms_detail', function (view) {
                var html = '';
                html = DS.renderMethodViewNew(view, currentSms);
                var panel = $('#modal_panel');
                panel.empty();
                panel.append(html);
                $('#show_sms_detail_Modal').modal({'backdrop': 'static'});
            });
        } else {
            alert('系统获取短信详细信息失败，请重试。');
        }
    },
    showSendGroup:function(menu,src){
        var pane=$('#batch_modal');
        DS.getView('sms/batch_send_sms',function(view){
            view=view.replace(/_#menu#_/g,menu);
            pane.find('.modal-title').text('群发短信');
            pane.find(".modal-body").html(view);

            var signs = getCache('smsSign');
            for(var i=0 ;i<signs.length ;i++){
                signs[i].value = signs[i].subcode+"_"+signs[i].name;
            }
            var options = generateComboxOptionsFromDocs(getCache('smsSign'), 'name', 'value','');
            pane.find('.batchSmsSign').html(options);

            pane.width(650);
            pane.modal();
        });
    },
    sms: function(data){
        $('#dialout_input').val(data);
        $('#SmsEnable').click();
        handler.sms.openSendSms();
    },
    openSendSms: function(){
        var signs = getCache('smsSign');
        for(var i=0 ;i<signs.length ;i++){
            signs[i].value = signs[i].subcode+"_"+signs[i].name;
        }
        var options = generateComboxOptionsFromDocs(getCache('smsSign'), 'name', 'value','');
        $('.smsInput').val($('#dialout_input').val());
        $('.smsSign').html(options);
        var templates = getCache('smsTemplate');
        for(var i=0;i<templates.length;i++){
            templates[i].displayName = templates[i].name+':'+templates[i].content;
        }
        var templateOptions = generateComboxOptionsFromDocs(templates, 'displayName', 'num','');
        $('.smsTemplate').html(templateOptions);
        if(templates.length > 0){
            var firstTemplate = templates[0];
            handler.sms.changeSmsTemplate(firstTemplate.num);
        }else{
            $('#smsSendTemplatePane').empty();
            $('#smsSendTemplatePane').html('目前还没报备任何短信模板，请报备');
        }
        $("#sms_tip").tooltip({title:'未备案签名不能发短信.<br>短信会在5分钟内送达.<br>超过66字(含签名)后每66字记一条.',placement:'right',html:true});
        $(".sms_manual_tip").tooltip({title:'您发送的内容不会直接提交至运营商.<br>我们的审核人员将按照提交顺序依次检查内容.<br>审核通过才会提交运营商.<br>所以人工审核到达速度比较慢.<br>建议报备短信模板发送.',placement:'bottom',html:true});
        var smsAfterClose = DS.getCookie("smsAfterClose");
        if(smsAfterClose == 'true'){
            $(".smsAfterClose").attr("checked", true);
        }else{
            $(".smsAfterClose").attr("checked", false);
        }
    },
    changeSmsTemplate: function(data){
        var curTemplate = getCacheByKey('smsTemplate','num', data);
        handler.sms.smsCurTemplate = curTemplate;
        var inputHtml = '';
        var html = curTemplate.content;
        for(var i=1;i<=curTemplate.vars;i++){
            html = html.replace('{'+i+'}', '<span contenteditable="true" onkeyup="javascript:handler.sms.changeSmsTemplateVar(this)" id="smsTemplateVar'+i+'"></span>');
            inputHtml += '变量'+i+':<input type="text" name="smsTemplateVar'+i+'">'
        }
        $("#smsContentPane").html(html);
        $('#smsVarsListPane').html(inputHtml);
        var sign = getCacheByKey('smsSign','_id', curTemplate.sign);
        $('#smsTemplateSign').html(sign.name);
        $('.templateSign').val(sign.subcode + '_' + sign.name);
        $('.smsTemplateTitle').empty();
    },
    changeSmsTemplateVar: function(target){
        var nameId = $(target).attr('id');
        var templateContent = handler.sms.smsCurTemplate.content;
        var textLen = templateContent.length - handler.sms.smsCurTemplate.vars * 3;
        var sign = getCacheByKey('smsSign','_id', handler.sms.smsCurTemplate.sign).name;
        var inputList = $('#smsContentPane').children("span");
        var inputCount = 0;
        for(var i=0 ; i < inputList.length ; i++){
            inputCount += $(inputList[i]).text().length;
        }
        var otherInputCount = 0;
        for(var i=0 ; i < inputList.length ; i++){
            if($(inputList[i]).attr('id') != nameId){
                otherInputCount += $(inputList[i]).text().length;
            }
        }
        if(textLen+inputCount>(handler.sms.textCount-sign.length)){
            $(target).text($(target).text().substring(0,handler.sms.textCount-sign.length-textLen-otherInputCount));
            $("#smsVarsListPane").find("input[name="+nameId+"]").val($(target).text().substring(0,handler.sms.textCount-sign.length-textLen-otherInputCount));
            inputCount = 0;
            for(var i=0 ; i < inputList.length ; i++){
                inputCount += $(inputList[i]).text().length;
            }
        }
        var html = "您还可以输入<span style='color: green'>"+(handler.sms.textCount-sign.length-textLen-inputCount)
            +"</span>/<span style='color: red'>"+(handler.sms.textCount-sign.length)+"</span>个文字";
        if((inputCount + textLen + sign.length) > 66){
            var n=1;
            var nc = parseInt((inputCount + textLen + sign.length-66)/66);
            var nv = (inputCount + textLen + sign.length-66)%66;
            n+=nc;
            if(nv >0){
                n+=1;
            }
            html += "<br>内容过长短信将以<span style='color: orange'>"+n+"</span>条发出";
            handler.sms.splitCount = n;
        }else{
            handler.sms.splitCount = 1;
        }
        $('.smsTemplateTitle').html(html);
        $('input[name='+nameId+']').val($(target).text());
        if (inputCount>3) {
            $(target).css("display","inline");
        }else{
            $(target).css("display","inline-block");
        }
    },
    choiceSendType: function(data){
        $('.smsSendType').val(data);
        if (data=="manual") {
            if (localStorage.softphonnesmscount==0) {
                localStorage.softphonnesmscount=1;
                $("body").append('<div class="modal-backdrop fade in"></div><div id="sms_warn"><div class="alert"><h4>重要通知</h4><p>根据运营商要求，人工审核短信的发送功能将在2016年1月25日关闭。后续只能通过报备模板的方式来发送短信，请您尽快报备短信模板，以免影响您的正常业务。</p><p>报备模板请发邮件到service@7moor.com</p><span class="button" onclick="closeSmsWarn();">我知道了</span></div></div>');
                $("#phone_bar .popover").addClass("topshow");
            }
        }
    },
    delSpecialChar:function(content){
        var contentarr = content.split('"');
        var str = "";
        var str2 = "";
        for(var j = 0;j< contentarr.length-1;j++){
            str+=contentarr[j]+(j%2?'”':'“');
        }
        str+=contentarr[j];
        contentarr = str.split("'");
        for(var j = 0;j<contentarr.length-1;j++){
            str2 += contentarr[j]+(j%2?'’':'‘');
        }
        str2 +=contentarr[j];
        str2 = str2.replace(/[\\&]/g,'');
        str2 = str2.replace(/,/g,'，');
        return str2
    },
    sendSms: function (data) {
        //num: "18600030392", content: "", sign: "22051_【超孚金融】"
        if(data.hiddenNum && data.hiddenNum != ''){
            data.num = data.hiddenNum;
            delete data.hiddenNum;
        }
        var patrn=/^(13[0-9]{9})|(15[0-9][0-9]{8})|(18[0-9][0-9]{8})|(17[0-9][0-9]{8})|(14[0-9][0-9]{8})$/;
        if (!patrn.exec(data.num)){
            $().alertmessage('showError', "请输入正确的手机号码！");
            return false;
        }
        if(data.sign == ''){
            $().alertmessage('showError', "无签名不能发短信，请向我们备案您的签名！");
            return false;
        }
        if(data.sendType == 'manual'){
            if(data.content == ''){
                $().alertmessage('showError', "请输入短信的内容！");
                return false;
            }
            delete data.template;
        }else{
            var curTemplate = handler.sms.smsCurTemplate ;
            var content = curTemplate.content;
            data.templateid = curTemplate._id;
            data.template = content;
            data.vars = curTemplate.vars;
            for(var i=1;i<=curTemplate.vars;i++){
                content = content.replace('{'+i+'}', data['smsTemplateVar'+i]);
            }
            data.content = content;
            if(handler.sms.smsCurTemplate.smsChannel.length > 0){
                data.smsChannel = handler.sms.smsCurTemplate.smsChannel[0];
            }else{
                $().alertmessage('showError', "该模板配置通道异常，无法发送，请联系管理员！");
                return false;
            }
        }
        data.splitCount = handler.sms.splitCount;
        var action = {
            action: "app.sms.sendSms",
            data: data
        }
        DS.send(action, function (res) {
            if (!res.success) {
                $().alertmessage('showError','发送短信失败！'+res.message);
                console.info('Query cdr peer failure: ' + res.message);
                return;
            }
            $().alertmessage('showSuccess','发送成功！');
            if($('.smsAfterClose').attr("checked")=='checked'){
                handler.sms.closeSms();
            }
        });
    },
    changeSmsText: function(target){
        var content = $(target);
        var text = content.val();
        var sign = $('.smsSign').val();
        sign = sign.substring(sign.indexOf('_')+1, sign.length);
        if(text.length>(handler.sms.textCount-sign.length)){
            content.val(text.substring(0,handler.sms.textCount-sign.length));
            text = content.val();
        }
        var html = "您还可以输入<span style='color: green'>"+(handler.sms.textCount-sign.length-text.length)
            +"</span>/<span style='color: red'>"+(handler.sms.textCount-sign.length)+"</span>个文字";
        if((text.length + sign.length) > 66){
            var n=1;
            var nc = parseInt((text.length+sign.length-66)/66);
            var nv = (text.length+sign.length-66)%66;
            n+=nc;
            if(nv >0){
                n+=1;
            }
            html += "<br>内容过长短信将以<span style='color: orange'>"+n+"</span>条发出";
            handler.sms.splitCount = n;
        }else{
            handler.sms.splitCount = 1;
        }
        $('.smsTitle').html(html);
    },
    changeBatchSmsText: function(target){
        var content = $(target);
        var text = content.val();
        var sign = $('.batchSmsSign').val();
        sign = sign.substring(sign.indexOf('_')+1, sign.length);
        if(text.length>(handler.sms.textCount-sign.length)){
            content.val(text.substring(0,handler.sms.textCount-sign.length));
            text = content.val();
        }
        var html = "您还可以输入<span style='color: green'>"+(handler.sms.textCount-sign.length-text.length)
            +"</span>/<span style='color: red'>"+(handler.sms.textCount-sign.length)+"</span>个文字";
        if((text.length + sign.length) > 66){
            var n=1;
            var nc = parseInt((text.length+sign.length-66)/66);
            var nv = (text.length+sign.length-66)%66;
            n+=nc;
            if(nv >0){
                n+=1;
            }
            html += "<br>内容过长短信将以<span style='color: orange'>"+n+"</span>条发出";
            handler.sms.batchSplitCount = n;
        }else{
            handler.sms.batchSplitCount = 1;
        }
        $('.batchSmsTitle').html(html);
    },
    closeSms: function(){
        $('#SmsEnable').popover('hide');
    },
    resetSms: function(data, src){
        var form = src.closest('form');
        form.get(0).reset();
        $(form).find("span[contenteditable='true']").text("").css("display","inline-block");
        $(form).find(".smsTemplateTitle,.batchSmsTemplateTitle").empty();
        var owner = $("#create_user_select_input");
        if(owner.length>0){
            owner.val("");
        }
        if(data == 'send'){
            $("#smsContentPane").find("span").text('');
            $("#smsContentPane").find("span").css("display", "inline-block");
            $("#smsVarsListPane").find("input").val('');
        }else if(data == 'batch'){
            $("#batchSmsContentPane").find("span").text('');
            $("#batchSmsContentPane").find("span").css("display", "inline-block");
            $("#batchSmsVarsListPane").find("input").val('');
        }
        if(form.find('.smsTemplate').length > 0){
            form.find('.smsTemplate').val(handler.sms.smsCurTemplate.num);
        }
        if(form.find('.batchSmsTemplate').length > 0){
            form.find('.batchSmsTemplate').val(handler.sms.smsBatchCurTemplate.num);
        }
    },
    showSms: function(data){
        $('#SmsEnable').popover('show');
        $('.smsInput').val(data);
    },

    showContentLimit: function(data){
        if(data.length > 15){
            return data.substr(0,15)+'......';
        }else{
            return data;
        }
    },
    my_sms: function(data){
        handler.sms.initSmsCondition_table('my_sms_main_panel');
        $('#my_sms_query_link').trigger('click');
    },
    searchMySms: function(data, src){
        var data = handler.cdr.getSearchCondition(data);
        if (!handler.cdr.validateCondition(data)) {
            return false;
        }
        data.pageSize = handler.cdr.queryPageSize;
        data.page = src.val() || 1;
        handler.cdr.parseSearchDate(data);
        handler.sms.mySmsDataCache = {};
        var cache = handler.sms.mySmsDataCache;
        var action = {
            action: 'app.sms.queryMySms',
            data: data
        }
        DS.send(action, function (res) {
            if (res.success) {
                var list = res.list;
                if (list.length > 0) {
                    DS.getView('sms/sms_table_item', function (view) {
                        var html = [];
                        var sms = null;
                        for (var i = 0, len = list.length; i < len; i++) {
                            sms = list[i];
                            html.push(DS.renderMethodViewNew(view, sms));
                            if (cache) {
                                cache[sms._id] = sms;
                            }
                        }
                        $('#my_sms_main_panel .my_sms_table_data').html(html.join(''));
                    });
                } else {
                    $('#my_sms_main_panel .my_sms_table_data').html('');
                }
                DS.updatePagination('my_sms_form', res.count, handler.cdr.queryPageSize, data.page);
            } else {
                alert('查询失败，请重新查询');
            }
        });
    },
    all_sms: function(menu){
            handler.sms.initSmsCondition_table('all_sms_main_panel');
            $('#all_sms_query_link').trigger('click');
    },
    getSmsStatusSelectorHtml: function (nameAttr, value) {
        var data = {
            selectorName: nameAttr,
            cacheType: 'smsStatus',
            cacheItemName: 'code_name',
            cacheItemValue: 'code_value',
            selectorValue: value
        }
        return handler.cdr.getCallSheetSelectorHtml(data);
    },
    getSmsStatusName: function (smsStatusValue) {
        var smsStatus = getDicCache('smsStatus', smsStatusValue);
        if (smsStatus) {
            return smsStatus.code_name;
        } else {
            return '';
        }
    },

    closeSmsDetail: function (data) {
        $('#show_sms_detail_Modal').modal('hide');
        $('#show_sms_template_detail_Modal').modal('hide');
        $('#cdr_detail_pane').empty();
        if(data){
            var callback = eval('handler.' + data);
            if(callback && typeof callback == 'function'){
                callback();
            }
        }
    },
    getChannelStatus: function(data){
        var currentSms = handler.sms.smsDataCache[data];
        if (!currentSms) {
            currentSms = handler.sms.mySmsDataCache[data];
        }
        if(currentSms){
            if(currentSms[currentSms.num]){
                return currentSms[currentSms.num].st_wgcode;
            }else{
                return '';
            }
        }else{
            return '';
        }
    },
    changeSmsAfterClose: function(target){
        if($(target).attr("checked") == 'checked'){
            DS.setCookie("smsAfterClose", 'true', 30);
        }else{
            DS.setCookie("smsAfterClose", 'false', 30);
        }
    },
    batch_send_sms: function(data){
        var signs = getCache('smsSign');
        for(var i=0 ;i<signs.length ;i++){
            signs[i].value = signs[i].subcode+"_"+signs[i].name;
        }
        var options = generateComboxOptionsFromDocs(getCache('smsSign'), 'name', 'value','');
        $('.batchSmsSign').html(options);
        var templates = getCache('smsTemplate');
        for(var i=0;i<templates.length;i++){
            templates[i].displayName = templates[i].name+':'+templates[i].content;
        }
        var templateOptions = generateComboxOptionsFromDocs(templates, 'displayName', 'num','');
        $('.batchSmsTemplate').html(templateOptions);
        if(templates.length > 0){
            var firstTemplate = templates[0];
            handler.sms.changeBatchSmsTemplate(firstTemplate.num);
        }else{
            $('#batchSmsSendTemplatePane').empty();
            $('#batchSmsSendTemplatePane').html('目前还没报备任何短信模板，请报备');
        }
        $(".sms_manual_tip").tooltip({title:'您发送的内容不会直接提交至运营商.<br>我们的审核人员将按照提交顺序依次检查内容.<br>审核通过才会提交运营商.<br>所以人工审核到达速度比较慢.<br>建议报备短信模板发送.',placement:'bottom',html:true});
    },
    changeBatchSmsTemplate: function(data){
        var curTemplate = getCacheByKey('smsTemplate','num', data);
        handler.sms.smsBatchCurTemplate = curTemplate;
        var inputHtml = '';
        var html = curTemplate.content;
        for(var i=1;i<=curTemplate.vars;i++){
            html = html.replace('{'+i+'}', '<span contenteditable="true" onkeyup="javascript:handler.sms.changeBatchSmsTemplateVar(this)" id="batchSmsTemplateVar'+i+'"></span>');
            inputHtml += '变量'+i+':<input type="text" name="batchSmsTemplateVar'+i+'">'
        }
        $("#batchSmsContentPane").html(html);
        $('#batchSmsVarsListPane').html(inputHtml);
        var sign = getCacheByKey('smsSign','_id', curTemplate.sign);
        $('#batchSmsTemplateSign').html(sign.name);
        $('.batchTemplateSign').val(sign.subcode + '_' + sign.name);
        $('.batchSmsTemplateTitle').empty();
    },
    changeBatchSmsTemplateVar: function(target){
        var nameId = $(target).attr('id');
        var templateContent = handler.sms.smsBatchCurTemplate.content;
        var textLen = templateContent.length - handler.sms.smsBatchCurTemplate.vars * 3;
        var sign = getCacheByKey('smsSign','_id', handler.sms.smsBatchCurTemplate.sign).name;
        var inputList = $('#batchSmsContentPane').children("span");
        var inputCount = 0;
        for(var i=0 ; i < inputList.length ; i++){
            inputCount += $(inputList[i]).text().length;
        }
        var otherInputCount = 0;
        for(var i=0 ; i < inputList.length ; i++){
            if($(inputList[i]).attr('id') != nameId){
                otherInputCount += $(inputList[i]).text().length;
            }
        }
        if(textLen+inputCount>(handler.sms.textCount-sign.length)){
            $(target).text($(target).text().substring(0,handler.sms.textCount-sign.length-textLen-otherInputCount));
            $("#batchSmsVarsListPane").find("input[name="+nameId+"]").val($(target).text().substring(0,handler.sms.textCount-sign.length-textLen-otherInputCount));
            inputCount = 0;
            for(var i=0 ; i < inputList.length ; i++){
                inputCount += $(inputList[i]).text().length;
            }
        }
        var html = "您还可以输入<span style='color: green'>"+(handler.sms.textCount-sign.length-textLen-inputCount)
            +"</span>/<span style='color: red'>"+(handler.sms.textCount-sign.length)+"</span>个文字";
        if((inputCount + textLen + sign.length) > 66){
            var n=1;
            var nc = parseInt((inputCount + textLen + sign.length-66)/66);
            var nv = (inputCount + textLen + sign.length-66)%66;
            n+=nc;
            if(nv >0){
                n+=1;
            }
            html += "<br>内容过长短信将以<span style='color: orange'>"+n+"</span>条发出";
            handler.sms.splitCount = n;
        }else{
            handler.sms.splitCount = 1;
        }
        $('.batchSmsTemplateTitle').html(html);
        $('input[name='+nameId+']').val($(target).text());
        if (inputCount>3) {
            $(target).css("display","inline");
        }
    },
    choiceBatchSendType: function(data){
        $('.batchSmsSendType').val(data);
        if (data=="manual") {
            if (localStorage.smsphonnesmscount==0) {
                $("#my_sms_form .tabbable").addClass("topshow");
                $("body").append('<div class="modal-backdrop fade in"></div><div id="sms_warn"><div class="alert"><h4>重要通知</h4><p>根据运营商要求，人工审核短信的发送功能将在2016年1月25日关闭。后续只能通过报备模板的方式来发送短信，请您尽快报备短信模板，以免影响您的正常业务。</p><p>报备模板请发邮件到service@7moor.com</p><span class="button" onclick="closeSmsWarn();">我知道了</span></div></div>');
                localStorage.smsphonnesmscount= 1;
            }
        }
    },
    sendBatchSms: function(data){
        if(data.nums == ''){
            $().alertmessage('showError', "请输入手机号码！");
            return false;
        }
        if(data.sign == ''){
            $().alertmessage('showError', "无签名不能发短信，请向我们备案您的签名！");
            return false;
        }
        if(data.sendType == 'manual'){
            if(data.content == ''){
                $().alertmessage('showError', "请输入短信的内容！");
                return false;
            }
            delete data.template;
        }else{
            var curTemplate = handler.sms.smsBatchCurTemplate;
            var content = curTemplate.content;
            data.templateid = curTemplate._id;
            data.template = content;
            data.vars = curTemplate.vars;
            for(var i=1;i<=curTemplate.vars;i++){
                content = content.replace('{'+i+'}', data['batchSmsTemplateVar'+i]);
            }
            content = handler.sms.delSpecialChar(content);
            data.content = content;
            if(handler.sms.smsBatchCurTemplate.smsChannel.length > 0){
                data.smsChannel = handler.sms.smsBatchCurTemplate.smsChannel[0];
            }else{
                $().alertmessage('showError', "该模板配置通道异常，无法发送，请联系管理员！");
                return false;
            }
        }
        var numArr = null;
        var isHuiChe = true;
        if(data.nums.indexOf(',') != -1){
            isHuiChe = false;
            numArr = data.nums.split(',');
        }else{
            numArr = data.nums.split('\n');
        }
        if(numArr.length>3000){
            $().alertmessage('showError', "单次群发手机号码不能超过3000个，请检查号码数量！");
            return false;
        }
        for(var i=0; i<numArr.length; i++){
            var patrn=/^(13[0-9]{9})|(15[0-9][0-9]{8})|(18[0-9][0-9]{8})|(17[0-9][0-9]{8})|(14[0-9][0-9]{8})$/;
            if (!patrn.exec(numArr[i]) || numArr[i].length != 11){
                $().alertmessage('showError', "含有不正确的手机号码，请检查！"+numArr[i]);
                return false;
            }
        }
        data.numCount = numArr.length;
        data.splitCount = handler.sms.batchSplitCount;
        data.batchTemplateSign =handler.sms.delSpecialChar(data.batchTemplateSign);
        if (isHuiChe) {
            data.nums = data.nums.replace(/\n/g, ',');
        }
        var action = {
            action: "app.sms.sendBatchSms",
            data: data
        }
        DS.send(action, function (res) {
            if (!res.success) {
                if(res.message == '403'){
                    $().alertmessage('showError','发送短信失败,您账号的余额小于本次群发的金额！');
                    return;
                }
                $().alertmessage('showError','发送短信失败！');
                console.info('Send Batch sms failure: ' + res.message);
                return;
            }
            $().alertmessage('showSuccess','发送成功！');
        });
    },
    custSendSms: function(data){
        $('#SmsEnable').popover('show');
        var signs = getCache('smsSign');
        for(var i=0 ;i<signs.length ;i++){
            signs[i].value = signs[i].subcode+"_"+signs[i].name;
        }
        var options = generateComboxOptionsFromDocs(getCache('smsSign'), 'name', 'value','');
        $(".smsInput_hidden").val(data);
        var desc=checkHideTel(data);
        $("#dialout_input").val(desc);
        $('.smsInput').val(desc);
        $('.smsSign').html(options);
        var templates = getCache('smsTemplate');
        for(var i=0;i<templates.length;i++){
            templates[i].displayName = templates[i].name+':'+templates[i].content;
        }
        var templateOptions = generateComboxOptionsFromDocs(templates, 'displayName', 'num','');
        $('.smsTemplate').html(templateOptions);
        if(templates.length > 0){
            var firstTemplate = templates[0];
            handler.sms.changeSmsTemplate(firstTemplate.num);
        }else{
            $('#smsSendTemplatePane').empty();
            $('#smsSendTemplatePane').html('目前还没报备任何短信模板，请报备');
        }
        $("#sms_tip").tooltip({title:'未备案签名不能发短信.<br>短信会在5分钟内送达.<br>超过66字(含签名)后每66字记一条.',placement:'right',html:true});
        var smsAfterClose = DS.getCookie("smsAfterClose");
        if(smsAfterClose == 'true'){
            $(".smsAfterClose").attr("checked", true);
        }else{
            $(".smsAfterClose").attr("checked", false);
        }
    },
    searchAllSms: function(data, src){
        var data = handler.cdr.getSearchCondition(data);
        if (!handler.cdr.validateCondition(data)) {
            return false;
        }
        data.pageSize = handler.cdr.queryPageSize;
        data.page = src.val() || 1;
        handler.cdr.parseSearchDate(data);
        handler.sms.smsDataCache = {};
        var cache = handler.sms.smsDataCache;
        var action = {
            action: 'app.sms.queryAllSms',
            data: data
        }
        DS.send(action, function (res) {
            if (res.success) {
                var list = res.list;
                if (list.length > 0) {
                    DS.getView('sms/sms_table_item', function (view) {
                        var html = [];
                        var sms = null;
                        for (var i = 0, len = list.length; i < len; i++) {
                            sms = list[i];
                            html.push(DS.renderMethodViewNew(view, sms));
                            if (cache) {
                                cache[sms._id] = sms;
                            }
                        }
                        $('#all_sms_main_panel .all_sms_table_data').html(html.join(''));
                    });
                } else {
                    $('#all_sms_main_panel .all_sms_table_data').html('');
                }
                DS.updatePagination('all_sms_form', res.count, handler.cdr.queryPageSize, data.page);
            } else {
                alert('查询失败，请重新查询');
            }
        });
    },
    sms_import:function(menu){
        var searchPane = $('#contact_list_sms');
        handler.sms.initSmsCondition(searchPane);
        var btn=searchPane.find('.normal_search');
        btn.click();
    },
    showTab:function(data,src) {
//        var pane=$("#view_"+data);
        if(data == "my_sms"){
            handler.swapTab(data, 'sms/my_sms');
        }else if(data == "all_sms"){
            handler.swapTab(data, 'sms/all_sms');
        }else if(data == "mass_sms"){
            handler.swapTab(data, 'sms/batch_send_sms');
        }else if(data == "import_mass_sms"){
            handler.swapTab(data, 'sms/import_batch_send_sms');
        }else if(data == 'sms_template_query'){
            handler.swapTab(data, 'sms/sms_template_query');
        }
    },
    renderSmsHidden: function(phone, notShowSendIcon){
        var html=phone;
        var desc=checkHideTel(phone);
        html=desc;
        if(notShowSendIcon){
            return html
        }else{
            if(isHasFunc("func_sort_phone_bar_send_sms")){
                html+='<a href="#" class="ds_do_action" ds_action="sms.custSendSms" style="text-decoration:none" ds_data="'+phone
                    +'" title="发短信" >&nbsp;<i class="icon-envelope" style="margin-top: 0px"></i></a>';
            }
        }
        return html;
    },
    import_batch_send_sms: function(menu){
        handler.sms.searchSmsImport(null,$('#import_list_'+menu).find('.contacts_caption'));
    },
    searchSmsImport: function(data, src) {
        var pane = src.closest('.ds_search_pane');
        pane.attr('ds_index', '1');
        var index = 1;
        var query = getSearchCondition(pane);
        handler.sms._querySmsImport(index, query.data, query.queryDisplay, pane);
    },
    _querySmsImport:function(index,query,queryDisplay,pane){
        var menu = pane.attr('ds_menu');
        var action = {
            action: 'app.sms.querySmsImportTask',
            data: {
                query: query,
                queryType: menu,
                option: {
                    index: index,
                    pageSize:10
                }
            }
        };
        var listPane = pane.find('.list-inside');
        DS.send(action, function(response){
            if(response.success){
                renderSearchResult(pane,index,10, query,queryDisplay, response);
                var contacts = response.list;
                if(contacts.length > 0){
                    for (var i in contacts) {
                        listPane.append(pane.find('#tmpl_sms_task_item').tmpl(contacts[i]));
                    }
                    var collapsePane = pane.find('.search.collapse');
                    if(collapsePane.hasClass('in'))
                        collapsePane.collapse('hide');
                }
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    moreSmsImport:function(data, src){
        var pane = src.closest('.ds_search_pane');
        var index = parseInt(pane.attr('ds_index'))+1;
        var query = getSearchCondition(pane);
        handler.sms._querySmsImport(index, query.data, query.queryDisplay, pane);
    },
    addImpTask:function(menu,src){
        var pane=$("#sms_import_pane");
        if (localStorage.smsimportsmscount==0) {
            localStorage.smsimportsmscount = 1;
            $("body").append('<div class="modal-backdrop fade in"></div><div id="sms_warn"><div class="alert"><h4>重要通知</h4><p>根据运营商要求，人工审核短信的发送功能将在2016年1月25日关闭。后续只能通过报备模板的方式来发送短信，请您尽快报备短信模板，以免影响您的正常业务。</p><p>报备模板请发邮件到service@7moor.com</p><span class="button" onclick="closeSmsWarn();">我知道了</span></div></div>');
            $("#import_list_import_mass_sms .dropdown-menu").addClass("topshow");
        }
        DS.getView('sms/sms_import_add',function(view){
            pane.empty();
            pane.html(view);
            $("#sms_tip").tooltip({title:'未备案签名不能发短信.<br>短信会在5分钟内送达.<br>超过66字(含签名)后每66字记一条.',placement:'right',html:true});
        });
    },
    addImpTemplateTask:function () {
        var pane=$("#sms_import_pane");
        DS.getView('sms/sms_template_import_add',function(view){
            pane.empty();
            pane.html(view);
        });
    },
    downloadTmpl:function(){
        var url="./template/sms_template.xls?";
        DS.downloadFile(url);
    },
    downloadTmplSmsTemplate:function(){
        var url="./template/sms_template_tmpl.xls?";
        DS.downloadFile(url);
    },
    importSms:function(formId){
        var frm=$("#"+formId)[0];
        var file = frm.file.value;
        var type = file.substring(file.lastIndexOf(".") + 1, file.length);
        if(type != 'xls' && type != 'xlsx'){
            $().alertmessage('showError', "只支持excel格式上传！");
            return;
        }
        var url='./form';
        frm.action=url;
        frm.submit();
    },
    uploadSuccess:function(rep){
        if(rep=='success'){
            $().alertmessage('showSuccess', '导入任务已提交');
            $("#sms_import_pane").empty();
            handler.sms.import_batch_send_sms('import_batch_send_sms');
        }else{
            $().alertmessage('showError', '导入失败');
        }
    },
    showImportTask:function(batchNo,src){
        handler.sms.loadTaskInfo(batchNo,src);
    },
    loadTaskInfo:function(batchNo,src){
        var pane=$("#sms_import_pane");
        DS.getView("sms/sms_task_tab", function (view) {
            pane.html(view);
            pane.find(".ds_do_action").attr({"ds_data":batchNo});
            pane.find('li a:first').click();
        });
    },
    loadTaskImpList:function(data,src){
        $('#task_tab_import_to_send').show();
        var batchNo=data;
        if(typeof data=='object'){
            batchNo=data.batchNo
        }
        var pane2=$("#sms_task_tab_content");
        var page=1;
        if(src && !src.hasClass("ds_do_action"))page=src.val();
        if(!page)page=1;
        DS.getView("sms/sms_task_import", function (view) {
            pane2.html(view);
            pane2.find("input[name='batchNo']").val(batchNo);
            var pane=pane2.find("#task_import_list_pane");
            var action = {
                action: 'app.sms.queryTaskImport',
                data: {batchNo:batchNo,page:page}
            };
            DS.send(action,function(response){
                if(response.success){
                    var list=response.list;
                    var count=response.count;
                    for(var i in list){
                        pane.append($("#tmpl_taskimport_item").tmpl(list[i]));
                    }
                    var frmId ="import_query_frm";
                    DS.updatePagination(frmId, count, 10, page);
                }else{
                    $().alertmessage('showError', errMsg);
                }
            });
        });
    },
    loadTaskInvalidList:function(data,src){
        $('#task_tab_import_to_send').hide();
        var batchNo=data;
        if(typeof data=='object'){
            batchNo=data.batchNo
        }
        var pane2=$("#sms_task_tab_content");
        var page=1;
        if(src && !src.hasClass("ds_do_action"))page=src.val();
        if(!page)page=1;
        DS.getView("sms/sms_task_invalid", function (view) {
            pane2.html(view);
            pane2.find("input[name='batchNo']").val(batchNo);
            var pane=pane2.find("#task_repeat_list_pane");
            var action = {
                action: 'app.sms.queryTaskInvalid',
                data: {batchNo:batchNo,page:page,limit:10}
            };
            DS.send(action,function(response){
                if(response.success){
                    var list=response.list;
                    var count=response.count;
                    for(var i in list){
                        pane.append($("#tmpl_taskimport_item").tmpl(list[i]));
                    }
                    var frmId = "invalid_query_frm";
                    DS.updatePagination(frmId, count, 10, page);
                }else{
                    $().alertmessage('showError', errMsg);
                }
            });
        });
    },
    smsImportSend: function(data){
        var action = {
            action: 'app.sms.smsCountImportToSend',
            data: {batchNo:data}
        }
        DS.send(action,function(response){
            if(response.success){
                if(!response.hasImport){
                    if(!confirm('这批短信已经提交发送过，请确认您要再次发送？')){
                        return;
                    }
                }
                var action = {
                    action: 'app.sms.smsImportSend',
                    data: {batchNo:data,type:response.type}
                };
                DS.send(action,function(response){
                    if(response.success){
                        $().alertmessage('showSuccess','提交发送成功！');
                        handler.sms.loadTaskImpList(data);
                    }else{
                        $().alertmessage('showError', response.message);
                    }
                });
            }else{
                $().alertmessage('showError', response.message);
            }
        });
    },
    getM7StatusDisplayName: function(status){
        var displayName = '';
        var allStatus = getCache('smsStatus');
        for(var i=0 ;i<allStatus.length;i++){
            if(status == allStatus[i].code_value){
                displayName = allStatus[i].code_name;
                break;
            }
        }
        if(displayName == '')
            displayName = '未知';
        return displayName;
    },
    getSignDisplayName: function(signId){
        var displayName = '';
        var sign = getCacheByKey('smsSign','_id',signId);
        if(sign){
            return sign.name;
        }else{
            return '';
        }
    },
    sms_template_query:function(data){
        var data = {
            selectorName: 'sign',
            cacheType: 'smsSign',
            cacheItemName: 'name',
            cacheItemValue: '_id',
            selectorValue: ""
        }
        var options = handler.cdr.getCallSheetSelectorHtml(data);
        $('#sms_template_query_panel .sms_sign_id_selector').html(options);
        $("#sms_template_query_link").trigger('click');
    },
    searchSmsTemplate: function(data, src){
        var data = handler.cdr.getSearchCondition(data);
        if (!handler.cdr.validateCondition(data)) {
            return false;
        }
        data.pageSize = handler.cdr.queryPageSize;
        data.page = src.val() || 1;
        handler.cdr.parseSearchDate(data);
        handler.sms.smsTemplateDataCache = {};
        var cache = handler.sms.smsTemplateDataCache;
        var action = {
            action: 'app.sms.querySmsTemplate',
            data: data
        }
        DS.send(action, function (res) {
            if (res.success) {
                var list = res.list;
                if (list.length > 0) {
                    DS.getView('sms/sms_template_table_item', function (view) {
                        var html = [];
                        var smsTemp = null;
                        for (var i = 0, len = list.length; i < len; i++) {
                            smsTemp = list[i];
                            html.push(DS.renderMethodViewNew(view, smsTemp));
                            if (cache) {
                                cache[smsTemp._id] = smsTemp;
                            }
                        }
                        $('#sms_template_query_panel .sms_template_table_data').html(html.join(''));
                    });
                } else {
                    $('#sms_template_query_panel .sms_template_table_data').html('');
                }
                DS.updatePagination('sms_template_form', res.count, handler.cdr.queryPageSize, data.page);
            } else {
                alert('查询失败，请重新查询');
            }
        });
    },
    showSmsTemplateDetail: function (data) {
        var currentSmsTemp = handler.sms.smsTemplateDataCache[data];
        if (currentSmsTemp) {
            DS.getView('sms/show_sms_template_detail', function (view) {
                var html = '';
                html = DS.renderMethodViewNew(view, currentSmsTemp);
                var panel = $('#modal_panel');
                panel.empty();
                panel.append(html);
                $('#show_sms_template_detail_Modal').modal({'backdrop': 'static'});
            });
        } else {
            alert('系统获取短信详细信息失败，请重试。');
        }
    }
}