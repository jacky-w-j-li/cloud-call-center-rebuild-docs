handler.report.customer = {
    customer_report_main:function(menu){
        var pane=$("#view_"+menu);
        var menus = [
            'customer_report_increase',
            'customer_report_status',
            'customer_report_sale_agent',
            'customer_report_sale'
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

    sortByDate:function(data, key, dateFormat){
        data.sort(function (a, b) {
            if (handler.report.customer.getMillSeconds(a[key], dateFormat) > handler.report.customer.getMillSeconds(b[key], dateFormat)) {
                return 1;
            } else if (handler.report.customer.getMillSeconds(a[key], dateFormat) == handler.report.customer.getMillSeconds(b[key], dateFormat)) {
                return 0;
            } else {
                return -1;
            }
        });
        return data;
    },

    getMillSeconds: function(value, formatStr){
        var tmpValue = "";
        if(formatStr == "yyyyMMdd"){
            tmpValue = value.substr(0, 4) + "-" + value.substr(4, 2)+"-" + value.substr(6);
        }else if(formatStr == "yyyyMM"){
            tmpValue = value.substr(0, 4) + "-" + value.substr(4);
        }
        return Date.parse(tmpValue);
    },
    customer_report_increase : function(data , src){
        var timeType = $('#customer_report_increase_time_type');
        if(data != "customer_report_increase"){
            var sources = getCache('custTmpls')[0].source || [];
            var keys = [];
            for(var i=0;i<sources.length;i++){
                keys.push(sources[i].key);
            }
            var action = {
                action : "customerReport.queryCustomerIncreaseReport",
                data : {
                    account: session.user.account,
                    query : data,
                    keys : keys
                }
            };
            DS.util.sendActionWithUrl(DS._ds_report_url, action, function(res){
                if (!res.success) {
                    alert('获取失败！');
                }
                //console.log(res);
                var datas = handler.report.customer.sortByDate(res.data,timeType.val() ==  "month"? "day":"day", timeType.val() ==  "month"? "yyyyMMdd":"yyyyMM");
                //生成表头
                var renderData = {
                    data : datas,
                    sources : sources
                };
                $('#customerReportIncreaseTableHeader').html(template('customer_increase_table_header',renderData));
                $('#customerReportIncreaseTableTbody').html(template('customer_increase_table_body',renderData));

                //生成图标
                var seriesArray = [];
                for(var i=0;i< sources.length;i++){
                    seriesArray.push({name: sources[i].name,data:[],valueName: sources[i].key});
                }
                seriesArray.push({name: '未知来源',data:[],valueName: 'unknow'});
                handler.report.customer.initTimeHighCharts('customer_report_increase_highcharts_container',datas,seriesArray,"day");

            });

        } else {
            timeType.val("month");
            handler.report.callReport.resetDate('customer_report_increase_dateTd', timeType.val());
            $("#customer_report_increase_btn").click();
        }
    },
    exportCustomerIncreaseExcel : function(data){
        data.accountId = session.user.account;
        data.type = 'customerIncreaseExport';
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'exportCustomerIncrease',Query:data}
        };
        DS.send(action,function(rep) {
            if(rep.Succeed){
                downloadFile(rep.path);
            }else{
                alert('导出失败！');
            }
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
                    handler.report.customer.generateTimeHighCharts(containerId,datas,seriesArray,xName);
                }
            } else {
                //IE6、IE7、IE8 support js.onreadystatechange
                oScript.onreadystatechange = function () {
                    if (oScript.readyState == 'loaded' || oScript.readyState == 'complete') {
                        handler.report.customer.generateTimeHighCharts(containerId,datas,seriesArray,xName);
                    }
                }
            }
        }else{
            handler.report.customer.generateTimeHighCharts(containerId,datas,seriesArray,xName);
        }
    },
    generateTimeHighCharts : function(containerId,datas,seriesArray,xName){
        var xArray = new Array();
        var titleText = '客户增长来源时间趋势';
        for(var i = 0 ; i < datas.length  ; i++){
            xArray.push(datas[i][xName]);

            for(var j=0 ; j < seriesArray.length ; j++){
                seriesArray[j]['data'].push(datas[i][seriesArray[j].valueName] > 0? datas[i][seriesArray[j].valueName] : 0);
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

    customer_report_status : function(data , src){
        if(data != "customer_report_status"){
            var status = getCache('custTmpls')[0].status || {};
            var keys = [];
            for(var obj in status){
                keys.push(obj);
            }
            var action = {
                action : "customerReport.queryCustomerStatusReport",
                data : {
                    account: session.user.account
                }
            };
            DS.util.sendActionWithUrl(DS._ds_report_url, action, function(res){
                if (!res.success) {
                    $().alertmessage('showError', errMsg);
                    return;
                }
                //console.log(res);
                var list=res.list||[];
                for (var i = 0; i < list.length; i++) {
                    var obj1 = list[i];
                    var uid=obj1.user||"NA";
                    var agent=getCache("agents",uid);
                    var agentName="无归属";
                    if(agent){
                        agentName=agent.displayName;
                    }
                    obj1.agentName=agentName;
                }
                //生成表头
                var renderData = {
                    data : list,
                    status : status
                };
                $('#customerReportStatusTableHeader').html(template('customer_status_table_header',renderData));
                $('#customerReportStatusTableTbody').html(template('customer_status_table_body',renderData));

                //生成图标
                var seriesArray = [];
                for(var i in status){
                    seriesArray.push({name: status[i],data:[],valueName: i});
                }
                handler.report.customer.initStatusCharts('customer_report_status_highcharts_container',list,seriesArray,"agentName");

            });

        } else {
            $("#customer_report_status_btn").click();
        }
    },

    initStatusCharts : function(containerId,datas,seriesArray,xName){
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
                    handler.report.customer.generateStatusHighCharts(containerId,datas,seriesArray,xName);
                }
            } else {
                //IE6、IE7、IE8 support js.onreadystatechange
                oScript.onreadystatechange = function () {
                    if (oScript.readyState == 'loaded' || oScript.readyState == 'complete') {
                        handler.report.customer.generateStatusHighCharts(containerId,datas,seriesArray,xName);
                    }
                }
            }
        }else{
            handler.report.customer.generateStatusHighCharts(containerId,datas,seriesArray,xName);
        }
    },
    generateStatusHighCharts : function(containerId,datas,seriesArray,xName){
        var xArray = new Array();
        var titleText = '座席客户状态分布趋势';
        for(var i = 0 ; i < datas.length  ; i++){
            xArray.push(datas[i][xName]);
            for(var j=0 ; j < seriesArray.length ; j++){
                seriesArray[j]['data'].push(datas[i][seriesArray[j].valueName] > 0? datas[i][seriesArray[j].valueName] : 0);
            }
        }
        if(datas.length==0){
            seriesArray = [];
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
                    text: '数量 (个)'
                },
                stackLabels: {
                    enabled: true,
                    style: {
                        fontWeight: 'bold',
                        color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
                    }
                }
            },
            tooltip: {
                formatter: function() {
                    return '<b>'+ this.x +'</b><br/>'+
                        this.series.name +': '+ this.y +'<br/>'+
                        '总数: '+ this.point.stackTotal;
                }
            },
            plotOptions: {
                column: {
                    stacking: 'normal',
                    dataLabels: {
                        enabled: true,
                        color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white'
                    }
                }
            },

            //legend: {
            //    align: 'right',
            //    x: -70,
            //    verticalAlign: 'top',
            //    y: 20,
            //    floating: true,
            //    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColorSolid) || 'white',
            //    borderColor: '#CCC',
            //    borderWidth: 1,
            //    shadow: false
            //},
            exporting:{
                enabled : false//暂时关闭了，图表导出功能
            },
            series: seriesArray
        });
    },
    exportCustomerStatusExcel : function(data){
        data.accountId = session.user.account;
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'exportCustomerStatus',Query:data}
        };
        DS.send(action,function(rep) {
            if(rep.Succeed){
                downloadFile(rep.path);
            }else{
                alert('导出失败！');
            }
        });
    },

    getUserName: function (agentID) {
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
    calculateNum:function(type,num1,num2,num3,num4,agentType){
        if(type=="invalidRate" || type=="dealRate" || type=="lostRate"){
            var num1=parseInt(num1) || 0;
            var num2=parseInt(num2) || 0;
            var GetPercent=function(total,num,num3,num4 ) {
                num = parseFloat(num);
                total = parseFloat(total);
                num3 = parseFloat(num3);
                num4 = parseFloat(num4);
                if (isNaN(num) || isNaN(total)) {
                    return "-";
                }
                if(num>total){
                    return "100%";
                }else{
                    if(agentType=="agent"){
                        total = total+num3+num4;
                    }
                    return total <= 0 ? "0%" : (Math.round(num / total * 10000) / 100.00 + "%");
                }
            }
            return GetPercent(num1,num2,num3,num4);
        }else if(type=="aveRate") {
            var GetPercent=function(total,num ) {
                num = parseFloat(num);
                total = parseFloat(total);
                total = Math.round(total)/10000;
                if (isNaN(num) || isNaN(total)) {
                    return "-";
                }
                return num<=0 ? "0" : (Math.round(total/num*100)/100.00);
            }
            return GetPercent(num1,num2);
        }else if(type=="moneyRate"){
            var num1 = parseFloat(num1);
            return num1<=0?"0":Math.round(num1)/10000;
        }
    },

    _initSaleAgentNullFields:function(item){
        if(!item.deal){
            item.deal=0;
        }
        if(!item.lost){
            item.lost=0;
        }
        if(!item.invalid){
            item.invalid = 0;
        }
        if(!item.money){
            item.money = 0;
        }
        if(!item.assign){
            item.assign=0;
        }
        if(!item.assignOut){
            item.assignOut=0;
        }
        if(!item.selfCreate){
            item.selfCreate = 0;
        }
        if(!item.claim){
            item.claim = 0;
        }
        if(!item.recycle){
            item.recycle = 0;
        }
        if(!item.del){
            item.del = 0;
        }
        if(!item.total){
            item.total = 0;
        }
        if(!item.day){
            item.day = "";
        }
    },
    JudgeTime:function(flag,menu){
        var startTime =$("#"+menu+"").find($(".report_start_time")).val().replace(/-/g,'').replace(/:/g,'').replace(/\s/g,"");
        var endTime = $("#"+menu+"").find($(".report_end_time")).val().replace(/-/g,'').replace(/:/g,'').replace(/\s/g,"");
        if($("#"+menu+"").css('display') == 'inline'){
            if(startTime == ""){
                $().alertmessage('showError', '开始时间不能为空');
                return flag = true;
            }else if(endTime == ""){
                $().alertmessage('showError', '结束时间不能为空');
                return flag = true;
            }else if(startTime>endTime){
                $().alertmessage('showError', '开始时间必须小于结束时间');
                return flag = true;
            }else if(startTime == endTime){
                $().alertmessage('showError', '开始时间不能等于结束时间');
                return flag = true;
            };
        };
    },
    customer_report_sale_agent : function(data, src){
        var flag = false;
        if(handler.report.customer.JudgeTime(flag,"customer_report_sale_agent_dateTd_other")){
            return;
        };
        var timeType = $('#customer_report_sale_agent_time_type');
        if(data != "customer_report_sale_agent"){
            var userCondition = {type: session.user.type,moduleUsers: session.user.moduleUsers}
            var action = {
                action : "customerReport.queryCustomerSaleAgentReport",
                data : {
                    account: session.user.account,
                    user : userCondition,
                    query : data,
                }
            };
            DS.util.sendActionWithUrl(DS._ds_report_url, action, function(res){
                if (!res.success) {
                    alert('获取失败！');
                }
                var datas = res.data;
                var selectedAgentList = '';
                if(data.selectedAgentList){
                    selectedAgentList  = data.selectedAgentList;
                }
                if(datas.length==0){
                    if(selectedAgentList!=''){
                       var index  = selectedAgentList.indexOf(",");
                        if(index==-1){
                            $().alertmessage('showError','该座席未参与过任何商机,所以未能统计出报表数据')
                        }else{
                            $().alertmessage('showError','未查询到报表数据');
                        }
                    }else{
                        $().alertmessage('showError','未查询到报表数据');
                    }
                }
                var saleAgentListPane = $('#customerReportSaleAgentTableTbody');
                var html = [];
                DS.getView('report/customer/customer_report_sale_agent_list_item', function (view) {
                    for (var i = 0; i < datas.length; i++) {
                        var _obj=datas[i];
                        handler.report.customer._initSaleAgentNullFields(_obj);
                        html.push(DS.renderMethodViewNew(view,_obj));
                    }
                    saleAgentListPane.html(html.join(""));
                });
                //生成图标
                var seriesArray = [];
                seriesArray.push({name: '商机数',data:new Array(),valueName: 'total'});
                seriesArray.push({name: '成单数',data:new Array(),valueName: 'deal'});
                seriesArray.push({name: '无效数',data:new Array(),valueName: 'invalid'});
                seriesArray.push({name: '丢单数',data:new Array(),valueName: 'lost'});
                //seriesArray.push({name: '回款金额',data:new Array(),valueName: 'money'});
                seriesArray.push({name: '回收数',data:new Array(),valueName: 'recycle'});
                handler.report.customer.initSaleAgentHighCharts('customer_report_sale_agent_highcharts_container',datas,seriesArray,"agentName");
            });
        } else {
            timeType.val("all");
            handler.report.callReport.resetDate('customer_report_sale_agent_dateTd', timeType.val());
            $("#customer_report_sale_agent_btn").click();
        }
    },

    initSaleAgentHighCharts : function(containerId,datas,seriesArray,xName){
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
                    handler.report.customer.generateSaleAgentHighCharts(containerId,datas,seriesArray,xName);
                }
            } else {
                //IE6、IE7、IE8 support js.onreadystatechange
                oScript.onreadystatechange = function () {
                    if (oScript.readyState == 'loaded' || oScript.readyState == 'complete') {
                        handler.report.customer.generateSaleAgentHighCharts(containerId,datas,seriesArray,xName);
                    }
                }
            }
        }else{
            handler.report.customer.generateSaleAgentHighCharts(containerId,datas,seriesArray,xName);
        }
    },
    generateSaleAgentHighCharts : function(containerId,datas,seriesArray,xName){
        var xArray = new Array();
        var titleText = '座席商机分析报表';
        for(var i = 0 ; i < datas.length ; i++){
            var da = datas[i];
            var uid=da.user||"NA";
            var agent=getCache("agents",uid);
            //var agentName="公共客户";
            if(agent){
                var agentName=agent.displayName;
                xArray.push(agentName);
            }
            for(var j=0 ; j < seriesArray.length ; j++){
                seriesArray[j]['data'].push(datas[i][seriesArray[j].valueName])
            }
        }
        if(datas.length==0){
            seriesArray = [];
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
                    text: '数量 (个)'
                },
                stackLabels: {
                    enabled: true,
                    style: {
                        fontWeight: 'bold',
                        color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
                    }
                }
            },
            tooltip: {
                headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                '<td style="padding:0"><b>{point.y} 个</b></td></tr>',
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

    exportCustomerSaleAgentExcel : function(data){
        data.accountId = session.user.account;
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'exportCustomerSaleAgent',Query:data}
        };
        DS.send(action,function(rep) {
            if(rep.Succeed){
                downloadFile(rep.path);
            }else{
                alert('导出失败！');
            }
        });
    },

    customer_report_sale : function(data, src){
        var flag = false;
        if(handler.report.customer.JudgeTime(flag,"customer_report_sale_dateTd_other")){
            return;
        };
        var timeType = $('#customer_report_sale_time_type');
        if(data != "customer_report_sale"){
            var action = {
                action : "customerReport.queryCustomerSaleReport",
                data : {
                    account: session.user.account,
                    query : data
                }
            };
            DS.util.sendActionWithUrl(DS._ds_report_url, action, function(res){
                if (!res.success) {
                    alert('获取失败！');
                }
                var datas = handler.report.customer.sortByDate(res.data,timeType.val() ==  "month"? "day":"day", timeType.val() ==  "month"? "yyyyMMdd":"yyyyMM");
                var saleListPane = $('#customerReportSaleTableTbody');
                var html = [];
                DS.getView('report/customer/customer_report_sale_list_item', function (view) {
                    for (var i = 0; i < datas.length; i++) {
                        var _obj=datas[i];
                        handler.report.customer._initSaleAgentNullFields(_obj);
                        html.push(DS.renderMethodViewNew(view,_obj));
                    }
                    saleListPane.html(html.join(""));
                });
                //生成图标
                var seriesArray = [];
                seriesArray.push({name: '商机数',data:new Array(),valueName: 'total'})
                seriesArray.push({name: '成单数',data:new Array(),valueName: 'deal'});
                seriesArray.push({name: '无效数',data:new Array(),valueName: 'invalid'});
                seriesArray.push({name: '丢单数',data:new Array(),valueName: 'lost'});
                //seriesArray.push({name: '回款金额',data:new Array(),valueName: 'money'});
                //seriesArray.push({name: '回收数',data:new Array(),valueName: 'recycle'});
                handler.report.customer.initSaleHighCharts('customer_report_sale_highcharts_container',datas,seriesArray,"day");
            });

        } else {
            timeType.val("day");
            handler.report.callReport.resetDate('customer_report_sale_dateTd', timeType.val());
            $("#customer_report_sale_btn").click();
        }
    },
    initSaleHighCharts : function(containerId,datas,seriesArray,xName){
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
                    handler.report.customer.generateSaleHighCharts(containerId,datas,seriesArray,xName);
                }
            } else {
                //IE6、IE7、IE8 support js.onreadystatechange
                oScript.onreadystatechange = function () {
                    if (oScript.readyState == 'loaded' || oScript.readyState == 'complete') {
                        handler.report.customer.generateSaleHighCharts(containerId,datas,seriesArray,xName);
                    }
                }
            }
        }else{
            handler.report.customer.generateSaleHighCharts(containerId,datas,seriesArray,xName);
        }
    },
    generateSaleHighCharts : function(containerId,datas,seriesArray,xName){
        var xArray = new Array();
        var titleText = '商机分析趋势';
        for(var i = 0 ; i < datas.length  ; i++){
            xArray.push(datas[i][xName]);

            for(var j=0 ; j < seriesArray.length ; j++){
                seriesArray[j]['data'].push(datas[i][seriesArray[j].valueName] > 0? datas[i][seriesArray[j].valueName] : 0);
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

    exportCustomerSaleExcel : function(data){
        data.accountId = session.user.account;
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'exportCustomerSale',Query:data}
        };
        DS.send(action,function(rep) {
            if(rep.Succeed){
                downloadFile(rep.path);
            }else{
                alert('导出失败！');
            }
        });
    },


    ///******************************old
    queryCustStatusReport: function (data, src) {
        var dbType=data.dbType;
        var action = {
            action: "app.report.queryCustStatusReport",
            data: data
        };

        DS.send(action, function (response) {
            if (response.success) {
                var menu = src.attr("menu");
                var data = response.data || [];

                $("#" + menu + "_report_pane").find("table").find("tbody").empty();
                var keys = [];
                for (var i = 0; i < data.length; i++) {
                    var dataItem = data[i];
                    var tr = $("<tr></tr>");
                    var status = getCache('custTmpls', dbType).status;
                    keys.push(dataItem.date);
                    tr.append("<td>" + dataItem.date + "</td>");
                    for (var key in status) {
                        tr.append("<td>" + dataItem[key] + "</td>")
                    }
                    $("#" + menu + "_report_pane").find("table").find("tbody").append(tr);
                }

                customer_report_createPieChart(data[data.length - 1]);
               // customer_report_createLineChart(data, keys);

            } else {
                $().alertmessage('showError', errMsg);
            }
        });
    },
    printReport: function (data, src) {
        var newWin = window.open('report_export_pdf_show_print', 'report_export_pdf_show_print', "");
        var chartHTML = $(src).closest(".customer_report_pane").find(".chart_pane").html();
        var tableHTML = $(src).closest(".customer_report_pane").find(".table_pane").html();
        var css = ".table-bordered{border: 1px solid #dddddd; border-collapse: separate;border-left: 0;-webkit-border-radius: 4px;-moz-border-radius: 4px;border-radius: 4px;}.table {width: 100%;background-color: transparent;border-spacing: 0;}.table thead th{vertical-align: bottom;} .table th,.table td{border-left: 1px solid #dddddd;padding: 4px 5px;font-weight: bold;line-height: 20px;text-align: left;line-height: 20px;vertical-align: top;}.table-striped tbody > tr:nth-child(odd) > td, .table-striped tbody > tr:nth-child(odd) > th {background-color: #f9f9f9;}";
        newWin.document.write('<style type="text/css">' + css + '</style>');
        newWin.document.write('<center><h3>' + "客户报表" + '</h3></center>');
//        console.log(chartHTML);
//        console.log(tableHTML);
        newWin.document.write(chartHTML);
        newWin.document.write(tableHTML);
        newWin.print();
    },
    getCustChanageReport: function (data, src) {
        var dbType=data.dbType;
        var action = {
            action: "app.report.getCustChanageReport",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var menu = src.attr("menu");
                var data = response.list || [];
                var container=$("#" + menu + "_report_pane").find("table").find("tbody");
                container.empty();
                var tmpl="<td>_#agent#_</td><td>_#assign#_</td><td>_#assignOut#_</td><td>_#selfCreate#_</td><td>_#use#_</td><td>_#giveUp#_</td><td>_#delete#_</td>";
                var status = getCache('custTmpls', dbType).status;
                for (var key in status) {
                    tmpl+="<td>_#" + key + "#_</td>";
                }
                for (var i = 0; i < data.length; i++) {
                    var item = data[i];
                    if(item.agent){
                        var tr = $("<tr></tr>");
                        var html=DS.renderViewNew(tmpl,item);
                        tr.append(html);
                        container.append(tr);
                    }
                }
//                customer_report_createPieChart(data[data.length - 1]);
                // customer_report_createLineChart(data, keys);

            } else {
                $().alertmessage('showError', errMsg);
            }
        });
    },
    setCustQueryDate:function(data,src){
        var currentDate=getDateDesc(new Date());
        var _date={};
        if(data=='month'){
            _date=getCurrentMonth(currentDate);
        }else if(data=='lastMonth'){
            _date=getLastMonth(currentDate);
        }else if(data=='week'){
            _date=getCurrentWeek(currentDate);
        }else if(data=='lastWeek'){
            _date=getLastWeek(currentDate);
        }
        var pane=src.closest("#customer_change_report_detail_query_pane");
        pane.find('input[name="beginDate"]').val(_date.start);
        pane.find('input[name="endDate"]').val(_date.end);
    }

}
