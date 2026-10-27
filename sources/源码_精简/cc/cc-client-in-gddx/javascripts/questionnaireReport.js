handler.report.questionnaire = {
    questionnaire_report:function(menu){
        var pane=$("#view_"+menu);
        var menus = [
            'ques_report_result',
            'ques_report_answer'
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
    questionnaire_report_return:function(data , src){
        if(data!='questionnaire_report_return'){
            if(!data.temp_id) {
                $().alertmessage('showError', "您当前没有配置问卷模板！");
                return;
            }
            if (data.create_time_begin != "" || data.create_time_end != "") {
                if (data.create_time_begin != "" && data.create_time_end != "") {
                    if (data.create_time_begin > data.create_time_end) {
                        $().alertmessage('showError', "创建时间的开始时间必须小于结束时间");
                        return;
                    }
                } else {
                    $().alertmessage('showError', "创建时间的起止时间都必须填写");
                    return;
                }
            }
            if (data.return_time_begin != "" || data.return_time_end != "") {
                if (data.return_time_begin != "" && data.return_time_end != "") {
                    if (data.return_time_begin > data.return_time_end) {
                        $().alertmessage('showError', "回访时间的开始时间必须小于结束时间");
                        return;
                    }
                } else {
                    $().alertmessage('showError', "回访时间的起止时间都必须填写");
                    return;
                }
            }
            var action = {
                action: "quesReport.queryQuesResultReport",
                data: {
                    account: session.user.account,
                    query: data
                }
            };
            DS.util.sendActionWithUrl(DS._ds_report_url, action, function (response) {
                //var colors = Highcharts.getOptions().colors;
                var colors = ['#83D050', '#E86C64', '#60B3E9', '#6E74E6', '#84E8AA', '#F5BC6D', '#5A9D7E',
                    '#CCE16C', '#DD859B', '#93D68F', '#DD8DE2', '#84BDC6', '#8EA265', '#A18343',
                    '#F2AA94', '#407191', '#81AC90', '#9169DC', '#F9D976', '#1F84E0', '#55C9BE'];
                if (!response.success) {
                    $().alertmessage('showError', "获取失败！");
                    return;
                }
                var seriesArrayPie = [], datas = [], xArray = [], percent = [], seriesArray = [];
                var config = response.tableHeader.Config;
                var displayName = [], resData = [];
                var sunNum = 0;
                var renderData = {
                    config: config,
                    data: datas,
                    allNum: sunNum,
                    percent: percent
                };
                if (response.data.length) {
                    sunNum = response.data[0]._totalResult;
                    for (var c = 0; c < config.length; c++) {
                        displayName.push(config[c].displayname);
                        resData.push(response.data[0][config[c].name]);
                    }
                    for (var ds = 0; ds < displayName.length; ds++) {
                        datas.push({y: resData[ds], color: colors[ds], xArrayName: displayName[ds]})
                    }
                    var percent_data = 0;
                    for (var p = 0; p < datas.length; p++) {
                        percent_data = Math.round((datas[p].y / sunNum) * 10000) / 100;
                        var new_num = percent_data.toFixed(1) || 0;
                        percent.push(new_num);
                    }
                    for (var i = 0; i < datas.length; i++) {
                        xArray.push(datas[i].xArrayName);
                    }
                    //饼状图数据处理
                    for (var j = 0; j < datas.length; j++) {
                        if (!datas[j].xArrayName) {
                            continue;
                        }
                        var xArrayName = datas[j].xArrayName;
                        xArrayName = handler.report.questionnaire.cutstr(xArrayName, 20);
                        seriesArrayPie.push([xArrayName + "(" + datas[j].y + ")", datas[j].y]);
                    }
                    //饼状图颜色注释
                    function down(x, y) {
                        return (x.data < y.data) ? 1 : -1
                    }

                    seriesArrayPie.sort(down);

                    renderData.data = datas;
                    renderData.allNum = sunNum;
                    renderData.percent = percent;
                }
                handler.report.questionnaire.initTimeHighCharts('questionnaire_report_return_highcharts_container', datas, xArray, seriesArray, "questionnaire_report_return");
                //生成饼状图
                handler.report.questionnaire.generatePieHighCharts('questionnaire_return_highcharts_container', seriesArrayPie, "", "回访状态饼状图");
                //生成表头
                template.helper("$formatTime", handler.report.callReport.formatTime);
                $('#questionnaireReportReturnTabTbody').html(template('questionnaire_report_return_table_body', renderData));
                var table = $('#questionnaire_report_return_table_id');
                var width = table.width();
                var td_length = table.find('tr:eq(0) th').length;
                var one_wid = Math.floor(width / td_length);
                table.find('td').css({'max-width': one_wid, 'width': one_wid});
                table.find('th').css({'max-width': one_wid, 'width': one_wid});
            });
        }else {
            $('#questionnaire_report_return_btn').click();
        }
    },
    initTimeHighCharts : function(containerId,datas,xArray,seriesArray,xName,percentage){
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
                    handler.report.questionnaire.generateTimeHighCharts(containerId,datas,xArray,seriesArray,xName,percentage);
                }
            } else {
                //IE6、IE7、IE8 support js.onreadystatechange
                oScript.onreadystatechange = function () {
                    if (oScript.readyState == 'loaded' || oScript.readyState == 'complete') {
                        handler.report.questionnaire.generateTimeHighCharts(containerId,datas,xArray,seriesArray,xName,percentage);
                    }
                }
            }
        }else{
            handler.report.questionnaire.generateTimeHighCharts(containerId,datas,xArray,seriesArray,xName,percentage);
        }
    },
    generateTimeHighCharts: function(container, datas, xArray,seriesArray,xName,percentage){
        var titleText = "",
            name = '',
            text = '';
        if (xName == 'questionnaire_report_return'){
            titleText = '问卷回访状态报表';
            name = '回访状态报表';
            text = '数量';
        }else if(xName == 'questionnaire_report_question_detail'){
            titleText = '单量占比';
            name = '单量占比';
            text = '百分比';
        }
        var percent = '';
        if(percentage == true){
            percent = '%';
        }

        $('#'+container).highcharts({
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
                categories: xArray
            },
            yAxis: {
                title: {
                    text: text
                }
            },
            plotOptions: {
                column: {
                    cursor: 'pointer',
                    point: {
                        events: {
                        }
                    },
                    dataLabels: {
                        enabled: true,
                        color: '#323232',
                        style: {
                            fontWeight: 'bold',
                            textShadow: 'none'
                        },
                        formatter: function() {
                            return this.y + percent;
                        }
                    }
                }
            },
            tooltip: {
                formatter: function () {
                    var s = '<span style="font-size:10px">' + this.x + ':'+ this.y +'</span>';
                    //$.each(this.points, function () {
                    //    s += '<tr><td style="color:'+this.color+';padding:0">' + this.x + ': </td><td style="padding:0"><b>' +
                    //        this.y +"</b></td></tr>";
                    //});
                    //s+='</table>';
                    return s;
                },
                shared: true,
                useHTML: true
            },
            series: [{
                name: name,
                data: datas,
                color: '#fff'
            }],
            exporting: {
                enabled: false
            }
        })
            .highcharts(); // return chart
    },
    questionnaire_report_question_detail:function(data,src){
        if(data.create_time_begin !="" || data.create_time_end !=""){
            if(data.create_time_begin !="" && data.create_time_end !=""){
                if(data.create_time_begin > data.create_time_end){
                    $().alertmessage('showError', "创建时间的开始时间必须小于结束时间");
                    return;
                }
            }else{
                $().alertmessage('showError', "创建时间的起止时间都必须填写");
                return;
            }
        }
        if(data.return_time_begin !="" || data.return_time_end !=""){
            if(data.return_time_begin !="" && data.return_time_end !=""){
                if(data.return_time_begin > data.return_time_end){
                    $().alertmessage('showError', "回访时间的开始时间必须小于结束时间");
                    return;
                }
            }else{
                $().alertmessage('showError', "回访时间的起止时间都必须填写");
                return;
            }
        }
        if(data!='questionnaire_report_question_detail'){
            var action = {
                action : "quesReport.queryQuesAnwserReport",
                data :{
                    account: session.user.account,
                    query : data
                }
            };
            DS.util.sendActionWithUrl(DS._ds_report_url, action, function (res) {
                if (!res.success) {
                    $().alertmessage('showError', "获取失败！");
                    return;
                }
                var new_data = res.data;
                var questionnairetTabTbody = "";
                var pei_contnent = $('#question_detail_pei_content');
                pei_contnent.empty();
                var config_length = 0;
                for(var d in new_data){
                    var data_length = new_data[d].quesAnswerTableHeader.Config.length;
                    if(config_length < data_length){
                        config_length = new_data[d].quesAnswerTableHeader.Config.length;
                    }
                }
                for(var s in new_data){
                    var chanceDatas = [];
                    var config = new_data[s].quesAnswerTableHeader.Config;
                    if(config.length){
                        var chance_data = new_data[s].data || {};
                        var questionName = new_data[s].name + ":" + new_data[s].context;
                        var titleText="机会占比";
                        var quantityFlag = false;
                        var chance_data_flag = false;
                        for (var t in chance_data){
                            if(t){
                                chance_data_flag = true;
                            }
                        }
                        questionName = handler.report.questionnaire.cutstr(questionName,24);
                        var multiselect = getCache("questionnaireQues", new_data[s].quesId);
                        if(multiselect.isMultiselect){
                            var quantity_html = '<div class="pei_chance_box"><div id="question_detail_chance_'+s+'" style="width:100%;margin:0 auto;" class=" clearfix">'+
                                '<div class="pei_chance_box_title">'+questionName+'   结果占比图</div>'+
                                '<div id="question_detail_pie_chance_'+s+'" class="pei_quantity_children" style="width:50%"></div>'+
                                '<div id="question_detail_pie_quantity_'+s+'" class="pei_quantity_children" style="width:50%"></div>'+
                                '</div></div>';
                            pei_contnent.append(quantity_html);
                            quantityFlag = true;
                        }else{
                            var pei_con_s = '<div class="pei_chance_box"><div id="question_detail_chance_'+s+'" class=" clearfix">'+
                                '<div class="pei_chance_box_title" >'+questionName+'   结果占比图</div>'+
                                '<div id="question_detail_pie_chance_'+s+'" class="pei_chance_children" style="width:840px;margin:0 auto;"></div>'+
                                '</div></div>';
                            pei_contnent.append(pei_con_s);
                        }
                        if(chance_data_flag){
                            for(var c = 0;c < config.length;c++){
                                chanceDatas.push([config[c].displayname+"("+(chance_data[config[c].name] || 0)+")",(chance_data[config[c].name] || 0)]);
                            }
                        }

                        //饼状图颜色注释
                        function down(x, y) {
                            return (x.data < y.data) ? 1 : -1
                        }
                        var peiDatas = chanceDatas;
                        for(var p = 0;p<peiDatas.length;p++){
                            var str = peiDatas[p][0];
                            peiDatas[p][0] = handler.report.questionnaire.cutstr(str,20);
                        }
                        peiDatas.sort(down);
                        handler.report.questionnaire.generatePieHighCharts('question_detail_pie_chance_'+s,peiDatas,"",titleText);
                        var quantityDatas = [];
                        if(quantityFlag){
                            //var colors = Highcharts.getOptions().colors;
                            var colors = ['#83D050','#E86C64','#60B3E9','#6E74E6','#84E8AA','#F5BC6D','#5A9D7E',
                                        '#CCE16C','#DD859B','#93D68F','#DD8DE2','#84BDC6','#8EA265','#A18343',
                                        '#F2AA94','#407191','#81AC90','#9169DC','#F9D976','#1F84E0','#55C9BE'];
                            var seriesArray = [],xArray = [];
                            var quantityArray = chanceDatas;
                            if(chance_data_flag){
                                for(var q=0;q<config.length;q++){
                                    quantityDatas.push({y:chance_data[config[q].name] || 0,color:colors[q],xArrayName:config[q].displayname});
                                    xArray.push(config[q].displayname);
                                }
                            }
                            quantityArray.sort(down);
                            for(var qa = 0;qa<quantityDatas.length;qa++){
                                var qutNumerator = quantityDatas[qa].y;
                                var qutDenominator = new_data[s]._totalQuesSubmitNums || 0;
                                if(!qutNumerator || !qutDenominator){
                                    quantityDatas[qa].proportion = 0;
                                    quantityDatas[qa].y = 0;
                                }else{
                                    var _num = Math.round((qutNumerator/qutDenominator)*10000)/100;
                                    var new_num = _num.toFixed(1)
                                    quantityDatas[qa].proportion = new_num;
                                    quantityDatas[qa].y = Math.round((qutNumerator/qutDenominator)*1000)/10;
                                }
                            }
                            var percentage = true;//柱状图 展示数据为百分比
                            handler.report.questionnaire.initTimeHighCharts('question_detail_pie_quantity_'+s,quantityDatas,xArray,seriesArray,"questionnaire_report_question_detail",percentage);
                        }
                        for(var ch = 0;ch<chanceDatas.length;ch++){
                            var numerator = chanceDatas[ch][1];
                            var denominator = new_data[s]._totalQuesAnswers || 0;
                            if(!numerator || !denominator){
                                chanceDatas[ch].push(0);
                            }else{
                                var _num = Math.round((numerator/denominator)*10000)/100;
                                var new_num = _num.toFixed(1);
                                chanceDatas[ch].push(new_num);
                            }
                        }
                        //生成表
                        var renderData = {
                            total: new_data[s],
                            chanceDatas : chanceDatas,
                            quantityData: quantityDatas || [],
                            config: config,
                            maxLength: config_length
                        };
                        //if(chance_data_flag) {
                        template.helper("$formatTime", handler.report.callReport.formatTime);
                        questionnairetTabTbody += template('questionnaire_question_detail_table_body', renderData);
                        //}
                    }else{

                    }
                }
                $('#questionnaire_question_detail_tabel_box').html(questionnairetTabTbody);
                var table = $('#questionnaire_question_detail_tabel_box');
                var max_wid = table.outerWidth();
                var tit_wid = table.find('.question_detail_table_tit').outerWidth();
                var con_wid = max_wid - tit_wid;
                table.find('.question_detail_table_body').css({'width':con_wid,'max-width':con_wid});
                if($('#view_questionnaire_report_question_detail .pei_chance_box').length>2){
                    $('#view_questionnaire_report_question_detail').find('.pie_chat_action').show();
                }else{
                    $('#view_questionnaire_report_question_detail').find('.pie_chat_action').hide();
                }
            });
        }else {
            $('#questionnaire_question_detail_btn').click();
        }
    },
    generatePieHighCharts:function(containerId,seriesArray,xName,titleText){
        var xArray = new Array();
        //var titleText = xName;
        //var colors = Highcharts.getOptions().colors;
        $('#'+containerId).highcharts({
            chart: {
                type: 'pie'
            },
            legend: {
                symbolRadius:14,
                align:'right'
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
            title: {
                text: titleText
            },
            colors: /*colors,*/
                [
                '#83D050','#E86C64','#60B3E9','#6E74E6','#84E8AA','#F5BC6D','#5A9D7E',
                '#CCE16C','#DD859B','#93D68F','#DD8DE2','#84BDC6','#8EA265','#A18343',
                '#F2AA94','#407191','#81AC90','#9169DC','#F9D976','#1F84E0','#55C9BE'
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
    showMorePieChat:function(data,src){
        var pane = $('#question_detail_pei_content');
        var height = 850;
        var _html = "展开所有问题饼图";
        var d_data = 'retract';
        if(data=='retract'){
            var num = pane.find('.pei_chance_box').length;
            height = num*425;
            _html = "收起所有问题饼图";
            $(src).addClass('retract_pie_chat');
            d_data = 'develop'
        }else{
            $(src).removeClass('retract_pie_chat');
        }
        pane.animate({maxHeight:height+"px"});
        src.attr('ds_data',d_data).html(_html);
    },
    changeSearchInput:function(data,src){
        var pane = $(src).closest('form');
        var pane_list = pane.find('.remove_qiestion_detail');
        for(var p=0;p<pane_list.length;p++){
            pane_list[p].click();
        }
        var data_id = $(src).val();
        var allQuestion = getCache("questionnaireQues");
        var batchQuestion = new Array();
        for(var i=0;i<allQuestion.length;i++){
            if(data_id == allQuestion[i].temp_id){
                batchQuestion.push(allQuestion[i]);
            }
        }
        utils.loadSearchInput({ id: "question_detail_return_question_con_div",
            width: "149",
            height: "14",
            tip: "按回访问题搜索",
            data: batchQuestion,
            listField: ["name"],
            userIdField: "_id",
            searchField: ["name"],
            pinyinField: [],
            showAllList: true,
            callbackFuc: function (object) {
                console.log(object);
                if($.isArray(object) || !object._id){
                    return;
                }
                var currentVals = $("#view_questionnaire_report_question_detail input[name='ques_id[]']");

                var ishas = false;
                for (var i = 0; i < currentVals.length; i++) {
                    if (currentVals[i].value === object._id) {
                        ishas = true;
                    }
                }
                if (!ishas) {
                    $('#question_detail_return_question_con').before("<span id=" + object._id + "><input type='hidden' name='ques_id[]' value=" + object._id + ">" +
                        "<span class='label label-info'>" + object.name +
                        "</span><a  class='remove_qiestion_detail' href='#' onclick=removeQuestionDetail('" + object._id + "','return')><i class='icon-remove'></i></a>&nbsp;</span>");
                }
                countSelectAccessId(currentVals);
            }
        });

        var allBatchNumber = getCache("getQuestionnaireImportBatchNo");
        var batchNumber = new Array();
        for(var b=0;b<allBatchNumber.length;b++){
            if(data_id == allBatchNumber[b].dbType){
                batchNumber.push(allBatchNumber[b]);
            }
        }
        utils.loadSearchInput({ id: "question_detail_return_question_batch_num_div",
            width: "149",
            height: "14",
            tip: "按批次号搜索",
            data: batchNumber,
            listField: ["batchNo"],
            userIdField: "_id",
            searchField: ["batchNo"],
            pinyinField: [],
            showAllList: true,
            callbackFuc: function (object) {
                console.log(object);
                if($.isArray(object) || !object._id){
                    return;
                }
                var currentVals = $("#view_questionnaire_report_question_detail input[name='batchNos[]']");

                var ishas = false;
                for (var i = 0; i < currentVals.length; i++) {
                    if (currentVals[i].value === object.batchNo) {
                        ishas = true;
                    }
                }
                if (!ishas) {
                    $('#question_detail_return_question_batch_num').before("<span id=" + object._id + "><input type='hidden' name='batchNos[]' value=" + object.batchNo + ">" +
                        "<span class='label label-info'>" + object.batchNo +
                        "</span><a class='remove_qiestion_detail' href='#' onclick=removeQuestionDetail('" + object._id + "','batchNum')><i class='icon-remove'></i></a>&nbsp;</span>");
                }
                countSelectAccessId(currentVals);
            }
        });

        var allBatchDescription = getCache("getQuestionnaireImportBatchRemark");
        var batchDescription = new Array();
        for(var c=0;c<allBatchDescription.length;c++){
            if(data_id == allBatchDescription[c].dbType){
                batchDescription.push(allBatchDescription[c]);
            }
        }
        utils.loadSearchInput({ id: "question_detail_return_question_batch_explain_div",
            width: "149",
            height: "14",
            tip: "按批次说明搜索",
            data: batchDescription,
            listField: ["batchRemark"],
            userIdField: "_id",
            searchField: ["batchRemark"],
            pinyinField: [],
            showAllList: true,
            callbackFuc: function (object) {
                console.log(object);
                if($.isArray(object) || !object._id){
                    return;
                }
                var currentVals = $("#view_questionnaire_report_question_detail input[name='batchRemarks[]']");

                var ishas = false;
                for (var i = 0; i < currentVals.length; i++) {
                    if ($(currentVals[i]).attr('value_id') === object._id) {
                        ishas = true;
                    }
                }
                if (!ishas) {
                    $('#question_detail_return_question_batch_explain').before("<span id=" + object._id + "><input type='hidden' name='batchRemarks[]' value=" + object.batchRemark + " value_id=" + object._id + ">" +
                        "<span class='label label-info'>" + object.batchRemark +
                        "</span><a class='remove_qiestion_detail' href='#' onclick=removeQuestionDetail('" + object._id + "','batchExplain')><i class='icon-remove'></i></a>&nbsp;</span>");
                }
                countSelectAccessId(currentVals);
            }
        });
    },
    changeReportSearchInput:function(data,src){
        var pane = $(src).closest('form');
        var pane_list = pane.find('.remove_qiestion_return');
        for(var p=0;p<pane_list.length;p++){
            pane_list[p].click();
        }
        var data_id = $(src).val();
        var allBatchNumber = getCache("getQuestionnaireImportBatchNo");
        var batchNumber = new Array();
        for(var b=0;b<allBatchNumber.length;b++){
            if(data_id == allBatchNumber[b].dbType){
                batchNumber.push(allBatchNumber[b]);
            }
        }
        utils.loadSearchInput({ id: "questionnaire_batch_num_drop_div",
            width: "149",
            height: "14",
            tip: "按批次号搜索",
            data: batchNumber,
            listField: ["batchNo"],
            userIdField: "_id",
            searchField: ["batchNo"],
            pinyinField: [],
            showAllList: true,
            callbackFuc: function (object) {
                console.log(object);
                if($.isArray(object) || !object._id){
                    return;
                }
                var currentVals = $("#view_questionnaire_report_return input[name='batchNos[]']");
                var ishas = false;
                for (var i = 0; i < currentVals.length; i++) {
                    if ($(currentVals[i]).attr("value_id") === object._id) {
                        ishas = true;
                    }
                }
                if (!ishas) {
                    $('#questionnaire_batch_num_drop').before("<span id=" + object._id + "><input type='hidden' name='batchNos[]' value=" + object.batchNo + " value_id=" + object._id + ">" +
                        "<span class='label label-info'>" + object.batchNo +
                        "</span><a class='remove_qiestion_return' href='#' onclick=removeQuestionReturn('" + object._id + "','num')><i class='icon-remove'></i></a>&nbsp;</span>");
                }
                countSelectAccessId(currentVals);
            }
        });

        var allBatchDescription = getCache("getQuestionnaireImportBatchRemark");
        var batchDescription = new Array();
        for(var c=0;c<allBatchDescription.length;c++){
            if(data_id == allBatchDescription[c].dbType){
                batchDescription.push(allBatchDescription[c]);
            }
        }
        utils.loadSearchInput({ id: "questionnaire_batch_explain_drop_div",
            width: "149",
            height: "14",
            tip: "按批次说明搜索",
            data: batchDescription,
            listField: ["batchRemark"],
            userIdField: "_id",
            searchField: ["batchRemark"],
            pinyinField: [],
            showAllList: true,
            callbackFuc: function (object) {
                console.log(object);
                if($.isArray(object) || !object._id){
                    return;
                }
                var currentVals = $("#view_questionnaire_report_return input[name='batchRemarks[]']");

                var ishas = false;
                for (var i = 0; i < currentVals.length; i++) {
                    if ($(currentVals[i]).attr("value_id") === object._id) {
                        ishas = true;
                    }
                }
                if (!ishas) {
                    $('#questionnaire_batch_explain_drop').before("<span id=" + object._id + "><input type='hidden' name='batchRemarks[]' value=" + object.batchRemark + " value_id=" + object._id + ">" +
                        "<span class='label label-info'>" + object.batchRemark +
                        "</span><a class='remove_qiestion_return' href='#' onclick=removeQuestionReturn('" + object._id + "','explain')><i class='icon-remove'></i></a>&nbsp;</span>");
                }
                countSelectAccessId(currentVals);
            }
        });
    },
    exportResultReportExcel : function (data){
        data.account = session.user.account;
        data.type = 'exportQuesResultReport';
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'exportQuesResultReport',Query:data}
        };
        DS.send(action,function(rep) {
            if(rep.Succeed){
                downloadFile(rep.path);
            }else{
                alert('导出失败！');
            }
        });
    },
    exportAnswerReportExcel : function (data){
        data.account = session.user.account;
        data.type = 'exportQuesAnswerReport';
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'exportQuesAnswerReport',Query:data}
        };
        DS.send(action,function(rep) {
            if(rep.Succeed){
                downloadFile(rep.path);
            }else{
                alert('导出失败！');
            }
        });
    },
    cutstr : function(str,len){
    var str_length = 0;
    var str_len = 0;
    var str_cut = new String();
    str_len = str.length;
    for(var i = 0;i<str_len;i++)
    {
        a = str.charAt(i);
        str_length++;
        if(escape(a).length > 4)
        {
            //中文字符的长度经编码之后大于4
            str_length++;
        }
        str_cut = str_cut.concat(a);
        if(str_length>=len)
        {
            str_cut = str_cut.concat("...");
            return str_cut;
        }
    }
    //如果给定字符串小于指定长度，则返回源字符串；
    if(str_length<len){
        return  str;
    }
}
}
