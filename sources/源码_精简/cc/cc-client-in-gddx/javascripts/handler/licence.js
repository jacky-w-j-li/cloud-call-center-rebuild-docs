handler.licence={
    pageSize:10,
    getLicenceList:function(data,src){
        data=data||{};
        var frmId='frm_licence_info';
        var pane=$("#view_company_identity");
        var action={
            action:'app.licence.getAllLicenceList',
            data:data
        }
        DS.sendUrl('./action2bill',action,function(rep){
            if(rep.success){
                var list=rep.list||[];
                var currentDate=rep.currentDate+' 23:59:59';

                if (list.length > 0){
                    var tmpl='<tr><td>_@licence.showFieldDesc("licenceType","_#licenceType#_")@_</td><td>_@licence.showFieldDesc("price","_#licenceType#_")@_</td><td>_#num#_</td><td>_@licence.showStatusDesc("_#status#_")@_</td><td>_#endDate#_</td>' +
                        '<td>_#deal#_</td></tr>';
                    var html = [];
                    for (var i = 0, len = list.length; i < len; i++) {
                        var row = list[i];
                        var id=row._id;
                        var endDate=row.endDate+' 23:59:59';
                        row.trclass='text-success';
                        var time=getDateDiff(currentDate,endDate,'second');
                        if(time<0){
                            row.trclass='text-error';
                        }
                        if(row.status=='present'){
                            row.trStyle='color:#CD7F32';
                        }else{
                            row.trStyle='';
                        }
                        if(!row.endDate){
                            row.endDate = "";
                        }
                        var deal="";
                        if(row.licenceType!='service_p' ){
                            deal+='<a href="#" style="margin-right: 10px;" class="ds_do_action" ds_action="licence.showRenew" ds_data="'+id+'">续费</a>';
                        }
                        if(row.licenceType!='outcall'&&row.licenceType!='service_p' ){
                            deal+='<a href="#" style="margin-right: 10px;" class="ds_do_action" ds_action="licence.showRenewNum" ds_data="'+id+'" ds_attr="'+row.status+'">调整数量</a>';
                        }
                        if(row.licenceType!="outcall"){
                            deal+='<a href="#" class="ds_do_action bill_hide text-danger" ds_action="licence.showChangeStatus" ds_data="'+id+'" ds_attr="'+row.status+'">变更状态</a>';
                        }
                        //if(time<0){
                        //    deal+='<a href="#" style="margin-left: 10px;" class="ds_do_action text-danger" ds_action="licence.deleteLicence" ds_data="'+id+'">删除</a>';
                        //}
                        row.deal=deal;
                        html.push(DS.renderMethodViewNew(tmpl, row));
                    }
                    pane.find('.licence_list').html(html.join(''));
                } else {
                    var html='<tr><td class="text-center" colspan="10">没有记录!</td></tr>';
                    pane.find('.licence_list').html(html);
                }
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    },
    getCalloutDicOptions:function(dic,currentVal,showDft){
        var html=[];
        dic = getCache(dic);
        if(showDft!='no'){
            html.push("<option value=''>--请选择--</option>");
        }
        var selectOptionHtml = "<option value='__value' selected>__name</option>";
        var optionHtml = "<option value='__value'>__name</option>";
        var ary=dic;
        if(!ary || ary.length==0) return null;
        for (var i=0;i<ary.length;i++) {
            var obj=ary[i];
            if(currentVal && currentVal==obj.codeValue){
                html.push(selectOptionHtml.replace(/__value/g,obj.codeValue).replace(/__name/g,obj.codeName));
            } else{
                html.push(optionHtml.replace(/__value/g,obj.codeValue).replace(/__name/g,obj.codeName));
            }
        }
        return html.join("");
    },
    //_@licence.getLicenceTypeOptions()@_
    getLicenceTypeOptions:function(){
        var html=[];
        //html.push("<option value=''>--请选择--</option>");
        var optionHtml = "<option value='__value'>__name</option>";
        var ary=getCache("licenceType");
        if(!ary || ary.length==0) return null;
        var ccFee=session.account;
        if(ccFee.calloutLicenceStrategy == "licencePrice"){
            for (var i = 0; i < ary.length; i++) {
                var obj = ary[i];
                html.push(optionHtml.replace(/__value/g, obj.code_value).replace(/__name/g, obj.code_name));
            }
        }else {
            for (var i=0;i<ary.length;i++) {
                var obj=ary[i];
                //过滤掉外呼版
                //if(obj.codeValue !="outcall"){
                    html.push(optionHtml.replace(/__value/g,obj.code_value).replace(/__name/g,obj.code_name));
                //}
            }
        }
        return html.join("");
    },
    showAdd:function(data,src){
        var p=$("#service_modal");
        DS.getView('cc/licence/licence_add_test',function(view){
            var row={};
            view=DS.renderMethodViewNew(view, row);
            p.css({width:'800px','margin-left':'-400px'});
            p.find(".modal-body").html(view);
            p.find(".modal-title").html('新增licence');
            handler.licence._initAddLicence2Test(p);
            p.modal();
        })
        /*var action={
            action:'app.licence.getLicenceCount',
            data:{}
        };
        DS.send(action,function(rep){
            if(rep.success){
                if(rep.count>0){
                    DS.getView('cc/licence/licence_update',function(view){
                        var row={};
                        view=DS.renderMethodViewNew(view, row);
                        p.find(".modal-dialog").width(800);
                        p.find(".modal-body").html(view);
                        p.find(".modal-title").html('新增licence记录');
                        handler.licence._initAddLicence(p);
                        p.modal();
                    })
                }else{
                    DS.getView('cc/licence/licence_add_test',function(view){
                        var row={};
                        view=DS.renderMethodViewNew(view, row);
                        p.find(".modal-dialog").width(800);
                        p.find(".modal-body").html(view);
                        p.find(".modal-title").html('新增测试licence记录');
                        handler.licence._initAddLicence2Test(p);
                        p.modal();
                    })
                }
            }else{
                $().alertmessage('showError', errMsg);
            }
        });*/

    },
    reset:function(data,src){
        var frm=src.closest("form");
        frm[0].reset();
    },
    showStatusDesc:function(val){
        var desc='';
        if(val=='try'){
            desc="试用";
        }else if(val=='use'){
            desc='在用';
        }else if(val=='present'){
            desc='赠送'
        }
        return desc;
    },
    showFieldDesc:function(type,val){
        var desc='';
        if(type=='licenceType'){
            desc=getDicCacheName(type,val);
        }else if(type=='price'){
            if(val=='enterprise'){
                desc=handler.formatTrueFee(session.account.callinLicence);
            }else if(val=='outcall'){
                //desc=handler.formatTrueFee(session.account.calloutLicence);
                desc="0";
            }else if(val=='monitor'){
                desc=handler.formatTrueFee(session.account.monitorLicence);
            }else if(val=='service'){
                desc=handler.formatTrueFee(session.account.serviceLicence);
            }else if(val=='service_p'){
                desc="0";
            }
            desc+="元";
        }
        return desc;
    },
    _initAddLicence2Test:function(pane){
        var obj2=pane.find(".ds_spinner_licence");
        if(obj2){
            obj2.spinner({
                spin: function( event, ui ) {
//                    console.dir(ui.value);
                    if ( ui.value < 1 ) {
                        $( this ).spinner( "value", 1 );
                        return false;
                    }
                },
                stop: function(event,ui) {
                }
            });
        }

        var licenceType=pane.find(".licenceType");
        licenceType.change(function(){
            var ccFee=session.account;
            var callinLicence=handler.formatTrueFee(ccFee.callinLicence);
            //var calloutLicence=handler.formatTrueFee(ccFee.calloutLicence);
            var monitorLicence=handler.formatTrueFee(ccFee.monitorLicence);
            var serviceLicence=handler.formatTrueFee(ccFee.serviceLicence);
            var type=$(this).val();
            obj2.val("1").prop("readonly",false);
            if(type=='enterprise'){
                pane.find(".licencePrice").val(callinLicence)
            }else if(type=='monitor'){
                pane.find(".licencePrice").val(monitorLicence)
            }else if(type=='service'){
                pane.find(".licencePrice").val(serviceLicence);
            }else if(type=='outcall'){
                //pane.find(".licencePrice").val(calloutLicence)
                pane.find(".licencePrice_div").hide();
            }else if(type=='service_p'){
                pane.find(".licencePrice").val(0);
                obj2.val("2").prop("readonly",true);
            }
            if(type !='outcall'){
                pane.find(".licencePrice_div").show();
            }
        });

        pane.find('.ds_date').datepicker({
            minDate:0,
            showButtonPanel: true
        });
        licenceType.change();
    },

    calculateLicenceFee:function(data){
        var month=parseInt(data.month,10)||1;
        var num=parseInt(data.num,10)||1;
        var price=parseFloat(data.licencePrice);
        var totalFee=handler.formatRoundMoney(price*month*num);
        data.totalFee=totalFee;
    },

    showPayLicence:function(data,src){
        var container=$("#service_modal");
        var pane=container.find('.licence_pay');
        handler.licence.calculateLicenceFee(data);
        var acc=handler.getMyAccInfo();
        var overdraw=acc.overdraw||0;
        var total=acc.balance+overdraw;
        data.balance=handler.formatTrueFee(total);
        data.overdraw=handler.formatTrueFee(overdraw);
        data.actualBalance=handler.formatTrueFee(session.account.balance);

        if(parseInt(data.num,10)<1){
            $().alertmessage('showError', "licence数量最小为1");
            return;
        }
        DS.getView('cc/licence/licence_pay', function(view) {
            if(src.hasClass("licence_renew")){
                data.nameDesc="续费";
            }else{
                data.nameDesc="购买";
            }
            view=DS.renderMethodViewNew(view, data);
            pane.html(view);
        });
    },
    confirmPayAdjustNum:function(data,src){
        if (src.hasClass("disabled")) return false;
        data.product="cc";
        handler.licence.calculateLicenceFeeNew(data);
        if(parseInt(data.num,10)<1){
            $().alertmessage('showError', "licence数量最小为1");
            return;
        }
        if(data.changeNum ==0){
            $().alertmessage('showError', "数量没有调整");
            return;
        }
        var balance=parseFloat(data.balance);
        if(balance<0){
            $().alertmessage('showError', "您的账户已欠费，请先充值");
            return;
        }
        if(data.totalFee > 0 ){
            src.addClass("disabled");
            handler.licence._balancePay(data,src);
        }else{//没有产生费用
            var flag=data.flag;
            var changeNum = parseInt(data.changeNum,10);
            var attr=src.attr("ds_attr");
            if(data.status != "try" && flag=='adjustLicenceNum' && attr!='y'){
                if(changeNum<0){
                    var content=$("#tmpl_licence_adjustL_num").html();
                    $("#popover_licence_adjustL_num").popover({
                        content:content,
                        html:true,
                        placement:"top",
                        title:'温馨提示'
                    });
                    $("#popover_licence_adjustL_num").click();
                    return;
                }
            }
            src.addClass("disabled");
            var action={
                action:"app.pay.updateRenewLicence",
                data:data
            };
            DS.sendUrl('./action2bill',action,function(rep){
                if(rep.success){
                    handler.licence.getLicenceList();
                    $("#service_modal").modal('hide');
                }else{
                    $().alertmessage('showError', rep.message||errMsg);
                }
                src.removeClass("disabled");
            });
        }
    },

    confirmMinusNum:function(data,src){
        var container=$("#service_modal");
        var btn=container.find('.licence_renew');
        btn.attr("ds_attr","y");
        $("#popover_licence_adjustL_num").popover('hide');
        btn.click();
    },
    cancelMinusNum:function(data,src){
        var container=$("#service_modal");
        var btn=container.find('.licence_close');
        $("#popover_licence_adjustL_num").popover('hide');
        btn.click();
    },
    showPayBalance:function(){
        var pane=$("#service_modal");
        var frm=pane.find("#frm_licence_pay");
        var check=pane.find("input[name='accbalance']").prop('checked');
        var p1=pane.find(".continuePay");
        var p2=pane.find(".readyPay");
        if(check){
            var data = DS.util.getDataOfForm(frm);
            data=data.data;
            var fee=handler.formatRoundMoney(data.money-data.balance);
            if(fee>=0){
                p2.hide();
                p1.find('strong').text(fee);
                p1.show();
            }else{
                p1.hide();
                p2.find('strong').text(data.money);
                p2.show();
            }
        }else{
            p1.hide();
            p2.hide();
        }
    },
    confirmTest:function(data,src){
        if(parseInt(data.num,10) <1){
            $().alertmessage('showError', "licence的数量最小为1");
            return
        }
        var action={
            action:'app.licence.addLicence2Test',
            data:data
        };
        DS.sendUrl('./action2bill',action,function(rep){
            if(rep.success){
                handler.licence.getLicenceList();
                $("#service_modal").modal('hide');
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    confirmPay:function(data,src){
        if(src.hasClass("disabled")) return false;
        data.product="cc";
        handler.licence.calculateLicenceFee(data);
        if(parseInt(data.num,10)<1){
            $().alertmessage('showError', "licence数量最小为1");
            return;
        }

        var balance=parseFloat(data.balance);
        if(balance<0){
            $().alertmessage('showError', "您的账户已欠费，请先充值");
            return;
        }
        src.addClass("disabled");
        handler.licence._balancePay(data,src);
    },
    _bankPay:function(frm,data,src,flag){
        var bank=data.bank;
        if(!bank){
            var msg='请选择一种支付方式';
            if(flag=='mix'){
                msg='账户余额不足，请选择一种支付方式';
            }
            $().alertmessage('showError', msg);
            src.removeClass("disabled");
            return;
        }
        var data2={
            method:'PaymentAdd',
            params:data,
            account:session.user.account
        }
        data2= $.toJSON(data2);
        frm.find('input[name="data"]').val(data2);
        frm.submit();
        src.removeClass("disabled");
        handler.account._showPayFinish();
    },
    _balancePay:function(data,src){
        var action={
            action:'app.pay.LicenceBalancePay',
            data:data
        };
        DS.sendUrl('./action2bill',action,function(rep){
            if(rep.success){
                //refresh balance
                handler.licence.finishPay();
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
        var aid=session.user.account;
        var action={
            action:'app.account.getAccountInfoById',
            data:aid
        };
        DS.sendUrl('./action2bill',action,function(rep){
            if(rep.success){
                var pane=$("#view_company_identity");
                var acc=rep.row;
                handler.setMyAccInfo(acc);
                pane.find('.uc_balance').text(acc.balanceDesc);
                handler.licence.getLicenceList();
                $("#service_modal").modal('hide');
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    //客服版，企业版，监控版调整数量的计算
    calculateLicenceFeeNew:function(data){
        var licenceType = data.licenceType;
        var oldNum=parseInt(data.oldNum,10)||0;
        var num = parseInt(data.num,10) || 0;
        var price=parseFloat(data.licencePrice);
        //var month=parseInt(data.month,10)||0;
        var endDate=data.endDate;

        var FeeHandler = function(nowDate,endDate,price,changeNum,totalFee){
            //若已到期或明天到期，返回
            if(DS.getBetweenDays(endDate,getDateDesc(nowDate)) < 1 ){
                return totalFee;
            }
            //获取两个日期之间的月份数
            var months = DS.getDateMonthSub(nowDate,endDate);
            if(months>=1){
                totalFee += changeNum * price * months;
            }
            var date2 = DS.dateAdd("M",months,nowDate);
            var days = DS.getBetweenDays(endDate,getDateDesc(date2));
            totalFee += days/30*price*changeNum;

            return totalFee;
        };
        //获取改变的数量
        var changeNum =(num - oldNum)||0;
        //计算费用  区分试用、正用
        var totalFee = 0;
        if(data.status!="try"){
            if(changeNum >0){//增加
                var nowDate = new Date();
                totalFee = FeeHandler(nowDate,endDate,price,changeNum,totalFee);
            }
        }
        //data.realPrice = price;
        data.changeNum = changeNum;
        //data.presentMonth = presentMonth;
        data.totalFee = handler.formatMoney(totalFee);
    },
    getLicenceNumNew:function(num,numNew){
        num = parseInt(num,10);
        numNew = parseInt(numNew,10);
        return num-numNew;
    },
    //客服版，企业版，监控版初始化
    _initRenewLicence:function(data,pane){
        var syncFee=function(){
            var frm=pane.find('#frm_licence_update');
            var data = DS.util.getDataOfForm(frm);
            if(data.succeed){
                data=data.data;
                handler.licence.calculateLicenceFee(data);
                pane.find('.fee').text(data.totalFee);
            }
        }
        var obj2=pane.find(".ds_spinner_licence");
        if(obj2){
            obj2.spinner({
                spin: function( event, ui ) {
//                    console.dir(ui.value);
                    if ( ui.value < 1 ) {
                        $( this ).spinner( "value", 1 );
                        return false;
                    }
                },
                stop: function(event,ui) {
                    syncFee();
                }
            });
            obj2.keyup(function(){
//                if(obj2.val()==0){
//                    obj2.val(1);
//                }
                syncFee();
            });
        }
    },
    //外呼版续费
    renewOutcallLicence:function(data,src){
        //console.dir(data);
        if(parseInt(data.num,10)<1){
            $().alertmessage('showError', "licence数量最小为1");
            return;
        }
        //if(data.status =="try"){
        //    if(!confirm('licence将变更为正用状态？'))return;
        //}
        data.product="cc";
        var action = {
            action:"app.pay.outcallLicenceBalancePay",
            data:data
        };
        DS.sendUrl('./action2bill',action,function(rep){
            if(rep.success){
                handler.licence.finishPay();
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    //计算外呼版licence数据
    calculateOutcallLicence:function(data){
        var ccFee=handler.getProductFee();
        var num = parseInt(data.num,10) || 0;
        var oldNum = parseInt(data.oldNum,10);
        var licencePriceType = data.licencePriceType;
        var price = handler.formatTrueFee(ccFee.calloutLicence[licencePriceType].price);//套餐价格
        var minute = ccFee.calloutLicence[licencePriceType].minute;//套餐赠送分钟数
        var changeNum =(num - oldNum)||0;//获取改变的数量
//        data.giveMinuteOneNew = ccFee.calloutLicence[data.licencePriceTypeNew  || 0].minute;//获取下月生效套餐赠送分钟数
        //获取本月剩余天数
        var leaveDay = DS.getLastDayAway2();
        //获取本月天数
        var days = DS.getCurrentMonthDay();

        var totalFee=handler.formatMoney(0);
        //var giveMinuteSum =  parseInt(minute * num);
        var giveMinutePay = 0;
        //区分试用、正用
        if(data.status == "try"){//试用状态按照当前选择的套餐计算
            totalFee = handler.formatMoney(num * price * leaveDay / days);
            giveMinutePay = parseInt(num * minute * leaveDay / days);
            data.giveMinuteOne = minute;
        }else if(data.status == "use"){//正用状态按照当月的套餐计算
            var paidNum = parseInt(data.paidNum,10);//付过费的数量
            var payNum = (num - paidNum)||0;//需要付费的数量
            var oldLicencePriceType = data.licencePriceType;
            var oldPrice = handler.formatTrueFee(ccFee.calloutLicence[oldLicencePriceType].price);
            var oldMinute = parseInt(ccFee.calloutLicence[oldLicencePriceType].minute,10);
            data.giveMinuteOne = oldMinute;
            data.giveMinuteOneNew = parseInt(ccFee.calloutLicence[data.licencePriceTypeNew].minute,10);
            if(payNum > 0){
                totalFee = handler.formatMoney(payNum * oldPrice * leaveDay / days);
                giveMinutePay = parseInt(payNum * oldMinute * leaveDay / days);
            }
        }
        data.changeNum = changeNum;
        //data.giveMinuteSum = giveMinuteSum;//所有座席总的赠送分钟数
        data.giveMinutePay = giveMinutePay;//增加的座席需要赠送的分钟数
        data.totalFee = totalFee;//费用

    },
    //外呼版licence初始化
    _initOutCallLicence:function(row,p){
        var syncFee = function(){
            var frm=p.find('#frm_licence_outcall_update');
            var data = DS.util.getDataOfForm(frm);
            if(data.succeed){
                data=data.data;
                console.log(data);
                if(data.status != "try"){
                    if(data.licencePriceType != data.oldLicencePriceType){
                        p.find(".licenseNum_field_group").hide();
                    } else {
                        p.find(".licenseNum_field_group").show();
                    }
                }

                if(data.status != "try"){
                    if(data.oldNum != data.num){
                        p.find(".licencePriceType").val(data.oldLicencePriceType);
                        p.find(".licencePriceType").attr("disabled",true);
                    } else {
                        p.find(".licencePriceType").attr("disabled",false);
                    }
                }

                handler.licence.calculateOutcallLicence(data);
                p.find(".change_num").text(data.changeNum);
                p.find("input[name='giveMinuteOne']").val(data.giveMinuteOne);
                p.find("input[name='money']").val(data.totalFee);
                p.find(".give_minute").text(data.giveMinutePay);
                p.find(".total_fee").text(data.totalFee);

                if(parseFloat(row.balance)<parseFloat(data.totalFee)){
                    p.find(".balance_not_enough").show();
                    p.find('.ds_pay').addClass("disabled").removeClass("ds_form_action");
                }else{
                    p.find(".balance_not_enough").hide();
                    p.find('.ds_pay').removeClass("disabled").addClass("ds_form_action");
                }
            }
        }
        //修改套餐
        var licencePriceType = p.find(".licencePriceType");
        licencePriceType.change(function(){
            syncFee();
        });
        //修改数量
        var obj=p.find(".ds_spinner_num");
        if(obj){
            obj.spinner({
                spin: function( event, ui ) {
                    if ( ui.value < 1 ) {
                        $( this ).spinner( "value", 1 );
                        return false;
                    }
                },
                stop: function(event,ui) {
                    syncFee();
                }
            });
            obj.keyup(function(){
                syncFee();
            });
        }
    },
    //外呼版licence续费
    showLicenceOutcall:function(license,p){
        handler.account._setAccBalance(license);
        DS.getView('cc/licence/licence_renew_outcall',function(view){
            view=DS.renderMethodViewNew(view, license);
            p.find(".modal-dialog").width(800);
            p.find(".modal-body").html(view);
            p.find(".modal-title").html('licence续费');
            if(license.status =="try"){
                p.find(".tryShow").show();
                p.find(".licence_outcall_use_div").hide();
            }
            p.modal();
        });
    },
    //显示续费
    showRenew:function(id,src){
        var p=$("#service_modal");
        var action={
            action:'app.licence.getLicenceById',
            data:{_id:id}
        };
        var cc=session.account;
        DS.sendUrl('./action2bill',action,function(rep){
            if(rep.success){
                var license=rep.license;
                if(license.licenceType == 'outcall'){
                    license.licencePrice = handler.formatTrueFee(cc.calloutLicence);
                    license.calloutMinute = cc.calloutMinute || 0;
                    handler.licence.showLicenceOutcall(license,p);
                }else{
                    if(license.licenceType=='enterprise'){
                        license.licencePrice=handler.formatTrueFee(cc.callinLicence);
                    }else if(license.licenceType=='monitor'){
                        license.licencePrice=handler.formatTrueFee(cc.monitorLicence);
                    }else if(license.licenceType=='service'){
                        license.licencePrice=handler.formatTrueFee(cc.serviceLicence);
                    }
                    if(!license.numNew){
                        license.numNew = license.num;
                    }
                    var acc=handler.getMyAccInfo();
                    var overdraw=acc.overdraw||0;
                    var total=acc.balance+overdraw;
                    license.balance=handler.formatTrueFee(total);
                    license.overdraw=handler.formatTrueFee(overdraw);
                    license.actualBalance=handler.formatTrueFee(acc.balance);

                    DS.getView('cc/licence/licence_renew',function(view){
                        view=DS.renderMethodViewNew(view, license);
                        p.css({width:'800px','margin-left':'-400px'});
                        p.find(".modal-body").html(view);
                        p.find(".modal-title").html('licence续费');

                        handler.licence._initRenewLicence(license,p);

                        var frm=p.find('#frm_licence_update');
                        var data = DS.util.getDataOfForm(frm);
                        if(data.succeed){
                            data=data.data;
                            handler.licence.calculateLicenceFee(data);
                            p.find('.fee').text(data.totalFee);
                            //p.find(".enterprise_price").text(data.realPrice);
                        }
                        p.modal();
                    });
                }
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    //试用licence延期初始化
    _initTestRenew:function(pane){
        //var obj2=pane.find(".ds_spinner2");
        var obj2=pane.find(".service_month");
        if(obj2){
            obj2.spinner({
                spin: function( event, ui ) {
                    if ( ui.value < 0 ) {
                        $( this ).spinner( "value", 0 );
                        return false;
                    }
                },
                stop: function(event,ui) {
                }
            });
        }
        var obj = pane.find(".licence_num");
        if(obj){
            obj.spinner({
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
    //显示延期试用
    showTestRenew:function(id,src){
        var pane=$("#service_modal");
        var status=src.attr("ds_attr");
        //if(status!='try' && status!='use'){
        if(status!='try'){
            $().alertmessage('showError', "请选择试用状态的licence！");
            return;
        }
//        pane.find(".modal-dialog").width(800);
        var body=pane.find('.modal-body');
        var action={
            action:'app.licence.getLicenceById',
            data:{_id:id}
        }
        var url='cc/licence/licence_renew_test';
        DS.send(action,function(rep){
            if(rep.success){
                var row=rep.license;
                DS.getView(url, function(view) {
                    view=DS.renderMethodViewNew(view, row);
                    pane.find(".modal-title").html('licence延期');
                    body.html(view);
                    if(row.licenceType == "outcall"){
                        pane.find(".licence_renew_test_h1").hide();
                        pane.find(".licence_renew_test_h2").show();
                    }
                    handler.licence._initTestRenew(body);
                    pane.modal();
                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    //确认延期
    updateTestDate:function(data,src){
        if(data.num<=0){
            $().alertmessage('showError', "licence数量最小为1");
            return;
        }
        var action={
            action:'app.licence.updateLicence2Test',
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                handler.licence.getLicenceList();
                $("#service_modal").modal('hide');
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    _initResetTime:function(pane){
        pane.find('.ds_date').datepicker({
//            changeMonth: true,
//            changeYear: true,
//            minDate:0,
            showButtonPanel: true
        });
    },
    showResetTime:function(id,src){
        var pane=$("#service_modal");
        var status=src.attr("ds_attr");
        //if(status!='try' && status!='use'){
        //    $().alertmessage('showError', "请选择试用或正用状态的licence！");
        //    return;
        //}
//        pane.find(".modal-dialog").width(800);
        var body=pane.find('.modal-body');
        var action={
            action:'app.licence.getLicenceById',
            data:{_id:id}
        }
        var url='cc/licence/licence_reset_time';
        DS.send(action,function(rep){
            if(rep.success){
                var row=rep.row;
                DS.getView(url, function(view) {
                    view=DS.renderMethodViewNew(view, row);
                    pane.find(".modal-title").html('licence重置');
                    body.html(view);
                    handler.licence._initResetTime(pane);
                    pane.modal();
                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    resetTime:function(data,src){
        var action={
            action:'app.licence.resetLicenceTime',
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                handler.licence.getLicenceList();
                $("#service_modal").modal('hide');
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    showChangeStatus:function(id,src){
        var pane=$("#service_modal");
        var status=src.attr("ds_attr");
//        pane.find(".modal-dialog").width(800);
        var body=pane.find('.modal-body');
        var action={
            action:'app.licence.getLicenceById',
            data:{_id:id}
        }
        var url='cc/licence/licence_change_status';
        DS.send(action,function(rep){
            if(rep.success){
                var row=rep.license;
                DS.getView(url, function(view) {
                    view=DS.renderMethodViewNew(view, row);
                    pane.find(".modal-title").html('licence变更');
                    body.html(view);
                    pane.modal();
                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    changeStatus:function(data,src){
        var action={
            action:'app.licence.changeLicenceStatus',
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                handler.licence.getLicenceList();
                $("#service_modal").modal('hide');
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    deleteLicence:function(data,src){
        if(!confirm("确认要删除该licence？"))return;
        var action={
            action:'app.licence.deleteLicence',
            data:{_id:data}
        }
        DS.send(action,function(rep){
            if(rep.success){
                handler.licence.getLicenceList();
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    _initRenewLicenceNum:function(data,pane){
        var type = data.licenceType;
       /* if(data.effectDate && data.effectDate!=""){
            pane.find(".haveEffectDate").show();
            //pane.find(".haveDate").hide();
        }*/
        var syncFee=function(){
            var frm=pane.find('#frm_licence_update');
            var data = DS.util.getDataOfForm(frm);
            if(data.succeed){
                data=data.data;
                handler.licence.calculateLicenceFeeNew(data);
                pane.find('.fee').text(data.totalFee);
                pane.find(".change_num").text(data.changeNum);
            }
        }
        //修改数量
        var obj=pane.find(".ds_spinner_num");
        if(obj){
            obj.spinner({
                spin: function( event, ui ) {
                    if ( ui.value < 1 ) {
                        $( this ).spinner( "value", 1 );
                        return false;
                    }
                },
                stop: function(event,ui) {
                    syncFee();
                }
            });
            obj.keyup(function(){
                syncFee();
            });
        }
    },
    showRenewNum:function(id,src){
        var p=$("#service_modal");
        var action={
            action:'app.licence.getLicenceById',
            data:{_id:id}
        };
        var cc=session.account;
        DS.sendUrl('./action2bill',action,function(rep){
            if(rep.success){
                var license=rep.license;
                if(license.licenceType=='enterprise'){
                    license.licencePrice=handler.formatTrueFee(cc.callinLicence);
                }else if(license.licenceType=='monitor'){
                    license.licencePrice=handler.formatTrueFee(cc.monitorLicence);
                }else if(license.licenceType=='service'){
                    license.licencePrice=handler.formatTrueFee(cc.serviceLicence);
                }
                if(!license.numNew){
                    license.numNew = license.num;
                }

                var acc=handler.getMyAccInfo();
                var overdraw=acc.overdraw||0;
                var total=acc.balance+overdraw;
                license.balance=handler.formatTrueFee(total);
                license.overdraw=handler.formatTrueFee(overdraw);
                license.actualBalance=handler.formatTrueFee(acc.balance);

                DS.getView('cc/licence/licence_renew_num',function(view){
                    view=DS.renderMethodViewNew(view, license);
                    p.css({width:'800px','margin-left':'-400px'});
                    p.find(".modal-body").html(view);
                    p.find(".modal-title").html('调整licence数量');

                    handler.licence._initRenewLicenceNum(license,p);

                    var frm=p.find('#frm_licence_update');
                    var data = DS.util.getDataOfForm(frm);
                    if(data.succeed){
                        data=data.data;
                        handler.licence.calculateLicenceFeeNew(data);
                        p.find('.fee').text(data.totalFee);
                        //p.find(".enterprise_price").text(data.realPrice);
                        //p.find('.presentMonth').text(data.presentMonth);
                        p.find(".change_num").text(data.changeNum);
                        //p.find("input[name='presentMonth']").val(data.presentMonth);
                    }
                    p.modal();
                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    }


}
