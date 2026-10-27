handler.customer.task.report={

    //计算拨打统计
    calculateNum:function(type,num1,num2){
        var num1=parseInt(num1) || 0;
        var num2=parseInt(num2) || 0;
        if(type=="noCall" || type=="noLink"){
            return num1-num2;
        }else if(type=="finishRate" || type=="linkRate"){
            var GetPercent=function(total,num ) {
                num = parseFloat(num);
                total = parseFloat(total);
                if (isNaN(num) || isNaN(total)) {
                    return "-";
                }
                return total <= 0 ? "0%" : (Math.round(num / total * 10000) / 100.00 + "%");
            }
            return GetPercent(num1,num2);
        }
    },
    whetherToRemove:function(rTime,st,rData){
        if(st==="normal"){
            var html =  "<a href='#' class='ds_do_action' ds_action='customer.task.removeDialTaskAgent' ds_data='"+rData+"'>移除座席</a>"
            return html;
        }else if(st==="remove"){
            var html =  rTime+"被移除";
            return html;
        }
    },

    call_report_relay_time: function (data) {
        var sendData = {
            reportType: 'call_report_relay_time'
        };
        var groupName = "ReportTime";
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
            seriesArray.push({name: '参与座席',data:new Array(),valueName: 'VoicemailCount'});
            seriesArray.push({name: '已拨打',data:new Array(),valueName: 'AccessCount'});
            seriesArray.push({name: '已接听',data:new Array(),valueName: 'DealingCount'});
            seriesArray.push({name: '接听率',data:new Array(),valueName: 'NotDealCount'});
            seriesArray.push({name: '单日的工作量',data:new Array(),valueName: 'QueueLeakCount'});
            seriesArray.push({name: '参与时间',data:new Array(),valueName: 'LeakCount'});
            handler.customer.task.report.initTimeHighCharts('call_report_relay_time_highcharts_container',datas,seriesArray,groupName);
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
    }
}


