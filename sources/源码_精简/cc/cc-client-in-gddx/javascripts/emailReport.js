handler.report.mail = {
    mail_report_main: function (menu) {
        var pane = $("#view_" + menu);
        var menus = [
            'mail_report_agent',
        ];
        for (var i = 0; i < menus.length; i++) {
            if (!isHasMenu(menus[i])) {
                pane.find(".sub-nav>.tab_" + menus[i]).remove();
            } else {
                pane.find(".sub-nav>.tab_" + menus[i]).show();
            }
        }
        pane.find(".sub-nav").find("li:first>a").click();
    },
    mail_report_agent:function(data){
        var sendData = {
            reportType: 'mail_report_agent',
            account: session.user.account
        };
        var timeType = $('#mail_report_agent_time_type');
        if (data != 'mail_report_agent') {
            sendData.query = data;
            //格式化日期条件
            timeType.val(data.timeType);
            handler.report.callReport.resetDate('mail_report_agent_dateTd', data.timeType, data);
        } else {
            timeType.val('day');
            handler.report.callReport.resetDate('mail_report_agent_dateTd', timeType.val());
            sendData.query = {
                timeType: timeType.val(),
                yearReport: $('#mail_report_agent_dateTd .yearReport').val(),
                monthReport: $('#mail_report_agent_dateTd .monthReport').val(),
                dayReport: $('#mail_report_agent_dateTd .dayReport').val(),
            }
        }
        var groupName = "agentName";
        var userCondition = {type: session.user.type,moduleUsers: session.user.moduleUsers}
        sendData.user = userCondition;
        var action = {
            action: 'mailReport.queryMailAgentReport',
            data: sendData
        };

        DS.util.sendActionWithUrl(DS._ds_report_url ,action, function (res) {
            if (!res.success) {
                alert('获取失败！');
            }

            var headerConfig = res.tableHeader.Config;
            var agents = res.agents;
            var datas = res.data;
            for (var i = 0; i < agents.length; i++) {
                for (var j = 0; j < datas.length; j++) {
                    if (agents[i]._id === datas[j].agentId) {
                        datas[j].agentName = agents[i].displayName+'['+agents[i].exten+']';
                    }
                }
            }
            //生成合计
            if (datas.length > 0) {
                datas.push(handler.report.mail.mailReportGenerateTotal(headerConfig,datas,groupName, "mail_report_agent"));
            }

            //生成表格内容
            var dataHtml = '';

            for (var i = 0; i < datas.length; i++) {
                var oneRow = '<tr>';
                for (var j = 0; j < headerConfig.length; j++) {
                    if (headerConfig[j].show === true) {
                        if (headerConfig[j].name === 'agentName' && datas[i][groupName] != "合计") {
                            oneRow += '<td>' + datas[i][groupName] + '</td>';
                        } else if (headerConfig[j].name === 'agentName' && datas[i][groupName] === "合计") {
                            oneRow += '<td sort_exclude="true">合计</td>';
                        } else if (headerConfig[j].name.slice(-6) === 'Length' || headerConfig[j].name.slice(-6) === 'LENGTH'
                            || headerConfig[j].name.slice(-3) === 'Avg') {
                            oneRow += '<td>' + handler.report.callReport.formatTime(datas[i][headerConfig[j].name]) + '</td>';
                            //datas[i][headerConfig[j].name] = handler.report.callReport.formatTime(datas[i][headerConfig[j].name]);
                            //oneRow += '<td>' + datas[i][headerConfig[j].name] + '</td>';
                        } else if (headerConfig[j].name.slice(-4) === 'Rate') {
                            //datas[i][headerConfig[j].name] = datas[i][headerConfig[j].name] + "%";
                            oneRow += '<td>' + datas[i][headerConfig[j].name] + '%</td>';
                        } else {
                            oneRow += '<td>' + datas[i][headerConfig[j].name] + '</td>';
                        }
                    }
                }
                oneRow += '</tr>';
                dataHtml += oneRow;
            }
            headerConfig.tableType = 'mail_report_agent';
            $('#mailReportAgentTableHeader').html(handler.report.callReport.renderTableHeader(headerConfig));
            $('#mailReportAgentTableTbody').html(dataHtml);

            var seriesArray = new Array();
            seriesArray.push({name: '邮件回复数', data: new Array(), valueName: 'replyCount'});
            seriesArray.push({name: '邮件会话接入数', data: new Array(), valueName: 'sessionAccessCount'});
            seriesArray.push({name: '邮件会话转入数', data: new Array(), valueName: 'sessionRollInCount'});
            seriesArray.push({name: '邮件会话完成数', data: new Array(), valueName: 'sessionCompleteCount'});
            //seriesArray.push({name: '会话完成率', data: new Array(), valueName: 'sessionCompleteRate'});
            seriesArray.push({name: '邮件会话转出数', data: new Array(), valueName: 'sessionRollOutCount'});
            //seriesArray.push({name: '会话转出率', data: new Array(), valueName: 'sessionRollOutRate'});
            seriesArray.push({name: '邮件会话平均时长', data: new Array(), valueName: 'sessionAverageTimeLength'});
            seriesArray.push({name: '平均首次响应时长', data: new Array(), valueName: 'averageFirstResponseTimeLength'});
            seriesArray.push({name: '开启领取时长', data: new Array(), valueName: 'mailAutoClaimOpenTimeLength'});
            seriesArray.push({name: '关闭领取时长', data: new Array(), valueName: 'mailAutoClaimCloseTimeLength'});
            //seriesArray.push({name: '满意度', data: new Array(), valueName: 'satisfactionPercent'});

            handler.report.mail.initHighChat(function(){
                handler.report.mail.generateMailReportHighChats('mail_report_agent_highcharts_container',datas,seriesArray,null,'mail_report_agent');
            });
        });
    },
    initHighChat: function(callback){
        if(!window.Highcharts){
            var oHead = document.getElementsByTagName('HEAD').item(0);
            var oScript= document.createElement("script");
            oScript.type = "text/javascript";
            oScript.src="./javascripts/highcharts.js";
            oHead.appendChild( oScript);
            if (!/*@cc_on!@*/0) { //if not IE
                //Firefox2、Firefox3、Safari3.1+、Opera9.6+ support js.onload
                oScript.onload = callback;
            } else {
                //IE6、IE7、IE8 support js.onreadystatechange
                oScript.onreadystatechange = function () {
                    if (oScript.readyState == 'loaded' || oScript.readyState == 'complete') {
                        callback();
                    }
                }
            }
        }else{
            callback();
        }
    },
    generateMailReportHighChats: function(container, datas, seriesArray,seriesArray2,xName, groupName){
        var xArray = new Array();
        var titleText = "";
        var labels = {};
        if(xName == 'mail_report_agent'){
            titleText = '邮件座席工作量报表';
            for(var i = 0 ; i < datas.length -1; i++){
                xArray.push(datas[i].agentName);
                for(var j=0 ; j < seriesArray.length ; j++){
                    seriesArray[j]['data'].push(datas[i][seriesArray[j].valueName])
                }
            }
            if(datas.length>15){
                labels = {
                    rotation: -45,
                    align: 'right',
                    style: {
                        fontSize: '13px',
                        fontFamily: 'Verdana, sans-serif'
                    }
                }
            }

        }
        $('#' + container).highcharts({
            chart: {
                type: 'column'
            },
            title: {
                text: titleText
            },
            subtitle: {
                text: ''
            },
            yAxis: {
                min: 0,
                title: {
                    text: ''
                },
                allowDecimals: false,
                showEmpty:false
            },
            xAxis: {
                categories: xArray,
                labels: labels
            },
            tooltip: {
                formatter: function () {
                    var s = '<span style="font-size:10px">' + this.x + '</span><table>';

                    $.each(this.points, function () {
                        var unit = "";
                        if(this.series.name.slice(-2) == "时长"){
                            unit = "s";
                        }else if(this.series.name.slice(-1) == "率"){
                            unit = "%";
                        }
                        s += '<tr><td style="color:'+this.series.color+';padding:0">' + this.series.name + ': </td><td style="padding:0"><b>' +
                            this.y + '' +unit+ "</b></td></tr>";
                    });
                    s+='</table>'
                    return s;
                },
                shared: true,
                useHTML: true
            },

            series: seriesArray
        });
    },
    mailReportGenerateTotal : function(headerConfig,datas,groupName, type){
        var total = {};
        total[groupName] = '合计';
        if(type && type == "mail_report_agent"){
            total.sessionTotalTimeLength = 0;
            total.firstResponseTotalTimeLength = 0;
            total.responseTotalCount = 0;
        }

        for(var i=0 ; i < headerConfig.length ; i++){
            for(var j=0 ; j < datas.length ; j++){
                if(!isNaN(datas[j][headerConfig[i].name])){
                    if((headerConfig[i].name in total) === false){
                        total[headerConfig[i].name] = 0;
                    }
                    total[headerConfig[i].name] += datas[j][headerConfig[i].name];
                }
                if(type && type == "mail_report_agent"){
                    if(headerConfig[i].name == "sessionAverageTimeLength"){
                        total.sessionTotalTimeLength += datas[j]["sessionTotalTimeLength"];
                    }else if(headerConfig[i].name == "averageFirstResponseTimeLength"){
                        total.firstResponseTotalTimeLength += datas[j]["firstResponseTotalTimeLength"];
                        total.responseTotalCount +=  datas[j]["responseTotalCount"];
                    }
                }
            }
        }
        if(type && type == "mail_report_agent"){
            if((total.sessionCompleteCount+ total.sessionRollOutCount) > 0){
                total.sessionAverageTimeLength = Math.round(total.sessionTotalTimeLength / (total.sessionCompleteCount+ total.sessionRollOutCount));
            }else{
                total.sessionAverageTimeLength = 0;
            }
            if(total.sessionAccessCount+ total.sessionRollInCount > 0){
                total.sessionCompleteRate = Math.round(((total.sessionCompleteCount+total.sessionRollOutCount) / (total.sessionAccessCount + total.sessionRollInCount)) * 100);
            }else{
                total.sessionCompleteRate = 0;
            }

            if(total.sessionAccessCount>0){
                total.sessionRollOutRate = Math.round((total.sessionRollOutCount / total.sessionAccessCount) * 100);

            }else{
                total.sessionRollOutRate = 0;
            }
            if(total.responseTotalCount > 0){
                total.averageFirstResponseTimeLength = Math.round(total.firstResponseTotalTimeLength / total.responseTotalCount);
            }else{
                total.averageFirstResponseTimeLength = 0;
            }
        }
        return total;
    },
    exportMailAgentExcel: function(data){
        data.accountId = session.user.account;
        data.type = 'mailAgentExport';
        data.user = session.user._id;
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'exportMailAgent',Query:data}
        };
        DS.send(action,function(rep) {
            if(rep.Succeed){
                downloadFile(rep.path);
            }else{
                alert('导出失败！');
            }
        });
    }
}