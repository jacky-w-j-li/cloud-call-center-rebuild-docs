/**
 * Created by yaxi on 2015-11-12.
 */
handler.report.im = {
    im_report_main: function(menu){
        var pane=$("#view_"+menu);
        var menus = [
            'im_report_msg',
            'im_report_bus',
            'im_report_agent'
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
    //在线客服消息报表
    im_report_message:function(data){
        var sendData = {
            reportType: 'im_report_message',
            account: session.user.account
        };
        var timeType = $('#im_report_message_time_type');
        if (data != 'im_report_message') {
            sendData.query = data;
            //格式化日期条件
            timeType.val(data.timeType);
            handler.report.callReport.resetDate('im_report_message_dateTd', data.timeType, data);
        } else {
            timeType.val('day');
            handler.report.callReport.resetDate('im_report_message_dateTd', timeType.val());
            sendData.query = {
                timeType: timeType.val(),
                yearReport: $('#im_report_message_dateTd .yearReport').val(),
                monthReport: $('#im_report_message_dateTd .monthReport').val(),
                dayReport: $('#im_report_message_dateTd .dayReport').val(),
            }

        }
        var groupName = "platform";


        var action = {
            action: 'imReport.queryImMessageReport',
            data: sendData
        };

        DS.util.sendActionWithUrl(DS._ds_report_url, action, function (res) {
            if (!res.success) {
                if (!res.message || res.message == 'unknow error!') {
                    res.message = '获取失败！';
                }
                alert(res.message);
                return;
            }
            var headerConfig = res.tableHeader.Config;
            var datas = res.data;
            //生成合计
            if (datas.length > 0) {
                if(datas[0].accessId){
                    groupName = "accessId";
                }
                datas.push(handler.report.im.imReportGenerateTotal(headerConfig,datas,groupName, "im_report_message"));
            }
            //生成表格内容
            var dataHtml = '';
            for (var i = 0; i < datas.length; i++) {
                var oneRow = '<tr>';
                for (var j = 0; j < headerConfig.length; j++) {
                    if (headerConfig[j].show === true) {
                        if ((headerConfig[j].name === 'platform'|| headerConfig[j].name === 'accessId') && datas[i][groupName] != "合计") {
                            oneRow += '<td>' + handler.report.im.getXName(datas[i][groupName], groupName) + '</td>';
                        } else if ((headerConfig[j].name === 'platform'|| headerConfig[j].name === 'accessId') && datas[i][groupName] === "合计") {
                            oneRow += '<td sort_exclude="true">合计</td>';
                        } else if (headerConfig[j].name.slice(-6) === 'Length' || headerConfig[j].name.slice(-6) === 'LENGTH'
                            || headerConfig[j].name.slice(-3) === 'Avg') {
                            oneRow += '<td>' + handler.report.callReport.formatTime(datas[i][headerConfig[j].name]) + '</td>';
                        } else if (headerConfig[j].name.slice(-4) === 'Rate') {
                            oneRow += '<td>' + datas[i][headerConfig[j].name] + '%</td>';
                        } else {
                            oneRow += '<td>' + datas[i][headerConfig[j].name] + '</td>';
                        }
                    }
                }
                oneRow += '</tr>';
                dataHtml += oneRow;
            }
            headerConfig.tableType = 'im_report_message';
            $('#imReportMessageTableHeader').html(handler.report.callReport.renderTableHeader(headerConfig));
            $('#imReportMessageTableTbody').html(dataHtml);
            var seriesArray = new Array();
            seriesArray.push({name: '对话数', data: new Array(), valueName: 'sessionCount'});
            seriesArray.push({name: '访客数', data: new Array(), valueName: 'visitorCount'});
            seriesArray.push({name: '消息数', data: new Array(), valueName: 'messageCount'});
            seriesArray.push({name: '对话率', data: new Array(), valueName: 'sessionRate'});
            seriesArray.push({name: '平均对话时长', data: new Array(), valueName: 'averageSessionTimeLength'});
            seriesArray.push({name: '平均首次响应时长', data: new Array(), valueName: 'averageFirstResponseTimeLength'});
            seriesArray.push({name: '机器人处理消息数', data: new Array(), valueName: 'robotMessageCount'});
            seriesArray.push({name: '机器人处理对话数', data: new Array(), valueName: 'robotSessionCount'});


            var seriesArray2 = new Array();
            seriesArray2.push({name: '网站咨询', data: new Array(), valueName: 'pc'});
            seriesArray2.push({name: 'wap站咨询', data: new Array(), valueName: 'wap'});
            seriesArray2.push({name: 'App咨询', data: new Array(), valueName: 'sdk'});
            seriesArray2.push({name: '微信咨询', data: new Array(), valueName: 'weixin'});

            handler.report.im.initHighChat(function(){
                handler.report.im.generateImReportHighChats('im_report_message_highcharts_container',datas,seriesArray,seriesArray2,'im_report_message', groupName);
            });

        });
    },
    //在线客服业务分析报表
    im_report_business:function(data){
        var sendData = {
            reportType: 'im_report_business_analyse',
            account: session.user.account
        };
        var timeType = $('#im_report_business_time_type');
        if (data != 'im_report_business_analyse') {
            sendData.query = data;
            //格式化日期条件
            timeType.val(data.timeType);
            handler.report.callReport.resetDate('im_report_business_dateTd', data.timeType, data);
        } else {
            timeType.val('day');
            handler.report.callReport.resetDate('im_report_business_dateTd', timeType.val());
            sendData.query = {
                timeType: timeType.val(),
                yearReport: $('#im_report_business_dateTd .yearReport').val(),
                monthReport: $('#im_report_business_dateTd .monthReport').val(),
                dayReport: $('#im_report_business_dateTd .dayReport').val(),
            }
        }
        var groupName = "consultType";
        var action = {
            action: 'imReport.queryImBusinessAnalyseReport',
            data: sendData
        };
        DS.util.sendActionWithUrl(DS._ds_report_url, action, function (res) {
            if (!res.success) {
                if (!res.message || res.message == 'unknow error!') {
                    res.message = '获取失败！';
                }
                alert(res.message);
                return;
            }
            var headerConfig = res.tableHeader.Config;
            headerConfig.push({order:6, name:'consultTotal', displayname:'总计', show:true});
            var datas = res.data;
            //生成合计
            if (datas.length > 0) {
                datas.push(handler.report.im.imReportGenerateTotal(headerConfig,datas,groupName, "im_report_business"));
            }
            //生成表格内容
            var dataHtml = '';
            for (var i = 0; i < datas.length; i++) {
                var oneRow = '<tr>';
                for (var j = 0; j < headerConfig.length; j++) {
                    if (headerConfig[j].show === true) {
                        if (headerConfig[j].name === 'consultType' && datas[i][groupName] != "合计") {
                            var key = datas[i][groupName];
                            var value = handler.config.channelDic.getDicMapPath("webchat", key);
                            oneRow += '<td>' + value + '</td>';
                        } else if (headerConfig[j].name === 'consultType' && datas[i][groupName] === "合计") {
                            oneRow += '<td sort_exclude="true">合计</td>';
                        } else if (headerConfig[j].name.slice(-6) === 'Length' || headerConfig[j].name.slice(-6) === 'LENGTH'
                            || headerConfig[j].name.slice(-3) === 'Avg') {
                            oneRow += '<td>' + handler.report.callReport.formatTime(datas[i][headerConfig[j].name]) + '</td>';
                        } else if (headerConfig[j].name.slice(-4) === 'Rate') {
                            oneRow += '<td>' + datas[i][headerConfig[j].name] + '%</td>';
                        } else {
                            oneRow += '<td>' + datas[i][headerConfig[j].name] + '</td>';
                        }
                    }
                }
                oneRow += '</tr>';
                dataHtml += oneRow;
            }
            headerConfig.tableType = 'im_report_business';
            $('#imReportBusinessTableHeader').html(handler.report.callReport.renderTableHeader(headerConfig));
            $('#imReportBusinessTableTbody').html(dataHtml);

            var seriesArray = new Array();
            seriesArray.push({name: '网站咨询', data: new Array(), valueName: 'pc'});
            seriesArray.push({name: 'wap站咨询', data: new Array(), valueName: 'wap'});
            seriesArray.push({name: 'App咨询', data: new Array(), valueName: 'sdk'});
            seriesArray.push({name: '微信咨询', data: new Array(), valueName: 'weixin'});
            seriesArray.push({name: '总计', data: new Array(), valueName: 'consultTotal'});

            var seriesArray2 = new Array();

            handler.report.im.initHighChat(function(){
                handler.report.im.generateImReportHighChats('im_report_business_highcharts_container',datas,seriesArray,seriesArray2,'im_report_business');
            });

        });
    },
    //在线客服座席工作量报表
    im_report_agent:function(data){
        var sendData = {
            reportType: 'im_report_agent',
            account: session.user.account
        };
        var timeType = $('#im_report_agent_time_type');
        if (data != 'im_report_agent') {
            sendData.query = data;
            //格式化日期条件
            timeType.val(data.timeType);
            handler.report.callReport.resetDate('im_report_agent_dateTd', data.timeType, data);
        } else {
            timeType.val('day');
            handler.report.callReport.resetDate('im_report_agent_dateTd', timeType.val());
            sendData.query = {
                timeType: timeType.val(),
                yearReport: $('#im_report_agent_dateTd .yearReport').val(),
                monthReport: $('#im_report_agent_dateTd .monthReport').val(),
                dayReport: $('#im_report_agent_dateTd .dayReport').val(),
            }
        }
        var groupName = "agentName";
        var userCondition = {type: session.user.type,moduleUsers: session.user.moduleUsers};
        sendData.user = userCondition;
        var action = {
            action: 'imReport.queryImAgentReport',
            data: sendData
        };

        DS.util.sendActionWithUrl(DS._ds_report_url, action, function (res) {
            if (!res.success) {
                if (!res.message || res.message == 'unknow error!') {
                    res.message = '获取失败！';
                }
                alert(res.message);
                return;
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
                datas.push(handler.report.im.imReportGenerateTotal(headerConfig,datas,groupName, "im_report_agent"));
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
            headerConfig.tableType = 'im_report_agent';
            $('#imReportAgentTableHeader').html(handler.report.callReport.renderTableHeader(headerConfig));
            $('#imReportAgentTableTbody').html(dataHtml);

            var seriesArray = new Array();
            seriesArray.push({name: '消息回复数', data: new Array(), valueName: 'replyCount'});
            seriesArray.push({name: '接入会话数', data: new Array(), valueName: 'sessionAccessCount'});
            seriesArray.push({name: '转入会话数', data: new Array(), valueName: 'sessionRollInCount'});
            seriesArray.push({name: '完成会话数', data: new Array(), valueName: 'sessionCompleteCount'});
            seriesArray.push({name: '会话完成率', data: new Array(), valueName: 'sessionCompleteRate'});
            seriesArray.push({name: '转出会话数', data: new Array(), valueName: 'sessionRollOutCount'});
            //seriesArray.push({name: '会话转出率', data: new Array(), valueName: 'sessionRollOutRate'});
            seriesArray.push({name: '平均会话时长', data: new Array(), valueName: 'sessionAverageTimeLength'});
            seriesArray.push({name: '平均首次响应时长', data: new Array(), valueName: 'averageFirstResponseTimeLength'});
            //seriesArray.push({name: '满意度', data: new Array(), valueName: 'satisfactionPercent'});

            var seriesArray2 = new Array();
            //
            //seriesArray.push({name: '对话数', data: new Array(), valueName: 'SessionCount'});
            //seriesArray.push({name: '访客数', data: new Array(), valueName: 'VisitorCount'});
            //seriesArray.push({name: '消息数', data: new Array(), valueName: 'MessageCount'});
            //seriesArray.push({name: '对话率', data: new Array(), valueName: 'SessionRate'});
            //seriesArray.push({name: '平均对话时长', data: new Array(), valueName: 'AverageSessionTimeLength'});
            //seriesArray.push({name: '平均首次响应时长', data: new Array(), valueName: 'AverageFirstResponseTimeLength'});
            //seriesArray.push({name: '机器人处理消息数', data: new Array(), valueName: 'RobotMessageCount'});
            //seriesArray.push({name: '机器人处理访客数', data: new Array(), valueName: 'RobotVisitorCount'});

            handler.report.im.initHighChat(function(){
                handler.report.im.generateImReportHighChats('im_report_agent_highcharts_container',datas,seriesArray,seriesArray2,'im_report_agent');
            });

        });
    },
    //在线客服座席满意度报表
    im_report_csr:function(data){
        var sendData = {
            reportType: 'im_report_csr',
            account: session.user.account
        };
        var timeType = $('#im_report_csr_time_type');
        if (data != 'im_report_csr') {
            sendData.query = data;
            //格式化日期条件
            timeType.val(data.timeType);
            handler.report.callReport.resetDate('im_report_csr_dateTd', data.timeType, data);
        } else {
            timeType.val('day');
            handler.report.callReport.resetDate('im_report_csr_dateTd', timeType.val());
            sendData.query = {
                timeType: timeType.val(),
                yearReport: $('#im_report_csr_dateTd .yearReport').val(),
                monthReport: $('#im_report_csr_dateTd .monthReport').val(),
                dayReport: $('#im_report_csr_dateTd .dayReport').val(),
            }
        }
        var groupName = "agentName";

        var userCondition = {type: session.user.type,moduleUsers: session.user.moduleUsers}
        sendData.user = userCondition;
        var action = {
            action: 'imReport.queryImCsrReport',
            data: sendData
        };

        DS.util.sendActionWithUrl(DS._ds_report_url, action, function (res) {
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
                datas.push(handler.report.im.imReportGenerateTotal(headerConfig,datas,groupName, "im_report_csr"));
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
                        } else if (headerConfig[j].name.slice(-4) === 'Rate') {
                            oneRow += '<td>' + datas[i][headerConfig[j].name] + '%</td>';
                        } else {
                            if(headerConfig[j].name.slice(-5) === 'Count'){
                                oneRow += '<td>' + datas[i][headerConfig[j].name] + '</td>';
                            }else{
                                if(datas[i]['totalAppraiseCount'] > 0){
                                    var rate = (datas[i][headerConfig[j].name]*100 / datas[i]['totalAppraiseCount']).toFixed(1);
                                    oneRow += '<td>'+rate+'%</td>';
                                }else{
                                    oneRow += '<td>0.0%</td>';
                                }
                            }


                        }
                    }
                }
                oneRow += '</tr>';
                dataHtml += oneRow;
            }
            headerConfig.tableType = 'im_report_csr';
            $('#imReportCSRTableHeader').html(handler.report.callReport.renderTableHeader(headerConfig));
            $('#imReportCSRTableTbody').html(dataHtml);

            var seriesArray = new Array();
            for(var i = 0;i<headerConfig.length;i++){
                if(headerConfig[i].name == 'agentName'){
                    continue;
                }
                seriesArray.push({name: headerConfig[i].displayname, data: new Array(), valueName: headerConfig[i].name});
            }
            //seriesArray.push({name: '会话总数', data: new Array(), valueName: 'sessionCount'});
            //seriesArray.push({name: '总评价数', data: new Array(), valueName: 'totalAppraiseCount'});
            //seriesArray.push({name: '参评率', data: new Array(), valueName: 'appraiseRate'});

            var seriesArray2 = new Array();
            handler.report.im.initHighChat(function(){
                handler.report.im.generateImReportHighChats('im_report_csr_highcharts_container',datas,seriesArray,seriesArray2,'im_report_csr');
            });

        });
    },
    //会话数时间趋势报表
    im_report_csr_channel:function(data){
        var sendData = {
            reportType: 'im_report_channel_csr',
            account: session.user.account
        };
        var timeType = $('#im_report_csr_channel_time_type');
        if (data != 'im_report_csr_channel') {
            sendData.query = data;
            //格式化日期条件
            timeType.val(data.timeType);
            handler.report.callReport.resetDate('im_report_csr_channel_dateTd', data.timeType, data);
        } else {
            timeType.val('day');
            handler.report.callReport.resetDate('im_report_csr_channel_dateTd', timeType.val());
            sendData.query = {
                timeType: timeType.val(),
                yearReport: $('#im_report_csr_channel_dateTd .yearReport').val(),
                monthReport: $('#im_report_csr_channel_dateTd .monthReport').val(),
                dayReport: $('#im_report_csr_channel_dateTd .dayReport').val(),
            }
        }
        var groupName = "channelName";

        var userCondition = {type: session.user.type,moduleUsers: session.user.moduleUsers}
        sendData.user = userCondition;
        var action = {
            action: 'imReport.queryImChannelCsrReport',
            data: sendData
        };

        DS.util.sendActionWithUrl(DS._ds_report_url, action, function (res) {
            if (!res.success) {
                alert('获取失败！');
            }
            var headerConfig = res.tableHeader.Config;
            var channel = res.channels;
            var datas = res.data;
            for (var i = 0; i < channel.length; i++) {
                for (var j = 0; j < datas.length; j++) {
                    if (channel[i].channel == datas[j].channel) {
                        datas[j].channelName = channel[i].channelName;
                    }
                }
            }
            //生成合计
            if (datas.length > 0) {
                datas.push(handler.report.im.imReportGenerateTotal(headerConfig,datas,groupName, "im_report_csr_channel"));
            }
            //生成表格内容
            var dataHtml = '';
            for (var i = 0; i < datas.length; i++) {
                var oneRow = '<tr>';
                for (var j = 0; j < headerConfig.length; j++) {
                    if (headerConfig[j].show === true) {
                        if (headerConfig[j].name === 'channelName' && datas[i][groupName] != "合计") {
                            oneRow += '<td>' + datas[i][groupName] + '</td>';
                        } else if (headerConfig[j].name === 'channelName' && datas[i][groupName] === "合计") {
                            oneRow += '<td sort_exclude="true">合计</td>';
                        } else if (headerConfig[j].name.slice(-6) === 'Length' || headerConfig[j].name.slice(-6) === 'LENGTH'
                            || headerConfig[j].name.slice(-3) === 'Avg') {
                            oneRow += '<td>' + handler.report.callReport.formatTime(datas[i][headerConfig[j].name]) + '</td>';
                        } else if (headerConfig[j].name.slice(-4) === 'Rate') {
                            oneRow += '<td>' + datas[i][headerConfig[j].name] + '%</td>';
                        } else {
                            if(headerConfig[j].name.slice(-5) === 'Count'){
                                oneRow += '<td>' + datas[i][headerConfig[j].name] + '</td>';
                            }else{
                                if(datas[i]['totalAppraiseCount'] > 0){
                                    var rate = (datas[i][headerConfig[j].name]*100 / datas[i]['totalAppraiseCount']).toFixed(1);
                                    oneRow += '<td>'+rate+'%</td>';
                                }else{
                                    oneRow += '<td>0.0%</td>';
                                }
                            }


                        }
                    }
                }
                oneRow += '</tr>';
                dataHtml += oneRow;
            }
            headerConfig.tableType = 'im_report_csr_channel';
            $('#imReportCSRChannelTableHeader').html(handler.report.callReport.renderTableHeader(headerConfig));
            $('#imReportCSRChannelTableTbody').html(dataHtml);

            var seriesArray = new Array();
            for(var i = 0;i<headerConfig.length;i++){
                if(headerConfig[i].name == 'channelName'){
                    continue;
                }
                seriesArray.push({name: headerConfig[i].displayname, data: new Array(), valueName: headerConfig[i].name});
            }
            //seriesArray.push({name: '会话总数', data: new Array(), valueName: 'sessionCount'});
            //seriesArray.push({name: '总评价数', data: new Array(), valueName: 'totalAppraiseCount'});
            //seriesArray.push({name: '参评率', data: new Array(), valueName: 'appraiseRate'});

            var seriesArray2 = new Array();
            handler.report.im.initHighChat(function(){
                handler.report.im.generateImReportHighChats('im_report_csr_channel_highcharts_container',datas,seriesArray,seriesArray2,'im_report_csr_channel');
            });

        });
    },
    im_report_session_time:function(data){
        //初始化日程控件
        handler.report.callReport.queueTimeMainOnload(data);
        var sendData = {
            reportType: 'im_report_session_time',
            account: session.user.account
        };
        var timeType = $('#im_report_session_time_time_type');
        if (data != 'im_report_session_time') {
            sendData.query = data;
            //格式化日期条件
            timeType.val(data.timeType);
            handler.report.callReport.resetDate('im_report_session_time_dateTd', data.timeType, data);
        } else {
            timeType.val('day');
            handler.report.callReport.resetDate('im_report_session_time_dateTd', timeType.val());
            sendData.query = {
                timeType: timeType.val(),
                yearReport: $('#im_report_session_time_dateTd .yearReport').val(),
                monthReport: $('#im_report_session_time_dateTd .monthReport').val(),
                dayReport: $('#im_report_session_time_dateTd .dayReport').val()
            }
        }
        var groupName = 'hourId';

        var userCondition = {type: session.user.type,moduleUsers: session.user.moduleUsers}
        sendData.user = userCondition;
        var action = {
            action: 'imReport.queryImSessionTimeReport',
            data: sendData
        };
        if(data != 'im_report_session_time'){
            sendData.query = data;
            if(data.timeType === 'year'){
                groupName = "monthId";
            }else if(data.timeType === 'month'){
                groupName = "dayId";
            }else if(data.timeType === 'day'){
                groupName = "hourId";
            }else if(data.timeType === 'other'){
                //做输入校验
                //if()
                //TimeType="other"
                groupName = "dayId";
            }
            if(data.timeType == 'other'){
                if(data.StartTime == '' || data.EndTime == ''){
                    var date=new Date;
                    var year2=date.getFullYear();

                    sendData.query.yearReport= JSON.stringify(year2);
                    sendData.query.timeType = 'year';
                    groupName = "monthId";
                }
            }
        }

        DS.util.sendActionWithUrl(DS._ds_report_url, action, function (res) {
            if (!res.success) {
                alert('获取失败！');
            }
            var headerConfig = res.tableHeader.Config;
            var datas = res.data;
            //生成合计
            if (datas.length > 0) {
                datas.push(handler.report.im.imReportGenerateTotal(headerConfig,datas,groupName, "im_report_session_time"));
            }

            //生成表格内容
            var dataHtml = '';
            var datas2 = [];
            for (var i = 0; i < datas.length; i++) {
                datas2.push(datas[i]);
                var oneRow = '<tr>';
                for (var j = 0; j < headerConfig.length; j++) {
                    if(headerConfig[j].show === true){
                        if(headerConfig[j].name === 'reportTime' && datas[i][groupName]!="合计"){
                            var temp = datas[i][groupName];
                            if(groupName == 'monthId'){
                                temp = temp.substring(0,4)+"-"+temp.substr(4,6);
                            }else if(groupName == 'dayId'){
                                temp = temp.substring(0,4)+"-"+temp.substring(4,6)+"-"+temp.substring(6,8);
                            }else{
                                temp = temp.substring(0,4)+"-"+temp.substring(4,6)+"-"+temp.substring(6,8)+" "+temp.substring(8,10)+":00:00";
                            }
                            oneRow+='<td>'+temp+'</td>';
                        }else if(headerConfig[j].name === 'reportTime' && datas[i][groupName] === "合计"){
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
            headerConfig.tableType = 'im_report_session_time';
            $('#imReportSessionTimeTableHeader').html(handler.report.callReport.renderTableHeader(headerConfig));
            $('#imReportSessionTimeTableTbody').html(dataHtml);

            var seriesArray = new Array();

            seriesArray.push({name: '总对话数', data: new Array(), valueName: 'sessionCount'});
            seriesArray.push({name: '人工对话数', data: new Array(), valueName: 'manualSessionCount'});
            seriesArray.push({name: '机器对话数', data: new Array(), valueName: 'robotSessionCount'});
            seriesArray.push({name: '转人工', data: new Array(), valueName: 'convertManualCount'});
            seriesArray.push({name: '流失会话数', data: new Array(), valueName: 'lostSessionCount'});
            seriesArray.push({name: '优质对话数', data: new Array(), valueName: 'goodCount'});
            seriesArray.push({name: '劣质对话数', data: new Array(), valueName: 'badCount'});
            seriesArray.push({name: '一般对话数', data: new Array(), valueName: 'mediumCount'});


            handler.report.im.initHighChat(function(){
                for (var i = 0; i < datas2.length; i++) {
                        if(groupName == 'monthId'){
                            datas2[i][groupName] = datas2[i][groupName].substr(4,6);
                        }else if(groupName == 'dayId' && data.timeType=='month'){
                            datas2[i][groupName] = datas2[i][groupName].substr(6,8);
                        }else if(groupName == 'dayId' && data.timeType=='other'){
                            datas2[i][groupName] = datas2[i][groupName].substring(0,4)+"-"+datas2[i][groupName].substring(4,6)+"-"+datas2[i][groupName].substring(6,8);
                        }else{
                            datas2[i][groupName] = datas2[i][groupName].substr(8,10);
                        }
                }
                handler.report.im.generateTimeHighCharts('im_report_session_time_highcharts_container',datas2,seriesArray,groupName);

            });

        });
    },
    im_report_source_from: function(){
        $(".im_report_nav li").eq(0).find("a").click();
    },
    im_report_engine: function(data) {
        var sendData = {
            reportType: 'im_report_session_seoSource',
            account: session.user.account
        };
        var timeType = $('#im_report_engine_time_type');

        if (data != 'im_report_engine') {
            sendData.query = data;
            //格式化日期条件
            timeType.val(data.timeType);
            handler.report.callReport.resetDate('im_report_engine_dateTd', data.timeType, data);
        } else {
            timeType.val('day');
            handler.report.callReport.resetDate('im_report_engine_dateTd', timeType.val());
            sendData.query = {
                timeType: timeType.val(),
                yearReport: $('#im_report_engine_dateTd .yearReport').val(),
                monthReport: $('#im_report_engine_dateTd .monthReport').val(),
                dayReport: $('#im_report_engine_dateTd .dayReport').val()
            }
        }
        var action = {
            action: 'imReport.queryImSessionFromReport',
            data: sendData
        };
        DS.util.sendActionWithUrl(DS._ds_report_url, action, function (res) {
            if (!res.success) {
                alert('获取失败！');
                return;
            }

            var headerConfig = res.tableHeader.Config;
            var datas = res.data;
            var sum = 0;
            for(var k=0;k<datas.length;k++){
                if(!datas[k]['seoSource']){
                    continue;
                }
                sum += datas[k].sessionCount;
            }

            var seriesArray = new Array();
            for(var i=0; i<datas.length; i++){
                if(!datas[i]['seoSource']){
                    continue;
                }
                seriesArray.push([datas[i]['seoSource']+"("+datas[i]['sessionCount']+")", datas[i]['sessionCount']]);
            }

            //饼状图颜色注释
            function down(x, y) {
                return (x.data < y.data) ? 1 : -1
            }
            seriesArray.sort(down);
            handler.report.im.generatePieHighCharts('im_report_engine_highcharts_container',datas,seriesArray,'im_report_engine');
            //生成表格内容
            var dataHtml = '';
            for (var i = 0; i < datas.length; i++) {
                if(datas[i]['seoSource'] == null){
                    continue;
                }
                var oneRow = '<tr>';
                for (var j = 0; j < headerConfig.length; j++) {
                    if (headerConfig[j].show === true) {
                        oneRow += '<td>' + datas[i][headerConfig[j].name] + '</td>';
                    }
                }
                oneRow += '</tr>';
                dataHtml += oneRow;
            }
            headerConfig.tableType = 'im_report_engine';
            $('#imReportEngineTableHeader').html(handler.report.callReport.renderTableHeader(headerConfig));
            $('#imReportEngineTableTbody').html(dataHtml);
        });
    },
    im_report_area: function(data) {
        var sendData = {
            reportType: 'im_report_session_area',
            account: session.user.account
        };
        var timeType = $('#im_report_area_time_type');

        if (data != 'im_report_area') {
            sendData.query = data;
            //格式化日期条件
            timeType.val(data.timeType);
            handler.report.callReport.resetDate('im_report_area_dateTd', data.timeType, data);
        } else {
            timeType.val('day');
            handler.report.callReport.resetDate('im_report_area_dateTd', timeType.val());
            sendData.query = {
                timeType: timeType.val(),
                yearReport: $('#im_report_area_dateTd .yearReport').val(),
                monthReport: $('#im_report_area_dateTd .monthReport').val(),
                dayReport: $('#im_report_area_dateTd .dayReport').val()
            }

        }
        var action = {
            action: 'imReport.queryImSessionFromReport',
            data: sendData
        };

        DS.util.sendActionWithUrl(DS._ds_report_url, action, function (res) {

            var headerConfig = res.tableHeader.Config;
            var datas = res.data;

            //生成表格内容
            var dataHtml = '';
            var sum = 0;
            for (var i = 0; i < datas.length; i++) {
                if(datas[i]['area'] == null){
                    continue;
                }
                var oneRow = '<tr>';
                for (var j = 0; j < headerConfig.length; j++) {
                    if (headerConfig[j].show === true) {
                        oneRow += '<td>' + datas[i][headerConfig[j].name] + '</td>';
                    }
                }
                oneRow += '</tr>';
                dataHtml += oneRow;
            }
            headerConfig.tableType = 'im_report_area';
            $('#imReportAreaTableHeader').html(handler.report.callReport.renderTableHeader(headerConfig));
            $('#imReportAreaTableTbody').html(dataHtml);
            for(var k=0;k<datas.length;k++){
                sum += datas[k].sessionCount;
            }

            var seriesArray = new Array();
            for(var i=0; i<datas.length; i++){
                if(datas[i]['area'] == null){
                    continue;
                }
                seriesArray.push({name: datas[i]['area'], data:  datas[i]['sessionCount'], valueName: 'sessionCount'});
            }

            handler.report.im.generateMapHighMaps('im_report_area_highmaps_container',datas,seriesArray,'im_report_area');
        });

    },
    im_report_keyword: function(data,src){
        data = data || {};
        var lastPage = $('#im_report_keywords_table .pagination a').eq(0);
        var nextPage = $('#im_report_keywords_table .pagination a').eq(1);
        var list =  $('#im_report_keywords_table .pagination').find("li");
        var sendData = {
            reportType: 'im_report_session_seoKeywords',
            account: session.user.account
        };
        if(src){
            sendData.page = parseInt(src.attr("value"))|| 1;
        }else{
            sendData.page = 1;
        }
        sendData.limit = 20;
        var timeType = $('#im_report_keyword_time_type');

        var groupName = "keywordName";

        if (data != 'im_report_keyword') {
            sendData.query = data;
            //搜索引擎值得获取
            sendData.query.seoSource = $("#im_report_keyword_commissioner_user_input").val()? $("#im_report_keyword_commissioner_user_input").val():"";
            //格式化日期条件
            timeType.val(data.timeType);
            handler.report.callReport.resetDate('im_report_keyword_dateTd', data.timeType, data);
        } else {
            timeType.val('day');
            handler.report.callReport.resetDate('im_report_keyword_dateTd', timeType.val());
            sendData.query = {
                timeType: timeType.val(),
                yearReport: $('#im_report_keyword_dateTd .yearReport').val(),
                monthReport: $('#im_report_keyword_dateTd .monthReport').val(),
                dayReport: $('#im_report_keyword_dateTd .dayReport').val()
            }
        }
        var action = {
            action: 'imReport.queryImSessionFromReport',
            data: sendData
        };

        DS.util.sendActionWithUrl(DS._ds_report_url, action, function (res) {

            var headerConfig = res.tableHeader.Config;
            var datas = res.data;

            //生成表格内容
            var dataHtml = '';
            var sum = 0;
            for (var i = 0; i < datas.length; i++) {
                if(datas[i]['_id'] == null){
                    continue;
                }
                var oneRow = '<tr>';
                for (var j = 0; j < headerConfig.length; j++) {
                    if (headerConfig[j].show === true) {
                        if (headerConfig[j].name == "seoKeywords"){
                            oneRow += '<td class="table_ds_word">' + datas[i]['_id'] + '</td>';
                        } else {
                            oneRow += '<td>' + datas[i][headerConfig[j].name] + '</td>';
                        }
                    }
                }
                oneRow += '</tr>';
                dataHtml += oneRow;
            }
            headerConfig.tableType = 'im_report_keyword';
            $('#imReportKeywordTableHeader').html(handler.report.callReport.renderTableHeader(headerConfig));
            $('#imReportKeywordTableTbody').html(dataHtml);
            for(var k=0;k<datas.length;k++){
                sum += datas[k].sessionCount;
            }
            if(sendData.page ==1){
                var seriesArray = new Array();
                var f_num;
                for(var i=0; i<datas.length; i++){
                    if(datas[i]['_id'] == null){
                        continue;
                    }
                    seriesArray.push({name: datas[i]['_id'], data:  datas[i]['sessionCount'], valueName: 'sessionCount'});
                    f_num = seriesArray[0].data;
                }

                //排行榜
                if(seriesArray.length<=10){
                    seriesArray.length = seriesArray.length;
                }else{
                    seriesArray.length = 10;
                }
                $('#im_report_keywords_highmaps_container table tbody').html('');
                for(var i=0; i<seriesArray.length; i++){
                    $('#im_report_keywords_highmaps_container table tbody').append('<tr><td class="r_rank">'+(i+1)+'</td><td><em class="word_overflow" style="font-style: normal">'+seriesArray[i].name+'</em></td><td><span>'+seriesArray[i].data+'</span><div class="skillbar clearfix"><b class="skillbar-bar" style="width:'+seriesArray[i].data/f_num*180+"px"+'"></b></div></td></tr>')
                }
            }

            //分页
            list.removeClass("active");
            if(datas.length < sendData.limit){
                nextPage.attr("app", "disabled").parent().attr("app", "disabled").addClass("active");
                if(sendData.page == 1){
                    list.addClass('disabled active').children("a").attr("app", "disabled");
                    return;
                }else{
                    lastPage.attr("app", "enable").parent().attr("app", "enable");
                }
            }else{
                list.removeClass('active disabled');
                if(sendData.page == 1){
                    lastPage.attr("app", "disabled").parent().attr("app", "disabled").addClass("active");
                }
                lastPage.attr("app", "enable").parent().attr("app", "enable");
                nextPage.attr("app", "enable").parent().attr("app", "enable");

            }
            lastPage.attr('value',sendData.page - 1);
            nextPage.attr('value',sendData.page + 1);

        });
    },
    im_report_website_updown: function(data,src){
        data = data || {};
        if(src){
            data.page = parseInt(src.attr("value"))|| 1;
        }else{
            data.page = 1;
        }
        data.limit = 20;
        $('#im_report_website_btn').val(data.page);
        $('#im_report_website_btn').click();
    },
    im_report_keyword_updown: function(data,src){
        data = data || {};
        if(src){
            data.page = parseInt(src.attr("value"))|| 1;
        }else{
            data.page = 1;
        }
        data.limit = 20;
        $('#im_report_keyword_btn').val(data.page);
        $('#im_report_keyword_btn').click();
    },
    im_report_website: function(data,src){
        data = data || {};
        var lastPage = $('#im_report_fromurl_table .pagination a').eq(0);
        var nextPage = $('#im_report_fromurl_table .pagination a').eq(1);
        var list =  $('#im_report_fromurl_table .pagination').find("li");
        var sendData = {
            reportType: 'im_report_session_fromUrl',
            account: session.user.account
        };
        if(src){
            sendData.page = parseInt(src.attr("value"))|| 1;
        }else{
            sendData.page = 1;
        }
        sendData.limit = 20;
        var timeType = $('#im_report_website_time_type');

        if (data != 'im_report_website') {
            sendData.query = data;
            //格式化日期条件
            if(data.timeType){
                timeType.val(data.timeType);
            }

            handler.report.callReport.resetDate('im_report_website_dateTd', data.timeType, data);
        } else {
            timeType.val('day');
            handler.report.callReport.resetDate('im_report_website_dateTd', timeType.val());
            sendData.query = {
                timeType: timeType.val(),
                yearReport: $('#im_report_website_dateTd .yearReport').val(),
                monthReport: $('#im_report_website_dateTd .monthReport').val(),
                dayReport: $('#im_report_website_dateTd .dayReport').val(),
            }
        }
        var action = {
            action: 'imReport.queryImSessionFromReport',
            data: sendData
        };

        DS.util.sendActionWithUrl(DS._ds_report_url, action, function (res) {
            var headerConfig = res.tableHeader.Config;
            var datas = res.data;

            //生成表格内容
            var dataHtml = '';
            var sum = 0;
            for (var i = 0; i < datas.length; i++) {
                if(datas[i]['_id'] == null){
                    continue;
                }
                var oneRow = '<tr>';
                for (var j = 0; j < headerConfig.length; j++) {
                    if (headerConfig[j].show === true) {
                        if(headerConfig[j].name == "fromUrl"){
                            var title = datas[i]['urlTitle'] || datas[i]['_id'];
                            oneRow += '<td class="table_ds_word"><a target="_blank" href="'+datas[i]['_id']+'">' + title + '</a></td>';
                        }else{
                            oneRow += '<td>' + datas[i][headerConfig[j].name] + '</td>';
                        }

                    }
                }
                oneRow += '</tr>';
                dataHtml += oneRow;
            }
            headerConfig.tableType = 'im_report_website';
            $('#imReportWebsiteTableHeader').html(handler.report.callReport.renderTableHeader(headerConfig));
            $('#imReportWebsiteTableTbody').html(dataHtml);
            $('#im_report_website_table_id thead th').eq(0).css('width','200px');
            for(var k=0;k<datas.length;k++){
                sum += datas[k].sessionCount;
            }
           if(sendData.page ==1){
               var seriesArray = new Array();
               var f_num;
               for(var i=0; i<datas.length; i++){
                   if(datas[i]['_id'] == null){
                       continue;
                   }
                   seriesArray.push({name: datas[i]['_id'],urlTitle:datas[i]['urlTitle'] || datas[i]['_id'], data:  datas[i]['sessionCount'], valueName: 'sessionCount'});
                   f_num = seriesArray[0].data;
               }
               //排行榜
               if(seriesArray.length<=10){
                   seriesArray.length = seriesArray.length;
               }else{
                   seriesArray.length = 10;
               }
               $('#im_report_fromurl_highmaps_container table tbody').html('');
               for(var i=0; i<seriesArray.length; i++){
                   $('#im_report_fromurl_highmaps_container table tbody').append('<tr><td class="r_rank">'+(i+1)+'</td><td><a class="word_overflow" target="_blank" href="'+seriesArray[i].name+'">'+seriesArray[i].urlTitle+'</a></td><td><span>'+seriesArray[i].data+'</span><div class="skillbar clearfix"><b class="skillbar-bar" style="width:'+seriesArray[i].data/f_num*180+"px"+'"></b></div></td></tr>')
               }
           }

            //分页
            list.removeClass("active");
            if(datas.length < sendData.limit){
                nextPage.attr("app", "disabled").parent().attr("app", "disabled").addClass("active");
                if(sendData.page == 1){
                    list.addClass('disabled active').children("a").attr("app", "disabled");
                    return;
                }else{
                    lastPage.attr("app", "enable").parent().attr("app", "enable");
                }
            }else{
                list.removeClass('active disabled');
                if(sendData.page == 1){
                    lastPage.attr("app", "disabled").parent().attr("app", "disabled").addClass("active");
                }
                lastPage.attr("app", "enable").parent().attr("app", "enable");
                nextPage.attr("app", "enable").parent().attr("app", "enable");

            }
            lastPage.attr('value',sendData.page - 1);
            nextPage.attr('value',sendData.page + 1);
        });
    },

    convertCompare:function(containerId, src){
        if(containerId.slice(-2) == "_Y"){
            var tmp = containerId.replace("_Y","");
            $(src).attr("ds_data", tmp);
            $("#"+tmp).hide();
            $("#"+containerId).show();
            $(src).html("横向对比");
        }else{
            $("#"+containerId+"_Y").hide();
            $("#"+containerId).show();
            $(src).attr("ds_data", containerId+"_Y");
            $(src).html("纵向对比");
        }
    },

    generatePieHighCharts:function(containerId,datas,seriesArray,xName){
        var xArray = new Array();
        var titleText = '';
        $('#'+containerId).highcharts({
            chart: {
                type: 'pie'
            },
            legend: {
                symbolRadius:14,
                align:'right',
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        color: '#000000',
                        connectorColor: '#000000',
                        format: '<b>{point.name}</b>: {point.percentage:.1f}%'
                    },
                    showInLegend: true,
                    depth: 25
                }
            },
            tooltip: {
                pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
            },
            title:titleText,
            colors:[
                '#42b0ec',//第一个颜色，欢迎加入Highcharts学习交流群294191384
                '#ecc540',//第二个颜色
                '#65c348',//第三个颜色
                '#f09d3c', //。。。。
                '#9b9b9e'
            ],
            credits:{
                href:"javascript:goHome()",
                text:""
            },
            series: [
                {
                    type: 'pie',
                    name:'百分比',
                    data:seriesArray
                }
            ]
        });
},

    generateMapHighMaps:function(containerId,datas,seriesArray,xName){
        $('#im_report_area_bar ul').html("");
        $('#im_report_area_bar .skillbar_box').html("");
        Highcharts.setOptions({
            lang:{
                drillUpText:"返回 > {series.name}"
            }
        });
        var data = Highcharts.geojson(Highcharts.maps['countries/cn/custom/cn-all-china']),small = $('#im_report_area_highmaps_container').width() < 400;

        //给城市设置数据
        var data_key = seriesArray;
        $.each(data, function (i) {
            this.name = this.properties['cn-name'];
            this.value = 0;
            for (var j =0 ; j<data_key.length;j++) {
                if(data_key[j].name.match(this.name)){
                    this.value = data_key[j].data;
                    break;
                }
            }
        });
        function getPoint(e){
            console.log(e.point.name);
        }
        function getShow(e){
            alert(1);
        }
        //初始化地图
        $('#im_report_area_highmaps_container').highcharts('Map', {
            chart : {
                events: {
                    drilldown: function (e) {
                        if (!e.seriesOptions) {
                            var chart = this;
                            var cname=e.point.properties["cn-name"];
                            chart.showLoading('<i class="icon-spinner icon-spin icon-3x"></i>');
                            // 加载城市数据
                            $.ajax({
                                type: "GET",
                                url: "map_json/"+ e.point.drilldown+".geo.json",
                                contentType: "application/json; charset=utf-8",
                                dataType:'jsonp',
                                crossDomain: true,
                                success: function(json) {
                                    data = Highcharts.geojson(json);
                                    $.each(data, function (i) {
                                        this.value = i;
                                        this.events={};
                                        this.events.click=getPoint;
                                    });
                                    chart.hideLoading();
                                    chart.addSeriesAsDrilldown(e.point, {
                                        name: e.point.name,
                                        data: data,
                                        events:{
                                            show:function(){
                                                alert(1);
                                            }
                                        },
                                        dataLabels: {
                                            enabled: true,
                                            format: '{point.name}',
                                        }
                                    });
                                },
                                error: function (XMLHttpRequest, textStatus, errorThrown) {
                                }
                            });
                        }
                        this.setTitle(null, { text: cname });
                    },
                    drillup: function () {
                        this.setTitle(null, { text: '中国' });
                    }
                }
            },
            tooltip: {
                formatter:function(){
                    return "搜索指数<br />"+this.point.name+":"+this.point.value;
                }
            },
            credits:{
                href:"javascript:goHome()",
                text:""
            },
            title : {
                text : ''
            },
            subtitle: {
                text: '搜索指数:',
                floating: true,
                align: 'left',
                y: 446,
                style: {
                    fontSize: '12px'
                }
            },
            crop: true,
            legend: small ? {} : {
                x:60,
                layout: 'align',
                align: 'left',
                verticalAlign: 'bottom'
            },
            colorAxis: {
                min: 0,
                minColor: '#ebeff0',
                maxColor: '#3cc7f4'
            },
            mapNavigation: {
                enabled: true,
                enableMouseWheelZoom:false,
                enableDoubleClickZoom:false,
                buttonOptions: {
                    verticalAlign: 'bottom'
                }
            },
            plotOptions: {
                map: {
                    states: {
                        hover: {
                            color: '#EEDD66'
                        }
                    }
                }
            },
            series : [{
                data : data,
                name: '中国',
                dataLabels: {
                    enabled: true,
                    format: '{point.properties.cn-name}'
                }
            }],
            drilldown: {
                activeDataLabelStyle: {
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    textShadow: '0 0 3px #000000'
                },
                drillUpButton: {
                    relativeTo: 'spacingBox',
                    position: {
                        x: 0,
                        y: 60
                    }
                }
            }
        });

        //城市排行榜
        var data_arr = data_key;
        var f_num;
        function down(x, y) {
            return (x.data < y.data) ? 1 : -1
        }
        data_arr.sort(down);
        if(data_arr.length>0){
            f_num = data_arr[0].data;
        }
        var num = data_arr.length>10?10:data_arr.length;

        for(var i=0; i<num; i++){
            $('#im_report_area_bar ul').append('<li><span>'+(i+1)+'.</span><em></em></li>');
            $('#im_report_area_bar .skillbar_box').append('<div class="clearfix"><b class="skillbar" style="display: block"></b>'+'<strong>'+data_arr[i].data)+'</strong></div>';
        }
        $('#im_report_area_bar .skillbar').each(function(i){
            $(this).animate({
                width:data_arr[i].data/f_num*180
            },1000);
        });
        $('#im_report_area_bar em').each(function(i){
            $(this).text(data_arr[i].name);
        });
    },

    generateTimeHighCharts : function(containerId,datas,seriesArray,xName){
        var xArray = new Array();
        var titleText = '时间趋势';
        if(containerId == 'im_report_session_time_highcharts_container'){
            titleText = '会话数的时间趋势报表';
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

    generateImReportHighChats: function(container, datas, seriesArray,seriesArray2,xName, groupName){
        var xArray = new Array();
        var titleText = "";
        var labels = {};
        if (xName == 'im_report_message'){
            titleText = '在线客服消息报表';
            for(var i = 0 ; i < datas.length -1; i++){
                xArray.push(handler.report.im.getXName(datas[i].platform || datas[i].accessId, groupName));
                for(var j=0 ; j < seriesArray.length ; j++){
                    seriesArray[j]['data'].push(datas[i][seriesArray[j].valueName])
                }
            }

        }else if(xName == 'im_report_business'){
            titleText = '在线客服业务分析报表';
            for(var i = 0 ; i < datas.length -1; i++){
                var key = datas[i].consultType;
                var value = handler.config.channelDic.getDicMapName("webchat", key);
                xArray.push(value);
                for(var j=0 ; j < seriesArray.length ; j++){
                    seriesArray[j]['data'].push(datas[i][seriesArray[j].valueName])
                }
            }
            if(datas.length>8){
                labels = {
                    rotation: -45,
                    align: 'right',
                    style: {
                        fontSize: '13px',
                        fontFamily: 'Verdana, sans-serif'
                    }
                }
            }
        }else if(xName == 'im_report_agent'){
            titleText = '在线客服座席报表';
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

        }else if(xName == 'im_report_csr'){
            titleText = '在线客服座席满意度报表';
            for(var i = 0 ; i < datas.length -1; i++){
                xArray.push(datas[i].agentName);
                for(var j=0 ; j < seriesArray.length ; j++){
                    if(seriesArray[j].valueName == 'appraiseRate'){
                        datas[i][seriesArray[j].valueName] = parseFloat(datas[i][seriesArray[j].valueName]);
                    }
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

        }else if(xName == 'im_report_csr_channel'){
            titleText = '在线客服渠道满意度报表';
            for(var i = 0 ; i < datas.length -1; i++){
                xArray.push(datas[i].channelName);
                for(var j=0 ; j < seriesArray.length ; j++){
                    if(seriesArray[j].valueName == 'appraiseRate'){
                        datas[i][seriesArray[j].valueName] = parseFloat(datas[i][seriesArray[j].valueName]);
                    }
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

        }else if(xName == 'im_report_engine'){
            titleText = '客户来源报表';
            for(var i = 0 ; i < datas.length -1; i++){
                xArray.push(datas[i].engineName);
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
        if(seriesArray2 && seriesArray2.length > 0){
            var xArray2 = new Array();
            for(var j=0 ; j < seriesArray.length ; j++){
                xArray2.push(seriesArray[j].name);
                for(var i = 0 ; i < seriesArray2.length; i++){
                    for(var m=0; m < datas.length; m++){
                        if(datas[m].platform == seriesArray2[i].valueName){
                            seriesArray2[i]['data'].push(datas[m][seriesArray[j].valueName]);
                        }
                    }

                }
            }

            $('#' + container+"_Y").highcharts({
                chart: {
                    type: 'column'
                },
                title: {
                    text: titleText
                },
                subtitle: {
                    text: ''
                },
                xAxis: {
                    categories: xArray2
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: ''
                    }
                },
                tooltip: {
                    formatter: function () {
                        var s = '<span style="font-size:10px">' + this.x + '</span><table>';

                        $.each(this.points, function () {
                            var unit = "";
                            if(this.x.slice(-2) == "时长"){
                                unit = "s";
                            }else if(this.x.slice(-1) == "率"){
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

                series: seriesArray2
            });
        }
    },

    imReportGenerateTotal : function(headerConfig,datas,groupName, type){
        var total = {};
        total[groupName] = '合计';
        if(type && type == "im_report_message"){
            total.sessionTotalTimeLength = 0;
            total.firstResponseTotalTimeLength = 0;
            total.finishSessionCount = 0;
            total.responseTotalCount = 0;
        }else if(type && type == "im_report_agent"){
            total.sessionTotalTimeLength = 0;
            total.firstResponseTotalTimeLength = 0;
            total.responseTotalCount = 0;
        }else if(type && (type == "im_report_csr"||type == "im_report_csr_channel")){
            total.totalAppraiseCount = 0;
            total.sessionCount = 0;
        }else if(type && type == "im_report_engine"){

        }

        for(var i=0 ; i < headerConfig.length ; i++){
            for(var j=0 ; j < datas.length ; j++){
                if(type == "im_report_business"){
                    datas[j].consultTotal = (datas[j].pc || 0) + (datas[j].sdk || 0) +(datas[j].weixin || 0)+(datas[j].wap || 0);
                }
                if(!isNaN(datas[j][headerConfig[i].name])){
                    if((headerConfig[i].name in total) === false){
                        total[headerConfig[i].name] = 0;
                    }
                    total[headerConfig[i].name] += datas[j][headerConfig[i].name];
                }
                if(type && type == "im_report_message"){
                    if(headerConfig[i].name == "averageSessionTimeLength"){
                        total.sessionTotalTimeLength += datas[j]["sessionTotalTimeLength"];
                        total.finishSessionCount += datas[j]["finishSessionCount"];
                    }else if(headerConfig[i].name == "averageFirstResponseTimeLength"){
                        total.firstResponseTotalTimeLength += datas[j]["firstResponseTotalTimeLength"];
                    }else if(headerConfig[i].name == "sessionRate"){
                        total.responseTotalCount +=  datas[j]["responseTotalCount"];
                    }
                }else if(type && type == "im_report_agent"){
                    if(headerConfig[i].name == "sessionAverageTimeLength"){
                        total.sessionTotalTimeLength += datas[j]["sessionTotalTimeLength"];
                    }else if(headerConfig[i].name == "averageFirstResponseTimeLength"){
                        total.firstResponseTotalTimeLength += datas[j]["firstResponseTotalTimeLength"];
                        total.responseTotalCount +=  datas[j]["responseTotalCount"];
                    }
                }else if(type && type == "im_report_engine"){

                }

            }
        }


        if(type && type == "im_report_message"){
            if(total.finishSessionCount > 0){
                total.averageSessionTimeLength = Math.round(total.sessionTotalTimeLength / total.finishSessionCount);
            }else{
                total.averageSessionTimeLength = 0;
            }

            if(total.sessionCount > 0){
                total.sessionRate = Math.round((total.responseTotalCount / total.sessionCount) * 100);
            }else{
                total.sessionRate = 0;
            }

            if(total.responseTotalCount > 0){
                total.averageFirstResponseTimeLength = Math.round(total.firstResponseTotalTimeLength / total.responseTotalCount);
            }else{
                total.averageFirstResponseTimeLength = 0;
            }

        }else if(type && type == "im_report_agent"){
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
        }else if(type && type == "im_report_csr" ||type == "im_report_csr_channel"){
            if(total.sessionCount > 0){
                total.appraiseRate =((total.totalAppraiseCount / total.sessionCount) * 100).toFixed(1);
            }else{
                total.appraiseRate = 0;
            }
        }
        return total;
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

    getXName:function(platform, key){
        var showXName = "未知";
        if(platform == "pc"){
            showXName = "网站咨询";
        }else if(platform == "weixin"){
            showXName = "微信咨询";
        }else if(platform == "wap"){
            showXName = "wap站咨询";
        }else if(platform == "sdk"){
            showXName = "App咨询";
        }
        if(key == "accessId"){
            var accessId = getCache("accessIds", platform);
            showXName = accessId.name;

        }
        return showXName;
    },
    exportImAgentExcel: function(data){
        data.accountId = session.user.account;
        data.type = 'imAgentExport';
        data.user = session.user._id;
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'exportImAgent',Query:data}
        };
        DS.send(action,function(rep) {
            if(rep.Succeed){
                downloadFile(rep.path);
            }else{
                alert('导出失败！');
            }
        });
    },
    exportImBusinessExcel: function(data){
        data.accountId = session.user.account;
        data.type = 'imBusinessExport';
        data.user = session.user._id;
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'exportImBusiness',Query:data}
        };
        DS.send(action,function(rep) {
            if(rep.Succeed){
                downloadFile(rep.path);
            }else{
                alert('导出失败！');
            }
        });
    },

    exportImMessageExcel: function(data){
        data.accountId = session.user.account;
        data.type = 'imMessageExport';
        data.user = session.user._id;
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'exportImMessage',Query:data}
        };
        DS.send(action,function(rep) {
            if(rep.Succeed){
                downloadFile(rep.path);
            }else{
                alert('导出失败！');
            }
        });
    },
    exportImSourceAnalyseExcel: function(data){
        data.accountId = session.user.account;
        data.user = session.user._id;
        if(data.reportType=="im_report_session_seoKeywords"){
            data.seoSourceSearch = $("#im_report_keyword_commissioner_user_input").val()? $("#im_report_keyword_commissioner_user_input").val():"";
        }
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'exportImSourceAnalyse',Query:data}
        };
        DS.send(action,function(rep) {
            if(rep.Succeed){
                downloadFile(rep.path);
            }else{
                alert('导出失败！');
            }
        });
    },
    exportImCSRExcel:function(data){
        data.accountId = session.user.account;
        data.type = 'imCSRExport';
        data.user = session.user._id;
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'exportImCSR',Query:data}
        };
        DS.send(action,function(rep) {
            if(rep.Succeed){
                downloadFile(rep.path);
            }else{
                alert('导出失败！');
            }
        });
    },
    exportImCSRChannelExcel:function(data){
        data.accountId = session.user.account;
        data.type = 'imChannelCSRExport';
        data.user = session.user._id;
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'exportImChannelCSR',Query:data}
        };
        DS.send(action,function(rep) {
            if(rep.Succeed){
                downloadFile(rep.path);
            }else{
                alert('导出失败！');
            }
        });
    },
    exportImSessionTimeExcel:function(data){
        data.accountId = session.user.account;
        data.type = 'imSessionTimeExport';
        data.user = session.user._id;

        if(data.timeType == 'other'||data.timeType == 'other_half_hour'){
            if(data.StartTime == '' || data.EndTime == ''){
                var date=new Date;
                var year2=date.getFullYear();
                data.yearReport= JSON.stringify(year2);
                data.timeType = 'year';
            }
        }
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'exportImSessionTime',Query:data}
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