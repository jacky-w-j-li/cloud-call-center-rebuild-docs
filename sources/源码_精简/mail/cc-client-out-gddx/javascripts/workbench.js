/**
 * Created by chenguang on 11/17/15.
 */
handler.workbench = {
    inComplete:0,
    inCalls:0,
    outComplete:0,
    outCalls:0,
    dialoutTimeLength:0,
    dialinTimeLength:0,
    toShowDate:false,
    toShowDateCustName:'',
    toShowDateCustStatus:"",
    toShowDateCustSales:"",
    workbench_main : function(data){
        var workbench = handler.workbench;
        var pane = $('#contact_workbench');
        if(session.user.im_icon && session.user.im_icon != ''){
            pane.find(".S_line5").attr("src",session.user.im_icon+"?imageView2/1/w/50/h/50");
        }else if(session.user.im){
            if(session.user.im.picture) {
                var picture = session.user.im.picture;
                pane.find(".S_line5").attr("src", "http://115.29.160.119/download?Action=GetPic&Picture=" + picture + "_35&Account=" + session.user.account);
            }
        }
        pane.find('.my-info-my-name').html(session.user.displayName);
        pane.find('.my-info-my-num').html(session.user.exten);
        pane.find('.my-contact-email').html(session.user.email ? "<span></span>"+session.user.email : '');
        pane.find('.my-contact-pnum').html(session.user.mobile ? "<span></span>"+session.user.mobile : '');

        $('#workbench-inbound-count').html(workbench.inComplete);
        $('#workbench-inbound-total').html(workbench.inCalls);
        var inRate = '';
        if(workbench.inCalls!=0){
            inRate = (workbench.inComplete/workbench.inCalls*100).toFixed(0) + '%';
        }
        $('#workbench-inbound-rate').html(inRate);
        $('#workbench-outbound-count').html(workbench.outComplete);
        $('#workbench-outbound-total').html(workbench.outCalls);
        //var outRate = '';
        //if(workbench.outCalls!=0){
        //    outRate = (workbench.outComplete/workbench.outCalls*100).toFixed(0) + '%';
        //}
        //$('#workbench-outbound-rate').html(outRate);
        if(workbench.dialinTimeLength != 0){
            $('#workbench-inbound-dialinTime').html(_cti_ui_getTimerSimple(Math.ceil(workbench.dialinTimeLength / 1000)));
            $('#workbench-inbound-averageDialinTime').html(_cti_ui_getTimerSimple(Math.ceil(workbench.dialinTimeLength/1000/workbench.inComplete)));
        }
        if(workbench.dialoutTimeLength != 0){
            $('#workbench-outbound-dialoutTime').html(_cti_ui_getTimerSimple(Math.ceil(workbench.dialoutTimeLength / 1000)));
            $('#workbench-outbound-averageDialoutTime').html(_cti_ui_getTimerSimple(Math.ceil(workbench.dialoutTimeLength/1000/workbench.outComplete)));
        }

        var action = {
            action: "app.workbench.workbenchRefresh",
            data: {}
        }
        DS.send(action, function (res) {
            if(res.success){
                //init date
                if(res.dateList.length >0){
                    DS.getView('workbench/workbench_date_item', function (view) {
                        var html = [];
                        for (var i = 0, len = res.dateList.length; i < len; i++) {
                            var str = res.dateList[i].notifyTime;
                            str = str.replace(/-/g,'/');
                            var date = new Date(str).getTime();
                            var timeDistance = date - res.serverCurrentTime;
                            if(timeDistance <= 60*60*1000){
                                res.dateList[i].color = "emergency-top";
                            }else if(timeDistance <= 3*60*60*1000 && timeDistance > 60*60*1000){
                                res.dateList[i].color = "emergency-less";
                            }else{
                                res.dateList[i].color = "";
                            }
                            if(getCurrentDate() == res.dateList[i].notifyTime.split(" ")[0]){
                                res.dateList[i].notifyTime = res.dateList[i].notifyTime.split(" ")[1];
                            }
                            html.push(DS.renderMethodViewNew(view, res.dateList[i]));
                        }
                        pane.find('.today-communication').html(html.join(''));
                        session.currentPage.pageId = 'nav_workbench';
                    });
                }else{
                    pane.find('.today-communication').html('<span class="communicat-remarks" style="color: darkgray">目前没有联系计划</span>');
                }

                //init sales
                if(res.sales){
                    handler.report.callReport.resetDate('workbench_customer_report_sale_agent_dateTd',"all");
                    pane.find("#workbench_customer_report_sale_agent_time_type").val("all");
                    //total:1,deal:1,money:1,lost:1,invalid:1
                    var total = res.sales.total == null ? 0 : res.sales.total;
                    var deal = res.sales.deal == null ? 0 : res.sales.deal;
                    var money = res.sales.money == null ? 0 : res.sales.money;
                    money = Math.round(money)/10000;
                    var lost = res.sales.lost == null ? 0 : res.sales.lost;
                    var invalid = res.sales.invalid == null ? 0 : res.sales.invalid;
                    var recycle = res.sales.recycle == null ? 0 : res.sales.recycle;
                    var dealRatio = 0;
                    if(total != 0 && deal != 0){
                        dealRatio = parseFloat(deal/(total + lost + invalid)*100).toFixed(1);
                    }
                    $(".dealRatio").text(dealRatio + "%");
                    $(".total").text(total);
                    $(".deal").text(deal);
                    $(".money").text(money);
                    $(".lost").text(lost);
                    $(".recCount").text(recycle);
                    $(".invalid").text(invalid);
                }

                //init business
                $("#workbench-business-toClaim").html(res.busToClaim);
                $("#workbench-business-toDeal").html(res.busToDeal);
                //init customer
                var custStatusMap=getCache('custTmpls')[0].status;
                var custStatusHtml = '';
                for(var ss=0;ss<res.custStatusList.length;ss++){
                    var status = res.custStatusList[ss];
                    var statusId = status._id;
                    var num = status.count;
                    if(num<0){
                        num = 0;
                    }
                    if (!custStatusMap[statusId]) {
                        continue;
                    }else{
                        custStatusHtml += '<li class="'+statusId+' ds_do_action" ds_action="workbench.clickCustomer" ds_data="'+statusId
                            +'" style="cursor: pointer;">'+custStatusMap[statusId]+'<span>'+num+'</span></li>';
                    }
                }
               /* for ( var status in res.custStatusList ){
                    var num = res.custStatusList[status];
                    if(num<0){
                        num = 0;
                    }
                    if (!custStatusMap[status]) {
                        continue;
                    }else{
                    custStatusHtml += '<li class="'+status+' ds_do_action" ds_action="workbench.clickCustomer" ds_data="'+status
                        +'" style="cursor: pointer;">'+custStatusMap[status]+'<span>'+num+'</span></li>';
                    }
                }*/
                if(custStatusHtml != ''){
                    pane.find('.today-customer-analysis').html(custStatusHtml);
                }
                //init agent task
                var agentTaskHtml = '';
                pane.find('.today-agent-task-analysis').empty();
                for(var i=0 ; i<res.task.length ;i++){
                    handler.customer.task._initDialTaskNullFields(res.task[i]);
                    var createUser = handler.customer.task.getAgentName(res.task[i].createUser);
                    agentTaskHtml += '<li class="ds_do_action" ds_action="workbench.clickTask" ds_data="'+res.task[i]._id +'">' +
                        '<div id="wdaily_chart'+i+'" class="wdaily_chart"><canvas width="200" height="200" class="pull-left"></canvas><span></span></div>'+
                        '<div class="chart_bing">'+res.task[i].taskName +'<br/>'+
                        createUser +'<br/> ' +
                        // '<span class="analysis-title">状态：'+res.task[i].status +'</span><br/>  '+
                        // '<span class="analysis-percent">任务总量：'+res.task[i].total +'</span><br/> '+
                        res.task[i].createTime +
                        '</div></li>';
                }
                if(agentTaskHtml != ''){
                    pane.find('.today-agent-task-analysis').html(agentTaskHtml);
                    for(var i=0 ; i<res.task.length ;i++){
                        var chartId = "wdaily_chart"+i;
                        var cpane = document.getElementById(chartId);
                        var canvas = cpane.getElementsByTagName("canvas")[0];
                        var span = cpane.getElementsByTagName("span")[0];
                        var ctx = canvas.getContext("2d");
                        var startPoint= 1.5 * Math.PI;
                        var color = ["#dad8d8","#37b5ed"];
                        var unit = res.task[i].unit;
                        res.task[i].dailyTaskDone = 0;
                        if(res.taskUDailyDocs.length>0){
                            for(var j=0;j<res.taskUDailyDocs.length;j++){
                                if(res.taskUDailyDocs[j].taskId == res.taskUserDocs[i].taskId){
                                    if(unit == "1"){
                                        res.task[i].dailyTaskDone = res.taskUDailyDocs[j].linked;
                                    }else if(unit == "2"){
                                        res.task[i].dailyTaskDone = res.taskUDailyDocs[j].effective/60;
                                    }
                                }
                            }
                        }
                        var percent = Math.floor((100 * res.task[i].dailyTaskDone / res.taskUserDocs[i].dailyTask))||0;
                        if (res.task[i].dailyTaskDone>res.taskUserDocs[i].dailyTask) {
                            percent = 100;
                        }
                        var data = [100-percent,percent];
                        $(span).html((res.task[i].dailyTaskDone||0)+"/"+(res.taskUserDocs[i].dailyTask||0));
                        for(var j=0;j<data.length;j++){
                            ctx.fillStyle = color[j];
                            ctx.strokeStyle = color[j];
                            ctx.beginPath();
                            ctx.moveTo(100,100);
                            ctx.arc(100,100,100,startPoint,startPoint-Math.PI*2*(data[j]/100),true);
                            ctx.fill();
                            ctx.stroke();
                            startPoint -= Math.PI*2*(data[j]/100);
                        }
                    }
                }

                //init multi channel report
               /* var action = {
                    action: 'workbench.queryAgentWorkbenchReport',
                    data: {agentId:session.user._id}
                };
                DS.util.sendActionWithUrl(DS._ds_report_url, action, function (res) {
                    if(res.success){
                        if(res.data.length >0){
                            var weixin = 0;
                            var pc = 0;
                            var wap = 0;
                            var sdk = 0;
                            for(var i=0;i<res.data.length;i++){
                                if(res.data[i]._id == 'weixin'){
                                    weixin = res.data[i].count;
                                }else if(res.data[i]._id == 'pc'){
                                    pc = res.data[i].count;
                                }else if(res.data[i]._id == 'wap'){
                                    wap = res.data[i].count;
                                }else if(res.data[i]._id == 'sdk'){
                                    sdk = res.data[i].count;
                                }
                            }
                            var allCount = weixin + pc + wap + sdk;
                            if(weixin != 0){
                                pane.find('.weixin-analysis').removeClass('null');
                                pane.find('.weixin-analysis').find('.analysis-pieces').html(weixin);
                                pane.find('.weixin-analysis').find('.analysis-percent').html((weixin/allCount*100).toFixed(0) + '%');
                            }
                            if(pc != 0 || wap != 0){
                                pane.find('.web-analysis').removeClass('null');
                                pane.find('.web-analysis').find('.analysis-pieces').html(pc+wap);
                                pane.find('.web-analysis').find('.analysis-percent').html(((pc+wap)/allCount*100).toFixed(0) + '%');
                            }
                            if(sdk != 0){
                                pane.find('.app-analysis').removeClass('null');
                                pane.find('.app-analysis').find('.analysis-pieces').html(sdk);
                                pane.find('.app-analysis').find('.analysis-percent').html((sdk/allCount*100).toFixed(0) + '%');
                            }
                        }
                    }
                });*/


                
                //商机券开关显示

                handler.workbench.queryCustTitketCount(session);


                if(session.user.getCustFlag==0){//关
                    $("#chanceTicket_switch").bootstrapSwitch({size:'small',onColor:'success',offColor:'warning',onText:'开',offText:'关',state:false});
                }else{//开
                    $("#chanceTicket_switch").bootstrapSwitch({size:'small',onColor:'success',offColor:'warning',onText:'开',offText:'关',state:true});
                }
                var noteList=res.noteList||[];
                if(noteList.length>0) {
                    var num = 0;
                     for (var i = 0; i < noteList.length; i++) {
                            var obj = noteList[i];
                            num++;
                        }
                        var msg = "您有["+num+"]个联系计划到期提醒,请及时查看!";
                        $().alertmessage('showNotify', msg);
                }
            }
        });
    },
    clickDate : function(data){
        //if($(handler.customer.cid).find(".btn_customer_my").length > 0){
        //    $("#main-panel").find(".left_col").find("#nav_customer").click();
        //    $(handler.customer.cid).find(".btn_customer_my").click();
        //    $("#view_nav_customer").find(".textbox_input").val(data);
        //    $("#view_nav_customer").find('.customer_normal_search').click();
        //}else{
        //
        //}
        $("#main-panel").find(".left_col").find("#nav_customer").click();
        handler.workbench.toShowDateCustName = data;
        $("#view_nav_customer").find(".btn_customer_my").click();
    },
    clickCustomer : function(data){
        handler.workbench.toShowDateCustStatus = data;
        $("#main-panel").find(".left_col").find("#nav_customer").click();
        $("#view_nav_customer").find(".btn_customer_my").click();
    },
    clickCustomerSysStatus : function(data){
        handler.workbench.toShowDateCustSales = data;
        $("#main-panel").find(".left_col").find("#nav_customer").click();
        $("#view_nav_customer").find(".btn_customer_my").click();
    },
    clickBusiness : function(data){
        if(data == 'btn_my_role'){
            $("#main-panel").find(".left_col").find("#nav_business").click();
            $(handler.business.cid).find(".btn_my_role").click();
        }else{
            if($(handler.business.cid).find("."+data).length > 0){
                $("#main-panel").find(".left_col").find("#nav_business").click();
                $(handler.business.cid).find("."+data).click();
            }else{
                $("#main-panel").find(".left_col").find("#nav_business").click();
                handler.workbench.toShowBusMyTodo = true;
            }
        }
    },
    chanceTicket:function(data){
        var taskId = data.taskId;
        var p=$('#chanceTicket-status');
        DS.getView('workbench/workbench_chanceticket',function(view){
            view=view.replace(/_#taskId#_/g,taskId);
            p.width(600);
            p.find('.modal-title').text('商机券详情');
            p.find(".modal-body").html(view);
            var data = {"status":"1","user":session.user._id};
            $("#my_status").val("1");
            $("#currentUser").val(session.user._id);
            handler.workbench.queryMyTitketList(data);
            p.modal();
        });
    },
    myTitketTab : function (data,src){
        var sendData = {"status":data,"user":session.user._id};
        $('#my_status').val(data);
        $('#currentUser').val(session.user._id);
        handler.workbench.queryMyTitketList(sendData);
    },
    queryMyTitketList : function (data,src){
        var container = $("#myTitketItemPane");
        container.find(".pagination").attr({for:"frm_cust_titket_detail_search"});
        var page=1;
        if(src && !src.hasClass("ds_do_action"))page=src.val();
        if(!page)page=1;
        data.page=page;
        data.limit=handler.customer.titket.limit;
        var action = {
            action: 'app.customer.titket.queryCustTitketList',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var custTitket = response.list;
                if(custTitket.length > 0){
                    var html = [];
                    DS.getView('customer/customer_my_titket_item', function (view) {
                        for (var i = 0; i < custTitket.length; i++) {
                            var titket = custTitket[i];
                            var user = getCache("agents",titket.user);
                            titket.displayName = user.displayName;
                            if(titket.source =="system"){
                                titket.source = "系统赠";
                            }else{
                                var sourceUser = getCache("agents",titket.source);
                                titket.source = sourceUser.displayName + "赠";
                            }
                            if(titket.status == 1){
                                titket.active = "";
                            }else{
                                titket.disabled = "disabled";
                            }
                            handler.customer.titket.initTitketFiled(titket);
                            html.push(DS.renderMethodViewNew(view,titket));
                        }
                        container.find('#cust_titket_detail_list').html(html.join(""));
                    });
                } else {
                    var html='<tr style="text-align: center;"><td colspan="8">未找到奖罚劵!</td></tr>';
                    container.find('#cust_titket_detail_list').html(html);
                }

                DS.updatePagination("frm_cust_titket_detail_search", response.count, handler.customer.titket.limit, data.page);
            }else{
                $().alertmessage('showError', '未找到商机卷信息!');
            }
        });
    },
    queryCustTitketCount : function (session){
        var action = {
            action: 'app.customer.titket.queryCustTitketCount',
            data: {user:session.user._id}
        };
        DS.send(action, function (response) {
            if(response.success){
                var colorGreen = 'chanceTicket-sum-green',
                    colorBrown = 'chanceTicket-sum-brown',
                    iconGive = 'chanceTicket-icon-give',
                    iconPunish = 'chanceTicket-icon-punish',
                    chanceTicketSum = $(".chanceTicket-sum"),
                    chanceTicketIcon = $(".chanceTicket-icon"),
                    cahnceTicketGive = $(".chanceTicket-give");
                if(response.rewardTitketCount >= response.penaltyTitketCount){
                    chanceTicketSum.removeClass(colorBrown).addClass(colorGreen);
                    chanceTicketIcon.removeClass(iconPunish).addClass(iconGive);
                    cahnceTicketGive.show();
                    cahnceTicketGive.click(function(){
                        $(".chanceTicket-toggle").show();
                    });
                    chanceTicketSum.text(response.rewardTitketCount);
                }else{
                    chanceTicketSum.removeClass(colorGreen).addClass(colorBrown);
                    chanceTicketIcon.removeClass(iconGive).addClass(iconPunish);
                    if(chanceTicketIcon.hasClass(iconPunish)){
                        cahnceTicketGive.hide();
                        $(".chanceTicket-toggle").hide();
                    }
                    chanceTicketSum.text(response.penaltyTitketCount);
                }
            }else{
                $().alertmessage('showError', response.message);
            }
            var chanceTicketSet = $(".chanceTicket-set"),
                chanceTicketNot = $(".chanceTicket-not");
            if(chanceTicketSum.text() == 0){
                chanceTicketSet.hide();
                chanceTicketNot.show();
            }else{
                chanceTicketSet.show();
                chanceTicketNot.hide();
            }
        });
    },
    querySalesStatistics : function(data,src) {
        console.dir(data);
        var action = {
            action: 'app.customer.querySalesStatistics',
            data: data
        };
        DS.send(action, function (res) {
            if (res.success) {
                //init sales
                if(res.sales){
                    //total:1,deal:1,money:1,lost:1,invalid:1
                    var total = res.sales.total == null ? 0 : res.sales.total;
                    var deal = res.sales.deal == null ? 0 : res.sales.deal;
                    var money = res.sales.money == null ? 0 : res.sales.money;
                    var lost = res.sales.lost == null ? 0 : res.sales.lost;
                    var invalid = res.sales.invalid == null ? 0 : res.sales.invalid;
                    var recycle = res.sales.recycle == null ? 0 : res.sales.recycle;
                    var dealRatio = 0;
                    if(total != 0 && deal != 0){
                        dealRatio = parseFloat(deal/(total + lost + invalid)*100).toFixed(1);
                    }
                    $(".dealRatio").text(dealRatio + "%");
                    $(".total").text(total);
                    $(".deal").text(deal);
                    $(".money").text(money);
                    $(".lost").text(lost);
                    $(".recCount").text(recycle);
                    $(".invalid").text(invalid);
                }
            } else {
                $().alertmessage('showError', res.message);
            }
        })
    }
}