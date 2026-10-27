handler.questionnaire = {
    pageSize: 10,
    subMenus:['questionnaire_my','questionnaire_all'],
    openSessions: [],
    limit: 10,
    cardLimit:10,
    cid:"#view_nav_questionnaire",
    richEditor:null,
    curSubMenu:'',
    curTabId:"",
    curTabFlag:"",

    ques_main: function(){
        var pane=$(handler.questionnaire.cid);
        pane.find(".btn_questionnaire_my").click();
    },

    quick_subMenu_search: function (submenu,src) {
        var searchPane = src.closest(".left_column");
        searchPane.find(".model_submenu button").removeClass("active");
        src.addClass("active");
        handler.questionnaire.curSubMenu=submenu;
        handler.swapSubMenu(submenu,'questionnaire/ques_list',"ques_list",true,true);
    },

    ques_list: function (menu, searchData) {
        if(menu == "questionnaire_all"){
            if(!isHasFunc("func_questionnaire_assign")){
                $("#questionnaire_assign_button_questionnaire_all").remove();
            }
            if(!isHasFunc("func_questionnaire_export")){
                $("#questionnaire_export_button_questionnaire_all").remove();
            }
            if(!isHasFunc("func_questionnaire_delete")){
                $("#questionnaire_dropdown_button_questionnaire_all").remove();
                $("#questionnaire_delete_button_questionnaire_all").remove();
            }

        }

        var leftPane = $("#contact_list_"+menu);
        var pane=$(handler.questionnaire.cid).find(".list-inside");
        if(!searchData){
            handler.questionnaire.initSearchCondition(menu);
        }
        var querydata = {};
        var id = menu;
        var container = $("#frm_ques_advanced_search_"+menu);
        if(searchData){
            id = searchData.questionnaireType;
            querydata = searchData;
            delete querydata.questionnaireType;
            if(searchData.formId){
                leftPane.find(".pagination").attr("for", searchData.formId);
            }
            delete searchData.formId;

            var resultSelect = container.find(".ques_result");
            var masterSelect = container.find(".ques_master");
            var queryTimeInput = container.find(".query_time");
            if (id == "my_questionnaire_uncomplete" || id == 'questionnaire_uncomplete' || id == 'questionnaire_unconfirm' || id == "my_questionnaire_uncomfirm") {
                resultSelect.closest("span").hide();
                queryTimeInput.closest("span").hide();
            }else{
                resultSelect.closest("span").show();
                queryTimeInput.closest("span").show();
            }
            if (menu == "questionnaire_my") {
                masterSelect.closest("span").hide();
            }else{
                masterSelect.closest("span").show();
            }
        }
        leftPane.find(".btn-group").show();
        switch (id) {
            case "questionnaire_my":
                $("#questionnaire_assign_button_" + menu).hide();
                $("#questionnaire_export_button_" + menu).hide();
                $("#questionnaire_dropdown_button_" + menu).hide();
                $("#questionnaire_delete_button_"+ menu).hide();
                handler.questionnaire.getUserAllQues(querydata, function (err, data) {
                    handler.questionnaire.processDisplayQuesList(pane, data, id, querydata);
                    DS.showSearchTips(leftPane.find("#frm_ques_advanced_search_"+menu));
                });
                leftPane.find(".header_search_wrap").css("width", "315px");
                $(".refresh-questionnaire").show();
                break;
            case "my_questionnaire_uncomplete" :
                $("#questionnaire_assign_button_" + menu).hide();
                $("#questionnaire_export_button_" + menu).hide();
                $("#questionnaire_dropdown_button_" + menu).hide();
                $("#questionnaire_delete_button_"+ menu).hide();
                $(".refresh-questionnaire").hide();
                handler.questionnaire.getUserUncompleteQues(querydata, function (err, data) {

                    handler.questionnaire.processDisplayQuesList(pane, data, id, querydata);
                    DS.showSearchTips(leftPane.find("#frm_ques_advanced_search_"+menu));
                });
                leftPane.find(".header_search_wrap").css("width", "338px");
                $(".refresh-questionnaire").hide();
                break;
            case "my_questionnaire_uncomfirm" :
                $("#questionnaire_assign_button_" + menu).hide();
                $("#questionnaire_export_button_" + menu).hide();
                $("#questionnaire_dropdown_button_" + menu).hide();
                $("#questionnaire_delete_button_"+ menu).hide();
                handler.questionnaire.getUserUnconfirmQues(querydata, function (err, data) {
                    handler.questionnaire.processDisplayQuesList(pane, data, id, querydata);
                    DS.showSearchTips(leftPane.find("#frm_ques_advanced_search_"+menu));
                });
                leftPane.find(".header_search_wrap").css("width", "338px");
                $(".refresh-questionnaire").hide();
                break;
            case "my_questionnaire_complete":
                $("#questionnaire_assign_button_" + menu).hide();
                $("#questionnaire_dropdown_button_" + menu).hide();
                $("#questionnaire_export_button_" + menu).show();
                $("#questionnaire_delete_button_"+ menu).hide();
                handler.questionnaire.getUserCompleteQues(querydata, function (err, data) {
                    querydata.status = "complete";
                    querydata.owner = session.user._id;
                    handler.questionnaire.processDisplayQuesList(pane, data, id, querydata);
                    DS.showSearchTips(leftPane.find("#frm_ques_advanced_search_"+menu));
                });
                leftPane.find(".header_search_wrap").css("width", "293px");
                $(".refresh-questionnaire").hide();
                break;
            case "questionnaire_uncomplete":
                $("#questionnaire_export_button_" + menu).hide();
                $("#questionnaire_assign_button_" + menu).show();
                $("#questionnaire_dropdown_button_" + menu).show();
                $("#questionnaire_delete_button_"+ menu).hide();
                $("#questionnaire_list_query_form_"+menu+" .icon-refresh").css("right","1px");
                handler.questionnaire.getUncompleteQues(querydata, function (err, data) {
                    querydata.status = "uncomplete";
                    handler.questionnaire.processDisplayQuesList(pane, data, id, querydata);
                    DS.showSearchTips(leftPane.find("#frm_ques_advanced_search_"+menu));
                    //分配页面的更新
                    if($("#view_ques_list_content .contact_summary").length>0){
                        leftPane.find("#questionnaire_assign_button_questionnaire_all").click();
                    }
                });
                leftPane.find(".header_search_wrap").css("width", "247px");
                $(".refresh-questionnaire").show();
                break;
            case "questionnaire_complete":
                $("#questionnaire_assign_button_" + menu).hide();
                $("#questionnaire_export_button_" + menu).show();
                $("#questionnaire_dropdown_button_" + menu).show();
                $("#questionnaire_delete_button_"+ menu).hide();
                handler.questionnaire.getCompleteQues(querydata, function (err, data) {
                    querydata.status = "complete";
                    handler.questionnaire.processDisplayQuesList(pane, data, id, querydata);
                    DS.showSearchTips(leftPane.find("#frm_ques_advanced_search_"+menu));
                });
                leftPane.find(".header_search_wrap").css("width", "267px");
                $(".refresh-questionnaire").hide();
                break;
            case "questionnaire_all":
                $("#questionnaire_dropdown_button_" + menu).hide();
                $("#questionnaire_assign_button_" + menu).hide();
                $("#questionnaire_export_button_" + menu).hide();
                $("#questionnaire_delete_button_"+ menu).show();
                handler.questionnaire.getAllQues(querydata, function (err, data) {
                    handler.questionnaire.processDisplayQuesList(pane, data, id, querydata);
                    DS.showSearchTips(leftPane.find("#frm_ques_advanced_search_"+menu));
                });
                leftPane.find(".header_search_wrap").css("width", "268px");
                $(".refresh-questionnaire").show();
                break;
            case "questionnaire_unconfirm":
                $("#questionnaire_dropdown_button_" + menu).show();
                $("#questionnaire_assign_button_" + menu).show();
                $("#questionnaire_export_button_" + menu).hide();
                $("#questionnaire_delete_button_"+ menu).hide();
                $("#questionnaire_list_query_form_"+menu+" .icon-refresh").css("right","1px");
                handler.questionnaire.getUnconfirmQues(querydata, function (err, data) {
                    querydata.status = "confirm";
                    handler.questionnaire.processDisplayQuesList(pane, data, id, querydata);
                    DS.showSearchTips(leftPane.find("#frm_ques_advanced_search_"+menu));
                    //分配页面的更新
                    if($("#view_ques_list_content .contact_summary").length>0){
                        leftPane.find("#questionnaire_assign_button_questionnaire_all").click();
                    }
                });
                leftPane.find(".header_search_wrap").css("width", "247px");
                $(".refresh-questionnaire").show();
                break;

            default :
                break;
        }
    },

    initSearchCondition: function(menu){
        var items = [];
        //var dropdownMenu = $("#contact_list_"+menu).find(".header_search_input").find(".dropdown-menu");
        //找到该模板要放入的id
        var dropdownMenu = $("#contact_list_"+menu).find(".dropdown-menu_new");
        if(menu == "questionnaire_my"){
            items.push({ds_action:'questionnaire.quickSearchQuestionnaire', ds_data:'questionnaire_my', value:"全部", className:'quick_card_active'});
            items.push({ds_action:'questionnaire.quickSearchQuestionnaire', ds_data:'my_questionnaire_uncomplete',value:"待回访", className:''});
            items.push({ds_action:'questionnaire.quickSearchQuestionnaire', ds_data:'my_questionnaire_uncomfirm', value:"待确认", className:''});
            items.push({ds_action:'questionnaire.quickSearchQuestionnaire', ds_data:'my_questionnaire_complete', value:"已完成", className:''});
        }else{
            items.push({ds_action:'questionnaire.quickSearchQuestionnaire', ds_data:'questionnaire_all', value:"全部", className:'quick_card_active'});
            items.push({ds_action:'questionnaire.quickSearchQuestionnaire', ds_data:'questionnaire_uncomplete', value:"待回访", className:''});
            items.push({ds_action:'questionnaire.quickSearchQuestionnaire', ds_data:'questionnaire_unconfirm', value:"待确认", className:''});
            items.push({ds_action:'questionnaire.quickSearchQuestionnaire', ds_data:'questionnaire_complete', value:"已完成", className:''});
        }
        dropdownMenu.html(template("tmpl_questionnaire_dropdown_search", {items: items}));
        var searchPane= $("#contact_list_"+handler.questionnaire.curSubMenu);
        var _p=searchPane.find("#ques_advanced_search_pane");
        handler.questionnaire.initQuesAdvanceSearchPane(menu, _p);
        searchPane.find(".ques_advanced_search").bind("click",function(e){
            e.stopPropagation();
            var offset=searchPane.find(".quick_search").offset();
            _p.css({top:offset.top+28+"px",left:offset.left+"px"});
            _p.toggleClass("hidden");
            $('#batchNoListContainer').hide();
            $('#batchRemarkListContainer').hide();
        });
        //SearchTab
        var domelis = $(".dropdown-menu_new li");
        $(domelis).eq(0).addClass("searchTabActive").children('a').css("color","#2c96c5");
        for(var i=0;i<domelis.length;i++){
            $(domelis[i]).on('click',function(){
                if($(this).siblings().hasClass('searchTabActive')){
                    $(this).siblings().removeClass('searchTabActive');
                    $(this).children('a').css("color","#2c96c5");
                    $(this).addClass('searchTabActive');
                    $(this).siblings().children('a').css('color','#343434');
                }else{
                    $(this).children('a').css("color","#2c96c5");
                    $(this).addClass('searchTabActive');
                }
            })
        };
        $(".commonsearch").on('click',function(){
            $("#ques_advanced_search_pane .ds_do_action").click();
            $(".remove_filter2").click();
        })
    },

    initQuesAdvanceSearchPane: function(menu, pane){
        var tempList = getCache('questionnaireTemp');
        var agents = getCache("agents") || [];
        var html = template("tmpl_questionnaire_advanced_search",{menu:menu, tempList: tempList, agents: agents});
        pane.html(html);
        var resultSelect = $("#frm_ques_advanced_search_"+menu).find(".ques_result");
        var masterSelect = $("#frm_ques_advanced_search_"+menu).find(".ques_master");
        var queryTimeInput = $("#frm_ques_advanced_search_"+menu).find(".query_time");
        var typeInput = $("#contact_list_"+menu).find("input[name=questionnaireType]");
        var id = typeInput.val();
        if (id == "my_questionnaire_uncomplete" || id == 'questionnaire_uncomplete' || id == "my_questionnaire_uncomfirm") {
            resultSelect.closest("span").hide();
            queryTimeInput.closest("span").hide();
        }else{
            resultSelect.closest("span").show();
            queryTimeInput.closest("span").show();
        }
        if (menu == "questionnaire_my") {
            masterSelect.closest("span").hide();
        }else{
            masterSelect.closest("span").show();
        }
        var container = $("#frm_ques_advanced_search_"+menu);
        
        if(container.find(".ds_owner").length>0){
                var inputId=menu+"_owner_select_input";
                var containerId=menu+"_owner_select_user";
                utils.loadAgentTabBox(inputId,containerId,{width:"126",height:"17",maxHeight:292,hideTab:0,isRadio:true,commonTab:true},false,false,false);
            }
        $("#contact_list_"+menu).find("select[name='temp_id']").change(function(){
            var statusHtml = "";
            $("select[name='temp_id'] option").each(function(){
                if($(this).attr("selected")){
                    var tempData = getCache("questionnaireTemp", $(this).attr("value"));
                    if(tempData.qstatus){
                        statusHtml += '<option value="">--请选择--</option>';
                        for(var key in tempData.qstatus){
                            statusHtml += '<option value="'+key+'">'+tempData.qstatus[key]+'</option>';
                        }
                    }else{
                        statusHtml += '<option value="">--请选择--</option>';
                        statusHtml += '<option value="success">成功</option>';
                        statusHtml += '<option value="invalid">无效电话</option>';
                        statusHtml += '<option value="noAnswer">无人接听</option>';
                        statusHtml += '<option value="imparity">客户不配合</option>';
                        statusHtml += '<option value="other">其他</option>';
                    }
                    return false;
                }
            });
            if(statusHtml == ""){
                statusHtml += '<option value="">--请选择--</option>';
                statusHtml += '<option value="success">成功</option>';
                statusHtml += '<option value="invalid">无效电话</option>';
                statusHtml += '<option value="noAnswer">无人接听</option>';
                statusHtml += '<option value="imparity">客户不配合</option>';
                statusHtml += '<option value="other">其他</option>';
            }
            resultSelect.html(statusHtml);
        });
        resizeLeftColumn(pane.closest(".left_column"));
    },

    quickSearchQuestionnaire:function(data, src){
        $("#view_ques_list_content").empty();
        var searchPane = undefined;
        if(src){
            searchPane = src.closest(".ds_search_pane");
        }else{
            searchPane = $("#contact_list_"+handler.questionnaire.curSubMenu);
            src = searchPane.find(".quick_menu a[ds_data='"+data+"']");
        }

        searchPane.find(".quick_menu a").removeClass("quick_card_active");
        src.addClass("quick_card_active");
        searchPane.find(".quick_desc").text(src.text());
        searchPane.find("#questionnaire_list_query_form_"+handler.questionnaire.curSubMenu).find("input[name=questionnaireType]").val(data);
        var searchFilter = searchPane.find(".ds_search_filter").find(".badge");
        if(searchFilter.length > 0){
            var btn=searchPane.find('.btn_advanced');
            btn.click();
        }else{
            var btn=searchPane.find('.normal_search');
            $("#batchNo_text").val('');
            $("#batchRemark_text").val('');
            $(".ques-lead").find('input[type="checkbox"]').prop('checked',false);
            handler.questionnaire.resetQueryHighQues(data.src)
            $("#batchNo_text").val('')
            $("#batchRemark_text").val('')
            btn.click();
        }
    },

    queryQuestionnaireList: function (data, src) {
        //检查是否是高级搜索刷新
        var $conditions = $("#view_ques_list").find(".ds_search_filter").find(".badge-info");
        //刷新动作，有高级搜索条件
        var isRefresh = false;
        if(src.closest(".refresh-questionnaire").size()>0 || src.is(".refresh")){
            isRefresh=true;
        }
        if($conditions.size()>0 && isRefresh){
            $("#high-search").click();
            return false;
        }
        //去除条件
        var pane = src.closest('.left_column');
        var frm=pane.find("form.ds_search_form");
        frm.get(0).reset();
        if(frm.find(".select_input").length>0){
            frm.find(".select_input").val("");
        }
        pane.find(".business_type").change();
        pane.find(".search_condition").html("");
        pane.find(".ds_search_filter").html("").hide();
        pane.find("#batchNoListContainer").hide();
        pane.find("#batchRemarkListContainer").hide();
        var menu = handler.questionnaire.curSubMenu;
        data.page = src.val() || 1;
        data.limit = 10;
        data.formId = $(src).closest("form").attr("id");
        handler.questionnaire.ques_list(menu, data);
    },
    queryQuestionnaireListByPage : function (data,src){
        var menu = handler.questionnaire.curSubMenu;
        if(data.succeed){
            data = data.data;
        }
        var leftPane = $(src).closest(".left_column");
        var normalPane = leftPane.find("#questionnaire_list_query_form_"+menu)
        data.questionnaireType = normalPane.find("input[name=questionnaireType]").val();
        data.page = src.val() || 1;
        data.limit = 10;
        handler.questionnaire.ques_list(menu, data);
    },
    getUserUnconfirmQues : function (data,callback){
       var action = {
           action : 'app.questionnaire.getUserUnconfirmQues',
           data : data
       };
       DS.send(action ,function(response){
           if(response.success){
               callback(null, response);
           } else {
               callback(new Error(""));
           }
       });
    },
    getUserCompleteQues: function (data, callback) {
        var action = {
            action: 'app.questionnaire.getUserCompleteQues',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                callback(null, response);
            } else {
                callback(new Error(""));
            }
        });
    },
    getUncompleteQues: function (data, callback) {
        var action = {
            action: 'app.questionnaire.getAllUncompleteQues',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                callback(null, response);
            } else {
                callback(new Error(""));
            }
        });
    },
    getCompleteQues: function (data, callback) {
        var action = {
            action: 'app.questionnaire.getAllCompleteQues',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                callback(null, response);
            } else {
                callback(new Error(""));
            }
        });
    },

    getAllQues: function (data, callback) {
        var action = {
            action: 'app.questionnaire.getAllQues',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                callback(null, response);
            } else {
                callback(new Error(""));
            }
        });
    },

    getUnconfirmQues: function(data, callback){
        var action = {
            action: 'app.questionnaire.getAllUnconfirmQues',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                callback(null, response);
            } else {
                callback(new Error(""));
            }
        });
    },

    getUserUncompleteQues: function (data, callback) {
        var action = {
            action: 'app.questionnaire.getUserUncompleteQues',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                callback(null, response);
            } else {
                callback(new Error(""));
            }
        });
    },

    getUserAllQues: function (data, callback) {
        var action = {
            action: 'app.questionnaire.getUserAllQues',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                callback(null, response);
            } else {
                callback(new Error(""));
            }
        });
    },

    processDisplayQuesList: function (pane, data, menu, querydata) {
        var menu = handler.questionnaire.curSubMenu;
        var html = "";
        var list = data.list;
        var count = data.count;
        var li = $(pane).closest(".left_column").find(".pagination").find("li");
        if(count == 0){
            $(pane).closest(".left_column").find(".list-inside").html('<div class="alert">未找到问卷!</div>');
            $(pane).closest(".left_column").find(".pagination").find(".result_count").text(count);
            updatePagination(li, count, querydata.limit || 10, querydata.page || 1);
            session.questionnaire.query = session.questionnaire.query || [];
            delete querydata.limit;
            delete querydata.page;
            session.questionnaire.query[menu] = querydata || data.condition;
            return;
        }
        for(var i=0; i<list.length;  i++){
            var item = list[i];
            item.statusName = handler.questionnaire.getStatueNameByCache(item.status, item.result, item.temp_id);
            item.labelName = handler.questionnaire.getQuestionnaireLabelByStatus(item.status, item.result);
            item.tempName = handler.questionnaire.getTempNameByCache(item.temp_id);
            item.displayOwner = handler.questionnaire.getDisplayOwner(item.owner);
            item.phone = checkHideTel(item.phone);
        }
        DS.getView("questionnaire/ques_list_item", function(view){
            var render = template.compile(view);
            pane.html(render({items: list}));
            $(pane).closest(".left_column").find(".pagination").find(".result_count").text(count);
            updatePagination(li, count, querydata.limit || 10, querydata.page || 1);
            $(".questionnaire_detail_div" + menu).empty();
            session.questionnaire.query = session.questionnaire.query || [];
            delete querydata.limit;
            delete querydata.page;
            session.questionnaire.query[menu] = querydata || data.condition;
        });

    },

    getTempNameByCache: function (tempId) {
        var flows = getCache('questionnaireTemp');
        for (var i = 0; i < flows.length; i++) {
            if (flows[i]._id == tempId) {
                return flows[i].name;
            }
        }
        return tempId;
    },
    getQuestionnaireLabelByStatus: function (status,result) {
        if (status == 'uncomplete' || status == "confirm") {
            return "label-important";
        } else {
            if(result == 'success'){
                return "label-success";
            } else if(result == 'invalid'){
                return "";
            } else if(result == 'noAnswer'){
                return "label-info";
            } else if(result == 'imparity'){
                return "label-warning";
            } else if(result == 'other'){
                return "label-success";
            }else if(utils.startWith(result, "qstatus")){
                return "label-"+result;
            }
            return "label-success";
        }
    },
    getStatueNameByCache: function (status , result, tempId) {
        if (status == "uncomplete") {
            return "待回访";
        }else if(status == "confirm"){
            return "待确认";
        }else {
            var tempData = getCache("questionnaireTemp", tempId);
            var qstatus = undefined;
            if(tempData){
               qstatus  = tempData.qstatus;
            }
            if(qstatus && qstatus[result]){
                return qstatus[result];
            }else{
                if(result == 'success'){
                    return "回访成功";
                } else if(result == 'invalid'){
                    return "无效电话";
                } else if(result == 'noAnswer'){
                    return "无人接听";
                } else if(result == 'imparity'){
                    return "客户不配合";
                } else if(result == 'other'){
                    return "其他";
                }
            }
            return "已完成";
        }
    },
    showQuestionnaireDetail: function (data, src) {
        var id = data;
        var action = {
            action: "app.questionnaire.getQuesById",
            data: {_id: id}
        };
        var notifyTime = $(src).closest(".list_item").find(".ques-revisitTime").attr("notifyTime");
        DS.send(action, function (response) {
            if (response.success) {
                var quesData = response.data;
                var tempId = quesData.temp_id;
                var tempData = getCache("questionnaireTemp", tempId);
                session.questionnaire.currentQuesData = quesData;
                //遍历fields，添加数据；
                var fields = getCache("questionnaireField");
                var needShowFields = [];//需要显示的字段。
                for (var i = 0; i < fields.length; i++) {
                    if (fields[i].temp_id == tempId) {
                        //遍历属性
                        var field = fields[i];
                        if (field) {
                            var needShowField = {};
                            needShowField.name = field.name;
                            needShowField.desc = field.desc;
                            if (field._id.substr(-5) == "_name") {
                                needShowField.value = quesData.name;
                            } else if (field._id.substr(-6) == "_phone") {
                                needShowField.value = quesData.phone;
                            } else {
                                needShowField.value= quesData[field._id];
                            }
                            needShowFields.push(needShowField);
                        }
                    }
                }
                DS.getView("questionnaire/ques_detail", function (view) {
                    var menu = handler.questionnaire.curSubMenu;
                    var pane = $("#view_ques_list_content");
                    view=view.replace(/_#custId#_/g,id);
                    pane.empty();
                    quesData.menu = menu;
                    quesData.tempData = tempData || {};
                    quesData.basePhone = checkHideTel(quesData.phone);
                    quesData.phone = checkEncryptTel(quesData.phone);
                    quesData.custDetial = needShowFields;
                    var render = template.compile(view);
                    quesData.notifyTime=notifyTime;
                    pane.html(render(quesData));
                    resize();
                    if (tempData.type == 'static') {
                        var ques = handler.questionnaire.getTempQues(tempId);
                        if(quesData.status == "uncomplete" || quesData.status == 'confirm'){
                            var processFunction = function (ques) {
                                DS.getView("questionnaire/ques_detail_item_multiselect", function (viewMultiItem) {
                                    DS.getView("questionnaire/ques_detail_item", function (viewItem) {
                                        for (var i = 0; i < ques.length; i++) {
                                            oneQues = handler.questionnaire.replaceQues(ques[i], tempId, quesData);
                                            oneQues.questionnaire = quesData;
                                            oneQues.temp = tempData;

                                            if (oneQues.isMultiselect) {
                                                var quesPane = pane.find("div.last_action").find(".ques_item_panel");
                                                var render = template.compile(viewMultiItem);
                                                if (viewMultiItem) {
                                                    pane.find("div.ques_item_pane").removeClass("no_content_action_from");
                                                }
                                                quesPane.append(render(oneQues));
                                                $("[data-toggle='popover']").popover();
                                            }else{
                                                var quesPane = pane.find("div.last_action").find(".ques_item_panel");
                                                var render = template.compile(viewItem);
                                                if (viewItem) {
                                                    pane.find("div.ques_item_pane").removeClass("no_content_action_from");
                                                }
                                                quesPane.append(render(oneQues));
                                                $("[data-toggle='popover']").popover();
                                            }
                                        }
                                    });
                                });
                            };
                            processFunction(ques);
                            $("#questionnaire_complete_button_" + menu).attr("disabled", false);

                        } else if(quesData.status == 'complete') {
                            var answs = quesData.anws || {};
                            var processFunction = function (ques) {
                                DS.getView("questionnaire/ques_detail_item_multiselect", function (viewMultiItem) {
                                    DS.getView("questionnaire/ques_detail_item", function (viewItem) {
                                        for (var i=0;i<ques.length;i++) {
                                            var oneQues = handler.questionnaire.replaceQues(ques[i], tempId, quesData);
                                            var value = answs[ques[i]._id];
                                            oneQues.questionnaire = quesData;
                                            oneQues.answValue = value;
                                            if(oneQues.isMultiselect){
                                                var quesPane = pane.find("div.last_action").find(".ques_item_panel");
                                                var render = template.compile(viewMultiItem);
                                                if(viewMultiItem){
                                                    pane.find("div.ques_item_pane").removeClass("no_content_action_from");
                                                }
                                                quesPane.append(render(oneQues));
                                                $("[data-toggle='popover']").popover();

                                            }else{
                                                var quesPane = pane.find("div.last_action").find(".ques_item_panel");
                                                var render = template.compile(viewItem);
                                                if(viewItem){
                                                    pane.find("div.ques_item_pane").removeClass("no_content_action_from");
                                                }
                                                quesPane.append(render(oneQues));
                                                $("[data-toggle='popover']").popover();
                                            }
                                        }
                                    });
                                });
                            };
                            processFunction(ques);

                            /*for (var key in answs) {
                                var oneQues = getCache("questionnaireQues", key);
                                oneQues = handler.questionnaire.replaceQues(oneQues, tempId, quesData);
                                processFunction(oneQues, answs[key]);
                            }*/
                        }
                    } else {
                        if (quesData.status == "uncomplete" || quesData.status == 'confirm') {
                            var ques = getCache("questionnaireQues");
                            var startQues = handler.questionnaire.getStartQues(ques, tempId);
                            if (startQues !== null) {
                                startQues = handler.questionnaire.replaceQues(startQues, tempId, quesData);
                                startQues.questionnaire = quesData;
                                DS.getView("questionnaire/ques_detail_item", function (view) {
                                    var quesPane = pane.find("div.last_action").find(".ques_item_pane");
                                    var render = template.compile(view);
                                    if(view){
                                             pane.find("div.ques_item_pane").removeClass("no_content_action_from");
                                        }
                                    quesPane.append(render(startQues));
                                     $("[data-toggle='popover']").popover();
                                });
                            }
                            $("#questionnaire_complete_button_" + menu).attr("disabled", true);
                            $("#questionnaire_complete_button_" + menu).removeClass("ds_form_action");
                        } else if (quesData.status == 'complete') {
                            var answs = quesData.anws || {};
                            var processFunction = function () {
                                DS.getView("questionnaire/ques_detail_item", function (viewItem) {
                                    for (var key in answs) {
                                        var oneQues = getCache("questionnaireQues", key);
                                        oneQues = handler.questionnaire.replaceQues(oneQues, tempId, quesData);
                                        var value = answs[key];
                                        oneQues.questionnaire = quesData;
                                        oneQues.answValue = value;

                                        var quesPane = pane.find("div.last_action").find(".ques_item_pane");
                                        var render = template.compile(viewItem);
                                        if(viewItem){
                                            pane.find("div.ques_item_pane").removeClass("no_content_action_from");
                                        }
                                        quesPane.append(render(oneQues));
                                        $("[data-toggle='popover']").popover();
                                    }
                                });
                            };
                            processFunction();
                        }
                    }
                });
            } else {
                $().alertmessage("showError", response.message);
            }
        });
    },
    swapFunTab:function(data,src){
        var pane=src.closest(".contact_summary");
        var container=pane.find(".func_tab_container");
        var data= {};
        data._id=src.attr("ds_attr");
        var todoContainer=pane.closest(".call_detail");
        var panel=todoContainer.find(".cust_tab_content");
        container.find(".func_tab").removeClass("active");
        src.addClass("active");
        var action = {
            action : "app.questionnaire.getQuesCallSheet",
            data : {_id : data._id}
        };
        DS.send(action,function(res){
            if(res.success){
                var list =  res.data || [];
                for(var i=0;i< list.length;i++){
                    var cdr = list[i];
                    cdr.CONNECT_TYPE = getDicCache("callType", cdr.CONNECT_TYPE)["code_name"];//连接类型
                    cdr.DISPOSAL_AGENT = render.getAgentName(cdr.DISPOSAL_AGENT);//处理座席
                    cdr.STATUS = getDicCache("callStatus", cdr.STATUS)["code_name"];//处理结果
                    cdr.timeLen=handler.cdr.getCallTimeLength(cdr.CALL_TIME_LENGTH);//处理时长
                    cdr.recordUrl=cdr.FILE_SERVER+"/"+cdr.RECORD_FILE_NAME;//录音地址
                }

                data.list = list;

                DS.getView("questionnaire/ques_call_history",function(view){
                    var render = template.compile(view);
                    panel.html(render(data));
                    panel.find(".7m-jmp3").jmp3({
                        backcolor: "11467B",
                        forecolor: "00ff00",
                        width: 65,
                        showdownload: "false",
                        showfilename: "false"
                    });
                    $('.7m-jmp3').parent('.history_item_head_name').css("margin","6px");
                    resizeRightContent(panel);
                    /*var src_his_tab = $("#"+data._id+"callHistory")
                     src_his_tab.click();*/


                });


            } else {
                $().alertmessage('showError', "获取历史数据异常！");
                content.html("<div class='timeLine_list_noResult'>查询出错!</div>");
            }
        });


    },
    processResultSelect : function (src){
        var value = src.val();
        var menu = handler.questionnaire.curSubMenu;
        if(value == "success"){
            session.questionnaire[menu] = session.questionnaire[menu] || {};
            session.questionnaire[menu].isResultSubmit = false;
            if(session.questionnaire[menu] && session.questionnaire[menu].isSubmit){
                $("#questionnaire_complete_button_" + menu).attr("disabled", false);
                $("#questionnaire_complete_button_" + menu).addClass("ds_form_action");
            } else {
                $("#questionnaire_complete_button_" + menu).attr("disabled", true);
                $("#questionnaire_complete_button_" + menu).removeClass("ds_form_action");
            }
        } else {
            session.questionnaire[menu] = session.questionnaire[menu] || {};
            session.questionnaire[menu].isResultSubmit = true;
            $("#questionnaire_complete_button_" + menu).attr("disabled", false);
            $("#questionnaire_complete_button_" + menu).addClass("ds_form_action");
        }
    },
    proceeAnwSelect: function (src) {
        var menu = handler.questionnaire.curSubMenu;
        var value = src.val();
        if (!src.is(":checked")) {//判断为重置动作时
            $("#questionnaire_submit_form_"+menu).find(".item_list_item:gt(0)").remove();
            if(session.questionnaire[menu]){
                session.questionnaire[menu].isSubmit = false;
                session.questionnaire[menu].isResultSubmit = false;
            };
            $("#questionnaire_submit_form_"+menu).find('.submitques').attr('disabled','disabled').removeClass('ds_form_action');
            return;
        }
        var name = src.attr("name").replace("answer_","");
        var ques = getCache("questionnaireQues", name);
        if (ques) {
            var quesPane = $(".questionnaire-info").find("div.last_action").find(".ques_item_pane");
            while (true) {
                var selectQues = quesPane.find(".ques_display_item:last");
                if (selectQues) {
                    var selectId = selectQues.attr("id");
                    if (selectId != ("ques" + ques._id)) {
                        selectQues.remove();
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            }
            var nextAnsw = ques.anws || [];
            var next = null;
            for (var i = 0; i < nextAnsw.length; i++) {
                if (nextAnsw[i]._id == value) {
                    next = nextAnsw[i].next;
                    break;
                }
            }
            var nextQues = getCache("questionnaireQues", next);
            if (next && nextQues) {
                nextQues = handler.questionnaire.replaceQues(nextQues, session.questionnaire.currentQuesData.temp_id, session.questionnaire.currentQuesData);
                DS.getView("questionnaire/ques_detail_item", function (view) {
                     $("[data-toggle='popover']").popover();
                    var render = template.compile(view);
                    quesPane.append(render(nextQues));
                    var anws = nextQues.anws || [];
                    if (anws.length > 0) {
                        session.questionnaire[menu] = session.questionnaire[menu] || {};
                        session.questionnaire[menu].isSubmit = false;
                        if(!session.questionnaire[menu].isResultSubmit){
                            $("#questionnaire_complete_button_" + menu).attr("disabled", true);
                            $("#questionnaire_complete_button_" + menu).removeClass("ds_form_action");
                        }
                    } else {
                        session.questionnaire[menu] = session.questionnaire[menu] || {};
                        session.questionnaire[menu].isSubmit = true;
                        $("#questionnaire_complete_button_" + menu).attr("disabled", false);
                        $("#questionnaire_complete_button_" + menu).addClass("ds_form_action");
                    }
                });
            }else{
                session.questionnaire[menu] = session.questionnaire[menu] || {};
                session.questionnaire[menu].isSubmit = true;
                $("#questionnaire_complete_button_" + menu).attr("disabled", false);
                $("#questionnaire_complete_button_" + menu).addClass("ds_form_action");
            }
        }
    },

    replaceQues: function (ques, tempId, data) {
        var context = ques.context;
        if (/^.*\$\{.+\}.*$/.test(context)) {
            var r = context.match(/\$\{.+?\}/g);
            if (r != null) {
                for (var i = 0; i < r.length; i++) {
                    var name = r[i].substring(2, r[i].length - 1);
                    var field = handler.questionnaire.getQuesFieldByName(name, tempId);
                    if (field) {
                        if (field._id.substr(-5) == "_name") {
                            context = context.replace(r[i], data.name);
                        } else if (field._id.substr(-6) == "_phone") {
                            context = context.replace(r[i], data.phone);
                        } else {
                            var str = "";
                            if(data[field._id]){
                                str = data[field._id];
                            }

                            context = context.replace(r[i], str);
                        }
                        ques.context = context;
                    }

                }
            }
        }
        return ques;
    },

    getQuesFieldByName: function (name, tempId) {
        var fields = getCache("questionnaireField");
        for (var i = 0; i < fields.length; i++) {
            if (fields[i].temp_id == tempId && fields[i].name == name) {
                return fields[i];
            }
        }
    },

    getStartQues: function (ques, tempId) {
        for (var i = 0; i < ques.length; i++) {
            var quesObj = ques[i];
            if (quesObj.temp_id == tempId && quesObj.isBegin == true) {
                return copy(quesObj);
            }
        }
        return null;
    },

    getTempQues : function (tempId){
        var ques = getCache("questionnaireQues");
        var result = [];
        for (var i=0;i < ques.length;i++){
            var quesObj = ques[i];
            if (quesObj.temp_id == tempId) {
                result.push(copy(quesObj));
            }
        }
        return result;
    },
    showFieldDesc: function (type, val) {
        var desc = '';
        if (type == 'status') {
            if (val == "uncomplete") {
                desc = '待回访';
            } else if(val == "confirm"){
                desc = "待确认";
            } else{
                desc = '已完成';
            }
        }
        return desc;
    },
    _bubbleSort: function (array) {
        var i = 0,
            len = array.length,
            j, d;
        for (; i < len; i++) {
            for (j = 0; j < len; j++) {
                if (parseInt(array[i].exten, 10) < parseInt(array[j].exten, 10)) {
                    d = array[j];
                    array[j] = array[i];
                    array[i] = d;
                }
            }
        }
        return array;
    },
    showQuestionAssign: function (menu, src) {
        var pane = $("#view_ques_list_content");
        var leftPane = src.closest('.left_column');

        DS.getView('questionnaire/ques_assign', function (view) {
            pane.empty();
            view = view.replace(/_#menu#_/g, menu);
            pane.html(view);
            pane.find(".cancel_button").click(function () {
                pane.empty();
            });
            var users = getCache("agents");
            var lowUsers = session.user.moduleUsers.question;
            var filterUsers = [];
            if(session.user.scope.question != "all" && !session.user.isAdmin){
                for(var i = 0; i<users.length; i++){
                    var u = users[i];
                    if($.inArray(u._id, lowUsers) != -1){
                        filterUsers.push(u);
                    }
                }
                users = filterUsers;
            }
            users = handler.questionnaire._bubbleSort(users);
            var html = [];
            for (var i = 0; i < users.length; i++) {
                var u = users[i];
                if (u.status == 'enable') {
                    var tmpl = pane.find("#tmpl_cust_assgin").tmpl(u).get(0).outerHTML;
                    html.push(tmpl);
                }
            }
            $(".cust_assgin_container", pane).html(html.join(""));
               resize();
            $(pane).on("keyup",".user_cust",function (event) {
                var e = event.keyCode;
                if (true) {//(e >= 48 && e <= 57) || (e >= 96 && e <= 105) || e == 8
                    var len = $(".user_cust", pane).length;
                    var sum = 0;
                    for (var xx = 0; xx < len; xx++) {
                        var inputval = $(".user_cust", pane).get(xx).value;
                        if (inputval) {
                            sum += parseInt($(".user_cust", pane).get(xx).value);
                        }
                    }
                    $(".cust_more_count", pane).text(parseInt($(".cust_count", pane).text()) - sum);
                    var totalAssignCount =  parseInt($(".cust_count", pane).text());
                    var currentAssignCount =totalAssignCount;
                    if($(".assign_count", pane).val()!=null){
                        currentAssignCount = parseInt($(".assign_count", pane).val());
                    }
                    if(sum>currentAssignCount){
                        $(".err_assign2").show();
                    }else{
                        $(".err_assign2").hide();
                    }
                }
            });
            $(".assign_count", pane).keyup(function (event) {
                var e = event.keyCode;
                if (true) {//(e >= 48 && e <= 57) || (e >= 96 && e <= 105) || e == 8
                    var len = $(".user_cust", pane).length;
                    var sum = 0;
                    for (var xx = 0; xx < len; xx++) {
                        var inputval = $(".user_cust", pane).get(xx).value;
                        if (inputval) {
                            sum += parseInt($(".user_cust", pane).get(xx).value);
                        }
                    }
                    $(".cust_more_count", pane).text(parseInt($(".cust_count", pane).text()) - sum);
                    if($(".assign_count", pane).val()!=""){
                        var currentAssignCount = parseInt($(".assign_count", pane).val());
                        var totalAssignCount =  parseInt($(".cust_count", pane).text());
                        if(sum>currentAssignCount){
                            $(".err_assign2").show();
                        }else{
                            $(".err_assign2").hide();
                        }
                    }else{
                        $(".err_assign2").hide();
                    }
                }
            });
            var totalCount = $.trim(leftPane.find(".result_count").text());
            totalCount = parseInt(totalCount)||0;
            $(".cust_count", pane).text(totalCount);
            $(".cust_more_count", pane).text(totalCount);
            $(".err_assign_count", pane).text(totalCount);
            $(".assign_count", pane).val(totalCount);

            //此次分配的输入问题
            $(".assign_count", pane).keyup(function(){
                if($(".assign_count", pane).val()!=""){
                    $(".assign_count", pane).val($(".assign_count", pane).val().replace(/\D/g,''));
                    var assignCount = $(".assign_count", pane).val();
                    assignCount = parseInt(assignCount);
                    if(assignCount>totalCount){
                        $(".err_assign", pane).show();
                    }else{
                        $(".err_assign", pane).hide();
                    }
                }else{
                    $(".err_assign", pane).hide();
                }
            });
        });
    },

    saveQuestionAssign: function (data, src) {
        var frm = src.closest("form");
        var assgins = frm.find("input[name='assign[]']");
        var total = parseInt(frm.find(".cust_count").text());
        var num = Math.floor(total / assgins.length);
        assgins.each(function (i) {
            $(this).val(num);
        });
        for (var i = 0; i < total - (assgins.length * num); i++) {
            assgins[i].value = parseInt(assgins[i].value) + 1;
        }
        frm.find(".cust_more_count").text("0");
    },

    exportExcel: function (data , src) {
        var menu = handler.questionnaire.curSubMenu;
        var data = session.questionnaire.query[menu] || {};
        data.query = $("#questionnaire_list_query_form_" + menu).find("input[name='query']").val();
        var count = $("#contact_list_questionnaire_all .result_count").text();
        if(data.query && data.query.trim()==""){
            delete  data.query;
        }
        if (!data.temp_id) {
            alert("请在高级查询中选择问卷模板，查询后再进行导出!");
            return;
        }
        if(count && count>500000){
            alert("不支持导出50万条以上的数据，建议按时间查询多次导出!");
            return;
        }
        removeEmptyProperty(data);
        handler.questionnaire._initQueryTime(data);
        var action = {
            action: "app.questionnaire.exportQues",
            data: data
        };
        DS.send(action, function (response) {
            if (response && response.success) {
                downloadFile(response.path);
            } else {
                alert(response.message || "获取数据失败！请稍后重试！");
            }
        },null,null,null,300000);
    },

    _initQueryTime : function(condition){
        var beginTime = condition.lastUpdateTime_begin_date;
        var endTime = condition.lastUpdateTime_end_date;
        if (beginTime) {
            condition.lastUpdateTime = {
                $gte: beginTime + " 00:00:00"
            }
            delete condition.lastUpdateTime_begin_date;
        }
        if (endTime) {
            if (condition.lastUpdateTime) {
                condition.lastUpdateTime.$lte = endTime + " 23:59:59"
            } else {
                condition.lastUpdateTime = {
                    $lte: endTime + " 23:59:59"
                }
            }
            delete condition.lastUpdateTime_end_date;
        }
        var beginTime2 = condition.createTime_begin_date;
        var endTime2 = condition.createTime_end_date;
        if (beginTime2) {
            condition.createTime = {
                $gte: beginTime2 + " 00:00:00"
            }
            delete condition.createTime_begin_date;
        }
        if (endTime2) {
            if (condition.createTime) {
                condition.createTime.$lte = endTime2 + " 23:59:59"
            } else {
                condition.createTime = {
                    $lte: endTime2 + " 23:59:59"
                }
            }
            delete condition.createTime_end_date;
        }

    },

    deleteQues : function (data , src) {
        var menu = handler.questionnaire.curSubMenu;
        var data = session.questionnaire.query[menu] || {};
        data.query = $("#questionnaire_list_query_form_" + menu).find("input[name='query']").val();
        var action = {
            action : "app.questionnaire.getQuesCount",
            data : data
        }
        DS.send(action , function (response){
            if (response.success){
                var count = response.count || 0;
                DS.getView("questionnaire/ques_delete_info" , function (view){
                    var render = template.compile(view);
                    var panel = $('#modal_panel');
                    panel.html(render({deleteCount:count}));
                    $('#delete_ques_info_Modal').modal({'backdrop': 'static'});
                });

            } else {
                $().alertmessage('showError', "统计数据异常，无法删除数据。");
            }
        });
    },
    colseQuesDelete : function ( data , src ) {
        $('#delete_ques_info_Modal').modal('hide');
    },
    confirmQuesDelete : function (data,src) {
        var menu = handler.questionnaire.curSubMenu;
        var data = session.questionnaire.query[menu] || {};
        data.query = $("#questionnaire_list_query_form_" + menu).find("input[name='query']").val();

        var action = {
            action : "app.questionnaire.deleteQues",
            data : data
        }
        DS.send(action , function(response){
            if(response.success){
                $().alertmessage('showSuccess', "数据已删除");
                $("#view_nav_questionnaire").find(".card_pane.tab_active").find(".normal_search").click();
                handler.questionnaire.colseQuesDelete(data , src);
                $("#contact_list_" + menu).find(".remove_filter2").click();
                $("#questionnaire_list_query_form_" + menu).find(".normal_search").click();
            } else {
                $().alertmessage('showError', response.message);
            }
        });
    },

autoAssgin:function(data,src){
        var frm=src.closest("form");
        var assgins=frm.find("input[name='assign[]']");
        var totalCount = $.trim(frm.find(".cust_count").text());
        totalCount = parseInt(totalCount);
        var assginCount =totalCount;
        if(frm.find(".assign_count").val()!=""){
            assginCount=parseInt(frm.find(".assign_count").val());
        }
        //查看是否违规
        if(totalCount-assginCount>=0){
            var num=Math.floor(assginCount/assgins.length);
            assgins.each(function(i){
                $(this).val(num);
            });
            for(var i=0;i<assginCount-(assgins.length*num);i++){
                assgins[i].value=parseInt(assgins[i].value)+1;
            }
            frm.find(".cust_more_count").text(totalCount-assginCount);

            $(".err_assign2").hide();
        }else{
            $().alertmessage('showError', "最多可分配"+totalCount+"个问卷");
        }




    },
    resetAssgin: function (data, src) {
        var frm = src.closest("form");
        var assgins = frm.find("input[name='assign[]']");
        var total = parseInt(frm.find(".cust_count").text(), 10);
        assgins.each(function (i) {
            $(this).val("0");
        });
        frm.find(".cust_more_count").text(total);
        $(".err_assign2").hide();
    },
    saveQuestionAssign: function (data, src) {
        var menu = data.menu;
        var owners = data.owner;
        var assigns = data.assign;
        var pane = $("#view_ques_list_content");
        var leftPane = $("#contact_list_" + menu);
        //var form=leftPane.find("#questionnaire_list_query_form_"+menu);
        //var query = DS.util.getDataOfForm(form);

        //判断是否有错误
        var totalcount =parseInt(pane.find(".cust_count").text());
        var assigncount =totalcount;
        if(pane.find(".assign_count").val()!=""){
            assigncount =parseInt(pane.find(".assign_count").val());
        }

        if(totalcount<assigncount){
            $().alertmessage('showError',pane.find(".err_assign").text());
        }else{
            var data = session.questionnaire.query[menu] || {};
            data.query = $("#questionnaire_list_query_form_" + menu).find("input[name='query']").val();
            var query=data;
            var total = parseInt(pane.find(".cust_count").text());
            var currentassginNum = assigncount;
//        console.dir(query);
            var filter = [];
            var assginNum = 0;
            for (var i = 0; i < assigns.length; i++) {
                var t = assigns[i];
                if (t && parseInt(t) > 0) {
                    assginNum += parseInt(t, 10);
                    filter.push({owner: owners[i], count: parseInt(t, 10)});
                }
            }
            if (assginNum > currentassginNum) {
                $().alertmessage('showError', "分配问卷的总数不能超过【" + currentassginNum + "】个");
                return;
            }
            var action = {
                action: 'app.questionnaire.saveQuesAssign',
                data: {query: query, owners: filter, total: total}
            };
            DS.send(action, function (rep) {
                if (rep.success) {
                    $().alertmessage('showSuccess', "分配完成");
                    pane.empty();
                } else {
                    if (rep.code == '1001') {
                        $().alertmessage('showError', "您分配的数据总数发生变化，请重新确认后再操作");
                    } else {
                        $().alertmessage('showError', errMsg);
                    }
                }
            }, "POST");
        }

    },
    showActiveHistory : function(data,src){
        var pane = src.closest(".active-history-content");
        var qid = data;
        var action = {
            action : "app.questionnaire.getQuesCallSheet",
            data : {_id : qid}
        };
        DS.send(action,function(res){
            var content = pane.find(".timeLine_list");
            content.empty();
            if(res.success){
                var list =  res.data || [];
                for(var i=0;i< list.length;i++){
                    var cdr = list[i];
                    cdr.CONNECT_TYPE = getDicCache("callType", cdr.CONNECT_TYPE)["code_name"];
                    cdr.DISPOSAL_AGENT = render.getAgentName(cdr.DISPOSAL_AGENT);
                    cdr.STATUS = getDicCache("callStatus", cdr.STATUS)["code_name"];
                    cdr.timeLen=handler.cdr.getCallTimeLength(cdr.CALL_TIME_LENGTH);
                    cdr.recordUrl=cdr.FILE_SERVER+"/"+cdr.RECORD_FILE_NAME;
                }

                    if(list.length != 0) {
                        DS.getView('customer/active_history_content_item',function(view) {
                            var val = "";
                            for(var i = 0; i < list.length; i++) {
                                val += render.renderActiveHistory(list[i], view, "call");
                            }
                            content.append(val);
                        });
                    } else {
                        content.html("<div class='timeLine_list_noResult'>没有纪录!</div>");
                    }
            } else {
                $().alertmessage('showError', "获取历史数据异常！");
                content.html("<div class='timeLine_list_noResult'>查询出错!</div>");
            }
        });



    },
    completeTask: function (data, src) {
        data = data || {};
        delete data.change_date_type;
        delete data.notifyTime_date;
        delete data.notifyTime_time;
        //处理data
        for(var fname in  data){
            //处理other
            if(fname.indexOf("answer_")>-1){
                var newfname = fname.replace("answer_","");
                if(!data[newfname]){
                    data[newfname] = {};
                }
                if(!data[newfname].aws){
                    data[newfname].aws=[];
                }
                if(typeof data[fname] == "string"){
                    data[newfname].aws.push(data[fname]);
                }else{
                    data[newfname].aws = data[fname];
                }
                delete data[fname];
            }else if(fname.indexOf("other_")>-1){
                var newfname = fname.replace("other_","");
                if(!data[newfname]){
                    data[newfname] = {};
                }
                data[newfname].other=data[fname];
                delete data[fname];
            }
        }
        //
        var id = data._id;
        delete data._id;
        var result = data.result ;
        delete data.result;
        var action = {
            action: 'app.questionnaire.completeQuestionnaire',
            data: {
                _id: id,
                anws: data,
                result : result,
                status: 'complete'
            }
        }
        DS.send(action, function (response) {
            if (response.success) {
                $().alertmessage('showInfo', "问卷完成");
                dsevent.publish("questionnaireComplete", response.data);
            } else {
                $().alertmessage('showError', response.message);
            }
        });
    },
    showConfirmQuesCallTask : function (data,src){
        $(".ques_submenu").show();
    },
    hideConfirmQuesCallTask : function (data,src){
        $(".ques_submenu").hide();
    },
    resetQuesCallTask : function (data,src){
        // $(src).closest("#ques_detail_ques").find(".func_tab[ds_data=ques]").click();
        var menu = handler.questionnaire.curSubMenu;
        $('#questionnaire_submit_form_'+menu)[0].reset();
        $('#questionnaire_submit_form_'+menu).find('.inline-checkbox').css({background:''});
        $('#questionnaire_submit_form_'+menu).find('.ques_display_item').eq(0).find("input").eq(0).change();
    },
    confirmQuesCallTask : function (data,src){
        //1 更新状态 status : 'confirm'
        //2 添加联系计划
        data = data || {};
        var notifyTime = data.notifyTime_date+" "+data.notifyTime_time;
        var notifyTimeObj = new Date(notifyTime);
        if(notifyTimeObj.toString() === "Invalid Date"){
            $().alertmessage('showError',"请选择正确的日期和时间");
        }else{
            var action = {
                action : "app.questionnaire.confirmQuesCallTask",
                data :{
                    _id:data._id,
                    status:"confirm",
                    notifyTime:notifyTime
                }
            }
            DS.send(action,function (response){
                if(response.success){
                    dsevent.publish("questionnaireConfirm", response.data);
                } else {
                    $().alertmessage('showError', response.message);
                }
            });
        }
    },
    clickDial : function (data,src){
        var infos = data.split("|");
        if(infos.length == 2){
            var phoneNumber = infos[0];
            var vars = "QUES_ID:" + infos[1];
            softphonebar_dialout(phoneNumber,vars);
        } else {
            $().alertmessage('showError', "获取号码信息失败！");
        }
    },
    showAddQuesComment : function(data,src) {
        if($(src).next('textarea').css('display') == 'none'){
            $(src).next('textarea').show().focus();
        }else if($(src).next('textarea').css('display') != 'none' && $(src).hasClass('cancen_remark')){
            if(confirm("您确定取消备注吗？")){
                $(src).next('textarea').hide().val('');
            }else{
                return;
            }
        }
        $(src).closest(".comment").find(".add_questionnaire_comment").show();
        $(src).closest(".comment").find(".add_questionnaire_comment textarea").focus();
    },
    cancelAddQuesComment : function(data,src){
        $(src).closest(".comment").find(".add_questionnaire_comment").hide();
        $(src).closest(".comment").find(".add_questionnaire_comment").find("textarea").val("");
        $(src).closest(".comment").find(".add_comment_button").show();
    },
    saveAddQuesComment : function(data,src){
        var action = {
            action: "app.questionnaire.addQuesComment",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                $(src).closest("form").find("textarea").val("");
                DS.getView('questionnaire/new_comments_item', function (view) {
                    var title = session.user.displayName + " 添加备注 " + getCurrentDateTime();
                    data.title = title;
                    var render = template.compile(view);
                    $(src).closest(".comment").find(".new_questionnaire_comments").prepend(render(data));
                    $(src).closest(".comment").find(".add_questionnaire_comment").hide();
                    $(src).closest(".comment").find(".add_comment_button").show();
                });
            }
        });

    },

    queryHighQues : function (data,src){
        var menu = handler.questionnaire.curSubMenu;
        data.questionnaireType = $("#questionnaire_list_query_form_"+menu).find("input[name=questionnaireType]").val();
        var formId = $(src).closest("form").attr("id");
        data.formId = formId;
        handler.questionnaire.ques_list(menu, data);
        $("#ques_advanced_search_pane").toggleClass("hidden");
        $(".ques-lead").hide();
        $(".ques-lead2").hide();
    },

    resetQueryHighQues : function (data,src){
        var menu = handler.questionnaire.curSubMenu;
        $("#frm_ques_advanced_search_" + menu).find(".quesTemp_type").val("");
        $("#frm_ques_advanced_search_" + menu).find("input[name=name]").val("");
        $("#frm_ques_advanced_search_" + menu).find("input[name=phone]").val("");
        $("#frm_ques_advanced_search_" + menu).find(".ques_result").val("");
        $("#frm_ques_advanced_search_" + menu).find(".ques_master").val("");
        $("#frm_ques_advanced_search_" + menu).find(".ques_batchNo").val("");
        $("#frm_ques_advanced_search_" + menu).find(".ques_batchRemark").val("");
        $("#frm_ques_advanced_search_" + menu).find(".ds_datetime").val("");
        $("#frm_ques_advanced_search_" + menu).find(".assignStatus").val("");
        $("#frm_ques_advanced_search_" + menu).find("#batchNoListContainer").empty();
        $("#frm_ques_advanced_search_" + menu).find("#batchRemarkListContainer").empty();
        $("#frm_ques_advanced_search_" + menu).find(".ques_batchRemark").attr("ds_data","");
        $("#frm_ques_advanced_search_" + menu).find(".ques_batchNo").attr("ds_data","");
        $('.ques-lead').hide();
        $('.ques-lead2').hide();
    },
    getDisplayOwner : function(agentId){
        if(!agentId){
            return "未分配";
        }
        var agentData = getCache("agents",agentId);
        if(agentData){
            var displayName  = agentData.displayName;
            if(utils.getStrRealLength(displayName) >= 10){
                return utils.substringByRealLength(displayName,0,8) + "...";
            }
            return agentData.displayName;
        }
        return "未分配";
    },
    checkTimeForBatchNo: function (src) {
        var search_item =  $(src).closest(".advanced_search_pane");
        //查看所有的取值都有值
        var createTime_begin_date = search_item.find("[name=createTime_begin_date]").val();
        var createTime_end_date = search_item.find("[name=createTime_end_date]").val();
        //能否组成时间
        var str1 = createTime_begin_date;
        str1 = str1.replace(/-/g,"/");
        var str2 = createTime_end_date;
        str2 = str2.replace(/-/g,"/");
        var date1 = new Date(str1);
        var date2 = new Date(str2);

        if((date1!= "Invalid Date"|| str1 =="") && (date2!= "Invalid Date"|| str2 =="")){
            //去数据库取数据,封装到
            var action = {
                action: 'app.questionnaire.getBatchNoByTime',
                data: {
                    start:createTime_begin_date,
                    end:createTime_end_date
                }
            };
            DS.send(action, function (response) {
                if (response.success) {
                    $("#batchNo_text").attr('ds_data',createTime_begin_date+createTime_end_date);
                    if(response.data && response.data.length>0){
                        var list = response.data;
                        handler.questionnaire.showBatchNo_select(search_item,list);
                    }else{
                        handler.questionnaire.showBatchNo_text(search_item);
                    }
                } else {
                    $().alertmessage('showError', errMsg);
                }
            },null,true,true);
        }else{
            handler.questionnaire.showBatchNo_text(search_item);
        }
        return false;
    },
    checkTimeForBatchRemark: function (src) {
        var search_item =  $(src).closest(".advanced_search_pane");
        //查看所有的取值都有值
        var createTime_begin_date = search_item.find("[name=createTime_begin_date]").val();
        var createTime_end_date = search_item.find("[name=createTime_end_date]").val();
        //能否组成时间
        var str1 = createTime_begin_date;
        str1 = str1.replace(/-/g,"/");
        var str2 = createTime_end_date;
        str2 = str2.replace(/-/g,"/");
        var date1 = new Date(str1);
        var date2 = new Date(str2);

        if((date1!= "Invalid Date"|| str1 =="") && (date2!= "Invalid Date"|| str2 =="")){
            //去数据库取数据,封装到
            var action = {
                action: 'app.questionnaire.getBatchRemarkByTime',
                data: {
                    start:createTime_begin_date,
                    end:createTime_end_date
                }
            };
            DS.send(action, function (response) {
                if (response.success) {
                    $("#batchRemark_text").attr('ds_data',createTime_begin_date+createTime_end_date);
                    if(response.data && response.data.length>0){
                        var list = response.data;
                        handler.questionnaire.showBatchRemark_select(search_item,list);
                    }else{
                        handler.questionnaire.showBatchRemark_text(search_item);
                    }
                } else {
                    $().alertmessage('showError', errMsg);
                }
            },null,true,true);
        }else{
            handler.questionnaire.showBatchRemark_text(search_item);
        }
        return false;
    },
    /**
     *
     * @param list 数据
     */
    showBatchNo_select:function(pane,list){
        var $batchNo_text =  $(pane).find("#batchNo_text");
        //$batchNo_text.attr("readonly",true);
        var $batchNoListContainer = $(pane).find("#batchNoListContainer");
        $batchNoListContainer.empty();
        for(var i =0;i<list.length;i++){
            var item = list[i];
            var batchNo = item.batchNo;
            var html = '<li style="padding: 0" class="phone_search_odd search_input_li" onmouseover="this.style.background=\'#ccc\'" onmouseout="this.style.background=\'\'">'
                +'<label><span><input class="ques-checkboxs" onchange="handler.questionnaire.selectCheckbox(this)" type="checkbox"/></span><i></i><span class="ques_spans_checkboxs">'+batchNo+'</span></label></li>'
            $batchNoListContainer.append(html);
        }
        var checkBox = $('.ques-lead').find('input');
        var sourceHtml = $("#batchNo_text").val();
        checkBox.each(function(){
            if(sourceHtml.indexOf($(this).parent().next().next('span').html()+"; ") != -1){
                if($(this).prop('checked') == false){
                    $(this).prop('checked',true)
                }
            }
        })
        //显示
        $(".ques-lead").show();
    },
    showBatchRemark_select:function(pane,list){
        var $batchRemark_text =  $(pane).find("#batchRemark_text");
        //$batchNo_text.attr("readonly",true);
        var $batchRemarkListContainer = $(pane).find("#batchRemarkListContainer");
        $batchRemarkListContainer.empty();
        for(var i =0;i<list.length;i++){
            var item = list[i];
            var batchRemark = item.batchRemark;
            var html = '<li style="padding: 0" class="phone_search_odd search_input_li" onmouseover="this.style.background=\'#ccc\'" onmouseout="this.style.background=\'\'">'
                +'<label><span><input class="ques-checkboxs2" onchange="handler.questionnaire.selectCheckbox2(this)" type="checkbox"/></span><i></i><span class="ques_spans_checkboxs2">'+batchRemark+'</span></label></li>'
            $batchRemarkListContainer.append(html);
        }
        var checkBox = $('.ques-lead2').find('input');
        var sourceHtml = $("#batchRemark_text").val();
        checkBox.each(function(){
            if(sourceHtml.indexOf($(this).parent().next().next('span').html()+"; ") != -1){
                if($(this).prop('checked') == false){
                    $(this).prop('checked',true)
                }
            }
        })
        //显示
        $(".ques-lead2").show();
    },
    showCheckbox:function(){
        //查看所有的取值都有值
        var panl = $('#ques_advanced_search_pane');
        var checkBox = $('.ques-lead').find('input');
        var sourceHtml = $("#batchNo_text").val();
        var createTime_begin_date = panl.find($("[name=createTime_begin_date]")).val();
        var createTime_end_date = panl.find($("[name=createTime_end_date]")).val();
        if($("#batchNo_text").attr('ds_data') != createTime_begin_date+createTime_end_date || $("#batchNo_text").attr('ds_data')==""){
            handler.questionnaire.checkTimeForBatchNo($("#batchNo_text"));
        }else{
            checkBox.each(function(){
                if(sourceHtml.indexOf($(this).parent().next().next('span').html()+"; ") == -1){
                    if($(this).prop('checked') == true){
                        $(this).prop('checked',false)
                    }
                }else if(sourceHtml.indexOf($(this).parent().next().next('span').html()+"; ") != -1){
                    if($(this).prop('checked') == false){
                        $(this).prop('checked',true)
                    }
                }
            })
            if($(".ques-lead").css('display') == 'none' && $(".ques-lead").html() != ""){
                $(".ques-lead").show();
            }else{
                $(".ques-lead").hide();
            }

        };
        $("#batchNo_text").keyup(function(){
            $('.ques-lead').hide();
            checkBox.each(function(){
                if(sourceHtml.indexOf($(this).parent().next().next('span').html()+"; ") == -1){
                    if($(this).prop('checked') == true){
                        $(this).prop('checked',false)
                    }
                }else if(sourceHtml.indexOf($(this).parent().next().next('span').html()+"; ") != -1){
                    if($(this).prop('checked') == false){
                        $(this).prop('checked',true)
                    }
                }
            })
        });

        $('#ques_advanced_search_pane').on('click',function(e){
            var sourceEle =  e.target.className;
            if(sourceEle == 'ques-checkboxs' || sourceEle == 'ques_spans_checkboxs'){
                $(".ques-lead").show();
            }else{
                $(".ques-lead").hide();
            }
        })
    },
    showCheckbox2:function(){
        //查看所有的取值都有值
        var panl = $('#ques_advanced_search_pane');
        var checkBox = $('.ques-lead2').find('input');
        var sourceHtml = $("#batchRemark_text").val();
        var createTime_begin_date = panl.find($("[name=createTime_begin_date]")).val();
        var createTime_end_date = panl.find($("[name=createTime_end_date]")).val();
        if($("#batchRemark_text").attr('ds_data') != createTime_begin_date+createTime_end_date || $("#batchRemark_text").attr('ds_data')==""){
            handler.questionnaire.checkTimeForBatchRemark($("#batchRemark_text"));
        }else{
            checkBox.each(function(){
                if(sourceHtml.indexOf($(this).parent().next().next('span').html()+"; ") == -1){
                    if($(this).prop('checked') == true){
                        $(this).prop('checked',false)
                    }
                }else if(sourceHtml.indexOf($(this).parent().next().next('span').html()+"; ") != -1){
                    if($(this).prop('checked') == false){
                        $(this).prop('checked',true)
                    }
                }
            });
            if($(".ques-lead2").css('display') == 'none' && $(".ques-lead2").html() != ""){
                $(".ques-lead2").show();
            }else{
                $(".ques-lead2").hide();
            }
        }
        //if($(".ques-lead2").css('display') == 'none' && $(".ques-lead2").html() != ""){
        //    if(createTime_begin_date != "" && createTime_end_date !=""){
        //        $(".ques-lead2").show();
        //    }else{
        //        $(".ques-lead2").hide();
        //    }
        //}
        $("#batchRemark_text").keyup(function(){
            $('.ques-lead2').hide();
            checkBox.each(function(){
                if(sourceHtml.indexOf($(this).parent().next().next('span').html()+"; ") == -1){
                    if($(this).prop('checked') == true){
                        $(this).prop('checked',false)
                    }
                }else if(sourceHtml.indexOf($(this).parent().next().next('span').html()+"; ") != -1){
                    if($(this).prop('checked') == false){
                        $(this).prop('checked',true)
                    }
                }
            })
        })

        $('#ques_advanced_search_pane').on('click',function(e){
            var sourceEle =  e.target.className;
            if(sourceEle == 'ques-checkboxs2' || sourceEle == 'ques_spans_checkboxs2'){
                $(".ques-lead2").show();
            }else{
                $(".ques-lead2").hide();
            }
        })
    },
    selectCheckbox:function(data){
        var checkBox = $(data);
        var html = $(data).parent().next().next('span').html()+'; ';
        var sourceHtml = $("#batchNo_text").val();
        if(checkBox.prop('checked') == true){
            checkBox.prop('checked',true);
            if(sourceHtml.indexOf(html) == -1){
                $("#batchNo_text").val($("#batchNo_text").val()+html);
            };
        }else if(checkBox.prop('checked') == false){
            checkBox.prop('checked',false);
            if(sourceHtml.indexOf(html) != -1){
                sourceHtml = sourceHtml.replace(new RegExp(html), "");
                $('#batchNo_text').val(sourceHtml);
            };
        };
        $("#batchNoListContainer").show();
    },
    selectCheckbox2:function(data){
        var checkBox = $(data);
        var html = $(data).parent().next().next('span').html()+'; ';
        var html2 = $(data).parent().next().next('span').html();
        var sourceHtml = $("#batchRemark_text").val();
        if(checkBox.prop('checked') == true){
            checkBox.prop('checked',true);
            if(sourceHtml.split("; ").indexOf(html2) == -1){
                $("#batchRemark_text").val($("#batchRemark_text").val()+html);
            };
        }else if(checkBox.prop('checked') == false){
            checkBox.prop('checked',false);
            var remarks = sourceHtml.split("; ");
            sourceHtml ="";
            remarks.forEach(function(item,i){
                if(item!=html2 && item!=""){
                    sourceHtml = sourceHtml+ item + '; ';
                }
            });
            $('#batchRemark_text').val(sourceHtml);
        };
        $("#batchRemarkListContainer").show();
    },
    showBatchNo_text:function(pane){
        //$(pane).find("#batchNo_text").removeAttr("readonly");
        $(pane).find("#batchNoListContainer").empty();
        $(pane).find("#batchNoListContainer").hide();
    },
    showBatchRemark_text:function(pane){
        //$(pane).find("#batchNo_text").removeAttr("readonly");
        $(pane).find("#batchRemarkListContainer").empty();
        $(pane).find("#batchRemarkListContainer").hide();
    },
    searchLabelChange:function(data,src){
        var pane = src.closest('.row-fluid');
        if(src.val() == 'unassigned'){
            pane.find('.ds_owner').css('display','none').find('.tabbox_agent_input,.select_input').val('').end().find("dd").removeClass("active");
        }else{
            pane.find('.ds_owner').css('display','block')
        }
    },
    gotoQuesMenu: function(data,src) {
        var pane=$("#main-panel");
        var callMenu=pane.find(".navbar_top a[id='nav_questionnaire']");
        callMenu.click();
        $('#view_nav_questionnaire .btn_questionnaire_my')[0].click();
        if(src){
            $(src).click();
        }
    }

}
