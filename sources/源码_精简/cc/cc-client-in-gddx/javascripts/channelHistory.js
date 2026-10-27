handler.channelHistory = {
    limit: 10,
    cid:"#view_nav_history",
    richEditor:null,
    curShowPaneCallId:"",
    currentFlag:"",
    channel_main:function(menu){
        var pane=$(handler.channelHistory.cid);
        handler.channelHistory.showTab("mail");
//        pane.find(".channel_tab li>a:first").click();
    },
    showTab:function(data,src){
        var pane=$(handler.channelHistory.cid);
        var rightPane=pane.find("#body_channel");
        rightPane.empty();
        var showSearchPane=function(param){
            var caption=pane.find(".contacts_caption");
            caption.html(template("tmpl_channel_search",param));
            caption.find(".quick_menu a").each(function(i){
                var val=$(this).attr("ds_data");
                if(val==data){
                    $(this).addClass("quick_card_active");
                    return false;
                }
            })
        }
        if(data=='call'){
            var param={
                model:"call",
                action:"channelHistory.searchCallCard",
                form:"frm_channel_call_normal_search",
                desc:"通话",
                quickField:"combox",
                placeholder:"输入电话号码查询"
            }
            showSearchPane(param);
            DS.getView('channelHistory/call_list', function (view) {
                view=DS.renderMethodViewNew(view,{menu:data});
                pane.find("#channel_history_body").html(view);
                var searchPane = $('#contact_list_channel');
                handler.channelHistory._initCallSearch(searchPane,data);
                var btn=searchPane.find('.normal_search');
                btn.click();
            });
        }else if(data=='mail'){
            var param={
                model:"mail",
                action:"channelHistory.searchMailCard",
                form:"frm_channel_mail_normal_search",
                desc:"邮件",
                quickField:"from",
                placeholder:"输入发件人邮箱查询"
            }
            showSearchPane(param);
            DS.getView('channelHistory/mail_list', function (view) {
                view=DS.renderMethodViewNew(view,{menu:data});
                pane.find("#channel_history_body").html(view);
                var searchPane = $('#contact_list_channel');
                handler.channelHistory._initMailSearch(searchPane,data);
                var btn=searchPane.find('.normal_search');
                btn.click();
            });
        }else if(data=='weixin'){
            var param={
                model:"weixin",
                action:"channelHistory.searchWeixinCard",
                form:"frm_channel_weixin_normal_search",
                desc:"微信",
                quickField:"from",
                placeholder:"输入昵称查询"
            }
            showSearchPane(param);
            DS.getView('channelHistory/weixin_list', function (view) {
                view=DS.renderMethodViewNew(view,{menu:data});
                pane.find("#channel_history_body").html(view);
                var searchPane = $('#contact_list_channel');
                handler.channelHistory._initWeixinSearch(searchPane,data);
                var btn=searchPane.find('.normal_search');
                btn.click();
            });
      /*  }else if(data=='webchat'){
            var param={
                model:"webchat",
                action:"channelHistory.searchWebchatCard",
                form:"frm_channel_webchat_normal_search",
                desc:"聊天",
                quickField:"custName",
                placeholder:"输入客户名称查询"
            }
            showSearchPane(param);
            DS.getView('channelHistory/webchat_list', function (view) {
                view=DS.renderMethodViewNew(view,{menu:data});
                pane.find("#channel_history_body").html(view);
                var searchPane = $('#contact_list_channel');
                handler.channelHistory._initWebchatSearch(searchPane,data);
                var btn=searchPane.find('.normal_search');
                btn.click();
            });*/
        }else if(data=='sms'){
            var param={
                model:"sms",
                action:"sms.searchSmsCard",
                form:"frm_sms_normal_search",
                desc:"短信",
                quickField:"num",
                placeholder:"输入号码查询"
            }
            showSearchPane(param);
            var searchPane = $('#contact_list_channel');
            var caption=searchPane.find(".contacts_caption");
            var html='<li><a href="#" class="ds_do_action" ds_action="sms.showSendGroup" ds_data="">群发</a></li>';
            caption.find(".menu_list").html(html)
            DS.getView('channelHistory/sms_list', function (view) {
                view=DS.renderMethodViewNew(view,{menu:data});
                pane.find("#channel_history_body").html(view);
                handler.sms.initSmsCondition(searchPane);
                var btn=searchPane.find('.normal_search');
                btn.click();
            });
        }
    },
    /*****************mail manage start*****************/
    _initMailSearch:function(searchPane,menu){
        var pane=searchPane;
        var container=pane.find(".advanced_search_pane");
        if(container.find(".ds_owner").length>0){
            var inputId=menu+"_owner_select_input";
            var containerId=menu+"_owner_select_user";
            utils.loadAgentComboBox(inputId,containerId,{width:"110",height:"17"},false,true);
        }
        var html=handler.generateCodeOptions("mailStatus");
        container.find("select[name='status']").append(html);
        pane.find(".btn_advanced_search").bind("click",function(e){
            e.stopPropagation();
            var offset=searchPane.find(".quick_search").offset();
            container.css({top:offset.top+28+"px",left:offset.left+"px"});
            container.toggleClass("hidden");
        });
        container.find(".reset_adv_search").bind("click",function(){
            var frm=$(this).closest("form");
            frm.get(0).reset();
            if(frm.find(".select_input").length>0){
                frm.find(".select_input").val("");
            }
        });
        resizeLeftColumn(searchPane);
    },
    searchMailCard: function(data, src) {
        if(src.hasClass("refresh")){// 操作后刷新列表
            var searchPane = $('#contact_list_channel');
            var param=handler._getSearchCondition(searchPane,"1")||{};
            var a=searchPane.find(".pagination li.active>a");
            if(a.length>0){
                param.page= a.attr("value");
            }
            handler.channelHistory.queryMailList(param,null);
        }else{
            handler.channelHistory.queryMailList(data,src);
        }
    },
    queryMailList:function(data,src){
        data=data||{};
        var isAdvanceSearch=data.isAdvanceSearch;
        delete  data.isAdvanceSearch;
        var pane=$("#contact_list_channel");
        handler._setSearchCondition(data,pane);

        var frmId='frm_channel_mail_normal_search';
        if(isAdvanceSearch=="1"){
            frmId = "frm_channel_mail_advanced_search";
        }
        pane.find(".pagination").attr({for:frmId});

        var page=data.page;
        if(src && src.hasClass("page_on")){
            page=src.attr("value");
            handler.cancelDealToolbar("mail");
        }
        if(!page)page=1;
        data.page=page;
        data.limit=handler.channelHistory.limit;
//        console.dir(data)
        var action={
            action:'app.email.queryMailList2In',
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                DS.showSearchTips(pane.find("#"+frmId));
                var list=rep.list;
                var count=rep.count;
                var container=pane.find('.list-inside');
                if (list.length > 0){
                    var html = [];
                    for (var i = 0, len = list.length; i < len; i++) {
                        var row = list[i];
                        var s=row.status;
                        if(!row.custName){
                            row.custName="未知客户";
                        }
                        var _t=handler.formatShortTime(row.receiveTime);
                        row.shortTime=_t.name;

                        var desc=getDicCacheName("mailStatus",s)||"";
                        row.statusDesc=desc;
                        var cls="";
                        if(s=='undeal'||s=='assign'){
                            cls='label-warning';
                        }else if(s=='deal'){
                            cls='label-success';
                        }else if(s=='leak'){
                            cls='label-important';
                        }
                        row.statusClass=cls;
                        html.push(template("tmpl_mail_item",row));
                    }
                    container.html(html.join(''));
                } else {
                    var html='<div class="alert">没有记录!</div>';
                    container.html(html);
                }
                DS.updatePagination(frmId, count, data.limit, data.page);
                pane.find('.advanced_search_pane').addClass("hidden");
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    showMailDetail:function(mailId,src){
        var flag=src.attr("ds_attr");
        var paneId=mailId+"_relocationMail";
        var action = {
            action: 'app.email.relocationCustomer',
            data: {_id:mailId}
        };
        DS.send(action,function(rep){
            if(rep.success) {
                var contacts = rep.list||[];
                var count = rep.count||0;

                var inbox=rep.row||{};
                var replys=rep.replys||[];
                var email=inbox.from;
                var p=$(handler.channelHistory.cid).find("#body_channel");
                DS.getView("channelHistory/mail_info", function (view) {
                    view=DS.renderMethodViewNew(view,inbox);
                    p.html(view);
                    $("#"+paneId).attr("phone",email);
                    handler.channelHistory.curShowPaneCallId = mailId;
                    handler.channelHistory.currentFlag = "relocationMail";

                    if(count==-1){
                        handler.callMail.loadCustAddByMailFirst(email,paneId,true);
                    }else{
                        if(!contacts || contacts.length == 0) {
                            handler.callMail.loadCustAddByMailFirst(email,paneId);
                        } else if(contacts.length == 1) {
                            handler.customer.loadCustInfo(contacts[0]._id,mailId,"relocationMail",null,null);
                            dsevent.publish(dsevent.evt.callRefreshCustomer,contacts[0]);
                        } else {
                            handler.callMail.loadCustMoreByMail(email,contacts, paneId, true,null,count);
                        }
                    }

                    var pane= p.find(".mail_inbox");
                    handler.channelHistory._loadInboxInfo(pane,inbox,function(){
                        if(inbox.status=='undeal'||inbox.status=='assign'){
                            pane.find(".my_dealInbox").show();
                        }else{
                            pane.find(".my_dealInbox").remove();
                        }
                    });
                    //console.dir(replys);
                    for (var i = 0; i < replys.length; i++) {
                        var obj = replys[i];
                        handler.channelHistory._loadInboxInfo(p.find(".mail_reply"),obj,function(){
                            p.find(".mail_reply").find(".btn_reply").remove();
                        });
                    }
                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    _loadInboxInfo:function(pane,data,callback){
        var to=data.to||[];
        var cc=data.cc||[];
        data.fromDesc= handler.callMail._getComboxMail(data.from,data.fromName);
        data.toDesc=to.join(",");
        data.ccDesc=cc.join(",");
//        data.escapeContent=data.content;
        data.escapeContent=handler.callMail.escapeHtml(data.content);
        var attachs=data.attachment||[];
        data.attachDesc="";
        var html=[];
        var tmpl='<div class="attach_info"><img src="./img/7mfj.gif"><a href="javascript:handler.callMail.downloadAttach(\'_#url#_\')">_#fileName#_</a></div>';
        if(attachs.length>0){
            for (var i = 0; i < attachs.length; i++) {
                var obj = attachs[i];
                var _url=obj.key+'?download/'+obj.fileName;
                obj.url=encodeURIComponent(_url);
                html.push(DS.renderViewNew(tmpl,obj));
            }
            data.attachDesc=html.join("");
        }
        DS.getView('channelHistory/mail_info_in',function(view){
            view=DS.renderMethodViewNew(view,data);
            pane.hide();
            pane.append(view);
            var frameId="inboxInfo_"+data._id;
            var frame=$("#"+frameId);
            handler.callMail.loadIframeInfo(frame.get(0),data.content);
            frame.on("load",function(){
                handler.channelHistory.autoHeight(frame.get(0));
            })

            window.setTimeout(function(){
                frame.load();//手动调用一次，解决不自动触发onload的情况
            },600);

            frame.contents().find("head").append('<style type="text/css">body{font-family: Arial, Helvetica, sans-serif,Microsoft YaHei;font-size: 12px;}</style>');
            if(typeof callback =='function'){
                callback();
            }
            pane.show();
        });
    },

    /*****************mail manage end*****************/

    /*****************call manage start*****************/
    _initCallSearch:function(searchPane,menu){
        var pane=searchPane;
        var container=pane.find(".advanced_search_pane");
        if(container.find(".ds_owner").length>0){
            var inputId=menu+"_owner_select_input";
            var containerId=menu+"_owner_select_user";
            utils.loadAgentComboBox(inputId,containerId,{width:"110",height:"17"},false,true);
        }
        var callStatusHtml = handler.cdr.getCallStatusSelectorHtml('STATUS', '');
        container.find("select[name='STATUS']").get(0).outerHTML = callStatusHtml;
        var queueHtml = handler.cdr.getQueueSelectorHtml('ERROR_MEMO', '');
        container.find("select[name='ERROR_MEMO']").get(0).outerHTML = queueHtml;
        var callTypeHtml = handler.cdr.getCallTypeSelectorHtml('CONNECT_TYPE', '');
        container.find("select[name='CONNECT_TYPE']").get(0).outerHTML = callTypeHtml;
        var investigateHtml = handler.cdr.getInvestigateSelectorHtml('INVESTIGATE', '');
        container.find("select[name='INVESTIGATE']").get(0).outerHTML = investigateHtml;

        pane.find(".btn_advanced_search").bind("click",function(e){
            e.stopPropagation();
            var offset=searchPane.find(".quick_search").offset();
            //console.dir(offset)
            container.css({top:offset.top+28+"px",left:offset.left+"px"});
            container.toggleClass("hidden");
        });
        container.find(".reset_adv_search").bind("click",function(){
            var frm=$(this).closest("form");
            frm.get(0).reset();
            if(frm.find(".select_input").length>0){
                frm.find(".select_input").val("");
            }
        });
        resizeLeftColumn(searchPane);
    },
    searchCallCard: function(data, src) {
        if(src.hasClass("refresh")){
            var searchPane = $('#contact_list_channel');
            var param=handler._getSearchCondition(searchPane,"1")||{};
            var a=searchPane.find(".pagination li.active>a");
            if(a.length>0){
                param.page= a.attr("value");
            }
            handler.channelHistory.queryCallList(param,null);
        }else{
            setDateTimeCondition(data);
            handler.channelHistory.queryCallList(data,src);
        }
    },
    queryCallList:function(data,src){
        data=data||{};
        var isAdvanceSearch=data.isAdvanceSearch;
        delete  data.isAdvanceSearch;
        var pane=$("#contact_list_channel");
        handler._setSearchCondition(data,pane);

        var frmId='frm_channel_call_normal_search';
        if(isAdvanceSearch=="1"){
            frmId = "frm_channel_call_advanced_search";
        }
        pane.find(".pagination").attr({for:frmId});

        var page=data.page;
        if(src && src.hasClass("page_on")){
            page=src.attr("value");
            handler.cancelDealToolbar("call");
        }
        if(!page)page=1;
        data.page=page;
        data.pageSize=handler.channelHistory.limit;
        var action={
            action:'app.callSheet.queryCallSheet',
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                DS.showSearchTips(pane.find("#"+frmId));
                var list=rep.list;
                var count=rep.count;
                var container=pane.find('.list-inside');
                if (list.length > 0){
                    var html = [];
                    for (var i = 0, len = list.length; i < len; i++) {
                        var row = list[i];
                        handler.channelHistory._setCallItem(row);
                        html.push(template("tmpl_callsheet_item",row));
                    }
                    container.html(html.join(''));
                } else {
                    var html='<div class="alert">没有记录!</div>';
                    container.html(html);
                }
                DS.updatePagination(frmId, count, data.pageSize, data.page);
                pane.find('.advanced_search_pane').addClass("hidden");
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    _setSheetLeakItem: function (data) {
        var callNoDesc="",dialTypeDesc="";
        var connectType=data.CONNECT_TYPE;
        var callNo="";
        if (connectType=='dialout' || connectType=='dialTransfer') {
            callNo = data.CALLED_NO;
            callNoDesc=checkHideTel(data.CALLED_NO);
        }else{
            callNo = data.CALL_NO;
            callNoDesc=checkHideTel(data.CALL_NO);
        }
        var city=data.PROVINCE;
        callNoDesc+="["+city+"]";
        data.callNo = checkEncryptTel(callNo);
        data.sheetLeakDesc=callNoDesc;
    },
    _setCallItem: function (data) {
        var callNoDesc="",dialTypeDesc="";
        var connectType=data.CONNECT_TYPE;
        var callNo="";
        if (connectType=='dialout' || connectType=='dialTransfer') {
            callNo = data.CALLED_NO;
            callNoDesc=checkHideTel(data.CALLED_NO);
            dialTypeDesc='<img src="/img/client/tel_out.png" style="width: 15px;"/>';
        }else{
            callNo = data.CALL_NO;
            callNoDesc=checkHideTel(data.CALL_NO);
            dialTypeDesc='<img src="/img/client/tel_in.png" style="width: 15px;"/>';
        }
        var city=(data.PROVINCE==data.DISTRICT)?data.PROVINCE:data.PROVINCE+"-"+data.DISTRICT;
        callNoDesc+="["+city+"]";
        data.callNo = checkEncryptTel(callNo);
        data.callNoDesc=callNoDesc;
        data.dialTypeDesc=dialTypeDesc;

        var _t=handler.formatShortTime(data.OFFERING_TIME);
        data.shortTime=_t.name;

        var timeLen=handler.cdr.getCallTimeLength(data.CALL_TIME_LENGTH);
        data.timeLen=timeLen;

        var s=data.STATUS;
        data.statusDesc=handler.cdr.getCallStatusName(s);
        var cls="";
        if(s=='blackList'){
            cls='label-warning';
        }else if(s=='dealing'){
            cls='label-success';
        }else if(s=='notDeal' ||s=='queueLeak'||s=='leak'){
            cls='label-important';
        }else if(s=='voicemail'){
            cls='label-info';
        }
        data.statusClass=cls;

        data.agentDesc=handler.cdr.getAgentName(data.DISPOSAL_AGENT);
        data.queueDesc=handler.cdr.getQueueName(data.ERROR_MEMO);
        if(data.CALL_TIME_LENGTH && data.CALL_TIME_LENGTH > 0){
            data.shortCallTimeLength=handler.cdr.getCallTimeLength(data.CALL_TIME_LENGTH);
            data.monitorFile = data.FILE_SERVER+"/"+data.RECORD_FILE_NAME;
            data.jmp3Tag = "7m-jmp3";
            data.showPlayBtn = "";
        }else{
            data.showPlayBtn = "display: none";
        }
        data.showTag = "display: none";
        if(data.KEY_TAG){
            data.showTag = "";
        }
    },
    showCallDetail:function(callId,src){
        var paneId=callId+"_relocationCall";
        var action = {
            action: 'app.callSheet.relocationCustomer',
            data: {_id:callId}
        };
        DS.send(action,function(rep){
            if(rep.success) {
                var contacts = rep.list||[];
                var count = rep.count;
                //console.dir(rep)
                var callDB=rep.row||{};
                var phone=rep.tel;
                var callSheetId=callDB._id;
                var province=callDB.PROVINCE;
                var city=callDB.DISTRICT;

                var p=$(handler.channelHistory.cid).find("#body_channel");
                DS.getView("channelHistory/call_info", function (view) {
                    view=DS.renderMethodViewNew(view,callDB);
                    p.html(view);
                    $("#"+paneId).attr("phone",phone);
                    $("#"+paneId).attr("province",province);
                    $("#"+paneId).attr("city",city);
                    handler.channelHistory.curShowPaneCallId = callSheetId;
                    handler.channelHistory.currentFlag = "relocationCall";
                    if(count==-1){
                        handler.call.loadCustAddByTelFirst(phone,paneId,province,city,true);
                    }else{
                        if(!contacts || contacts.length == 0) {
                            handler.call.loadCustAddByTelFirst(phone,paneId,province,city);
                        } else if(contacts.length == 1) {
                            handler.customer.loadCustInfo(contacts[0]._id,callSheetId,"relocationCall",null,null);
                            dsevent.publish(dsevent.evt.callRefreshCustomer,contacts[0]);
                        } else {
                            handler.call.loadCustMorePopInfo(phone,contacts, paneId, true,null,count,province,city);
                        }
                    }

                    var pane= p.find(".call_body");
                    handler.channelHistory._loadCallInfo(pane,callDB);
                    //to if show channelcdr
                    if(callDB.CONNECT_TYPE == 'normal'){
                        var pbxs = session.account.pbx;
                        var isShowChannelCdr = false;
                        for(var i=0;i<pbxs.length;i++){
                            if(session.user.pbx == pbxs[i].PBX){
                                if(pbxs[i].IsRecordChannelCdr == "true"){
                                    isShowChannelCdr = true;
                                    var action = {
                                        action : 'app.callSheet.getCdrDetail',
                                        data : callId
                                    }
                                    DS.send(action,function(res){
                                        if(!res.success){
                                            alert('get cdrDetail fail!');
                                            return;
                                        }
                                        if(res.data){
                                            DS.getView('cdr/cdr_channel_detail', function(otherInfoView){
                                                pane.find('.callSheetOtherInfoPanel').html(
                                                    otherInfoView.replace('__CHANNEL_DETAIL', render.cdr.renderCdrChannelDetail(res.data))).show();


                                            });
                                        }
                                    });
                                }
                            }
                        }
                    }
                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    _loadCallInfo:function(pane,callSheet,callId,label){
        DS.getView('channelHistory/call_info_body', function (view) {
            showCdrTel(callSheet);
            view = DS.renderMethodViewNew(view, callSheet);
            pane.html(view);
            handler.cdr.cdrShowUseLabelDetal(callId,label);
            resizeRightContent(pane);
            if(callSheet.CONNECT_TYPE == 'normal'){
                var pbxs = session.account.pbx;
                var isShowChannelCdr = false;
                for(var i=0;i<pbxs.length;i++){
                    if(session.user.pbx == pbxs[i].PBX){
                        if(pbxs[i].IsRecordChannelCdr == "true"){
                            isShowChannelCdr = true;
                            var action = {
                                action : 'app.callSheet.getCdrDetail',
                                data : callId
                            }
                            DS.send(action,function(res){
                                if(!res.success){
                                    alert('get cdrDetail fail!');
                                    return;
                                }
                                if(res.data){
                                    DS.getView('cdr/cdr_channel_detail', function(otherInfoView){
                                        pane.find('.callSheetOtherInfoPanel').html(
                                            otherInfoView.replace('__CHANNEL_DETAIL', render.cdr.renderCdrChannelDetail(res.data))).show();
                                    });
                                }
                            });
                        }
                    }
                }
            }

        });
    },
    /*****************call manage end*****************/

    /*****************weixin manage start*****************/
    _initWeixinSearch:function(searchPane,menu){
        var pane=searchPane;
        var container=pane.find(".advanced_search_pane");
        var html=handler.generateCodeOptions("mailStatus");
        container.find("select[name='status']").append(html);
        pane.find(".btn_advanced_search").bind("click",function(e){
            e.stopPropagation();
            var offset=searchPane.find(".quick_search").offset();
            container.css({top:offset.top+28+"px",left:offset.left+"px"});
            container.toggleClass("hidden");
        });
        container.find(".reset_adv_search").bind("click",function(){
            var frm=$(this).closest("form");
            frm.get(0).reset();
        });
        resizeLeftColumn(searchPane);
    },
    searchWeixinCard: function(data, src) {
        if(src.hasClass("refresh")){
            var searchPane = $('#contact_list_channel');
            var param=handler._getSearchCondition(searchPane,"1")||{};
            var a=searchPane.find(".pagination li.active>a");
            if(a.length>0){
                param.page= a.attr("value");
            }
            handler.channelHistory.queryWeixinList(param,null);
        }else{
            handler.channelHistory.queryWeixinList(data,src);
        }
    },
    queryWeixinList:function(data,src){
        data=data||{};
        var isAdvanceSearch=data.isAdvanceSearch;
        delete  data.isAdvanceSearch;
        var pane=$("#contact_list_channel");
        handler._setSearchCondition(data,pane);

        var frmId='frm_channel_weixin_normal_search';
        if(isAdvanceSearch=="1"){
            frmId = "frm_channel_weixin_advanced_search";
        }
        pane.find(".pagination").attr({for:frmId});

        var page=data.page;
        if(src && src.hasClass("page_on")){
            page=src.attr("value");
            handler.cancelDealToolbar("weixin");
        }
        if(!page)page=1;
        data.page=page;
        data.limit=handler.channelHistory.limit;
//        console.dir(data)
        var action={
            action:'app.weixin.queryWexinUser2In',
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                DS.showSearchTips(pane.find("#"+frmId));
                var list=rep.list;
                var count=rep.count;
                var container=pane.find('.list-inside');
                if (list.length > 0){
                    var html = [];
                    for (var i = 0, len = list.length; i < len; i++) {
                        var row = list[i];
                        var s=row.status;
                        if(!row.custName){
                            row.custName="未知客户";
                        }
                        if(!row.msgNum){
                            row.msgNum="";
                        }
//                        var _t=handler.formatShortTime(row.receiveTime);
//                        row.shortTime=_t.name;
                        var desc=getDicCacheName("mailStatus",s)||"";
                        row.statusDesc=desc;
                        var cls="";
                        if(s=='undeal'||s=='assign'){
                            cls='label-warning';
                        }else if(s=='deal'){
                            cls='label-success';
                        }else if(s=='leak'){
                            cls='label-important';
                        }
                        row.statusClass=cls;
                        html.push(template("tmpl_weixin_item",row));
                    }
                    container.html(html.join(''));
                } else {
                    var html='<div class="alert">没有记录!</div>';
                    container.html(html);
                }
                DS.updatePagination(frmId, count, data.limit, data.page);
                pane.find('.advanced_search_pane').addClass("hidden");
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    showWeixinDetail:function(uid,src){
        var flag=src.attr("ds_attr");
        var nick=src.attr("nick");
        var idx=uid.lastIndexOf("_");
        var userId=uid.substring(0,idx);
        var paneId=userId+"_relocationWeixin";
        var action = {
            action: 'app.weixin.relocationCustomer',
            data: {_id:userId}
        };
        DS.send(action,function(rep){
            if(rep.success) {
                var contacts = rep.list||[];
                var count = rep.count;
                var p=$(handler.channelHistory.cid).find("#body_channel");
                DS.getView("channelHistory/weixin_info", function (view) {
                    view=DS.renderMethodViewNew(view,{_id:userId});
                    p.html(view);
                    $("#"+paneId).attr("phone",userId);
                    $("#"+paneId).attr("nick",nick);
                    handler.channelHistory.curShowPaneCallId = userId;
                    handler.channelHistory.currentFlag = "relocationWeixin";
                    if(count==-1){
                        handler.callWeixin.loadCustAddByWeixinFirst(userId,paneId,true);
                    }else{
                        if(!contacts || contacts.length == 0) {
                            handler.callWeixin.loadCustAddByWeixinFirst(userId,paneId);
                        } else if(contacts.length == 1) {
                            handler.customer.loadCustInfo(contacts[0]._id,userId,"relocationWeixin",null,null);
                            dsevent.publish(dsevent.evt.callRefreshCustomer,contacts[0]);
                        } else {
                            handler.callWeixin.loadCustMoreByMail(userId,contacts, paneId, true,null,count);
                        }
                    }

                    var pane= p.find(".weixin_body");
                    handler.channelHistory._loadUserHistory(pane,uid,flag);
                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    _loadUserHistory:function(pane,uid,flag){
        var idx=uid.lastIndexOf("_");
        var userId=uid.substring(0,idx);
        DS.getView("callWeixin/weixin_history", function (view) {
            var _data={
                qiniuId:'user-his',
                userID:userId,
                openID:'',
                uid:uid
            }
/*            if(flag=='cust'){
                var channel=handler.callMail.loadDefaultChannel("weixinChannel");
                if(!channel){
                    $().alertmessage('showError', "您还没有配置微信通道");
                    return;
                }else{
                    _data.openID=channel.openID;
                }
            }*/
            view = DS.renderViewNew(view, _data);
            pane.html(view);
            pane.find(".reply_weixin").attr("ds_attr","channel");
            pane.find(".reply_close").hide();
            handler.callWeixin._initQiniuImg(_data.qiniuId,pane);
            if(flag=='undeal'||flag=='assign'){
                pane.find(".my_dealMsg").show();
            }else{
                pane.find(".my_dealMsg").remove();
            }
            var container=pane.find(".chat_msg");
            pane.find("textarea[name='content']").keydown(function(event){
                if(event.keyCode == 13){
                    event.preventDefault();
                    pane.find(".reply_weixin").click();
                }
            });
            var param={
                page:1,
                userID:userId,
                limit:handler.callWeixin.limit
            }
            var action = {
                action: "app.weixin.queryUserHistory",
                data: param
            };
            DS.send(action, function (rep) {
                if(rep.success){
                    var list=rep.list;
                    var html=[];
                    if(list.length>0){
                        var idx=list.length-1;
                        for (var i = idx; i >=0; i--) {
                            var obj = list[i];
                            if(i==idx && flag!='cust'){
                                pane.find('input[name="openID"]').val(obj.openID);
                            }
                            html.push(handler.callWeixin.showMsg(obj,pane));
                        }
                        container.prepend(html.join(""));
                    }

                    handler.callWeixin._locationMsg(container);
                }else{
                    $().alertmessage('showError', rep.message||errMsg);
                }
            },null,null,true);
            handler.callWeixin._initUserHistory(pane,userId);
        });
    },

    /*****************weixin manage end*****************/

    /*****************webchat manage start*****************/


    /*****************webchat manage end*****************/

    syncChannelCustomer: function(data,container) {
        var name = data.name||"未知客户";
        var pane = container.find(".item" + data.callId);
        pane.find(".customer").html(name);
    },
    autoHeight:function(iframe){
        if(!iframe) return;
        try{
            var doc = iframe.contentDocument || iframe.contentWindow.document;
            var _content=doc.body||doc.documentElement;
            //console.info("scrollHeight=="+_content.scrollHeight+",offsetHeight===="+_content.offsetHeight+",height======"+$(_content).height());
            iframe.height = _content.scrollHeight||200;
        }catch(e){}
    }


}
