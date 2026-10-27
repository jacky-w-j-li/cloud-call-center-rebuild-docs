handler.customer.approvalBusiness={
    pageSize:10,
    cid:'#view_nav_business',
    menuId:'business',
    curSubMenu:'',
    isReceive:false,
    flows:[],
    steps:[],
    approval_business_main : function(menu){
        $(".approval_refresh").click();
        handler.customer.approvalBusiness._initAdvancedSearch();
        handler.customer.approvalBusiness.refreshUndealNum();
    },
    quick_subMenu_search: function (data,src) {
        var searchPane = src.closest(".list_check_pane");
//        searchPane.find(".bus_submenu").find(".quick_row>li").removeClass("active");
//        src.closest("li").addClass("active");
        searchPane.find(".model_submenu button").removeClass("active");
        src.addClass("active");
        searchPane.find("#approval_business_list_query_form").find("input[name='submenu']").val(data);
        searchPane.find("#approval_business_list_advanced_form").find("input[name='submenu']").val(data);

        handler.customer.approvalBusiness.curSubMenu=data;



        if(data=='not_receive_business'){
            $("#currentTab").val("not_receive_business");
            handler.customer.approvalBusiness.queryNotReceiveBusiness({},src);
        }else if(data=='my_business') {
            $("#currentTab").val("my_business");
            handler.customer.approvalBusiness.queryMyBusiness({},src);
        }else if(data=='all_business') {
            $("#currentTab").val("all_business");
            handler.customer.approvalBusiness.queryAllBusiness({},src);
        }

        $("#nav_cust_approval_business_approval_business").hide();

    },
    _initAdvancedSearch:function(){
        var searchPane = $("#contact_list_approval_business");
        searchPane.find(".apprval_task_list_search_dorpdown").bind("click",function(e){
            e.stopPropagation();
            var offset=searchPane.find(".quick_search").offset();
            var _p=searchPane.find("#approvale_business_list_advanced_search");
            _p.css({top:offset.top+28+"px",left:offset.left+"px"});
            _p.toggleClass("hidden");
        });

        var url = 'customer/approvalBusiness/approval_business_search';
        DS.getView(url, function(view){
            view=DS.renderViewNew(view);
            searchPane.find("#approvale_business_list_advanced_search").html(view);
        });
    },
    queryApprovalBusinessList : function (data,src){
        var container = $("#talk_list_item_panenav_cust_approval_business");
        var currentTab = $("#currentTab").val();
        var page=data.page;
        if(src && src.hasClass("page_on")){
            page=src.attr("value");
        }
        if(!page)page=1;
        data.page=page;
        data.limit=handler.config.user.pageSize;
        var page=data.page;
        if(!page)page=1;
        data.page=page;
        data.limit=handler.customer.titket.limit;
        delete data["isAdvanceSearch"];

        if(currentTab == "my_business"){
            data.owner = session.user._id;
            data.status = "0";
        }else if(currentTab == "not_receive_business"){
            data.owner = "NA";
        }
        var action = {
            action: 'app.customer.approvalBusiness.queryCustomerApprovalBusiness',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var approvalBusiness = response.list;
                var html = [];
                for (var i = 0; i < approvalBusiness.length; i++) {
                    var _obj=approvalBusiness[i];
                    var createUser = handler.customer.task.getAgentName(_obj.createUser);
                    _obj.createUser = createUser;
                    _obj.setToMe = "0"; //没有领取按钮
                    html.push($('#tmpl_approval_business_item').tmpl(_obj).get(0).outerHTML);
                }
                if(html.length == 0) html.push('<div class="alert">没有记录!</div>');
                container.html(html.join(""));
            }else{
                $().alertmessage('showError', response.message);
            }
            DS.updatePagination("approval_business_list_query_form", response.count, handler.config.dept.pageSize, data.page);
        });
    },
    approvalAdvancedSearch: function(data, src) {
        DS.showSearchTips($("#approval_business_list_advanced_form"),false);
        $("#approvale_business_list_advanced_search").addClass("hidden");
        handler.customer.approvalBusiness.queryApprovalBusinessList(data,src);
    },
    addCustApprovalBusiness : function (data,src){
        if(data.apprType == "2"){
            if(!data.reason||$.trim(data.reason)==""){
                alert("无效原因不能为空");
                return;
            }
        }else if(data.apprType == "3"){
            var exp = /^([1-9][\d]{0,8}|0)(\.[\d]{1,2})?$/;
            if(!exp.test(data.money)){
                alert("成交金额输入有误");
                return;
            }
            if(!data.memo){
                data.memo = "无";
            }
        }else if(data.apprType == "4"){
            if(!data.reason||$.trim(data.reason)==""){
                alert("丢单原因不能为空");
                return;
            }
            if(!data.competitors){
                data.competitors = "无";
            }
        }else if(data.apprType == "8"){
            var exp = /^([1-9][\d]{0,8}|0)(\.[\d]{1,2})?$/;
            if(!exp.test(data.money)){
                alert("续费金额输入有误");
                return;
            }
            if(!data.memo){
                data.memo = "无";
            }
        }

        if (src.hasClass("disabled")) return false;
        src.addClass("disabled");

        var action = {
            action: 'app.customer.approvalBusiness.addCustApprovalBusiness',
            data: data
        };
        DS.send(action, function (rep) {
            var pane = $("#customer_approval_modal");
            if (rep.success) {
                //禁用下拉框
                $(".edit_sysStatus").removeClass("edit_sysStatus");
                if(data.apprType == "2"){
                    $(".sysStatusBtn").html("无效待审");
                }else if(data.apprType == "4"){
                    $(".sysStatusBtn").html("丢单待审");
                }else if(data.apprType == "3"){
                    $(".sysStatusBtn").html("成单待审");
                }else if(data.apprType == "8"){
                    $(".sysStatusBtn").html("续费待审");
                }
                $().alertmessage('showSuccess', '提交审核成功');
                var panel = $(".left_column").find("[name='customerId']")
                panel.each(function(){
                    if($(this).val() == data.cid){
                        $(this).closest(".card_row_new").find('.genjinicon').removeClass().addClass('genjinicon genjinicon5').attr('title','审核');
                    }
                });
            } else {
                $().alertmessage('showError', rep.message || errMsg);
            }
            pane.modal("hide");
            $(".btn_appr_my_role").click();
            $(".approval_refresh").click();
            src.removeClass('disabled');
        });
    },
    queryNotReceiveBusiness : function(data,src){
        var container = $("#talk_list_item_panenav_cust_approval_business");
        var page=data.page;
        if(src && src.hasClass("page_on")){
            page=src.attr("value");
        }
        if(!page)page=1;
        data.page=page;
        data.limit=handler.config.user.pageSize;
        var page=data.page;
        if(!page)page=1;
        data.page=page;
        data.owner = "NA";
        data.limit=handler.customer.titket.limit;
        var action = {
            action: 'app.customer.approvalBusiness.queryCustomerApprovalBusiness',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var approvalBusiness = response.list;
                var html = [];
                for (var i = 0; i < approvalBusiness.length; i++) {
                    var _obj=approvalBusiness[i];
                    var createUser = handler.customer.task.getAgentName(_obj.createUser);
                    _obj.createUser = createUser;
                    _obj.setToMe = "1"; //有领取按钮
                    html.push($('#tmpl_approval_business_item').tmpl(_obj).get(0).outerHTML);
                }
                if(html.length == 0) html.push('<div class="alert">没有记录!</div>');
                container.html(html.join(""));
            }else{
                $().alertmessage('showError', response.message);
            }
            DS.updatePagination("approval_business_list_query_form", response.count, handler.config.dept.pageSize, data.page);
        });
    },
    showTodoTaskDetail: function (data, src) {
        var parm = data.split(",");
        var cid = parm[0];
        var buId = parm[1];
        var call_right=$("#"+session.currentPage.pageId+"_approval_business");
        handler.customer.loadCustInfo(cid, session.currentPage.pageId, "approval_business", buId,null,function(){
            call_right.find(".func_tab.active").click();
            if(!handler.customer.approvalBusiness.isReceive){
                $("#nav_cust_approval_business_approval_business").show();
            }else{
                handler.customer.approvalBusiness.isReceive = false;
            }

        });
    },
    showApprovalBusinessDetail: function (data, pane) {
        var action = {
            action:'app.customer.approvalBusiness.getCustApprovalBusinessById',
            data:data
        };
        DS.send(action,function(response){
            if(response.success){
                var custApprovalBusiness = response.custApprovalBusiness;
                if(custApprovalBusiness){
                    var loadPath = "customer/approvalBusiness/approval_business_invalid_detail";
                    if(custApprovalBusiness.apprType == "4")
                        loadPath = "customer/approvalBusiness/approval_business_lose_detail";
                    if(custApprovalBusiness.apprType == "3")
                        loadPath = "customer/approvalBusiness/approval_business_order_detail";
                    if(custApprovalBusiness.apprType == "8")
                        loadPath = "customer/approvalBusiness/approval_business_renew_detail";
                    DS.getView(loadPath, function (view) {
                        var createUser = handler.customer.task.getAgentName(custApprovalBusiness.createUser);
                        custApprovalBusiness.createUser = createUser;
                        delete  custApprovalBusiness.category;
                        pane.html(DS.renderMethodViewNew(view, custApprovalBusiness));
                        if(custApprovalBusiness.status != "0"){
                            $(".apprUnPass").remove();
                            $(".apprPass").remove();
                        }
                    })
                }else {
                    pane.html('<div class="action_bar"> <h2>该审核工单已完成</h2></div>');
                }

            }else{
                $().alertmessage('showError', response.message||errMsg);
            }
        });
    },
    setApprovalBusinessToMe : function (data,src){
        if (src.hasClass("disabled")) return false;
        src.addClass("disabled");
        var parm = data.split(",");
        var sendData = {"_id":parm[0],"owner":session.user._id,"cid":parm[1]};
        var action = {
            action:'app.customer.approvalBusiness.updateCustApprovalBusiness',
            data:sendData
        };
        DS.send(action,function(response){
            if(response.success){
                $(".approval_refresh").click();
                $("#view_nav_cust_approval_business").find(".btn_appr_my_todo").click();
                src.closest(".list_item").remove();
                $().alertmessage('showSuccess', '领取成功');
            }else{
                $(".approval_refresh").click();
                $("#nav_cust_approval_business_approval_business").hide();
                src.closest(".list_item").remove();
                handler.customer.approvalBusiness.isReceive = true;
                $().alertmessage('showError', response.message||errMsg);
            }
            src.removeClass('disabled');
        });
    },
    queryAllBusiness : function(data,src){
        var container = $("#talk_list_item_panenav_cust_approval_business");
        var page=data.page;
        if(src && src.hasClass("page_on")){
            page=src.attr("value");
        }
        if(!page)page=1;
        data.page=page;
        data.limit=handler.config.user.pageSize;
        var page=data.page;
        if(!page)page=1;
        data.page=page;
        data.limit=handler.customer.titket.limit;
        var action = {
            action: 'app.customer.approvalBusiness.queryCustomerApprovalBusiness',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var approvalBusiness = response.list;
                var html = [];
                for (var i = 0; i < approvalBusiness.length; i++) {
                    var _obj=approvalBusiness[i];
                    var createUser = handler.customer.task.getAgentName(_obj.createUser);
                    _obj.createUser = createUser;
                    _obj.setToMe = "0";
                    html.push($('#tmpl_approval_business_item').tmpl(_obj).get(0).outerHTML);
                }
                if(html.length == 0) html.push('<div class="alert">没有记录!</div>');
                container.html(html.join(""));
            }else{
                $().alertmessage('showError', response.message);
            }
            DS.updatePagination("approval_business_list_query_form", response.count, handler.config.dept.pageSize, data.page);
        });
    },
    queryMyBusiness : function(data,src){
        var container = $("#talk_list_item_panenav_cust_approval_business");
        var page=data.page;
        if(src && src.hasClass("page_on")){
            page=src.attr("value");
        }
        if(!page)page=1;
        data.page=page;
        data.limit=handler.config.user.pageSize;
        var page=data.page;
        if(!page)page=1;
        data.page=page;
        data.owner = session.user._id;
        data.status = "0";
        data.limit=handler.customer.titket.limit;
        var action = {
            action: 'app.customer.approvalBusiness.queryCustomerApprovalBusiness',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var approvalBusiness = response.list;
                var html = [];
                for (var i = 0; i < approvalBusiness.length; i++) {
                    var _obj=approvalBusiness[i];
                    var createUser = handler.customer.task.getAgentName(_obj.createUser);
                    _obj.createUser = createUser;
                    html.push($('#tmpl_approval_business_item').tmpl(_obj).get(0).outerHTML);
                }
                if(html.length == 0) html.push('<div class="alert">没有记录!</div>');
                container.html(html.join(""));
            }else{
                $().alertmessage('showError', response.message);
            }
            DS.updatePagination("approval_business_list_query_form", response.count, handler.config.dept.pageSize, data.page);
        });
    },
    passedBusiness : function(data,src){
        if (src.hasClass("disabled")) return false;
        src.addClass("disabled");
        var action = {
            action: 'app.customer.approvalBusiness.passedBusiness',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                if(data.apprType == "2"){
                    $(".sysStatusBtn").text("丢单");
                }else if(data.apprType == "3"){
                    $(".sysStatusBtn").text("成单");
                } else if(data.apprType == "4"){
                    $(".sysStatusBtn").text("无效");
                }
                $().alertmessage('showSuccess', '操作成功');
                $(".approval_refresh").click();
                $(".appr_search").click();
                $("#nav_cust_approval_business_approval_business").hide();
                var pane = $(src).closest(".action_form").parent();
                pane.empty().html('<div class="action_bar"> <h2>暂无客户状态审核工单</h2></div>');
            }else{
                $(".approval_refresh").click();
                $(".appr_search").click();
                $("#nav_cust_approval_business_approval_business").hide();
                $().alertmessage('showError', response.message);
            }
            src.removeClass('disabled');
        });
    },
    showBackBusiness : function (data,src){
        DS.getView('customer/approvalBusiness/approval_business_unpassed', function (view) {
            var pane = $(src).closest(".action_form");
            $(".action_form_unpass").remove();
            pane.after(render.replaceDataByObject(data, view));
        });
    },
    unPassedBusiness : function (data,src){
        if (src.hasClass("disabled")) return false;
        src.addClass("disabled");
        var action = {
            action: 'app.customer.approvalBusiness.unPassedBusiness',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                $(".approval_refresh").click();
                $().alertmessage('showSuccess', '操作成功');
                $(".appr_search").click();
                $("#nav_cust_approval_business_approval_business").hide();
                $(".customer_normal_search").click();
                $(".customer_container,.cust_tab_content").empty();
                var pane = $(src).closest(".action_form").parent();
                pane.empty().html('<div class="action_bar"> <h2>暂无客户状态审核工单</h2></div>');
            }else{
                $(".approval_refresh").click();
                $(".appr_search").click();
                $("#nav_cust_approval_business_approval_business").hide();
                $(".customer_normal_search").click();
                $(".customer_container,.cust_tab_content").empty();
                $().alertmessage('showError', response.message);
            }

            src.removeClass('disabled');
        });
    },
    refreshUndealNum:function(data,src){
        var listPane=$('#contact_list_approval_business');
        var action = {
            action: 'app.customer.approvalBusiness.refreshUndealNum',
            data: {}
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                var unReadCount = rep.unReadCount;
                var myCount = rep.myCount;
                var unApproval = rep.unApproval;
                if(unReadCount<0){
                    unReadCount=0;
                }
                if(myCount>0){
                    var txt=unApproval+"/"+myCount;
                    listPane.find(".model_submenu").find('.btn_appr_my_todo').find(".badge").text(txt);
                }else{
                    listPane.find(".model_submenu").find('.btn_appr_my_todo').find(".badge").text("");
                }
                if(unReadCount>0){
                    listPane.find(".model_submenu").find('.btn_appr_my_role').find(".badge").text(unReadCount);
                }else{
                    listPane.find(".model_submenu").find('.btn_appr_my_role').find(".badge").text("");
                }
                handler.customer.approvalBusiness.initUndealNum(false,myCount,unApproval);
                var currentTab = $("#currentTab").val();
                if(currentTab == "not_receive_business"){
                    $(".btn_appr_my_role").click();
                }else if(currentTab == "my_business"){
                    $(".btn_appr_my_todo").click();
                }else if (currentTab == "all_business"){
                    $(".btn_appr_all").click();
                }
            } else {
                $().alertmessage('showError', errMsg);
            }
        });
    },
    initUndealNum:function(isInit,num1,num2){
        var pane=$('#main-panel').find(".navbar_top");
        if(isInit){
            var action = {
                action: 'app.customer.approvalBusiness.refreshUndealNum',
                data: {}
            };
            DS.send(action, function (rep) {
                if (rep.success) {
                    var unReadCount = rep.unReadCount;
                    var myCount = rep.myCount;
                    var unApproval = rep.unApproval;
                    if(unApproval>0||unReadCount>0){
                        pane.find(".navbar_item>.nav_cust_approval_business").html('<span class="task_pop_tip"></span>');
                    }
                } else {
                    $().alertmessage('showError', errMsg);
                }
            });
        }else{
            if(num1>0||num2>0){
                pane.find(".navbar_item>.nav_cust_approval_business").html('<span class="task_pop_tip"></span>');
            }else{
                pane.find(".navbar_item>.nav_cust_approval_business").html('');
            }
        }
    }
}