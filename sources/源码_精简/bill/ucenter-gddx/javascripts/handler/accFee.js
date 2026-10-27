handler.accFee={
    pageSize:10,
    showMain:function(){
        var pane=$("#right_pane .account_accFee_container");
        var products=session.account.products||[];
        var zjNum= 0,ccNum= 0,llNum= 0,yyNum=0;
        for (var i = 0; i < products.length; i++) {
            var obj = products[i];
            if(obj.product=='zj'){
                zjNum++;
            }else if(obj.product=='cc'){
                ccNum++;
            }else if(obj.product=='ll'){
                llNum++;
            }else if(obj.product=='yy'){
                yyNum++;
            }
        }
        var command = {zj:zjNum,cc:ccNum,ll:llNum,yy:yyNum};

        for(var key in command) {
            var val = command[key];
            var tab = pane.find(".fee_" + key);
            if (val > 0) {
                tab.show();
            } else {
                tab.remove();
            }
        }
        pane.find('.nav-tabs a:first').click();
    },
    showAccFeeList:function(data,src){
        var pane=$("#right_pane");
        var url='index/fee/month_list';
        if(data=='400'){
            url='index/fee/month_list_400';
        }else if(data=='zj'){
            url='index/fee/zj_month_list';
        }else if(data=='smsCC'){
            url='index/fee/sms_month_list';
        }else if(data=='smsZJ'){
            url='index/fee/sms_month_list';
        }else if(data=='ll'){
            url='index/fee/ll_month_list';
        }else if(data=='yy'){
            url='index/fee/yy_month_list';
        }
        DS.getView(url, function (view) {
            var param={name:data};
            view =DS.renderViewNew(view,param);
            pane.find('#account_accFee_tab_content').html(view);
            handler.accFee.getAccountMonthList(param);
        });
    },
    returnAccFeeList:function(data,src){
        var pane=$("#right_pane .account_accFee_container");
        pane.find('.nav-tabs a[ds_data="'+data+'"]').click();
    },
    getAccountMonthList:function(data,src){
        data=data||{};
        if(src){
            data.page = src.attr("value") || 1;
        }else{
            data.page = 1;
        }
        data.limit=handler.accFee.pageSize;
        var frmId='frm_accFee_search';
        var pane=$("#right_pane");

        var url='index/fee/month_item';
        if(data.name=='400'){
            url='index/fee/month_item_400';
        }else if(data.name=='zj'){
            url='index/fee/zj_month_item';
        }else if(data.name=='smsCC'){
            url='index/fee/sms_month_item';
        }else if(data.name=='smsZJ'){
            url='index/fee/sms_month_item';
        }else if(data.name=='ll'){
            url='index/fee/ll_month_item';
        }else if(data.name == 'yy'){
            url='index/fee/yy_month_item';
        }
        var action={
            action:"app.accFee.getAccountMonthList",
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                var list=rep.list;
                var count=rep.count;
                if (list.length > 0){
                    DS.getView(url, function (view) {
                        var html = [];
                        if(data.name=='smsCC' || data.name=='smsZJ'){
                            for (var i = 0, len = list.length; i < len; i++) {
                                var row = list[i];
                                html.push(DS.renderMethodViewNew(view, row));
                            }
                        }else{
                            for (var i = 0, len = list.length; i < len; i++) {
                                var row = list[i];
                                row.monthRent=row.monthRent||0;
                                var monthRent=row.monthRent||0;
                                row.finalConsume=row.actualConsume>row.minConsume?row.actualConsume:row.minConsume;
                                row.finalConsume+=monthRent;
                                html.push(DS.renderMethodViewNew(view, row));
                            }
                        }
                        pane.find('.month_list').html(html.join(''));

                        // 不是自己的账单，就隐藏掉详情按钮
                        pane.find('.month_list').find("a").each(function(){
                            if($(this).attr('ds_data').indexOf(session.account._id) < 0){
                                $(this).remove();
                            }
                        });

                        if(isHasFunc('query_zj_account_detail')){
                            $(".zj").hide();
                        }else{
                            $(".zj").show();
                        }
                        if(isHasFunc("query_cc_account_detail")){
                            $(".cc").hide();
                        }else{
                            $(".cc").show();
                        }
                        if(isHasFunc("query_400_account_detail")){
                            $(".num400").hide();
                        }else{
                            $(".num400").show();
                        }
                        if(isHasFunc("query_ccSms_account_detail")){
                            $(".ccSms").hide();
                        }else{
                            $(".ccSms").show();
                        }
                        if(isHasFunc("query_ll_account_detail")){
                            $(".ll").hide();
                        }else{
                            $(".ll").show();
                        }



                    });
                } else {
                    var html='<tr><td class="text-center" colspan="10">没有记录!</td></tr>'
                    pane.find('.month_list').html(html);
                }
                pane.find('.result_count').text(count);
                DS.updatePagination(frmId, count, data.limit, data.page);

                if (rep.isFinanceAccount) {
                    setTimeout(function () {
                        $('.companyNameRow').css('display', '');
                    }, 200);
                }
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    },
    _initDetail:function(data,pane,product){
        var agentHtml=getAgentDicByProduct('agents',null,product);
        pane.find('.callsheet_agent').html(agentHtml);
        var startDay=data.year+"-"+data.month+"-01";
        var month=handler.accFee._getMonthDate(startDay);
        pane.find('.ds_date').datepicker({
            minDate:new Date(startDay),
            maxDate:new Date(month.end),
            showButtonPanel: true
        });
    },
    showMonthDetail:function(data,src){
//        var product=data.substring(data.lastIndexOf("_")+1);
        var product=src.attr("ds_attr");
        var url="index/fee/cc_detail_list";
        var actionValue="app.accFee.getMonthFeeById";
        var smsFlag="";
        if(product=='zj'){
            url="index/fee/zj_detail_list";
        }else if(product=='sms'){
            url="index/fee/sms_detail_list";
            actionValue="app.accFee.getSmsMonthFeeById";
            var ary=data.split("_");
            var _p=ary[2];
            if(_p=='zj'){
                smsFlag="smsZJ";
            }else{
                smsFlag="smsCC";
            }
        }else if(product == "cc"){
            url="index/fee/cc_detail_list";
        }else if(product == "ll"){
            actionValue="app.accFee.getllMonthFeeById";
            url="index/fee/ll_detail_list";
        }else if(product == 'yy'){
            actionValue = 'app.accFee.getyyMonthFeeById';
            url='index/fee/yy_detail_list';
        }

        if(product=='ll'){
            var aryll=data.split("_");
            var key=aryll[0];
            var param={monthId:key};
        }else{
            var param={monthId:data};
        }
        var pane=$("#right_pane");
        var action={
            action:actionValue,
            data:param
        }
        DS.send(action,function(rep){
            if(rep.success){
                var row=rep.monthFee;
                if(product != 'sms'&&product != 'll'){
                    row.monthRent=row.monthRent||0;
                    var monthRent=row.monthRent||0;
                    row.finalConsume=row.actualConsume>row.minConsume?row.actualConsume:row.minConsume;
                    row.finalConsume+=monthRent;
                } else if(product=='ll'){
                    row.consume=row.consume;
                }
                DS.getView(url, function (view) {
                    view=view.replace(/_#smsFlag#_/g,smsFlag);
                    view=DS.renderMethodViewNew(view, row);
                    pane.find('#account_accFee_tab_content').html(view);
                    handler.accFee._initDetail(row,pane,product);
                    //handler.accFee.getDetailList(param);
                    if(product=='sms'){
                        handler.accFee.getSmsDetailList(param);
                    }else if(product=='ll'){
                        param={monthId:data};
                        handler.accFee.getllDetailList(param);
                    }else if(product == 'yy'){
                        param={monthId:data};
                        handler.accFee.getyyDetailList(param);
                    }else{
                        handler.accFee.getDetailList(param);
                    }
//                    if(product=='zj'){
//                        handler.accFee.getZjDetailList(param);
//                    }else if(product=='400'){
//                        handler.accFee.get400DetailList(param);
//                    }
                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    getSmsDetailList:function(data,src){
        data=data||{};
        if(src){
            data.page = src.attr("value") || 1;
        }else{
            data.page = 1;
        }
        data.limit=handler.accFee.pageSize;
        var frmId='frm_sms_detail_search';
        var pane=$("#right_pane");
        var action={
            action:"app.accFee.getSmsMonthDetailList",
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                var list=rep.list;
                var count=rep.count;
                if (list.length > 0){
                    DS.getView("index/fee/sms_detail_item", function (view) {
                        var html = [];
                        for (var i = 0, len = list.length; i < len; i++) {
                            var row = list[i];
//                            row.finalConsume=row.actualConsume>row.minConsume?row.actualConsume:row.minConsume;
                            html.push(DS.renderMethodViewNew(view, row));
                        }
                        pane.find('.sms_detail_list').html(html.join(''));
                    });
                } else {
                    var html='<tr><td class="text-center" colspan="10">没有记录!</td></tr>'
                    pane.find('.sms_detail_list').html(html);
                }
                pane.find('.result_count').text(count);
                DS.updatePagination(frmId, count, data.limit, data.page);
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    },
    getllDetailList:function(data,src){
        data=data||{};
        if(src){
            data.page = src.attr("value") || 1;
        }else{
            data.page = 1;
        }
        data.limit=handler.accFee.pageSize;
        var frmId='frm_ll_detail_search';
        var pane=$("#right_pane");
        var action={
            action:"app.accFee.getllMonthDetailList",
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                var list=rep.list||[];
                var count=rep.count;
                if (list.length > 0){
                    DS.getView("index/fee/ll_detail_item", function (view) {
                        var html = [];
                        for (var i = 0, len = list.length; i < len; i++) {
                            var row = list[i];
                            html.push(DS.renderMethodViewNew(view, row));
                        }
                        pane.find('.ll_detail_list').html(html.join(''));
                    });
                } else {
                    var html='<tr><td class="text-center" colspan="10">没有记录!</td></tr>'
                    pane.find('.ll_detail_list').html(html);
                }
                pane.find('.result_count').text(count);
                DS.updatePagination(frmId, count, data.limit, data.page);
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    },
    getyyDetailList:function(data,src){
        console.log('get yy detail list')
        data=data||{};
        if(src){
            data.page = src.attr("value") || 1;
        }else{
            data.page = 1;
        }
        data.limit=handler.accFee.pageSize;
        var frmId='frm_yy_detail_search';
        var pane=$("#right_pane");
        var action={
            action:"app.accFee.getyyMonthDetailList",
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                var list=rep.list||[];
                var count=rep.count;
                if (list.length > 0){
                    DS.getView("index/fee/yy_detail_item", function (view) {
                        var html = [];
                        for (var i = 0, len = list.length; i < len; i++) {
                            var row = list[i];
                            html.push(DS.renderMethodViewNew(view, row));
                        }
                        pane.find('.yy_detail_list').html(html.join(''));
                    });
                } else {
                    var html='<tr><td class="text-center" colspan="10">没有记录!</td></tr>'
                    pane.find('.yy_detail_list').html(html);
                }
                pane.find('.result_count').text(count);
                DS.updatePagination(frmId, count, data.limit, data.page);
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    },
    getDetailList:function(data,src){
        data=data||{};
        if(src){
            data.page = src.attr("value") || 1;
        }else{
            data.page = 1;
        }
        data.limit=handler.accFee.pageSize;
        var frmId='frm_zj_detail_search';
        var pane=$("#right_pane");
        var action={
            action:"app.accFee.getMonthDetailList",
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                var list=rep.list;
                var count=rep.count;
                if (list.length > 0){
                    DS.getView("index/fee/zj_detail_item", function (view) {
                        var html = [];
                        for (var i = 0, len = list.length; i < len; i++) {
                            var row = list[i];
                            if(!row.agentId){
                                row.agentId="";
                            }
//                            row.finalConsume=row.actualConsume>row.minConsume?row.actualConsume:row.minConsume;
                            html.push(DS.renderMethodViewNew(view, row));
                        }
                        pane.find('.zj_detail_list').html(html.join(''));
                    });
                } else {
                    var html='<tr><td class="text-center" colspan="10">没有记录!</td></tr>'
                    pane.find('.zj_detail_list').html(html);
                }
                pane.find('.result_count').text(count);
                DS.updatePagination(frmId, count, data.limit, data.page);
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    },
    /*get400DetailList:function(data,src){
        data=data||{};
        if(src){
            data.page = src.attr("value") || 1;
        }else{
            data.page = 1;
        }
        data.limit=handler.accFee.pageSize;
        var frmId='frm_zj_detail_search';
        var pane=$("#right_pane");
        var action={
            action:"app.accFee.get400MonthDetailList",
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                var list=rep.list;
                var count=rep.count;
                if (list.length > 0){
                    DS.getView("index/fee/zj_detail_item", function (view) {
                        var html = [];
                        for (var i = 0, len = list.length; i < len; i++) {
                            var row = list[i];
                            row.finalConsume=row.actualConsume>row.minConsume?row.actualConsume:row.minConsume;
                            html.push(DS.renderMethodViewNew(view, row));
                        }
                        pane.find('.zj_detail_list').html(html.join(''));
                    });
                } else {
                    var html='<tr><td class="text-center" colspan="10">没有记录!</td></tr>'
                    pane.find('.zj_detail_list').html(html);
                }
                pane.find('.result_count').text(count);
                DS.updatePagination(frmId, count, data.limit, data.page);
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    },*/
    showShortTime:function(time){//2014-07-21 22:45:12
        if(!time)return "";
        var _time=time.substring(time.indexOf("-")+1);
        return _time;
    },
    showFieldDesc:function(type,val){
        var desc='';
        if(type=='call_callType'){
            if(val=='normal'){
                desc='普通来电';
            }else if(val=='dialout'){
                desc='外呼去电';
            }else if(val=='transfer'){
                desc='转接来电';
            }else if(val=='dialTransfer'){
                desc='外呼转接';
            }
        }else if(type.startsWith('agent.')){
            if(val){
                var agent=getCache("agents",val);
                var agentAttr = type.substring(type.indexOf('.')+1,type.length);
                if(agent){
                    desc=agent[agentAttr];
                }else{
                    desc='未知';
                }
            }else{
                desc='未知';
            }
        }else if(type=='isLocal'){
            if(val==true){
                desc='本地';
            }else{
                desc='长途';
            }
        }else if(type=='productType'){
            if(val=="cc"){
                desc='呼叫中心';
            }else if(val=="zj"){
                desc='企业总机';
            }
        }
        return desc;
    },
    showOperatorsResource:function(operators){
        var index=operators.toString().charAt(0);
        var desc='';
        if(index=='1'){
            desc='中国移动';
        }else if(index=='2'){
            desc='中国联通';
        }else if(index=='3'){
            desc='中国电信';
        }

        return desc;
    },
    showRequestStatus:function(status){
        var desc='';
        if(status=="000000"){
            desc='请求发送成功';
        }else{
            desc='请求发送失败';
        }

        return desc;
    },
    showCallLength:function(beginTime,endTime){
        var millis=(beginTime-endTime)/1000;
        var time=formatTime(millis);
        return time;
    },
    reset:function(data,src){
        var frm=src.closest("form");
        frm[0].reset();
    },
    /*listenRecord:function(data){
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
    showDealRecord:function(status,path){
        var html="";
        if(status=='Link'||status=='Voicemail'){
            html='<a href="#" class="ds_do_action alert-link" ds_action="accFee.listenRecord" ds_data="__path">听取录音</a>&nbsp;&nbsp;'+
                '<a href="#" class="ds_do_action" ds_action="accFee.downloadRecord" ds_data="__path">下载录音</a>';
            html=html.replace(/__path/g,path);
        }
        return html;
    },*/
    _getMonthDate:function(startDay){
        var _date = new Date(startDay);
        _date.setMonth(_date.getMonth()+1);
        _date.setDate(0);
        var endDay=getDateDesc(_date);
        return {start:startDay,end:endDay};
    },
    exportDetail:function(data,src){
        handler.batch.removeEmptyFields(data);
        var query=data;
        query.type='cdrDetailExport';
        query.account=session.account._id;
        var action = {
            action: 'app.export.exportXls',
            data: {Method:'exportCdrDetail',Query:query}
        };
        DS.send(action,function(rep){
            if(rep.Succeed){
                DS.downloadFile(rep.path);
            }else{
                $().alertmessage('showError', '导出异常');
            }
        });
    },
    exportMonthList:function(data,src){
        handler.batch.removeEmptyFields(data);
        var query=data;
        query.type='cdrMonthExport';
        query.account=session.account._id;
        var action = {
            action: 'app.export.exportXls',
            data: {Method:'exportCdrMonth',Query:query}
        };
        DS.send(action,function(rep){
            if(rep.Succeed){
                DS.downloadFile(rep.path);
            }else{
                $().alertmessage('showError', '导出异常');
            }
        });
    },
    exportSmsDetail:function(data,src){
        handler.batch.removeEmptyFields(data);
        var query=data;
        query.type='exportSmsDetail';
        query.account=session.account._id;
        var action = {
            action: 'app.export.exportXls',
            data: {Method:'exportSmsDetail',Query:query}
        };
        DS.send(action,function(rep){
            if(rep.Succeed){
                DS.downloadFile(rep.path);
            }else{
                $().alertmessage('showError', '导出异常');
            }
        });
    },
    exportSmsMonthList:function(data,src){
        handler.batch.removeEmptyFields(data);
        var query=data;
        query.type='exportSmsMonthList';
        query.account=session.account._id;
        var action = {
            action: 'app.export.exportXls',
            data: {Method:'exportSmsMonthList',Query:query}
        };
        DS.send(action,function(rep){
            if(rep.Succeed){
                DS.downloadFile(rep.path);
            }else{
                $().alertmessage('showError', '导出异常');
            }
        });
    },
    exportllDetail:function(data,src){
        handler.batch.removeEmptyFields(data);
        var query=data;
        query.type='exportllDetail';
        query.account=session.account._id;
        var action = {
            action: 'app.export.exportXls',
            data: {Method:'exportllDetail',Query:query}
        };
        DS.send(action,function(rep){
            if(rep.Succeed){
                DS.downloadFile(rep.path);
            }else{
                $().alertmessage('showError', '导出异常');
            }
        });
    },
    exportllMonthList:function(data,src){
        handler.batch.removeEmptyFields(data);
        var query=data;
        query.type='exportllMonthList';
        query.account=session.account._id;
        var action = {
            action: 'app.export.exportXls',
            data: {Method:'exportllMonthList',Query:query}
        };
        DS.send(action,function(rep){
            if(rep.Succeed){
                DS.downloadFile(rep.path);
            }else{
                $().alertmessage('showError', '导出异常');
            }
        });
    },

    exportyyDetail:function(data,src){
        handler.batch.removeEmptyFields(data);
        var query=data;
        query.type='exportyyDetail';
        query.account=session.account._id;
        var action = {
            action: 'app.export.exportXls',
            data: {Method:'exportyyDetail',Query:query}
        };
        DS.send(action,function(rep){
            if(rep.Succeed){
                DS.downloadFile(rep.path);
            }else{
                $().alertmessage('showError', '导出异常');
            }
        });
    },
    exportyyMonthList:function(data,src){
        handler.batch.removeEmptyFields(data);
        var query=data;
        query.type='exportyyMonthList';
        query.account=session.account._id;
        var action = {
            action: 'app.export.exportXls',
            data: {Method:'exportyyMonthList',Query:query}
        };
        DS.send(action,function(rep){
            if(rep.Succeed){
                DS.downloadFile(rep.path);
            }else{
                $().alertmessage('showError', '导出异常');
            }
        });
    },
    show400:function(id){
        var ary=id.split("_");
        var num="";
        if(ary.length>=4){
            num= ary[3];
        }
        return num;
    }

}