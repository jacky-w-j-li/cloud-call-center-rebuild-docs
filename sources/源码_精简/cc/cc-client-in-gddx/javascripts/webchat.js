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
    timerList : [],         //存储计时器的容器
    finishKeyFlag: false, // 检测高级搜索中是否已选择处理结果
    advancedSearchData: {}, // 存储高级搜索条件
    skillGroup: [],
    webchatCardShow: null, //
    webchayOnlineStatus:0,
    webchat_main:function(menu){
        var pane=$(handler.webchat.cid);
        handler.webchat.initBadge();
        pane.find(".btn_webchat_todo").click();
        handler.webchat.webchatKmPopoverInit();
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
        var action = {
            action: 'app.webchat.getWebchatTodoShowConfig',
            data:{}
        };
        DS.send(action,function(rep){
            if(rep.success){
                var _data = {
                    status: true,
                    source: true,
                    skillGroup: true
                };
                if(rep.data){
                    _data = {
                        status: rep.data.status,
                        source: rep.data.source,
                        skillGroup: rep.data.skillGroup
                    };
                }
                handler.webchat.webchatCardShow = _data;
            }else{
                $().alertmessage('showError', errMsg);
            }

        },"",false);
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

        var _dics=handler.config.channelDic._getChannelDic("webchat");
        var _wechatCSR= handler.config.channelDic._getChannelDic("webchatCSR");
        var _webchatSeoSource = handler.config.channelDic._getChannelDic("webchatSeoSource");

        var finishKeys = [];
        for (var i = 0; i < _dics.length; i++) {
            finishKeys.push(_dics[i]);
            var level2 = utils.deepClone(_dics[i].options);
            if(level2){
                for(var m=0; m<level2.length; m++){
                    level2[m].name = _dics[i].name +"->"+ level2[m].name;
                    finishKeys.push(level2[m]);
                    var level3 = utils.deepClone(level2[m].options);
                    if(level3){
                        for(var n=0; n<level3.length; n++){
                            level3[n].name = level2[m].name +"->"+ level3[n].name;
                            finishKeys.push(level3[n]);
                        }

                    }
                }

            }
        }
        var html2=generateComboxOptionsFromDocs(finishKeys,"name","key",null);
        container.find("select[name='finishKey']").append(html2);

        var peers = getCache("mailQueues");
        var html3=generateComboxOptionsFromDocs(peers,"DisplayName","Exten",null);
        container.find("select[name='toPeer']").append(html3);

        var html4=generateComboxOptionsFromDocs(_wechatCSR,"name","key",null);
        container.find("select[name='appraiseKey']").append(html4);

        var html5=generateComboxOptionsFromDocs(_webchatSeoSource,"name","name",null);
        container.find("select[name='seoSource']").append(html5);


        var menu=handler.webchat.curSubMenu;
        if(menu=='webchat_all'){
            container.find(".condition_hide").show();
        }
        if(container.find(".ds_owner").length>0){
            //var inputId=menu+"_owner_select_input";
            //var containerId=menu+"_owner_select_user";
            //utils.loadAgentComboBox(inputId,containerId,{width:"110",height:"17"},false,true);
            var inputId=menu+"_owner_select_input";
            var containerId=menu+"_owner_select_user";
            utils.loadAgentTabBox(inputId,containerId,{width:"126",height:"17",maxHeight:292,hideTab:0,isRadio:true,commonTab:true},false,false,true);
        }
        searchPane.find(".btn_advanced_search").bind("click",function(e){
            e.stopPropagation();
            var offset=searchPane.find(".quick_search").offset();
            container.css({top:offset.top+28+"px",left:offset.left+"px"});
            container.toggleClass("hidden");
        });
        searchPane.find(".btn_time_search").bind("click",function(e){
            e.stopPropagation();
            var offset=searchPane.find(".header_wrap").offset();
            container.css({top:offset.top+28+"px",left:offset.left+"px"});
            container.toggleClass("hidden");
            searchPane.find('.card_edit_pane').addClass('hidden');
        });
        searchPane.find(".btn_card_edit").bind("click",function(e){
            e.stopPropagation();
            var offset= searchPane.find(".header_wrap").offset();
            var new_pane = searchPane.find('.card_edit_pane');
            var row = handler.webchat.webchatCardShow;
            var checkbox = searchPane.find('.card_edit_body').find('.their_choice');
            var a;
            for(a in row){
                if(checkbox.find('input[name='+a+']').length && row[a]){
                    checkbox.find('input[name='+a+']').attr('checked','checked');
                }else{
                    checkbox.find('input[name='+a+']').removeAttr('checked');
                }
            }
            new_pane.css({top:offset.top+28+"px",left:offset.left+"px"});
            new_pane.toggleClass("hidden");
            container.addClass('hidden');
        });
        container.find(".reset_adv_search").bind("click",function(){
            var frm=$(this).closest("form");
            frm.get(0).reset();
            handler.webchat.finishKeyFlag = false;
        });
    },
    searchWebchatCard: function(data, src) {
        if(src.hasClass("refresh")){
            handler.webchat.finishKeyFlag = false;
            var searchPane = src.closest(".list_check_pane");
            var param=handler._getSearchCondition(searchPane,"1")||{};
            var a=searchPane.find(".pagination li.active>a");
            if(a.length>0){
                param.page= a.attr("value");
            }
            handler.webchat.queryWebchatList(param,null);
        }else{
            handler.webchat.finishKeyFlag = false;
            if (data != undefined && data.finishKey != "" && data.finishKey != undefined) {
                handler.webchat.finishKeyFlag = true;
                handler.webchat.advancedSearchData = data;
            }
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
    quickQueryWebchatList:function(data,src){
        if(src){
            var searchPane = src.closest(".list_check_pane");
        }else{
            var searchPane = $("#view_webchat_all");
            src = searchPane.find(".quick_menu a[ds_data='"+data+"']");
        }
        searchPane.find(".quick_menu a").removeClass("quick_card_active");
        src.addClass("quick_card_active");
        searchPane.find(".quick_desc").attr('value',data).text(src.text());
        searchPane.find('#frm_webchat_advanced_search').find('.reset_adv_search').click();
        searchPane.find('#frm_webchat_normal_search').find('.inpt_sty').val('');
        //var selName = data;
        //var val={};
        //val.selName = selName;
        handler.webchat.queryWebchatList();
    },
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
        if(data.finishKey){
            var finishKey = data.finishKey;
            var keys = [];
            keys.push(finishKey);
            var level2 = handler.config.channelDic.getDicMapByKey("webchat", finishKey);
            if(level2.options){
                for(var i=0; i<level2.options.length; i++){
                    keys.push(level2.options[i].key);
                    var level3 = level2.options[i].options;
                    if(level3){
                        for(var j=0; j<level3.length; j++){
                            keys.push(level3[j].key);
                        }
                    }
                }
            }
            data.finishKey = {"$in":keys};
        }

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
                    container.empty();
                    for (var i = 0, len = list.length; i < len; i++) {
                        var row = list[i];
                        handler.webchat._renderChatItem(row,dealAction);
                        if(row.status=="deal" && session.user._id == row.invitedUser){
                            //如果是被邀请,不可进行删除
                            row.isInvitedUser=true;
                        }
                        if (row.sourceName) {
                            row.isLocationUser=true;
                        }

                        if(_sub=='webchat_todo' && row.lastCustomerMsgTimeStamp){
                            var lastCustomerMsgTime = handler.getFormatDateTime(new Date(row.lastCustomerMsgTimeStamp))
                            var _t=handler.formatShortTime(lastCustomerMsgTime);
                            row.shortTime=_t.name;
                            row.createTime = lastCustomerMsgTime;
                        }
                        row = handler.webchat.editCardTmpl(row,container);
                        var rowDiv = $(template("tmpl_webchat_item",row));
                        container.append(rowDiv);
                        if(_sub=='webchat_todo'){
                            var btclass = "chattime_item"+row._id;
                            handler.webchat.webchatHourMeter(btclass,row.startWaitTimer,row.userStatusClass);
                        }
                    }
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

                        if(row.status=="deal" && session.user._id == row.invitedUser){
                            //如果是被邀请,不可进行删除
                            row.isInvitedUser=true;
                        }
                        if(_sub=='webchat_todo' && row.lastCustomerMsgTimeStamp){
                            var lastCustomerMsgTime = handler.getFormatDateTime(new Date(row.lastCustomerMsgTimeStamp))
                            var _t=handler.formatShortTime(lastCustomerMsgTime);
                            row.shortTime=_t.name;
                            row.createTime = lastCustomerMsgTime;
                        }
                        row = handler.webchat.editCardTmpl(row,container);
                        html.push(template("tmpl_webchat_item",row));
                        if(_sub=='webchat_todo'){
                            var btclass = "chattime_item"+row._id;
                            handler.webchat.webchatHourMeter(btclass,row.startWaitTimer,row.userStatusClass)
                        }
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
        //是否是被邀请的
        if(row.status=="deal" && session.user._id == row.invitedUser){
            desc = "被邀请"
        }

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
            row.urlTitle = row.urlTitle || row.UrlTitle || row.fromUrl;
            row.fromSource = "网站咨询";
            row.imgClass = "webchat_pc";
        }else if(row.platform == "wap" || row.Platform == "wap"){
            row.fromUrl = (row.fromUrl == "未知"  || !row.fromUrl)? (row.FromUrl|| "移动浏览器"): row.fromUrl;
            row.urlTitle = row.urlTitle || row.UrlTitle || row.fromUrl;
            row.fromSource = "wap站咨询";
            row.imgClass = "webchat_pc";
        }else if(row.platform == "sdk" || row.Platform == "sdk"){
            row.fromUrl = (row.fromUrl == "未知"  || !row.fromUrl)?  (row.FromUrl|| "app"): row.fromUrl;
            row.urlTitle = row.urlTitle || row.UrlTitle || row.fromUrl;
            row.fromSource = "app咨询";
            row.imgClass = "webchat_mobile";
        }else if(row.platform == "weixin" || row.Platform == "weixin"){
            row.fromUrl = (row.fromUrl == "未知" || !row.fromUrl)?  (row.FromUrl|| "微信"): row.fromUrl;
            row.urlTitle = row.urlTitle || row.UrlTitle || row.fromUrl;
            row.fromSource = "微信咨询";
            row.imgClass = "webchat_weixin";
        }else{
            row.fromUrl = (row.fromUrl == "未知"  || !row.fromUrl)?  (row.FromUrl|| "未知"): row.fromUrl;
            row.urlTitle = row.urlTitle || row.UrlTitle || row.fromUrl;
            row.fromSource = "未知";
            row.imgClass = "webchat_pc";
        }
        if(row.showCustomerName == true || row.showCustomerName == "true"){
            row.fromSource=row.fromSource+ (row.sourceName ||"");
        }
        try{
            row.fromUrl = decodeURIComponent(row.fromUrl);
            row.urlTitle = decodeURIComponent(row.urlTitle);
        }catch (e){

        }

        if(row.status == "deal"){
            if(row.userStatus == "offline"){
                row.userStatusClass = "nonline";
                var offlineTime = handler.getFormatDateTime(new Date(row.sBreakTime));
                row.userStatusDesc = "离线 "+ (row.sBreakTime?handler.formatChatShortTime(offlineTime):"");
                handler.webchat.resetTimerList(row,row.userStatus);
            }else if(row.userStatus == "online"){
                row.userStatusClass = "online";
                row.userStatusDesc = "在线";
                handler.webchat.resetTimerList(row,row.userStatus);
            }
        }
        row.agentDisplayName = "";
        if(row.user && handler.webchat.curSubMenu != "webchat_todo"){
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
            try{
                row.sName = decodeURIComponent(row.sName);
            }catch(e){
                row.sName = row.sName.replace(/%26/g, "&");
                row.sName = row.sName.replace(/%23/g, "#");
                row.sName = row.sName.replace(/%3A/g, ":");
                row.sName = row.sName.replace(/%24/g, "$");
                row.sName = row.sName.replace(/%40/g, "@");
                row.sName = row.sName.replace(/%2B/g, "+");
                row.sName = row.sName.replace(/%3D/g, "=");
                row.sName = row.sName.replace(/%2F/g, "/");
            }
            //row.sName = decodeURIComponent(row.sName);
        }
    },
    refreshChatDetail:function(sid,flag,userId,userName,callback){
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
                var nick= "";
                try{
                    nick=decodeURIComponent(user.sName);
                }catch (e){
                    nick=user.sName;
                }

                var contact = rep.row;

                DS.getView('webchat/webchat_detail', function (detail) {
                    detail = detail.replace(/_#paneId#_/g,paneId);
                    if(flag=="popupWebchat"){
                        $("#"+paneId).remove();
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
                            handler.webchat.loadCustAddByWebchatFirst(nick,paneId,true, sid,userName);
                        }else{
                            handler.customer.loadCustInfo(contact._id,sid,flag,null,null,function(){
                                call_right.find(".func_tab.active").click();
                                handler.customer.loadTabUrl($('#' + paneId),false,'',contact._id, userId+"__"+userName);
                            });
                            //dsevent.publish(dsevent.evt.callRefreshCustomer,contact);
                        }
                    } else {
                        handler.webchat.loadCustAddByWebchatFirst(nick,paneId,false, userId,userName);
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
        var flag="relocationWebchat";
        var userId=src.attr("ds_attr");
        var userName=src.attr("ds_sname");
        handler.webchat.refreshChatDetail(sid,flag,userId,userName);
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
    showAllSkillGroup:function(){//data预留数据项，src选择器的id
        var data = {};
        var action = {
            action: 'app.webchat.showAllSkillGroup',
            data: data
        };
        DS.send(action,function(res){
            if(res.success){
                var skillGroup = res.data;
                handler.webchat.skillGroup = skillGroup;
            }
        });
    },
    showTodoWebchatDetail: function(sid,src,_flag) {
        if($(src).find(".online").length){
            handler.webchat.userStatus = true;
        }else{
            handler.webchat.userStatus = false;
        }
      handler.webchat.currentSelIndex=-1;
      handler.webchat.oldSelIndex=-1;
        var flag="popupWebchat";
        var paneId=sid+"_"+flag;
        var userId=src.attr("ds_attr");
        var userName=src.attr("ds_sname");
        var pane=handler.webchat._getSubPane("left");
        var contentPane=handler.webchat._getSubPane("right");
        var call_left = pane.find(".item"+sid);
        var call_right=$("#"+paneId);
        var label_status = $(src).find(".label_status").attr("status");
        $('#webchat_kmpopover').attr('sessionId',sid).hide();
        handler.webchat.curTabId = sid;
        var num=call_left.find(".badge").text();
        var hasUser=handler.webchat._checkLimit(sid);
        if(hasUser&&!_flag){
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
            handler.webchat.refreshChatDetail(sid,flag,userId,userName,function(){
                call_left.find(".badge").text("");
                if(num){
                    handler.webchat._dealMsg(sid);
                }
                contentPane.find(".call_detail").hide();
                call_right.show();
            });
        }
        var isResize = call_right.find('.exist_custom').attr('isResize');
        if(isResize){//当客户发来信息  自动定位到客户的时候会触发  高度刷新的方法
            handler.webchat.resCustTabContentHeight(call_right);
        }
    },
    loadChatTab:function(data,src, callback){
        var webchatFlag="webchat";
        var container=src.closest(".call_detail");
        var paneId=container.attr("id");
        var ary=paneId.split("_");
        var sid=ary[0];
        var flag=ary[1];
        var flag2=ary[2];
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
                if (!chatSession.lastRedirectUserTime) {
                    chatSession.lastRedirectUserTime = "";
                }
                if(!chatSession.lastClaimTime ){
                    chatSession.lastClaimTime  = "";
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
                try{
                    chatSession.sName = decodeURIComponent(chatSession.sName);
                }catch (e){

                }
                chatSession.sName = escapeChatHtml(chatSession.sName);
                chatSession.sid = escapeChatHtml(chatSession.sid);
                chatSession.platformPic=platformPic;
                DS.getView('webchat/webchat_tab', function (detail) {
                    chatSession.custName = chatInfo.custName || chatSession.sName;
                    chatSession.custId = chatInfo.custId || "";
                    detail = DS.renderViewNew(detail, chatSession);
                    var _p=call_right.find(".cust_tab_content").find(".cust_tab_content_other");
                    _p.html(detail);

                    if(chatSession.platform != 'pc' && chatSession.platform != 'wap'  && chatSession.platform != 'sdk' && chatSession.platform!= "weixin"){
                        call_right.find('.initiate_appraise').addClass('dis_none').hide();
                    }else{
                        call_right.find('.initiate_appraise').removeClass('dis_none').show();
                    }
                    handler.webchat.getChatInfo(sid,flag,call_right);

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
                        _p.find(".chart_time_stopwatch_box").remove();
                        _p.find(".webchat_remark").find("textarea").attr('placeholder','');

                        //条件 ： 非自己，有权限，deal状态，技能组
                        var isContainPeer= false;
                        var peer= getCache("accessChannelAgent", chatSession.toPeer);
                        if(peer){
                            var accessAgents= [];
                            accessAgents = peer.agents;
                            $(accessAgents).each(function(i,agent){
                                if(agent.agentID == session.user._id){
                                    isContainPeer = true;
                                }
                            });
                        }
                        if(!isContainPeer){
                            _p.find(".chat_grab").hide();
                        }else if(session.user._id == chatSession.user){
                            _p.find(".chat_grab").hide();
                        }else if("deal" != chatSession.status){
                            _p.find(".chat_grab").hide();
                        }else if(!utils.contains(session.user.funcIds,"func_webchat_grab")){
                            _p.find(".chat_grab").hide();
                        }else if(chatSession.inviteUserStatus=="accept"){
                            _p.find(".chat_grab").hide();
                        }else if(flag2 == "customerHistory"){
                            _p.find(".chat_grab").hide();
                        }
                    }else{
                        //只有pc端显示文件上传
                        _p.find("#file_upload").hide();
                        if(chatSession.platform=="pc" || chatSession.platform=="wap"){
                            _p.find("#file_upload").show();
                        }else if((chatSession.sdkIosVersionCode && chatSession.sdkIosVersionCode>1) || (chatSession.sdkAndroidVersionCode && chatSession.sdkAndroidVersionCode>1)){
                            _p.find("#file_upload").show();
                        }
                        //如果是被邀请的，隐藏操作按钮
                        if(chatSession.inviteUserStatus=="accept" && chatSession.invitedUser ==session.user._id){
                            _p.find(".chat_top .chat_transfer").hide();
                        }else{
                            //如果有被邀请人，显示踢出，不显示邀请
                            if(chatSession.inviteUserStatus=="accept" && chatSession.invitedUser ){
                                _p.find(".kick_invite").show();
                                _p.find(".img_action_invite").hide();
                            }else if(chatSession.inviteUserStatus=="undeal" && chatSession.invitedUser ){
                                _p.find(".kick_invite").hide();
                                _p.find(".img_action_invite").show();
                                //查看是否是正在邀请的状态
                                $("#cancel_webchat"+sid).find(".invited_name").text(chatSession.invitedUserName);
                                $("#cancel_webchat"+sid).show();

                            }else{
                                _p.find(".kick_invite").hide();
                                _p.find(".img_action_invite").show();
                            }
                        }
                        _p.find(".chat_grab").hide();
                        _p.find(".webchat_consult_tab").hide();
                        if(chatSession.status == "changePeer"){
                            _p.find(".img_action_turn").hide();
                            _p.find(".chat_toolbar").remove();
                            _p.find("textarea[name=content]").attr("disabled","disabled");
                            _p.find('.chat_msg').attr('noChatPopover',true);
                            _p.find(".webchat_quickreply_tab").remove();
                            _p.find(".chart_time_stopwatch_box").remove();
                            _p.find(".msg_inner").append(template("tmpl_webchat_msg_to", {contentDesc:"该会话已流转到其它的技能组", uidDesc:"系统"}));
                        }
                        if(chatSession.leavemsg){
                            _p.find(".img_action_turn").hide();
                            _p.find(".chat_toolbar").remove();
                            _p.find("textarea[name=content]").attr("disabled","disabled");
                            _p.find('.chat_msg').attr('noChatPopover',true);
                            _p.find(".webchat_quickreply_tab").remove();
                            _p.find(".chart_time_stopwatch_box").remove();
                            _p.find(".reply_webchat").attr("disabled","disabled").hide();
                        }
                        //zlx添加 一个判断，如果智能提示框被选中则执行选中内容，而不是回复信息
                        call_right.find("textarea[name='content']").keydown(function(event){                       
                            if(!$(".auto_comp_check").html()){
                                if(event.keyCode == 13){
                                    handler.webchat.enterFlag=false;
                                    event.preventDefault();
                                    call_right.find(".reply_webchat").click();
                                }
                            }else{
                                $(".auto_comp_check").removeClass('auto_comp_check');
                            }     
                        });
                        handler.webchat.transferAgent(chatSession,_p);
                        handler.webchat.transferGroup(chatSession,_p);
                        handler.webchat.inviteAgent(chatSession,_p);
                        handler.webchat.showAllSkillGroup();
                        handler.webchat.initFace(call_right);
                        handler.webchat.initQiniuUploadForWebchat(call_right, chatSession.sid);
                        handler.webchat.initImgClipboardUploadForWebchat(call_right, chatSession.sid);
                        handler.webchat.initQiniuFileUploadForWebchat(call_right, chatSession.sid,chatSession._id);
                        handler.webchat._initDic(_p);

                        if(chatSession.status != "changePeer" && !chatSession.leavemsg){
                            handler.webchat.initQuickReply(_p);
                            //handler.webchat.systemQuickReply(_p);
                        }
                        //if(chatSession.platform != 'pc'){
                        //    call_right.find('.initiate_appraise').hide();
                        //}

                    }
                    //加载tab页的客户等待
                    var btclass = "chattime_item"+chatSession._id;
                    handler.webchat.webchatHourMeter(btclass,chatSession.startWaitTimer,chatSession.userStatusClass);

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
                            var time=container.attr("ds_time");
                            if(!time || time==""){
                                time = DS.getCurrentDateTime();
                            }
                            var lastTime=time;
                            if(list.length>0){
                                var idx=list.length-1;
                                for (var i = idx; i >=0; i--) {
                                    var obj = list[i];
                                    var last=null;
                                    if(i==idx){
                                        lastTime=obj.dateTime;
                                    }
                                    if(i<idx){
                                        last=list[i+1];
                                    }
                                    html.push(handler.webchat.showMsg(obj,call_right,"up",last,i));
                                }
                                _container.prepend(html.join(""));
                            }
                            msgContainer.attr("ds_time",lastTime);
                            handler.webchat._locationMsg(msgContainer);
                            handler.webchat.getImFontCon();
                            resizeRightContent($("#view_nav_webchat").find(call_right).find(".cust_tab_content"),webchatFlag);//联系历史和im对话框高度区分,webchatFlag为了解决一个没查到原因的bug
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
                        handler.webchat._initUserHistory(call_right,sid);
                    },null,null,true);
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
        try{
            obj.sName = decodeURIComponent(obj.sName);
        }catch(e){

        }
        var title = "您有新的消息，来自于【"+fromSource+"】的用户【"+obj.sName+"】";

        if(event == 'NewNotify' && obj.operation=='claim') {
            $("#webchat_session_undeal_num").html(obj.openNum);
        }else if(event == 'NewNotify' && obj.type=='agentPushStatus' ){
            handler.webchat.syncOnlineAgent(obj);
        }else if(event == 'NewNotify' && obj.type=='chatSessionClose' ){
            if(isMe){
                handler.webchat.removeTodoItem(obj);
            }else{
                handler.webchat.removeOpenItem(obj);
            }
        }else if(event == 'NewNotify' && obj.type=='delete_relation' ){
            //解除关联
            var sid =obj._id;
            var pane = $("#"+sid+"_popupWebchat");
            pane.remove();
            var n_src = $('.item'+sid);
            handler.webchat.showTodoWebchatDetail(sid,n_src,true);
            var sourceName = $(n_src).find('.card_row_title').attr('sourcename');
            $(n_src).find('.card_row_title').html(sourceName);
            var platform = $(n_src).find('.card_row_from_title').attr('platform');
            if(platform == "pc"){
                platform = "(网站咨询)";
            }else if(platform == "wap"){
                platform = "(wap站咨询)";
            }else if(platform == "sdk"){
                platform = "(app咨询)";
            }else if(platform == "weixin"){
                platform = "(微信咨询)";
            }else{
                platform = "(未知)";
            }
            $(n_src).find('.card_row_from_title').html(platform);

        }else if(event == 'NewNotify' && obj.type == 'webchat' && obj.operation == 'autoClose') {
            if(isMe){
                handler.webchat.removeTodoItem(obj);
                var autoCloseContent = obj.sName + '长时间没有回复，系统自动为您关闭了会话';
                $().alertmessage('showSuccess', autoCloseContent);
                emitNotify('您有新的消息', autoCloseContent);
            }else{
                handler.webchat.removeOpenItem(obj);
            }
        }else if(event == 'NewNotify' && obj.type == 'webchat' && obj.operation == 'changePeer' ){
            handler.webchat.removeTodoItem(obj);
            $(".webchat_another_invite").find("#invite_person_"+obj._id).remove();

        }else if(event == 'NewNotify' && obj.type == 'webchat' && obj.operation == 'grab_redirect' ){
            //被抢接
            var _owner = obj.user;
            var container=$(".call_detail");
            var paneId=container.attr("id");
            var pane =$("#"+paneId).find(".cust_tab_content");
            var right = $("#"+obj._id+"_popupWebchat");
            //var left=handler.webchat._getSubPane("left");
            $().alertmessage('showSuccess',obj.toUserName +"抢接了您"+ obj.sName +"的会话");
            var title =  "您有新的消息，来自于座席【"+obj.toUserName+"】";
            emitNotify(title,obj.toUserName +"抢接了您"+ obj.sName +"的会话");

            pane.find("#combobox_webchat_owner_desc").attr("uid",_owner);
            pane.find("#combobox_webchat_invite_owner_desc").attr("uid",_owner);
            //pane.find( "#combobox_webchat_owner_desc" ).text(ui.item.displayName);
            pane.find( "#combobox_webchat_owner").blur();
            pane.find( "#combobox_webchat_invite_owner").blur();
            handler.webchat._syncCardLimit(obj._id);
            right.remove();
            if($('#webchat_kmpopover').attr("sessionId") ==obj._id){
                $('#webchat_kmpopover').hide();
            }
            //left.find(".normal_search").click();
            handler.webchat.removeTimer(obj._id);
            handler.webchat.curDealCount = handler.webchat.curDealCount - 1;
            if($("#view_webchat_todo .item"+obj._id).closest(".list_item").length>0){
                $("#view_webchat_todo .item"+obj._id).closest(".list_item").remove();
                //数量减一
                var numStr = $("#view_nav_webchat .btn_webchat_todo").find(".badge-important").text();

                if(numStr){
                    var num =  parseInt(numStr);
                    if(num>1){
                        num = num-1;
                        $("#view_nav_webchat .btn_webchat_todo").find(".badge-important").text(num);
                    }else if(num>0){
                        $("#view_nav_webchat .btn_webchat_todo").find(".badge-important").remove();
                        $(".nav_webchat_hover .task_pop_tip").remove();
                        var html='<div class="alert">没有记录!</div>';
                        $("#view_webchat_todo .list-inside").html(html);
                    }else{
                        $(".nav_webchat_hover .task_pop_tip").remove();
                    }
                }else{
                    $(".nav_webchat_hover .task_pop_tip").remove();
                }
            }

            if($("#endsession").attr("aria-hidden")=="false"){
                $("#endsession").find(".close.ds_do_action").click();
                $("#pane_deal_list").find(".toolbar_close").click();
            }

            if(handler.webchat.haveClaim){
                handler.webchat.autoClaimWebchatSession(obj);
            }
        }else if(event == 'NewNotify' && obj.type == 'webchat' && obj.operation == 'invited' ){
            //被别人邀请
            if($("#invite_person_"+obj._id).length ==0){
                var html = template("tmpl_accept_webchat", obj);
                $(".webchat_another_invite").append(html);
            }
            var title =  "您有新的消息，来自于座席【"+obj.username+"】";
            emitNotify(title,"邀请您加入多方会话");
        }else if(event == 'NewNotify' && obj.type == 'webchat' && obj.operation == 'invited_redirect' ){
            //会话被转接了
            handler.webchat.removeInvitedTodoItem(obj);
        }else if(event == 'NewNotify' && obj.type == 'webchat' && obj.operation == 'invited_cancel' ){
            //取消邀请
            $(".webchat_another_invite").find("#invite_person_"+obj._id).remove();
        }else if(event == 'NewNotify' && obj.type == 'webchat' && obj.operation == 'invite_kick' ){
            //被踢出
            $().alertmessage('showSuccess',"被踢出了会话");
            handler.webchat.removeTodoItem(obj);
        }else if(event == 'NewNotify' && obj.type == 'webchat' && obj.operation == 'invite_close' ){
            //会话被关闭
            $().alertmessage('showSuccess',"会话被座席关闭");
            handler.webchat.removeTodoItem(obj);
            $(".webchat_another_invite").find("#invite_person_"+obj._id).remove();
        }else if(event == 'NewNotify' && obj.type == 'webchat' && obj.operation == 'invite_handle' && obj.accept == true){
            //对方同意了邀请
            $().alertmessage('showSuccess',"对方接受了合作会话");
             $("#cancel_webchat"+obj._id).hide();
            var right = $("#"+obj._id+"_popupWebchat");
            right.find(".kick_invite").show();
            right.find(".img_action_invite").hide();
            right.find(".invitedStatus span").text("已接受");
        }else if(event == 'NewNotify' && obj.type == 'webchat' && obj.operation == 'invite_handle' && obj.accept == false){
            //对方拒绝了邀请
            $().alertmessage('showSuccess',"对方拒绝了合作会话");
            $("#cancel_webchat"+obj._id).hide();
            var right = $("#"+obj._id+"_popupWebchat");
            right.find(".kick_invite").hide();
            right.find(".img_action_invite").show();

            right.find(".invitedUser span").text("无");
            right.find(".invitedStatus span").text("未邀请");
        }else if(event == 'NewNotify' && obj.type == 'changePeer' ){
            var mailQueues = getCache('mailQueues');
            var queueDisplayName = ";"
            for(var i=0 ;i<mailQueues.length; i++){
                if(mailQueues[i].Exten == obj.toPeer){
                    queueDisplayName = mailQueues[i].DisplayName;
                }
            }
            obj.Content = "用户流转进了【"+queueDisplayName+"】技能组";
            handler.webchat.webchatTodoItemAdd(obj);
        }else if(event == 'NewNotify' && obj.type == 'invited_changePeer' ){
            handler.webchat.removeInvitedTodoItem(obj);
        }else if(event == "NewNotify" && obj.type == "refreshUndealNum"){
            $("#webchat_session_undeal_num").html(obj.undealNum);
        }else if(event == 'GroupMsg'){
            handler.webchat.addGroupMsg(obj);
        }else if(event == 'NewWebchat' && obj.msgType=="typeNotice"){
            handler.webchat.webchatTodoPreloadAdd(obj);
        }else if(event == "BatchNewWebchat"){
            //console.log(obj);
            handler.webchat.curDealCount = handler.webchat.curDealCount + obj.length;
            console.log("handler.webchat.curDealCount:"+handler.webchat.curDealCount);
            for(var i = 0; i<obj.length; i++){
                handler.webchat.webchatTodoItemAdd(obj[i]);
            }
            handler.webchat.refreshMenuBadge(false, handler.webchat.curDealCount);
            if(obj.length> 0){
                emitNotify("您有新的消息", "领取了新的会话");
            }
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
                    $('#'+obj._id+'_popupWebchat_preload').remove();
                }else if(isMe && obj.MsgType == "newConn"){
                    emitNotify(title, "用户新接入", "#view_webchat_todo .item"+obj._id);
                }else if(isMe && (obj.operation == "changePeer" || obj.MsgType == "convertManual")){
                    emitNotify(title, "新接入会话", "#view_webchat_todo .item"+obj._id);
                }else if(isMe && obj.operation == "redirect"){
                    emitNotify(title, "接入一个转接过来的会话", "#view_webchat_todo .item"+obj._id);
                }
            }
            handler.webchat.removeInvitedTodoItem(obj);
            if(isMe){
                if(evtJson.assign){
                    handler.webchat.curDealCount++;

                    // 推送排队信息
                    // TODO 优化接入多个会话技能组相同，连续请求
                    var action = {
                        action: "app.webchat.pushQueueNumToWebChatClients",
                        data: {
                            toPeer: obj.toPeer
                        }
                    };

                    DS.send(action, function (rep) {});
                }
                //添加信息
                if($('#'+obj._id+'_popupWebchat_preload').length>0){
                    $('#'+obj._id+'_popupWebchat_preload').remove();
                }
                handler.webchat.webchatTodoItemAdd(obj);
                if(isMe && obj.Content && obj.MsgType == "newMsg"){
                    var callId=obj._id;
                    var _pane=$("#view_webchat_todo");
                    var pane_lists = _pane.find('.list_item');
                    var index = 0;
                    for( var p=0;p<pane_lists.length;p++){
                        if($(pane_lists[p]).find(".item"+callId).length){
                            index = p;
                        };
                    }

                    var lastCustomerMsgTime = handler.getFormatDateTime(new Date())
                    var _t=handler.formatShortTime(lastCustomerMsgTime);
                    var lastCustomerMsgTimeShortTime=_t.name;
                    _pane.find(".item"+callId).closest('.list_item').find(".card_right .muted").attr("title",lastCustomerMsgTime );
                    _pane.find(".item"+callId).closest('.list_item').find(".card_right .muted").text(lastCustomerMsgTimeShortTime);

                    if(pane_lists.length>1 && index>0){
                        var parent = _pane.find('.list-inside');
                        var clone = _pane.find(".item"+callId).closest('.list_item');
                        var new_itemPane = clone[0].cloneNode(true);
                        parent[0].insertBefore(new_itemPane,pane_lists[0]);
                        clone.remove();
                    }

                }
                $(".webchat_another_invite").find("#invite_person_"+obj._id).remove();
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
    removeInvitedTodoItem:function(data){
        $(".webchat_another_invite").find("#invite_person_"+data._id).remove();
        if(data.invitedUser == session.user._id){
            handler.webchat.removeTodoItem(data);
        }
    },
    removeTodoItem:function(data) {
        var sid=data._id;
        var pane=$("#view_webchat_todo");
        var itemPane= pane.find(".item"+sid);
        handler.webchat.removeTimer(sid);
        //var contentPane=$("#view_webchat_todo_content");
        var paneId=sid+"_popupWebchat";
        var call_right=$("#"+paneId);
        var left=handler.webchat._getSubPane("left");
        if(handler.webchat.curDealCount > 0){
            handler.webchat.curDealCount = handler.webchat.curDealCount - 1;
        }
        if(handler.webchat.haveClaim){
            handler.webchat.autoClaimWebchatSession();
        }
        if(pane.length>0){

            var container=pane.find('.list-inside');
            if(container.length>0 ) {
                if(left.find('.ds_search_filter').find('.badge-info').length == 0){
                    handler.webchat.refreshWebchatList("webchat_todo");
                }else{
                    //点击高级搜索的刷新
                    pane.find(".todo-advanced-search-refresh").click();
                }
                handler.webchat._syncCardLimit(sid);
                call_right.remove();
                if($('#webchat_kmpopover').attr("sessionId") ==sid){
                    $('#webchat_kmpopover').hide();
                }
            }else{
                handler.webchat.initBadge();
            }
        }
    },
    removeOpenItem:function(data) {
        var sid=data._id;
        var pane=$("#view_webchat_all");
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
    webchatTodoPreloadAdd:function(data){
        var callId=data._id;
        var paneId=callId+"_popupWebchat";
        var itemContent = $('#view_webchat_todo_content').find('#'+paneId);
        if(itemContent.length>0 && itemContent.attr('display')!='none'){
            if($('#'+paneId+'_preload').length==0){
                itemContent.find('.msg_inner').append('<div id="'+paneId+'_preload"></div>');
            }
            var _pane = $('#'+paneId+'_preload');
            if(_pane.find('.chat_item').length>0){
                var time1 = _pane.find('.chat_item').attr('ds_data');
                if(time1 > data.TimeStamp){
                    return;
                }
            }
            data.Content = data.Content || '';
            try{
                data.Content = decodeURIComponent(data.Content);
            }catch(e){
                data.Content = data.Content.replace(/%26/g, "&");
                data.Content = data.Content.replace(/%23/g, "#");
                data.Content = data.Content.replace(/%3A/g, ":");
                data.Content = data.Content.replace(/%24/g, "$");
                data.Content = data.Content.replace(/%40/g, "@");
                data.Content = data.Content.replace(/%2B/g, "+");
                data.Content = data.Content.replace(/%3D/g, "=");
                data.Content = data.Content.replace(/%2F/g, "/");
            }
            _pane.html(template('tmpl_webchat_msg_from_preload',data));
            handler.webchat.webchayOnlineStatus++;
            setTimeout(function(){
                if(handler.webchat.webchayOnlineStatus-- <=1){
                    if(data.Content == ''){
                        _pane.remove();
                    }else{
                        _pane.find('.typing_status').html('访客已输入');
                    }
                }
            },5000);
            itemContent.find('.msg_inner').closest('.chat_msg_bottom').scrollTop(itemContent.find('.msg_inner').height());
        }

    },
    webchatTodoItemAdd:function(data) {
        var webchatFlag="webchat";
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
            var strarr = data.CreateTime.split(' ');
            data.ContentDesc = strarr[1]+" 新用户接入";
            handler.webchat.userStatus = true;
        }else if(data.MsgType=='disConn'){
            var strarr = data.CreateTime.split(' ');
            data.ContentDesc = strarr[1]+" 用户已离开";
            handler.webchat.userStatus = false;
        }else if(data.MsgType=='invited'){
            data.ContentDesc = "邀请"+data.invitedUserName+"加入会话，等待回复";
        }else if(data.MsgType=='invite_accept'){
            data.ContentDesc = "座席"+data.invitedUserName+"接受了邀请，加入多方会话";
        }else if(data.MsgType=='invite_refuesd'){
            data.ContentDesc = "座席"+data.invitedUserName+"拒绝了邀请，建立多方会话失败";
        }else if(data.MsgType=='invite_cancel'){
            data.ContentDesc = "您取消了对"+data.invitedUserName+"的邀请";
        }else if(data.MsgType=='invite_kick'){
            data.ContentDesc = "您踢出了"+data.invitedUserName+"，取消多方会话";
        }else if(data.MsgType == 'saveImCSRInfo'){
            data.CreateTime = data.createTime;
            delete data.createTime;
            /*if(!handler.webchat.userStatus){
                data.ContentDesc = '用户已离线，无法发出评价';
            }else{*/
                if(data.Platform!='pc' && data.isInvestigate!= undefined && !data.isInvestigate){//已经评价过了
                    return;
                }
                data.ContentDesc = data.message;
            /*}*/
        }else{//newMsg ,investigate
            data.ContentDesc = data.Content;
        }
        if(data.MsgType=='newMsg' || data.MsgType == "newConn" || data.MsgType == "sendImQAMsg"){
            data.userStatus = "online";
            data.userStatusClass = "online";
            data.userStatusDesc = "在线";
            handler.webchat.resetTimerList(data,data.userStatus);
        }

        if(data.MsgType=='disConn'){
            data.userStatus = "offline";
            data.userStatusClass = "nonline";
            data.userStatusDesc = "离线 "+ data.shortTime;
            handler.webchat.resetTimerList(data,data.userStatus);
        }


        if(data.status != "finish" && data.MsgType!= "disConn"){
            if(data.userStatus == "offline"){
                data.userStatus = "offline";
                data.userStatusClass = "nonline";
                var offlineTime = handler.getFormatDateTime(new Date(data.sBreakTime));
                data.userStatusDesc = "离线 "+ handler.formatChatShortTime(offlineTime);
                handler.webchat.resetTimerList(data,data.userStatus);
            }else if(data.userStatus == "online"){
                data.userStatus = "online";
                data.userStatusClass = "online";
                data.userStatusDesc = "在线";
                handler.webchat.resetTimerList(data,data.userStatus);
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
        var rightPane=$("#"+paneId);
        chatSession.createTime=chatSession.CreateTime || chatSession.createTime;
        chatSession.sid=chatSession.Sid || chatSession.sid;
        chatSession.leakNum=chatSession.leakNum || 1;
        chatSession.status='deal';
        if(pane.length>0){//打开过webchat菜单
            var container=pane.find('.list-inside');
            if(container.length>0){//打开过该子菜单
                var rightPane=$("#"+paneId);
                if(itemPane.length==0 && rightPane.length==0){
                    handler.webchat._addTodoCard(chatSession);
                    handler.webchat.refreshBadge(1,"todo");
                }else{
                    _showBadge();
                    if(rightPane.length>0){
                        if(data.type == "changePeer"){
                            rightPane.find(".img_action_turn").hide();
                            rightPane.find(".chat_toolbar").remove();
                            rightPane.find("textarea[name=content]").attr("disabled","disabled");
                            rightPane.find(".webchat_quickreply_tab").remove();
                            rightPane.find(".chart_time_stopwatch_box").remove();
                            rightPane.find(".webchat_quickreply_container").remove();
                            resizeRightContent($("#view_nav_webchat").find(rightPane).find(".cust_tab_content"),webchatFlag);//联系历史和im对话框高度区分,webchatFlag为了解决一个没查到原因的bug
                        }
                        handler.webchat.loadInboxInfo(data,paneId);
                        if(session.currentPage.pageId == 'webchat_todo' && handler.webchat.curTabId==callId){//打开的情况下，后续的继续更新
                            handler.webchat._dealMsg(callId);
                        }
                    }
                    var btclass = "chattime_item"+chatSession._id;
                    handler.webchat.webchatHourMeter(btclass,chatSession.startWaitTimer,chatSession.userStatusClass);
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
    addGroupMsg:function(data) {
        var callId=data._id;
        var flag="popupWebchat";
        var paneId=callId+"_"+flag;
        var rightPane=$("#"+paneId);
        var wxObj = data;
        var pane = $(rightPane).find(".webchat_container");
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
        wxObj.uidDesc=wxObj.username;
        handler.webchat._mergeMsg(wxObj,pane,"down");
        var tmpl="tmpl_webchat_msg_to";
        if(type == 'image'){
            wxObj.contentDesc=handler.webchat._getImgView(wxObj.content);
            tmpl= "tmpl_webchat_msg_to_img";
        }else if(type == 'file'){
            wxObj.contentDesc=handler.webchat._getFileView(wxObj.content);
            tmpl= "tmpl_webchat_msg_to_file";
        }
        var container=pane.find(".chat_msg");
        container.find(".msg_inner").append(template(tmpl, wxObj));
        pane.find('.to_'+wxObj.timeStamp).removeClass('send');
        handler.webchat._locationMsg(container);

        if(wxObj.type == 'out'){
            var btclass = "chattime_item"+wxObj.sessionId;
            if(handler.webchat.timerList[btclass]){
                handler.webchat.timerList[btclass].agentResetFun();
            }
        }

        //clear badge
        var call_left = handler.webchat._getSubPane("left");
        call_left.find(".item"+wxObj.sid).find(".badge").text("");
    },

    gotoWebchatMenu: function(data,src) {
        var pane=$("#main-panel");
        var callMenu=pane.find(".navbar_top a[id='nav_webchat']");
        callMenu.click();
        $('#contact_list_webchat .btn_webchat_todo')[0].click();
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
        var html='<div class="text-center"><img src="'+url+'" class="img-rounded" onload="handler.webchat.bigImgOnload()"/></div>';
        var pane =$('#showBigImgModal');
        pane.find(".modal-title").text("查看大图");
        pane.find(".modal-body").html(html).css("max-height",($(window).height()-120));
        pane.css({'z-index':1060,"max-width":"80%","width":"auto"});
        pane.find('.text-center img').load(function(){
            pane.css({"top": ($(window).height()-pane.height())/2});
        });
        pane.modal();
    },
    bigImgOnload:function(){
        $("#showBigImgModal").css({"left": ($(window).width()-$("#showBigImgModal").width())/2})
    },
    _getImgView:function(data,flag){
//        var imgInfo = Qiniu.imageInfo(key);
        var path=replaceImQiniuDomain(data);
        var url=path+"?imageView2/2/w/100";
        var html='<a href="#" class="ds_do_action" ds_action="webchat.showBigImg" ds_data="'+path+'"><img src="'+url+'" style="max-width:100px;"></a>';
        return html;
    },
    _getFileView:function(data,flag){
        var params = data.split("?fileName=");
        var url = replaceImQiniuDomain(params[0]);
        var fileName = "文件";
        var fileSize = "";
        if(params[1]){
            var params2 = params[1].split("?fileSize=");
            fileName = params2[0];
            fileSize = params2[1];
        }
        var html='<a href="'+url+'" target = "_blank" >'+fileName+'</a>';
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
        }else if(contentType=='file'){
            isEsc=true;
            wxObj.contentDesc=handler.webchat._getFileView(wxObj.contentDesc);
            tmpl="tmpl_webchat_msg_from_file";
        }else if(contentType=='voice'){
            wxObj.contentDesc = replaceImQiniuDomain(wxObj.contentDesc);
            tmpl="tmpl_webchat_msg_from_voice";
            //var _h='<audio style="" src="" preload="auto"  controls="controls">您的浏览器不支持此播放器</audio>';
        }
        if(wxObj.contentDesc){
            wxObj.contentDesc=handler.webchat.renderEmoji(wxObj.contentDesc,isEsc);
        }
        if(contentType=='text'){
            handler.webchat.autoMatchMsg(wxObj.contentDesc,pane,wxObj.when,wxObj.sessionId);
        }
        //tmpl=DS.renderMethodViewNew(tmpl,wxObj);

        if (type=='newConn' || type=='disConn' || type=='saveImCSRInfo'||type=='invited'||type=='invite_kick'||type=='invite_cancel'||type=='invite_refuesd'||type=='invite_accept'){
            tmpl="tmpl_webchat_msg_from_system";
        }

        if(wxObj.sysNotice == true){
            tmpl="tmpl_webchat_msg_from_system";
        }
        tmpl=template(tmpl,wxObj);
        var container=pane.find(".webchat_container .chat_msg");
        //查看是否已经有这条记录
        var whentimestamp = wxObj.when;
        if(container.find(".msg_inner").find("div[ds_data="+whentimestamp+"]").length==0){
            if(wxObj.type == 'in'  && wxObj.when){
                var btclass = "chattime_item"+wxObj.sessionId;
                if(!handler.webchat.timerList[btclass]){
                    handler.webchat.webchatHourMeter(btclass, wxObj.startWaitTimer, "online");
                }
            }
            container.find(".msg_inner").append(tmpl);
        }
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

    loadCustAddByWebchatFirst: function(nick,paneId,isDel,sid,userName){
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
        handler.customer.loadTabUrl($("#"+paneId),false,'','',sid+"__"+userName);
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
    replyChat:function(data,src,notRemoveChatInput){
        if (src.hasClass("disabled")) return false;
        var paneId=handler.webchat.curTabId+"_popupWebchat";
        var pane = $("#"+paneId).find(".cust_tab_content");
        var frm= $(src).closest('form');
        if(!$.trim(data.content)){
            $().alertmessage('showError', "内容不能为空");
            frm.find('textarea').focus();
            return false;
        }
        if(!data.agentFirstReplyTime){
            data.firstReply = true;

        }else{
            data.firstReply = false;
            delete data.agentFirstReplyTime;
        }
        pane.find("form").find("textarea[name='content']").val("");
        data.timeStamp = new Date().getTime();  //时间戳标志

        //data.createTime = handler.webchat.currentDateTimeChanege(new Date().getTime()+ serverDiffTime); //serverTime在system_init.js里定义了
        var dataCopy = utils.deepClone(data);
        dataCopy.createTime = "";
        handler.webchat.showMyReply(dataCopy,pane.find(".webchat_container"));  //将对话内容加载在本地
        var height = pane.find('.msg_inner').outerHeight();
        pane.find('.chat_msg').scrollTop(height);
        data.content = encodeURIComponent(data.content);    //将对话内容加密发往后端 (发往后端的必须操作)
        var action = {
            action: "app.webchat.replyMsg",
            data: data
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                var row=rep.row;
                if(data.uploadTimestamp){
                    $("#"+data.uploadTimestamp).remove();
                }
                //网络原因等导致没有将首次响应时间显示到页面
                if(!data.agentFirstReplyTime){
                    data.firstReply = true;
                    var firstReplyTimeInput = pane.find("input[name='agentFirstReplyTime']");
                    //在页面上显示
                    firstReplyTimeInput.val(new Date().getTime());
                    console.log("---------------------------------  "+firstReplyTimeInput.val());

                }else{
                    data.firstReply = false;
                    //只要不是第一次回复，就不会再传agentFirstReplyTime这个参数
                    delete data.agentFirstReplyTime;
                }
                row.content = decodeURIComponent(row.content);
                var timeDesc =handler.formatChatShortTime(row.createTime, true);
                if(row.timeStamp){
                    pane.find('.chat_item.out:last').find('.chat_time').html(timeDesc);
                    pane.find('.to_'+row.timeStamp).removeClass('send').find('.wct_send_status').attr('title','消息发送中');
                    var btclass = "chattime_item"+row.sessionId;
                    if(handler.webchat.timerList[btclass]){
                        handler.webchat.timerList[btclass].agentResetFun();
                    }
                }
            } else {
                var createTime = handler.webchat.currentDateTimeChanege(new Date().getTime()+ serverDiffTime);
                var timeDesc = handler.formatChatShortTime(createTime, true);
                pane.find('.to_'+data.timeStamp).find('.chat_time').html(timeDesc);
                pane.find('.to_'+data.timeStamp).removeClass('send').addClass('send_failure').find('.wct_send_status').attr('title','消息发送失败');
                $().alertmessage('showError', rep.message||errMsg);
            }
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
        }else if(type == 'file'){
            wxObj.contentDesc=handler.webchat._getFileView(wxObj.content);
            tmpl= "tmpl_webchat_msg_to_file";
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
        /*if(direction=='up'){
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
        }*/
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
            }else if(msgType == 'file'){
                isEsc=true;
                wxObj.contentDesc=handler.webchat._getFileView(wxObj.contentDesc);
                tmpl= "tmpl_webchat_msg_to_file";
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
                wxObj.contentDesc = replaceImQiniuDomain(wxObj.contentDesc);
                tmpl="tmpl_webchat_msg_from_voice";
            }else if(msgType=='file'){
                isEsc=true;
                wxObj.contentDesc=handler.webchat._getFileView(wxObj.contentDesc);
                tmpl="tmpl_webchat_msg_from_file";
            }else{
                tmpl="tmpl_webchat_msg_to";
            }
        }
        if(wxObj.contentDesc){
            wxObj.contentDesc=handler.webchat.renderEmoji(wxObj.contentDesc,isEsc);
            //wxObj.contentDesc=handler.webchat.renderUrlLink(wxObj.contentDesc);
        }
        if(msgType=='text'){
            handler.webchat.autoMatchMsg(wxObj.contentDesc,pane,wxObj.when,wxObj.sessionId);
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
        var load = "<div class='wxloading'><img src='./img/client/loading.gif'>加载中</div>";
        //var end = "<div class='wxend'>已到达顶部<div>";
        var end = "<div class='wxend'><a class = 'ds_do_action' ds_action = 'webchat.loadMoreMessageHistory' data-limit='50' data-page='1' data-_id = '"+sid+"'>查看历史会话的消息记录</a><div>";
        container.scroll(function(){
            if(container.find(".wxloading").length){
                return;
            }
           
            if(container.attr("ds_attr")==0){
                return;
            }
            var scrollTop=container.scrollTop();
            var time=container.attr("ds_time");
            var chat_num = container.find(".chat_popover").length;
            var page= container.attr("ds_attr")=="0" ? 0 : (Math.ceil(chat_num /10)+1);
            //console.info("page==="+page);
            if(scrollTop==0){
                $(load).prependTo(_container).css("display","block");
                var param={
                    page:page,
                    sessionId:sid
                }
                var action = {
                    action: "app.webchat.queryUserHistory",
                    data: param
                };
                DS.send(action, function (rep) {
                    if (rep.success) {
                        // page++;
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
                                    lastTime=obj.dateTime;
                                }
                                var last=null;
                                if(i<idx){
                                    last=list[i+1];
                                }

                                html.push(handler.webchat.showMsg(obj,pane,"up",last,i));
                            }
                            container.attr("ds_time",lastTime);
                            _container.prepend(html.join(""));
                            container.scrollTop(150);
                            var voices = _container.find(".chat_popover.voice");
                            voices.each(function(){
                                handler.webchat.initAudio($(this));
                            });
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
        var param={
            page:2,
            sessionId:sid
        }
        var action = {
            action: "app.webchat.queryUserHistory",
            data: param
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                var list=rep.list;
                if(list.length==0){
                    $(end).prependTo(_container);
                    container.attr("ds_attr",0);
                }
            } else {
                $().alertmessage('showError', rep.message||errMsg);
            }
        },null,null,true);
    },
    loadMoreMessageHistory:function(data,src){
        var pane = src.closest(".call_detail");
        var _id =src.attr("data-_id");
        var sid = $("#view_nav_webchat").find(".list_item").find(".item"+_id).attr("ds_attr");
        var page= src.attr("data-page");
        var limit = src.attr("data-limit");
        var container=pane.find(".chat_msg");
        var _container=container.find(".msg_inner");
        var dateTime = container.attr("ds_time");
        var end = "<div class='wxend'>没有更多了<div>";
        var load = "<div class='wxloading'><img src='./img/client/loading.gif'>加载中</div>";
        if(!sid){
            $().alertmessage('showError', "加载失败");
            return false;
        }
        _container.prepend(load).find('.wxloading').show();
        var param={
            page:page,
            limit:limit,
            sid:sid,
            dateTime:dateTime
        }
        var action = {
            action: "app.webchat.queryHistory",
            data: param
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                if(page=="1" && _container.find(".history").length==0){
                    _container.prepend(' <div class="history" style = "color:grey;text-align:center;">——  以上是历史会话消息  ——</div>  ');
                }
                page++;
                _container.prepend(' <a class = "msg-skip" style = "display:block"></a>');
                _container.find('.wxloading').remove();
                container.find(".wxend").remove();
                container.find(".wxloading").remove();
                var show = "<div class='wxend'><a class = 'ds_do_action' ds_action = 'webchat.loadMoreMessageHistory' data-limit='50' data-page='"+page+"' data-_id = '"+_id+"'>查看历史会话的消息记录</a><div>";
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
                        html.push(handler.webchat.showMsg(obj,pane,"up",last,i));
                    }
                    _container.prepend(html.join(""));
                    //container.scrollTop(150);
                    var voices = _container.find(".chat_popover.voice");
                    voices.each(function(){
                        handler.webchat.initAudio($(this));
                    });

                    $(show).prependTo(_container);
                }else{
                    $(end).prependTo(_container);
                    container.attr("ds_attr",0);
                }
                var scrollTopold=container.find('a.msg-skip:first').position().top;
                container.scrollTop(scrollTopold-30);
            } else {
                $().alertmessage('showError', rep.message||errMsg);
            }
        },null,null,true);

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
    wechatQQFace: ['/::)', '/::~', '/::B', '/::|', '/:8-)', '/::<', '/::$', '/::X', '/::Z', '/::\'(', '/::-|', '/::@', '/::P', '/::D', '/::O', '/::(', '/::+', '/:-b', '/::Q', '/::T', '/:,@P', '/:,@-D', '/::d', '/:,@o', '/::g', '/:|-)', '/::!', '/::L', '/::>', '/::,@', '/:,@f', '/::-S', '/:?', '/:,@x', '/:,@@', '/::8', '/:,@!', '/:!!!', '/:xx', '/:bye', '/:wipe', '/:dig', '/:handclap', '/:&-(', '/:B-)', '/:<@', '/:@>', '/::-O', '/:>-|', '/:P-(', '/::\'|', '/:X-)', '/::*', '/:@x', '/:8*', '/:pd', '/:<W>', '/:beer',
        '/:basketb', '/:oo', '/:coffee', '/:eat', '/:pig', '/:rose', '/:fade', '/:showlove', '/:heart', '/:break', '/:cake', '/:li','/:bome','/:kn','/:footb','/:ladybug','/:shit','/:moon','/:sun','/:gift','/:hug','/:strong','/:weak','/:share','/:v','/:@)','/:jj','/:@@','/:bad','/:lvu','/:no','/:ok'],

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
    initImgClipboardUploadForWebchat:  function(pane,sid){

        var getQiNiuToken = function (callback) {
            var that = QiniuWebchat;
            var ajax = that.createAjax();
            ajax.open('GET', that.uptoken_url || '/action?action=app.webchat.getImUptoken&data={}&sessionId=' + session.id, true);
            ajax.setRequestHeader("If-Modified-Since", "0");
            ajax.onreadystatechange = function () {
                if (ajax.readyState === 4 && ajax.status === 200) {
                    var res = that.parseJSON(ajax.responseText);
                    that.token = res.uptoken;
                    if (callback) {
                        callback();
                    }
                }
            };
            ajax.send();
        }
        var textarea = pane.find("textarea.ds_selectItem_action.textarea_autocomplete")[0];
        textarea.onpaste=function(e){
            if(e.clipboardData.items){
                var ele = e.clipboardData.items;
                for (var i = 0; i < ele.length; ++i) {
                    if ( ele[i].kind == 'file' && ele[i].type.indexOf('image/') !== -1 ) {
                        var blob = ele[i].getAsFile();
                        var xhr = {};
                        if (window.XMLHttpRequest) {
                            xhr = new XMLHttpRequest();
                        } else {
                            xhr = new ActiveXObject("Microsoft.XMLHTTP");
                        }
                        var fd = new FormData();

                        var filename = "clipboard"+new Date().getTime()+".png";

                        var getkey = function() {
                            var accessId = pane.find("input[name=accessId]").val();
                            var date=getCurrentDate();
                            var today = new Date();
                            var time=today.getTime();
                            var fileName=filename;
                            var fileSuffix="";
                            if(fileName){
                                fileSuffix = fileName.substring(fileName.lastIndexOf('.'), fileName.length);
                            }
                            var key = "im/"+accessId+"/"+date+"/"+time+"/"+uuid.v1()+fileSuffix;
                            return key;
                        }
                        var key = getkey();
                        fd.append("chunk", "0");
                        fd.append("chunks", "1");
                        fd.append("name", filename);
                        fd.append("file", blob);
                        fd.append("key", key);
                        /* event listeners */
                        xhr.upload.addEventListener("progress", function () {
                        }, false);
                        xhr.addEventListener("load", function (evt) {
                            console.log(evt.target.responseText);
                            if (evt.target.status == 200) {
                                var domain = qiniu7moorImDomain;
                                var res = JSON.parse(evt.target.responseText);
                                var sourceLink = domain + res.key; //获取上传成功后的文件的Url
                                var uploadTimestamp = new Date().getTime();
                                var sid = pane.find("input[name=sid]").val();
                                var sessionId = pane.find("input[name=sessionId]").val();
                                var platform = pane.find("input[name=platform]").val();
                                var accessId = pane.find("input[name=accessId]").val();
                                var firstReplyTime = pane.find("input[name=agentFirstReplyTime]").val();
                                var manualTime = pane.find("input[name=manualTime]").val();
                                var lastRedirectTime = pane.find("input[name=lastRedirectTime]").val();
                                var lastClaimTime = pane.find("input[name=lastClaimTime]").val();
                                var data = {
                                    sid: sid,
                                    contentType:"image",
                                    sessionId: sessionId,
                                    platform: platform,
                                    accessId: accessId,
                                    agentFirstReplyTime: firstReplyTime,
                                    manualTime: manualTime,
                                    content: sourceLink,
                                    uploadTimestamp: uploadTimestamp,
                                    lastClaimTime: lastClaimTime
                                };
                                handler.webchat.replyChat(data, pane.find(".reply_webchat"));
                            } else {

                            }
                        }, false);
                        xhr.addEventListener("error", function (evt) {
                        }, false);
                        xhr.addEventListener("abort", function () {
                        }, false);
                        xhr.open("POST", "http://up.qiniu.com/");
                        var token = QiniuWebchat.token;
                        getQiNiuToken(function(){
                            token = QiniuWebchat.token;
                            fd.append("token", token );
                            xhr.send(fd);
                        });
                        break;
                    }

                }
            }
        };

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
            get_new_uptoken:true,
            domain: qiniu7moorImDomain,
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
                        container.find(".msg_inner").append(template("tmpl_webchat_msg_to_uploading_img",{timestamp: uploadTimestamp,dateTime:uploadTimestamp}));
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
                    var lastClaimTime = pane.find("input[name=lastClaimTime]").val();
                    var data = {
                        sid: sid,
                        contentType:"image",
                        sessionId: sessionId,
                        platform: platform,
                        accessId: accessId,
                        agentFirstReplyTime: firstReplyTime,
                        manualTime: manualTime,
                        content: sourceLink,
                        uploadTimestamp: uploadTimestamp,
                        lastClaimTime:lastClaimTime
                    };
                    handler.webchat.replyChat(data, pane.find(".reply_webchat"));

                },
                'Error': function(up, err, errTip) {
                    $("#" + up.uploadTimestamp).find("img").attr("src", "img/client/customer/uploadError.png");
                    $().alertmessage("showError", errTip);
                },
                'Key': function(up, file) {
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
    initQiniuFileUploadForWebchat:  function(pane, sid,_id){
        var progressId= 'webchat_upload_progress_show';
        var accessId = pane.find("input[name=accessId]").val();
        var sid = pane.find("input[name=sid]").val();
        var sessionId = pane.find("input[name=sessionId]").val();
        var platform = pane.find("input[name=platform]").val();
        var accessId = pane.find("input[name=accessId]").val();
        var manualTime = pane.find("input[name=manualTime]").val();
        var lastRedirectTime = pane.find("input[name=lastRedirectTime]").val();
        var lastClaimTime = pane.find("input[name=lastClaimTime]").val();
        console.log(accessId);
        var uploader = QiniuWebchat.uploader({
            runtimes: 'html5,flash,html4',
            browse_button: 'webchat_msg_file_btn_'+_id,
            multi_selection:false,
            max_file_size: '20mb',
            flash_swf_url: '/javascripts/qiniu/plupload/Moxie.swf',
            dragdrop: false,
            chunk_size: '4mb',
            uptoken_url: '/action?action=app.webchat.getImUptoken&data={}&sessionId=' + session.id,
            domain: qiniu7moorImDomain,
            // downtoken_url: '/downtoken',
            unique_names: false,
            save_key: false,
            auto_start: true,
            get_new_uptoken:true,
            filters: {
                /*mime_types : [
                    { title : "Image files", extensions : "jpg,jpeg,gif,png,bmp" }
                ]*/
            },
            init: {
                'FilesAdded': function(up, files) {
                    plupload.each(files, function(file) {
                        var uploadTimestamp = new Date().getTime();
                        file.uploadTimestamp = uploadTimestamp;
                        up.uploadTimestamp = uploadTimestamp;
                        var container=pane.find(".chat_msg");
                        container.find(".msg_inner").append(template("tmpl_webchat_msg_to_uploading_file",{timestamp: uploadTimestamp,fileName:file.name,dateTime:uploadTimestamp}));
                        handler.webchat._locationMsg(container);
                    });
                    $("#webchat_msg_file_btn_"+_id).closest("#file_upload").find("input:file").closest("div").remove();
                    handler.webchat.initQiniuFileUploadForWebchat(pane, sid,_id);
                },
                'BeforeUpload': function(up, file) {
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
                    //如果列表中已经没有这个会话，取消发送
                    var item = $("#"+_id+"_popupWebchat");
                    if(item.length==0){
                        up.stop();
                        $("#" + up.uploadTimestamp).find(".file_upload_status").text("上传中断");
                        $().alertmessage("showError", "上传中断");
                    }
                    var bar = $("#" + up.uploadTimestamp).find(".bar");
                    if(bar.length<1){
                        var container=pane.find(".chat_msg");
                        container.find(".msg_inner").append(template("tmpl_webchat_msg_to_uploading_file",{timestamp: up.uploadTimestamp,fileName:file.name,dateTime:up.uploadTimestamp}));
                        handler.webchat._locationMsg(container);
                    }
                    var percent = file.percent;
                    $("#" + up.uploadTimestamp).find(".bar").css("width",percent+"%");
                    $("#" + up.uploadTimestamp).find(".file_upload_percent").text(percent+"%");
                    if(percent==100){
                        $("#" + up.uploadTimestamp).find(".file_upload_status").text("上传完成正在发送给对方");
                    }
                },
                'UploadComplete': function() {
                    console.log("uploadcomplete all");

                },
                'FileUploaded': function(up, file, info) {
                    var firstReplyTime = pane.find("input[name=agentFirstReplyTime]").val();
                    var domain = up.getOption('domain');
                    var res = JSON.parse(info);
                    var sourceLink = domain + res.key; //获取上传成功后的文件的Url
                    var uploadTimestamp = file.uploadTimestamp;

                    function bytesToSize(bytes) {
                        if (bytes === 0) return '0 B';
                        var k = 1024, // or 1024
                            sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
                            i = Math.floor(Math.log(bytes) / Math.log(k));
                        return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
                    }
                    var fileSize = bytesToSize(file.size);

                    var data = {
                        sid: sid,
                        contentType:"file",
                        sessionId: sessionId,
                        platform: platform,
                        accessId: accessId,
                        agentFirstReplyTime: firstReplyTime,
                        manualTime: manualTime,
                        content: sourceLink+"?fileName="+file.name+"?fileSize="+fileSize,
                        uploadTimestamp: uploadTimestamp,
                        lastClaimTime: lastClaimTime
                    };
                    handler.webchat.replyChat(data, pane.find(".reply_webchat"));

                },
                'Error': function(up, err, errTip) {
                    $("#" + up.uploadTimestamp).find(".file_upload_status").text("上传失败");
                    $().alertmessage("showError", errTip);
                },
                'Key': function(up, file) {
                    var date=getCurrentDate();
                    var today = new Date();
                    var time=today.getTime();
                    var fileName=file.name;
                    var fileSuffix="";
                    if(fileName){
                        fileSuffix = fileName.substring(fileName.lastIndexOf('.'), fileName.length);
                    }
                    var key = "im/"+accessId+"/"+date+"/"+time+"/"+file.name;
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
                    var pattern = new RegExp(":" + item + ":", "gm");
                    message = message.replace(pattern, span);
                }
            }
        }
        message = handler.webchat.renderWechatQQFace(message);
        return message;
    },

    renderWechatQQFace: function(message){
        var ary=handler.webchat.wechatQQFace||[];
        for(var i = 0; i< ary.length; i++){
            var item=ary[i];
            item = escapeChatHtml(item);

            if(message.indexOf(item)!=-1){
                var tempItem = item;
                if(tempItem.match(/[\^\$\.\*\+\-\?\|\(\)]/g)){
                    tempItem = tempItem.replace(/\$/gm, "\\$");
                    tempItem = tempItem.replace(/\./gm, "\\.");
                    tempItem = tempItem.replace(/\*/gm, "\\*");
                    tempItem = tempItem.replace(/\+/gm, "\\+");
                    tempItem = tempItem.replace(/\-/gm, "\\-");
                    tempItem = tempItem.replace(/\?/gm, "\\?");
                    tempItem = tempItem.replace(/\|/gm, "\\|");
                    tempItem = tempItem.replace(/\(/gm, "\\(");
                    tempItem = tempItem.replace(/\)/gm, "\\)");
                }

                var span = '<span class="qq-face" style="background-position: 0px ' + (-(24 * i)) + 'px;"></span>';

                try{
                    var pattern = new RegExp(tempItem , "gm");
                    message= message.replace(pattern, span);
                }catch(e) {
                    console.log(e);
                    return message;
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
    showFontSize:function(data,src){
        var str=src.closest(".chat_toolbar").children(".imFontCon");
        if(str.css("display")=="none"){
            str.show();
        }else{
            str.hide();
        }
    },
    getEmojiCode: function (data, src) {
        var pane= src.closest(".webchat_container");
        var text = pane.find("textarea[name='content']");
        var textRobot =  pane.find("textarea[name='contentRobot']");
        text.val(text.val() + ":" + data + ":");
        textRobot.val(textRobot.val() + ":" + data + ":");
        text.focus();
        textRobot.focus();
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

    _getChatOnlineAgentNoCache:function(currentId,hideMe, peerId){
        var loadUsers2ChatNoCache = function(isEnable,isEmpty,currentId,hideMe){
            var agents=getCache("agents",null,true);
            var _agents=[];
            if(isEnable){
                for(var i=0;i<agents.length;i++){
                    var u=agents[i];
                    if(u.status=='enable'){
                        _agents.push(u);
                    }
                }
            }else{
                for(var i=0;i<agents.length;i++){
                    var u=agents[i];
                    _agents.push(u);
                }
            }
            if(hideMe){
                for(var i=0;i<_agents.length;i++){
                    var u=_agents[i];
                    if(u._id==currentId){
                        _agents.splice(i,1);
                        break;
                    }
                }
            }
            var _agents2=[];
            if(isEmpty){
                var emptyAgents=[{_id:"",displayName:"放入领取池",pinyin:"wusuoshuren",exten:'',status:'enable'}];
                _agents2=emptyAgents.concat(_agents);
            }else{
                _agents2=_agents;
            }
            return _agents2;
        }
        var agents=loadUsers2ChatNoCache(true,true,currentId,hideMe);
        var onlines=getCache("onlineChannelAgent",null,true);
        var peer= getCache("accessChannelAgent", peerId,true);
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
    /**
     * 移除用户等待时间的计时器
     * @param sessionId
     */
    removeTimer: function(sessionId){
        var btclass = "chattime_item"+sessionId;
        if(handler.webchat.timerList[btclass]){
            handler.webchat.timerList[btclass].end();
        }
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
                            if($('#webchat_kmpopover').attr("sessionId") ==sid){
                                $('#webchat_kmpopover').hide();
                            }
                            if(left.find('.ds_search_filter').find('.badge-info').length){
                                left.find('.item'+sid).remove();
                            }else{
                                left.find(".normal_search").click();
                            }

                            handler.webchat.removeTimer(sid);
                        }
                        if(handler.webchat.haveClaim){
                            handler.webchat.autoClaimWebchatSession();
                        }
                        handler.webchat.curDealCount = handler.webchat.curDealCount - 1;
                        handler.webchat.refreshMenuBadge(true);
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
    transferGroup:function(data,pane){
        var sid=data._id;
        var owner=data.user;
        var peerId = data.toPeer;
        var chatUid=data.sid;
        pane.find("#combobox_webchat_change_group_desc").click(function(){
            $(this).hide();
            pane.find("#combobox_webchat_change_group").show().focus();
        });
        pane.find("#combobox_webchat_change_group" ).combobox3({
            minLength:0,
            displayField:pane.find("#combobox_webchat_change_group_desc"),
            source: function( request, response ) {
                var groups=handler.webchat.skillGroup;

                //计算在线人数
                var newGroups = [];
                for(var i =0;i<groups.length;i++){
                    var group = groups[i];
                    var agents=handler.webchat._getChatOnlineAgent(null,false, group.Exten);
                    group.onlineNum = agents.length;
                    if(group.onlineNum>1){
                        newGroups.push(group);
                    }else if(group.onlineNum>0){
                        //如果技能组里只剩下自己则不显示
                        if(agents[0]._id != session.user._id){
                            newGroups.push(group);
                        }
                    }
                }
                //
                var matcher = new RegExp( "^" + $.ui.autocomplete.escapeRegex( request.term ), "i" );
                if(request.term){
                    response( $.grep(newGroups, function( item ){
                        return matcher.test(item.displayName)||matcher.test(item.exten)||matcher.test(item.pinyin);
                    }) );
                }else{
                    response(newGroups);
                }
            },
            select: function( event, ui ) {
                //console.dir(ui)

                var toPeer = ui.item.Exten;
                var queueId = ui.item._id;
                var uname=ui.item.displayName||'';
                //var src = $(event.currentTarget);
                var paneId=sid+"_popupWebchat";
                var right=$("#"+paneId);
                var left=handler.webchat._getSubPane("left");

                var action = {
                    action: 'app.webchat.redirectWebchatSession',
                    data: {_id:sid,toPeer:toPeer,sid:chatUid,queueId:queueId}
                };
                DS.send(action,function(rep){
                    if(rep.success){
                        pane.find( "#combobox_webchat_owner").blur();
                        handler.webchat._syncCardLimit(sid);
                        right.remove();
                        if($('#webchat_kmpopover').attr("sessionId") ==sid){
                            $('#webchat_kmpopover').hide();
                        }
                        if(left.find('.ds_search_filter').find('.badge-info').length){
                            left.find('.item'+sid).remove();
                        }else{
                            left.find(".normal_search").click();
                        }

                        handler.webchat.removeTimer(sid);
                        if(handler.webchat.haveClaim){
                            handler.webchat.autoClaimWebchatSession();
                        }
                        handler.webchat.curDealCount = handler.webchat.curDealCount - 1;
                        handler.webchat.refreshMenuBadge(true);
                    }else{
                        $().alertmessage('showError', rep.message || errMsg);
                    }
                });
                return false;
            },
            open: function(event, ui) {
                var instance=pane.find("#combobox_webchat_change_group").data("custom-combobox");
                var _owner=pane.find("#combobox_webchat_change_group_desc").attr("uid");
                if(_owner=='NA'){
                    _owner="";
                }
                var val=pane.find("#combobox_webchat_change_group").val();
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
            if(chatSession.status=="deal" && session.user._id == chatSession.invitedUser){
                //如果是被邀请,不可进行删除
                chatSession.isInvitedUser=true;
            }

            if(chatSession.lastCustomerMsgTimeStamp){
                var lastCustomerMsgTime = handler.getFormatDateTime(new Date(chatSession.lastCustomerMsgTimeStamp))
                var _t=handler.formatShortTime(lastCustomerMsgTime);
                chatSession.shortTime=_t.name;
                chatSession.createTime = lastCustomerMsgTime;
            }

            chatSession = handler.webchat.editCardTmpl(chatSession,container);
            var card=template("tmpl_webchat_item",chatSession);
            var flag = _p.find('.ds_search_filter').css('display');//是否在进行搜索
            if(flag == 'none'){
                container.prepend(card);
                var btclass = "chattime_item"+chatSession._id;
                handler.webchat.webchatHourMeter(btclass,chatSession.startWaitTimer,chatSession.userStatusClass);
                /*if(custTime>agentTime){
                    handler.webchat.timerList[btclass].agentResetFun();
                    handler.webchat.timerList[btclass].custResetFun();
                }*/
            }else{
                _p.find(".todo-advanced-search-refresh").click();
            }
            dsevent.bind('.webchat_item', dsevent.evt.refreshCustomerName ,function(event, params){
                if($(this).attr('cust_id') == params.custId){
                    var custPane = $(this).find(".card_row_title");
                    if(custPane && custPane.length > 0){
                        custPane.text(params.custName);
                    }
                }
            });
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
            if(chatSession.status=="deal" && session.user._id == chatSession.invitedUser){
                //如果是被邀请,不可进行删除
                chatSession.isInvitedUser=true;
            }
            chatSession = handler.webchat.editCardTmpl(chatSession,container);
            var card=template("tmpl_webchat_item",chatSession);
            container.prepend(card);
            var agentTime = chatSession.lastAgentMsgTimeStamp;
            var custTime = chatSession.startCustomerWaitTimeStamp || chatSession.lastClaimTime;
            if(!custTime){
                custTime = new Date(chatSession.CreateTime).getTime();
            }
            var btclass = "chattime_item"+chatSession._id;
            handler.webchat.webchatHourMeter(btclass,agentTime,chatSession.userStatusClass,custTime);

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
                if($('#webchat_kmpopover').attr("sessionId") ==sid){
                    $('#webchat_kmpopover').hide();
                }
                $().alertmessage('showSuccess',"已领取，请到“待处理”中查看");
            } else {
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    autoClaimWebchatSession:function(obj){
        //console.log(handler.webchat.curDealCount+"==="+session.user.imDealCount);
        //
        //var autoClaim = handler.webchat.autoClaim;
        //if(obj && obj.todoNum){
        //    handler.webchat.curDealCount = obj.todoNum || 0;
        //}
        //if(!autoClaim || handler.webchat.curDealCount >= session.user.imDealCount){
        //    handler.webchat.haveClaim = true;
        //    if(obj && (obj.todoNum || obj.openNum)){
        //        handler.webchat.refreshMenuBadge(false, obj.todoNum, obj.openNum);
        //    }
        //    return;
        //}
        //console.log('---autoClaimWebchatSession --- run--' +handler.webchat.curDealCount);
        //var action = {
        //    action: "app.webchat.autoClaimWebchatSession",
        //    data: {
        //        curDealCount:handler.webchat.curDealCount //当前正在处理的对话数量
        //    }
        //};
        //try{
        //    handler.webchat.haveClaim = false;
        //    DS.send(action, function (rep) {
        //        handler.webchat.haveClaim = true;
        //        if (rep.success) {
        //            console.log('--------autoClaimWebchatSession ---- end');
        //            console.dir(rep.list);
        //            if(rep.list){
        //                handler.webchat.curDealCount = handler.webchat.curDealCount + rep.list.length;
        //                console.log('--------autoClaimWebchatSession ---- '+rep.list.length);
        //                for(var i = 0; i<rep.list.length; i++){
        //                    handler.webchat.webchatTodoItemAdd(rep.list[i]);
        //                }
        //                handler.webchat.refreshMenuBadge(true);
        //                //console.log("curCount:"+handler.webchat.curDealCount);
        //                //handler.webchat.refreshQueryBadge('webchat_todo',handler.webchat.curDealCount);
        //                if(rep.list.length> 0){
        //                    emitNotify("您有新的消息", "领取了新的会话");
        //                }
        //            }
        //        } else {
        //            $().alertmessage('showError', rep.message||errMsg);
        //        }
        //
        //    });
        //}catch(e){
        //    handler.webchat.haveClaim = true;
        //}

    },

    updateAutoClaimWebchatSessionStatus: function(status){
        var action = {
            action: "app.webchat.updateAutoClaimWebchatSessionStatus",
            data: {
                status:status //当前状态
            }
        };

        DS.send(action, function(rep){
            if (rep.success) {

            } else {
                $().alertmessage("showError", "操作失败");
                if(status == "close"){
                    handler.webchat.autoClaim = true;
                    $('#autoclaim_switch').bootstrapSwitch('state', true,true);
                }else{
                    handler.webchat.autoClaim = false;
                    $('#autoclaim_switch').bootstrapSwitch('state', false,true);

                }
            }
        });
    },

    closeSession:function(key,src){
        if($("#endsession .btn-container button").attr("ds_data")==""){
            $().alertmessage('showError',"请选择要关闭的会话分类");
            return false;
        }else{
            $('#endsession').modal('hide');
        }
        var content=src.closest('#endsession');
        var finishReason=content.find(".session_name").attr("ds_data");
        //var pane = $("#view_webchat_todo_content .webchat_container");
        var pane1 = $("#view_webchat_todo_content .webchat_container:visible");
        var sid = pane1.find("input[name='sid']").val();
        var _id = pane1.find("input[name='sessionId']").val();
        var key=content.find(".session_name").val();
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
                handler.webchat.removeTimer(_id);
                call_right.remove();
                if($('#webchat_kmpopover').attr("sessionId") ==_id){
                    $('#webchat_kmpopover').hide();
                }
                if(handler.webchat.curDealCount > 0){
                    handler.webchat.curDealCount = handler.webchat.curDealCount - 1;
                }
                if(pane.find('.ds_search_filter').find('.badge-info').length == 0){
                    pane.find(".normal_search").click();
                }else{
                    //点击高级搜索的刷新
                    pane.find(".todo-advanced-search-refresh").click();
                }
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
        var content=src.closest('.modal');
        var finishReason=content.find(".session_name").attr("ds_data");
        var pane = $("#view_webchat_todo").find('.list_container');
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
                    handler.webchat.removeTimer(list_arr[i]._id);
                   $("#"+list_arr[i]._id+"_popupWebchat").remove();
                }
                handler.webchat.refreshBadge(-list.length, "todo");
                handler.cancelDealToolbar("webchat");
                if(handler.webchat.haveClaim){
                    handler.webchat.autoClaimWebchatSession();
                }
                if($("#view_webchat_todo").find('.ds_search_filter').find('.badge-info').length != 0){
                    $("#view_webchat_todo").find(".todo-advanced-search-refresh").click();
                }
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
            //return false;
        }
        var accessId = pane.find("input[name='accessId']").val() || pane.find("input[name='copy_accessId']").val();
        var sid = pane.find("input[name='sessionId']").val() || pane.find("input[name='copy_sessionId']").val();
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
        //$(".webchat_remark_box").scrollTop($(".webchat_remark_box")[0].scrollHeight);
        var pane = src.closest(".webchat_container");
        var remarkText = pane.find("textarea[name='remark']");
        remarkText.css("outline","none!important");
        remarkText.css("border", "1px solid #cccccc");
        remarkText.css("box-shadow", "");
    },
    /*在线咨询快捷回复初始化*/
    initQuickReply: function(pane){
        var action = {
            action: 'app.webchat.getQuickReplyList',
            data: {account:session.account,moduleType:'webchat'}
        };
        DS.send(action, function(rep){
            var quickReplyView = template("tmpl_webchat_quickreply_list", rep);
            pane.find(".span3").find(".webchat_quickreply_tab_system").append(quickReplyView);
        });
    },

    editQuickReply: function(data, src){
        $(src).closest('.btn_edit_quickreply').hide();
        var span = src.closest(".span3");
        var listpane = span.find(".webchat_quickreply_list");
        var editpane = span.find(".webchat_quickreply_edit");
        listpane.css("display", "none");
        editpane.css("display", "block");

    },

    editRemarks: function(data, src){
        var span = src.closest('.webchat_remark_box');
        span.find('textarea')[0].focus();
    },
    /*在线咨询快捷回复自定义模块保存更新*/
    saveQuickReply: function(data, src){
        var action = {
            action: 'app.webchat.saveQuickReply',
            data: {quickreplys: data.quickreplys,moduleType:'webchat'}
        };
        DS.send(action, function(rep){
            if(rep.success){
                var pane1 = src.closest(".call_detail");
                var pane = src.closest(".webchat_quickreply_container");
                $().alertmessage('showSuccess', '快捷回复保存成功');
                $(src).closest('.webchat_quickreply_container').find('.btn_edit_quickreply').show();
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
        span.find('.btn_edit_quickreply').show();
        $(src).closest(".webchat_quickreply_tab_system").scrollTop(0);
    },

    addQuickReply: function(data, src){
        var editContainer = src.closest(".webchat_quickreply_edit_container");
        var quickReplyItem = template("tmpl_webchat_quickreply_edit");
        editContainer.append(quickReplyItem);
        $(src).closest(".webchat_quickreply_tab_system").scrollTop(editContainer.closest('.webchat_quickreply_container')[0].scrollHeight);
    },

    removeQuickReply: function(data, src){
        var div = src.closest(".quickreply_item");
        div.remove();
    },

    sendQuickReply: function(data, src){
        data=data||$(src).closest(".system_reply_li").attr("data");
        var webchatContainer = src.closest(".webchat_container");
        //var chatinput = webchatContainer.find("textarea[name='content']");
        //chatinput.val(chatinput.val() + data);
        var formData = DS.util.getDataOfForm(webchatContainer.find("form"));
        var webchatData = formData.data;
        webchatData.content = data;
        delete webchatData.quickreplys;
        handler.webchat.replyChat(webchatData, webchatContainer.find(".reply_webchat"),true);
    },
    editSystemQuickReply:function(data,src){
        var webchatContainer = src.closest(".webchat_container");
        var html=webchatContainer.find("textarea[name=content]").val();
        var content='';
        content=$(src).closest(".system_reply_li").attr("data")||$(src).closest(".webchat_reply_li").attr("title");
        html +=content;
        webchatContainer.find("textarea[name=content]").val(html).focus();
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

    autoMatchMsg:function (str,pane,when,sid){
        var regName=/[\s,.\?;!:、，。？；！： ]+(.*(先生|小姐|女士|男士|公司))/gm;
        var regName2=/(.*(先生|小姐|女士|男士|公司))/gm;
        var regPhone=/((\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$)/gm;
        var container=pane.find(".cust_base_fields");
        var ary=regName.exec(str);
        var _pane = pane.find('.contact_summary');
        var cust_name = container.find("input[name=custName]").val();
        var cust_phone = container.find("input[name=custPhone]").val();
        var callId = '';
        if(pane.hasClass('call_detail')){
            callId = pane.attr('id');
        }else{
            callId = pane.closest('.content_pane').find('.call_detail').attr('id');
        }
        var data={
            custName:cust_name,
            custPhone:cust_phone,
            callId:callId
        };
        var _when = container.find("input[name=custName]").attr('when');
        if(ary&& ary.length>0){
            if(when >= _when){
                container.find("input[name=custName]").val(RegExp.$1);
                container.find("input[name=custName]").attr('when',when);
            }
            data.custName = container.find("input[name=custName]").val();
            handler.webchat.getMatchMsgResponse(data,_pane);
        }else{
            var _ary=regName2.exec(str);
            if(_ary&& _ary.length>0) {
                if(when >= _when){
                    container.find("input[name=custName]").val(RegExp.$1);
                    container.find("input[name=custName]").attr('when',when);
                }
                data.custName = container.find("input[name=custName]").val();
                handler.webchat.getMatchMsgResponse(data,_pane);
            }
        }

        var ary1=regPhone.exec(str);
        var phone_when = container.find("input[name=custPhone]").attr('when');
        if(ary1&& ary1.length>0){
            if(when >= phone_when){
                container.find("input[name=custPhone]").val(ary1[0]);
                container.find("input[name=custPhone]").attr('when',when);
                data.custPhone = container.find("input[name=custPhone]").val();
            }
            data.custName = container.find("input[name=custName]").val();
            handler.webchat.getMatchMsgResponse(data,_pane);
        }
    },
    queryMatchMsgCust:function(data,src){
        var _pane = src.closest('.contact_summary');
        data.callId = src.closest('.call_detail').attr('id');
        handler.webchat.getMatchMsgResponse(data,_pane,true);
    },
    getMatchMsgResponse:function(data,pane,show){
        var _pane = pane.closest('.call_detail');
        if(data.custName == '' && data.custPhone == ''){
            var html = "已有0位客户相匹配";
            _pane.find('.exist_custom').html(html).attr('isResize','true');
            handler.webchat.resCustTabContentHeight(_pane);
            return;
        };
        var callTel = data.callId.split('_');
        var action = {
            action: 'app.popup.queryCustomerByPopup',
            data:{callId: data.callId,
                callTel: callTel[0],
                combox: data.custPhone,
                field: "phone"       //根据电话查询
            }
        };
        var lis = '';
        var repList = [];
        DS.send(action, function(rep){
            if(rep.success){
                if(rep.list.length){
                    repList = repList.concat(rep.list);
                }
            }else{
                $().alertmessage('showError', rep.message || errMsg);
            }
        },'POST',false);
        var action1 = {
            action: 'app.popup.queryCustomerByPopup',
            data:{callId: data.callId,
                callTel: callTel[0],
                combox: data.custName,
                field: "displayName"     //根据名称查询
            }
        };
        DS.send(action1, function(rep){
            if(rep.success){
                if(rep.list.length){
                    repList = repList.concat(rep.list);
                }
            }else{
                $().alertmessage('showError', rep.message || errMsg);
            }
        },'POST',false);
        var _data = {
            callId:data.callId,
            _phone:data.custPhone,
            name:data.custName
        };
        var new_replist = new Array();
        for(var i=0;i<repList.length;i++){
            var flag = true;
            for(var a=0;a<new_replist.length;a++){
                if(repList[i]._id == new_replist[a]._id){
                    flag = false;
                    break;
                }
            }
            if(flag){
                new_replist.push(repList[i]);
            }
        }

        if(new_replist.length){
            lis = "已有"+new_replist.length+"位客户相匹配,请<a class='exist_custom_a' onclick=\"$(this).closest('form').find('.query_cust_info').click()\">绑定已存在客户</a>";
        }else{
            lis = "已有0位客户相匹配";
        }
        _pane.find('.exist_custom').html(lis).attr('isResize','true');
        handler.webchat.resCustTabContentHeight(_pane);
        handler.webchat.placeMatchMsgResponse(new_replist,_data);
        if(show){
            $('#existing_customers_box').modal();
        }
    },
    getIvr:function(){
        //获取座席会话数范围
        var action = {
            action: 'config.user.getCurrentUser'
        };
        DS.send(action, function (response) {
            //console.log(response);
            if (response.success) {
                var user = response.user;
                var max = parseInt(user.maxImDealCount);
                var min = parseInt(user.minImDealCount);
                for(var i=min;i<=max;i++){
                    $('#imDealCount').append("<option value='"+i+"'>"+i+"</option>");
                }
                $('#imDealCount').val(user.imDealCount);

            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    getImFontCon:function(){
        var localSize=window.localStorage.getItem("imFontCon");
        if(!localSize){
            localSize=12;
        }
        $("#setImStyleContainer").html(".setImFonts,.setImFonts pre{font-size:"+localSize+"px;}");
        $(".imFontCon").children("li[font="+localSize+"]").addClass("active").siblings().removeClass("active");
    },
    changeImFontSize:function(data,src){
        var imFontCon=src.html();
        $("#setImStyleContainer").html(".setImFonts,.setImFonts pre{font-size:"+imFontCon+"px;}");
        $(".imFontCon").children("li[font="+imFontCon+"]").addClass("active").siblings().removeClass("active");
        window.localStorage.setItem("imFontCon",imFontCon);
        $(".imFontCon").hide();
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
            var dics=getCache('channelDic');
            var _dics=[];
            for (var i = 0; i < dics.length; i++) {
                var obj = dics[i];
                if(obj.type=="webchat"){
                    _dics=obj.options||[];
                    break;
                }
            }
            if(_dics.length==0){
                $().alertmessage('showError', "请通知管理员设置‘在线咨询结束会话类别’");
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
            var width = 621;
            if(level==2){
                container.find('.dic_level_3').hide();
                width = 434;
            }
            if(level==1){
                container.find('.dic_level_3').hide();
                container.find('.dic_level_2').hide();
                width = 240;
                pane.find(".tab-content .dic_level_1>.channel_dic_list").addClass('one_dic_level');
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
            $("#endsession").css('width',width).modal({backdrop:'static', keyboard:false});
            pane.find(".tab-content .dic_level_1>.channel_dic_list").find('.dic_item_desc_session')[0].click();
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
                //重置等待时间计时器
                var btclass = "chattime_item" + webchatData.sessionId;
                //if (handler.webchat.timerList[btclass]) {
                    handler.webchat.timerList[btclass].agentResetFun();
                //}

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
    },
    /**
     * 获取会话详情信息
     * @param sid
     * @param src
     */
    getChatInfo:function(sid,src,pane) {
        //var sid="c81ad310-dc25-11e5-97d2-4f46893074d0";
        var data = {_id: sid};
        if(src == "popupWebchat"){
            var cust_id = $("#view_webchat_todo").find(".item"+sid).attr("cust_id");
            data.cust_id = cust_id;
            data.queryHistory = true;
        }
        var action = {
            action: 'app.webchat.queryChatInfoById',
            data: data
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                var chat = rep.chatSession;
                var agent = getCache("agents", chat.user);
                if (!Array.isArray(agent)) {
                    chat.agentName = "[" + agent.exten + "]" + agent.displayName;
                } else {
                    chat.agentName = "";
                }
                var peer = getCacheByKey('mailQueues', "Exten", chat.toPeer);
                var ts = chat.lastTimeStamp;
                if (ts) {
                    var date = new Date();
                    date.setTime(ts);
                    var desc = handler.getFormatDateTime(date);
                    chat.lastTimeDesc = desc;
                }
                chat.beginDate = "";
                chat.duration = "";
                chat.firstResponseTimeLength = "";
                if (chat.lastTimeDesc && chat.manualTime) {
                    chat.duration = handler.webchat.millsToDate(new Date(chat.lastTimeDesc).getTime() - new Date(chat.manualTime).getTime());
                }
                if (chat.manualTime) {
                    chat.manualTime = handler.getFormatDateTime(new Date(chat.manualTime)).split(' ')[1];
                }
                if (chat.endTime) {
                    chat.endTime = handler.getFormatDateTime(new Date(chat.endTime));
                    if (chat.endTime.split(' ')[0] == chat.beginTime.split(" ")[0]) {
                        chat.endTime = chat.endTime.split(' ')[1];
                    }
                }
                if (chat.beginTime) {
                    var tempD = new Date(chat.beginTime);
                    chat.beginDate = tempD.getFullYear() + "-" + (tempD.getMonth() + 1) + "-" + tempD.getDate();
                    chat.beginTime = chat.beginTime.split(' ')[1];
                }
                if (chat.firstReplyTime) {
                    chat.firstReplyTime = handler.getFormatDateTime(new Date(chat.firstReplyTime)).split(" ")[1];
                }
                if (chat.agentFirstReplyTime) {
                    chat.agentFirstReplyTime = handler.getFormatDateTime(new Date(chat.agentFirstReplyTime)).split(" ")[1];
                }
                if (chat.seoSource == undefined || chat.seoSource == 'undefined') {
                    chat.seoSource = "";
                }
                if (chat.seoKeywords == undefined || chat.seoKeywords == 'undefined') {
                    chat.seoKeywords = "";
                }
                if(!chat.invitedUserName){
                    chat.invitedUserName = "无";
                }
                if(!chat.inviteUserStatus){
                    chat.inviteUserStatus = "未邀请";
                }
                if(chat.inviteUserStatus == "undeal"){
                    chat.inviteUserStatus = "未接受";
                }else if(chat.inviteUserStatus == "accept"){
                    chat.inviteUserStatus = "已接受";
                }
                var _p = pane;
                if (chat.fromUrl == undefined || chat.fromUrl == 'undefined') {
                    chat.fromUrl = "";
                }
                var dialogInfo = {
                    fromUrl: chat.fromUrl,                  //来源：fromUrl，
                    urlTitle: chat.urlTitle,                  //来源：urlTitle，
                    area:chat.area,                         //地域：area
                    ip:chat.ip,                             //ip:ip
                    seoSource:chat.seoSource,               //搜索来源:seoSource
                    seoKeywords:chat.seoKeywords,           //关键字:seoKeywords
                    DisplayName:peer.DisplayName,           //所属技能组:toPeer
                    invitedUserName:chat.invitedUserName,   //协作坐席：invitedUserName
                    inviteUserStatus:chat.inviteUserStatus  //邀请状态：inviteUserStatus
                };
                _p.find('.webchat_dialog_info').html(template("tmpl_webchat_dialog_info",dialogInfo));
                if (src == "relocationWebchat") {
                    var evalute = chat.investigate;
                    _p.find('.dialog_toPeer').hide();
                    var dialogInfoWebAll={
                        totalMsgCount:chat.totalMsgCount,   //消息条数：totalMsgCount
                        finishReason:chat.finishReason,     //结束类型：finishReason
                        investigate:evalute.value,          // 评价：investigate:{value:'好评',label:[''1111,'222'],content:'具体建议'}，
                        DisplayName:peer.DisplayName,       //技能组：toPeer
                        agentName:chat.agentName,           //客服：user
                        beginDate:chat.beginDate,           //对话日期：beginDate
                        manualTime:chat.manualTime,         //对话开始时间：beginTime
                        firstReplyTime:chat.firstReplyTime||chat.agentFirstReplyTime,//初次响应时间：firstReplyTime
                        endTime:chat.endTime,               //对话结束时间：lastTimeStamp
                        duration:chat.duration,             //对话时长：duration
                        evalution:evalute.value,            //评价详情中的  评价
                        label:evalute.label,                //评价详情中的   标签
                        content:evalute.content             //评价详情中的   评价详细：
                    };
                    _p.find('.webchat_consult_tab').html(template("tmpl_webchat_all_dialog_info",dialogInfoWebAll));
                }else{
                    _p.find('.webchat_access_infomation').html(template("tmpl_webchat_access_infomation",rep));
                    handler.webchat.resCustTabContentHeight(_p);
                }
            } else {
                $().alertmessage('showError',rep.message||errMsg);
            }
        });
    },
    // 获取相差时间
    millsToDate : function(mills) {
        if (mills < 0) {
            return "00:00:00";
        }
        //计算出相差天数
        var days=Math.floor(mills/(24*3600*1000))

        //计算出小时数
        var leave1=mills%(24*3600*1000)    //计算天数后剩余的毫秒数
        var hours=Math.floor(leave1/(3600*1000))
        //计算相差分钟数
        var leave2=leave1%(3600*1000)        //计算小时数后剩余的毫秒数
        var minutes=Math.floor(leave2/(60*1000))

        //计算相差秒数
        var leave3=leave2%(60*1000)      //计算分钟数后剩余的毫秒数
        var seconds=Math.round(leave3/1000)

        var str      = "";
        var _hours   = "";
        var _minutes = "";
        var _seconds = "";
        if (days != 0) {
            _hours = days * 24 + hours;
        } else {
            _hours = (hours == 0) ? "00" : (hours >= 10 ? hours : ('0' + hours));
        }
        _minutes = (minutes == 0) ? "00" : (minutes >= 10 ? minutes : ('0' + minutes));
        _seconds = (seconds == 0) ? "00" : (seconds >= 10 ? seconds : ('0' + seconds));
        str = _hours + ":" + _minutes + ":" + _seconds;
        return str;
    },
    /*自定义回复点击展示事件*/
    quickReplayShow:function(data,src){
        data=data||{};
        data.id=$(src).attr('id');
        data.moduleType = 'webchat';
        var action = {
            action: 'app.webchat.queryWebChatTagsById',
            data: data
        };
        var pane=$(src).closest('.system_quickreply_by_li');
        if(pane.hasClass('active')){
            pane.removeClass('active').find('.system_quickreply_ul').hide();
        }else{
            DS.send(action, function(rep){
                if(rep.success){
                    var content=rep.list;
                    var lis='';
                    for(var i=0;i<content.length;i++){
                        var replay=content[i];
                        lis+='<li class="webchat_reply_li system_reply_li" data="'+replay.content+'" title="'+replay.content+'">'+
                            '<div class="system_reply_li_con" >'+replay.content+'</div>'+
                            '<span class="system_reply_li_span">'+
                            '<i class="system_reply_li_send ds_do_action" ds_action="webchat.sendQuickReply"></i><i class="system_reply_li_edit ds_do_action" ds_action="webchat.editSystemQuickReply"></i>'+
                            '</span>'+
                            '</li>';
                    }
                    $(src).closest('.system_quickreply_by_li').find('.system_quickreply_ul').html(lis);
                    pane.addClass('active').find('.system_quickreply_ul').show();
                    pane.siblings().removeClass('active').find('.system_quickreply_ul').hide();
                    var num=$(src).closest('.system_quickreply_by_li').attr('num');
                    $(src).closest('.system_quickreply_lists').scrollTop(num*21);
                }else{
                    $().alertmessage('showError',rep.message||errMsg);
                }
            });
        }

    },
    /**
     * 快捷回复的输入联想
     * @param data
     * @param src
     */
    quickReplayAutoComplete: function (data, src) {
        var showLimit = 20;//显示匹配到的5条。
        var listNeedShow = [];//需要显示的数据
        var wordLast = window.wordLast;//缓存的上个单词
        var word = $(src).val().replace(/\r\n/g,"").replace(/\n/g,"").replace(/(^\s*)|(\s*$)/g,'').replace(/\\/g,'\\\\').replace(/\[/g,'\\[').replace(/\]/g,'\\]').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/\{/g,'\\{');
        var regWord = new RegExp('\^' + wordLast);
        var isAddByLastWord = false;//是否是从上次单词连续输入的
        if (wordLast && word.match(regWord)) {
            isAddByLastWord = true;
        }
        if (word&&data!==13) {
            var list = [];//用来进行匹配的数据
            if(!window.wordLastList){//缓存的上个单词的语句的list
                window.wordLastList = [];
            }
            if (!(isAddByLastWord && !window.wordLastList.length>0)) {//如果是从上次单词连续输入的，且上次单词没有匹配到结果，则不进行匹配
                if (isAddByLastWord) {
                    list = window.wordLastList;
                } else {
                    list = window.quickReplayList;
                }
                if (list) {
                    window.wordLast = word;
                    window.wordLastList = [];
                    for (var i in list) {
                        var content = list[i];
                        var reg = new RegExp('\^' + word);
                        if (content && content!='' && content.match(reg)) {
                            window.wordLastList.push(content);
                            if(listNeedShow.length<showLimit && listNeedShow.indexOf(content)<0){
                                listNeedShow.push(content)
                            }
                        }
                    }
                } else {
                    handler.webchat.getquickReplayList(data, src, handler.webchat.quickReplayAutoComplete);
                }
            }
                //以下为具体操作代码，listNeedShow为匹配到的数据
            var li_html="";
            var i = 0
            for (; i < listNeedShow.length; i++) {
                li_html +="<li class=\"ds_do_action\" ds_action=\"webchat.checkText\">"+listNeedShow[i]+"</li>" ;
            };
            $('.search-suggest ul').html(li_html);
             handler.webchat.moveAutoCompItem(src,listNeedShow);
        }else{
            $('.search-suggest').hide();
        }
    },
    moveAutoCompItem:function(src,listNeedShow){
        var str_value = $(src).val();
        var flag=[],move_left= 0,bottom=27;
        var fontSize=$(src).css("font-size").substr(0,2)-0;
        if(str_value.length>0){
            var reg=/^[\u4e00-\u9fa5]+$/;
            flag=str_value.split("");
            if(str_value.length<40){
                for (var j = 0; j < str_value.length; j++) {
                    if(!reg.test(flag[j])){
                        move_left+=fontSize/2;
                    }else{
                        move_left+=fontSize;
                    }
                }
            }else{
                bottom = 64;
                move_left = 200;
            }
        }
        if(listNeedShow.length!=0){
            $('.search-suggest').show().css({
            bottom:bottom,
            left:move_left+fontSize,
            position:'absolute'
            });
        }else{
            $('.search-suggest').hide()
        }
    },
    //鼠标选中值
    checkText:function(data,src){
        var text = $(src).text();
        var id = $(src).closest(".row-fluid").find('.textarea_autocomplete');
        id.val(text);
        id.val("").focus().val(text);
        $('.search-suggest').hide();
        handler.webchat.enterFlag = false;
    },
   selectItem:function(keyword,src,event) {
    var suggestPane = src.closest(".row-fluid").find(".suggest");
    var sugliPane=suggestPane.find("li");
    var currentSelIndex = parseInt(suggestPane.attr("ds_index"));
    var oldSelIndex = -1;
        if (keyword == "") {
            suggestPane.css("display","none");
            return;
        }
        else {
            var liLength = sugliPane.length; //获取列表数量
            if ((event.keyCode == 38 || event.keyCode == 40) && suggestPane.css("display")!= "none") {
                if (liLength > 0) {
                    oldSelIndex = currentSelIndex;
                    //上移
                    if (event.keyCode == 38) {
                        if (currentSelIndex < 0) {
                            currentSelIndex = liLength - 1;
                            suggestPane.attr("ds_index",currentSelIndex)
                        }
                        else {
                            currentSelIndex = currentSelIndex - 1;
                             suggestPane.attr("ds_index",currentSelIndex)
                        }
                        if (currentSelIndex != -1) {
                           var sugliPane=sugliPane.eq(currentSelIndex)
                           sugliPane.addClass("auto_comp_check").css("background","#eee");
                           src.val(sugliPane.text()) ;
                           handler.webchat.moveAutoCompItem(src,suggestPane.html().length);
                        }
                        if (oldSelIndex != -1) {
                           src.closest(".row-fluid").find(".suggest li").eq(oldSelIndex).css("background","#ffffff");
                        }
                    }
                    //下移
                    if (event.keyCode == 40) {
                        if (currentSelIndex == liLength - 1||currentSelIndex > liLength - 1) {
                            currentSelIndex = 0;
                            suggestPane.attr("ds_index",currentSelIndex)
                        }
                        else {
                            currentSelIndex = currentSelIndex+1;
                             suggestPane.attr("ds_index",currentSelIndex)
                        }
                        if (currentSelIndex != -1) {
                           var sugliPane=sugliPane.eq(currentSelIndex)
                           sugliPane.addClass("auto_comp_check").css("background","#eee");;
                           src.val(sugliPane.text()) ;
                           handler.webchat.moveAutoCompItem(src,suggestPane.html().length);
                        }
                        if (oldSelIndex != -1) {
                           src.closest(".row-fluid").find(".suggest li").eq(oldSelIndex).css("background","#ffffff");
                        }
                    }
                }
            }else if (event.keyCode == 13) {
                    if (suggestPane.css("display") != "none" && liLength > 0&&currentSelIndex != -1) {
                            src.val(sugliPane.eq(currentSelIndex).text());
                            suggestPane.css("display","none");
                            suggestPane.attr("ds_index",-1)
                            oldSelIndex = -1;

                    }
                }else {
                    handler.webchat.quickReplayAutoComplete(keyword,src);
                    currentSelIndex = -1;
                    suggestPane.attr("ds_index",currentSelIndex)
                    oldSelIndex = -1;
                }
        }


       /**
        * 正在键入的通知
        */
       var $form = $(src).closest("form");
       var sid =  $form.find("[name=sid]").val();
       var accessId =  $form.find("[name=accessId]").val();
       var platform =  $form.find("[name=platform]").val();
       var timestamp = new Date().getTime();
       //判断是否少于一秒
       var beforeTimestamp = $(src).attr("beforeTimestamp")|| 0;
       if((timestamp-beforeTimestamp)>2000 && platform != "weixin"){
           $(src).attr("beforeTimestamp",timestamp);
           //发送消息；
           var action = {
               action: "app.webchat.typeNotice",
               data: {sid:sid,timestamp:timestamp}
           };
           DS.send(action, function (rep) {
               if (rep.success) {

               } else {
                   $().alertmessage('showError', rep.message||errMsg);
               }
           },"POST");
       }

    },
    /**
     * 获取快捷回复的数据
     * @param data
     * @param src
     * @param callback
     */
    getquickReplayList: function (data, src, callback) {
        var action = {
            action: 'app.webchat.getAllQuickReplyList',
            data: {"moduleType":"webchat"}
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                var list = rep.list;
                //把list加入到全局缓存中
                window.quickReplayList = list;//从后台获取的所有语句的list
                callback(data, src);
            } else {
                $().alertmessage('showError', rep.message || errMsg);
            }
        });
    },

    showReplyCustom:function(data,src){
        $(src).addClass("active").siblings().removeClass("active");
        $(src).closest('.webchat_quickreply_tab').find('.system_quickreply_lists').hide();
        $(src).closest('.webchat_quickreply_tab').find('.webchat_quickreply_container').show();
    },
    showReplySystm:function(data,src){
        data=data||{};
        data.moduleType = 'webchat';
        var action = {
            action: 'app.webchat.queryWebChatAllTags',
            data: data
        };
        DS.send(action, function(rep){
            if (rep.success) {
                var tags=rep.list;
                var html='';
                if(tags.length){
                    $(src).closest('.webchat_quickreply_tab').find('.system_quickreply_lists').css('border','1px solid #ECECEC');
                    for(var i=0;i<tags.length;i++){
                        var tag={
                            numi:i,
                            _id: tags[i]._id,
                            name:tags[i].name,
                            count:tags[i].count,
                        };
                        html += template("tmpl_webchat_quickreply_systm", tag);
                    }
                }else{
                    $(src).closest('.webchat_quickreply_tab').find('.system_quickreply_lists').css('border','none');
                    html=' 您还没有设置系统快捷回复，请到快捷回复配置页面进行配置';
                }
                $(src).closest('.webchat_quickreply_tab').find('.system_quickreply_lists').html(html);
                $(src).addClass("active").siblings().removeClass("active");
                $(src).closest('.webchat_quickreply_tab').find('.system_quickreply_lists').show();
                $(src).closest('.webchat_quickreply_tab').find('.webchat_quickreply_container').hide();
            }else{
                $().alertmessage('showError',rep.message||errMsg);
            }
        });
    },
    processAutoOnlineAfterOffline: function(){
        var chatSessions = utils.deepClone(handler.webchat.users);

        var _processOfflineMessage = function(chatSessions, cb){
            if(chatSessions.length == 0){
                cb();
                return;
            }
            var chatSession = chatSessions.pop();
            var rightPane = $("#"+chatSession+"_popupWebchat");
            if(rightPane.length > 0){
                var query = {limit:50, sessionId: chatSession};
                var lastMsg=rightPane.find(".chat_item.in:last");
                var when = lastMsg.attr("ds_data");
                if(when){
                    query.when = {$gt:parseInt(when)};
                    query.type = "in";
                }
                var action = {
                    action: "app.webchat.queryUserHistory",
                    data: query
                };
                DS.send(action, function(res){
                    if(res.success){
                        var list = res.list;
                        var html=[];
                        if(when){
                            for (var i = list.length-1; i >=0; i--) {
                                var obj = list[i];
                                html.push(handler.webchat.showMsg(obj,rightPane,"down",null,i));
                            }
                            rightPane.find(".msg_inner").append(html.join(""));
                        }else{
                            rightPane.find(".msg_inner").html("");
                            if(list.length>0){
                                var idx=list.length-1;
                                for (var i = idx; i >=0; i--) {
                                    var obj = list[i];
                                    var last=null;
                                    if(i<idx){
                                        last=list[i+1];
                                    }
                                    html.push(handler.webchat.showMsg(obj,rightPane,"up",last,i));
                                }
                                rightPane.find(".msg_inner").prepend(html.join(""));
                            }
                            rightPane.find(".msg_inner").html(html.join(""));
                        }
                        handler.webchat._locationMsg(rightPane.find(".chat_msg"));

                    }
                    _processOfflineMessage(chatSessions,cb)
                });

            }else{
                _processOfflineMessage(chatSessions, cb);
            }
        };


        _processOfflineMessage(chatSessions, function(){
            /**
             * 在这期间领取的新的会话也要刷进来
             */
            var data = {
                submenu:"webchat_todo"
            }

            var action={
                action:'app.webchat.queryWebchatSession',
                data:data
            }
            DS.send(action,function(rep){
                if(rep.success){
                    var list=rep.list;
                    if (list && list.length > 0){

                        for(var i=0; i<list.length; i++){
                            var session = list[i]._id;
                            var pane=$("#view_webchat_todo");
                            var itemPane= pane.find(".item"+session);
                            if(itemPane.length == 0){
                                handler.webchat.webchatTodoItemAdd(list[i]);
                                emitNotify("您有新的消息", "领取了新的会话");
                            }
                        }
                        handler.webchat.refreshMenuBadge(true);
                        handler.webchat.refreshQueryBadge('webchat_todo',handler.webchat.curDealCount);

                    }
                }
            });
        });
    },

    /**
     * 掉线后刷新待处理列表
     */
    refreshWebchatListAfterOffline: function(){


    },
    exportWebchat: function() {
        var flag = handler.webchat.finishKeyFlag;
        if (!flag) {
            $().alertmessage('showError',"请在高级搜索中选择处理结果");
            return;
        }
        var query = handler.webchat.advancedSearchData;
        query.account = session.user.account;
        // 删除不必要的属性
        delete query.limit;
        delete query.page;
        delete query.submenu;
        //处理scope是否为level
        if(session.user.scope.chat!="all"){
            query.lowUsers = session.user.moduleUsers.chat;
        }

        var action = {
            action: "app.excel.exportXls",
            data: {
                Method: "exportWebchat",
                Query: query
            }
        };
        DS.send(action, function(rep) {
            if(rep.Succeed){
                downloadFile(rep.path);
            }else{
                alert('导出失败！');
            }
        });
    },
    webchatGrab: function(data,src) {
        var action = {
            action: 'app.webchat.grabWebchatSession',
            data: {_id:data._id,toUser:session.user._id,toUserName:session.user.displayName,sid:data.sid,currUser:data.currUser}
        };
        DS.send(action,function(rep){
            if(rep.success){
                $().alertmessage('showSuccess', '抢接成功');
                //刷新列表
                $("#frm_webchat_normal_search .icon-refresh").closest("span").click();
                $(".btn_webchat_todo").click();
            }else{
                $().alertmessage('showError', rep.message || errMsg);
            }
        });
    },
    inviteAgent: function(data,pane) {
        var sid=data._id;
        var chatUid=data.sid;
        var owner=data.user;
        var peerId = data.toPeer;

        pane.find("#combobox_webchat_invite_owner_desc").click(function(){
            $(this).hide();
            pane.find("#combobox_webchat_invite_owner").show().focus();
        });
        pane.find("#combobox_webchat_invite_owner" ).combobox4({
            minLength:0,
            displayField:pane.find("#combobox_webchat_invite_owner_desc"),
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
                    action: 'app.webchat.inviteGroupSession',
                    data: {_id:sid,invitedUser:_owner,invitedUserName:uname,sid:chatUid}
                };
                DS.send(action,function(rep){
                    if(rep.success){
                        pane.find( "#combobox_webchat_invite_owner").blur();
                        //邀请请求成功，出现等待框
                        $("#cancel_webchat"+sid).find(".invited_name").text(uname);
                         $("#cancel_webchat"+sid).show();
                        right.find(".invitedUser span").text(uname);
                        right.find(".invitedStatus span").text("未接受");
                    }else{
                        $().alertmessage('showError', rep.message || errMsg);
                    }
                });
                return false;
            },
            open: function(event, ui) {
                var instance=pane.find("#combobox_webchat_invite_owner").data("custom-combobox");
                var _owner=pane.find("#combobox_webchat_invite_owner_desc").attr("uid");
                if(_owner=='NA'){
                    _owner="";
                }
                var val=pane.find("#combobox_webchat_invite_owner").val();
                if(instance && !val){
                    var container=instance.menu.element;
                    container.find("li").each(function(i){
                        var _uid=$(this).attr("uid");
                        if(_uid==_owner){
                            //  $(this).addClass("ui-state-focus");
                            $(this).css({'background-color':'#08c','color':'#fff'});
                            var _scrollTop=$(this).offset().top-container.offset().top+container.scrollTop();
                            container.animate({scrollTop:_scrollTop-65},"fast");
                        }
                    })
                }
            }
        })
    },
    cancelInvite: function(data,src) {
        var inviteUserName=data.inviteUserName;
        var action = {
            action: 'app.webchat.cancelGroupSession',
            data: {_id:data}
        };
        DS.send(action,function(rep){
            if(rep.success){
                $().alertmessage('showSuccess',"取消邀请");
                 $("#cancel_webchat"+rep.session._id).hide();
                var paneId=rep.session._id+"_popupWebchat";
                var right=$("#"+paneId);
                right.find(".invitedUser span").text("无");
                right.find(".invitedStatus span").text("未邀请");
            }else{
                 $("#cancel_webchat"+rep.session._id).hide();
                $().alertmessage('showError', rep.message || errMsg);

            }
        });
    },
    acceptInvite: function(data,src) {
        //判断是否已经超会话上限

        if(session.user.imDealCount-handler.webchat.curDealCount>0 ){
            var inviteUserName=data.inviteUserName;
            var action = {
                action: 'app.webchat.acceptGroupSession',
                data: {_id:data._id,sid:data.sid,toPeer:data.toPeer}
            };
            DS.send(action,function(rep){
                if(rep.success){
                    $().alertmessage('showSuccess',"接受邀请");
                    $(".webchat_another_invite").find("#invite_person_"+data._id).remove();
                    handler.webchat.webchatTodoItemAdd(rep.session);
                    handler.webchat.curDealCount = handler.webchat.curDealCount + 1;
                }else{
                    $().alertmessage('showError', rep.message || errMsg);
                    $(".webchat_another_invite").find("#invite_person_"+data._id).remove();
                }
            });
        }else{
            $().alertmessage('showError', '您当前处理会话数已经等于您设置的会话数上限，请拒绝邀请或者稍后接受邀请');
        }
    },
    refusedInvite: function(data,src) {
        var inviteUserName=data.inviteUserName;
        var action = {
            action: 'app.webchat.refusedGroupSession',
            data: {_id:data._id}
        };
        DS.send(action,function(rep){
            if(rep.success){
                $().alertmessage('showSuccess',"拒绝邀请");
                $(".webchat_another_invite").find("#invite_person_"+data._id).remove();
            }else{
                $().alertmessage('showError', rep.message || errMsg);
                $(".webchat_another_invite").find("#invite_person_"+data._id).remove();
            }
        });
    },
    kickInvite: function(data,src) {
        if(!confirm("确定要踢出合作座席吗"))return;

        var action = {
            action: 'app.webchat.kickGroupSession',
            data: {_id:data}
        };
        DS.send(action,function(rep){
            if(rep.success){
                $().alertmessage('showSuccess',"成功踢出协作座席");
                var right = $("#"+rep.session._id+"_popupWebchat");
                right.find(".kick_invite").hide();
                right.find(".img_action_invite").show();

                right.find(".invitedUser span").text("无");
                right.find(".invitedStatus span").text("未邀请");
            }else{
                $().alertmessage('showError', rep.message || errMsg);
            }
        });
    },
    timeSearchCheck:function(data,src){
        var pane = src.closest('.advanced_search_box');
        if(src.hasClass('active')){
            src.removeClass("active");
            pane.find('.advanced_search_box_val').val('').attr('value','');
        }else{
            src.addClass("active").siblings().removeClass("active");
            pane.find('.replay_time_box').val('');
            pane.find('.advanced_search_box_val').val(data).attr('value',data);
        }
    },
    refreshTimeSearchCheck:function(data,src){
        src.closest('form').find('.time_advanced_search').removeClass('active');
        src.closest('form').find('.advanced_search_box_val').val('').attr('value','');
    },
    changeTimeSearchValue:function(data,src){
        var str = $(src).val();
        var pane = src.closest('.advanced_search_box');
        $(src).closest('.advanced_search_box').find('.time_advanced_search').removeClass('active');
        if(/\D/.test(str)||str==0){
            $().alertmessage('showError', '只能输入数字1-9999');
            $(src).val("");
            pane.find('.advanced_search_box_val').val('').attr('value','');
            return;
        }else{
            pane.find('.advanced_search_box_val').val(str).attr('value',str);
        }

    },

    searchWebchatCardOfTimeRefresh: function (data, src) {
        var pane=handler.webchat._getSubPane("left");
        data.visitorsReply = pane.find('input[name=visitorHistory]').attr('data');
        data.clientReply = pane.find('input[name=clientHistory]').attr('data');
        data.unReply = pane.find('input[name=unHistory]').attr('data');
        if(data.unReply=="true"){
            data.unReply = true;
        }else{
            data.unReply = false;
        }
        handler.webchat.searchWebchatCardOfTime(data, src);
    },
    searchWebchatCardOfTime: function (data, src) {
        handler.webchat.finishKeyFlag = false;
        if (data != undefined && data.finishKey != "" && data.finishKey != undefined) {
            handler.webchat.finishKeyFlag = true;
            handler.webchat.advancedSearchData = data;
        }
        handler.webchat.queryWebchatListOfTime(data, src);
    },
    queryWebchatListOfTime:function(data,src){
        data=data||{};
        delete  data.isAdvanceSearch;
        var new_data = data;
        var _sub=handler.webchat.curSubMenu;
        new_data.submenu=_sub;
        var pane=handler.webchat._getSubPane("left");
        var pane_right =  handler.webchat._getSubPane("right");
        var frmId = "frm_webchat_todo_advanced_search";
        new_data.clientReply = data.clientReply || data.custClientReply;
        new_data.visitorsReply = data.visitorsReply || data.custVisitorsReply;
        delete new_data.custVisitorsReply;
        delete new_data.custClientReply;
        pane.find('input[name=visitorHistory]').attr('data',new_data.visitorsReply);
        pane.find('input[name=clientHistory]').attr('data',new_data.clientReply);
        pane.find('input[name=unHistory]').attr('data',new_data.unReply);
        delete new_data.visitorHistory;
        delete new_data.clientHistory;
        delete new_data.unHistory;
        if(new_data.clientReply == '' && new_data.visitorsReply == '' && new_data.unReply == ''){
            pane.find('.advanced_search_pane').addClass("hidden");
            pane.find('.normal_search').click();
            pane_right.find('.call_detail').css('display','none');
            return;
        }
        var frm = src.closest('form');
        var num1 =  new_data.clientReply,num2=new_data.visitorsReply;
        if(num1!=''&&(/\D/.test(num1) || num1 == 0)){
            $().alertmessage('showError', '只能输入数字1-9999');
            frm.find('input[name=custVisitorsReply]').val('');
            frm.find('input[name=custClientReply]').val('');
            return;
        }
        if(num2!=''&&(/\D/.test(num2) || num2 == 0)){
            $().alertmessage('showError', '只能输入数字1-9999');
            frm.find('input[name=custVisitorsReply]').val('');
            frm.find('input[name=custClientReply]').val('');
            return;
        }
        var dealAction="webchat.showTodoWebchatDetail";
        var action={
            action:'app.webchat.queryWebchatSession',
            data:new_data
        }
        DS.send(action,function(rep){
            if(rep.success){
                DS.showSearchTips(pane.find("#"+frmId));
                var list=rep.list;
                var count=rep.count;
                var container=pane.find('.list-inside');
                handler.webchat.curTabId=null;
                if (list && list.length > 0){
                    container.empty();
                    for (var i = 0, len = list.length; i < len; i++) {
                        var row = list[i];
                        handler.webchat._renderChatItem(row,dealAction);
                        if(row.status=="deal" && session.user._id == row.invitedUser){
                            //如果是被邀请,不可进行删除
                            row.isInvitedUser=true;
                        }
                        if (row.sourceName) {
                            row.isLocationUser=true;
                        }

                        if(_sub=='webchat_todo' && row.lastCustomerMsgTimeStamp){
                            var lastCustomerMsgTime = handler.getFormatDateTime(new Date(row.lastCustomerMsgTimeStamp))
                            var _t=handler.formatShortTime(lastCustomerMsgTime);
                            row.shortTime=_t.name;
                            row.createTime = lastCustomerMsgTime;
                        }
                        row = handler.webchat.editCardTmpl(row,container);
                        var rowDiv = $(template("tmpl_webchat_item",row));
                        container.append(rowDiv);
                        if(_sub=='webchat_todo'){
                            var btclass = "chattime_item"+row._id;
                            handler.webchat.webchatHourMeter(btclass,row.startWaitTimer,row.userStatusClass);
                        }
                        pane_right.find('.call_detail').css('display','none');
                    }
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
                    pane_right.find('.call_detail').css('display','none');
                }
                if(_sub == "webchat_todo"){
                    if(handler.webchat.haveClaim){
                        handler.webchat.autoClaimWebchatSession();
                    }
                }
                handler.webchat.refreshMenuBadge(true);
                pane.find('.advanced_search_pane').addClass("hidden");
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    neverReplayCheck:function(data,src){
        if(src[0].checked){
            src.closest(".choose-blue").addClass('active');
        }else{
            src.closest(".choose-blue").removeClass('active').attr('value','false');
        }
        
    },
    saveCardEdit:function(data,src){
        var _data ={
            "status":       data.status,
            "source":       data.source,
            "skillGroup":   data.skillGroup
        };
        var action = {
            action: 'app.webchat.saveWebchatTodoShowConfig',
            data: data
        };
        DS.send(action,function(rep){
            if(rep.success){
                handler.webchat.webchatCardShow = _data;
                var pane = src.closest('.list_check_pane');
                if(pane.find('.ds_search_filter').find('.badge-info').length != 0){
                    pane.find('.todo-advanced-search-refresh').click();
                }else{
                    pane.find('.normal_search').click();
                }
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
        src.closest('.card_edit_pane').addClass('hidden');
    },
    editCardTmpl:function(data,pane){
        var n_pane = $(pane).closest('#view_webchat_todo').length;
        var flag = handler.webchat.webchatCardShow;
        if(n_pane != 0){
            data.flag_status = flag.status;
            data.flag_source = flag.source;
            data.flag_skillGroup = flag.skillGroup;
        }else{
            data.flag_status = true;
            data.flag_source = true;
            data.flag_skillGroup = true;
        }
        return data;
    },

    currentDateTimeChanege: function (data1) {
        //data1 = parseInt(data1);
        var date = new Date();
        //var date_mor = new Date().getTime() + data1;
        date.setTime(data1);
        var year = date.getFullYear();
        var month = date.getMonth();
        var day = date.getDate();
        var hour = date.getHours();
        var minites = date.getMinutes();
        var second = date.getSeconds();
        month = month + 1 > 9 ? month + 1 : '0' + (month + 1);
        day = day > 9 ? day : '0' + day;
        hour = hour > 9 ? hour : '0' + hour;
        minites = minites > 9 ? minites : '0' + minites;
        second = second > 9 ? second : '0' + second;
        return year + "-" + month + "-" + day + " " + hour + ":" + minites + ":" + second;
    },
    webchatHourMeter:function(btclass,startWaitTimer,online){
        var pane = $('#view_nav_webchat');
        if(startWaitTimer >= 0 && btclass){
            if(handler.webchat.timerList[btclass]){

            }else{
                var timerObj = {
                    start:function(startWaitTimer){
                        var that = this;
                        that.initSecondTime = startWaitTimer;
                        that.startfun = setInterval(function(){
                            that.initSecondTime += 1;
                            var show_time = that.initSecondTime;
                            var minute = Math.floor(show_time/60);
                            var second = Math.floor(show_time%60);
                            if(second<10){
                                second = "0"+second;
                            }
                            pane.find("."+that.btclass).find('.ts_second').html(second);
                            pane.find("."+that.btclass).find('.ts_minute').html(minute);
                            if(that.online=='online'){
                                if(startWaitTimer < 0){
                                    pane.find("."+that.btclass).hide();
                                }else{
                                    $('#view_webchat_todo').find("."+that.btclass).show();
                                    $('#view_webchat_todo_content').find("."+that.btclass).show();
                                }
                            }else{
                                pane.find("."+that.btclass).hide();
                            }
                        },1000);
                    },
                    startfun:null,
                    btclass:btclass,
                    time:0,
                    end:function(){
                        var that = this;
                        clearInterval(that.startfun);
                        pane.find("."+that.btclass).hide();
                        delete handler.webchat.timerList[that.btclass];
                    },
                    custResetFun:function(){
                        var that = this;
                        //if(that.custTime < that.agentTime){
                        //    var now = new Date().getTime();
                        //    that.custTime = now+handler.webchat.getServerTime();
                        //}else{
                        //    $('#view_webchat_todo').find("."+that.btclass).show();
                        //    $('#view_webchat_todo_content').find("."+that.btclass).show();
                        //}
                        if(!handler.webchat.timerList[that.btclass]){
                            this.start(0);
                        }
                    },
                    agentResetFun:function(){
                        //var that = this;
                        //var now = new Date().getTime();
                        //that.agentTime = now+handler.webchat.getServerTime();
                        //pane.find("."+that.btclass).hide();
                        this.end();
                    },
                    online:online
                };
                timerObj.start(startWaitTimer);
                handler.webchat.timerList[btclass] = timerObj;
            }
        }else{
            if(startWaitTimer == -1 && handler.webchat.timerList[btclass]){
                handler.webchat.timerList[btclass].end();
            }

        }
    },
    resCustTabContentHeight:function(_pane){ //当匹配到客户的时候顶部UI发生变化  重新计算高度
        var webchatFlag="webchat";
        resizeRightContent($("#view_nav_webchat").find(_pane).find(".cust_tab_content"),webchatFlag);//联系历史和im对话框高度区分,webchatFlag 为了解决一个没查到原因的bug
        var h=$(window).height();
        var summary_height = _pane.find('.contact_summary').outerHeight();
        var info_height=h-51-summary_height-36-15-27-15-4;
        var quick_height=info_height-22;
        var quick_height_sys=quick_height-5;
        info_height+="px";
        quick_height+='px';
        quick_height_sys+='px';
        _pane.find('.webchat_remark_box').css('max-height',info_height);
        _pane.find('.system_quickreply_lists').css('max-height',quick_height_sys);
        _pane.find('.webchat_quickreply_tab_system').css('max-height',quick_height);
    },
    deleteCustomerImRelation:function(data,src){
        if(!confirm('确认要解除与该客户的关联吗？')){
            return;
        }
        var action = {
            action: 'app.webchat.deleteCustomerImRelation',
            data:{
                customerId:data
            }
        };
        DS.send(action, function(rep) {
            if(rep.success){
                var pane = $(src).closest('.call_detail');
                var sid = pane.attr('phone');
                $(src).closest('call_detail').remove();
                var card_pane = $('#view_webchat_todo').find('.item' + sid);
                var sourceName = card_pane.find('.card_row_title').attr('sourcename');
                card_pane.find('.card_row_title').html(sourceName);
                card_pane.attr("cust_id","");
                var platform = card_pane.find('.card_row_from_title').attr('platform');
                if (platform == "pc") {
                    platform = "(网站咨询)";
                } else if (platform == "wap") {
                    platform = "(wap站咨询)";
                } else if (platform == "sdk") {
                    platform = "(app咨询)";
                } else if (platform == "weixin") {
                    platform = "(微信咨询)";
                } else {
                    platform = "(未知)";
                }
                card_pane.find('.card_row_from_title').html(platform);
                handler.webchat.showTodoWebchatDetail(sid, card_pane, true);
            }else{
                $().alertmessage('showError', rep.message || errMsg);
            }
        })
    },
    resetTimerList:function(data,online){
        var btclass = "chattime_item"+data._id;
        if(handler.webchat.timerList[btclass]){     //加载的时候有些会话没有说过话
            if(online == 'online'){
                handler.webchat.timerList[btclass].online = 'online';
            }else{
                handler.webchat.timerList[btclass].online = 'offline';
            }
        }
    },
    placeMatchMsgResponse:function(repList,_data){
        var pane = $('#existing_customers_box');
        var contacts = repList;
        var tds = "";
        var rowDiv = template("tmpl_modal_existing_customers",_data);
        pane.find('.modal-body').html(rowDiv);
        if(contacts.length){
            for(var i=0;i<contacts.length;i++){
                var item=contacts[i];
                item.callId = _data.callId;
                var callTel = _data.callId.split('_');
                item.callTel = callTel[0];
                var sid = $('.list_container').find('div[ds_data="'+item.callTel+'"]').attr('ds_attr')
                    +"__"+$('.list_container').find('div[ds_data="'+item.callTel+'"]').attr('ds_sname');
                item.sid = sid;
                var phone=item.phone||[];
                var phoneList="";
                for (var j = 0; j < phone.length; j++) {
                    var _tel = phone[j].tel;
                    phoneList+=checkHideTel(_tel)+" ";
                    item.phoneList = phoneList;
                }
                var emails=item.email||[];
                var emailList="";
                for (var j = 0; j < emails.length; j++) {
                    var _email = emails[j].email;
                    emailList+=_email+" ";
                    item.emailList = emailList;
                }
                var td = template('tmpl_modal_existing_customers_td',item);
                tds += td;
            }
        }else{
            tds = '<tr><td colspan="5" style="text-align: center;">未匹配到客户</td></tr>';
        }

        pane.find('#existing_customers_list_pane_'+_data.callId).html(tds);
    },
    showChatDetails:function(data,src){
        $(src).addClass("active").siblings().removeClass("active");
        $(src).closest('.span3').find('.webchat_remark_box').show();
        $(src).closest('.span3').find('.webchat_quickreply_tab').hide();
    },

    showQuickReplyContent:function(data,src){
        $(src).addClass("active").siblings().removeClass("active");
        $(src).closest('.span3').find('.webchat_quickreply_tab').show();
        $(src).closest('.span3').find('.webchat_remark_box').hide();
    },
    webchatKmPopoverInit:function(){
        var webchatKmPopover = $("#webchat_kmpopover");
        webchatKmPopover.draggable({
            scroll: false,
            cursor: "move",
            handle:'.panel-heading',
            start: function () {
                $('.loading_indicator').css({visibility:'visible'});
                $('.main_header').css({position:'relative','z-index':11});

            },
            stop: function(e) {
                if(this.offsetTop<51){
                    $(this).css({top:'51px',bottom:'auto'});
                }
                if(this.offsetTop+51>window.innerHeight){
                    $(this).css({top:window.innerHeight-29+'px',bottom:'auto'});
                }
                if(this.offsetLeft<115-this.offsetWidth){
                    $(this).css({left:115-this.offsetWidth+'px',right:'auto'});
                }
                if(this.offsetLeft+40>=window.innerWidth){
                    $(this).css({left:window.innerWidth-40+'px',right:'auto'});
                }
                $('.loading_indicator').css({visibility:'hidden'});
                $('.main_header').removeAttr("style");
            }
        }).resizable({
            minHeight: 30,
            minWidth: 201,
            start: function () {
                $('.loading_indicator').css({visibility: 'visible'});
            },
            stop: function () {
                $('.loading_indicator').css({visibility: 'hidden'});
                var crm_width = this.clientWidth, crm_height = this.clientHeight;
                if (this.offsetLeft < 115 - crm_width) {
                    crm_width = 115 - this.offsetLeft;
                    $(this).width(crm_width);
                }
                if (this.offsetTop + crm_height > window.innerHeight) {
                    crm_height = window.innerHeight - this.offsetTop;
                    $(this).height(crm_height);
                }
                var offsettop = $(this).find('.webchat_kmdic_box').position().top;
                $(this).attr({
                    'crm_height': crm_height,
                    'crm_width': crm_width
                }).find('.panel-body').height(crm_height - 43).find('.webchat_kmdic_box').height(crm_height-offsettop-15);

            }
        });
        $(window).resize(function(){
            if(webchatKmPopover[0].offsetTop<51){
                webchatKmPopover.css({top:'51px',bottom:'auto'});
            }
            if(webchatKmPopover[0].offsetTop+51>window.innerHeight){
                webchatKmPopover.css({top:window.innerHeight-29+'px',bottom:'auto'});
            }
            if(this.offsetLeft<-725){
                $(this).css({left:'-725px',right:'auto'});
            }
            if(webchatKmPopover[0].offsetLeft+40>=window.innerWidth){
                webchatKmPopover.css({left:window.innerWidth-40+'px',right:'auto'});
            }
            var crm_width = webchatKmPopover[0].clientWidth,crm_height = webchatKmPopover[0].clientHeight;
            if(crm_width != 0){
                if(webchatKmPopover[0].offsetLeft<115-crm_width){
                    crm_width = 115 - webchatKmPopover[0].offsetLeft;
                    webchatKmPopover.width(crm_width);
                }
                if(webchatKmPopover[0].offsetTop+crm_height>window.innerHeight){
                    crm_height = window.innerHeight - webchatKmPopover[0].offsetTop;
                    webchatKmPopover.height(crm_height);
                }
                var offsettop = webchatKmPopover.find('.webchat_kmdic_box').position().top;
                webchatKmPopover.attr({
                    'crm_height': crm_height,
                    'crm_width': crm_width
                }).find('.panel-body').height(crm_height - 43).find('.webchat_kmdic_box').height(crm_height-offsettop-15);
            }
        })
        webchatKmPopover.find('.webchat_kmpopover_close').click(function(){
            webchatKmPopover.hide();
        });
        webchatKmPopover.find('.kmpopover-input-text').focus(function(){
            handler.webchat.searchKmHotList();
        }).blur(function(){
            //webchatKmPopover.find('.webchat_kmhotword_box').hide();
        }).click(function(e){
            e.stopPropagation();
        }).keyup(function(){
            if($(this).val() ==''){
                webchatKmPopover.find('.webchat_kmhotword_box').show();
                return
            }
            webchatKmPopover.find('.webchat_kmhotword_box').hide();
        })
        webchatKmPopover.on('click',function(){
            webchatKmPopover.find('.webchat_kmhotword_box').hide();
        })
    },
    showKmPopover:function(data,src){
        var webchatKmPopover = $("#webchat_kmpopover");
        var sessionId = src.closest('.webchat_container').find('input[name=copy_sessionId]').val();
        webchatKmPopover.attr('sessionId',sessionId);
        if(src.hasClass('img_action_kmsearch')){
            webchatKmPopover.show();
            var content = src.siblings('pre').text();
            webchatKmPopover.find('.kmpopover-input-text').val(content);
            webchatKmPopover.find('.kmpopover_search_btn').click();
        }else{
            webchatKmPopover.find('.kmpopover-input-text').val("");
            webchatKmPopover.find('.norecord').hide();
            webchatKmPopover.find('.search_tip_num').html(0);
            webchatKmPopover.find('.webchat_kmdic_content').empty();
            webchatKmPopover.toggle();
        }
        if($('#CRMPopover').width()>200){
            $('#CRMPopover').find('.minimize_btn').click();
        }
        if(webchatKmPopover.height()+53>window.innerHeight){
            webchatKmPopover.height(window.innerHeight-53)
        }
    },
    textSearch:function(){
        var keyword=$('#webchat_kmpopover').find('.kmpopover-input-text');
        var val=$.trim(keyword.val());
        if(!val || val=='请输入要检索的问题'){
            return;
        }
        handler.webchat.searchKmList(val);
        keyword.blur();
    },
    searchKmList:function(val){
       var  action={
           action: "app.km.queryWholeKmDic",
           data: {
               key: val,
               kmType: "outer",
               page: 1,
               limit: 10
           }
       }
        DS.send(action,function(res){
            if(res.success){
                var pane = $('#webchat_kmpopover');
                res.count = res.count||0;
                pane.find('.search_tip_num').text(res.count);
                if(res.count == 0){
                    pane.find('.norecord').show();
                    pane.find('.webchat_kmdic_content').empty()
                }else{
                    pane.find('.norecord').hide();
                    var list = res.list;
                    pane.find('.webchat_kmdic_content').empty();
                    var html = '';
                    for(var i=0;i<list.length;i++){
                        list[i].content = list[i].content.replace(/\"/g, "&quot;");
                        list[i].highlight = list[i].highlight||list[i].content;
                        html += '<li> <h6>'+list[i].title+'</h6> <a href="##" class="ds_do_action webchat_kmdic_detail" ds_action="webchat.kmCopyContent" content="'+list[i].content +'">'+list[i].highlight+'</a> </li>';
                    }
                    pane.find('.webchat_kmdic_content').append(html);
                    if(res.count>10){
                        pane.find('.webchat_more_box').remove();
                        var showMore = '<div class="webchat_more_box" style="text-align: center;padding: 10px 0;"> <button class="img_action_more ds_do_action ds_more" ds_action="webchat.searchKmListMore" ds_data="'+val+'" href="#" ds_attr="2" style="display: inline-block;">点击查看更多</button> </div>';
                        pane.find('.webchat_kmdic_box').append(showMore);
                    }
                }
            }
        })
    },
    searchKmHotList:function(){
        var action = {
            action:"app.km.queryKmHotWords",
            data:{
                kmType: "outer"
            }
        }
        DS.send(action,function(res){
            if(res.success){
                var pane = $('#webchat_kmpopover');
                var list = res.list;
                if(list.length == 0){
                    pane.find('.webchat_kmhotword_box').hide();
                }else{
                    pane.find('.webchat_kmhotword_box').empty();
                    var html = '<span style="color:#999;padding:4px 8px;display:block">热门问题</span>'
                    for(var i=0;i<list.length;i++){
                        html += '<li class="ds_do_action" ds_action="webchat.kmCopyHotContent">'+list[i].key+'</li>';
                    }
                    pane.find('.webchat_kmhotword_box').append(html).show();
                }
            }
        })
    },
    kmCopyContent:function(data,src){
        var content = src.attr('content');
        var id = $("#webchat_kmpopover").attr('sessionId')+"_popupWebchat";
        var container = $('#'+id).find('textarea.textarea_autocomplete');
        if(container.attr('disabled') == 'disabled'){
            return
        }
        container.val(container.val()+content);
    },
    kmCopyHotContent:function(data,src){
        var content = src.text();
        $("#webchat_kmpopover").find('.kmpopover-input-text').val(content).siblings('.kmpopover_search_btn').click();
    },
    searchKmListMore:function(data,src){
        var page=src.attr("ds_attr");
        page=parseInt(page,10);
        var pane = $('#webchat_kmpopover');
        var  action={
            action: "app.km.queryWholeKmDic",
            data: {
                key: data,
                kmType: "outer",
                page: page,
                limit: 10
                    }
                }
        DS.send(action , function(res){
            if(res.success){
                var list = res.list;
                    if (list.length > 0) {
                        var html = '';
                        for(var i=0;i<list.length;i++){
                            list[i].content = list[i].content.replace(/\"/g, "&quot;");
                            list[i].highlight = list[i].highlight||list[i].content;
                            html += '<li> <h6>'+list[i].title+'</h6> <a href="##" class="ds_do_action webchat_kmdic_detail" ds_action="webchat.kmCopyContent" content="'+list[i].content +'">'+list[i].highlight+'</a> </li>';
                        }
                        pane.find('.webchat_kmdic_content').append(html);
                    }
                    if (list.length < 10) {
                        pane.find(".ds_more").hide();
                    } else {
                        pane.find(".ds_more").show();
                        pane.find(".ds_more").attr("ds_attr", page + 1);
                    }
            } else {
                $().alertmessage('showError', "获取数据异常！");
            }
        });
    }
}

