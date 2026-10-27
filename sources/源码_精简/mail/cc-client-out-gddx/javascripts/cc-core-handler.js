//$.getScript("./javascripts/client/cdr.js");
//$.getScript("./javascripts/call.js");
//$.getScript("./javascripts/callMail.js");
//$.getScript("./javascripts/config/mailSign.js");
//$.getScript("./javascripts/callWeixin.js");
//$.getScript("./javascripts/channelHistory.js");
//$.getScript("./javascripts/webchat.js");

//$.getScript("./javascripts/client/report.js");
//$.getScript('./javascripts/client/callReport.js');

var handler = {
    urlInterface:{
        url_interface: function(data){
            var pane = $('#view_nav_url_interface');
            var urls = getCache('urls');
            var html = '';
            var containerHtml = '';
            for(var i=0;i<urls.length;i++){

                var url = "";
                if(urls[i].url.indexOf("?") > 0){
                    url = urls[i].url+ '&loginName='+session.user.displayName+'&loginExten='+session.user.exten;
                }else{
                    url = urls[i].url+ '?loginName='+session.user.displayName+'&loginExten='+session.user.exten;
                }
                if (session.account.tokenCheck) {
                    var res = getToken();
                    if (res.token) {
                        url += "&token="+res.token+"&tokenId="+res.tokenId;
                    }
                }
                if(i==0){
                    html += "<li class='active' ds_data='iframe"+i+"'><a href='#"+urls[i]._id+"' class='crm_popover_left' data-toggle='tab' title='"+urls[i].name+"'>"+urls[i].name+"</a><span class='CRMPopover_link_icon ds_do_action' ds_action='customer.CRMPopoverShow' ds_data='"+url+"' style='position:absolute;right:10px;top:10px'></span></li>";
                    containerHtml += '<div id="'+urls[i]._id+'" class="tab-pane active">' +
                        '<iframe id="iframe'+i+'" src="'+url+'" frameborder="0" width="100%" height="100%" scrolling="auto" class="inner_container" marginheight="0px" marginwidth="0px" style="display: block;"></iframe>'+
                        '</div>';
                }else{
                    html += "<li ds_data='iframe"+i+"'><a href='#"+urls[i]._id+"' class='crm_popover_left' data-toggle='tab' title="+urls[i].name+">"+urls[i].name+"</a><span class='CRMPopover_link_icon ds_do_action' ds_action='customer.CRMPopoverShow' ds_data='"+url+"' style='position:absolute;right:10px;top:10px'></span></li>";
                    containerHtml += '<div id="'+urls[i]._id+'" class="tab-pane">' +
                        '<iframe id="iframe'+i+'" src="'+url+'" frameborder="0" width="100%" height="100%" scrolling="auto" class="inner_container" marginheight="0px" marginwidth="0px" style="display: block;"></iframe>'+
                        '</div>';
                }
            }
            if(urls.length > 0){
                pane.find(".new-nav-tabs").html('');
                var refresh="<div class='iframe_refresh_btn ds_do_action' ds_action='urlInterface.iframeReload' ds_data=''><span></span><a class='iframe_refresh_a' href='javascript:;'>刷新</a></div>";
                pane.find(".new-nav-tabs").html(refresh);
                pane.find(".new-nav-tabs").append(html);
                pane.find(".tab-content").html(containerHtml);
            }
        },
        iframeReload: function(data,src){
            data = $(src).closest('.new-nav-tabs').find('.active').attr('ds_data');
            var pane = $("#"+data);
            var url = pane.attr('src');
            if (session.account.tokenCheck) {
                var params = url.split('&');
                var tokenOld = "";
                var tokenIdOld = "";
                for(var i=1;i<params.length;i++){
                    var keyMap = params[i].split('=');
                    if(keyMap && keyMap[0] == "token"){
                        tokenOld = keyMap[1];
                    }else if(keyMap[0] == "tokenId"){
                        tokenIdOld = keyMap[1];
                    }
                }

                var res = getToken();
                if (res.token) {
                    url = url.replace(new RegExp(tokenOld),res.token);
                    url = url.replace(tokenIdOld,res.tokenId);
                }
            }
            pane.attr('src', url);
        }
    },
    config : {
        config_main:function(menu){
            var pane=$("#view_nav_config");
            if(session.user.type!='admin'){
                pane.find(".config_tab>.role_config").remove();
            }else{
                pane.find(".config_tab>.role_config").show();
            }
            if(!isHasMenu("company_identity")){
                pane.find(".config_tab>.tab_company_identity").remove();
            }else{
                pane.find(".config_tab>.tab_company_identity").show();
            }
            //if(!isHasMenu("config_channel")){
                pane.find(".config_tab>.tab_config_channel").remove();
            //}else{
            //    pane.find(".config_tab>.tab_config_channel").show();
            //}
            //if(!isHasMenu("user_config")){
                pane.find(".config_tab>.tab_user_config").remove();
            //}else{
            //    pane.find(".config_tab>.tab_user_config").show();
            //}
            if(!isHasMenu("dept_config")){
                pane.find(".config_tab>.tab_dept_config").remove();
            }else{
                pane.find(".config_tab>.tab_dept_config").show();
            }
            if(!isHasMenu("customer_config")){
                pane.find(".config_tab>.tab_customer_config").remove();
            }else{
                pane.find(".config_tab>.tab_customer_config").show();
            }
            if(!isHasMenu("task_config")){
                pane.find(".config_tab>.tab_task_config").remove();
            }else{
                pane.find(".config_tab>.tab_task_config").show();
            }

            //pane.find(".config_tab>.tab_cust_approval_config").show();

            if(!isHasMenu("advanced_config")){
                pane.find(".config_tab>.tab_advanced_config").remove();
            }else{
                pane.find(".config_tab>.tab_advanced_config").show();
            }



            pane.find(".config_tab").find("li:first>a").click();
        },
        showTab:function(data,src) {
//            var pane=$("#view_"+data);
            if (data == 'call_config') {
                handler.swapTab(data, 'config/callConfig/call_config');
            } else if (data == 'customer_main') {
                handler.swapTab(data, 'config/customer/customerMain');
            } else if (data == 'customer_status') {
                handler.swapTab(data, 'config/customer/customerConfig');
            } else if (data == 'customer_high_seas') {
                handler.swapTab(data, 'config/customerCommon/config_customerCommon');
            } else if (data == 'customer_opportunity') {
                handler.swapTab(data, 'customer/customer_sale_chance');
            } else if (data == 'customer_titket_titketManager') {
                handler.swapTab(data, 'customer/titket/customer_titket_manager');
            } else if (data == 'customer_approval_approvalManager') {
                handler.swapTab(data, 'config/customerApproval/cust_approval_config');
            }else if (data == 'task_config') {
                handler.swapTab(data, 'config/business/config_business');
            } else if (data == 'dic_config') {
                handler.swapTab(data, 'config/dic/config_dic');
            } else if (data == 'user_config') {
                handler.swapTab(data, 'config/user/config_user');
            } else if (data == 'account_config') {
                handler.swapTab(data, 'config/account/config_main');
            } else if (data == 'config_channel') {
                handler.swapTab(data, 'config/channel/config_channel');
            } else if (data == 'mail_sign') {
                handler.swapTab(data, 'config/mailSign/sign_main');
            } else if (data == 'customer_import') {
                handler.swapTab(data, 'customer/customer_import');
            } else if (data == 'config_interface') {
                handler.swapTab(data, 'config/interfaceUrl/config_interface');
            } else if (data == 'company_identity') {
                handler.swapTab(data, 'config/account/account_identity');
            } else if (data == 'channel_dic') {
                handler.swapTab(data, 'config/channelDic/channel_dic');
            } else if (data == 'sms_query') {
                handler.swapTab(data, 'sms/all_sms');
            } else if (data == 'questionnaire_config') {
                handler.swapTab(data, 'config/questionnaire/config_questionnaire');
            } else if (data == 'questionnaire_import') {
                handler.swapTab(data, 'config/questionnaire/import/ques_import');
            } else if (data == 'advanced_config') {
                handler.swapTab(data, 'config/advanced/advanced_config');
            }else if(data=='role_config'){
                handler.swapTab(data,'config/role/config_role');
            }else if(data=='quality_check'){
                handler.swapTab(data,'qualityCheck/quality_check');
            }else if(data=='quality_check_list_query'){
                handler.swapTab(data,'qualityCheck/quality_check_list_query');
            }else if(data=='quality_check_query'){
                handler.swapTab(data,'qualityCheck/quality_check_query');
            }else if(data=='config_quality_check_template'){
                handler.swapTab(data,'config/qualityCheck/config_quality_check_template');
            }else if(data=='call_sheet_export_monitor_task'){
                handler.swapTab(data,'cdr/call_sheet_export_monitor_task');
            } else if (data == 'channel_global_set') {
                handler.swapTab(data, 'config/channel/channel_global_set');
            } else if (data == 'dept_config') {
                handler.swapTab(data, 'config/dept/config_dept');
            }else if(data=='call_config_label'){
                handler.swapTab(data, 'config/callConfigLabel/config_call_label_template');
            }
        },
        advanced:{
            advanced_config:function(){
                var pane=$("#view_advanced_config");
                if(!isHasMenu("call_config")){
                    pane.find(".sub-nav>.tab_call_config").remove();
                }else{
                    pane.find(".sub-nav>.tab_call_config").show();
                }
                if(!isHasMenu("config_interface")){
                    pane.find(".sub-nav>.tab_config_interface").remove();
                }else{
                    pane.find(".sub-nav>.tab_config_interface").show();
                }
                if(!isHasMenu("dic_config")){
                    pane.find(".sub-nav>.tab_dic_config").remove();
                }else{
                    pane.find(".sub-nav>.tab_dic_config").show();
                }
                if(!isHasMenu("account_config")){
                    pane.find(".sub-nav>.tab_account_config").remove();
                }else{
                    pane.find(".sub-nav>.tab_account_config").show();
                }
                if(!isHasMenu("customer_import")){
                    pane.find(".sub-nav>.tab_customer_import").remove();
                }else{
                    pane.find(".sub-nav>.tab_customer_import").show();
                }
                //if(!isHasMenu("questionnaire_config")){
                    pane.find(".sub-nav>.tab_questionnaire_config").remove();
                //}else{
                //    pane.find(".sub-nav>.tab_questionnaire_config").show();
                //}
                //if(!isHasMenu("questionnaire_impport")){
                    pane.find(".sub-nav>.tab_questionnaire_import").remove();
                //}else{
                //    pane.find(".sub-nav>.tab_questionnaire_import").show();
                //}
                //if(!isHasMenu("config_quality_check_template")){
                    pane.find(".sub-nav>.tab_config_quality_check_template").remove();
                //}else{
                //    pane.find(".sub-nav>.tab_config_quality_check_template").show();
                //}
                if(!isHasMenu("batch_export_record_task")){
                    pane.find(".sub-nav>.tab_call_sheet_export_monitor_task").remove();
                }else{
                    pane.find(".sub-nav>.tab_call_sheet_export_monitor_task").show();
                }
                if(!isHasMenu("call_config_label")){
                    pane.find(".sub-nav>.tab_call_config_label").remove();
                }else{
                    pane.find(".sub-nav>.tab_call_config_label").show();
                }
                pane.find(".sub-nav li:first>a").click();
            }
        }
    },

    initTopMenu: function (data, src) {
        if(!isHasFunc("func_sort_phone_bar_send_sms")){
            $('#SmsEnable').remove();
        }
        var pane=$("#main-panel").find(".left_col");
        pane.find(".open_top_menu").click(function (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            var target = $(e.currentTarget);
            handler.selectTopMenu(pane, e.currentTarget.id, target.attr("apppage"),target.attr("container"),target.attr("refresh"),target.attr("onlyExcuHandler"));
            var data= getCache('callLabel');
            if(data==-1){//判断有没有通话标签权限
                $("#setCallLabel").remove();
            }
            if(e.currentTarget.id =='nav_monitor'){//图表监控饼图柱图重绘制
            if(phone_accountCalls) {
                for(var i in phone_accountCalls) {
                    var accountCall = phone_accountCalls[i];
                    if(accountCall) {
                        var curPbxId = i.replace(_softphoneBar_replaceAll, "_");
                        _cti_ui_toDrawingTodayPandectChart(accountCall.inCalls, accountCall.inComplete, accountCall.outCalls, accountCall.outComplete, curPbxId);
                        _cti_ui_toDrawingInCallChart(accountCall.inCalls, accountCall.inCallsPerHour, accountCall.inCompletePerHour, curPbxId);
                        _cti_ui_toDrawingOutCallChart(accountCall.outCalls, accountCall.outCallsPerHour, accountCall.outCompletePerHour, curPbxId);
                    }
                }
            }
            }
            if(e.currentTarget.id=='nav_call'){//clear tips
                var tips=$("#msg_tips_source_pane").find(".msg_tips");
                if(tips.length>0 && !tips.hasClass("webchat")){
                    window.setTimeout(function(){
                        for (var i = 0; i < tips.length; i++) {
                            var obj = tips[i];
                            closeMsgTip(obj);
                        }
                    },100);
                }
            }else if(e.currentTarget.id=='nav_webchat'){
                var tips=$("#msg_tips_source_pane").find(".msg_tips.webchat");
                if(tips.length>0){
                    window.setTimeout(function(){
                        for (var i = 0; i < tips.length; i++) {
                            var obj = tips[i];
                            closeMsgTip(obj);
                        }
                    },100);
                }
            }

        });
        pane.find("#nav_call").click();
        pane.find("#nav_workbench").click();
        //pane.find(".open_top_menu:first").click();
    },
    initSubMenu: function (menuId) {
//        var menuId = $(src).attr("id");
        var menu = null;
        if(menuId){
            for(var i = 0; i < session.clientMenu.length; i++) {
                if(session.clientMenu[i].id == menuId) {
                    menu = session.clientMenu[i];
                    break;
                }
            }
        }
        if(menu){
            menu = menu.children||[];
        }
//        console.dir(menu);
        if(menuId=='call'){
            var pane=$("#submenu_container");
            if(pane.length>0 && pane.find(">li").length < 1) {
                var html=[];
                var first;
                for (var i = 0; i < menu.length; i++) {
                    var obj = menu[i];
                    if(i==0){
                        first=obj;
                    }
                    html.push(template("tmpl_submenu",obj));
                }
                pane.html(html.join(""));

                pane.find(".open_with_ajax").click(function (e) {
                    e.preventDefault();
//                    e.stopImmediatePropagation();
                    var target = $(e.currentTarget);
                    pane.find(">li").removeClass("active");
                    var item=target.closest("li.top_menu");
                    handler.selectPage(pane, target.attr("id"), target.attr("apppage"),  target.attr("container"),  target.attr("refresh"), target.attr("onlyExcuHandler"));
                    item.addClass("active");
                });
                var _a=$("#submenu_container #" + first.id);
                var li=_a.closest("li");
                var _menu=menu[0];
                if(li.hasClass("dropdown")){
                    li.find("a[id='"+_menu.id+"']").click();
                }else{
                    _a.click();
                }
                li.addClass("active");
            }
        }else{
            var pane=$("#view_"+menuId);
            var _c=pane.find(".list_nav").find(".menu_list");
            if(_c.length>0 && _c.find(">li").length<1){
                var html=[];
                var first;
                for (var i = 0; i < menu.length; i++) {
                    var obj = menu[i];
                    if(i==0){
                        first=obj;
                    }
                    obj.refresh=obj.refresh+"";
                    obj.onlyExcuHandler=obj.onlyExcuHandler+"";
                    html.push(template("tmpl_submenu_main",obj));
                }
                _c.html(html.join(""));

                _c.find(".open_with_ajax").click(function (e) {
                    e.preventDefault();
                    var target = $(e.currentTarget);
                    handler.selectPage(_c, target.attr("id"), target.attr("apppage"),  target.attr("container"),  target.attr("refresh"), target.attr("onlyExcuHandler"));
                });
                var _a=_c.find("#" + first.id);
                _a.click();
            }
        }
        if(menu.id=='my_call'){//clear tips
            var tips=$("#msg_tips_source_pane").find(".msg_tips");
            if(tips.length>0){
                window.setTimeout(function(){
                    for (var i = 0; i < tips.length; i++) {
                        var obj = tips[i];
                        closeMsgTip(obj);
                    }
                },100);
            }
        }
    },

    selectPage: function(parent, id, page, container, refresh, onlyExcuHandler,isNode) {
        var myContainer = container || id;
        var refresh = refresh || false;
        var onlyExcuHandler = onlyExcuHandler || false;

        if(myContainer == "undefined"){
            myContainer = id;
        }
        if(refresh=="undefined") {
            refresh = false;
        }
        if(onlyExcuHandler=="undefined") {
            onlyExcuHandler = false;
        }
        var realPage = page;
        var handlerPage = "";
        if(realPage) {
            handlerPage = render.renderLeftMenuHandlerPage(realPage);
        }
        parent.find(".open_with_ajax").removeClass("pressed");
        var item=parent.find("#" + id);
        item.addClass("pressed");
        var pane=item.closest(".list_nav");
        var title=pane.find(".nav_title");
        title.text(item.text());
        if (session.currentPage.pageId != id) {
            session.currentPage.pageId = id;

            var p = $("#view_" + myContainer);
            var p_content = $("#view_" + myContainer+"_content");
            var listParent=p.parent();
            var contentParent=p_content.parent();
            listParent.find(".card_pane").hide();
            contentParent.find(".content_pane").hide();
            if (!session[myContainer] || (!isNode && refresh==='true')) {
                if(session[myContainer] && onlyExcuHandler) {
                    eval("handler." + handlerPage + "(id)");
                    resize();
                    return;
                }
//                console.info("realPage===="+realPage);
                DS.getView(realPage, function (data) {
                    data = data.replace(new RegExp('_#menu#_','g'), id);
                    session[myContainer] = true;
                    p.empty();
                    p.html(data);
                    p_content.html(template("tmpl_right_content",{menu:id}));
                    p.show();
                    p_content.show();
                    resize();
                    eval("handler." + handlerPage + "(id)");
                });
            } else {
                p.show();
                p_content.show();
                resize();
            }
        }
    },
    selectTopMenu: function(parent, id, page, container,refresh,onlyExcuHandler) {
        var myContainer = container || id;
        if(myContainer == "undefined")
            myContainer = id;
        var realPage = page;
        var handlerPage = "";
        if(realPage) {
            handlerPage = render.renderLeftMenuHandlerPage(realPage);
        }
        var sid="topMenu_"+myContainer;
        parent.find(".navbar_item").removeClass("pressed");
        parent.find(".navbar_item .navbar_ico").removeClass("pressed");
        parent.find("#" + id).find(".navbar_item").addClass("pressed");
        parent.find("#" + id).find(".navbar_item .navbar_ico").addClass("pressed");
        parent.find(".navbar_center").removeClass("lamp");
        var pand=parent.find("#" + id).closest('.navbar_center');
        if(pand){
            pand.find('.open_top_menu').removeClass('active_cen');
            pand.find("#" + id).closest('.open_top_menu').addClass('active_cen');
            pand.addClass('lamp');
        }
        if (session.currentPage.pageId != id) {
            session.currentPage.pageId = id;
            $(".right_content").css("display", "none");
            var p = $("#view_" + myContainer);
            p.css("display", "block");
            if (!session[sid] || refresh==='true') {
                if(session[sid] && onlyExcuHandler) {
                    eval("handler." + handlerPage + "(id)");
                    resize();
                    return;
                }
                DS.getView(realPage, function (data) {
                    data = data.replace(new RegExp('_#menu#_','g'), id);
                    session[sid] = true;
                    p.empty();
                    p.html(data);
                    resize();
                    eval("handler." + handlerPage + "(id)");
//                    if(id!="customer"){
//                        handler.initSubMenu(id);
//                    }

                });
            } else {
                resize(p);
                if (myContainer=="nav_call") {
                    if($("#call_list_cdr_call").find(".contact_item_new").length==0){
                        $('#main-panel').find(".navbar_top").find(".navbar_item>.nav_call").html('');
                    }
                    $("#call_list_cdr_call").find(".list_item:last-child .popup_item").click();
                }
            }
            //reset edit check
            var toolbarPane=$("#pane_deal_list");
            if(!toolbarPane.is(":hidden")){
                handler.cancelDealToolbar("customer");
                handler.cancelDealToolbar("business");
                handler.cancelDealToolbar("cdr");
                handler.cancelDealToolbar("webchat");
                //handler.cancelDealToolbar("call");
                //handler.cancelDealToolbar("mail");
                //handler.cancelDealToolbar("weixin");
            }
        }
    },
    swapTab: function(id, page, container, refresh) {
        var myContainer = container || id;
        var refresh = refresh || false;
        var realPage = page;
        var handlerPage = "";
        if(realPage) {
            handlerPage = render.renderLeftMenuHandlerPage(realPage);
        }
        //console.log(realPage);
        if (session.currentPage.pageId != id){
            session.currentPage.pageId = id;
            var p = $("#view_" + myContainer);
            if (!session[myContainer]|| refresh===true) {
                DS.getView(realPage, function (data) {
                    data = data.replace(new RegExp('_#menu#_','g'), id);
                    session[myContainer] = true;
                    p.empty();
                    p.html(data);
                    eval("handler." + handlerPage + "(id)");
//                    resize();
                });
            } else {
//                resize();
            }
        }
    },
    swapSubMenu: function(id, page, container, refresh,refreshRight) {
        var myContainer = container || id;
        var refresh = refresh || false;
        var handlerPage = "";
        if(page) {
            handlerPage = render.renderLeftMenuHandlerPage(page);
        }
        if (session.currentPage.pageId != id){
            session.currentPage.pageId = id;
            var p = $("#view_" + myContainer);
            var p_content = $("#view_" + myContainer+"_content");
            var listParent=p.parent();//siblings()
            var contentParent=p_content.parent();
            listParent.find(".card_pane").removeClass("tab_active").hide();
            contentParent.find(".content_pane").hide();

            if (!session[myContainer]|| refresh===true) {
                DS.getView(page, function (data) {
                    data = data.replace(new RegExp('_#menu#_','g'), id);
                    session[myContainer] = true;
                    p.empty();
                    p.html(data);
                    p.addClass("tab_active").show();
                    if(refreshRight){
                        p_content.empty();
                    }
                    p_content.show();
                    eval("handler." + handlerPage + "(id)");
//                    resize();
                });
            } else {
                p.addClass("tab_active").show();
                p_content.show();
//                resize();
            }
        }
    },
    selectOpenableMenu: function (data, src) {
        if (!$(src).hasClass("open")) {
            $(src).addClass("open");
            $(src).parent(".left-link").find("ul").removeClass("hidden-menu");
        } else {
            $(src).removeClass("open");
            $(src).find("ul").addClass("hidden-menu");
            $(src).parent(".left-link").find("ul").addClass("hidden-menu");
        }
    },
    selectMenu: function (data, src) {
        $("a.open_with_ajax").removeClass("pressed");
        $(src).addClass("pressed");
        var page = data.replace(/_/g, "/");
        var handlerMethod = data.replace(/_/g, ".");
        var container = $("#main_container");
        var tmp = "<div id='__id' class='main-div'>__view</div>"
        container.find('div.main-div').addClass('main-hidden');
        if (container.find("#" + data).length === 0) {
            DS.getView(page, function (view) {
                var html = tmp.replace(/__id/g, data).replace(/__view/g, view);
                container.append(html);
                eval("handler." + handlerMethod + "()");
            });
        } else {
            container.find("#" + data).removeClass("main-hidden");
        }
    },
    addTab: function (title, view, id) {
        if (!$("#main_tab").find("#tab_li" + id).length) {
            var tabTmp = "<li id='tab_li__id'><a href='#__id'>__title</a> <span class='ui-icon ui-icon-close ds_do_action' role='presentation' ds_data='__id' ds_action='removeTab' >Remove Tab</span></li>";
            var divTmp = "<div id='__id' >__view</div>";
            var li = tabTmp.replace(/__id/g, id).replace(/__title/g, title);
            $("#main_tab").append(li);
            $("#tabs").append(divTmp.replace(/__id/g, id).replace(/__view/g, view));
            $("#tabs").tabs("refresh");
        }
        var index = $("#main_tab").find("#tab_li" + id).index();
        $("#tabs").tabs({active: index});
    },
    removeTab: function (tabId, src) {
        $(src).closest("li").remove();
        $("#" + tabId).remove();
        $("#tabs").tabs("refresh");
    },
    showLogout: function(data) {
        utils.logout();
    },
    logout: function () {
        var checked = $("#logout_check").attr("checked");
        var queueRemove = true;
        if (checked){
            queueRemove = false;
            DS.setCookie("logoutCheck", "true", 30);
        }else{
            DS.setCookie("logoutCheck", "false", 30);
        }
        cti_exit(queueRemove);
    },
    transformGeneralCache: function (type, value) {
        var cache = getGeneralCache(type, value);
        if (cache) {
            return cache.code_name;
        } else {
            return value;
        }
    },
    setUserChannel:function(data,src){
//        console.dir(data);
        var mail=data.channelMail;
        var wx=data.channelWx;
        syncChannelSet(data,function(){
            var action = {
                action: "app.user.setUserChannel",
                data: {
                    _id:session.user._id,
                    channelMail:mail,
                    channelWx:wx
                }
            };
            DS.send(action, function (rep) {
                if (rep.success) {
                    $().alertmessage('showSuccess', '更新成功');
                    session.user.channelMail = mail;
                    session.user.channelWx = wx;
                    $('#editInfoModal').modal('hide');
                } else {
                    $().alertmessage('showError', rep.message||errMsg);
                }
            });
        })
    },
    setPhoneBarMailChannel:function(isOpen,src){
        if(isOpen == 'true'){
            isOpen = true;
        }else{
            isOpen = false;
        }
        var data ={
            channelMail: isOpen,
            channelWx: session.user.channelWx
        }
        syncChannelSet(data,function(){
            var action = {
                action: "app.user.setUserChannel",
                data: {
                    _id:session.user._id,
                    channelMail:isOpen
                }
            };
            DS.send(action, function (rep) {
                if (rep.success) {
                    session.user.channelMail = isOpen;
                    if(isOpen===false){
                        $(".yj_state_enable").hide();
                        $(".yj_state_disable").show();
                    }else{
                        $(".yj_state_enable").show();
                        $(".yj_state_disable").hide();
                    }
                } else {
                    $().alertmessage('showError', rep.message||errMsg);
                }
            });
        })
    },
    setPhoneBarWXChannel:function(isOpen,src){
        if(isOpen == 'true'){
            isOpen = true;
        }else{
            isOpen = false;
        }
        var data ={
            channelMail:  session.user.channelMail,
            channelWx: isOpen
        }
        syncChannelSet(data,function(){
            var action = {
                action: "app.user.setUserChannel",
                data: {
                    _id:session.user._id,
                    channelWx:isOpen
                }
            };
            DS.send(action, function (rep) {
                if (rep.success) {
                    session.user.channelWx = isOpen;
                    if(isOpen===false){
                        $(".wx_state_enable").hide();
                        $(".wx_state_disable").show();
                    }else{
                        $(".wx_state_enable").show();
                        $(".wx_state_disable").hide();
                    }
                } else {
                    $().alertmessage('showError', rep.message||errMsg);
                }
            });
        })
    },

    showEditInfo: function() {
        if(isHasFunc("func_not_allow_user_edit_info")){
            return;
        }
        var pane = $(".showEditInfo");
        DS.getView("show_edit_info", function (view) {
            pane.empty();
            view = view.replace(/__displayName/g,session.user.displayName).replace(/__loginName/g,session.user.loginName)
                .replace(/__mobile/g,session.user.mobile).replace(/__email/g,session.user.email)
                .replace(/__AutoBusyTime/g,session.user.AutoBusyTime?session.user.AutoBusyTime:0);

            pane.html(view);
            if(isHasFunc("func_user_edit_no_auto_busy_time")){
                $('#AutoBusyTime_editUserInfo').remove();
            }
            if(isHasMenu("config_channel")||isHasMenu("my_mail_deal")||isHasMenu("my_weixin_deal")){
                pane.find(".channel_my_set").show();
                if(session.user.channelMail===false){
                    pane.find("input[name='channelMail']").prop("checked",false);
                }else{
                    pane.find("input[name='channelMail']").prop("checked",true);
                }
                if(session.user.channelWx===false){
                    pane.find("input[name='channelWx']").prop("checked",false);
                }else{
                    pane.find("input[name='channelWx']").prop("checked",true);
                }
            }
            if(session.user.im_icon && session.user.im_icon != ''){
                pane.find(".S_line5").attr("src",session.user.im_icon+"?imageView2/1/w/50/h/50");
            }else if(session.user.im){
                if(session.user.im.picture) {
                    var picture = session.user.im.picture;
                    pane.find(".S_line5").attr("src", "http://115.29.160.119/download?Action=GetPic&Picture=" + picture + "_35&Account=" + session.user.account);
                }
            }
            handler._initEditUserQiniuImg();
            $("#editInfoModal").modal();
        });
    },
    _initEditUserQiniuImg : function(){
        var pane=$('#editInfoModal');
        var containerId = 'userEdit_icon-container-qiniu';
        var progressId= 'userEdit_icon-fsUploadProgress';
        var uploader = Qiniu.uploader({
            runtimes: 'flash,html4',
            browse_button: 'userEdit_icon-pickfiles',
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
                    //pane.find(".userEdit_icon_container").show();
                    plupload.each(files, function(file) {
                        var progress = new FileProgress(file, progressId);
                        progress.setStatus("等待...");
                    });
                },
                'BeforeUpload': function(up, file) {
                    if($('.userEdit_icon_container').find('tbody').find('tr').length > 0){
                        $('.userEdit_icon_container').find('tbody').find('tr').find('a.ds_do_action').click();
                    }
                    var progress = new FileProgress(file, progressId);
                    var chunk_size = plupload.parseSize(this.getOption('chunk_size'));
                    if (up.runtime === 'html5' && chunk_size) {
                        progress.setChunkProgess(chunk_size);
                    }
                },
                'UploadProgress': function(up, file) {
                    var progress = new FileProgress(file, progressId);
                    var chunk_size = plupload.parseSize(this.getOption('chunk_size'));
                    progress.setProgress(file.percent + "%", up.total.bytesPerSec, chunk_size);
                },
                'UploadComplete': function() {
                    $().alertmessage('showSuccess', "图片上传成功");
                    var logo = pane.find("input[name='im_icon']");
                    pane.find(".S_line5").attr("src","http://7xj0za.com2.z0.glb.qiniucdn.com/"+logo.val()+"?imageView2/1/w/50/h/50");
                },
                'FileUploaded': function(up, file, info) {
                    var progress = new FileProgress(file, progressId);
                    progress.setComplete(up, info, 'userEdit_icon');
                },
                'Error': function(up, err, errTip) {
                    //pane.find(".userEdit_icon_container").show();
                    var progress = new FileProgress(err.file, progressId);
                    progress.setError();
                    progress.setStatus(errTip);
                    alert(errTip);
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
                    var key = session.user.account+"/icon/"+date+"/"+time+"/"+uuid.v1()+fileSuffix;
                    console.info("Key2========="+key);
                    return key;
                }
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
    },
    editUser: function(data) {
        data._id = session.user._id;
        var action = {
            action: 'app.user.editUser',
            data: data
        };
        DS.send(action,function(rep) {
            if(rep.success) {
                $().alertmessage('showSuccess', '更新成功');
                session.user.displayName = data.displayName;
                session.user.mobile = data.mobile;
                session.user.email = data.email;
                session.user.AutoBusyTime = data.AutoBusyTime;
                $("#user_name").text(session.user.displayName);
                if(session.extenType == 'Local'){
                    $("#user_exten_type").text(data.mobile);
                }
                var workbenchPane = $('#contact_workbench');
                workbenchPane.find('.my-info-my-name').html(data.displayName);
                workbenchPane.find('.my-contact-email').html(data.email);
                workbenchPane.find('.my-contact-pnum').html(data.mobile);
                if(data.im_icon){
                    workbenchPane.find('.S_line5').attr("src","http://7xj0za.com1.z0.glb.clouddn.com/"+data.im_icon);
                    $('.user_pic').find('.S_line5').attr("src","http://7xj0za.com1.z0.glb.clouddn.com/"+data.im_icon);
                    session.user.im_icon = "http://7xj0za.com1.z0.glb.clouddn.com/"+data.im_icon;
                }
                $('#editInfoModal').modal('hide');
            } else {
                if(rep.repeatList){
                    var msg = "修改失败.有以下信息与其他座席重复:";
                    for(var i=0 ; i < rep.repeatList.length ; i++){
                        if(rep.repeatList[i] == "name"){
                            msg += "[姓名] "
                        } else if(rep.repeatList[i] == "email"){
                            msg += "[邮箱] ";
                        }
                    }
                    $().alertmessage('showError', msg);
                }else{
                    $().alertmessage('showError', '更新失败');
                }
            }
        });
    },
    getDefaultDisplayValue: function (value) {
    if (value.substring(0, 2) == "__") {
        return "";
    }
    return value;
    },
    appUserPasswordUpdate: function(data) {
        var user = session.user;
        if(data.oldPassword != user.password) {
            $().alertmessage('showError', '输入的旧密码不对!');
            $("#oldPassword").val("");
            $("#oldPassword").focus();
            return;
        }
        if(data.password != data.newPassword) {
            $().alertmessage('showError', '新密码和确认密码输入不一致!');
            $("#newPassword").val("");
            $("#newPassword").focus();
            return;
        }
        delete data['newPassword'];
        delete data['oldPassword'];

        data._id = user._id;
        data.password = data.password;
        var action = {
            action: 'app.user.editUser',
            data: data
        };
        DS.send(action,function(rep) {
            if(rep.success) {
                $().alertmessage('showSuccess', '更新成功');
                DS.setCookie("password", "", 30);
                DS.setCookie("remember", false, 30);
                $('#editInfoModal').modal('hide');
            } else {
                $().alertmessage('showError', '更新失败');
            }
        });
    },
    cancelEditUser: function(data) {
        $("#editInfoModal").modal('hide');
    },
    showTipInfo: function (id) {
        if ($("#main-panel .showTipInfo").length < 1) {
            var tipInfoHtml = "<div class=\"showTipInfo\">" +
                "<div class=\"retract\"><a href=\"javascript:handler.showTipInfo();\" style=\"font-weight: bold;font-size: 13px;color: #000\">收起</a></div>" +
                "<div class=\"clear5\">&nbsp;</div>" +
                "<div class=\"topline\">&nbsp;</div>"+
                '<div id="km_container"></div></div>';
            $("#main-panel").append(tipInfoHtml);
            var pane=$("#km_container");
            DS.getView('./km/km_index',function(view){
                pane.empty();
                pane.html(view);
                var height=$(window).height() - 150;
                $("#main-panel .showTipInfo").find("#knowledge_right_div").css({height: height+ "px",overflow:"auto"});
                pane.find("#knowledge_tree").css({height:(height-70)+ "px"});
            });
        }
        if ($("#main-panel .showTipInfo").css("display") == "none") {
            $("#main-panel .showTipInfo").css("display", "block");
//            $("#main-panel .showTipInfo").css("bottom", "40px");
            $("#main-panel .showTipInfo").css("left", $("#" + id).position().left + 30 + "px");
            $("#main-panel .showTipInfo").animate({height: ($(window).height() - 100) + "px", width: ($(window).width() - 150) + "px"});
            $("#main-panel .showTipInfo").find("#knowledge_right_div").css({height:($(window).height() - 150) + "px",overflow:"auto"});

        } else {
            $("#main-panel .showTipInfo").animate({height: "10px", width: "0px"}, function () {
                $("#main-panel .showTipInfo").css("display", "none");
            });
        }
    },
    interfaceIndex: function (id) {
        if ($("#interface_container").find("#" + id).length == 0) {
            var url = getCache("urls", id)["url"];
            var inner = "<iframe id='" + id + "' src='" + url+'?loginName='+session.user.displayName+'&loginExten='+session.user.exten + "' frameborder='0' width=100% height=100% scrolling=auto class='inner_container' marginheight=0px marginwidth=0px></iframe>";
            $("#interface_container").append(inner);
        }
        $("#interface_container .inner_container").css("display", "none");
        $("#interface_container").find("#" + id).css("display", "block");
    },
    generateCodeOptions:function(type,currentValue) {
        var dic=getCache(type)||[];
        var html="";
        html=generateComboxOptionsFromDocs(dic,"code_name","code_value",currentValue);
        return html;
    },
    _setSearchCondition:function(data,pane){
        var condition= $.toJSON(data);
        pane.find(".search_condition").html(condition);
    },
    _getSearchCondition:function(pane,isAll){
        var query=null;
        var json=pane.find(".search_condition").html();
        if(json){
            query=$.evalJSON(unescapeHtml(json));
            query=removeEmptyProperty(query);
        }
        if(isAll!="1"){
            var ids=[];
            pane.find(".list_item_check.select_on").each(function(i){
                var pk=$(this).find("input[name='pk']").val();
                ids.push(pk);
            });
            var _q=null;
            if(ids.length>0){
                _q={_id:{$in:ids}};
            }else{
                _q={_id:"NA"};
            }
            query=_q;
        }
        return query;
    },
    showDealToolbar:function(type,src){
        var pane,url;
        if(type=="customer"){
            var menu=src.attr("ds_attr");
            //console.info("showDealToolbar menu====="+menu);
            pane=$('#contact_list_'+menu);
            url="customer/customer_deal";
        }else if(type=="business"){
            pane=$('#contact_list_business');
            url="business/task_deal";
        }else if(type=="call"){
            pane=$('#contact_list_channel');
            url="cdr/cdr_deal";
        }else if(type=="mail"){
            pane=$('#contact_list_channel');
            url="channelHistory/mail_deal";
        }else if(type=="weixin"){
            pane=$('#contact_list_channel');
            url="channelHistory/weixin_deal";
        }
        var list=pane.find(".list-inside");
        var toolbarPane=$("#pane_deal_list");
        var menu=pane.attr("ds_menu");
        if(!list.hasClass("list_check_edit")){
            list.addClass("list_check_edit");
            list.find(".item_row").removeClass("item_check ds_do_action").addClass("item_check_toggle");
            list.find(".ico_select_checkbox").show();
            var topH=pane.find(".caption-top").outerHeight(true);
            pane.find(".caption-top").hide();
            var _checkbox=pane.find(".cancel_edit").find(".ico_select_checkbox");
            var _top=topH/2-(_checkbox.outerHeight(true)/2);
            pane.find(".cancel_edit").find(".ico_select_checkbox").css("top",_top+"px");
            pane.find(".cancel_edit").css({"height":topH+"px","line-height":topH+"px"}).show();

            DS.getView(url,function(view){
                if(view){
                    view=view.replace(/_#menu#_/g,menu);
                    toolbarPane.html(view);
                    if(type=="customer"){
                        if(!isHasFunc("func_customer_delete")){
                            toolbarPane.find(".toolbar_item_delete").remove();
                        }else{
                            toolbarPane.find(".toolbar_item_delete").show();
                        }
                        if(!isHasFunc("func_customer_export")){
                            toolbarPane.find(".toolbar_item_export").remove();
                        }else{
                            toolbarPane.find(".toolbar_item_export").show();
                        }
                        if(!isHasFunc("func_customer_assign")){
                            toolbarPane.find(".toolbar_item_assign").remove();
                        }else{
                            toolbarPane.find(".toolbar_item_assign").show();
                        }
                        if(!isHasFunc("func_customer_clearOwner")){
                            toolbarPane.find(".toolbar_item_clear").remove();
                        }else{
                            toolbarPane.find(".toolbar_item_clear").show();
                        }
                        if(!isHasFunc("func_customer_convert")){
                            toolbarPane.find(".toolbar_item_update_convert").remove();
                        }else{
                            toolbarPane.find(".toolbar_item_update_convert").show();
                        }

                        if(!isHasFunc("func_customer_export_batch_monitor")){
                            toolbarPane.find(".toolbar_item_export_batch_monitor").remove();
                        }else{
                            toolbarPane.find(".toolbar_item_export_batch_monitor").show();
                        }
                        if(!isHasFunc("func_customer_export_cdr")){
                            toolbarPane.find(".toolbar_item_export_call_record").remove();
                        }else{
                            toolbarPane.find(".toolbar_item_export_call_record").show();
                        }
                    }else if(type=="business"){
                        if(!isHasFunc("func_task_export")){
                            toolbarPane.find(".toolbar_item_export").remove();
                        }else{
                            toolbarPane.find(".toolbar_item_export").show();
                        }
                        if(!isHasFunc("func_task_delete")){
                            toolbarPane.find(".toolbar_item_delete").remove();
                        }else{
                            toolbarPane.find(".toolbar_item_delete").show();
                        }
                    }else if(type=="call"){
                        if(!isHasFunc("func_export_cdr")){
                            toolbarPane.find(".toolbar_item_export").remove();
                        }else{
                            toolbarPane.find(".toolbar_item_export").show();
                        }
                        if(!isHasMenu("call_sheet_export_monitor_task")){
                            toolbarPane.find(".call_sheet_export_monitor_task").remove();
                        }else{
                            toolbarPane.find(".call_sheet_export_monitor_task").show();
                        }

                    }else if(type=="mail"){
                        if(!isHasMenu("all_undeal_mail")){
                            toolbarPane.find(".toolbar_item_assign").remove();
                        }else{
                            toolbarPane.find(".toolbar_item_assign").show();
                        }
                    }else if(type=="weixin"){
                        if(!isHasMenu("all_undeal_weixin")){
                            toolbarPane.find(".toolbar_item_assign").remove();
                        }else{
                            toolbarPane.find(".toolbar_item_assign").show();
                        }
                    }

                    toolbarPane.show();
                    pane.find(".cancel_edit .bottom_toolbar_selsize_num").text("0");
                    toolbarPane.find(".bottom_toolbar_selsize_num").text("0");
                }
            })
        }
    },
    cancelDealToolbar:function(type,src){
        var pane;
        if(type=="customer"){
            var menu=src||handler.customer.curSubMenu;
            if(src && typeof(src)=="object"){
                menu=src.attr("ds_attr");
            }
            pane=$('#contact_list_'+menu);
        }else if(type=="business"){
            pane=$('#contact_list_business');
        }else if(type=="call"||type=="mail"||type=="weixin"){
            pane=$('#contact_list_channel');
        }else if(type == "cdr"){
            pane = $('#contact_list_cdr');
        }else if(type == "webchat"){
            pane = $('#contact_list_webchat');
        }
        if(pane.length==0){
            return;
        }
        var list=pane.find(".list-inside");
        var toolbarPane=$("#pane_deal_list");
        if(list.hasClass("list_check_edit")){
            list.removeClass("list_check_edit");
            list.find(".item_row").removeClass("item_check_toggle").addClass("item_check ds_do_action");
            list.find(".ico_select_checkbox").hide();
            list.find(".list_item_check").removeClass("select_on");
            pane.find(".cancel_edit").hide();
            pane.find(".caption-top").show();
            toolbarPane.hide();
            pane.find(".cancel_edit .list_check_all").removeClass("select_on select_half");
            toolbarPane.find(".list_check_all").removeClass("select_on select_half");
        }
    },
    formatShortTime:function(date){
        if(!date){
            return {time:'',name:''};
        }
        var _d= date.substring(0, 10);
        var _t= date.substring(11,16);
        var a = _d.split("-");
        var dd=parseInt(a[0],10)+"/"+parseInt(a[1],10)+"/"+parseInt(a[2],10);
        var today = new Date();
        var now = countDay(0);
        //console.dir(d.getTime()+"\n"+dd+"\n"+Date.parse(now)+"\n"+Date.parse(dd));
        var yesterday = countDay(-1);
        var _yesterday = countDay(-2);
        var result = new Object();
        result.time =date;
        result.name = _d;
        if (dd == now) {
            result.name = _t;
        } else if (dd == yesterday) {
            result.name = "昨天"+_t;
        } else if (dd == _yesterday) {
            result.name = "前天"+_t;
        } else if(a[0] < today.getFullYear()) {
            result.name =_d;
        } else if (Date.parse(dd) < Date.parse(now)) {
            result.name = a[1] + "-" + a[2];
        }
        return result;
    },

    formatChatShortTime:function(date, showSencond){
        if(!date){
            return "";
        }
        var _d= date.substring(0, 10);
        var _t = "";
        if(showSencond){
            _t= date.substring(11,19);
        }else{
            _t= date.substring(11,16);
        }

        var a = _d.split("-");
        var dd=parseInt(a[0],10)+"/"+parseInt(a[1],10)+"/"+parseInt(a[2],10);
        var today = new Date();
        var now = countDay(0);
        var yesterday = countDay(-1);
        var _yesterday = countDay(-2);
        var result = new Object();
        result.time =date;
        result.name = _d;
        if (dd == now) {
            result.name = _t;
        } else if (dd == yesterday) {
            result.name = "昨天 "+_t;
        } else if (dd == _yesterday) {
            result.name = "前天 "+_t;
        } else if(a[0] < today.getFullYear()) {
            result.name =a[0] + "年" + a[1] + "月" + a[2]+"日 "+_t;;
        } else if (Date.parse(dd) < Date.parse(now)) {
            result.name = a[1] + "月" + a[2]+"日 "+_t;
        }
        return result.name;
    },
    getFormatDateTime:function(date){
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
    escapeHtml:function(str){
        str = String(str).replace(/'/gm,"&#39;");
        return str;
    },
    unescapeHtml:function(str){
        str = String(str).replace(/&#39;/gm, "'");
        return str;
    },
    getCCPbxOptions:function(val){
        var html="";
        var ccFee=session.account;
        var pbx=ccFee.pbx||[];
        var dic=[];
        for (var i = 0; i < pbx.length; i++) {
            var obj = pbx[i];
            dic.push({codeValue:obj.PBX,codeName:obj.NickName});
        }
        html=handler.getDicOptions(dic,val);
        return html;
    },
    getDicOptions:function(dic,currentVal,showDft){
        var html=[];
        if(showDft!='no'){
            html.push("<option value=''>--请选择--</option>");
        }
        var selectOptionHtml = "<option value='__value' selected>__name</option>";
        var optionHtml = "<option value='__value'>__name</option>";
        var ary=dic;
        if(!ary || ary.length==0) return null;
        for (var i=0;i<ary.length;i++) {
            var obj=ary[i];
            if(currentVal && currentVal==obj._id){
                html.push(selectOptionHtml.replace(/__value/g,obj.codeValue).replace(/__name/g,obj.codeName));
            } else{
                html.push(optionHtml.replace(/__value/g,obj.codeValue).replace(/__name/g,obj.codeName));
            }
        }
        return html.join("");
    },

    formatFee : function (number) {
        number=number||0;
        return Math.round(number*10000);
    },
    formatTrueFee : function (number) {
        number=number||0;
        return number/10000;
    },
    formatRoundMoney:function(number) {
        return Math.round(number*10000)/10000;
    },
    formatRound2Money : function (number) {
        number=number||0;
        return handler.formatMoney(number/10000);
    },
    formatMoney:function(amount) {
        var i = parseFloat(amount);
        if(isNaN(i)) { i = 0.00; }
        var minus = '';
        if(i < 0) { minus = '-'; }
        i = Math.abs(i);
        i = parseInt((i + .005) * 100);
        i = i / 100;
        var s = new String(i);
        if(s.indexOf('.') < 0) { s += '.00'; }
        if(s.indexOf('.') == (s.length - 2)) { s += '0'; }
        s = minus + s;
        return s;
    },
    getMyAccInfo:function(){
        var pane=$("#view_company_identity");
        return pane.data("accInfo");
    },
    setMyAccInfo:function(data){
        var pane=$("#view_company_identity");
        data.balanceDesc=handler.formatRound2Money(data.balance);
        pane.data("accInfo",data);
    },
     selectTaskAllAgent: function(sel,formId,task_num){
        var pane     = $("#"+formId).find('.cust_assgin_agent_container'),    
            all      = pane.find("input[type=checkbox]"),   
            total    = 0,
            unit     = $("#"+formId).find(".unit").html();
            $.each(all,function(key, item){
                    task_num = $(item).next('.user_cust').val()>0?$(item).next('.user_cust').val():($("#"+formId).find(".daily_task input").val()||task_num);
                    $(item).next('.user_cust').change(function(){
                        total += +$(item).next('.user_cust').val()>0?+$(item).next('.user_cust').val():0;
                         utils.setDttotalHtml(total,unit);
                         return;
                    });
                    total += +task_num; 
                    task_num = sel.checked?($("#"+formId).find(".daily_task input").val()||task_num):'';
                    sel.checked?$("#dttotal").hide():"";
                    $(item).attr("checked",sel.checked).siblings("input").val(task_num);
                });
            
            utils.setDttotalHtml(total,unit);
            !sel.checked?$("#dttotal").empty():"";
             return false;
    },
    selectAgent: function (sel,formId,task_num){
        var pane     = $("#"+formId).find('.cust_assgin_agent_container'),
            all      = pane.find("input[type=checkbox]:checked"),
            total    = 0,
            allIsChecked = pane.find("input[type=checkbox]");

            userId   = $(sel).val(),
            unit     = $("#"+formId).find(".unit").html();
           utils.allAgent(sel,task_num,all,total,unit,formId);
            for (var i = 0; i < allIsChecked.length; i++) {
                allIsChecked.css("display")!=="none"&&!allIsChecked.eq(i).attr("checked")? allIsChecked.eq(i).closest('.control-label').find('.user_cust').val(""):"";
            }
             return false;
    },
    resetForm: function(data,src){
        var frm=data?src.closest("form"):src.find("div.advanced_search_pane form");

        frm.get(0).reset();
         $("select[name='city']")&&$("select[name='city']").html('<option value="">--请选择--</option>');
        frm.find(".search_input_dd")&&frm.find(".search_input_dd").removeClass("active");
        frm.find(".select_input")&&frm.find(".select_input").val("");
    },

//    ,
//    login: function (data, src) {
//        var remoteAction = src.attr('remoteaction');
//        if (remoteAction) {
//            var action = {
//                action: remoteAction,
//                data: data
//            }
//            DS.util.sendAction(action, function (response) {
//                if (response.success) {
//                    var toView = src.attr('toview');
//                    var viewPanel = src.attr('viewpanel');
//                    if (toView && viewPanel) {
//                        getBufferedView(toView, function (view) {
//                            if (view) {
//                                $('#' + viewPanel).html(view);
//                                if (src.attr('callback')) {
//                                    var callback = new Function(src.attr('callback') + '();');
//                                    callback();
//                                }
//                            }
//                        });
//                    }
//                } else {
//                    alert(response.message);
//                }
//            });
//        }
//    }
}

//$.getScript("./javascripts/client/customer.js");

//$.getScript("./javascripts/business.js");
//$.getScript("./javascripts/config/business.js");
//$.getScript("./javascripts/config/callConfig.js");
//$.getScript("./javascripts/config/customer.js");
//$.getScript("./javascripts/config/role.js");
//$.getScript("./javascripts/config/channel/channel.js");
//$.getScript("./javascripts/config/dic.js");
//$.getScript("./javascripts/config/user.js");
//$.getScript("./javascripts/config/questionnaire.js");
//$.getScript("./javascripts/config/qualityCheck.js");
//$.getScript("./javascripts/config/account.js");
//$.getScript("./javascripts/sms.js");
//$.getScript("./javascripts/customerTask.js");
//$.getScript("./javascripts/config/channelDic.js");
