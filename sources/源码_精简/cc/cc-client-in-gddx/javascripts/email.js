session.email = {};
handler.email = {
    curSubMenu:'',
    curTabFlag:"",
    cid:"#view_nav_email",
    flag:'sendEmail',
    currentSessionDetail:null,
    emailEditor:null,
    currentPaneId:"",
    curTabId:"",
    currDealEmailNum:0,
    limit:10,
    haveClaim:true,
    autoClaim:false,
    quickAry:[],
    email_main:function(menu){
        var pane=$(handler.email.cid);
        //handler.email.initBadge();
        //handler.webchat.initBadge();
        pane.find(".btn_email_todo").click();
    },
    quick_subMenu_search: function (submenu,src) {
        var searchPane = src.closest(".left_column");
        searchPane.find(".model_submenu button").removeClass("active");
        src.addClass("active");
        handler.email.curSubMenu=submenu;
        if(submenu=='email_todo'){
            handler.cancelDealToolbar("email_todo");
            handler.email.flag="popupEmail";
            handler.swapSubMenu(submenu, 'email/email_list_todo',"email_todo");
        } else{
            handler.email.flag="relocationEmail";
            handler.swapSubMenu(submenu, 'email/email_list',"email_all",true,true);
        }
    },
    email_list_todo: function (menu, searchData) {
        //handler.email.initSearchCondition(menu);//设置查询方式
        handler.email.queryEmailList();
    },
    email_list: function (menu, searchData) {
        handler.email.initSearchCondition(menu);//设置查询方式
        handler.email.queryEmailList(searchData || {});
    },

    queryEmailList: function(searchData, src){
        var menu = handler.email.curSubMenu;
        var leftPane = $("#contact_list_"+menu);
        var pane=leftPane.find(".list-inside");
        var id = menu;
        var serch_pane=$('#contact_list_email_all');
        var formPane = "email_list_query_form_"+menu;
        if(src){
            var form = $(src).closest("form");
            formPane = form.attr("id");
        }
        leftPane.find(".pagination").attr("for", formPane);
        if(formPane == "frm_email_advanced_search_"+menu){
            leftPane.find("input[name=query]").val("");
        }

        if(searchData && searchData.query){
            serch_pane.find('#email_advanced_search_pane').find(".reset_adv_search").click();
        }

        if(id == "email_all"){
            var page=searchData.page;
            if(src && src.hasClass("page_on")){
                page=src.attr("value");
            }
            if(!page)page=1;
            searchData.page=page;
            searchData.limit=handler.email.limit;
            if(src){
                $("#email_advanced_search_pane").toggleClass("hidden");
            }
        }

        handler._setSearchCondition(searchData, leftPane);
        //leftPane.find(".btn-group").show();
        switch (id) {
            case "email_todo":
                handler.email.getUserUntreatedEmail(searchData, function (err, data) {
                    if(!src && !searchData){
                        handler.email.currDealEmailNum = data.count;
                        handler.email.claimNewEmailSession();
                    }
                    handler.email.refreshBadge(data.count);

                    handler.email.processDisplayEmailList(pane, data, id, searchData);
                    DS.showSearchTips(leftPane.find("#frm_email_advanced_search_"+menu));
                });
                leftPane.find(".header_search_wrap").css("width", "215px");
                handler.email.listInsideHeight(leftPane);//设置高度
                break;
            case "email_all" :
                handler.email.getUserAllEmail(searchData, function (err, data) {
                    handler.email.processDisplayEmailList(pane, data, id, searchData);
                    DS.showSearchTips(leftPane.find("#frm_email_advanced_search_"+menu));
                });
                leftPane.find(".header_search_wrap").css("width", "338px");
                $(".refresh-email").hide();
                handler.email.listInsideHeight(leftPane);//设置高度
                break;
            default :
                break;
        }
    },

    gotoEmailMenu: function(data, src){
        var pane=$("#main-panel");
        var callMenu=pane.find(".navbar_top a[id='nav_email']");
        callMenu.click();
        if(src){
            $(src).click();
        }
    },
    dispatch: function(data){
        var obj = data.Data;
        var event=data.Event;
        var isMe=data.Foryou;
        if(event == "NewEmail"){
            if(isMe){
                handler.email.addItemToEmailToDoList(obj);
                var subject = handler.email.emailStrDecode(obj.subject);
                emitEmailNotify("您有一封新的邮件",subject,"#view_email_todo .item"+obj._id);
            }else{

            }
            if(obj.type == "pushUndealNum"){
                $("#email_session_undeal_num").text(obj.undealNum);
            }
        }else if(event == "NewEmailNotify"){
            if(obj.emailStatus == "fail"){
                emitEmailNotify("您有一个邮件通知","发送给&lt"+obj.to+"&gt的邮件投递失败","#view_email_todo .item"+obj.sessionId);

            }
            dsevent.publish(dsevent.evt.refreshEmailStatus,{mailId: obj.mailId, emailStatus: obj.emailStatus});

        }

    },

    addItemToEmailToDoList: function(data){
        var callId=data._id;
        if(data.createTime){
            var _t=handler.formatShortTime(data.createTime);
            data.shortTime=_t.name;
        }else{
            data.shortTime="";
        }

        //处理subejct,to.name,from.name 字段 by wangyn
        data.subject = handler.email.emailStrDecode(data.subject);
        data.to.name = handler.email.emailStrDecode(data.to.name);
        data.from.name = handler.email.emailStrDecode(data.from.name);

        var flag="popupEmail";
        var paneId=callId+"_"+flag;
        var pane=$("#view_email_todo");
        var itemPane= pane.find(".item"+callId);
        var emailSession=data;
        emailSession.leakNum=1;
        emailSession.status='deal';
        var _showItemBadge=function(num){
            if(session.currentPage.pageId != 'email_todo' || handler.email.curTabId!=callId){
                var num=$.trim(itemPane.find(".badge").text())||0;
                num=parseInt(num,10);
                num++;
                itemPane.find(".badge").text(num);
            }
        }
        if(pane.length>0){//打开过email菜单
            var container=pane.find('.list-inside');
            if(container.length>0){//打开过该子菜单
                if(itemPane.length==0){
                    handler.email._addTodoCard(emailSession);
                }else{
                    _showItemBadge();
                    var rightPane=$("#"+paneId);
                    if(rightPane.length>0){
                        var msgContainer = rightPane.find(".msg_inner");
                        handler.email.queryMailInfo(emailSession.mailId, function(email){
                            if(email){
                                email.attachSize = email.attachment == null? 0: email.attachment.length;
                                email.shortTime = handler.formatChatShortTime(email.createTime);
                                email.sender = email.from.name || email.from.addr;
                                rightPane.find("input[name=lastMailId]").val(emailSession.mailId);
                                email.content = email.content.replace(/&quot;/gm, '\"');
                                email.agentDisplay = "";
                                email.json = $.toJSON(email);
                                msgContainer.append(template("tmpl_email_msg_from", email));
                                handler.email._locationEmail(msgContainer);
                                var pane = $('#'+paneId);
                                var _html = '';
                                var from = pane.find('input[name=from]').val();

                                if(email.cc.length>1 || (email.cc.length==1 && email.cc[0].addr != from)){
                                    var new_data = email.cc;
                                    for(var i=0;i<new_data.length;i++){
                                        if(new_data[i].addr != from) {
                                            _html += '<div class="email_send_copy_li" val="'+new_data[i].addr+'">'+new_data[i].addr+'<span class="ds_do_action remove_email_copy" ds_data="'+new_data[i].addr+'" ds_action="email.removeEmailCopy"></span></div>';
                                        }
                                    }
                                    pane.find('.email_send_copy_box').show().find('.email_custom_send_copy_box').html(_html);
                                    pane.find('.btn_email_send_copy').html('取消抄送');
                                }else{
                                    pane.find('.email_send_copy_box').hide().find('.email_custom_send_copy_box').html(_html);
                                    pane.find('.btn_email_send_copy').html('添加抄送');
                                }
                                handler.email.countShowTabHeight("",pane.find('.btn_email_send_copy'),handler.email.flag);
                            }
                        });
                        handler.email.refreshLeakNum(callId,function(data){});
                    }

                }
            }
        }else{
            handler.email.refreshMenuBadge(false,1);
        }
    },

    queryMailInfo: function(id, callback){
        var data = {
            action:"app.email.queryMailInfo",
            data:{_id: id}
        };

        DS.send(data, function(response){
            if (response.success) {
                if (response.success) {
                    callback(response.row);
                } else {
                    callback(null);
                }
            }
        })
    },

    _addTodoCard:function(emailSession){
        var _p=$("#view_email_todo");
        var container=_p.find('.list-inside');
        if(container.length>0){
            if(container.find(".list_item").length==0){
                container.empty();
            }
            handler.email._renderEmailItem(emailSession,"email.showTodoEmailDetail");
            var card=template("tmpl_email_item",emailSession);
            handler.email.currDealEmailNum = handler.email.currDealEmailNum + 1;
            handler.email.refreshBadge(handler.email.currDealEmailNum);
            $("#contact_list_email_todo").find(".list-inside").find(".alert").remove();
            //$('.ico_wrap_middle')[0].click();
            handler.cancelDealToolbar("email_todo");
            container.prepend(card);
        }
    },

    listInsideHeight:function(leftPane){//设置高度
        var window_ht=$(window).height();
        var top_ht=leftPane.find('.contacts_caption').height();
        var list_ht=window_ht-85-36-top_ht;
        if(handler.email.curSubMenu == "email_todo"){
            list_ht = list_ht + 36;
        }
        leftPane.find('.list-inside').height(list_ht);
    },
    initSearchCondition:function(menu){
        var searchPane= $("#contact_list_"+handler.email.curSubMenu);
        var _p=searchPane.find("#email_advanced_search_pane");
        handler.email.initEmailAdvanceSearchPane(menu, _p);
        searchPane.find(".email_advanced_search").bind("click",function(e){
            e.stopPropagation();
            var offset=searchPane.find(".quick_search").offset();
            _p.css({top:offset.top+28+"px",left:offset.left+"px"});
            _p.toggleClass("hidden");

        });
        var dic=getCache('mailCategorys');
        handler.email.quickAry=[];
        handler.email.quickAry=[{n:"全部",v:""}];
        for(var k in dic){
            handler.email.quickAry.push({n:dic[k].categoryName,v:dic[k]._id});
        }
        handler.email.initQuickMenuEmail(searchPane,handler.email.quickAry);
    },
    initQuickMenuEmail:function(searchPane,dic){
        var container=searchPane;
        var quick_menu=container.find(".quick_menu");
        dic=dic||[];
        var tmpl='<li><a href="#" class="ds_do_action" ds_action="_#action#_" title="_#n#_" ds_data="_#v#_">_#n#_</a></li>';
        tmpl=tmpl.replace(/_#action#_/g,"email.email_quick_search");
        quick_menu.empty();
        for (var i = 0; i <dic.length; i++) {
            var _d = dic[i];
            quick_menu.append(DS.renderViewNew(tmpl,_d));
        }
    },
    email_quick_search:function(data,src){
        var searchPane = src.closest("form");
        searchPane.find(".quick_menu a").removeClass("quick_card_active");
        src.addClass("quick_card_active");
        searchPane.find(".quick_desc").text(src.text());
        searchPane.find("input[name='category']").val(data);

        var btn=searchPane.find('.ques_normal_search');
        btn.click();
    },
    initEmailAdvanceSearchPane: function(menu, pane){
        var html = template("tmpl_email_advanced_search",{menu:menu});//, tempList: tempList, agents: agents
        pane.html(html);
        var agents = getCache("agents") || [];
        var serviceEmails = getCache("serviceEmails");
        var toSelectPane = pane.find("select[name='to.addr']");
        if(pane.find(".ds_owner").length>0){
            var inputId=menu+"_owner_select_input";
            var containerId=menu+"_owner_select_user";
            utils.loadAgentTabBox(inputId,containerId,{width:"126",height:"17",maxHeight:292,hideTab:0,isRadio:true,commonTab:true},false,false,true);
        }
        var tohtml = [];
        tohtml.push("<option value=''>--请选择--</option>");
        for(var i=0; i<serviceEmails.length; i++){
            tohtml.push("<option value='"+serviceEmails[i].email+"'>"+serviceEmails[i].email+"</option>");
        }
        toSelectPane.html(tohtml.join(""));

        pane.find(".reset_adv_search").bind("click",function(){
            var frm=$(this).closest("form");
            frm.get(0).reset();
        });
    },
    /*请求 处理中的邮件 */
    getUserUntreatedEmail: function (data, callback) {
        var action = {
            action: 'app.email.queryMyDealMailList',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                if (response.success) {

                    callback(null, response);
                } else {
                    callback(new Error(""));
                }
            }
        });
    },
    /*展示 处理中的邮件 */
    processDisplayEmailList: function (pane, data, menu, querydata) {
        var menu = handler.email.curSubMenu;
        var flag = handler.email.flag;
        var list = data.list;
        var count = data.count;
        var li = $(pane).closest(".card_pane").find(".pagination").find("li");
        if(count == 0){
            $(pane).html('<div class="alert">未找到邮件!</div>');
            $(pane).closest(".list_container").find(".result_count").text(count);
            session.email.query = session.email.query || [];
            if(menu == "email_all"){
                updatePagination(li, count, querydata.limit || 10, querydata.page || 1);
                delete querydata.limit;
                delete querydata.page;
                session.email.query[menu] = querydata || data.condition;
            }
            return;
        }

        var dealAction = "email.showTodoEmailDetail";
        var tmpl = "tmpl_email_item";
        if(flag == "relocationEmail"){
            tmpl = "tmpl_email_item_all";
            dealAction = "email.showEmailDetail"
        }
        var html = [];
        for (var i = 0, len = list.length; i < len; i++) {
            var row = list[i];
            handler.email._renderEmailItem(row,dealAction);
            html.push(template(tmpl,row));

        }
        pane.html(html.join(''));
        dsevent.bind('.email_item', dsevent.evt.refreshCustomerName ,function(event, params){
            if($(this).attr('cust_id') == params.custId){
                var custPane = $(this).find(".name");
                if(custPane && custPane.length > 0){
                    custPane.find("b").html(params.custName);
                }
            }
        });
        if(menu == "email_all"){
            $(pane).closest(".left_column").find(".pagination").find(".result_count").text(count);
            updatePagination(li, count, querydata.limit || 10, querydata.page || 1);
            delete querydata.limit;
            delete querydata.page;
        }
        session.email.query = session.email.query || [];

        session.email.query[menu] = querydata || data.query;

    },
    _renderEmailItem: function(row, dealAction){
        var s=row.status;
        row.dealAction=dealAction;
        if(!row.custName){
            row.custName=row.from.name;
        }

        if(!row.custId){
            row.custId="";
        }
        if(!row.leakNum){
            row.leakNum="";
        }
        var _t=handler.formatShortTime(row.createTime);
        row.shortTime=_t.name;


        var cls="";
        var statusLabel="";
        if(s=='undeal'){
            cls='label-warning';
            statusLabel = "待处理";
        }else if(s=='deal') {
            cls = 'label-success';
            statusLabel = "处理中";
        }else if(s == "close"){
            cls = 'label-status';
            statusLabel = "已关闭";
        }else if(s == "finish"){
            cls = 'label-status';
            statusLabel = "已解决";
        }else if(s == "spam"){
            cls = 'label-status';
            statusLabel = "垃圾邮件";
        }
        row.statusClass=cls;
        row.statusLabel=statusLabel;
        row.agentDisplayName = "";
        if(row.agent){
            var agent = getCache("agents", row.agent);
            if(agent){
                row.agentDisplayName = agent.displayName+"("+agent.exten+")";
            }
        }
        if(row.toPeer){
            var peerId = row.toPeer;
            var peer = getCacheByKey("mailQueues", "Exten", peerId);
            if(peer){
                row.peerName = peer.DisplayName;
            }
        }
        if(!row.mailMarks){
            row.mailMarks = {
                starMark : "unmark"
            }
        }
        if(row.category){
            var category = getCacheByKey("mailCategorys", "_id", row.category);
            if(category){
                row.categoryName = category.categoryName;
            }
        }
    },
    getUserAllEmail:function(data, callback){
        var action = {
            action: 'app.email.queryAllMailList',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                if (response.success) {
                    callback(null, response);
                } else {
                    callback(new Error(""));
                }
            }
        });
    },
    showTodoEmailDetail: function(sid,src) {
        var flag="popupEmail";
        var paneId=sid+"_"+flag;
        handler.email.curTabId = sid;
        handler.email.currentPaneId="#"+paneId;
        var userId=src.attr("ds_attr");
        var pane=handler.email._getSubPane("left");
        var contentPane=handler.email._getSubPane("right");
        var call_left = pane.find(".item"+sid);
        var num=call_left.find(".badge").text();

        var call_right=contentPane.find("#"+paneId);
        console.info("showTodoEmailDetail::sid==="+sid);
        if(call_right.length>0){
            contentPane.find(".call_detail").hide();
            call_right.show();
            call_left.find(".badge").text("");
            if(num){
                handler.webchat._dealMsg(sid);
            }
        }else{//init page
            handler.email.refreshEmailDetail(sid,flag,userId,function(){
                var call_right=$("#"+paneId);
                if(flag == "popupEmail"){
                    call_left.find(".badge").text("");
                }

                contentPane.find(".call_detail").hide();
                call_right.show();
            });
        }
    },

    showEmailDetail:function(sid,src){
        var flag=handler.email.flag;
        var paneId=sid+"_"+flag;
        handler.email.curTabId = sid;
        handler.email.currentPaneId="#"+paneId;
        var userId=src.attr("ds_attr");
        var pane=handler.email._getSubPane("left");
        var contentPane=handler.email._getSubPane("right");
        var call_left = pane.find(".item"+sid);
        var num=call_left.find(".badge").text();
        handler.email.refreshEmailDetail(sid,flag,userId,function(){
            var call_right=$("#"+paneId);
            if(flag == "popupEmail"){
                call_left.find(".badge").text("");
            }

            contentPane.find(".call_detail").hide();
            call_right.show();
        });
    },
    resolveEmail:function(data){
        var pane = $("#show_email_end_session");
        DS.getView("email/email_end_session", function (view) {
            pane.empty();
            pane.html(view);
            //pane.find('.tab-content').html(view_ul);
            //根据层级不同显示不同样式
            var level=handler.config.channelDic.getDicLevel("email");
            var container=$("#email-tab-Content .dic_content");
            var dics=getCache('channelDic');
            var _dics=[];
            for (var i = 0; i < dics.length; i++) {
                var obj = dics[i];
                if(obj.type=="email"){
                    _dics=obj.options||[];
                    break;
                }
            }
            console.log(_dics);
            if(_dics.length==0){
                $().alertmessage('showError', "请通知管理员设置‘邮件结束会话类别’");
                return;
            }
            for (var i = 0; i < _dics.length; i++) {
                var obj = _dics[i];
                obj.level=i;
                obj.lastLevel="";
                var tmplObj=$("#channel_email_show");
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
                        $("#email-tab-Content .dic_level_1").find(".dic_item").eq(i).find("b").addClass("has_sub_style");
                    }
                }
            };
            forTree(_dics);
            if (data=="email_todo") {
                $("#email_end_session .btn-container button").attr("ds_action","email.batchResolveSessions");
            }
            $("#email_end_session").css('width',width).modal({backdrop:'static', keyboard:false});
            pane.find(".tab-content .dic_level_1>.channel_dic_list").find('.dic_item_desc_session')[0].click();
        });
    },
    batchResolveSessions:function (key,src){
        if($("#email_end_session .btn-container button").attr("ds_data")==""){
            $().alertmessage('showError',"请选择要关闭的会话分类");
            return false;
        }
        var modelPane = $(src).closest(".tabbable");
        var finishReason=modelPane.find(".session_name").attr("ds_data");
        var pane = $("#view_email_todo").find('.list_container');
        var list = pane.find(".select_on");
        var _data = {"finishReason": finishReason,"finishKey": key};
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
        _data.finishiArr = list_arr;
        handler.email.sendEmailSession(_data,function(rep){
            if(rep.success){
                $('#email_end_session').modal('hide');
                list.remove();
                $('#pane_deal_list').find('.ico_wrap')[0].click();
                for(var i=0; i<list_arr.length; i++){
                    handler.email.currDealEmailNum = handler.email.currDealEmailNum -1;
                    $("#"+list_arr[i]._id+"_popupEmail").remove();
                }
                handler.cancelDealToolbar("email_todo");
                console.log("handler.email.currDealEmailNum:"+handler.email.currDealEmailNum);
                handler.email.refreshBadge(handler.email.currDealEmailNum);
                handler.email.claimNewEmailSession();

            }

        })
    },
    finishEmailSession: function(data,src) {
        if ($("#email_end_session .btn-container button").attr("ds_data") == "") {
            $().alertmessage('showError', "请选择要关闭的会话分类");
            return false;
        }
        var content = src.closest('#email_end_session');
        var finishReason = content.find(".session_name").attr("ds_data");
        var pane1 = $("#view_email_todo_content .call_detail");
        //var _id = pane1.attr("phone");
        var sid = pane1.find("form[name='email_reply_form']").find("input[name='sessionId']").val();
        var key = content.find(".session_name").val();
        var paneId=sid+"_popupEmail";
        var call_right=$("#"+paneId);
        var _data={_id:sid, finishReason: finishReason,finishKey:key};
        handler.email.sendEmailSession(_data,function(rep){
            if(rep.success){
                $('#email_end_session').modal('hide');
                call_right.remove();
                $("#contact_list_"+handler.email.curSubMenu).find(".item"+sid).closest('.list_item').remove();
                if(handler.email.currDealEmailNum > 0){
                    handler.email.currDealEmailNum = handler.email.currDealEmailNum - 1;
                }
                handler.cancelDealToolbar("email_todo");
                handler.email.refreshBadge(handler.email.currDealEmailNum);
                handler.email.claimNewEmailSession();
            }
        })
    },
    sendEmailSession: function(data,callback){
        var action = {
            action: 'app.email.finishEmailSession',
            data: data
        };
        DS.send(action,function(rep){
            if(rep.success){
                if (typeof callback == "function") {
                    callback(rep);
                }
            }else{
                $().alertmessage('showError', rep.message || "操作失败!");
            }
        });
    },
    batchResolveEmail:function(data){
        var pane = $("#view_email_todo");
        var list = pane.find(".select_on");
        if(list.length>0){
            handler.email.resolveEmail(data);
        }else{
            $().alertmessage('showError',"请选择要关闭的会话分类");
        }
    },
    refreshEmailDetail:function(sid,flag,userId,callback){
        var paneId=sid+"_"+flag;

        var contentPane=handler.email._getSubPane("right");
        var action = {
            action: 'app.popup.popupEmail',
            data: {fromEmail:userId, _id: sid}
        };
        DS.send(action,function(rep){
            if(rep.success) {
                var user=rep.user||{};
                handler.email.currentSessionDetail = user;
                var contact = rep.row;
                var multiCusts = rep.multiCusts;
                var nick = user.from.name || user.from.addr;
                DS.getView('email/email_detail', function (detail) {
                    detail = detail.replace(/_#paneId#_/g,paneId);
                    //if(flag=="popupEmail"){
                    //    contentPane.append(detail);
                    //}else{
                        contentPane.html(detail);
                    //}
                    var call_right=$("#"+paneId);
                    call_right.attr("email",userId);
                    if(contact){
                        call_right.data("emailInfo",{sid:sid,uid:userId,flag:flag, custName:contact.name, custId: contact._id});
                    }else{
                        call_right.data("emailInfo",{sid:sid,uid:userId,flag:flag});
                    }
                    if(contact) {
                        var tag=contact.delTag;
                        if(tag=='y'){
                            handler.email.loadCustAddByEmailFirst(nick,paneId,true);
                        }else{
                            handler.customer.loadCustInfo(contact._id,sid,flag,null,null,function(){
                                call_right.find(".func_tab.active").click();
                            });
                        }
                    } else if(multiCusts && multiCusts.length>0){
                        handler.email.loadMoreCustAddByEmailFirst(nick, paneId, multiCusts, sid, userId);
                    }else{
                        handler.email.loadCustAddByEmailFirst(nick,paneId);
                    }

                    if(typeof callback=='function'){
                        callback();
                    }
                    call_right.show();
                });
                if(flag=="popupEmail"){
                    handler.email.refreshLeakNum(sid);
                }
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    _getSubPane:function(type){
        var _sub=handler.email.curSubMenu;
        if(type=='left'){
            var pane=$("#view_email_all");
            if(_sub=='email_todo'){
                pane=$("#view_email_todo");
            }
            return pane;
        }else if(type=='right'){
            var pane=$("#view_email_all_content");
            if(_sub=='email_todo'){
                pane=$("#view_email_todo_content");
            }
            return pane;
        }
    },
    _getEmailOnlineAgent:function(currentId,hideMe, peerId){
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
    transferEmail:function(data,pane){
        var sid=data._id;
        var emailUid=data.from.addr;
        var owner=data.agent;
        var peerId = data.toPeer;
        pane.find("#combobox_email_owner_desc").click(function(){
            $(this).hide();
            pane.find("#combobox_email_owner").show().focus();
        });
        pane.find("#combobox_email_owner" ).combobox2({
            minLength:0,
            displayField:pane.find("#combobox_email_owner_desc"),
            source: function( request, response ) {
                var agents=handler.email._getEmailOnlineAgent(owner,true, peerId);
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
                var _owner=ui.item._id;
                var uname=ui.item.displayName||'';
                var paneId=sid+"_popupEmail";
                var right=$("#"+paneId);
                var left=handler.email._getSubPane("left");

                var action = {
                    action: 'app.email.redirectEmailSession',
                    data: {_id:sid,toUser:_owner,toUserName:uname,fromEmail:emailUid}
                };
                DS.send(action,function(rep){
                    if(rep.success){
                        pane.find("#combobox_email_owner_desc").attr("uid",_owner);
                        pane.find( "#combobox_email_owner").blur();
                        if(_owner!=owner){
                            right.remove();
                            left.find(".item"+sid).closest('.list_item_check').remove();
                        }
                        handler.email.claimNewEmailSession();
                        handler.email.refreshBadge(left.find('.list_item_check').length);
                        handler.email.currDealEmailNum = handler.email.currDealEmailNum - 1;
                    }else{
                        $().alertmessage('showError', rep.message || errMsg);
                    }
                });
                return false;
            },
            open: function(event, ui) {
                var instance=pane.find("#combobox_email_owner").data("custom-combobox");
                var _owner=pane.find("#combobox_email_owner_desc").attr("uid");
                if(_owner=='NA'){
                    _owner="";
                }
                var val=pane.find("#combobox_email_owner").val();
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
    loadCustAddByEmailFirst:function(nick,paneId,isDel){
        var pane=$("#"+paneId).find(".customer_container");
        var flag=paneId.split("_")[1];
        var param={
            id:nick||"",
            desc:"邮件用户",
            isDel:isDel,
            flag:flag,
            paneId:paneId
        };
        pane.html(template("tmpl_email_notFound_customer",param));
        pane.find(".cust_base_fields").addClass("autoMatch").show();
        pane.find(".func_tab.active").click();
        pane.show();
    },

    loadMoreCustAddByEmailFirst:function(nick,paneId,custs, sessionId, uid){
        var pane=$("#"+paneId).find(".customer_container");
        var flag=paneId.split("_")[1];
        var param={
            id:nick||"",
            desc:"邮件用户",
            flag:flag,
            paneId:paneId,
            custs: custs,
            sessionId:sessionId,
            fromEmail: uid
        };
        pane.html(template("tmpl_email_popup_more_customer",param));
        pane.find(".cust_base_fields").addClass("autoMatch").show();
        pane.find(".func_tab.active").click();
        pane.show();
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

    processDisplayEmailSessionInfo: function(emailSession){
        emailSession.firstReplyTime = emailSession.firstReplyTime || "";
        emailSession.agentFirstReplyTime = emailSession.agentFirstReplyTime || "";
        emailSession.totalEmailNum = emailSession.totalEmailNum || 0;
        emailSession.finishReason = emailSession.finishReason || "";
        emailSession.totalEmailNum = emailSession.totalEmailNum || 0;

        emailSession.formatCreateTime = handler.formatChatShortTime(emailSession.createTime);

        emailSession.formatFirstReplyTime = handler.formatChatShortTime(emailSession.firstReplyTime) || "未有回复";

        emailSession.formatFinishTime = handler.formatChatShortTime(emailSession.endTime);
        emailSession.formatEmailTimeLength = handler.formatTimestamp(emailSession.lastEmailTimestamp - emailSession.createTimeStamp);
        if(!emailSession.to.name){
            emailSession.to.name = "";
        }
        if(emailSession.category){
            var categor = getCacheByKey("mailCategorys", "_id", emailSession.category);
            emailSession.categoryName = categor.categoryName || "未分类";
        }
    },

    loadEmailChatTab:function(data,src, callback){
        var container=src.closest(".call_detail");
        var paneId=container.attr("id");
        var ary=paneId.split("_");
        var sid=ary[0];
        var flag=ary[1];
        var call_right=$("#"+paneId);

        DS.getView('email/email_tab', function (detail) {
            handler.email.currentSessionDetail.remark = handler.email.currentSessionDetail.remark || "";
            handler.email.processDisplayEmailSessionInfo(handler.email.currentSessionDetail);
            handler.email.currentSessionDetail.toemail = handler.email.currentSessionDetail.to.addr || '';
            detail = DS.renderViewNew(detail, handler.email.currentSessionDetail);
            var _p = call_right.find(".cust_tab_content").find(".cust_tab_content_other");
            _p.html(detail);
            _p.find('.email_chat_sort').find('.email_sort_text').html(handler.email.currentSessionDetail.categoryName);
            if(flag == "popupEmail"){
                _p.find(".email_detailed_box").show();
                handler.email.initQuickReply(_p);
            }
            _p.find('.ke-statusbar').hide();
            handler.email.initQiniuUploadForEmail(call_right);

            if (handler.email.flag == "relocationEmail") {
                _p.find('.email_chat_deal').hide();
                _p.find('.email_chat_top').hide();
            } else {
                _p.find('.email_chat_deal').show();
                _p.find('.email_chat_top').show();
            }

            var action = {
                action: 'app.email.loadEmailHistory',
                data: {sessionId: sid}
            };
            var chatInfo = call_right.data("chatInfo");
            DS.send(action, function (rep) {
                if (rep.success) {
                    var emailList = rep.list;
                    var email_cc = new Object();
                    for(var i=0;i<emailList.length; i++){
                        var email = emailList[i];
                        var tmpl = "";
                        if(email.emailType == "receive"){
                            tmpl = "tmpl_email_msg_from";
                            email.sender = email.from.name||email.from.to;
                            email.agentDisplay = "";
                        }else if(email.emailType == "reply"){
                            tmpl = "tmpl_email_msg_to";
                            var agent = getCache("agents", email.agent)
                            email.sender = agent.displayName;
                            email.agentDisplay = "<div class='email_detail_head_lis email_detail_head_lab' style='color:#37b5ed'>座席： <span>"+agent.displayName+"("+agent.exten+")</span></div>";
                        }
                        if(email.attachment){
                            email.attachSize = email.attachment.length;
                        }
                        email.attachSize = email.attachSize || 0;
                        email.shortTime = handler.formatChatShortTime(email.createTime);
                        if(email.status == "success"){
                            email.statusDesc = "投递成功";
                        }else if(email.status == "fail"){
                            email.statusDesc = "投递失败";
                        }
                        email.content = email.content.replace(/&quot;/gm, '\"');
                        if(email.sourceContent){
                            email.sourceContent = email.sourceContent.replace(/&quot;/gm, '\"');
                        }
                        email.json = $.toJSON(email);
                        _p.find(".msg_inner").append(template(tmpl, email));

                        if(email.emailType == 'receive'){
                            email_cc = email;
                        }
                    }
                    dsevent.bind(".email_send", dsevent.evt.refreshEmailStatus, function(event , params){
                        //更改email的状态
                        console.log($(this).attr("ds_data") +"----"+ params.mailId);
                        var mailId = $(this).attr("ds_data");
                        if(mailId == params.mailId){
                            if(params.emailStatus == "success"){
                                $(this).find(".mail_sending_state_outer").show();
                                $(this).find(".mail_sending_state").addClass("success");
                                $(this).find(".mail_sending_state").html("投递成功");
                            }else if(params.emailStatus == "fail"){
                                $(this).find(".mail_sending_state_outer").show();
                                $(this).find(".mail_sending_state").addClass("fail");
                                $(this).find(".mail_sending_state").html("投递失败");
                            }

                        }
                    });
                    if(emailList.length > 0){
                        var lastEmail = emailList[emailList.length-1];
                        var lastMailId = lastEmail._id;
                        _p.find("input[name=lastMailId]").val(lastMailId);
                    }


                    var conPane=$(handler.email.currentPaneId);
                    handler.email.transferEmail(handler.email.currentSessionDetail,conPane);
                    var scrolPane=$(".cust_tab_content").find('.email_chat_msg');
                    scrolPane.scrollTop(scrolPane.find('.msg_inner').height());

                    //resizeRightContent($("#view_nav_email").find(call_right).find(".cust_tab_content"));
                    var pane = $('#'+paneId);
                    var from = pane.find('input[name=from]').val();
                    if(email_cc.cc.length>1 || (email_cc.cc.length==1 && email_cc.cc[0].addr != from)){
                        var new_data = email_cc.cc;
                        var _html = '';
                        for(var n=0;n<new_data.length;n++){
                            if(new_data[n].addr != from){
                                _html += '<div class="email_send_copy_li" val="'+new_data[n].addr+'">'+new_data[n].addr+'<span class="ds_do_action remove_email_copy" ds_data="'+new_data[n].addr+'" ds_action="email.removeEmailCopy"></span></div>';
                            }
                        }
                        pane.find('.email_send_copy_box').show().find('.email_custom_send_copy_box').html(_html);
                        pane.find('.btn_email_send_copy').html('取消抄送');
                        handler.email.countShowTabHeight("",pane.find('.btn_email_send_copy'),handler.email.flag);
                    }
                } else {
                    $().alertmessage('showError', errMsg);
                }
            });

            if (typeof callback == "function") {
                callback(flag);
            }
        });

    },

    countShowTabHeight:function(data,src,flag){
        var head_h=$(".main_header").outerHeight();
        var h=$(window).height();
        var container=src.closest(".call_detail");
        var content=src.closest(".content");
        var pane=container.find('.cust_tab_content');
        var h0=h - head_h-143;
        var pane_right=pane.find('.email_detailed_box');
        pane.css("height",h0);
        var right_hei=h0-pane.find('.email_remark_box').outerHeight()-14;
        pane_right.css("height",right_hei);
        pane.find('.email_quickreply_tab_system').css("height",right_hei-32);
        pane.find('.email_system_quickreply_lists').css("max-height",right_hei-32);
        content.css("height",h - head_h);
        var con_pane=container.find('.email_chat_msg');
        if(flag=='popupEmail'){
            if(src.context.innerHTML=="邮件"){
                var btm_hei=189;
            }else{
                var btm_hei=container.find('.email_chat_deal').outerHeight(true);
            }
            var top_hei=35;
        }else{
            var btm_hei=0;
            var top_hei=1;
        }
        var this_hei=h0-btm_hei-top_hei;
        con_pane.height(this_hei);
    },
    addEmailCopy:function(data,src){
        if(src[0].innerHTML=="添加抄送"){
            src.closest('.email_chat_deal').find('.email_send_copy_box').show();
            src[0].innerHTML="取消抄送";
        }else{
            var pane=src.closest('.email_chat_deal');
            pane.find('.email_send_copy_box').hide();
            pane.find('.email_send_copy_li').remove();
            src[0].innerHTML="添加抄送";
        }
        handler.email.countShowTabHeight("",src,handler.email.flag);
    },
    editEmailComment:function(data,src){
        var pane=src.closest('.email_remark_box');
        var _html=pane.find('.email_remark_text')[0].innerHTML;
        pane.find('.email_remark_text').hide();
        pane.find('.emil_remark').val(_html).show()[0].focus();
    },
    saveSessionRemark:function(data,src){
        var pane=src.closest('.email_remark_box');
        var _html=pane.find('.emil_remark').val();
        var action = {
            action:"app.email.saveRemark",
            data:{_id:data, remark:_html}
        }
        DS.send(action, function(res){
            if(res.success){
                handler.email.currentSessionDetail.remark = _html;
                pane.find('.email_remark_text').html(_html).show();
                pane.find('.emil_remark').hide();
                $().alertmessage("showSuccess", "修改备注成功");
            }else{
                $().alertmessage("showError", "保存备注失败");
            }

        });

    },
    showMoreText:function(data,src){
        var email = {};
        if(data && !src){
            email = data;
            email.agentDisplay = "";
        }else{
            var data1=src.closest('.email_con_text').find('.email_content_hidden').html();
            email = $.evalJSON(data1);
            email.content = unescapeHtml(email.content);
            email.agentDisplay = unescapeHtml(email.agentDisplay);
        }
        email.content = replaceEmailQiniuDomain(email.content);
        var to = "";
        var cc = "";
        var attach = "";
        if(email.to){
            for(var i=0;i<email.to.length; i++){
                to+=(email.to[i].name||"") +"&lt;"+email.to[i].addr+"&gt;"+"; "
            }
        }

        if(email.cc){
            for(var i=0;i<email.cc.length; i++){
                cc+= (email.cc[i].name || "") +"&lt;"+email.cc[i].addr+"&gt;"+"; "
            }
        }

        if(email.attachment){
            for(var i=0;i<email.attachment.length; i++){
                attach+='&nbsp;<a target="_blank" href="'+email.attachment[i].url+'">'+email.attachment[i].name+'</a>&nbsp;';
            }
        }

        email.toString = to;
        email.ccString = cc;
        email.attach = attach;
        DS.getView("email/email_content_details", function (view) {
            view = DS.renderViewNew(view, email);
            var pane=$('#show_email_content');
            pane.html(view);
            if(email.isHistory){
                pane.find('.email_detail_foot').css('display','none');
                pane.find('.modal-title').show().closest('.modal-header').css('padding','9px 15px');
            }
            var style = pane.find('style');
            if(style.length>0){
                for(var i=0;i<style.length;i++){
                    style[i].remove();
                }
            }
            var flag = '';
            if(src){
                flag = src.attr('forwarding')||'';
            }
            if(flag){
                var content = src.closest('.email_container');
                var data_html = content.find('.email_reply_form_data').html()
                pane.find('.email_detail_data').html(data_html);
                pane.find('.email_detail_forwarding').show();
            }
            pane.find(".email_detail_sign").before("<base target='_blank' />");
            if(!email.cc ||email.cc.length==0){
                pane.find('#email_con_details').find(".email_cc").remove();
            }
            if(!email.attachment ||email.attachment.length==0){
                pane.find('#email_con_details').find(".email_attachment").remove();
            }
            var height=$(window).height();
            var width=$(window).width();
            var _hei=Math.floor(height*0.8);
            var _wid=Math.floor(width*0.9);
            pane.find('#email_con_details').height(_hei).modal();
            setTimeout(function(){
                var _hei_top=pane.find('#email_con_details').find('.email_detail_head').height();
                var _hei_detl=_hei-100-_hei_top;
                pane.find('#email_con_details').find('.email_detail_body').height(_hei_detl);
                var _wid_body=pane.find('#email_con_details').find('.email_detail_body').width();
                _wid_body=_wid_body+60;
                if(_wid_body<_wid && _wid_body>750){
                    var left=(width-_wid_body)*0.5;
                    $("#email_con_details").width(_wid_body).css('left',left);
                }
            },300);
        })
    },
    showContentMoreIcom:function(_p){//当文字超出时显示加载更多的按钮
        var text_con=_p.find('.email_content').find('span');
        for(var i=0;i<text_con.length;i++){
            var height=text_con[i].height();
            if(height>33){
                $(text_con[i]).closest('.email_con_text').addClass('email_more');
            }
        }
    },
    saveEmailCopy:function(data,src){
        var pane = src.closest('.email_send_copy_box');
        var pane_val = src.val() ? src.val()||"" : data||"";
        pane_val = pane_val.trim();
        if (!pane_val) {
            return src.val('').focus();
        }
        var reg = /^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/;
        if (!reg.test(pane_val)) {
            $().alertmessage('showError', '邮箱格式不正确');
            src[0].focus();
            return false;
        }
        var flag = false;
        var lis = pane.find('.email_send_copy_li');
        if (lis.length) {
            for (var i = 0; i < lis.length; i++) {
                if (pane_val == $(lis[i]).attr('val')) {
                    return $().alertmessage('showError', '不能添加相同的抄送');
                } else {
                    flag = true;
                }
            }
        } else {
            flag = true;
        }
        if (pane_val && flag) {
            var con = '<div class="email_send_copy_li" val="'+pane_val+'">'+pane_val+'<span class="ds_do_action remove_email_copy" ds_data="'+pane_val+'" ds_action="email.removeEmailCopy"></span></div>';
            src.before(con);
            src.val('');
            src[0].focus();
            handler.email.countShowTabHeight("",src,handler.email.flag);
        }
    },

    removeEmailCopy: function(data, src){
        $(src).closest('.email_send_copy_li').remove();
        var _src=$(src).closest('.email_send_copy_box');
        handler.email.countShowTabHeight("",_src,handler.email.flag);
    },
    editEmailCopy:function(data,src){
        var availableTags = new Array();
        var tag_con = $('#panel_quck_replay').find('.replay_lists').find('.rep_li');
        for (var i = 0; i < tag_con.length; i++) {
            if ($(tag_con[i]).attr('name')) {
                availableTags[i] = $(tag_con[i]).attr('name');
            }
        }
        src.autocomplete({
            source: availableTags
        });
    },

    deleteEmail: function (data, src) {
        if(!confirm("确定删除会话吗?"))return;
        var action={
            action:"app.email.updateEmailSession",
            data:{query:{_id:data}, update:{status:'spam'}}
        }
        DS.send(action, function(res){
            if(res.success){
                var pane = $("#contact_list_"+handler.email.curSubMenu);
                if(typeof data == "string"){
                    var rightPane = $("#"+data+"_popupEmail");
                    rightPane.remove();
                    pane.find(".item"+data).remove();
                    handler.email.currDealEmailNum = handler.email.currDealEmailNum -1;
                }else{
                    var ids = data["$in"];
                    for(var i=0;i<ids.length; i++){
                        var rightPane = $("#"+ids[i]+"_popupEmail");
                        if(rightPane.length > 0){
                            rightPane.remove();
                        }
                        pane.find(".item"+ids[i]).remove();
                        handler.email.currDealEmailNum = handler.email.currDealEmailNum -1;
                    }
                }
                handler.cancelDealToolbar("email_todo");
                handler.email.refreshBadge(handler.email.currDealEmailNum);
                handler.email.claimNewEmailSession();
            }else{
                $().alertmessage("showError", "删除失败");
            }
        });
    },

    batchDeleteEmail: function(menu, src){
        var ids = [];
        $("#contact_list_"+ menu).find(".list_item.select_on").each(function(index, ele){
            var id = $(ele).attr("ds_data");
            ids.push(id);
        });
        var data = {$in: ids};
        handler.email.deleteEmail(data);
    }
    ,

    batchCloseEmail: function(menu, src){
        var ids = [];
        $("#contact_list_"+ menu).find(".list_item.select_on").each(function(index, ele){
            var id = $(ele).attr("ds_data");
            ids.push(id);
        });
        var data = {$in: ids};
        handler.email.closeEmail(data);
    },

    closeEmail: function (data, src) {
        var action={
            action:"app.email.updateEmailSession",
            data:{query:{_id:data}, update:{status:'close'}}
        }
        DS.send(action, function(res){
            if(res.success){
                var pane = $("#contact_list_"+handler.email.curSubMenu);
                if(typeof data == "string"){
                    var rightPane = $("#"+data+"_popupEmail");
                    rightPane.remove();
                    pane.find(".item"+data).remove();
                    handler.email.currDealEmailNum = handler.email.currDealEmailNum -1;
                }else{
                    var ids = data["$in"];
                    for(var i=0;i<ids.length; i++){
                        var rightPane = $("#"+ids[i]+"_popupEmail");
                        if(rightPane.length > 0){
                            rightPane.remove();
                        }
                        pane.find(".item"+ids[i]).remove();
                        handler.email.currDealEmailNum = handler.email.currDealEmailNum -1;
                    }
                }
                handler.cancelDealToolbar("email_todo");
                handler.email.refreshBadge(handler.email.currDealEmailNum);
                handler.email.claimNewEmailSession();

            }else{
                $().alertmessage("showError", "删除失败");
            }
        });
    },

    replyEmail: function(data, src){
        var content = handler.email.emailEditor.html();
        var contentText = handler.email.emailEditor.text();
        var fujian=$(src).closest('.email_chat_deal').find('.fujian');
        if( !content && !contentText && !fujian.length){
            var con = confirm("邮件内容为空，确定要发送吗？");
            if (!con) {
                return false;
            }
        }
        var pane = $(src).closest("form[name=email_reply_form]");
        var cc = [];
        var ccLi = pane.find(".email_send_copy_li");
        ccLi.each(function(index, ele){
            cc.push($(ele).attr("val"));
        });
        var attachment = [];
        var attachment1 = [];
        var attachmentItem = pane.find(".attachitem");
        attachmentItem.each(function(index, ele){
            attachment.push({url:utils.Base64.encode($(ele).attr("ds_data")),name:utils.Base64.encode($(ele).attr("fileName"))});
            attachment1.push({url:$(ele).attr("ds_data"),name:$(ele).attr("fileName")});
        });
        data.attachment = attachment;
        data.content = utils.Base64.encode(content);
        data.contentText = utils.Base64.encode(contentText);
        var subject = data.subject;
        data.subject = utils.Base64.encode("Re:"+data.subject);
        data.cc = cc;
        data.toName = encodeURIComponent(data.toName);
        data.fromName = encodeURIComponent(data.fromName);
        data.displayName = session.user.displayName;
        delete data.ccString;
        var action = {
            action:'app.email.replyInbox',
            data: data
        }
        var agent = getCache("agents", session.user._id);

        DS.send(action, function(response){
            if(response.success){
                var row = response.data;
                var toName = data.toName || "";
                var fromName = data.fromName || "";
                try{
                   toName = decodeURIComponent(toName);
                }catch (e){

                }
                try{
                    fromName = decodeURIComponent(fromName);
                }catch (e){

                }
                var email = {
                    sender: agent.displayName,
                    shortTime:handler.formatChatShortTime(row.createTime),
                    content:content,
                    contentText:contentText,
                    attachment:attachment1,
                    attachSize:attachment1.length,
                    to:[{addr:data.to, name: toName}],
                    cc:row.cc,
                    subject:subject,
                    from:{addr:data.from, name: fromName},
                    _id:row.mailId,
                    agentDisplay : "<div class='email_detail_head_lis email_detail_head_lab' style='color:#37b5ed'>座席： <span>"+session.user.displayName+"("+session.user.exten+")</span></div>"
                };
                var contentPane = $(src).closest(".email_container");
                contentPane.find("input[name=lastMailId]").val(row.mailId);
                contentPane.find("input[name=firstReplyTime]").val(row.firstReplyTime);
                contentPane.find("input[name=agentFirstReplyTime]").val(row.agentFirstReplyTime);
                var container = contentPane.find(".msg_inner");
                email.json = $.toJSON(email);

                container.append(template("tmpl_email_msg_to", email));
                dsevent.bind(".email_send", dsevent.evt.refreshEmailStatus, function(event , params){
                    //更改email的状态
                    console.log($(this).attr("ds_data") +"----"+ params.mailId);
                    var mailId = $(this).attr("ds_data");
                    if( mailId == params.mailId){
                        if(params.emailStatus == "success"){
                            $(this).find(".mail_sending_state_outer").show();
                            $(this).find(".mail_sending_state").addClass("success");
                            $(this).find(".mail_sending_state").html("投递成功");
                        }else if(params.emailStatus == "fail"){
                            $(this).find(".mail_sending_state_outer").show();
                            $(this).find(".mail_sending_state").addClass("fail");
                            $(this).find(".mail_sending_state").html("投递失败");
                        }

                    }
                });

                var scrolPane=contentPane.find('.email_chat_msg');
                scrolPane.scrollTop(scrolPane.find('.msg_inner').height());     //页面滚动到底部

                handler.email._locationEmail(container);
                handler.email.emailEditor.html("");
                pane.find(".btn_email_send_copy").click();
                pane.find('.email_send_copy_box').hide();
                pane.find('.email_send_copy_li').remove();
                pane.find(".btn_email_send_copy").html("添加抄送");
                pane.find("#attachment_box").empty();
                handler.email.countShowTabHeight("",src,handler.email.flag);
            }else{
                $().alertmessage('showError', '回复失败');
            }
        });

    },

    _locationEmail:function(container){
        window.setTimeout(function(){
            var lastMsg=container.find(".email_con_text:last");
            if(lastMsg.length>0){
                var scrollTop=lastMsg.offset().top-container.offset().top+container.scrollTop()+lastMsg.innerHeight();
                container.scrollTop(scrollTop);
            }
        },500);
    },

    initQiniuUploadForEmail:  function(pane){
        var progressId= 'email_upload_progress_show';
        var queryData =$.toJSON({scope:"m7-mail-resource"});
        var uploader = QiniuEmail.uploader({
            runtimes: 'html5,flash,html4',
            browse_button: 'email_upload_attach_btn',
            multi_selection:true,
            max_file_size: '10mb',
            flash_swf_url: '/javascripts/qiniu/plupload/Moxie.swf',
            dragdrop: false,
            chunk_size: '4mb',
            uptoken_url: '/action?action=app.webchat.getImUptoken&data='+queryData+'&sessionId=' + session.id,
            domain: qiniu7moorEmailDomain,
            unique_names: false,
            save_key: false,
            auto_start: true,
            get_new_uptoken:true,
            init: {
                'FilesAdded': function(up, files) {
                    plupload.each(files, function(file) {
                        var num=parseInt(Math.random()*1000+2);
                        file.num = num;
                        var _html='<div class=" progre'+num+' progress attach progress-striped" style="width:200px;"><div class="bar" style="width: 0%;"></div></div>';
                        pane.find('.progress_box').append(_html);
                    });
                },
                'BeforeUpload': function(up, file) {
                    var progress = new FileProgress(file, progressId);
                    var chunk_size = plupload.parseSize(this.getOption('chunk_size'));
                    if (up.runtime === 'html5' && chunk_size) {
                        progress.setChunkProgess(chunk_size);
                    }
                },
                'UploadProgress': function(up, file) {
                    var progress=pane.find(".progre"+file.num);

                    //progress.show();
                    handler.email.countShowTabHeight("",pane.find('#email_upload_attach_btn'),handler.email.flag);
                    progress.find(".bar").css("width","0");
                    var percent=file.percent;
                    if (percent) {
                        progress.find(".bar").css("width",percent.toString() + '%');
                        if(percent==100){
                            progress.remove();
                            handler.email.countShowTabHeight("",pane.find('#email_upload_attach_btn'),handler.email.flag);
                            //progress.find(".bar").css("width",'0');
                        }
                    }else{
                        progress.html("浏览器不支持计算进度");
                    }
                },
                'UploadComplete': function() {

                },
                'FileUploaded': function(up, file, info) {
                    var domain = up.getOption('domain');
                    var res = JSON.parse(info);
                    var sourceLink = domain + res.key; //获取上传成功后的文件的Url
                    var fileName=sourceLink;
                    var trueName=file.name;
                    console.log("999999999");
                    handler.email.showAttach(fileName,trueName,pane.find("#email_upload_attach_btn"));

                },
                'Error': function(up, err, errTip) {
                    //$("#" + up.uploadTimestamp).find("img").attr("src", "img/client/customer/uploadError.png");
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
                    var key = "email/"+time+"/"+uuid.v1()+"/"+fileName;
                    return key;
                }
            }
        });
    },

    showAttach:function(fileName,trueName,src){
        var container=$(handler.email.currentPaneId);
        var data={fileId:fileName,trueName:trueName};
        var ul=container.find("#attachment_box");
        ul.append(container.find("#tmpl_km_attach").tmpl(data)).show();
        handler.email.countShowTabHeight("",src,handler.email.flag);
    },
    uploadProgress:function(evt,src) {
        var pane=src.closest(".email_chat_deal");
        var progress=pane.find(".progress.attach");
        progress.show();
        progress.find(".bar").css("width","0");
        if (evt.lengthComputable) {
            var percentComplete = Math.round(evt.loaded * 100 / evt.total);
            progress.find(".bar").css("width",percentComplete.toString() + '%');
            if(percentComplete==100){
                progress.hide();
            }
        }else{
            progress.html("浏览器不支持计算进度");
        }
    },
    delFile:function(fileId,src){
        if(!confirm('确认删除吗？'))return;
        var container=$(handler.email.currentPaneId);
        var body=container.find("#knowledge_right_div");
        var thumb=src.closest(".fujian");
        var pane=src.closest('.email_chat_deal');
        var itemId=container.find("input[name='_id']").val();
        var attachs={};
        container.find("#thumbnails .attachitem").each(function(i){
            var id=$(this).attr("ds_data");
            if(id!=fileId){
                attachs[id]=$(this).text();
            }
        });
        //var action={
        //    action:"",
        //    data:{}
        //} ;
        //DS.send(action,function(rep){
        //    if(rep.success){
                thumb.remove();
                var lis=pane.find('.fujian');
                if(!lis.length){
                    pane.find('#attachment_box').hide();
                }
        //    }
        //});
        handler.email.countShowTabHeight("",pane,handler.email.flag);
    },

    showLocationModol:function(data, src){
        var fromEmail = $(src).attr("ds_attr");
        var pane=$('#show_email_location_lists');
        var action = {
            action: 'app.popup.popupEmail',
            data: {fromEmail:fromEmail, _id: data}
        };
        var paneId = data+"_"+handler.email.flag;
        DS.send(action,function(rep){
            var multiCusts = rep.multiCusts;
            DS.getView('email/email_location_client', function (detail) {
                pane.html(detail);
                pane.find('#email_location_client_modal').modal();
            })
        });

    },
    updateAutoClaimEmailSessionStatus:function(data){
        var action = {
            action: "app.email.updateAutoClaimEmailSessionStatus",
            data: {
                emailStatus:data //当前状态
            }
        };
        //added by wangyn 保存离线前的状态
        DS.send(action, function(rep){
            if (rep.success) {
                if(data =="open"){
                    handler.email.autoClaim  = true;
                }else if(data =="close"){
                    handler.email.autoClaim  = false;
                }
            } else {
                $().alertmessage("showError", "操作失败");
            }
        });
    },
    /**
     * 在删除,关闭,解决,打开领取的时候调用
     * 领取新的邮件会话
     */
    claimNewEmailSession: function(callback){
        if(!handler.email.autoClaim){
            return;
        }
        if(!handler.email.haveClaim){
            return;
        }
        var currNum = handler.email.currDealEmailNum; //当前处理的邮件会话数
        if(session.user.maxEmailDealCount == undefined || session.user.maxEmailDealCount== "") session.user.maxEmailDealCount =10;
        if(currNum>= session.user.maxEmailDealCount){   //最多能处理的邮件会话数
            return;
        }
        var action = {
            action: 'app.email.claimNewEmailSession',
            data:{currDealEmailNum: currNum}
        }
        handler.email.haveClaim = false;
        DS.send(action, function(response){
            handler.email.haveClaim = true;
            if(response.success){
                if(response.list.length == 0){
                    if($("#contact_list_email_todo").find(".list_item").length == 0){
                        $("#contact_list_email_todo").find(".list-inside").html("<div class='alert'>未找到邮件!</div>");
                    }else{
                        $("#contact_list_email_todo").find(".list-inside").find(".alert").remove();
                    }
                    return;
                }

                for(var i = response.list.length-1 ; i>=0; i--){
                    handler.email.addItemToEmailToDoList(response.list[i]);
                }

                //handler.email.refreshMenuBadge(true);
            }else{
            }
        })

    },

    refreshMenuBadge: function(isInit, num, openNum){
        var pane=$('#main-panel').find(".navbar_top");
        if(isInit){
            var action = {
                action: 'app.email.refreshMenuNum',
                data: {}
            };
            DS.send(action, function (rep) {
                if (rep.success) {
                    var openNum=rep.openNum;
                    var todoNum=rep.todoNum;
                    $("#email_session_undeal_num").html(openNum);
                    if(openNum>0||todoNum>0){
                        pane.find(".navbar_item>.nav_email").html('<span class="task_pop_tip"></span>');
                    }

                } else {
                    $().alertmessage('showError', errMsg);
                }
            });
        }else{
            if(openNum && openNum > 0){
                $("#email_session_undeal_num").html(openNum);
            }
            if(num>0 || (openNum && openNum > 0)){
                pane.find(".navbar_item>.nav_email").html('<span class="task_pop_tip"></span>');
            }else{
                pane.find(".navbar_item>.nav_email").html('');
            }
        }
    },
    refreshBadge: function(num){
        var listPane=$("#contact_list_email");
        var todoBadge=listPane.find(".model_submenu").find('.btn_email_todo').find(".badge");
        if(num>0){
            todoBadge.text(num);
        }else{
            todoBadge.text("");
        }
        handler.email.refreshMenuBadge(false,num);
    },

    refreshLeakNum: function (data) {
        var action = {
            action:'app.email.refreshLeakNum',
            data:{_id:data}
        }
        DS.send(action, function(res){});
    },
    showAttachmentBox:function(data,src){
        $(src).find('.email_attachment_lis').show().focus();
    },
    hideParAttachmentBox:function(data,src){
        var src=$(src).closest('.email_attachment_lis').hide();
    },
    showReplyCustom:function(data,src){
        $(src).addClass("active").siblings().removeClass("active");
        $(src).closest('.email_detailed_box').find('.email_system_quickreply_lists').hide();
        $(src).closest('.email_detailed_box').find('.email_quickreply_tab_system').show();
    },
    showReplySystm:function(data,src){
        data=data||{};
        data.moduleType = 'email';
        var action = {
            action: 'app.webchat.queryWebChatAllTags',
            data: data
        };
        DS.send(action, function(rep){
            if (rep.success) {
                var tags=rep.list;
                var html='';
                if(tags.length){
                    $(src).closest('.span3').find('.email_system_quickreply_lists').css('border','1px solid #ECECEC');
                    for(var i=0;i<tags.length;i++){
                        var tag={
                            numi:i,
                            _id: tags[i]._id,
                            name:tags[i].name,
                            count:tags[i].count,
                        };
                        tag.numi = i;
                        html += template("tmpl_email_quickreply_systm", tag);
                    }
                }else{
                    $(src).closest('.span3').find('.email_system_quickreply_lists').css('border','none');
                    html=' 您还没有设置系统快捷回复，请到快捷回复配置页面进行配置';
                }
                $(src).closest('.span3').find('.email_system_quickreply_lists').html(html);
                $(src).addClass("active").siblings().removeClass("active");
                $(src).closest('#view_email_todo_content').find('.email_system_quickreply_lists').show();
                $(src).closest('#view_email_todo_content').find('.email_quickreply_tab_system').hide();
            }else{
                $().alertmessage('showError',rep.message||errMsg);
            }
        });
    },
    /*邮箱前台系统公用点击标签*/
    quickReplayShow:function(data,src){
        data=data||{};
        data.id=$(src).attr('id');
        data.moduleType = 'email';
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
                            '<i class="system_reply_li_send ds_do_action" ds_action="email.sendQuickReply"></i><i class="system_reply_li_edit ds_do_action" ds_action="email.editSystemQuickReply"></i>'+
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
    sendQuickReply: function(data, src){
        data=data||$(src).closest(".system_reply_li").attr("data");
        handler.email.emailEditor.text(data);
        $('#view_email_todo_content').find('.reply_email').click();
    },
    editSystemQuickReply:function(data,src){
        var html=handler.email.emailEditor.text();
        var content='';
        content=$(src).closest(".system_reply_li").attr("data")||$(src).closest(".webchat_reply_li").attr("title");
        html +=content;
        handler.email.emailEditor.text(html).focus();
    },
    /*邮件快捷回复的查询事件*/
    initQuickReply: function(pane){
        var action = {
            action: 'app.webchat.getQuickReplyList',
            data: {account:session.account,moduleType:'email'}
        };
        DS.send(action, function(rep){
            var quickReplyView = template("tmpl_email_quickreply_list", rep);
            pane.find(".span3").find(".email_quickreply_tab_system").append(quickReplyView);
        });
    },
    /*邮件咨询快捷回复自定义模块保存更新*/
    saveQuickReply: function(data, src){
        var action = {
            action: 'app.webchat.saveQuickReply',
            data: {quickreplys: data.quickreplys,moduleType:'email'}
        };
        DS.send(action, function(rep){
            if(rep.success){
                var pane1 = src.closest(".call_detail");
                var pane = src.closest(".email_quickreply_container");
                $().alertmessage('showSuccess', '快捷回复保存成功');
                pane.remove();
                handler.email.initQuickReply(pane1.find(".cust_tab_content"));
                pane1.siblings().each(function(){
                    $(this).find(".email_quickreply_container").remove();
                    handler.email.initQuickReply($(this).find(".cust_tab_content"));
                });
            }else{
                $().alertmessage('showError', rep.message || errMsg);
            }
        });
    },
    editQuickReply: function(data, src){
        $(src).closest('.btn_edit_quickreply').hide();
        var span = src.closest(".span3");
        var listpane = span.find(".email_quickreply_list");
        var editpane = span.find(".email_quickreply_edit");
        listpane.hide();
        editpane.show();

    },
    cancelEditQuickReply: function(data, src){
        var span = src.closest(".span3");
        var listpane = span.find(".email_quickreply_list");
        var editpane = span.find(".email_quickreply_edit");
        listpane.show();
        editpane.hide();
        span.find('.btn_edit_quickreply').show();
        $(src).closest(".email_quickreply_tab_system").scrollTop(0);
    },
    addQuickReply: function(data, src){
        var editContainer = src.closest(".email_quickreply_edit_container");
        var quickReplyItem = template("tmpl_email_quickreply_edit");
        editContainer.append(quickReplyItem);
        $(src).closest(".email_quickreply_tab_system").scrollTop(editContainer.closest('.email_quickreply_container')[0].scrollHeight);
    },
    removeQuickReply: function(data, src){
        var div = src.closest(".quickreply_item");
        div.remove();
    },
    editEmailForwarding:function(data,src){
        var availableTags = new Array();
        var tag_con = $('#panel_quck_replay').find('.replay_lists').find('.rep_li');
        for (var i = 0; i < tag_con.length; i++) {
            if ($(tag_con[i]).attr('name')) {
                availableTags[i] = $(tag_con[i]).attr('name');
            }
        }
        src.autocomplete({
            source: availableTags
        });
    },
    saveEmailForwarding:function(data,src){
        var pane = src.closest('.email_det_forwarding_content');
        var pane_val = src.val() ? src.val()||"" : data||"";
        pane_val = pane_val.trim();
        if (!pane_val) {
            return src.val('').focus();
        }
        var reg = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
        if (!reg.test(pane_val)) {
            $().alertmessage('showError', '邮箱格式不正确');
            src[0].focus();
            return false;
        }
        var flag = false;
        var lis = pane.find('.email_send_forwarding_li');
        if (lis.length) {
            for (var i = 0; i < lis.length; i++) {
                if (pane_val == $(lis[i]).attr('val')) {
                    src.val('');
                    return $().alertmessage('showError', '不能添加相同的转发邮箱');
                } else {
                    flag = true;
                }
            }
        } else {
            flag = true;
        }
        if (pane_val && flag) {
            var con = '<div class="email_send_forwarding_li" val="'+pane_val+'">'+pane_val+'<span class="remove_email_forwarding" onclick="$(this).closest(\'.email_send_forwarding_li\').remove();"></span></div>';
            src.before(con);
            src.val('');
            src[0].focus();
        }
    },
    showEmailForwardingBox:function(data,src){
        src.addClass('active');
        src.closest('.email_detail_head_lis').find('.email_detail_forwarding_box').show();
    },
    hideEmailForwardingBox:function(data,src){
        var pane = src.closest('.email_detail_head_lis');
        pane.find('.remove_email_forwarding').click();
        pane.find('.email_detail_forwarding_box').hide();
        pane.find('.email_detail_forwarding').removeClass('active');
    },
    sendEmailForwarding:function(data,src){
        var con = src.closest('#email_con_details');
        var pane = con.find('.email_detail_forwarding_box');
        var email = pane.find('.email_send_forwarding_li');
        if(!email.length){
            $().alertmessage('showError',"请输入转发邮箱");
            return;
        }
        var email_li = new Array();
        for(var e=0;e<email.length;e++){
            var addr = $(email[e]).attr('val');
            email_li.push({name:"",addr:addr});
        }
        var new_data = DS.util.getDataOfForm(src.closest('.tabbable').find('form'));

        //转发邮件的时候 不在使用会话的主题
        var emailSubject = new_data.data.subject;
        var newSubject = emailSubject.substring(0,emailSubject.indexOf("#"));

        data = new_data.data;
        var attachment = [];
        var attachmentItem = con.find('.email_attachment').find('a');
        attachmentItem.each(function(index, ele){
            attachment.push({url:utils.Base64.encode($(ele).attr("href")),name:utils.Base64.encode($(ele).text())});
        })
        var content = con.find('.email_detail_body_content').html();
        var contentText = con.find('.email_detail_body_content').text();
        data.content = utils.Base64.encode(content);
        data.contentText = utils.Base64.encode(contentText);
        data.attachment = attachment;
        data.subject = utils.Base64.encode("Fw:"+newSubject);
        data.fromName = encodeURIComponent(new_data.data.fromName);
        data.to = email_li;
        var action = {
            action: 'app.email.forwardEmail',
            data: data
        };
        DS.send(action, function(rep){
            if(rep.success){
                con.find('.email_detail_foot').find('button').click();
                $().alertmessage('showSuccess', '邮件转发成功');
            }else{
                $().alertmessage('showError', rep.message || errMsg);
            }
        })
    },
    //处理subject from.name to.name 字段 added by wangyn
    emailStrDecode:function(data){
        if(!data || data =="undefined"){
            data = "";
        }
        try{
            data = decodeURIComponent(data);
        }catch(e){
            data = data.replace(/%26/g, "&");
            data = data.replace(/%23/g, "#");
            data = data.replace(/%3A/g, ":");
            data = data.replace(/%24/g, "$");
            data = data.replace(/%40/g, "@");
            data = data.replace(/%3D/g, "=");
            data = data.replace(/%2B/g, "+");
            data = data.replace(/%2F/g, "+");
        }
        return data;
    },
    deleteCustomerImRelation:function(data,src){
        if(!confirm('确认要解除与该客户的关联吗？')){
            return;
        }
        var email = $(src).closest(".call_detail").attr("email");
        var action = {
            action: 'app.email.deleteCustomerImRelation',
            data: {
                customerId: data,
                email:email
            }
        };
        DS.send(action, function(rep) {
            if(rep.success){
                var id = $(src).closest('.call_detail').attr('id');
                var sid = id.split('_')[0];
                var _src = $('.item'+sid);
                var email = $(_src).attr('ds_attr');
                var card_pane = $('#contact_list_email').find('div[ds_attr="'+email+'"]');
                for(var i=0;i<card_pane.length;i++){
                    var custname = $(card_pane[i]).find('.custom_name_field_b').attr('custname');
                    $(card_pane[i]).find('.custom_name_field_b').html(custname);
                }
                handler.email.showEmailDetail(sid,_src);
            }else{
                $().alertmessage('showError', rep.message || errMsg);
            }
        })
    },
    showEmailMarkOptions:function(data,src){
        if(src.hasClass('email_sort')){
            var pane = $(src).closest('.email_chat_sort');
            if(pane.find('.email_sort_options:visible').length){
                return;
            }
            var html = "<li class='email_sort_opt ds_do_action' ds_action='email.setEmailSortMark' ds_data='uncategorized' sid='"+data+"' title='未分类'>未分类</li>";
            var list=getCache('mailCategorys');
            var email = src.attr('email');
            if(list.length){
                for(var i = 0;i<list.length;i++){
                    if(list[i].relateMailAddr == email){
                        html += "<li class='email_sort_opt ds_do_action' ds_action='email.setEmailSortMark' ds_data='"+list[i]._id+"' sid='"+data+"' title='"+list[i].categoryName+"'>"+list[i].categoryName+"</li>";
                    }
                }
            }
            pane.find('.email_sort_options').html(html);
            pane.find('.email_sort_options').show();
            $(src).removeClass('unrequest');
        }else{
            $(src).closest('.email_chat_mark').find('.email_mark_options').show();
        }
    },
    setEmailSortMark:function(data,src){    //设置邮件分类
        var sid = $(src).attr('sid');
        var name = $(src).text();
        var pane = $(src).closest('.email_chat_sort');
        var action = {
            action: 'app.email.defineMailCategory',
            data: {
                "mailSessionId":sid, //邮件会话id
                "categoryId": data, //指定的分类id
                "categoryName":name
            }
        }
        DS.send(action,function(rep){
            if(rep.success){
                var n_pane = $('.item'+sid);
                pane.find('.email_sort_text').html(name);
                if(data == 'uncategorized'){
                    n_pane.find('.email_sort_card').addClass('hidden')
                }else{
                    n_pane.find('.email_sort_card').removeClass('hidden').html(name);
                }
            }else{
                $().alertmessage('showError', rep.message || errMsg);
            }
            pane.find(".email_sort_options").hide();
        })
    },
    setEmailStarMark:function(data,src){    //设置为星标邮件
        var pane = $(src).closest('.email_mark_options');
        var mark = $(src).attr('mark');
        var card_pane = $('.item'+data);
        var display = card_pane.find('.star_red').css('display');
        if(mark == 'mark' && display!="none"){
            pane.hide();
            return;
        }
        if(mark == 'unmark' && display=="none"){
            pane.hide();
            return;
        }
        var action={
                action:"app.email.doMailMark",
                data:{
                    "sessionId":data,
                    "starMark":mark
                }
            }
        DS.send(action, function(rep){
            if(rep.success){
                if(mark == 'mark'){
                    card_pane.find('.star_red').show();
                }else{
                    card_pane.find('.star_red').hide();
                }

            }else{
                $().alertmessage('showError', rep.message || errMsg);
            }
            pane.hide();
        });
    },
    setEmailReadMark:function(data,src){    //设置为未读邮件
        var pane = $(src).closest('.email_mark_options');
        var mark = $(src).attr('mark');
        var card_pane = $('.item'+data);
        var html = card_pane.find('.badge').html();
        if(html){
            pane.hide();
            return;
        }
        var action={
            action:"app.email.doMailMark",
            data:{
                "sessionId":data,
                "readMark":mark
            }
        }
        DS.send(action, function(rep){
            if(rep.success){
                card_pane.find('.badge').html('1');
            }else{
                $().alertmessage('showError', rep.message || errMsg);
            }
            pane.hide();
        })
    },
    resetForm:function(data,src){
        var frm=src.closest("form");
        var city = frm.find('select[name=category]');
        if(city.length>0){
            city.html('<option value="" selected="">--请选择--</option>')
        }
        handler.resetForm(data,src);
    }

}