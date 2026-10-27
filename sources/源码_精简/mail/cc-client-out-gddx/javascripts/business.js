handler.business = {
    cid:'#view_nav_business',
    menuId:'business',
    curSubMenu:'',
    flows:[],
    steps:[],
    task_main:function(menu){
        //menu="my_role_task_uncomplete";//default menu
        //handler.business.task_list(menu);
        handler.business.refreshUndealNum();
        if(handler.workbench.toShowBusMyTodo){
            $(handler.business.cid).find(".btn_my_todo").click();
            handler.workbench.toShowBusMyTodo = false;
        }else{
            $(handler.business.cid).find(".btn_my_role").click();
        }
       /* var action = {
            action: 'app.business.getUnDealBusNum',
            data:{}
        };
        DS.send(action, function(response){
            if(response.success){
                var total=response.total;
                var noReadNum=response.noReadNum;
                if(total>0){
                    var txt=noReadNum+"/"+total;
                    listPane.find(".model_submenu").find('.btn_my_todo').find(".badge").text(txt);
                }

            }else{
                $().alertmessage('showError', errMsg);
            }
        });*/
    },
   quick_subMenu_search: function (data, src) {
        var searchPane = src.closest(".list_check_pane");
        var adSearchPane = $("#task_list_search_querynav_business");
        searchPane.find(".model_submenu button").removeClass("active");
        src.addClass("active");
        searchPane.find("#business_list_query_form").find("input[name='submenu']").val(data);
        searchPane.find("#business_list_advanced_form").find("input[name='submenu']").val(data);

        handler.business.curSubMenu = data;
        var normalForm = searchPane.find("#business_list_query_form");
        var advPane = searchPane.find("#business_list_advanced_form");
        if (advPane.find(".ds_submenu2").length > 0) {
            advPane.find(".ds_submenu2").remove();
        }
        if (data == 'my_role_task_uncomplete') {
            advPane.find(".ds_owner_master").hide();
            normalForm.find("input[name='submenu2']").val("");
            initQuickMenu(searchPane, handler.business.flows, "business", ".quick_wrap_bus");
        } else if (data == 'my_task_uncomplete') {
            advPane.find(".ds_owner_master").hide();
            normalForm.find("input[name='flow']").val("");
            var quickMenus = [{n: "我的待办", v: "my_task_uncomplete"}, {n: "我参与的", v: "my_task_followed"}, {n: "我创建的", v: "my_task_created"}];
            initQuickMenu(searchPane, quickMenus, "business", ".quick_wrap_bus");
            var _html = '<div class="span4 advanced_search_item ds_search_item ds_submenu2"><label>快捷条件</label>' +
                '<select name="submenu2"><option value="" selected="">--请选择--</option><option value="my_task_uncomplete">我的待办</option>' +
                '<option value="my_task_followed">我参与的</option><option value="my_task_created" >我创建的</option></select></div>';
            advPane.find(".first_row").prepend(_html);
        } else if (data == 'business') {
            advPane.find(".ds_owner_master").show();
            normalForm.find("input[name='flow']").val("");
            var quickMenus = [{n: "全部", v: "business"}, {n: "待办", v: "task_uncomplete"}, {n: "完成", v: "task_finished"}];
            initQuickMenu(searchPane, quickMenus, "business", ".quick_wrap_bus");
            var _html = '<div class="span4 advanced_search_item ds_search_item ds_submenu2"><label>快捷条件</label>' +
                '<select name="submenu2"><option value="" selected>--全部--</option><option value="task_uncomplete" >待办</option>' +
                '<option value="task_finished" >完成</option></select></div>';
            advPane.find(".first_row").prepend(_html);
        }
        $("#" + session.currentPage.pageId + "_business").html(template("tmpl_customer_content_container_inner", {}));

        if (data == 'my_task_uncomplete' || data == "my_role_task_uncomplete") {
            searchPane.find(".business_master").closest("div").hide();
        } else {
            searchPane.find(".business_master").closest("div").show();
        }
        adSearchPane.find(".ds_form_action").siblings("button").click();
    },
    quick_flow_search: function (data,src) {
        //var flag= src.attr("flag");
        var searchPane = src.closest(".list_check_pane");
        searchPane.find(".quick_wrap_bus .quick_menu a").removeClass("quick_card_active");
        src.addClass("quick_card_active");
        searchPane.find(".quick_wrap_bus .quick_desc").text(src.text());
        if(handler.business.curSubMenu=='my_role_task_uncomplete'){
            searchPane.find("#business_list_query_form").find("input[name='flow']").val(data);
        }else{
            searchPane.find("#business_list_query_form").find("input[name='submenu2']").val(data);
        }


//        var menuLeft=searchPane.find(".quick_card.left");
        var menuRight=searchPane.find(".quick_card");
//        var _wl=menuLeft.outerWidth(true)+1;
        var _wr=menuRight.outerWidth(true);
//        console.info(" _wl=="+_wl+" _wr2=="+menuLeft.outerWidth());
//        searchPane.find(".textbox_wrap").css({"margin-left":_wr+"px"});
        var btn=searchPane.find('.bus_normal_search');
        btn.click();

/*        if(flag=="left"||flag=="right"){
            var dic=handler.business.flows||[];
            slideQuickSearch(dic,data,src,"business",".bus_flows");
        }else{
            searchPane.find(".bus_flows").find(".quick_row>li").removeClass("active");
            src.closest("li").addClass("active");
        }
        searchPane.find("#business_list_query_form").find("input[name='flow']").val(data);
        var btn=searchPane.find('.bus_normal_search');
        btn.click();
        var stepPane=searchPane.find(".bus_steps");
        if(data){
            var flow = getCache("businessFlow", data);
            var steps = flow.steps || [];
            handler.business.steps=[{n:"全部",v:""}];
            for (var i = 0; i < steps.length; i++) {
                handler.business.steps.push({n:steps[i].name,v:steps[i]._id});
            }
            var searchPane=$("#contact_list_business");
            initQuickSearch(searchPane, handler.business.steps,"business_step",".bus_steps");
            stepPane.find("li:first a").addClass("active");
            stepPane.show();
        }else{
            stepPane.hide();
        }*/
//        resizeLeftColumn(searchPane);
    },
/*    quick_step_search: function (data,src) {
        var flag= src.attr("flag");
        var searchPane = src.closest(".list_check_pane");
        if(flag=="left"||flag=="right"){
            var dic=handler.business.steps||[];
            slideQuickSearch(dic,data,src,"business_step",".bus_steps");
        }else{
            searchPane.find(".bus_steps").find(".quick_row>li a").removeClass("active");
            src.addClass("active");
        }
        searchPane.find("#business_list_query_form").find("input[name='step']").val(data);
        var btn=searchPane.find('.bus_normal_search');
        btn.click();
    },*/
    refreshUndealNum:function(data,src){
        var listPane=$('#contact_list_business');
        var action = {
            action: 'app.business.refreshUndealNum',
            data: {}
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                var total=rep.total;
                var noReadNum=rep.noReadNum;
                var roleNum=rep.roleNum;
                if(noReadNum<0){
                    noReadNum=0;
                }
                if(total>0){
                    var txt=noReadNum+"/"+total;
                    listPane.find(".model_submenu").find('.btn_my_todo').find(".badge").text(txt);
                }else{
                    listPane.find(".model_submenu").find('.btn_my_todo').find(".badge").text("");
                }
                if(roleNum>0){
                    listPane.find(".model_submenu").find('.btn_my_role').find(".badge").text(roleNum);
                }else{
                    listPane.find(".model_submenu").find('.btn_my_role').find(".badge").text("");
                }
                if(src && src.hasClass("refresh_num")){
                    var btn=listPane.find('.bus_normal_search');
                    btn.click();
                }
                handler.business.initUndealNum(false,total,roleNum);
            } else {
                $().alertmessage('showError', errMsg);
            }
        });
    },
    refreshNoReadNum:function(num,flag){
        var listPane=$('#contact_list_business');
        var content=$.trim(listPane.find(".model_submenu").find('.btn_my_todo').find(".badge").text());
        var total=0;
        var noReadNum=0;
        if(content){
            var ary=content.split("/");
            total=parseInt(ary[1],10);
            noReadNum=parseInt(ary[0],10)+num;
        }
        if(noReadNum<0){
            noReadNum=0;
        }
        if(flag=='roleGet'){
            total+=num;
            var roleNum=$.trim(listPane.find(".model_submenu").find('.btn_my_role').find(".badge").text())||0;
            if(num>0){
                roleNum = parseInt(roleNum, 10) - num;
            }
            if(roleNum>0){
                listPane.find(".model_submenu").find('.btn_my_role').find(".badge").text(roleNum);
            }else{
                listPane.find(".model_submenu").find('.btn_my_role').find(".badge").text("");
            }
        }
        if(total>0){
            var txt=noReadNum+"/"+total;
            listPane.find(".model_submenu").find('.btn_my_todo').find(".badge").text(txt);
        }else{
            listPane.find(".model_submenu").find('.btn_my_todo').find(".badge").text("");
        }
    },
    task_list: function (id, querydata) {
        querydata = querydata || {};
        //console.dir(querydata);
        var isAdvanceSearch=querydata.isAdvanceSearch;
        delete  querydata.isAdvanceSearch;
        session.business = session.business || {};
        session.business.menu = id;
        session.business.subMenu = id;
        session.business.isAdvanceSearch = isAdvanceSearch;
        delete querydata.submenu;
//        var detailDiv = $("div.business_detail_div_" + id);
//        detailDiv.attr("id", id + "_business");
        var _menu=id;
        if(querydata.submenu2){
            _menu=querydata.submenu2;
        }
        delete querydata.submenu2;
        session.business.subMenu=_menu;
        //console.info("_menu====="+_menu);
        var listPane=$('#contact_list_business');
        var pane =listPane.find(".list-inside");
        pane.empty();
//        var html = "";
        var frmId = "business_list_query_form";
        if(isAdvanceSearch=="1"){
            frmId = "business_list_advanced_form";
        }

        DS.getView('business/task_list_item_dev', function (view) {
            switch (_menu) {
                case "my_task_uncomplete" :
//                    $("#business_dropdown_button_" + id).hide();
                    handler.business.getUserUncompleteBusiness(querydata, function (err, data) {
                        //var count = data.count;
                        //if(count>0){
                        //    listPane.find(".model_submenu").find('.btn_my_todo').find(".badge").text(count);
                        //}
                        handler.business.processDisplayTaskList(pane, data, view, querydata,"todo");
                        DS.showSearchTips($("#"+frmId));
//                        handler.business.processListLimit(id);
                    });
                    break;
                case "my_role_task_uncomplete":
//                    $("#business_dropdown_button_" + id).hide();
                    handler.business.getUserRoleUncompleteBusiness(querydata, function (err, data) {
                        //var count = data.count;
                        //if(count>0){
                        //    listPane.find(".model_submenu").find('.btn_my_role').find(".badge").text(count);
                        //}
                        handler.business.processDisplayTaskList(pane, data, view, querydata);
                        session.business.flushTime = data.businessTime;
                        DS.showSearchTips($("#"+frmId));
                        pane.find(".list_item .master").hide();
                        pane.find(".list_item .role_get").show();

//                        handler.business.processListLimit(id);
                    });
                    break;
                case "my_task_created":
//                    $("#business_dropdown_button_" + id).hide();
                    handler.business.getUserAssignedBusienss(querydata, function (err, data) {
                        handler.business.processDisplayTaskList(pane, data, view, querydata);
                        DS.showSearchTips($("#"+frmId));
//                        handler.business.processListLimit(id);
                    });
                    break;
                case "my_task_followed":
                    $("#business_dropdown_button_" + id).hide();
                    handler.business.getUserFllowedBusiness(querydata, function (err, data) {
                        handler.business.processDisplayTaskList(pane, data, view, querydata);
                        DS.showSearchTips($("#"+frmId));
                        //handler.business.processListLimit(id);
                    });
                    break;
                /*case "my_task_finished":
                    $("#business_dropdown_button_" + id).hide();
                    handler.business.getUserFinishedBusiness(querydata, function (err, data) {
                        handler.business.processDisplayTaskList(pane, data, view, querydata);
                        DS.showSearchTips($("#"+frmId));
                        handler.business.processListLimit(id);
                    });
                    break;*/
//                case "task_all":
                case "business":
                    handler.business.getAllBusiness(querydata, function (err, data) {
                        handler.business.processDisplayTaskList(pane, data, view, querydata);
                        DS.showSearchTips($("#"+frmId));
//                        handler.business.processListLimit(id);
                    });
                    break;
                case "task_uncomplete":
                    handler.business.getUncompleteBusiness(querydata, function (err, data) {
                        handler.business.processDisplayTaskList(pane, data, view, querydata);
                        DS.showSearchTips($("#"+frmId));
                        //handler.business.processListLimit(id);
                    });
                    break;
                case "task_finished":
                    handler.business.getFinishedBusiness(querydata, function (err, data) {
                        handler.business.processDisplayTaskList(pane, data, view, querydata);
                        DS.showSearchTips($("#"+frmId));
                        //handler.business.processListLimit(id);
                    });
                    break;
                default :
                    break;
            }
        });
    },
    processListLimit : function (menu){
      var pane = $("#contact_list_" + menu);
      if(menu.substring(0,2) == 'my'){
            if(!isHasFunc("func_my_task_export")){
                var _obj=pane.find(".func_hide");
                if(_obj){
                    _obj.remove();
                }
            } else {
                pane.find(".func_hide").show();
            }
      } else {
          if(!isHasFunc("func_task_export")){
              var _obj=pane.find(".func_hide");
              if(_obj){
                  _obj.remove();
              }
          } else {
              pane.find(".func_hide").show();
          }
      }
    },
    queryHighBusiness: function (data, src) {
//        var menu = session.currentPage.pageId;
//        data.query = $(".business_list_query_form").find("input[name='query']").val();
        var menu=data.submenu||"business";
        handler.business.task_list(menu, data);
        src.closest(".advanced_search_pane").addClass("hidden");
    },
    resetQueryHighBusiness: function (data, src) {
        var menu = session.currentPage.pageId;
        $("#task_list_search_query" + menu).find(".business_type").val("");
        $("#task_list_search_query" + menu).find(".business_type").change();
        $("#task_list_search_query" + menu).find(".query_field").val("");
        handler.resetForm();
        $("#task_list_search_query" + menu).find(".search_input_dd").removeClass("active");
    },
    _checkCondition:function(data){
        var query=data;
        var leftPane=$('#contact_list_business');
        var toolbarPane=$("#pane_deal_list");
        var checkPane=leftPane.find(".list_check_all");
        var num=toolbarPane.find(".bottom_toolbar_selsize_num").text();
        num=parseInt(num,10)||0;
        if(num<=0){
            $().alertmessage('showError', "请至少选择一条进行操作！");
            return false;
        }
        var isAll=checkPane.hasClass("select_on")?"1":"0";
        if(isAll!="1"){
            var ids=[];
            leftPane.find(".list_item_check.select_on").each(function(i){
                var bid=$(this).find("input[name='busId']").val();
                ids.push(bid);
            });
            var _q=null;
            if(ids.length>0){
                _q={_id:{$in:ids}};
            }else{
                _q={_id:"NA"};
            }
            if(query && query.flow){
                _q.flow=query.flow;
            }
            query=_q;
        }
        return query;
    },
    exportBusiness: function (data, src) {
        var menu = session.business.menu;
        var data = session.business.query[menu] || {};
//        data.query = $("#business_list_query_form").find("input[name='query']").val();
        var check=handler.business._checkCondition(data);
        if(!check){
            return;
        }else{
            data=check;
        }
        if (!data.flow) {
            $().alertmessage('showError', "一次导出操作只能导出同一类型的工单，请设置工单类型查询条件后，再进行导出");
            return;
        }
//        console.log(data);
        var action = {
            action: "app.business.exportBusiness",
            data: data
        };
        DS.send(action, function (response) {
            if (response) {
                handler.cancelDealToolbar("business");
                downloadFile(response.path);
            } else {
                $().alertmessage('showError', errMsg);
//                alert("获取数据失败！请稍后重试！");
            }
        });
    },
    deleteBusiness : function (data , src){
//        var menu = session.currentPage.pageId;
        var menu = session.business.menu;
        var data = session.business.query[menu] || {};
//        data.query = $("#business_list_query_form").find("input[name='query']").val();

        var check=handler.business._checkCondition(data);
        if(!check){
            return;
        }else{
            data=check;
        }
//        console.log(data);
        var action = {
            action : "app.business.getBusinessCount",
            data : data
        };
        DS.send(action , function (response){
            if(response.success){
                var count = response.count || 0;
                DS.getView("business/business_delete_info" , function (view) {
                    var render = template.compile(view);
                    var panel = $('#modal_panel');
                    panel.html(render({deleteCount:count}));
                    $('#delete_business_info_Modal').modal({'backdrop': 'static'})
                });
            } else {
                $().alertmessage('showError', "统计数据异常，无法删除数据。");
            }
        });

    },
    confirmBusinessDelete : function ( data , src) {
        var menu = session.business.menu;
        var data = session.business.query[menu] || {};
//        data.query = $("#business_list_query_form_" + menu).find("input[name='query']").val();
        var check=handler.business._checkCondition(data);
        if(!check){
            return;
        }else{
            data=check;
        }

        var action = {
            action : "app.business.deleteBusiness",
            data : data
        }
        DS.send(action , function(response){
            if(response.success){
                $().alertmessage('showSuccess', "数据已删除");
                if(data._id){
                    delete data._id;
                }
                data.submenu=menu;
                data.isAdvanceSearch=session.business.isAdvanceSearch;
                //session.business.query[menu] = data;
                handler.business.refreshNoReadNum(-data._id.$in.length, "roleGet");
                handler.business.queryBusinessList(data,src);
                handler.business.colseBusinessDelete(data , src);
                handler.cancelDealToolbar("business");
            } else {
                $().alertmessage('showError', "数据删除异常！");
            }
        });
    },
    colseBusinessDelete : function ( data , src) {
        $('#delete_business_info_Modal').modal('hide');
    },
    processDisplayTaskList: function (pane, data, view, querydata,type) {
        var html = "";
        var readHtml='<img src="/img/client/read.png" style="width: 10px;"/>';
        var list = data.list||[];
        for (var i = 0; i < list.length; i++) {
            var item=list[i];
            var _t=handler.formatShortTime(item.lastUpdateTime);
            item.shortTime=_t.name;
            item.readImg="";
            if(type=="todo"&&!item.isRead){
                item.readImg=readHtml;
            }
            if(!item.name){
                item.name='<span style="text-decoration:line-through;color:red;">已删除客户</span>';
            }
            html += render.replaceDataByObject(item, view);
        }
        if(list.length==0){
            html='<div class="alert">没有记录!</div>';
        }
        pane.html(html);
        if(type=="todo"){
            pane.find(".item_row").attr("ds_action","business.showTodoTaskDetail");
        }
        var count = data.count;
        $(pane).closest(".left_column").find(".pagination").find(".result_count").text(count);
        var list = $(pane).closest(".left_column").find(".pagination").find("li");
        updatePagination(list, count, querydata.limit || 10, querydata.page || 1);
        var menu = handler.business.menuId;
        $(".business_detail_div_"+menu).empty();
        session.business.query = session.business.query || {};
        session.business.query[session.business.menu] = data.condition;
    },
    queryBusinessList: function (data, src) {
//        var menu = session.currentPage.pageId;
//        var queydata = session.business.query[menu] || {};
//        queydata.query = $(".business_list_query_form").find("input[name='query']").val();
        data.page = src.val() || 1;
        data.limit = 10;
        var menu=data.submenu;
        if(menu!='my_role_task_uncomplete' && !data.submenu2){
            data.submenu2=session.business.subMenu;
        }
        //console.info("queryBusinessList===="+menu);
        //console.dir(data);
        handler.business.task_list(menu, data);
    },
    queryBusinessListByPage : function(data,src){
        var isAdvanceSearch = session.business.isAdvanceSearch;
        var frmId = "business_list_query_form";
        if(isAdvanceSearch=="1"){
            frmId = "business_list_advanced_form";
        }
        data = getDataOfForm($("#"+frmId));
        if(data.succeed){
            data = data.data;
        }
        data.page = src.val() || 1;
        data.limit = 10;
        handler.business.task_list(session.business.menu, data);
    },

    showPopubBusiness: function (pane, callObject,fid, callback) {
        DS.getView('business/add_task_popup', function (view) {
            pane.empty();
            var uid = "uid_" + uuid.v1().replace(/-/g, "_");
            var html = view.replace(/__uid/g, uid);
            fid = fid || "";
            html = html.replace(/_selectFlow/g,fid);
            pane.html(html);
            callback();
        });
    },
    getCustomerLastBusiness: function (customerId, callback) {
        if (!customerId) {
            callback(new Error("the customerId is null!"));
            return;
        }
        var data = {customer: customerId};
        if (typeof customerId == 'object') {
            data = customerId
        }

        var action = {
            action: "app.business.getCustomerLastBusiness",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var business = response.data;
                if (business) {
                    business.lastUpdateUser = getCache("agents", business.lastUpdateUser).name;
                    business.createUser = getCache("agents", business.createUser).name;
                    business.flowId = business.flow;
                    business.stepId = business.step;
                    business.step = getCache("businessFlowStep", business.step).name;
                    business.flow = getCache("businessFlow", business.flow).name;
                }
                callback(null, business);
            } else {
                callback(new Error(""));
            }
        });
    },

    getCustomerHistoryBusiness: function (customerId, callback) {
        if (!customerId) {
            callback(new Error("the customerId is null!"));
            return;
        }
        var action = {
            action: "app.business.getCustomerHistoryBusiness",
            data: {customer: customerId}
        };
        DS.send(action, function (response) {
            if (response.success) {
                var business = response.data || [];
                for (var i = 0; i < business.length; i++) {
                    var businessItem = business[i];
                    businessItem.lastUpdateUser = getCache("agents", businessItem.lastUpdateUser).displayName;
                    businessItem.createUser = getCache("agents", businessItem.createUser).displayName;
                    businessItem.step = getCache("businessFlowStep", businessItem.step).name;
                    businessItem.flow = getCache("businessFlow", businessItem.flow).name;

                    businessItem.data = handler.business.getBusinessHistoryData({excuteData: businessItem.historyData, action: "create"}, businessItem);
                    delete businessItem.historyData;
                }
                callback(null, business);
            } else {
                callback(new Error(""));
            }
        });
    },

    getCustomerHistoryBusinessByCallId: function (customerId, callId, callback) {
        if (!customerId) {
            callback(new Error("the customerId is null!"));
            return;
        }
        var action = {
            action: "app.business.getCustomerHistoryBusiness",
            data: {customer: customerId,
                    callId: callId}
        };
        DS.send(action, function (response) {
            if (response.success) {
                var business = response.data || [];
                for (var i = 0; i < business.length; i++) {
                    var businessItem = business[i];
                    businessItem.lastUpdateUser = getCache("agents", businessItem.lastUpdateUser).displayName;
                    businessItem.createUser = getCache("agents", businessItem.createUser).displayName;
                    businessItem.step = getCache("businessFlowStep", businessItem.step).name;
                    businessItem.flow = getCache("businessFlow", businessItem.flow).name;

                    businessItem.data = handler.business.getBusinessHistoryData({excuteData: businessItem.historyData, action: "create"}, businessItem);
                    delete businessItem.historyData;

                }
                callback(null, business);
            } else {
                callback(new Error(""));
            }
        });
    },

    my_task_uncomplete: function () {
        session.business = session.business || {};
        handler.business.getUserUncompleteBusiness({}, function (err, unDeals) {
            DS.getView('business/task_list_item_dev', function (view) {
                var pane = $('#talk_list_item_pane');
                pane.empty();
                var html = "";
                for (var i = 0; i < unDeals.length; i++) {
                    html += render.replaceDataByObject(unDeals[i], view);
                }
                html = html.replace(/_appaction/g, "business.showTask_uncomplete_detail");
                pane.html(html);
            });
        });
    },
    getUserUncompleteBusiness: function (data, callback) {
        var action = {
            action: 'app.business.getUnDealBusiness',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
//                var unDeals = response.data || [];
                callback(null, response);
            } else {
                callback(new Error(""));
            }
        });
    },
    getUserRoleUncompleteBusiness: function (data, callback) {
        var action = {
            action: 'app.business.getRoleUnDealBusiness',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
//                var unDeals = response.data || [];
                callback(null, response);
            } else {
                callback(new Error(""));
            }
        });
    },
    showTask_uncomplete_detail: function (data, src) {
        var id = data;
        var pane = $("#task_list_detail_panel");
        var type = "uncomplete";
        //handler.business.showTaskDetail_dev(id, pane, type, src);
        handler.business.showTaskDetail(id, pane, type, src);
    },

    task_i_assigned: function () {
        session.business = session.business || {};
        handler.business.getUserAssignedBusienss({}, function (err, datas) {
            DS.getView('business/task_list_item_dev', function (view) {
                var pane = $('#task_i_assigned_item_pane');
                pane.empty();
                var html = "";
                for (var i = 0; i < datas.length; i++) {
                    html += render.replaceDataByObject(datas[i], view);
                }
                html = html.replace(/_appaction/g, "business.showTask_assigned_detail");
                pane.html(html);
            });
        });
    },
    getUserAssignedBusienss: function (data, callback) {
        var action = {
            action: "app.business.getAssignedBusiness",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
//                var business = response.data || [];
                callback(null, response);
            } else {
                callback(new Error(""));
            }
        });
    },
    showTask_assigned_detail: function (data, src) {
        var id = data;
        var pane = $("#task_assigned_detail_panel");
        var type = "assigned";
        handler.business.showTaskDetail(id, pane, type, src);
    },
    task_i_followed: function () {
        session.business = session.business || {};
        handler.business.getUserFllowedBusiness({}, function (err, datas) {
            DS.getView('business/task_list_item_dev', function (view) {
                var pane = $('#task_i_followed_item_pane');
                pane.empty();
                var html = "";
                for (var i = 0; i < datas.length; i++) {
                    html += render.replaceDataByObject(datas[i], view);
                }
                html = html.replace(/_appaction/g, "business.showTask_fllowed_detail");
                pane.html(html);
            });
        });
    },
    getUserFllowedBusiness: function (data, callback) {
        var action = {
            action: "app.business.getFollowedBusiness",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
//                var business = response.data || [];
                callback(null, response);
            } else {
                callback(new Error(""));
            }
        });
    },
    showTask_fllowed_detail: function (data, src) {
        var id = data;
        var pane = $("#task_fllowed_detail_panel");
        var type = "fllowed";
        handler.business.showTaskDetail(id, pane, type, src);
    },

    my_task_finished: function () {
        session.business = session.business || {};
        handler.business.getUserFinishedBusiness({}, function (err, finishs) {
            DS.getView('business/task_list_item_dev', function (view) {
                var pane = $("#my_task_finihed_item_pane");
                pane.empty();
                var html = "";
                for (var i = 0; i < finishs.length; i++) {
                    var finishsItem = finishs[i];
                    html += render.replaceDataByObject(finishsItem, view);
                }
                html = html.replace(/_appaction/g, "business.showTask_finishs_detail");
                pane.html(html);
            });
        });
    },
    getUserFinishedBusiness: function (data, callback) {
        var action = {
            action: "app.business.getFinishedBusiness",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
//                var finishs = response.data || [];
                callback(null, response);
            } else {
                callback(new Error(""));
            }
        });
    },
    getAllBusiness: function (data, callback) {
        var action = {
//            action: "app.business.getAllBusiness",
            action: "app.business.queryBusByScope",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
//                var finishs = response.data || [];
                callback(null, response);
            } else {
                callback(new Error(""));
            }
        });
    },
    showTask_finishs_detail: function (data, src) {
        var id = data;
        var pane = $("#my_task_finished_detail_panel");
        var type = "finished";
        handler.business.showTaskDetail(id, pane, type, src);
    },
    processTaskListItem: function (src) {
        var parent = $(src).parent();
        var items = parent.find("div.contact_item");
        for (var i = 0; i < items.length; i++) {
            var itemsItem = items[i];

            if ($(itemsItem).hasClass("active")) {
                $(itemsItem).removeClass("active");
                $(itemsItem).addClass("unactive");
            }
        }
        src.removeClass("unactive");
        src.addClass("active");
    },
    getBusinessHistory: function (id, callback) {
        var action = {
            action: "app.business.getBusinessDetailById",
            data: {_id: id}
        };
        DS.send(action, function (response) {
            if (response.success) {
                var showHistory = [];
                var history = response.data.history || [];
                for (var i = 0; i < history.length; i++) {
                    var historyItem = history[i];
                    if (historyItem.action && historyItem.action == 'complete')continue;
                    var histroyMaster = historyItem.master;
                    if(historyItem.action && historyItem.action == "backIn"){
                        histroyMaster = historyItem.excuteUser;
                    }
                    var showItem = {
                        time: historyItem.time,
                        user: handler.business.getUserNameById(histroyMaster),
                        info: handler.business.getBusinessHisotryInfo(historyItem, historyItem.step, historyItem.fromStep, historyItem.excuteAction),
                        data: handler.business.getBusinessHistoryData(historyItem, response.data)
                    };
                    showItem.stepUseTime = handler.business.taskTimeAll("second",historyItem.stepProcessTime);
    showItem.stepTime    = handler.business.taskTimeAll(historyItem.ctype,historyItem.ctime);
                            showItem.setpOrTransform = historyItem.action !== "transformIn"?"停留":"步骤所用";
showHistory.push(showItem);
                }
                callback(null, showHistory);
            } else {
                callback(new Error("request data error!"));
            }
        });
    },

    getUncompleteBusiness: function (data, callback) {
        var action = {
            action: "app.business.getAllUncompleteBusiness",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
//                var finishs = response.data || [];
                callback(null, response);
            } else {
                callback(new Error(""));
            }
        });
    },
    getFinishedBusiness: function (data, callback) {
        var action = {
            action: "app.business.getAllFinishedBusiness",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
//                var finishs = response.data || [];
                callback(null, response);
            } else {
                callback(new Error(""));
            }
        });
    },

    loadTaskInfo: function (pane, menu, cid, tid, callId, fid,callback) {
        pane.empty();
        var temp = "<div class='business_transform'></div><div class='business_process'></div><div class='business_backInfo'></div>";
        //console.info("loadTaskInfo menu======"+menu)
        pane.append(temp);
        session.business.containerId=menu;//工单容器id
        if (tid) {
            var action = {
                action: "app.business.getBusinessDetailById",
                data: {_id: tid}
            };
            DS.send(action, function (response) {
                if (response.success) {
                    var currentBusiness = response.data;
                    session.business.currentBusiness = session.business.currentBusiness || {};
                    session.business.currentBusiness[menu] = currentBusiness;
                    if (handler.business.isStartStep(currentBusiness.step)) {
                        DS.getView('business/add_task_back', function (view) {
                            var html = render.replaceDataByObject(currentBusiness, view);
                            var html = html.replace(/_menu/g, menu);
                            $(pane).find(".business_transform").html(html);
                        });
                    } else {
                        DS.getView('business/task_list_transform', function (view) {
                            var html = render.replaceDataByObject(currentBusiness, view);
                            var html = html.replace(/_menu/g, menu);
                            $(pane).find(".business_transform").html(html);
                        });
                    }
                    DS.getView("business/add_business_comments", function (view) {
                        var html = render.replaceDataByObject(currentBusiness, view);
                        var html = html.replace(/_menu/g, menu);
                        $(pane).find(".business_backInfo").html(html);
                        if(typeof callback=='function'){
                            callback(response);
                        }
                    });

                    //回收倒计时
           
                } else {
                    alert("查询业务信息出错！");
                }
            });
        } else {
            handler.business.getCustomerLastBusiness({customer: cid, status: "dealing"}, function (err, business) {
                if (!err) {
                    /**
                     if (business) {
                        handler.business.loadTaskInfo(pane, menu, cid, business._id);
                    } else {
                    **/
                    DS.getView('business/add_task', function (view) {
                        var html = view.replace(/_menu/g, menu).replace(/_customer/g, cid);
                        if(callId){
                            html = html.replace(/_callId/g, callId);
                        } else {
                            html = html.replace(/_callId/g, "");
                        }
                        fid = fid || "";
                        html = html.replace(/_selectFlow/g,fid);
                        $(pane).find(".business_transform").html(html);

                        //resizeRightContent(pane.closest(".cust_tab_content"));
                        if(typeof callback=='function'){
                            callback();
                        }
                    });
                }

//                }
            });
        }
    },
    showTodoTaskDetail: function (id, src) {
        var isRead=src.attr("ds_attr");
        var ids = id.split("|");
        //session.business.menu = session.currentPage.pageId;
        //console.info("isRead====="+isRead);

        var call_right=$("#"+session.currentPage.pageId+"_business");
        if(isRead=="true"){
            handler.customer.loadCustInfo(ids[1], session.currentPage.pageId, "business", ids[0],null,function(){
                call_right.find(".func_tab.active").click();
            });
        }else{
            var action = {
                action: 'app.business.readBusiness',
                data: {_id:ids[0]}
            };
            DS.send(action,function(rep){
                if(rep.success) {
                    //handler.customer.loadCustInfo(ids[1], session.business.menu, "business", ids[0]);
                    handler.customer.loadCustInfo(ids[1], session.currentPage.pageId, "business", ids[0],null,function(){
                        call_right.find(".func_tab.active").click();
                    });
                    src.find(".bus_read").hide();
                    src.attr("ds_attr","true");
                    handler.business.refreshNoReadNum(-1);
                }else{
                    $().alertmessage('showError', errMsg);
                }
            });
        }
    },
    showTaskDetail: function (id, src) {
        var ids = id.split("|");
        //session.business.menu = session.currentPage.pageId;//reset to business
        //console.info("session.currentPage.pageId=="+session.currentPage.pageId);
        var call_right=$("#"+session.currentPage.pageId+"_business");
        handler.customer.loadCustInfo(ids[1], session.currentPage.pageId, "business", ids[0],null,function(){
            call_right.find(".func_tab.active").click();
        });
    },
    showTaskDetail_dev: function (id, pane, type, src) {
        var uid = uuid.v1();
        handler.business.processTaskListItem(src); //处理点击状态
        DS.getView('business/task_list_detail_dev', function (view) {
            pane.empty();
            pane.html(view.replace(/_uid/g, uid));
            var action = {
                action: "app.business.getBusinessDetailById",
                data: {_id: id}
            };
            DS.send(action, function (response) {
                if (response.success) {
                    var currentBusiness = response.data;
                    session.business.currentBusiness = session.business.currentBusiness || {};
                    session.business.currentBusiness[type] = currentBusiness;
                    DS.getView('business/task_list_transform', function (view) {
                        pane = $("#" + uid + "_task_list_transform_pane");
                        pane.empty();
                        var html = render.replaceDataByObject(currentBusiness, view);
                        pane.html(html.replace(/_uid/g, uid).replace(/_businessType/g, type));
                        task_list_transform();
                        DS.getView('business/task_list_history', function (view) {
                            pane = $("#" + uid + "_task_list_history_pane");
                            pane.empty();
                            var html = "";
                            var historys = currentBusiness.history || [];
                            for (var i = 0; i < historys.length; i++) {
                                var historysItem = historys[i];
                                pane.append(render.replaceDataByObject(historysItem, view));
                                handler.business.showBusinessHistoryData(historysItem, $("#" + historysItem._id));
                            }
                        });
                    });
                }
            });
        });
    },
    setTaskToMe: function (data, src) {
        var data = {
            _id: data,
            master: session.user._id
        };
        var action = {
            action: "app.business.setTaskToMe",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                dsevent.publish("taskChangeMaster", data);
                handler.business.refreshNoReadNum(1,"roleGet");
            } else {
                alert(response.message || "拣出业务异常，请稍后再试。");
                $("#reflush_business_button").click();
            }
        });

