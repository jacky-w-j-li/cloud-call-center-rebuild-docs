handler.zjNum = {
    pageSize:20,
    timerHandler:null,
    countTimer:0,
    msg1:'该号码已经超时释放或被其他人抢用!',
    productType:"zj",
    refreshAccInfo:function(src){
        handler.zjNum.queryMyNum_zj(src);
    },
    showStatusDesc:function(data){
        var html='';
        var unpassReason=data.unpassReason;
        var status=data.status;
        var failNum=data.failNum;
        var planFlag=data.planFlag;
        var isOld=data.isOld;
        if(isOld){
            if(status=='try'){
                html='<div class="status_try">试用</div><div class="text-muted" style="font-size: 10px;">'+data.endTime+'到期</div>';
            }else if(status=='use'){
                html='<div class="status_use">在用</div><div class="text-muted" style="font-size: 10px;">'+data.endTime+'到期</div>';
            }else if(status=='stop'||status=='stopTry'){
                html='<div class="status_stop">停用</div>';
            }else if(status=='verify'){
                html='<div class="status_try">待审核</div>';
            }else if(status=='unpass'){
                html='<div class="status_stop">审核未通过</div>';
            }
        }else{
            if(status=='try'){
                html='<div class="status_try">试用</div><div class="text-muted" style="font-size: 10px;">'+data.endTime+'到期</div>';
            }else if(status=='waitPay'){
                html='<div class="status_try">等待支付</div><div class="text-muted" style="font-size: 10px;">'+data.endTime+'到期</div>';
            }else if(status=='verify'){
                html='<div class="status_try">待审核</div><div class="text-muted" style="font-size: 10px;"></div>';
            }else if(status=='unpass'){
                html='<div class="status_stop">审核未通过 ('+(unpassReason)+')</div><div class="text-muted" style="font-size: 10px;">第二天释放</div>';
            }else if(status=='use'){
                if(planFlag=='stop'){
                    html='<div class="status_try">在用</div><div class="text-muted" style="font-size: 10px;">请求下月1号停用</div>';
                }else if(planFlag=='sysStop'){
                    html='<div class="status_try">在用</div><div class="text-muted" style="font-size: 10px;">欠费下月1号停用</div>';
                }else if(planFlag=='reduce'){
                    html='<div class="status_try">在用</div><div class="text-muted" style="font-size: 10px;">下月并发减为'+data.concurrentNew+'</div>';
                }else{
                    html='<div class="status_use">在用</div>';
                }
            }else if(status=='stop'||status=='stopTry'){
                if(failNum>3){
                    html='<div class="status_stop">停用</div><div class="text-muted" style="font-size: 10px;">进入销号阶段</div>';
                }else{
                    html='<div class="status_stop">停用</div><div class="text-muted" style="font-size: 10px;">欠费第'+failNum+'个月</div>';
                }
            }
        }
        return html;
    },
    queryMyNum_zj:function(src){
        var pane=$("#right_pane");
        var product=handler.zjNum.productType;
        handler.account._initMyProduct(src);
        var action={
            action:'app.account.queryMyServer',
            data:{product:product}
        }
        DS.send(action,function(rep){
            if(rep.success){
                session.account.balance=rep.account.balance;
                session.account.overdraw=rep.account.overdraw||0;
                var tel=rep.tel;
                var tel400=rep.tel400;
                var currentProduct=handler.getProductFee();
                var concurrentPrice=currentProduct.concurrentPrice||100000;

                if(tel && tel.length>0){
                    var tmplZJ='<tr class="_#trclass#_"> <td>_#name#_</td><td>_#type#_</td> <td title="_#concurrentFee#_">_@formatTrueFee(_#monthRentCombo#_)@_元/月</td><td>_#concurrent#_</td><td>_#statusDesc#_</td>';
                    var suffix_use='<td><button type="button" class="btn btn-info btn-xs ds_do_action"  ds_action="zjNum.showAdjustConcurrent" style="margin-right: 10px;" ds_data="_#code#_">调整并发</button>_#btnContent#_</td></tr>';
                    var suffix_wait_pay='<td><button type="button" class="btn btn-info btn-xs ds_do_action"  ds_action="zjNum.showServiceNoInfo" style="margin-right: 10px;" ds_data="_#name#_">支付</button></td></tr>';

                    var suffix_try='<td><button type="button" class="btn btn-info btn-xs ds_do_action bill_hide"  ds_action="zjNum.showTestRenew"  ds_data="_#name#_" ds_attr="_#status#_">延期试用</button></td></tr>';
                    var suffix_stop='<td><button type="button" class="btn btn-info btn-xs ds_do_action"  ds_action="zjNum.enableNum"  ds_data="_#code#_">启用</button></td></tr>';
                    var suffix_other='<td>_#btnContent#_</td></tr>';

                    var tmpl_btn_stop='<button type="button" class="btn btn-info btn-xs ds_do_action stop_num"  ds_action="zjNum.showStopNum" style="margin-right: 10px;" ds_data="_#code#_" ds_attr="_#monthRent#_">停用</button>' +
                        '<button type="button" class="btn btn-info btn-xs ds_do_action cancelStop"  ds_action="zjNum.cancelStopNum" style="display: none;" ds_data="_#code#_">取消停用</button>';
                    var tmpl_btn_cancel='<button type="button" class="btn btn-info btn-xs ds_do_action stop_num"  ds_action="zjNum.showStopNum" style="margin-right: 10px;display: none;" ds_data="_#code#_" ds_attr="_#monthRent#_">停用</button>' +
                        '<button type="button" class="btn btn-info btn-xs ds_do_action cancelStop"  ds_action="zjNum.cancelStopNum" style="" ds_data="_#code#_">取消停用</button>';
                    var tmpl="";
                    var html=[];
                    for (var i = 0; i < tel.length; i++) {
                        var obj = tel[i];
                        var btnContent="";
                        var status=obj.status;
                        var flag=obj.flag;
                        var failNum=obj.failNum;
                        var isOld=obj.isOld;
                        var typeDesc="未指定";
                        if(flag=='didnum'){
                            typeDesc="直拨号码";
                        }else if(flag=="service"){
                            typeDesc="服务号码";
                        }
                        var statusDesc=handler.zjNum.showStatusDesc(obj);
                        var concurrentFee=concurrentPrice*(obj.concurrent-1);
                        var col1={code:obj._id+'|'+status,type:typeDesc,name:obj._id,monthRentCombo:obj.monthRent+concurrentFee,concurrent:obj.concurrent,statusDesc:statusDesc,trclass:''};
                        col1.monthRent=obj.monthRent;
                        col1.status=obj.status;
                        if(concurrentFee>0){
                            col1.concurrentFee="其中并发费用为"+handler.formatTrueFee(concurrentFee)+"元";
                        }
                        if(isOld){//兼容旧的
                            btnContent="";
                            tmpl=tmplZJ+suffix_other;
                        }else{
                            if(status=='try'){
                                tmpl=tmplZJ+suffix_wait_pay;
                            }else if(status=='waitPay'){
                                tmpl=tmplZJ+suffix_wait_pay;
                            }else if(status=='verify'||status=='unpass'){
                                tmpl=tmplZJ+'<td> </td>';
                            }else if(status=='use'){
                                if(obj.flag=="service"){
                                    tmpl=tmplZJ+suffix_use;
                                }else{
                                    tmpl=tmplZJ+suffix_other;
                                }
                                if(obj.planFlag=='stop'){
                                    btnContent=tmpl_btn_cancel;
                                }else if(obj.planFlag=='sysStop'){
                                    btnContent="";
                                    tmpl=tmplZJ+suffix_other;
                                }else{
                                    btnContent=tmpl_btn_stop;
                                }
                            }else if(status=='stop'||status=='stopTry'){
                                if(failNum>3){
                                    btnContent="";
                                    tmpl=tmplZJ+suffix_other;
                                }else{
                                    tmpl=tmplZJ+suffix_stop;
                                }
                            }
                        }
                        col1.btnContent=DS.renderMethodViewNew(btnContent, col1);
                        html.push(DS.renderMethodViewNew(tmpl, col1));
                    }
                    pane.find("#sn_normal_list").html(html.join(""));
                }else{
                    pane.find("#sn_normal_list").html('<tr><td colspan="10" class="text-center">还未购买任何号码</td></tr>');
                }

                if(tel400 && tel400.length>0){
                    var tmpl='<tr class="_#trclass#_"> <td>_#name#_</td><td>_@formatTrueFee(_#minConsume#_)@_元/月</td><td>_#price#_</td><td>_#statusDesc#_</td></tr>';
                    var html=[];
                    for (var i = 0; i < tel400.length; i++) {
                        var obj = tel400[i];
//                        console.dir(obj);
                        var statusDesc=handler.zjNum.showStatusDesc(obj);
                        var status=obj.status;
                        var tmpl1="<div>市话<span>_@formatTrueFee(_#local#_)@_元/分钟</span>&nbsp;&nbsp;&nbsp;长途<span>_@formatTrueFee(_#remote#_)@_元/分钟</span></div>";
                        var tmpl2="<div>本地前3分钟<span>_@formatTrueFee(_#prefixMin#_)@_元/分钟</span>&nbsp;&nbsp;&nbsp;本地以后每分钟<span>_@formatTrueFee(_#local#_)@_元/分钟</span>&nbsp;&nbsp;&nbsp;长途<span>_@formatTrueFee(_#remote#_)@_元/分钟</span></div>";
                        var tmplSecond="<div>市话<span>_@formatTrueFee(_#local#_)@_元/6秒</span>&nbsp;&nbsp;&nbsp;长途<span>_@formatTrueFee(_#remote#_)@_元/6秒</span></div>";
                        var _html=[];
                        switch (obj.dial400FeeStrategy){
                            case "minute":
                                _html.push(DS.renderMethodViewNew(tmpl1,obj.dial400Fee));
                                break;
                            case "second6":
                                _html.push(DS.renderMethodViewNew(tmplSecond,obj.dial400Fee));
                                break;
                            case "minute3":
                                _html.push(DS.renderMethodViewNew(tmpl2,obj.dial400Fee));
                                break;
                        }
                        obj.price=_html.join("");
                        var col1={code:obj._id+'|'+status,name:obj._id,bindNum:obj.bindNum||"",price:obj.price,minConsume:obj.min400Consume,statusDesc:statusDesc};
                        html.push(DS.renderMethodViewNew(tmpl, col1));
                    }
                    pane.find("#sn_400_list").html(html.join(""));
                }else{
                    pane.find("#sn_400_list").html('<tr><td colspan="10" class="text-center">还未购买任何400</td></tr>');
                }

            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    },
    selectServiceNo:function(data,src){
        DS.getView('zj/num/num_tabs',function(view){
            var p=$('#service_modal');
            p.find(".modal-dialog").width(800);
            p.find('.modal-title').text('选购号码');
            p.find(".modal-body").html(view);
            p.find("#serviceno_tab").find('li a:first').click();
            p.modal();
        });
    },
    reSelectServiceNo:function(sn){
        var p=$('#service_modal');
        if(p.find(".sn_detail").length>0){
            p.find(".sn_detail").hide();
            p.find(".sn_list").show();
        }else{
            DS.getView('zj/num/num_tabs',function(view){
                p.find('.modal-title').text('选购服务号');
                p.find(".modal-body").html(view);
                p.find("#serviceno_tab").hide();
                p.find("#serviceno_tab").find('li a:first').click();
            });
        }
    },
    loadNormalSnList:function(data,src){
        var p=$('#service_modal');
        var pane= p.find("#serviceno_tab_content");
        DS.getView('zj/num/num_normal_list', function (view) {
            pane.html(view);
            handler.zjNum.loadNormalServiceNoList(data,src);
        });
    },
    loadTestSnList:function(data,src){
        var p=$('#service_modal');
        var pane=p.find("#serviceno_tab_content");
        DS.getView('zj/num/num_test_list', function (view) {
            pane.html(view);
            handler.zjNum.loadTestServiceNoList(data,src);
        });
    },
    loadTestServiceNoList:function(data,src){
        data=data||{};
        var p=$('#service_modal');
        if(src && !src.hasClass("ds_do_action")){
            data.page = src.attr("value") || 1;
        }else{
            data.page = 1;
        }
        data.limit=handler.account.pageSize;
        var frmId='frm_serviceno_test_search';
        var pane=p.find("#serviceno_tab_content");
        var action={
            action:'app.account.queryTestServiceNoList',
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                var list=rep.list;
                var count=rep.count;
                if (list.length > 0){
                    var tmpl1='<div class="row">';
                    var tmpl='<div class="col-md-3 col1"><a style="text-decoration: none;" href="#" class="ds_do_action" ds_action="zjNum.showTestServiceNoInfo" ds_data="_#_id#_"><h3>_#_id#_</h3></a></div>';
                    var html = [];
                    for (var i = 0, len = list.length; i < len; i++) {
                        var row = list[i];
                        if(i==0){
                            html.push(tmpl1);
                        }else if(i%4==0){
                            html.push("</div>");
                            html.push(tmpl1);
                        }
                        html.push(DS.renderMethodViewNew(tmpl, row));
                        if(i==len-1){
                            html.push("</div>");
                        }
                    }
                    pane.find('#service_test_list').html(html.join(''));
                } else {
                    pane.find('#service_test_list').html('没有找到号码!');
                }
                pane.find('.result_count').text(count);
                DS.updatePagination(frmId, count, data.limit, data.page);
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    loadNormalServiceNoList:function(data,src){
        data=data||{};
        if(src && !src.hasClass("ds_do_action")){
            data.page = src.attr("value") || 1;
        }else{
            data.page = 1;
        }
        data.limit=handler.account.pageSize;
        var frmId='frm_serviceno_search';
        var pane=$("#serviceno_tab_content");
        var action={
            action:'app.account.queryServiceNoList',
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                var list=rep.list;
                var count=rep.count;
                if (list.length > 0){
                    var tmpl1='<div class="row">';
                    var tmpl='<div class="col-md-3 col1"><a style="text-decoration: none;" href="#" class="ds_do_action" ds_action="zjNum.showServiceNoNormal" ds_data="_#_id#_"><h3>_#_id#_</h3></a><h6 class="text-muted">月租:_@formatTrueFee(_#monthRent#_)@_元</h6></div>';
                    var html = [];
                    for (var i = 0, len = list.length; i < len; i++) {
                        var row = list[i];
                        if(i==0){
                            html.push(tmpl1);
                        }else if(i%4==0){
                            html.push("</div>");
                            html.push(tmpl1);
                        }
                        html.push(DS.renderMethodViewNew(tmpl, row));
                        if(i==len-1){
                            html.push("</div>");
                        }
                    }
                    pane.find('#service_normal_list').html(html.join(''));
                } else {
                    pane.find('#service_normal_list').html('没有找到号码!');
                }
                pane.find('.result_count').text(count);
                DS.updatePagination(frmId, count, data.limit, data.page);
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    showTestServiceNoInfo:function(id,src){
//        if(!confirm('确认要选择该号码吗?'))return;
        var pane=$("#service_modal").find('.sn_detail');
        var panelist=$("#service_modal").find('.sn_list');
        DS.getView('zj/num/num_test_detail', function(view) {
            var sn={_id:id};
            view=DS.renderMethodViewNew(view, sn);
            pane.html(view);
            panelist.hide();
            pane.show();
        });
    },
    confirmTest:function(sn,src){
        var action={
            action:'app.account.addServiceNo2Test',
            data:{_id:sn,product:handler.zjNum.productType}
        }
        DS.send(action,function(rep){
            if(rep.success){
                handler.zjNum.refreshAccInfo();
                $("#service_modal").modal('hide');
            }else{
                if(rep.code=='404'){
                    $().alertmessage('showError', handler.account.msg1);
                }else{
                    $().alertmessage('showError', rep.message||errMsg);
                }
            }
        });
    },
    _initTestRenew:function(pane){
        var obj2=pane.find(".ds_spinner2");
        if(obj2){
            obj2.spinner({
                spin: function( event, ui ) {
                    if ( ui.value < 1 ) {
                        $( this ).spinner( "value", 1 );
                        return false;
                    }
                },
                stop: function(event,ui) {
                }
            });
        }
    },
    showTestRenew:function(sn,src){
        var pane=$("#service_modal");
        var status=src.attr("ds_attr");
        if(status!='try'){
            $().alertmessage('showError', "请选择试用状态的号码！");
            return;
        }
//        pane.find(".modal-dialog").width(800);
        var body=pane.find('.modal-body');
        var action={
            action:'app.account.getServiceNoById',
            data:{_id:sn}
        }
        var url='zj/num/num_renew_test';
        DS.send(action,function(rep){
            if(rep.success){
                var row=rep.row;
                DS.getView(url, function(view) {
                    view=DS.renderMethodViewNew(view, row);
                    body.html(view);
                    handler.zjNum._initTestRenew(body);
                    pane.modal();
                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    updateTestDate:function(data,src){
        if(data.day<=0){
            $().alertmessage('showError', "最小值为1");
            return;
        }
        var action={
            action:'app.account.updateServiceNo2Test',
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                handler.zjNum.refreshAccInfo();
                $("#service_modal").modal('hide');
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    showServiceNoNormal:function(id,src){
        var pane=$("#service_modal").find('.sn_detail');
        var panelist=$("#service_modal").find('.sn_list');
        DS.getView('zj/num/num_normal_select', function(view) {
            var sn={_id:id};
            view=DS.renderMethodViewNew(view, sn);
            pane.html(view);
            panelist.hide();
            pane.show();
        });
    },
    confirmSelectNormalSn:function(sn,src){
        var action={
            action:'app.account.confirmSelectZJNormalSn',
            data:{_id:sn,product:handler.zjNum.productType}
        }
        DS.send(action,function(rep){
            if(rep.success){
                handler.zjNum.refreshAccInfo();
                $("#service_modal").modal('hide');
            }else{
                if(rep.code=='404'){
                    $().alertmessage('showError', handler.account.msg1);
                }else{
                    $().alertmessage('showError', rep.message||errMsg);
                }
            }
        });
    },
    approveTest:function(sn,src){
        var action={
            action:'app.account.approveServiceNoZJTest',
            data:{_id:sn,product:handler.account.productType}
        }
        DS.send(action,function(rep){
            if(rep.success){
                handler.account.refreshAccInfo();
                $("#service_modal").modal('hide');
            }else{
                if(rep.code=='404'){
                    $().alertmessage('showError', handler.account.msg1);
                }else{
                    $().alertmessage('showError', rep.message);
                }
            }
        });
    },
    _calculateFirstMonthRent:function(data){
        var monthDay=data.monthDay;
        var leaveDay=data.leaveDay;
//        var concurrentFee=parseFloat(data.concurrentFee||0);
        var monthRent=handler.formatTrueFee(parseFloat(data.monthRent));
        var totalFee=handler.formatMoney((monthRent/monthDay)*leaveDay);
        data.totalFee=totalFee;
    },
    showServiceNoInfo:function(id,src){
        var pane=$("#service_modal");
        var title=pane.find('.modal-title');
        var body=pane.find('.modal-body');

//        var pane=p.find('.sn_detail');
//        var panelist=p.find('.sn_list');
        var action={
            action:'app.account.getServiceNoById',
            data:{_id:id}
        }
        DS.send(action,function(rep){
            if(rep.success){
                var row=rep.row;
                var concurrentFee=parseFloat(row.concurrentFee||0);
                row.monthRent=row.monthRent+concurrentFee;
                handler.account._setAccBalance(row);

                DS.getView('zj/num/num_detail', function(view) {
                    handler.zjNum._calculateFirstMonthRent(row);
                    view=DS.renderMethodViewNew(view,row);
                    body.html(view);
                    if(parseFloat(row.balance)<parseFloat(row.totalFee) && parseFloat(row.financeBalance) < parseFloat(row.totalFee)){
                        pane.find(".balance_not_enough").show();
                        pane.find('.ds_form_action.ds_pay').addClass("disabled").removeClass("ds_form_action");
                    }
                    title.text('号码支付');
                    pane.find(".modal-dialog").width(800);
                    pane.modal();
                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    enableNum:function(data,src){
        var ary=data.split('|');
        var sn=ary[0],status=ary[1];

        var p=$("#service_modal");
        var body=p.find(".modal-body");
        var title=p.find('.modal-title');

        var action={
            action:'app.account.getServiceNoById',
            data:{_id:sn}
        }
        DS.send(action,function(rep){
            if(rep.success){
                var row=rep.row;
                var concurrentFee=parseFloat(row.concurrentFee||0);
                row.monthRent=row.monthRent+concurrentFee;
                handler.account._setAccBalance(row);
                title.text('启用号码');
                DS.getView('zj/num/num_renew', function(view) {
                    handler.zjNum._calculateFirstMonthRent(row);
                    view=DS.renderMethodViewNew(view,row);
                    body.html(view);
                    if(parseFloat(row.balance)<parseFloat(row.totalFee)){
                        body.find(".balance_not_enough").show();
                        body.find('.ds_form_action.ds_pay').addClass("disabled").removeClass("ds_form_action");
                    }
                    p.modal();
                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    showStopNum:function(data,src){
        var ary=data.split('|');
        var sn=ary[0],status=ary[1];
        var monthRent=src.attr("ds_attr");
        var row={_id:sn,monthRent:monthRent};
        DS.getView('zj/num/num_stop',function(view){
            var p=$('#service_modal');
            p.find(".modal-dialog").width(800);
            p.find('.modal-title').text('停用号码');
            view=DS.renderMethodViewNew(view,row);
            p.find(".modal-body").html(view);
            p.modal();
        });
    },
    stopNum:function(data,src){
        var action={
            action:'app.account.stopNum',
            data:data
        };
        DS.send(action,function(rep){
            if(rep.success){
                //refresh balance
                handler.zjNum.finishPay();
            }else{
                $().alertmessage('showError', rep.message||'支付异常');
            }
        });
    },
    cancelStopNum:function(data,src){
        if(!confirm("确认要取消停用号码的操作吗？"))return ;
        var ary=data.split('|');
        var sn=ary[0],status=ary[1];
        var action={
            action:'app.account.cancelStopNum',
            data:{_id:sn}
        };
        DS.send(action,function(rep){
            if(rep.success){
                //refresh balance
                handler.zjNum.finishPay();
            }else{
                $().alertmessage('showError', rep.message||'支付异常');
            }
        });
    },

    /* showPayNew:function(data,src){
         var p=$("#service_modal");
         var body=p.find('.modal-body');
         var pane=p.find('.sn_detail');
         var panelist=$("#service_modal").find('.sn_list');
         var panepay=$("#service_modal").find('.sn_pay');

         handler.account._setAccBalance(data);
         DS.getView('zj/num/num_pay', function(view) {
             view=DS.renderMethodViewNew(view, data);
             if(pane.length>0){
                 panepay.html(view);
                 panelist.hide();
                 pane.hide();
                 if(data.balance<data.totalFee){
                     panepay.find(".balance_not_enough").show();
                 }
                 panepay.show();
             }else{
                 body.html(view);
                 if(data.balance<data.totalFee){
                     body.find(".balance_not_enough").show();
                 }
             }
         });
     },*/
    confirmPayNew:function(data,src){
        if (src.hasClass("disabled")) return false;
        var frm=$("#service_modal").find('#frm_serviceno_detail');
        var data = DS.util.getDataOfForm(frm);
        data=data.data;
        data.product=handler.zjNum.productType;
        var money=parseFloat(data.money);
        var balance=parseFloat(data.balance);
        var financeBalance = parseFloat(data.financeBalance);
        if(money<0){
            $().alertmessage('showError', "无效的应付金额！");
            return;
        }
        if(balance<money && financeBalance < money){
            $().alertmessage('showError', "您的账户余额不足,请先充值！");
            return;
        }
        src.addClass("disabled");
        handler.zjNum._balancePay(data,src);
    },
    _balancePay:function(data,src){
//        console.dir(data);
        var action={
            action:'app.pay.balancePay2ZJMonthRent',
            data:data
        };
        DS.send(action,function(rep){
            if(rep.success){
                //refresh balance
                handler.zjNum.finishPay();
            }else{
                if(rep.code=='404'){
                    $().alertmessage('showError', handler.account.msg1);
                }else{
                    $().alertmessage('showError', rep.message||'支付异常');
                }
            }
            src.removeClass("disabled");
        });
    },
    finishPay:function(){
        var aid=session.account._id;
        var action={
            action:'app.account.getAccountInfoById',
            data:aid
        };
        DS.send(action,function(rep){
            if(rep.success){
                session.account.balance=rep.row.balance;
                session.account.overdraw=rep.row.overdraw||0;
                var acc=session.account;
                var price=handler.formatRound2Money(acc.balance);
                $(".user-header").find('.uc_balance').text(price);
                if(handler.zjNum.productType){
                    handler.zjNum.refreshAccInfo();
                }
                $("#service_modal").modal('hide');
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    redirectOnlinePay:function(money,src){
        var pane=$("#service_modal");
        var title=pane.find('.modal-title');
        var body=pane.find('.modal-body');
        DS.getView('account/account_pay', function(view) {
            body.html(view);
            body.find('input[name="money"]').val(money||0);
            pane.find(".modal-dialog").width(800);
            title.text('账户充值');
            pane.modal();
        });
    },
    calculateFee:function(data){
//        console.dir(data);
        var p1=parseFloat(data.concurrentPrice);
        p1=handler.formatTrueFee(p1);
        var p3=parseInt(data.concurrent,10)||0;
        var p4=parseInt(data.oldConcurrent,10);
        var adjustNum=p3-p4;
        data.num=adjustNum||0;
        var monthDay=parseInt(data.monthDay,10);
        var leaveDay=parseInt(data.leaveDay,10);

        var totalFee=handler.formatMoney((p1*adjustNum/monthDay)*leaveDay);
        if(adjustNum<0){
            totalFee=handler.formatMoney(0);
        }
        data.totalFee=totalFee;
    },
    _initAddConcurrent:function(pane){
        var syncFee=function(){
            var frm=pane.find('#frm_add_concurrent');
            var data = DS.util.getDataOfForm(frm);
            if(data.succeed){
                data=data.data;
                handler.zjNum.calculateFee(data);
                pane.find('input[name="money"]').val(data.totalFee);
                pane.find('.fee').text(data.totalFee);
                pane.find('.concurrent_num').text(data.num);
                if(parseFloat(data.balance)<parseFloat(data.totalFee)){
                    pane.find(".balance_not_enough").show();
                    pane.find('.btn-primary.ds_pay').addClass("disabled").removeClass("ds_form_action");
                }else{
                    pane.find(".balance_not_enough").hide();
                    pane.find('.btn-primary.ds_pay').addClass("ds_form_action").removeClass("disabled");

                }
            }
        }
        var obj1=pane.find(".ds_spinner");
        if(obj1){
            obj1.spinner({
                spin: function( event, ui ) {
                    if ( ui.value > 100 ) {
                        $( this ).spinner( "value", 100 );
                        return false;
                    } else if ( ui.value < 1 ) {
                        $( this ).spinner( "value", 1 );
                        return false;
                    }
                },
                stop: function(event,ui) {
                    syncFee();
                }
            });
            obj1.keyup(function(){
                syncFee();
            });
        }
    },
    showAdjustConcurrent:function(data,src){
        var ary=data.split('|');
        var sn=ary[0],status=ary[1];
        var pane=$("#service_modal");
        var title=pane.find('.modal-title');
        var body=pane.find('.modal-body');
        var action={
            action:'app.account.getServiceNoById',
            data:{_id:sn}
        }
        DS.send(action,function(rep){
            if(rep.success){
                var row=rep.row;
                var currentProduct=handler.getProductFee();
                row.concurrentPrice=currentProduct.concurrentPrice||100000;
                handler.account._setAccBalance(row);
                title.text('调整呼入并发数');
                DS.getView('zj/num/num_adjust_concurrent',function(view){
                    handler.zjNum.calculateFee(row);
                    view=DS.renderMethodViewNew(view, row);
                    body.html(view);
                    if(parseFloat(row.balance)<parseFloat(row.totalFee)){
                        body.find(".balance_not_enough").show();
                        body.find('.ds_form_action.ds_pay').addClass("disabled").removeClass("ds_form_action");
                    }
                    handler.zjNum._initAddConcurrent(body);
                    pane.find(".modal-dialog").width(800);
                    pane.modal();
                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    _balancePayConcurrent:function(data,src){
//        console.dir(data);
        var action={
            action:'app.pay.balancePay2ZJConcurrent',
            data:data
        };
        DS.send(action,function(rep){
            if(rep.success){
                //refresh balance
                handler.zjNum.finishPay();
            }else{
                $().alertmessage('showError', rep.message||'支付异常');
            }
            src.removeClass("disabled");
        });
    },
    confirmPayConcurrent:function(data,src){
        if (src.hasClass("disabled")) return false;
        var frm=$("#service_modal").find('#frm_add_concurrent');
        var data = DS.util.getDataOfForm(frm);
        data=data.data;
        data.product=handler.zjNum.productType;
        var concurrent=parseInt(data.concurrent||0);
        var oldConcurrent=parseInt(data.oldConcurrent||0);
        var money=parseFloat(data.money);
        var balance=parseFloat(data.balance);

        if(concurrent<=0){
            $().alertmessage('showError', "并发数最小值为1！");
            return;
        }
        if(concurrent>oldConcurrent){
            if(money<0){
                $().alertmessage('showError', "无效的应付金额！");
                return;
            }
            if(balance<money){
                $().alertmessage('showError', "您的账户余额不足,请先充值！");
                return;
            }
        }
        src.addClass("disabled");
        handler.zjNum._balancePayConcurrent(data,src);
    }


}