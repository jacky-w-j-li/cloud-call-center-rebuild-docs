handler.account = {
    queryPageSize: 10,
    pageSize:20,
    timerHandler:null,
    countTimer:0,
    msg1:'该号码已经超时释放或被其他人抢用!',
    productType:"cc",
    numList:[],
    initAccountInfo:function(){
        var pane=$("#right_pane");
        var acc=session.account;
        var html=acc.companyName;
        if(!acc.auditMemo){
            acc.auditMemo="";
        }
        if(session.account.identityStatus=='deal'){
            html+='<small>&nbsp;<span class="label label-success">认证中</span></small>';
        }else if(session.account.identityStatus=='failure'){
            html+='<small>&nbsp;<span class="label label-success">认证失败('+acc.auditMemo+')</span></small>';
            pane.find(".submit_identity").show();
        }else if(session.account.identityStatus=='success'){
            html+='<small>&nbsp;<span class="label label-success">已认证</span></small>';
            pane.find(".view_identity").show();
        }else{
            html+='<small>&nbsp;<span class="label label-success">未认证</span></small>';
            pane.find(".submit_identity").show();
        }
        pane.find('#acc_companyName').html(html);
        pane.find('#acc_name').text(acc.name);
        pane.find('#acc_mail').text(acc.linkManEmail);
        pane.find('#acc_tel').text(acc.linkManPhone);
        handler.account.showProductView();

        $('#service_modal').on('hidden.bs.modal', function (e) {
            $('#service_modal').find(".modal-body").empty();
//            $("#cdr_listen_audio").get(0).pause();
            if(handler.account.timerHandler){
                window.clearInterval(handler.account.timerHandler);
            }
        })
    },
    triggerQueryNum:function(src){
        var frm=$(src).closest("form");
        if(frm){
            var btn=frm.find(".ds_form_action");
            btn.click();
        }
    },
    showProductView:function(){
        var pane=$("#right_pane");
        var action={
            action:'app.accountSet.queryAccProduct',
            data:{}
        }
        DS.send(action,function(rep){
            if(rep.success){
                var list=rep.list;
                var products=rep.products;
                var html1=[];
                var html2=[];
                for (var i = 0; i < products.length; i++) {
                    var obj = products[i];
                    var count=0;
                    for (var j = 0; j < list.length; j++) {
                        var obj2 = list[j];
                        if(obj2.product==obj._id){
                            count++;
                            var tmpl='<button type="button" class="btn btn-lg btn-success ds_do_action" ds_action="loadMainView"  ds_product="'+obj._id+'" ds_data="'+obj._id+'/'+obj._id+'_main">'+obj.name+'</button>&nbsp;&nbsp;&nbsp;';
                            html1.push(tmpl);
                            break;
                        }
                    }
                    if(count==0){
                        var tmpl='<button type="button" class="btn btn-lg ds_do_action" ds_action="loadMainView"  ds_product="'+obj._id+'" ds_data="NA">'+obj.name+'</button>&nbsp;&nbsp;&nbsp;';
                        html2.push(tmpl);
                    }
                }
                pane.find(".buy_product").html(html1.join(""));
                pane.find(".nobuy_product").html(html2.join(""));
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    },
    refreshAccInfo:function(src){
        handler.account.queryMyNum();
    },
    _initMyProduct:function(src){
        var pane=$("#right_pane");

        var action={
            action:'app.accountSet.getAccProductFee',
            data:{product:handler.account.productType}
        }
        DS.send(action,function(rep){
            if(rep.success){
                //console.dir(rep);
                var product=rep.row;
                //console.dir(product)
                var minConsume=product.minConsume||0;
                var minConsumeObj=product.minConsumeObj||{};
                var giveMinute=product.giveMinute||0;
                var presentMinute=minConsumeObj.presentMinute;
                if(minConsumeObj.presentMinute!=0){
                    presentMinute=minConsumeObj.presentMinute||giveMinute;//兼容旧的账单
                }
                var _minConsume=minConsumeObj.minConsume||0;
                var calloutLicence  =product.calloutLicence;

                product.serviceLicence=product.serviceLicence||0;
                product._minConsume=_minConsume;
                product.minConsumeHtml="";
                if(!product.smsFee){
                    product.smsFee=0;
                }
                if(minConsumeObj && minConsumeObj.minConsume>0){
                    var minConsumeHtml='&nbsp;&nbsp;&nbsp;剩余：<span>_@formatTrueFee('+minConsumeObj.balance+')@_元</span>' +
                        '&nbsp;&nbsp;&nbsp;已消费：<span>_@formatTrueFee('+minConsumeObj.actualConsume+')@_元</span>';
                    if(giveMinute>0){
                        minConsumeHtml='&nbsp;&nbsp;&nbsp;赠送分钟数：<span>'+presentMinute+'分钟</span>' +
                            '&nbsp;&nbsp;&nbsp;剩余：<span>'+minConsumeObj.giveMinute+'分钟</span>';
                    }
                    product.minConsumeHtml=minConsumeHtml;
                }
                var nextHtml="";
                //console.info("minConsume=="+minConsume+",_minConsume===="+_minConsume);
                if(_minConsume!=minConsume){
                    if(handler.account.productType=="zj"){
                        nextHtml= "<div class='text-danger'>下月最低消费变更为：<span >_@formatTrueFee(_#minConsume#_)@_元/月</span></div>";
                    }else{
                        nextHtml= "<div class='text-danger'>下月最低消费变更为：<span >_@formatTrueFee(_#minConsume#_)@_元/月</span>&nbsp;&nbsp;&nbsp;赠送分钟数：<span>"+giveMinute+"分钟</span></div>";
                    }
                }
                pane.find('.dialBalance').text(handler.formatTrueFee(product.balance));
                var tmpl="<div>外呼资费：手机市话<span>_@formatTrueFee(_#local#_)@_元/分钟</span>&nbsp;&nbsp;&nbsp;固话市话<span>_@formatTrueFee(_#localTel#_)@_元/分钟</span>&nbsp;&nbsp;&nbsp;" +
                    "手机长途<span>_@formatTrueFee(_#remote#_)@_元/分钟</span>&nbsp;&nbsp;&nbsp;固话长途<span>_@formatTrueFee(_#remoteTel#_)@_元/分钟</span></div>";
                var tmpl2="<div>外呼资费：本地前3分钟<span>_@formatTrueFee(_#prefixMin#_)@_元/分钟</span>&nbsp;&nbsp;&nbsp;本地以后每分钟<span>_@formatTrueFee(_#local#_)@_元/分钟</span>&nbsp;&nbsp;&nbsp;长途<span>_@formatTrueFee(_#remote#_)@_元/分钟</span></div>";
                var tmpl2_2="<div>外呼资费：本地前3分钟<span>_@formatTrueFee(_#prefixMin#_)@_元/分钟</span>&nbsp;&nbsp;&nbsp;本地以后每分钟<span>_@formatTrueFee(_#local#_)@_元/分钟</span>&nbsp;&nbsp;&nbsp;长途<span>_@formatTrueFee(_#remote#_)@_元/6秒</span></div>";
                var tmpl3="<div>呼转资费：手机市话<span>_@formatTrueFee(_#local#_)@_元/分钟</span>&nbsp;&nbsp;&nbsp;固话市话<span>_@formatTrueFee(_#localTel#_)@_元/分钟</span>&nbsp;&nbsp;&nbsp;" +
                    "手机长途<span>_@formatTrueFee(_#remote#_)@_元/分钟</span>&nbsp;&nbsp;&nbsp;固话长途<span>_@formatTrueFee(_#remoteTel#_)@_元/分钟</span></div>";
                var tmpl4="<div>呼转资费：本地前3分钟<span>_@formatTrueFee(_#prefixMin#_)@_元/分钟</span>&nbsp;&nbsp;&nbsp;本地以后每分钟<span>_@formatTrueFee(_#local#_)@_元/分钟</span>&nbsp;&nbsp;&nbsp;长途<span>_@formatTrueFee(_#remote#_)@_元/分钟</span></div>";
                var tmpl4_4="<div>呼转资费：本地前3分钟<span>_@formatTrueFee(_#prefixMin#_)@_元/分钟</span>&nbsp;&nbsp;&nbsp;本地以后每分钟<span>_@formatTrueFee(_#local#_)@_元/分钟</span>&nbsp;&nbsp;&nbsp;长途<span>_@formatTrueFee(_#remote#_)@_元/6秒</span></div>";

                var tmpl5 = "<div>单个座席licence：企业版<span>_@formatTrueFee(_#callinLicence#_)@_元/月</span>" +
                    "&nbsp;&nbsp;&nbsp;客服版<span>_@formatTrueFee(_#serviceLicence#_)@_元/月</span>&nbsp;&nbsp;&nbsp;监控版<span>_@formatTrueFee(_#monitorLicence#_)@_元/月</span>";
                if(product.calloutLicenceStrategy=='licencePrice'){
                    var _min=product.calloutMinute||0;
                    tmpl5 +="&nbsp;&nbsp;&nbsp;外呼版<span>_@formatTrueFee(_#calloutLicence#_)@_元/月(赠送"+_min+"分钟)</span></div>";
                }else{
                    tmpl5 +="&nbsp;&nbsp;&nbsp;外呼版<span>0元/月</span></div>";
                }

                var tmpl6="<div>外呼资费：市话<span>_@formatTrueFee(_#local#_)@_元/6秒</span>&nbsp;&nbsp;&nbsp;长途<span>_@formatTrueFee(_#remote#_)@_元/6秒</span></div>";
                var tmpl7="<div>呼转资费：市话<span>_@formatTrueFee(_#local#_)@_元/6秒</span>&nbsp;&nbsp;&nbsp;长途<span>_@formatTrueFee(_#remote#_)@_元/6秒</span></div>";
                var tmpl8="<div>本月最低消费：<span >_@formatTrueFee(_#_minConsume#_)@_元/月</span>_#minConsumeHtml#_</div>"+nextHtml;
                var tmpl9="<div>短信资费：<span >_@formatTrueFee(_#smsFee#_)@_元/条</span></div>";
                var html=[];
                switch (product.dialFeeStrategy){
                    case "minute":
                        html.push(DS.renderMethodViewNew(tmpl,product.dialFee));
                        break;
                    case "second6":
                        html.push(DS.renderMethodViewNew(tmpl6,product.dialFee));
                        break;
                    case "minute3":
                        html.push(DS.renderMethodViewNew(tmpl2,product.dialFee));
                        break;
                    case "minute3s6":
                        html.push(DS.renderMethodViewNew(tmpl2_2,product.dialFee));
                        break;
                }
                switch (product.transferFeeStrategy){
                    case "minute":
                        html.push(DS.renderMethodViewNew(tmpl3,product.transferFee));
                        break;
                    case "second6":
                        html.push(DS.renderMethodViewNew(tmpl7,product.transferFee));
                        break;
                    case "minute3":
                        html.push(DS.renderMethodViewNew(tmpl4,product.transferFee));
                        break;
                    case "minute3s6":
                        html.push(DS.renderMethodViewNew(tmpl4_4,product.transferFee));
                        break;
                }
                html.push(DS.renderMethodViewNew(tmpl9,product));//增加短信资费
                if(handler.account.productType=='cc'){
                    if(!product.monitorLicence){
                        product.monitorLicence=100000;
                    }
                    html.push(DS.renderMethodViewNew(tmpl5,product));
                }else if(handler.account.productType=='zj'){
                }
                html.push(DS.renderMethodViewNew(tmpl8,product));
                pane.find(".tel_fee").html(html.join(""));
            }else{
                $().alertmessage('showError', errMsg);
            }
        })

    },
    getStatusCache:function(type){
        var statusDesc="";
        if(type=='free'){
            statusDesc="空闲";
        }else if(type=="use"){
            statusDesc="在用";
        }else if(type=="try"){
            statusDesc="试用";
        }else if(type=="present"){
            statusDesc="赠送";
        }else if(type=="stop"){
            statusDesc="正式停用";
        }else if(type=="stopTry"){
            statusDesc="试用停用";
        }else if(type=="ready"){
            statusDesc="预占";
        }
        return statusDesc;
    },
    _renderCCNum:function(obj,html){
        var tmplCC='<tr class="_#trclass#_"> <td>_#name#_</td><td>_@formatTrueFee(_#monthRent#_)@_元/月</td><td>_#statusDesc#_</td>';
        var suffix_wait_pay='<td><a href="#" class="ds_do_action" ds_action="account.showCCSnPay" style="margin-right: 10px;" ds_data="_#name#_">支付</a>';
        var suffix2_status= '';
        var suffix_after = '</td></tr>';

        var suffix_try='';
        var suffix_stop='<td><a href="#" class="ds_do_action"  ds_action="account.enableNum"  ds_data="_#code#_">启用</a></td></tr>';
        var suffix_other='<td>_#btnContent#_</td></tr>';

        var tmpl_btn_stop='<a href="#" class="ds_do_action stop_num"  ds_action="account.showStopNum" style="margin-right: 10px;" ds_data="_#code#_" ds_attr="_#monthRent#_">停用</a>' +
            '<a href="#" class="ds_do_action cancelStop"  ds_action="zjNum.cancelStopNum" style="display: none;" ds_data="_#code#_">取消停用</a>';
        var tmpl_btn_cancel='<a href="#" class="ds_do_action stop_num"  ds_action="account.showStopNum" style="margin-right: 10px;display: none;" ds_data="_#code#_" ds_attr="_#monthRent#_">停用</a>' +
            '<a href="#" class="ds_do_action cancelStop"  ds_action="account.cancelStopNum" style="" ds_data="_#code#_">取消停用</a>';

        var tmpl="";
        var status=obj.status;
        var btnContent="";
        var failNum=obj.failNum;
        var isOld=obj.isOld;
        var typeDesc="固话租用";

        var statusDesc= handler.account.showStatusDesc(obj);
        var col1={code:obj._id+'|'+status,type:typeDesc,name:obj._id,monthRent:obj.monthRent,status:status,statusDesc:statusDesc,trStyle:''};
        if(isOld){//兼容旧的
            btnContent="";
            tmpl=tmplCC+suffix_other;
        }else{
            if(status=='try'){
                tmpl=tmplCC+suffix_wait_pay+suffix_try+suffix2_status+suffix_after;
            }else if(status=='waitPay'){
            }else if(status=='verify'||status=='unpass'){
                btnContent="";
                tmpl=tmplCC+suffix_other;
            }else if(status=='use'){
                tmpl=tmplCC+suffix_other;
                if(obj.planFlag=='stop'){
                    btnContent=tmpl_btn_cancel;
                }else if(obj.planFlag=='sysStop'){
                    btnContent="";
                }else{
                    btnContent=tmpl_btn_stop;
                }
            }else if(status=='present'){
                tmpl=tmplCC+suffix_other;
                if(obj.planFlag=='stop'){
                    btnContent=tmpl_btn_cancel;
                }else if(obj.planFlag=='sysStop'){
                    btnContent="";
                }else{
                    btnContent=tmpl_btn_stop;
                }
            }else if(status=='stop'||status=='stopTry'){
                if(failNum>3){
                    btnContent="";
                    tmpl=tmplCC+suffix_other;
                }else{
                    tmpl=tmplCC+suffix_stop;
                }
            }
        }
        col1.btnContent=DS.renderMethodViewNew(btnContent, col1);
        html.push(DS.renderMethodViewNew(tmpl, col1));
    },
    _render400Num:function(obj,html){
        var tmpl='<tr class="_#trclass#_"> <td>_#name#_</td><td>_@formatTrueFee(_#minConsume#_)@_元/月</td> <td>_#statusDesc#_</td><td>&nbsp;</td>';
        var status=obj.status;
        var statusDesc=handler.account.showStatusDesc(obj);
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
    },
    queryMyNum:function(src){
        var pane=$("#view_company_identity");
        var product="cc";
        //handler.account._initMyProduct(src);
        var action={
            action:'app.account.queryMyServer',
            data:{product:product}
        }
        DS.sendUrl('./action2bill',action,function(rep){
            if(rep.success){
                var tel=rep.tel||[];
                var tel400=rep.tel400||[];
                handler.account.numList=tel.concat(tel400);
                var nums=handler.account.numList;
                var len=nums.length;
                //console.dir(nums);
                var limit=len>10?10:len;
                var html=[];
                for(var i=0;i<limit;i++){
                    var obj=nums[i];
                    if(obj._id.substring(0,3)=='400'){
                        handler.account._render400Num(obj,html);
                    }else{
                        handler.account._renderCCNum(obj,html);
                    }
                }
                pane.find("#sn_normal_list").html(html.join(""));
                if(len==0){
                    pane.find("#sn_normal_list").html('<tr><td colspan="10" class="text-center">还未购买任何号码</td></tr>');
                }
                DS.updatePagination("cc_num_frm", len, 10, 1);
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    },
    queryNumPage:function(data,src){
        var pane=$("#view_company_identity");
        var page=data.page;
        if(src && src.hasClass("page_on")){
            page=src.attr("value");
        }
        if(!page)page=1;
        var nums=handler.account.numList;
        var len=nums.length;
        var html=[];
        var skip=(page-1)*10;
        var limit=(len-skip)>10?(skip+10):len;
        //console.info("skip===="+skip+",limit=="+limit);
        for(var i=skip;i<limit;i++){
            var obj=nums[i];
            if(obj._id.substring(0,3)=='400'){
                handler.account._render400Num(obj,html);
            }else{
                handler.account._renderCCNum(obj,html);
            }
        }
        pane.find("#sn_normal_list").html(html.join(""));
        DS.updatePagination("cc_num_frm", len, 10, page);
    },
    showCCSnPay:function(id,src){
        var pane=$("#service_modal");
        var title=pane.find('.modal-title');
        var body=pane.find('.modal-body');

        var action={
            action:'app.account.getServiceNoById',
            data:{_id:id}
        }
        DS.sendUrl('./action2bill',action,function(rep){
            if(rep.success){
                var row=rep.row;
                //var concurrentFee=parseFloat(row.concurrentFee||0);
                row.monthRent=row.monthRent;
                handler.account._setAccBalance(row);

                DS.getView('cc/num/num_detail', function(view) {
                    handler.account._calculateFirstMonthRent(row);
                    view=DS.renderMethodViewNew(view,row);
                    body.html(view);
                    if(parseFloat(row.balance)<parseFloat(row.totalFee)){
                        pane.find(".balance_not_enough").show();
                        pane.find('.ds_form_action.ds_pay').addClass("disabled").removeClass("ds_form_action");
                    }
                    //pane.find('.ds_form_action.ds_pay').attr("ds_action","account.confirmPayNew");
                    title.text('号码支付');
                    pane.find(".modal-dialog").width(800);
                    pane.modal();
                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    confirmPayNew:function(data,src){
        if (src.hasClass("disabled")) return false;
        var frm=$("#service_modal").find('#frm_serviceno_detail');
        var data = DS.util.getDataOfForm(frm);
        data=data.data;
        data.product="cc";
        var money=parseFloat(data.money);
        var balance=parseFloat(data.balance);
        if(money<0){
            $().alertmessage('showError', "无效的应付金额！");
            return;
        }
        if(balance<money){
            $().alertmessage('showError', "您的账户余额不足,请先充值！");
            return;
        }
        src.addClass("disabled");
        handler.account._balanceCCPay(data,src);
    },
    _balanceCCPay:function(data,src){
//        console.dir(data);
        var action={
            action:'app.pay.balancePay2CCMonthRent',
            data:data
        };
        DS.sendUrl('./action2bill',action,function(rep){
            if(rep.success){
                //refresh balance
                handler.account.finishPay();
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
        DS.sendUrl('./action2bill',action,function(rep){
            if(rep.success){
                var row=rep.row;
                row.monthRent=row.monthRent;
                handler.account._setAccBalance(row);
                title.text('启用号码');
                DS.getView('cc/num/num_renew', function(view) {
                    handler.account._calculateFirstMonthRent(row);
                    view=DS.renderMethodViewNew(view,row);
                    body.html(view);
                    if(parseFloat(row.balance)<parseFloat(row.totalFee)){
                        body.find(".balance_not_enough").show();
                        body.find('.ds_form_action.ds_pay').addClass("disabled").removeClass("ds_form_action");
                    }
                    //body.find('.ds_form_action.ds_pay').attr("ds_action",'account.confirmPayNew')
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
        DS.getView('cc/num/num_stop',function(view){
            var p=$('#service_modal');
            p.find(".modal-dialog").width(800);
            p.find('.modal-title').text('停用号码');
            view=DS.renderMethodViewNew(view,row);
            p.find(".modal-body").html(view);

            //p.find('.ds_form_action.num_stop').attr("ds_action",'account.stopNum');
            p.modal();
        });
    },
    stopNum:function(data,src){
        var action={
            action:'app.account.stopNum',
            data:data
        };
        DS.sendUrl('./action2bill',action,function(rep){
            if(rep.success){
                //refresh balance
                handler.account.finishPay();
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
        DS.sendUrl('./action2bill',action,function(rep){
            if(rep.success){
                //refresh balance
                handler.account.finishPay();
            }else{
                $().alertmessage('showError', rep.message||'支付异常');
            }
        });
    },
    _calculateFirstMonthRent:function(data){
        var monthDay=data.monthDay;
        var leaveDay=data.leaveDay;
        var monthRent=handler.formatTrueFee(parseFloat(data.monthRent));
        var totalFee=handler.formatMoney((monthRent/monthDay)*leaveDay);
        data.totalFee=totalFee;
    },


    select400ServiceNo:function(data,src){
        DS.getView('account/serviceno_buy_400',function(view){
            var p=$('#service_modal');
            //p.find(".modal-dialog").width(800);
            p.find('.modal-title').text('添加400');
            p.find(".modal-body").html(view);
            p.modal();
        });
    },

    selectServiceNo:function(data,src){
        DS.getView('account/serviceno_tabs',function(view){
            var p=$('#service_modal');
            //p.find(".modal-dialog").width(800);
            p.find('.modal-title').text('选购号码');
            p.find(".modal-body").html(view);
            p.find("#serviceno_tab").find('li a:first').click();
            p.modal();
        });
    },
    reSelectServiceNo:function(sn){
        var action={
            action:'app.account.reSelectServiceNo',
            data:sn
        }
        var p=$('#service_modal');
        var container=p.find('.pay_start');
        DS.send(action,function(rep){
            if(rep.success){
                handler.account.refreshAccInfo();
                DS.getView('account/serviceno_tabs',function(view){
                    p.find('.modal-title').text('选购服务号');
                    p.find(".modal-body").html(view);
                    p.find("#serviceno_tab").hide();
                    p.find("#serviceno_tab").find('li a:first').click();
                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    },
    reSelect400ServiceNo:function(sn){
        var action={
            action:'app.account.reSelect400ServiceNo',
            data:sn
        }
        var p=$('#service_modal');
        var container=p.find('.pay_start');
        DS.send(action,function(rep){
            if(rep.success){
                handler.account.refreshAccInfo();
                DS.getView('account/serviceno_tabs',function(view){
                    p.find('.modal-title').text('选购服务号');
                    p.find(".modal-body").html(view);
                    p.find("#serviceno_tab").hide();
                    p.find("#serviceno_tab").find('li a:last').click();
                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    },
    resetSn:function(data,src){
        var frm=src.closest("form");
        frm[0].reset();
        frm.find(".sp_item").removeClass("showField");
        frm.find(".sp_item:first").addClass("showField");
        frm.find(".city_item").removeClass("showField");
        frm.find(".city_item:first").addClass("showField");
    },
    loadSnView:function(data,src){
        var pane=$("#serviceno_tab_content");
        DS.getView('account/serviceno_normal_list', function (view) {
            pane.html(view);
            handler.account.loadNormalServiceNoList(data,src);
        });
    },
    load400View:function(data,src){
        var pane=$("#serviceno_tab_content");
        DS.getView('account/serviceno_400_list', function (view) {
            pane.html(view);
            handler.account.load400ServiceNoList(data,src);
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
        DS.sendUrl('./action2bill',action,function(rep){
            if(rep.success){
                var list=rep.list;
                var count=rep.count;
                if (list.length > 0){
                    var tmpl1='<div class="row">';
                    var tmpl='<div class="col-md-3 col1"><a style="text-decoration: none;" href="#" class="ds_do_action" ds_action="account.showTestServiceNoInfo" ds_data="_#_id#_"><h3>_#_id#_</h3></a><h6 class="text-muted">月租:_@formatTrueFee(_#monthRent#_)@_元</h6></div>';
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
                    pane.find('#service_normal_list').html('没有记录!');
                }
                pane.find('.result_count').text(count);
                DS.updatePagination(frmId, count, data.limit, data.page);
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    load400ServiceNoList:function(data,src){
        data=data||{};
        if(src && !src.hasClass("ds_do_action")){
            data.page = src.attr("value") || 1;
        }else{
            data.page = 1;
        }
        data.limit=handler.account.pageSize;
        var frmId='frm_serviceno_test_search';
        var pane=$("#serviceno_tab_content");
        var action={
            action:'app.account.query400ServiceNoList',
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                var list=rep.list;
                var count=rep.count;
                if (list.length > 0){
                    var tmpl1='<div class="row">';
                    var tmpl='<div class="col-md-3 col1"><a style="text-decoration: none;" href="#" class="ds_do_action" ds_action="account.show400ServiceNoInfo" ds_data="_#_id#_"><h3>_#_id#_</h3></a><h6 class="text-muted">月最低消费:_@formatTrueFee(_#minConsume#_)@_元</h6></div>';
                    var html = [];
                    for (var i = 0, len = list.length; i < len; i++) {
                        var row = list[i];
                        if(!row.minConsume){
                            row.minConsume=0;
                        }
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
                    pane.find('#service_normal_list').html('没有记录!');
                }
                pane.find('.result_count').text(count);
                DS.updatePagination(frmId, count, data.limit, data.page);
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    },
    showPayBalance:function(){
        var pane=$("#service_modal").find('.sn_pay');
        var frm=pane.find("#frm_serviceno_pay");
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
    showPay2DialMins:function(data,src){
        var pane=$("#service_modal").find('.sn_detail');
        var panepay=$("#service_modal").find('.sn_pay');

        data.totalFee=data.money;
        data.concurrent='';
        data.month='';
        data.monthRent='';

        handler.account._setAccBalance(data);
        var product=handler.account.productType;
        var desc="企业总机";
        if(product=='cc'){
            desc="呼叫中心";
        }
        var wellHtml='<h2>'+desc+'话费充值<small>当前余额:<span class="text-primary dialBalance">_#dialBalance#_</span>元</small></h2>'+
            '<h3>应付:<strong class="payamount">_#totalFee#_</strong>元</h3>';

        DS.getView('account/serviceno_pay', function(view) {
            view=DS.renderMethodViewNew(view, data);
            panepay.html(view);
            wellHtml=DS.renderMethodViewNew(wellHtml,data);
            panepay.find('.well').html(wellHtml);
            pane.hide();
            panepay.show();
        });
    },
    showPay2400DialMins:function(data,src){
        var pane=$("#service_modal").find('.sn_detail');
        var panelist=$("#service_modal").find('.sn_list');
        var panepay=$("#service_modal").find('.sn_pay');

        data.totalFee=data.money;
        data.concurrent='';
        data.month='';
        data.monthRent="";
        handler.account._setAccBalance(data);

        var wellHtml='<h2>企业400话费充值<small>当前余额:<span class="text-primary dialBalance">_@formatTrueFee(_#dialBalance#_)@_</span>元</small></h2>'+
            '<h3>应付:<strong class="payamount">_#totalFee#_</strong>元</h3>';

        DS.getView('account/serviceno_pay', function(view) {
            view=DS.renderMethodViewNew(view, data);
            panepay.html(view);
            wellHtml=DS.renderMethodViewNew(wellHtml,data);
            panepay.find('.well').html(wellHtml);
            panelist.hide();
            pane.hide();
            panepay.show();
        });
    },
    showPay:function(data,src){
        var pane=$("#service_modal").find('.sn_detail');
        var panelist=$("#service_modal").find('.sn_list');
        var panepay=$("#service_modal").find('.sn_pay');

        if(data.flag=='buyConcurrent'){
            handler.account.calculateFee2(data);
            if(data.totalFee<=0){
                $().alertmessage('showError', "您的号码已经到期或支付金额不够一个并发");
                return;
            }
        }else{
            handler.account.calculateFee(data);
        }
        handler.account._setAccBalance(data);
        DS.getView('account/serviceno_pay', function(view) {
            view=DS.renderMethodViewNew(view, data);
            panepay.html(view);
            panelist.hide();
            pane.hide();
            panepay.show();
        });
    },
    showPay400:function(data,src){
        var pane=$("#service_modal").find('.sn_detail');
        var panelist=$("#service_modal").find('.sn_list');
        var panepay=$("#service_modal").find('.sn_pay');

        handler.account.calculateFee400(data);
        handler.account._setAccBalance(data);
        var wellHtml='<h2>_#_id#_<small>月低销:<span class="text-primary minConsume">_@formatTrueFee(_#minConsume#_)@_</span>元</small></h2>'+
            '<h3>应付:<strong class="payamount">_#totalFee#_</strong>元</h3>';
        data.concurrent="";
        data.monthRent="";
        DS.getView('account/serviceno_pay', function(view) {
            view=DS.renderMethodViewNew(view, data);
            panepay.html(view);
            wellHtml=DS.renderMethodViewNew(wellHtml,data);
            panepay.find('.well').html(wellHtml);
            panelist.hide();
            pane.hide();
            panepay.show();
        });
    },
    _bankPay:function(frm,data,src){
        var bank=data.bank;
        if(!bank){
            $().alertmessage('showError', '请选择一种支付方式');
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
        if(src){
            src.removeClass("disabled");
        }
        handler.account._showPayFinish();
    },
    _balancePay:function(data,src){
        var action={
            action:'app.pay.balancePay',
            data:data
        };
        DS.send(action,function(rep){
            if(rep.success){
                //refresh balance
                handler.account.finishPay();
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
    _showPayFinish:function(){
        var p1=$("#service_modal").find('.pay_start');
        var p2=$("#service_modal").find('.pay_end');
        p1.hide();
        p2.show();
    },
    finishPay:function(){
        var aid=session.user.account;
        var action={
            action:'config.account.getAccountInfoById',
            data:aid
        };
        DS.send(action,function(rep){
            if(rep.success){
                var account=rep.row;
                var pane=$("#view_company_identity");
                handler.setMyAccInfo(account)
                pane.find('.uc_balance').text(account.balanceDesc);
                handler.account.queryMyNum();
                $("#service_modal").modal('hide');
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    confirmTest:function(sn,src){
        var action={
            action:'app.account.addServiceNo2Test',
            data:{_id:sn,product:handler.account.productType}
        }
        DS.sendUrl('./action2bill',action,function(rep){
            if(rep.success){
                handler.account.refreshAccInfo();
                $("#service_modal").modal('hide');
            }else{
                if(rep.code=='404'){
                    $().alertmessage('showError', handler.account.msg1);
                }else{
                    $().alertmessage('showError', errMsg);
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
        /*        if(status!='try'){
         $().alertmessage('showError', "请选择试用状态的号码！");
         return;
         }*/
//        pane.find(".modal-dialog").width(800);
        var body=pane.find('.modal-body');
        var action={
            action:'app.account.getServiceNoById',
            data:{_id:sn}
        }
        var url='account/serviceno_renew_test';
        DS.send(action,function(rep){
            if(rep.success){
                var row=rep.row;
                DS.getView(url, function(view) {
                    view=DS.renderMethodViewNew(view, row);
                    body.html(view);
                    handler.account._initTestRenew(body);
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
                handler.account.refreshAccInfo();
                $("#service_modal").modal('hide');
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    //wwh
    _initResetTime:function(pane){
        pane.find('.ds_date').datepicker({
//            changeMonth: true,
//            changeYear: true,
//            minDate:0,
            showButtonPanel: true
        });
    },
    showResetTime:function(sn,src){
        var pane=$("#service_modal");
        var status=src.attr("ds_attr");
        var body=pane.find('.modal-body');
        var action={
            action:'app.account.getServiceNoById',
            data:{_id:sn}
        }
        var url='account/serviceno_reset_time';
        DS.send(action,function(rep){
            if(rep.success){
                var row=rep.row;
                DS.getView(url, function(view) {
                    view=DS.renderMethodViewNew(view, row);
                    body.html(view);
                    handler.account._initResetTime(pane);
                    pane.modal();
                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    resetTime:function(data,src){
        var action={
            action:'app.account.resetTime',
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                handler.account.refreshAccInfo();
                $("#service_modal").modal('hide');
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    //wwh
    showStopServiceno:function(sn,src){
        var pane=$("#service_modal");
        var status=src.attr("ds_attr");
        var body=pane.find('.modal-body');
        var action={
            action:'app.account.getServiceNoById',
            data:{_id:sn}
        }
        var url='account/serviceno_stop_serviceno';
        DS.send(action,function(rep){
            if(rep.success){
                var row=rep.row;
                DS.getView(url, function(view) {
                    view=DS.renderMethodViewNew(view, row);
                    body.html(view);
                    pane.modal();
                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    stopServiceno:function(data,src){
        var action={
            action:'app.account.stopServiceno',
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                handler.account.refreshAccInfo();
                $("#service_modal").modal('hide');
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    //wwh
    showChangeStatus:function(sn,src){
        var pane=$("#service_modal");
        var status=src.attr("ds_attr");
        if(status!='try' && status!='use' && status!='present'){
            $().alertmessage('showError', "请选择正用、试用或赠送状态的号码！");
            return;
        }
        var body=pane.find('.modal-body');
        var action={
            action:'app.account.getServiceNoById',
            data:{_id:sn}
        }
        var url='account/serviceno_change_status';
        DS.send(action,function(rep){
            if(rep.success){
                var row=rep.row;
                DS.getView(url, function(view) {
                    view=DS.renderMethodViewNew(view, row);
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
            action:'app.account.changeStatus',
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                handler.account.refreshAccInfo();
                $("#service_modal").modal('hide');
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    confirmAccountPay:function(data,src){
        var frm=$("#service_modal").find('#frm_serviceno_pay');
        var data = DS.util.getDataOfForm(frm);
        data=data.data;
        handler.account._bankPay(frm,data);
    },
    confirmPay:function(data,src){
        if (src.hasClass("disabled")) return false;
        var frm=$("#service_modal").find('#frm_serviceno_pay');
        var container=$("#service_modal").find('.pay_start');
        var data = DS.util.getDataOfForm(frm);
        data=data.data;
        if(data.flag=='buyDialMin'){
            data.serviceno="";
        }
        data.product=handler.account.productType;
        var payServiceFlag=container.find("input[name='pay_serviceFlag']").val();
        if(payServiceFlag){
            data.serviceFlag=payServiceFlag;
        }
//        console.dir(data);
        var money=parseFloat(data.money);
        var balance=parseFloat(data.balance);
        if(balance<0){
            $().alertmessage('showError', "您的账户已经欠费，请先充值");
            return;
        }
        if(money<0){
            $().alertmessage('showError', "应付金额不能为负");
            return;
        }
        var check=data.accbalance;
        src.addClass("disabled");
        if(check && balance>0){//balance+bank
            var fee=money-balance;
            if(fee>0){
                data.money=fee;
                handler.account._bankPay(frm,data,src);
            }else{
                data.balance=money;
                handler.account._balancePay(data,src);
            }
        }else{//bank pay
            data.balance=0;
            handler.account._bankPay(frm,data,src);
        }
    },
    showTestServiceNoInfo:function(id,src){
        if(!confirm('确认要选择该号码吗?'))return;
        var action={
            action:'app.account.getServiceNoById',
            data:{_id:id}
        }
        var pane=$("#service_modal").find('.sn_detail');
        var panelist=$("#service_modal").find('.sn_list');

        DS.sendUrl('./action2bill',action,function(rep){
            if(rep.success){
                DS.getView('account/serviceno_approve_detail', function(view) {
                    view=DS.renderMethodViewNew(view, rep.row);
                    pane.html(view);
                    panelist.hide();
                    pane.show();
                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    approveTest:function(sn,src){
        var action={
            action:'app.account.approveServiceNoTest',
            data:{_id:sn,product:handler.account.productType}
        }
        DS.sendUrl('./action2bill',action,function(rep){
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
    show400ServiceNoInfo:function(id,src){
        if(!confirm('确认要选择该号码吗?'))return;
        var action={
            action:'app.account.lockServiceNo400',
            data:{_id:id,product:handler.account.productType}
        }
        var pane=$("#service_modal").find('.sn_detail');
        var panelist=$("#service_modal").find('.sn_list');

        DS.send(action,function(rep){
            if(rep.success){
                handler.account.refreshAccInfo();
                DS.getView('account/serviceno_400_detail', function(view) {
                    var row=rep.row;
                    handler.account.calculateFee400(row);
                    view=DS.renderMethodViewNew(view,row);
                    pane.html(view);
                    handler.account._initTimer(8*3600);
                    handler.account._initSnInfo400(pane);
                    panelist.hide();
                    pane.show();
                });
            }else{
                if(rep.code=='404'){
                    $().alertmessage('showError', handler.account.msg1);
                }else{
                    $().alertmessage('showError', errMsg);
                }
            }
        });
    },
    showServiceNoInfo:function(id,src){
        if(!confirm('确认要选择该号码吗?'))return;
        var payServiceFlag=$("#service_modal").find("input[name='pay_serviceFlag']").val();
        var action={
            action:'app.account.lockServiceNo',
            data:{_id:id,flag:payServiceFlag,product:handler.account.productType}
        }
        var pane=$("#service_modal").find('.sn_detail');
        var panelist=$("#service_modal").find('.sn_list');

        DS.send(action,function(rep){
            if(rep.success){
                handler.account.refreshAccInfo();
                DS.getView('account/serviceno_detail', function(view) {
                    var row=rep.row;
                    handler.account.calculateFee(row);
                    view=DS.renderMethodViewNew(view,row);
                    pane.html(view);
                    handler.account._initTimer(8*3600);
                    if(payServiceFlag){
                        $("#service_modal").find("input[name='concurrent']").attr("readonly","true");
                    }
                    handler.account._initSnInfo(pane);
                    panelist.hide();
                    pane.show();
                });
            }else{
                if(rep.code=='404'){
                    $().alertmessage('showError', handler.account.msg1);
                }else{
                    $().alertmessage('showError', errMsg);
                }
            }
        });
    },
    showRenew:function(data,src){
        var ary=data.split('|');
        if(ary.length<2)return;
        var type=ary[0];
        var sn=ary[1];
        var status=ary[2];
        var pane=$("#service_modal");
        var title=pane.find('.modal-title');
        var body=pane.find('.modal-body');
        var product=handler.account.productType;

        if(type=='monthRent'){
            DS.getView('account/renew_tabs',function(view){
                title.text('续费');
                view=DS.renderMethodViewNew(view, {serviceno:sn});
                body.html(view);
                if(product=='cc'||status=="stop"||status=="stopTry"){
                    body.find("#serviceno_tab").hide();
                }
                var detail=body.find(".sn_detail");
                detail.show();
                pane.find(".modal-dialog").width(800);
                body.find('#serviceno_tab').find('a:first').click();
            });
        }else{
            var action={
                action:'app.account.getServiceNoById',
                data:{_id:sn}
            }
            DS.send(action,function(rep){
                if(rep.success){
                    var row=rep.row;
                    DS.getView('account/renew_tabs',function(view){
                        title.text('续费');
                        view=DS.renderMethodViewNew(view, {serviceno:sn});
                        body.html(view);
                        if(product=='cc'||status=="stop"||status=="stopTry"){
                            body.find("#serviceno_tab").hide();
                        }
                        var detail=body.find(".sn_detail");
                        detail.show();
                        pane.find(".modal-dialog").width(800);
                        if(type=='ready'){
                            title.text('服务号付款');
                            body.find(".sn_list").hide();
                            DS.getView('account/serviceno_detail', function(view) {
                                handler.account.calculateFee(row);
                                view=DS.renderMethodViewNew(view, row);
                                detail.html(view);
                                handler.account._initTimer(row.timeout);
                                body.find(".sn_reload").show();
                                handler.account._initSnInfo(pane);
                                pane.modal();
                            });
                        }else if(type=='didNum'){
                            title.text('直拨号付款');
                            body.find(".sn_list").hide();
                            DS.getView('account/serviceno_detail', function(view){
                                handler.account.calculateFee(row);
                                view=DS.renderMethodViewNew(view, row);
                                detail.html(view);
                                handler.account._initTimer(row.timeout);
                                body.find(".sn_reload").show();
                                body.find("input[name='concurrent']").attr("readonly","true");
                                body.find("input[name='pay_serviceFlag']").val(row.flag);

                                handler.account._initSnInfo(pane);
                                pane.modal();
                            });
                        }else if(type=='didNumRenew'){
                            title.text('直拨号续费');
                            body.find(".sn_list").hide();
                            DS.getView('account/serviceno_renew', function(view){
                                handler.account.calculateFee(row);
                                view=DS.renderMethodViewNew(view, row);
                                detail.html(view);
                                body.find("input[name='pay_serviceFlag']").val(row.flag);

                                handler.account._initSnInfo(pane);
                                pane.modal();
                            });
                        }
                    });
                }else{
                    $().alertmessage('showError', errMsg);
                }
            });
        }
    },
    showSnRenew:function(sn,src){
        var pane=$("#service_modal");
//        pane.find(".modal-dialog").width(800);
        var body=pane.find('.modal-body');
        var detail=body.find('#serviceno_tab_content');
        var flag=src.attr('flag');
        var action={
            action:'app.account.getServiceNoById',
            data:{_id:sn}
        }
        var product=handler.account.productType;
        var url='account/serviceno_renew';
        if(product=='cc'){
            url='cc/telnum/serviceno_renew_cc';
        }
        if(flag=='2'){
            url='account/serviceno_renew_concurrent';
        }
        DS.send(action,function(rep){
            if(rep.success){
                var row=rep.row;
                DS.getView(url, function(view) {
                    if(flag=='2'){
                        handler.account.calculateFee2(row,true);
                        view=DS.renderMethodViewNew(view, row);
                        detail.html(view);
                        handler.account._initSnInfo(pane,flag);
                    }else{
                        handler.account.calculateFee(row);
                        view=DS.renderMethodViewNew(view, row);
                        detail.html(view);
                        handler.account._initSnInfo(pane);
                    }
                    pane.modal();
                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    showRenew400:function(data,src){
        var ary=data.split('|');
        if(ary.length<2)return;
        var type=ary[0];
        var sn=ary[1];
        var pane=$("#service_modal");
        var title=pane.find('.modal-title');
        var body=pane.find('.modal-body');


        DS.getView('account/renew_400_tabs',function(view){
            title.text('续费');
            view=DS.renderMethodViewNew(view, {serviceno:sn});
            body.html(view);
            var detail=body.find(".sn_detail");
            detail.show();
            pane.find(".modal-dialog").width(800);
            body.find('#serviceno_tab').find('a:first').click();
//            if(type=='monthRent'){
//                body.find('#serviceno_tab').find('a:first').click();
//            }else{
//                var action={
//                    action:'app.account.get400ServiceNoById',
//                    data:{_id:sn}
//                }
//                DS.send(action,function(rep){
//                    if(rep.success){
//                        var row=rep.row;
//                        if(type=='ready'){
//                            title.text('服务号付款');
//                            body.find(".sn_list").hide();
//                            DS.getView('account/serviceno_400_detail', function(view) {
//                                handler.account.calculateFee400(row);
//                                view=DS.renderMethodViewNew(view, row);
//                                detail.html(view);
//                                handler.account._initTimer(row.timeout);
//                                body.find(".sn_reload").show();
//                                handler.account._initSnInfo400(pane);
//                                pane.modal();
//                            });
//                        }
//                    }else{
//                        $().alertmessage('showError', errMsg);
//                    }
//                });
//            }
        });
    },
    showSnRenew400:function(sn,src){
        var pane=$("#service_modal");
//        pane.find(".modal-dialog").width(800);
        var body=pane.find('.modal-body');
        var detail=body.find('#serviceno_tab_content');
//        var flag=src.attr('flag');
        var action={
            action:'app.account.get400ServiceNoById',
            data:{_id:sn}
        }
//        var url='account/serviceno_400_renew';
//        if(flag=='2'){
//            url='account/serviceno_400_renew_dialmin';
//        }
        var url="account/serviceno_400_renew_dialmin";
        DS.send(action,function(rep){
            if(rep.success){
                var row=rep.row;
                DS.getView(url, function(view){
//                    if(flag=='2'){
                    row.dialBalance=row.balance;
                    view=DS.renderMethodViewNew(view, row);
                    detail.html(view);
//                    }else{
//                        handler.account.calculateFee400(row);
//                        view=DS.renderMethodViewNew(view, row);
//                        detail.html(view);
//                        handler.account._initSnInfo400(pane);
//                    }
                    pane.modal();
                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    showOnlinePay:function(data,src){
        var pane=$("#service_modal");
        var title=pane.find('.modal-title');
        var body=pane.find('.modal-body');

        DS.getView('account/account_pay', function(view) {
            body.html(view);
            //pane.find(".modal-dialog").width(800);
            title.text('账户充值');
            pane.modal();
        });
    },
    showDialBalance:function(data,src){
        var pane=$("#service_modal");
        var title=pane.find('.modal-title');
        var body=pane.find('.modal-body');
        var dialBalance=src.prev('.dialBalance').text();
        DS.getView('account/renew_dialMoney',function(view){
            title.text('充话费');
            pane.find(".modal-dialog").width(800);
            body.html(view);
            var detail=body.find(".sn_detail");
            detail.show();
            DS.getView('account/serviceno_renew_dialmin', function(view) {
                var product=handler.account.productType;
                var desc="企业总机";
                if(product=='cc'){
                    desc="呼叫中心";
                }
                var row={dialBalance:dialBalance,productDesc:desc};
                view=DS.renderMethodViewNew(view, row);
                detail.html(view);
                pane.modal();
            });
        });
    },
    _setAccBalance:function(data){
        var accInfo=handler.getMyAccInfo();
        var overdraw=accInfo.overdraw||0;
        var total=accInfo.balance+overdraw;
        data.balance=handler.formatTrueFee(total);
        data.overdraw=handler.formatTrueFee(overdraw);
        data.actualBalance=handler.formatTrueFee(accInfo.balance);
    },
    /*   showDidNumView:function(data,src){//old
     var action={
     action:'app.account.checkNopayServiceNo',
     data:{}
     }
     DS.send(action,function(rep){
     if(rep.success){
     DS.getView('account/serviceno_tabs',function(view){
     var p=$('#service_modal');
     p.find(".modal-dialog").width(800);
     p.find('.modal-title').text('选购号码');
     p.find(".modal-body").html(view);
     //                    p.find(".modal-body").find("input[name='pay_serviceFlag']").val("didnum");
     //                    p.find("#serviceno_tab").hide();
     p.find("#serviceno_tab").find('li a:first').click();
     p.modal();
     });
     }else{
     $().alertmessage('showError', rep.message);
     }
     })
     },*/
    _initSnInfo400:function(pane){
        var syncFee=function(){
            var frm=pane.find('#frm_serviceno_detail');
            var data = DS.util.getDataOfForm(frm);
            if(data.succeed){
                data=data.data;
                handler.account.calculateFee400(data);
                pane.find('.fee').text(data.totalFee);
            }
        }
        var obj2=pane.find(".ds_spinner2");
        if(obj2){
            obj2.spinner({
                spin: function( event, ui ) {
                    if ( ui.value > 36 ) {
                        $( this ).spinner( "value", 36 );
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
            obj2.keyup(function(){
                syncFee();
            });
        }
    },
    _initSnInfo:function(pane,flag){
        var syncFee=function(){
            var frm=pane.find('#frm_serviceno_detail');
            var data = DS.util.getDataOfForm(frm);
            if(data.succeed){
                data=data.data;
                if(flag=='2'){
                    handler.account.calculateFee2(data);
                }else{
                    handler.account.calculateFee(data);
                }
                pane.find('.fee').text(data.totalFee);
            }
        }
        var payServiceFlag=$("#service_modal").find("input[name='pay_serviceFlag']").val();
        var obj1=pane.find(".ds_spinner");
        var obj2=pane.find(".ds_spinner2");
        if(obj1 && !payServiceFlag){
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
        if(obj2){
            obj2.spinner({
                spin: function( event, ui ) {
                    if ( ui.value > 36 ) {
                        $( this ).spinner( "value", 36 );
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
            obj2.keyup(function(){
                syncFee();
            });
        }
//        pane.find(".ds_slider").slider();
    },
    calculateFee400:function(data){
        var p1=handler.formatTrueFee(parseFloat(data.minConsume));
        var p4=parseInt(data.month,10)||1;
        var totalFee=handler.formatRoundMoney(p1*p4);
        data.totalFee=totalFee;
    },
    calculateFee:function(data){
//        console.dir(data);
        var p1=handler.formatTrueFee(parseFloat(data.monthRent));
        var p3=parseInt(data.concurrent,10)||1;
        var p4=parseInt(data.month,10)||1;

        var totalFee=handler.formatRoundMoney(p1*p3*p4);
        data.totalFee=totalFee;
    },
    calculateFee2:function(data,init){
        //console.dir(data)
        var month=data.monthNum;
        if(month<0){
            month=0;
        }
        var p1=handler.formatTrueFee(parseFloat(data.monthRent));
        var p3=parseInt(data.concurrent,10)||0;
        if(init)p3=1;
        var p4=parseInt(data.oldConcurrent,10);
        var totalFee=handler.formatRoundMoney(p1*p3*month);
        data.totalFee=totalFee;
        data.month='';
    },
    showBankName:function(id){
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
            NBBANK:'宁波银行',

            //企业
            ICBCBTB:'工商银行',
            CCBBTB:'建设银行',
            CMBBTB:'招商银行',
            ABCBTB:'农业银行',
            BOCBTB:'工商银行',
            SPDBB2B:'上海浦东发展银行'
        };
        if(bank[id]){
            return bank[id];
        }else if(id=='COMM-DEBIT'){
            return '中国交通银行';
        }else if(id=='CEB-DEBIT') {
            return '中国光大银行';
        }else if(id=='CITIC-DEBIT') {
            return '中信银行';
        }else{
            return id;
        }
    },
    switchPay:function(key,o1){
        $(".bank a").each(function(i){
            $(this).css({backgroundColor: '#F1F1F1',color:'#000' });
        });
        if(o1){
            $(o1).css({backgroundColor:'#fff'});
        }
        if(key=='bank'){
            $('.pay_platform').hide();
            $('.pay_bank_enterprise').hide();
            $('.pay_bank').show();
        }else if(key=='enterpriseBank'){
            $('.pay_platform').hide();
            $('.pay_bank').hide();
            $('.pay_bank_enterprise').show();
        }else{
            $('.pay_bank').hide();
            $('.pay_bank_enterprise').hide();
            $('.pay_platform').show();
        }
    },
    toggleMore:function(id){
        if(id=='more'){
            $(".pay_bank").find(".pmore").show();
            $(".pay-more").find(".link-more:first").hide();
            $(".pay-more").find(".link-more:last").show();
        }else if(id=='less'){
            $(".pay_bank").find(".pmore").hide();
            $(".pay-more").find(".link-more:last").hide();
            $(".pay-more").find(".link-more:first").show();
        }
    },
    logout:function(){
        if(!confirm('确认退出系统吗？'))return;
        window.location='./';
    },
    aboutUs:function(){
        var p=$('#service_modal');
        DS.getView('account/about_us',function(view){
            p.find(".modal-dialog").width(450);
            p.find('.modal-title').text('关于我们');
            p.find(".modal-body").html(view);
            p.modal();
        });
    },
    showPwd:function(){
        var p=$('#common_modal');
        DS.getView('pwd/pwd_update',function(view){
            p.find(".modal-dialog").width(500);
            p.find('.modal-title').text('修改密码');
            p.find(".modal-body").html(view);
            p.find(".ds_form_action").attr({ds_action:'account.updatePwd',ds_form:'#frm_pwd_update'})
            p.modal();
        });
    },
    updatePwd:function(data,src){
        var action={
            action:'app.accountSet.updatePwd',
            data:data
        };
        DS.send(action,function(rep){
            if(rep.success){
                $('#common_modal').modal('hide');
                $().alertmessage('showSuccess', "密码修改成功");
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },

    _initTimer:function(second){
        handler.account.countTimer=second||0;
        handler.account.timerHandler=window.setInterval(function(){
            handler.account._showTimer();
        },1000);
    },
    _showTimer:function(){
        var pane=$("#service_modal").find(".lock_timer");
        if(pane){
            pane.text(app_timer(handler.account.countTimer));
        }
        handler.account.countTimer--;
        if(handler.account.countTimer<0){
            window.clearInterval(handler.account.timerHandler);
            $("#service_modal").find('.ds_form_action').addClass("disabled").removeClass("ds_form_action");
            alert('服务号已超过8小时锁定时间,暂不能支付,将在10分钟后释放');
        }
    },
    showNotifySet:function(){
        var p=$('#common_modal');
        var pane=$("#view_company_identity");
        var accInfo=pane.data("accInfo");
        DS.getView('notify/notify_set',function(view){
            //p.find(".modal-dialog").width(500);
            p.find('.modal-title').text('设置余额预警值');
            p.find(".modal-body").html(view);
            var body=p.find(".modal-body");
            body.find("input[name='_id']").val(accInfo._id);
            body.find("input[name='dialAlert']").val(accInfo.dialAlert||0);
            p.find(".ds_form_action").attr({ds_action:'account.updateNotifySet',ds_form:'#frm_set_notify'})
            p.modal();
        });
    },
    updateNotifySet:function(data,src){
        data.dialAlert=data.dialAlert||0;
        var action={
            action:'config.account.saveNotifyConfig',
            data:data
        };
        DS.send(action,function(rep){
            if(rep.success){
                var pane=$("#view_company_identity");
                var accInfo=pane.data("accInfo");
                accInfo.dialAlert=data.dialAlert;
                pane.data("accInfo",accInfo);

                $('#common_modal').modal('hide');
                $().alertmessage('showSuccess', "预警值设置成功");
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    /***************************************cc resource*****************************/
    queryMyCCNum:function(src){
        var pane=$("#right_pane");
        handler.account._initMyProduct(src);
        var action={
            action:'app.account.queryMyNum',
            data:{product:handler.account.productType}
        }
        DS.send(action,function(rep){
            if(rep.success){
                session.account.balance=rep.account.balance;
                session.account.overdraw=rep.account.overdraw||0;
                var tel=rep.tel;
                var tel400=rep.tel400;
                if(tel && tel.length>0){
                    var tmpl='<tr class="_#trclass#_"> <td>_#name#_</td><td>_#type#_</td> <td>_@formatTrueFee(_#monthRent#_)@_元/月</td><td style="font-weight: bold">_#endTime#_</td>';
                    var suffix1='<td><button type="button" class="btn btn-info btn-xs ds_do_action " ds_action="account.showCCRenew"  ds_data="_#code#_">_#desc#_</button></td> </tr>';
                    var t0=tmpl+suffix1;//for normal renew
                    var tryNum=0;
                    var des1="续费";
                    var des2="缴费";
                    var html=[];
                    for (var i = 0; i < tel.length; i++) {
                        var obj = tel[i];
                        var status=obj.status;
                        var flag=obj.flag;
                        var typeDesc="固话租用";
                        if(status=='try'){
                            tryNum++;
                        }
                        if(status=='ready'){
                            var col1={code:'ready|'+obj._id,type:typeDesc,name:obj._id,monthRent:obj.monthRent,endTime:'还未付款',trclass:'warning',desc:des2};
                            html.push(DS.renderMethodViewNew(t0, col1));
                        }else{
                            var col1={code:'monthRent|'+obj._id,type:typeDesc,name:obj._id,monthRent:obj.monthRent,endTime:obj.endTime,desc:des1};
                            html.push(DS.renderMethodViewNew(t0, col1));
                        }
                    }
                    pane.find("#sn_normal_list").html(html.join(""));
//                    showPayCheck(pane);
//                    if(tryNum==0){
//                        alertHtml='<a class="ds_do_action alert-link" href="#" ds_action="account.showNormalServiceNo" ds_data="">您选择的服务号为试用的，要转为正式号码，请点击此处选择</a>';
//                    }
                }else{
//                    alertHtml='<a class="ds_do_action alert-link" href="#" ds_action="account.selectServiceNo" ds_data="">您还没有选择服务号，某些功能暂不能正常使用，请点击此处选择</a>';
                    pane.find("#sn_normal_list").html('<tr><td colspan="6" class="text-center">还未购买任何号码</td></tr>');
                }

                if(tel400 && tel400.length>0){
                    var tmpl='<tr class="_#trclass#_"> <td>_#name#_</td><td>_#bindNum#_</td><td>_@formatTrueFee(_#minConsume#_)@_元/月</td><td>_#price#_</td> <td>_@formatTrueFee(_#balance#_)@_</td><td style="font-weight: bold">_#endTime#_</td>';
                    var suffix1='<td><button type="button" class="btn btn-info btn-xs ds_do_action " ds_action="account.showRenew400"  ds_data="_#code#_">_#desc#_</button></td> </tr>';
                    var t1=tmpl+suffix1;//for normal renew
                    var t0=t1;
                    var des1="续费";
                    var des2="缴费";
                    var html=[];
                    for (var i = 0; i < tel400.length; i++) {
                        var obj = tel400[i];
                        var status=obj.status;
                        var tmpl="<div>市话<span>_@formatTrueFee(_#local#_)@_元/分钟</span>&nbsp;&nbsp;&nbsp;长途<span>_@formatTrueFee(_#remote#_)@_元/分钟</span></div>";
                        var tmpl2="<div>本地前3分钟<span>_@formatTrueFee(_#prefixMin#_)@_元/分钟</span>&nbsp;&nbsp;&nbsp;本地以后每分钟<span>_@formatTrueFee(_#local#_)@_元/分钟</span>&nbsp;&nbsp;&nbsp;长途<span>_@formatTrueFee(_#remote#_)@_元/分钟</span></div>";
                        var tmplSecond="<div>市话<span>_@formatTrueFee(_#local#_)@_元/6秒</span>&nbsp;&nbsp;&nbsp;长途<span>_@formatTrueFee(_#remote#_)@_元/6秒</span></div>";
                        var _html=[];
                        switch (obj.dialFeeStrategy){
                            case "minute":
                                _html.push(DS.renderMethodViewNew(tmpl,obj.dialFee));
                                break;
                            case "second6":
                                _html.push(DS.renderMethodViewNew(tmplSecond,obj.dialFee));
                                break;
                            case "minute3":
                                _html.push(DS.renderMethodViewNew(tmpl2,obj.dialFee));
                                break;
                        }
                        obj.price=_html.join("");
                        if(status=='ready'){
                            var col1={code:'ready|'+obj._id,name:obj._id,bindNum:obj.bindNum||"",price:obj.price,minConsume:obj.minConsume,balance:obj.balance,endTime:'还未付款',trclass:'warning',desc:des2};
                            html.push(DS.renderMethodViewNew(t0, col1));
                        }else{
                            var col1={code:'monthRent|'+obj._id,name:obj._id,bindNum:obj.bindNum||"",price:obj.price,minConsume:obj.minConsume,balance:obj.balance,endTime:obj.endTime,desc:des1};
                            html.push(DS.renderMethodViewNew(t0, col1));
                        }
                    }
                    pane.find("#sn_400_list").html(html.join(""));
                }else{
                    pane.find("#sn_400_list").html('<tr><td colspan="6" class="text-center">还未购买任何号码</td></tr>');
                }
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    },
    _calculateCCSnFee:function(data){
        var p1=handler.formatTrueFee(parseFloat(data.monthRent));
        var p2=parseInt(data.month,10)||1;

        var totalFee=handler.formatRoundMoney(p1*p2);
        data.totalFee=totalFee;
    },
    _initCCSnInfo:function(pane){
        var syncFee=function(){
            var frm=pane.find('#frm_serviceno_detail');
            var data = DS.util.getDataOfForm(frm);
            if(data.succeed){
                data=data.data;
                handler.account._calculateCCSnFee(data);
                pane.find('.fee').text(data.totalFee);
            }
        }
        var obj2=pane.find(".ds_spinner2");
        if(obj2){
            obj2.spinner({
                spin: function( event, ui ) {
                    if ( ui.value > 36 ) {
                        $( this ).spinner( "value", 36 );
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
            obj2.keyup(function(){
                syncFee();
            });
        }
    },
    showIdentify:function(data,src){
        var action={
            action:'app.account.getAccountInfo',
            data:{}
        };
        DS.send(action,function(rep){
            if(rep.success){
                var accDb=rep.row;
                var p=$('#common_modal');
                DS.getView('index/identity',function(view){
                    p.find(".modal-dialog").width(600);
                    p.find('.modal-title').text('企业认证');
                    view=DS.renderMethodViewNew(view,accDb);
                    p.find(".modal-body").html(view);
                    p.find(".ds_form_action").attr({ds_action:'account.saveIdentify',ds_form:'#frm_identity_update'})
                    p.modal();
                });
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    saveIdentify:function(data,src){
        if (src.hasClass("disabled")) return false;
        var p=$('#common_modal');
        var frm=p.find('#frm_identity_update');
        var file1 = frm[0].busLicense.value;
        var file2 = frm[0].orgCard.value;
        var file3 = frm[0].taxCard.value;
        var file4 = frm[0].legalCard.value;
        if(!isImage(file1)||!isImage(file2)||!isImage(file3)||!isImage(file4)){
            $().alertmessage('showError', "只支持图片格式上传！");
            return;
        }
        frm.find('input[name="sessionId"]').val(session.id);
        src.addClass("disabled").text("上传中...");
        frm.submit();
//        p.modal("hide");
    },
    uploadSuccess:function(rep){
        var p=$('#common_modal');
        if(rep=='success'){
            $().alertmessage('showSuccess', '上传成功');
            handler.account.refreshAccIdentity({identityStatus:"deal"});
            p.modal('hide');
        }else{
            $().alertmessage('showError', '上传失败');
        }
        p.find(".ds_form_action").removeClass("disabled").text("保存");
    },
    showIdentifyInfo:function(data,src){
        var action={
            action:'app.account.getAccountInfo',
            data:{}
        };
        DS.send(action,function(rep){
            if(rep.success){
                var accDb=rep.row;
                var p=$('#identity_modal_view');
                DS.getView('index/identity_info',function(view){
                    p.find(".modal-dialog").width(800);
                    p.find('.modal-title').text('查看认证信息');
                    view=DS.renderMethodViewNew(view,accDb);
                    p.find(".modal-body").html(view);
                    p.find(".modal-body").find(".failure_section").hide();
                    p.find(".ds_form_action").show();
                    p.modal();
                });
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    showAuditIdentify:function(data,src){
        var action={
            action:'app.account.getAccountInfo',
            data:{}
        };
        DS.send(action,function(rep){
            if(rep.success){
                var accDb=rep.row;
                var p=$('#identity_modal');
                DS.getView('index/identity_info',function(view){
                    p.find(".modal-dialog").width(800);
                    p.find('.modal-title').text('审核认证信息');
                    view=DS.renderMethodViewNew(view,accDb);
                    p.find(".modal-body").html(view);
                    p.find(".ds_form_action").attr({ds_action:'account.auditIdentity',ds_form:'#frm_identity_audit'});
                    p.find(".ds_form_action").show();
                    p.modal();
                });
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    auditIdentity:function(data,src){
        var flag=src.attr("ds_attr");
        var audit=data.auditMemo;
        if(flag=="0"){
            if(!$.trim(audit)){
                $().alertmessage('showError', "失败原因不能为空");
                return;
            }
        }
        var action={
            action:'app.account.auditIdentity',
            data:{flag:flag,auditMemo:audit}
        };
        DS.send(action,function(rep){
            if(rep.success){
                var p=$('#identity_modal');
                if(flag=="0"){
                    handler.account.refreshAccIdentity({identityStatus:"failure"});
                }else{
                    handler.account.refreshAccIdentity({identityStatus:"success"});
                }
                p.modal("hide");
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    refreshAccIdentity:function(data){
        var pane=$("#right_pane");
        var acc=session.account;
        acc.identityStatus=data.identityStatus;
        var html=acc.companyName;
        if(session.account.identityStatus=='deal'){
            html+='<small>&nbsp;<span class="label label-success">认证中</span></small>';
            pane.find(".submit_identity").hide();
        }else if(session.account.identityStatus=='failure'){
            html+='<small>&nbsp;<span class="label label-success">认证失败</span></small>';
            pane.find(".view_identity").show();
            pane.find(".audit_identity").hide();
        }else if(session.account.identityStatus=='success'){
            html+='<small>&nbsp;<span class="label label-success">已认证</span></small>';
            pane.find(".view_identity").show();
            pane.find(".audit_identity").hide();
        }else{
            html+='<small>&nbsp;<span class="label label-success">未认证</span></small>';
            pane.find(".submit_identity").show();
        }
        pane.find('#acc_companyName').html(html);
    },
    showStatusDesc:function(data){
        var html='';
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
            }
        }else{
            if(status=='try'){
                html='<div class="status_try">试用</div><div class="text-muted" style="font-size: 10px;">'+data.endTime+'到期</div>';
            }else if(status=='waitPay'){
                html='<div class="status_try">等待支付</div><div class="text-muted" style="font-size: 10px;">'+data.endTime+'到期</div>';
            }else if(status=='use'){
                if(planFlag=='stop'){
                    html='<div class="status_try">在用</div><div class="text-muted" style="font-size: 10px;">请求下月1号停用</div>';
                }else if(planFlag=='sysStop'){
                    html='<div class="status_try">在用</div><div class="text-muted" style="font-size: 10px;">欠费下月1号停用</div>';
                }else{
                    html='<div class="status_use">在用</div>';
                }
            }else if(status=='stop'||status=='stopTry'){
                if(failNum>3){
                    html='<div class="status_stop">停用</div><div class="text-muted" style="font-size: 10px;">进入销号阶段</div>';
                }else{
                    html='<div class="status_stop">停用</div><div class="text-muted" style="font-size: 10px;">欠费第'+failNum+'个月</div>';
                }
            }else if(status=='present'){
                if(planFlag=='stop'){
                    html='<div class="">赠送</div><div class="text-muted" style="font-size: 10px;">请求下月1号停用</div>';
                }else if(planFlag=='sysStop'){
                    html='<div class="">赠送</div><div class="text-muted" style="font-size: 10px;">欠费下月1号停用</div>';
                }else{
                    html='<div class="">赠送</div>';
                }
            }else if(status=='verify'){
                html='<div class="status_try">待审核</div><div class="text-muted" style="font-size: 10px;"></div>';
            }else if(status=='unpass'){
                var unpassReason=data.unpassReason;
                html='<div class="status_stop">审核未通过 ('+(unpassReason)+')</div><div class="text-muted" style="font-size: 10px;">第二天释放</div>';
            }
        }
        return html;
    },
















    ////////////////////////---------分割线--------------------/////////////////////////////////
    accountList: function (data, src) {
        //console.log(getCache("line"));
        handler.account.queryAccount({}, $(""));
    },
    addAccount: function (data, src) {
        var action = {
            action: 'manager.account.addAccount',
            data: data
        }
        DS.send(action, function (rep) {
            if (rep.success) {
                $('#add_account_model').modal('hide');
                handler.refreshTableData("query_account_form");
            } else {
                alert("添加帐号失败,请稍后重试!");
            }
        })
    },
    onShownAccountAdd: function () {
        $("#accountInfo_expireTime").datetimepicker({
            format: "yyyy-mm-dd",
            autoclose: true,
            minView: 2,
            pickerPosition: "bottom-left"
        });
    },
    queryAccount: function (data, src) {
        data.page = src.val() || 1;
        data.limit = handler.account.queryPageSize;
        DS.getView("account/account_list_item", function (view) {
            var pane = $("#account_list_pane");
            pane.empty();
            var action = {
                action: "manager.account.queryAccount",
                data: data
            };
            DS.send(action, function (response) {
                if (response.success) {
                    var accountList = response.list;
                    var count = response.count;
                    var html = "";
                    for (var i = 0; i < accountList.length; i++) {
                        var accountListItem = accountList[i];
                        html += DS.renderMethodView(view, accountListItem);
                    }
                    pane.html(html);
                    DS.updatePagination("query_account_form", count, data.limit, data.page);
                } else {
                    alert("查询账户异常！");
                }
            });
        });
    },
    accountQueryData: function (data, src) {
        data.page = src.val() || 1;
        var pane = $('#account_list_pane');
        pane.empty();
        DS.getView('account/account_list_item', function (userListView) {
            var action = {
                action: 'manager.account.queryAccount',
                data: data
            };
            DS.send(action, function (response) {
                if (response.success) {
                    var accountList = response.list;
                    var itemHtml = '';
                    for (var i = 0; i < accountList.length; i++) {
                        var account = accountList[i];
                        itemHtml += DS.renderView(userListView, account);
                    }
                    pane.html(itemHtml);
                }
            });
        });
    },
    /**
     * 控制操作按钮现实
     */
    optionDisplay: function (type, status) {
        if (status == 'tryout') {
            if (type == "setAgentNum" || type == "transformStop" || type == "transformStart") {
                return "hidden";
            }
        } else if (status == "using") {
            if (type == "transformUsing" || type == "transformStart") {
                return "hidden";
            }
        } else if (status == "stop") {
            if (type == "setAgentNum" || type == "transformStop" || type == "transformUsing" || type == "setConcurrentNum") {
                return "hidden";
            }
        }
        return "";
    },
    /**
     * 修改账户信息
     */
    showModifyAccountInfo: function (data, src) {
        DS.getView('account/update_accountInfo', function (view) {
            var pane = $("#account_option_content");
            pane.empty();
            var action = {
                action: "manager.account.queryAccountById",
                data: {_id: data}
            };
            DS.send(action, function (respnse) {
                if (respnse.success) {
                    var account = respnse.data;
                    //console.log(account);
                    var html = DS.renderMethodViewNew(view, account);
                    pane.html(html);
                }
            });
        });
    },
    updateAccountInfo: function (data, src) {
        var action = {
            action: "manager.account.updateAccountInfo",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                //refresh
                handler.refreshTableData("query_account_form");
                var pane = $("#account_option_content");
                pane.empty();
            }
        });
    },
    /**
     * 调整座席数量
     * @param data
     * @param src
     */
    showSetAgentNum: function (data, src) {
        $("body").append("<div id='accountConfigModel' class='modal hide fade' tabindex='-1' role = 'dialog' aria-labelledby='myModalLabel' aria-hidden=true></div>");
        DS.getView('account/account_setAgentNum', function (view) {
            var pane = $("#accountConfigModel");
            pane.empty();
            var action = {
                action: "bill.getAccountBillById",
                data: {_id: data}
            };
            DS.send(action, function (response) {
                if (response.success) {
                    var account = response.account;
                    var billInfo = response.billInfo;
                    var html = DS.renderView(view, account);
                    html = DS.renderView(html, billInfo);

                    pane.html(html);
                    account_setAgentNum();
                    $("#accountConfigModel").modal("show");
                } else {
                    alert("获取账户信息失败！");
                }
            });

        });

    },

    accountSetAgentNum: function (data, src) {
        var action = {
            action: "manager.account.accountSetAgentNum",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                $("#accountConfigModel").modal("hide");
                handler.refreshTableData("query_account_form");
                var pane = $("#account_option_content");
                pane.empty();
            }
        });
    },
    showSetConcurrentNum: function (data, src) {
        $("body").append("<div id='accountConfigModel' class='modal hide fade' tabindex='-1' role = 'dialog' aria-labelledby='myModalLabel' aria-hidden=true></div>");
        DS.getView('account/account_setConcurrentNum', function (view) {
            var pane = $("#accountConfigModel");
            pane.empty();
            var action = {
                action: "manager.account.queryAccountById",
                data: {_id: data}
            };
            DS.send(action, function (response) {
                if (response.success) {
                    var account = response.data;
                    //var billInfo = response.billInfo;
                    var html = DS.renderView(view, account);
                    pane.html(html);
                    $("#accountConfigModel").modal("show");
                } else {
                    alert("获取账户信息失败！");
                }
            });

        });
    },
    accountSetConCurrentNum: function (data, src) {
        var action = {
            action: "manager.account.accountSetCurrentNum",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                $("#accountConfigModel").modal("hide");
                //handler.refreshTableData("query_account_form");
                var pane = $("#account_option_content");
                pane.empty();
            }
        });
    },

    /**
     * 账户转正
     * @param data
     * @param src
     */
    showTransformUsing: function (data, src) {
        $("body").append("<div id='accountConfigModel' class='modal hide fade' tabindex='-1' role = 'dialog' aria-labelledby='myModalLabel' aria-hidden=true></div>");
        DS.getView('account/account_transformUsing', function (view) {
            var pane = $("#accountConfigModel");
            pane.empty();
            var action = {
                action: "bill.getAccountBillById",
                data: {_id: data}
            };
            DS.send(action, function (response) {
                if (response.success) {
                    var account = response.account;
                    var billInfo = response.billInfo;
                    var html = DS.renderView(view, account);
                    html = DS.renderView(html, billInfo);

                    pane.html(html);
                    account_transformUsing();
                    $("#accountConfigModel").modal("show");
                } else {
                    alert("获取账户信息失败！");
                }
            });
        });
    },
    accountTransformUsing: function (data, src) {
        var action = {
            action: "manager.account.transformUsing",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                $("#accountConfigModel").modal("hide");
                handler.refreshTableData("query_account_form");
                var pane = $("#account_option_content");
                pane.empty();
            } else {
                alert(response.message || "发生未知错误！");
            }
        });
    },
    /**
     * 账户停用
     * @param data
     * @param src
     */
    showTransformStop: function (data, src) {
        $("body").append("<div id='accountConfigModel' class='modal hide fade' tabindex='-1' role = 'dialog' aria-labelledby='myModalLabel' aria-hidden=true></div>");
        DS.getView('account/account_transformStop', function (view) {
            var pane = $("#accountConfigModel");
            pane.empty();
            var action = {
                action: "bill.getAccountBillById",
                data: {_id: data}
            };
            DS.send(action, function (response) {
                if (response.success) {
                    var account = response.account;
                    var billInfo = response.billInfo;
                    var html = DS.renderView(view, account);
                    html = DS.renderView(html, billInfo);
                    pane.html(html);
                    $("#accountConfigModel").modal("show");
                } else {
                    alert("获取账户信息失败！");
                }
            });

        });
    },
    accountTransformStop: function (data, src) {
        var action = {
            action: "manager.account.transformStop",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                $("#accountConfigModel").modal("hide");
                handler.refreshTableData("query_account_form");
                var pane = $("#account_option_content");
                pane.empty();
            }
        });
    },
    /**
     * 账户启用
     * @param data
     * @param src
     */
    showTransformStart: function (data, src) {
        $("body").append("<div id='accountConfigModel' class='modal hide fade' tabindex='-1' role = 'dialog' aria-labelledby='myModalLabel' aria-hidden=true></div>");
        DS.getView('account/account_transformStart', function (view) {
            var pane = $("#accountConfigModel");
            pane.empty();
            var action = {
                action: "bill.getAccountBillById",
                data: {_id: data}
            };
            DS.send(action, function (response) {
                if (response.success) {
                    var account = response.account;
                    var billInfo = response.billInfo;
                    var html = DS.renderView(view, account);
                    html = DS.renderView(html, billInfo);
                    pane.html(html);
                    account_transformStart();
                    $("#accountConfigModel").modal("show");
                } else {
                    alert("获取账户信息失败！");
                }
            });

        });
    },
    accountTransformStart: function (data, src) {
        var action = {
            action: "manager.account.transformStart",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                $("#accountConfigModel").modal("hide");
                handler.refreshTableData("query_account_form");
                var pane = $("#account_option_content");
                pane.empty();
            }
        });
    },
    /**
     * 账户运营配置
     * @param data
     * @param src
     */
    showBusinessConfig: function (data, src) {
        DS.getView('account/config_business', function (view) {
            var pane = $("#account_option_content");
            pane.empty();
            var action = {
                action: "manager.account.queryAccountById",
                data: {_id: data}
            };
            DS.send(action, function (respnse) {
                if (respnse.success) {
                    var account = respnse.data;
                    var html = DS.renderMethodView(view, account);
                    pane.html(html);
                }
            });
        });
    },
    /**
     * 查询账户操作日志
     * @param data
     * @param src
     */
    showAccountOperateLog: function (data, src) {
        DS.getView("account/account_operate_log", function (view) {
            var pane = $("#account_option_content");
            pane.empty();
            pane.html(view.replace(/___id/g, data));
            handler.account.queryAccountOperateLog({account: data}, $(""));

        });
    },
    queryAccountOperateLog: function (data, src) {
        data.page = src.val() || 1;
        data.limit = handler.account.queryPageSize;
        DS.getView("account/account_operate_log_list_item", function (view) {
            var pane = $("#account_operate_log_list_pane");
            pane.empty();
            var action = {
                action: "manager.account.queryAccountOperateLog",
                data: data
            };
            DS.send(action, function (response) {
                if (response.success) {
                    var accountList = response.list;
                    var count = response.count;
                    var html = "";
                    for (var i = 0; i < accountList.length; i++) {
                        var accountListItem = accountList[i];
                        if (accountListItem.data) {
                            accountListItem.data = $.toJSON(accountListItem.data);
                        }
                        html += DS.renderMethodView(view, accountListItem);
                    }
                    pane.html(html);
                    DS.updatePagination("query_account_operate_log_form", count, 5, data.page);
                } else {
                    alert("查询账户异常！");
                }
            });
        });
    },
    getAccountOperateInfo: function (action, data) {
        data = $.parseJSON(data);
        if (action == "create") {
            return "创建此账户";
        } else if (action == "transformUsing") {
            return "转正日期【" + data.beginTime + "】，到期时间【" + data.endTime + "】";
        } else if (action == "transformStop") {
            return "账户状态变更为【停用】，到期时间更改为【" + data.endTime + "】";
        } else if (action == "transformStart") {
            return "账户状态变更为【正式】，到期时间更改为【" + data.endTime + "】";
        } else if (action == "setAgentNum") {
            return "座席数量由【" + data.oldAgentNum + "】调整为【" + data.agentNum + "】,到期时间更改为【" + data.endTime + "】";
        } else if (action == "setAgentFee") {
            return "座席单价由【" + data.oldFee + "】调整为【" + data.agentFee + "】,到期时间更改为【" + data.endTime + "】";
        } else if (action == "setBalance") {
            return "座席充值【" + data.agentBalance + "】,到期时间更改为【" + data.endTime + "】";
        } else if (action == "setConcurrentNum") {
            var type = data.concurrentType;
            if (type == 'normal') {
                return "更改并发控制为【座席】"
            } else {
                return "更改并发控制为【自定义】，呼入并发【" + data.callInLimit + "】,外呼并发【" + data.callOutLimit + "】";
            }

        }
    },

    /**==================================account.query==================================**/
    query: {
        payRecode: function () {
            handler.account.query.queryPayRecode({}, $(""))
        },
        queryPayRecode: function (data, src) {
            var formId = "query_account_payRecode_form";
            data.page = src.val() || 1;
            data.limit = handler.account.queryPageSize;
            DS.getView("account/query/payRecode_list_item", function (view) {
                var pane = $("table[for='" + formId + "']").find("tbody");
                pane.empty();
                var action = {
                    action: "manager.account.query.queryPayRecode",
                    data: data
                };
                DS.send(action, function (response) {
                    if (response.success) {
                        var accountList = response.list;
                        var count = response.count;
                        var countInfo = response.countInfo;
                        var html = "";
                        for (var i = 0; i < accountList.length; i++) {
                            var accountListItem = accountList[i];
                            html += DS.renderMethodViewNew(view, accountListItem);
                        }
                        pane.html(html);
                        DS.updatePagination(formId, count, data.limit, data.page);
                        DS.getView("account/query/payRecode_count", function (view) {
                            pane = $("#account_PayRecode_info_content");
                            pane.empty();
                            pane.html(DS.renderMethodViewNew(view, countInfo));
                        });

                    } else {
                        alert("查询账户异常！");
                    }
                });
            });
        },
        smsRecode: function () {
            handler.account.query.querySmsRecode({}, $(""));
        },
        querySmsRecode: function (data, src) {
            var formId = "query_account_smsRecode_form";
            data.page = src.val() || 1;
            data.limit = handler.account.queryPageSize;
            DS.getView("account/query/smsRecode_list_item", function (view) {
                var pane = $("table[for='" + formId + "']").find("tbody");
                pane.empty();
                var action = {
                    action: "manager.account.query.querySmsRecode",
                    data: data
                };
                DS.send(action, function (response) {
                    if (response.success) {
                        var accountList = response.list;
                        var count = response.count;
                        var countInfo = response.countInfo;
                        var html = "";
                        for (var i = 0; i < accountList.length; i++) {
                            var accountListItem = accountList[i];
                            html += DS.renderMethodViewNew(view, accountListItem);
                        }
                        pane.html(html);
                        DS.updatePagination(formId, count, data.limit, data.page);
                        DS.getView("account/query/smsRecode_count", function (view) {
                            pane = $("#account_SmsRecode_info_content");
                            pane.empty();
                            pane.html(DS.renderMethodViewNew(view, countInfo));
                        });

                    } else {
                        alert("查询账户异常！");
                    }
                });
            });
        },
        tel400Recode: function () {
            handler.account.query.queryTel400Recode({}, $(""));
        },
        queryTel400Recode: function (data, src) {
            var formId = "query_account_tel400Recode_form";
            data.page = src.val() || 1;
            data.limit = handler.account.queryPageSize;
            DS.getView("account/query/tel400Recode_list_item", function (view) {
                var pane = $("table[for='" + formId + "']").find("tbody");
                pane.empty();
                var action = {
                    action: "manager.account.query.queryTel400Recode",
                    data: data
                };
                DS.send(action, function (response) {
                    if (response.success) {
                        var accountList = response.list;
                        var count = response.count;
                        var countInfo = response.countInfo;
                        var html = "";
                        for (var i = 0; i < accountList.length; i++) {
                            var accountListItem = accountList[i];
                            html += DS.renderMethodViewNew(view, accountListItem);
                        }
                        pane.html(html);
                        DS.updatePagination(formId, count, data.limit, data.page);
                        DS.getView("account/query/tel400Recode_count", function (view) {
                            pane = $("#account_Tel400Recode_info_content");
                            pane.empty();
                            pane.html(DS.renderMethodViewNew(view, countInfo));
                        });

                    } else {
                        alert("查询账户异常！");
                    }
                });
            });
        },
        exportTel400Recode: function (data, src) {
            var action = {
                action: "manager.account.query.exportTel400Recode",
                data: data
            };
            DS.send(action, function (response) {
                if (response.success) {
                    var path = response.path;
                    DS.downloadFile(path);

                } else {
                    alert(response.message);
                }

            });
        },
        telRecode: function () {
            var now = new Date();
            var nowStr = now.getFullYear()+"-"+((now.getMonth()+1>9)?(now.getMonth()+1):("0"+(now.getMonth()+1)))+"-"+((now.getDay()+1)>9?(now.getDay()+1):("0"+(now.getDay()+1)));
            handler.account.query.queryTelRecode({beginTime:nowStr,endTime:nowStr}, $(""));
        },
        queryTelRecode: function (data, src) {
            var formId = "query_account_telRecode_form";
            data.page = src.val() || 1;
            data.limit = handler.account.queryPageSize;
            DS.getView("account/query/telRecode_list_item", function (view) {
                var pane = $("table[for='" + formId + "']").find("tbody");
                pane.empty();
                var action = {
                    action: "manager.account.query.queryTelRecode",
                    data: data
                };
                DS.send(action, function (response) {
                    if (response.success) {
                        var accountList = response.list;
                        var count = response.count;
                        var countInfo = response.countInfo;
                        var html = "";
                        for (var i = 0; i < accountList.length; i++) {
                            var accountListItem = accountList[i];
                            html += DS.renderMethodViewNew(view, accountListItem);
                        }
                        pane.html(html);
                        DS.updatePagination(formId, count, data.limit, data.page);
                        DS.getView("account/query/telRecode_count", function (view) {
                            pane = $("#account_TelRecode_info_content");
                            pane.empty();
                            pane.html(DS.renderMethodViewNew(view, countInfo));
                        });

                    } else {
                        alert("查询账户异常！");
                    }
                });
            });
        },
        exportTelRecode: function (data, src) {
            var action = {
                action: "manager.account.query.exportTelRecode",
                data: data
            };
            DS.send(action, function (response) {
                if (response.success) {
                    var path = response.path;
                    DS.downloadFile(path);

                } else {
                    alert(response.message);
                }

            });
        }
    }
}