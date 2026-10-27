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
        }else if(rel == "call") {
//            var content="<span class=''>通话时长："+obj.timeLen+"</span><span style='margin-left:50px;'>录音：<audio id='cdrListener2' controls='' src='"+obj.recordUrl+"'/></span>";
            var content="<span class=''>通话时长："+obj.timeLen+"</span>&nbsp;&nbsp;&nbsp;<a class='ds_do_action' href='#' ds_action='customer.showRecord' ds_data='"+obj.recordUrl+"'><i class='icon-play-circle'></i> 听取录音</a>";

            if(obj.CALL_TIME_LENGTH<=0){
                content="";
            }
            html = html.replace(/__createTime/g, obj.OFFERING_TIME)
                .replace(/__creator/g, " 呼叫类型:【"+obj.CONNECT_TYPE+"】【" +obj.STATUS+"】处理座席:【"+obj.DISPOSAL_AGENT+"】")
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
            html = html.replace(/__url/g, data.url)
                .replace(/__id/g, data._id)
                .replace(/__name/g, data.name)
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
        renderQualityCallSheetTable: function(data,id){
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
        },
        getCallSheetTableBaseInfo : function(currentData){
            var baseInfoHtml = '';
            baseInfoHtml+='<td><span style="width: 150px;display: block;text-overflow: ellipsis;white-space: nowrap;overflow: hidden;" title="'+currentData.CUSTOMER_NAME+'">'+currentData.CUSTOMER_NAME+'</span></td>';
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
        renderCallSheetGradeTable : function(){
            var callSheetQualityCheckConfig = handler.config.qualityCheck.getQualityCheckConfigs();
            var html = [];
            var option = null;
            var isFirst=true;
            for(var ind in callSheetQualityCheckConfig) {
                option = callSheetQualityCheckConfig[ind];
                html.push('<tr><td>');
                html.push(option.name);
                html.push('</td>');
                html.push('<td><div class="input-prepend" style="margin-bottom:0px;">');
                html.push('<span class="add-on" style="height: 14px;line-height: 15px">&nbsp;');
                html.push(option.weight);
                html.push('%&nbsp;</span><input type="text" class="input-small call_sheet_grade ');
                if(isFirst){
                    html.push('input_first');
                    isFirst = false;
                }
                html.push(' " required name="');
                html.push(option.order);
                html.push('" msgName="'+option.name+'"/><span>');
                html.push('X');
                html.push('</span></div>&nbsp;单项最大分为100&nbsp;&nbsp;');

                if(option.fatal){
                    html.push('<div style="display: inline-block;">');
                    html.push('<a href="#" data-toggle="tooltip" class="fatal_warning"><span class="icon-exclamation-sign"></span></a>');
                    html.push('</div>');
                }

                html.push('</td></tr>')
            }
            return html.join('');
        },
        renderQualityCheckListConfig: function(){
            var callSheetQualityCheckConfig = handler.config.qualityCheck.getQualityCheckConfigs();
            var option = null;
            var tableHeader = $('#quality_check_list_table_header');
            var html = '<td>主叫号码</td><td>被叫号码</td><td>接听座席</td><td>呼叫类型</td><td>呼入技能组</td><td>满意度</td><td>呼叫时间</td><td>通话时长</td><td>质检人员</td><td>评级</td><td>质检得分</td>';
            for(var ind in callSheetQualityCheckConfig) {
                option = callSheetQualityCheckConfig[ind];
                html += '<td>' + option.name + '(' + option.weight + '%)' + '</td>';
            }
            html+='<td style="table-layout: fixed;min-width: 4em">操作</td>';
            tableHeader.empty();
            tableHeader.html(html);
        },
        renderQualityCheckList: function(list) {
            if(list && list.length > 0) {
                DS.getView('qualityCheck/quality_check_list_query_item', function(view){
                    var item = null;
                    var html = [];
                    var row = null;
                    var option = null;
                    var gradeTd = null;
                    var callSheetQualityCheckConfig = handler.config.qualityCheck.getQualityCheckConfigs();
                    for(var i= 0,len=list.length;i<len;i++) {
                        item = list[i];
                        row = DS.renderMethodViewNew(view, item);
                        gradeTd = '';
                        for(var ind in callSheetQualityCheckConfig) {
                            option = callSheetQualityCheckConfig[ind];
                            if(option.order in item){
                                gradeTd += '<td>' + item[option.order] + '</td>';
                            }else{
                                gradeTd += '<td></td>'
                            }
                        }
                        row = row.replace(/__GRADE_ITEMS/g, gradeTd);
                        html.push(row);
                    }
                    $('#quality_check_list_query_table_data').html(html.join(''));
                });
            } else {
                $('#quality_check_list_query_table_data').html('');
            }
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
        renderQualityCheckForQuery: function(){
            var callSheetQualityCheckConfig = handler.config.qualityCheck.getQualityCheckConfigs();
            var html = [];
            var option = null;
            var isFirst=true;
            html.push('<td>座席</td>');
            for(var ind in callSheetQualityCheckConfig) {
                option = callSheetQualityCheckConfig[ind];
                html.push('<td>');
                html.push(option.name+'('+option.weight+'%)');
                html.push('</td>');
            }
            html.push('<td>平均总得分</td>');
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
                        for(var ind in callSheetQualityCheckConfig) {
                            option = callSheetQualityCheckConfig[ind];
                            rowQualityCheckConfig += '<td>' + item[option.order] + '</td>';
                        }
                        rowView = rowView.replace(/__CALL_SHEET_GRADE_AVG/g, rowQualityCheckConfig)
                            .replace(/__AMOUNT_AVG/g, item.AMOUNT);

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
                oneRow+='<td><input type="checkbox" name="notDealCheckbox" value="'+data[i]._id+'"></td>';
                oneRow+='<td><span style="width: 150px;display: block;text-overflow: ellipsis;white-space: nowrap;overflow: hidden;" title="'+data[i].NEW_CUSTOMER_NAME+'">'+data[i].NEW_CUSTOMER_NAME+'</span></td>';
                oneRow+='<td>'+data[i].CALL_NO+'</td>';
                oneRow+='<td>'+data[i].NEW_CALLED_NO+'</td>';
                oneRow+='<td>'+data[i].NEW_OFFERING_TIME+'</td>';
                oneRow+='<td>'+data[i].LEAK_HISTORY.length+'</td>';
                oneRow+='<td>'+handler.cdr.getAgentName(data[i].NEW_DISPOSAL_AGENT)+'</td>';
                oneRow+='<td>'+handler.cdr.getQueueName(data[i].NEW_ERROR_MEMO)+'</td>';
                oneRow+='<td>'+render.cdr.getAgentSelect(data[i]._id,data[i].CALLBACK_AGENT)+'</td>';
                oneRow+='<td><a class="ds_do_action" ds_action="cdr.showCallSheetLeakHistory" ds_data="'+data[i]._id+'">查看详情</a>&nbsp;&nbsp;' +
                    '<a class="ds_do_action" ds_action="cdr.confirmDelCdr" ds_data="'+data[i]._id+'">删除</a></td>'
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
                oneRow += '<td><input class="input-mini" type="number" min="0" name="'+agents[i]._id+'" value="0"></td>';
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

