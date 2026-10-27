handler.call = {
    pane: null,
    paneDetail: null,
    callInfoIndex:null,
    calls: [],
    limit: 20,
    NOcallnum: 0,
    curShowPaneCallId:"",//当前弹屏的id
    queryPageSize: 10,
    currentFlag:"",
    incomingCall: function(id) {
        //if(!this.pane)
        //    this.pane = $("#call_list_"+id).find(".list-inside");
        //if(!this.paneDetail)
        //    this.paneDetail = $("#contact_detail_"+id).find(".content");

        //handler.call.test('035412345678');
        //handler.call.test('0105001');
//        handler.callMail.test();
//        handler.callWeixin.test();
//        handler.webchat.test();
    },
    call: function(callObj) {
        var param={
            cls:'call'
        }
        window.setTimeout(function(){
            popupMsgTip(param);
        },500)
        var pane=$('#main-panel').find(".navbar_top");
        pane.find(".navbar_item>.nav_call").html('<span class="task_pop_tip"></span>');
        dsevent.publish(dsevent.evt.callItemAdd,callObj);
    },
    _checkLimit:function(callId){
        var self = this;
        var length = self.calls.length;
        console.info("callId==="+callId)
        if(!utils.contains(self.calls, callId)){
            self.calls.push(callId);
        }else{
            return -1;
        }
        if (length > self.limit) {
            var current = 0;
            for(var i = 0; i < self.calls.length; i++) {
                if(self.calls[i] !=self.curShowPaneCallId) {
                    current = i;
                    break;
                }
            }
            var element = self.calls.splice(current, 1);
            self.pane.find(".item"+element).remove();
            handler.call.refreshBadge(-1);
        }
        if(length < 1) {
            self.pane.empty();
            self.paneDetail.empty();
        }
    },
    callItemAdd:function(data) {
        //console.dir(data);
        if(!data.ivrkey){
            data.ivrkey="";
        }
        if(!data.queueName){
            data.queueName="";
        }
        if(data.offeringTime){
            var _t=handler.formatShortTime(data.offeringTime);
            data.shortTime=_t.name;
        }else{
            data.shortTime="";
        }
        var self = this;
        var callId = data.callSheetId;
        var result=handler.call._checkLimit(callId);
        if(result==-1){
            return;
        }
        var business = {id : "", callType: "normal", url: ""};
        handler.call.loadUrlAndType(data.queue,business);
        DS.getView('call/call_item', function (view) {
            view = DS.renderMethodViewNew(view, data);
            self.pane.prepend(view);
            DS.getView('call/call_detail', function (detail) {
                detail = DS.renderViewNew(detail, data);
                self.paneDetail.append(detail);
                if(business.callType == 'callUrlIn') {
                    handler.customer.showCallUrlInPopupCust(callId, data.originCallNo, function(){}, business.url, data);
                } else if(business.callType == 'callUrlOut'){
                    handler.customer.showCallUrlOutPopupCust(callId, data.originCallNo, function(){}, business, data);
                } else {
                    handler.call.showPopupCust(callId, data.originCallNo, data.queue,data);
                }
                if(handler.call.curShowPaneCallId == "")
                    self.pane.find(".item"+callId).find(".contact_item").click();
                handler.call.refreshBadge(1);
            });
        });

    },
    showPopupCust: function(callId, phone, queue,callInfo) {
        handler.call.callInfoIndex = callInfo;
        var province=callInfo.callerProvince;
        var city=callInfo.callerCity;
        var action = {
            action: 'app.popup.popupCust',
            data: {phone:phone}
        };
        DS.send(action,function(rep) {
            if(rep.success) {
                var contacts = rep.list;
                var count = rep.count;
                var data = {};
                var paneId=callId+"_popup";
                var bussiness = {id : "", callType: "normal", url: ""};
                handler.call.loadUrlAndType(queue,bussiness);
                var popupId = bussiness.id;
                var call_right=$("#"+paneId);
//                var popupId=rep.popup;
                var _tel=checkEncryptTel(phone);
                if(!contacts || contacts.length == 0) {
                    $("#"+paneId).attr("phone",_tel);
                    $("#"+paneId).attr("province",province);
                    $("#"+paneId).attr("city",city);
                    handler.call.loadCustNoPopInfo(phone,paneId,popupId,province,city);
                } else if(contacts.length == 1) {
                    handler.customer.loadCustInfo(contacts[0]._id,callId,"popup",null,popupId,function(){
                        handler.customer.loadTabUrl(call_right, true, callInfo,contacts[0]._id);
                        call_right.find(".func_tab.active").click();
                    });
                    data = contacts[0];
                } else {
                    handler.call.loadCustMorePopInfo(phone,contacts, paneId, true,popupId,count,province,city);
                }
                data.callId = callId;
                data.notUpdCdr = true;
                dsevent.publish(dsevent.evt.callRefreshCustomer,data);
            }
        });
    },
    loadCustMorePopInfo: function(callNo, contacts, paneId, showLocation, popupId,/*total record*/total,province,city) {
        var  pane =$("#"+paneId).find(".customer_container");
        if(pane.length<=0){
            pane=$("#"+paneId);
        }
        var _tel=checkEncryptTel(callNo);
//        var callId=paneId.split("_")[0];
        DS.getView('call/call_pop_list',function(view){
            pane.empty();
            view = view.replace(/__id/g, paneId).replace(/__phone/g,_tel).replace(/__popupId/g,popupId).replace(/__province/g,province).replace(/__city/g,city);
            pane.html(view);
            var tds = "";
            if(contacts && contacts.length > 0) {
                var param={
                    paneId:paneId,
                    phone:_tel,
                    popupId:popupId
                }
//                ds_data='__id,__name,"+callNo+","+popupId+"'
                var dsAction="call.popLocateSelected";
                tds=handler.call.popupCustMoreData(contacts,param,dsAction);
            }
            if(showLocation){
                pane.find(".location_phone").html("通过号码<span class='phone'>"+checkHideTel(callNo)+"</span> 为您定位到以下客户，请选择:");
                pane.find(".location_phone").css("display","block");
            } else {
                pane.find(".location_phone").css("display","none");
            }
            DS.updatePagination("query_customer_form_"+paneId, total, handler.call.queryPageSize, 1);
            var paneBody = $("#customer_list_pane_"+paneId);
            paneBody.html(tds);
        });
    },
    showCallDetail: function(/*callId*/data) {
        var pane = handler.call.pane;
        var call_left = pane.find(".item"+data);
        call_left.removeClass("contact_item_new");
        handler.call.paneDetail.find(".call_detail").css("display","none");
        var call_right=$("#"+data+"_popup");
        call_right.css("display","block");
        handler.call.curShowPaneCallId = data;
        handler.call.currentFlag = "popup";
        //--hide TaskPopTip--
        var callItems = pane.find(".list_item");
        var hideTaskPopTip = true;
        var call_new_num = callItems.find(".contact_item_new").length;
        if (call_new_num==0) {
            $("#view_nav_call .btn_cdr_call .badge-important").html("");
        } else{
            $("#view_nav_call .btn_cdr_call .badge-important").html(call_new_num);
        }
        for(var i=0;i<callItems.length;i++){
            if($(callItems[i]).find(".item_row").hasClass("contact_item_new")){
                hideTaskPopTip = false;
            }
        }
        if ($("#view_nav_call").css("display")=="block") {
            if(hideTaskPopTip){
                var pane=$('#main-panel').find(".navbar_top");
                pane.find(".navbar_item>.nav_call").html('');
            }
        }
    },
    searchCustomerError: function(data) {
        var call_left = handler.call.pane.find(".item"+data);
        var call_right = $("#"+data+"_popup");
        call_left.find(".customer").html("定位出错");
        call_right.find(".contact_detail_view").html("定位出错");
    },
    callAddCustomer: function(data) {
        var call_left = handler.call.pane.find(".item"+data);
        var call_right = $("#contact_detail_"+data);
        call_left.find(".customer").html("未定位到客户");

    },
    popLocateSelected: function(data) {
//        console.dir(data)
//        var index = data.indexOf(",");
        var params=data.split(",");
        var customerId = params[0];
        var name = params[1];
        var phone = params[2];
        var paneId = params[3];
        var popupId = params[4];
        var arys=paneId.split("_");
        var callId=arys[0],flag=arys[1];

//        var callId = handler.call.curShowPaneCallId;
        handler.customer.loadCustInfo(customerId, callId, flag,null,popupId,function(){
            var call_right=$("#"+paneId);
            var callInfo = handler.call.callInfoIndex ? handler.call.callInfoIndex : '';
            handler.customer.loadTabUrl(call_right,true,callInfo,customerId);
            $("#"+paneId).find(".func_tab.active").click();
        });
        var popData = {};
        popData.callId = callId;
        popData.name = name;
        popData._id = customerId;
        dsevent.publish(dsevent.evt.callRefreshCustomer,popData);
        //console.info("popLocateSelected===="+phone);
        var _param={
            customerId:customerId,
            callId:callId,
            phone:getEncryptTel(phone),
            dealSrc:"popup"
        }
        var action = {
            action: 'app.customer.callLocationCustomer',
            data: _param
        };
        DS.send(action,function(rep) {
            if(rep.success) {
            }else{
//                $().alertmessage('showError', errMsg);
            }
        });
    },
    _initProviceCity:function(pane,proviceDesc,cityDesc){
        if(!proviceDesc)return;
        var p1=pane.find("select[name='province']");
        var p2=pane.find("select[name='city']");
//        var html=generateCCOptions(proviceCityDicKey);
//        p1.html(html);
        var province="";
        p1.find('option').each(function (i) {
            if ($(this).text() == proviceDesc) {
                this.selected = true;
                province=$(this).val();
                return;
            }
        })
        var keys=[];
        if(province){keys=[province]};
        var html2=generateCCOptions(proviceCityDicKey,keys,null,true);
        p2.html(html2);
        p2.find('option').each(function (i) {
            if ($(this).text() == cityDesc) {
                this.selected = true;
                return;
            }
        });
    },

    loadCustAddByTelFirst: function(phone,paneId,provice,city,isDel){
        var pane=$("#"+paneId).find(".customer_container");
        //var tip=pane.find(".cust_tip");
        var ary=paneId.split("_");
        //console.dir(ary);
        var param={
            id:checkHideTel(phone),
            desc:"号码",
            paneId:paneId,
            isDel:isDel,
            flag:'relocationCall',
            CALL_SHEET_ID:ary[0]
        }
        //if(isDel){
        //    tip.html(template("tmpl_popup_one_customer_del",param));
        //}else{
        pane.html(template("tmpl_cdr_popup_one_customer",param));
        //}
        pane.show();
        //handler.call.loadCustNoPopInfo(phone,paneId,null,provice,city,true);
    },
    loadLeakCustAddByTelFirst: function(phone,paneId,provice,city,isDel){
        var pane=$("#"+paneId).find(".customer_container");
        //var tip=pane.find(".cust_tip");
        var ary=paneId.split("_");
        //console.dir(ary);
        var param={
            id:checkHideTel(phone),
            desc:"号码",
            paneId:paneId,
            isDel:isDel,
            flag:'sheetLeak',
            CALL_SHEET_ID:ary[0]
        }
        //if(isDel){
        //    tip.html(template("tmpl_popup_one_customer_del",param));
        //}else{
        pane.html(template("tmpl_sheet_leak_popup_one_customer",param));
        //}
        pane.show();
        //handler.call.loadCustNoPopInfo(phone,paneId,null,provice,city,true);
    },
    loadCustMultiByTel: function(phone,paneId,provice,city){
        var pane=$("#"+paneId).find(".customer_container");
        var ary=paneId.split("_");
        var param={
            id:checkHideTel(phone),
            desc:"号码",
            paneId:paneId,
            flag:'relocationCall',
            CALL_SHEET_ID:ary[0]
        }
        pane.html(template("tmpl_cdr_popup_more_customer",param));
        pane.show();
        //handler.call.loadCustNoPopInfo(phone,paneId,null,provice,city,true);
    },
    loadCustLeakMultiByTel: function(phone,paneId,data,city){
        var pane=$("#"+paneId).find(".customer_container");
        var ary=paneId.split("_");
        var param={
            id:checkHideTel(phone),
            desc:"号码",
            paneId:paneId,
            flag:'sheetLeak',
            CALL_SHEET_ID:ary[0]
        }
        pane.html(template("tmpl_sheet_leak_popup_more_customer",param));
        pane.show();
        //handler.call.loadCustNoPopInfo(phone,paneId,null,provice,city,true);
    },
    loadCustNoPopInfo: function(callNo,paneId,popupId,provice,city,isHidden) {
        var pane=$("#"+paneId).find(".customer_container .cust_body");
        if(pane.length<=0){
            pane=$("#"+paneId).find(".customer_container");
            if(pane.length<=0){
                pane=$("#"+paneId);
            }
        }
        var callId=paneId.split("_")[0];
        var dealSrc=paneId.split("_")[1];
//        console.info("callId====="+callId+" paneId=="+paneId);
        DS.getView('customer/customer_add',function(view){
            var _tel=checkEncryptTel(callNo);
            view=view.replace(/_#menu#_/g,paneId).replace(/_#callNo#_/g,_tel).replace(/_#dealSrc#_/g,dealSrc);
            pane.html(view);
            pane.find(".btn_cust_black").show();//add black list
            pane.find(".select_old_cust").show();
            if(popupId){
                pane.find("input[name='popupId']").val(popupId);
            }
            var o=pane.find("#icc_add_customer_dbType");
            var tmpls=getCache('custTmpls');
            if(tmpls && tmpls.length>0){
                var dbType=tmpls[0]._id;
                o.val(dbType);
                handler.customer.loadCustAddTmpl(dbType,pane);
                handler.call._initProviceCity(pane,provice,city);
                pane.find(".btn_cancel_edit").remove();
//                pane.find(".btn_cancel_edit").click(function(){
//                    dsevent.publish(dsevent.evt.customerAddCancelPop, callId);
//                });
                var telDesc=checkHideTel(callNo,pane.find('input[name="tel[]"]'));
                pane.find('input[name="tel[]"]').val(telDesc);

                if(session.account.autoSave && pane.find(".btn_autoSave").length>0){
                    console.info("session.account.autoSave==="+session.account.autoSave);
                    //自动保存去掉必填验证
                    pane.find(":input").removeAttr("required");
                    pane.find(".btn_autoSave").click();
                }
                if(isHidden){
                    pane.hide();
                }
            }
        });
    },
    customerAddCancelPop: function(callId) {
        var pane = $("#"+callId+"_popup");
        var index = handler.call.calls.length - 1;
//        if(handler.call.curShowPaneCallId != handler.call.calls[index]) {
//            $(".item"+handler.call.calls[index]).find(".contact_item").click();
//        } else {
//            $(".item"+handler.call.calls[index]).removeClass("expanded");
//            pane.css("display", "none");
//
//        }
        if(handler.call.curShowPaneCallId != "") {
            $(".item" + handler.call.curShowPaneCallId).removeClass("expanded");
            pane.css("display", "none");
        }
    },
    showToLocate: function(callNo,callId) {
        var pane = $("#"+callId+"_popup");
        DS.getView('call/show_to_locate',function(view){
            pane.empty();
            view = view.replace(/__phone/g,callNo).replace(/__callId/g,callId);
            pane.html(view);
        });
    },
    customerAdd: function(data) {
//        console.info("customerAdd==========");
//        console.dir(data)
        var callId = handler.call.curShowPaneCallId;
        var flag=handler.call.currentFlag;
        if(data.callId!=callId && session.account.autoSave){//for autoSave
            callId=data.callId;
        }
        if(!callId)return;
        if(flag == "popupMail"){
            handler.customer.loadCustInfo(data._id, callId, "popupMail",null,data.popupId);
        }else if(flag == "popupWeixin"){
            handler.customer.loadCustInfo(data._id, callId, "popupWeixin",null,data.popupId);
        }else if(flag == "popupWebchat"){
            handler.customer.loadCustInfo(data._id, callId, "popupWebchat",null,data.popupId);
        }else{
            if(data.phone[0] && $("#"+callId+"_popup").attr("phone") != data.phone[0].tel) {
                return;
            }
            handler.customer.loadCustInfo(data._id, callId, "popup",null,data.popupId);
        }
        data.callId = callId;
        dsevent.publish(dsevent.evt.callRefreshCustomer,data);
    },
    addCustomer: function(data) {
        var params=data.split(",");
        var phone=params[0];
        var paneId=params[1];
        var province=params[2];
        var city=params[3];
        handler.call.loadCustNoPopInfo(getEncryptTel(phone),paneId,null,province,city);
        $("#"+paneId).attr("phone",phone);
    },
    locateCustomer: function(data) {
        var index = data.indexOf(",");
        var phone = data.substr(0, index);
        var callId = data.substr(index + 1);
        handler.call.loadCustMorePopInfo(phone, [], callId, false)
    },
    callRefreshCustomer: function(data) {
//        console.info("callRefreshCustomer==========");
//        console.dir(data);
        var name = "未知客户";
        if (data.name != undefined) {
            name = data.name;
        }
        var pane = $(".item" + data.callId);
        pane.attr("customerId", data._id);
        pane.find(".customer").html(name);

//        var notUpdCdr = data.notUpdCdr || false;
//        if(!notUpdCdr) {
//            handler.call.updateCdr(data.callId, data._id);
//        }
    },
    customerUpdate: function(data) {
        var callId = handler.call.curShowPaneCallId;
        if($(".item"+callId).attr("customerid") != data._id) {
            return;
        }
        data.callId = callId;
        dsevent.publish(dsevent.evt.callRefreshCustomer,data);
    },
    gotoIncomingPage: function(data) {
        var pane=$("#main-panel");
        //gong zuo tai
        //var callMenu=pane.find(".navbar_top a[id='nav_workbench']");
        //callMenu.click();
        //-----
        var callMenu=pane.find(".navbar_top a[id='nav_call']");
        callMenu.click();
        var pane=$("#contact_list_cdr");
        pane.find(".btn_cdr_call").click();
//        handler.selectPage('call', 'incoming_call', 'call/incomingCall');
//        $(".main_header .call_pop").css('display','none');
    },
    queryPopupCustomer: function(data,src) {
        var pane=$("#"+data.callId);
        if(data.callId.indexOf("customerLeak")!=-1){
            pane=$("#my_call_sheet_leak_customerLeak");
        }else if(data.callId.indexOf("callLocation")!=-1){
            pane=$("#show_cdr_location_cust_Modal");
        }

        var page=1;
        if(src && !src.hasClass("ds_do_action"))page=src.val();
        if(!page)page=1;
        data.page=page;
        data.limit=handler.call.queryPageSize;

        if(!$.trim(data.combox)){
            $().alertmessage('showError', "查询条件不能为空");
            return;
        }

        var action = {
            action: 'app.customer.queryPopupCustomer',
            data: data
        };
        DS.send(action,function(rep) {
            if(rep.success) {
                var contacts = rep.list;
                var count = rep.count;
                var tds = "";
                if(contacts && contacts.length > 0) {
                    var param={
                        paneId:data.callId,
                        phone:data.phone,
                        popupId:data.popupId
                    }
                    var dsAction="call.popLocateDial";
                    if(data.callId.indexOf("popupMail")!=-1){
                        dsAction="callMail.popLocateSelected";
                    }else if(data.callId.indexOf("popupWeixin")!=-1){
                        dsAction="callWeixin.popLocateSelected";
                    }
                    tds=handler.call.popupCustMoreData(contacts,param,dsAction);
                }else{
                    tds="<tr><td colspan='5' style='text-align: center;'>未匹配到客户</td></tr>";
                }

                DS.updatePagination("query_customer_form_"+data.callId, count, data.limit, data.page);
                var paneBody = pane.find("#customer_list_pane_"+data.callId);
//                pane.find(".location_phone").css("display","none");
                paneBody.html(tds);
            }
        });
    },
    updateCdr: function(callId, customerId) {
        var data = { CALL_SHEET_ID : callId, customerId : customerId};
        var action = {
            action : 'app.callSheet.cdrLocationCustomer',
            data : data
        };
        DS.send(action,function(rep) {
        });
    },
    callItemRinged: function(obj) {
//        var call_left = $(".item"+obj.callId);
//        call_left.removeClass("contact_item_new");
    },
    my_call_bill: function(id) {
        var callBillTypes = getCache("callRecordTmpls") || [];
        var callBillObj = $("#my_recordBill_type").find("select");
        callBillObj.append("<option value=''>--请选择--</option>");
        for(var i=0;i<callBillTypes.length;i++){
            callBillObj.append("<option value="+callBillTypes[i]._id+">"+callBillTypes[i].name+"</option>");
        }

        $('#my_call_bill_query_link').trigger('click');
    },
    all_call_bill: function(id) {
        var callBillTypes = getCache("callRecordTmpls") || [];
        var callBillObj = $("#all_recordBill_type").find("select");
        callBillObj.append("<option value=''>--请选择--</option>");
        for(var i=0;i<callBillTypes.length;i++){
            callBillObj.append("<option value="+callBillTypes[i]._id+">"+callBillTypes[i].name+"</option>");
        }

        $('#all_call_bill_query_link').trigger('click');
    },
    resetForm: function(data, src){
        resetForm(data,src);
    },
    searchAllCallBill:function(data,src){
        var data = utils.getSearchCondition(data);
        data.dataId = "all_call_bill_query_main_panel";
        data.dataFormId = "all_call_bill_query_form";
        if (!handler.call.validateConditionAll(data)) {
            return false;
        }
        handler.call.searchCallBill(data, src);
    },
    searchMyCallBill: function (data, src) {
        data.creator = session.user._id;
        data.dataId = "my_call_bill_query_main_panel";
        data.dataFormId = "my_call_bill_query_form";
        var data = utils.getSearchCondition(data);
        if (!handler.call.validateCondition(data)) {
            return false;
        }
        handler.call.searchCallBill(data, src);
    },
    validateConditionAll : function(data){
        var dateReg = /^\d{4}-\d{2}-\d{2}$/;
        if (data.BEGIN_DATE && !dateReg.test(data.BEGIN_DATE)){
            alert('请正确选择开始日期');
            $('#all_call_bill_datetime_picker_start').focus();
            return false;
        }
        var timeReg = /^\d{2}:\d{2}:\d{2}$/;
        if (data.BEGIN_TIME && !timeReg.test(data.BEGIN_TIME)){
            $('#all_call_bill_begin_time').focus();
            alert('请正确填写开始时间');
            return false;
        }
        if (data.END_DATE && !dateReg.test(data.END_DATE)){
            $('#all_call_bill_datetime_picker_end').focus();
            alert('请正确选择结束日期');
            return false;
        }
        if (data.END_TIME && !timeReg.test(data.END_TIME)){
            $('#all_call_bill_end_time').focus();
            alert('请正确填写结束时间');
            return false;
        }

        return true;
    },
    validateCondition: function(data) {
        var dateReg = /^\d{4}-\d{2}-\d{2}$/;
        if (data.BEGIN_DATE && !dateReg.test(data.BEGIN_DATE)){
            alert('请正确选择开始日期');
            $('#my_call_bill_datetime_picker_start').focus();
            return false;
        }
        var timeReg = /^\d{2}:\d{2}:\d{2}$/;
        if (data.BEGIN_TIME && !timeReg.test(data.BEGIN_TIME)){
            $('#call_bill_begin_time').focus();
            alert('请正确填写开始时间');
            return false;
        }
        if (data.END_DATE && !dateReg.test(data.END_DATE)){
            $('#my_call_bill_datetime_picker_end').focus();
            alert('请正确选择结束日期');
            return false;
        }
        if (data.END_TIME && !timeReg.test(data.END_TIME)){
            $('#call_bill_end_time').focus();
            alert('请正确填写结束时间');
            return false;
        }

        return true;
    },
    parseSearchDate: function(data){
        var beginTime = null, endTime = null;
        if(data.BEGIN_DATE){
            if(data.BEGIN_TIME){
                beginTime = data.BEGIN_DATE + ' ' + data.BEGIN_TIME;
            } else {
                beginTime = data.BEGIN_DATE;
            }
        }
        delete data.BEGIN_TIME;
        delete data.BEGIN_DATE;
        if(beginTime) {
            data.beginTime = beginTime;
        }
        if(data.END_DATE) {
            if(data.END_TIME) {
                endTime = data.END_DATE + ' ' + data.END_TIME;
            } else {
                endTime = data.END_DATE + ' 23:59:59';
            }
        }
        delete data.END_TIME;
        delete data.END_DATE;
        if(endTime) {
            data.endTime = endTime;
        }
    },
    getCallBillType : function(type){
        var callBillObj = getCache("callRecordTmpls",type);
        if(callBillObj){
            return callBillObj.name;
        }
        return "";
    },
    getCallBillCustomType : function(dbtype,type){
        var callBillObj = getCache("callRecordTmpls",dbtype);
        if(callBillObj){
            var types = callBillObj.types ||[];
            for(var i=0;i<types.length;i++){
                if(type == types[i].key){
                    return types[i].name;
                }
            }
            return "";
        }
        return "";
    },
    getAgentName : function(agentId){
        var agent = getCache("agents",agentId);
        if(agent){
            return agent.displayName;
        }
        return "";
    },
    searchCallBill: function (data, src) {
        data.pageSize = handler.call.queryPageSize;
        data.page = src.val() || 1;
        handler.call.parseSearchDate(data);
        var dataId = data.dataId;
        delete  data.dataId;
        var dataFormId = data.dataFormId;
        delete data.dataFormId;
        var action = {
            action: "app.callBill.queryMyCallBill",
            data: data
        }
        DS.send(action, function (res) {
            if (res.success) {
                var list = res.list;
//                console.dir(list);
                if (list.length > 0) {
                    DS.getView('call/call_bill_item',function (view){
                        var html = [];
                        var item ;
                        for (var i = 0, len = list.length; i < len; i++) {
                            item = list[i];
                            html.push(DS.renderMethodViewNew(view, item));
                        }
                        $('#'+dataId + ' .call_sheet_table_data').html(html.join(''));
                    });
                } else {
                    $('#'+dataId + ' .call_sheet_table_data').html('');
                }
                DS.updatePagination(dataFormId, res.count, handler.call.queryPageSize, data.page);
            } else {
                alert('查询失败，请重新查询');
            }
        });
    },
    exportMyCallBill : function(data,src){
        data.creator = session.user._id;
        var data = utils.getSearchCondition(data);
        if (!handler.call.validateCondition(data)) {
            return false;
        }
        handler.call.exportCallBill(data, src);
    },
    exportAllCallBill : function(data,src){
        var data = utils.getSearchCondition(data);
        if (!handler.call.validateConditionAll(data)){
            return false;
        }
        handler.call.exportCallBill(data, src);
    },
    exportCallBill : function(data,src){
        if(!data.dbType){
            $().alertmessage('showError', "请选择登记单类别");
            return;
        }
        data.accountId = session.user.account;
//        data.dataDB = session.account.dataDB;
//        data.user = session.user._id;
        handler.call.parseSearchDate(data);
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'exportCallRecord',Query:data}
        };
        DS.send(action,function(rep) {
            if(rep.Succeed){
                downloadFile(rep.path);
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    downloadMyCallBillRecord : function(data,src){
        data.creator = session.user._id;
        var data = utils.getSearchCondition(data);
        if (!handler.call.validateCondition(data)) {
            return false;
        }
        handler.call.downloadCallBillRecord(data, src);
    },
    downloadAllCallBillRecord : function(data,src){
        var data = utils.getSearchCondition(data);
        if (!handler.call.validateConditionAll(data)){
            return false;
        }
        handler.call.downloadCallBillRecord(data,src);
    },
    downloadCallBillRecord : function(data,src){
        data.countLimit = 1000;
        handler.call.parseSearchDate(data);
        var  action= {
            action : "app.callBill.downloadRecord",
            data :data
        };
        DS.send(action,function(response){
            if(response.success){
                downloadFile(response.path,true);
            } else {
                if(response.message == "001"){
                    $().alertmessage('showError', "录音下载限制为每次最大"+data.countLimit+"条，本地下载条数为【"+response.count + "】，请修改您的查询条件！");
                } else {
                    $().alertmessage('showError', "下载录音异常！");
                }
            }
        });
    },
    loadUrlAndType: function(queue, business) {
        var ququeId = queue;
        var queues = getCache('AllPbxQueues');
        var businessType = "business";
        for(var i = 0; i < queues.length; i++) {
            if(queues[i].Exten == ququeId) {
                if(queues[i].BussinessTypeId && queues[i].BussinessTypeId != "") {
                    if(queues[i].BussinessTypeId.indexOf("callUrls_") != -1) {
                        businessType = "callUrls";
                    }
                    business.id = queues[i].BussinessTypeId.substr(businessType.length + 1, queues[i].BussinessTypeId.length);
                }
            }
        }
        if(businessType == "callUrls") {
            var callUrl = getCache('callUrls', business.id);
            if(callUrl != null) {
                if(callUrl.type == '1') {
                    business.callType = "callUrlIn";
                } else if(callUrl.type == '2') {
                    business.callType = "callUrlOut";
                    if(callUrl.outOpenType){
                        business.outOpenType = callUrl.outOpenType;
                    }
                }
                business.url = callUrl.url;
                if(business.callType == 'callUrlIn') {
//                var right = $(".right-column .right-column-save-pane");
                    var right = $(".right-column");
                    right.empty();
                    right.css("overflow-y", "hidden");
                    right.html("<div style='background-color: #fff;width: 100%;height:100%' id=\"call_detail_pane\"></div>");
                }
            }else{
                //如果配置的弹屏对接，已被删除。还弹业务
                business.callType = "business";
                business.id = "";
            }
        }
    },

    popLocateCust: function(data,src) {//弹屏未定位到客户进行选择
        //console.dir(data)
        var params=data.split(",");
        //合并用户选择
        if(params[2] != "mergeCustomerA" && params[2] != "mergeCustomerB"){
            if(!confirm('确认要关联该客户吗？'))return;
        }
        var isOld=src.attr("ds_attr");//select_old 是选择老的客户
        var params=data.split(",");
        var customerId = params[0];
        var name = params[1];
        var popupId = params[2];
        var dbType = params[3];
        var callTel = params[4];
        var sid = params[5];
//        var arys=popupId.split("_");
        var idx=popupId.lastIndexOf("_");
        var callId=popupId.substring(0,idx);
        var flag =popupId.substring(idx+1)||'popup';
        console.info("popLocateCust::flag======"+flag+",callId=="+callId);
        if(flag=='callLocation'){
            callTel=getEncryptTel(callTel);
            var info=customerId+","+callId+","+callTel;
            handler.customer.locationCustomer(info,null,isOld);
        }else if(flag=='popup'){
            //        console.info(callId+" "+dbType+" "+phone+" "+customerId);
            handler.call.loadPopupCustUpdate(flag,customerId, dbType,callId,function(){
                var pane=$("#show_popup_location_cust_Modal");
                pane.modal("hide");
            });
        }else if(flag=='dialPopup'){
            handler.call.loadPopupCustUpdate(flag,customerId, dbType,callId,function(){
                var pane=$("#show_popup_location_cust_Modal");
                pane.modal("hide");
            });
        }else if(flag=='popupMail'||flag=='popupWeixin'||flag=='relocationMail'||flag=="relocationWeixin") {
            handler.call.loadPopupCustUpdate(flag, customerId, dbType, callId, function () {
                var pane = $("#show_popup_location_cust_Modal");
                pane.modal("hide");
            });
        }else if(flag=="relocationCall"||flag=="sheetLeak") {
            var call_right=$("#"+popupId);
            console.info("popupId======="+popupId);
            //console.dir(call_right);
            var cdrInfo=call_right.data("cdrInfo");
            var phone=cdrInfo.phone;
            //console.dir(cdrInfo)
            var _tel=getEncryptTel(phone);
            handler.customer.loadCustInfo(customerId,callId,flag,null,null,function(rep){
                handler.customer.loadTabUrl(call_right, false, '', customerId);
                var tels=rep.phone||[];
                var num=0;
                for (var i = 0; i < tels.length; i++) {
                    var obj = tels[i];
                    if(obj.tel==_tel){
                        num++;
                        break;
                    }
                }
                if(num==0){
                    tels.push({tel:_tel,memo:""});
                }else{
                    tels=[];
                }
                if(flag=="sheetLeak"){
                    sheetLeakcallId=cdrInfo.newcallsheetid;;
                    cdrInfo.callId=sheetLeakcallId;
                }
                var _param={
                    customerId:rep._id,
                    callId:cdrInfo.callId,
                    custName:rep.name,
                    phone:tels
                }
                //console.dir(_param)
                var action = {
                    action: 'app.callSheet.locationCustomer',
                    data: _param
                };
                DS.send(action,function(rep) {});

                call_right.find(".func_tab.active").click();
                var pane = $("#show_popup_location_cust_Modal");
                pane.modal("hide");
                //_param.paneId=popupId;
                dsevent.publish(dsevent.evt.callRefreshCustomer,_param);
            });
        }else if(flag=='popupWebchat'|| flag=='relocationWebchat'){
            var call_right=$("#"+popupId);
            var itemDiv = $("#view_webchat_todo").find(".item"+callId);
            itemDiv.attr("cust_id",customerId);
            handler.customer.loadCustInfo(customerId,callId,flag,null,null,function(rep){
                handler.customer.loadTabUrl(call_right, false, '', customerId,sid);
                var _param={
                    customerId:rep._id,
                    callId:callId,
                    custName:rep.name
                }

                var action = {
                    action: 'app.webchat.locationCustomer',
                    data: _param
                };
                DS.send(action,function(rep) {});
                //$('#view_webchat_todo').find('div[ds_data="'+callId+'"]').click();
                call_right.find(".func_tab.active").click();
                if(flag=='relocationWebchat'){
                    var con = $('#view_webchat_all');
                }else{
                    var con = $('#view_webchat_todo');
                }
                var card_pane = con.find('.item'+callId);      //更改在线咨询左侧卡片上的信息
                var old_title = card_pane.find('.card_row_title').text();
                card_pane.find('.card_row_title').text(_param.custName);
                var ood_fromSoce = card_pane.find('.card_row_from_title').text();
                var new_fromSoce = ood_fromSoce.split(')')[0];
                new_fromSoce += old_title+")";
                card_pane.find('.card_row_from_title').text(new_fromSoce);
                var pane = $(".modal");
                pane.modal("hide");
            });
        }else if(flag == 'popupEmail' || flag == 'relocationEmail'){
            var call_right=$("#"+popupId);
            handler.customer.loadCustInfo(customerId,callId,flag,null,null,function(rep){
                var _param={
                    customerId:rep._id,
                    callId:callId,
                    custName:rep.name
                }

                var action = {
                    action: 'app.email.locationCustomer',
                    data: _param
                };
                DS.send(action,function(rep) {});

                call_right.find(".func_tab.active").click();
                var pane = $("#show_popup_location_cust_Modal");

                var email = $('.item'+_param.callId).attr('ds_attr');   //更改邮件左侧卡片上的信息
                var card_pane = $('#view_email_todo').find('div[ds_attr="'+email+'"]');
                for(var i=0;i<card_pane.length;i++){
                    $(card_pane[i]).find('.custom_name_field_b').html(_param.custName);
                }
                pane.modal("hide");
            });
        }else if (popupId == "mergeCustomerA" || popupId == "mergeCustomerB"){
            handler.customer.selectMergeCustomer(customerId,popupId);
        }
//        handler.customer.loadCustInfo(customerId, callId, "popup",null,null);
    },
    _getPayFlag:function(key){
        var params=key.split("_");
        var callId = params[0];
        var flag = params[1];
        return flag;
    },
    showSelectCust:function(data,src){
        var flag = handler.call._getPayFlag(data);
        var callTel=src.attr("ds_attr")||'';
        var pane=$("#show_popup_location_cust_Modal");
        if(flag=='callLocation'){
            pane=$("#show_cdr_location_cust_Modal");
        }
        var param={_id:data,callTel:callTel};
        DS.getView('call/show_selectCustomer',function(view){
            view=DS.renderViewNew(view,param);
            var body=pane.find(".modal-body");
            body.html(view);
            DS.updatePagination("popup_query_customer_form_"+data, 0,10, 1);
            pane.modal();
        });
    },
    querySelectCust: function(data,src) {
//        console.dir(data)
        var paneId=data.callId;

//        var pane=$("#"+data.callId);
        //var newCallSheetId="";
        var idx=paneId.lastIndexOf("_");
        var _id =paneId.substring(0,idx);
        // if(flag=="sheetLeak"){
        //     var cdrInfo=$("#"+paneId).data("cdrInfo");
        //     newCallSheetId=cdrInfo.newcallsheetid
        // }
        var modal=$("#show_popup_location_cust_Modal");
        var flag = handler.call._getPayFlag(paneId);
        if(flag=='callLocation'){
            modal=$("#show_cdr_location_cust_Modal");
        }
        var page=1;
        if(src && !src.hasClass("ds_do_action"))page=src.val();
        if(!page)page=1;
        data.page=page;
        data.limit=handler.call.queryPageSize;

        if(!$.trim(data.combox)){
            $().alertmessage('showError', "查询条件不能为空");
            return;
        }
        if(data.field=='phone' && data.combox.indexOf("****")!=-1){
            data.callTel=getEncryptTel(data.callTel);
            data.combox=data.callTel;
        }
        //合并客户
        if(data.callId == "mergeCustomerA" || data.callId == "mergeCustomerB"){
            data.mergeFlag = true;
        }
        //

        var action = {
            action: 'app.popup.queryCustomerByPopup',
            data: data
        };
        DS.send(action,function(rep) {
            if(rep.success) {
                var contacts = rep.list;
                var count = rep.count;
                var tds = "";
                var newCallSheetId="";
                // var idx=paneId.lastIndexOf("_");
                // var flag =paneId.substring(idx+1);
                // if(flag=="sheetLeak"){
                //     var cdrInfo=$("#"+paneId).data("cdrInfo");
                //     newCallSheetId=cdrInfo.newcallsheetid
                // }
//                if(contacts && contacts.length > 0) {
//                    var param={
//                        paneId:data.callId,
//                        phone:data.phone,
//                        popupId:data.popupId
//                    }
////                    ds_data='__id,__name,"+data.callId+",__dbType,"+data.callTel+"'
//                    var dsAction="call.popLocateCust";
//                    tds=handler.call.popupCustMoreData(contacts,param,dsAction);
//                }
                if(contacts && contacts.length > 0) {
                    var sid = $('.list_container').find('div[ds_data="'+_id+'"]').attr('ds_attr')
                        +"__"+$('.list_container').find('div[ds_data="'+_id+'"]').attr('ds_sname');
                    var tdModel = "<tr><td><button type='button' class='btn btn-info btn-small ds_do_action' ds_attr='select_old' ds_data='__id,__name,"+data.callId+",__dbType,"+data.callTel+","+sid+"' ds_action='call.popLocateCust'>选定</button></td>" +
                        "<td>__name</td><td>__phoneList</td><td>__emailList</td></tr>";
                    for(var i=0;i<contacts.length;i++){
                        var item=contacts[i];
                        var phone=item.phone||[];
                        var phoneList="";
                        for (var j = 0; j < phone.length; j++) {
                            var _tel = phone[j].tel;
                            phoneList+=checkHideTel(_tel)+" ";
                        }
                        var emails=item.email||[];
                        var emailList="";
                        for (var j = 0; j < emails.length; j++) {
                            var _email = emails[j].email;
                            emailList+=_email+" ";
                        }
                        var td = tdModel.replace(/__id/g, item._id).replace(/__dbType/g,item.dbType)
                            .replace(/__name/g, item.name).replace(/__phoneList/g, phoneList)
                            .replace(/__emailList/g, emailList);
                        tds += td;
                    }
                }else{
                    tds="<tr><td colspan='5' style='text-align: center;'>未匹配到客户</td></tr>";
                }
                DS.updatePagination("popup_query_customer_form_"+paneId, count, data.limit, data.page);
                var paneBody = modal.find("#popup_customer_list_pane_"+paneId);
                paneBody.html(tds);
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    loadPopupCustUpdate:function(flag,cid,dbType,menu,callback){
//        var paneId=menu+"_popup";
        var paneId=menu+"_"+flag;
        if(flag=='customerLeak'){
            paneId="my_call_sheet_leak_customerLeak";
        }
        var container=$("#"+paneId);
        var phone=container.attr("phone");
        //phone=getEncryptTel(phone);
        var province=container.attr("province")||"";
        var city=container.attr("city")||"";
        //if(flag=='popupMail'||flag=='popupWeixin'||flag=='relocationMail'||flag=="relocationCall"||flag=="relocationWeixin"||flag=='popupWebchat'|| flag=='relocationWebchat'){
        var _c=container.find(".customer_container .cust_body");
        if(_c.length<=0){
            container =container.find(".customer_container");
        }else{
            container =_c;
        }
        //}
        DS.getView('customer/customer_update_popup',function(view){
            container.empty();
            view=view.replace(/_#id#_/g,cid).replace(/_#menu#_/g,menu).replace(/_#flag#_/g,flag);
            container.html(view);
            container.find(".dbType").text(getCache('custTmpls',dbType).name);

            container.find(".btn_cancel_edit").click(function(){//return add
                if(flag=='customerLeak'){
                    handler.cdr.loadCallLeakCustNoPopInfo(phone,menu);
                }else if(flag=='popupMail'||flag=='relocationMail'){
                    handler.callMail.loadCustAddByMail(phone,paneId);
                }else if(flag=='popupWeixin'||flag=="relocationWeixin"){
                    handler.callWeixin.loadCustAddByWeixin(phone,paneId);
                }else if(flag=='popupWebchat'|| flag=='relocationWebchat') {
                    handler.webchat.loadCustAddByWebchat(phone, paneId);
                }else if(flag=='dialPopup'){
                    var _phone=getEncryptTel(phone);
                    handler.call.loadDialAddCust(_phone,paneId);
                }else{
                    var _phone=getEncryptTel(phone);
                    handler.call.loadCustNoPopInfo(_phone,paneId,null,province,city);
                }
            });
            handler.customer.loadCustUpdateTmpl(cid,dbType,container,function(){
                if(flag=='popupMail'||flag=='relocationMail'){
                    var mails=container.find("input[name='email[]']");
                    var val="";
                    if(mails.length>0){
                        val= $.trim(mails[0].value);
                    }
                    if(!val){
                        $('input[name="email[]"]',container).val(phone);
                    }else{
                        var num=0;
                        mails.each(function(i){
                            var _v=$(this).val();
                            if(_v==phone){
                                num++;
                                return false;
                            }
                        });
                        if(num==0){
                            container.find(".email .plus").click();
                            $('input[name="email[]"]:last',container).val(phone);
                        }
                    }
                }else if(flag=='popupWeixin'||flag=="relocationWeixin"){
                    var nick=$("#"+paneId).attr("nick")||'';
                    var wxIds=container.find("input[name='num[]']");
                    var val="";
                    if(wxIds.length>0){
                        val= $.trim(wxIds[0].value);
                    }

                    if(!val){
                        $('input[name="num[]"]',container).val(phone);
                        $('input[name="wxMemo[]"]',container).val(nick);
                    }else{
                        var num=0;
                        wxIds.each(function(i){
                            var _v=$(this).val();
                            if(_v==phone){
                                num++;
                                return false;
                            }
                        });
                        if(num==0){
                            container.find(".weixin .plus").click();
                            $('input[name="num[]"]:last',container).val(phone);
                            $('input[name="wxMemo[]"]:last',container).val(nick);
                        }
                    }
                }else if(flag=='popupWebchat'|| flag=='relocationWebchat'){
                }else{
                    var telObj=container.find("input[name='tel[]']");
                    var val="";
                    var firstItem=telObj[0];
                    if(telObj.length>0){
                        val= $.trim(telObj[0].value);
                    }
                    var phone2=getEncryptTel(phone);
                    var desc=checkHideTel(phone2);
                    if(!val){
                        $('input[name="tel[]"]',container).val(desc).attr("bgTel",phone);
                    }else{
                        var num=0;
                        telObj.each(function(i){
                            var _v=$(this).val();
                            if(_v==desc){
                                num++;
                                return false;
                            }
                        });
                        if(num==0){
                            container.find(".phone .plus").click();
                            $('input[name="tel[]"]:last',container).val(desc).attr("bgTel",phone);
                        }
                    }
                }
            });
            if(callback){
                callback();
            }
        });
    },
    _sysncCdr:function(data){
        var flag=data.dealSrc;
        var _param={
            customerId:data.customerId,
            callId:data.callId,
            phone:data.phone,
            dealSrc:data.dealSrc
        }
        var action = {
            action: 'app.customer.callLocationCustomer',
            data: _param
        };
        DS.send(action,function(rep) {
            if(rep.success) {
                if(flag=='customerLeak'){
                    var _pane=$("#call_sheet_leak_list_item_pane");
                    if(_pane.length>0){
                        _pane.find(".item_row.expanded").find(".leak_location_custName").text(data.name);
                    }
                }
            }else{
            }
        });
    },
    updateCustomer2Popup:function(data,src){
//        var pane=src.closest(".contact_summary");
        var flag=src.attr("ds_attr")||"";
        var tels=data.tel,memos=data.memo;
        var phone=[];
        for(var i=0;i<tels.length;i++) {
            if($.trim(tels[i])){
                //过滤中间空格
                tels[i] = tels[i].replace(/\s/g,"");
                phone.push({tel:tels[i],memo:memos[i]});
            }
        }
        delete data.tel;
        delete data.memo;
        data.phone=phone;

        var emails = data.email,eMemos=data.eMemo;
        var email=[];
        if(emails){
            for(var i=0;i<emails.length;i++) {
                if($.trim(emails[i])){
                    email.push({email:emails[i],memo:eMemos[i]});
                }
            }
            delete data.email;
            delete data.eMemo;
            data.email=email;
        }


        var wxNums=data.num,wxMemo=data.wxMemo;
        var weixin=[];
        if(wxNums){
            for(var i=0;i<wxNums.length;i++) {
                if($.trim(wxNums[i])){
                    weixin.push({num:wxNums[i],memo:wxMemo[i]});
                }
            }
            delete data.num;
            delete data.wxMemo;
            data.weixin=weixin;
        }

        var menu=src.attr("menu")||"";
        var action = {
            action: 'app.customer.updateCustomer',
            data: data
        };
        DS.send(action,function(rep){
            if(rep.success){
                var dealSrc="popup";
                var callTel="";
                if(flag=='customerLeak'){
                    dealSrc=flag;
                    var _pane=$("#my_call_sheet_leak_customerLeak");
                    callTel=_pane.attr("phone");
                    handler.customer.loadCustInfo(data._id,'my_call_sheet_leak','customerLeak');
                }else if(flag=='popupMail'||flag=='popupWeixin'||flag=='relocationMail'||flag=='relocationCall'||flag=="relocationWeixin"||flag=='popupWebchat'|| flag=='relocationWebchat') {
                    handler.customer.loadCustInfo(data._id, menu, flag, null, null);
                }else if(flag=='dialPopup'){
                    var pane=$("#sys_dialPopup");
                    handler.customer.loadDialCustInfo2Update(data._id,pane,function(){
                        pane.find(".func_tab.active").click();
                    });
                }else{
                    //同步左栏和关联通话记录
                    var popdata = {};
                    popdata.callId = menu;
                    popdata.name = data.name;
                    popdata._id = data._id;
                    dsevent.publish(dsevent.evt.callRefreshCustomer,popdata);
                    handler.customer.loadCustInfo(data._id, menu, "popup",null,null,function(){
                        $("#"+menu+"_popup").find(".func_tab.active").click();
                    });
                }
                dsevent.publish(dsevent.evt.customerUpdate,data);
                if(flag=='popupMail'||flag=='relocationMail'){
                    var _param={
                        customerId:data._id,
                        callId:menu,
                        custName:data.name
                    }
                    var action = {
                        action: 'app.email.locationCustomer',
                        data: _param
                    };
                    DS.send(action,function(rep) {});
                }else if(flag=='popupWeixin'||flag=="relocationWeixin"){
                    var _param={
                        customerId:data._id,
                        callId:menu,
                        custName:data.name
                    }
                    var action = {
                        action: 'app.weixin.locationCustomer',
                        data: _param
                    };
                    DS.send(action,function(rep) {});
                }else if(flag=='popupWebchat'|| flag=='relocationWebchat'){
                    var _param={
                        customerId:data._id,
                        callId:menu,
                        custName:data.name
                    }
                    var action = {
                        action: 'app.webchat.locationCustomer',
                        data: _param
                    };
                    DS.send(action,function(rep) {});
                }else if(flag=='dialPopup'){
                    var dialModal=src.closest("#dial_popup_modal");
                    var dialCallId=dialModal.find("#dial_popup_modal_callSheetID").val();

                    var _param={
                        customerId:data._id,
                        callId:dialCallId,
                        phone:callTel,
                        dealSrc:dealSrc
                    }
                    var action = {
                        action: 'app.customer.callLocationCustomer',
                        data: _param
                    };
                    DS.send(action,function(rep) {});
                }else{
                    var _param={
                        customerId:data._id,
                        callId:menu,
                        phone:callTel,
                        dealSrc:dealSrc,
                        name:data.name
                    }
                    handler.call._sysncCdr(_param);
                }
            }else{
                if(rep.code=='1001'){
                    $().alertmessage('showError', "电话号码重复");
                }else if(rep.code=='1002'){
                    $().alertmessage('showError', "客户名称重复");
                }else{
                    $().alertmessage('showError', rep.message || errMsg);
                }
            }
        });
    },
    selectLocationQuery:function(data,src){
        var pane=src.closest(".btn-group");
        var desc=src.text();
        pane.find("input[name='field']").val(data);
        pane.find(".current_query_field").text(desc);
        pane.find(".query_field_list").find("a").each(function(i){
            var txt=$(this).text();
            $(this).removeClass("mail_sign_active");
            if(txt==desc){
                $(this).addClass("mail_sign_active");
            }
        })
    },
    /**
     * 定位到多个客户用
     * @param contacts
     * @param param
     * @param dsAction
     * @returns {string}
     */
    popupCustMoreData:function(contacts,param,dsAction){
        var dsData='__cid,__name,__phone,__paneId,__popupId';
        var tdModel = "<tr><td><button type='button' class='btn btn-info btn-small ds_do_action' ds_data='"+dsData+"' ds_action='"+dsAction+"'>选定</button></td>" +
            "<td>__name</td><td>__phoneList</td><td>__emailList</td></tr>";
        var html=[];
        for(var i=0;i<contacts.length;i++){
            var item=contacts[i];
            var phone=item.phone||[];
            var phoneList="";
            for (var j = 0; j < phone.length; j++) {
                var _tel = phone[j].tel;
                phoneList+=checkHideTel(_tel)+" ";
            }
            var emails=item.email||[];
            var emailList="";
            for (var j = 0; j < emails.length; j++) {
                var _email = emails[j].email;
                emailList+=_email+" ";
            }

            var td = tdModel.replace(/__cid/g, item._id).replace(/__dbType/g,item.dbType)
                .replace(/__name/g, item.name).replace(/__phoneList/g, phoneList)
                .replace(/__emailList/g, emailList)
                .replace(/__phone/g, param.phone).replace(/__paneId/g, param.paneId)
                .replace(/__popupId/g, param.popupId);
            html.push(td);
        }
        return html.join("");
    },
    showCallNoDesc:function(tel){
        return checkHideTel(tel);
    },
    showShortTime:function(time){
        return time?time.substring(0,16):"";
    },
    showCustAdd:function(paneId,src){
        var pane=$("#"+paneId).find(".customer_container");
//        var tip=pane.find(".cust_tip");
        var body=pane.find(".cust_body");
//        tip.toggle()
        if(src.hasClass("show_add")){
            src.removeClass("show_add");
            src.text("点击收起");
        }else{
            src.addClass("show_add");
            src.text("点击新增");
        }
        body.toggle();
    },

    initBadge:function(data,src){

    },

    refreshBadge:function(num){
        var listPane=$("#contact_list_cdr");
        var p1=listPane.find(".model_submenu").find('.btn_cdr_call').find(".badge");

        var _num1=p1.text()||'0';
        _num1=parseInt(_num1,10)+num;
        if(_num1>0){
            p1.text(_num1);
        }else{
            p1.text("");
        }
        handler.call.refreshMenuBadge(_num1);
    },
    refreshMenuBadge:function(num){
        var pane=$('#main-panel').find(".navbar_top");
        if(num>0){
            pane.find(".navbar_item>.nav_call").html('<span class="task_pop_tip"></span>');
        }else{
            pane.find(".navbar_item>.nav_call").html('');
        }
    },
    showDialPopupCust: function(phone) {
        var action = {
            action: 'app.popup.popupCust',
            data: {phone:phone}
        };
        DS.send(action,function(rep) {
            if(rep.success) {
                var contacts = rep.list||[];
                var count = rep.count;
                var container=$('#dial_popup_modal');
                container.css({"width":'880px',"height":"auto"});
                var body=container.find(".modal-body");
                body.empty().css({"max-height":"400px"});

                DS.getView('call/call_dial_popup',function(view){
                    body.html(view);
                    var paneId="sys_dialPopup";
                    var pane=$("#"+paneId);
                    pane.attr("phone",checkEncryptTel(phone));
                    if(!contacts || contacts.length == 0) {
                        //pane.data("dialInfo",{phone:phone});
                        body.css('overflow-y','auto');
                        handler.call.loadDialAddCust(phone,paneId);
                        container.modal({backdrop:'static'});
                    } else if(contacts.length == 1) {
                        body.css('overflow-y','hidden');
                        container.show();
                        container.modal({backdrop:'static'});
                        handler.customer.loadDialCustInfo(contacts[0],pane,function(){
                            pane.find(".func_tab.active").click();
                        });
                    } else {
                        body.css('overflow-y','auto');
                        handler.call.loadDialMoreCust(phone,contacts,paneId, true,count);
                        container.modal({backdrop:'static'});
                    }
                })
            }else{
                $().alertmessage('showError', "定位客户异常，弹屏失败！");
                return;
            }
        });
    },
    loadDialAddCust: function(callNo,paneId) {
        var pane=$("#"+paneId).find(".customer_container");
        var callId=paneId.split("_")[0];
        var dealSrc=paneId.split("_")[1];
        DS.getView('customer/customer_add',function(view){
            var _tel=checkEncryptTel(callNo);
            view=view.replace(/_#menu#_/g,paneId).replace(/_#callNo#_/g,_tel).replace(/_#dealSrc#_/g,dealSrc);
            pane.html(view);
            pane.find(".btn_cust_black").show();//add black list
            pane.find(".select_old_cust").show();
            var o=pane.find("#icc_add_customer_dbType");
            var tmpls=getCache('custTmpls');
            if(tmpls && tmpls.length>0){
                var dbType=tmpls[0]._id;
                o.val(dbType);
                handler.customer.loadCustAddTmpl(dbType,pane);
                pane.find(".btn_cancel_edit").remove();
                var telDesc=checkHideTel(callNo,pane.find('input[name="tel[]"]'));
                pane.find('input[name="tel[]"]').val(telDesc);
            }
        });
    },

    loadDialMoreCust: function(callNo, contacts, paneId, showLocation,total) {
        var  pane =$("#"+paneId).find(".customer_container");
        var _tel=checkEncryptTel(callNo);
        DS.getView('call/call_dial_pop_list',function(view){
            pane.empty();
            view = view.replace(/__id/g, paneId).replace(/__phone/g,_tel).replace(/__popupId/g,'').replace(/__province/g,'').replace(/__city/g,'');
            pane.html(view);
            $('#comBoxData').val(callNo);
            var tds = "";
            if(contacts && contacts.length > 0) {
                var param={
                    paneId:paneId,
                    phone:_tel,
                    popupId:''
                }
                var dsAction="call.popLocateDial";
                tds=handler.call.popupCustMoreData(contacts,param,dsAction);
            }
            if(showLocation){
                pane.find(".location_phone").html("通过号码<span class='phone'>"+checkHideTel(callNo)+"</span> 为您定位到以下客户，请选择:");
                pane.find(".location_phone").css("display","block");
            } else {
                pane.find(".location_phone").css("display","none");
            }
            DS.updatePagination("query_customer_form_"+paneId, total, handler.call.queryPageSize, 1);
            var paneBody = $("#customer_list_pane_"+paneId);
            paneBody.html(tds);
        });
    },
    showDialAddCust: function(data) {
        var params=data.split(",");
        var phone=params[0];
        var paneId=params[1];
        handler.call.loadDialAddCust(phone,paneId);
        $("#"+paneId).attr("phone",phone);
    },
    popLocateDial: function(data) {
//        console.dir(data)
//        var index = data.indexOf(",");
        var params=data.split(",");
        var customerId = params[0];
        var name = params[1];
        var phone = params[2];
        var paneId = params[3];
        var popupId = params[4];
        var arys=paneId.split("_");
        var callId=arys[0],flag=arys[1];


        var pane=$("#"+paneId);
        handler.customer.loadDialCustInfo2Update(customerId,pane,function(){
            pane.find(".func_tab.active").click();
        });
        if(flag=='dialPopup'){
            var dialModal=$("#dial_popup_modal");
            var dialCallId=dialModal.find("#dial_popup_modal_callSheetID").val();
            var _param={
                customerId:customerId,
                callId:dialCallId,
                phone:phone,
                dealSrc:flag
            }
            var action = {
                action: 'app.customer.callLocationCustomer',
                data: _param
            };
            DS.send(action,function(rep) {});
        }
        //var popData = {};
        //popData.callId = callId;
        //popData.name = name;
        //popData._id = customerId;
        //dsevent.publish(dsevent.evt.callRefreshCustomer,popData);
//        var _param={
//            customerId:customerId,
//            callId:callId,
//            phone:phone,
//            dealSrc:"popup"
//        }
//        var action = {
//            action: 'app.customer.callLocationCustomer',
//            data: _param
//        };
//        DS.send(action,function(rep) {
//            if(rep.success) {
//            }else{
////                $().alertmessage('showError', errMsg);
//            }
//        });
    },


    test:function(number) {
        var callObject = {
            originId: "abcdefg123456789",
            originCallNo: number,
            originCalledNo: "01085659242",
            queueName: "产品咨询",
            offeringTime: "2013-07-09 22:00",
            callerProvince: "山西省",
            callerCity: "太原市",
            callSheetId: "test" + number
        }
        handler.call.call(callObject);
    }

}
