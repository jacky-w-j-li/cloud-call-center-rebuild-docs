session.questionnaire = {};
handler.config.questionnaire = {
    config_questionnaire: function (id) {
        handler.config.questionnaire.showQuestionnaireConfig_page(null, null);
    },

    showQuestionnaireConfig_page: function (page, selectId) {
        var action = {
            action: "config.questionnaire.queryAccountQuestionnaireTemp",
            data: {}
        };
        DS.send(action, function (response) {
            if (response.success) {
                var flows = response.data || [];
                var navtabs = $("#config_questionnaire_nav_tabs");
                navtabs.empty();
                var temp = "<li class='dropdown' id='__id'><a href='#' class='dropdown-toggle nav_business_dropdown_flow' data-toggle='dropdown' ds_action='config.questionnaire.doSelectQuestionnaireTab' ds_data='__id'>" +
                    "<span class='__status'>__name</span> <b class='caret'></b></a><ul class='dropdown-menu'>" +
                    "<li><a href='#' class='ds_do_action' ds_data='__id' ds_action='config.questionnaire.showQuestionnaireFieldConfig'>字段定义</a> </li>" +
                    "<li><a href='#' class='ds_do_action' ds_data='__id' ds_action='config.questionnaire.showConfigQuestionnaireDetail'>模板配置</a></li>" +
                    "<li><a href='#' class='ds_do_action' ds_data='__id' ds_action='config.questionnaire.showQuestionnaireTempStatusConfig'>状态配置</a></li>" +
                    "<li><a href='#' class='ds_do_action' ds_data='__id' ds_action='config.questionnaire.showQuestionnaireTempInfoConfig'>信息配置</a></li>" +
                    "</ul></li>";
                for (var i = 0; i < flows.length; i++) {
                    var html = render.replaceDataByObject(flows[i], temp);
                    navtabs.append(html);
                }
                var html = "<li><a href='#addQuestionnaireTempModal' data-toggle='modal' class='ds_do_action' ds_action='config.questionnaire.showAddQuestionnaireTemp'><span><i class='icon-plus'></i>添加模板</span></a></li>";
                navtabs.append(html);
                if (selectId) {
                    $("#config_questionnaire_nav_tabs").find("li#" + selectId).find("a:first").click();
                    $("#config_questionnaire_nav_tabs").find("li#" + selectId).find("ul a:first").click();
                } else {
                    $("#config_questionnaire_nav_tabs li:first a:first").click();
                    $("#config_questionnaire_nav_tabs li:first ul a:first").click();
                }
                resize();
            }
        });
    },
    showQuestionnaireTempStatusConfig: function(data, src){
        handler.config.questionnaire.doSelectQuestionnaireTab(data);
        var action = {
            action: "config.questionnaire.getQuestionnaireTempStatusById",
            data: {_id: data}
        };
        DS.send(action, function(res){
            if(res.success){
                var tempData = res.data;
                if(!tempData.qstatus){
                    var qstatus = {
                        success: "回访成功",
                        invalid: "无效电话",
                        noAnswer: "无人接听",
                        imparity: "客户不配合",
                        other: "其它"
                    };
                    tempData.qstatus = qstatus;
                }
                DS.getView('config/questionnaire/config_questionnaire_status',function (view){
                    var pane = $("#config_questionnaire_content_container");
                    var render = template.compile(view);
                    pane.html(render(tempData));
                });

            }else{
                $().alertmessage("showError",res.message);
            }

        });

    },

    savaQuestionnaireTempStatus: function(data, src){
        var qstatus={};
        var isEmpty = true;
        if(data.success){
            qstatus.success = data.success;
            isEmpty = false;
        }
        if(data.invalid){
            qstatus.invalid = data.invalid;
            isEmpty = false;
        }
        if(data.noAnswer){
            qstatus.noAnswer = data.noAnswer;
            isEmpty = false;
        }
        if(data.imparity){
            qstatus.imparity = data.imparity;
            isEmpty = false;
        }
        if(data.other){
            qstatus.other = data.other;
            isEmpty = false;
        }
        for(var i = 6; i<=20; i++){
            if(eval("data.qstatus"+i)){
                eval("qstatus.qstatus"+i+"=data.qstatus"+i);
                isEmpty = false;
            }
            eval("delete data.qstatus"+i);
        }
        //查看是否全部删除了
        if(isEmpty){
            $().alertmessage("showError","至少保留一条状态信息");
            return false;
        }

        data.qstatus = qstatus;
        var action = {
            action: "config.questionnaire.updateQuestionnaireTempStatusById",
            data: data
        };
        DS.send(action, function(res){
            if(res.success){
                refreshCacheFromDb("questionnaireTemp");
                $().alertmessage("showSuccess","保存模板状态配置信息成功！");
            }else{
                $().alertmessage("showError",res.message);
            }

        });
    },

    showQuestionnaireTempInfoConfig : function(data,src){
        handler.config.questionnaire.doSelectQuestionnaireTab(data);
        var action = {
            action: "config.questionnaire.getQuestionnaireTempById",
            data: {_id: data}
        };
        DS.send(action,function(resposne){
            if(resposne.success){
                var tempData = resposne.data;
                DS.getView('config/questionnaire/config_questionnaire_info',function (view){
                    var pane = $("#config_questionnaire_content_container");
                    var render = template.compile(view);
                    pane.html(render(tempData));
                });
            } else {
                $().alertmessage("showError",resposne.message);
            }
        });
    },
    savaQuestionnaireTempInfo : function(data,src){
        var from = $('#template_configure');
        try{
            if(validate && !validate.validate(from)) return false;
        }catch(e){}
       var action = {
           action : "config.questionnaire.updateQuestionnaireTemp",
           data : data
       };
       DS.send(action,function(response){
           if(response.success){
                $().alertmessage("showInfo","修改模板信息成功！");
                refreshCacheFromDb("questionnaireTemp");
                $("a.nav_business_dropdown_flow[ds_data='" + data._id + "']").find("span").text(data.name);
           } else {
               $().alertmessage("showError",response.message);
           }
       });

    },
    showAddQuestionnaireTemp: function (data, src) {
        DS.getView('config/questionnaire/add_questionnaire_temp', function (view) {
            var pane = $('#addQuestionnaireTempModal');
            pane.empty();
            pane.html(view);
        });
    },
    addQuestionnaireTemp: function (data, src) {
        data.qstatus = {
            success: "回访成功",
            invalid: "无效电话",
            noAnswer: "无人接听",
            imparity: "客户不配合",
            other: "其它"
        };
        var action = {
            action: "config.questionnaire.addQuestionnaireTemp",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var addFlow = response.data;
                $('#addQuestionnaireTempModal').modal('hide');
                refreshCacheFromDb("questionnaireTemp");//用于更新缓存
                refreshCacheFromDb("questionnaireField");//用于更新缓存
                handler.config.questionnaire.showQuestionnaireConfig_page(null, addFlow._id);
            } else {
                alert(response.message);
            }
        });
    },
    doSelectQuestionnaireTab: function (data) {
        $("li#" + data).find("a:first").tab("show");
        session.questionnaire.currentTemp = data;
    },
    showConfigQuestionnaireDetail: function (data, src) {
        if(typeof data == "object"){
            data = data.temp_id;
        }
        handler.config.questionnaire.doSelectQuestionnaireTab(data);
        var flowId = data;
        var action = {
            action: "config.questionnaire.queryQuestionnaireQues",
            data: {temp_id: flowId}
        };
        DS.send(action, function (response) {
            if (response.success) {
                var ques = response.data;
                DS.getView('config/questionnaire/config_questionnaire_detail', function (view) {
                    var pane = $("#config_questionnaire_content_container");
                    pane.html(DS.renderView(view, {temp_id: flowId}));
                    if (ques.length > 0) {
                        DS.getView('config/questionnaire/question_list_item', function (view) {
                            var listPane = $("#config_questionnaire_ques_list");
                            for (var i = 0; i < ques.length; i++) {
                                listPane.append(DS.renderView(view, ques[i]));
                            }
                        });
                    }
                });
            }
        });
    },
    showQuesDetail: function (data, src) {
        var _id = data;
        var action = {
            action: "config.questionnaire.getQuesById",
            data: {_id: _id}
        }
        DS.send(action, function (response) {
            if (response.success) {
                var ques = response.data;
                var tempData = getCache("questionnaireTemp",ques.temp_id);
                ques.tempType = tempData.type;
                DS.getView("config/questionnaire/update_question", function (view) {
                    var pane = $("#config_question_detail");
                    pane.empty();
                    var fields = getCache("questionnaireField");
                    var resultFields = [];
                    for(var i=0; i<fields.length; i++){
                        if(fields[i].temp_id == ques.temp_id){
                            resultFields.push(fields[i]);
                        }
                    }
                    ques.fields = resultFields;
                    var render = template.compile(view);
                    pane.append(render(ques));
                    var anws = ques.anws || [];
                    if (anws.length > 0) {
                        DS.getView('config/questionnaire/add_question_ans', function (view) {
                            var pane = $("#add_ques_ans_pane");
                            var ques = getCache("questionnaireQues");
                            var tempId = session.questionnaire.currentTemp;
                            var tempQues = [];
                            for(var i=0 ;i < ques.length;i++){
                                if(ques[i].temp_id == tempId){
                                    tempQues.push(ques[i]);
                                }
                            }
                            var render = template.compile(view);
                            for (var i = 0; i < anws.length; i++) {
                                var nowTime = new Date().getTime() + Math.random();
                                var renderData = {
                                    type : tempData.type || "dynamic",
                                    index : nowTime,
                                    answer: anws[i].answer,
                                    _id : anws[i]._id || "",
                                    ques : tempQues
                                };
                                pane.append(render(renderData));
                                var select = pane.find("select[name='next" + nowTime + "']");
                                select.val(anws[i].next);
                            }
                        });
                    }
                });
            } else {
                $().alertmessage("showWarning", response.message);
            }
        });

    },
    delTempQues:function(data, src){
        if(!handler.config.questionnaire.checkIsUsed(handler.config.questionnaire.delTempQues,arguments)){
            return false;
        }
        if(!confirm('确认要删除该问题么？'))return;
        var action = {
            action: "config.questionnaire.delTempQues", //queryQuestionnaireQues
            data: {_id: data}
        };
        DS.send(action, function (response) {
            if (response.success) {
                $().alertmessage("showSuccess","删除模板问题成功");
                //重新刷新问题缓存
                refreshCacheFromDb("questionnaireQues");
                $(src).closest(".ques_item_row").remove();
                //查看是否是正在修改
                $("#config_question_detail").find("#"+data).remove();
            }else{
                $().alertmessage("showError", response.message);
            }
        });
        return false;
    },
    showAddQuestion: function (data, src) {
        DS.getView('config/questionnaire/add_question', function (view) {
            var pane = $("#config_question_detail");
            pane.empty();
            var tempId = session.questionnaire.currentTemp;
            var tempData = getCache("questionnaireTemp",tempId);
            //var action = {
            //    action: "config.questionnaire.queryQuestionnaireFields",
            //    data: {temp_id: tempId}
            //};
            //DS.send(action, function (response) {});
            var fields = getCache("questionnaireField");
            var resultFields = [];
            for(var i=0; i<fields.length; i++){
                if(fields[i].temp_id == tempId){
                    resultFields.push(fields[i]);
                }
            }
            tempData.fields = resultFields;
            var render = template.compile(view);
            pane.html(render(tempData));
        });
    },

    insertFieldVariable: function(data, src){
        var context = $("#config_question_detail").find("textarea[name=context]");
        context.val(context.val()+"${"+data+"}");

    },
    saveQuestionnaireQues: function (data, src) {
        if(!handler.config.questionnaire.checkIsUsed(handler.config.questionnaire.saveQuestionnaireQues,arguments)){
            return false;
        }
        data = data || {};
        var anws = [];
        for (var i in data) {
            if (utils.startWith(i, "answer")) {
                var next = i.replace("answer", "next");
                var _id = i.replace("answer","_id");
                anws.push({answer: data[i], next: data[next] || '',_id:data[_id]});
                delete data[i];
                delete data[next];
                delete data[_id];
            }
        }
        data.anws = anws;
        data.temp_id = session.questionnaire.currentTemp;

        var action = {
            action: "config.questionnaire.addQuestionnaireQues",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                $("#config_question_detail").empty();
                handler.config.questionnaire.showConfigQuestionnaireDetail(data.temp_id, src);
                addCache("questionnaireQues",response.data);
                refreshCacheFromDb("questionnaireQues");
            } else {
                alert(response.message);
            }
        });

    },
    showAddQuesAns: function (data, src) {
        DS.getView('config/questionnaire/add_question_ans', function (view) {
            var pane = $("#add_ques_ans_pane");
            var ques = getCache("questionnaireQues");
            var tempId = session.questionnaire.currentTemp;
            var tempQues = [];
            for(var i=0 ;i < ques.length;i++){
                if(ques[i].temp_id == tempId){
                    tempQues.push(ques[i]);
                }
            }
            var nowTime = new Date().getTime();
            var renderData = {
                type : data,
                index : nowTime,
                answer : "",
                ques : tempQues
            };
            var render = template.compile(view);
            pane.append(render(renderData));
//            view = view.replace(/__index/g, nowTime);
//            view = view.replace(/__answer/g, "");
//            pane.append(view);
//            var select = pane.find("select[name='next" + nowTime + "']");
//            for (var i = 0; i < ques.length; i++) {
//                select.append($("<option value='" + ques[i]._id + "'>" + ques[i].name + "</option>"));
//            }
        });
    },
    reduceQuesAns: function (data, src) {
        $(src).closest(".row_item").remove();
    },
    showQuestionnaireFieldConfig: function (data, src) {
        handler.config.questionnaire.doSelectQuestionnaireTab(data);
        DS.getView("config/questionnaire/config_questionnaire_fields", function (view) {
            var pane = $("#config_questionnaire_content_container");
            pane.empty();
            pane.html(view.replace(/__flow_id/g, data));
            handler.config.questionnaire.refreshQuestionnaireField({temp_id: data});
            $("#config_questionnaire_content_container").find("li").removeClass("active");

        });
    },
    showAddQuestionnaireField: function (data, src) {
        DS.getView("config/questionnaire/add_config_questionnaire_field", function (view) {
            var pane = $("#config_questionnaire_fields_option_container");
            pane.empty();
            pane.html(template.compile(view)({}));
        });
    },
    saveQuestionnaireFields: function (data, src) {
        var action ;
        if(data._id){
            action = {
                action: "config.questionnaire.updateQuestionnaireFields",
                data: data
            }
        } else {
            data.temp_id = session.questionnaire.currentTemp;
            action = {
                action: "config.questionnaire.addQuestionnaireFields",
                data: data
            };
        }

        DS.send(action, function (response) {
            if (response.success) {
                $("#config_questionnaire_fields_option_container").empty();
                var src = $("#config_questionnaire_fields_option_container").find("li.active").find("a");
                handler.config.questionnaire.queryQuestionnaireField({}, src);
            } else {
                alert(response.message);
            }
        });
    },
    queryQuestionnaireField: function (data, src) {
        var querydata = getDataOfForm($("#config_questionnaire_fields_table_form"));
        querydata = querydata.data;
        querydata.page = src.val() || 1;
        querydata.limit = 10;
        handler.config.questionnaire.refreshQuestionnaireField(querydata);
    },
    refreshQuestionnaireField: function (data, src) {
        data = data || {};
        var action = {
            action: "config.questionnaire.queryQuestionnaireFields",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var tmp = "<tr><td><span class='text-overflow'>__name</span></td><td><span class='text-overflow'>__desc</span></td>" +
                    "<td><a href='#' class='ds_do_action' ds_action='config.questionnaire.showUpdateQuestionnaireFields' ds_data='__id'>修改</a></td></tr>";
                var html = "";
                var fields = response.list || [];
                // refreshCache("businessFlowField", fields);//没找到哪里需要更新工单缓存，先注释掉
                refreshCacheFromDb("questionnaireField");//用于更新缓存
                for (var i = 0; i < fields.length; i++) {
                    var fieldsItem = fields[i];
                    html += render.replaceDataByObject(fieldsItem, tmp);
                }
                $("#config_questionnaire_fields_table").find("tbody").html(html);

                var count = response.count;
                $("#config_questionnaire_fields_table_pagination").find(".pagination").find(".result_count").text(count);
                var list = $("#config_questionnaire_fields_table_pagination").find(".pagination").find("li");
                updatePagination(list, count, data.limit || 10, data.page || 1);


                //绑定输入框的回车事件
                $("#config_questionnaire_fields_table_form").find(":text").off("keyup");
                $("#config_questionnaire_fields_table_form").find(":text").keyup(function(event){
                    var src = $(event.currentTarget);
                    if(event.keyCode == 13){
                        $("#config_questionnaire_fields_table_form").find("a.ds_form_action").click();
                    }
                });
            }
        });
    },
    showUpdateQuestionnaireFields : function(data,src){
        var field = getCache("questionnaireField", data);
        var action = {
            action : "config.questionnaire.getQuestionnaireFieldById",
            data :{_id : data}
        };
        DS.send(action,function(response){
            if(response.success){
                DS.getView('config/questionnaire/add_config_questionnaire_field', function (view) {
                    field = response.data || {};
                    field.viewOption = 'update';
                    var pane = $("#config_questionnaire_fields_option_container");
                    pane.empty();
                    pane.html(template.compile(view)(field));
                });
            } else{
                $().alertmessage("showError", response.message);
            }
        });

    },
    showStopQuestionnaireTemp : function(data , src){
        DS.getView('config/questionnaire/stop_questionnaire_temp', function (view) {
            var pane = $('#stopQuestionnaireTempModal');
            pane.empty();
            var action = src.text().trim();
            console.log(action);
            var renderData = {
                _id : data,
                action : action
            };
            refreshCacheFromDb("questionnaireTemp");
            pane.html(template.compile(view)(renderData));
        });
    },
    showStartQuestionnaireTemp : function (data , src){
        DS.getView('config/questionnaire/stop_questionnaire_temp', function (view) {
            var pane = $('#stopQuestionnaireTempModal');
            pane.empty();
            var action = src.text().trim();
            console.log(action);
            var renderData = {
                _id : data,
                action : action
            };
            pane.html(template.compile(view)(renderData));
        });
    },
    changeStatusQuestionnaireTemp : function (data,src){
        var action = src.attr("action");
        data = {_id: data};
        if (action == "停用") {
            data.status = "disable";
        } else {
            data.status = "enable";
        }
        var aciton = {
            action: "config.questionnaire.changeStatusQuestionnaireTemp",
            data: data
        };
        DS.send(aciton, function (response) {
            if (response.success) {
                $('#stopQuestionnaireTempModal').modal('hide');
                var flow = response.data;
                $(".nav_business_dropdown_flow[ds_data='" + flow._id + "']").find("span").removeClass("enable").removeClass("disable").addClass(flow.status);
                refreshCacheFromDb("questionnaireTemp");
                if (flow.status == 'enable') {
                    $("#config_questionnaire_stopAndStart_operate").text("停用");
                } else {
                    $("#config_questionnaire_stopAndStart_operate").text("启用");
                }
            }
        });
    },
    /**
     * 用来修改模板时检测是否模板已经被使用过了
     * noCheck 用来进行流程控制
     * return 是否直接通过 true直接通过 false通过回调调用
     */
    checkIsUsed:function(callback,arg){
        var $li = $("#config_questionnaire_nav_tabs .active");
        var temp_id = $li.attr("id");
        var isUsed = $li.attr("isUsed");
        var noCheck = $li.attr("noCheck");
        var next = function(){
            if(arg.length<1){
                callback();
            }else if(arg.length<2){
                callback(arg[0]);
            }else if(arg.length<3){
                callback(arg[0],arg[1]);
            }else if(arg.length<4){
                callback(arg[0],arg[1],arg[2]);
            }
        }
        var dealFunction = function (isU){
            $li.attr("noCheck","true");
            if(isU){
                if(confirm("该模板已经被使用，如果修改可能影响已导入的问卷记录，您确定修改吗")){
                    next();
                }
            }else{
                next();
            }
            $li.attr("noCheck","false")
        }
        if(noCheck != "true"){
            //返回是否已经验证过
            if(isUsed == "true"){
                dealFunction(true);
            }else if(isUsed == "false"){
                dealFunction(false);
            }else {
                var action = {
                    action: "config.questionnaire.checkTempIsUsed",
                    data: {temp_id:temp_id}
                };
                DS.send(action, function (response) {
                    if (response.success) {
                        var isUsed = response.isUsed;
                        $li.attr("isUsed",isUsed);
                        dealFunction(isUsed);
                    }else{
                        $().alertmessage('showError', errMsg);
                    }
                });
            }
            return false;
        }else{
            return true;
        }
    }



}


