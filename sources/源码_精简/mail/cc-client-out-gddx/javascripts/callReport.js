handler.report.callReport = {
    call_report_main: function(menu){
        var pane=$("#view_"+menu);
        var menus = [
            'callin_report',
            'call_report_relay_area',
            'callout_report',
            'call_report_dialout_area',
            'queue_report',
            'call_report_queue_time',
            'call_report_agent',
            'call_report_approve_survey'
        ];
        for(var i=0; i<menus.length; i++){
            if(!isHasMenu(menus[i])){
                pane.find(".sub-nav>.tab_" + menus[i]).remove();
            }else{
                pane.find(".sub-nav>.tab_" + menus[i]).show();
            }
        }
        pane.find(".sub-nav").find("li:first>a").click();
    },
    call_report_agent: function(menu) {
        handler.report.callReport.call_report_agent(menu);
    },
    queue_report: function(menu) {
        handler.report.callReport.call_report_queue(menu);
    },
    callin_report: function(menu) {
        handler.report.callReport.call_report_relay_time(menu);
    },
    callout_report: function(menu) {
        handler.report.callReport.call_report_call_out(menu);
    },
    call_report_relay_area: function(menu) {
        handler.report.callReport.call_report_relay_area(menu);
    },
    call_report_dialout_area: function(menu) {
        handler.report.callReport.call_report_dialout_area(menu);
    },
    call_report_approve_survey: function(menu) {
        handler.report.callReport.call_report_approve_survey(menu);
    },
    call_report_queue_time: function(menu) {
        handler.report.callReport.call_report_queue_time(menu);
    },

    getDaySelect: function(year, month){
        var  day = new Date(year,month,0);
        //获取天数：
        var dayCount = day.getDate();
        var dayOptions = "";
        for (var n = 1; n <= dayCount; n++) {
            dayOptions += '<option value=' + (n<10?'0'+n:n) + '>' + n +'日'+ '</option>';
        }
        return dayOptions;
    },
    changeDaySelect: function(obj, type){
        var dayOptions = "";
        if(type == 'year'){
            $(obj).next('.monthReport').val("01");
            dayOptions = handler.report.callReport.getDaySelect($(obj).val(), $(obj).next('.monthReport').val());
            $(obj).next().next(".dayReport").html(dayOptions);
        }else{
            dayOptions = handler.report.callReport.getDaySelect($(obj).prev(".yearReport").val(), $(obj).val());
            $(obj).next(".dayReport").html(dayOptions);
        }

    },

    resetDate: function (data, dateType, setDate) {
        $('#im_report_keyword_btn').val('0');
        $('#im_report_website_btn').val('0');
        $('#datepickerStart').datetimepicker({
            format: 'yyyy-mm-dd',
            language: 'zh-CN',
            pickDate: true,
            pickTime: false,
            autoclose: true,
            todayBtn: true
        });
        $('#datepickerEnd').datetimepicker({
            format: 'yyyy-mm-dd',
            language: 'zh-CN',
            pickDate: true,
            pickTime: false,
            autoclose: true
        });
        var yearSelect = '<select name="yearReport" class="yearReport" onchange="handler.report.callReport.changeDaySelect(this, \'year\');">';
        for (var i = 2010; i < 2018; i++) {
            yearSelect += '<option value=' + i + '>' + i + '年'+'</option>';
        }
        yearSelect += '<select>';
        var monthSelect = '<select name="monthReport" class="monthReport" onchange="handler.report.callReport.changeDaySelect(this, \'month\');">';
        for (var j = 1; j < 13; j++) {
            monthSelect += '<option value=' + (j<10?'0'+j:j) + '>' + j +'月'+ '</option>';
        }
        monthSelect += '<select>';
        var daySelect = '<select name="dayReport" class="dayReport"></select>';

        var timeShow = '<span class="timeReport span2"><input type="hidden" name="timeReport"></span>';

        var otherSelect = '<input class="span2" type="text" name="StartTime" placeholder="00:00:00"/>--<input class="span2" type="text" name="EndTime" placeholder="23:59:59"/>'
        var currentDate = new Date();
        var timeType = dateType;
        var resetor = {
            year: function () {
                $('#' + data).html(yearSelect);
                if (setDate) {
                    $('#' + data + ' .yearReport').val(setDate.yearReport);
                } else {
                    $('#' + data + ' .yearReport').val(currentDate.getFullYear());
                }
                $('#'+data+'_other').hide();
            },
            month: function () {
                $('#' + data).html(yearSelect + monthSelect);
                if (setDate) {
                    $('#' + data + ' .yearReport').val(setDate.yearReport);
                    $('#' + data + ' .monthReport').val(setDate.monthReport);
                } else {
                    $('#' + data + ' .yearReport').val(currentDate.getFullYear());
                    var currentMonth = currentDate.getMonth() + 1;
                    if(currentMonth < 10) {
                        currentMonth = '0' + currentMonth;
                    }
                    $('#' + data + ' .monthReport').val(currentMonth);
                }
                $('#'+data+'_other').hide();
            },
            day: function () {
                $('#' + data).html(yearSelect + monthSelect + daySelect);
                if (setDate) {
                    $('#' + data + ' .yearReport').val(setDate.yearReport);
                    $('#' + data + ' .monthReport').val(setDate.monthReport);
                    var dayOptions = handler.report.callReport.getDaySelect($('#' + data + ' .yearReport').val(), $('#' + data + ' .monthReport').val());
                    $("#" + data + " .dayReport").html(dayOptions);

                    $('#' + data + ' .dayReport').val(setDate.dayReport);
                } else {
                    $('#' + data + ' .yearReport').val(currentDate.getFullYear());
                    var currentMonth = currentDate.getMonth() + 1;
                    if(currentMonth < 10) {
                        currentMonth = '0' + currentMonth;
                    }
                    $('#' + data + ' .monthReport').val(currentMonth);

                    var dayOptions = handler.report.callReport.getDaySelect($('#' + data + ' .yearReport').val(), $('#' + data + ' .monthReport').val());
                    $("#" + data + " .dayReport").html(dayOptions);

                    var currentDay = currentDate.getDate();
                    if(currentDay < 10) {
                        currentDay = '0' + currentDay;
                    }
                    $('#' + data + ' .dayReport').val(currentDay);
                }
                $('#'+data+'_other').hide();
            },
            time: function () {
                $('#' + data).html(yearSelect + monthSelect + daySelect + timeShow);
                if (setDate) {
                    $('#' + data + ' .yearReport').val(setDate.yearReport);
                    $('#' + data + ' .monthReport').val(setDate.monthReport);
                    var dayOptions = handler.report.callReport.getDaySelect($('#' + data + ' .yearReport').val(), $('#' + data + ' .monthReport').val());
                    $("#" + data + " .dayReport").html(dayOptions);

                    $('#' + data + ' .dayReport').val(setDate.dayReport);
                    $('#' + data + ' .timeReport').append(setDate.timeReport.slice(-8));
                }
                $('#'+data+'_other').hide();
            },
            other : function(){
                $('#' + data).html('');
                $('#'+data+'_other').css('display','inline');
                if (setDate){
                    $('#'+data+'_other .report_start_time').val(setDate.StartTime);
                    $('#'+data+'_other .report_end_time').val(setDate.EndTime);
                    if(setDate.StartTime && setDate.EndTime){
                        var arraySta = parseInt(setDate.StartTime.replace(/-/g,""));
                        var arrayEnd = parseInt(setDate.EndTime.replace(/-/g,""));
                        if(arrayEnd < arraySta){
                            $().alertmessage('showError','开始时间必须小于结束时间！')
                            return;
                        }
                    }
                }
            },
            all : function(){
                $('#' + data).html('');
            }
        }
        if (timeType == 'year') {
            resetor.year();
        } else if (timeType == 'month') {
            resetor.year();
            resetor.month();
        } else if (timeType == 'day') {
            resetor.year();
            resetor.month();
            resetor.day();

        } else if(timeType == 'other' || timeType == 'other_half_hour'){
            resetor.other();
        } else if (timeType == 'time') {
            resetor.year();
            resetor.month();
            resetor.day();
            resetor.time();
        } else if (timeType == "all"){
            resetor.all();
            $('#'+data+'_other').hide();
        }

    },
    renderTableHeader: function (headerConfig) {
        //first sort
        headerConfig.sort(function(obj1,obj2){
            return obj1.order - obj2.order;
        });
        var tableType = headerConfig.tableType;
        delete headerConfig.tableType;
        var headerHtml = '<tr style="background-color: #f5f5f5">';
        var j = 0;

        var headerData = {};
        for(var i =0 ;i < headerConfig.length;i++){
            if(headerConfig[i].show === true){
                headerData = {reportType: tableType + "_table_id", orderNum: j, displayname:headerConfig[i].displayname, objectType: "int"}
                if(tableType == 'call_report_department'){
                    if(headerConfig[i].name == 'CallInAccessCount' || headerConfig[i].name == 'CallInAcceptCount' || headerConfig[i].name == 'CallInAcceptRate' || headerConfig[i].name == 'AgentUtilization'
                        || headerConfig[i].name == 'CallOutAccessCount' || headerConfig[i].name == 'CallOutAcceptCount' || headerConfig[i].name == 'TransferAcceptCount'){
                        headerData.objectType = "int";
                    }else{
                        headerData.objectType = "String";
                    }
                }else if(tableType == 'call_report_agent'){
                    if(headerConfig[i].name == 'CallInAccessCount' || headerConfig[i].name == 'CallInAcceptCount' || headerConfig[i].name == 'CallInAcceptRate' || headerConfig[i].name == 'AgentUtilization'
                        || headerConfig[i].name == 'CallOutAccessCount' || headerConfig[i].name == 'CallOutAcceptCount' || headerConfig[i].name == 'TransferAcceptCount'){
                        headerData.objectType = "int";
                    }else{
                        headerData.objectType = "String";
                    }
                }else if(tableType == 'call_report_agent_time'){
                    if(headerConfig[i].name == 'CallInAccessCount' || headerConfig[i].name == 'CallInAcceptCount' || headerConfig[i].name == 'CallInAcceptRate'
                        || headerConfig[i].name == 'CallOutAccessCount' || headerConfig[i].name == 'CallOutAcceptCount' || headerConfig[i].name == 'TransferAcceptCount'){
                        headerData.objectType = "int";
                    }else{
                        headerData.objectType = "String";
                    }
                }else if(tableType == 'call_report_queue'){
                    if(headerConfig[i].name == 'AccessCount' || headerConfig[i].name == 'AcceptCount' || headerConfig[i].name == 'AcceptRate' || headerConfig[i].name == 'AcceptIn20Count'){
                        headerData.objectType = "int";
                    }else{
                        headerData.objectType = "String";
                    }
                }else if(tableType == 'call_report_queue_time'){
                    if(headerConfig[i].name == 'AccessCount' || headerConfig[i].name == 'AcceptCount' || headerConfig[i].name == 'AcceptRate' || headerConfig[i].name == 'AcceptIn20Count'){
                        headerData.objectType = "int";
                    }else{
                        headerData.objectType = "String";
                    }
                }else if(tableType == 'call_report_relay_time'){
                    if(headerConfig[i].name == 'ReportTime'){
                        headerData.objectType = "String";
                    }else{
                        headerData.objectType = "int";
                    }
                }else if(tableType == 'call_report_approve_survey'){
                    if(headerConfig[i].name == 'agent_name'){
                        headerData.objectType = "String";
                    }else{
                        headerData.objectType = "int";
                    }
                }else if(tableType == 'call_report_dialout_time'){
                    if(headerConfig[i].name == 'CallTimeLength' || headerConfig[i].name == 'CallOutAverageTimeLength' || headerConfig[i].name == 'ReportTime'){
                        headerData.objectType = "String";
                    }else{
                        headerData.objectType = "int";
                    }
                }else if(tableType == 'call_report_dialout_area'){
                    if(headerConfig[i].name == 'Province' || headerConfig[i].name == 'CallOutAverageTimeLength' || headerConfig[i].name == 'CallTimeLength'){
                        headerData.objectType = "String";
                    }else{
                        headerData.objectType = "int";
                    }
                }else if(tableType == 'call_report_relay_area'){
                    if(headerConfig[i].name == 'Province'){
                        headerData.objectType = "String";
                    }else{
                        headerData.objectType = "int";
                    }
                }else if(tableType == 'call_report_relay_area_city'){
                    if(headerConfig[i].name == 'City'){
                        headerData.objectType = "String";
                    }else{
                        headerData.objectType = "int";
                    }
                }else if(tableType == 'im_report_message'){
                    if(headerConfig[i].name == 'platform' || headerConfig[i].name == 'averageSessionTimeLength'
                        || headerConfig[i].name == 'averageFirstResponseTimeLength'){
                        headerData.objectType = "String";
                    }else{
                        headerData.objectType = "int";
                    }
                }else if(tableType == 'im_report_business'){
                    if(headerConfig[i].name == 'consultType'){
                        headerData.objectType = "String";
                    }else{
                        headerData.objectType = "int";
                    }
                }else if(tableType == 'im_report_agent'){
                    if(headerConfig[i].name == 'agentName' || headerConfig[i].name == 'sessionAverageTimeLength'){
                        headerData.objectType = "String";
                    }else{
                        headerData.objectType = "int";
                    }
                }else if(tableType == 'im_report_csr'){
                    if(headerConfig[i].name == 'agentName'){
                        headerData.objectType = "String";
                    }else{
                        headerData.objectType = "int";
                    }
                }else if(tableType == 'im_report_session_time'){
                    if(headerConfig[i].name == 'reportTime'){
                        headerData.objectType = "String";
                    }else{
                        headerData.objectType = "int";
                    }
                }
                headerHtml+= template("tmpl_report_table_header", headerData);
                j++;
            }
        }
        headerHtml+='</tr>';
        return headerHtml;
    },
    formatTime: function (seconds) {
        var result = '00:00:00';
        if (seconds > 0) {
            var hour = Math.floor(seconds / 3600);
            var minute = Math.floor((seconds % 3600) / 60);
            var second = Math.floor(seconds % 60);
            if (hour < 10) {
                hour = "0" + hour;
            }
            if (minute < 10) {
                minute = "0" + minute;
            }
            if (second < 10) {
                second = "0" + second;
            }
            result = hour + ":" + minute + ":" + second;
        }
        return result;
    },
    openConfigTableHeader: function (data) {
        DS.getView('report/configTableHeader', function (view) {
            var action = {
                action: 'app.report.getTableHeader',
                data: data
            }
            DS.send(action, function (res) {
                if (!res.success) {
                    alert('get table header fail!');
                    return;
                }
                var configlist = res.data.Config;
                configlist.sort(function (obj1, obj2) {
                    return obj1.order - obj2.order;
                });

                if(data == 'call_report_approve_survey'){
                    view = view.replace(/__configList/g,handler.report.renderApproveSurveyReportTableHeaderConfig(configlist))
                        .replace(/__reportType/g,data)
                        .replace(/__reportName/g,res.data.ReportName);
                }else{

                    view = view.replace(/__configList/g,handler.report.callReport.renderReportTableHeaderConfig(configlist))
                        .replace(/__reportType/g,data)
                        .replace(/__reportName/g,res.data.ReportName);
                }

                var panel = $('#' + data + '_config_table_header_pane');
                panel.empty();
                panel.append(view);
                $('#' + data + '_config_table_header_Modal').modal();
            });
        });
    },
    renderReportTableHeaderConfig : function(data){
        var view = "";
        var html = " <tr class='dragTip' title='拖动来改变表头显示顺序'>" +
            "<td>__displayname<input type='checkbox' class='tableHeaderItem' __checked name='__name@__displayname'></td>" +
            "</tr>";
        for(var i=0 ; i< data.length ; i++){
            view += html.replace(/__displayname/g,data[i].displayname)
                .replace(/__checked/g,data[i].show === true ? "checked":"")
                .replace(/__name/g,data[i].name);
        }
        return view;
    },
    saveTableHeader: function (data) {
        var orderList = $('#' + data.reportType + '_table_header_list .tableHeaderItem');
        data.headers = new Array();
        for (var i = 0; i < orderList.length; i++) {
            data.headers.push({'name': orderList[i].name, 'order': i + 1, 'show': orderList[i].checked})
        }
        var action = {
            action: 'app.report.saveTableHeader',
            data: data
        }
        DS.send(action, function (res) {
            if (!res.success) {
                alert('配置显示表头失败!');
                return;
            }
            alert('配置显示表头成功!');
            $('#' + data.reportType + '_config_table_header_Modal').modal('hide');
            $('#' + data.reportType + '_btn').click();
        });
    },
    initHighCharts : function(containerId,datas,seriesArray,xName){
        //先判断全局变量里是否已经加载了highcharts
        if(!window.Highcharts){
            var oHead = document.getElementsByTagName('HEAD').item(0);
            var oScript= document.createElement("script");
            oScript.type = "text/javascript";
            oScript.src="./javascripts/highcharts.js";
            oHead.appendChild( oScript);
            if (!/*@cc_on!@*/0) { //if not IE
                //Firefox2、Firefox3、Safari3.1+、Opera9.6+ support js.onload
                oScript.onload = function () {
                    handler.report.callReport.generateHighCharts(containerId,datas,seriesArray,xName);
                }
            } else {
                //IE6、IE7、IE8 support js.onreadystatechange
                oScript.onreadystatechange = function () {
                    if (oScript.readyState == 'loaded' || oScript.readyState == 'complete') {
                        handler.report.callReport.generateHighCharts(containerId,datas,seriesArray,xName);
                    }
                }
            }
        }else{
            handler.report.callReport.generateHighCharts(containerId,datas,seriesArray,xName);
        }
    },
    generateHighCharts : function(containerId,datas,seriesArray,xName){
        var xArray = new Array();
        var titleText = '';
        if (xName == 'queue_name'){
            titleText = '技能组对比';
        } else if (xName == 'agent_name'){
            titleText = '座席工作量对比';
        } else if (xName == 'department_name'){
            titleText = '部门工作量对比';
        }
        for(var i = 0 ; i < datas.length - 1 ; i++){
            xArray.push(datas[i][xName]);

            for(var j=0 ; j < seriesArray.length ; j++){
                seriesArray[j]['data'].push(datas[i][seriesArray[j].valueName])
            }
        }
        $('#'+containerId).highcharts({
            chart: {
                type: 'column'
            },
            title: {
                text: titleText
            },
            xAxis: {
                categories: xArray
            },
            yAxis: {
                min: 0,
                title: {
                    text: '时长 (s)'
                }
            },
            tooltip: {
                headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                    '<td style="padding:0"><b>{point.y:.1f} s</b></td></tr>',
                footerFormat: '</table>',
                shared: true,
                useHTML: true
            },
            plotOptions: {
                column: {
                    pointPadding: 0.2,
                    borderWidth: 0
                }
            },
            exporting:{
                enabled : false//暂时关闭了，图表导出功能
            },
            series: seriesArray
        });
    },
    initTimeHighCharts : function(containerId,datas,seriesArray,xName){
        //先判断全局变量里是否已经加载了highcharts
        if(!window.Highcharts){
            var oHead = document.getElementsByTagName('HEAD').item(0);
            var oScript= document.createElement("script");
            oScript.type = "text/javascript";
            oScript.src="./javascripts/highcharts.js";
            oHead.appendChild( oScript);
            if (!/*@cc_on!@*/0) { //if not IE
                //Firefox2、Firefox3、Safari3.1+、Opera9.6+ support js.onload
                oScript.onload = function () {
                    handler.report.callReport.generateTimeHighCharts(containerId,datas,seriesArray,xName);
                }
            } else {
                //IE6、IE7、IE8 support js.onreadystatechange
                oScript.onreadystatechange = function () {
                    if (oScript.readyState == 'loaded' || oScript.readyState == 'complete') {
                        handler.report.callReport.generateTimeHighCharts(containerId,datas,seriesArray,xName);
                    }
                }
            }
        }else{
            handler.report.callReport.generateTimeHighCharts(containerId,datas,seriesArray,xName);
        }
    },
    generateTimeHighCharts : function(containerId,datas,seriesArray,xName){
        var xArray = new Array();
        var titleText = '时间趋势';
        if(containerId == 'call_report_dialout_highcharts_container'){
            titleText = '外呼通话时间趋势';
        }else if(containerId == 'call_report_relay_time_highcharts_container'){
            titleText = '中继呼入时间趋势';
        }else if(containerId == 'call_report_queue_time_highcharts_container'){
            titleText = '技能组时间趋势';
        }

        for(var i = 0 ; i < datas.length - 1 ; i++){
            xArray.push(datas[i][xName]);

            for(var j=0 ; j < seriesArray.length ; j++){
                seriesArray[j]['data'].push(datas[i][seriesArray[j].valueName])
            }
        }
        $('#'+containerId).highcharts({
            title: {
                text: titleText
            },
            xAxis: {
                categories: xArray
            },
            yAxis: {
                min: 0,
                title: {
                    text: '数量 (个)'
                }
            },
            tooltip: {
                headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                    '<td style="padding:0"><b>{point.y:.0f}</b></td></tr>',
                footerFormat: '</table>',
                shared: true,
                useHTML: true
            },
            plotOptions: {
                column: {
                    pointPadding: 0.2,
                    borderWidth: 0
                }
            },
            exporting:{
                enabled : false//暂时关闭了，图表导出功能
            },
            series: seriesArray
        });
    },
    confirmExportReportPdf: function (data) {
        console.log(data);
        DS.getView('report/confirmExportPDF', function (view) {
            var pane = $('#confirm_export_report_pane');
            pane.empty();
            var title = '';
            var method = 'report.callReport.';
            if (data.reportType === 'call_report_queue') {
                title = '技能组对比报表';
                method += 'exportReportQueue';
            } else if (data.reportType === 'call_report_queue_time') {
                title = '技能组时间趋势报表';
                method += 'exportReportQueueTime';
            } else if (data.reportType === 'call_report_relay_time') {
                title = '中继呼入时间趋势报表';
                method += 'exportReportRelayTime';
            } else if (data.reportType === 'call_report_agent') {
                title = '座席工作量报表';
                method += 'exportReportAgent';
            } else if (data.reportType === 'call_report_agent_time') {
                title = '单个座席工作量报表';
                method += 'exportReportAgentTime';
            } else if (data.reportType === 'call_report_approve_survey') {
                title = '座席满意度调查报表';
                method += 'exportReportApproveSurvey';
            } else if (data.reportType === 'call_report_callout_time') {
                title = '外呼时间趋势报表';
                method += 'exportReportCalloutTime';
            } else if(data.reportType === 'call_report_relay_area'){
                title = '中继呼入地域分布报表';
                method += 'exportReportRelayArea';
            } else if(data.reportType === 'call_report_dialout_area'){
                title = '呼出地域分布报表';
                method += 'exportReportDialoutArea';
            } else if(data.reportType === 'call_report_relay_area_city'){
                title = '中继呼入城市分布报表';
                method += 'exportReportRelayAreaCity';
            } else if(data.reportType === 'im_report_message'){
                title = '在线客服消息报表';
                method += 'exportReportImMessage';
            } else if(data.reportType === 'im_report_business'){
                title = '在线客服业务分析报表';
                method += 'exportReportImBusiness';
            } else if(data.reportType === 'im_report_agent'){
                title = '在线客服座席报表';
                method += 'exportReportImAgent';
            } else if(data.reportType === 'customer_report_increase'){
                title = '客户来源分析报表';
                method += 'exportReportCustomerIncrease';
            } else if(data.reportType === 'business_report_analyse'){
                title = '工单分析报表';
                method += 'exportReportBusinessAnalyse';
            } else if(data.reportType === 'business_report_agent'){
                title = '工单座席工作量报表';
                method += 'exportReportBusinessAgent';
            } else if(data.reportType === "im_report_csr"){
                title = '在线客服座席满意度报表';
                method += 'exportReportImCSR';
            } else if(data.reportType === "customer_report_status"){
                title = '座席客户状态分布报表';
                method += 'exportReportCustomerStatus';
            }else if(data.reportType === "im_report_session_time"){
                title = '会话数时间趋势报表';
                method += 'exportReportImSessionTime';
            }else if(data.reportType === "customer_report_sale_agent"){
                title = '座席商机分析报表';
                method += 'exportReportSaleAgent';
            }else if(data.reportType === "customer_report_sale"){
                title = '商机分析报表';
                method += 'exportReportSale';
            }else if(data.reportType === "customer_report_common"){
                title = '公海商机统计报表';
                method += 'exportReportCommon';
            }else if(data.reportType === "customer_report_common_agent"){
                title = '座席公海商机统计报表';
                method += 'exportReportCommonAgent';
            }else {
                alert('暂时不支持导出此报表！');
                return;
            }

            if (data.TimeType === 'day' || data.timeType === 'day') {
                title += ' 日报(' + data.yearReport + '年' + data.monthReport + '月' + data.dayReport + '日)';
            } else if (data.TimeType === 'month' || data.timeType === 'month') {
                title += ' 月报(' + data.yearReport + '年' + data.monthReport + '月)';
            } else if (data.TimeType === 'year' || data.timeType === 'year') {
                title += ' 年报(' + data.yearReport + '年)';
            }
            pane.html(view.replace(/__pbf_title/g, title)
                .replace(/__pdf_method/g, method));
            $('#show_confirm_export_report_pdf').modal();
        });
    },
    call_report_call_out: function(data) {
        var sendData = {
            reportType: 'call_report_callout_time'
        };
        var timeType = $('#callout_time_time_type');
        if (data != 'callout_report') {
            sendData.query = data;
            //格式化日期条件
            timeType.val(data.TimeType);
            handler.report.callReport.resetDate('report_callout_time_dateTd', data.TimeType, data);
        } else {
            timeType.val('day');
            handler.report.callReport.resetDate('report_callout_time_dateTd', timeType.val());
        }
        var groupName = "ReportTime";
        if (data != 'callout_report') {
            sendData.query = data;
            if (data.TimeType === 'year') {
                groupName = "MonthID";
            } else if (data.TimeType === 'month') {
                groupName = "DayID";
            } else if(data.TimeType === 'day'){
                groupName = "ReportTime";
            }else{
                //自定义时间区间
                groupName = "DayID";
            }
        }
        var action = {
            action: 'app.report.openCalloutTime',
            data: sendData
        }
        DS.send(action, function (res) {
            if (!res.success) {
                alert('获取失败！');
            }
            var headerConfig = res.tableHeader.Config;
            var datas = handler.report.callReport.reportSort(res.data,groupName);;
            //生成合计
            if (datas.length > 0) {
                datas.push(handler.report.callReport.callReportDialoutGenerateTotal(headerConfig,datas,groupName));
            }
            //生成表格内容
            var dataHtml = '';
            for (var i = 0; i < datas.length; i++) {
                var oneRow = '<tr>';
                for (var j = 0; j < headerConfig.length; j++) {
                    if (headerConfig[j].show === true) {
                        if (headerConfig[j].name === 'ReportTime' && datas[i][groupName] != "合计") {
                            oneRow += '<td>' + datas[i][groupName] + '</td>';
                        } else if (headerConfig[j].name === 'ReportTime' && datas[i][groupName] === "合计") {
                            oneRow += '<td sort_exclude="true">合计</td>';
                        } else {
                            if (headerConfig[j].name.slice(-6) === 'Length' || headerConfig[j].name.slice(-6) === 'LENGTH'
                                || headerConfig[j].name.slice(-3) === 'Avg') {
                                oneRow += '<td>' + handler.report.callReport.formatTime(datas[i][headerConfig[j].name]) + '</td>';
                            } else if (headerConfig[j].name.slice(-4) === 'Rate') {
                                oneRow += '<td>' + datas[i][headerConfig[j].name] + '%</td>';
                            } else {
                                oneRow += '<td>' + datas[i][headerConfig[j].name] + '</td>';
                            }
                            //oneRow += '<td>' + datas[i][headerConfig[j].name] + '</td>';
                        }
                    }
                }
                oneRow += '</tr>';
                dataHtml += oneRow;
            }
            headerConfig.tableType = 'call_report_dialout_time';
            $('#calloutTimeTableHeader').html(handler.report.callReport.renderTableHeader(headerConfig));
            $('#calloutTimeTableTbody').html(dataHtml);
            //生成时间趋势图
            var seriesArray = new Array();
            seriesArray.push({name: '外呼总数',data:new Array(),valueName: 'AccessCount'});
            seriesArray.push({name: '外呼成功数',data:new Array(),valueName: 'DealingCount'});
            seriesArray.push({name: '外呼失败数',data:new Array(),valueName: 'LeakCount'});
            seriesArray.push({name: '外呼振铃未接听数',data:new Array(),valueName: 'NotDealCount'});

            handler.report.callReport.initTimeHighCharts('call_report_dialout_highcharts_container',datas,seriesArray,groupName);

        });
    },
    call_report_dialout_area: function(data){
        var sendData = {
            reportType : 'call_report_dialout_area'
        };
        var timeType = $('#dialout_area_time_type');
        if(data != 'call_report_dialout_area'){
            //校验是否选择了省份
            if(!('isDrill' in data)){
                var provinces = new Array();
                for(var itemKey in data){
                    if(itemKey.substr(0,9) == 'Province_'){
                        if(data[itemKey] == true || data[itemKey] == 'true'){
                            provinces.push(itemKey.split('_')[1]);
                        }
                    }
                }
                if(provinces.length < 1){
                    alert('请选择省份查询条件！');
                    return;
                }
            }
            sendData.query = data;
            //格式化日期条件
            if(data.TimeType === 'time'){
                timeType.val('day');
            }else{
                timeType.val(data.TimeType);
            }
            handler.report.callReport.resetDate('report_dialout_area_dateTd', data.TimeType, data);
            if(data.TimeType == 'other'){
                if(data.StartTime == '' || data.EndTime == ''){
                    utils.showError("时间类型为自定义时间时，起止时间不可为空！");
                    return;
                }
                if(data.StartTime > data.EndTime){
                    utils.showError("开始时间必须小于结束时间！");
                    return;
                }
            }
        }else{
            timeType.val('day');
            handler.report.callReport.resetDate('report_dialout_area_dateTd', timeType.val());
        }
        var groupName = "Province";
        var action = {
            action : 'app.report.openDialoutArea',
            data : sendData
        }
        DS.send(action,function(res){
            if(!res.success){
                alert('获取失败！');
            }
            var headerConfig = res.tableHeader.Config;
            var datas = res.data;
            //显示之前，按时间进行排序
            datas = datas.sort(
                function(a, b)
                {
                    if(a[groupName] < b[groupName]) return -1;
                    if(a[groupName] > b[groupName]) return 1;
                    return 0;
                }
            );
            //生成合计
            if(datas.length>0){
                datas.push(handler.report.callReport.callReportDialoutAreaGenerateTotal(headerConfig,datas,groupName));
            }
            //生成表格内容
            var dataHtml = '';
            for(var i =0 ; i < datas.length ;i ++){
                var oneRow = '<tr>';
                for(var j = 0 ; j <headerConfig.length ; j++){
                    if(headerConfig[j].show === true){
                        if(headerConfig[j].name === 'Province' && datas[i][groupName]!="合计"){
                            oneRow+='<td>'+datas[i][groupName]+'</td>';
                            //oneRow+='<td>'+datas[i][groupName]+'</td>';
                        }else if(headerConfig[j].name === 'Province' && datas[i][groupName] === "合计"){
                            oneRow+='<td sort_exclude="true">合计</td>';
                        }else{
                            if(headerConfig[j].name.slice(-6) === 'Length'){
                                oneRow+='<td>'+formatTime(datas[i][headerConfig[j].name])+'</td>';
                            }else{
                                oneRow+='<td>'+datas[i][headerConfig[j].name]+'</td>';
                            }
                        }
                    }
                }
                oneRow += '</tr>';
                dataHtml += oneRow;
            }
            headerConfig.tableType = 'call_report_dialout_area';
            $('#dialoutAreaTableHeader').html(handler.report.callReport.renderTableHeader(headerConfig));
            $('#dialoutAreaTableTbody').html(dataHtml);

//            //控制返回按钮的显示
//            if(session.dicMap.callReportDialoutDrillCount>0){
//                $('#returnDrillToDialoutBtn').show();
//            }else{
//                $('#returnDrillToDialoutBtn').hide();
//            }
//            //独立查看报表用户，隐藏导出按钮
//            if(session.independentReportUser){
//                $('.call_report_export_btn').hide();
//            }
        });
    },
    call_report_agent: function (data) {
        if(data != 'call_report_agent'){
            if(data.TimeType == 'other' || data.TimeType == 'other_half_hour'){
                if(data.StartTime == '' || data.EndTime == ''){
                    utils.showError("时间类型为自定义时间时，起止时间不可为空！");
                    return;
                }
                if(data.StartTime > data.EndTime){
                    utils.showError("开始时间必须小于结束时间！");
                    return;
                }
            }
        }
        handler.report.callReport.agentMainOnload(data);
        var action = {
            action: 'app.report.openAgent',
            data: data
        }
        DS.send(action, function (res) {
            if (!res.success) {
                alert('获取失败！');
            }
            var headerConfig = res.tableHeader.Config;
            var agents = res.agents;
            var datas = res.data;
            for (var i = 0; i < agents.length; i++) {
                for (var j = 0; j < datas.length; j++) {
                    if (agents[i]._id === datas[j].AgentID) {
                        datas[j].agent_name = agents[i].displayName+'['+agents[i].exten+']';
                    }
                }
            }
            var phonebarEnable = '';
            for (var i = 0; i < headerConfig.length; i++) {
                if (headerConfig[i].name == 'ShowPhoneBarStatus' && headerConfig[i].show == true) {
                    phonebarEnable = true;
                    headerConfig = headerConfig.slice(0, i).concat(headerConfig.slice(i + 1, headerConfig.length))
                }
            }
            if (phonebarEnable == true) {
                var phonebarData = {
                    Account: session.user.account,
                    PBX: session.user.pbx,
                    IsEnable: "1"
                }
                var action = {
                    action: 'app.phoneBarConfig.queryConfig',
                    data: phonebarData
                }
                DS.send(action, function (phonebarRes) {
                    console.log(phonebarRes);
                    if (phonebarRes.success) {
                        for (var m = 0; m < phonebarRes.list.length; m++) {
                            if (phonebarRes.list[m].PhoneBarItemName != '空闲') {
                                if (phonebarRes.list[m].PhoneBarItemName == '忙碌') {
                                    var phoneConfig = {
                                        name: "BUSY_TIME_LENGTH",
                                        displayname: phonebarRes.list[m].PhoneBarItemName + '总时长',
                                        show: true,
                                        order: 15 + m
                                    }
                                    headerConfig.push(phoneConfig);
                                }
//                                else if (phonebarRes.list[m].PhoneBarItemName == '小休') {
//                                    var phoneConfig = {
//                                        name: "IDLE_TIME_LENGTH",
//                                        displayname: phonebarRes.list[m].PhoneBarItemName + '总时长',
//                                        show: true,
//                                        order: 15 + m
//                                    }
//                                    headerConfig.push(phoneConfig);
//                                }
                                else {
                                    var phoneConfig = {
                                        name: "STATE" + phonebarRes.list[m].PhoneBarItemId + "_TIME_LENGTH",
                                        displayname: phonebarRes.list[m].PhoneBarItemName + '总时长',
                                        show: true,
                                        order: 15 + m
                                    }
                                    headerConfig.push(phoneConfig);
                                }
                            }
                        }
                        if (datas.length > 0) {
                            console.log(datas);
                            var total = {};
                            for (var i = 0; i < headerConfig.length; i++) {
                                for (var j = 0; j < datas.length; j++) {
                                    if (headerConfig[i].name === 'agent_name') {
                                        total.agent_name = '合计';
                                        continue;
                                    } else {
                                        //如果为数字
                                        if (!isNaN(datas[j][headerConfig[i].name])) {
                                            if ((headerConfig[i].name in total) === false) {
                                                total[headerConfig[i].name] = 0;
                                            }
                                            total[headerConfig[i].name] += datas[j][headerConfig[i].name];
                                        } else {
                                            if (headerConfig[i].name == 'CallInAcceptRate') {
                                                if (total.CallInAccessCount != 0) {
                                                    total[headerConfig[i].name] = Math.round(total.CallInAcceptCount / total.CallInAccessCount * 100) + '%';
                                                } else {
                                                    total[headerConfig[i].name] = Math.round(total.CallInAcceptCount / 1 * 100) + '%';
                                                }
                                            }
                                            else if (headerConfig[i].name == 'AgentUtilization') {
                                                if (total.LOGIN_TIME_LENGTH == 0 || (total.CallInAcceptCount + total.CallOutAcceptCount) == 0) {
                                                    total[headerConfig[i].name] = '0%';
                                                } else {
                                                    total[headerConfig[i].name] = Math.round((total.CallInTimeLength + total.CallOutTimeLength + total.STATE99_TIME_LENGTH) / (total.LOGIN_TIME_LENGTH + total.STATE2_TIME_LENGTH + total.STATE3_TIME_LENGTH
                                                            + total.STATE4_TIME_LENGTH + total.STATE5_TIME_LENGTH + total.STATE6_TIME_LENGTH + total.STATE7_TIME_LENGTH + total.STATE8_TIME_LENGTH + total.STATE9_TIME_LENGTH) * 100) + '%';
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            for(var i=0 ; i < headerConfig.length ; i++){
                                for(var j=0 ; j < datas.length ; j++){
                                    if(headerConfig[i].name == 'CallInAcceptRate'){
                                        if (total.CallInAccessCount != 0){
                                            total[headerConfig[i].name] = Math.round(total.CallInAcceptCount/total.CallInAccessCount*100) + '%';
                                        }else{
                                            total[headerConfig[i].name] = '0%';
                                        }
                                    } else if(headerConfig[i].name == 'AgentUtilization'){
                                        if(total.LOGIN_TIME_LENGTH != 0){
                                            total[headerConfig[i].name] = Math.round((total.CallInTimeLength + total.BUSY_TIME_LENGTH + total.STATE99_TIME_LENGTH + total.CallOutTimeLength)/total.LOGIN_TIME_LENGTH*100) + '%';
                                        }else{
                                            total[headerConfig[i].name] = '0%';
                                        }
                                    } else if(headerConfig[i].name == 'CallInAverageTimeLength'){
                                        if(total.CallInAcceptCount == 0){
                                            total[headerConfig[i].name] = 0;
                                        }else{
                                            total[headerConfig[i].name] = Math.round(total.CallInTimeLength/total.CallInAcceptCount);
                                        }
                                    } else if(headerConfig[i].name == 'CallOutAverageTimeLength'){
                                        if(total.CallOutAcceptCount == 0){
                                            total[headerConfig[i].name] = 0;
                                        }else{
                                            total[headerConfig[i].name] = Math.round(total.CallOutTimeLength/total.CallOutAcceptCount);
                                        }
                                    } else if(headerConfig[i].name == 'AverageHourCallCount'){
                                        if(total.LOGIN_TIME_LENGTH == 0){
                                            total[headerConfig[i].name] = 0;
                                        }else if(total.LOGIN_TIME_LENGTH <= 1800){
                                            total[headerConfig[i].name] = total.CallInAcceptCount + total.CallOutAcceptCount;
                                        }else{
                                            total[headerConfig[i].name] = Math.round((total.CallInAcceptCount + total.CallOutAcceptCount)*1800/total.LOGIN_TIME_LENGTH);
                                        }
                                    } else if(headerConfig[i].name == 'CallInNotDealCount'){
                                        total[headerConfig[i].name] = total.CallInAccessCount - total.CallInAcceptCount;
                                    }
                                }
                            }
                            datas.push(total);
                        }
                        headerConfig.tableType = 'call_report_agent';
                        $('#agentWorkTableHeader').html(handler.report.callReport.renderTableHeader(headerConfig));
                        var dataHtml = '';
                        for (var i = 0; i < datas.length; i++) {
                            var oneRow = '<tr>';
                            for (var j = 0; j < headerConfig.length; j++) {
                                if (headerConfig[j].show === true) {
                                    if (headerConfig[j].name === 'agent_name' && datas[i].agent_name != '合计') {
                                        oneRow+='<td><a class="ds_do_action" ds_action="report.callReport.preDrillToAgentTime" ds_data='+datas[i].AgentID+'>'
                                            +datas[i][headerConfig[j].name]+'</a></td>';
//                                        oneRow += '<td>' + datas[i][headerConfig[j].name] + '</td>';
                                    } else {
                                        if (headerConfig[j].name.slice(-6) === 'Length' || headerConfig[j].name.slice(-6) === 'LENGTH') {
                                            oneRow += '<td>' + handler.report.callReport.formatTime(datas[i][headerConfig[j].name]) + '</td>';
                                        }else if(headerConfig[j].name == 'agent_name' && datas[i].agent_name == '合计'){
                                            oneRow+='<td sort_exclude="true">'+datas[i].agent_name+'</td>'
                                        }else {
                                            oneRow += '<td>' + datas[i][headerConfig[j].name] + '</td>';
                                        }
                                    }
                                }
                            }
                            oneRow += '</tr>';
                            dataHtml += oneRow;
                        }
                        $('#agentWorkTableBody').html(dataHtml);
                        //生成柱状图
                        var seriesArray = new Array();
                        seriesArray.push({name: '在线总时长', data: new Array(), valueName: 'LOGIN_TIME_LENGTH'});
                        seriesArray.push({name: '呼入通话平均时长', data: new Array(), valueName: 'CallInAverageTimeLength'});
                        seriesArray.push({name: '呼入通话总时长', data: new Array(), valueName: 'CallInTimeLength'});
                        seriesArray.push({name: '外呼通话平均时长', data: new Array(), valueName: 'CallOutAverageTimeLength'});
                        seriesArray.push({name: '外呼通话总时长', data: new Array(), valueName: 'CallOutTimeLength'});
                        handler.report.callReport.initHighCharts('call_report_agent_highcharts_container', datas, seriesArray, 'agent_name');
                    }
                });
            } else {
                if (datas.length > 0) {
                    var total = {};
                    for (var i = 0; i < headerConfig.length; i++) {
                        for (var j = 0; j < datas.length; j++) {
                            if (headerConfig[i].name === 'agent_name') {
                                total.agent_name = '合计';
                                continue;
                            } else {
                                //如果为数字
                                if (!isNaN(datas[j][headerConfig[i].name])) {
                                    if ((headerConfig[i].name in total) === false) {
                                        total[headerConfig[i].name] = 0;
                                    }
                                    total[headerConfig[i].name] += datas[j][headerConfig[i].name];
                                } else {
                                    if (headerConfig[i].name == 'CallInAcceptRate') {
                                        if (total.CallInAccessCount != 0) {
                                            total[headerConfig[i].name] = Math.round(total.CallInAcceptCount / total.CallInAccessCount * 100) + '%';
                                        } else {
                                            total[headerConfig[i].name] = Math.round(total.CallInAcceptCount / 1 * 100) + '%';
                                        }
                                    } else if (headerConfig[i].name == 'AgentUtilization') {
                                        if (total.LOGIN_TIME_LENGTH != 0) {
                                            total[headerConfig[i].name] = Math.round((total.CallInTimeLength + total.CallOutTimeLength) / total.LOGIN_TIME_LENGTH * 100) + '%';
                                        } else {
                                            total[headerConfig[i].name] = Math.round((total.CallInTimeLength + total.CallOutTimeLength) / 1 * 100) + '%';
                                        }
                                    }
                                }
                            }
                        }
                    }
                    for(var i=0 ; i < headerConfig.length ; i++){
                        for(var j=0 ; j < datas.length ; j++){
                            if(headerConfig[i].name == 'CallInAcceptRate'){
                                if (total.CallInAccessCount != 0){
                                    total[headerConfig[i].name] = Math.round(total.CallInAcceptCount/total.CallInAccessCount*100) + '%';
                                }else{
                                    total[headerConfig[i].name] = '0%';
                                }
                            } else if(headerConfig[i].name == 'CallInAverageTimeLength'){
                                if(total.CallInAcceptCount == 0){
                                    total[headerConfig[i].name] = 0;
                                }else{
                                    total[headerConfig[i].name] = Math.round(total.CallInTimeLength/total.CallInAcceptCount);
                                }
                            } else if(headerConfig[i].name == 'CallOutAverageTimeLength'){
                                if(total.CallOutAcceptCount == 0){
                                    total[headerConfig[i].name] = 0;
                                }else{
                                    total[headerConfig[i].name] = Math.round(total.CallOutTimeLength/total.CallOutAcceptCount);
                                }
                            } else if(headerConfig[i].name == 'AverageHourCallCount'){
                                if(total.LOGIN_TIME_LENGTH == 0){
                                    total[headerConfig[i].name] = 0;
                                }else if(total.LOGIN_TIME_LENGTH <= 1800){
                                    total[headerConfig[i].name] = total.CallInAcceptCount + total.CallOutAcceptCount;
                                }else{
                                    total[headerConfig[i].name] = Math.round((total.CallInAcceptCount + total.CallOutAcceptCount)*1800/total.LOGIN_TIME_LENGTH);
                                }
                            } else if(headerConfig[i].name == 'CallInNotDealCount'){
                                total[headerConfig[i].name] = total.CallInAccessCount - total.CallInAcceptCount;
                            }
                        }
                    }
                    datas.push(total);
                }
                headerConfig.tableType = 'call_report_agent';
                $('#agentWorkTableHeader').html(handler.report.callReport.renderTableHeader(headerConfig));
                var dataHtml = '';
                for (var i = 0; i < datas.length; i++) {
                    var oneRow = '<tr>';
                    for (var j = 0; j < headerConfig.length; j++) {
                        if (headerConfig[j].show === true) {
                            if (headerConfig[j].name === 'agent_name' && datas[i].agent_name != '合计') {
                                oneRow += '<td><a class="ds_do_action" ds_action="report.callReport.preDrillToAgentTime" ds_data=' + datas[i].AgentID + '>'
                                    + datas[i][headerConfig[j].name] + '</a></td>';
                            } else {
                                if (headerConfig[j].name.slice(-6) === 'Length' || headerConfig[j].name.slice(-6) === 'LENGTH') {
                                    oneRow += '<td>' + handler.report.callReport.formatTime(datas[i][headerConfig[j].name]) + '</td>';
                                }else if(headerConfig[j].name == 'agent_name' && datas[i].agent_name == '合计'){
                                    oneRow+='<td sort_exclude="true">'+datas[i].agent_name+'</td>'
                                }else {
                                    oneRow += '<td>' + datas[i][headerConfig[j].name] + '</td>';
                                }
                            }
                        }
                    }
                    oneRow += '</tr>';
                    dataHtml += oneRow;
                }
                $('#agentWorkTableBody').html(dataHtml);
                //生成柱状图
                var seriesArray = new Array();
                seriesArray.push({name: '在线总时长', data: new Array(), valueName: 'LOGIN_TIME_LENGTH'});
                seriesArray.push({name: '呼入通话平均时长', data: new Array(), valueName: 'CallInAverageTimeLength'});
                seriesArray.push({name: '呼入通话总时长', data: new Array(), valueName: 'CallInTimeLength'});
                seriesArray.push({name: '外呼通话平均时长', data: new Array(), valueName: 'CallOutAverageTimeLength'});
                seriesArray.push({name: '外呼通话总时长', data: new Array(), valueName: 'CallOutTimeLength'});
                handler.report.callReport.initHighCharts('call_report_agent_highcharts_container', datas, seriesArray, 'agent_name');
            }
        });
    },
    call_report_relay_time: function (data) {
        var sendData = {
            reportType: 'call_report_relay_time'
        };
        var timeType = $('#relay_time_time_type');
        if (data != 'callin_report') {
            sendData.query = data;
            //格式化日期条件
            timeType.val(data.TimeType);
            handler.report.callReport.resetDate('report_relay_time_dateTd', data.TimeType, data);
        } else {
            timeType.val('day');
            handler.report.callReport.resetDate('report_relay_time_dateTd', timeType.val());

            //初始化服务号条件
            var serviceNos = getCache("serviceNo");
            var serviceHtml = '';
            $.each(serviceNos,function(i,item){
                var oneCheck = '<input type="checkbox" class="Relay_Service_No_check" name="ServiceNo_'+item.Exten+'" checked>'+item.Exten+'</td>';
                serviceHtml += oneCheck + '&nbsp;&nbsp;&nbsp;&nbsp';
                ;
            });
            $("#report_callin_service_no_div").html(serviceHtml);
        }
        var groupName = "ReportTime";
        if (data != 'callin_report') {
            sendData.query = data;
            if (data.TimeType === 'year') {
                groupName = "MonthID";
            } else if (data.TimeType === 'month') {
                groupName = "DayID";
            } else if(data.TimeType === 'day'){
                groupName = "ReportTime";
            }else{
                //自定义时间区间
                groupName = "DayID";
            }
        }
        var action = {
            action: 'app.report.openRelayTime',
            data: sendData
        }
        DS.send(action, function (res) {
            if (!res.success) {
                alert('获取失败！');
            }
            var headerConfig = res.tableHeader.Config;
            var datas = handler.report.callReport.reportSort(res.data,groupName);
            //生成合计
            if (datas.length > 0) {
                datas.push(handler.report.callReport.callReportRelayTimeGenerateTotal(headerConfig, datas, groupName));
            }
            //生成表格内容
            var dataHtml = '';
            for (var i = 0; i < datas.length; i++) {
                var oneRow = '<tr>';
                for (var j = 0; j < headerConfig.length; j++) {
                    if (headerConfig[j].show === true) {
                        if (headerConfig[j].name === 'ReportTime' && datas[i][groupName] != "合计") {
                            oneRow += '<td>' + datas[i][groupName] + '</td>';
                        } else if (headerConfig[j].name === 'ReportTime' && datas[i][groupName] === "合计") {
                            oneRow += '<td sort_exclude="true">合计</td>';
                        } else {
                            oneRow += '<td>' + datas[i][headerConfig[j].name] + '</td>';
                        }
                    }
                }
                oneRow += '</tr>';
                dataHtml += oneRow;
            }
            headerConfig.tableType = 'call_report_relay_time';
            $('#relayTimeTableHeader').html(handler.report.callReport.renderTableHeader(headerConfig));
            $('#relayTimeTableTbody').html(dataHtml);

            //生成时间趋势图
            var seriesArray = new Array();
            seriesArray.push({name: '总数',data:new Array(),valueName: 'AccessCount'});
            seriesArray.push({name: '已接听数',data:new Array(),valueName: 'DealingCount'});
            seriesArray.push({name: '振铃未接听数',data:new Array(),valueName: 'NotDealCount'});
            seriesArray.push({name: '排队放弃数',data:new Array(),valueName: 'QueueLeakCount'});
            seriesArray.push({name: 'IVR',data:new Array(),valueName: 'LeakCount'});
            seriesArray.push({name: '已留言数',data:new Array(),valueName: 'VoicemailCount'});
            seriesArray.push({name: '黑名单来电数',data:new Array(),valueName: 'BlackListCount'});
            handler.report.callReport.initTimeHighCharts('call_report_relay_time_highcharts_container',datas,seriesArray,groupName);
        });
    },
    call_report_relay_area : function(data){
        var sendData = {
            reportType : 'call_report_relay_area'
        };
        var timeType = $('#relay_area_time_type');
        if(data != 'call_report_relay_area'){
            //校验是否选择了服务号和省份
            var provinces = new Array();
            var serviceNos = new Array();
            for(var itemKey in data){
                if(itemKey.substr(0,9) == 'Province_'){
                    if(data[itemKey] == true || data[itemKey] == 'true'){
                        provinces.push(itemKey.split('_')[1]);
                    }
                }
                if(itemKey.substr(0,10) == 'ServiceNo_'){
                    if(data[itemKey] == true || data[itemKey] == 'true'){
                        serviceNos.push(itemKey.split('_')[1]);
                    }
                }
            }
            if(provinces.length < 1){
                alert('请选择省份查询条件！');
                return;
            }
            if(serviceNos.length <1){
                alert('请选择服务号查询条件！');
                return;
            }
            sendData.query = data;
            //格式化日期条件
            timeType.val(data.TimeType);
            handler.report.callReport.resetDate('report_relay_area_dateTd', data.TimeType,data);
        }else{
            //初始化服务号条件
            var serviceNos = getCache("serviceNo");
            var serviceHtml = '';
            $.each(serviceNos,function(i,item){
                var oneCheck = '<input type="checkbox" class="Relay_Service_No_check" name="ServiceNo_'+item.Exten+'" checked>'+item.Exten+'</td>';
                serviceHtml += oneCheck + '&nbsp;&nbsp;&nbsp;&nbsp';
                ;
            });
            $("#report_relay_area_service_no_div").html(serviceHtml);

            timeType.val('day');
            handler.report.callReport.resetDate('report_relay_area_dateTd', timeType.val());
        }
        var groupName = "Province";
        if(data != 'call_report_relay_area'){
            if(data.TimeType == 'other'){
                if(data.StartTime == '' || data.EndTime == ''){
                    utils.showError("时间类型为自定义时间时，起止时间不可为空！");
                    return;
                }
                if(data.StartTime > data.EndTime){
                    utils.showError("开始时间必须小于结束时间！");
                    return;
                }
            }
        }
        var action = {
            action : 'app.report.openRelayArea',
            data : sendData
        }
        DS.send(action,function(res){
            if(!res.success){
                alert('获取失败！');
            }
            var headerConfig = res.tableHeader.Config;
            var datas = res.data;
            //生成合计
            if(datas.length>0){
                datas.push(handler.report.callReport.callReportRelayAreaGenerateTotal(headerConfig,datas,groupName));
            }
            //生成表格内容
            var dataHtml = '';
            for(var i =0 ; i < datas.length ;i ++){
                var oneRow = '<tr>';
                for(var j = 0 ; j <headerConfig.length ; j++){
                    if(headerConfig[j].show === true){
                        if(headerConfig[j].name === 'Province' && datas[i][groupName]!="合计"){
                            oneRow+='<td><a class="ds_do_action" ds_action="report.callReport.preDrillToRelayAreaCity" ' +
                                'ds_data='+datas[i][groupName]+'>'+datas[i][groupName]+'</a></td>';
                        }else if(headerConfig[j].name === 'Province' && datas[i][groupName] === "合计"){
                            oneRow+='<td sort_exclude="true">合计</td>';
                        }else{
                            oneRow+='<td>'+datas[i][headerConfig[j].name]+'</td>';
                        }
                    }
                }
                oneRow += '</tr>';
                dataHtml += oneRow;
            }
            headerConfig.tableType = 'call_report_relay_area';
            $('#relayAreaTableHeader').html(handler.report.callReport.renderTableHeader(headerConfig));
            $('#relayAreaTableTbody').html(dataHtml);
        });
    },
    preDrillToRelayAreaCity : function(data){
//        console.log(data);
        $("#call_report_relay_area_predrill_city").val(data);
        $("#call_report_relay_area_doDrill").click();
    },
    drillToRelayAreaCity : function(data){
        var page = "view_call_report_relay_area_city";
        var p = $("#" + page);
        p.siblings(".tab-pane").removeClass("active");
        p.addClass("active");
        DS.getView("report/call_report_relay_area_city", function (view) {
            p.empty();
            p.html(view);
            handler.report.callReport.call_report_relay_area_city(data);
        });
/*        if (!session[id]) {
            var p = $("#" + page);
            DS.getView("report/call_report_relay_area_city", function (view) {
                session[id] = true;
                p.empty();
                p.html(view);
                $(".right_content").css("display", "none");
                $("#" + page).css("display", "block");
                handler.report.callReport.call_report_relay_area_city(data);
                resize();
            });
        }else{
            $(".right_content").css("display", "none");
            $("#" + page).css("display", "block");
            handler.report.callReport.call_report_relay_area_city(data);
        }*/
    },
    returnDrillToRelayAreaFromCity : function(data){
        var page = "view_call_report_relay_area";
        var p = $("#" + page);
        p.siblings(".tab-pane").removeClass("active");
        p.addClass("active");
//        $(".right_content").css("display", "none");
//        $("#" + page).css("display", "block");
    },
    call_report_relay_area_city : function(data){
        var sendData = {
            reportType : 'call_report_relay_area_city'
        };
        var timeType = $('#relay_area_city_time_type');
        if(data != 'call_report_relay_area_city'){
            //校验是否选择了服务号和省份
            var provinces = new Array();
            var serviceNos = new Array();
            for(var itemKey in data){
                if(itemKey.substr(0,9) == 'Province_'){
                    if(data[itemKey] == true || data[itemKey] == 'true'){
                        provinces.push(itemKey.split('_')[1]);
                    }
                }
                if(itemKey.substr(0,10) == 'ServiceNo_'){
                    if(data[itemKey] == true || data[itemKey] == 'true'){
                        serviceNos.push(itemKey.split('_')[1]);
                    }
                }
            }
            if(provinces.length < 1){
                alert('请选择省份查询条件！');
                return;
            }
            if(serviceNos.length <1){
                alert('请选择服务号查询条件！');
                return;
            }
            sendData.query = data;
            //格式化日期条件
            timeType.val(data.TimeType);
            handler.report.callReport.resetDate('report_relay_area_city_dateTd', data.TimeType,data);
        }
        //初始化服务号条件
        var serviceNos = getCache("serviceNo");
        var serviceHtml = '';
        $.each(serviceNos,function(i,item){
            var oneCheck = '<input type="checkbox" class="Relay_Service_No_check" id="ServiceNo_'+item.Exten+'" name="ServiceNo_'+item.Exten+'">'+item.Exten+'</td>';
            serviceHtml += oneCheck + '&nbsp;&nbsp;&nbsp;&nbsp';
            ;
        });
        $("#report_relay_area_city_service_no_div").html(serviceHtml);

        for(var itemKey in data){
            if(itemKey.substr(0,10) == 'ServiceNo_'){
                if(data[itemKey] == true || data[itemKey] == 'true'){
                    $('#ServiceNo_'+itemKey.split('_')[1]).attr("checked", true);
                }
            }
        }
        //初始化省条件
        if('relayAreaCityCurrentProvince' in data){
            $('.Relay_City_Province_check').attr("checked", false);
            $("#Province_"+data.relayAreaCityCurrentProvince).attr("checked", true);
        }
        var groupName = "City";
        if(data.TimeType == 'other'){
            if(data.StartTime == '' || data.EndTime == ''){
                utils.showError("时间类型为自定义时间时，起止时间不可为空！");
                return;
            }
            if(data.StartTime > data.EndTime){
                utils.showError("开始时间必须小于结束时间！");
                return;
            }
        }
        var action = {
            action : 'app.report.openRelayAreaCity',
            data : sendData
        }
        DS.send(action,function(res){
            if(!res.success){
                alert('获取失败！');
                return;
            }
            var headerConfig = res.tableHeader.Config;
            var datas = res.data;
            //生成合计
            if(datas.length>0){
                datas.push(handler.report.callReport.callReportRelayAreaCityGenerateTotal(headerConfig,datas,groupName));
            }
            //生成表格内容
            var dataHtml = '';
            for(var i =0 ; i < datas.length ;i ++){
                var oneRow = '<tr>';
                for(var j = 0 ; j <headerConfig.length ; j++){
                    if(headerConfig[j].show === true){
                        if(headerConfig[j].name === 'City' && datas[i][groupName]!="合计"){
                            oneRow+='<td>'+datas[i][groupName]+'</td>';
                        }else if(headerConfig[j].name === 'City' && datas[i][groupName] === "合计"){
                            oneRow+='<td sort_exclude="true">合计</td>';
                        }else{
                            oneRow+='<td>'+datas[i][headerConfig[j].name]+'</td>';
                        }
                    }
                }
                oneRow += '</tr>';
                dataHtml += oneRow;
            }
            headerConfig.tableType = 'call_report_relay_area_city';
            $('#relayAreaCityTableHeader').html(handler.report.callReport.renderTableHeader(headerConfig));
            $('#relayAreaCityTableTbody').html(dataHtml);
        });
    },
    agentMainOnload: function (data) {
        var timeType = $('#report_agent_timeType');
        if (data != 'call_report_agent') {
            timeType.val(data.TimeType);
            handler.report.callReport.resetDate('report_agent_dateTd', {"value": data.TimeType}, data);
        } else {
            timeType.val('day');
            handler.report.callReport.resetDate('report_agent_dateTd', timeType.val());
        }
    },
    preDrillToAgentTime: function (data) {
        $("#call_report_agent_AgentID").val(data);
        $("#call_report_agent_doDrill").click();
    },
    drillToAgentTime: function (data) {
        delete data.selectedAgentList;
        DS.getView('report/call_report_agent_time', function (view) {
            var pane = $('#view_call_report_agent_time');
            pane.empty();
            pane.html(view);
            pane.siblings(".tab-pane").removeClass("active");
            pane.addClass("active");
//            $(".right_content").css("display", "none");
//            $("#view_call_report_agent_time").css("display", "block");
            var allAgents = getCache("agents");
            var agentName = '';
            for(var i=0; i<allAgents.length; i++){
                if(allAgents[i]._id == data.AgentID){
                    agentName = allAgents[i].displayName;
                }
            }
            $('#call_report_agent_time_agent_name').html(agentName);
            $('#call_report_agent_time_agentId').val(data.AgentID);
            var timeType = $('#report_agent_time_timeType');
            timeType.val(data.TimeType);
            handler.report.callReport.resetDate('report_agent_time_dateTd', data.TimeType,data);
            if (data.TimeType == 'year'){
                data.YearID = data.yearReport;
            }else if (data.TimeType == 'month'){
                data.MonthID = data.yearReport + '0' + data.monthReport;
            }else if (data.TimeType == 'day'){
                data.DayID = data.yearReport + '0' + data.monthReport + data.dayReport;
            }else if (data.TimeType == 'other'){
                data.TimeID = 'TimeID';
            }


            handler.report.callReport.call_report_agent_time(data);
//            resize();
        });
    },
    returnPreviousAgent: function (data) {
        var page = "view_call_report_agent";
        var p = $("#" + page);
        p.siblings(".tab-pane").removeClass("active");
        p.addClass("active");
/*        DS.getView('report/call_report_agent', function (view) {
            var pane = $('#view_call_report_agent');
            pane.empty();
            pane.html(view);
            $(".right_content").css("display", "none");
            $("#view_call_report_agent").css("display", "block");

            var timeType = $('#report_agent_timeType');
            timeType.val(data.TimeType);
            handler.report.callReport.resetDate('report_agent_dateTd', data.TimeType, data);
            data.reportType = 'call_report_agent';
            handler.report.callReport.call_report_agent(data);
        });*/
    },
    queryAgentTimeReport : function(data){
        if (data.TimeType == 'year'){
            data.YearID = data.yearReport
        } else if (data.TimeType == 'month'){
            data.MonthID = data.yearReport + '0' + data.monthReport
        } else if (data.TimeType == 'day'){
            data.DayID = data.yearReport + '0' + data.monthReport + data.dayReport
        } else if (data.TimeType == 'other'){
            data.TimeID = 'TimeID';
        }
        handler.report.callReport.call_report_agent_time(data);
    },
    call_report_agent_time: function (data) {
        if(data.TimeType == 'other'){
            if(data.StartTime == '' || data.EndTime == ''){
                utils.showError("时间类型为自定义时间时，起止时间不可为空！");
                return;
            }
            if(data.StartTime > data.EndTime){
                utils.showError("开始时间必须小于结束时间！");
                return;
            }
        }
        var action = {
            action: 'app.report.queryAgentTime',
            data: data
        }
        DS.send(action, function (res) {
            if (!res.success) {
                alert('获取失败！');
            }
            var headerConfig = res.tableHeader.Config;
            var datas = res.data;
            for(var j = 0 ;j<datas.length;j++){
                if (data.TimeType == 'year'){
                    datas[j].show_time = datas[j].MonthID;
                }else if (data.TimeType == 'month'){
                    datas[j].show_time = datas[j].DayID;
                }else if (data.TimeType == 'day'){
                    datas[j].show_time = datas[j].ReportTime;
                }else if(data.TimeType == 'other'){
                    datas[j].show_time = datas[j].DayID;
                }
            }
            var phonebarEnable = '';
            for (var i = 0; i < headerConfig.length; i++) {
                if (headerConfig[i].name == 'ShowPhoneBarStatus' && headerConfig[i].show == true) {
                    phonebarEnable = true;
                    headerConfig = headerConfig.slice(0, i).concat(headerConfig.slice(i + 1, headerConfig.length))
                }
            }
            if (phonebarEnable == true) {
                var phonebarData = {
                    Account: session.user.account,
                    PBX: session.user.pbx,
                    IsEnable: "1"
                }
                var action = {
                    action: 'app.phoneBarConfig.queryConfig',
                    data: phonebarData
                }
                DS.send(action, function (phonebarRes) {
                    if (phonebarRes.success) {
                        for (var m = 0; m < phonebarRes.list.length; m++) {
                            if (phonebarRes.list[m].PhoneBarItemName != '空闲') {
                                if (phonebarRes.list[m].PhoneBarItemName == '忙碌') {
                                    var phoneConfig = {
                                        name: "BUSY_TIME_LENGTH",
                                        displayname: phonebarRes.list[m].PhoneBarItemName + '总时长',
                                        show: true,
                                        order: 15 + m
                                    }
                                    headerConfig.push(phoneConfig);
                                }
//                                else if (phonebarRes.list[m].PhoneBarItemName == '小休') {
//                                    var phoneConfig = {
//                                        name: "IDLE_TIME_LENGTH",
//                                        displayname: phonebarRes.list[m].PhoneBarItemName + '总时长',
//                                        show: true,
//                                        order: 15 + m
//                                    }
//                                    headerConfig.push(phoneConfig);
//                                }
                                else {
                                    var phoneConfig = {
                                        name: "STATE" + phonebarRes.list[m].PhoneBarItemId + "_TIME_LENGTH",
                                        displayname: phonebarRes.list[m].PhoneBarItemName + '总时长',
                                        show: true,
                                        order: 15 + m
                                    }
                                    headerConfig.push(phoneConfig);
                                }
                            }
                        }
                        if (datas.length > 0) {
                            var total = {};
                            for (var i = 0; i < headerConfig.length; i++) {
                                for (var j = 0; j < datas.length; j++) {
                                    if (headerConfig[i].name === 'show_time') {
                                        total.show_time = '合计';
                                        continue;
                                    } else {
                                        //如果为数字
                                        if (!isNaN(datas[j][headerConfig[i].name])) {
                                            if ((headerConfig[i].name in total) === false) {
                                                total[headerConfig[i].name] = 0;
                                            }
                                            total[headerConfig[i].name] += datas[j][headerConfig[i].name];
                                        } else {
                                            if (headerConfig[i].name == 'CallInAcceptRate') {
                                                if (total.CallInAccessCount != 0) {
                                                    total[headerConfig[i].name] = Math.round(total.CallInAcceptCount / total.CallInAccessCount * 100) + '%';
                                                } else {
                                                    total[headerConfig[i].name] = Math.round(total.CallInAcceptCount / 1 * 100) + '%';
                                                }
                                            } else if (headerConfig[i].name == 'AgentUtilization') {
                                                if (total.LOGIN_TIME_LENGTH != 0) {
                                                    total[headerConfig[i].name] = Math.round((total.CallInTimeLength + total.CallOutTimeLength) / total.LOGIN_TIME_LENGTH * 100) + '%';
                                                } else {
                                                    total[headerConfig[i].name] = Math.round((total.CallInTimeLength + total.CallOutTimeLength) / 1 * 100) + '%';
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            for (var i = 0; i < headerConfig.length; i++) {
                                for (var j = 0; j < datas.length; j++) {
                                    if(headerConfig[i].name == 'AverageHourCallCount'){
                                        if(total.LOGIN_TIME_LENGTH == 0){
                                            total[headerConfig[i].name] = 0;
                                        }else if(total.LOGIN_TIME_LENGTH <= 1800){
                                            total[headerConfig[i].name] = total.CallInAcceptCount + total.CallOutAcceptCount;
                                        }else{
                                            total[headerConfig[i].name] = Math.round((total.CallInAcceptCount + total.CallOutAcceptCount)*1800/total.LOGIN_TIME_LENGTH);
                                        }
                                    }else if(headerConfig[i].name == 'CallInAverageTimeLength'){
                                        if(total.CallInAcceptCount == 0){
                                            total[headerConfig[i].name] = 0;
                                        }else{
                                            total[headerConfig[i].name] = Math.round(total.CallInTimeLength/total.CallInAcceptCount);
                                        }
                                    }else if(headerConfig[i].name == 'CallOutAverageTimeLength'){
                                        if(total.CallOutAcceptCount == 0){
                                            total[headerConfig[i].name] = 0;
                                        }else{
                                            total[headerConfig[i].name] = Math.round(total.CallOutTimeLength/total.CallOutAcceptCount);
                                        }
                                    }
                                }
                            }
                            datas.push(total);
                        }
                        headerConfig.tableType = 'call_report_agent_time';
                        $('#agentTimeTableHeader').html(handler.report.callReport.renderTableHeader(headerConfig));
                        var dataHtml = '';
                        for (var i = 0; i < datas.length; i++) {
                            var oneRow = '<tr>';
                            for (var j = 0; j < headerConfig.length; j++) {
                                if (headerConfig[j].show === true) {
                                    if (headerConfig[j].name.slice(-6) === 'Length' || headerConfig[j].name.slice(-6) === 'LENGTH') {
                                        oneRow += '<td>' + handler.report.callReport.formatTime(datas[i][headerConfig[j].name]) + '</td>';
                                    } else if(headerConfig[j].name === 'show_time' && datas[i][headerConfig[j].name] === "合计") {
                                        oneRow+='<td sort_exclude="true">合计</td>';
                                    } else {
                                        oneRow += '<td>' + datas[i][headerConfig[j].name] + '</td>';
                                    }
                                }
                            }
                            oneRow += '</tr>';
                            dataHtml += oneRow;
                        }
                        $('#agentTimeTableBody').html(dataHtml);
                    }
                });
            } else {
                if (datas.length > 0) {
                    var total = {};
                    for (var i = 0; i < headerConfig.length; i++) {
                        for (var j = 0; j < datas.length; j++) {
                            if (headerConfig[i].name === 'show_time') {
                                total.show_time = '合计';
                                continue;
                            } else {
                                if (!isNaN(datas[j][headerConfig[i].name])) {
                                    if ((headerConfig[i].name in total) === false) {
                                        total[headerConfig[i].name] = 0;
                                    }
                                    total[headerConfig[i].name] += datas[j][headerConfig[i].name];
                                } else {
                                    if (headerConfig[i].name == 'CallInAcceptRate') {
                                        if (total.CallInAccessCount != 0) {
                                            total[headerConfig[i].name] = Math.round(total.CallInAcceptCount / total.CallInAccessCount * 100) + '%';
                                        } else {
                                            total[headerConfig[i].name] = Math.round(total.CallInAcceptCount / 1 * 100) + '%';
                                        }
                                    } else if (headerConfig[i].name == 'AgentUtilization') {
                                        if (total.LOGIN_TIME_LENGTH != 0) {
                                            total[headerConfig[i].name] = Math.round((total.CallInTimeLength + total.CallOutTimeLength) / total.LOGIN_TIME_LENGTH * 100) + '%';
                                        } else {
                                            total[headerConfig[i].name] = Math.round((total.CallInTimeLength + total.CallOutTimeLength) / 1 * 100) + '%';
                                        }
                                    }
                                }
                            }
                        }
                    }
                    for (var i = 0; i < headerConfig.length; i++) {
                        for (var j = 0; j < datas.length; j++) {
                            if(headerConfig[i].name == 'AverageHourCallCount'){
                                if(total.LOGIN_TIME_LENGTH == 0){
                                    total[headerConfig[i].name] = 0;
                                }else if(total.LOGIN_TIME_LENGTH <= 1800){
                                    total[headerConfig[i].name] = total.CallInAcceptCount + total.CallOutAcceptCount;
                                }else{
                                    total[headerConfig[i].name] = Math.round((total.CallInAcceptCount + total.CallOutAcceptCount)*1800/total.LOGIN_TIME_LENGTH);
                                }
                            }
                        }
                    }
                    datas.push(total);
                }
                headerConfig.tableType = 'call_report_agent_time';
                $('#agentTimeTableHeader').html(handler.report.callReport.renderTableHeader(headerConfig));
                var dataHtml = '';
                for (var i = 0; i < datas.length; i++) {
                    var oneRow = '<tr>';
                    for (var j = 0; j < headerConfig.length; j++) {
                        if (headerConfig[j].show === true) {
                            if (headerConfig[j].name.slice(-6) === 'Length' || headerConfig[j].name.slice(-6) === 'LENGTH') {
                                oneRow += '<td>' + handler.report.callReport.formatTime(datas[i][headerConfig[j].name]) + '</td>';
                            } else if(headerConfig[j].name === 'show_time' && datas[i][headerConfig[j].name] === "合计") {
                                oneRow+='<td sort_exclude="true">合计</td>';
                            } else {
                                oneRow += '<td>' + datas[i][headerConfig[j].name] + '</td>';
                            }
                        }
                    }
                    oneRow += '</tr>';
                    dataHtml += oneRow;
                }
                $('#agentTimeTableBody').html(dataHtml);
            }
        });
    },
    approveSurveyOnLoad: function (data) {
        var timeType = $('#report_approve_survey_timeType');
        if (data != 'call_report_approve_survey') {
            timeType.val(data.TimeType);
            handler.report.callReport.resetDate('report_approve_survey_dateTd', {"value": data.TimeType}, data);
        } else {
            timeType.val('day');
            handler.report.callReport.resetDate('report_approve_survey_dateTd', timeType.val());
        }
    },
    call_report_approve_survey: function (data) {
        handler.report.callReport.approveSurveyOnLoad(data);
        if(data != 'call_report_approve_survey'){
            if(data.TimeType == 'other'){
                if(data.StartTime == '' || data.EndTime == ''){
                    utils.showError("时间类型为自定义时间时，起止时间不可为空！");
                    return;
                }
            }
        }
        var action = {
            action : 'app.report.openApproveSurvey',
            data : data
        }
        DS.send(action, function(res){
            if(!res.success){
                alert('获取失败！');
            }
            var headerConfig = res.tableHeader.Config;
            var agents = getCache('agents');
            var agentReportData = res.agentReportData;
            var datas = res.data;
            for(var i=0 ; i < agents.length ; i++){
                for(var j = 0 ;j<datas.length;j++){
                    if(agents[i]._id === datas[j].AgentID){
                        datas[j].agent_name = agents[i].displayName;
                    }
                }
            }
            //根据页面的呼入呼出操作headerconfig,如果是呼入显示参与率（呼入）,等等
            for(var i=0; i<headerConfig.length; i++){
                if(data.callType == 'normal'){
                    if(headerConfig[i].name == 'approveSurveyOutRate' || headerConfig[i].name == 'approveSurveyRate' ||
                        headerConfig[i].name == 'CallOutAcceptCount'){
                        headerConfig[i].show = false;
                    }
                }else if(data.callType == 'dialout'){
                    if(headerConfig[i].name == 'approveSurveyInRate' || headerConfig[i].name == 'approveSurveyRate' ||
                        headerConfig[i].name == 'CallInAcceptCount'){
                        headerConfig[i].show = false;
                    }
                }else if(data.callType == '' || data == 'call_report_approve_survey'){
                    if(headerConfig[i].name == 'approveSurveyInRate' || headerConfig[i].name == 'approveSurveyOutRate'){
                        headerConfig[i].show = false;
                    }
                }
            }
            var headerConfigTrue = new Array();
            for(var i=0; i<headerConfig.length; i++){
                if(headerConfig[i].show == true){
                    headerConfigTrue.push(headerConfig[i]);
                }
            }

            for(var i=0 ; i < agentReportData.length ; i++){
                for(var j = 0 ;j<datas.length;j++){
                    if(agentReportData[i].AgentID === datas[j].AgentID){
                        datas[j].CallInAcceptCount = agentReportData[i].CallInAcceptCount;
                        datas[j].CallOutAcceptCount = agentReportData[i].CallOutAcceptCount;
                        if(data.callType == 'normal'){
                            if(datas[j].CallInAcceptCount > 0){
                                datas[j].approveSurveyInRate = Math.round(datas[j].approveSurveyCount / (datas[j].CallInAcceptCount)* 100)  + '%';
                            }else{
                                datas[j].approveSurveyInRate = '0%';
                            }
                        }else if(data.callType == 'dialout'){
                            if(datas[j].CallOutAcceptCount > 0){
                                datas[j].approveSurveyOutRate = Math.round(datas[j].approveSurveyCount / (datas[j].CallOutAcceptCount)* 100)  + '%';
                            }else{
                                datas[j].approveSurveyOutRate = '0%';
                            }
                        }else if(data.callType == '' || data == 'call_report_approve_survey'){
                            if((datas[j].CallInAcceptCount + datas[j].CallOutAcceptCount)> 0){
                                datas[j].approveSurveyRate = Math.round(datas[j].approveSurveyCount / (datas[j].CallInAcceptCount + datas[j].CallOutAcceptCount)* 100)  + '%';
                            }else{
                                datas[j].approveSurveyRate = '0%';
                            }
                        }
                    }
                }
            }
            if(datas.length>0){
                var total = {};
                for(var i=0 ; i < headerConfigTrue.length ; i++){
                    for(var j=0 ; j < datas.length ; j++){
                        if(headerConfigTrue[i].name === 'agent_name'){
                            total.agent_name = '合计';
                            continue;
                        }else{
                            if(!isNaN(datas[j][headerConfigTrue[i].name])){
                                if((headerConfigTrue[i].name in total) === false){
                                    total[headerConfigTrue[i].name] = 0;
                                }
                                total[headerConfigTrue[i].name] += datas[j][headerConfigTrue[i].name];
                            }
                        }
                    }
                }
                for(var i=0 ; i < headerConfigTrue.length ; i++){
                    for(var j=0 ; j < datas.length ; j++){
                        if(data.callType == 'normal'){
                            if(headerConfigTrue[i].name == 'approveSurveyInRate'){
                                if ((total.CallInAcceptCount) > 0){
                                    total.approveSurveyInRate = Math.round(total.approveSurveyCount /(total.CallInAcceptCount)* 100)  + '%';
                                }else{
                                    total.approveSurveyInRate = '0%';
                                }
                            }
                        }else if(data.callType == 'dialout'){
                            if(headerConfigTrue[i].name == 'approveSurveyOutRate'){
                                if ((total.CallOutAcceptCount) > 0){
                                    total.approveSurveyOutRate = Math.round(total.approveSurveyCount /(total.CallOutAcceptCount)* 100)  + '%';
                                }else{
                                    total.approveSurveyOutRate = '0%';
                                }
                            }
                        }else if(data.callType == '' || data == 'call_report_approve_survey'){
                            if(headerConfigTrue[i].name == 'approveSurveyRate'){
                                if ((total.CallInAcceptCount + total.CallOutAcceptCount) > 0){
                                    total.approveSurveyRate = Math.round(total.approveSurveyCount /(total.CallInAcceptCount + total.CallOutAcceptCount)* 100)  + '%';
                                }else{
                                    total.approveSurveyRate = '0%';
                                }
                            }
                        }
                    }
                }
                datas.push(total);
            }
            headerConfigTrue.tableType = 'call_report_approve_survey';
            $('#approveSurveyTableHeader').html(handler.report.callReport.renderTableHeader(headerConfigTrue));
            var dataHtml = '';
            for(var i =0 ; i < datas.length ;i ++){
                var oneRow = '<tr>';
                for(var j = 0 ; j <headerConfigTrue.length; j++){
                    if(i == datas.length -1){
                        if(headerConfigTrue[j].show === true){
                            if (headerConfigTrue[j].name.substr(0, headerConfigTrue[j].name.length - 1) == 'approveSurvey'){
                                if (datas[i].approveSurveyCount == 0){
                                    oneRow += '<td>' + datas[i][headerConfigTrue[j].name]+ '（' + Math.round(datas[i][headerConfigTrue[j].name]/1 * 100) + '%）</td>'
                                }else{
                                    oneRow += '<td>' + datas[i][headerConfigTrue[j].name]+ '（' + Math.round(datas[i][headerConfigTrue[j].name]/datas[i].approveSurveyCount * 100) + '%）</td>'
                                }
                            }else if(headerConfigTrue[j].name == 'agent_name' && datas[i].agent_name == '合计'){
                                oneRow+='<td sort_exclude="true">'+datas[i].agent_name+'</td>'
                            }else{
                                oneRow+='<td>'+datas[i][headerConfigTrue[j].name]+'</td>';
                            }
                        }
                    }else{
                        if(headerConfigTrue[j].show === true){
                            if (headerConfigTrue[j].name.substr(0, headerConfigTrue[j].name.length - 1) == 'approveSurvey'){
                                if (datas[i].approveSurveyCount == 0 || datas[i][headerConfigTrue[j].name] == 0){
                                    oneRow += '<td>' + datas[i][headerConfigTrue[j].name]+ '（0%）</td>'
                                }else{
//                                    oneRow += '<td>' + datas[i][headerConfigTrue[j].name]+ '（<a class="action" appdata="' +
//                                        datas[i].AgentID + ',' + headerConfigTrue[j].name.substr(headerConfigTrue[j].name.length - 1, headerConfigTrue[j].name.length) +
//                                        '" appaction="report.callReport.approveToCallSheet">' +
//                                        Math.round(datas[i][headerConfigTrue[j].name]/datas[i].approveSurveyCount * 100) + '%</a>）</td>'
                                    oneRow += '<td>' + datas[i][headerConfigTrue[j].name]+ '（' +Math.round(datas[i][headerConfigTrue[j].name]/datas[i].approveSurveyCount * 100) + '%）</td>'
                                }
                            }else{
                                oneRow+='<td>'+datas[i][headerConfigTrue[j].name]+'</td>';
                            }
                        }
                    }
                }
                oneRow += '</tr>';
                dataHtml += oneRow;
            }
            $('#approveSurveyTableBody').html(dataHtml);
        });
    },
    approveToCallSheet: function (data, callback) {
        var DISPOSAL_AGENT = data.split(',')[0];
        var INVESTIGATE = data.split(',')[1];
        var OFFERING_TIME = '';
        var timeType = $('#report_approve_survey_timeType').val();
        if (timeType == 'year') {
            var yearReport = document.getElementById('report_approve_survey_dateTd').childNodes[0].value;
            OFFERING_TIME = {"$gt": yearReport, "$lt": (parseInt(yearReport) + 1) + ''};
        } else if (timeType == 'month') {
            var yearReport = document.getElementById('report_approve_survey_dateTd').childNodes[0].value;
            var monthReport = document.getElementById('report_approve_survey_dateTd').childNodes[2].value;
            if (monthReport > 9 && monthReport != 12) {
                var timeReportMin = yearReport + '-' + monthReport;
                var timeReportMax = yearReport + '-' + (parseInt(monthReport) + 1);
                OFFERING_TIME = {"$gt": timeReportMin, "$lt": timeReportMax};
            } else if (monthReport == 12) {
                var timeReportMin = yearReport + '-' + monthReport;
                var timeReportMax = (yearReport + 1) + '-01';
                OFFERING_TIME = {"$gt": timeReportMin, "$lt": timeReportMax};
            } else if (monthReport == 9) {
                var timeReportMin = yearReport + '-0' + monthReport;
                var timeReportMax = yearReport + '-10';
                OFFERING_TIME = {"$gt": timeReportMin, "$lt": timeReportMax};
            } else {
                var timeReportMin = yearReport + '-0' + monthReport;
                var timeReportMax = yearReport + '-0' + (parseInt(monthReport) + 1);
                OFFERING_TIME = {"$gt": timeReportMin, "$lt": timeReportMax};
            }
        } else if (timeType == 'day') {
            var yearReport = document.getElementById('report_approve_survey_dateTd').childNodes[0].value;
            var monthReport = document.getElementById('report_approve_survey_dateTd').childNodes[2].value;
            var dayReport = document.getElementById('report_approve_survey_dateTd').childNodes[4].value;
            if (monthReport > 9) {
                if (dayReport > 9) {
                    var timeReportMin = yearReport + '-' + monthReport + '-' + dayReport + ' 00:00:00';
                    var timeReportMax = yearReport + '-' + monthReport + '-' + dayReport + ' 23:59:59';
                    OFFERING_TIME = {"$gte": timeReportMin, "$lte": timeReportMax};
                } else {
                    var timeReportMin = yearReport + '-' + monthReport + '-0' + dayReport + ' 00:00:00';
                    var timeReportMax = yearReport + '-' + monthReport + '-0' + dayReport + ' 23:59:59';
                    OFFERING_TIME = {"$gte": timeReportMin, "$lte": timeReportMax};
                }
            } else {
                if (dayReport > 9) {
                    var timeReportMin = yearReport + '-0' + monthReport + '-' + dayReport + ' 00:00:00';
                    var timeReportMax = yearReport + '-0' + monthReport + '-' + dayReport + ' 23:59:59';
                    OFFERING_TIME = {"$gte": timeReportMin, "$lte": timeReportMax};
                } else {
                    var timeReportMin = yearReport + '-0' + monthReport + '-0' + dayReport + ' 00:00:00';
                    var timeReportMax = yearReport + '-0' + monthReport + '-0' + dayReport + ' 23:59:59';
                    OFFERING_TIME = {"$gte": timeReportMin, "$lte": timeReportMax};
                }
            }
        }
        getBufferedView('report/callReport/approve_survey_call_sheet', function (view) {
            $('#approve_survey_call_sheet_agentId').val(DISPOSAL_AGENT);
            $('#approve_survey_call_sheet_investigate').value = INVESTIGATE;
            var queryData = {
                OFFERING_TIME: OFFERING_TIME,
                INVESTIGATE: INVESTIGATE,
                DISPOSAL_AGENT: DISPOSAL_AGENT
            }
            queryData.pageSize = handler.cdr.cdrPageSize;
            var action = {
                action: 'app.report.approveSurveyToCallSheet',
                data: queryData

            }
            DS.send(action, function (res) {
                if (!res.success) {
                    alert('get cdr fail!');
                    return;
                }
                var callSheetList = res.list;

                var panel = $('#approve_survey_to_call_sheet_pane');
                panel.empty();
                panel.append(view);
                $('#approve_survey_call_sheet_agentId').val(DISPOSAL_AGENT);
                $('#approve_survey_call_sheet_investigate').val(INVESTIGATE);

                handler.report.callReport.renderAppSurCallSheetTable(callSheetList, 'approve_survey_call_sheet_table_content');
                $('#approve_survey_call_sheet_modal').modal();

                $(".class_list span.approve_survey_call_sheet_result_count").text(res.count);
                var list = $(".class_list #serviceNoList_index li");
                updatePagination(list, res.count, handler.cdr.cdrPageSize, 1);
            });
        });
    },
    paginationAppCallSheetToChange: function (data, src) {
        var page = src.val() || 1;
        data.page = page;
        handler.report.callReport.approvePageToCallSheet(data, function (res) {
            $(".class_list span.approve_survey_call_sheet_result_count").text(res.count);
            var list = $(".class_list #serviceNoList_index li");
            updatePagination(list, res.count, handler.cdr.cdrPageSize, page);
        });
    },
    approvePageToCallSheet: function (data, callback) {
        var OFFERING_TIME = '';
        var timeType = $('#report_approve_survey_timeType').val();
        if (timeType == 'year') {
            var yearReport = document.getElementById('report_approve_survey_dateTd').childNodes[0].value;
            OFFERING_TIME = {"$gt": yearReport, "$lt": (parseInt(yearReport) + 1) + ''};
        } else if (timeType == 'month') {
            var yearReport = document.getElementById('report_approve_survey_dateTd').childNodes[0].value;
            var monthReport = document.getElementById('report_approve_survey_dateTd').childNodes[2].value;
            if (monthReport > 9 && monthReport != 12) {
                var timeReportMin = yearReport + '-' + monthReport;
                var timeReportMax = yearReport + '-' + (parseInt(monthReport) + 1);
                OFFERING_TIME = {"$gt": timeReportMin, "$lt": timeReportMax};
            } else if (monthReport == 12) {
                var timeReportMin = yearReport + '-' + monthReport;
                var timeReportMax = (yearReport + 1) + '-01';
                OFFERING_TIME = {"$gt": timeReportMin, "$lt": timeReportMax};
            } else if (monthReport == 9) {
                var timeReportMin = yearReport + '-0' + monthReport;
                var timeReportMax = yearReport + '-10';
                OFFERING_TIME = {"$gt": timeReportMin, "$lt": timeReportMax};
            } else {
                var timeReportMin = yearReport + '-0' + monthReport;
                var timeReportMax = yearReport + '-0' + (parseInt(monthReport) + 1);
                OFFERING_TIME = {"$gt": timeReportMin, "$lt": timeReportMax};
            }
        } else if (timeType == 'day') {
            var yearReport = document.getElementById('report_approve_survey_dateTd').childNodes[0].value;
            var monthReport = document.getElementById('report_approve_survey_dateTd').childNodes[2].value;
            var dayReport = document.getElementById('report_approve_survey_dateTd').childNodes[4].value;
            if (monthReport > 9) {
                if (dayReport > 9) {
                    var timeReportMin = yearReport + '-' + monthReport + '-' + dayReport + ' 00:00:00';
                    var timeReportMax = yearReport + '-' + monthReport + '-' + dayReport + ' 23:59:59';
                    OFFERING_TIME = {"$gte": timeReportMin, "$lte": timeReportMax};
                } else {
                    var timeReportMin = yearReport + '-' + monthReport + '-0' + dayReport + ' 00:00:00';
                    var timeReportMax = yearReport + '-' + monthReport + '-0' + dayReport + ' 23:59:59';
                    OFFERING_TIME = {"$gte": timeReportMin, "$lte": timeReportMax};
                }
            } else {
                if (dayReport > 9) {
                    var timeReportMin = yearReport + '-0' + monthReport + '-' + dayReport + ' 00:00:00';
                    var timeReportMax = yearReport + '-0' + monthReport + '-' + dayReport + ' 23:59:59';
                    OFFERING_TIME = {"$gte": timeReportMin, "$lte": timeReportMax};
                } else {
                    var timeReportMin = yearReport + '-0' + monthReport + '-0' + dayReport + ' 00:00:00';
                    var timeReportMax = yearReport + '-0' + monthReport + '-0' + dayReport + ' 23:59:59';
                    OFFERING_TIME = {"$gte": timeReportMin, "$lte": timeReportMax};
                }
            }
        }
        var queryData = {
            OFFERING_TIME: OFFERING_TIME,
            INVESTIGATE: data.investigate,
            DISPOSAL_AGENT: data.agentId,
            page: data.page
        }
        queryData.pageSize = handler.cdr.cdrPageSize;
        var action = {
            action: 'app.report.approveSurveyToCallSheet',
            data: queryData

        }
        DS.send(action, function (res) {
            if (!res.success) {
                alert('get cdr fail!');
                return;
            }
            var callSheetList = res.list;

            handler.report.callReport.renderAppSurCallSheetTable(callSheetList, 'approve_survey_call_sheet_table_content');
            $('#approve_survey_call_sheet_modal').modal();

            $(".class_list span.approve_survey_call_sheet_result_count").text(res.count);
            var list = $(".class_list #serviceNoList_index li");
            updatePagination(list, res.count, handler.cdr.cdrPageSize, data.page);
        });
    },
    showAppSurCdrDetail: function (data) {
        getBufferedView('report/showAppSurCdrDetail', function (view) {
            handler.cdr.getCdrDetailData(data, function (res) {
                console.log(res);
                var panel = $('#approve_survey_call_detail_pane');
                panel.empty();
                panel.append(handler.cdr.renderCdrDetail(res, view));
                $('#approve_survey_call_sheet_modal').modal('hide');
                $('#show_app_sur_cdr_detail_Modal').modal();
            });
        });
    },
    backToCallSheet: function (data) {
        $('#approve_survey_call_sheet_modal').modal();
        $('#show_app_sur_cdr_detail_Modal').modal('hide');
    },
    call_report_queue_time: function (data) {
        //初始化日程控件
        handler.report.callReport.queueTimeMainOnload(data);
        var groupName = null;
        var currentQueue = '';
        var sendData = {
            reportType : 'call_report_queue_time'
        };
        if(data != 'call_report_queue_time'){
            sendData.query = data;
            if(data.TimeType === 'year'){
                groupName = "MonthID";
            }else if(data.TimeType === 'month'){
                groupName = "DayID";
            }else if(data.TimeType === 'day'){
                groupName = "ReportTime";
            }else if(data.TimeType === 'other'){
                //做输入校验
                //if()
                //TimeType="other"
                groupName = "DayID";
            }
            currentQueue = data.currentQueue;
            if(data.TimeType == 'other'){
                if(data.StartTime == '' || data.EndTime == ''){
                    utils.showError("时间类型为自定义时间时，起止时间不可为空！");
                    return;
                }
                if(data.StartTime > data.EndTime){
                    utils.showError("开始时间必须小于结束时间！");
                    return;
                }
            }
        }
        var action = {
            action : 'app.report.openQueueTime',
            data : sendData
        }
        DS.send(action,function(res){
            if(!res.success){
                alert('获取失败！');
            }
            var headerConfig = res.tableHeader.Config;
            var datas = handler.report.callReport.reportSort(res.data,groupName);;
            //生成合计
            if(datas.length>0){
                datas.push(handler.report.callReport.callReportQueueTimeGenerateTotal(headerConfig,datas,groupName));
            }
            headerConfig.tableType = 'call_report_queue_time';
            //生成表格内容
            $('#queueTimeTableHeader').html(handler.report.callReport.renderTableHeader(headerConfig));
            var dataHtml = '';
            for(var i =0 ; i < datas.length ;i ++){
                var oneRow = '<tr>';
                for(var j = 0 ; j <headerConfig.length ; j++){
                    if(headerConfig[j].show === true){
                        if(headerConfig[j].name === 'ReportTime' && datas[i][groupName]!="合计"){
                            if(groupName != null && groupName != 'ReportTime'){
                                oneRow+='<td>'+datas[i][groupName]+'</td>';
                            }else{
                                var date = datas[i][headerConfig[j].name].split(" ")[0];
                                var time = datas[i][headerConfig[j].name].split(" ")[1];
                                var dateTime = date+"_"+time;
                                oneRow+='<td>'+datas[i][headerConfig[j].name]+'</td>';
                            }
                        }else if(headerConfig[j].name === 'ReportTime' && datas[i][groupName] === "合计"){
                            oneRow+='<td sort_exclude="true">合计</td>';
                        }else{
                            if(headerConfig[j].name.slice(-6) === 'Length'){
                                oneRow+='<td>'+formatTime(datas[i][headerConfig[j].name])+'</td>';
                            }else{
                                oneRow+='<td>'+datas[i][headerConfig[j].name]+'</td>';
                            }
                        }
                    }
                }
                oneRow += '</tr>';
                dataHtml += oneRow;
            }
            $('#queue_time_queue_search_select')
                .html("<option value=''>--请选择--</option>"+generateComboxOptionsFromDocs(res.queues,'DisplayName','_id',currentQueue));
            $('#queueTimeTableTbody').html(dataHtml);
            //控制返回按钮显示
            if(session.dicMap.callReportQueueDrillCount>0){
                $('#returnDrillToQueueBtn').show();
            }else{
                $('#returnDrillToQueueTimeBtn').hide();
            }
            //生成时间趋势图
            var seriesArray = new Array();
            seriesArray.push({name: '排队总数',data:new Array(),valueName: 'AccessCount'});
            seriesArray.push({name: '接通数',data:new Array(),valueName: 'AcceptCount'});
            seriesArray.push({name: '20秒内接起数',data:new Array(),valueName: 'AcceptIn20Count'});
            handler.report.callReport.initTimeHighCharts('call_report_queue_time_highcharts_container',datas,seriesArray,groupName);
        });
    },
    call_report_queue: function (data) {
        if(data.TimeType == 'other'){
                if(data.StartTime == '' || data.EndTime == ''){
                    utils.showError("时间类型为自定义时间时，起止时间不可为空！");
                    return;
                }
                if(data.StartTime > data.EndTime){
                    utils.showError("开始时间必须小于结束时间！");
                    return;
                }
            }
        handler.report.callReport.queueMainOnload(data);
        var sendData = {
            reportType: 'call_report_queue'
        };
        if (data != 'queue_report') {
            sendData.query = data;
        }
        var action = {
            action: 'app.report.openQueue',
            data: sendData
        }
        DS.send(action, function (res) {
            if (!res.success) {
                alert('获取失败！');
            }
            var headerConfig = res.tableHeader.Config;
            var queues = res.queues;
            var datas = res.data;
            //技能组名字填上
            for (var i = 0; i < queues.length; i++) {
                for (var j = 0; j < datas.length; j++) {
                    if (queues[i]._id === datas[j].QueueID) {
                        datas[j].queue_name = queues[i].DisplayName;
                    }
                }
            }
            //生成合计
            if (datas.length > 0) {
                datas.push(handler.report.callReport.callReportQueueGenerateTotal(headerConfig, datas));
            }
            //生成表格内容
            headerConfig.tableType = 'call_report_queue';
            $('#tableHeader').html(handler.report.callReport.renderTableHeader(headerConfig));
            var dataHtml = '';
            for (var i = 0; i < datas.length; i++) {
                var oneRow = '<tr>';
                for (var j = 0; j < headerConfig.length; j++) {
                    if (headerConfig[j].show === true) {
                        if (headerConfig[j].name === 'queue_name' && datas[i].queue_name != '合计') {
                            oneRow += '<td>'
                                + datas[i][headerConfig[j].name] + '</td>';
                        }else if((headerConfig[j].name === 'queue_name' && datas[i].queue_name === '合计')){
                            oneRow+='<td sort_exclude="true">'+datas[i].queue_name+'</td>'
                        }else{
                            if (headerConfig[j].name.slice(-6) === 'Length') {
                                oneRow += '<td>' + handler.report.callReport.formatTime(datas[i][headerConfig[j].name]) + '</td>';
                            } else {
                                oneRow += '<td>' + datas[i][headerConfig[j].name] + '</td>';
                            }
                        }
                    }
                }
                oneRow += '</tr>';
                dataHtml += oneRow;
            }
            $('#tableTbody').html(dataHtml);
            //控制返回按钮的显示
            if (session.dicMap.callReportQueueDrillCount > 0) {
                $('#returnDrillToQueueTimeBtn').show();
            } else {
                $('#returnDrillToQueueTimeBtn').hide();
            }
            //生成柱状图
            var seriesArray = new Array();
            seriesArray.push({name: '接通平均排队时长', data: new Array(), valueName: 'AcceptAverageQueueTimeLength'});
            seriesArray.push({name: '接通最大排队时长', data: new Array(), valueName: 'AcceptMaxQueueTimeLength'});
            seriesArray.push({name: '接通最小排队时长', data: new Array(), valueName: 'AcceptMinQueueTimeLength'});
            seriesArray.push({name: '放弃平均排队时长', data: new Array(), valueName: 'AbandonAverageQueueTimeLength'});
            seriesArray.push({name: '放弃最大排队时长', data: new Array(), valueName: 'AbandonMaxQueueTimeLength'});
            seriesArray.push({name: '放弃最小排队时长', data: new Array(), valueName: 'AbandonMinQueueTimeLength'});
            seriesArray.push({name: '平均通话时长', data: new Array(), valueName: 'AcceptAverageCallInTimeLength'});
            handler.report.callReport.initHighCharts('call_report_queue_highcharts_container', datas, seriesArray, 'queue_name');
        });
    },
    callReportQueueGenerateTotal: function (headerConfig, datas) {
        var total = {
            AbandonSumQueueTimeLength: 0,
            AcceptSumCallInTimeLength: 0,
            AcceptSumQueueTimeLength: 0
        };
        for (var i = 0; i < datas.length; i++) {
            total.AbandonSumQueueTimeLength += datas[i].AbandonSumQueueTimeLength;
            total.AcceptSumCallInTimeLength += datas[i].AcceptSumCallInTimeLength;
            total.AcceptSumQueueTimeLength += datas[i].AcceptSumQueueTimeLength;
        }
        for (var i = 0; i < headerConfig.length; i++) {
            for (var j = 0; j < datas.length; j++) {
                if (headerConfig[i].name === 'queue_name') {
                    total.queue_name = '合计';
                    continue;
                } else {
                    //如果为数字
                    if (!isNaN(datas[j][headerConfig[i].name])) {
                        if ((headerConfig[i].name in total) === false) {
                            total[headerConfig[i].name] = 0;
                        }
                        if (headerConfig[i].name === 'AcceptMaxQueueTimeLength') {
                            if (datas[j].AcceptMaxQueueTimeLength > total.AcceptMaxQueueTimeLength) {
                                total.AcceptMaxQueueTimeLength = datas[j].AcceptMaxQueueTimeLength;
                            }
                        } else if (headerConfig[i].name === 'AcceptMinQueueTimeLength') {
                            if (total.AcceptMinQueueTimeLength === 0) {
                                total.AcceptMinQueueTimeLength = datas[j].AcceptMinQueueTimeLength
                            }
                            if (datas[j].AcceptMinQueueTimeLength < total.AcceptMinQueueTimeLength) {
                                total.AcceptMinQueueTimeLength = datas[j].AcceptMinQueueTimeLength;
                            }
                        } else if (headerConfig[i].name === 'AbandonMaxQueueTimeLength') {
                            if (datas[j].AbandonMaxQueueTimeLength > total.AbandonMaxQueueTimeLength) {
                                total.AbandonMaxQueueTimeLength = datas[j].AbandonMaxQueueTimeLength;
                            }
                        } else if (headerConfig[i].name === 'AbandonMinQueueTimeLength') {
                            if (total.AbandonMinQueueTimeLength === 0) {
                                total.AbandonMinQueueTimeLength = datas[j].AbandonMinQueueTimeLength
                            }
                            if (datas[j].AbandonMinQueueTimeLength < total.AbandonMinQueueTimeLength) {
                                total.AbandonMinQueueTimeLength = datas[j].AbandonMinQueueTimeLength;
                            }
                        } else {
                            total[headerConfig[i].name] += datas[j][headerConfig[i].name];
                        }
                    }
                }
            }
        }
        total.AcceptRate = Math.round(total.AcceptCount / total.AccessCount * 100) + "%";
        total.AcceptAverageQueueTimeLength = total.AcceptSumQueueTimeLength / total.AcceptCount;
        if (total.AccessCount - total.AcceptCount === 0) {
            total.AbandonAverageQueueTimeLength = 0;
        } else {
            total.AbandonAverageQueueTimeLength = total.AbandonSumQueueTimeLength / (total.AccessCount - total.AcceptCount);
        }
        total.AcceptAverageCallInTimeLength = total.AcceptSumCallInTimeLength / total.AcceptCount;
        total.ServiceLevel = Math.round(total.AcceptIn20Count / total.AccessCount * 10) / 10;
        if (total.AccessCount - total.AbandonIn6SumQueueLeak === 0) {
            total.AcceptRateNotIn6Leak = "0%";
        } else {
            total.AcceptRateNotIn6Leak = Math.round(total.AcceptCount / (total.AccessCount - total.AbandonIn6SumQueueLeak) * 100) + "%";
        }
        return total;
    },
    callReportQueueTimeGenerateTotal: function (headerConfig, datas, groupName) {
        var total = {
            AcceptSumQueueTimeLength : 0,
            AbandonSumQueueTimeLength : 0,
            AcceptMinQueueTimeLength : 0,
            AbandonMinQueueTimeLength :0
        };
        for(var i =0 ; i < datas.length ;i++){
            total.AbandonSumQueueTimeLength += datas[i].AbandonSumQueueTimeLength;
//                    total.AcceptSumCallInTimeLength += datas[i].AcceptSumCallInTimeLength;
            total.AcceptSumQueueTimeLength += datas[i].AcceptSumQueueTimeLength;
        }
        total[groupName] = '合计';
        for(var i=0 ; i < headerConfig.length ; i++){
            for(var j=0 ; j < datas.length ; j++){
                //如果为数字
                if(!isNaN(datas[j][headerConfig[i].name])){
                    if((headerConfig[i].name in total) === false){
                        total[headerConfig[i].name] = 0;
                    }
                    if(headerConfig[i].name === 'AcceptMaxQueueTimeLength'){
                        if(datas[j].AcceptMaxQueueTimeLength > total.AcceptMaxQueueTimeLength){
                            total.AcceptMaxQueueTimeLength = datas[j].AcceptMaxQueueTimeLength;
                        }
                    }else if(headerConfig[i].name === 'AcceptMinQueueTimeLength'){
                        if(datas[j].AcceptMinQueueTimeLength != 0){
                            if(total.AcceptMinQueueTimeLength == 0){
                                total.AcceptMinQueueTimeLength = datas[j].AcceptMinQueueTimeLength;
                            }
                            if(datas[j].AcceptMinQueueTimeLength < total.AcceptMinQueueTimeLength){
                                total.AcceptMinQueueTimeLength = datas[j].AcceptMinQueueTimeLength;
                            }
                        }
                    }else if(headerConfig[i].name === 'AbandonMaxQueueTimeLength'){
                        if(datas[j].AbandonMaxQueueTimeLength > total.AbandonMaxQueueTimeLength){
                            total.AbandonMaxQueueTimeLength = datas[j].AbandonMaxQueueTimeLength;
                        }
                    }else if(headerConfig[i].name === 'AbandonMinQueueTimeLength'){
                        if(datas[j].AbandonMinQueueTimeLength != 0){
                            if(total.AbandonMinQueueTimeLength == 0){
                                total.AbandonMinQueueTimeLength = datas[j].AbandonMinQueueTimeLength;
                            }
                            if(datas[j].AbandonMinQueueTimeLength < total.AbandonMinQueueTimeLength){
                                total.AbandonMinQueueTimeLength = datas[j].AbandonMinQueueTimeLength;
                            }
                        }
                    }else{
                        total[headerConfig[i].name] += datas[j][headerConfig[i].name];
                    }
                }
            }
        }
        total.AcceptRate = Math.round(total.AcceptCount/total.AccessCount*100) + "%";
        total.AcceptAverageQueueTimeLength = total.AcceptSumQueueTimeLength/total.AcceptCount;
        if(total.AccessCount-total.AcceptCount === 0){
            total.AbandonAverageQueueTimeLength = 0;
        }else{
            total.AbandonAverageQueueTimeLength = total.AbandonSumQueueTimeLength/(total.AccessCount-total.AcceptCount);
        }
        return total;
    },
    callReportRelayTimeGenerateTotal: function (headerConfig, datas, groupName) {
        var total = {};
        total[groupName] = '合计';
        for (var i = 0; i < headerConfig.length; i++) {
            for (var j = 0; j < datas.length; j++) {
                //如果为数字
                if (!isNaN(datas[j][headerConfig[i].name])) {
                    if ((headerConfig[i].name in total) === false) {
                        total[headerConfig[i].name] = 0;
                    }

                    total[headerConfig[i].name] += datas[j][headerConfig[i].name];

                }
            }
        }
        total.AccessCount = total.DealingCount + total.NotDealCount + total.LeakCount + total.QueueLeakCount + total.BlackListCount + total.VoicemailCount;
        total.DealingRate = Math.round(total.DealingCount / total.AccessCount * 100);
        total.CallTimeLengthAvg = Math.round(total.CallTimeLength / total.DealingCount);
        return total;
    },
    callReportDialoutGenerateTotal : function(headerConfig,datas,groupName){
        var total = {};
        total[groupName] = '合计';
        for(var i=0 ; i < headerConfig.length ; i++){
            for(var j=0 ; j < datas.length ; j++){
                if(!isNaN(datas[j][headerConfig[i].name])){
                    if((headerConfig[i].name in total) === false){
                        total[headerConfig[i].name] = 0;
                    }

                    total[headerConfig[i].name] += datas[j][headerConfig[i].name];

                }
            }
        }
        if(total.DealingCount == 0  || total.AccessCount == 0){
            total.DealingRate = "0";
        }else{
            total.DealingRate = Math.round(total.DealingCount/total.AccessCount*100);
        }

        if(total.DealingCount == 0){
            total.CallTimeLengthAvg = 0;
        }else{
            total.CallTimeLengthAvg = Math.round(total.CallTimeLength/total.DealingCount);
        }
        return total;
    },
    callReportDialoutAreaGenerateTotal : function(headerConfig,datas,groupName){
        var total = {};
        total[groupName] = '合计';
        for(var i=0 ; i < headerConfig.length ; i++){
            for(var j=0 ; j < datas.length ; j++){
                if(!isNaN(datas[j][headerConfig[i].name])){
                    if((headerConfig[i].name in total) === false){
                        total[headerConfig[i].name] = 0;
                    }
                    total[headerConfig[i].name] += datas[j][headerConfig[i].name];
                }
            }
        }
        total.CallOutAcceptRate = Math.round(total.DealingCount/total.AccessCount*100) + "%";
        if(total.DealingCount == 0){
            total.CallOutAverageTimeLength = 0;
        }else{
            total.CallOutAverageTimeLength = total.CallTimeLength/total.DealingCount;
        }
        return total;
    }
    ,callReportRelayAreaGenerateTotal : function(headerConfig,datas,groupName){
        var total = {};
        total[groupName] = '合计';
        for(var i=0 ; i < headerConfig.length ; i++){
            for(var j=0 ; j < datas.length ; j++){
                //如果为数字
                if(!isNaN(datas[j][headerConfig[i].name])){
                    if((headerConfig[i].name in total) === false){
                        total[headerConfig[i].name] = 0;
                    }
                    total[headerConfig[i].name] += datas[j][headerConfig[i].name];
                }
            }
        }
        return total;
    },
    callReportCalloutGenerateTotal: function (headerConfig, datas, groupName) {
        var total = {};
        total[groupName] = '合计';
        for (var i = 0; i < headerConfig.length; i++) {
            for (var j = 0; j < datas.length; j++) {
                //如果为数字
                if (!isNaN(datas[j][headerConfig[i].name])) {
                    if ((headerConfig[i].name in total) === false) {
                        total[headerConfig[i].name] = 0;
                    }

                    total[headerConfig[i].name] += datas[j][headerConfig[i].name];

                }
            }
        }
        return total;
    },
    callReportRelayAreaCityGenerateTotal : function(headerConfig,datas,groupName){
        var total = {};
        total[groupName] = '合计';
        for(var i=0 ; i < headerConfig.length ; i++){
            for(var j=0 ; j < datas.length ; j++){
                //如果为数字
                if(!isNaN(datas[j][headerConfig[i].name])){
                    if((headerConfig[i].name in total) === false){
                        total[headerConfig[i].name] = 0;
                    }
                    total[headerConfig[i].name] += datas[j][headerConfig[i].name];
                }
            }
        }
        return total;
    },
    preDrillToQueueTime: function (data) {
        $("#call_report_queue_QueueID").val(data);
        $("#call_report_queue_doDrill").click();
    },
    drillToQueueTime: function (data) {
        delete data.selectedQueueList;
        if ("timeReport" in data) {
            alert('您已查询到每半小时的报表，无法再继续跳转！');
            return;
        }
        //缓存中放一个钻入计数器，控制返回上页按钮的显示
        if (session.dicMap.callReportQueueDrillCount != undefined) {
            session.dicMap.callReportQueueDrillCount++;
        } else {
            session.dicMap.callReportQueueDrillCount = 1;
        }
        var id = "call_report_queue_time";
        var page = "view_" + id;
        if (!session[page]) {
            var p = $("#" + page);
            getView("report/callReport/call_report_queue_time.html", function (view) {
                session[page] = true;
                p.empty();
                p.html(view);
                handler.report.callReport.call_report_queue(data);
                resize();
                $(".right_content").css("display", "none");
                $("#" + page).css("display", "block");
            });
        } else {
            $(".right_content").css("display", "none");
            $("#" + page).css("display", "block");
        }
        handler.report.callReport.call_report_queue_time(data);
    },
    drillToQueue: function (data) {
        var drillData = {};
        var returnQueueId = $('#queue_time_queue_search_select').val();
        //缓存中放一个钻入计数器，控制返回上页按钮的显示
        if (session.dicMap.callReportQueueDrillCount != undefined) {
            session.dicMap.callReportQueueDrillCount++;
        } else {
            session.dicMap.callReportQueueDrillCount = 1;
        }
        //正常钻入，data为日期的字符串
        if (typeof data === 'string') {
            if (data.length === 6) {//钻入某月
                drillData.TimeType = 'month';
                drillData.yearReport = data.substr(0, 4);
                if (data.substr(4, 1) === '0') {
                    drillData.monthReport = data.substr(5, 1);
                } else {
                    drillData.monthReport = data.substr(4, 2);
                }
            } else if (data.length === 8) {//钻入某天
                drillData.TimeType = 'day';
                drillData.yearReport = data.substr(0, 4);
                if (data.substr(4, 1) === '0') {
                    drillData.monthReport = data.substr(5, 1);
                } else {
                    drillData.monthReport = data.substr(4, 2);
                }
                if (data.substr(6, 1) === '0') {
                    drillData.dayReport = data.substr(7, 1);
                } else {
                    drillData.dayReport = data.substr(6, 2);
                }
            } else {//钻入某半小时
                drillData.TimeType = 'time';
                drillData.yearReport = data.substr(0, 4);
                if (data.substr(5, 1) === '0') {
                    drillData.monthReport = data.substr(6, 1);
                } else {
                    drillData.monthReport = data.substr(5, 2);
                }
                if (data.substr(8, 1) === '0') {
                    drillData.dayReport = data.substr(9, 1);
                } else {
                    drillData.dayReport = data.substr(8, 2);
                }
                drillData.timeReport = data.split("_")[0] + ' ' + data.split("_")[1];
            }
        } else {
            //返回上页时，data为查询对象
            drillData = data;
        }
        var id = "call_report_queue";
        var page = "view_" + id;
        //要钻入的报表未打开过
        if (!session[page]) {
            var p = $("#" + page);
            getView("report/callReport/call_report_queue.html", function (view) {
                session[page] = true;
                p.empty();
                p.html(view);
                handler.report.callReport.call_report_queue(drillData);
                resize();
                //隐藏域保存钻入之前的技能组条件
                $('#call_report_queue_returnQueueID').val(returnQueueId);
                $(".right_content").css("display", "none");
                $("#" + page).css("display", "block");
            });
        } else {
            //钻入时，不切换左侧菜单
//                    $(".open_with_ajax").removeClass("pressed");
//                    $("#" + id).addClass("pressed");
//                    session.currentPage.page = page;
//                    session.currentPage.id = id;
            $('#call_report_queue_returnQueueID').val(returnQueueId);
            $(".right_content").css("display", "none");
            $("#" + page).css("display", "block");
            handler.report.callReport.call_report_queue(drillData);
        }
    },
    returnDrillToQueue: function (data) {
        delete data.currentQueue;
        handler.report.callReport.drillToQueue(data);
        //这里计数器-2，是因为上面掉钻入方法又多加了一个1
        session.dicMap.callReportQueueDrillCount -= 2;
    },
    returnDrillToQueueTime: function (data) {
        data.currentQueue = $('#call_report_queue_returnQueueID').val();
        if (data.TimeType === 'month') {
            data.TimeType = 'year';
        } else if (data.TimeType === 'day' && !('timeReport' in data)) {
            data.TimeType = 'month';
        } else if (data.TimeType === 'day' && ('timeReport' in data)) {
            data.TimeType = 'day';
            delete data.timeReport;
        }
        handler.report.callReport.drillToQueueTime(data);
        session.dicMap.callReportQueueDrillCount -= 2;
    },
    queueMainOnload: function (data) {
        var timeType = $('#queue_time_type');
        if (data != 'queue_report') {
            if (data.TimeType === 'time') {
                timeType.val('day');
            } else {
                timeType.val(data.TimeType);
            }
            handler.report.callReport.resetDate('report_queue_dateTd', data.TimeType, data);
        } else {
            timeType.val('day');
            handler.report.callReport.resetDate('report_queue_dateTd', timeType.val());
        }
    },
    queueTimeMainOnload: function (data) {
        var timeType = $('#queue_time_time_type');
        if (data != 'call_report_queue_time') {
            timeType.val(data.TimeType);
            handler.report.callReport.resetDate('report_queue_time_dateTd', data.TimeType, data);
        } else {
            timeType.val('day');
            handler.report.callReport.resetDate('report_queue_time_dateTd', timeType.val());
        }
    },
    exportReportQueue: function (data, src) {
        $('#show_confirm_export_report_pdf').modal('hide');
        var newWin = window.open(data.pdf_title,'report_export_pdf_show_print',"");
        //取得id为"order"的<div id="order"></div>之间的内容
        var chartHTML = document.getElementById("call_report_queue_highcharts_container").innerHTML;
        var tableHTML = document.getElementById("report_queue_table").innerHTML;
        //将取得的打印内容放入新窗体
        newWin.document.write('<style type="text/css">table{border-collapse:collapse}td{ border:1px solid #999999}th{ border:1px solid #999999}</style>');
        newWin.document.write('<center><h3>'+data.pdf_title+'</h3></center>');
        newWin.document.write(chartHTML);
        newWin.document.write(tableHTML);
        //刷新新窗体
        newWin.document.location.reload();
        //调用打印功能
        newWin.print();
        //打印完毕自动关闭新窗体
        //newWin.close();
    },
    exportReportQueueTime: function (data) {
        $('#show_confirm_export_report_pdf').modal('hide');
        var newWin = window.open(data.pdf_title, 'report_export_pdf_show_print', "");
        var chartHTML = document.getElementById("call_report_queue_time_highcharts_container").innerHTML;
        var tableHTML = document.getElementById("report_queue_time_table").innerHTML;
        newWin.document.write('<style type="text/css">table{border-collapse:collapse}td{ border:1px solid #999999}th{ border:1px solid #999999}</style>');
        newWin.document.write('<center><h3>' + data.pdf_title + '</h3></center>');
        newWin.document.write(chartHTML);
        newWin.document.write(tableHTML);
        newWin.document.location.reload();
        newWin.print();
    },
    exportReportRelayTime: function (data) {
        $('#show_confirm_export_report_pdf').modal('hide');
        var newWin = window.open(data.pdf_title,'report_export_pdf_show_print',"");
        var chartHTML = document.getElementById("call_report_relay_time_highcharts_container").innerHTML;
        var tableHTML = document.getElementById("report_relay_time_table").innerHTML;
        newWin.document.write('<style type="text/css">table{border-collapse:collapse}td{ border:1px solid #999999}th{ border:1px solid #999999}</style>');
        newWin.document.write('<center><h3>'+data.pdf_title+'</h3></center>');
        newWin.document.write(chartHTML);
        newWin.document.write(tableHTML);
        newWin.document.location.reload();
        newWin.print();
    },
    exportReportRelayAreaCity : function(data){
        $('#show_confirm_export_report_pdf').modal('hide');
        var newWin = window.open(data.pdf_title,'report_export_pdf_show_print',"");
        var tableHTML = document.getElementById("report_relay_area_city_table").innerHTML;
        newWin.document.write('<style type="text/css">table{border-collapse:collapse}td{ border:1px solid #999999}th{ border:1px solid #999999}</style>');
        newWin.document.write('<center><h3>'+data.pdf_title+'</h3></center>');
        newWin.document.write(tableHTML);
        newWin.document.location.reload();
        newWin.print();
    },
    exportReportAgent: function (data) {
        $('#show_confirm_export_report_pdf').modal('hide');
        var newWin = window.open(data.pdf_title,'report_export_pdf_show_print',"");
        var chartHTML = document.getElementById("call_report_agent_highcharts_container").innerHTML;
        var tableHTML = document.getElementById("report_agent_table").innerHTML;
        newWin.document.write('<style type="text/css">table{border-collapse:collapse}td{ border:1px solid #999999}th{ border:1px solid #999999}</style>');
        newWin.document.write('<center><h3>'+data.pdf_title+'</h3></center>');
        newWin.document.write(chartHTML);
        newWin.document.write(tableHTML);
        newWin.document.location.reload();
        newWin.print();
    },
    exportReportAgentTime: function (data) {
        $('#show_confirm_export_report_pdf').modal('hide');
        var newWin = window.open(data.pdf_title,'report_export_pdf_show_print',"");
        var tableHTML = document.getElementById("report_agent_time_table").innerHTML;
        newWin.document.write('<style type="text/css">table{border-collapse:collapse}td{ border:1px solid #999999}th{ border:1px solid #999999}</style>');
        newWin.document.write('<center><h3>'+data.pdf_title+'</h3></center>');
        newWin.document.write(tableHTML);
        newWin.document.location.reload();
        newWin.print();
    },
    exportReportApproveSurvey: function (data) {
        $('#show_confirm_export_report_pdf').modal('hide');
        var newWin = window.open(data.pdf_title, 'report_export_pdf_show_print', "");
        var tableHTML = document.getElementById("report_agent_approve_survey_table").innerHTML;
        newWin.document.write('<style type="text/css">table{border-collapse:collapse}td{ border:1px solid #999999}th{ border:1px solid #999999}</style>');
        newWin.document.write('<center><h3>' + data.pdf_title + '</h3></center>');
        newWin.document.write(tableHTML);
        newWin.print();
    },
    exportReportCalloutTime: function (data) {
        $('#show_confirm_export_report_pdf').modal('hide');
        var newWin = window.open(data.pdf_title,'report_export_pdf_show_print',"");
        var chartHTML = document.getElementById("call_report_dialout_highcharts_container").innerHTML;
        var tableHTML = document.getElementById("report_callout_time_table").innerHTML;
        newWin.document.write('<style type="text/css">table{border-collapse:collapse}td{ border:1px solid #999999}th{ border:1px solid #999999}</style>');
        newWin.document.write('<center><h3>'+data.pdf_title+'</h3></center>');
        newWin.document.write(chartHTML);
        newWin.document.write(tableHTML);
        newWin.document.location.reload();
        newWin.print();
    },
    exportReportRelayArea : function(data){
        $('#show_confirm_export_report_pdf').modal('hide');
        var newWin = window.open(data.pdf_title,'report_export_pdf_show_print',"");
        var tableHTML = document.getElementById("report_relay_area_table").innerHTML;
        newWin.document.write('<style type="text/css">table{border-collapse:collapse}td{ border:1px solid #999999}th{ border:1px solid #999999}</style>');
        newWin.document.write('<center><h3>'+data.pdf_title+'</h3></center>');
        newWin.document.write(tableHTML);
        newWin.document.location.reload();
        newWin.print();
    },
    exportReportDialoutArea : function(data){
        $('#show_confirm_export_report_pdf').modal('hide');
        var newWin = window.open(data.pdf_title,'report_export_pdf_show_print',"");
        var tableHTML = document.getElementById("report_dialout_area_table").innerHTML;
        newWin.document.write('<style type="text/css">table{border-collapse:collapse}td{ border:1px solid #999999}th{ border:1px solid #999999}</style>');
        newWin.document.write('<center><h3>'+data.pdf_title+'</h3></center>');
        newWin.document.write(tableHTML);
        newWin.document.location.reload();
        newWin.print();
    },
    exportReportImCSR: function (data) {
        $('#show_confirm_export_report_pdf').modal('hide');
        var newWin = window.open(data.pdf_title,'report_export_pdf_show_print',"");
        var chartHTML = document.getElementById("im_report_csr_highcharts_container").innerHTML;
        var tableHTML = document.getElementById("im_report_csr_table").innerHTML;
        newWin.document.write('<style type="text/css">table{border-collapse:collapse}td{ border:1px solid #999999}th{ border:1px solid #999999}</style>');
        newWin.document.write('<center><h3>'+data.pdf_title+'</h3></center>');
        newWin.document.write(chartHTML);
        newWin.document.write(tableHTML);
        newWin.document.location.reload();
        newWin.print();
    },
    exportReportImSessionTime: function (data) {
        $('#show_confirm_export_report_pdf').modal('hide');
        var newWin = window.open(data.pdf_title,'report_export_pdf_show_print',"");
        var chartHTML = document.getElementById("im_report_session_time_highcharts_container").innerHTML;
        var tableHTML = document.getElementById("im_report_session_time_table").innerHTML;
        newWin.document.write('<style type="text/css">table{border-collapse:collapse}td{ border:1px solid #999999}th{ border:1px solid #999999}</style>');
        newWin.document.write('<center><h3>'+data.pdf_title+'</h3></center>');
        newWin.document.write(chartHTML);
        newWin.document.write(tableHTML);
        newWin.document.location.reload();
        newWin.print();
    },
    exportRelayTimeExcel: function(data) {
        data.accountId = session.user.account;
        data.type = 'ReportRelayTimeExport';
        data.user = session.user._id;
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'exportRelayTimeReport',Query:data}
        };
        
        DS.send(action,function(rep) {
            if(rep.Succeed){
                downloadFile(rep.path);
            }else{
                alert('导出失败！');
            }
        });
    },
    exportApproveSurveyExcel: function(data) {
        data.userType = session.user.type;
        data.accountId = session.user.account;
        data.type = 'ReportApproveSurveyExport';
        data.user = session.user._id;
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'exportApproveSurveyReport',Query:data}
        };
        DS.send(action,function(rep) {
            if(rep.Succeed){
                downloadFile(rep.path);
            }else{
                alert('导出失败！');
            }
        });
    }
    ,exportReportQueueExcel : function(data){
        data.accountId = session.user.account;
        data.type = 'exportReportQueue';
        data.user = session.user._id;
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'exportReportQueue',Query:data}
        };
        DS.send(action,function(rep) {
            //console.log(rep);
            if(rep.Succeed){
                downloadFile(rep.path);
            }else{
                alert('导出失败！');
            }
        });
    }
    ,exportReportQueueTimeExcel : function(data){
        data.accountId = session.user.account;
        data.type = 'exportReportQueueTime';
        data.user = session.user._id;
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'exportReportQueueTime',Query:data}
        };
        DS.send(action,function(rep) {
            //console.log(rep);
            if(rep.Succeed){
                downloadFile(rep.path);
            }else{
                alert('导出失败！');
            }
        });
    }
    ,exportDialoutExcel: function(data) {
        data.accountId = session.user.account;
        data.type = 'ReportDialoutExport';
        data.user = session.user._id;
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'exportDialoutTime',Query:data}
        };
        DS.send(action,function(rep) {
            if(rep.Succeed){
                downloadFile(rep.path);
            }else{
                alert('导出失败！');
            }
        });
    }
    ,exportDialoutAreaExcel: function(data) {
        data.accountId = session.user.account;
        data.type = 'ReportDialoutAreaExport';
        data.user = session.user._id;
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'ReportDialoutAreaExport',Query:data}
        };
        DS.send(action,function(rep) {
            if(rep.Succeed){
                downloadFile(rep.path);
            }else{
                alert('导出失败！');
            }
        });
    }
    ,exportRelayAreaExcel : function(data) {
        data.accountId = session.user.account;
        data.type = 'ReportRelayAreaExport';
        data.user = session.user._id;
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'ReportRelayAreaExport',Query:data}
        };
        DS.send(action,function(rep) {
            if(rep.Succeed){
                downloadFile(rep.path);
            }else{
                alert('导出失败！');
            }
        });
    }
    ,exportRelayAreaCityExcel : function(data) {
        data.accountId = session.user.account;
        data.type = 'ReportRelayAreaCityExport';
        data.user = session.user._id;
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'ReportRelayAreaCityExport',Query:data}
        };
        DS.send(action,function(rep) {
            if(rep.Succeed){
                downloadFile(rep.path);
            }else{
                alert('导出失败！');
            }
        });
    }
    ,exportAgentExcel: function(data){
        data.accountId = session.user.account;
        data.type = 'agentExport';
        data.dataDB = session.account.dataDB;
        data.user = session.user._id;
        data.userType = session.user.type;
        data.pbx = session.user.pbx;
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'exportAgent',Query:data}
        };
        DS.send(action,function(rep) {
            if(rep.Succeed){
                downloadFile(rep.path);
            }else{
                alert('导出失败！');
            }
        });
    },

    exportReportImMessage: function(data){
        $('#show_confirm_export_report_pdf').modal('hide');
        var newWin = window.open(data.pdf_title, 'report_export_pdf_show_print', "");
        var chartHTML = document.getElementById("im_report_message_highcharts_container").innerHTML;
        var chartHTML1 = document.getElementById("im_report_message_highcharts_container_Y").innerHTML;
        var tableHTML = document.getElementById("im_report_message_table").innerHTML;
        newWin.document.write('<style type="text/css">table{border-collapse:collapse}td{ border:1px solid #999999}th{ border:1px solid #999999}</style>');
        newWin.document.write('<center><h3>' + data.pdf_title + '</h3></center>');
        newWin.document.write("<div style='width: 600px;'>"+chartHTML+"</div>");
        newWin.document.write(chartHTML1);
        newWin.document.write(tableHTML);
        newWin.document.location.reload();
        newWin.print();
    },
    exportReportImAgent: function(data){
        $('#show_confirm_export_report_pdf').modal('hide');
        var newWin = window.open(data.pdf_title, 'report_export_pdf_show_print', "");
        var chartHTML = document.getElementById("im_report_agent_highcharts_container").innerHTML;
        var tableHTML = document.getElementById("im_report_agent_table").innerHTML;
        newWin.document.write('<style type="text/css">table{border-collapse:collapse}td{ border:1px solid #999999}th{ border:1px solid #999999}</style>');
        newWin.document.write('<center><h3>' + data.pdf_title + '</h3></center>');
        newWin.document.write(chartHTML);
        newWin.document.write(tableHTML);
        newWin.document.location.reload();
        newWin.print();
    },
    exportReportImBusiness: function(data){
        $('#show_confirm_export_report_pdf').modal('hide');
        var newWin = window.open(data.pdf_title, 'report_export_pdf_show_print', "");
        var chartHTML = document.getElementById("im_report_business_highcharts_container").innerHTML;
        var tableHTML = document.getElementById("im_report_business_table").innerHTML;
        newWin.document.write('<style type="text/css">table{border-collapse:collapse}td{ border:1px solid #999999}th{ border:1px solid #999999}</style>');
        newWin.document.write('<center><h3>' + data.pdf_title + '</h3></center>');
        newWin.document.write(chartHTML);
        newWin.document.write(tableHTML);
        newWin.document.location.reload();
        newWin.print();
    },
    exportReportCustomerIncrease : function(data){
        $('#show_confirm_export_report_pdf').modal('hide');
        var newWin = window.open(data.pdf_title, 'report_export_pdf_show_print', "");
        var chartHTML = document.getElementById("customer_report_increase_highcharts_container").innerHTML;
        var tableHTML = document.getElementById("customer_report_increase_table").innerHTML;
        newWin.document.write('<style type="text/css">table{border-collapse:collapse}td{ border:1px solid #999999}th{ border:1px solid #999999}</style>');
        newWin.document.write('<center><h3>' + data.pdf_title + '</h3></center>');
        newWin.document.write(chartHTML);
        newWin.document.write(tableHTML);
        newWin.document.location.reload();
        newWin.print();
    },
    exportReportSaleAgent : function(data){
        $('#show_confirm_export_report_pdf').modal('hide');
        var newWin = window.open(data.pdf_title, 'report_export_pdf_show_print', "");
        var chartHTML = document.getElementById("customer_report_sale_agent_highcharts_container").innerHTML;
        var tableHTML = document.getElementById("customer_report_sale_agent_table").innerHTML;
        newWin.document.write('<style type="text/css">table{border-collapse:collapse}td{ border:1px solid #999999}th{ border:1px solid #999999}</style>');
        newWin.document.write('<center><h3>' + data.pdf_title + '</h3></center>');
        newWin.document.write(chartHTML);
        newWin.document.write(tableHTML);
        newWin.document.location.reload();
        newWin.print();
    },

    exportReportSale : function(data){
        $('#show_confirm_export_report_pdf').modal('hide');
        var newWin = window.open(data.pdf_title, 'report_export_pdf_show_print', "");
        var chartHTML = document.getElementById("customer_report_sale_highcharts_container").innerHTML;
        var tableHTML = document.getElementById("customer_report_sale_table").innerHTML;
        newWin.document.write('<style type="text/css">table{border-collapse:collapse}td{ border:1px solid #999999}th{ border:1px solid #999999}</style>');
        newWin.document.write('<center><h3>' + data.pdf_title + '</h3></center>');
        newWin.document.write(chartHTML);
        newWin.document.write(tableHTML);
        newWin.document.location.reload();
        newWin.print();
    },
    exportReportCommon : function(data){
        $('#show_confirm_export_report_pdf').modal('hide');
        var newWin = window.open(data.pdf_title, 'report_export_pdf_show_print', "");
        var chartHTML = document.getElementById("customer_report_common_highcharts_container").innerHTML;
        var tableHTML = document.getElementById("customer_report_common_table").innerHTML;
        newWin.document.write('<style type="text/css">table{border-collapse:collapse}td{ border:1px solid #999999}th{ border:1px solid #999999}</style>');
        newWin.document.write('<center><h3>' + data.pdf_title + '</h3></center>');
        newWin.document.write(chartHTML);
        newWin.document.write(tableHTML);
        newWin.document.location.reload();
        newWin.print();
    },
    exportReportCommonAgent : function(data){
        $('#show_confirm_export_report_pdf').modal('hide');
        var newWin = window.open(data.pdf_title, 'report_export_pdf_show_print', "");
        var chartHTML = document.getElementById("customer_report_common_agent_highcharts_container").innerHTML;
        var tableHTML = document.getElementById("customer_report_common_agent_table").innerHTML;
        newWin.document.write('<style type="text/css">table{border-collapse:collapse}td{ border:1px solid #999999}th{ border:1px solid #999999}</style>');
        newWin.document.write('<center><h3>' + data.pdf_title + '</h3></center>');
        newWin.document.write(chartHTML);
        newWin.document.write(tableHTML);
        newWin.document.location.reload();
        newWin.print();
    },
    exportReportBusinessAnalyse : function(data){
        $('#show_confirm_export_report_pdf').modal('hide');
        var newWin = window.open(data.pdf_title, 'report_export_pdf_show_print', "");
        var chartHTML = document.getElementById("business_report_analyse_highcharts_container").innerHTML;
        var tableHTML = document.getElementById("business_report_analyse_table").innerHTML;
        newWin.document.write('<style type="text/css">table{border-collapse:collapse}td{ border:1px solid #999999}th{ border:1px solid #999999}</style>');
        newWin.document.write('<center><h3>' + data.pdf_title + '</h3></center>');
        newWin.document.write(chartHTML);
        newWin.document.write(tableHTML);
        newWin.document.location.reload();
        newWin.print();
    },
    exportReportBusinessAgent : function(data){
        $('#show_confirm_export_report_pdf').modal('hide');
        var newWin = window.open(data.pdf_title, 'report_export_pdf_show_print', "");
        var chartHTML = document.getElementById("business_report_agent_highcharts_container").innerHTML;
        var tableHTML = document.getElementById("business_report_agent_table").innerHTML;
        newWin.document.write('<style type="text/css">table{border-collapse:collapse}td{ border:1px solid #999999}th{ border:1px solid #999999}</style>');
        newWin.document.write('<center><h3>' + data.pdf_title + '</h3></center>');
        newWin.document.write(chartHTML);
        newWin.document.write(tableHTML);
        newWin.document.location.reload();
        newWin.print();
    },
    exportReportCustomerStatus : function(data){
        $('#show_confirm_export_report_pdf').modal('hide');
        var newWin = window.open(data.pdf_title, 'report_export_pdf_show_print', "");
        var chartHTML = document.getElementById("customer_report_status_highcharts_container").innerHTML;
        var tableHTML = document.getElementById("customer_report_status_table").innerHTML;
        newWin.document.write('<style type="text/css">table{border-collapse:collapse}td{ border:1px solid #999999}th{ border:1px solid #999999}</style>');
        newWin.document.write('<center><h3>' + data.pdf_title + '</h3></center>');
        newWin.document.write(chartHTML);
        newWin.document.write(tableHTML);
        newWin.document.location.reload();
        newWin.print();
    },
    reportSort: function(data,key){
        data.sort(function (a, b) {
            if (a[key] > b[key]) {
                return 1;
            } else if (a[key] == b[key]) {
                return 0;
            } else {
                return -1;
            }
        });
        return data;
    }
}
