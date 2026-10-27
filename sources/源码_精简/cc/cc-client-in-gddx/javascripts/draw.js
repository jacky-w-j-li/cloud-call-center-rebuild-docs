var render = {
    _leftMenuRegExp: new RegExp("\\/","g"),

    replaceDataByObject : function(obj,html,keyWord){
        obj = obj || {};
        for(var key in obj){
            var prefix = key.substr(0,1) == '_' ?'_':'__';
            var reg = new RegExp(prefix+key,'g');
            html = html.replace(reg,obj[key]);
        }
        if(keyWord){
            reg = new RegExp(keyWord,'g');
            html = html.replace(reg,"<strong class='red'>"+keyWord+"</strong>");
        }
        return render.transformDataByMethod(html);
    },
    transformDataByMethod: function (html) {
        var reg = /_@.+?@_/;
        while (reg.test(html)) {
            var resp = reg.exec(html);
            var methodStr = resp[0].substring(2, resp[0].length - 2);
            var result = eval("handler." + methodStr);
            html = html.replace(resp[0], result);
        }
        return html;
    },
    renderAccountListItem: function(account, html){
        html = html.replace(/__id/g,account.account)
            .replace(/__name/g, account.name)
            .replace(/__company/g,account.company)
            .replace(/__createTime/g, account.createTime);
        return html;
    },
    renderLeftMenuHandlerPage: function(page) {
        return page.replace(render._leftMenuRegExp, ".");
    },
    renderLeftMenuPage: function(page) {
        return page.replace(render._leftMenuRegExp, "_");
    },
    randerApprovalBusinessInfo :function(obj,html){
        html = "";
        if(obj.apprType == "2"){
            html += '审核类型:无效审核<br/>';
            html += '无效原因:'+obj.reason+'<br/>';
        }else if(obj.apprType == "3"){
            html += '审核类型:成单审核<br/>';
            html += '成单金额:'+obj.money+'<br/>';
            html += '成单备注:'+obj.memo+'<br/>';
        }else if(obj.apprType == "4"){
            html += '审核类型:丢单审核<br/>';
            html += '无效原因:'+obj.reason+'<br/>';
            html += '竞争对手:'+obj.competitors+'<br/>';
        }else if(obj.apprType == "8"){
            html += '审核类型:续费审核<br/>';
            html += '成单金额:'+obj.money+'<br/>';
            html += '成单备注:'+obj.memo+'<br/>';
        }
        return html;
    },
    randerApprovalBusinessResult :function(obj,html){
        html = "";
        if(obj.status == "1"){
            html+="审核通过<br/>";
        }else if(obj.status == "2") {
            html+="审核不通过<br/>";
            html+="审核不通过原因:"+obj.unPassReason;
        }
        return html;
    },
    renderBusinessActiveHistory:function(obj, html){
        html = html.replace(/__createTime/g, obj.createTime)
            .replace(/__creator/g, obj.createUser + " 创建工单【"+obj.flow+"】 处理状态【"+obj.step+"】");
        var content = "";
        var titleContent = "";
        for(var i in obj.data) {
            content += (i + ":" + obj.data[i]) + "<div class='clear'>&nbsp;</div>";
            titleContent += (i + ":" + obj.data[i]) + "&#10;";
        }
        html = html.replace(/__content/g, content).replace(/__titleContent/g,  "");
        return html;
    },
    renderActiveHistory: function(obj, html, rel) {
        if(rel == "notes") {
            var _agent=getCache("agents", obj.userId);
            var _agentDesc="";
            if(_agent){
                _agentDesc=_agent.displayName;
            }
            var isComplete = "";
            if(obj.status && obj.status == "1") {
                isComplete = "task_title";
            }
            html = html.replace(/__createTime/g, obj.lastUpdateTime)
                .replace(/__creator/g," 最近更新人:" + _agentDesc)
                .replace(/__content/g, "<span class='"+isComplete+"'>"+obj.remark+"</span>");
            return html;
        } else if(rel == "task") {
            var _agent=getCache("agents", obj.lastUpdateUser);
            var _agentDesc="";
            if(_agent){
                _agentDesc=_agent.displayName;
            }
            var isComplete = "";
            if(obj.isComplete) {
                isComplete = "task_title";
            }
            html = html.replace(/__createTime/g, obj.lastUpdateTime)
                .replace(/__creator/g, " 最近更新人:" + _agentDesc);
            html = html.replace(/__content/g, "<span class='"+isComplete+"'>"+obj.title+"</span>");
            return html;
        } else if(rel == "business"){
            html = html.replace(/__createTime/g, obj.createTime)
                .replace(/__creator/g, obj.createUser + " 创建工单【"+obj.flow+"】 处理状态【"+obj.step+"】");
            var content = "";
            var titleContent = "";
            for(var i in obj.data) {
                content += (i + ":" + obj.data[i]) + "<div class='clear'>&nbsp;</div>";
                titleContent += (i + ":" + obj.data[i]) + "&#10;";
            }
            html = html.replace(/__content/g, content).replace(/__titleContent/g,  "");
            return html;
        }else if(rel=='sheetLeak'){
            var content="<span class=''>通话时长："+obj.timeLen+"</span>&nbsp;&nbsp;&nbsp;<a class='ds_do_action' href='#' ds_action='customer.showRecord' ds_data='"+obj.recordUrl+"'><i class='icon-play-circle'></i> 听取录音</a>";

            if(obj.CALL_TIME_LENGTH<=0){
                content="";
            }
            html = html.replace(/__createTime/g, obj.OFFERING_TIME)
                .replace(/__callStatus/g,obj.STATUS)
                .replace(/__callType/g,obj.CONNECT_TYPE)
                .replace(/__creator/g, obj.DISPOSAL_AGENT)//" 呼叫类型:【"+obj.CONNECT_TYPE+"】【" +obj.STATUS+"】处理座席:【"+obj.DISPOSAL_AGENT+"】")
                .replace(/__content/g, content);
            return html;
        }else if(rel == "call") {
//            var content="<span class=''>通话时长："+obj.timeLen+"</span><span style='margin-left:50px;'>录音：<audio id='cdrListener2' controls='' src='"+obj.recordUrl+"'/></span>";
            var content="<span class=''>通话时长："+obj.timeLen+"</span>&nbsp;&nbsp;&nbsp;<a class='ds_do_action' href='#' ds_action='customer.showRecord' ds_data='"+obj.recordUrl+"'><i class='icon-play-circle'></i> 听取录音</a>";

            if(obj.CALL_TIME_LENGTH<=0){
                content="";
            }
            html = html.replace(/__createTime/g, obj.OFFERING_TIME)
                .replace(/__callStatus/g,obj.STATUS)
                .replace(/__callType/g,obj.CONNECT_TYPE)
                .replace(/__creator/g, obj.DISPOSAL_AGENT)//" 呼叫类型:【"+obj.CONNECT_TYPE+"】【" +obj.STATUS+"】处理座席:【"+obj.DISPOSAL_AGENT+"】")
                .replace(/__content/g, content);
            return html;
        } else if(rel == "businessFlow") {
            html = html.replace(/__createTime/g, obj.time)
                .replace(/__creator/g, obj.user + " " + obj.info);
            var content = "";
            var titleContent = "";
            for(var i in obj.data) {
                content += ("<span style='display: inline-block;vertical-align: top;'>"+i + ":"+"</span>" + obj.data[i]) + "<div class='clear'>&nbsp;</div>";
                titleContent += (i + ":" + obj.data[i]) + "&#10;";
            }
            titleContent = titleContent.replace(/<a.*?>(.*)<\/a>/ig,"$1");
            html = html.replace(/__content/g, content).replace(/__titleContent/g,  titleContent);
            return html;
        } else if(rel == "mail") {
            var _agent=getCache("agents", obj.user);
            var _agentDesc="";
            if(_agent){
                _agentDesc=_agent.displayName;
            }
            var _status=obj.status;
            var _html1="";
            if(_status=='deal'){
                _html1="处理座席:" + _agentDesc;
            }else{
                _html1="未处理";
            }
            html = html.replace(/__createTime/g, obj.receiveTime)
                .replace(/__creator/g, _html1);
            var tmpl='<a href="#" class="ds_do_action" ds_action="callMail.showMailDetail" ds_data="_#_id#_">_#subject#_</a>';
            html = html.replace(/__content/g,DS.renderMethodViewNew(tmpl,obj));
            return html;
        } else if(rel == "weixin") {
            var type=obj.type;
            var msgType=obj.msgType;
//            console.dir(obj);
            var _agentDesc="";
            if(type=='in'){
                _agentDesc="用户:"+obj.nickname||'';
            }else{
                var _agent=getCache("agents", obj.user);
                if(_agent){
                    _agentDesc=_agent.displayName;
                }
                _agentDesc="<span style='color:#62c462'>座席:"+_agentDesc+"</span>";
            }

            html = html.replace(/__createTime/g, obj.createTime)
                .replace(/__creator/g, _agentDesc);

            var tmpl='<span>_#content#_</span>';
            if(msgType=='text'){
                tmpl=DS.renderMethodViewNew(tmpl,obj);
            }else if(msgType=='image'){
                tmpl='<a href="#" class="ds_do_action" ds_action="callWeixin.showBigImg" ds_data="'+obj.content+'">'+
                    '<img src="'+obj.content+'" style="max-width:100px;"></a>';
                if(type=='out'){
                    tmpl='<a href="#" class="ds_do_action" ds_action="callWeixin.showBigImg" ds_data="'+obj.filePath+'">'+
                        '<img src="'+obj.filePath+'" style="max-width:100px;"></a>';
                }
            }

            html = html.replace(/__content/g,tmpl);
            return html;
        } else if(rel == "webchat") {
            var statusDesc=getDicCacheName("mailStatus",obj.status);
            var tmpl='<a href="#" class="ds_do_action" ds_action="webchat.showChatHistory" ds_data="'+obj._id+'">'+
                'webchat会话：最近消息状态['+statusDesc+']</a>';
            obj.createTime=obj.updatedTime;
            obj.creator="";
            obj.content=tmpl;

            html = DS.renderMethodViewNew(html,obj);
            return html;
        }
    },
    getAgentName : function(id){
        if(id == null || id == ''){
            return '';
        }
        var agent = getCache('agents',id);
        if(agent != null && agent != undefined){
            return agent.displayName;
        }
        return '';
    },
    getStatusName : function(data){
        if(data === 'dealing'){
            return '已接听';
        }else if(data === 'notDeal'){
            return '振铃未接听';
        }else if(data === 'leak'){
            return 'ivr';
        }else if(data === 'queueLeak'){
            return '排队放弃';
        }else if(data === 'blackList'){
            return '黑名单';
        }else{
            return '';
        }
    },
    generateIvrSoundOptions : function(currentVal){
        var sounds = session.ivrMap.ivr.ivr_sound;
        if(!sounds || sounds.length<1){
            return '<option value="">--系统默认--</option>';
        }
        var selectOptionHtml = '<option value="__value" selected>__name</option>';
        var optionHtml = '<option value="__value">__name</option>';
        var html = '';
        html += '<option value="">--系统默认--</option>';
        for(var i=0 ; i < sounds.length ; i++){
            if(sounds[i].SoundType === 'normal'){
                if(currentVal === sounds[i].Filename || currentVal+".wav" === sounds[i].Filename){
                    html+=selectOptionHtml.replace(/__value/g,sounds[i].Filename)
                        .replace(/__name/g,sounds[i].DisplayName);
                }else{
                    html+=optionHtml.replace(/__value/g,sounds[i].Filename)
                        .replace(/__name/g,sounds[i].DisplayName);
                }
            }
        }
        return html;
    },
    generateIvrMusicOnHoldOptions : function(currentVal){
        var sounds = session.ivrMap.ivr.ivr_sound;
        if(!sounds || sounds.length<1){
            return '<option value="">--系统默认--</option>';
        }
        var selectOptionHtml = '<option value="__value" selected>__name</option>';
        var optionHtml = '<option value="__value">__name</option>';
        var html = '';
        html += '<option value="">--系统默认--</option>';
        for(var i=0 ; i < sounds.length ; i++){
            if(sounds[i].SoundType === 'hold'){
                if(currentVal === sounds[i].Filename || currentVal+".wav" === sounds[i].Filename){
                    html+=selectOptionHtml.replace(/__value/g,sounds[i].Filename)
                        .replace(/__name/g,sounds[i].DisplayName);
                }else{
                    html+=optionHtml.replace(/__value/g,sounds[i].Filename)
                        .replace(/__name/g,sounds[i].DisplayName);
                }
            }
        }
        return html;
    },
    getConnectTypeName : function(data){
        if(data === 'normal'){
            return '普通来电';
        }else if(data === 'dialout'){
            return '外呼去电';
        }else if(data === 'transfer'){
            return '转接来电';
        }else if(data === 'dialTransfer'){
            return '外呼转接';
        }else if(data === 'none'){
            return '未知';
        }else{
            return '';
        }
    },
    getInvestgateName : function(data){
        var investOptions = null;
        investOptions = getCacheByKey('options', 'name', '满意度调查选项').options;
        if(investOptions == null || investOptions == undefined){
            return data;
        }else{
            for(var i=0 ; i<investOptions.length ; i++){
                if(data == investOptions[i].options[0].name){
                    return investOptions[i].name;
                }
            }
            return data;
        }
    },
    call: {
        renderSelectOption: function() {
            var optionList = session.dicMap["callUrlType"];
            var optionHtml = "";
            for (var i=0; i<optionList.length; i++){
                optionHtml += '<option value='+ optionList[i].code_value +'>' + optionList[i].code_name+ '</option>';
            }
            return optionHtml;
        },
        renderList: function(html, data) {
            var enable="";
            if(data.enable=="true"){
                enable = "启用中"
            }else{
                enable = "未启用"
            }
            html = html.replace(/__url/g, data.url)
                .replace(/__id/g, data._id)
                .replace(/__name/g, data.name)
                .replace(/__enable/g, enable)
                .replace(/__type/g, getGeneralCache("callUrlType", data.type).code_name);
            return html;
        },
        renderInterBusiness: function(currentVal){
            var businessFlow = getCache('businessFlow',null,true);
            if(businessFlow.length < 1){
                return '<option value="">--请选择--</option>';
            }
            var selectOptionHtml = '<option value="__value" selected>__name</option>';
            var optionHtml = '<option value="__value">__name</option>';
            var html = '';
            for(var i=0 ; i < businessFlow.length ; i++){
                if(currentVal === businessFlow[i]._id){
                    html+=selectOptionHtml.replace(/__value/g, businessFlow[i]._id)
                        .replace(/__name/g,"系统业务 "+businessFlow[i].name);
                }else{
                    html+=optionHtml.replace(/__value/g, businessFlow[i]._id)
                        .replace(/__name/g,"系统业务 "+businessFlow[i].name);
                }
            }
            return html;
        },
        renderCallInterTable: function(html, itemName, itemUrl, itemId){
            html += "<tr><td>"+ itemName +"</td><td>"+ itemUrl +"</td>" +
                "<td><a href='#' class='action' appaction='config.call.editCallInter' appdata='"+ itemId +"'>编辑</a>" +
                "&nbsp;&nbsp;<a href='#' class='action' appaction='config.call.removeCallInter' appdata='"+ itemId +"'>删除</a></td></tr>";
            return html;
        },
        renderCallInterList: function(html, data){
            var varLen = data.callInterUrl.length;
            if(varLen > 45){
                html = html.replace(/__callInterName/g, data.callInterName)
                    .replace(/__callInterUrl/g, data.callInterUrl.substring(0, 45) + "...")
                    .replace(/__callTitle/g, data.callInterUrl)
                    .replace(/__id/g, data._id);
            }else{
                html = html.replace(/__callInterName/g, data.callInterName)
                    .replace(/__callInterUrl/g, data.callInterUrl)
                    .replace(/__callTitle/g, data.callInterUrl)
                    .replace(/__id/g, data._id);
            }
            return html;
        },
        renderEditCallInter: function(html, data){
            html = html.replace(/__callInterName/g, data.callInterName)
                .replace(/__callInterUrl/g, data.callInterUrl)
                .replace(/__id/g, data._id);
            return html;
        }
    },
    ivr:{
        renderNewPbxSelect : function(data){
            if(data == null){
                $('#pbx_btn_group_title').css('display','block');
                //$('#pbx_btn_group').css('display','none');
            }else{
                $('#pbx_btn_group_title').css('display','none');
                //$('#pbx_btn_group').css('display','block');
                //if(!session.user.isAdmin){
                //    $('#pbx_btn_group').parent("div").css('display','none');
                //}
                var pbxs = session.account.pbx;
                var html = '';
                for(var i=0 ;i < pbxs.length ; i++){
                    if(data.PBX === pbxs[i].PBX){
                        $("#current_pbx_name").html(pbxs[i].NickName+" ("+pbxs[i].PBX+")");
                    }
                    html+="<li><a href='#' class='ds_do_action' ds_action='config.callConfig.changePbx' ds_data="
                        + pbxs[i].PBX + ">"+pbxs[i].NickName+" ("+pbxs[i].PBX+")</a></li>";
                }
                $("#all_pbx_list").html(html);
            }
        },
        phoneBar:{
            renderPhoneBarConfig: function(phoneBarConfig, html) {
                html = html.replace(/__PhoneBarItemName/g, phoneBarConfig.PhoneBarItemName)
                    .replace(/__PhoneBarItemId/g, phoneBarConfig.PhoneBarItemId)
                    .replace(/__IsEnable/g, phoneBarConfig.ShowIsEnable)
                    .replace(/___id/g, phoneBarConfig._id)
                    .replace(/__IsSystemConfig/g, phoneBarConfig.IsSystemConfig)
                    .replace(/__UpdateTime/g, phoneBarConfig.UpdateTime);
                return html;
            }
        },
        renderIvrToolsTableTr : function(accounts){
            var html = '';
            for(var i = 0 ; i < accounts.length ; i++){
                html += '<tr><td>' + accounts[i]._id +'</td>'+
                    '<td>' + accounts[i].name +'</td>'+
                    '<td>' + accounts[i].companyName +'</td>'+
                    '<td>' + render.ivr.getAccountStatus(accounts[i].status) +'</td>'+
                    '<td><a href="#" class="ds_do_action" ds_action="config.callConfig.ivrToolsSave" ds_data="'+accounts[i]._id+'">保存</a>&nbsp;&nbsp;' +
                    '<a href="#" class="ds_do_action" ds_action="config.callConfig.ivrToolsSaveAndReload" ds_data="'+accounts[i]._id+'">保存并生效</a></td>'+
                    '</tr>';
            }
            return html;
        },
        getAccountStatus : function(status){
            if(status == 'normal'){
                return '正式';
            }else if(status == 'newTry'){
                return '新开';
            }else if(status == 'stop'){
                return '停用';
            }else{
                return status;
            }
        }
    },
    qualityCheck:{
        renderQualityCallSheetTable: function(data,id,randomTemplate){
            var html = '';
            var currentData = null;
            for(var i=0 ; i < data.length ; i++){
                currentData = data[i];
                var oneRow = '<tr>';
                oneRow += render.qualityCheck.getCallSheetTableBaseInfo(currentData);
                if ($('#quality_task_random_checkbox').is(':checked')) {
                    if (currentData.QA_SPECIALIST[0] && session.user._id && session.user._id == currentData.QA_SPECIALIST[0]) {
                        oneRow+='<td style="width:50px"><a class="ds_do_action" ds_action="qualityCheck.showGradeDetail" ds_data="'+currentData.CALL_SHEET_ID+'">评分</a>' +
                            '<input type="hidden" class="quality_call_task_id" value="'+currentData.TASK_ID+'"/>'+
                            '&nbsp;&nbsp;<a class="ds_do_action" ds_action="qualityCheck.replacementRecord" ds_data="'+currentData.CALL_SHEET_ID+'">置换</a>' +
                            '&nbsp;&nbsp;<a style="display:block;width:50px" class="ds_do_action" ds_action="qualityCheck.showListenLog" ds_data="'+currentData.CALL_SHEET_ID+'">试听日志</a></td>';
                    } else {
                        oneRow+='<td style="width:50px"><a style="display:block;width:50px" class="ds_do_action" ds_action="qualityCheck.showListenLog" ds_data="'+currentData.CALL_SHEET_ID+'">试听日志</a></td>';
                    }

                } else if ($('#quality_record_random_checkbox').is(':checked') && randomTemplate) {
                    oneRow+='<td style="width:50px"><a class="ds_do_action" ds_action="qualityCheck.showGradeDetail" ds_data="'+currentData.CALL_SHEET_ID+'">评分</a>' +
                        '&nbsp;&nbsp;<a class="ds_do_action" ds_action="qualityCheck.condition_replacement_record" ds_data="'+currentData.CALL_SHEET_ID+'" template_data="'+randomTemplate+'">置换</a>' +
                        '&nbsp;&nbsp;<a style="display:block;width:50px" class="ds_do_action" ds_action="qualityCheck.showListenLog" ds_data="'+currentData.CALL_SHEET_ID+'">试听日志</a></td>';
                } else {
                    oneRow+='<td><a class="ds_do_action" ds_action="qualityCheck.showGradeDetail" ds_data="'+currentData.CALL_SHEET_ID+'">评分</a>' +
                        '&nbsp;&nbsp;<a class="ds_do_action" ds_action="qualityCheck.showListenLog" ds_data="'+currentData.CALL_SHEET_ID+'">试听日志</a></td>';
                }
                oneRow += '</tr>';
                html += oneRow;
            }
            $('#'+id+'_table_data').html(html);
        },
        /*renderQualityTaskCallSheetTable: function(data,id){
            var html = '';
            var currentData = null;
            for(var i=0 ; i < data.length ; i++){
                currentData = data[i];
                var oneRow = '<tr>';
                oneRow += render.qualityCheck.getCallSheetTableBaseInfo(currentData);

                oneRow+='<td><a class="ds_do_action" ds_action="qualityCheck.showGradeDetail" ds_data="'+currentData.CALL_SHEET_ID+'">评分</a>' +
                    '&nbsp;&nbsp;<a class="ds_do_action" ds_action="qualityCheck.showListenLog" ds_data="'+currentData.CALL_SHEET_ID+'">试听日志</a></td>';
                oneRow += '</tr>';
                html += oneRow;
            }
            $('#'+id+'_table_data').html(html);
        },*/
        getCallSheetTableBaseInfo : function(currentData){
            var baseInfoHtml = '';
            baseInfoHtml+='<td><span style="width: 150px;display: block;text-overflow: ellipsis;white-space: nowrap;overflow: hidden;" title="'+currentData.CUSTOMER_NAME+'">'+currentData.CUSTOMER_NAME+'</span></td>';
            if($('#quality_task_random_checkbox').is(':checked')) {
                baseInfoHtml+='<td><span style="width: 150px;display: block;text-overflow: ellipsis;white-space: nowrap;overflow: hidden;" title="'+currentData.TASK_ID+'">'+currentData.TASK_ID+'</span></td>';
            }
            baseInfoHtml+='<td>'+currentData.CALL_NO+'</td>';
            baseInfoHtml+='<td>'+currentData.CALLED_NO+'</td>';
            baseInfoHtml+='<td>'+render.getConnectTypeName(currentData.CONNECT_TYPE)+'</td>';
            baseInfoHtml+='<td>'+render.getStatusName(currentData.STATUS)+'</td>';
            baseInfoHtml+='<td>'+handler.cdr.getAgentName(currentData.DISPOSAL_AGENT)+'</td>';
            if(currentData.QUEUE_NAME == null || currentData.QUEUE_NAME == 'null'){
                currentData.QUEUE_NAME = '';
            }
            baseInfoHtml+='<td>'+currentData.QUEUE_NAME+'</td>';
            if(currentData.INVESTIGATE == null || currentData.INVESTIGATE == 'null'){
                currentData.INVESTIGATE = '';
            }
            baseInfoHtml+='<td>'+render.getInvestgateName(currentData.INVESTIGATE)+'</td>';
            baseInfoHtml+='<td>'+currentData.OFFERING_TIME+'</td>';
            baseInfoHtml+='<td>'+handler.cdr.getCallTimeLength(currentData.CALL_TIME_LENGTH)+'</td>'
//            baseInfoHtml+='<td>'+calculateTalkTime(currentData.BEGIN_TIME,currentData.END_TIME)+'</td>';
            return baseInfoHtml;
        },
        renderCallSheetGradeTable : function(data,type, isTask){
            var callSheetQualityCheckConfig = null;
            var callSheetQualityCheckType = null;
            var option = null;
            var html = [];
            var n;
            if (isTask) {//判断此通话数据是不是质检任务
                callSheetQualityCheckConfig = data;
                callSheetQualityCheckType = type;
            } else {
                callSheetQualityCheckConfig = handler.config.qualityCheck.getQualityCheckConfigs();
                callSheetQualityCheckType = handler.config.qualityCheck.getQualityCheckTemplateType();
            }
            if (callSheetQualityCheckType) {
                $('#callSheetGradeTable').find('tr[class="info"]').find('td').first().attr('style','width:240px;');
                for(var ind in callSheetQualityCheckConfig) {
                    option = callSheetQualityCheckConfig[ind];
                    n = ind%2;
                    if(n == 0){
                        html.push('<tr first_data="yes" class="task_table '+option.name+' task_level_1"><td  style="cursor:pointer;">');
                    }else{
                        html.push('<tr first_data="yes" class="task_table '+option.name+'"><td  style="cursor:pointer;">');
                    }

                    html.push(option.value+' ');
                    if (option.child != '') {
                        if(ind>0){
                            html.push('<b class="caret-right"></b>');
                        }else{
                            html.push('<b class="caret-bottom"></b>');
                        }

                    }
                    html.push('</td>');
                    if (option.child.length > 0) {
                        html.push('<td class="task_table_td task_table_input_bg" style="width: 180px;padding-right:100px;"><input type="radio" disabled name="'+option.name+'" value="yes"/><span>通过&nbsp;&nbsp;</span>');
                        html.push('<input type="radio" disabled name="'+option.name+'" value="no"/><span>不通过&nbsp;&nbsp;</span>');
                        html.push('<input type="radio" disabled name="'+option.name+'" value="dont"/><span>不涉及</span>');
                        html.push('</td></tr>');
                        render.qualityCheck.getChildFile(option.child, html, 25,n);
                    } else {
                        html.push('<td class="task_table_td task_table_input_bg"style="width: 180px;padding-right:100px;"><input type="radio"  name="'+option.name+'" value="yes"/><span>通过&nbsp;&nbsp;</span>');
                        html.push('<input type="radio"  name="'+option.name+'" value="no"/><span>不通过&nbsp;&nbsp;</span>');
                        html.push('<input type="radio"  name="'+option.name+'" value="dont"/><span>不涉及</span>');
                        html.push('</td></tr>');
                    }

                }
                return html.join('');
            } else {
                var isFirst=true;
                var orderHtmlArr = [];
                for(var ind in callSheetQualityCheckConfig) {
                    option = callSheetQualityCheckConfig[ind];
                    var optionHtml = [];
                    optionHtml.push('<tr><td>');
                    optionHtml.push(option.name);
                    optionHtml.push('</td>');
                    optionHtml.push('<td><div class="input-prepend" style="margin-bottom:0px;">');
                    optionHtml.push('<span class="add-on" style="height: 14px;line-height: 15px">&nbsp;');
                    optionHtml.push(option.weight);
                    optionHtml.push('%&nbsp;</span><input type="text" class="input-small call_sheet_grade ');
                    if(isFirst){
                        optionHtml.push('input_first');
                        isFirst = false;
                    }
                    optionHtml.push(' " required name="');
                    optionHtml.push(option.order);
                    optionHtml.push('" msgName="'+option.name+'"/><span>');
                    optionHtml.push('X');
                    optionHtml.push('</span></div>&nbsp;单项最大分为100&nbsp;&nbsp;');

                    if(option.fatal){
                        optionHtml.push('<div style="display: inline-block;">');
                        optionHtml.push('<a href="#" data-toggle="tooltip" class="fatal_warning"><span class="icon-exclamation-sign"></span></a>');
                        optionHtml.push('</div>');
                    }
                    optionHtml.push('</td></tr>')
                    orderHtmlArr[option.order] = optionHtml;
                }
                for(var i=0;i< callSheetQualityCheckConfig.length;i++){
                    var htmlArr = orderHtmlArr[i+1];
                    for(var j=0;j< htmlArr.length;j++){
                        html.push(htmlArr[j]);
                    }
                }
                return html.join('');
            }
        },
        getChildFile : function (data, html, count,n) {
          var option = '';
          if (data && data.length) {
              for(var ind in data) {
                  option = data[ind];

                  if(!n){
                          html.push('<tr  hidden  class="task_table '+option.name+' task_level_1">');
                  }else{
                          html.push('<tr  hidden  class="task_table '+option.name+'">');
                  }
                  html.push('<td style="padding-left: '+count+'px;cursor:pointer">&nbsp&nbsp');
                  html.push(option.value+' ');
                  if (option.child != '') {
                      html.push('<b class="caret-bottom"></b>');
                      if(option.fatalValue){
                          html.push('&nbsp;&nbsp;<div style="display: inline-block;">');
                          html.push('<a href="#" data-toggle="tooltip" name="'+option.Non_Fatal+'" title="非致命项,个数大于等于 '+option.Non_Fatal+' 则致命" class="fatal_warning_grade"><span class="icon-exclamation-sign"></span></a>');
                          html.push('</div>');
                      }
                      html.push('</td>');
                      html.push('<td class="task_table_td task_table_input_bg" style="width: 180px;padding-right:100px;"><input disabled type="radio" name="'+option.name+'" value="yes"/><span>通过&nbsp;&nbsp;</span>');
                      html.push('<input disabled type="radio" name="'+option.name+'" value="no"/><span>不通过&nbsp;&nbsp;</span>');
                      html.push('<input disabled type="radio" name="'+option.name+'" value="dont"/><span>不涉及</span>');
                      html.push('<input type="hidden" class="hidden_'+option.name+'"/>');
                      html.push('</td></tr>');
                  } else {
                      if(option.fatalValue){
                          html.push('&nbsp;&nbsp;<div style="display: inline-block;">');
                          html.push('<a href="#" data-toggle="tooltip" name="'+option.Non_Fatal+'" title="非致命项,个数大于等于 '+option.Non_Fatal+' 则致命" class="fatal_warning_grade"><span class="icon-exclamation-sign"></span></a>');
                          html.push('</div>');
                      }
                      html.push('</td>');
                      html.push('<td class="task_table_td task_table_input_bg" style="width: 180px;padding-right:100px;"><input  type="radio" name="'+option.name+'" value="yes"/><span>通过&nbsp;&nbsp;</span>');
                      html.push('<input type="radio" name="'+option.name+'" value="no"/><span>不通过&nbsp;&nbsp;</span>');
                      html.push('<input type="radio" name="'+option.name+'" value="dont"/><span>不涉及</span>');
                      html.push('<input type="hidden" class="hidden_'+option.name+'"/>');
                      html.push('</td></tr>');
                  }
                  if (option.child) {
                      render.qualityCheck.getChildFile(option.child, html, count+10,n);
                  }
              }
          }

            return html;
        },
        renderQualityCheckListConfig: function(floors){
            var callSheetQualityCheckConfig = handler.config.qualityCheck.getQualityCheckConfigs();
            var option = null;
            var tableHeader = $('#quality_check_list_table_header');
            var oldhtml = '<td>主叫号码</td><td>被叫号码</td><td>接听座席</td><td>呼叫类型</td><td>呼入技能组</td><td>满意度</td><td>呼叫时间</td><td>质检时间</td><td>通话时长</td><td>质检人员</td><td>评级</td><td>质检得分</td>';
            var html = '<td>主叫号码</td><td>被叫号码</td><td>接听座席</td><td>呼叫类型</td><td>呼入技能组</td><td>满意度</td><td>呼叫时间</td><td>质检时间</td><td>通话时长</td><td>质检人员</td>';
            var istj = false;
            for(var ind in callSheetQualityCheckConfig) {
                option = callSheetQualityCheckConfig[ind];
                if(option.value){
                    istj = true;
                    html += '<td>' + option.value + '</td>';
                    if(floors==1){continue;}
                    for(var qc_one = 0;qc_one<option.child.length;qc_one++){
                        var op1_child = option.child[qc_one];
                        html += '<td>' + op1_child.value + '</td>';
                        if(floors==2){continue;}
                        for(var qc_two = 0;qc_two<op1_child.child.length;qc_two++){
                            var op2_child = op1_child.child[qc_two];
                            html += '<td>' + op2_child.value + '</td>';
                            if(floors==3){continue;}
                            for(var qc_three = 0;qc_three<op2_child.child.length;qc_three++){
                                var op3_child = op2_child.child[qc_three];
                                html += '<td>' + op3_child.value + '</td>';
                                if(floors==4){continue;}
                                for(var qc_four = 0;qc_four<op3_child.child.length;qc_four++){
                                    var op4_child = op3_child.child[qc_four];
                                    html += '<td>' + op4_child.value + '</td>';
                                    if(floors==5){continue;}
                                    for(var qc_five = 0;qc_five<op4_child.child.length;qc_five++){
                                        var op5_child = op4_child.child[qc_five];
                                        html += '<td>' + op5_child.value + '</td>';
                                        if(floors==6){continue;}
                                        for(var qc_six = 0;qc_six<op5_child.child.length;qc_six++){
                                            var op6_child = op5_child.child[qc_six];
                                            html += '<td>' + op6_child.value + '</td>';
                                            if(floors==7){continue;}
                                            for(var qc_seven = 0;qc_seven<op6_child.child.length;qc_seven++){
                                                var op7_child = op6_child.child[qc_seven];
                                                html += '<td>' + op7_child.value + '</td>';
                                                if(floors==8){continue;}
                                                for(var qc_eight = 0;qc_eight<op7_child.child.length;qc_eight++){
                                                    var op8_child = op7_child.child[qc_eight];
                                                    html += '<td>' + op8_child.value + '</td>';
                                                    if(floors==9){continue;}
                                                    for(var qc_nine = 0;qc_nine<op8_child.child.length;qc_nine++){
                                                        var op9_child = op8_child.child[qc_nine];
                                                        html += '<td>' + op9_child.value + '</td>';

                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }else{
                    if(option.fatal){
                        oldhtml += '<td>' + option.name + '(' + option.weight + '%)' + '<div style="display: inline-block;"><a href="#" data-toggle="tooltip" class="fatal_warning_show" data-original-title="" title=""><span class="icon-exclamation-sign"></span></a></div></td>';
                    }else{
                        oldhtml += '<td>' + option.name + '(' + option.weight + '%)' + '</td>';
                    }
                    $('#qualityCheckListQueryFrm select[name="GRADE_CONFIG"] option').eq(parseInt(ind)+1).attr("ds_data",option.weight);
                }
            }
            if(istj){
                html+='<td>点评内容</td>';
                html+='<td>整体</td>'
                html+='<td style="table-layout: fixed;">操作</td>';
                tableHeader.empty();
                tableHeader.html(html);
            }
            else{
                oldhtml+='<td>点评内容</td>';
                oldhtml+='<td style="table-layout: fixed;">操作</td>';
                tableHeader.empty();
                tableHeader.html(oldhtml);}
        },
        renderQualityCheckConfigs: function(){
            var callSheetQualityCheckConfig = handler.config.qualityCheck.getQualityCheckConfigs();
            var html = [];
            html.push('<option value="">--请选择--</option>');
            for(var ind in callSheetQualityCheckConfig) {
                var option = callSheetQualityCheckConfig[ind];
                html.push('<option value="');
                html.push(option.order);
                html.push('">');
                html.push(option.name);
                html.push('</option>');
            }
            return html.join('');
        },
        renderQualityCheckList: function(list,floors) {
            DS.getView('qualityCheck/quality_check_list_query_item', function(view) {
                if (list && list.length > 0) {
                    var item = null;
                    var html = [];
                    var row = null;
                    var option = null;
                    var gradeTd = null;
                    var istj = false;
                    var callSheetQualityCheckConfig = handler.config.qualityCheck.getQualityCheckConfigs();
                    for (var i = 0, len = list.length; i < len; i++) {
                        item = list[i];
                        gradeTd = '';
                        for (var ind in callSheetQualityCheckConfig) {
                            option = callSheetQualityCheckConfig[ind];
                            if (option.value) {
                                istj = true;
                                if (option.name in item.GRADE_AMOUNT) {
                                    gradeTd += '<td>' + item.GRADE_AMOUNT[option.name] + '</td>'
                                } else {
                                    gradeTd += '<td></td>'
                                }
                                if(floors==1){continue;}
                                for (var qc_one = 0; qc_one < option.child.length; qc_one++) {
                                    var op1_child = option.child[qc_one];
                                    if (op1_child.name in item.GRADE_AMOUNT) {
                                        gradeTd += '<td>' + item.GRADE_AMOUNT[op1_child.name] + '</td>'
                                    } else {
                                        gradeTd += '<td></td>'
                                    }
                                    if(floors==2){continue;}
                                    for (var qc_two = 0; qc_two < op1_child.child.length; qc_two++) {
                                        var op2_child = op1_child.child[qc_two];
                                        if (op2_child.name in item.GRADE_AMOUNT) {
                                            gradeTd += '<td>' + item.GRADE_AMOUNT[op2_child.name] + '</td>'
                                        } else {
                                            gradeTd += '<td></td>'
                                        }
                                        if(floors==3){continue;}
                                        for (var qc_three = 0; qc_three < op2_child.child.length; qc_three++) {
                                            var op3_child = op2_child.child[qc_three];
                                            if (op3_child.name in item.GRADE_AMOUNT) {
                                                gradeTd += '<td>' + item.GRADE_AMOUNT[op3_child.name] + '</td>'
                                            } else {
                                                gradeTd += '<td></td>'
                                            }
                                            if(floors==4){continue;}
                                            for (var qc_four = 0; qc_four < op3_child.child.length; qc_four++) {
                                                var op4_child = op3_child.child[qc_four];
                                                if (op4_child.name in item.GRADE_AMOUNT) {
                                                    gradeTd += '<td>' + item.GRADE_AMOUNT[op4_child.name] + '</td>'
                                                } else {
                                                    gradeTd += '<td></td>'
                                                }
                                                if(floors==5){continue;}
                                                for (var qc_five = 0; qc_five < op4_child.child.length; qc_five++) {
                                                    var op5_child = op4_child.child[qc_five];
                                                    if (op5_child.name in item.GRADE_AMOUNT) {
                                                        gradeTd += '<td>' + item.GRADE_AMOUNT[op5_child.name] + '</td>'
                                                    } else {
                                                        gradeTd += '<td></td>'
                                                    }
                                                    if(floors==6){continue;}
                                                    for (var qc_six = 0; qc_six < op5_child.child.length; qc_six++) {
                                                        var op6_child = op5_child.child[qc_six];
                                                        if (op6_child.name in item.GRADE_AMOUNT) {
                                                            gradeTd += '<td>' + item.GRADE_AMOUNT[op6_child.name] + '</td>'
                                                        } else {
                                                            gradeTd += '<td></td>'
                                                        }
                                                        if(floors==7){continue;}
                                                        for (var qc_seven = 0; qc_seven < op6_child.child.length; qc_seven++) {
                                                            var op7_child = op6_child.child[qc_seven];
                                                            if (op7_child.name in item.GRADE_AMOUNT) {
                                                                gradeTd += '<td>' + item.GRADE_AMOUNT[op7_child.name] + '</td>'
                                                            } else {
                                                                gradeTd += '<td></td>'
                                                            }
                                                            if(floors==8){continue;}
                                                            for (var qc_eight = 0; qc_eight < op7_child.child.length; qc_eight++) {
                                                                var op8_child = op7_child.child[qc_eight];
                                                                if (op8_child.name in item.GRADE_AMOUNT) {
                                                                    gradeTd += '<td>' + item.GRADE_AMOUNT[op8_child.name] + '</td>'
                                                                } else {
                                                                    gradeTd += '<td></td>'
                                                                }
                                                                if(floors==9){continue;}
                                                                for (var qc_nine = 0; qc_nine < op8_child.child.length; qc_nine++) {
                                                                    var op9_child = op8_child.child[qc_nine];
                                                                    if (op9_child.name in item.GRADE_AMOUNT) {
                                                                        gradeTd += '<td>' + item.GRADE_AMOUNT[op9_child.name] + '</td>'
                                                                    } else {
                                                                        gradeTd += '<td></td>'
                                                                    }
                                                                    ;
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (option.order in item) {
                                    gradeTd += '<td>' + item[option.order] + '</td>';
                                } else {
                                    gradeTd += '<td></td>'
                                }
                            }
                        }
                        if(item.COMMENTS == ""){
                            gradeTd += '<td>' + item.COMMENTS+ '</td>';
                        }else{
                            gradeTd += '<td>' + item.COMMENTS.toString().substr(0,5)+"..." + '</td>';
                        }
                        if (istj) {
                            gradeTd+= '<td>' + item.GRADE_AMOUNT['amount'] + '</td>';
                            view = view.replace('<td>__GRADE_AMOUNT</td>','').replace('<a style="display: inline-block;width: 50px" class="ds_do_action" ds_action="qualityCheck.showQualityComments" ds_data="___id">查看备注</a>','<a class="ds_do_action" ds_action="qualityCheck.showGradeedDetail" ds_data="___id">查看评分</a>');
                            view = view.replace("<td>_@qualityCheck.getQualityCheckLevel('_#GRADE_AMOUNT#_')@_</td>","");
                            row = DS.renderMethodViewNew(view, item);
                            if (session.user._id == item.GRADE_USER) {
                                row = row.replace(/_AGIN_GRADE/g, '<a style="display:inline-block;width: 50px"  class="ds_do_action" ds_action="qualityCheck.againGrade" ds_data="___id">重新评分</a>');
                            } else {
                                row = row.replace(/_AGIN_GRADE/g,'');
                            }
                            gradeTd = gradeTd.replace(/no/g, '不通过').replace(/yes/g, '通过').replace(/dont/g, '不涉及');
                            row = row.replace(/___id/g, item._id);
                            row = row.replace(/__GRADE_ITEMS/g, gradeTd);
                            html.push(row);
                        } else {
                            row = DS.renderMethodViewNew(view, item);
                            if (session.user._id == item.GRADE_USER) {
                                row = row.replace(/_AGIN_GRADE/g, '<a style="display:inline-block;width: 50px"  class="ds_do_action" ds_action="qualityCheck.againGrade" ds_data="___id">重新评分</a>');
                            } else {
                                row = row.replace(/_AGIN_GRADE/g,'');
                            }
                            row = row.replace(/___id/g, item._id);
                            row = row.replace(/__GRADE_ITEMS/g, gradeTd);
                            html.push(row);
                        }
                    }
                    $('#quality_check_list_query_table_data').html(html.join(''));
                } else {
                    $('#quality_check_list_query_table_data').html('');
                }
            });
        },
        renderQualityCheckRandomConfigs: function(){
            var callSheetQualityCheckRandomConfig = handler.config.qualityCheck.getQualityCheckConfigs();
            var html = [];
            html.push('<option value="">--请选择--</option>');
            for(var ind in callSheetQualityCheckRandomConfig) {
                var option = callSheetQualityCheckRandomConfig[ind];
                html.push('<option value="');
                html.push(option.order);
                html.push('">');
                html.push(option.name);
                html.push('</option>');
            }
            return html.join('');
        },
        renderQualityTaskForQuery: function(data){
            var html = [];
            html.push('<td style="width: 200px">任务名称</td>');
            html.push('<td>任务总量</td>');
            html.push('<td>已监控量</td>');
            html.push('<td>待监控量</td>');
            html.push('<td>置换量</td>');
            html.push('<td>质检专员</td>');
            html.push('<td>创建时间</td>');
            html.push('<td>任务状态</td>');
            $('#quality_task_query_table_header').html(html.join(''));
            var baseInfoHtml = [];
            if (data && data.length) {
                for (var ind in data) {

                    var alert_count = data[ind].ALREADY_MONITORING ? data[ind].ALREADY_MONITORING : 0;
                    var wait_count = data[ind].WAIT_MONITORING ? data[ind].WAIT_MONITORING : 0;
                    var replacement = data[ind].REPLACEMENT ? data[ind].REPLACEMENT : 0;
                    var sum = alert_count*1+wait_count*1
                    baseInfoHtml.push('<tr><td><span style="width: 150px;display: block;text-overflow: ellipsis;white-space: nowrap;overflow: hidden;" title="'+data[ind].TASK_NAME+'">'+data[ind].TASK_NAME+'</span></td>');
                    baseInfoHtml.push('<td><span>'+sum+'</span></td>');
                    baseInfoHtml.push('<td><span>'+alert_count+'</span></td>');
                    baseInfoHtml.push('<td>'+wait_count+'</td>');
                    baseInfoHtml.push('<td>'+replacement+'</td>');
                    var agents = getCache("agents");
                    for (var i=0; i < agents.length; i++) {
                        if (agents[i]._id == data[ind].query.QA_SPECIALIST){
                            baseInfoHtml.push('<td>'+agents[i].displayName+'['+agents[i].exten+']'+'</td>');
                        }
                    }
                    baseInfoHtml.push('<td>'+data[ind].time+'</td>');
                    if (data[ind].hide) {
                        baseInfoHtml.push('<td style="color: green">使用中</td></tr>');
                    } else{
                        baseInfoHtml.push('<td style="color: red">已停用</td></tr>');
                    }

                }
            }
            $('#quality_task_monitor_table_data').html(baseInfoHtml.join(''));
        },
        renderQualityCheckForQuery: function(){
            var callSheetQualityCheckConfig = handler.config.qualityCheck.getQualityCheckConfigs();
            var html = [];
            var ispass = false;
            html.push('<td>座席</td>');
            for(var ind in callSheetQualityCheckConfig) {
                option = callSheetQualityCheckConfig[ind];
                if(!option.child){
                    html.push('<td>');
                    html.push(option.name+'('+option.weight+'%)');
                    html.push('</td>');
                }else{
                    ispass = true ;
                    html.push('<td>');
                    html.push(option.value);
                    html.push('</td>');
                }
            }
            if(ispass){
                html.splice(1,0,'<td>座席监控数</td><td>通过数</td>');
                html.push('<td>整体</td>');
            }else{
                html.push('<td>平均总得分</td>');
            }
            $('#quality_check_query_table_header').html(html.join(''));
        },
        renderQualityCheckResultTable: function(res) {
            var html = [];
            DS.getView('qualityCheck/quality_check_result_query_item', function(view){
                var item = null;
                var option = null;
                var callSheetQualityCheckConfig = handler.config.qualityCheck.getQualityCheckConfigs();
                if (res.list && res.list.length > 0) {
                    for(var i= 0,len=res.list.length;i<len;i++) {
                        item = res.list[i];
                        var rowView = null;
                        var rowQualityCheckConfig = '';
                        rowView = view.replace(/__DISPOSAL_AGENT/g, handler.cdr.getAgentName(item.DISPOSAL_AGENT));
                        if(!res.type){
                            for(var ind in callSheetQualityCheckConfig) {
                                option = callSheetQualityCheckConfig[ind];
                                rowQualityCheckConfig += '<td>' + item[option.order] + '</td>';
                            }
                            rowView = rowView.replace(/__CALL_SHEET_GRADE_AVG/g, rowQualityCheckConfig)
                                .replace(/__AMOUNT_AVG/g, item.AMOUNT);
                        }else{
                            rowQualityCheckConfig+='<td>' + item['all_count'] + '</td><td>' + item['all'] + '</td>';
                            for(var ind in callSheetQualityCheckConfig) {
                                option = callSheetQualityCheckConfig[ind];
                                rowQualityCheckConfig += '<td>' + item[option.name+'_cent'] + '</td>';
                            }
                            rowView = rowView.replace(/__CALL_SHEET_GRADE_AVG/g, rowQualityCheckConfig)
                                .replace(/__AMOUNT_AVG/g, item['all_cent'] );
                        }



                        html.push(rowView);
                    }
                    $('#quality_check_query_query_table_data').html(html.join(''));
                } else {
                    $('#quality_check_query_query_table_data').html('');
                }
                DS.updatePagination('qualityCheckAgentQueryFrm',res.count,handler.cdr.queryPageSize,res.page||1);

//                $(".class_list span .quality_check_query_result_count").text(res.count);
//                var list = $(".class_list #quality_check_query_query_index li");
//                updatePagination(list, res.count, handler.cdr.cdrPageSize, res.page||1);
            });
        }
    },
    cdr:{
        getAgentSelect : function(callSheetId , agentId){
            var agents = getCache('agents');
            var html = '<select onchange="handler.cdr.notDealCallbackAgentChange(this.value)">';
            html += '<option value="'+'@'+callSheetId+'">--请选择--</option>';
            for(var i=0 ; i < agents.length ; i ++){
                //if(agents[i].sipConfigId === session.user.sipConfigId){
                var option ='';
                if(agentId === agents[i]._id){
                    option += '<option value="'+agents[i]._id+'@'+callSheetId+'" selected>';
                }else{
                    option += '<option value="'+agents[i]._id+'@'+callSheetId+'">';
                }
                option += agents[i].displayName+'['+ agents[i].exten +']'+'</option>';
                html += option;
                //}
            }
            html += '</select>';
            return html;
        },
        renderNotdealCallSheetTable : function(data){
            var html = '';
            for(var i=0 ; i < data.length ; i++){
                var oneRow = '<tr>';
                oneRow+='<td><input type="checkbox" onclick="selectOneNotDealCdr()" name="notDealCheckbox" value="'+data[i]._id+'"></td>';
                oneRow+='<td><span style="width: 100px;display: block;text-overflow: ellipsis;white-space: nowrap;overflow: hidden;" title="'+data[i].NEW_CUSTOMER_NAME+'">'+data[i].NEW_CUSTOMER_NAME+'</span></td>';
                oneRow+='<td>'+data[i].CALL_NO+'</td>';
                oneRow+='<td>'+data[i].NEW_CALLED_NO+'</td>';
                oneRow+='<td>'+data[i].NEW_OFFERING_TIME+'</td>';
                oneRow+='<td>'+data[i].LEAK_HISTORY.length+'</td>';
                oneRow+='<td>'+handler.cdr.getAgentName(data[i].NEW_DISPOSAL_AGENT)+'</td>';
                oneRow+='<td>'+handler.cdr.getQueueName(data[i].NEW_ERROR_MEMO)+'</td>';
                oneRow+='<td>'+render.cdr.getAgentSelect(data[i]._id,data[i].CALLBACK_AGENT)+'</td>';
                oneRow+='<td style="min-width:7em"><a class="ds_do_action" ds_action="cdr.showCallSheetLeakHistory" ds_data="'+data[i]._id+'">查看详情</a>&nbsp;&nbsp;' +
                    '<a class="ds_do_action delete_one_btn" ds_action="cdr.confirmDelCdr" ds_data="'+data[i]._id+'">删除</a></td>'
                oneRow += '</tr>';
                html += oneRow;
            }
            return html;
        },
        renderAssignCallBackAgentTable : function(data){
            var agents = getCache('agents');
            var html = '';
            for(var i=0 ;i<agents.length;i++){
                // if(agents[i].sipConfigId === session.user.sipConfigId){
                var oneRow = '';
                if(i%2 == 0){
                    oneRow = '<tr>';
                }
                oneRow += '<td align="right">'+agents[i].displayName+'['+ agents[i].exten +']'+':</td>';
                oneRow += '<td><label style="display:none">分配未接电话个数</label><input type="text" name="'+agents[i]._id+'" class="form-control input-sm number" style="display: inline-block; width: 100px;" required="" datatype="Number,Range" min="0" msg="请输入大于零或等于零的整数" value="0"></td>';
                oneRow += '<td>个&nbsp;&nbsp;&nbsp;&nbsp;</td>';
                if(i%2 != 0 ){
                    oneRow += '</tr>';
                }
                html += oneRow;
                //}
            }
            return html;
        },
        renderCdrChannelDetail : function(data){
            var html = '';
            for(var i=0 ; i < data.length ; i++){
                var oneRow = '<tr>';
                oneRow += '<td>'+data[i].TIMESTAMP+'</td>';

                if(data[i].LOCATION_NAME === 'Ringing' || data[i].LOCATION_NAME === 'Link'){
                    oneRow += '<td>座席:'+handler.cdr.getAgentName(data[i].LOCATION_ID)+'</td>'
                }else{
                    oneRow += '<td>'+handler.cdr.getChannelLocationName(data[i].LOCATION)+'</td>';
                }
                if(data[i].LOCATION.toLowerCase() === 'queue'){
                    oneRow += '<td>'+handler.cdr.getQueueName(data[i].LOCATION_ID)+'</td>';
                }else{
                    oneRow += '<td>'+handler.cdr.getChannelLocationName(data[i].LOCATION_NAME)+'</td>';
                }
                oneRow += '</tr>';
                html += oneRow;
            }
            return html;
        }
    },
    monitor : {
        renderAutoClaimDispaly : function(status){
            if(status == undefined){
                return '';
            }else if(status == true){
                return '开';
            }else if(status == false){
                return '关';
            }
        },
        renderAccessNoTypeDispaly : function(type){
            if(type == 'web'){
                return 'PC在线咨询';
            }else if(type == 'sdk'){
                return '手机APP';
            }else if(type == 'weixin'){
                return '微信';
            }else if(type == 'wap'){
                return '手机在线咨询';
            }
        }
    }
}

