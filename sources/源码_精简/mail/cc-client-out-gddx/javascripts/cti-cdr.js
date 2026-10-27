handler.cdr = {
    queryPageSize: 10,
    callSheetDataCache: {},
    myCallSheetDataCache: {},
    callSheetQueryResultCount: 0,
    curSubMenu:'',
    monitor_main:function(menu){
        var pane=$("#view_nav_monitor");
        pane.find(".monitor_tab").find("li:first>a").click();
    },
    showTab:function(data,src){
        var pane=$("#view_"+data);
        if(data=='monitor_agent_state'){
            DS.getView('cdr/monitor_agent', function (view) {
                pane.html(view);
                handler.cdr.monitor_agent(data);
            });
        }else if(data=='monitor_report'){
            DS.getView('cdr/monitor_report', function (view) {
                pane.html(view);
                handler.cdr.monitor_report(data);
            });
        }
    },
    cdr_peer_list: function (data) {
        var date = dateParse(new Date());
        $("#cdrPeerBeginTime").val(date + " 00:00:00");
        $("#cdrPeerEndTime").val(date + " 23:59:59");
        //$('#cdr_peer_agent_name').html(render.monitor.renderCdrPeerAgents('agents'));
        DS.getView('/cdr/cdr_peer_list_table', function (view) {
            var monitorPane = $('#cdrPeerListTable');
            monitorPane.empty();
            monitorPane.html(view);
            DS.getView('/cdr/cdr_peer_list_item', function (itemView) {
                var queryData = {
                    BEGIN_TIME: $("#cdrPeerBeginTime").val(),
                    END_TIME: $("#cdrPeerEndTime").val(),
                    pageSize: handler.cdr.queryPageSize,
                    ACTION_TYPE: "login"
                }
                var action = {
                    action: "app.monitor.queryCdrPeer",
                    data: queryData
                }
                DS.send(action, function (res) {
                    if (!res.success) {
                        console.info('Query cdr peer failure: ' + res.message);
                        return;
                    }
                    var panel = $('#cdr_peer_data');
                    panel.empty();
                    panel.append(handler.cdr.renderCdrPeer(res.list));
                    $(".class_list span.cdr_peer_result_count").text(res.count);
                    var list = $(".class_list #cdr_peer_index li");
                    updatePagination(list, res.count, handler.cdr.queryPageSize, 1);
                });
            });
        });
    },
    renderCdrPeer: function(data){
        var html = '';
        if (data && data.length > 0){
            for(var i=0 ; i < data.length ; i++){
                var oneRow = '<tr>';
                oneRow+='<td>'+handler.cdr.getAgentName(data[i].AGENT)+'</td>';
                oneRow+='<td>'+handler.cdr.getExtenType(data[i].EXTEN_TYPE)+'</td>';
                oneRow+='<td>'+data[i].BEGIN_TIME+'</td>';
                if (data[i].END_TIME == null){
                    oneRow+='<td>'+""+'</td>';
                    oneRow+='<td>'+""+'</td>';
                    oneRow+='<td>'+""+'</td>';
                }else{
                    oneRow+='<td>'+data[i].END_TIME+'</td>';
                    oneRow+='<td>'+handler.cdr.calculateTalkTime(data[i].BEGIN_TIME,data[i].END_TIME)+'</td>';
                    oneRow+='<td>'+formatTime(data[i].busyTimeLength/1000)+'</td>';
                }
                oneRow+='<td>'+handler.cdr.getLogoutReason(data[i].COMMENTS)+'</td>';
                if (data[i].busyTimeLength != 0||data[i].END_TIME==null){
                    oneRow+='<td><a class="ds_do_action" ds_action="cdr.showBusyCdrPeerDetail" ds_data="'+data[i].AGENT+','+data[i].BEGIN_TIME+','+data[i].END_TIME+'">查看</a></td>';
                }else{
                    oneRow+='<td></td>';
                }
                oneRow += '</tr>';
                html += oneRow;
            }
        }
        return html;
    },
    paginationCdrPeerBusyDetail: function (data, src) {
        var page = src.val() || 1;
        data.page = page;
        var queryData = data;
        queryData.pageSize = handler.cdr.queryPageSize;
        queryData.ACTION_TYPE = "busy";
        queryData.BEGIN_TIME = $('#cdr_peer_busy_detail_begin_time').val();
        queryData.END_TIME = $('#cdr_peer_busy_detail_end_time').val();
        queryData.AGENT = $('#cdr_peer_busy_detail_agent').val();
        var action = {
            action: "app.monitor.queryCdrPeer",
            data: queryData
        }
        DS.send(action, function (res) {
            if (!res.success) {
                console.info('Query cdr peer failure: ' + res.message);
                return;
            }
            handler.cdr.cdrPeerBusyDetail(res.list, 'cdr_peer_busy_detail_table_content');
            $('#cdr_peer_busy_detail_modal').modal();
            $(".class_list span.cdr_peer_busy_detail_result_count").text(res.count);
            var list = $(".class_list #cdrPeerBusyDetail_index li");
            updatePagination(list, res.count, handler.cdr.queryPageSize, data.page);
        });
    },
    showBusyCdrPeerDetail: function (data) {
        var params = data.split(',');
        DS.getView('cdr/cdr_peer_busy_detail', function (view) {
            var beginTime = $("#cdrPeerBeginTime").val();
            var endTime = $("#cdrPeerEndTime").val();
            var queryBusyCdrPeerData = {
                BEGIN_TIME: params[1],
                END_TIME: params[2],
                pageSize: handler.cdr.queryPageSize,
                AGENT: params[0],
                ACTION_TYPE: 'busy'
            }
            var action = {
                action: "app.monitor.queryCdrPeer",
                data: queryBusyCdrPeerData
            }
            DS.send(action, function (res) {
                if (!res.success) {
                    console.info('Query cdr peer failure: ' + res.message);
                    return;
                }
                var panel = $('#cdr_peer_list_pane');
                panel.empty();
                panel.append(view);
                $('#cdr_peer_busy_detail_agent').val(params[0]);
                $('#cdr_peer_busy_detail_begin_time').val(params[1]);
                $('#cdr_peer_busy_detail_end_time').val(params[2]);
                handler.cdr.cdrPeerBusyDetail(res.list, 'cdr_peer_busy_detail_table_content');
                $('#cdr_peer_busy_detail_modal').modal();
                $(".class_list span.cdr_peer_busy_detail_result_count").text(res.count);
                var list = $(".class_list #cdrPeerBusyDetail_index li");
                updatePagination(list, res.count, handler.cdr.queryPageSize, 1);
            });
        });
    },
    cdrPeerBusyDetail: function(data, id){
        var html = '';
        for(var i = 0 ; i < data.length ; i++){
            var oneRow = '<tr>';
            oneRow+='<td>'+handler.cdr.getAgentName(data[i].AGENT)+'</td>';
            oneRow+='<td>'+handler.cdr.getExtenType(data[i].EXTEN_TYPE)+'</td>';
            oneRow+='<td>'+data[i].BEGIN_TIME+'</td>';
            if (data[i].END_TIME == null){
                oneRow+='<td>'+""+'</td>';
                oneRow+='<td>'+""+'</td>';
            }else{
                oneRow+='<td>'+data[i].END_TIME+'</td>';
                oneRow+='<td>'+handler.cdr.calculateTalkTime(data[i].BEGIN_TIME,data[i].END_TIME)+'</td>';
            }
            oneRow+='<td>'+handler.cdr.getBusyType(data[i].BUSY_TYPE)+'</td>';
            oneRow += '</tr>';
            html += oneRow;
        }
        $('#'+id).html(html);
    },
    paginationCdrPeer: function (data, src) {
        var page = src.val() || 1;
        data.page = page;
        handler.cdr.queryCdrPeer(data);
    },
    resetForm:function (data,src) {
        handler.resetForm(data,src);
    },
    queryCdrPeer: function (data) {
        var queryData = data;
        queryData.pageSize = handler.cdr.queryPageSize;
        queryData.ACTION_TYPE = "login";
        var page = '';
        if (data.page){
            page = data.page;
        }else{
            page = 1;
        }
        var action = {
            action: "app.monitor.queryCdrPeer",
            data: queryData
        }
        DS.send(action, function (res) {
            if (!res.success) {
                console.info('Query cdr peer failure: ' + res.message);
                return;
            }
            var panel = $('#cdr_peer_data');
            panel.empty();
            panel.append(handler.cdr.renderCdrPeer(res.list));
            $(".class_list span.cdr_peer_result_count").text(res.count);
            var list = $(".class_list #cdr_peer_index li");
            updatePagination(list, res.count, handler.cdr.queryPageSize, page);
        });
    },
    exportCdrPeer: function (data){
        data.accountId = session.user.account;
        data.dataDB = session.account.dataDB;
        data.ASTERISK = session.user.pbx;
        data.ACTION_TYPE = "login";
        if (data.BEGIN_TIME != '' && data.END_TIME == ''){
            data.BEGIN_TIME = {"$gt":data.BEGIN_TIME};
        }else if (data.BEGIN_TIME == '' && data.END_TIME != ''){
            data.BEGIN_TIME = {"$lt":data.END_TIME};
        }else if (data.BEGIN_TIME == '' && data.END_TIME == ''){
            delete data.BEGIN_TIME;
        }else if (data.BEGIN_TIME != '' && data.END_TIME != ''){
            data.BEGIN_TIME = {"$gte":data.BEGIN_TIME, "$lte":data.END_TIME};
        }
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'exportCdrPeer',Query:data}
        };
        DS.send(action,function(rep) {
            if(rep.Succeed){
                downloadFile(rep.path);
            }
        });
    },
    monitor_agent: function (id) {
        var container=$("#monitor_allpbx");
        DS.getView('cdr/monitor_agent_item', function (view) {
            $("#monitor_allpbx").empty();
            var agentItem = view;
//            var pbxid = softphonebar_getpbxid(phone_data.pbx_in_ip);
//            agentItem = agentItem.replace("monitor_serviceNo", "monitor_serviceNo" + "_" + pbxid);
//            agentItem = agentItem.replace("monitor_queue", "monitor_queue" + "_" + pbxid);
//            agentItem = agentItem.replace(/monitor_peer/g, "monitor_peer" + "_" + pbxid);
//            agentItem = agentItem.replace("monitor_waitCountTotal", "monitor_waitCountTotal" + "_" + pbxid);
//            agentItem = agentItem.replace("monitor_countAll", "monitor_countAll" + "_" + pbxid);
//            agentItem = agentItem.replace("monitor_onlineCount", "monitor_onlineCount" + "_" + pbxid);
//            agentItem = agentItem.replace("monitor_idleCount", "monitor_idleCount" + "_" + pbxid);

            $("#monitor_allpbx").html(agentItem);
            _cti_getTableHeader();
            //_im_monitor_init();
            _cti_ui_monitorInit();
            handler.batch2.getConcurrent();
//            handler.cdr.showLoginInfo();
            /*            if(!isHasFunc("func_monitor_updateLimit")){
             var _obj=container.find(".func_hide");
             if(_obj){
             _obj.remove();
             }
             }else{
             container.find(".func_hide").show();
             }*/
            resize();
        });
    },
    monitor_report: function (id) {
        //目前只支持单pbx，所以将上方tab页切换隐藏掉。
        var ul = "<ul style='display: none' class=\"nav nav-tabs\" id=\"monitoring_ul\">";
        var curpbxid = softphonebar_getpbxid(phone_data.pbx_in_ip);
        ul += "<li class=\"active\"><a href=\"#monitoring_" + curpbxid + "\">" + phone_pbxs[phone_data.pbx_in_ip].name + "</a></li>";
        for (var pbx in phone_pbxs) {
            if (pbx != phone_data.pbx_in_ip) {
                var pbxid = softphonebar_getpbxid(pbx);
                ul += "<li><a href=\"#monitoring_" + pbxid + "\" >" + phone_pbxs[pbx].name + "</a></li>";
            }
        }
        ul += "</ul>";
        var content = "";
        DS.getView('cdr/monitor_report_item_new', function (view) {
            $("#monitoring_allpbx").empty();
            for (var pbx in phone_pbxs) {
                var agentItem = view;
                var pbxid = softphonebar_getpbxid(pbx);
                agentItem = agentItem.replace("_monitoring", pbxid + "_monitoring");
                agentItem = agentItem.replace("_todayCallChartTip", pbxid + "_todayCallChartTip");
                agentItem = agentItem.replace("_TodayPandect", pbxid + "_TodayPandect");
                agentItem = agentItem.replace("_TodayPandectChart", pbxid + "_TodayPandectChart");
                agentItem = agentItem.replace("_today_call_sum", pbxid + "_today_call_sum");
                agentItem = agentItem.replace("_todayChartInCallBox", pbxid + "_todayChartInCallBox");
                agentItem = agentItem.replace("_today_call_in_success", pbxid + "_today_call_in_success");
                agentItem = agentItem.replace("_today_call_in_failure", pbxid + "_today_call_in_failure");
                agentItem = agentItem.replace("_todayChartOutCallBox", pbxid + "_todayChartOutCallBox");
                agentItem = agentItem.replace("_today_call_out_success", pbxid + "_today_call_out_success");
                agentItem = agentItem.replace("_today_call_out_failure", pbxid + "_today_call_out_failure");
                agentItem = agentItem.replace("_today_call_in_sum", pbxid + "_today_call_in_sum");
                agentItem = agentItem.replace("_today_call_out_sum", pbxid + "_today_call_out_sum");
                agentItem = agentItem.replace("_todayServiceNumberChartTip", pbxid + "_todayServiceNumberChartTip");
                agentItem = agentItem.replace("_ServiceNumber", pbxid + "_ServiceNumber");
                agentItem = agentItem.replace("_ServiceNumberChart", pbxid + "_ServiceNumberChart");
                agentItem = agentItem.replace("_todayInCallChartTip", pbxid + "_todayInCallChartTip");
                agentItem = agentItem.replace("_TwentyFourHourInChart", pbxid + "_TwentyFourHourInChart");
                agentItem = agentItem.replace("_TwentyFourHourInCallMouseTip", pbxid + "_TwentyFourHourInCallMouseTip");
                agentItem = agentItem.replace("_TwentyFourHourInCallChartArea", pbxid + "_TwentyFourHourInCallChartArea");
                agentItem = agentItem.replace("_todayOutCallChartTip", pbxid + "_todayOutCallChartTip");
                agentItem = agentItem.replace("_TwentyFourHourOutChart", pbxid + "_TwentyFourHourOutChart");
                agentItem = agentItem.replace("_TwentyFourHourOutCallMouseTip", pbxid + "_TwentyFourHourOutCallMouseTip");
                agentItem = agentItem.replace("_TwentyFourHourOutCallChartArea", pbxid + "_TwentyFourHourOutCallChartArea");

                if (pbx == phone_data.pbx_in_ip) {
                    content += "<div class=\"tab-pane active\" id=\"monitoring_" + pbxid + "\">";
                } else {
                    content += "<div class=\"tab-pane\" id=\"monitoring_" + pbxid + "\">";
                }
                content += agentItem;
                content += "</div>";
            }
            $("#monitoring_allpbx").html(ul + content);

//            $("#monitoring_allpbx").html(content);
            $('#monitoring_ul a').click(function (e) {
                e.preventDefault();
                $(this).tab('show');
            })
            $('#monitoring_ul a').on('shown', function (e) {
                var value = e.target + "";
                var pbxid = value.substr(value.indexOf("#monitoring_") + 12, value.length);
                var pbx = _cti_ui_getpbx(pbxid);
                phone_pbxMonitor(pbx);
            })
            _cti_ui_monitoringInit();
//                $("#monitoring_allpbx").find(".jspScrollable").each(function () {
//                    _initScroll($(this));
//                });
            resize();
        });
    },
    call_sheet: function () {
        handler.cdr.initCallSheetCondition('call_sheet_query_main_panel');
        var container = $("#call_sheet_query_main_panel");
        if(!isHasFunc("func_export_cdr")){
            var _obj=container.find(".func_hide");
            if(_obj){
                _obj.remove();
            }
        }else{
            container.find(".func_hide").show();
        }
        $('#call_sheet_query_link').trigger('click');
    },
    initCallSheetCondition: function (mainPanelID) {
        var callStatusHtml = handler.cdr.getCallStatusSelectorHtml('STATUS', '');
        if($('#' + mainPanelID + ' .call_status_selector').length > 0)
            $('#' + mainPanelID + ' .call_status_selector').get(0).outerHTML = callStatusHtml;
        var queueHtml = handler.cdr.getQueueSelectorHtml('ERROR_MEMO', '');
        if($('#' + mainPanelID + ' .queue_selector').length > 0)
            $('#' + mainPanelID + ' .queue_selector').get(0).outerHTML = queueHtml;
        var callTypeHtml = handler.cdr.getCallTypeSelectorHtml('CONNECT_TYPE', '');
        if($('#' + mainPanelID + ' .call_type_selector').length > 0)
            $('#' + mainPanelID + ' .call_type_selector').get(0).outerHTML = callTypeHtml;
        var investigateHtml = handler.cdr.getInvestigateSelectorHtml('INVESTIGATE', '');
        if($('#' + mainPanelID + ' .investigate_selector').length >0)
            $('#' + mainPanelID + ' .investigate_selector').get(0).outerHTML = investigateHtml;
        var qualityCheckConfigSelect = $('.cdr_grade_config');
        if(qualityCheckConfigSelect.length > 0){
            qualityCheckConfigSelect.html(render.qualityCheck.renderQualityCheckConfigs());
        }

        if($("#quality_record_random_checkbox")){
            qualityCheckConfigSelect.html(render.qualityCheck.renderQualityCheckRandomConfigs());
        }
    },
    getInvestigateSelectorHtml: function (nameAttr, value) {
        var html = [];
        html.push('<select name="');
        html.push(nameAttr);
        html.push('" style="margin-right:5px;"><option value="">--全部--</option>');
        var investOptions = getCacheByKey('options', 'name', '满意度调查选项').options;
        var cacheData = [];
        for(var i=0 ; i<investOptions.length ; i++){
            var cur = {code_name: investOptions[i].name ,code_value:investOptions[i].options[0].name}
            cacheData.push(cur);
        }
        html.push(generateComboxOptionsFromDocs(cacheData, "code_name", "code_value", ''));
        html.push('</select>');
        return html.join('');
    },
    getCallStatusSelectorHtml: function (nameAttr, value) {
        var data = {
            selectorName: nameAttr,
            cacheType: 'callStatus',
            cacheItemName: 'code_name',
            cacheItemValue: 'code_value',
            selectorValue: value
        }
        return handler.cdr.getCallSheetSelectorHtml(data);
    },
    getQueueSelectorHtml: function (nameAttr, value) {
        var data = {
            selectorName: nameAttr,
            cacheType: 'queues',
            cacheItemName: 'DisplayName',
            cacheItemValue: 'Exten',
            selectorValue: value
        }
        return handler.cdr.getCallSheetSelectorHtml(data);
    },
    getAgentSelectorHtml: function (nameAttr, value) {
        var data = {
            selectorName: nameAttr,
            cacheType: 'agents',
            cacheItemName: 'name',
            cacheItemValue: '_id',
            selectorValue: value
        }
        return handler.cdr.getCallSheetSelectorHtml(data);
    },
    getCallTypeSelectorHtml: function (nameAttr, value) {
        var data = {
            selectorName: nameAttr,
            cacheType: 'callType',
            cacheItemName: 'code_name',
            cacheItemValue: 'code_value',
            selectorValue: value
        }
        return handler.cdr.getCallSheetSelectorHtml(data);
    },
    getCallSheetSelectorHtml: function (data) {
        var html = [];
        html.push('<select name="');
        html.push(data.selectorName);
        html.push('" style="margin-right:5px;"><option value="">--全部--</option>');
        var cacheData = getCache(data.cacheType);
        html.push(generateComboxOptionsFromDocs(cacheData, data.cacheItemName, data.cacheItemValue, data.selectorValue || ''));
        html.push('</select>');
        return html.join('');
    },
    searchAllCallSheet: function (data, src) {
        data.action = 'app.callSheet.queryCallSheet';
        data.mainPanelID = 'call_sheet_query_main_panel';
        data.formID = 'call_sheet_query_form';
        handler.cdr.callSheetDataCache = {};
        data.cache = handler.cdr.callSheetDataCache;
        handler.cdr.searchCallSheet(data, src);
    },
    parseSearchDate: function(data){
        var beginTime = null, endTime = null;
        if(data.BEGIN_DATE){
            if(data.BEGIN_TIME){
                beginTime = data.BEGIN_DATE + ' ' + data.BEGIN_TIME;
            } else {
                beginTime = data.BEGIN_DATE;
            }
        }
        delete data.BEGIN_TIME;
        delete data.BEGIN_DATE;
        if(beginTime) {
            data.BEGIN_TIME = beginTime;
        }
        if(data.END_DATE) {
            if(data.END_TIME) {
                endTime = data.END_DATE + ' ' + data.END_TIME;
            } else {
                endTime = data.END_DATE + ' 23:59:59';
            }
        }
        delete data.END_TIME;
        delete data.END_DATE;
        if(endTime) {
            data.END_TIME = endTime;
        }
    },
    validateCondition: function(data) {
        var dateReg = /^\d{4}-\d{2}-\d{2}$/;
        if (data.BEGIN_DATE && !dateReg.test(data.BEGIN_DATE)){
            alert('请正确选择开始日期');
            $('#call_sheet_datetime_picker_start').focus();
            return false;
        }
        var timeReg = /^\d{2}:\d{2}$/;
        if (data.BEGIN_TIME && !timeReg.test(data.BEGIN_TIME)){
            $('#call_sheet_begin_time').focus();
            alert('请正确填写开始时间');
            return false;
        }
        if (data.END_DATE && !dateReg.test(data.END_DATE)){
            $('#call_sheet_datetime_picker_end').focus();
            alert('请正确选择结束日期');
            return false;
        }
        if (data.END_TIME && !timeReg.test(data.END_TIME)){
            $('#call_sheet_end_time').focus();
            alert('请正确填写结束时间');
            return false;
        }

        return true;
    },
    searchCallSheet: function (data, src) {
        var data = handler.cdr.getSearchCondition(data);
        if (!handler.cdr.validateCondition(data)) {
            return false;
        }
        data.pageSize = handler.cdr.queryPageSize;
        data.page = src.val() || 1;
        var actionName = data.action;
        delete data.action;
        var mainPanelID = data.mainPanelID;
        delete data.mainPanelID;
        var formID = data.formID;
        delete data.formID;
        var cache = data.cache;
        delete data.cache;
        handler.cdr.parseSearchDate(data);
        var action = {
            action: actionName,
            data: data
        }
        DS.send(action, function (res) {
            if (res.success) {
                var list = res.list;
                if (list.length > 0) {
                    DS.getView('cdr/call_sheet_item', function (view) {
                        var html = [];
                        var callSheet = null;
                        for (var i = 0, len = list.length; i < len; i++) {
                            callSheet = list[i];
                            html.push(DS.renderMethodViewNew(view, callSheet));
                            if (cache) {
                                cache[callSheet.CALL_SHEET_ID] = callSheet;
                            }
                        }
                        $('#' + mainPanelID + ' .call_sheet_table_data').html(html.join(''));
                    });
                } else {
                    $('#' + mainPanelID + ' .call_sheet_table_data').html('');
                }
                DS.updatePagination(formID, res.count, handler.cdr.queryPageSize, data.page);
                //每次查询之后，将cdr总数记录。用来判断导出时限制5万条。
                handler.cdr.callSheetQueryResultCount = res.count;
            } else {
                alert('查询失败，请重新查询');
            }
        });
    },
    getInvestigate: function (data) {
        var investOptions = null;
        investOptions = getCacheByKey('options', 'name', '满意度调查选项').options;
        if(data.length > 1){
            return '';
        }
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
    getKeyTag: function (keyTag){
        if(keyTag && keyTag == 'true'){
            return '是';
        }else{
            return '';
        }
    },
    getCallTimeLength: function (callTimeLength) {
        if (callTimeLength && $.isNumeric(callTimeLength)) {
            return timeToHHmmss(callTimeLength);
        } else {
            return '00:00:00';
        }
    },
    getQueueName: function (queueID) {
        var queue = getCacheByKey('queues', 'Exten', queueID);
        if (queue) {
            return queue.DisplayName;
        } else {
            return '';
        }
    },
    getAgentName: function (agentID) {
        if(agentID == 'interface'){
            return '接口调用';
        }
        var agent = getCacheByKey('agents', '_id', agentID);
        if (agent) {
            return agent.displayName+'['+agent.exten+']';
        } else {
            return '';
        }
    },
    getBusyType : function(data){
        var phoneBars = getCache("phoneBars");
        for(var i = 0; i < phoneBars.length; i++){
            if (data == phoneBars[i].PhoneBarItemId){
                return phoneBars[i].PhoneBarItemName;
            }
        }
    },
    getExtenType : function(data){
        if(data === 'Local'){
            return '手机';
        }else if(data === 'gateway'){
            return '网关';
        }else if(data === 'sip'){
            return '软电话';
        }else if(data === 'none'){
            return '无通话';
        }
    },
    calculateTalkTime : function(beginTime, endTime) {
        if (beginTime == null || endTime == null || beginTime == undefined || endTime == undefined) {
            return '00:00:00';
        }
        var begin = new Date(Date.parse(beginTime.replace(/-/g, "/")));
        var end = new Date(Date.parse(endTime.replace(/-/g, "/")));

        var time = end.getTime() - begin.getTime();
        return formatTime(time / 1000);
    },
    getLogoutReason: function(data){
        if(data == 'reserve'){
            return '离线接听';
        }else if(data == 'Timeout'){
            return '超时';
        }else if(data == 'akick'){
            return '管理员签出';
        }else if(data == 'ukick'){
            return '重复登录';
        }else if(data == null){
            return '';
        }else{
            return '正常';
        }
    },
    resetCdrPeerQueryCondition: function(){
        //$('#cdr_peer_agent_name').html(render.monitor.renderCdrPeerAgents('agents'));
        $("input[name='BEGIN_TIME']").val('');
        $("input[name='END_TIME']").val('')
        utils.setSearchInput("cdr_peer_agent_name_div",'')
        $('#cdr_peer_agent_name_input').val('')
    },
    getCallTypeName: function (callTypeValue) {
        var callType = getDicCache('callType', callTypeValue);
        if (callType) {
            return callType.code_name;
        } else {
            return '';
        }
    },
    getCallStatusName: function (callStatusValue) {
        var callStatus = getDicCache('callStatus', callStatusValue);
        if (callStatus) {
            return callStatus.code_name;
        } else {
            return '';
        }
    },
    getSearchCondition: function (data) {
        var conditon = {};
        for (var key in data) {
            if (data[key]) {
                conditon[key] = data[key];
            }
        }
        return conditon;
    },
    my_call_sheet: function () {
        handler.cdr.initCallSheetCondition('my_call_sheet_query_main_panel');
        var callStatusSelector = $('#my_call_sheet_query_main_panel [name=STATUS]');
        if(callStatusSelector){
            var selector = callStatusSelector.get(0);
            var option = null;
            var remove = [];
            for(var i= selector.options.length - 1;i>=0;i--){
                option = selector.options[i];
                if(option.value != 'dealing' && option.value != 'notDeal' && option.value != ''){
                    remove.push(i);
                }
            }
            for(var j= 0,len=remove.length;j<len;j++) {
                selector.remove(remove[j]);
            }
        }
        $('#my_call_sheet_agent').val(session.user._id);
        $('#my_call_sheet_query_link').trigger('click');
    },
    searchMyCallSheet: function (data, src) {
        data.action = 'app.callSheet.queryCallSheet';
        data.mainPanelID = 'my_call_sheet_query_main_panel';
        data.formID = 'my_call_sheet_query_form';
        handler.cdr.myCallSheetDataCache = {};
        data.cache = handler.cdr.myCallSheetDataCache;
        data.DISPOSAL_AGENT = {$in:[data.DISPOSAL_AGENT]};
        handler.cdr.searchCallSheet(data, src);
    },
    //showCdrDetail: function (data) {
    //    var currentCallSheet = handler.cdr.callSheetDataCache[data];
    //    if (!currentCallSheet) {
    //        currentCallSheet = handler.cdr.myCallSheetDataCache[data];
    //    }
    //    if (currentCallSheet) {
    //        showCdrTel(currentCallSheet);
    //        DS.getView('cdr/show_cdr_detail', function (view) {
    //            var html = '';
    //            html = DS.renderMethodViewNew(view, currentCallSheet);
    //            var panel = $('#modal_panel');
    //            panel.empty();
    //            panel.append(html);
    //            //to if show channelcdr
    //            var pbxs = session.account.pbx;
    //            var isShowChannelCdr = false;
    //            for(var i=0;i<pbxs.length;i++){
    //               if(session.user.pbx == pbxs[i].PBX){
    //                   if(pbxs[i].IsRecordChannelCdr == "true"){
    //                       isShowChannelCdr = true;
    //                       var action = {
    //                           action : 'app.callSheet.getCdrDetail',
    //                           data : data
    //                       }
    //                       DS.send(action,function(res){
    //                           if(!res.success){
    //                               alert('get cdrDetail fail!');
    //                               return;
    //                           }
    //                           if(res.data){
    //                               DS.getView('cdr/cdr_channel_detail', function(otherInfoView){
    //                                   $('#callSheetOtherInfoPanel').html(
    //                                       otherInfoView.replace('__CHANNEL_DETAIL', render.cdr.renderCdrChannelDetail(res.data)));
    //                                   $('#callSheetOtherInfoPanel').show();
    //                                   $('#show_cdr_detail_Modal').modal({'backdrop':'static'});
    //                               });
    //                           }else{
    //                               $('#show_cdr_detail_Modal').modal({'backdrop': 'static'});
    //                           }
    //                       });
    //                   }
    //               }
    //            }
    //            if(!isShowChannelCdr){
    //                $('#show_cdr_detail_Modal').modal({'backdrop': 'static'});
    //            }
    //        });
    //    } else {
    //        alert('系统获取通话记录详细信息失败，请重试。');
    //    }
    //},
    closeDetail: function (data) {
        $('#cdrListener').get(0).pause();
        $('#show_cdr_detail_Modal').modal('hide');
        $('#cdr_detail_pane').empty();
        if(data){
            var callback = eval('handler.' + data);
            if(callback && typeof callback == 'function'){
                callback();
            }
        }
    },
    getChannelLocationName : function(data){
        if(data === 'time'){
            return '日程';
        }else if(data === 'announcement'){
            return '播放语音';
        }else if(data.toLowerCase() === 'ringing'){
            return '响铃';
        }else if(data.toLowerCase() === 'hangup'){
            return '挂机';
        }else if(data.toLowerCase() === 'link'){
            return '接通';
        }else if(data.toLowerCase() === 'queue'){
            return '技能组';
        }else if(data.toLowerCase() === 'encryptmd5'){
            return 'MD5加密';
        }else if(data.toLowerCase() === 'voicemail'){
            return '留言';
        }else if(data.toLowerCase() === 'ivr'){
            return '按键菜单';
        }else if(data.toLowerCase() === 'assignment'){
            return '赋值';
        }else if(data.toLowerCase() === 'callurl'){
            return 'CallUrl';
        }else if(data.toLowerCase() === 'match-blacklist'){
            return '黑名单';
        }else if(data.toLowerCase() === 'route'){
            return '按变量路由';
        }else if(data.toLowerCase() === 'satisfaction'){
            return '自定义满意度';
        }else if(data.toLowerCase() === 'validate'){
            return '采集输入';
        }else if(data.toLowerCase() === 'room'){
            return '会议室';
        }else if(data.toLowerCase() === 'extensionpeer'){
            return '自定义';
        }else if(data.toLowerCase() === 'superdialjobnum'){
            return '采集工号并拨打';
        }else if(data.toLowerCase() === 'menu'){
            return '转IVR菜单';
        }else if(data.toLowerCase() === 'dialjobnum'){
            return '拨打工号';
        }else if(data.toLowerCase() === 'textannouncement'){
            return '播放文本节点';
        }else{
            return data;
        }
    },
    getCustomerHistoryCdr: function(customerID, callback) {
        var data = {
            CUSTOMER_ID: customerID
        };
        var action = {
            action: 'app.callSheet.queryCallSheetByCustomer',
            data: data
        };
        DS.send(action, function (response) {
            if(response.success) {
                var cdrs = response.list || [];
                for(var i=0;i< cdrs.length;i++){
                    var cdr = cdrs[i];
                    cdr.CONNECT_TYPE = getDicCache("callType", cdr.CONNECT_TYPE)["code_name"];
                    cdr.DISPOSAL_AGENT = render.getAgentName(cdr.DISPOSAL_AGENT);
                    cdr.STATUS = getDicCache("callStatus", cdr.STATUS)["code_name"];
                    cdr.timeLen=handler.cdr.getCallTimeLength(cdr.CALL_TIME_LENGTH);
                    cdr.recordUrl=cdr.FILE_SERVER+"/"+cdr.RECORD_FILE_NAME;
                }
                callback(null, cdrs);
            }else {
                callback(new Error());
            }
        });
    },
    exportCdrExcel : function(data,src){
        var leftPane=$('#contact_list_cdr');
        if($('#contact_list_cdr .btn_cdr_my').hasClass('active')){
            leftPane=$('#view_cdr_my');
        }else{
            leftPane=$('#view_cdr_all');
        }
        var toolbarPane=$("#pane_deal_list");
        //var checkPane=leftPane.find(".list_check_all");
        var checkPane=toolbarPane.find(".list_check_all");
        var num=toolbarPane.find(".bottom_toolbar_selsize_num").text();
        var isAll=checkPane.hasClass("select_on")?"1":"0";
        var query = handler._getSearchCondition(leftPane,isAll);
        num=parseInt(num,10)||0;
        if(num<=0){
            $().alertmessage('showError', "请至少选择一条进行操作!");
            return;
        }else if(num>10000){
            $().alertmessage('showError', "最多导出10000条,请过滤查询条件分多次导出!");
            return;
        }
        query.accountId = session.user.account;
        query.type = 'CdrExport';
        query.dataDB = session.account.dataDB;
        query.user = session.user._id;
        query.cdrExportType = "call_sheet_advanced_query";
//        handler.cdr.parseSearchDate(data);
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'exportCdr',Query:query}
        };
        DS.send(action,function(rep) {
            if(rep.Succeed){
                handler.cancelDealToolbar("cdr");
                downloadFile(rep.path);
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    exportCdrMonitor : function(data,src){
        var leftPane=$('#contact_list_cdr');
        if($('#contact_list_cdr .btn_cdr_my').hasClass('active')){
            leftPane=$('#view_cdr_my');
        }else{
            leftPane=$('#view_cdr_all');
        }
        var toolbarPane=$("#pane_deal_list");
        var checkPane=toolbarPane.find(".list_check_all");
        var num=toolbarPane.find(".bottom_toolbar_selsize_num").text();
        var isAll=checkPane.hasClass("select_on")?"1":"0";
        var query = handler._getSearchCondition(leftPane,isAll);
        if(query.CALL_TIME_LENGTH_BEGIN || query.CALL_TIME_LENGTH_END){
            if(query.CALL_TIME_LENGTH_BEGIN) {
                if(!('CALL_TIME_LENGTH' in query)){
                    query.CALL_TIME_LENGTH = {};
                }
                query.CALL_TIME_LENGTH["$gte"]=parseInt(query.CALL_TIME_LENGTH_BEGIN);
            }
            delete query.CALL_TIME_LENGTH_BEGIN;
            if(query.CALL_TIME_LENGTH_END) {
                if(!('CALL_TIME_LENGTH' in query)){
                    query.CALL_TIME_LENGTH = {};
                }
                query.CALL_TIME_LENGTH["$lte"]=parseInt(query.CALL_TIME_LENGTH_END);
            }
            delete query.CALL_TIME_LENGTH_END;
        }
        num=parseInt(num,10)||0;
        if(num<=0){
            $().alertmessage('showError', "请至少选择一条进行操作!");
            return;
        }else if(num>1000){
            $().alertmessage('showError', "导出录音数量过多，批量导出通话录音最大数量为1000条记录！");
            return;
        }
        var action = {
            action: 'app.callSheet.addExportMonitorTask',
            data: query
        };
        DS.send(action,function(rep) {
            if(rep.success){
                alert('批量导出录音任务已经提交，您可以在次日凌晨3时后在【设置】->【高级功能】->【批量导出录音任务】菜单中去下载。');
                handler.cancelDealToolbar("cdr");
            }else{
                if(rep.message == '404'){
                    alert('提交任务失败，可获得录音数量为0，请检查您的查询条件!');
                }else{
                    alert('批量导出录音任务已经失败' + rep.message);
                }
            }
        });
    },
    resetForm: function(data, src){
        handler.resetForm(data,src);
    },
    dialPhone: function (connectType,phone,isCalled) {
        var html=phone;
        var desc=checkHideTel(phone);
        if (connectType=='dialout' || connectType=='dialTransfer') {
            if(isCalled){
                html="<a href='#' onclick='softphonebar_dialout(\""+phone+"\")'>"+desc+"</a>";
            }
        }else{
            if(!isCalled){
                html="<a href='#' onclick='softphonebar_dialout(\""+phone+"\")'>"+desc+"</a>";
            }
        }
        return html;
    },
    showLoginInfo:function(){
        var pane=$("#view_monitor_agent_state");
        var extenType=phone_data.extenType;
        var desc="";
        switch (extenType){
            case "gateway":
                desc="SIP话机";
                break;
            case "Local":
                desc="直线";
                break;
            case "sip":
                desc="软电话";
                break;
        }
        pane.find(".acc_extenType").text(desc);
        if(extenType=='Local'){
            pane.find(".acc_tel_pane").show();
            pane.find(".acc_tel").text(session.user.mobile);
        }
    },
    listenRecord : function(data){
        DS.getView('cdr/listenRecord', function(view){
            var panel = $('#cdr_listen_record_pane');
            panel.empty();
            panel.append(view.replace(/__RECORD_FILE/g,data.split(',')[0]));
            panel.find("#show_cdr_listen_record_Modal").css("z-index",2000);
            $('#show_cdr_listen_record_Modal').modal({'backdrop':false});
            handler.qualityCheck.recordListenLog(data.split(',')[1]);
        });
    },
    addCdrBlackList : function(data){
        if(!confirm('确定要加到黑名单吗？'))return;
        data=getEncryptTel(data);
        //console.info("data======"+data);
        var query = handler.config.callConfig.blackList.beforeSaveBlackList({BlackNum:data,Type:'1'});
        if(query.skip){
            return;
        }
        delete query.skip;
        query.Memo = '由座席 ' + session.user.displayName + '[' + session.user.exten + ']' + '在前台添加为黑名单';
        var action = {
            action : 'config.ivr.blacklist.saveBlackList',
            data : query
        }
        DS.send(action,function(res) {
            if(res.success){
                var cacheData = {
                    "Account" : session.user.account,
                    "BlackNum" : data,
                    "Num" : data,
                    "PBX" : session.user.pbx,
                    "Type" : "1"
                }
                if('ivrMap' in session){
                    if('ivrBlackList' in session.ivrMap){
                        session.ivrMap.ivrBlackList.unshift(cacheData);
                    }
                }
                $().alertmessage('showSuccess','黑名单添加成功！');
                var ivrAction = {
                    action : 'config.ivr.reloadIvr',
                    data : {
                        Account: session.user.account,
                        PBX: session.user.pbx
                    }
                }
                DS.send(ivrAction, function(res1){});
            }else{
                alert('添加黑名单异常!');
            }
        });
    },
    call_sheet_leak: function (data,src) {
        if(data == 'call_sheet_leak'){
            handler.cdr.initCallSheetCondition('call_sheet_leak_query_main_panel');
            var query = {};
        }else{
            delete data.notDealCheckbox;
            var query = handler.cdr.getSearchCondition(data);
            query.page = src ? (src.val() || 1 ) : 1;
            query.pageSize = handler.cdr.queryPageSize;
        }
        if(query.CALLED_NO){
            query.NEW_CALLED_NO = query.CALLED_NO;
            delete query.CALLED_NO;
        }
//        if(query.CALL_NO){
//            query['$or'] = [{CALL_NO:data.CALL_NO},{NEW_CALLED_NO:data.CALL_NO}];
//            delete query.CALL_NO;
//        }
        if(query.ERROR_MEMO){
            query.NEW_ERROR_MEMO = query.ERROR_MEMO;
            delete query.ERROR_MEMO;
        }
        var action = {
            action: 'app.callSheet.queryCallSheetLeak',
            data: query
        }
        DS.send(action,function(response){
            if(response.success){
                $('#call_sheet_leak_table_data').html(render.cdr.renderNotdealCallSheetTable(response.list));
                DS.updatePagination('cdrNotDealQueryFrm', response.count, handler.cdr.queryPageSize, query.page || 1);
                $('#checkedAllNotDealCdr').attr("checked",false);
                delete session.dicMap.cdrNotDealCurrentQueryCount;
                delete session.dicMap.cdrNotDealCurrentQueryCondition;
                delete session.dicMap.cdrNotDealCurrentQueryList;
                session.dicMap.cdrNotDealCurrentQueryList = response.list;
                session.dicMap.cdrNotDealCurrentQueryCount = response.count;
                session.dicMap.cdrNotDealCurrentQueryCondition = query;
            }else{
                $().alertmessage('showError', "加载未接来电失败！");
            }
        })
    }
    ,notDealCallbackAgentChange : function(data){
        var action = {
            action : 'app.callSheet.notDealCallBackAgentChange',
            data : {
                CALLBACK_AGENT : data.split("@")[0],
                _id : data.split("@")[1]
            }
        }
        DS.send(action,function(res){
            if(!res.success){
                alert('change callback agent fail!');
                return;
            }
            $().alertmessage('showSuccess','分配处理座席成功！');
        });
    },
    queryMyCallSheetLeakHigh:function(data){
        handler.cdr.my_call_sheet_leak(data);
        $("#my_call_sheet_leak_search_query").toggleClass("my_call_sheet_leak_query_close");
    },
    my_call_sheet_leak: function (data,src) {
        if(data == 'my_call_sheet_leak'){
            var callNo=$('.call_sheet_leak_list_query_form input[name=query]').val();
            var query = {};
            if(callNo){
                query.CALL_NO = callNo;
            }
        }else{
            var query = handler.cdr.getSearchCondition(data);
            query.page = src ? (src.val() || 1 ) : 1;
            query.pageSize = handler.cdr.queryPageSize;
        }
        query['$or']= [{NEW_DISPOSAL_AGENT:session.user._id},{CALLBACK_AGENT:session.user._id}];
        var action = {
            action: 'app.callSheet.queryCallSheetLeak',
            data: query
        }
        DS.send(action,function(response){
            if(response.success){
                var pane = $('#call_sheet_leak_list_item_pane');
                pane.empty();
                var html = "";
                DS.getView('cdr/my_call_sheet_leak_list_item', function (view) {
                    var html = "";
                    var list = response.list;
                    for (var i = 0; i < list.length; i++) {
                        list[i].count = list[i]['LEAK_HISTORY'].length;
                        if(list[i].CALLBACK_AGENT == session.user._id){
                            list[i].statusLabel = "label-warning";
                        }else{
                            list[i].statusLabel = "label-success";
                        }
                        html += render.replaceDataByObject(list[i], view);
                    }
                    pane.html(html);
                    var count = response.count;
                    $(pane).closest(".left_column").find(".pagination").find(".result_count").text(count);
                    var list = $(pane).closest(".left_column").find(".pagination").find("li");
                    updatePagination(list, count, handler.cdr.queryPageSize || 10, query.page || 1);
                    $(".call_sheet_leak_detail_div").empty();
                });
            }else{
                $().alertmessage('showError', "加载未接来电失败！");
            }
        })
    },
    showMyCallSheetLeakDetail:function(data){
        var action = {
            action: 'app.callSheet.queryCallSheetLeak',
            data: {_id:data}
        }
        DS.send(action,function(response){
            if(response.success){
                if(response.list.length > 0){
                    var list = response.list;
                    DS.getView('cdr/my_call_sheet_leak_detail',function(view){
                        var html = '';
                        list[0].count = list[0]['LEAK_HISTORY'].length;
                        html += render.replaceDataByObject(list[0], view);
                        var pane = $("div.call_sheet_leak_detail_div");
                        pane.empty();
                        pane.html(html);
                        pane.attr("phone",list[0].CALL_NO);//set phone

                        var content = pane.find(".timeLine_list");
                        content.empty();
                        var historyList = handler.cdr.sortLeakHistory(list[0].LEAK_HISTORY);
                        if(historyList.length > 0) {
                            DS.getView('customer/active_history_content_item',function(view) {
                                var val = "";
                                for(var i = 0; i < historyList.length; i++) {
                                    var cdr = historyList[i];
                                    cdr.CONNECT_TYPE = getDicCache("callType", cdr.CONNECT_TYPE)["code_name"];
                                    cdr.DISPOSAL_AGENT = render.getAgentName(cdr.DISPOSAL_AGENT);
                                    cdr.STATUS = getDicCache("callStatus", cdr.STATUS)["code_name"];
                                    cdr.timeLen=handler.cdr.getCallTimeLength(cdr.CALL_TIME_LENGTH);
                                    cdr.recordUrl=cdr.FILE_SERVER+"/"+cdr.RECORD_FILE_NAME;
                                    val += render.renderActiveHistory(cdr, view, "call");
                                }
                                content.append(val);
                            });
                        } else {
                            content.html("<div class='timeLine_list_noResult'>没有纪录!</div>");
                        }
                    });
                }else{
                    $().alertmessage('showError', "加载未接来电详情失败！");
                }
            }
        })
    },
    callBackAndDeal:function(data){
        var call_no = data.split('|')[0];
        var customer_id = data.split('|')[1];
        var customer_name = data.split('|')[2];
        var call_id = data.split('|')[3];//无后缀
        softphonebar_dialout(call_no,"RECALLFLAG:"+session.user._id+"_"+call_no);
        if(customer_id != '00000000000000000000'){
            handler.customer.loadCustInfo(customer_id,'my_call_sheet_leak','customerLeak');
        }else{
            if(customer_name == '未知客户'){
                handler.cdr.loadCallLeakCustNoPopInfo(call_no,call_id);
            }else if(customer_name == '多个匹配客户'){
                var action = {
                    action: 'app.popup.popupCust',
                    data: {accountId:session.user.account, phone:call_no}
                };
                DS.send(action,function(rep) {
                    if(rep.success) {
                        var contacts = rep.list;
                        var count = rep.count;
                        handler.cdr.loadCallLeakCustMorePopInfo(call_no, contacts, call_id, true, null,count);
                    }else{
                        $().alertmessage('showError', errMsg);
                    }
                });
            }
        }
    },
    loadCustAdd2LeakMore:function(data){
        var params=data.split(",");
//        console.dir(params)
        var phone=params[0];
        var paneId=params[1];
//        var province=params[2];
//        var city=params[3];
        var callId=paneId.split("_")[0];
        handler.cdr.loadCallLeakCustNoPopInfo(phone,callId);
    },
    loadCallLeakCustMorePopInfo: function(callNo, contacts, callId, showLocation, popupId,total) {
        var pane = $('.call_sheet_leak_detail_div');
        var paneId=callId+"_customerLeak";
        DS.getView('call/call_pop_list',function(view){
            view = view.replace(/__id/g, paneId).replace(/__phone/g,callNo);
            pane.html(view);
            pane.find(".pop_cust_create").attr("ds_action","cdr.loadCustAdd2LeakMore");
            pane.find(".pop_cust_query").attr("ds_action","cdr.queryPopupCustomer");
            var tds = "";
            if(contacts && contacts.length > 0) {
                var param={
                    paneId:paneId,
                    phone:callNo,
                    popupId:popupId
                }
//                ds_data='__id,__name,"+callId+","+callNo+"'
                var dsAction="cdr.popCallLeakLocateSelected";
                tds=handler.call.popupCustMoreData(contacts,param,dsAction);
            }
            if(showLocation){
                pane.find(".location_phone").html("通过号码 <span class='phone' style='font-size: 15px;font-weight: bold;color: #009900'>"+checkHideTel(callNo)+"</span> 为您定位到以下客户，请选择:");
                pane.find(".location_phone").css("display","block");
            } else {
                pane.find(".location_phone").css("display","none");
            }
            DS.updatePagination("query_customer_form_"+paneId, total,handler.call.queryPageSize, 1);
            var paneBody = $("#customer_list_pane_"+paneId);
            paneBody.html(tds);
        });
    },
    queryPopupCustomer: function(data,src) {
        var pane=$("#"+data.callId);
//        console.dir(data);
        var _ary=data.callId.split("_");
        var callId=_ary[0];
        if(data.callId.indexOf("customerLeak")!=-1){
            pane=$("#my_call_sheet_leak_customerLeak");
        }else if(data.callId.indexOf("callLocation")!=-1){
            pane=$("#show_cdr_location_cust_Modal");
        }

        var page=1;
        if(src && !src.hasClass("ds_do_action"))page=src.val();
        if(!page)page=1;
        data.page=page;
        data.limit=handler.call.queryPageSize;
        var action = {
            action: 'app.customer.queryPopupCustomer',
            data: data
        };
        DS.send(action,function(rep) {
            if(rep.success) {
                var contacts = rep.list;
                var count = rep.count;
                var tds = "";
                if(contacts && contacts.length > 0) {
                    var param={
                        paneId:data.callId,
                        phone:data.phone,
                        popupId:data.popupId
                    }
                    var dsAction="cdr.popCallLeakLocateSelected";
                    tds=handler.call.popupCustMoreData(contacts,param,dsAction);
                }

                DS.updatePagination("query_customer_form_"+data.callId, count, data.limit, data.page);
                var paneBody = pane.find("#customer_list_pane_"+data.callId);
//                pane.find(".location_phone").css("display","none");
                paneBody.html(tds);
            }
        });
    },
    popCallLeakLocateSelected: function(data) {
        var params=data.split(",");
        var customerId = params[0];
        var name = params[1];
        var phone = params[2];
        var paneId = params[3];
        var callId=paneId.split("_")[0];//for CALL_SHEET_ID
        handler.customer.loadCustInfo(customerId,'my_call_sheet_leak','customerLeak');
        var _param={
            customerId:customerId,
            callId:callId,
            phone:phone,
            dealSrc:"customerLeak"
        }
        var action = {
            action: 'app.customer.callLocationCustomer',
            data: _param
        };
        DS.send(action,function(rep) {
            if(rep.success) {
            }else{
            }
        });
    },
    loadCallLeakCustNoPopInfo: function(callNo,callId,popupId) {
//        var pane=$('.call_sheet_leak_detail_div');
        var pane=$('#my_call_sheet_leak_customerLeak');
        var paneId=callId+"_customerLeak";
        DS.getView('customer/customer_add',function(view){
            view=view.replace(/_#menu#_/g,paneId).replace(/_#callNo#_/g,callNo).replace(/_#dealSrc#_/g,"customerLeak");
            pane.html(view);
            pane.find(".select_old_cust").show();
            if(popupId){
                pane.find("input[name='popupId']").val(popupId);
            }
            var o=pane.find("#icc_add_customer_dbType");
            var tmpls=getCache('custTmpls');
            if(tmpls && tmpls.length>0){
                var dbType=tmpls[0]._id;
                o.val(dbType);
                handler.customer.loadCustAddTmpl(dbType,pane);
                pane.find(".btn_cancel_edit").click(function(){
                    $('.call_sheet_leak_detail_div').empty();
                });
                var telDesc=checkHideTel(callNo,pane.find('input[name="tel[]"]'));
                pane.find('input[name="tel[]"]').val(telDesc);
            }
        });
    },
    sortLeakHistory: function (history) {
        history = history || [];
        history.sort(function (a, b) {
            if (a.OFFERING_TIME && b.OFFERING_TIME) {
                if (a.OFFERING_TIME < b.OFFERING_TIME) {
                    return 1;
                } else if (a.OFFERING_TIME == b.OFFERING_TIME) {
                    return 0;
                } else {
                    return -1;
                }
            }
        });
        return history;
    },
    resetMyCallSheetLeakForm : function(data,src){
        handler.cdr.resetForm(data,src);
        $("#call_sheet_leak_callback_agent_select_input").val("");
        $("#call_sheet_leak_disposal_agent_select_input").val("");
    },
    resetCallSheetLeakForm : function(data,src){
        handler.cdr.resetForm(data,src);
        $("#not_deal_disposal_agent_search_div_input_value").val("");
        $("#not_deal_callback_agent_search_div_input_value").val("");
    },
    confirmDelCdr : function(data){
        DS.getView('cdr/confirmDeleteCdr', function (view) {
            var panel = $('#confirm_del_cdr_pane');
            panel.html('');
            view = view.replace(/__doDeleteButton/g, "<a class='btn btn-danger ds_do_action' ds_action='cdr.delNotDealCdr' ds_data='"+data+"'>确认删除</a>");

            panel.append(view);
            $('#confirm_del_cdr_Modal').modal();
        });
    },
    delNotDealCdr : function(data){
        var action = {
            action : 'app.callSheet.delNotDealCdr',
            data : data
        }
        DS.send(action,function(res){
            if(!res.success){
                $().alertmessage('showError','删除未接电话失败！');
                return;
            }
            $().alertmessage('showSuccess','删除未接电话成功！');
            $('#searchNotDealCdrBtn').click();
        })
    },
    confirmDelAllCdr : function(data){
        DS.getView('cdr/confirmDeleteCdr', function (view) {
            var panel = $('#confirm_del_cdr_pane');
            panel.html('');
            view = view.replace(/__doDeleteButton/g, "<a class='btn btn-danger' onclick=javascript:$('#delAllNotDealCdrBtn').click();>确认删除</a>");

            panel.append(view);
            $('#confirm_del_cdr_Modal').modal();
        });
    },
    delAllNotDealCdr : function(data){
        delete data.notDealCheckbox;
        var query = handler.cdr.getSearchCondition(data);
        if(query.CALL_NO){
            query['$or'] = [{CALL_NO:data.CALL_NO},{NEW_CALLED_NO:data.CALL_NO}];
            delete query.CALL_NO;
        }
        if(query.ERROR_MEMO){
            query.NEW_ERROR_MEMO = query.ERROR_MEMO;
            delete query.ERROR_MEMO;
        }
        var action = {
            action: 'app.callSheet.delAllNotDealCdr',
            data: query
        }
        DS.send(action,function(res){
            if(!res.success){
                $().alertmessage('showError','删除当前查询未接电话失败！');
                return;
            }
            $().alertmessage('showSuccess','删除当前查询未接电话成功！');
            $('#searchNotDealCdrBtn').click();
        })
    },
    showAssignCheckedCallBackAgent : function(data){
        var checks = $("input[name='notDealCheckbox']:checked");
        if(checks.length === 0){
            alert('请选择未接来电记录！');
            return;
        }else{
            DS.getView('cdr/assignCheckedCallBackAgent', function(view){
                var panel = $('#assign_callback_pane');
                panel.empty();
                panel.append(view.replace(/__notDealCount/g,checks.length)
                    .replace(/__assignTable/g,render.cdr.renderAssignCallBackAgentTable()));

                delete session.dicMap.cdrCheckedNotDeal;
                session.dicMap.cdrCheckedNotDeal = checks;
                $('#assign_checked_callback_agent_Modal').modal({'backdrop':'static'});
            });
        }
    },
    autoAssignCallBackAgent : function(data){
        var inputs = $('#assign_checked_callback_agent_table :input');
        if(data == 'checked'){
            var cdrCount = session.dicMap.cdrCheckedNotDeal.length;
        }else{
            var cdrCount = session.dicMap.cdrNotDealCurrentQueryCount;
        }
        for(var i=0 ; i < cdrCount.length ; i++){
            for(var j=0 ; j<inputs.length ; j++){
                var value = parseInt(inputs[i].value)+1;
                inputs[i].value = value;
            }
        }
        var a = parseInt(cdrCount/inputs.length);
        var b = cdrCount%inputs.length;
        for(var j=0 ; j<inputs.length ; j++){
            inputs[j].value = a;
        }
        for(var i=0 ; i < inputs.length ; i++){
            if(b > 0){
                var value = parseInt(inputs[i].value)+1;
                inputs[i].value = value;
                b--;
            }else{
                break;
            }
        }
    },
    saveAssignCallBackAgent : function(data){
        var inputs = $('#assign_checked_callback_agent_table :input');
        var notDealCdrs = session.dicMap.cdrCheckedNotDeal;
        var cdrCount = session.dicMap.cdrCheckedNotDeal.length;
        var count = 0;
        for(var i=0 ; i < inputs.length ; i++){
            if(inputs[i].value === ""){
                alert('分配数量必须为数字，不分配用0表示！');
                return;
            }
            if(!/^\d+$/.test(inputs[i].value)){
                alert('分配数量必须为整数');
                return false;
            }
            count += parseInt(inputs[i].value);
        }
        if(count > cdrCount){
            alert('实际分配的未接电话总数超过了最大值，请检查');
            return;
        }else{
            var dataList = new Array();//提交给服务端的数据
            var cdrIdArray = new Array();//页面选中的未接来电，id数组
            for(var i = 0 ; i < notDealCdrs.length ; i++){
                cdrIdArray.push(notDealCdrs[i].value);
            }
            //拼接给座席分配未接来电
            for(var i=0 ; i < inputs.length ; i++){
                var num = parseInt(inputs[i].value);
                for(var j=0 ; j < num ;j++){
                    var data = {
                        _id : cdrIdArray.pop(),
                        CALLBACK_AGENT : inputs[i].name
                    }
                    dataList.push(data);
                }
            }
            var action = {
                action : 'app.callSheet.saveAssignCallBackAgent',
                data : dataList
            }
            DS.send(action,function(res){
                if(!res.success){
                    $().alertmessage('showError','分配失败！');
                    return;
                }
                $().alertmessage('showSuccess','分配成功！');
                $('#assign_checked_callback_agent_Modal').modal('hide');
                $('#assign_all_callback_agent_Modal').modal('hide');
                $('#searchNotDealCdrBtn').click();
            })
        }
    },
    showAssignAllCallBackAgent : function(data){
        var count = session.dicMap.cdrNotDealCurrentQueryCount;
        DS.getView('cdr/assignAllCallBackAgent', function(view){
            var panel = $('#assign_callback_pane');
            panel.empty();
            panel.append(view.replace(/__notDealCount/g,count)
                .replace(/__assignTable/g,render.cdr.renderAssignCallBackAgentTable()));
            $('#assign_all_callback_agent_Modal').modal({'backdrop':'static'});
        });
    },
    saveAssignAllCallBackAgent : function(data){
        var inputs = $('#assign_checked_callback_agent_table :input');
        var cdrCount = session.dicMap.cdrNotDealCurrentQueryCount;
        var count = 0;
        for(var i=0 ; i < inputs.length ; i++){
            if(inputs[i].value === ""){
                alert('分配数量必须为数字，不分配用0表示！');
                return;
            }
            if(!/^\d+$/.test(inputs[i].value)){
                alert('分配数量必须为整数');
                return false;
            }
            count += parseInt(inputs[i].value);
        }
        if(count > cdrCount){
            alert('实际分配的未接电话总数超过了最大值，请检查');
            return;
        }else{
            var dataList = new Array();//提交给服务端的数据
            //拼接给座席分配未接来电
            for(var i=0 ; i < inputs.length ; i++){
                var data = {
                    COUNT : parseInt(inputs[i].value),
                    CALLBACK_AGENT : inputs[i].name
                }
                dataList.push(data);
            }
            var action = {
                action : 'app.callSheet.saveAssignAllCallBackAgent',
                data : {
                    dataList : dataList,
                    queryCondition : session.dicMap.cdrNotDealCurrentQueryCondition
                }
            }
            DS.send(action,function(res){
                if(!res.success){
                    $().alertmessage('showError','分配失败！');
                    return;
                }
                $().alertmessage('showSuccess','后台已经开始分配成功，请刷新查看！');
                $('#assign_checked_callback_agent_Modal').modal('hide');
                $('#assign_all_callback_agent_Modal').modal('hide');
                $('#searchNotDealCdrBtn').click();
            })
        }
    },
    showCallSheetLeakHistory: function(data){
        var list = session.dicMap.cdrNotDealCurrentQueryList;
        for(var i=0 ; i<list.length ; i++){
            if(list[i]._id == data){
                DS.getView('cdr/show_leak_history', function(view){
                    var panel = $('#show_leak_history_pane');
                    panel.empty();
                    panel.append(view);
                    var historyPane = $("div#show_leak_history_Modal");
                    var content = historyPane.find(".timeLine_list");
                    content.empty();
                    if('LEAK_HISTORY' in list[i] && list[i].LEAK_HISTORY.length > 0) {
                        var historyList = list[i].LEAK_HISTORY;
                        historyList = handler.cdr.sortLeakHistory(historyList);
                        DS.getView('customer/active_history_content_item',function(view) {
                            var val = "";
                            for(var i = 0; i < historyList.length; i++) {
                                var cdr = $.extend({}, historyList[i]);
                                cdr.CONNECT_TYPE = getDicCache("callType", cdr.CONNECT_TYPE)["code_name"];
                                cdr.DISPOSAL_AGENT = render.getAgentName(cdr.DISPOSAL_AGENT);
                                cdr.STATUS = getDicCache("callStatus", cdr.STATUS)["code_name"];
                                cdr.timeLen=handler.cdr.getCallTimeLength(cdr.CALL_TIME_LENGTH);
                                cdr.recordUrl=cdr.FILE_SERVER+"/"+cdr.RECORD_FILE_NAME;
                                val += render.renderActiveHistory(cdr, view, "call");
                            }
                            content.append(val);
                        });
                    }else {
                        content.html("<div class='timeLine_list_noResult'>没有纪录!</div>");
                    }
                    $('#show_leak_history_Modal').modal({'backdrop':'static'});
                });
                break;
            }
        }
    },
    removeKeyTag : function(data,src){
        var action = {
            action : 'app.callSheet.removeKeyTag',
            data: {
                CALL_SHEET_ID: data
            }
        }
        DS.send(action,function(res){
            if(res.success){
                var currentCallSheet = handler.cdr.callSheetDataCache[data];
                if (!currentCallSheet) {
                    currentCallSheet = handler.cdr.myCallSheetDataCache[data];
                }
                if(currentCallSheet){
                    delete currentCallSheet.KEY_TAG;
                }
                $().alertmessage('showSuccess','取消标记成功！');
                $("#cdrDetailCloseBtn").click();
                $(".item6b073dd6-a262-464a-ae0b-8d1e84b8fd81").find(".icon-tag").remove();
                $(src).parent("td").empty();
            }else{
                $().alertmessage('showError','取消标记失败！');
            }
        })
    },
    addCdrMemo : function(data){
        DS.getView('cdr/addCdrMemo', function(view){
            var panel = $('#modal_panel');
            panel.empty();
            var currentCallSheet = handler.cdr.callSheetDataCache[data];
            if (!currentCallSheet) {
                currentCallSheet = handler.cdr.myCallSheetDataCache[data];
            }
            if(currentCallSheet){
                panel.append(view.replace(/__CALL_SHEET_ID/g,data)
                    .replace(/__CDR_MEMO/g,currentCallSheet.COMMENTS?currentCallSheet.COMMENTS:''));
                $('#show_cdr_add_memo_Modal').modal();
            }else{
                var action = {
                    action : 'app.callSheet.getCdrMemo',
                    data : data
                }
                DS.send(action,function(res){
                    panel.append(view.replace(/__CALL_SHEET_ID/g,data)
                        .replace(/__CDR_MEMO/g,res.data));
                    $('#show_cdr_add_memo_Modal').modal();
                });
            }
        });
    },
    editCdrMemo : function(data){
        DS.getView('cdr/editCdrMemo', function(view){
            var panel = $('#modal_panel');
            panel.empty();
            var currentCallSheet = handler.cdr.callSheetDataCache[data];
            if (!currentCallSheet) {
                currentCallSheet = handler.cdr.myCallSheetDataCache[data];
            }
            if(currentCallSheet){
                panel.append(view.replace(/__CALL_SHEET_ID/g,data)
                    .replace(/__CDR_MEMO/g,currentCallSheet.COMMENTS?currentCallSheet.COMMENTS:''));
                $('#show_cdr_add_memo_Modal').modal();
            }else{
                var action = {
                    action : 'app.callSheet.getCdrMemo',
                    data : data
                }
                DS.send(action,function(res){
                    panel.append(view.replace(/__CALL_SHEET_ID/g,data)
                        .replace(/__CDR_MEMO/g,res.data));
                    $('#show_cdr_add_memo_Modal').modal();
                });
            }
        });
    },

    saveCdrMemo : function(data){
        if(utils.getStrLength(data.memo)>700){
            alert('备注内容最多为350个汉字！');
            return;
        }
        var action = {
            action : 'app.callSheet.saveCdrMemo',
            data : data
        }
        DS.send(action,function(res){
            if(!res.success){
                $().alertmessage('showError','保存备注失败!');
                return;
            }
            $().alertmessage('showSuccess','保存备注成功!');
            var currentCallSheet = handler.cdr.callSheetDataCache[data.CALL_SHEET_ID];
            if (!currentCallSheet) {
                currentCallSheet = handler.cdr.myCallSheetDataCache[data.CALL_SHEET_ID];
            }
            if(currentCallSheet){
                currentCallSheet.COMMENTS = data.memo;
            }
            $('#cdr_comments').text(data.memo);
            $('#show_cdr_add_memo_Modal').modal('hide');
        });
    },
    editSaveCdrMemo : function(data){
        if(utils.getStrLength(data.memo)>700){
            alert('备注内容最多为350个汉字！');
            return;
        }
        var action = {
            action : 'app.callSheet.saveCdrMemo',
            data : data
        }
        DS.send(action,function(res){
            if(!res.success){
                $().alertmessage('showError','保存备注失败!');
                return;
            }
            $().alertmessage('showSuccess','保存备注成功!');
            var currentCallSheet = handler.cdr.callSheetDataCache[data.CALL_SHEET_ID];
            if (!currentCallSheet) {
                currentCallSheet = handler.cdr.myCallSheetDataCache[data.CALL_SHEET_ID];
            }
            if(currentCallSheet){
                currentCallSheet.COMMENTS = data.memo;
            }
            var newDom = '';
            if (data.memo) {
                var state = DS.getCookie("his_note_ishide");
                if (state) {
                    newDom+='<span class="his_note_ishide">'+data.memo+'</span><a href="#" class="his_comment ds_do_action" data-toggle="popover" ds_action="cdr.editCdrMemo" ds_data="'+data.CALL_SHEET_ID+'" data-placement="top" data-content="'+data.memo+'" data-original-title=""><img src="../../img/contact_history/comment_e.png" width="13"></a>';
                } else {
                    newDom+='<span class="his_note_ishide" style="display: none">'+data.memo+'</span><a href="#" class="his_comment ds_do_action" data-toggle="popover" ds_action="cdr.editCdrMemo" ds_data="'+data.CALL_SHEET_ID+'" data-placement="top" data-content="'+data.memo+'" data-original-title=""><img src="../../img/contact_history/comment_e.png" width="13"></a>';
                }
            } else {
                newDom+='<a href="#" class="his_comment ds_do_action" data-toggle="popover" ds_action="cdr.editCdrMemo" ds_data="'+data.CALL_SHEET_ID+'" data-placement="top" data-content="'+data.memo+'" data-original-title=""><img src="../../img/contact_history/comment_d.png" width="13"/></a>';
            }
            $('#cdr_comments').text(data.memo);
            $('#show_cdr_add_memo_Modal').modal('hide');
            $('.history_item_head_data').find('a[ds_data="'+data.CALL_SHEET_ID+'"]').parent().html(newDom);
            $('.history_item_head_data').find('a[ds_data="'+data.CALL_SHEET_ID+'"]').popover();
            // $('.pull-left').find('a[ds_data="history"]').click();
        });
    },
    cdrLocationCust : function(custName,custId,callSheetId){
        if(custId == '00000000000000000000'){
            return '<a class="ds_do_action" ds_action="cdr.showCdrLocationCustModel" ds_data="'+custName +','+ callSheetId +'">'+custName+'</a>';
        }else{
            return custName;
        }
    },
    showCdrLocationCustModel: function (data) {
        var custName = data.split(',')[0];
        var callSheetId = data.split(',')[1];
        var currentCallSheet = handler.cdr.callSheetDataCache[callSheetId];
        if (!currentCallSheet) {
            currentCallSheet = handler.cdr.myCallSheetDataCache[callSheetId];
        }
        if (currentCallSheet) {
            var phone=currentCallSheet.CALL_NO;
            var dialType=['dialout','dialTranfer'];
            if($.inArray(currentCallSheet.CONNECT_TYPE,dialType)!=-1){
                phone=currentCallSheet.CALLED_NO;
            }
            var province=currentCallSheet.PROVINCE;
            var city=currentCallSheet.DISTRICT;
            var action = {
                action : 'app.popup.locactionCustNum',
                data : {phone:phone}
            }
            DS.send(action,function(res){
                if(res.success){
                    var total=res.count;
                    DS.getView('cdr/show_cdr_location_cust', function (view) {
                        view = DS.renderMethodViewNew(view, currentCallSheet);
                        var panel = $('#modal_panel');
                        panel.html(view);
                        var p=$('#show_cdr_location_cust_Modal');
                        var pane=p.find(".modal-body");
                        var param={callId:callSheetId,phone:phone,province:province,city:city};
                        if(total==0){
                            handler.customer.loadCustAdd2Call(pane,param,function(){
                                p.modal();
                            });
                        }else{
                            var param={callId:callSheetId,phone:phone,province:province,city:city};
                            handler.customer.loadCustMore2Call(pane,param,function(){
                                p.modal();
                            });
                        }
                    });
                }else{
                    $().alertmessage('showError', errMsg);
                }
            });
        } else {
            $().alertmessage('showError', "系统获取通话记录详细信息失败，请重试!");
        }
    },
    call_sheet_export_monitor_task: function(data){
        handler.cdr.initCallSheetCondition('call_sheet_export_monitor_task_query_panel');
        $('#call_sheet_export_monitor_query_link').trigger('click');
    },
    searchExportMonitorTask: function(data, src){
        var data = handler.cdr.getSearchCondition(data);
        if (!handler.cdr.validateCondition(data)) {
            return false;
        }
        data.pageSize = handler.cdr.queryPageSize;
        data.page = src.val() || 1;
        handler.cdr.parseSearchDate(data);
        var mainPanelID = 'call_sheet_export_monitor_task_query_panel';
        var action = {
            action: 'app.callSheet.queryExportMonitorTask',
            data: data
        }
        DS.send(action, function (res) {
            if (res.success) {
                var list = res.list;
                if (list.length > 0) {
                    DS.getView('cdr/call_sheet_export_monitor_task_item', function (view) {
                        var html = [];
                        var callSheet = null;
                        for (var i = 0, len = list.length; i < len; i++) {
                            callSheet = list[i];
                            var downloadHtml = '';
                            $.each(callSheet.downloadUrlList, function(key, value){
                                downloadHtml+= 'PBX'+key+':<a href='+value+' target="_blank">下载</a>'+'       ';
                            })
                            callSheet.downloadUrlList = downloadHtml;
                            html.push(DS.renderMethodViewNew(view, callSheet));
                        }
                        $('#' + mainPanelID + ' .call_sheet_export_monitor_task_table_data').html(html.join(''));
                    });
                } else {
                    $('#' + mainPanelID + ' .call_sheet_export_monitor_task_table_data').html('');
                }
                DS.updatePagination('call_sheet_query_export_monitor_task_form', res.count, handler.cdr.queryPageSize, data.page);
            } else {
                alert('查询失败，请重新查询');
            }
        });
    },
    cancelMonitorTask: function(data){
        var action = {
            action: 'app.callSheet.removeExportMonitorTask',
            data: data
        };
        DS.send(action,function(rep) {
            if(rep.success){
                alert('取消任务成功！');
                $('#call_sheet_export_monitor_query_link').trigger('click');
            }else{
                alert('取消任务失败' + rep.message);
            }
        });
    },
    getMonitorTaskStatusName: function(data){
        if(data == 'ready'){
            return '<span style="color: orange">等待压缩</span>';
        }else{
            return '<span style="color: green">完成</span>';
        }
    },
    getMonitorTaskOperation: function(status, id){
        if(status == 'ready'){
            return '<a class="ds_do_action" ds_action="cdr.cancelMonitorTask" ds_data="'+id+'">取消任务</a>';
        }else{
            return '';
        }
    },
    cdr_main: function(data){
        var pane=$("#contact_list_cdr");
        pane.find(".btn_cdr_call").click();
    },
    quick_subMenu_search: function(submenu, src){
        var searchPane = src.closest(".left_column");
        searchPane.find(".model_submenu button").removeClass("active");
        src.addClass("active");
        handler.cdr.curSubMenu=submenu;

        if(submenu=='cdr_call'){
            handler.swapSubMenu(submenu, 'cdr/cdr_incomingCall_list', 'cdr_call');
            handler.webchat.curTabFlag = "cdrCall";
        }else if(submenu=='cdr_all'){
            handler.swapSubMenu(submenu, 'cdr/cdr_ykf_list', 'cdr_all');
            handler.webchat.curTabFlag = "cdrAll";
        }else if(submenu=='cdr_my') {
            handler.swapSubMenu(submenu, 'cdr/cdr_ykf_list_my', 'cdr_my');
            handler.webchat.curTabFlag = "cdrMy";
        }

    },
    cdr_incomingCall_list: function(id){
        //do nothing
        if(!handler.call.pane)
            handler.call.pane = $("#call_list_"+id).find(".list-inside");
        if(!handler.call.paneDetail)
            handler.call.paneDetail = $("#contact_detail_"+id).find(".content");

        //handler.call.test('01051234578');
    },
    cdr_ykf_list: function(data){
        var pane=$("#view_cdr_all");
        handler.cdr._initCallSearch(pane,data);
        handler.cdr.searchCallCard({},null);
    },
    cdr_ykf_list_my: function(data){
        var pane=$("#view_cdr_my");
        handler.cdr._initCallSearch(pane,data);
        handler.cdr.searchMyCallCard({},null);
    },
    searchMyCallCard: function(data, src) {
        if(src && src.hasClass("refresh")){
            var searchPane = $('#view_cdr_my');
            var param=handler._getSearchCondition(searchPane,"1")||{};
            var a=searchPane.find(".pagination li.active>a");
            if(a.length>0){
                param.page= a.attr("value");
            }
            param.DISPOSAL_AGENT = session.user._id;
            handler.cdr.queryCallList(param,null);
        }else{
            data.DISPOSAL_AGENT = session.user._id;
            setDateTimeCondition(data);
            handler.cdr.queryCallList(data,src);
        }
    },
    searchCallCard: function(data, src) {
        if(src && src.hasClass("refresh")){
            var searchPane = $('#view_cdr_all');
            var param=handler._getSearchCondition(searchPane,"1")||{};
            var a=searchPane.find(".pagination li.active>a");
            if(a.length>0){
                param.page= a.attr("value");
            }
            param.isCdrAllAdvanceSearch = "1";
            handler.cdr.queryCallList(param,null);
        }else{
            data.isCdrAllAdvanceSearch = "1";
            setDateTimeCondition(data);
            handler.cdr.queryCallList(data,src);
        }
    },
    queryCallList:function(data,src){
        data=data||{};
        var isAdvanceSearch=data.isAdvanceSearch;
        delete  data.isAdvanceSearch;
        var isCdrAllAdvanceSearch = data.isCdrAllAdvanceSearch;
        delete data.isCdrAllAdvanceSearch;

        var pane=$("#view_cdr_my");
        var frmId='frm_cdr_my_search';
        var tipsfrmId='frm_cdr_my_advanced_search';
        if(isCdrAllAdvanceSearch == '1'){
            pane=$('#view_cdr_all');
            frmId = "frm_cdr_all_search";
            tipsfrmId='frm_cdr_all_advanced_search';
        }
        if(isAdvanceSearch=="1"){
            frmId = tipsfrmId;
        }

        handler._setSearchCondition(data,pane);
        pane.find(".pagination").attr({for:frmId});

        var page=data.page;
        if(src && src.hasClass("page_on")){
            page=src.attr("value");
            handler.cancelDealToolbar("cdr");
        }
        if(!page)page=1;
        data.page=page;
        data.pageSize=handler.cdr.queryPageSize;
        var action={
            action:'app.callSheet.queryCallSheet',
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                DS.showSearchTips(pane.find("#"+tipsfrmId), true);
                var list=rep.list;
                var count=rep.count;
                var container=pane.find('.list-inside');
                if (list.length > 0){
                    var html = [];
                    for (var i = 0, len = list.length; i < len; i++) {
                        var row = list[i];
                        handler.channelHistory._setCallItem(row);
                        if ((session.user.isAdmin || isHasFunc("func_user_call_sheet_listen_file")) &&
                            (session.user.isAdmin || isHasFunc("func_not_edit_remark_field")) ) {
                            html.push(template("tmpl_callsheet_item_no_all",row));
                        }else if(session.user.isAdmin || isHasFunc("func_user_call_sheet_listen_file")) {
                            html.push(template("tmpl_callsheet_item_no_listen",row));
                        }else if (session.user.isAdmin || isHasFunc("func_not_edit_remark_field")){
                            html.push(template("tmpl_callsheet_item_no_change",row));
                        } else {
                            html.push(template("tmpl_callsheet_item",row));
                        }
                    }
                    container.html(html.join(''));
                } else {
                    var html='<div class="alert">没有记录!</div>';
                    container.html(html);
                }
                DS.updatePagination(frmId, count, data.pageSize, data.page);
                pane.find('.advanced_search_pane').addClass("hidden");
                container.find(".7m-jmp3").jmp3({
                    backcolor: "11467B",
                    forecolor: "00ff00",
                    width: 65,
                    showdownload: "false",
                    showfilename: "false"
                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    autoSearchCustomerHistory:function(){
        var data={};
        data.page=1;
        data.pageSize=5;
        data.DISPOSAL_AGENT = session.user._id;
        var action={
            action:'app.callSheet.queryCallSheet',
            data:data
        }
        DS.send(action,function(response){
            if(response.success){
                $("#cdr_history-item").empty();
                for(var i=0;i<response.list.length;i++){
                    var list=response.list[i];
                    var month=list.OFFERING_TIME.substring(5, 7);
                    var day=list.OFFERING_TIME.substring(8, 10);
                    var time=list.OFFERING_TIME.substring(11,16);
                    list.day=month+"/"+day;
                    list.time=time;
                    if(list.CONNECT_TYPE=="dialout"||list.CONNECT_TYPE=='dialTransfer'){
                        list.icon='/img/client/tel_out.png';
                        list.callNum=list.CALLED_NO;
                        list.callNoDesc=checkHideTel(list.CALLED_NO);
                    }else if(list.CONNECT_TYPE=="normal"||list.CONNECT_TYPE=='transfer'){
                        list.icon="/img/client/tel_in.png"
                        list.callNum=list.CALL_NO;
                        list.callNoDesc=checkHideTel(list.CALL_NO);
                    }
                    var customerHistory=template("auto_search_customer_history_item",list);
                    $("#cdr_history-item").append(customerHistory);
                }
                $("#phone-num-autoComplate").css("width",$("#cdr_history-item").width()-0+28);
            }
        })
    },
    showMycallHistoryDetail:function(data,src){
        var pane=$("#phone-num-autoComplate");
        var flag=$("#dialout_input_pop").attr("flag");
        if(flag=="on"){
            $("#dialout_input_pop").attr("flag","off")
            return;
        }
        var phoneCookie = DS.getCookie("phoneNum");
        //_cti_ui_Autocomplete_new(phoneCookie);
        var phoneNumArr = phoneCookie.split("%3B");
        var num=src.val();
        if(num.length<=0){
            $("#cdr_history-item").show();
            pane.hide();
        }else{
            $("#cdr_history-item").hide();
            pane.show();
        }
        for(var i=0;i<phoneNumArr.length;i++){
            var validNum=phoneNumArr[i].substring(0,num.length);
            if(validNum==num){
                pane.children("li[flag="+phoneNumArr[i]+"]").show().attr("state","on");
            }else{
                pane.children("li[flag="+phoneNumArr[i]+"]").hide().attr("state","off");
            }
        }
    },
    checkPhoneNumToCallOut:function(data,src){
        var num=src.html();
        $("#dialout_input_pop").val(num).focus();
        src.siblings().removeClass("active");
    },
     showCdrDetail:function(callId,src){
        var action = {
            action: 'app.callSheet.relocationCustomer',
            data: {_id:callId}
        };
        DS.send(action,function(rep){
            if(rep.success) {
                var contacts = rep.list||[];
                var count = rep.count;
                var callDB=rep.row||{};
                var phone=rep.tel;
                var callSheetId=callDB._id;
                var province=callDB.PROVINCE;
                var city=callDB.DISTRICT;
                var label=callDB.LABELS?callDB.LABELS:'';
                var p=$('#view_cdr_my_content');
                if(src.closest(".card_pane").attr("id") == 'view_cdr_all'
                    || src.closest(".content_pane").attr("id") == 'view_cdr_all_content'){
                    var p=$('#view_cdr_all_content');
                }
                var paneId=callId+"__"+p.attr("id")+"_relocationCall";
                DS.getView("channelHistory/call_info", function (view) {
                    callDB._id+="__"+p.attr("id");
                    view=DS.renderMethodViewNew(view,callDB);
                    p.html(view);
                    var call_right=$("#"+ p.attr("id")+paneId);
                    callSheetId += "__"+p.attr("id");
                    $("#"+paneId).attr("phone",checkEncryptTel(phone));
                    $("#"+paneId).attr("province",province);
                    $("#"+paneId).attr("city",city);
                    $("#"+paneId).data("cdrInfo",{callId:callId,phone:checkEncryptTel(phone),flag:'relocationCall'});
                    handler.channelHistory.curShowPaneCallId = callSheetId;
                    handler.channelHistory.currentFlag = "relocationCall";
                    if(count==-1){
                        handler.call.loadCustAddByTelFirst(phone,paneId,province,city,true);
                    }else{
                        if(!contacts || contacts.length == 0) {
                            handler.call.loadCustAddByTelFirst(phone,paneId,province,city);
                        } else if(contacts.length == 1) {
                            handler.customer.loadCustInfo(contacts[0]._id,callSheetId,"relocationCall",null,null,function(){
                                //call_right.find(".func_tab.active").click();
                            });
                            dsevent.publish(dsevent.evt.callRefreshCustomer,contacts[0]);
                        } else {
                            //handler.call.loadCustMorePopInfo(phone,contacts, paneId, true,null,count,province,city);
                            handler.call.loadCustMultiByTel(phone,paneId,province,city);
                        }
                    }

                    var pane= p.find(".call_body").find('.cust_tab_content_other');
                    //handler.channelHistory._loadCallInfo(pane,callDB);
                    handler.channelHistory._loadCallInfo(pane,callDB,callId,label);
                    //to if show channelcdr

                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    _initCallSearch:function(searchPane,menu){
        var pane=searchPane;
        var container=pane.find(".advanced_search_pane");
        if(container.find(".ds_owner").length>0){
            var inputId=menu+"_owner_select_input";
            var containerId=menu+"_owner_select_user";
            utils.loadAgentTabBox(inputId,containerId,{width:"126",height:"17",maxHeight:292,hideTab:0,isRadio:true,commonTab:true},false,false,true);
        }
        var callStatusHtml = handler.cdr.getCallStatusSelectorHtml('STATUS', '');
        container.find("select[name='STATUS']").get(0).outerHTML = callStatusHtml;
        var queueHtml = handler.cdr.getQueueSelectorHtml('ERROR_MEMO', '');
        container.find("select[name='ERROR_MEMO']").get(0).outerHTML = queueHtml;
        var callTypeHtml = handler.cdr.getCallTypeSelectorHtml('CONNECT_TYPE', '');
        container.find("select[name='CONNECT_TYPE']").get(0).outerHTML = callTypeHtml;
        var investigateHtml = handler.cdr.getInvestigateSelectorHtml('INVESTIGATE', '');
        container.find("select[name='INVESTIGATE']").get(0).outerHTML = investigateHtml;

        pane.find(".btn_advanced_search").bind("click",function(e){
            e.stopPropagation();
            var offset=searchPane.find(".quick_search").offset();
            container.css({top:offset.top+28+"px",left:offset.left+"px"});
            container.toggleClass("hidden");
        });
        resizeLeftColumn(searchPane);
    }, 
    quickSearchCdrStauts: function(data, src){
        var paneFlag = data.substring(0, data.indexOf("_"));
        var status = data.substring(data.indexOf("_")+1, data.length);
        if(status == 'all')
            status = '';
        if(paneFlag == 'all'){
            var pane = $("#view_cdr_all");
            pane.find("select[name='STATUS']").val(status);
            pane.find(".cdr_adv_search").click();
        }else{
            var pane = $("#view_cdr_my");
            pane.find("select[name='STATUS']").val(status);
            pane.find(".cdr_adv_search").click();
        }
        pane.find(".quickSearchCdrStauts_current").html(src.text());
    },
    changeQuickSearchCdrStauts: function(src){
        var callStatus = getCache('callStatus');
        var statusDisplay = "全部";
        for(var i=0;i<callStatus.length;i++){
            if(callStatus[i].code_value == src.val()){
                if(src.val() == 'notDeal')
                    statusDisplay = '振铃未接';
                else
                    statusDisplay = callStatus[i].code_name;
            }
        }
        src.closest('.list_check_pane').find(".quickSearchCdrStauts_current").html(statusDisplay);
    },


    callRefreshCustomer: function(data) {
        var pane = $(".item" + data.callId);
        pane.attr("customerId", data.customerId);
        pane.find(".customer").html(data.custName);
    },
    customerUpdate: function(data) {
        dsevent.publish(dsevent.evt.callRefreshCustomer,data);
    },
    cdrCallLabelChange:function(data,src){
        var arr=[];
        src.closest(".cdr-all-use-label").find("input:checked").each(function(index,node){
            arr[arr.length]=$(node).attr("ds_data");
        })
        var callId=src.closest("td.cdr-all-use-label").attr("ds_data");
        var checked=src.attr("checked");
        if(checked){
            $("td[ds_data="+callId+"]").find("input[ds_data="+data+"]").attr("checked","checked");
        }else{
            $("td[ds_data="+callId+"]").find("input[ds_data="+data+"]").removeAttr("checked");
        }
        var state={};
        state.label=arr;
        state.callSheetId = callId;
        var action = {
            action: 'app.callSheet.markCallSheet',
            data: state
        };
        DS.send(action, function (response) {
            if(!response.success){
                $().alertmessage('showError',"服务异常!");
            }
        });

    },
    cdrShowUseLabelDetal:function(callId,label){
        var data= getCache('callLabel');
        var pane= $(".cdr-all-use-label,.cdr-all-use-label-model");
        if(data==-1){
            $(".cdr_use_label_wrap").hide();
        }else if(data.length<=0){
            pane.html("暂无可使用的通话标签,请去设置里面配置！");
        }
        pane.each(function(index,node){
            if($(node).html()=='') {
                for (var i = 0; i < data.length; i++) {
                    if (data.length > 0) {
                        if (callId) {//区别通话弹框
                            var labeles = template("showUseLabelDetal", data[i]);
                            $(node).append(labeles);
                            $(".cdr-all-use-label-model").empty();
                        }else{
                            var modelLabel = template("showModelUseLabelDetal", data[i]);
                            $(node).append(modelLabel);
                        }
                    }
                }
            }
        })

        if(callId) {
            $("#"+callId+"__view_cdr_my_content_relocationCall"+",#"+callId+"__view_cdr_all_content_relocationCall").find(".cdr-all-use-label").attr("ds_data", callId);
        }else {//通话弹框
            var newCallId=$("#setCallLabel").attr("call");
            var labelIdObj = JSON.parse(window.localStorage.getItem("labelIdObj"));
            if(labelIdObj){
                var localCallId=labelIdObj.callID;
                if(newCallId!= localCallId){
                    window.localStorage.setItem("labelIdObj",JSON.stringify({"callId":newCallId,"labelIdArray":"[]"}));
                    $(".cdr-model-label").find("input").removeAttr("checked");
                }else{
                    if (labelIdObj.labelIdArray) {
                        for (var i = 0; i < labelIdObj.labelIdArray.length; i++) {
                            $(".cdr-model-label").find("input[ds_data=" +labelIdObj.labelIdArray[i] + "]").attr("checked", "checked");
                        }
                    }
                }
            }
        }
        if(label) {
            for (var i = 0; i < label.length; i++) {
                if (label.length > 0) {
                    $("td[ds_data="+callId+"]").find("input[ds_data=" + label[i] + "]").attr("checked", "checked");
                }
            }
        }
        $("#view_cdr_all_content .cfg_call_label.show-label-use").find("input").attr("disabled","disabled");

    },
    cdrShowCallLabelModal:function(){
        var pane=$("#cdr_label_modal_del");
        pane.width(560);
        pane.modal();
        handler.cdr.cdrShowUseLabelDetal();
    }
}
function generateComboxOptionsFromDocs(docs, codeName, codeValue, currentValue) {
    var selectOptionHtml = '<option value="__value" selected>__name</option>';
    var optionHtml = '<option value="__value">__name</option>';
    var resultOptions = '';

    for (var i = 0; i < docs.length; i++) {
        if (docs[i][codeValue] === currentValue) {
            resultOptions += selectOptionHtml.replace(/__value/g, docs[i][codeValue])
                .replace(/__name/g, docs[i][codeName]);
        } else {
            resultOptions += optionHtml.replace(/__value/g, docs[i][codeValue])
                .replace(/__name/g, docs[i][codeName]);
        }
    }
    return resultOptions;
}
