handler.fee = {
    pageSize: 10,

    showMain:function(){
        var pane=$("#right_pane");
        handler.fee.__initCallSheetView(pane);
        handler.fee.getCallSheetList();
    },

    showCCMain:function(){
        var pane=$("#right_pane");
        handler.fee.__initCallSheetView2CC(pane);
        handler.fee.getCallSheet2CC();
    },


    __initCallSheetView:function(pane){
        var html=getAgentDicByProduct('agents',null,'zj');
        pane.find('.callsheet_agent').html(html);
        pane.find('.ds_date').datetimepicker({
//            changeMonth: true,
//            changeYear: true,
//            minDate:0,
            showButtonPanel: true
        });
    },
    __initCallSheetView2CC:function(pane){
        var html=getAgentDicByProduct('agents',null,'cc');
        pane.find('.callsheet_agent').html(html);
        html=handler.getDicOptions('callTypeCC','');
        pane.find('select[name="CONNECT_TYPE"]').html(html);
        html=handler.getDicOptions('callStatusCC','');
        pane.find('select[name="STATUS"]').html(html);
        pane.find('.ds_date').datetimepicker({
//            changeMonth: true,
//            changeYear: true,
//            minDate:0,
            showButtonPanel: true
        });
    },

    getPayList:function(data,src){
        data=data||{};
        if(src){
            data.page = src.attr("value") || 1;
        }else{
            data.page = 1;
        }
        data.limit=handler.fee.pageSize;
        var frmId='frm_fee_search';
        var pane=$("#right_pane");
        var action={
            action:"app.fee.getBankPayList",
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                var list=rep.list;
                var count=rep.count;
                if (list.length > 0){
                    DS.getView("index/pay_item", function (view) {
                        var html = [];
                        for (var i = 0, len = list.length; i < len; i++) {
                            var row = list[i];
                            if(!row.memo){
                                row.memo="";
                            }
                            if(!row.isBackOut)row.isBackOut=false;
                            html.push(DS.renderMethodViewNew(view, row));
                        }
                        pane.find('.fee_list').html(html.join(''));
                        showProxyCheck(pane);
                    });
                } else {
                    var html='<tr><td class="text-center" colspan="10">没有记录!</td></tr>'
                    pane.find('.fee_list').html(html);
                }

                pane.find('.result_count').text(count);
                DS.updatePagination(frmId, count, data.limit, data.page);
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    },
    getCostList:function(data,src){
        data=data||{};
        if(!data.flag){
            data.flag=2;
        }
        if(src){
            data.page = src.attr("value") || 1;
        }else{
            data.page = 1;
        }
        data.limit=handler.fee.pageSize;
        var frmId='frm_fee_search';
        var pane=$("#right_pane");
        var action={
            action:"app.fee.getPayList",
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                var list=rep.list;
                var count=rep.count;
                if (list.length > 0){
                    var tmpl='<tr><td>_#productDesc#_</td><td>_#item#_</td><td>_#payDesc#_</td><td><span class="text-danger">_#totalFee#_</span></td><td>_#pay_time#_</td><td>_#detail#_</td></tr>';
                    var html = [];
                    for (var i = 0, len = list.length; i < len; i++) {
                        var row = list[i];
                        var flag2=row.flag;
                        row.productDesc=handler.fee.showFieldDesc('product',row.product);
                        row.item=handler.fee.showFieldDesc('flag',row.flag);
                        row.payDesc=handler.fee.showFieldDesc('payType',row.payType);
//                        var totalFee=parseFloat(row.totalFee);
                        var serviceFlag= row.serviceFlag;
                        var _sn=row.sn||{};
                        if(serviceFlag=="400"){
                            if(flag2=='buySn'){
                                row.detail='购买号码'+_sn.serviceno+",购买时长"+_sn.month+"个月";
                            }else if(flag2=='snRenew'){
                                row.detail="续费号码"+_sn.serviceno+",续费时长"+_sn.month+"个月";
                            }else if(flag2=='buy400Min'){
                                row.detail="号码"+_sn.serviceno+"购买呼入话费"+row.totalFee+"元";
//                                row.detail="购买400号码呼入话费"+row.totalFee+"元";
                            }
                        }else{
                            if(flag2=='buySn'){
                                if(_sn.leaveDay){
                                    row.detail='购买号码'+_sn.serviceno+",购买时长"+_sn.leaveDay+"天,并发数"+_sn.concurrent+"个";
                                }else{
                                    row.detail='购买号码'+_sn.serviceno+",购买时长"+_sn.month+"个月,并发数"+_sn.concurrent+"个";
                                }
                            }else if(flag2=='snRenew'){
                                if(_sn.leaveDay){
                                    row.detail="启用号码"+_sn.serviceno+",续费时长"+_sn.leaveDay+"天";
                                }else{
                                    row.detail="续费号码"+_sn.serviceno+",续费时长"+_sn.month+"个月";
                                }
                            }else if(flag2=='buyConcurrent'){
                                if(_sn.leaveDay){
                                    row.detail="续费号码"+_sn.serviceno+",新增呼入并发数"+_sn.concurrent+"个";
                                }else{
                                    row.detail="续费号码"+_sn.serviceno+",新增呼入并发数"+_sn.concurrent+"个";
                                }
                            }else if(flag2=='buyDialMin'){
                                row.detail="购买外呼话费"+row.totalFee+"元";
                            }else if(flag2=='deduction'){
                                row.detail=_sn.memo;
                            }else if(flag2=='borrow'){
                                row.detail="账户拆借"+row.totalFee+"元";
                            }else if(flag2=='buyLicence'){
                                row.detail="购买"+getGeneralDicName("licenceType",_sn.licenceType)+",时长"+_sn.month+"个月,licence数"+_sn.num+"个";
                            }else if(flag2=='renewLicence'){
                                row.detail="续费"+getGeneralDicName("licenceType",_sn.licenceType)+",续费时长"+_sn.month+"个月,licence数"+_sn.num+"个";
                            }else if(flag2=='adjustLicenceNum'){
                                row.detail="调整"+getGeneralDicName("licenceType",_sn.licenceType)+"数量,增加licence数量"+_sn.changeNum+"个";
                            }else if(flag2=='deductMonthRent'){
                                row.detail="扣除号码"+_sn.serviceno+"月租";
                            }else if(flag2 == "modifyOutcallLicence"){
                                row.detail="调整"+getGeneralDicName("licenceType",_sn.licenceType)+","+_sn.licencePriceType+"元套餐,licence数"+_sn.num+"个";
                            }else if(flag2 == "invoicExpress"){
                                row.detail="";
                                if(_sn.memo){
                                    row.detail=_sn.memo;
                                }
                            }else if(flag2 == 'hardwarePay'){
                                row.detail = "扣除硬件费用"+row.totalFee+"元";
                            }else if(flag2 == 'workPay'){
                                row.detail = "扣除实施费用"+row.totalFee+"元";
                            }else if(flag2 == 'tapePay'){
                                row.detail = "扣除录音费用"+row.totalFee+"元";
                            }else if(flag2 == 'otherPay'){
                                row.detail = "扣除其他费用"+row.totalFee+"元";
                            }else if(flag2 == 'backoutPay'){
                                row.detail = "充值扣减"+row.totalFee+"元";
                            }
                        }

                        html.push(DS.renderMethodViewNew(tmpl, row));
                    }
                    pane.find('.fee_list').html(html.join(''));
                } else {
                    var html='<tr><td class="text-center" colspan="10">没有记录!</td></tr>'
                    pane.find('.fee_list').html(html);
                }
                pane.find('.result_count').text(count);
                DS.updatePagination(frmId, count, data.limit, data.page);
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    },
    _showUserRecord:function(pane){
        var products=session.account.products;
        var isRecord=null;
        for (var i = 0; i < products.length; i++) {
            var obj = products[i];
            if(obj.product=='zj'){
                isRecord=obj.isRecord;
            }
        }
        if(session.account.billIdentity=="proxy" ){
            pane.find(".user_hide").remove();
        }else{
            var roles=['admin',"operation"];
            if($.inArray(session.account.billIdentity,roles)!=-1){
                pane.find(".user_hide").show();
            }else{
                if(isRecord=='1'){
                    pane.find(".user_hide").show();
                }else{
                    pane.find(".user_hide").remove();
                }
            }
        }
    },
    getCallSheetList:function(data,src){
        data=data||{};
        if(src){
            data.page = src.attr("value") || 1;
        }else{
            data.page = 1;
        }
        data.limit=handler.fee.pageSize;
        var frmId='frm_fee_search';
        var pane=$("#right_pane");
        var action={
            action:"app.fee.getCallsheetList",
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                var list=rep.list;
                var count=rep.count;
                if (list.length > 0){
                    DS.getView("zj/fee/callsheet_item", function (view) {
                        var html = [];
                        for (var i = 0, len = list.length; i < len; i++) {
                            var row = list[i];
                            html.push(DS.renderMethodViewNew(view, row));
                        }
                        pane.find('.fee_list').html(html.join(''));
                        handler.fee._showUserRecord(pane);
                    });
                } else {
                    var html='<tr><td class="text-center" colspan="10">没有记录!</td></tr>'
                    pane.find('.fee_list').html(html);
                }
                pane.find('.result_count').text(count);
                DS.updatePagination(frmId, count, data.limit, data.page);
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    },
    getCallSheet2CC:function(data,src){
        data=data||{};
        if(src){
            data.page = src.attr("value") || 1;
        }else{
            data.page = 1;
        }
        data.limit=handler.fee.pageSize;
        var frmId='frm_fee_search';
        var pane=$("#right_pane");
        var action={
            action:"app.fee.queryCallSheet2CC",
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                var list=rep.list;
                var count=rep.count;
                if (list.length > 0){
                    DS.getView("cc/cdr/callsheet_item_cc", function (view) {
                        var html = [];
                        for (var i = 0, len = list.length; i < len; i++) {
                            var row = list[i];
                            html.push(DS.renderMethodViewNew(view, row));
                        }
                        pane.find('.fee_list').html(html.join(''));
                    });
                } else {
                    var html='<tr><td class="text-center" colspan="10">没有记录!</td></tr>'
                    pane.find('.fee_list').html(html);
                }
                pane.find('.result_count').text(count);
                DS.updatePagination(frmId, count, data.limit, data.page);
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    },
    showFieldDesc:function(type,val){
        var desc='';
        if(type=='flag'){
            desc=getGeneralDicName("userPayType",val);
            if(val=='payAccount'){
                desc="系统充值";
            }
        }else if(type=='payType'){
            if(val=='balance'){
                desc='余额';
            }else if(val=='online'){
                desc='网银';
            }else if(val=='mix'){
                desc='余额+网银';
            }
        }else if(type=='product'){
            if(val=='zj'){
                desc='企业总机';
            }else if(val=='cc'){
                desc='呼叫中心';
            }
        }else if(type=='bank'){
            var bank={
                alipay:'支付宝',
                ICBCB2C:'工商银行',
                CCB:'建设银行',
                CMB:'招商银行',
                ABC:'农业银行',
                GDB:'广东发展银行',
                BOCB2C:'中国银行',
                CMBC:'中国民生银行',
                CITIC:'中信银行',
                CIB:'兴业银行',
                CEBBANK:'中国光大银行',
                POSTGC:'邮政储蓄',
                SPDB:'上海浦东发展银行',
                SPABANK:'平安银行',
                HZCBB2C:'杭州银行',
                SHBANK:'上海银行',
                NBBANK:'宁波银行'
            };
            if(bank[val]){
                desc= bank[val];
            }else if(val=='COMM-DEBIT'){
                desc= '中国交通银行';
            }else if(val=='CEB-DEBIT') {
                return '中国光大银行';
            }else if(val=='CITIC-DEBIT') {
                return '中信银行';
            }else{
                desc= val;
            }
        }else if(type=='call_status'){
            if(val=='Down'){
                desc='未呼通';
            }else if(val=='Link'){
                desc='<span class="text-success">已呼通</span>';
            }else if(val=='Voicemail'){
                desc='<span class="text-warning">已留言</span>';
            }
        }else if(type=='call_callType'){
            if(val=='normal'){
                desc='普通来电';
            }else if(val=='dialout'){
                desc='外呼去电';
            }else if(val=='transfer'){
                desc='来电转接';
            }else if(val=='dialTransfer'){
                desc='外呼转接';
            }
        }else if(type=='callStatusCC'){
            desc=getGeneralDicName(type,val);
        }else if(type=='callTypeCC'){
            desc=getGeneralDicName(type,val);
        }else if(type=='agents'){
            var agent=getCache("agents",val);
            if(agent){
                desc=agent.displayName;
            }else{
                desc='未知';
            }
        }else if(type=='duration'){
            desc=formatTime(val);
        }

        return desc;
    },
    reset:function(data,src){
        var frm=src.closest("form");
        frm[0].reset();
    },
    listenRecord:function(data){
        var p=$('#service_modal');
        var view='<audio id="cdr_listen_audio" src="__RECORD_FILE" preload="auto" autoplay controls="controls">您的浏览器不支持此播放器</audio>';
        view=view.replace(/__RECORD_FILE/g,data);
        p.find(".modal-dialog").width(380);
        p.find('.modal-title').text('听录音');
        p.find(".modal-body").html(view);
        p.modal();
    },
    downloadRecord:function(path){
//        var url=path+"?1";
        DS.downloadFile(path);
    },
    showDealRecord:function(status,path,data){

        var ary = getCache("agents");
        for (var i = 0, len = ary.length; i < len; i++) {
            if (i != len) {
                if (data == ary[i]._id) {
                    var tape = ary[i].isRecord == "true" ? "visible" : "unvisible";
                    break;
                }
            }
        }
        //console.info("status=="+status+",path=="+path+"tape====="+tape);
        var html="";
        if((status=='Link'||status=='Voicemail') && tape == "visible" ){
            html='<a href="#" class="ds_do_action alert-link" ds_action="fee.listenRecord" ds_data="__path">听取录音</a>&nbsp;&nbsp;'+
                '<a href="#" class="ds_do_action" ds_action="fee.downloadRecord" ds_data="__path">下载录音</a>';
            html=html.replace(/__path/g,path);
        }else{
            html='<a href="#"></a>';
            html=html.replace(/__path/g,path);
        }
        return html;
    },
    showCCDealRecord:function(status,path){
        var html="";
        if(status=='dealing'){
            html='<a href="#" class="ds_do_action alert-link" ds_action="fee.listenRecord" ds_data="__path">听取录音</a>&nbsp;&nbsp;'+
//                '<a href="#" class="ds_do_action" ds_action="fee.downloadRecord" ds_data="__path">下载录音</a>';
                '<a href="__path" target="_blank" download>下载录音</a>';
            html=html.replace(/__path/g,path);
        }
        return html;
    },
    showDealCell:function(param){
        var ary=param.split("|");
        var flag=ary[2];
        var html="";

        return html;
    },
    showBackoutPay:function(param,src){
        var ary=param.split("|");
        var pane=$("#right_pane");
        var data={_id:ary[0],money:ary[1],flag:ary[2]};
        DS.getView('index/backout_pay',function(view){
            view=DS.renderMethodViewNew(view,data);
            var p=pane.find('#fee_modal');
            p.find(".modal-dialog").width(500);
            p.find(".modal-body").html(view);
            p.find(".modal-title").html('撤销此次充值');
            p.find(".ds_form_action").attr({ds_action:'fee.backoutPay',ds_form:'#frm_backout_pay'});
            pane.find('#fee_modal').modal();
        })
    },
    backoutPay:function(data,src){
        var action={
            action:'app.fee.backoutSysPay',
            data:data
        }
        var pane=$("#right_pane");
        DS.send(action,function(rep){
            if(rep.success){
                $().alertmessage('showSuccess', "撤销成功");
                pane.find(".ds_pay_search").click();
                handler.fee.syncBalance();
                pane.find('#fee_modal').modal('hide');
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        })
    },
    syncBalance:function(){
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
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    }


}