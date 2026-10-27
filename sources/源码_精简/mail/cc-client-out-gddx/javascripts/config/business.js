session.business = {};
handler.config.business = {
    pageSize : 10,
    config_business : function(id){
        handler.config.business.showBusinessConfig_page(null,null);
    },
    showBusinessConfig_page: function (page, selectId) {
        DS.getView('config/business/config_business_dev', function (view) {
            var pane = $('#view_task_config');
            pane.empty();
            pane.html(view);
            var action = {
                action: "config.business.queryAccountBusinessFlow",
                data: {}
            };
            DS.send(action, function (response) {
                if (response.success) {
                    var flows = response.data;
                    var navtabs = $("#config_business_nav_tabs");
                    var temp = "<li class='dropdown' id='__id'><a href='#' class='dropdown-toggle nav_business_dropdown_flow' data-toggle='dropdown' ds_action='config.business.doSelectBusinessTab' ds_data='__id'>" +
                        "<span class='__status'>__name</span> <b class='caret'></b></a><ul class='dropdown-menu'><li>" +
                        "<a href='#' class='ds_do_action' ds_data='__id' ds_action='config.business.showConfigBusinessDetail'>流转配置</a></li>" +
                        "<li><a href='#' class='ds_do_action' ds_data='__id' ds_action='config.business.showBusinessFlowFieldConfig'>字段定义</a> </li>" +
                        "<li><a href='#' class='ds_do_action' ds_data='__id' ds_action='config.business.showBusinessFlowInfoConfig'>信息配置</a></li>" +
                        "</ul></li>";
                    for (var i = 0; i < flows.length; i++) {
                        var html = render.replaceDataByObject(flows[i], temp);
                        navtabs.append(html);
                    }
                    var html = "<li><a href='#addBusinessFlowModal' data-toggle='modal' class='ds_do_action' ds_action='config.business.showAddBusinessFlow'><span><i class='icon-plus'></i>添加流程</span></a></li>";
                    navtabs.append(html);
                    if (selectId) {
                        $("#config_business_nav_tabs").find("li#" + selectId).find("a:first").click();
                        $("#config_business_nav_tabs").find("li#" + selectId).find("ul a:first").click();
                    } else {
                        $("#config_business_nav_tabs li:first a:first").click();
                        $("#config_business_nav_tabs li:first ul a:first").click();
                    }
                    resize();
                }
            });
        });
    },
    getBusinessFlowStatus: function (status) {
        if (status == 'enable') {
            return "停用";
        } else {
            return "启用";
        }
    },
    getObjectDataByid: function (data, id) {
        data = data || [];
        for (var i = 0; i < data.length; i++) {
            if (data._id == id)
                return data[i];
        }
        return null;
    },
    doSelectBusinessTab: function (data) {
        $("li#" + data).find("a:first").tab("show");
//        src.tab("show");
        session.business.currentBusinessFlow = data;
    },
    showConfigBusinessDetail: function (data, src) {
        handler.config.business.doSelectBusinessTab(data);
        var flowId = data;
        var action = {
            action: "config.business.queryBusinessFlowSteps",
            data: {flow_id: flowId}
        };
        DS.send(action, function (response) {
            if (response.success) {
                var steps = response.data;
                session.business.currentFlowSteps = steps;
                session.business.currentFlowInfo  = response.flowInfo;
                DS.getView('config/business/config_business_detail_dev', function (view) {
                    var pane = $("#config_business_content_container");
                    pane.html(view);
                    pane = $("#config_business_detail_nav_pane");
                    session.business.currentBusinessFlow = flowId;
                    var temp = "<li><a class='ds_do_action' ds_action='config.business.showConfigBusinessFlowStep' ds_data='__id'><i class='icon-chevron-right'></i>__name</a></li>";
                    for (var i = 0; i < steps.length; i++) {
                        var html = render.replaceDataByObject(steps[i], temp);
                        pane.append(html);
                    }
                    pane.find("li a:first").click();
                });
            }
        });
    },
    showConfigBusinessFlowStep: function (data, src) {
        DS.getView("config/business/config_business_step_detail", function (view) {

            var stepId = data;
            var action = {
                action: "config.business.queryBusinessFlowStep",
                data: {_id: stepId}
            };

            DS.send(action, function (response) {
                if (response.success) {
                    var step = response.data;
                    if(response.lastStepFields){//当前工单上一步字段
                        session.business.currentLastStepFields = response.lastStepFields;
                    }else{
                        session.business.currentLastStepFields = null;
                    }
                    session.business.currentBusinessFlowStep = step;
                    $("#config_business_detail_content_container").html(view);
                    $("#config_business_step_nav_tabs li:first a").click();
                }
            });
        });


    },
    showBusinessConfig_page_bak: function () {
        session.business = {};
        DS.getView('config/business/config_business', function (view) {
            var pane = $('#config_business');
            pane.empty();
            pane.html(view);
            var action = {
                action: 'config.business.queryAccountBusinessFlow'
            };
            DS.send(action, function (response) {
                if (response.success) {
                    var items = response.data;
                    var navItems = "";
                    var nav = pane.find('#config_business_nav_pane')
                    for (var i in items) {
                        var item = items[i];
                        navItems += '<li><a class="action" ds_action="config.business.showBusinessFlow" ds_data="' + item._id + '">' +
                            '<i class="icon-chevron-right"></i>' + item.name + '</a></li>';
                    }
                    nav.append(navItems);
                    nav.find('li a:first').click();
                    resize();
                }
            });

        });
    },
    showAddBusinessFlow_dev: function (data, src) {
        DS.getView('config/business/add_business_flow', function (view) {
            var pane = $('#addBusinessFlowModal');
            pane.empty();
            pane.html(view);
        });
    },
    showAddBusinessFlow: function (data, src) {
        DS.getView('config/business/add_business_flow', function (view) {
            var pane = $('#addBusinessFlowModal');
            pane.empty();
            pane.html(view);
        });
    },
    addBusinessFlow: function (data, src) {
        var action = {
            action: "config.business.addBusinessFlow",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var addFlow = response.data;
                $('#addBusinessFlowModal').modal('hide');
                handler.config.business.showBusinessConfig_page(null, addFlow._id);
            } else {
                alert(response.message);
            }
        });

    },
    showBusinessFlow: function (data, src) {
        session.business.currentBusinessFlow = data;
        DS.getView('config/business/business_flow_detail', function (view) {
            var pane = $('#config_business_flow_pane');
            pane.empty();
            var html = view.replace(/__id/g, data);
            pane.html(html);

            DS.getView('config/business/business_flow_step_list', function (view) {

                var action = {
                    action: 'config.business.queryBusinessFlowSteps',
                    data: {flow_id: data}
                };
                DS.send(action, function (response) {
                    if (response.success) {
                        pane = $('#steplist_item');
                        pane.empty();
                        var steps = response.data;
                        session.business.currentFlowSteps = steps;
                        for (var i = 0; i < steps.length; i++) {
                            var step = steps[i];
                            var html = render.replaceDataByObject(step, view);
                            pane.append(html);
                        }
                    }
                });
            });
        });
    },
    showAddBusinessFlowStep: function (data, src) {
         DS.getView('config/business/add_business_flow_step', function (view) {
            var pane = $('#addBusinessFlowStepModal');
            pane.empty();
            var flowObj = session.business.currentFlowInfo;
            var taskTime = '';
            if(flowObj.ctype&&flowObj.ctime){
                taskTime =  handler.business.taskTimeAll(flowObj.ctype,flowObj.ctime);
            }
            taskTimeHtml = taskTime?('(<strong style="color:red">'+taskTime+'</strong>)'):"";
            var html = view.replace(/__id/g, session.business.currentBusinessFlow).replace(/__taskTime/g,taskTimeHtml);
            pane.html(html);
        });
    },
    addBusinessFlowStep: function (data, src) {
        var action = {
            action: 'config.business.addBusinessFlowStep',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var step = response.data;
                //add to cache
                session.business.currentFlowSteps.push(step);
                var temp = "<li><a class='ds_do_action' ds_action='config.business.showConfigBusinessFlowStep' ds_data='__id'><i class='icon-chevron-right'></i>__name</a></li>";
                var html = render.replaceDataByObject(step, temp);
                var pane = $("#config_business_detail_nav_pane");
                pane.append(html);
                $('#addBusinessFlowStepModal').modal('hide');
                pane.find("li a[ds_data='" + step._id + "']").click();

            }
        });
    },
    updateBusinessFlowStep: function (data, src) {
        data._id = session.business.currentBusinessFlowStep;
        data.custom_fields = session.business.currentEidtFlowStep.custom_fields;
        var action = {
            action: 'config.business.updateBusinessFlowStep',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                $().alertmessage('showSuccess', "保存成功！");
            }
        });
    },

    addBusinessStepAction: function (data, src) {
        if (data.actionFields) {
            var fields = data.actionFields;
            delete data.actionFields;
            var proFields = [];
            for (var i = 0; i < fields.length; i++) {
                proFields[i] = $.parseJSON(fields[i]);
            }
            data.actionFields = proFields;
        }
        data._id = session.business.currentEidtFlowStep._id;
        var action = {
            action: "config.business.addBusinessStepAction",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                alert("添加动作成功！");
            }
        });
    },
    cancelAddBusinessStepAction: function (data, src) {
        $('#add_business_action_pane_content').empty();
        $('#add_business_action_pane_link').show();
    },

    showBusinessFlowStepDetail: function (data, src) {
        session.business.currentBusinessFlowStep = data;
        session.business.currentEidtFlowStep = {};
        DS.getView('config/business/business_flow_step_detail_dev', function (detailView) {
            var pane = $('#flow_step_detail');
            pane.empty();
            var action = {
                action: "config.business.queryBusinessFlowStep",
                data: {
                    _id: data,
                    flow_id: session.business.currentBusinessFlow
                }
            };
            DS.send(action, function (response) {
                if (response.success) {
                    DS.getView('config/business/business_field_item', function (view) {
                        var step = response.data;
                        session.business.currentEidtFlowStep = step;
                        var html = render.replaceDataByObject(step, detailView);
                        pane.html(html);

                        var fields = step.stepFields || [];
                        pane = $('#business_fields_pane');
                        for (var i = 0; i < fields.length; i++) {
                            var html = render.replaceDataByObject(fields[i], view);
                            pane.append(html);
                        }
                        DS.getView('config/business/business_action_field_item', function (view) {
                            var itemView = view;
                            DS.getView('config/business/business_action_update', function (view) {
                                pane = $('#flow_step_action');
                                var actions = step.actions || [];
                                for (var i = 0; i < actions.length; i++) {
                                    html = render.replaceDataByObject(actions[i], view);
                                    pane.append(html);
                                    //  $('#collapse' + actions[i]._id).collapse('hide');
                                    var actionFields = actions[i].actionFields || [];
                                    for (var m = 0; m < actionFields.length; m++) {
                                        var fieldsHtml = render.replaceDataByObject(actionFields[m], itemView);
                                        $('#action_fields_pane' + actions[i]._id).append(fieldsHtml);
                                    }
                                }

                            });
                        });

                    });
                }
            });

        });
    },
    showAddBusinessAction: function (data, src) {
        DS.getView('config/business/business_action_add', function (view) {
            src.hide();
            var pane = src.parent().find('#add_business_action_pane_content');
            pane.empty();
            var html = view.replace(/__id/g, data);
            pane.html(html);
        });
    },
    showAddActionField: function (data, src) {
        DS.getView('config/business/business_action_field_add', function (view) {
            src.hide();
            var pane = src.parent().find('#add_action_field_pane_content');
            pane.empty();
            var html = view.replace(/__id/g, data);
            pane.html(html);
        });
    },
    showAddBusinessField: function (data, src) {
        DS.getView('config/business/business_field_add', function (view) {
            src.hide();
            var pane = src.parent().find('#add_business_field_pane_content');
            pane.empty();
            var html = view.replace(/__id/g, data);
            pane.html(html);
        });
    },
    addBusinessField: function (data, src) {
        data._id = session.business.currentEidtFlowStep._id;
        var action = {
            action: "config.business.addBusinessStepField",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                data = response.data;
                DS.getView('config/business/business_field_item', function (view) {
                    handler.config.business.closeAddBusinessField();
                    var pane = $('#business_fields_pane');
                    var html = render.replaceDataByObject(data, view);
                    pane.append(html);
                });
            }
        });


    },
    deleteBusinessStepField: function (data, src) {
        var appdata = {
            _id: session.business.currentEidtFlowStep._id,
            fieldId: data
        };
        var action = {
            action: "config.business.deleteBusinessStepField",
            data: appdata
        }
        DS.send(action, function (response) {
            if (response.success) {
                $('#' + data).remove();
            }
        });
    },
    addBusinessActionField: function (data, src) {
        DS.getView('config/business/business_field_item', function (view) {
            handler.config.business.closeAddBusinessActionField();
            var pane = $('#add_action_fields_pane');
            var html = render.replaceDataByObject(data, view);
            pane.append(html);
            var select = $('#add_action_fields_value');
            select.append("<option value='" + $.toJSON(data) + "' selected></option>");
        });

    },
    closeAddBusinessField: function (data, src) {
        $('#add_business_field_pane_content').empty();
        $('#add_business_field_pane_link').show();
    },
    closeAddBusinessActionField: function (data, src) {
        $('#add_action_field_pane_content').empty();
        $('#add_action_field_pane_link').show();
    },
    plusCustomField: function (data, target) {
        var pane = target.closest("#field_attr_pane");
        var str = '<div class="row-select-box" style="position: relative;">' +
            '<a class="reduce action" ds_action="config.business.reduceCustomField" ds_data=""></a>' +
            '<input class="select-box" type="text" name="choices[]" maxlength="60" style="height: 17px;">' +
            '</div>';
        pane.append(str);
    },
    plusActionCustomField: function (data, target) {
        var pane = target.closest("#action_field_attr_pane");
        var str = '<div class="row-select-box" style="position: relative;">' +
            '<a class="reduce action" ds_action="config.business.reduceCustomField" ds_data=""></a>' +
            '<input class="select-box" type="text" name="choices[]" maxlength="60" style="height: 17px;">' +
            '</div>';
        pane.append(str);
    },
    reduceCustomField: function (data, target) {
        target.closest('.row-select-box').remove();
    },
    showConfigBusinessStepInfo: function (data, src) {
        DS.getView('config/business/config_business_step_info', function (view) {
            var flowObj = session.business.currentFlowInfo;
             var taskTime = '';
            if(flowObj.ctype&&flowObj.ctime){
                taskTime =  handler.business.taskTimeAll(flowObj.ctype,flowObj.ctime);
            }
            session.business.currentBusinessFlowStep.taskTime =taskTime?('(<strong style="color:red">'+taskTime+'</strong>)'):'';
            var html = render.replaceDataByObject(session.business.currentBusinessFlowStep, view);
            delete session.business.currentBusinessFlowStep.taskTime;
            var pane = $('#config_business_step_info');
            pane.empty();
            pane.html(html);

            var users = getCache("agents");
            var notifyUser = session.business.currentBusinessFlowStep.notifyUser;
            var ctype = session.business.currentBusinessFlowStep.ctype;
            var ctime = session.business.currentBusinessFlowStep.ctime;

            if(notifyUser){
                var html = "";
                var managersList = "";
                var managerPane = $("#config_business_step_info").find(".tabbox_agent_result");
                var uName = "";
                for(var m = 0;m<notifyUser.length;m++){
                    for(var i=0;i<users.length;i++){
                        var u = users[i];
                        if(u._id == notifyUser[m]){
                            uName = u.displayName;
                            break;
                        }
                    }
                    html = notifyUser[0]&&'<span userid="'+notifyUser[m]+'"><b class="delete_result">x</b>'+uName+'</span>';
                    managerPane.append(html);
                    if(m==notifyUser.length-1){
                        managersList += notifyUser[m];
                    }else{
                        managersList += notifyUser[m]+",";
                    }
                }
                pane.find("input[name='notifyUser']").val(managersList);
            }

            ctype&&pane.find("#stepCtype").find("option[value='"+ctype+"']").attr("selected",true);
            ctime&&pane.find("input[name='ctime']").val(ctime);
        });
    },
    showConfigBusinessStepFields: function (data, src) {
        DS.getView('config/business/config_business_step_fields', function (view) {
            var pane = $('#config_business_step_fields');
            pane.empty();
            pane.html(view);
            var action = {
                action: "config.business.queryAllBusinessFlowFields",
                data: {flow_id: session.business.currentBusinessFlow}
            };
            DS.send(action, function (response) {
                if (response.success) {
                    var fields = response.data || [];
                    fields = handler.config.business.processBusinessFlowFieldsStatus(fields);
                    var pane = $("#config_busienss_step_fields_pane");
                    var index = 0;
                    var finishInitFields = function () {
                        initDragable();
                        initContainer();

                        var step = session.business.currentBusinessFlowStep;
                        if(!step.stepFields){
                            step.stepFields = session.business.currentLastStepFields;
                        }else if(step.stepFields.length == 0 && session.business.currentLastStepFields){
                            step.stepFields = session.business.currentLastStepFields;
                        }
                        handler.config.business.displayConfigFields(step.stepFields, $("#business_step_fields_demo"), $("#config-business-field-sidebar"));

                    };
                    var initFields = function () {
                        if (index >= fields.length) {
                            finishInitFields();
                            return;
                        }
                        var fieldsItem = fields[index];
//                        if(fieldsItem.type == 'single'){
                        if (fieldsItem.type == 'dropdown' && fieldsItem.dic) {
                            var dic = getCache("options", fieldsItem.dic);
                            if (dic.cascade == 2) {
                                fieldsItem.type += "_2";
                                fieldsItem.dropname_1 = dic.headers[0];
                                fieldsItem.dropname_2 = dic.headers[1];

                            } else if (dic.cascade == 3) {
                                fieldsItem.type += "_3";
                                fieldsItem.dropname_1 = dic.headers[0];
                                fieldsItem.dropname_2 = dic.headers[1];
                                fieldsItem.dropname_3 = dic.headers[2];
                            }
                        }
                        DS.getView("config/business/fields/" + fieldsItem.type, function (view) {
                            var html = $(render.replaceDataByObject(fieldsItem, view));
                            if (fieldsItem.type == "checkbox") {
                                var temp = '<div class="inline-checkbox"><label class="inline"><input type="checkbox" id="inlineCheckbox1" value="_value">_name </label></div>';
                                var checkboxDic = (getCache("options", fieldsItem.dic) || {}).options || [];
                                var checkHtml = "";
                                for (var checkIndex = 0; checkIndex < checkboxDic.length; checkIndex++) {
                                    var dicItem = checkboxDic[checkIndex];
                                    checkHtml += temp.replace(/_value/g, dicItem.key).replace(/_name/g, dicItem.name);
                                }
                                html.find(".drag-item-view-content").empty();
                                html.find(".drag-item-view-content").html(checkHtml);
                            }
                            if (fieldsItem.type == "radio") {
                                var temp = '<div class="inline-checkbox"><label class="inline"><input type="radio" id="optionsRadios1" value="_value">_name</label></div>';
                                var checkboxDic = (getCache("options", fieldsItem.dic) || {}).options || [];
                                var checkHtml = "";
                                for (var checkIndex = 0; checkIndex < checkboxDic.length; checkIndex++) {
                                    var dicItem = checkboxDic[checkIndex];
                                    checkHtml += temp.replace(/_value/g, dicItem.key).replace(/_name/g, dicItem.name);
                                }
                                html.find(".drag-item-view-content").empty();
                                html.find(".drag-item-view-content").html(checkHtml);
                            }

                            pane.append(html);
                            index++;
                            initFields();
                        });

                    }
                    initFields();
                }
            });
            //TODO
//            var step = session.business.currentBusinessFlowStep;
//            var fields = step.stepFields;
//            handler.config.business.displayConfigFields(fields, $("#business_step_fields_demo"), $("#config-business-field-sidebar"));
        });
    },
    processBusinessFlowFieldsStatus: function (fields) {
        var result = [];
        for (var i = 0; i < fields.length; i++) {
            var fieldsItem = fields[i];
            if (fieldsItem.enable == "yes") {
                result.push(fieldsItem);
            }
        }
        return result;
    },
    displayConfigFields: function (fields, pane, tempPane) {
        fields = fields || [];
        for (var i = 0; i < fields.length; i++) {
            var rowdata = fields[i];
            var colNum = rowdata.cols.length;
            var currentRow = tempPane.find(".dragrow-col" + colNum).clone();
            var cols = rowdata.cols || [];
            for (var m = 0; m < cols.length; m++) {
                var coldata = cols[m];
                var currentCol = currentRow.find(".column:eq(" + m + ")");
                var items = coldata.fields || [];
                for (var n = 0; n < items.length; n++) {
                    var itemdata = items[n];
                    var type = itemdata._id;
                    var currentItem = tempPane.find(".dragItem-" + type).clone();
                    var drayItem = currentItem.find(".dragViewItem");
//                    if (type == "single" || type == "multi" || type == "number" || type == "date") {
//                        drayItem.attr("label", itemdata.label);
//                        drayItem.find("label.demo-label").text(itemdata.label);
//                        drayItem.attr("field", itemdata.field);
//                        drayItem.attr("item-id", itemdata._id);
//                    } else {
//                        drayItem.attr("label", itemdata.label);
//                        drayItem.find("label.demo-label").text(itemdata.label);
//                        drayItem.attr("field", itemdata.field);
//                        drayItem.attr("select_value", itemdata.selectValue);
//                        drayItem.attr("item-id", itemdata._id);
//                        if (type == "checkbox") {
//                            var values = itemdata.selectValue.split("|") || [];
//                            var viewContent = drayItem.find(".drag-item-view-content");
//                            var temp = "<div class='inline-checkbox'><label class='inline'><input type='checkbox' value='__value'>__value</label></div>";
//                            viewContent.empty();
//                            for (var j = 0; j < values.length; j++) {
//                                viewContent.append(temp.replace(/__value/g, values[j]));
//                            }
//                        } else if (type == "radio") {
//                            var values = itemdata.selectValue.split("|") || [];
//                            var viewContent = drayItem.find(".drag-item-view-content");
//                            var temp = "<div class='inline-checkbox'><label class='inline'><input type='radio' value='__value'>__value</label></div>";
//                            viewContent.empty();
//                            for (var k = 0; k < values.length; k++) {
//                                viewContent.append(temp.replace(/__value/g, values[k]));
//                            }
//                        }
//                    }
                    currentCol.append(currentItem);
                }
            }
            pane.append(currentRow);
            initContainer();
        }
    },
    showConfigBusinessStepAction: function (data, src) {
        DS.getView('config/business/config_business_step_actions', function (view) {
            var pane = $('#config_business_step_actions');
            pane.empty();
            pane.html(view);
            var currentStep = session.business.currentBusinessFlowStep;
            var navtabs = $("#config_business_action_nav_tabs");
            var temp = "<li><a href='#' class='ds_do_action' ds_action='config.business.showConfigBusinessStepActionDetail' ds_data='__id' data-toggle='tab'>__name</a></li>";
            for (var i = 0; i < currentStep.actions.length; i++) {
                var html = render.replaceDataByObject(currentStep.actions[i], temp);
                navtabs.append(html);
            }
            var html = "<li><a href='#addBusinessFlowActionModal' data-toggle='modal' class='ds_do_action' ds_action='config.business.showAddBusinessFlowStepAction'><span><i class='icon-plus'></i>添加动作</span></a></li>";
            navtabs.append(html);
            $("#config_business_action_nav_tabs li:first a").click();
        });
    },
    //禁用popover
    dragItemActivePopover: function (data, src) {
//        $(src).popover('toggle');
//        var label = $(src).attr("label");
//        if ($(src).hasClass("popover-active")) {
//            $(src).removeClass("popover-active");
//        } else {
//            $(src).addClass("popover-active");
//            $("#popovered-form").find('#label').val(label);
//            var type = $("#popovered-form").find("input[name='type']").val();
//            if (type == "dropdown" || type == "checkbox" || type == "radio") {
//                var selectValue = $(src).attr("select_value").replace(/\|/g, "\r\n");
//                $("#popovered-form").find("textarea[name='select_value']").val(selectValue);
//            }
//
//        }

    },
    saveDrayItemConfig: function (data, src) {
        var popoverSrc = $(".demo").find(".popover-active");
        var type = data.type;
        if (type == "single" || type == "multi" || type == "number" || type == "date") {
            popoverSrc.find("label").text(data.label);
            popoverSrc.attr("label", data.label);
            popoverSrc.attr("field", data.field);
        } else if (type == "dropdown") {
            popoverSrc.find("label").text(data.label);
            popoverSrc.attr("label", data.label);
            popoverSrc.attr("field", data.field);
            popoverSrc.attr("select_value", data.select_value.replace(/[\r\n]/g, "|"));
        } else if (type == "checkbox") {
            popoverSrc.find("label").text(data.label);
            popoverSrc.attr("label", data.label);
            popoverSrc.attr("field", data.field);
            var selectValue = data.select_value.replace(/[\r\n]/g, "|");
            popoverSrc.attr("select_value", selectValue);
            var values = selectValue.split("|") || [];
            var viewContent = popoverSrc.find(".drag-item-view-content");
            var temp = "<div class='inline-checkbox'><label class='inline'><input type='checkbox' value='__value'>__value</label></div>";
            viewContent.empty();
            for (var i = 0; i < values.length; i++) {
                viewContent.append(temp.replace(/__value/g, values[i]));
            }
        } else if (type == "radio") {
            popoverSrc.find("label").text(data.label);
            popoverSrc.attr("label", data.label);
            popoverSrc.attr("field", data.field);
            var selectValue = data.select_value.replace(/[\r\n]/g, "|");
            popoverSrc.attr("select_value", selectValue);
            var values = selectValue.split("|") || [];
            var viewContent = popoverSrc.find(".drag-item-view-content");
            var temp = "<div class='inline-checkbox'><label class='inline'><input type='radio' value='__value'>__value</label></div>";
            viewContent.empty();
            for (var i = 0; i < values.length; i++) {
                viewContent.append(temp.replace(/__value/g, values[i]));
            }
        }
        handler.config.business.dragItemActivePopover(null, popoverSrc);
    },
    cancelDrayItemConfig: function (data, src) {
        var popoverSrc = $(".demo").find(".popover-active");
        handler.config.business.dragItemActivePopover(null, popoverSrc);
    },
    showConfigBusinessStepActionDetail: function (data, src) {
        DS.getView('config/business/config_business_step_action_detail', function (view) {
            var action = {
                action: "config.business.queryBusinessStepAction",
                data: {_id: session.business.currentBusinessFlowStep._id, actionId: data}
            };
            DS.send(action, function (response) {
                if (response.success) {
                    var actiondata = response.data;
                    session.business.currentBusinessStepAction = actiondata;
                    var html = render.replaceDataByObject(actiondata, view);
                    var pane = $("#config_business_step_action_content_container");
                    pane.empty();
                    pane.html(html);
                    config_business_step_action_detail();
                    var action = {
                        action: "config.business.queryAllBusinessFlowFields",
                        data: {flow_id: session.business.currentBusinessFlow}
                    };
                    DS.send(action, function (response) {
                        if (response.success) {
                            var fields = response.data || [];
                            fields = handler.config.business.processBusinessFlowFieldsStatus(fields);
                            var pane = $("#config_busienss_flow_action_pane");
                            var index = 0;
                            var finishInitFields = function () {
                                initDragable();
                                initContainer();
                                handler.config.business.displayConfigFields(actiondata.actionFields, $("#business_step_actions_demo"), $("#config-business-action-sidebar"));

                            };
                            var initFields = function () {
                                if (index >= fields.length) {
                                    finishInitFields();
                                    return;
                                }
                                var fieldsItem = fields[index];
                                if (fieldsItem.type == 'dropdown' && fieldsItem.dic) {
                                    var dic = getCache("options", fieldsItem.dic);
                                    if (dic.cascade == 2) {
                                        fieldsItem.type += "_2";
                                        fieldsItem.dropname_1 = dic.headers[0];
                                        fieldsItem.dropname_2 = dic.headers[1];

                                    } else if (dic.cascade == 3) {
                                        fieldsItem.type += "_3";
                                        fieldsItem.dropname_1 = dic.headers[0];
                                        fieldsItem.dropname_2 = dic.headers[1];
                                        fieldsItem.dropname_3 = dic.headers[2];
                                    }
                                }
                                DS.getView("config/business/fields/" + fieldsItem.type, function (view) {
                                    var html = $(render.replaceDataByObject(fieldsItem, view));
                                    if (fieldsItem.type == "checkbox") {
                                        var temp = '<div class="inline-checkbox"><label class="inline"><input type="checkbox" id="inlineCheckbox1" value="_value">_name </label></div>';
                                        var checkboxDic = (getCache("options", fieldsItem.dic) || {}).options || [];
                                        var checkHtml = "";
                                        for (var checkIndex = 0; checkIndex < checkboxDic.length; checkIndex++) {
                                            var dicItem = checkboxDic[checkIndex];
                                            checkHtml += temp.replace(/_value/g, dicItem.key).replace(/_name/g, dicItem.name);
                                        }
                                        html.find(".drag-item-view-content").empty();
                                        html.find(".drag-item-view-content").html(checkHtml);
                                    }
                                    if (fieldsItem.type == "radio") {
                                        var temp = '<div class="inline-checkbox"><label class="inline"><input type="radio" id="optionsRadios1" value="_value">_name</label></div>';
                                        var checkboxDic = (getCache("options", fieldsItem.dic) || {}).options || [];
                                        var checkHtml = "";
                                        for (var checkIndex = 0; checkIndex < checkboxDic.length; checkIndex++) {
                                            var dicItem = checkboxDic[checkIndex];
                                            checkHtml += temp.replace(/_value/g, dicItem.key).replace(/_name/g, dicItem.name);
                                        }
                                        html.find(".drag-item-view-content").empty();
                                        html.find(".drag-item-view-content").html(checkHtml);
                                    }

                                    pane.append(html);
                                    index++;
                                    initFields();
                                });
                            }
                            initFields();

                        }
                    });

//                    handler.config.business.displayConfigFields(actiondata.actionFields, $("#business_step_actions_demo"), $("#config-business-action-sidebar"));

                }
            });
        });
    },
    saveBusinessStepInfo: function (data, src) {
        data._id = session.business.currentBusinessFlowStep._id;
        data.flow_id = session.business.currentBusinessFlow;
        //验证步骤时间
        var currentFlow = session.business.currentFlowInfo;
        if(currentFlow.ctime && data.ctime){
            var stepTime = handler.business.getParseIntMinTime(data.ctype,data.ctime);
            var flowTime = handler.business.getParseIntMinTime(currentFlow.ctype,currentFlow.ctime);
            if(stepTime > flowTime){
                $().alertmessage('showError', "单步骤时间不能超过工单总时长,请重新设置！");
                return;
            }
        }
        //
        var action = {
            action: "config.business.updateBusinessStepInfo",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                $("#config_business_detail_nav_pane").find("li a[ds_data='" + data._id + "']").text(data.name);
                //update step cache
                var steps = session.business.currentFlowSteps;
                for (var i = 0; i < steps.length; i++) {
                    var stepsItem = steps[i];
                    if (stepsItem._id == data._id) {
                        stepsItem.name = data.name;
                        stepsItem.isBegin = data.isBegin;
                    }
                }
                session.business.currentBusinessFlowStep.name = data.name;
                session.business.currentBusinessFlowStep.isBegin = data.isBegin;
                session.business.currentBusinessFlowStep.notifyUser = data.notifyUser.split(",");
                session.business.currentBusinessFlowStep.ctype = data.ctype;
                session.business.currentBusinessFlowStep.ctime = data.ctime;
                $().alertmessage('showSuccess', "保存成功！");
            }
        });
    },
    saveBusienssStepFieldsConfig: function (data, src) {
        var fieldData = handler.config.business.getDataFromDragContiner($("#business_step_fields_demo"));
        var data = {_id: session.business.currentBusinessFlowStep._id, stepFields: fieldData};
        var action = {
            action: "config.business.updateBusinessStepFields",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var steps=response.steps;
                session.business.currentBusinessFlowStep.stepFields = steps;
                $().alertmessage('showSuccess', "保存字段成功！");
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    getDataFromDragContiner: function (pane) {
        var data = [];
        var rows = pane.find(".drag-row");
        for (var i = 0; i < rows.length; i++) {
            var cols = $(rows[i]).find(".column");
            var currentRow = {cols: []};
            for (var m = 0; m < cols.length; m++) {
                var items = $(cols[m]).find(".dragViewItem");
                var currentCol = { fields: []};
                for (var n = 0; n < items.length; n++) {
                    var currentItem = {};
                    var type = $(items[n]).attr("itemType");
                    currentItem.type = type;
                    currentItem._id = $(items[n]).attr("fieldId");
                    currentCol.fields.push(currentItem);
                }
                currentRow.cols.push(currentCol);
            }
            data.push(currentRow);
        }
        return data;
    },
    showAddBusinessFlowStepAction: function (data, src) {
        DS.getView('config/business/add_business_flow_step_action', function (view) {
            var pane = $("#addBusinessFlowActionModal");
            pane.empty();
            pane.html(view);
        });
    },
    addBusinessFlowStepAction: function (data, src) {
        data._id = session.business.currentBusinessFlowStep._id;
        var action = {
            action: "config.business.addBusinessStepAction",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var addAction = response.data;
                $('#addBusinessFlowActionModal').modal('hide');
                var temp = "<li><a href='#' class='ds_do_action' ds_action='config.business.showConfigBusinessStepActionDetail' ds_data='__id' data-toggle='tab'>__name</a></li>";
                var html = render.replaceDataByObject(addAction, temp);
                var navtabs = $("#config_business_action_nav_tabs").find("li:last");
                navtabs.before(html);
                $("#config_business_action_nav_tabs").find("li a[ds_data='" + addAction._id + "']").click();
                session.business.currentBusinessFlowStep.actions.push(addAction);

            } else {
                alert(response.message);
            }
        });

    },
    showDeleteBusinessStepAction: function (data, src) {
        DS.getView('config/business/delete_business_step_action', function (view) {
            var pane = $('#stopBusinessStepActionModal');
            pane.empty();
            var html = view.replace(/__id/g, data);
            pane.html(html);
        });
    },
    deleteBusinessStepAction: function (data, src) {
        var action = {
            action: "config.business.deleteBusinessStepAction",
            data: {_id: session.business.currentBusinessFlowStep._id, actionId: data}
        };
        DS.send(action, function (response) {
            if (response.success) {
                $('#stopBusinessStepActionModal').modal('hide');
                var actions = session.business.currentBusinessFlowStep.actions || [];
                var newactions = [];
                for (var i = 0; i < actions.length; i++) {
                    if (actions[i]._id != data) {
                        newactions.push(actions[i]);
                    }
                }
                session.business.currentBusinessFlowStep.actions = newactions;
                $("#config_business_step_nav_tabs").find("li:last a").click();
            }
        });
    },
    saveBusinessStepAction: function (data, src, event) {
        var from = $('#config_business_step_action_info_form');
        try{
            if(validate && !validate.validate(from)) return false;
        }catch(e){}
        var data = {_id: session.business.currentBusinessFlowStep._id, actionId: session.business.currentBusinessStepAction._id};
        var formdata = getDataOfForm($("#config_business_step_action_info_form"));
        if (formdata.succeed) {
            data.update = formdata.data;
            var fieldData = handler.config.business.getDataFromDragContiner($("#business_step_actions_demo"));
            data.update.actionFields = fieldData;
        }
        var action = {
            action: "config.business.udpateBusinessStepAction",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                $("#config_business_action_nav_tabs").find("a[ds_data='8f6af720-2520-11e3-85cf-a319466690d1']").text(data.update.name);
                $().alertmessage('showSuccess', "保存成功！");
            }
        });
    },
    showBusinessFlowFieldConfig: function (data, src) {
        handler.config.business.doSelectBusinessTab(data);
        DS.getView("config/business/config_business_flow_fields", function (view) {
            var pane = $("#config_business_content_container");
            pane.empty();
            pane.html(view.replace(/__flow_id/g, data));
            handler.config.business.refreshBusinessFlowField({flow_id: data});
            $("#config_business_detail_nav_pane").find("li").removeClass("active");

        });
    },
    queryBusinessFlowField: function (data, src) {
        var querydata = getDataOfForm($("#config_business_flow_fields_table_form"));
        querydata = querydata.data;
        querydata.page = src.val() || 1;
        querydata.limit = 10;
        handler.config.business.refreshBusinessFlowField(querydata);
    },
    showBusinessFlowInfoConfig: function (data, src) {
        handler.config.business.doSelectBusinessTab(data);
        var action = {
            action: "config.business.getBusinessFolwById",
            data: {_id: data}
        };
        DS.send(action, function (response) {
            if (response.success) {
                var flow = response.data;
                session.business.currentFlowSteps = response.steps;
                DS.getView("config/business/config_business_flow_info", function (view) {
                    var pane = $("#config_business_content_container");
                    pane.empty();
                    var curTime = 0;
                    var maxStepObjTime = 0;
                    var stepObj = session.business.currentFlowSteps;
                    maxStepObj = stepObj[0];
                    for (var i = 1; i < stepObj.length; i++) {
                        curTime =stepObj[i].ctime&&stepObj[i].ctype?handler.business.getTimeByMs(stepObj[i].ctype,stepObj[i].ctime):0;
                        maxStepObjTime =maxStepObj.ctime&&maxStepObj.ctype?handler.business.getTimeByMs(maxStepObj.ctype,maxStepObj.ctime):0;
                        if(curTime>maxStepObjTime){
                            maxStepObj = stepObj[i];
                        }
                    }
                    var maxStepObjTime = handler.business.taskTimeAll(maxStepObj.ctype,maxStepObj.ctime)||0;
                    if(!maxStepObj.ctime){
                        maxStepObjTime ="";
                    }
                    flow.stepTimeHtml = maxStepObjTime?('(<strong style="color:red">'+maxStepObjTime+'</strong>)'):"";
                    pane.html(render.replaceDataByObject(flow, view));
                    //handler.config.business.refreshBusinessFlowField({flow_id: data});
                    $("#config_business_detail_nav_pane").find("li").removeClass("active");
                    pane.find("#ctype").find("option[value='"+flow.ctype+"']").attr("selected",true);
                    pane.find("input[name='ctime']").val(flow.ctime);

                });
            } else {
                alert("获取流程信息失败！");
            }
        });

    },
    saveBusinessFlowInfo: function (data, src) {
        if(data.ctime && data.ctime != "0"){
            var stepObj = session.business.currentFlowSteps;
            var curTime = 0;
            var maxStepObjTime = 0;
            var maxStepObj = stepObj[0];
            for (var i = 1; i < stepObj.length; i++) {
                curTime =stepObj[i].ctime&&stepObj[i].ctype?handler.business.getTimeByMs(stepObj[i].ctype,stepObj[i].ctime):0;
                maxStepObjTime =maxStepObj.ctime&&maxStepObj.ctype?handler.business.getTimeByMs(maxStepObj.ctype,maxStepObj.ctime):0;
                if(curTime>maxStepObjTime){
                    maxStepObj = stepObj[i];
                }
            }

            var flowTime = handler.business.getParseIntMinTime(data.ctype,data.ctime);
            var stepTime = handler.business.getParseIntMinTime(maxStepObj.ctype,maxStepObj.ctime);
            if(stepTime > flowTime){
                $().alertmessage('showError', "步骤"+maxStepObj.name+"设置的时间已经超过总时长,请重新设置！");
                return;
            }
        }
        if(!(data && data.name)){
            $().alertmessage('showError', "流程名称不能为空！");
            return;
        }
        var action = {
            action: "config.business.updateBusinessFlowInfo",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var flow = response.data;
                var a = $("a.nav_business_dropdown_flow[ds_data='" + flow._id + "']").find("span").text(flow.name);
                $().alertmessage('showSuccess', "保存成功！");
            } else {
                alert(response.message);
            }
        });
    },
    showStopBusinessFlow: function (data, src) {
        handler.config.business.doSelectBusinessTab(data);
        DS.getView('config/business/stop_business_flow', function (view) {
            var pane = $('#stopBusinessFlowModal');
            pane.empty();
            var action = src.text();
            var html = view.replace(/__id/g, data).replace(/__action/g, action);

            pane.html(html);
        });

    },
    changeStatusBusinessFlow: function (data, src) {
        var action = src.attr("action");
        data = {_id: data};
        if (action == "停用") {
            data.status = "disable";
        } else {
            data.status = "enable";
        }
        var aciton = {
            action: "config.business.changeStatusBusinessFlow",
            data: data
        };
        DS.send(aciton, function (response) {
            if (response.success) {
                $('#stopBusinessFlowModal').modal('hide');
                var flow = response.data;
                $(".nav_business_dropdown_flow[ds_data='" + flow._id + "']").find("span").removeClass("enable").removeClass("disable").addClass(flow.status);
                if (flow.status == 'enable') {
                    $("#config_business_stopAndStart_operate").text("停用");
                } else {
                    $("#config_business_stopAndStart_operate").text("启用");
                }

            }
        });
    },

    showAddBusinessFlowField: function (data, src) {
        DS.getView("config/business/add_config_business_flow_field", function (view) {
            var pane = $("#config_business_flow_fields_option_container");
            pane.empty();
            pane.html(view);
        });
    },
    refreshBusinessFlowField: function (data, src) {
        data = data || {};
        //data.flow_id = session.business.currentBusinessFlow;
        var action = {
            action: "config.business.queryBusinessFlowFields",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var tmp = "<tr><td>__name</td><td>_@transformGeneralCache('businessFieldType','__type')@_</td>" +
                    "<td>_@transformGeneralCache('yesAndNo','__enable')@_</td><td><a href='#' class='ds_do_action' ds_action='config.business.showUpdateBusinessFlowFields' ds_data='__id'>修改</a></td></tr>";
                var html = "";
                var fields = response.list || [];
                refreshCache("businessFlowField", fields);
                for (var i = 0; i < fields.length; i++) {
                    var fieldsItem = fields[i];
                    html += render.replaceDataByObject(fieldsItem, tmp);
                }
                $("#config_business_flow_fields_table").find("tbody").html(html);

                var count = response.count;
                $("#config_business_flow_fields_table_pagination").find(".pagination").find(".result_count").text(count);
                var list = $("#config_business_flow_fields_table_pagination").find(".pagination").find("li");
                updatePagination(list, count, data.limit || 10, data.page || 1);
            }
        });
    },
    showUpdateBusinessFlowFields: function (data, src) {
        var field = getCache("businessFlowField", data);
        var defaultValue = field['default'];
        console.log(defaultValue);
        if(defaultValue){
            defaultValue = defaultValue.replace(new RegExp("\n",'g'), "</br>");
            field['default'] = defaultValue;
        }
        //for(var key in field){
        //    var value = field[key];
        //    value = value.replace(new RegExp("\n",'g'), "</br>");
        //    field[key] = value;
        //}
        $(src).closest("tr").addClass("active").siblings().removeClass("active");
        DS.getView('config/business/update_business_flow_field', function (view) {
            var html = render.replaceDataByObject(field, view);
            var pane = $("#config_business_flow_fields_option_container");
            pane.empty();
            pane.html(html);
        });
    },

    replaceLineChar: function(value){
        value = value.replace(new RegExp("</br>",'g'), "\n");
        return value;
    },

    saveBusinessFlowFields: function (data, src) {
        data.flow_id = session.business.currentBusinessFlow;
        var action = {
            action: "config.business.addBusinessFlowFields",
            data: data
        };
        //如果字典没值不能关联
        if(data.dic){
            var dicSelect = $("select[name='default'] option");
            if(dicSelect.size() == 1){
                alert("不能关联没有数据的系统字典");
                return;
            }
        }
        //
        DS.send(action, function (response) {
            if (response.success) {
                $("#config_business_flow_fields_option_container").empty();
                var src = $("#config_business_flow_fields_table_pagination").find("li.active").find("a");
                handler.config.business.queryBusinessFlowField({}, src);
                // handler.config.business.refreshBusinessFlowField({flow_id: data.flow_id});
            } else {
                alert(response.message);
            }
        });
    },
    config_business_report : function(menu){
        handler.config.business.queryBusinessReport({},null);
    },
    queryBusinessReport : function(data,src){
       data = data || {};
        if(src){
            data.page = src.val() || 1;
        } else {
            data.page = 1;
        }
        data.limit = handler.config.business.pageSize || 10;
        var action = {
            action : "config.business.queryBusinessReport",
            data : data
        };
        var formId = "business_report_query_frm";
        var container = $("#view_task_report_config");
        DS.send(action,function(response){
            if(response.success){
                var list = response.list;
                var pane=container.find('#business_report_list_pane');
                pane.empty();
                var html = template("business_report_list_item",response);
                container.find('#business_report_list_pane').empty();
                container.find('#business_report_list_pane').html(html);
                DS.updatePagination(formId, response.count, handler.config.business.pageSize, data.page);
            } else {
                $().alertmessage('showError', response.message);
            }
        });
    },
    showReportAdd : function (data,src){
        DS.getView("config/business/business_report_add",function(view){
            var pane = $("#business_report_detail_pane");
            pane.empty();
            var render = template.compile(view);
            pane.html(render({}));
        });
    },
    saveReportInfo : function (data,src){
        var action = {
            action : "config.business.saveBusinessReportInfo",
            data : data
        };
        DS.send(action,function(response){
            if(response.success){
                $().alertmessage('showSuccess','保存报表信息成功！' );
                var pane = $("#business_report_detail_pane");
                pane.empty();
                $("#business_report_query_frm").find(".refresh").click();
            } else {
                $().alertmessage('showError', response.message);
            }
        });
    },
    cancelReportAdd : function(data,src){
        var pane = $("#business_report_detail_pane");
        pane.empty();
    },
    showReportInfoConfig : function (data,src){
        var action = {
            action : "config.business.getBusinessReportConfigById",
            data : {_id : data}
        };
        DS.send(action,function(response){
            if(response.success){
                var reportData = response.data;
                DS.getView("config/business/business_report_add",function(view){
                    var pane = $("#business_report_detail_pane");
                    pane.empty();
                    var render = template.compile(view);
                    reportData.opFlag = 'update';
                    pane.html(render(reportData));
                });
            } else {
                $().alertmessage('showError', response.message);
            }
        });
    },
    showReportFieldsConfig : function (data,src){
        var action = {
            action : "config.business.getBusinessReportConfigById",
            data : {_id : data}
        };
        DS.send(action,function(response){
            if(response.success){
                var reportData = response.data;
                DS.getView("config/business/business_report_fields_detail",function(view){
                    var pane = $("#business_report_detail_pane");
                    pane.empty();
                    var render = template.compile(view);
                    pane.html(render(reportData));
                });
            } else {
                $().alertmessage('showError', response.message);
            }
        });
    },
    addReportField : function (data,src){
        var action = {
            action : "config.business.getBusinessReportConfigById",
            data : {_id : data}
        };
        DS.send(action,function(response){
            if(response.success){
                DS.getView("config/business/business_report_fields_add",function(view){
                    var html = artRender(view,response.data || {});
                    var pane = $("#business_report_fields_config_add_pane");
                    pane.empty();
                    pane.html(html);
                });
            } else {
                $().alertmessage('showError', response.message);
            }
        });

    },
    addBusinessReportField : function (data,src){
        var action = {
            action : "config.business.addBusinessReportField",
            data : data
        };
        DS.send(action,function(response){
            if(response.success){
                $().alertmessage('showSuccess', "添加统计字段成功！");



            } else {
                $().alertmessage('showError', response.message);
            }
        });
    },
    cancelBusinessReportField : function (data,src){
        console.log(data);
    }

}