handler.config.questionnaire.import = {
    curSubMenu:"",
    pageSize: 10,
    ques_import: function (menu) {
        handler.config.questionnaire.import.searchQuestionImport(null, $('#import_list_' + menu).find('.contacts_caption'));
    },
    searchQuestionImport: function (data, src) {
        var pane = src.closest('.ds_search_pane');
        pane.attr('ds_index', '1');
        var index = 1;
        var query = getSearchCondition(pane);
        handler.config.questionnaire.import._queryQuestionImport(index, query.data, query.queryDisplay, pane);
    },
    _queryQuestionImport: function (index, query, queryDisplay, pane) {
        var menu = pane.attr('ds_menu');
        var action = {
            action: 'app.questionnaire.queryQuestionTask',
            data: {
                query: query,
                queryType: menu,
                option: {
                    index: index,
                    pageSize: handler.config.questionnaire.import.pageSize
                }
            }
        };
        var listPane = pane.find('.list-inside');
        handler._setSearchCondition(query,pane);
        DS.send(action, function (response) {
            if (response.success) {
                renderSearchResult(pane, index, handler.config.questionnaire.import.pageSize, query, queryDisplay, response);
                var contacts = response.list;
                //记录总数
                if(pane.find(".pagination .result_count").length>0){
                    pane.find(".pagination .result_count").text(response.count);
                }else{
                    pane.append('<span class = "pagination" style = "display:none"><span class = "result_count">'+response.count+'</span></span>');
                }
                if (contacts.length > 0) {
                    for (var i in contacts) {
                        listPane.append(pane.find('#tmpl_task_item').tmpl(contacts[i]));
                    }
                    var collapsePane = pane.find('.search.collapse');
                    if (collapsePane.hasClass('in'))
                        collapsePane.collapse('hide');
                }
            } else {
                $().alertmessage('showError', errMsg);
            }
        });
    },
    moreQuestionImport: function (data, src) {
        var pane = src.closest('.ds_search_pane');
        var index = parseInt(pane.attr('ds_index')) + 1;
        var query = getSearchCondition(pane);
        handler.config.questionnaire.import._queryQuestionImport(index, query.data, query.queryDisplay, pane);
    },
    addImpTask: function (menu, src) {
        var pane = $("#questionnaire_import_pane");
        DS.getView('config/questionnaire/import/ques_import_add', function (view) {
            pane.empty();
            pane.html(view);
            var type = pane.find("select[name='dbType']");
            type.change(function () {
                var v = $(this).val();
                if (!v)return;
                var heads = pane.find("input[name='xlsHeads']").val();
                heads = eval(heads);
                var html = handler.config.questionnaire.import.xlsRelation(v, heads);
                var pane2 = pane.find("#import_question_relations_container");
                pane2.html(html);
            });

        });
    },
    _copyCustomFields: function (customFields) {
        var fields = [];
        for (var i = 0; i < customFields.length; i++) {
            var row = customFields[i];
            fields.push(row);
        }
        return fields;
    },
    xlsRelation: function (dbType, heads) {
        var relations = {};
        var tmplFields = [];
        var cache = getCache("questionnaireField") || [];
        for (var i = 0; i < cache.length; i++) {
            var cacheItem = cache[i];
            if (cacheItem.temp_id == dbType) {
                tmplFields.push(cacheItem);
            }
        }
        var field2 = handler.config.questionnaire.import._copyCustomFields(tmplFields);
        console.dir(field2)
        for (var i = 0; i < field2.length; i++) {
            var _item = field2[i];
            var _key = _item._id;
            if (_key.indexOf("_name") != -1) {
                relations["name"] = _item.name;
            } else if (_key.indexOf("_phone") != -1) {
                relations["phone"] = _item.name;
            } else {
                relations[_key] = _item.name;
            }
        }
//        handler.customer.dicFields=dics;
        var html = ["<table class='table table-bordered table-striped table-hover'>"];
        html.push("<tr><th>excel表头</th><th>问卷字段</th><th>excel表头</th><th>问卷字段</th></tr>");
        for (var j = 0; j < heads.length; j++) {
            var tmplsHeads = ["<option value=''>---请选择---</option>"];
            for (var key in relations) {
                if (relations[key] == heads[j]) {
                    tmplsHeads.push("<option selected value='" + key + "'>" + relations[key] + "</option>")

                } else {
                    tmplsHeads.push("<option value='" + key + "'>" + relations[key] + "</option>")
                }
            }
            if (j % 2 == 0) {
                if (j == heads.length - 1) {
                    html.push("<tr><td>" + heads[j] + "</td><td><select name='heads[]'>" + tmplsHeads.join("") + "</select></td><td colspan='2'>&nbsp;</td></tr>");
                } else {
                    html.push("<tr><td>" + heads[j] + "</td><td><select name='heads[]'>" + tmplsHeads.join("") + "</select></td>");
                }

            } else {
                html.push("<td>" + heads[j] + "</td><td><select name='heads[]'>" + tmplsHeads.join("") + "</select></td></tr>");
            }
        }
        html.push("</table>");

        return html.join("");
    },
    importQuestionData: function (data, src) {
        //去掉判断模板是否被使用的缓存
        $("[isused]").attr("isused","");
        //
        if (!data.dbType) {
            $().alertmessage('showError', "必须选择一个模板");
            return;
        }
        data.dic = {};
        data.flag = "start";
        data.batchRemark = data.batchRemark == '添加批次说明' ? '' : data.batchRemark;
        var hasName = 0;
        for (var i = 0; i < data.heads.length; i++) {
            var field = data.heads[i];
            if (field == 'name') {
                hasName = 1;
            }
        }
        if (!hasName) {
            $().alertmessage('showError', "导入客户字段必须包括姓名,请检查关联关系!");
            return false;
        }
        var action = {
            action: 'app.questionnaire.import',
            data: data
        };
        DS.send(action, function (rep) {
            if (rep.success) {
//                alert("导入任务已提交！");
                $("#questionnaire_import_pane").empty();
                dsevent.publish(dsevent.evt.importQuestion, rep.row);
            } else {
                $().alertmessage('showError', rep.message || errMsg);
            }
        });
    },
    uploadSucess: function (evt) {
//       console.log(evt.target.responseText);
        var rep = $.parseJSON(evt.target.responseText);
        if (rep && !rep.success) {
            $().alertmessage('showError', "上传文件失败，请检查网络或文件是否正确");
            return;
        }
        var fileName = rep.filePath.substring(rep.filePath.lastIndexOf("/") + 1);
        var trueName = rep.fileName;
        handler.config.questionnaire.import.getXlsHeads(trueName, fileName);
    },
    uploadError: function (evt) {
        $().alertmessage('showError', "上传失败");
    },
    getXlsHeads: function (trueName, fileName) {
        var pane = $("#questionnaire_import_pane");
        var action = {
            action: 'app.questionnaire.getXlsHeads',
            data: {
                trueName: trueName,
                fileName: fileName
            }
        };
        DS.send(action, function (response) {
            if (response.success) {
                pane.find("input[name='fileName']").val(fileName);
                pane.find("input[name='trueName']").val(trueName);
                pane.find("input[name='xlsHeads']").val($.toJSON(response.heads));
                handler.config.questionnaire.import.initImportInfo();
                pane.find("#cust_imp_baseinfo").show();
            } else {
                $().alertmessage('showError', response.message || errMsg);
            }
        });
    },
    initImportInfo: function () {
        var pane = $("#questionnaire_import_pane");
        var type = pane.find("select[name='dbType']");
        type.empty();
        handler.config.questionnaire.import.getQuestionDbType(type.get(0), null, null, 1);
        var dt = type.val();
        type.change();
        var time = getDateNo();
        pane.find("input[name='batchNo']").val(time);
        pane.find("input[name='batchRemark']").keyup(function(e){
            if(e.which == 32){
                $(this).val($(this).val().replace(/\s/g,''));
            }
        })

    },
    getQuestionDbType: function (obj, src, /*default*/val, /*0 or 1*/selected) {
        var tmls = getCache('questionnaireTemp');
        var ary = [];
        for (var i = 0; i < tmls.length; i++) {
            var item = tmls[i];
            if (item.status == 'enable') {
                ary.push({k: item._id, n: item.name});
            }
        }
        handler.config.questionnaire.import.generateOptions(obj, ary, val, selected);
    },
    generateOptions: function (obj, ary, val, selected) {
        if ($.isArray(ary)) {
            var len = ary.length;
            for (var i = 0; i < len; i++) {
                var o = document.createElement("OPTION");
                obj.options.add(o);
                o.innerText = ary[i].n;
                o.value = ary[i].k;
                if (val) {
                    if (o.value == val)
                        o.selected = true;
                } else {
                    if (!selected) {
                        if (i == 0) o.selected = true;
                    }
                }

                if (len == 1) o.selected = true;
            }
        } else {
            for (var key in ary) {
                var o = document.createElement("OPTION");
                obj.options.add(o);
                o.innerText = ary[key];
                o.value = key;
                if (val) {
                    if (o.value == val)
                        o.selected = true;
                } else {
                    if (!selected) {
                        if (i == 0) o.selected = true;
                    }
                }

                if (len == 1) o.selected = true;
            }
        }
    },
    showImportTask: function (batchNo, src) {
        var pane = $("#questionnaire_import_pane");
        DS.getView("config/questionnaire/import/ques_task_import", function (view) {
            pane.html(view);
            var _id = $(src).find(".contact_item [name=pk]").val();
            pane.find(".contact_summary").attr("_id",_id);
            pane.find("input[name='batchNo']").val(batchNo);
            handler.config.questionnaire.import.loadTaskImpList(batchNo);
        });
    },
    loadTaskImpList: function (data, src) {
        console.log(data);
        var batchNo = data;
        if (typeof data == 'object') {
            batchNo = data.batchNo
        }
        var pane2 = $("#questionnaire_import_pane");
        var page = 1;
        if (src && !src.hasClass("ds_do_action"))page = src.val();
        if (!page)page = 1;
        var pane = pane2.find("#task_import_list_pane");
        var action = {
            action: 'app.questionnaire.queryQuestionTaskImport',
            data: {batchNo: batchNo, page: page}
        };
        DS.send(action, function (response) {
            if (response.success) {
                pane.html("");
                var list = response.list;
                var count = response.count;
                for (var i in list) {
                    pane.append($("#tmpl_taskimport_question_item").tmpl(list[i]));
                }
                var frmId = "question_import_query_frm";
                DS.updatePagination(frmId, count, handler.config.questionnaire.import.pageSize, page);
            } else {
                $().alertmessage('showError', errMsg);
            }
        });
    },
    showFieldDesc: function (type, val) {
        var desc = '';
        if (type == 'status') {
            if (val == "uncomplete") {
                desc = '待回访';
            } else {
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
    /**
     * 准备删除导入记录
     * @param key
     * @param src
     * @returns {boolean}
     */
    confirmRemoveQuesTask:function (data,src){
        var menu = data;
        //计算选中条数
        var leftPane=$('#import_list_'+menu);
        var toolbarPane=$("#pane_deal_list");
        var checkPane=leftPane.find(".list_check_all");
        var num=toolbarPane.find(".bottom_toolbar_selsize_num").text();
        num=parseInt(num,10)||0;
        if(num<=0){
            $().alertmessage('showError', "请至少选择一条进行操作！");
            return;
        }
        var isAll=checkPane.hasClass("select_on")?"1":"0";
        var view="<p>&nbsp;&nbsp;您搜索到客户数据共<strong style='color: red;'>"+num+"</strong>条，删除后将不可恢复，确认要删除吗？</p>";
        if(num>10000){
            view="<p>&nbsp;&nbsp;您搜索到客户数据共<strong style='color: red;'>"+num+"</strong>条，总数已大于1万条，为减少您的等待，系统将启用后台服务异步删除，删除的过程中您可以进行其他操作，确认要删除吗？</p>";
        }
        var p=$('#confirm_modalBox');
        p.find('.modal-title').text('第一次确认');
        p.find(".btn-primary.ds_do_action").text('确认');
        p.find(".modal-body").html(view);

        //if(num>500){
        //    p.find(".ds_do_action").attr({"ds_action":"customer.confirmDelCustAgain","ds_data":menu})
        //}else{
            p.find(".ds_do_action").attr({"ds_action":"config.questionnaire.import.removeQuesTask","ds_data":isAll});
        //}
        p.width(500);
        p.modal();
    },
    /**
     * 删除导入记录
     * @param key
     * @param src
     * @returns {boolean}
     */
    removeQuesTask:function(isAll, src){
        if (src.hasClass("disabled")) return false;
        src.addClass("disabled");
        var leftPane=$('#import_list_'+"questionnaire_import");
        var rightPane = $('#view_questionnaire_import').find('#questionnaire_import_pane');
        var toolbarPane=$("#pane_deal_list");
        var num=toolbarPane.find(".bottom_toolbar_selsize_num").text();
        num=parseInt(num,10)||0;
        var p=$('#confirm_modalBox');

        var query = handler._getSearchCondition(leftPane,isAll);
        var action={
            action:'app.questionnaire.removeQuesTask',
            data:query
        };
        DS.send(action,function(rep){
            if(rep.success){
                p.find('.modal-title').text('确认操作');
                p.find(".btn-primary.ds_do_action").text('确认');
                p.modal("hide");
                $().alertmessage('showSuccess', "删除导入记录成功");
                //重新加载
                leftPane.find(".refresh").click();
                handler.cancelDealToolbar("ques_task",null);
                //如果右边的是被删除的，删除右边
                var idlist = [];
                var rightId = rightPane.find(".contact_summary").attr("_id");
                if(query && query._id && query._id.$in ){
                    idlist=  query._id.$in;
                }
                if(idlist && idlist.length>0 && idlist.indexOf(rightId)>-1){
                    rightPane.empty();
                }
            }else{
                $().alertmessage('showError', rep.message);
            }
            src.removeClass("disabled");
        });
    }
}
