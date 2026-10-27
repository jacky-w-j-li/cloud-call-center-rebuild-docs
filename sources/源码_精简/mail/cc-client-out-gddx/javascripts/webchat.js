handler.webchat = {
    users: [],
    subMenus:['webchat_open','webchat_todo','webchat_all'],
    openSessions: [],
    limit: 10,
    cardLimit:50,
    cid:"#view_nav_webchat",
    richEditor:null,
    curSubMenu:'',
    curTabId:"",
    curTabFlag:"",
    curDealCount:0,
    userStatus:false,
    haveClaim : true,
    autoClaim : true,
    webchat_main:function(menu){
        var pane=$(handler.webchat.cid);
        handler.webchat.initBadge();
        pane.find(".btn_webchat_todo").click();
    },
    _normal_search:function(paneId){
        var searchPane = $('#'+paneId);
        handler.webchat._initWebchatSearch(searchPane);
        var btn=searchPane.find('.normal_search');
        btn.click();
    },
    webchat_list:function(id){
        if(id == 'webchat_open'){
            $("#view_webchat_all").find(".btn_advanced_search").remove();
        }
        handler.webchat._normal_search("view_webchat_all");
    },
    webchat_list_todo:function(){
        handler.webchat._normal_search("view_webchat_todo");
    },
    quick_subMenu_search: function (submenu,src) {
        var searchPane = src.closest(".left_column");
        searchPane.find(".model_submenu button").removeClass("active");
        src.addClass("active");
        handler.webchat.curSubMenu=submenu;
        handler.cancelDealToolbar("webchat");

        if(submenu=='webchat_open'||submenu=='webchat_all'){
            handler.swapSubMenu(submenu,'webchat/webchat_list',"webchat_all",true,true);
            handler.webchat.curTabFlag = "relocationWebchat";
        }else if(submenu=='webchat_todo') {
            handler.swapSubMenu(submenu, 'webchat/webchat_list_todo');
            handler.webchat.curTabFlag = "popupWebchat";
        }
    },
    _initWebchatSearch:function(searchPane){
        var container=searchPane.find(".advanced_search_pane");
        var html=handler.generateCodeOptions("chatStatus");
        container.find("select[name='status']").append(html);

        var dics=getCache('channelDic')||[];
        var _dics=[];
        var _wechatCSR=[];
        for (var i = 0; i < dics.length; i++) {
            var obj = dics[i];
            if(obj.type=="webchat"){
                _dics=obj.options||[];
            }
            if(obj.type=="webchatCSR"){
                _wechatCSR=obj.options||[];
            }
        }
        var html2=generateComboxOptionsFromDocs(_dics,"name","key",null);
        container.find("select[name='finishKey']").append(html2);

        var peers = getCache("mailQueues");
        var html3=generateComboxOptionsFromDocs(peers,"DisplayName","Exten",null);
        container.find("select[name='toPeer']").append(html3);

        var html4=generateComboxOptionsFromDocs(_wechatCSR,"name","key",null);
        container.find("select[name='appraiseKey']").append(html4);



        var menu=handler.webchat.curSubMenu;
        if(menu=='webchat_all'){
            container.find(".condition_hide").show();
        }
        if(container.find(".ds_owner").length>0){
            var inputId=menu+"_owner_select_input";
            var containerId=menu+"_owner_select_user";
            utils.loadAgentComboBox(inputId,containerId,{width:"110",height:"17"},false,true);
        }
        searchPane.find(".btn_advanced_search").bind("click",function(e){
            e.stopPropagation();
            var offset=searchPane.find(".quick_search").offset();
            container.css({top:offset.top+28+"px",left:offset.left+"px"});
            container.toggleClass("hidden");
        });
    },
    searchWebchatCard: function(data, src) {
        if(src.hasClass("refresh")){
            var searchPane = src.closest(".list_check_pane");
            var param=handler._getSearchCondition(searchPane,"1")||{};
            var a=searchPane.find(".pagination li.active>a");
            if(a.length>0){
                param.page= a.attr("value");
            }
            handler.webchat.queryWebchatList(param,null);
        }else{
            handler.webchat.queryWebchatList(data,src);
        }
    },
    _getSubPane:function(type){
        var _sub=handler.webchat.curSubMenu;
        if(type=='left'){
            var pane=$("#view_webchat_all");
            if(_sub=='webchat_todo'){
                pane=$("#view_webchat_todo");
            }
            return pane;
        }else if(type=='right'){
            var pane=$("#view_webchat_all_content");
            if(_sub=='webchat_todo'){
                pane=$("#view_webchat_todo_content");
            }
            return pane;
        }
    },
/*    getMyQueue:function(){
        var myId=session.user._id;
        var dics=getCache("mailQueues");
    },*/
    queryWebchatList:function(data,src){
        data=data||{};
        var isAdvanceSearch=data.isAdvanceSearch;
        delete  data.isAdvanceSearch;
        var _sub=handler.webchat.curSubMenu;
        var pane=handler.webchat._getSubPane("left");
        data.submenu=_sub;
        handler._setSearchCondition(data,pane);
        var frmId="";
        var dealAction="webchat.showWebchatDetail";
        if(_sub=='webchat_todo'){
            frmId='frm_webchat_todo_normal_search';
            if(isAdvanceSearch=="1"){
                frmId = "frm_webchat_todo_advanced_search";
            }
            dealAction="webchat.showTodoWebchatDetail";
        }else{
            frmId='frm_webchat_normal_search';
            if(isAdvanceSearch=="1"){
                frmId = "frm_webchat_advanced_search";
            }
        }
        pane.find(".pagination").attr({for:frmId});

        var page=data.page;
        if(src && src.hasClass("page_on")){
            page=src.attr("value");
            handler.cancelDealToolbar("webchat");
        }
        if(!page)page=1;
        data.page=page;
        data.limit=handler.webchat.limit;
//        console.dir(data)
        var action={
            action:'app.webchat.queryWebchatSession',
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                DS.showSearchTips(pane.find("#"+frmId));
                var list=rep.list;
                var count=rep.count;
                var container=pane.find('.list-inside');
                if (list && list.length > 0){
                    var html = [];
                    for (var i = 0, len = list.length; i < len; i++) {
                        var row = list[i];
                        handler.webchat._renderChatItem(row,dealAction);

                        html.push(template("tmpl_webchat_item",row));

                    }
                    container.html(html.join(''));
                    dsevent.bind('.webchat_item', dsevent.evt.refreshCustomerName ,function(event, params){
                        if($(this).attr('cust_id') == params.custId){
                            var custPane = $(this).find(".card_row_title");
                            if(custPane && custPane.length > 0){
                                custPane.text(params.custName);
                            }
                        }
                    });

                    if(_sub=='webchat_open'){
                        container.find(".chat_get").show();
                    }
                    if(_sub == "webchat_todo"){
                        handler.webchat.curDealCount = list.length;
                    }
                } else {
                    var html='<div class="alert">没有记录!</div>';
                    container.html(html);
                }
                if(_sub == "webchat_todo"){
                    //console.log("click");
                    //console.log(handler.webchat.haveClaim);
                    if(handler.webchat.haveClaim){
                        handler.webchat.autoClaimWebchatSession();
                    }

                }
                if(_sub!='webchat_todo'){
                    DS.updatePagination(frmId, count, data.limit, data.page);
                }
                handler.webchat.refreshQueryBadge(_sub,count);
                pane.find('.advanced_search_pane').addClass("hidden");
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    refreshWebchatList:function(subMenu,src){
        //console.info("refreshWebchatList===="+subMenu);
        var data={};
        var _sub=subMenu;
        data.submenu=_sub;
        var pane=$("#view_webchat_all");
        if(_sub=='webchat_todo'){
            pane=$("#view_webchat_todo");
        }
        var frmId="";
        var dealAction="webchat.showWebchatDetail";
        if(_sub=='webchat_todo'){
            frmId='frm_webchat_todo_normal_search';
            dealAction="webchat.showTodoWebchatDetail";
        }else{
            frmId='frm_webchat_normal_search';
        }
        pane.find(".pagination").attr({for:frmId});

        var page=data.page;
        if(src && src.hasClass("page_on")){
            page=src.attr("value");
        }
        if(!page)page=1;
        data.page=page;
        data.limit=handler.webchat.limit;
//        console.dir(data)
        var action={
            action:'app.webchat.queryWebchatSession',
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

                        handler.webchat._renderChatItem(row,dealAction);
                        //console.dir(row)
                        html.push(template("tmpl_webchat_item",row));
                    }
                    container.html(html.join(''));
                    if(_sub=='webchat_open'){
                        container.find(".chat_get").show();
                    }
                } else {
                    var html='<div class="alert">没有记录!</div>';
                    container.html(html);
                }
                DS.updatePagination(frmId, count, data.limit, data.page);
                handler.webchat.refreshQueryBadge(_sub,count);
                pane.find('.advanced_search_pane').addClass("hidden");
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    _renderChatItem:function(row,dealAction){
        var s=row.status;
        row.dealAction=dealAction;
        if(!row.custName){
            row.custName="未知客户";
        }
        if(!row.leakNum){
            row.leakNum="";
        }
        var _t=handler.formatShortTime(row.createTime);
        row.shortTime=_t.name;

        var desc=handler.webchat.showFieldDesc("chatStatus",s)||"";
        row.statusDesc=desc;
        var cls="";
        if(s=='undeal'){
            cls='label-warning';
        }else if(s=='deal' || s=='changePeer') {
            cls = 'label-success';
            //}else if(s=='leak'){
            //    cls='label-important';
        }
        row.statusClass=cls;

        if(row.platform == "pc" || row.Platform == "pc"){
            row.fromUrl = (row.fromUrl == "未知"  || !row.fromUrl)? (row.FromUrl|| "pc浏览器") : row.fromUrl;
            row.fromSource = "网站咨询";
        }else if(row.platform == "wap" || row.Platform == "wap"){
            row.fromUrl = (row.fromUrl == "未知"  || !row.fromUrl)? (row.FromUrl|| "移动浏览器"): row.fromUrl;
            row.fromSource = "wap站咨询";
        }else if(row.platform == "sdk" || row.Platform == "sdk"){
            row.fromUrl = (row.fromUrl == "未知"  || !row.fromUrl)?  (row.FromUrl|| "app"): row.fromUrl;
            row.fromSource = "app咨询";
        }else if(row.platform == "weixin" || row.Platform == "weixin"){
            row.fromUrl = (row.fromUrl == "未知" || !row.fromUrl)?  (row.FromUrl|| "微信"): row.fromUrl;
            row.fromSource = "微信咨询";
        }else{
            row.fromUrl = (row.fromUrl == "未知"  || !row.fromUrl)?  (row.FromUrl|| "未知"): row.fromUrl;
            row.fromSource = "未知";
        }
        if(row.showCustomerName == true || row.showCustomerName == "true"){
            row.fromSource=row.fromSource+ (row.sourceName ||"");
        }
        row.fromUrl = decodeURIComponent(row.fromUrl);
        if(row.status == "deal"){
            if(row.userStatus == "offline"){
                row.userStatusClass = "nonline";
                var offlineTime = handler.getFormatDateTime(new Date(row.sBreakTime));
                row.userStatusDesc = "离线 "+ (row.sBreakTime?handler.formatChatShortTime(offlineTime):"");
            }else if(row.userStatus == "online"){
                row.userStatusClass = "online";
                row.userStatusDesc = "在线";
            }
        }
        if(row.user){
            var agent = getCache("agents", row.user);
            if(agent){
                row.agentDisplayName = agent.displayName+"("+agent.exten+")";
            }
        }
        if(row.toPeer || row.ToPeer){
            var peerId = row.toPeer || row.ToPeer;
            var peer = getCacheByKey("mailQueues", "Exten", peerId);
            if(peer){
                row.peerName = peer.DisplayName;
            }

        }
        if(row.sName){
            row.sName = decodeURIComponent(row.sName);
        }
    },
    refreshChatDetail:function(sid,flag,userId,callback){
        var paneId=sid+"_"+flag;
        if(!userId){
            var _param=$("#"+paneId).data("chatInfo");
            userId=_param.uid;
        }
        //console.info("refreshChatDetail:::userId==="+userId);
        var contentPane=handler.webchat._getSubPane("right");
        var action = {
            action: 'app.popup.popupWebchat',
            data: {sid:userId, _id: sid}
        };
        DS.send(action,function(rep){
            if(rep.success) {
                var user=rep.user||{};
                var nick=user.sName;
                var contact = rep.row;

                DS.getView('webchat/webchat_detail', function (detail) {
                    detail = detail.replace(/_#paneId#_/g,paneId);
                    if(flag=="popupWebchat"){
                        contentPane.append(detail);
                    }else{
                        contentPane.html(detail);
                    }
                    var call_right=$("#"+paneId);
                    call_right.attr("phone",sid);
                    if(contact){
                        call_right.data("chatInfo",{sid:sid,uid:userId,flag:flag, custName:contact.name, custId: contact._id});
                    }else{
                        call_right.data("chatInfo",{sid:sid,uid:userId,flag:flag});
                    }

                    if(contact) {
                        var tag=contact.delTag;
                        if(tag=='y'){
                            handler.webchat.loadCustAddByWebchatFirst(nick,paneId,true);
                        }else{
                            handler.customer.loadCustInfo(contact._id,sid,flag,null,null,function(){
                                call_right.find(".func_tab.active").click();
                            });
                            //dsevent.publish(dsevent.evt.callRefreshCustomer,contact);
                        }
                    } else {
                        handler.webchat.loadCustAddByWebchatFirst(nick,paneId);
                    }

                    if(typeof callback=='function'){
                        callback();
                    }
                    call_right.show();
                });
            }else{
                handler.webchat._syncCardLimit(sid);
                $().alertmessage('showError', errMsg);
            }
        });
    },
    showWebchatDetail:function(sid,src){
        //console.log('---showWebchatDetail');
        var flag="relocationWebchat";
        var userId=src.attr("ds_attr");
        handler.webchat.refreshChatDetail(sid,flag,userId);
    },
    _dealMsg:function(sid){
        var action = {
            action: 'app.webchat.dealMsg',
            data: {_id:sid}
        };
        DS.send(action,function(rep){
            if(rep.success) {
            }else{
                $().alertmessage('showError', errMsg);
            }
        },null,null,true);
    },
    showTodoWebchatDetail: function(sid,src) {

        if($(src).find(".online").length){
            handler.webchat.userStatus = true;
        }else{
            handler.webchat.userStatus = false;
        }
        var flag="popupWebchat";
        var paneId=sid+"_"+flag;

        var userId=src.attr("ds_attr");
        var pane=handler.webchat._getSubPane("left");
        var contentPane=handler.webchat._getSubPane("right");
        var call_left = pane.find(".item"+sid);
        var call_right=$("#"+paneId);
        var label_status = $(src).find(".label_status").attr("status");
        handler.webchat.curTabId = sid;
        var num=call_left.find(".badge").text();
        var hasUser=handler.webchat._checkLimit(sid);
        console.info("showTodoWebchatDetail::sid==="+sid+",hasUser=="+hasUser);
        if(hasUser){
            contentPane.find(".call_detail").hide();
            call_right.show();
            call_left.find(".badge").text("");
            call_right.find("input[name=status]").val(label_status);
            var container=call_right.find(".webchat_container .chat_msg");
            handler.webchat._locationMsg(container);
            //handler.webchat._initQiniuImg(sid,call_right);
            if(num){
                handler.webchat._dealMsg(sid);
            }
        }else{//init page
            handler.webchat.refreshChatDetail(sid,flag,userId,function(){
                call_left.find(".badge").text("");
                if(num){
                    handler.webchat._dealMsg(sid);
                }
                contentPane.find(".call_detail").hide();
                call_right.show();
            });
        }
    },
    loadChatTab:function(data,src, callback){
        var container=src.closest(".call_detail");
        var paneId=container.attr("id");
        var ary=paneId.split("_");
        var sid=ary[0];
        var flag=ary[1];
        var call_right=$("#"+paneId);
        //console.info("loadChatTab::sid====="+sid+",flag===="+flag);
        var action = {
            action: 'app.webchat.queryChatSessionById',
            data: {_id:sid}
        };
        var chatInfo = call_right.data("chatInfo");
        DS.send(action,function(rep){
            if(rep.success) {
                var chatSession=rep.chatSession;
                if(!chatSession.remark){
                    chatSession.remark="";
                }
                if(!chatSession.platform){
                    chatSession.platform="pc";
                }
                if(!chatSession.agentFirstReplyTime){
                    chatSession.agentFirstReplyTime = "";
                }
                if(!chatSession.lastRedirectTime){
                    chatSession.lastRedirectTime = "";
                }
                if(!chatSession.manualTime){
                    chatSession.manualTime = chatSession.createTimeStamp;
                }
                var platformPic="webchat_pc.png?v=123";
                if(chatSession.platform=='weixin'){
                    platformPic="webchat_weixin.png?v=123";
                }else if(chatSession.platform=='sdk'){
                    platformPic="webchat_mobile.png";
                }
                if(chatSession.platform == "pc"){
                    chatSession.fromSource = "网站咨询";
                }else if(chatSession.platform == "wap"){
                    chatSession.fromSource = "wap站咨询";
                }else if(chatSession.platform == "sdk"){
                    chatSession.fromSource = "app咨询";
                }else if(chatSession.platform == "weixin"){
                    chatSession.fromSource = "微信咨询";
                }else{
                    chatSession.fromSource = "未知";
                }
                chatSession.platformPic=platformPic;
                DS.getView('webchat/webchat_tab', function (detail) {
                    chatSession.custName = chatInfo.custName || chatSession.sName;
                    chatSession.custId = chatInfo.custId || "";
                    detail = DS.renderViewNew(detail, chatSession);
                    var _p=call_right.find(".cust_tab_content");
                    _p.html(detail);
                    if(chatSession.platform != 'pc' && chatSession.platform != 'wap' && chatSession.platform != "sdk"){
                        call_right.find('.initiate_appraise').addClass('dis_none').hide();
                    }else{
                        call_right.find('.initiate_appraise').removeClass('dis_none').show();
                    }
                    var remarkText = call_right.find("textarea[name='remark']");
                    remarkText.css("outline","none");
                    remarkText.css("box-shadow", "none");
                    remarkText.css("border", "none");

                    if(flag=='relocationWebchat'){
                        _p.find(".chat_msg").css({'border-bottom-right-radius':'6px',"border-bottom-left-radius":'6px'});
                        _p.find(".chat_top .chat_transfer").hide();
                        _p.find(".chat_toolbar").remove();
                        _p.find(".chat_deal").remove();
                        _p.find(".webchat_quickreply_tab").remove();
                    }else{
                        if(chatSession.status == "changePeer"){
                            _p.find(".img_action_turn").hide();
                            _p.find(".chat_toolbar").remove();
                            _p.find("textarea[name=content]").attr("disabled","disabled");
                            _p.find(".webchat_quickreply_tab").remove();
                            _p.find(".msg_inner").append(template("tmpl_webchat_msg_to", {contentDesc:"该会话已流转到其它的技能组", uidDesc:"系统"}));
                        }
                        if(chatSession.leavemsg){
                            _p.find(".img_action_turn").hide();
                            _p.find(".chat_toolbar").remove();
                            _p.find("textarea[name=content]").attr("disabled","disabled");
                            _p.find(".webchat_quickreply_tab").remove();
                        }
                        call_right.find("textarea[name='content']").keydown(function(event){
                            if(event.keyCode == 13){
                                event.preventDefault();
                                call_right.find(".reply_webchat").click();
                            }
                        });
                        handler.webchat.transferAgent(chatSession,_p);
                        handler.webchat.initFace(call_right);
                        handler.webchat.initQiniuUploadForWebchat(call_right, chatSession.sid);
                        handler.webchat._initDic(_p);
                        if(chatSession.status != "changePeer" && !chatSession.leavemsg){
                            handler.webchat.initQuickReply(_p);
                        }
                        //if(chatSession.platform != 'pc'){
                        //    call_right.find('.initiate_appraise').hide();
                        //}

                    }

                    var msgContainer=call_right.find(".chat_msg");
                    var _container=msgContainer.find(".msg_inner");
                    var param={
                        page:1,
                        sessionId:sid,
                        limit:handler.webchat.limit
                    }
                    var action = {
                        action: "app.webchat.queryUserHistory",
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
                                    var last=null;
                                    if(i<idx){
                                        last=list[i+1];
                                    }
                                    html.push(handler.webchat.showMsg(obj,call_right,"up",last,i));
                                }
                                _container.prepend(html.join(""));
                            }

                            handler.webchat._locationMsg(msgContainer);
                            resizeRightContent($("#view_nav_webchat").find(call_right).find(".cust_tab_content"));//联系历史和im对话框高度区分

                            if(list.length==10){
                                var msgH=msgContainer.innerHeight();
                                var msgInnerH=_container.outerHeight(true);
                                if(msgInnerH<=msgH){
                                    _container.css({"min-height":msgH+5});
                                    msgContainer.scrollTop(5);
                                }
                                //console.info("msgH===="+msgH+" msgInnerH===="+msgInnerH);
                            }
                        }else{
                            $().alertmessage('showError', rep.message||errMsg);
                        }

                    },null,null,true);
                    handler.webchat._initUserHistory(call_right,sid);
                    if(typeof callback == "function"){
                        callback();
                    }
                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    changeItemStatusDesc: function(data){

    },

    dispatch: function(evtJson) {
        var obj = evtJson.Data;
        var event=evtJson.Event;
        var isMe=evtJson.Foryou;
        //console.dir("00000000");
        //console.dir(evtJson);
        var fromSource = "未知";
        obj.Platform = obj.Platform || obj.platform;
        if(obj.Platform == "pc"){
            fromSource = "网站咨询";
        }else if(obj.Platform == "wap"){
            fromSource = "网站咨询";
        }else if(obj.Platform == "sdk"){
            fromSource = "app咨询";
        }else if(obj.Platform == "weixin"){
            fromSource = "微信咨询";
        }
        var title = "您有新的消息，来自于【"+fromSource+"】的用户【"+obj.sName+"】";

        if(event == 'NewNotify' && obj.operation=='claim') {
            //handler.webchat.removeOpenItem(obj);
        }else if(event == 'NewNotify' && obj.type=='agentPushStatus' ){
            handler.webchat.syncOnlineAgent(obj);
        }else if(event == 'NewNotify' && obj.type=='chatSessionClose' ){
            if(isMe){
                handler.webchat.removeTodoItem(obj);
            }else{
                handler.webchat.removeOpenItem(obj);
            }
        //}else if(event == 'NewNotify' && obj.operation=='redirect'){
        //    var toUser=obj.to;
        }else if(event == 'NewNotify' && obj.type == 'changePeer' ){
            //todo 转技能组怎么处理
            var mailQueues = getCache('mailQueues');
            var queueDisplayName = ";"
            for(var i=0 ;i<mailQueues.length; i++){
                if(mailQueues[i].Exten == obj.toPeer){
                    queueDisplayName = mailQueues[i].DisplayName;
                }
            }
            obj.Content = "用户流转进了【"+queueDisplayName+"】技能组";
            handler.webchat.webchatTodoItemAdd(obj);
        }else{
            if(isMe && obj.Content && obj.MsgType == "newMsg"){
                var content = "";
                try{
                    content = decodeURIComponent(obj.Content);
                }catch(e){
                    content = obj.Content.replace(/%26/g, "&");
                    content = content.replace(/%23/g, "#");
                    content = content.replace(/%3A/g, ":");
                    content = content.replace(/%24/g, "$");
                    content = content.replace(/%40/g, "@");
                    content = content.replace(/%2B/g, "+");
                    content = content.replace(/%3D/g, "=");
                    content = content.replace(/%2F/g, "/");
                }
                var content2 = content.replace(/<[^>]+>/g,"");
                $(".btn_webchat_todo").click();
                emitNotify(title, content2.substr(0,80),"#view_webchat_todo .item"+obj._id);
            }else{
                if( isMe && obj.MsgType == "disConn"){
                    $(".btn_webchat_todo").click();
                    emitNotify(title, "用户已离开", "#view_webchat_todo .item"+obj._id);
                }else if(isMe && obj.MsgType == "newConn"){
                    emitNotify(title, "用户新接入", "#view_webchat_todo .item"+obj._id);
                }

            }
            if(isMe){
                handler.webchat.webchatTodoItemAdd(obj);
            }else{
                if(handler.webchat.haveClaim){
                    handler.webchat.autoClaimWebchatSession(obj);
                }

            }
        }
    },
    syncOnlineAgent: function (data) {
        var onlines=getCache("onlineChannelAgent");
        var uid=data.userId;
        var online=data.online;
        var has=false;
        for(var i=0;i<onlines.length;i++){
            var agent=onlines[i];
            if(agent._id==uid){
                has=true;
                break;
            }
        }
        if(online){
            if(!has){
                addCache("onlineChannelAgent",{_id:uid});
                _im_monitor_queueAgentsOnlineChanged(uid,'add');
            }
        }else{
            if(has){
                removeCache("onlineChannelAgent",uid);
                _im_monitor_queueAgentsOnlineChanged(uid,'remove');
            }
        }
    },
    removeTodoItem:function(data) {
        var sid=data._id;
        var pane=$("#view_webchat_todo");
        var itemPane= pane.find(".item"+sid);
        //var contentPane=$("#view_webchat_todo_content");
        var paneId=sid+"_popupWebchat";
        var call_right=$("#"+paneId);
        if(handler.webchat.curDealCount > 0){
            handler.webchat.curDealCount = handler.webchat.curDealCount - 1;
        }
        if(handler.webchat.haveClaim){
            handler.webchat.autoClaimWebchatSession();
        }
        if(pane.length>0){
            var container=pane.find('.list-inside');
            if(container.length>0 ) {
                handler.webchat.refreshWebchatList("webchat_todo");
                handler.webchat._syncCardLimit(sid);
                call_right.remove()
            }else{
                handler.webchat.initBadge();
            }
        }
    },
    removeOpenItem:function(data) {
        var sid=data._id;
        var pane=$("#view_webchat_all");
        //var itemPane= pane.find(".item"+callId);
        //console.log(pane.length);
        if(pane.length>0){//打开过webchat菜单
            var container=pane.find('.list-inside');
            if(container.length>0 && handler.webchat.curSubMenu=='webchat_open') {//打开过该子菜单
                handler.webchat.refreshWebchatList("webchat_open");
            }else{
                handler.webchat.initBadge();
            }
        }else{
            handler.webchat.refreshMenuBadge(true);
        }
    },
    webchatOpenItemAdd:function(data) {
        var callId=data._id;
        data.sName=data.sName||' ';
        if(data.CreateTime){
            var _t=handler.formatShortTime(data.CreateTime);
            data.shortTime=_t.name;
        }else{
            data.shortTime="";
        }

        var flag="relocationWebchat";
        var pane=$("#view_webchat_all");
        var itemPane= pane.find(".item"+callId);

        var chatSession=data;
        chatSession.createTime=chatSession.CreateTime;
        chatSession.sid=chatSession.Sid;
        chatSession.leakNum=1;
        chatSession.status='undeal';

        if(pane.length>0){//打开过webchat菜单
            var container=pane.find('.list-inside');
            if(container.length>0 && handler.webchat.curSubMenu=='webchat_open') {//打开过该子菜单
                handler.webchat.refreshWebchatList("webchat_open");
            }else{
                handler.webchat.initBadge();
            }
        }else{
            handler.webchat.refreshMenuBadge(false,1);
        }
    },
    webchatTodoItemAdd:function(data) {
        var callId=data._id;
        data.sName=data.sName||' ';
        if(data.CreateTime){
            var _t=handler.formatShortTime(data.CreateTime);
            data.shortTime=_t.name;
        }else{
            data.shortTime="";
        }
        try{
            data.Content = decodeURIComponent(data.Content);
        }catch(e){
            data.Content = data.Content.replace(/%26/g, "&");
            data.Content = data.Content.replace(/%23/g, "#");
            data.Content = data.Content.replace(/%3A/g, ":");
            data.Content = data.Content.replace(/%24/g, "$");
            data.Content = data.Content.replace(/%40/g, "@");
            data.Content = data.Content.replace(/%3D/g, "=");
            data.Content = data.Content.replace(/%2B/g, "+");
            data.Content = data.Content.replace(/%2F/g, "+");

        }

        if(data.MsgType=='newConn') {
            data.ContentDesc = "新用户接入";
            handler.webchat.userStatus = true;
        }else if(data.MsgType=='disConn'){
            data.ContentDesc = "用户已离开";
            handler.webchat.userStatus = false;
        }else if(data.MsgType == 'saveImCSRInfo'){
            data.CreateTime = data.createTime;
            delete data.createTime;
            if(!handler.webchat.userStatus){
                data.ContentDesc = '用户已离线，无法发出评价';
            }else{
                if(data.Platform!='pc' && data.isInvestigate!= undefined && !data.isInvestigate){//已经评价过了
                    return;
                }
                data.ContentDesc = data.message;
            }
        }else{//newMsg ,investigate
            data.ContentDesc = data.Content;
        }

        if(data.MsgType=='newMsg' || data.MsgType == "newConn" || data.MsgType == "sendImQAMsg"){
            data.userStatus = "online";
            data.userStatusClass = "online";
            data.userStatusDesc = "在线";
        }

        if(data.MsgType=='disConn'){
            data.userStatus = "offline";
            data.userStatusClass = "nonline";
            data.userStatusDesc = "离线 "+ data.shortTime;
        }


        if(data.status != "finish" && data.MsgType!= "disConn"){
            if(data.userStatus == "offline"){
                data.userStatus = "offline";
                data.userStatusClass = "nonline";
                var offlineTime = handler.getFormatDateTime(new Date(data.sBreakTime));
                data.userStatusDesc = "离线 "+ handler.formatChatShortTime(offlineTime);
            }else if(data.userStatus == "online"){
                data.userStatus = "online";
                data.userStatusClass = "online";
                data.userStatusDesc = "在线";
            }
        }
        if(data.type =="changePeer"){
            data.userStatus = "";
            data.userStatusClass = "";
            data.userStatusDesc = "";
        }
        data.Content=data.ContentDesc;

        var flag="popupWebchat";
        var paneId=callId+"_"+flag;
        var pane=$("#view_webchat_todo");
        var itemPane= pane.find(".item"+callId);
        var _showBadge=function(){
            if(session.currentPage.pageId != 'webchat_todo' || handler.webchat.curTabId!=callId){
                var num=$.trim(itemPane.find(".badge").text())||0;
                num=parseInt(num,10);
                num++;
                itemPane.find(".badge").text(num);
            }
            if(data.type == "changePeer"){
                itemPane.find(".label_status").html("已流转");
            }
        }
        var chatSession=data;
        chatSession.createTime=chatSession.CreateTime || chatSession.createTime;
        chatSession.sid=chatSession.Sid || chatSession.sid;
        chatSession.leakNum=1;
        chatSession.status='deal';
        if(pane.length>0){//打开过webchat菜单
            var container=pane.find('.list-inside');
            console.info("webchatTodoItemAdd::===="+callId+",container.length=="+container.length+",itemPane=="+itemPane.length);
            if(container.length>0){//打开过该子菜单
                if(itemPane.length==0){
                    handler.webchat._addTodoCard(chatSession);
                    handler.webchat.refreshBadge(1,"todo");
                }else{
                    _showBadge();
                    var rightPane=$("#"+paneId);
                    if(rightPane.length>0){
                        if(data.type == "changePeer"){
                            rightPane.find(".img_action_turn").hide();
                            rightPane.find(".chat_toolbar").remove();
                            rightPane.find("textarea[name=content]").attr("disabled","disabled");
                            rightPane.find(".webchat_quickreply_tab").remove();
                            rightPane.find(".webchat_quickreply_container").remove();
                        }
                        handler.webchat.loadInboxInfo(data,paneId);
                        if(session.currentPage.pageId == 'webchat_todo' && handler.webchat.curTabId==callId){//打开的情况下，后续的继续更新
                            handler.webchat._dealMsg(callId);
                        }
                    }
                    if(data.MsgType != 'saveImCSRInfo'){
                        itemPane.find(".user_status").removeClass("online");
                        itemPane.find(".user_status").removeClass("nonline");
                        itemPane.find(".user_status").addClass(chatSession.userStatusClass);
                        itemPane.find(".user_status").html(chatSession.userStatusDesc);
                    }

                }
            }else{
                //转接给我的累加
                if(data.operation=='redirect' && data.to==session.user._id){
                    handler.webchat.refreshBadge(1,"todo");
                }
            }
            if(data.operation=='redirect' && data.to==session.user._id){
                handler.webchat.curDealCount = handler.webchat.curDealCount + 1;
            }
        }else{
            handler.webchat.refreshMenuBadge(false,1);
        }
    },

    gotoWebchatMenu: function(data,src) {
        var pane=$("#main-panel");
        var callMenu=pane.find(".navbar_top a[id='nav_webchat']");
        callMenu.click();
        if(src){
            $(src).click();
        }
    },
    initBadge:function(data,src){
        var listPane=$("#contact_list_webchat");
        var action = {
            action: 'app.webchat.refreshMenuNum',
            data: {}
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                console.log("initBadge");
                console.log(rep);
                var openNum=rep.openNum;
                var todoNum=rep.todoNum;

                var p1=listPane.find(".model_submenu").find('.btn_webchat_open').find(".badge");
                var p2=listPane.find(".model_submenu").find('.btn_webchat_todo').find(".badge");
                $("#webchat_session_undeal_num").html(openNum);
                handler.webchat.refreshMenuBadge(false,openNum>todoNum?openNum:todoNum);
            } else {
                $().alertmessage('showError', errMsg);
            }
        });
    },
    refreshQueryBadge:function(flag,num){
        var listPane=$("#contact_list_webchat");
        var pane=null;
        //var m1=listPane.find(".model_submenu").find('.btn_webchat_open').find(".badge");
        var m2=listPane.find(".model_submenu").find('.btn_webchat_todo').find(".badge");
        var otherNum=0;
        if(flag=='webchat_todo'){
            pane=m2;
            //otherNum=m1.text()||0;
        }else if(flag=='webchat_open'){
            //pane=m1;
            //otherNum=m2.text()||0;
        }

        if(pane && pane.length>0){
            if(num>0){
                pane.text(num);
            }else{
                pane.text("");
            }
            handler.webchat.refreshMenuBadge(false,num||otherNum);
        }
    },
    refreshBadge:function(num,flag){
        var listPane=$("#contact_list_webchat");
        var p1=listPane.find(".model_submenu").find('.btn_webchat_open').find(".badge");
        var p2=listPane.find(".model_submenu").find('.btn_webchat_todo').find(".badge");

        var _num1=p1.text()||'0';
        var _num2=p2.text()||'0';
        if(flag=='getChat'){
            _num2=parseInt(_num2,10)+num;
            if(_num2>0){
                p2.text(_num2);
            }else{
                p2.text("");
            }

            _num1=parseInt(_num1,10)-num;
            if(_num1>0){
                p1.text(_num1);
            }else{
                p1.text("");
            }
        }else if(flag=='todo'){
            _num2=parseInt(_num2,10)+num;
            if(_num2>0){
                p2.text(_num2);
            }else{
                p2.text("");
            }
        }else if(flag=='open'){
            _num1=parseInt(_num1,10)+num;
            if(_num1>0){
                p1.text(_num1);
            }else{
                p1.text("");
            }
        }
        handler.webchat.refreshMenuBadge(false,_num1>_num2?_num1:_num2);
    },
    refreshMenuBadge:function(isInit,num,openNum){
        var pane=$('#main-panel').find(".navbar_top");
        if(isInit){
            var action = {
                action: 'app.webchat.refreshMenuNum',
                data: {}
            };
            DS.send(action, function (rep) {
                if (rep.success) {
                    var openNum=rep.openNum;
                    var todoNum=rep.todoNum;
                    $("#webchat_session_undeal_num").html(openNum);
                    if(openNum>0||todoNum>0){
                        pane.find(".navbar_item>.nav_webchat").html('<span class="task_pop_tip"></span>');
                    }

                } else {
                    $().alertmessage('showError', errMsg);
                }
            });
        }else{
            if(openNum && openNum > 0){
                $("#webchat_session_undeal_num").html(openNum);
            }
            if(num>0 || (openNum && openNum > 0)){
                pane.find(".navbar_item>.nav_webchat").html('<span class="task_pop_tip"></span>');
            }else{
                pane.find(".navbar_item>.nav_webchat").html('');
            }
        }
    },





    /******************************************************************************/
    showBigImg:function(url,src){
//        var attachName=src.attr("attachName");
        var html='<div class="text-center"><img src="'+url+'"  class="img-rounded"/></div>';
        var pane =$('#showBigImgModal');
        pane.find(".modal-title").text("查看大图");
        pane.find(".modal-body").html(html);
        pane.css({'z-index':1060});
        pane.modal();
    },

    _getImgView:function(data,flag){
//        var imgInfo = Qiniu.imageInfo(key);
        var path=data;
        var url=path+"?imageView2/2/w/100";
        var html='<a href="#" class="ds_do_action" ds_action="webchat.showBigImg" ds_data="'+path+'"><img src="'+url+'" style="max-width:100px;"></a>';
        return html;
    },
    loadInboxInfo: function(wxObj,paneId){
        var pane=$("#"+paneId);
        var time=wxObj.CreateTime;
        var type=wxObj.MsgType;
        var contentType=wxObj.ContentType;
        wxObj.dateTime=time;
        var tmpl="tmpl_webchat_msg_from";
        if(wxObj.type == "out"){
             tmpl="tmpl_webchat_msg_to";
        }else{
            wxObj.type = "in";
        }
        if(wxObj.user == "system"){
            wxObj.uidDesc="系统";
            tmpl="tmpl_webchat_msg_to";
        }
        var timeDesc="";
        if(time){
            timeDesc=handler.formatChatShortTime(time, true);
        }
        wxObj.timeDesc=timeDesc;
        wxObj.contentDesc=wxObj.Content;
        var isEsc=false;
        handler.webchat._mergeMsg(wxObj,pane,"down");
        if(contentType=='text'){
            if(wxObj.ShowHtml){
                isEsc = true;
            }
        }else if(contentType=='image'){
            isEsc=true;
            wxObj.contentDesc=handler.webchat._getImgView(wxObj.contentDesc);
            tmpl="tmpl_webchat_msg_from_img";
        }else if(contentType=='voice'){
            tmpl="tmpl_webchat_msg_from_voice";
            //var _h='<audio style="" src="" preload="auto"  controls="controls">您的浏览器不支持此播放器</audio>';
        }
        if(wxObj.contentDesc){
            wxObj.contentDesc=handler.webchat.renderEmoji(wxObj.contentDesc,isEsc);
        }
        if(contentType=='text'){
            handler.webchat.autoMatchMsg(wxObj.contentDesc,pane);
        }
        //tmpl=DS.renderMethodViewNew(tmpl,wxObj);

        if (type=='newConn' || type=='disConn' || type=='saveImCSRInfo'){
            tmpl="tmpl_webchat_msg_from_system";
        }

        if(wxObj.sysNotice == true){
            tmpl="tmpl_webchat_msg_from_system";
        }
        tmpl=template(tmpl,wxObj);
        var container=pane.find(".webchat_container .chat_msg");
        container.find(".msg_inner").append(tmpl);
        handler.webchat._locationMsg(container);

        if(type=='investigate'){
            pane.find("textarea[name='content']").attr("disabled",true);
            pane.find(".webchat_msg_emojiface").removeClass("ds_do_action");
            pane.find(".webchat_msg_emojiface").find("input[type=file]").remove();
            pane.find(".chat_toolbar").css("background-color","#ddd");
            pane.find(".chat_deal").css("background-color","#ddd");
            handler.webchat.refreshWebchatList("webchat_todo");
        }
    },

    loadCustAddByWebchatFirst: function(nick,paneId,isDel){
        var pane=$("#"+paneId).find(".customer_container");
        var flag=paneId.split("_")[1];
        var param={
            id:nick||"",
            desc:"在线咨询访客",
            isDel:isDel,
            flag:flag,
            paneId:paneId
        }
        pane.html(template("tmpl_popup_notFound_customer",param));
        pane.find(".cust_base_fields").addClass("autoMatch").show();
        pane.find(".func_tab.active").click();
        pane.show();
        //handler.webchat.loadCustAddByWebchat(uid,paneId,null,true);
    },
    loadCustAddByWebchat: function(uid,paneId,showCancel,isHidden){
        var pane=$("#"+paneId).find(".customer_container .cust_body");
        if(pane.length<=0){
            pane =$("#"+paneId).find(".customer_container");
        }
        var callId=paneId.split("_")[0];
        var dealSrc=paneId.split("_")[1];
        DS.getView('customer/customer_add',function(view){
            view=view.replace(/_#menu#_/g,paneId).replace(/_#callNo#_/g,uid).replace(/_#dealSrc#_/g,dealSrc);
            pane.html(view);
            pane.find(".select_old_cust").show();
            var o=pane.find("#icc_add_customer_dbType");
            var tmpls=getCache('custTmpls');
            if(tmpls && tmpls.length>0){
                var dbType=tmpls[0]._id;
                o.val(dbType);
                handler.customer.loadCustAddTmpl(dbType,pane);
                if(!showCancel){
                    pane.find(".btn_cancel_edit").remove();
                }
            }
            if(isHidden){
                pane.hide();
            }
        });
    },

    callRefreshCustomer: function(data) {//for event
        var name = "未知客户";
        if (data.name != undefined) {
            name = data.name;
        }
        var pane = $(".item" + data.callId);
        pane.find(".customer").html(name);
    },
    replyChat:function(data,src){
        if (src.hasClass("disabled")) return false;
        var paneId=handler.webchat.curTabId+"_popupWebchat";
        var pane = $("#"+paneId).find(".cust_tab_content");
        var frm= pane.find("form").get(0);
        if(!$.trim(data.content)){
            $().alertmessage('showError', "内容不能为空");
            frm.content.focus();
            return false;
        }
        src.addClass("disabled");
        if(!data.agentFirstReplyTime){
            data.firstReply = true;
            var firstReplyTimeInput = pane.find("input[name='agentFirstReplyTime']");
            firstReplyTimeInput.val(new Date().getTime());
        }else{
            data.firstReply = false;
            delete data.agentFirstReplyTime;
        }
        data.content = encodeURIComponent(data.content);
        var action = {
            action: "app.webchat.replyMsg",
            data: data
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                var row=rep.row;
                if(data.contentType == "text"){
                    pane.find("form").find("textarea[name='content']").val("");
                }
                if(data.uploadTimestamp){
                    $("#"+data.uploadTimestamp).remove();
                }
                row.content = decodeURIComponent(row.content);
                handler.webchat.showMyReply(row,pane.find(".webchat_container"));
            } else {
                $().alertmessage('showError', rep.message||errMsg);
            }
            src.removeClass("disabled");
        },"POST");
    },
    showMyReply: function(wxObj,pane){
        var time=wxObj.createTime;
        var type=wxObj.contentType;
        wxObj.dateTime=time;
        wxObj.type="out";
        var timeDesc="";
        if(time){
            timeDesc=handler.formatChatShortTime(time, true);
        }
        wxObj.timeDesc=timeDesc;
        wxObj.contentDesc=handler.webchat.renderEmoji(wxObj.content);
        wxObj.uidDesc="我";
        handler.webchat._mergeMsg(wxObj,pane,"down");
        var tmpl="tmpl_webchat_msg_to";
        if(type == 'image'){
            wxObj.contentDesc=handler.webchat._getImgView(wxObj.content);
            tmpl= "tmpl_webchat_msg_to_img";
        }
        var container=pane.find(".chat_msg");
        container.find(".msg_inner").append(template(tmpl, wxObj));
        handler.webchat._locationMsg(container);

        //clear badge
        var call_left = handler.webchat._getSubPane("left");
        call_left.find(".item"+wxObj.sid).find(".badge").text("");
    },
    sendImg:function(data,src){
        if (src.hasClass("disabled")) return false;
        var container=src.closest(".webchat_container");
        data.contentType="image";
        data.content="";
        var path=src.attr("ds_attr");
        data.filePath=path;

        var tr=src.closest("tr");
        var table=src.closest("table");
        src.addClass("disabled");
        var action = {
            action: "app.webchat.replyMsg",
            data: data
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                var row=rep.row;
//                var callId = handler.call.curShowPaneCallId+"_popupWebchat";
                handler.webchat.showMyReply(row,container);
                tr.remove();
                if(table.find("tbody>tr").length==0){
                    table.hide();
                }
            } else {
                $().alertmessage('showError', rep.message||errMsg);
            }
            src.removeClass("disabled");
        },"POST");
    },

    _locationMsg:function(container){
        console.log("123");
        window.setTimeout(function(){
            var lastMsg=container.find(".chat_popover:last");
            if(lastMsg.length>0){
                var scrollTop=lastMsg.offset().top-container.offset().top+container.scrollTop()+lastMsg.innerHeight();
                container.scrollTop(scrollTop);
            }
        },500);
        var voices=container.find(".chat_popover.voice");
        voices.each(function(){
            handler.webchat.initAudio($(this));
        });
    },

    _initQiniuImg:function(wxId,pane){
//        var fileId=uuid.v1();
//        var paneId=wxId+"_popupWebchat";
//        var pane =$("#"+paneId);
        var containerId= wxId+'-container-qiniu';
        var progressId= wxId+'-fsUploadProgress';
        var uploader = Qiniu.uploader({
            runtimes: 'flash,html4',
            browse_button: wxId+'-pickfiles',
            multi_selection:false,
            container:containerId,
            drop_element: containerId,
            max_file_size: '10mb',
            flash_swf_url: '/javascripts/qiniu/plupload/Moxie.swf',
            dragdrop: true,
            chunk_size: '4mb',
            uptoken_url: '/action?action=app.weixin.getUptoken&data={}&sessionId=' + session.id,
            domain: "http://7xj0za.com1.z0.glb.clouddn.com/",
            // downtoken_url: '/downtoken',
            unique_names: true,
//            save_key: false,
            // x_vars: {
            //     'id': '1234',
            //     'time': function(up, file) {
            //         var time = (new Date()).getTime();
            //         // do something with 'time'
            //         return time;
            //     },
            // },
            auto_start: true,
            filters: {
                mime_types : [
                    { title : "Image files", extensions : "jpg,jpeg,gif,png,bmp" }
                ]
            },
            init: {
                'FilesAdded': function(up, files) {
                    pane.find(".wx_img_container").show();
//                    $('table').show();
//                    $('#success').hide();
                    plupload.each(files, function(file) {
                        var progress = new FileProgress(file, progressId,"webchat");
                        progress.setStatus("等待...");
                    });
                },
                'BeforeUpload': function(up, file) {
                    var progress = new FileProgress(file, progressId,"webchat");
                    var chunk_size = plupload.parseSize(this.getOption('chunk_size'));
                    if (up.runtime === 'html5' && chunk_size) {
                        progress.setChunkProgess(chunk_size);
                    }
                },
                'UploadProgress': function(up, file) {
                    var progress = new FileProgress(file, progressId,"webchat");
                    var chunk_size = plupload.parseSize(this.getOption('chunk_size'));
                    progress.setProgress(file.percent + "%", up.total.bytesPerSec, chunk_size);
                },
                'UploadComplete': function() {
//                    $('#success').show();
                    $().alertmessage('showSuccess', "图片上传成功");
                },
                'FileUploaded': function(up, file, info) {
                    var progress = new FileProgress(file, progressId,"webchat");
                    progress.setComplete(up, info,"webchat");
//                    console.info("FileUploaded=========");
//                    console.dir(file)
//                    console.dir(info)
//                    var domain = up.getOption('domain');
//                    var res = parseJSON(info);
//                    var sourceLink = domain + info.key; //获取上传成功后的文件的Url
                },
                'Error': function(up, err, errTip) {
//                    $('table').show();
                    pane.find(".wx_img_container").show();
                    var progress = new FileProgress(err.file, progressId);
                    progress.setError();
                    progress.setStatus(errTip);
                }
//                'Key': function(up, file) {
//                     var key = fileId;
//                     // do something with key
//                     return key
//                }
            }
        });
        $('#'+containerId).on(
            'dragenter',
            function(e) {
                e.preventDefault();
                $('#'+containerId).addClass('draging');
                e.stopPropagation();
            }
        ).on('drop', function(e) {
                e.preventDefault();
                $('#'+containerId).removeClass('draging');
                e.stopPropagation();
            }).on('dragleave', function(e) {
                e.preventDefault();
                $('#'+containerId).removeClass('draging');
                e.stopPropagation();
            }).on('dragover', function(e) {
                e.preventDefault();
                $('#'+containerId).addClass('draging');
                e.stopPropagation();
            });
//        uploader.bind('FileUploaded', function() {
//            console.log('hello man,a file is uploaded');
//        });
//        console.info("_initQiniuImg======111111");
//        console.dir(uploader);
    },
    delImg:function(key,src){
        if(!confirm("确认删除此图片吗？"))return;
        var tr=src.closest("tr");
        var table=src.closest("table");
        var action = {
            action: "app.weixin.delFile",
            data: {key:key}
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                var result=rep.data;
                if(!result){
                    tr.remove();
                    if(table.find("tbody>tr").length==0){
                        table.hide();
                    }
                }
//                $().alertmessage('showSuccess', "图片已删除");
            } else {
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    _mergeMsg:function(item,pane,/*up or down*/direction,last,idx){//last,idx分页用到
        item.cls="";
        var type=item.type;
        var container=pane.find(".chat_msg");
        var _setUpItem=function(){
            var firstItem=container.find(".chat_item:first");
            if(firstItem.length>0){
                var _time=firstItem.find("input[name='time']").val();
                var second=getDateDiff(item.dateTime,_time,"second");
                var yes=firstItem.hasClass(type);
                if(yes && second<=60){
                    firstItem.find(".chat_time").hide();
                }
            }
        }
        if(direction=='up'){
            if(last){
                var lastTime=last.dateTime;
                //console.info("lastTime==="+lastTime+",item.dateTime===="+item.dateTime+",idx===="+idx);
                var second=getDateDiff(lastTime,item.dateTime,"second");
                var yes=(last.type==type);
                //console.info("up second==="+second+",yes===="+yes);
                if(yes && second<=60){//60s
                    item.cls="msgTime_hide";
                }
                if(idx===0){
                    _setUpItem();
                }
            }else{
                if(idx===0){
                    _setUpItem();
                }
            }
        }else{
            var lastItem=container.find(".chat_item:last");
            if(lastItem.length>0){
                var lastTime=lastItem.find("input[name='time']").val();
                var second=getDateDiff(lastTime,item.dateTime,"second");
                var yes=lastItem.hasClass(type);
                //console.info("down second==="+second+",yes===="+yes)
                if(yes && second<=60){//60s
                    item.cls="msgTime_hide";
                }
            }
        }
    },
    showMsg: function(wxObj,pane,direction,last,idx){
        //console.dir(pane)
        handler.webchat._mergeMsg(wxObj,pane,direction,last,idx);
        var time=wxObj.dateTime;
        var msgType=wxObj.contentType;
        //wxObj.timeDesc=time?time.substring(0,16):"";
        var timeDesc="";
        if(time){
            timeDesc=handler.formatChatShortTime(time, true);
        }
        if(wxObj.message){
            try{
                wxObj.message = decodeURIComponent(wxObj.message);
            }catch(e){
                wxObj.message = wxObj.message.replace(/%26/g, "&");
                wxObj.message = wxObj.message.replace(/%23/g, "#");
                wxObj.message = wxObj.message.replace(/%3A/g, ":");
                wxObj.message = wxObj.message.replace(/%24/g, "$");
                wxObj.message = wxObj.message.replace(/%40/g, "@");
                wxObj.message = wxObj.message.replace(/%2B/g, "+");
                wxObj.message = wxObj.message.replace(/%3D/g, "=");
                wxObj.message = wxObj.message.replace(/%2F/g, "/");
            }
        }
        wxObj.timeDesc=timeDesc;
        wxObj.contentDesc=wxObj.message;
        wxObj.uidDesc="";
        var uid=wxObj.user;
        var type=wxObj.type;//in,out
        var tmpl="";
        var isEsc=false;
        if(type=='out'){
            var user={displayName:"我"};
            if(uid!=session.id){
                user=getCache("agents",uid)||{displayName:'NA'};
            }
            wxObj.uidDesc=user.displayName;
            if(uid=='system'){
                wxObj.uidDesc="系统"
            }
            if(uid == "robot"){
                wxObj.uidDesc = "机器人小智";
            }

            if(msgType=='text'){
                if(wxObj.showHtml == true || wxObj.showHtml == "true"){
                    isEsc = true;
                }
                tmpl="tmpl_webchat_msg_to";
            }else if(msgType=='image'){
                isEsc=true;
                wxObj.contentDesc=handler.webchat._getImgView(wxObj.contentDesc);
                tmpl="tmpl_webchat_msg_to_img";
            }else if(msgType=='voice'){
                tmpl="tmpl_webchat_msg_to_voice";
            }else{
                tmpl="tmpl_webchat_msg_to";
            }
        }else if(type == 'imcsr'){
            tmpl="tmpl_webchat_msg_from_system";
        }else{
            if(msgType=='text'){
                if(wxObj.showHtml == true || wxObj.showHtml == "true"){
                    isEsc = true;
                }
                tmpl="tmpl_webchat_msg_from";
            }else if(msgType=='image'){
                isEsc=true;
                wxObj.contentDesc=handler.webchat._getImgView(wxObj.contentDesc);
                tmpl="tmpl_webchat_msg_from_img";
            }else if(msgType=='voice'){
                tmpl="tmpl_webchat_msg_from_voice";
            }else{
                tmpl="tmpl_webchat_msg_to";
            }
        }
        if(wxObj.contentDesc){
            wxObj.contentDesc=handler.webchat.renderEmoji(wxObj.contentDesc,isEsc);
            //wxObj.contentDesc=handler.webchat.renderUrlLink(wxObj.contentDesc);
        }
        if(msgType=='text'){
            handler.webchat.autoMatchMsg(wxObj.contentDesc,pane);
        }

        //tmpl=DS.renderMethodViewNew(tmpl,wxObj);
        tmpl=template(tmpl,wxObj);
        return tmpl;
    },


    test:function(){
        var evtJson={
            Event:"NewWebchat",
            Command:"Event",
            Data:{
                MessageId:"e82bec80-ea30-1234-8181-2d38ce09c159",
                AccessId:"79fa56a0-40d1-11e5-8bcb-f3d7d2578a5f",
                Account:'N00000000143',
                MsgType:"newMsg",
                Content:'通话听不清楚，什么原因？',
                Pbx:'1.1.1.101',
                CreateTime:'2015-08-18 17:48:20',
                Sid:"1234"
            }
        }
        handler.webchat.dispatch(evtJson);
    },

    /*****************webchat manage start*****************/


    _initUserHistory:function(pane,sid){
        var container=pane.find(".chat_msg");
        var _container=container.find(".msg_inner");
        container.scroll(function(){
            var load = "<div class='wxloading'><img src='./img/client/loading.gif'>加载中</div>";
            var end = "<div class='wxend'>已到达顶部<div>";
            var scrollTop=container.scrollTop();
            var page=container.attr("ds_attr");
            var time=container.attr("ds_time");
            page=parseInt(page,10);
            if(page==0){
                return;
            }
            //console.info("page==="+page);
            if(scrollTop==0){
                $(load).prependTo(_container).css("display","block");
                var param={
                    page:page,
                    sessionId:sid,
                    createTime:time
                }
                var action = {
                    action: "app.webchat.queryUserHistory",
                    data: param
                };
                DS.send(action, function (rep) {
                    if (rep.success) {
                        page++;
                        var lastTime=time;
                        container.attr("ds_attr",page);
                        container.find(".wxloading").remove();
                        var list=rep.list;
                        var html=[];
                        if(list.length>0){
                            var idx=list.length-1;
                            for (var i = idx; i >=0; i--) {
                                var obj = list[i];
                                if(i==idx){
                                    lastTime=obj.createTime;
                                }
                                var last=null;
                                if(i<idx){
                                    last=list[i+1];
                                }

                                html.push(handler.webchat.showMsg(obj,pane,"up",last,i));
                            }
                            _container.prepend(html.join(""));
                            container.scrollTop(150);
                        }else{
                            $(end).prependTo(_container);
                            container.attr("ds_attr",0);
                        }
                    } else {
                        $().alertmessage('showError', rep.message||errMsg);
                    }
                },null,null,true);

            }
        });
    },
    showFieldDesc:function(type,val,val2){
        var desc='';
        if(type=='status'){
            var _desc=getDicCacheName("mailStatus",val);
            var badge='&nbsp;<span class="badge badge-important">'+val2+'</span>';
            if(val=='undeal'||val=='leak'||val=='assign'){
                desc=_desc+badge;
            }else if(val=='deal'){
                desc=_desc;
            }
        }else if(type=='chatStatus'){
            desc=getDicCacheName("chatStatus",val);
            //console.log("showFieldDesc:"+desc);
//        }else if(type=='agent'){
//            var _agent=getCache("agents", val);
//            if(_agent){
//                desc=_agent.displayName;
//            }
        }
        return desc;
    },
    /*****************webchat manage end*****************/
    /*showChatHistory: function(uid,src){
        var pane=$('#batch_modal');
        DS.getView("webchat/webchat_history", function (view) {
            pane.find('.modal-title').text('聊天记录');
            //var _data={
            //    qiniuId:'user-his',
            //    userID:userId,
            //    openID:''
            //}
            //view = DS.renderViewNew(view, _data);
            pane.find(".modal-body").html(view);
            pane.find(".reply_close").show();
            var container=pane.find(".chat_msg");
            var param={
                page:1,
                sessionId:uid,
                limit:handler.webchat.limit
            }
            var action = {
                action: "app.webchat.queryUserHistory",
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
                            //if(i==idx && flag!='cust'){
                            //    pane.find('input[name="accessId"]').val(obj.accessId);
                            //}
                            html.push(handler.webchat.showMsg(obj,pane));
                        }
                        container.prepend(html.join(""));
                    }
                    handler.webchat._locationMsg(container);
                }else{
                    $().alertmessage('showError', rep.message||errMsg);
                }
            },null,null,true);
            handler.webchat._initUserHistory(pane,uid);
            pane.width(700);
            pane.css({'z-index':1060});
            pane.modal();
        });
    },*/
    emojiFaces: [
        ['smile', 'smiley', 'laughing', 'blush'],
        ['heart_eyes', 'smirk', 'flushed', 'kissing_heart'],
        ['grin', 'wink', 'stuck_out_tongue_winking_eye', 'stuck_out_tongue_closed eyes'],
        ['sleeping', 'worried', 'expressionless', 'sweat_smile'],
        ['joy', 'cold_sweat', 'sob', 'angry'],
        ['mask', 'scream', 'sunglasses', 'heart'],
        ['broken_heart', 'star', 'anger', 'exclamation'],
        ['question', 'zzz', 'thumbsup', 'thumbsdown'],
        ['ok_hand', 'punch', 'yeah', 'clap'],
        ['muscle', 'pray', 'skull', 'trollface']
    ],
    initFace: function (pane) {
        var face_ul = pane.find(".face_con").find("ul");
        var x = 25, y = 25;
        var emojiFaces = handler.webchat.emojiFaces;
        for (var i = 0; i < emojiFaces.length; i++) {
            for (var j = 0; j < emojiFaces[i].length; j++) {
                var li = '<li title="' + emojiFaces[i][j] + '"><span ds_data="' + emojiFaces[i][j] + '" ds_action="webchat.getEmojiCode" title="' + emojiFaces[i][j] + '" class="ds_do_action emoji-face" style="background-position: ' + (-(x * j)) + 'px ' + (-(y * i)) + 'px;"></span></li>';
                face_ul.append(li);
            }
        }
    },
    initQiniuUploadForWebchat:  function(pane, sid){
        var progressId= 'webchat_upload_progress_show';
        var uploader = QiniuWebchat.uploader({
            runtimes: 'html5,flash,html4',
            browse_button: 'webchat_msg_image_btn_'+sid,
            multi_selection:false,
            max_file_size: '10mb',
            flash_swf_url: '/javascripts/qiniu/plupload/Moxie.swf',
            dragdrop: false,
            chunk_size: '4mb',
            uptoken_url: '/action?action=app.webchat.getImUptoken&data={}&sessionId=' + session.id,
            domain: "http://7xntwc.com2.z0.glb.qiniucdn.com/",
            // downtoken_url: '/downtoken',
            unique_names: false,
            save_key: false,
            auto_start: true,
            filters: {
                mime_types : [
                    { title : "Image files", extensions : "jpg,jpeg,gif,png,bmp" }
                ]
            },
            init: {
                'FilesAdded': function(up, files) {
                    plupload.each(files, function(file) {
                        var uploadTimestamp = new Date().getTime();
                        file.uploadTimestamp = uploadTimestamp;
                        up.uploadTimestamp = uploadTimestamp;
                        var container=pane.find(".chat_msg");
                        container.find(".msg_inner").append(template("tmpl_webchat_msg_to_uploading_img",{timestamp: uploadTimestamp}));
                        handler.webchat._locationMsg(container);
                    });
                },
                'BeforeUpload': function(up, file) {
                    console.log('BeforeUpload');
                    //if($('.webchat_companyLogo_container').find('tbody').find('tr').length > 0){
                    //    $('.webchat_companyLogo_container').find('tbody').find('tr').find('a.ds_do_action').click();
                    //}
                    var progress = new FileProgress(file, progressId);
                    var chunk_size = plupload.parseSize(this.getOption('chunk_size'));
                    if (up.runtime === 'html5' && chunk_size) {
                        progress.setChunkProgess(chunk_size);
                    }
                },
                'UploadProgress': function(up, file) {
                    console.log('UploadProgress');
                    //var progress = new FileProgress(file, progressId);
                    //var chunk_size = plupload.parseSize(this.getOption('chunk_size'));
                    //progress.setProgress(file.percent + "%", up.total.bytesPerSec, chunk_size);
                },
                'UploadComplete': function() {
                    console.log("uploadcomplete all");

                },
                'FileUploaded': function(up, file, info) {
                    var domain = up.getOption('domain');
                    var res = JSON.parse(info);
                    var sourceLink = domain + res.key; //获取上传成功后的文件的Url
                    var uploadTimestamp = file.uploadTimestamp;
                    var sid = pane.find("input[name=sid]").val();
                    var sessionId = pane.find("input[name=sessionId]").val();
                    var platform = pane.find("input[name=platform]").val();
                    var accessId = pane.find("input[name=accessId]").val();
                    var firstReplyTime = pane.find("input[name=agentFirstReplyTime]").val();
                    var manualTime = pane.find("input[name=manualTime]").val();
                    var lastRedirectTime = pane.find("input[name=lastRedirectTime]").val();
                    var data = {
                        sid: sid,
                        contentType:"image",
                        sessionId: sessionId,
                        platform: platform,
                        accessId: accessId,
                        agentFirstReplyTime: firstReplyTime,
                        manualTime: manualTime,
                        content: sourceLink,
                        uploadTimestamp: uploadTimestamp
                    };
                    handler.webchat.replyChat(data, pane.find(".reply_webchat"));

                },
                'Error': function(up, err, errTip) {
                    $("#" + up.uploadTimestamp).find("img").attr("src", "img/client/customer/uploadError.png");
                    $().alertmessage("showError", errTip);
                },
                'Key': function(up, file) {
                    console.log(999);
                    var accessId = pane.find("input[name=accessId]").val();
                    console.log(accessId);
                    var date=getCurrentDate();
                    var today = new Date();
                    var time=today.getTime();
                    var fileName=file.name;
                    var fileSuffix="";
                    if(fileName){
                        fileSuffix = fileName.substring(fileName.lastIndexOf('.'), fileName.length);
                    }
                    var key = "im/"+accessId+"/"+date+"/"+time+"/"+uuid.v1()+fileSuffix;
                    return key;
                }
            }
        });
    },
    renderEmoji: function (message,isEsc) {
        var x = 25, y = 25;
        if (!message) return "";
        if(!isEsc){
            message=escapeChatHtml(message);
        }
        var ary=handler.webchat.emojiFaces||[];
        for (var i = 0; i < ary.length; i++) {
            for (var j = 0; j < ary[i].length; j++) {
                var item=ary[i][j];
                if(message.indexOf(item)!=-1){
                    var span = '<span class="emoji-face" style="background-position: ' + (-(x * j)) + 'px ' + (-(y * i)) + 'px;"></span>';
                    var pattern = new RegExp(":" + item + ":", "g");
                    message = message.replace(pattern, span);
                }
            }
        }
        return message;
    },

    //renderUrlLink: function(message){
    //    var aTmpl = "<a target='_blank' href='__urlLink'>__urlLink</a>";
    //    var reg = new RegExp("http://|https://", g);
    //
    //},

    showEmojiFaces: function (data, src) {
        var face_con = src.siblings(".face_con");
        var face_arrow = src.siblings(".face_arrow");
        if(face_con.css("display") == "none"){
            face_con.css("display", "block");
            face_arrow.css("display", "block");
        }else{
            face_con.css("display", "none");
            face_arrow.css("display", "none");
        }

    },

    getEmojiCode: function (data, src) {
        var pane= src.closest(".webchat_container");
        var text = pane.find("textarea[name='content']");
        text.val(text.val() + ":" + data + ":");
        text.focus();
        pane.find(".face_con").css("display", "none");
        pane.find(".face_arrow").css("display", "none");
    },
    _syncCardLimit:function(sid){
        var idx=$.inArray(sid,handler.webchat.users);
        if(idx!=-1){
            handler.webchat.users.splice(idx, 1);
        }
    },
    _checkLimit:function(uid){
        var self = this;
        var count=0;
        if(!utils.contains(self.users, uid)){
            self.users.push(uid);
        }else{
            count++;
        }

        return count;
    },
    _initDic:function(pane){
        var dics=getCache('channelDic');
        var _dics=[];
        for (var i = 0; i < dics.length; i++) {
            var obj = dics[i];
            if(obj.type=="webchat"){
                _dics=obj.options||[];
                break;
            }
        }
        var tmpl='<li><a href="#" class="ds_do_action" ds_action="webchat.closeSession" ds_data="_#key#_">_#name#_</a></li>';
        var html=[];
        for (var i = 0; i < _dics.length; i++) {
            var obj = _dics[i];
            html.push(DS.renderViewNew(tmpl,obj));
        }
        pane.find(".stop_session").closest("ul").html(html.join(""));
    },
    _getChatOnlineAgent:function(currentId,hideMe, peerId){
        var agents=utils.loadUsers2Chat(true,true,currentId,hideMe);
        var onlines=getCache("onlineChannelAgent");
        var peer= getCache("accessChannelAgent", peerId);
        var accessAgents= [];
        if(peer){
            accessAgents = peer.agents;
        }
        var  resultAgents = [];
        var  resultAgents2 = [];
        for(var i=0; i< accessAgents.length; i++){
            var agent = accessAgents[i];
            for(var j=0; j<agents.length; j++){
                var _agent=agents[j];
                if(_agent._id==agent.agentID){
                    resultAgents.push(_agent);
                    break;
                }
            }
        }
        for(var i=0;i<onlines.length;i++){
            var agent=onlines[i];
            for(var j=0;j<resultAgents.length;j++){
                var _agent=resultAgents[j];
                if(_agent._id==agent._id){
                    _agent.online = true;
                    resultAgents2.push(_agent);
                    break;
                }
            }
        }
        return resultAgents2;
    },
    transferAgent:function(data,pane){
        var sid=data._id;
        var chatUid=data.sid;
        var owner=data.user;
        var peerId = data.toPeer;
        pane.find("#combobox_webchat_owner_desc").click(function(){
            $(this).hide();
            pane.find("#combobox_webchat_owner").show().focus();
        });
        pane.find("#combobox_webchat_owner" ).combobox2({
            minLength:0,
            displayField:pane.find("#combobox_webchat_owner_desc"),
            source: function( request, response ) {
                var agents=handler.webchat._getChatOnlineAgent(owner,true, peerId);
                var matcher = new RegExp( "^" + $.ui.autocomplete.escapeRegex( request.term ), "i" );
                if(request.term){
                    response( $.grep(agents, function( item ){
                        return matcher.test(item.displayName)||matcher.test(item.exten)||matcher.test(item.pinyin);
                    }) );
                }else{
                    response(agents);
                }
            },
            select: function( event, ui ) {
                //console.dir(ui)
                var _owner=ui.item._id;
                var uname=ui.item.displayName||'';
                //var src = $(event.currentTarget);
                var paneId=sid+"_popupWebchat";
                var right=$("#"+paneId);
                var left=handler.webchat._getSubPane("left");

                var action = {
                    action: 'app.webchat.redirectWebchatSession',
                    data: {_id:sid,toUser:_owner,toUserName:uname,sid:chatUid}
                };
                DS.send(action,function(rep){
                    if(rep.success){
                        pane.find("#combobox_webchat_owner_desc").attr("uid",_owner);
                        //pane.find( "#combobox_webchat_owner_desc" ).text(ui.item.displayName);
                        pane.find( "#combobox_webchat_owner").blur();
                        if(_owner!=owner){
                            handler.webchat._syncCardLimit(sid);
                            right.remove();
                            left.find(".normal_search").click();
                        }
                        if(handler.webchat.haveClaim){
                            handler.webchat.autoClaimWebchatSession();
                        }
                        handler.webchat.curDealCount = handler.webchat.curDealCount - 1;
                    }else{
                        $().alertmessage('showError', rep.message || errMsg);
                    }
                });
                return false;
            },
            open: function(event, ui) {
                var instance=pane.find("#combobox_webchat_owner").data("custom-combobox");
                var _owner=pane.find("#combobox_webchat_owner_desc").attr("uid");
                if(_owner=='NA'){
                    _owner="";
                }
                var val=pane.find("#combobox_webchat_owner").val();
                if(instance && !val){
                    var container=instance.menu.element;
                    container.find("li").each(function(i){
                        var _uid=$(this).attr("uid");
                        if(_uid==_owner){
//                                $(this).addClass("ui-state-focus");
                            $(this).css({'background-color':'#08c','color':'#fff'});
                            var _scrollTop=$(this).offset().top-container.offset().top+container.scrollTop();
                            container.animate({scrollTop:_scrollTop-65},"fast");
                        }
                    })
                }
            }
        })
    },
    _addTodoCard:function(chatSession){
        var _p=$("#view_webchat_todo");
        var container=_p.find('.list-inside');
        if(container.length>0){
            if(container.find(".list_item").length==0){
                container.empty();
            }
            handler.webchat._renderChatItem(chatSession,"webchat.showTodoWebchatDetail");
            var card=template("tmpl_webchat_item",chatSession);
            container.prepend(card);
        }
    },
    _addOpenCard:function(chatSession){
        var _p=$("#view_webchat_open");
        var container=_p.find('.list-inside');
        if(container.length>0){
            if(container.find(".list_item").length==0){
                container.empty();
            }
            handler.webchat._renderChatItem(chatSession,"webchat.showWebchatDetail");
            var card=template("tmpl_webchat_item",chatSession);
            container.prepend(card);
        }
    },
    claimWebchatSession:function(sid,src){
        var item=src.closest(".list_item");
        var action = {
            action: "app.webchat.claimWebchatSession",
            data: {_id:sid}
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                var chatSession=rep.row;
                item.remove();
                handler.webchat.refreshBadge(1,"getChat");
                handler.webchat._addTodoCard(chatSession);
                var paneId=sid+"_relocationWebchat";
                var call_right=$("#"+paneId);
                call_right.remove();
                $().alertmessage('showSuccess',"已领取，请到“待处理”中查看");
            } else {
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    autoClaimWebchatSession:function(obj){
        console.log(handler.webchat.curDealCount+"==="+session.user.imDealCount);
        var autoClaim = handler.webchat.autoClaim;
        if(obj && obj.todoNum){
            handler.webchat.curDealCount = obj.todoNum;
        }
        if(!autoClaim || handler.webchat.curDealCount >= session.user.imDealCount){
            handler.webchat.haveClaim = true;
            if(obj && (obj.todoNum || obj.openNum)){
                handler.webchat.refreshMenuBadge(false, obj.todoNum, obj.openNum);
            }
            return;
        }
        console.log('---autoClaimWebchatSession --- run--' +handler.webchat.curDealCount);
        var action = {
            action: "app.webchat.autoClaimWebchatSession",
            data: {
                curDealCount:handler.webchat.curDealCount //当前正在处理的对话数量
            }
        };
        try{
            handler.webchat.haveClaim = false;
            DS.send(action, function (rep) {
                handler.webchat.haveClaim = true;
                if (rep.success) {
                    console.log('--------autoClaimWebchatSession ---- end');
                    console.dir(rep.list);
                    if(rep.list){
                        console.log('--------autoClaimWebchatSession ---- '+rep.list.length);
                        for(var i = 0; i<rep.list.length; i++){
                            handler.webchat.webchatTodoItemAdd(rep.list[i]);
                        }
                        handler.webchat.curDealCount = handler.webchat.curDealCount + rep.list.length;
                        handler.webchat.refreshMenuBadge(true);
                        //console.log("curCount:"+handler.webchat.curDealCount);
                        //handler.webchat.refreshQueryBadge('webchat_todo',handler.webchat.curDealCount);
                        if(rep.list.length> 0){
                            emitNotify("您有新的消息", "领取了新的会话");
                        }
                    }
                } else {
                    $().alertmessage('showError', rep.message||errMsg);
                }

            });
        }catch(e){
            handler.webchat.haveClaim = true;
        }

    },

    updateAutoClaimWebchatSessionStatus: function(status){
        var action = {
            action: "app.webchat.updateAutoClaimWebchatSessionStatus",
            data: {
                status:status //当前状态
            }
        };

        DS.send(action, function(rep){
            //if (rep.success) {
            //
            //} else {
            //
            //}
        });
    },

    closeSession:function(key,src){
        if($("#endsession .btn-container button").attr("ds_data")==""){
            $().alertmessage('showError',"请选择要关闭的会话分类");
            return false;
        }else{
            $('#endsession').modal('hide');
        }
        var finishReason=$("#session_name").attr("ds_data");
        //var pane = $("#view_webchat_todo_content .webchat_container");
        var pane1 = $("#view_webchat_todo_content .webchat_container:visible");
        var sid = pane1.find("input[name='sid']").val();
        var _id = pane1.find("input[name='sessionId']").val();
        var key=$("#session_name").val();
        var paneId=_id+"_popupWebchat";
        var call_right=$("#"+paneId);
        var pane=handler.webchat._getSubPane("left");
        //var itemPane= pane.find(".item"+_id);
        var action = {
            action: 'app.webchat.finishWebchatSession',
            data: {_id:_id, sid:sid, finishReason: finishReason,finishKey:key}
        };
        DS.send(action,function(rep){
            if(rep.success){
                //itemPane.closest(".list_item").remove();
                handler.webchat._syncCardLimit(_id);
                call_right.remove();
                if(handler.webchat.curDealCount > 0){
                    handler.webchat.curDealCount = handler.webchat.curDealCount - 1;
                }
                pane.find(".normal_search").click();
                if(handler.webchat.haveClaim){
                    handler.webchat.autoClaimWebchatSession();
                }
                handler.cancelDealToolbar("webchat");
            }else{
                $().alertmessage('showError', rep.message || errMsg);
            }
        });
    },
    batchCloseSessions:function (key,src){
        if($("#endsession .btn-container button").attr("ds_data")==""){
            $().alertmessage('showError',"请选择要关闭的会话分类");
            return false;
        }else{
            $('#endsession').modal('hide');
        }
        var finishReason=$("#session_name").attr("ds_data");
        var pane = $("#view_webchat_todo");
        var list = pane.find(".select_on");
        var data = {"finishReason": finishReason,"finishKey": key};
        var list_arr = [];
        for(var i = 0; i < list.length; i++) {
            var obj = $(list[i]).find(".item_row");
            var sid = obj.attr("ds_attr");
            var _id = obj.attr("ds_data");
            var tmpl = {
                "_id": _id,
                "sid": sid,
            };
            list_arr.push(tmpl);
        }
        data.finishiArr = list_arr;
        var action = {
            action: 'app.webchat.finishWebchatSession',
            data: data
        };
        DS.send(action,function(rep){
            if(rep.success){
                list.remove();
                if(handler.webchat.curDealCount > 0){
                    handler.webchat.curDealCount = (handler.webchat.curDealCount - list.length) >=0?handler.webchat.curDealCount - list.length:0;
                }
                for(var i=0; i<list_arr.length; i++){
                   $("#"+list_arr[i]._id+"_popupWebchat").remove();
                }
                handler.webchat.refreshBadge(-list.length, "todo");
                handler.cancelDealToolbar("webchat");
                if(handler.webchat.haveClaim){
                    handler.webchat.autoClaimWebchatSession();
                }
                handler.cancelDealToolbar("webchat");
            }else{
                $().alertmessage('showError', rep.message || errMsg);
            }
        });
    },
    saveSessionRemark: function(data, src){
        var pane = src.closest(".webchat_container");
        var remarkText = pane.find("textarea[name='remark']");
        if(!$.trim(remarkText.val())){
            remarkText.css("outline","none");
            remarkText.css("box-shadow", "none");
            remarkText.css("border", "none");
            return false;
        }
        var accessId = pane.find("input[name='accessId']").val();
        var sid = pane.find("input[name='sessionId']").val();
        var content = remarkText.val();
        var action = {
            action: 'app.webchat.updateWebchatSessionRemark',
            data: {accessId:accessId, sid:sid, content: content}
        };
        DS.send(action,function(rep){
            if(rep.success){
                remarkText.css("outline","none");
                remarkText.css("box-shadow", "none");
                remarkText.css("border", "none");
                $().alertmessage('showSuccess', '会话备注保存成功');
            }else{
                $().alertmessage('showError', rep.message || errMsg);
                remarkText.focus();
            }
        }, "POST", null, true);
    },

    editWebChatRemark: function(data, src){
        var pane = src.closest(".webchat_container");
        var remarkText = pane.find("textarea[name='remark']");
        remarkText.css("outline","none!important");
        remarkText.css("border", "1px solid #cccccc");
        remarkText.css("box-shadow", "");
    },

    initQuickReply: function(pane){
        var action = {
            action: 'app.webchat.getQuickReplyList',
            data: {account:session.account}
        };
        DS.send(action, function(rep){
            var quickReplyView = template("tmpl_webchat_quickreply_list", rep);
            pane.find(".span3").append(quickReplyView);
        });
    },

    editQuickReply: function(data, src){
        var span = src.closest(".span3");
        var listpane = span.find(".webchat_quickreply_list");
        var editpane = span.find(".webchat_quickreply_edit");
        listpane.css("display", "none");
        editpane.css("display", "block");

    },

    saveQuickReply: function(data, src){
        var action = {
            action: 'app.webchat.saveQuickReply',
            data: {quickreplys: data.quickreplys}
        };
        DS.send(action, function(rep){
            if(rep.success){
                var pane1 = src.closest(".call_detail");
                var pane = src.closest(".webchat_quickreply_container");
                $().alertmessage('showSuccess', '快捷回复保存成功');
                pane.remove();
                handler.webchat.initQuickReply(pane1.find(".cust_tab_content"));
                pane1.siblings().each(function(){
                    $(this).find(".webchat_quickreply_container").remove();
                    handler.webchat.initQuickReply($(this).find(".cust_tab_content"));
                });

            }else{
                $().alertmessage('showError', rep.message || errMsg);
            }
        });
    },

    cancelEditQuickReply: function(data, src){
        var span = src.closest(".span3");
        var listpane = span.find(".webchat_quickreply_list");
        var editpane = span.find(".webchat_quickreply_edit");
        listpane.css("display", "block");
        editpane.css("display", "none");
    },

    addQuickReply: function(data, src){
        var editContainer = src.closest(".webchat_quickreply_edit_container");
        var quickReplyItem = template("tmpl_webchat_quickreply_edit");
        editContainer.append(quickReplyItem);
    },

    removeQuickReply: function(data, src){
        var div = src.closest(".quickreply_item");
        div.remove();
    },

    sendQuickReply: function(data, src){
        var webchatContainer = src.closest(".webchat_container");
        //var chatinput = webchatContainer.find("textarea[name='content']");
        //chatinput.val(chatinput.val() + data);
        var formData = DS.util.getDataOfForm(webchatContainer.find("form"));
        var webchatData = formData.data;
        webchatData.content = data;
        delete webchatData.quickreplys;
        handler.webchat.replyChat(webchatData, webchatContainer.find(".reply_webchat"));
    },

    initAudio:function(pane){
        //var pane=$(".chat_popover.voice");
        var container=pane.closest(".chat_msg");
        var src= pane.find(".audio_item");
        var audio=src.get(0);
        //console.dir(pane)
        //console.dir(audio)
        pane.unbind("click");
        pane.bind("click", function() {
            //console.info("pane.hasClass==="+pane.hasClass("played"))
            if(pane.hasClass("played")){
                audio.pause();
                audio.currentTime = 0;
                pane.removeClass("played");
                pane.find(".audio_play").hide();
                pane.find(".audio_default").show();
            }else{
                container.find(".audio_item").each(function(){
                    this.pause();
                    this.currentTime = 0;
                    var _p=$(this).closest(".chat_popover.voice");
                    _p.removeClass("played");
                    _p.find(".audio_play").hide();
                    _p.find(".audio_default").show();
                });
                audio.play();
                pane.addClass("played");
            }
        });

        src.bind("loadeddata", function() {
            var timeLen=audio.duration;
            timeLen=Math.ceil(parseFloat(timeLen));
            pane.find(".audio_len").text(timeLen+"''");
            var _content=pane.find(".chat_popover-content");
            var w=_content.width();
            if(timeLen>1){
                w+=Math.ceil(timeLen*5);
                w=w>360?360:w;
                _content.width(w);
            }
        });
        src.bind("play", function() {
            pane.find(".audio_default").hide();
            pane.find(".audio_play").show();
        });
        src.bind("ended", function() {
            pane.find(".audio_play").hide();
            pane.find(".audio_default").show();
        })
    },

    autoMatchMsg:function (str,pane){
        //console.info("autoMatchMsg===="+str)
        //console.dir(pane)
        var regName=/[\s,.\?;!、，。？；！ ]+(.*(先生|小姐|女士|男士|公司))/gm;
        var regName2=/(.*(先生|小姐|女士|男士|公司))/gm;
        var regPhone=/((\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$)/gm;
        var container=pane.find(".cust_base_fields");
        var ary=regName.exec(str);
        if(ary&& ary.length>0){
            var val=container.find("input[name=custName]").val();
            if(!val){
                container.find("input[name=custName]").val(RegExp.$1);
            }
        }else{
            var _ary=regName2.exec(str);
            if(_ary&& _ary.length>0) {
                var val=container.find("input[name=custName]").val();
                if(!val){
                    container.find("input[name=custName]").val(RegExp.$1);
                }
            }
        }

        var ary1=regPhone.exec(str);
        if(ary1&& ary1.length>0){
            var val=container.find("input[name=custPhone]").val();
            if(!val){
                container.find("input[name=custPhone]").val(ary1[0]);
            }
        }
    },
    getIvr:function(){
        //获取座席会话数范围
        var action = {
            action: 'config.user.getCurrentUser'
        };
        DS.send(action, function (response) {
            console.log(response);
            if (response.success) {
                var user = response.user;
                if(user){
                    var max = parseInt(user.maxImDealCount);
                    var min = parseInt(user.minImDealCount);
                    for(var i=min;i<=max;i++){
                        $('#imDealCount').append("<option value='"+i+"'>"+i+"</option>");
                    }
                    $('#imDealCount').val(user.imDealCount);

                }
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    updateIvrCount:function(flag){
        var imDealCount = $('#imDealCount  option:selected').val();
       if(!imDealCount){
           imDealCount = 1;
       }
        var action = {
            action: "config.user.updataCurrentUser",
            data: {
                imDealCount:imDealCount
            }
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                session.user.imDealCount = parseInt(imDealCount);
                if(!flag){
                    $().alertmessage('showSuccess', "修改座席会话数量成功");
                }
                if(handler.webchat.haveClaim){
                    handler.webchat.autoClaimWebchatSession();
                }
            }else{
                if(!flag){
                    $().alertmessage('showError',rep.message||errMsg);
                }

            }
        })
    },
    endSession: function(data) {
        var pane = $("#show_end_session");
        DS.getView("webchat/end_session", function (view) {
            pane.empty();
            pane.html(view);
            //pane.find('.tab-content').html(view_ul);
            //根据层级不同显示不同样式
            var level=handler.config.channelDic.getDicLevel("webchat");
            var container=$("#tab-Content .dic_content");
            if(level==2){
                container.empty();
                container.html("<div class='diction-subject span6 dic_level_1 two_lever_session'><div class='channel_dic_list'></div></div><div class='diction-subject span6 dic_level_2'><div class='channel_dic_list'></div></div>");
            }
            if(level==1){
                container.empty();
                container.html("<div class='diction-subject span12 dic_level_1 one_lever_session'><div class='channel_dic_list'></div></div><div class='channel_dic_list'></div></div>");
            }
            var dics=getCache('channelDic');
            var _dics=[];
            for (var i = 0; i < dics.length; i++) {
                var obj = dics[i];
                if(obj.type=="webchat"){
                    _dics=obj.options||[];
                    break;
                }
            }
            console.log(_dics);
            if(_dics.length==0){
                $().alertmessage('showError', "请通知管理员设置‘结束会话类别’");
                return;
            }
            for (var i = 0; i < _dics.length; i++) {
                var obj = _dics[i];
                obj.level=i;
                obj.lastLevel="";
                var tmplObj=$("#channel_dic_show");
                var tmpl=tmplObj.html()||'';
                tmpl=DS.renderViewNew(tmpl,obj);
                pane.find(".tab-content .dic_level_1>.channel_dic_list").append(tmpl);
            }
            //添加样式
            var forTree = function (o) {
                for (var i = 0; i < o.length; i++) {
                    if (o[i]["options"] !== null&& typeof o[i]["options"]!== "undefined"&&o[i]["options"].length!==0) {
                        $("#tab-Content .dic_level_1").find(".dic_item").eq(i).find("b").addClass("has_sub_style");
                    }
                }
            };
            forTree(_dics);
            if (data=="webchat") {
                $("#endsession .btn-container button").attr("ds_action","webchat.batchCloseSessions");
            }
            $("#endsession").modal({backdrop:'static', keyboard:false});
        });
    },
    clearSessionKey:function(){
        $("#session_name").val('');
    },
    pushImCSRInfo:function(data, src){
        var webchatContainer = src.closest(".webchat_container");
        var formData = DS.util.getDataOfForm(webchatContainer.find("form"));
        var webchatData = formData.data;
        delete webchatData.quickreplys;
        var action = {
            action: 'app.webchat.pushImCSRInfo',
            data: webchatData
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                var obj = {
                    sysNotice: true,
                    Platform:webchatData.platform,
                    Sid:webchatData.sid,
                    CreateTime:rep.time,
                    Content:'评价已发出',
                    sessionId:webchatData.sessionId
                }
                handler.webchat.loadInboxInfo(obj,webchatData.sessionId+"_popupWebchat");
            } else {
                $().alertmessage('showError', rep.message||errMsg);
            }

        },"POST");
    },
    batchEndSessions: function(data) {
        var pane = $("#view_webchat_todo");
        var list = pane.find(".select_on");
        if(list.length>0){
            handler.webchat.endSession(data);
        }else{
            $().alertmessage('showError',"请选择要关闭的会话分类");
        }
    }
}

