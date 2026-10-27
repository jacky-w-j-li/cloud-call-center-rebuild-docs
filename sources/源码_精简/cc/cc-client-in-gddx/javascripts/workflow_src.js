/**
 * create by zhangyang@7moor.com
 * 7moor workflow system
 * 2014-10-19
 */
handler.business = {
    cid: '#view_nav_business',
    menuId: 'business',
    curSubMenu: '',
    flows: [],
    steps: [],
    task_main: function (menu) {
        handler.business.refreshUndealNum();
        if(handler.business.businessId){
            if(handler.business.master){
                        $("#contact_list_business").find(".btn_my_todo").click();
                    }else{
                       $("#contact_list_business").find(".btn_my_role").click();
                    }
                }else{
                    if (handler.workbench.toShowBusMyTodo) {
                        $(handler.business.cid).find(".btn_my_todo").click();
                        handler.workbench.toShowBusMyTodo = false;
                    } else {
                        $(handler.business.cid).find(".btn_my_role").click();
                    }
                }
    },
    gotoBusinessMenu: function(parms){
            var p =  $("#nav_business");
            p.click();
            handler.business.master = parms.master;
            handler.business.number = parms.number;
            handler.business.businessId = parms.businessId;
            if(handler.business.master){
                        $("#contact_list_business").find(".btn_my_todo").click();
                    }else{
                       $("#contact_list_business").find(".btn_my_role").click();
                    }
    },
    quick_subMenu_search: function (data, src) {
        var searchPane = src.closest(".list_check_pane");
        var adSearchPane = $("#task_list_search_querynav_business");
        searchPane.find(".model_submenu button").removeClass("active");
        src.addClass("active");
        searchPane.find("#business_list_query_form").find("input[name='submenu']").val(data);
        searchPane.find("#business_list_advanced_form").find("input[name='submenu']").val(data);

        if(handler.business.number){
            adSearchPane.find("input[name='number']").val(handler.business.number);
            adSearchPane.find(".btn_advanced").click();

            handler.business.number="";
            handler.business.master = "";
             handler.business.businessId = "";
            return;
            //handler.business.businessId = '';
        }
        handler.business.curSubMenu = data;
        handler.business.refreshUndealNum();
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
    quick_flow_search: function (data, src) {
        var searchPane = src.closest(".list_check_pane");
        searchPane.find(".quick_wrap_bus .quick_menu a").removeClass("quick_card_active");
        src.addClass("quick_card_active");
        searchPane.find(".quick_wrap_bus .quick_desc").text(src.text());
        if (handler.business.curSubMenu == 'my_role_task_uncomplete') {
            searchPane.find("#business_list_query_form").find("input[name='flow']").val(data);
        } else {
            searchPane.find("#business_list_query_form").find("input[name='submenu2']").val(data);
        }
        var menuRight = searchPane.find(".quick_card");
        var _wr = menuRight.outerWidth(true);
        var btn = searchPane.find('.bus_normal_search');
        btn.click();
    },
    refreshTotalNum:function(stepBack){
        var listPane = $('#contact_list_business');
        var listFooter = listPane.find(".list-footer").find(".result_count");
        var isAdvanceSearch = listPane.find(".ds_search_filter").find("span").length;//高级搜索默认
        var isQuick_desc = (listPane.find(".quick_desc").text()=="全部") ? true : false;//快捷搜索默认
        var isDefault = (listPane.find("input[name=query]").val()=="") ? true : false;//常规搜索默认
        // var isBack = stepBack ? stepBack : false;//暂时不加退回判断
        var total = parseInt(listFooter.text());
        if (isQuick_desc && isDefault && !isAdvanceSearch){//所有搜索都是默认状态
            if (total <= 10) {
                handler.business.refreshUndealNum();
                listFooter.text(( (total-1)>0 ? (total-1) : 0 ));
            } else{
                $("#business_list_query_form .bus_normal_search").click();
                handler.business.refreshUndealNum();
            }
            return;
        }else{
            if (isAdvanceSearch) {
                $("#business_list_advanced_form .btn_advanced").click();
            }else{
                $("#business_list_query_form .bus_normal_search").click();
                handler.business.refreshUndealNum();
            }
        }
    },
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
                    var txt = noReadNum + "/" + total;
                    var moveLeft=0;
                    listPane.find(".model_submenu").find('.btn_my_todo').find(".badge").attr("ds_num",txt);
                    noReadNum = noReadNum>99?"99+":noReadNum;
                    moveLeft=total>99?"-7px":"0";
                    total = total>99?"99+":total;
                    txt = noReadNum + "/" + total;
                    listPane.find(".model_submenu").find('.btn_my_todo').find(".badge").text(txt).css("margin-left",moveLeft);
                }else{
                    listPane.find(".model_submenu").find('.btn_my_todo').find(".badge").text("");
                }
                if(roleNum>0){
                    listPane.find(".model_submenu").find('.btn_my_role').find(".badge").attr("ds_num",roleNum);
                    roleNum = roleNum>99?"99+":roleNum;
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
    refreshNoReadNum: function (num, flag) {
        var listPane = $('#contact_list_business');
        var content = $.trim(listPane.find(".model_submenu").find('.btn_my_todo').find(".badge").attr("ds_num"));
        var total = 0;
        var noReadNum = 0;
        if (content) {
            var ary = content.split("/");
            total = parseInt(ary[1], 10);
            noReadNum = parseInt(ary[0], 10) + num;
        }
        if (noReadNum < 0) {
            noReadNum = 0;
        }
        if (flag == 'roleGet') {
            total += num;
            var roleNum = $.trim(listPane.find(".model_submenu").find('.btn_my_role').find(".badge").attr("ds_num")) || 0;
            roleNum = parseInt(roleNum, 10) - num;
            if (roleNum > 0) {
                 listPane.find(".model_submenu").find('.btn_my_role').find(".badge").attr("ds_num",roleNum);
                roleNum = roleNum>99?"99+":roleNum;
                listPane.find(".model_submenu").find('.btn_my_role').find(".badge").text(roleNum);
            } else {
                listPane.find(".model_submenu").find('.btn_my_role').find(".badge").text("");
            }
        }
        if (total > 0) {
            var txt = noReadNum + "/" + total;
            listPane.find(".model_submenu").find('.btn_my_todo').find(".badge").attr("ds_num",txt);
            noReadNum = noReadNum>99?"99+":noReadNum;
            total = total>99?"99+":total;
            txt = noReadNum + "/" + total;
            listPane.find(".model_submenu").find('.btn_my_todo').find(".badge").text(txt);
        } else {
            listPane.find(".model_submenu").find('.btn_my_todo').find(".badge").text("");
        }
    },
    task_list: function (id, query) {
        query = query || {};
        var isAdvanceSearch = query.isAdvanceSearch;
        delete  query.isAdvanceSearch;
        session.business = session.business || {};
        session.business.menu = id;
        session.business.subMenu = id;
        session.business.isAdvanceSearch = isAdvanceSearch;
        delete query.submenu;
        var _menu = id;
        if (query.submenu2) {
            _menu = query.submenu2;
        }
        delete query.submenu2;
        session.business.subMenu = _menu;
        var listPane = $('#contact_list_business');
        var pane = listPane.find(".list-inside");
        pane.empty();
        var frmId = "business_list_query_form";
        if (isAdvanceSearch == "1") {
            frmId = "business_list_advanced_form";
        }

        DS.getView('business/task_list_item_dev', function (view) {
            switch (_menu) {
                case "my_task_uncomplete" :
                    handler.business.getUserUncompleteBusiness(query, function (err, data) {
                        handler.business.processDisplayTaskList(pane, data, view, query, "todo");
                        DS.showSearchTips($("#" + frmId));
                    });
                    break;
                case "my_role_task_uncomplete":
                    handler.business.getUserRoleUncompleteBusiness(query, function (err, data) {
                        handler.business.processDisplayTaskList(pane, data, view, query);
                        session.business.flushTime = data.businessTime;
                        DS.showSearchTips($("#" + frmId));
                        pane.find(".list_item .master").hide();
                        pane.find(".list_item .role_get").show();
                    });
                    break;
                case "my_task_created":
                    handler.business.getUserAssignedBusienss(query, function (err, data) {
                        handler.business.processDisplayTaskList(pane, data, view, query);
                        DS.showSearchTips($("#" + frmId));
                    });
                    break;
                case "my_task_followed":
                    $("#business_dropdown_button_" + id).hide();
                    handler.business.getUserFllowedBusiness(query, function (err, data) {
                        handler.business.processDisplayTaskList(pane, data, view, query);
                        DS.showSearchTips($("#" + frmId));
                    });
                    break;
                case "business":
                    handler.business.getAllBusiness(query, function (err, data) {
                        handler.business.processDisplayTaskList(pane, data, view, query);
                        DS.showSearchTips($("#" + frmId));
                    });
                    break;
                case "task_uncomplete":
                    handler.business.getUncompleteBusiness(query, function (err, data) {
                        handler.business.processDisplayTaskList(pane, data, view, query);
                        DS.showSearchTips($("#" + frmId));
                    });
                    break;
                case "task_finished":
                    handler.business.getFinishedBusiness(query, function (err, data) {
                        handler.business.processDisplayTaskList(pane, data, view, query);
                        DS.showSearchTips($("#" + frmId));
                    });
                    break;
                default :
                    break;
            }
        });
    },
    getCustomerLastBusiness: function (cid, callback) {
        if (!cid) {
            callback(new Error("the cid is null!"));
            return;
        }
        var data = {customer: cid};
        if (typeof cid == 'object') {
            data = cid
        }

        var action = {
            action: "app.business.getCustomerLastBusiness",
            data: data
        };
        DS.send(action, function (res) {
            if (res.success) {
                var bus = res.data;
                if (bus) {
                    bus.lastUpdateUser = getCache("agents", bus.lastUpdateUser).name;
                    bus.createUser = getCache("agents", bus.createUser).name;
                    bus.flowId = bus.flow;
                    bus.stepId = bus.step;
                    bus.step = getCache("businessFlowStep", bus.step).name;
                    bus.flow = getCache("businessFlow", bus.flow).name;
                }
                callback(null, bus);
            } else {
                callback(new Error(""));
            }
        });
    },
    processListLimit: function (menu) {
        var pane = $("#contact_list_" + menu);
        if (menu.substring(0, 2) == 'my') {
            if (!isHasFunc("func_my_task_export")) {
                var _obj = pane.find(".func_hide");
                if (_obj) {
                    _obj.remove();
                }
            } else {
                pane.find(".func_hide").show();
            }
        } else {
            if (!isHasFunc("func_task_export")) {
                var _obj = pane.find(".func_hide");
                if (_obj) {
                    _obj.remove();
                }
            } else {
                pane.find(".func_hide").show();
            }
        }
    },
    getBusinessHistory: function (id, cb) {
        var actStr = "app.business.getBusinessDetailById";
        var action = {action: actStr, data: {_id: id}};
        DS.send(action, function (res) {
            if (res.success) {
                var showHistory = [];
                var history = res.data.history || [];
                for (var i = 0; i < history.length; i++) {
                    var historyItem = history[i];
                    if (historyItem.action && historyItem.action == 'complete')continue;
                    var histroyMaster = historyItem.master;
                    if (historyItem.action && historyItem.action == "backIn") {
                        histroyMaster = historyItem.excuteUser;
                    }
                    var showItem = {
                        time: historyItem.time,
                        user: handler.business.getUserNameById(histroyMaster),
                        info: handler.business.getBusinessHisotryInfo(historyItem, historyItem.step, historyItem.fromStep, historyItem.excuteAction),
                        data: handler.business.getBusinessHistoryData(historyItem, res.data)
                    };

                    var UStep = historyItem.stepProcessTime?handler.business.getTimeByMs("second",historyItem.stepProcessTime):-1;
                    var step = historyItem.ctype&&historyItem.ctime?handler.business.getTimeByMs(historyItem.ctype,historyItem.ctime):-1;
                    showItem.color=UStep>step&&step!==-1?"red":"#666";
                    showItem.stepUseTime = historyItem.stepProcessTime?handler.business.taskTimeAll("second",historyItem.stepProcessTime):-1;
                    showItem.stepTime = historyItem.ctype&&historyItem.ctime?handler.business.taskTimeAll(historyItem.ctype,historyItem.ctime):-1;
                    showItem.setpOrTransform = historyItem.action !== "transformIn"?"停留":"步骤所用";
                    showHistory.push(showItem);
                }
                cb(null, showHistory);
            } else {
                cb(new Error("request data error!"));
            }
        });
    },
    queryHighBusiness: function (data, src) {
        var menu = data.submenu || "business";
        handler.business.task_list(menu, data);
        src.closest(".advanced_search_pane").addClass("hidden");
        handler.business.refreshUndealNum();
    },
    resetQueryHighBusiness: function (data, src) {
        var menu = session.currentPage.pageId;
        handler.resetForm(data,src);
        $("#task_list_search_query" + menu).find(".business_type").val("").change();
        $("#task_list_search_query" + menu).find(".query_field").val("");
        $("#task_list_search_query" + menu).find(".search_input_dd").removeClass("active");
    },
    task_i_followed: function () {
        session.business = session.business || {};
        handler.business.getUserFllowedBusiness({}, function (err, datas) {
            DS.getView('business/task_list_item_dev', function (view) {
                var p = $('#task_i_followed_item_pane');
                p.empty();
                var html = "";
                for (var i = 0; i < datas.length; i++) {
                    html += render.replaceDataByObject(datas[i], view);
                }
                html = html.replace(/_appaction/g, "business.showTask_fllowed_detail");
                p.html(html);
            });
        });
    },
    queryBusinessList: function (data, src) {
        data.page = src.val() || 1;
        data.limit = 10;
        var menu = data.submenu;
        if (menu != 'my_role_task_uncomplete' && !data.submenu2) {
            data.submenu2 = session.business.subMenu;
        }
        handler.business.task_list(menu, data);
    },
    _checkCondition: function (data) {
        var query = data;
        var leftPane = $('#contact_list_business');
        var toolbarPane = $("#pane_deal_list");
        var checkPane = leftPane.find(".list_check_all");
        var num = toolbarPane.find(".bottom_toolbar_selsize_num").text();
        num = parseInt(num, 10) || 0;
        if (num <= 0) {
            $().alertmessage('showError', "请至少选择一条进行操作！");
            return false;
        }
        var isAll = checkPane.hasClass("select_on") ? "1" : "0";
        if (isAll != "1") {
            var ids = [];
            leftPane.find(".list_item_check.select_on").each(function (i) {
                var bid = $(this).find("input[name='busId']").val();
                ids.push(bid);
            });
            var _q = null;
            if (ids.length > 0) {
                _q = {_id: {$in: ids}};
            } else {
                _q = {_id: "NA"};
            }
            if (query && query.flow) {
                _q.flow = query.flow;
            }
            query = _q;
        }
        return query;
    },
    exportBusiness: function (data, src) {
        var menu = session.business.menu;
        var data = session.business.query[menu] || {};
        var step  = data.step;
//        data.query = $("#business_list_query_form").find("input[name='query']").val();
        var check = handler.business._checkCondition(data);
        if (!check) {
            return;
        } else {
            data = check;
            if(step){
                data.step = step;
            }
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
        },null,null,null,60000);
    },
    deleteBusiness: function (data, src) {
        var menu = session.business.menu;
        var data = session.business.query[menu] || {};

        var check = handler.business._checkCondition(data);
        if (!check) {
            return;
        } else {
            data = check;
        }
        var action = {
            action: "app.business.getBusinessCount",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var count = response.count || 0;
                DS.getView("business/business_delete_info", function (view) {
                    var render = template.compile(view);
                    var panel = $('#modal_panel');
                    panel.html(render({deleteCount: count}));
                    $('#delete_business_info_Modal').modal({'backdrop': 'static'})
                });
            } else {
                $().alertmessage('showError', "统计数据异常，无法删除数据。");
            }
        });

    },
    confirmBusinessDelete: function (data, src) {
        var menu = session.business.menu;
        var data = session.business.query[menu] || {};
//        data.query = $("#business_list_query_form_" + menu).find("input[name='query']").val();
        var check = handler.business._checkCondition(data);
        if (!check) {
            return;
        } else {
            data = check;
        }

        var action = {
            action: "app.business.deleteBusiness",
            data: data
        }
        DS.send(action, function (response) {
            if (response.success) {
                $().alertmessage('showSuccess', "数据已删除");
                var reSrc = $('#contact_list_business').find(".refresh_num");
                handler.business.refreshUndealNum("",reSrc);
                if (data._id) {
                    delete data._id;
                }
                data.submenu = menu;
                data.isAdvanceSearch = session.business.isAdvanceSearch;
                //session.business.query[menu] = data;
                handler.business.queryBusinessList(data, src);
                handler.business.colseBusinessDelete(data, src);
                handler.cancelDealToolbar("business");
            } else {
                $().alertmessage('showError', "数据删除异常！");
            }
        });
    },
    colseBusinessDelete: function (data, src) {
        $('#delete_business_info_Modal').modal('hide');
    },
    processDisplayTaskList: function (pane, data, view, querydata, type) {
        var html = "";
        var readHtml = '<img src="/img/client/read.png" style="width: 10px;"/>';
        var list = data.list || [];
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            var _t = handler.formatShortTime(item.lastUpdateTime);
            item.shortTime = _t.name;
            item.readImg = "";
            if (type == "todo" && !item.isRead) {
                item.readImg = readHtml;
            }
            if (!item.name) {
                item.name = '<span style="text-decoration:line-through;color:red;">已删除客户</span>';
            }
            html += render.replaceDataByObject(item, view);
        }
        if (list.length === 0) {
            html = '<div class="alert">没有记录!</div>';
        }
        pane.html(html);

        if (type == "todo") {
            pane.find(".item_row").attr("ds_action", "business.showTodoTaskDetail");
        }
        var count = data.count;
        $(pane).closest(".left_column").find(".pagination").find(".result_count").text(count);
        var list = $(pane).closest(".left_column").find(".pagination").find("li");
        updatePagination(list, count, querydata.limit || 10, querydata.page || 1);
        var menu = handler.business.menuId;
        $(".business_detail_div_" + menu).empty();
        session.business.query = session.business.query || {};
        session.business.query[session.business.menu] = data.condition;
        var busId = pane.find(".item_row input[name=busId]");
        for(var i=0;i<busId.length;i++){
            if($("#view_nav_business .business_tab").attr("ds_busid") == busId.eq(i).val()){
                busId.eq(i).closest('.item_row').addClass('expanded');
                return
            }
        }
    },

    queryBusinessListByPage: function (data, src) {
        var isAdvanceSearch = session.business.isAdvanceSearch;
        var frmId = "business_list_query_form";
        if (isAdvanceSearch == "1") {
            frmId = "business_list_advanced_form";
        }
        data = getDataOfForm($("#" + frmId));
        if (data.succeed) {
            data = data.data;
        }
        data.page = src.val() || 1;
        data.limit = 10;
        handler.business.task_list(session.business.menu, data);
    },
    my_task_uncomplete: function () {
        session.business = session.business || {};
        handler.business.getUserUncompleteBusiness({}, function (err, unDeals) {
            DS.getView('business/task_list_item_dev', function (view) {
                var p = $('#talk_list_item_pane');
                p.empty();
                var html = "";
                for (var i = 0; i < unDeals.length; i++) {
                    html += render.replaceDataByObject(unDeals[i], view);
                }
                html = html.replace(/_appaction/g, "business.showTask_uncomplete_detail");
                p.html(html);
            });
        });
    },

    getUserRoleUncompleteBusiness: function (data, cb) {
        var actStr = 'app.business.getRoleUnDealBusiness';
        var action = {
            action: actStr,
            data: data
        };
        DS.send(action, function (res) {
            if (res.success) {
                cb(null, res);
            } else {
                cb(new Error(""));
            }
        });
    },
    showTask_uncomplete_detail: function (id, srcOjb) {
        var p = $("#task_list_detail_panel");
        var type = "uncomplete";
        handler.business.showTaskDetail(id, p, type, srcOjb);
    },
    getUserFinishedBusiness: function (data, cb) {
        var actStr = "app.business.getFinishedBusiness";
        var action = {action: actStr, data: data};
        DS.send(action, function (res) {
            if (res.success) {
                cb(null, res);
            } else {
                cb(new Error(""));
            }
        });
    },
    m7_showTask_assigned_detail: function (id, srcObj) {
        var p = $("#task_assigned_detail_panel");
        var type = "assigned";
        handler.business.showTaskDetail(id, p, type, srcObj);
    },
    getUserUncompleteBusiness: function (data, cb) {
        var actStr = 'app.business.getUnDealBusiness';
        var act = {
            action: actStr,
            data: data
        };
        DS.send(act, function (res) {
            if (res.success) {
                cb(null, res);
            } else {
                cb(new Error(""));
            }
        });
    },

    getUserAssignedBusienss: function (data, cb) {
        var actStr = "app.business.getAssignedBusiness";
        var action = {action: actStr, data: data};
        DS.send(action, function (res) {
            if (res.success) {
                cb(null, res);
            } else {
                cb(new Error(""));
            }
        });
    },
    processTaskListItem: function (srcObj) {
        var pt = $(srcObj).parent();
        var items = pt.find("div.contact_item");
        for (var i = 0; i < items.length; i++) {
            var itemsItem = items[i];

            if ($(itemsItem).hasClass("active")) {
                $(itemsItem).removeClass("active");
                $(itemsItem).addClass("unactive");
            }
        }
        srcObj.removeClass("unactive");
        srcObj.addClass("active");
    },
    getUserFllowedBusiness: function (data, cb) {
        var actStr = "app.business.getFollowedBusiness";
        var action = {action: actStr, data: data};
        DS.send(action, function (res) {
            if (res.success) {
                cb(null, res);
            } else {
                cb(new Error(""));
            }
        });
    },
    showTask_fllowed_detail: function (id, srcOjb) {
        var p = $("#task_fllowed_detail_panel");
        var type = "fllowed";
        handler.business.showTaskDetail(id, p, type, srcOjb);
    },
    showTask_finishs_detail: function (id, srcObj) {
        var p = $("#my_task_finished_detail_panel");
        var type = "finished";
        handler.business.showTaskDetail(id, p, type, srcObj);
    },
    my_task_finished: function () {
        var s = session;
        s.business = s.business || {};
        handler.business.getUserFinishedBusiness({}, function (err, finishs) {
            DS.getView('business/task_list_item_dev', function (view) {
                var p = $("#my_task_finihed_item_pane");
                p.empty();
                var html = "";
                for (var i = 0; i < finishs.length; i++) {
                    var finishsItem = finishs[i];
                    html += render.replaceDataByObject(finishsItem, view);
                }
                html = html.replace(/_appaction/g, "business.showTask_finishs_detail");
                p.html(html);
            });
        });
    },

    getAllBusiness: function (data, cb) {
        var actStr = "app.business.queryBusByScope";
        var action = {action: actStr, data: data};
        DS.send(action, function (res) {
            if (res.success) {
                cb(null, res);
            } else {
                cb(new Error(""));
            }
        });
    },


    getUncompleteBusiness: function (data, cb) {
        var actStr = "app.business.getAllUncompleteBusiness";
        var action = {action: actStr, data: data};
        DS.send(action, function (res) {
            if (res.success) {
                cb(null, res);
            } else {
                cb(new Error(""));
            }
        });
    },
    getFinishedBusiness: function (data, cb) {
        var actStr = "app.business.getAllFinishedBusiness";
        var action = {
            action: actStr,
            data: data
        };
        DS.send(action, function (res) {
            if (res.success) {
                cb(null, res);
            } else {
                cb(new Error(""));
            }
        });
    },
    showTodoTaskDetail: function (id, src) {
        var isRead = src.attr("ds_attr");
        var ids = id.split("|");

        var call_right = $("#" + session.currentPage.pageId + "_business");
        if (isRead == "true") {
            handler.customer.loadCustInfo(ids[1], session.currentPage.pageId, "business", ids[0], null, function () {
                call_right.find(".func_tab.active").click();
                handler.customer.loadTabUrl(call_right, false, '', ids[1]);
            });
        } else {
            var action = {
                action: 'app.business.readBusiness',
                data: {_id: ids[0]}
            };
            DS.send(action, function (rep) {
                if (rep.success) {
                    handler.customer.loadCustInfo(ids[1], session.currentPage.pageId, "business", ids[0], null, function () {
                        call_right.find(".func_tab.active").click();
                        handler.customer.loadTabUrl(call_right, false, '', ids[1]);
                    });
                    src.find(".bus_read").hide();
                    src.attr("ds_attr", "true");
                    handler.business.refreshNoReadNum(-1);
                } else {
                    $().alertmessage('showError', errMsg);
                }
            });
        }
    },
    showTaskDetail: function (id, src) {
        var ids = id.split("|");
        var call_right = $("#" + session.currentPage.pageId + "_business");
        handler.customer.loadCustInfo(ids[1], session.currentPage.pageId, "business", ids[0], null, function () {
            call_right.find(".business_newbuild").remove();
            call_right.find(".func_tab.active").click();
            handler.customer.loadTabUrl(call_right, false, '', ids[1]);
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
    getCustomerHistoryBusiness: function (cid, callback) {
        if (!cid) {
            callback(new Error("the customerId is null!"));
            return;
        }
        var action = {
            action: "app.business.getCustomerHistoryBusiness",
            data: {customer: cid}
        };
        DS.send(action, function (res) {
            if (res.success) {
                var business = res.data || [];
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
                handler.business.refreshNoReadNum(1, "roleGet");
                $("#business_list_query_form .bus_normal_search").click();
            } else {
                alert(response.message || "拣出业务异常，请稍后再试。");
                $("#reflush_business_button").click();
            }
        });
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
    getBusinessHistoryData: function (history, business, flag) {
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
                } else if (field.type == "file") {
                    var attachs = data[key] || [];
                    var lis = [];
                    for (var l = 0; l < attachs.length; l++) {
                        var obj = attachs[l];
                        obj.fid = key;
                        lis.push(template("tmpl_bus_attach_show", obj));
                    }
                    var html = '<ul class="thumbnails_customer" style="margin-left:5px;display: inline-block">' + lis.join("") + '</ul>';
                    result[field.name] = html;
                } else {
                    result[field.name] = data[key] || "";
                }
            } else {
                if (filedKey == 'number') {
                    if (flag == 'businessFlow') {
                        result["工单编号"] = data[key];
                    } else {
                        result["工单编号"] = "<a href='#' class='ds_do_action' ds_action='customer.showBusDetail' ds_data='" + business._id + "' >" + data[key] + "</a>";
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
                html = html.replace(/_appaction/g, "business.m7_showTask_assigned_detail");
                pane.html(html);
            });
        });
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
        var rid=uuid.v1();
        var task = src.closest('.business-info');
        DS.send(action, function (response) {
            if (response.success) {
                dsevent.publish("taskExcuteAction", response.data);
                $('.history_business_table_show[ds_attr="'+response.data.customer+'"]').click();
                handler.business.refreshTotalNum(true);
                if(task.closest('#batch_modal').size()>0||task.closest('#view_nav_business').size()>0){
                    var frm =  $('#frm_cust_his_quick_search');
                    if(task.closest('#view_nav_business').size()==0){
                        if(task.attr("hisSearchDate") ==''){
                            frm.find('a[ds_data="date"]:last').click();
                        }else{
                            frm.find('a[ds_attr='+ task.attr("hisSearchDate")+']').click();
                        }
                        if(task.attr("hisSearchType") ==''){
                            frm.find('a[ds_data="type"]:last').click();
                        }else{
                            frm.find('a[ds_attr='+ task.attr("hisSearchType")+']').click();
                        }
                    }
                    handler.business.loadTaskInfo(task,rid,'',response.data._id,null,null,function(response){
                        if(response.data._id && response){
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
                                    data: handler.business.getBusinessHistoryData(historyItem, response.data,"businessFlow")
                                };
                            var UStep = historyItem.stepProcessTime?handler.business.getTimeByMs("second",historyItem.stepProcessTime):-1;
                            var step = historyItem.ctype&&historyItem.ctime?handler.business.getTimeByMs(historyItem.ctype,historyItem.ctime):-1;
                            showItem.color=UStep>step&&step!==-1?"red":"#666";
                            showItem.stepUseTime = historyItem.stepProcessTime?handler.business.taskTimeAll("second",historyItem.stepProcessTime):-1;
                            showItem.stepTime = historyItem.ctype&&historyItem.ctime?handler.business.taskTimeAll(historyItem.ctype,historyItem.ctime):-1;
                            showItem.setpOrTransform = historyItem.action !== "transformIn"?"停留":"步骤所用";
                            showHistory.push(showItem);
                        }
                        if(showHistory && showHistory.length>0) {
                            DS.getView('business/bus_history_item', function (view) {
                                var val = "";
                                 for (var i = 0; i < showHistory.length; i++) {
                                    var html = render.renderActiveHistory(showHistory[i], view, "businessFlow");
                                    var isUShow = showHistory[i].stepUseTime===-1?"none":"inline-block";
                                    var isShow = showHistory[i].stepTime===-1?"none":"inline-block";

                                   val += html.replace(/__stepUseTime/g,showHistory[i].stepUseTime)
                                              .replace(/__color/g,showHistory[i].color)
                                              .replace(/__isUShow/g,isUShow)
                                              .replace(/__isShow/g,isShow)
                                              .replace(/__stepTime/g,showHistory[i].stepTime)
                                              .replace(/__setpOrTransform/g,showHistory[i].setpOrTransform);

                                }
                                    task.closest(".business-info").find('.business_step_history').append(val);

                                });
                            }
                        }
                    });
                }
            } else {
                if (response.errorCode == "403") {
                    $().alertmessage('showWarning', "工单信息已经被别人改变,你无权执行此操作,请刷新!");
                } else {
                    $().alertmessage('showError', "工单处理错误!");
                }
            }
        });
    },
    excuteBusinessStepAction: function (data, src) {
        //console.dir(src)
        if (!handler.business._processAttachData(data, src)) {
            $().alertmessage('showError', "附件不能为空");
            return;
        }
        handler.business.processBusinessData(data);
        var action = {
            action: "app.business.excuteBusinessStepAction",
            data: data
        };
        var rid=uuid.v1();
        var task = src.closest('.business-info');
        DS.send(action, function (response) {
            if (response.success) {
                dsevent.publish("taskExcuteAction", response.data);
                $('.history_business_table_show[ds_attr="'+response.data.customer+'"]').click();
                handler.business.refreshTotalNum();
                if(task.closest('#batch_modal').size()>0||task.closest('#view_nav_business').size()>0){
                    var frm =  $('#frm_cust_his_quick_search');
                    if(task.closest('#view_nav_business').size()==0){
                        if(task.attr("hisSearchDate") ==''){
                            frm.find('a[ds_data="date"]:last').click();
                        }else{
                            frm.find('a[ds_attr='+ task.attr("hisSearchDate")+']').click();
                        }
                        if(task.attr("hisSearchType") ==''){
                            frm.find('a[ds_data="type"]:last').click();
                        }else{
                            frm.find('a[ds_attr='+ task.attr("hisSearchType")+']').click();
                        }
                    }
                    handler.business.loadTaskInfo(task,rid,'',response.data._id,null,null,function(response){
                    if(response.data._id && response){
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
                                data: handler.business.getBusinessHistoryData(historyItem, response.data,"businessFlow")
                            };
                            var UStep = historyItem.stepProcessTime?handler.business.getTimeByMs("second",historyItem.stepProcessTime):-1;
                            var step = historyItem.ctype&&historyItem.ctime?handler.business.getTimeByMs(historyItem.ctype,historyItem.ctime):-1;
                            showItem.color=UStep>step&&step!==-1?"red":"#666";
                            showItem.stepUseTime = historyItem.stepProcessTime>=0?handler.business.taskTimeAll("second",historyItem.stepProcessTime):-1;
                            showItem.stepTime = historyItem.ctype&&historyItem.ctime?handler.business.taskTimeAll(historyItem.ctype,historyItem.ctime):-1;
                            showItem.setpOrTransform = historyItem.action !== "transformIn"?"停留":"步骤所用";
                            showHistory.push(showItem);
                        }
                        if(showHistory && showHistory.length>0) {
                            DS.getView('business/bus_history_item', function (view) {
                                var val = "";
                                for (var i = 0; i < showHistory.length; i++) {
                                    var html = render.renderActiveHistory(showHistory[i], view, "businessFlow");
                                    var isUShow = showHistory[i].stepUseTime===-1?"none":"inline-block";
                                    var isShow = showHistory[i].stepTime===-1?"none":"inline-block";

                                    val += html.replace(/__stepUseTime/g,showHistory[i].stepUseTime)
                                        .replace(/__color/g,showHistory[i].color)
                                        .replace(/__isUShow/g,isUShow)
                                        .replace(/__isShow/g,isShow)
                                        .replace(/__stepTime/g,showHistory[i].stepTime)
                                        .replace(/__setpOrTransform/g,showHistory[i].setpOrTransform);
                                }
                               task.closest(".business-info").find('.business_step_history').append(val);

                            });
                        }
                    }
                });
            }
            } else {
                if (response.errorCode == "403") {
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
            } else {
                if (response.message) {
                    $().alertmessage("showError", response.message);
                }
            }
        });
    },
    listenRecord: function (data, src) {
        DS.getView('cdr/listenRecord', function (view) {
            var panel = $('#cdr_listen_record_pane');
            panel.empty();
            panel.append(view.replace(/__RECORD_FILE/g, data));
            panel.find("#show_cdr_listen_record_Modal").css("z-index", 2000);
            $('#show_cdr_listen_record_Modal').modal({'backdrop': false});
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
                callback(new Error(), response.errorCode);
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
    _processAttachData: function (data, src) {
        if (!src) {
            return true;
        }
        var frm = src.closest("form");
        if (!frm) {
            return true
        }
        var pane = frm.find(".bus_attach_upload_container");
        delete data.attachFieldId;
        delete data.attachName;
        var result = true;
        pane.each(function () {
            var item = $(this);
            var field = item.find("input[name='attachFieldId']").val();
            data[field] = [];
            item.find(".thumbnails_customer .attachitem").each(function (i) {
                var files = {
                    id: $(this).attr("ds_data"),
                    name: $(this).text(),
                    type: $(this).attr("suffix")
                };
                data[field].push(files);
            });

            var p = item.closest(".bus_attach");
            if (p.length > 0) {
                var required = p.attr("required");
                if (required && data[field].length <= 0) {
                    result = false;
                    return false;
                }
            }
        })

        return result;
    },
    doSaveBusiness: function (data, src) {
        if (!handler.business._processAttachData(data, src)) {
            $().alertmessage('showError', "附件不能为空");
            return;
        }
        handler.business.saveBusiness(data, function (err, business) {
            if (!err) {
                business.menu = src.attr("menu");
                dsevent.publish("taskExcuteAction", business);
                $('.history_business_table_show[ds_attr="'+business.customer+'"]').click();
            }
        });
    },
    doSaveTempBusiness: function (data, src) {
        if (!handler.business._processAttachData(data, src)) {
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
        if (!handler.business._processAttachData(data, src)) {
            $().alertmessage('showError', "附件不能为空");
            return;
        }
        var rid=uuid.v1();
        var task = src.closest('.business-info');
        var busId = task.attr('busId');
        handler.business.saveBusiness(data, function (err, business) {
            if (!err) {
                business.menu = src.attr("menu");
                dsevent.publish("taskExcuteAction", business);
                $('.history_business_table_show[ds_attr="'+business.customer+'"]').click();
                handler.business.refreshTotalNum();
                if(task.closest('#batch_modal').size()>0){
                    var frm =  $('#frm_cust_his_quick_search');
                    if(task.attr("hisSearchDate") ==''){
                        frm.find('a[ds_data="date"]:last').click();
                    }else{
                        frm.find('a[ds_attr='+ task.attr("hisSearchDate")+']').click();
                    }
                    if(task.attr("hisSearchType") ==''){
                        frm.find('a[ds_data="type"]:last').click();
                    }else{
                        frm.find('a[ds_attr='+ task.attr("hisSearchType")+']').click();
                    }
                    handler.business.loadTaskInfo(task,rid,'',business._id,null,null,function(response){
                        if(response.data._id && response){
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
                                    data: handler.business.getBusinessHistoryData(historyItem, response.data,"businessFlow")
                                };
                            var UStep = historyItem.stepProcessTime?handler.business.getTimeByMs("second",historyItem.stepProcessTime):-1;
                            var step = historyItem.ctype&&historyItem.ctime?handler.business.getTimeByMs(historyItem.ctype,historyItem.ctime):-1;
                            showItem.color=UStep>step&&step!==-1?"red":"#666";
                             showItem.stepUseTime = historyItem.stepProcessTime>=0?handler.business.taskTimeAll("second",historyItem.stepProcessTime):-1;
                            showItem.stepTime = historyItem.ctype&&historyItem.ctime?handler.business.taskTimeAll(historyItem.ctype,historyItem.ctime):-1;
                            showItem.setpOrTransform = historyItem.action !== "transformIn"?"停留":"步骤所用";
                            showHistory.push(showItem);
                        }
                        if(showHistory && showHistory.length>0) {
                            DS.getView('business/bus_history_item', function (view) {
                                var val = "";
                                 for (var i = 0; i < showHistory.length; i++) {
                                    var html = render.renderActiveHistory(showHistory[i], view, "businessFlow");
                                    var isUShow = showHistory[i].stepUseTime===-1?"none":"inline-block";
                                    var isShow = showHistory[i].stepTime===-1?"none":"inline-block";

                                   val += html.replace(/__stepUseTime/g,showHistory[i].stepUseTime)
                                              .replace(/__color/g,showHistory[i].color)
                                              .replace(/__isUShow/g,isUShow)
                                              .replace(/__isShow/g,isShow)
                                              .replace(/__stepTime/g,showHistory[i].stepTime)
                                              .replace(/__setpOrTransform/g,showHistory[i].setpOrTransform);
                                }
                                    task.append(val);

                                });
                            }
                        }
                    });
                }
            } else {
                if (business == "403") {
                    $().alertmessage('showWarning', "工单信息已经被别人改变,你无权执行此操作,请刷新!");
                } else {
                    $().alertmessage('showError', "工单处理错误!");
                }
            }
        });
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
    getUserNameById: function (uid, maxLen) {
        if (!uid) {
            return uid;
        }
        var user = getCache("agents", uid);
        if (user) {
            if (!maxLen) {
                return user.displayName;
            } else {
                if (user.displayName.length > maxLen) {
                    return user.displayName.substring(0, maxLen - 1) + "...";
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
        var steps = flow ? flow.steps : [];
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
            if (fields.length == 0) {
                var executeData = {_id: business._id, actionId: actionId, master: "sys"};
                handler.business.excuteBusinessStepAction(executeData, src);
                return;
            }
        }

        DS.getView('business/task_list_process', function (view) {
            var pane = $(src).closest(".business_transform").next(".business_process");
            pane.empty();
            pane.html(render.replaceDataByObject(handlerdata, view).replace(/_menu/g, type));
        });
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
        var actions = step ? step.actions : [];
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
            //如果是角色是工单创建人
            if(roleId == "busCreateUser"){
                var createUserObj = new Object();
                createUserObj._id = "busCreateUser";
                createUserObj.displayName = "工单创建人";
                result.push(createUserObj);
                ids.push(createUserObj._id);
            }
        }
        return handler.business.sortAgents(result);
    },
    hasAccessForFlow: function (flow) {
        var step = flow ? flow.steps : [];
        var result = false;
        if (flow.status == "disable") {
            return result;
        }
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
        var steps = flow ? flow.steps : [];
        for (var i = 0; i < steps.length; i++) {
            if (steps[i].isBegin) {
                return steps[i];
            }
        }
        return null;
    },
    getFlowStepById: function (flow, id) {
        var steps = flow ? flow.steps : [];
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
        var actions = step ? step.actions : [];
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
        var flowFields = flow ? flow.fields : [];
        utils.workflow.createFlowCustomFields(fields, flowFields, pane, business);
    },
    createStartFlowBusinessCustomFields: function (pane, id, business) {
        if (!id) return;
        var flow = getCache('businessFlow', id);
        var step = handler.business.getStartStep(flow);
        var fields = step.stepFields || [];
        var flowFields = flow ? flow.fields : [];
        utils.workflow.createFlowCustomFields(fields, flowFields, pane, business);
    },
    createFlowStepCustomFields: function (flowId, stepId, pane, business) {
        if (!flowId || !stepId) return;
        var flow = getCache('businessFlow', flowId);
        var step = handler.business.getFlowStepById(flow, stepId);
        var fields = step ? step.stepFields : [];
        var flowFields = flow ? flow.fields : [];
        utils.workflow.createFlowCustomFields(fields, flowFields, pane, business);
    },
    createFlowStepActionCustomFields: function (pane, actionId, business) {
        if (!actionId) return;
        var flow = getCache('businessFlow', business.flow);
        var step = getCache('businessFlowStep', business.step);
        var action = handler.business.getFlowStepActionById(step.actions, actionId);
        var fields = action.actionFields;
        var flag = "stepAction";
        business.isProcessAction = true;
        var flowFields = flow ? flow.fields : [];
        utils.workflow.createFlowCustomFields(fields, flowFields, pane, business,flag);
    },
    //for akzj 打印工单定制
    showPrintBusinessTask: function (data) {
        var businessId = data;
        var newWin = window.open("", 'print_business_order', "");
        var action = {
            action: "app.business.getBusinessInfoById",
            data: {_id: businessId}
        };
        DS.send(action, function (response) {
            if (response.success) {
                var responseData = response.data
                var business = responseData.business;
                var customer = responseData.customer;
                var data = {
                    accountName: customer.name,
                    date: DS.getCurrentDate(),
                    addr: customer.address,
                    name: business["d70463c0-1181-11e4-b0fa-e98514da3891_default"] || "",
                    standard: business["d4017d80-2689-11e4-82d5-0dd7cdab3919_default"] || "",
                    number: business["a686c120-1181-11e4-b0fa-e98514da3891"] || "",
                    fare: business["af9d6a20-1181-11e4-9b36-c1001633706d"] || "",
                    backinfo: business["c0457bb0-1181-11e4-b8b0-891b0d3296aa"] || "",
                    agent: getCache("agents", business.createUser).displayName || ""
                };

                DS.getView("business/print_task", function (view) {
                    view = DS.renderView(view, data);
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
        return agents;
    },

    busAssignEvtHandler: function (event) {
        var data = $.evalJSON(event.Data);
        var msg = "有新的待办业务，请您及时处理！";
        $().alertmessage('showUniqueNotify', msg, "busAssignEvt");
        handler.business.refreshUndealNum();
    },
    busAssignRoleEvtHandler: function (event) {
        var data = $.evalJSON(event.Data);
        var msg = "有新的待领取业务，请您及时处理！";
        $().alertmessage('showUniqueNotify', msg, "busRoeEvt");
        handler.business.refreshUndealNum();
    },

    initUndealNum: function (isInit, num1, num2) {
        var pane = $('#main-panel').find(".navbar_top");
        if (isInit) {
            var action = {
                action: 'app.business.refreshUndealNum',
                data: {}
            };
            DS.send(action, function (rep) {
                if (rep.success) {
                    var total = rep.total;
                    var roleNum = rep.roleNum;
                    if (total > 0 || roleNum > 0) {
                        pane.find(".navbar_item>.nav_business").html('<span class="task_pop_tip"></span>');
                    }
                } else {
                    $().alertmessage('showError', errMsg);
                }
            });
        } else {
            if (num1 > 0 || num2 > 0) {
                pane.find(".navbar_item>.nav_business").html('<span class="task_pop_tip"></span>');
            } else {
                pane.find(".navbar_item>.nav_business").html('');
            }
        }
    },
    getCustomerHistoryBusinessByCallId: function (cid, callId, cb) {
        if (!cid) {
            callback(new Error("the cid is null!"));
            return;
        }
        var actStr = "app.business.getCustomerHistoryBusiness";
        var action = {
            action: actStr,
            data: {customer: cid, callId: callId}
        };
        DS.send(action, function (res) {
            if (res.success) {
                var business = res.data || [];
                for (var i = 0; i < business.length; i++) {
                    var businessItem = business[i];
                    businessItem.lastUpdateUser = getCache("agents", businessItem.lastUpdateUser).displayName;
                    businessItem.createUser = getCache("agents", businessItem.createUser).displayName;
                    businessItem.step = getCache("businessFlowStep", businessItem.step).name;
                    businessItem.flow = getCache("businessFlow", businessItem.flow).name;

                    businessItem.data = handler.business.getBusinessHistoryData({excuteData: businessItem.historyData, action: "create"}, businessItem);
                    delete businessItem.historyData;

                }
                cb(null, business);
            } else {
                cb(new Error(""));
            }
        });
    },
    loadTaskInfo: function (pane, menu, cid, tid, callId, fid, callback) {
        pane.empty();
        var temp = "<div class='business_transform'></div><div class='business_process'></div><div class='business_backInfo'></div><div class='business_step_history'></div>";
        pane.append(temp);
        session.business.containerId = menu;//工单容器id
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
                    if (!currentBusiness) {
                        alert("工单不存在,已删除");
                        return;
                    }
                    if (handler.business.isStartStep(currentBusiness.step)) {
                        $(".reSaveId").removeClass("reSaveId"); //先清除页面已有的reSaveId,多页面会造会互相影响
                        DS.getView('business/add_task_back', function (view) {
                            var html = render.replaceDataByObject(currentBusiness, view);
                            var html = html.replace(/_menu/g, menu);
                            $(pane).find(".business_transform").html(html);
                            handler.business.showTaskCountTime(currentBusiness,pane);
                        });
                    } else {
                        DS.getView('business/task_list_transform', function (view) {
                            var html = render.replaceDataByObject(currentBusiness, view);
                            var html = html.replace(/_menu/g, menu);
                            $(pane).find(".business_transform").html(html);
                            handler.business.showTaskCountTime(currentBusiness,pane);
                        });
                    }
                    DS.getView("business/add_business_comments", function (view) {
                        var html = render.replaceDataByObject(currentBusiness, view);
                        var html = html.replace(/_menu/g, menu);
                        $(pane).find(".business_backInfo").html(html);
                        if (typeof callback == 'function') {
                            callback(response);
                        }
                    });

                } else {
                    $().alertmessage('showError', response.message||"查询业务信息出错！");
                }
            });
        } else {
            handler.business.getCustomerLastBusiness({customer: cid, status: "dealing"}, function (err, business) {
                if (!err) {
                    DS.getView('business/add_task', function (view) {
                        var html = view.replace(/_menu/g, menu).replace(/_customer/g, cid);
                        if (callId) {
                            html = html.replace(/_callId/g, callId);
                        } else {
                            html = html.replace(/_callId/g, "");
                        }
                        fid = fid || "";
                        html = html.replace(/_selectFlow/g, fid);
                        $(pane).find(".business_transform").html(html);

                        if (typeof callback == 'function') {
                            callback();
                        }
                    });
                }
            });
        }
    },
    showTaskCountTime: function(currentBusiness,pane){
        var allTaskByPane =  $(pane).find(".business_transform").find(".allTask");
        if(currentBusiness.status==="complete"){
            $(pane).find(".business_transform").find(".substep").find('.time').attr('ds_stop','processTime');
            handler.customer.showCountDown($(pane).find(".business_transform").find(".substep"),currentBusiness.processTime*1000,'time','processTime');
            var phoneBarTipOption = {placement:'bottom',trigger:'hover',html:true};
            phoneBarTipOption.title="工单完成所用时长";
            $(pane).find(".business_transform").find(".substep").tooltip(phoneBarTipOption);

            var flowObj = getCache("businessFlow",currentBusiness.flow);
            if(flowObj.ctype&&flowObj.ctime){
                var allTime = handler.business.taskTimeAll(flowObj.ctype,flowObj.ctime);
                phoneBarTipOption.title="工单总时长";
                allTaskByPane.show();
                allTaskByPane.find(".time").text(allTime);
                allTaskByPane.tooltip(phoneBarTipOption);
            }else{
                allTaskByPane.hide();
                allTaskByPane.find(".time").text("");
            }
        }else if(currentBusiness.history.length===0){
            allTaskByPane.find('.time_img img').attr("src","../img/taskTimeAll.png");
            var flowObj = getCache("businessFlow",currentBusiness.flow);
            var phoneBarTipOption = {placement:'bottom',trigger:'hover',html:true};
            if(flowObj.ctype&&flowObj.ctime){
                var allTime = handler.business.taskTimeAll(flowObj.ctype,flowObj.ctime);
                phoneBarTipOption.title="工单总时长";
                allTaskByPane.show();
                allTaskByPane.find(".time").text(allTime);
                allTaskByPane.tooltip(phoneBarTipOption);
            }else{
                allTaskByPane.hide();
                allTaskByPane.find(".time").text("");
            }
        }else{
              allTaskByPane.find('.time_img img').attr("src","../img/taskTimeAll.png");
              $(pane).find(".business_transform").find(".substep").find('.time_img img').attr("src","../img/taskTime.png");
                $(pane).find(".business_transform .time").css("color","#ea8010");
            handler.business.currentBusinessExpireTime(currentBusiness,$(pane));
        }
    },
    currentBusinessExpireTime: function(currentBusiness,pane){
            var stepExpireTime = currentBusiness.stepExpireTime||0.1,//工单单步剩余时长
                totalExpireTime = currentBusiness.totalExpireTime||0.1;//工单剩余时间
            handler.business.countdownExpireTime(stepExpireTime,pane.find('.substep'),'该步骤剩余时长');
            handler.business.countdownExpireTime(totalExpireTime,pane.find(".allTask"),'工单剩余总时长');
    },
    countdownExpireTime: function(countdowntime,_basePane,titleName){
        if(countdowntime===0.1)return;
        var phoneBarTipOption = {placement:'bottom',trigger:'hover',html:true},
            interval = 1000,
            stop    = -1,
            container = _basePane;
            phoneBarTipOption.title=countdowntime<0?"已超时":titleName;
            container.tooltip(phoneBarTipOption);
            container.find('.time').attr("ds_stop",stop);

            if(container.find('.time[ds_stop='+stop+']').attr('countdowntime')==='noTime'){
                    container.find('.time[ds_stop='+stop+']').attr('countdowntime',countdowntime);
                }
            var time=container.find('.time[ds_stop='+stop+']').attr('countdowntime');


            if(time!=='noTime'){
                handler.customer.showCountDown(container,+time,'time',stop);
                _basePane.show();
            }else{
                container.hide();
            }

            stop = window.setInterval(function(){
                container.find('.time').attr("ds_stop",stop);
                if(container.find('.time[ds_stop='+stop+']').attr('countdowntime')==='noTime'){
                        container.find('.time[ds_stop='+stop+']').attr('countdowntime',countdowntime);
                    }
                var time=container.find('.time[ds_stop='+stop+']').attr('countdowntime');

                if(time!=='noTime'&&container.find('.time_img').attr('ds_hide')!=="add_task_back"){
                    handler.customer.showCountDown(container,+time,'time',stop);
                    _basePane.show();
                }else{
                    container.hide();
                    window.clearInterval(container.find('.time').attr("ds_stop"));
                }
            }, interval);
    },
    loadHistoryTaskInfo:function(key,_p){
        if(_p.closest('#view_nav_business').size() !== 0){
            return;
        }
        var action = {
            action : "app.customer.queryCustCommonHistory",
            data :{customer:key,type:'business'}
        };
        DS.send(action , function(response){
            if(response.success){
                var data = response.data || {};
                handler.customer.processHistoryData(data);
                data.key = key;
                var html = template('history_business_table_template',data);
                _p.find('.business_info_history').html(html);
                //禁止备注编辑
                if(session.user.isAdmin || isHasFunc("func_not_edit_remark_field")){
                    $(".his_comment").removeClass("ds_do_action");
                }
                resizeRightContent(_p);
            } else {
                $().alertmessage('showError', "获取历史数据异常！");
            }
        });
    },
    processBusinessData: function (data) {
        data = data || {};
        if (data.shortCut) {
            delete data.shortCut;
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
    delBusAttach: function (fileId, src) {
        if (!confirm("确认删除此附件吗？"))return;
        var body = src.closest("form");
        var thumb = src.closest("li");
        var cid = session.business.containerId;
        var busId = "";
        if (session.business.currentBusiness) {
            var bus = session.business.currentBusiness[cid];
            if (bus) {
                busId = bus._id;
            }
        }
        var pane = src.closest(".bus_attach_upload_container");
        var field = pane.find("input[name='attachFieldId']").val();
        var action = {
            action: "app.business.delBusAttach",
            data: {_id: busId, field: field, fileId: fileId}
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                thumb.remove();
            } else {
                $().alertmessage('showError', errMsg);
            }
        });
    },
    taskTimeAll: function(ctype,ctime){
        var resultStr;
        if(ctype === "day"){
            resultStr = ctime*24*60*60*1000;
        }else if(ctype === "hours"){
            resultStr = ctime*60*60*1000;
        }else if(ctype === "min"){
            resultStr = ctime*60*1000;
        }else if(ctype === "second"){
            resultStr = ctime*1000;
        }
        return handler.business.timer(resultStr);
    },
     getTimeByMs: function(ctype,ctime){
       var resultStr;
        if(ctype === "day"){
            resultStr = ctime*24*60*60*1000;
        }else if(ctype === "hours"){
            resultStr = ctime*60*60*1000;
        }else if(ctype === "min"){
            resultStr = ctime*60*1000;
        }else if(ctype === "second"){
            resultStr = ctime*1000;
        }
        return resultStr;
    },
    getParseIntMinTime: function(ctype,ctime){
        var time = parseInt(ctime);
        if(ctype == "hours"){
            time = time * 60;
        }else if(ctype == "day"){
            time = time * 60 * 24;
        }
        return time;
    },
    timer: function(time){
        var ts = time;//计算剩余的毫秒数
        var dd = parseInt(ts / 1000 / 60 / 60 / 24, 10);//计算剩余的天数
        var hh = parseInt(ts / 1000 / 60 / 60 % 24, 10);//计算剩余的小时数
        var mm = parseInt(ts / 1000 / 60 % 60, 10);//计算剩余的分钟数
        var ss = parseInt(ts / 1000 % 60, 10);//计算剩余的秒数

        hh = handler.business.checkTime(hh);
        mm = handler.business.checkTime(mm);
        ss = handler.business.checkTime(ss);
        if(dd>0){
            return dd+"天";
        } else if(hh>0){
            return hh + "小时" + mm + "分" + ss + "秒";
        }else{
            return  mm + "分" + ss + "秒";
        }

    },
    checkTime: function(i){
       if (i < 10) {
           i = "0" + i;
        }
       return i;
    }

};