//        handler.business.changeBusinessMaster(data, function (result) {
//            if (result) {
//                    dsevent.publish("taskChangeMaster", data);
//            } else {
//                alert(result.message);
//                $("#reflush_business_button").click();
//            }
//        });
    },
    setWaitforMessage: function (data, src) {
        var action = {
            action: "app.business.setWaitforMessage",
            data: {_id: data}
        };
        DS.send(action, function (response) {
            if (response.success) {
                dsevent.publish("taskChangeWaitFor", response.data);
            } else {
                alert("网络异常，请稍后再试。");
            }
        });
    },
    getBusinessHistoryData: function (history, business,flag) {
        var data = history.excuteData || {};
        var result = {};
        for (var key in data) {
            var filedKey = key;
            if (key.substring(key.length - 2, key.length - 1) == "_") {
                filedKey = key.substring(0, key.length - 2);
            }
            var field = getCache("businessFlowField", filedKey);
            if (field) {
                if (field.type == "dropdown" || field.type == "checkbox" || field.type == "radio") {
                    var dic = handler.config.dic.getDicById(data[key]);
                    if (dic) {
                        if (result[field.name]) {
                            if (dic.name) {
                                result[field.name] += ("-->" + dic.name)
                            }

                        } else {
                            result[field.name] = dic.name;
                        }
                    } else {
                        if (result[field.name]) {
                            if (data[key + "_default"]) {
                                result[field.name] += ("-->" + data[key + "_default"]);
                            }
                        } else {
                            result[field.name] = data[key + "_default"] || "";
                        }

                    }
                }else if (field.type == "file") {
                    var attachs= data[key]||[];
                    var lis=[];
                    for (var l = 0; l < attachs.length; l++) {
                        var obj = attachs[l];
                        obj.fid=key;
                        lis.push(template("tmpl_bus_attach_show",obj));
                    }
                    var html='<ul class="thumbnails_customer" style="margin-left:5px;display: inline-block">'+lis.join("")+'</ul>';
                    result[field.name] = html;
                } else {
                    result[field.name] = data[key]||"";
                }
            } else {
                if (filedKey == 'number') {
                    if(flag=='businessFlow'){
                        result["工单编号"] = data[key];
                    }else{
                        result["工单编号"] = "<a href='#' class='ds_do_action' ds_action='business.showBusinessDetailInfo' ds_data='" + business._id + "|" + business.customer + "' >" + data[key] + "</a>";
                    }
                }
            }
        }
        if (history.action == "backIn") {
            result["退回原因"] = data.backInfo;
        } else if (history.action == "comment") {
            result["备注内容"] = data.backInfo;
        }
        return result;
    },
    showBusinessHistoryData: function (history, pane) {
        var data = history.excuteData || {};
        var tmp = "<div class='row-fluid'><span>_label</span>:<span style='margin-left: 10px;'>_value</span></div>";
        for (var key in data) {
            var field = getCache("businessFlowField", key);
            if (field) {
                pane.append(tmp.replace(/_label/g, field.name).replace(/_value/g, data[key]));
            }
        }

    },
    showBusinessDetailInfo: function (data, src) {
        $("body").append("<div id='businessDetailModel' class='modal hide fade business_modal'  tabindex='-1' role = 'dialog' aria-labelledby='myModalLabel' aria-hidden=true></div>");
        DS.getView("business/business_detail_modal", function (view) {
            var pane = $("#businessDetailModel");
            pane.empty();
            pane.html(view);
            var ids = data.split("|");
            handler.customer.loadCustInfo(ids[1], "businessModal", "business", ids[0]);
            $("#businessDetailModel").modal("show");
        });

    },
        showProcessBusinessTask: function (data, src) {
        var type = src.attr("menu");
        var business = session.business.currentBusiness[type];
        var actionId = data;
        var stepId = business.step;
        var handlerdata = {stepId: stepId, actionId: actionId, _id: business._id};
        var action = handler.business.getFlowAction(stepId, actionId);
        var nextStepId = action.jumpTo;
        var nextStep = getCache("businessFlowStep", nextStepId);
        if (nextStep.type == "sys") {//如果是系统步骤，并且没有配置界面，则直接执行。
            var step = getCache('businessFlowStep', stepId);
            action = handler.business.getFlowStepActionById(step.actions, actionId);
            var fields = action.actionFields;
            if(fields.length == 0){
                var executeData = {_id:business._id,actionId:actionId,master:"sys"};
                handler.business.excuteBusinessStepAction(executeData,src);
                return;
            }
        }

        DS.getView('business/task_list_process', function (view) {
            var pane = $(src).closest(".business_transform").next(".business_process");
            // var pane = $("#" + type + "_business").find(".business_process");
            pane.empty();
            pane.html(render.replaceDataByObject(handlerdata, view).replace(/_menu/g, type));
        });
    },
    showBackBusinessTask: function (data, src) {
        var type = data;
        var handlerdata = {_id: session.business.currentBusiness[type]._id};
        DS.getView('business/task_list_back', function (view) {
//            var pane = $("#" + type + "_business").find(".business_process");
            var pane = $(src).closest(".business_transform").next(".business_process");
            pane.empty();
            pane.html(render.replaceDataByObject(handlerdata, view).replace(/_menu/g, type));
        });
    },
    excuteBusinessBackAction: function (data, src) {
        handler.business.processBusinessData(data);
        var action = {
            action: "app.business.excuteBusinessBackAction",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                dsevent.publish("taskExcuteAction", response.data);
            } else {
                if(response.errorCode == "403"){
                    $().alertmessage('showWarning', "工单信息已经被别人改变,你无权执行此操作,请刷新!");
                } else {
                    $().alertmessage('showError', "工单处理错误!");
                }
            }
        });
    },
    excuteBusinessStepAction: function (data, src) {
        //console.dir(src)
        if(!handler.business._processAttachData(data,src)){
            $().alertmessage('showError', "附件不能为空");
            return;
        }
        handler.business.processBusinessData(data);
        var action = {
            action: "app.business.excuteBusinessStepAction",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                dsevent.publish("taskExcuteAction", response.data);
            } else {
                if(response.errorCode == "403"){
                    $().alertmessage('showWarning', "工单信息已经被别人改变,你无权执行此操作,请刷新!");
                } else {
                    $().alertmessage('showError', "工单处理错误!");
                }
            }
        });
    },
    changeBusinessMaster: function (data, callback) {
        var action = {
            action: "app.business.changeBusinessMaster",
            data: data
        };
        DS.send(action, function (response) {
            callback(response);
        });
    },

    showAddTask: function (data, src) {
        DS.getView('business/add_task', function (view) {
            var pane = $('#task_list_detail_panel');
            pane.empty();
            var uid = "uid" + uuid.v1().replace(/-/g, "_");
            pane.html(view.replace(/__uid/g, uid));
        });
    },
    addTask: function (data, src) {
        handler.business.processBusinessData(data);
        var action = {
            action: 'app.business.addBusinessTask',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                alert('添加业务成功!');
            }
        });
    },
    listenRecord : function(data,src){
        DS.getView('cdr/listenRecord', function(view){
            var panel = $('#cdr_listen_record_pane');
            panel.empty();
            panel.append(view.replace(/__RECORD_FILE/g,data));
            panel.find("#show_cdr_listen_record_Modal").css("z-index",2000);
            $('#show_cdr_listen_record_Modal').modal({'backdrop':false});
        });
    },
    saveBusiness: function (data, callback) {
        handler.business.processBusinessData(data);
        var action = {
            action: 'app.business.addBusinessTask',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                callback(null, response.data);
            } else {
                callback(new Error(),response.errorCode);
            }
        });
    },
    saveTempBusiness: function (data, callback) {
        handler.business.processBusinessData(data);
        var action = {
            action: 'app.business.addTempBusinessTask',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                callback(null, response.data);
            } else {
                callback(new Error());
            }
        });
    },
    _processAttachData:function(data,src){
        if(!src){return true;}
        var frm=src.closest("form");
        if(!frm){return true}
        var pane=frm.find(".bus_attach_upload_container");
        delete data.attachFieldId;
        delete data.attachName;
        var result=true;
        pane.each(function(){
            var item=$(this);
            var field=item.find("input[name='attachFieldId']").val();
            data[field]=[];
            item.find(".thumbnails_customer .attachitem").each(function(i){
                var files={
                    id:$(this).attr("ds_data"),
                    name:$(this).text(),
                    type:$(this).attr("suffix")
                };
                data[field].push(files);
            });

            var p=item.closest(".bus_attach");
            if(p.length>0){
                var required=p.attr("required");
                if(required &&  data[field].length<=0){
                    result=false;
                    return false;
                }
            }
        })

        return result;
    },
    doSaveBusiness: function (data, src) {
        if(!handler.business._processAttachData(data,src)){
            $().alertmessage('showError', "附件不能为空");
            return;
        }
        handler.business.saveBusiness(data, function (err, business) {
            if (!err) {
                business.menu = src.attr("menu");
                dsevent.publish("taskExcuteAction", business);
            }
        });
    },
    doSaveTempBusiness: function (data, src) {
        if(!handler.business._processAttachData(data,src)){
            $().alertmessage('showError', "附件不能为空");
            return;
        }
        handler.business.saveTempBusiness(data, function (err, business) {
            if (!err) {
                business.menu = src.attr("menu");
                dsevent.publish("taskExcuteTempAction", business);
            } else {
                alert("暂存业务单失败，请稍后再试！");
            }
        });
    },
    reSaveBusiness: function (data, src) {
        if(!handler.business._processAttachData(data,src)){
            $().alertmessage('showError', "附件不能为空");
            return;
        }
        handler.business.saveBusiness(data, function (err, business) {
            if (!err) {
                business.menu = src.attr("menu");
                dsevent.publish("taskExcuteAction", business);
            } else {
                if(business == "403"){
                    $().alertmessage('showWarning', "工单信息已经被别人改变,你无权执行此操作,请刷新!");
                } else {
                    $().alertmessage('showError', "工单处理错误!");
                }
            }
        });
    },
    processBusinessData: function (data) {
        data = data || {};
        if (data.shortCut) {
            delete data.shortCut
        }
        for (var key in data) {
            var searchKey = key;
            var dicIndex = 0;
            if (key.indexOf("_") != -1) {
                searchKey = key.split("_")[0];
                dicIndex = key.split("_")[1];
            }
            var field = getCache("businessFlowField", searchKey);
            if (field && field.dic) {
                var dic = getCache("options", field.dic);
                var options = [];
                handler.business.getAllDicOptions(dic, options);
                if (typeof data[key] == 'object') {
                    var defaultValue = [];
                    for (var m = 0; m < data[key].length; m++) {
                        var keyItem = data[key][m];
                        for (var i = 0; i < options.length; i++) {
                            var optionItem = options[i];
                            if (optionItem.key == keyItem) {
                                defaultValue.push(optionItem.name);
                                continue;
                            }
                        }
                    }
                    data[key + "_default"] = defaultValue;
                } else {
                    for (var i = 0; i < options.length; i++) {
                        var optionItem = options[i];
                        if (optionItem.key == data[key]) {
                            data[key + "_default"] = optionItem.name;
                            continue;
                        }
                    }
                }
            }
        }

    },
    getAllDicOptions: function (dic, result) {
        var options = dic.options || [];
        for (var i = 0; i < options.length; i++) {
            var optionItem = options[i];
            result.push({key: optionItem.key, name: optionItem.name});
            var nextOptions = optionItem.options || [];
            if (nextOptions.length != 0) {
                handler.business.getAllDicOptions(optionItem, result);
            }
        }
    },
    saveBusinessBackInfo: function (data, src) {
        var action = {
            action: "app.business.addBusinessBackInfo",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                $(src).closest("form").find("textarea").val("");
                DS.getView('business/new_comments_item', function (view) {
                    var title = session.user.displayName + " 添加备注 " + getCurrentDateTime();
                    $(src).closest(".comment").find(".new_business_comments").prepend(view.replace(/_title/g, title).replace(/_comment/g, data.backInfo));
                    $(src).closest(".comment").find(".add_business_comment").hide();
                    $(src).closest(".comment").find(".add_comment_button").show();
                });
            }
        });
    },
    showAddBusinessBackInfo: function (data, src) {
        $(src).closest(".comment").find(".add_business_comment").show();
        $(src).hide();
    },
    cancelBusinessBackInfo: function (data, src) {
        $(src).closest(".comment").find(".add_business_comment").hide();
        $(src).closest(".comment").find(".add_business_comment").find("textarea").val("");
        $(src).closest(".comment").find(".add_comment_button").show();
    },
    getDisplayTime: function (time) {
        return time.substring(5, 10);
    },
    getUserNameById: function (uid,maxLen) {
        if (!uid) {
            return uid;
        }
        var user = getCache("agents", uid);
        if (user) {
            if(!maxLen){
                return user.displayName;
            } else {
                if(user.displayName.length > maxLen){
                    return user.displayName.substring(0,maxLen-1)+"...";
                } else {
                    return user.displayName;
                }
            }

        }
        return uid;
    },
    getBusinessHisotryInfo: function (history, stepId, fromStep, actionId) {
        var action = history;
        if (typeof history == 'object') {
            action = history.action;
        }
        if (!action || !stepId) return "读取业务单历史信息失败！";
        var result = "";
        if (action == "create") {
            result = "创建 工单！";
        } else if (action == "transformIn") {
            var step = getCache("businessFlowStep", stepId);
            var actionName = handler.business.getBusinessStepActionName(fromStep, actionId);
            result = "执行动作【 " + actionName + "】状态变更为【" + step.name + "】";
        } else if (action == "backIn") {
            var step = getCache("businessFlowStep", stepId);
            result = "执行动作【退回工单】状态变更为【" + step.name + "】";
        } else if (action == "recreate") {
            result = "重新提交 工单！";
        } else if (action == "comment") {
            result = "添加 新的备注！"
        } else if (action == "assign") {
            var username = handler.business.getUserNameById(history.excuteData.master);
            if (username == history.excuteData.master) {
                username = "自动分配";
            }
            result = "变更 工单处理人为【" + username + "】";
        } else {
            result = "未知的动作！";
        }
        return result;
    },
    getFlowStepNameByCache: function (flowId, stepId) {
        var flow = getCache("businessFlow", flowId);
        var steps = flow.steps || [];
        for (var i = 0; i < steps.length; i++) {
            var stepsItem = steps[i];
            if (stepsItem._id == stepId) {
                return stepsItem.name;
            }
        }
        return stepId;
    },
    getFlowNameByCache: function (flowId) {
        var flows = getCache('businessFlow');
        for (var i = 0; i < flows.length; i++) {
            if (flows[i]._id == flowId) {
                return flows[i].name;
            }
        }
        return flowId;
    },
    getFlowsById: function (flows, id) {
        for (var i = 0; i < flows.length; i++) {
            if (flows[i]._id == id) {
                return flows[i];
            }
        }
        return null;
    },
    isStartStep: function (stepId) {
        var step = getCache("businessFlowStep", stepId);
        if (step.isBegin) {
            return true;
        } else {
            return false;
        }
    },
    getFlowAction: function (flowId, actionId) {
        var flow = getCache("businessFlowStep", flowId);
        var actions = flow.actions || [];
        for (var i = 0; i < actions.length; i++) {
            var actionsItem = actions[i];
            if (actionsItem._id == actionId) {
                return actionsItem;
            }
        }
    },
    getStepRoles: function (stepId) {
        var step = getCache("businessFlowStep", stepId);
        var actions = step.actions || [];
        var roles = [];
        for (var i = 0; i < actions.length; i++) {
            var actionsItem = actions[i];
            roles.push(actionsItem.actionRole);
        }
        return roles;
    },
    getRoleAgents: function (roles) {
        var agents = getCache("agents");
        var ids = [];
        var result = [];
        for (var k = 0; k < roles.length; k++) {
            var roleId = roles[k];
            for (var i = 0; i < agents.length; i++) {
                var agentsItem = agents[i];
                if (arrayContainsStr(agentsItem.role, roleId)) {
                    if (!arrayContainsStr(ids, agentsItem._id)) {
                        result.push(agentsItem);
                        ids.push(agentsItem._id);
                    }
                }
            }
        }
        return handler.business.sortAgents(result);
    },
    hasAccessForFlow: function (flow) {
        var step = flow.steps || [];
        var result = false;
        if (flow.status == "disable") {
            return result;
        }
//        for (var i = 0; i < step.length; i++) {
//            var stepItem = step[i];
        var stepItem = handler.business.getStartStep(flow);
        if (!stepItem) {
            return result;
        }
        var roles = handler.business.getStepRoles(stepItem._id);
        for (var j = 0; j < roles.length; j++) {
            var rolesItem = roles[j];
            if (arrayContainsStr(session.user.role, rolesItem)) {
                result = true;
            }
        }

//        }
        return result;
    },
    getBusinessLabelByStatus: function (status) {
        if (status == 'dealing') {
            return "label-important";
        } else {
            return "label-success";
        }
    },

    getStartStep: function (flow) {
        var steps = flow.steps || [];
        for (var i = 0; i < steps.length; i++) {
            if (steps[i].isBegin) {
                return steps[i];
            }
        }
        return null;
    },
    getFlowStepById: function (flow, id) {
        var steps = flow.steps || [];
        for (var i = 0; i < steps.length; i++) {
            if (steps[i]._id == id) {
                return steps[i];
            }
        }
        return null;
    },
    getFlowStepActionById: function (actions, id) {
        actions = actions || [];
        for (var i = 0; i < actions.length; i++) {
            var actionsItem = actions[i];
            if (actionsItem._id == id) {
                return actionsItem;
            }
        }
        return {};
    },
    getBusinessStepActionName: function (stepId, actionId) {
        var step = getCache("businessFlowStep", stepId);
        var actions = step.actions || [];
        for (var i = 0; i < actions.length; i++) {
            var actionsItem = actions[i];
            if (actionsItem._id == actionId) {
                return actionsItem.name;
            }
        }
        return actionId;
    },
    getHistoryById: function (history, id) {
        history = history || [];
        for (var i = 0; i < history.length; i++) {
            if (history[i]._id == id)
                return history[i];
        }
        return {};
    },
    createStartFlowCustomFields: function (pane, id, business) {
        if (!id) return;
        var flow = getCache('businessFlow', id);
        var step = handler.business.getStartStep(flow);
        var fields = step.stepFields || [];
        handler.business.createFlowCustomFields(fields, flow.fields, pane, business);
    },
    createStartFlowBusinessCustomFields: function (pane, id, business) {
        if (!id) return;
        var flow = getCache('businessFlow', id);
        var step = handler.business.getStartStep(flow);
        var fields = step.stepFields || [];
        handler.business.createFlowCustomFields(fields, flow.fields, pane, business);
    },
    createFlowStepCustomFields: function (flowId, stepId, pane, business) {
        if (!flowId || !stepId) return;
        var flow = getCache('businessFlow', flowId);
        var step = handler.business.getFlowStepById(flow, stepId);
        var fields = step.stepFields;
        handler.business.createFlowCustomFields(fields, flow.fields, pane, business);
    },
    createFlowStepActionCustomFields: function (pane, actionId, business) {
        if (!actionId) return;
        var flow = getCache('businessFlow', business.flow);
        var step = getCache('businessFlowStep', business.step);
        var action = handler.business.getFlowStepActionById(step.actions, actionId);
        var fields = action.actionFields;
        business.isProcessAction=true;//是否是动作操作
        handler.business.createFlowCustomFields(fields, flow.fields, pane, business);
    },
    getObjectById: function (datas, id) {
        datas = datas || [];
        for (var i = 0; i < datas.length; i++) {
            var datasItem = datas[i];
            if (datasItem._id == id) {
                return copy(datasItem);
            }
        }
        return null;
    },
    createFlowCustomFields: function (customFields, flowFields, pane, business) {
        var rowTmp = "<div class='row-fluid'></div>";
        var colTmp = "<div class='__spanClass col'></div>";
        var singleTmp = "<div class='row-fluid'><div class='field-label'><label class='control-label' for='__id' style='margin-top: 3px;text-align: right;'>__name</label></div><div class='field-option'><div class='field-option-inner'><input type='text' name='__id' value='__default' msgName='__name'  __required style='width: 94%;'></div></div></div>";
        var multiTmp = "<div class='row-fluid'><div class='field-label'><label class='control-label' for='__id' style='margin-top: 3px;text-align: right;'>__name</label></div><div class='field-option'><div class='field-option-inner'><textarea  name='__id'  __required style='width: 94%;' msgName='__name' >__default</textarea></div></div></div>";
        var dateTmp = "<div class='row-fluid'><div class='field-label'><label class='control-label' for='__id' style='margin-top: 3px;text-align: right;'>__name</label></div><div class='field-option'><div class='field-option-inner'><input size='16' class='ds_date' data-date-format='yyyy-mm-dd' style='width: 80%;' type='text' id='__id' name='__id' msgName='__name'  value='__default' readonly ></div></div>";
        var numberTmp = "<div class='row-fluid'><div class='field-label'><label class='control-label' for='__id' style='margin-top: 3px;text-align: right;'>__name</label></div><div class='field-option'><div class='field-option-inner'><input type='text' name='__id'dataType='Number2' msg='【__name】必须为数字！' msgName='__name' value='__default' __required style='width: 94%;'></div></div></div>";
        var dropdownTmp = "<div class='row-fluid'><div class='field-label'><label class='control-label' for='__id' style='margin-top: 3px;text-align: right;'>__name</label></div><div class='field-option'><div class='field-option-inner'><select name='_name' value='__default' __required msgName='__name'  style='width: 100%;'><option value=''>--请选择--</option></select></div></div>";
        var checkboxTmp = "<div class='row-fluid'><div class='field-label'><label class='control-label' for='__id' style='margin-top: 3px;text-align: right;'>__name</label></div><div class='field-option'><div class='field-option-inner'><div class='inline-checkbox'><label class='inline'><input msgName='__name'  type='checkbox' name='__id' value='__default'>1</label></div><div class='inline-checkbox'><label class='inline'><input type='checkbox' name='__id' value='__default'>2</label></div></div></div></div>";
        var radioTmp = "<div class='row-fluid'><div class='field-label'><label class='control-label' for='__id' style='margin-top: 3px;text-align: right;'>__name</label></div><div class='field-option'><div class='field-option-inner'><div class='inline-checkbox'><label class='inline'><input type='radio' msgName='__name'  name='__id' value='1'>1</label></div><div class='inline-checkbox'><label class='inline'><input type='radio' name='__id' value='2'>2</label></div></div></div></div>";
        var fileTmp = "<div class='row-fluid bus_attach' __required><div class='field-label'><label class='control-label' for='__id' style='margin-top: 3px;text-align: right;'>__name</label></div>" +
            "<div class='field-option'><div class='field-option-inner'>__fileContent</div></div></div>";

        customFields = customFields || [];
        //console.info("createFlowCustomFields======");
        //console.dir(customFields);
        //console.dir(business);
        for (var i = 0; i < customFields.length; i++) {
            var row = customFields[i];
            pane.append(rowTmp);
            var rowPane = pane.children("div.row-fluid:last");
            var colNum = row.cols.length;
            for (var j = 0; j < row.cols.length; j++) {
                var col = row.cols[j];
                rowPane.append(colTmp.replace(/__spanClass/g, "span" + 12 / colNum));
                var colPane = rowPane.children("div.col:last");
                for (var k = 0; k < col.fields.length; k++) {
                    var field = col.fields[k];
                    var cacheField = handler.business.getObjectById(flowFields, field._id);
                    //console.dir(cacheField)
//                    var cacheField = cacheFieldOri;
                    if (cacheField) {
                        var type = cacheField.type;
                        if (business){
                            cacheField["default"] = business[cacheField._id] || cacheField["default"];
                        }
                        switch (type) {
                            case 'single':
                                colPane.append(render.replaceDataByObject(cacheField, singleTmp));
                                break;
                            case 'multi':
                                colPane.append(render.replaceDataByObject(cacheField, multiTmp));
                                break;
                            case 'date':
                                cacheField.default =  cacheField.default || getCurrentDate();
                                colPane.append(render.replaceDataByObject(cacheField, dateTmp));
                                break;
                            case 'number':
                                colPane.append(render.replaceDataByObject(cacheField, numberTmp));
                                break;
                            case 'dropdown':
                                var rowContiner = $("<div class='row-fluid'></div>");
                                colPane.append(rowContiner);
                                handler.business.initCascateSelect(rowContiner, cacheField, business, dropdownTmp);
                                //  colPane.append(render.replaceDataByObject(cacheField, dropdownTmp));
                                break;
                            case 'checkbox':
                                handler.business.initDisplayCheckBox(colPane, cacheField, business, checkboxTmp);
//                                colPane.append(render.replaceDataByObject(cacheField, checkboxTmp));
                                break;
                            case 'radio':
                                handler.business.initDisplayRadio(colPane, cacheField, business, checkboxTmp);
                                // colPane.append(render.replaceDataByObject(cacheField, radioTmp));
                                break;
                            case 'file':
                                //console.dir(business[cacheField._id])
                                if(business && business[cacheField._id]){
                                    if(handler.business.isStartStep(business.step)||business.isProcessAction){//暂存可以修改
                                        var qid=uuid.v1();//考虑多个附件字段
                                        var fileContent=template("tmpl_bus_add_attach",{qiniuId:qid,_id:field._id});
                                        cacheField.fileContent=fileContent;
                                        colPane.append(render.replaceDataByObject(cacheField, fileTmp));
                                        handler.business._initQiniuUpload(qid,pane);

                                        var attachs=business[cacheField._id]||[];
                                        var list=[];
                                        for (var l = 0; l < attachs.length; l++) {
                                            var obj = attachs[l];
                                            obj.fid=field._id;
                                            list.push(template("tmpl_bus_attach_show_edit",obj));
                                        }
                                        var containerId= qid+'-business-qiniu';
                                        var p1=pane.find("#"+containerId).closest(".bus_attach_upload_container");
                                        var p1=p1.find(".thumbnails_customer");
                                        p1.html(list.join(""));
                                    }else{
                                        var attachs=business[cacheField._id]||[];
                                        var list=[];
                                        for (var l = 0; l < attachs.length; l++) {
                                            var obj = attachs[l];
                                            obj.fid=field._id;
                                            list.push(template("tmpl_bus_attach_show",obj));
                                        }
                                        var _html=list.join("");
                                        if(list.length==0){
                                            _html="<li style='margin-top: 3px;'>无</li>";
                                        }
                                        var html='<ul class="thumbnails_customer">'+_html+'</ul>';
                                        cacheField.fileContent=html;
                                        colPane.append(render.replaceDataByObject(cacheField, fileTmp));
                                    }
                                }else{
                                    var qid=uuid.v1();
                                    var fileContent=template("tmpl_bus_add_attach",{qiniuId:qid,_id:field._id});
                                    cacheField.fileContent=fileContent;
                                    colPane.append(render.replaceDataByObject(cacheField, fileTmp));
                                    handler.business._initQiniuUpload(qid,pane);
                                }
                                break;
                            default :
                                console.log('the type [' + type + '] is not support!');
                        }
                    } else {
                        alert("字段定义未找到！");
                    }

                }

            }

        }
//        $(".datetimepicker_business").datetimepicker({language: 'zh-CN', autoclose: true, todayBtn: true, startView: 2, minView: 2});
    },
    initDisplayRadio: function (colPane, field, business, tmp) {
        business = business || {};
        var dic = getCache("options", field.dic);
        var options = dic.options || [];
        console.log(options);
        var html = $(DS.renderMethodView(tmp, field));
        var checkTmp = "<div class='inline-checkbox'><label class='inline'><input type='radio' name='__id' value='__value' msgName='__fieldName' __checked __required>__name</label></div>";
        if (field.required == "yes" || field.required == 'required') {
            checkTmp = checkTmp.replace(/__required/g, "required");
        }
        var pane = html.find(".field-option-inner");
        pane.empty();
        for (var i = 0; i < options.length; i++) {
            var optionsItem = options[i];
            if (field["default"] == optionsItem.key) {
                pane.append(checkTmp.replace(/__id/g, field._id).replace(/__value/g, optionsItem.key).replace(/__name/g, optionsItem.name).replace(/__checked/g, "checked").replace(/__fieldName/g, field.name));
            } else {
                pane.append(checkTmp.replace(/__id/g, field._id).replace(/__value/g, optionsItem.key).replace(/__name/g, optionsItem.name).replace(/__fieldName/g, field.name));
            }
        }
        colPane.append(html);
    },
    initDisplayCheckBox: function (colPane, field, business, tmp) {
        business = business || {};
        var dic = getCache("options", field.dic);
        var options = dic.options || [];
        var html = $(DS.renderMethodView(tmp, field));
        var checkTmp = "<div class='inline-checkbox'><label class='inline'><input fieldgroup='1' type='checkbox' name='__id' value='__value' msgName='__fieldName' __checked  __required>__name</label></div>";
        if (field.required == "yes" || field.required == 'required') {
            checkTmp = checkTmp.replace(/__required/g, "required");
        }
        var pane = html.find(".field-option-inner");
        pane.empty();
        for (var i = 0; i < options.length; i++) {
            var optionsItem = options[i];
            if (arrayContainsStr(business[field._id], optionsItem.key)) {
                pane.append(checkTmp.replace(/__id/g, field._id + "[]").replace(/__value/g, optionsItem.key).replace(/__name/g, optionsItem.name).replace(/__checked/g, "checked").replace(/__fieldName/g, field.name));
            } else {
                pane.append(checkTmp.replace(/__id/g, field._id + "[]").replace(/__value/g, optionsItem.key).replace(/__name/g, optionsItem.name).replace(/__fieldName/g, field.name));
            }
        }
        colPane.append(html);

    },
    initCascateSelect: function (colPane, field, business, tmp) {
        business = business || {};
        var dic = getCache("options", field.dic);
        var cascateTmp = "<div class='cascade-dropdown _span' fieldId = '_fieldId' cascadeIndex = '_index'></div>";
        var optionTmp = "<option value='_value'>_name</option>";
        var options = dic.options || [];
        var selectOption = function (options, val) {
            options = options || [];
            for (var opIndex = 0; opIndex < options.length; opIndex++) {
                if (options[opIndex].key == val) {
                    return options[opIndex];
                }
            }
            return [];
        }
        for (var cascateIndex = 0; cascateIndex < dic.cascade; cascateIndex++) {
            colPane.append(cascateTmp.replace(/_span/g, "span" + 12 / dic.cascade).replace(/_fieldId/g, field._id).replace(/_index/g, cascateIndex));
            field.name = dic.headers[cascateIndex];
            var cascateDiv = colPane.find(".cascade-dropdown:last");

            var selectName = field._id;
            if (cascateIndex != 0) {
                selectName += "_" + cascateIndex;
            }

            cascateDiv.append(render.replaceDataByObject(field, tmp).replace(/_name/g, selectName));

            if (cascateIndex == 0) {
                var hasDic = false;
                if (!business[field._id]) {
                    hasDic = true;
                }
                for (var i = 0; i < options.length; i++) {
                    var optionsItem = options[i];
                    cascateDiv.find("select").append(optionTmp.replace(/_value/g, optionsItem.key).replace(/_name/g, optionsItem.name));
                    if ((business[field._id] && optionsItem.key == business[field._id])) {
                        hasDic = true;
                    }
                }
                if (hasDic) {
                    cascateDiv.find("select").val(business[field._id] || field["default"]);
                } else {
                    //cascateDiv.find("select").empty();
                    cascateDiv.find("select").append(optionTmp.replace(/_value/g, business[field._id + '_default']).replace(/_name/g, business[field._id + '_default']))
                    cascateDiv.find("select").val(business[field._id + '_default']);
                }
            } else {
                var last = cascateDiv.prev(".cascade-dropdown");
                var lastVal = last.find("select").val();
                if (lastVal) {
                    var hasDic = false;
                    if (!business[field._id + "_" + cascateIndex]) {
                        hasDic = true;
                    }
                    options = selectOption(options, lastVal).options || [];
                    for (var i = 0; i < options.length; i++) {
                        var optionsItem = options[i];
                        cascateDiv.find("select").append(optionTmp.replace(/_value/g, optionsItem.key).replace(/_name/g, optionsItem.name));
                        if (business[field._id + "_" + cascateIndex] && optionsItem.key == business[field._id + "_" + cascateIndex]) {
                            hasDic = true;
                        }

                    }
                    if (hasDic) {
                        cascateDiv.find("select").val(business[field._id + "_" + cascateIndex]);
                    } else {
                        // cascateDiv.find("select").empty();
                        cascateDiv.find("select").append(optionTmp.replace(/_value/g, business[field._id + "_" + cascateIndex + '_default']).replace(/_name/g, business[field._id + "_" + cascateIndex + '_default']))
                        cascateDiv.find("select").val(business[field._id + "_" + cascateIndex + '_default']);
                    }
                }
            }


        }


    },
    addBusienssSelectCascade: function () {
        $(".cascade-dropdown").find("select").on("change", function (event) {
            var target = $(event.target);
            var fieldId = target.parents(".cascade-dropdown").attr("fieldId");
            var casIndex = target.parents(".cascade-dropdown").attr("cascadeIndex");

            var field = getCache("businessFlowField", fieldId);
            var dic = getCache("options", field.dic);
            var casCount = dic.cascade;
            if (casIndex + 1 == casCount) {
                return;
            }

            var fun = function (options, key) {
                options = options || [];
                for (var i = 0; i < options.length; i++) {
                    var optionsItem = options[i];
                    if (optionsItem.key == key) {
                        return options[i].options;
                    }
                }
                return [];
            }

            if (casIndex == 0) {
                var options = fun(dic.options, target.val());
                var temp = "<option value='_value'>_name</option>";
                var pane = target.parents(".cascade-dropdown").next("div.cascade-dropdown").find("select");
                pane.empty();
                pane.append("<option value=''>--请选择--</option>");
                for (var i = 0; i < options.length; i++) {
                    var optionsItem = options[i];
                    pane.append(temp.replace(/_value/g, optionsItem.key).replace(/_name/g, optionsItem.name));
                }
                pane.change();
            } else if (casIndex == 1) {
                var prev = target.parents(".cascade-dropdown").prev("div.cascade-dropdown").find("select");
                var prevOtions = fun(dic.options, prev.val());
                var options = fun(prevOtions, target.val());
                var temp = "<option value='_value'>_name</option>";
                var pane = target.parents(".cascade-dropdown").next("div.cascade-dropdown").find("select");
                pane.empty();
                pane.append("<option value=''>--请选择--</option>");
                for (var i = 0; i < options.length; i++) {
                    var optionsItem = options[i];
                    pane.append(temp.replace(/_value/g, optionsItem.key).replace(/_name/g, optionsItem.name));
                }
            }


        });
    },
    //for akzj 打印工单定制
    showPrintBusinessTask : function (data) {
      var businessId = data;
        var newWin = window.open("",'print_business_order',"");
        var action = {
            action: "app.business.getBusinessInfoById",
            data: {_id:businessId}
        };
                DS.send(action,function(response){
            if(response.success){
                var responseData = response.data
                var business  = responseData.business;
                var customer = responseData.customer;
                var data = {
                    accountName : customer.name,
                    date : DS.getCurrentDate(),
                    addr : customer.address,
                    name : business["d70463c0-1181-11e4-b0fa-e98514da3891_default"] || "",
                    standard : business["d4017d80-2689-11e4-82d5-0dd7cdab3919_default"] || "",
                    number : business["a686c120-1181-11e4-b0fa-e98514da3891"] || "",
                    fare : business["af9d6a20-1181-11e4-9b36-c1001633706d"] || "",
                    backinfo : business["c0457bb0-1181-11e4-b8b0-891b0d3296aa"] || "",
                    agent : getCache("agents",business.createUser).displayName || ""
                };

                DS.getView("business/print_task",function(view){
                    view = DS.renderView(view,data);
                    view = view.replace("__date", DS.getCurrentDate());
                    newWin.document.write(view);
                    newWin.document.location.reload();
                    newWin.print();
                });
            } else {
                $().alertmessage('warning', "获取数据失败！");
            }
        });
    },
    jiuxianShortCutBusiness: function (pane) {
        var accountId = "N000000001724";
        var fieldId = "61cb38b0-2ff8-11e3-9358-cff5b0caecbd";
//        var accountId = "N000000001574";
//        var fieldId = "b6c31940-323d-11e3-a97f-89a82e500459";

        if (session.user.account == accountId) {
            var selector = "div[fieldid='" + fieldId + "']";
            var fieldPane = pane.find(selector).closest(".row-fluid");
            var html = "<div class='row-fluid'><div class='field-label'><label class='control-label' style='margin-top: 3px;text-align: right;'>快捷工单</label></div><div class='field-option'><div class='field-option-inner'></div></div></div>";
            var itemHtml = "<div class='inline-checkbox'><label class='inline'><input type='radio' name='shortCut' value='_value'>_name</label></div>";
            var shortCutPane = $(html);
            shortCutPane.find(".field-option-inner").append(itemHtml.replace(/_value/g, "1").replace(/_name/g, "发货信息"));
            shortCutPane.find(".field-option-inner").append(itemHtml.replace(/_value/g, "2").replace(/_name/g, "退换货办理进度"));
            shortCutPane.find(".field-option-inner").append(itemHtml.replace(/_value/g, "3").replace(/_name/g, "退款时间"));
            shortCutPane.find(".field-option-inner").append(itemHtml.replace(/_value/g, "4").replace(/_name/g, "发货延迟"));
            shortCutPane.find(".field-option-inner").append(itemHtml.replace(/_value/g, "5").replace(/_name/g, "活动规则"));
            shortCutPane.insertAfter(fieldPane);

            var shortCutConfig = {
                "1": ['ea080fe0-2fe5-11e3-80f9-c9f68aa75264', '8a0d2e31-2fe6-11e3-80f9-c9f68aa75264', '8a0d5541-2fe6-11e3-80f9-c9f68aa75264'],
                "2": ['ea080fe0-2fe5-11e3-80f9-c9f68aa75264', '8a0d2e31-2fe6-11e3-80f9-c9f68aa75264', '8a0d5542-2fe6-11e3-80f9-c9f68aa75264'],
                "3": ['ea080fe0-2fe5-11e3-80f9-c9f68aa75264', '8a0d5543-2fe6-11e3-80f9-c9f68aa75264', '8a0d5544-2fe6-11e3-80f9-c9f68aa75264'],
                "4": ['4da27490-2fe7-11e3-80f9-c9f68aa75264', '4da2749b-2fe7-11e3-80f9-c9f68aa75264', 'ac806593-356d-11e3-9fc5-55d1c26e1abe'],
                "5": ['ceaaf980-2fe3-11e3-99a6-976795dee106', 'b58f7f60-356b-11e3-9fc5-55d1c26e1abe', 'b58fa670-356b-11e3-9fc5-55d1c26e1abe']
            };

            shortCutPane.find("input[type='radio']").bind("change", function () {
                var selects = fieldPane.find("select");
                var config = shortCutConfig[$(this).val()];
                $(selects[0]).val(config[0]);
                $(selects[0]).change();
                $(selects[1]).val(config[1]);
                $(selects[1]).change();
                $(selects[2]).val(config[2]);
            });

        }
    },
    sortAgents: function (agents) {
        agents = agents || [];
        agents.sort(function (a, b) {
            if (a.pinyin && b.pinyin) {
                if (a.pinyin > b.pinyin) {
                    return 1;
                } else if (a.pinyin == b.pinyin) {
                    return 0;
                } else {
                    return -1;
                }
            } else {
                if (a.displayName > b.displayName) {
                    return 1;
                } else if (a.displayName == b.displayName) {
                    return 0;
                } else {
                    return -1;
                }
            }
        });
//            console.dir(agents)
        return agents;
    },

    busAssignEvtHandler : function(event){
        var data = $.evalJSON(event.Data);
        var msg="有新的待办业务，请您及时处理！";
        //$().alertmessage('showNotify', msg);
        $().alertmessage('showUniqueNotify', msg,"busAssignEvt");
        handler.business.refreshUndealNum();
    },
    busAssignRoleEvtHandler : function(event){
        var data = $.evalJSON(event.Data);
        var msg="有新的待领取业务，请您及时处理！";
        $().alertmessage('showUniqueNotify', msg,"busRoeEvt");
        handler.business.refreshUndealNum();
    },

    initUndealNum:function(isInit,num1,num2){
        var pane=$('#main-panel').find(".navbar_top");
        if(isInit){
            var action = {
                action: 'app.business.refreshUndealNum',
                data: {}
            };
            DS.send(action, function (rep) {
                if (rep.success) {
                    var total=rep.total;
                    //var noReadNum=rep.noReadNum;
                    var roleNum=rep.roleNum;
                    if(total>0||roleNum>0){
                        pane.find(".navbar_item>.nav_business").html('<span class="task_pop_tip"></span>');
                    }
                } else {
                    $().alertmessage('showError', errMsg);
                }
            });
        }else{
            if(num1>0||num2>0){
                pane.find(".navbar_item>.nav_business").html('<span class="task_pop_tip"></span>');
            }else{
                pane.find(".navbar_item>.nav_business").html('');
            }
        }
    },
    delBusAttach:function(fileId,src){
        if(!confirm("确认删除此附件吗？"))return;
        var body=src.closest("form");
        var thumb=src.closest("li");
        var cid=session.business.containerId;
        var busId="";
        if(session.business.currentBusiness){
            var bus=session.business.currentBusiness[cid];
            if(bus){
                busId=bus._id;
            }
        }
        var pane=src.closest(".bus_attach_upload_container");
        var field=pane.find("input[name='attachFieldId']").val();
        var action={
            action:"app.business.delBusAttach",
            data:{_id:busId,field:field,fileId:fileId}
        } ;
        //console.dir(action)
        DS.send(action,function(rep){
            if(rep.success){
                thumb.remove();
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    _initQiniuUpload:function(cid,pane){
        //console.dir(pane)
        var containerId= cid+'-business-qiniu';
        var progressId= cid+'-fsUploadProgress';
        pane=pane.find("#"+containerId).closest(".bus_attach_upload_container");
        var uploader = Qiniu.uploader({
            runtimes: 'html5,flash,html4',
            browse_button: cid+'-pickCustomerFiles',
            multi_selection:true,
            container:containerId,
            drop_element: containerId,
            max_file_size: '10mb',
            flash_swf_url: '/javascripts/qiniu/plupload/Moxie.swf',
            dragdrop: true,
            chunk_size: '4mb',
            uptoken_url: '/action?action=app.weixin.getUptoken&data={}&sessionId=' + session.id,
            domain: qiniu7moorDomain,
            unique_names: false,
            save_key: false,
            auto_start: true,
            init: {
                'FilesAdded': function(up, files) {
                    pane.find(".business_attach_progress").show();
                    plupload.each(files, function(file) {
                        var progress = new FileProgress(file, progressId,"business");
                        progress.setStatus("等待...");
                    });

                },
                'BeforeUpload': function(up, file) {
                    var progress = new FileProgress(file, progressId,"business");
                    var chunk_size = plupload.parseSize(this.getOption('chunk_size'));
                    if (up.runtime === 'html5' && chunk_size) {
                        progress.setChunkProgess(chunk_size);
                    }
                },
                'UploadProgress': function(up, file) {
                    var progress = new FileProgress(file, progressId,"business");
                    var chunk_size = plupload.parseSize(this.getOption('chunk_size'));
                    progress.setProgress(file.percent + "%", up.total.bytesPerSec, chunk_size);
                },
                'UploadComplete': function(evt,info) {
                    $().alertmessage('showSuccess', "文件上传成功");
                    //console.info("UploadComplete=========");
                    //pane.find("#business_files").hide(3000);
                    //console.dir(evt);
                    pane.find(".business_attach_progress").hide();
                    window.setTimeout(function(){
                        pane.find(".business_attach_progress").find("tbody").empty();
                    },500)
                },
                'FileUploaded': function(up, file, info) {
                    var progress = new FileProgress(file, progressId,"business");
                    var trueName = file.name;
                    up.trueName = trueName;
                    //console.info("FileUploaded=========");
                    //console.dir(up)
                    //console.dir(file)
                    //console.dir(info)
                    progress.setComplete(up, info,"business");
                    var res = $.parseJSON(info);
                    var fileName = res.key;
                    var trueName = up.trueName;
                    var data={fileId:fileName,trueName:trueName,suffix:'other'};
                    var ul=pane.find(".thumbnails_customer");
                    var imgTypes=["jpg","jpeg",'gif','png',"bmp"];
                    var suffix=trueName.substring(trueName.lastIndexOf(".")+1);
                    suffix=suffix.toLowerCase();
                    if($.inArray(suffix,imgTypes)!=-1){
                        data.suffix='img';
                    };
                    var _view=template("tmpl_bus_attach",data);
                    ul.append(_view);
                },
                'Error': function(up, err, errTip) {
                    //console.info("Error=========");
                    pane.find(".business_attach_progress").show();
                    var progress = new FileProgress(err.file, progressId);
                    progress.setError();
                    progress.setStatus(errTip);
                },
                'Key': function(up, file) {
                    var date=getCurrentDate();
                    var today = new Date();
                    var time=today.getTime();
                    var key = session.user.account+"/business/"+date+"/"+time+"/"+uuid.v1();
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
    }

}
