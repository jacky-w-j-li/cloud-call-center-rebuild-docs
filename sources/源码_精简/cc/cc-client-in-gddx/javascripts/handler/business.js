session.business = {};
handler.business = {
    getAccountBusiness: function(data, src) {
        data.page = src.val() || 1;
//        data.limit = handler.account.queryPageSize;
        data.limit = 5;
        DS.getView("business/businessList_item", function (view) {
            var pane = $("#business_list_pane");
            pane.empty();
            var action = {
                action: "manager.account.queryAccount",
                data: data
            };
            DS.send(action, function (response) {
                if (response.success) {
                    var accountList = response.list;
                    var count = response.count;
                    var html = "";
                    for (var i = 0; i < accountList.length; i++) {
                        var accountListItem = accountList[i];
                        html += DS.renderMethodView(view, accountListItem);
                    }
                    pane.html(html);
                    DS.updatePagination("query_business_form", count, data.limit, data.page);
                } else {
                    alert("查询任务单异常！");
                }
            });
        });
    },

    showBusinessTemplate: function(data) {
        var index = data.indexOf(",");
        var pane = $("#account_business_config");
        pane.css("display", "block");
        var account = data.substring(0, index);
        var accountName = data.substring(index + 1, data.length);
        $("#account_business_accountName").html(accountName);
        $("#account_business_account").val(account);
        handler.business.showBusinessConfig_page(null,null);


//        var index = data.indexOf(",");
//        var pane = $("#account_business_config");
//        pane.css("display", "block");
//        var account = data.substring(0, index);
//        var accountName = data.substring(index + 1, data.length);
//        $("#account_business_accountName").html(accountName);
//        $("#account_business_account").val(account);
//        var sendData = {};
//        sendData.account = account;
//        var action = {
//            action: 'business.getBusinessTag',
//            data: sendData
//        };
//        DS.send(action, function(response) {
//            if (response.success) {
//                handler.business.refreshTagsDetail(response.data,account);
//            } else {
//                alert('获取业务类型失败');
//            }
//        });
    },

    addBusinessTemplate: function(data, src) {
        var action = {
            action: 'business.addBusinessTemplate',
            data: data
        }
        DS.send(action, function(response) {
            if(response.success) {
                alert("添加成功!");
                session.businessTemplates[response.data._id] = response.data;
                var html = '<li><a class="ds_do_action" ds_action="business.showBusinessTemplateDetail" ds_data="' + response.data._id + '">' + '<i class="icon-chevron-right"></i>' + data.name + '</a></li>'
                var pane = $('#config_business_nav_pane');
                pane.append(html);
                $('#addBusinessTemplateModal').modal('hide');
                pane.find('li a[ds_data="' + response.data._id + '"]').click();
            }
        });
    },

    businessConfig: function() {
        session.businessTags = {};
        handler.business.getAccountBusiness({}, $(""));
    },

    showBusinessTemplateDetail: function(data, src) {
        DS.getView('business/config_business_detail', function(view) {
            var pane = $('#config_business_template_pane');
            pane.empty();
            view = view.replace(RegExp('__id', 'g'), data);
            pane.html(view);
            var item = session.businessTemplates[data];
            pane.html(view);
            if(item.isBegin == 'true')
                pane.find('input[type=checkbox]').attr("checked", true);
            handler.business.refreshBusinessField(item);
        });
    },

    showAddBusinessField: function(data, target) {
        DS.getView('business/business_field_add', function(view) {
            var pane = target.parent();
            pane.empty();
            var html = view.replace(new RegExp('__id', 'g'), data);
            pane.html(html);
        });
    },

    closeAddBusinessField: function(data, target) {
        var pane = $("#add_business_field_pane");
        pane.empty();
        pane.html('<span class="add-custom-field enabled ds_do_action" ' +
            'ds_action="business.showAddBusinessField" ' +
            'ds_data="'+data+'">添加自定义字段</span>');
    },

    addBusinessField: function(data, target) {
        var template = session.businessTemplates[data.template];
        data.required = data.required == 'yes';
        var action = {
            action: 'business.addBusinessField',
            data: data
        }
        DS.send(action, function(response){
            if(response.success) {
                data._id = response._id;
                template.business_fields.push(data);
                handler.business.refreshBusinessField(template);
                handler.business.closeAddBusinessField(template._id);
            }
        });
    },

    refreshBusinessField: function(template) {
        var pane = $('#business_fields_pane');
        pane.empty();

        DS.getView('business/business_field_item', function(view){
            var html = '';
            for(var i = 0; i< template.business_fields.length;i++) {
                var field = template.business_fields[i];
                html += view.replace(new RegExp('__name', 'g'), field.name).replace(new RegExp('__type', 'g'), field.type)
                    .replace(new RegExp('__template', 'g'), template._id).replace(new RegExp('__id', 'g'), field._id);
            }
            pane.html(html);
        });
    },

    moveBusinessFieldUp: function(data, target) {
        data.moveUp = true;
        var action = {
            action: 'business.moveBusinessField',
            data: data
        };
        DS.send(action, function(response){
            if(response.success) {
                var template = session.businessTemplates[data.template_id];
                var fields = template.business_fields;
                var index = 0;
                for(var i=0;i<fields.length;i++) {
                    var field = fields[i];
                    if(field._id == data.field_id) {
                        index = i;
                        break;
                    }
                }
                var temp = fields[index - 1];
                fields[index - 1] = fields[index];
                fields[index] = temp;
                handler.business.refreshBusinessField(template);
            }
        });
    },

    moveBusinessFieldDown: function(data, target) {
        data.moveUp = false;
        var action = {
            action: 'business.moveBusinessField',
            data: data
        };
        DS.send(action, function(response){
            if(response.success) {
                var template = session.businessTemplates[data.template_id];
                var fields = template.business_fields;
                var index = 0;
                for(var i=0;i<fields.length;i++) {
                    var field = fields[i];
                    if(field._id == data.field_id) {
                        index = i;
                        break;
                    }
                }
                var temp = fields[index + 1];
                fields[index + 1] = fields[index];
                fields[index] = temp;
                handler.business.refreshBusinessField(template);
            }
        });
    },

    deleteBusinessField: function(data, target) {
        var action = {
            action: 'business.deleteBusinessField',
            data: data
        }
        DS.send(action, function(response){
            if(response.success) {
                var template = session.businessTemplates[data.template_id];
                var fields = [];
                var index = 0;
                for(var i=0;i<template.business_fields.length;i++) {
                    var field = template.business_fields[i];
                    if(data.field_id == field._id) {
                        continue;
                    } else {
                        fields[index++] = field;
                    }
                }
                template.business_fields = fields;
                target.closest('form#'+data.field_id).remove();
            }
        });
    },

    showEditBusinessField: function(data, target) {
        var template = session.businessTemplates[data.template_id];
        var fields = template.business_fields;
        var field = null;
        for(var i=0;i<fields.length;i++) {
            var a = fields[i];
            if(a._id == data.field_id) {
                field = a;
                break;
            }
        }
        if(field == null)
            return;
        DS.getView('business/business_field_edit', function(view){
            var pane = $('#add_business_field_pane');
            pane.empty();
            var html = view.replace(new RegExp('__id', 'g'), data.template_id)
                .replace(new RegExp('__field', 'g'), data.field_id);
            pane.html(html);
            pane.find('#field-name').val(field.name);
            if(field.required) {
                pane.find('#required')[0].checked = true;
                pane.find('#un_required')[0].checked = false;
            } else {
                pane.find('#required')[0].checked = false;
                pane.find('#un_required')[0].checked = true;
            }
            pane.find('#choose_business_field_type').val(field.type);
            if(field.choices){
                var choice = field.choices[0];
                var pane1 = $("#field_attr_pane");
                var str = '<div class="row-select-box" style="position: relative;">'+
                    '<a class="plus ds_do_action" ds_action="business.plusBusinessField" ds_data=""></a>'+
                    '<input class="select-box" type="text" name="choices[]" maxlength="60" value="'+choice+'"' +
                    'style="height: 17px;">'+
                    '</div>';
                for(var i=1;i<field.choices.length;i++){
                    choice = field.choices[i];
                    str += '<div class="row-select-box" style="position: relative;">'+
                        '<a class="reduce ds_do_action" ds_action="business.reduceBusinessField" ds_data=""></a>'+
                        '<input class="select-box" type="text" name="choices[]" maxlength="60" value="'+choice+'"' +
                        'style="height: 17px;">'+
                        '</div>';
                }
                pane1.html(str);
            }
        });
    },

    editBusinessField: function(data, target) {
        var template = session.businessTemplates[data.template_id];
        var fields = template.business_fields;
        data.required = data.required == 'yes';
        var action = {
            action: 'business.editBusinessField',
            data: data
        }
        var index = 0;
        for(var i=0;i<fields.length;i++) {
            var a = fields[i];
            if(a._id == data._id) {
                index = i;
                break;
            }
        }
        DS.send(action, function(response){
            if(response.success) {
                fields[index] = data;
                handler.business.refreshBusinessField(template);
                handler.business.closeAddBusinessField(template._id);
            }
        });
    },

    plusBusinessField: function(data, target) {
        var pane = target.closest("#field_attr_pane");
        var str = '<div class="row-select-box" style="position: relative;">'+
            '<a class="reduce ds_do_action" ds_action="business.reduceBusinessField" ds_data=""></a>'+
            '<input class="select-box" type="text" name="choices[]" maxlength="60" style="height: 17px;">'+
            '</div>';
        pane.append(str);
    },
    reduceBusinessField: function(data, target) {
        target.closest('.row-select-box').remove();
    },
    setStartBusiness:function(src) {
        var target = $(src);
        var isBegin = target.attr("checked");
        event.preventDefault();
        if(isBegin == "checked")
            isBegin = true;
        else
            isBegin = false;
        var id = target.attr("ds_data");
        var item = session.businessTemplates[id];
        var account = item.account;
        var data = {};
        data._id = id;
        data.account = account;
        data.isBegin = isBegin;
        var action = {
            action: 'business.setStartBusiness',
            data: data
        }
        DS.send(action, function(response){
            if(response.success) {
                if(isBegin) {
                    item.isBegin = 'true';
                    target.attr('checked', true);

                    $("#config_business_nav_pane li a").each(function(i,val){
                        var temId = $(val).attr("ds_data")
                        if(temId != id) {
                            var item = session.businessTemplates[temId];
                            if(item)
                                item.isBegin = 'false';
                        }
                    });
                } else {
                    item.isBegin = 'false';
                    target.attr('checked', false);
                }
            }
        });
    },
    showBusinessTag: function(data) {
        var status = session.businessTags[data];
        DS.getView('business/business_tag', function(view) {
            var pane = $('#showEditTagsModal');
            pane.empty();
            var html = view.replace("__account",data);
            for(var i =0; i<10;i++) {
                if(status['tag'+i]) {
                    html = html.replace(RegExp('__tag'+i, 'g'), status['tag'+i]);
                } else {
                    html = html.replace(RegExp('__tag'+i, 'g'), '');
                }
            }
            pane.html(html);
        });
    },
    editStatus:function(data, target) {
        var status = {};
        for(var i in data) {
            var item = data[i];
            if(item != ""){
                status[i] = item;
            }
        }
        var action = {
            action: 'business.editStatus',
            data: {
                status: status,
                account: target.attr('account')
            }
        }
        DS.send(action, function(response){
            if(response.success){
                session.businessTags[target.attr('account')] = status;
                $('#showEditTagsModal').modal('hide');
                handler.business.refreshTagsDetail(response.data,target.attr('account'));
                alert('添加成功');
            } else {
                alert('添加失败');
            }
        });
    },
    refreshTagsDetail: function(data, account) {
        var tags = $("#account_business_tags");
        tags.empty();
        var status = {};
        var type = "add";
        if(data != null ) {
            if(data.status) {
                type = "edit";
                status = data.status;
                var fieldsView = "";
                for(var i in status) {
                    var field = status[i];
                    fieldsView += '<span class="'+i+'">'+field+'</span>, ';
                }
                tags.html(fieldsView);
            }
        }
        session.businessTags[account]=status;
        $(".account_business_tag").attr("ds_data",account);
        $(".account_business_tag").css("display","none");
        $("#account_business_"+type).css("display","block");
    },
    /**=================================新业务流程==================================*/
    showAddBusinessFlow: function (data, src) {
        DS.getView('business/add_business_flow', function (view) {
            var pane = $('#addBusinessFlowModal');
            pane.empty();
            pane.html(view);
        });
    },
    addBusinessFlow: function (data, src) {
        var action = {
            action: "business.addBusinessFlow",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var addFlow = response.data;
                $('#addBusinessFlowModal').modal('hide');
                handler.business.showBusinessConfig_page(null, addFlow._id);
            } else {
                alert(response.message);
            }
        });

    },
    showBusinessConfig_page: function (page, selectId) {
        session.business = {};
        DS.getView('business/config_business_dev', function (view) {
            var pane = $('#config_business');
            pane.empty();
            pane.html(view);
            var action = {
                action: "business.queryAccountBusinessFlow",
                data: {}
            };
            DS.send(action, function (response) {
                if (response.success) {
                    var flows = response.data;
                    var navtabs = $("#config_business_nav_tabs");
                    var temp = "<li class='dropdown' id='__id'><a href='#' class='dropdown-toggle nav_business_dropdown_flow' data-toggle='dropdown' ds_action='business.doSelectBusinessTab' ds_data='__id'>" +
                        "<span class='__status'>__name</span> <b class='caret'></b></a><ul class='dropdown-menu'><li>" +
                        "<a href='#' class='ds_do_action' ds_data='__id' ds_action='business.showConfigBusinessDetail'>流转配置</a></li>" +
                        "<li><a href='#' class='ds_do_action' ds_data='__id' ds_action='business.showBusinessFlowFieldConfig'>字段定义</a> </li>" +
                        "<li><a href='#' class='ds_do_action' ds_data='__id' ds_action='business.showBusinessFlowInfoConfig'>信息配置</a></li>" +
                        "</ul></li>";
                    for (var i = 0; i < flows.length; i++) {
                        console.log(flows[i]);
                        var html = render.replaceDataByObject(flows[i], temp);
                        navtabs.append(html);
                    }
                    var html = "<li><a href='#addBusinessFlowModal' data-toggle='modal' class='ds_do_action' ds_action='business.showAddBusinessFlow'><span><i class='icon-plus'></i>添加流程</span></a></li>";
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
    doSelectBusinessTab: function (data) {
        $("li#" + data).find("a:first").tab("show");
        session.business.currentBusinessFlow = data;
    },
    showConfigBusinessDetail: function (data, src) {
        handler.business.doSelectBusinessTab(data);
        var flowId = data;
        var action = {
            action: "business.queryBusinessFlowSteps",
            data: {flow_id: flowId}
        };
        DS.send(action, function (response) {
            if (response.success) {
                var steps = response.data;
                session.business.currentFlowSteps = steps;
                DS.getView('business/config_business_detail_dev', function (view) {
                    var pane = $("#config_business_content_container");
                    pane.html(view);
                    pane = $("#config_business_detail_nav_pane");
                    session.business.currentBusinessFlow = flowId;
                    var temp = "<li><a class='ds_do_action' ds_action='business.showConfigBusinessFlowStep' ds_data='__id'><i class='icon-chevron-right'></i>__name</a></li>";
                    for (var i = 0; i < steps.length; i++) {
                        var html = render.replaceDataByObject(steps[i], temp);
                        pane.append(html);
                    }
                    pane.find("li a:first").click();
                });
            }
        });
    },
    showBusinessFlowFieldConfig: function (data, src) {
        handler.business.doSelectBusinessTab(data);
        DS.getView("business/config_business_flow_fields", function (view) {
            var pane = $("#config_business_content_container");
            pane.empty();
            pane.html(view.replace(/__flow_id/g, data));
            handler.business.refreshBusinessFlowField({flow_id: data});
            $("#config_business_detail_nav_pane").find("li").removeClass("active");

        });
    },
    showBusinessFlowInfoConfig: function (data, src) {
        handler.business.doSelectBusinessTab(data);
        var action = {
            action: "business.getBusinessFolwById",
            data: {_id: data}
        };
        DS.send(action, function (response) {
            if (response.success) {
                var flow = response.data;
                DS.getView("business/config_business_flow_info", function (view) {
                    var pane = $("#config_business_content_container");
                    pane.empty();
                    pane.html(render.replaceDataByObject(flow, view));
                    $("#config_business_detail_nav_pane").find("li").removeClass("active");

                });
            } else {
                alert("获取流程信息失败！");
            }
        });
    },
    refreshBusinessFlowField: function (data, src) {
        data = data || {};
        var action = {
            action: "business.queryBusinessFlowFields",
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var tmp = "<tr><td>__name</td><td>_@transformGeneralCache('businessFieldType','__type')@_</td>" +
                    "<td>_@transformGeneralCache('yesAndNo','__enable')@_</td><td><a href='#' class='ds_do_action' ds_action='business.showUpdateBusinessFlowFields' ds_data='__id'>修改</a></td></tr>";
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
    }
}
