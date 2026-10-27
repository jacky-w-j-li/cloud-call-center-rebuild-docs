handler.report.business = {
    business_report_main:function(menu){
        var pane=$("#view_"+menu);
        var menus = [
            'business_report_analyse',
            'business_report_agent'
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

    business_report_agent : function (data , src){
        var timeType = $('#business_report_agent_time_type');
        var userCondition = {type: session.user.type,moduleUsers: session.user.moduleUsers}
        if(data != "business_report_agent"){
            if(data.timeType == "other"){
                if(data.StartTime){
                    data.StartTime = data.StartTime.replace(/-/g,"");
                }

                if(data.EndTime){
                    data.EndTime = data.EndTime.replace(/-/g,"");
                }
            }
            var action = {
                action : "businessReport.queryBusinessAgentReport",
                data : {
                    account: session.user.account,
                    user:userCondition,
                    query : data
                }
            };
            DS.util.sendActionWithUrl(DS._ds_report_url, action, function(res){
                if (!res.success) {
                    alert('获取失败！');
                }
                var datas = res.data;
                for(var i = 0;i< datas.length;i++){
                    var agent = getCache("agents",datas[i].agent);
                    if (agent){
                        datas[i].agent = agent.displayName ;
                    }
                }
                //生成表头
                var renderData = {
                    data : datas,
                    tableHeader : res.tableHeader || {}
                };
                $('#businessReportAgentTableHeader').html(template('business_report_agent_table_header',renderData));
                $('#businessReportAgentTableTbody').html(template('business_report_agent_table_body',renderData));

                //
                ////生成图标

                var xArray = [];
                for(var i=0;i<datas.length;i++){
                    xArray.push(datas[i].agent);
                }

                var seriesArray = [];
                var headers = renderData.tableHeader.Config ||[];
                for(var i=0;i<headers.length;i++){
                    if(headers[i].name != "agent"){
                        var dataArray = [];
                        seriesArray.push({name:headers[i].displayname,data:dataArray});
                        for(var m =0;m < datas.length;m++){
                            dataArray.push(datas[m][headers[i].name]);
                        }
                    }
                }

                handler.report.business.initTimeHighCharts('business_report_agent_highcharts_container',datas,xArray,seriesArray,"business_report_agent");


            });
        } else {
            timeType.val("day");
            handler.report.callReport.resetDate('business_report_agent_dateTd', timeType.val());
            $("#business_report_agent_btn").click();
        }
    },
    business_report_analyse : function (data , src){
        var timeType = $('#business_report_analyse_time_type');
        if(data != "business_report_analyse"){
            if(data.timeType == "other"){
                if(data.StartTime){
                    data.StartTime = data.StartTime.replace(/-/g,"");
                }

                if(data.EndTime){
                    data.EndTime = data.EndTime.replace(/-/g,"");
                }
            }
            var action = {
                action : "businessReport.queryBusinessAnalyseReport",
                data : {
                    account: session.user.account,
                    query : data
                }
            };
            DS.util.sendActionWithUrl(DS._ds_report_url, action, function(res){
                if (!res.success) {
                    alert('获取失败！');
                }
                var datas = res.data;
                var flows = getCache("businessFlow");

                for(var i=0;i<datas.length;i++){
                    var flow = datas[i].flow || "";
                    for(var m =0;m<flows.length;m++){
                        if(flow == flows[m]._id){
                            datas[i].flowId = flow;
                            datas[i].flow = flows[m].name;
                        }
                    }
                }

                //生成表头
                var renderData = {
                    data : datas,
                    tableHeader : res.tableHeader || {}
                };
                template.helper("$formatTime", handler.report.callReport.formatTime);
                $('#businessReportAnalyseTableHeader').html(template('business_report_analyse_table_header',renderData));
                $('#businessReportAnalyseTableTbody').html(template('business_report_analyse_table_body',renderData));

                //
                ////生成图标

                var xArray = [];
                for(var i=0;i<datas.length;i++){
                    xArray.push(datas[i].flow);
                }

                var seriesArray = [];
                var headers = renderData.tableHeader.Config ||[];
                for(var i=0;i<headers.length;i++){
                    if(headers[i].name != "flow"){
                        var dataArray = [];
                        seriesArray.push({name:headers[i].displayname,data:dataArray});
                        for(var m =0;m < datas.length;m++){
                            dataArray.push(datas[m][headers[i].name]);
                        }
                    }
                }

                handler.report.business.initTimeHighCharts('business_report_analyse_highcharts_container',datas,xArray,seriesArray,"business_report_analyse");

            });

        } else {
            timeType.val("day");
            handler.report.callReport.resetDate('business_report_analyse_dateTd', timeType.val());
            $("#business_report_analyse_btn").click();
        }
    },
    exportBusinessAnalyseExcel : function (data){
        data.accountId = session.user.account;
        data.type = 'businessAnalyseExport';
        if(data.timeType == "other"){
            if(data.StartTime){
                data.StartTime = data.StartTime.replace(/-/g,"");
            }

            if(data.EndTime){
                data.EndTime = data.EndTime.replace(/-/g,"");
            }
        }
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'exportBusinessAnalyse',Query:data}
        };
        DS.send(action,function(rep) {
            if(rep.Succeed){
                downloadFile(rep.path);
            }else{
                alert('导出失败！');
            }
        });
    },
    exportBusinessAgentExcel : function(data){
        data.accountId = session.user.account;
        data.type = 'businessAgentExport';
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'exportBusinessAgent',Query:data}
        };
        DS.send(action,function(rep) {
            if(rep.Succeed){
                downloadFile(rep.path);
            }else{
                alert('导出失败！');
            }
        });
    },
    initTimeHighCharts : function(containerId,datas,xArray,seriesArray,xName){
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
                    handler.report.business.generateTimeHighCharts(containerId,datas,xArray,seriesArray,xName);
                }
            } else {
                //IE6、IE7、IE8 support js.onreadystatechange
                oScript.onreadystatechange = function () {
                    if (oScript.readyState == 'loaded' || oScript.readyState == 'complete') {
                        handler.report.business.generateTimeHighCharts(containerId,datas,xArray,seriesArray,xName);
                    }
                }
            }
        }else{
            handler.report.business.generateTimeHighCharts(containerId,datas,xArray,seriesArray,xName);
        }
    },
    generateTimeHighCharts: function(container, datas, xArray,seriesArray,xName){
        var titleText = "";
        var labels = {};
        if (xName == 'business_report_analyse'){
            titleText = '工单分析报表';
        }else if(xName == 'business_report_agent'){
            titleText = '工单座席工作量报表';
        }


        if(xArray.length>15){
            labels = {
                rotation: -45,
                align: 'right',
                style: {
                    fontSize: '13px',
                    fontFamily: 'Verdana, sans-serif'
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
            xAxis: {
                categories: xArray,
                labels: labels
            },
            yAxis: {
                min: 0,
                title: {
                    text: '数量'
                }
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


    queryTaskReport: function (data, src) {
        var action = {
            action: "app.report.queryTaskReport",
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
                    var tags = getCache("tags");
                    keys.push(dataItem.date)
                    tr.append("<td>" + dataItem.date + "</td>");
                    for (var key in tags) {
                        tr.append("<td>" + dataItem[key] + "</td>")
                    }
                    $("#" + menu + "_report_pane").find("table").find("tbody").append(tr);
                }

                business_report_createPieChart(data[data.length - 1]);
                business_report_createLineChart(data, keys);

            } else {
                alert("获取数据失败！");
            }
        });
    },
    printReport: function (data, src) {
        var newWin = window.open('report_export_pdf_show_print', 'report_export_pdf_show_print', "");
        var chartHTML = $(src).closest(".business_report_pane").find(".chart_pane").html();
        var tableHTML = $(src).closest(".business_report_pane").find(".table_pane").html();
        var css = ".table-bordered{border: 1px solid #dddddd; border-collapse: separate;border-left: 0;-webkit-border-radius: 4px;-moz-border-radius: 4px;border-radius: 4px;}.table {width: 100%;background-color: transparent;border-spacing: 0;}.table thead th{vertical-align: bottom;} .table th,.table td{border-left: 1px solid #dddddd;padding: 4px 5px;font-weight: bold;line-height: 20px;text-align: left;line-height: 20px;vertical-align: top;}.table-striped tbody > tr:nth-child(odd) > td, .table-striped tbody > tr:nth-child(odd) > th {background-color: #f9f9f9;}";
        newWin.document.write('<style type="text/css">' + css + '</style>');
        newWin.document.write('<center><h3>' + "业务报表" + '</h3></center>');
        console.log(chartHTML);
        console.log(tableHTML);
        newWin.document.write(chartHTML);
        newWin.document.write(tableHTML);
        newWin.print();
    }


}
