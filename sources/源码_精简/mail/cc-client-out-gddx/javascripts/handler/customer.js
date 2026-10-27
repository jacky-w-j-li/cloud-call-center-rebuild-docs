handler.customer = {
    customerConfig: function() {
        handler.customer.getAccountCustomer({}, $(""));
    },

    getAccountCustomer: function(data, src) {
        data.page = src.val() || 1;
        data.limit = handler.account.queryPageSize;
        DS.getView("customer/customerList_item", function (view) {
            var pane = $("#customer_list_pane");
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
                    DS.updatePagination("query_customer_form", count, data.limit, data.page);
                } else {
                    alert("查询任务单异常！");
                }
            });
        });
    },

    showCustomerTemplate: function(data) {
        var index = data.indexOf(",");
        $("#account_customer_config").css("display", "block");
        var account = data.substring(0, index);
        var accountName = data.substring(index + 1, data.length);
        $("#account_customer_accountName").html(accountName);
        $("#customer_addCustomerTemplateModal").attr("ds_data", account);

        $('#config_customer_template_pane').empty();
        var pane = $('#account_customer_config');
        var sendData = {};
        sendData.account = account;
        var action = {
            action: 'customer.getCustomerTemplate',
            data: sendData
        };
        DS.send(action, function(response) {
            if (response.success) {
                var items = response.data;
                session.customerTemplates = {};
                var navItems = "";
                var nav = pane.find('#config_customer_nav_pane');
                nav.empty();
                for (var i in items) {
                    var item = items[i];
                    session.customerTemplates[item._id] = item;
                    navItems += '<li><a class="ds_do_action" ds_action="customer.showCustomerTemplateDetail" ds_data="' + item._id + '">' +
                        '<i class="icon-chevron-right"></i>'+item.name+'</a></li>';
                }
                nav.append(navItems);
                nav.find('li a:first').click();
                resize();
            }
        });
    },

    showAddCustomerTemplateItem: function (data) {
        DS.getView('customer/config_add_customer_template', function (view) {
            var pane = $('#addCustomerTemplateModal');
            pane.empty();
            pane.html(view);
            $("#account_customer_account").val(data);
        });
    },

    addCustomerTemplate: function(data) {
        var action = {
            action: 'customer.addCustomerTemplate',
            data: data
        }
        DS.send(action, function(response) {
            if(response.success) {
                alert("添加成功!");
                session.customerTemplates[response.data._id] = response.data;
                var html = '<li><a class="ds_do_action" ds_action="customer.showCustomerTemplateDetail" ds_data="' + response.data._id + '">' + '<i class="icon-chevron-right"></i>' + data.name + '</a></li>'
                var pane = $('#config_customer_nav_pane');
                pane.append(html);
                $('#addCustomerTemplateModal').modal('hide');
                pane.find('li a[appdata="' + response.data._id + '"]').click();
            }
        });
    },

    showCustomerTemplateDetail: function(data) {
        DS.getView('customer/config_customer_detail', function(view){
            var pane = $('#config_customer_template_pane');
            pane.empty();
            pane.html(view.replace(RegExp('__id', 'g'), data));
            var item = session.customerTemplates[data];
            var statusView = "";
            for(var i in item.status) {
                var status = item.status[i];
                statusView += '<span class="'+i+'">'+status+'</span>, ';
            }
            if(statusView.length > 0){
                statusView = statusView.substr(0, statusView.length - 2);
            }
            pane.find('.config_customer_status').html(statusView);
            var source=item.source;
            if(source && source.length>0){
                var sourceView=[];
                for(var k=0;k<source.length;k++){
                    sourceView.push(source[k].name);
                }
                pane.find('.config_customer_source').html(sourceView.join(","));
            }

            var fieldsView = "";
            for(var i in item.stable_fields) {
                var field = item.stable_fields[i];
                var name = field.name;
                var value = field.value;
                fieldsView += '<span class="'+name+'">'+value+'</span>, ';
            }
            if(fieldsView.length > 0){
                fieldsView = fieldsView.substr(0, fieldsView.length - 2);
            }
            pane.find('.config_customer_fields').html(fieldsView);
            pane.find('#config_customer_uniqueNum')[0].checked = item.unique_phone;
            pane.find('#config_customer_uniqueName')[0].checked = item.unique_name;
            pane.find('#config_customer_callPop')[0].checked = item.call_popup;

            handler.customer.refreshCustomField(item);
        });
    },

    refreshCustomField: function(template) {
        var pane = $('#custom_fields_pane');
        pane.empty();

        DS.getView('customer/custom_field_item', function(view){
            var html = '';
            for(var i = 0; i< template.custom_fields.length;i++) {
                var field = template.custom_fields[i];
                html += view.replace(new RegExp('__name', 'g'), field.name).replace(new RegExp('__type', 'g'), field.type)
                    .replace(new RegExp('__template', 'g'), template._id).replace(new RegExp('__id', 'g'), field._id);
            }
            pane.html(html);
        });
    },

    showAddCustomerField: function(data, target) {
        DS.getView('customer/customer_field_add', function(view) {
            var pane = target.parent();
            pane.empty();
            var html = view.replace(new RegExp('__id', 'g'), data);
            pane.html(html);
        });
    },

    addCustomerField: function(data, target) {
        var template = session.customerTemplates[data.template];
        data.required = (data.required == 'yes')?"required":"";
        var action = {
            action: 'customer.addCustomerField',
            data: data
        }
        DS.send(action, function(response) {
            if(response.success) {
                data._id = response._id;
                template.custom_fields.push(data);
                handler.customer.refreshCustomField(template);
                handler.customer.closeAddCustomerField(template._id);
            }
        });
    },

    closeAddCustomerField: function(data) {
        var pane = $("#add_customer_field_pane");
        pane.empty();
        pane.html('<span class="add-custom-field enabled ds_do_action" ' +
            'ds_action="customer.showAddCustomerField" ' +
            'ds_data="'+data+'">添加自定义字段</span>');
    },

    moveCustomFieldUp: function(data, target) {
//        if(target.hasClass('inactive'))
//            return;
        if(target.closest("form").prev("form").length==0){
            return;
        }
        data.moveUp = true;
        var action = {
            action: 'customer.moveCustomField',
            data: data
        };
        DS.send(action, function(response){
            if(response.success) {
                var template = session.customerTemplates[data.template_id];
                var fields = template.custom_fields;
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
                handler.customer.refreshCustomField(template);
            }
        });
    },

    moveCustomFieldDown: function(data, target) {
//        if(target.hasClass('inactive'))
//            return;
        if(target.closest("form").next("form").length==0){
            return;
        }
        data.moveUp = false;
        var action = {
            action: 'customer.moveCustomField',
            data: data
        };
        DS.send(action, function(response) {
            if(response.success) {
                var template = session.customerTemplates[data.template_id];
                var fields = template.custom_fields;
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
                handler.customer.refreshCustomField(template);
            }
        });
    },

    deleteCustomField: function(data, target) {
        var action = {
            action: 'customer.deleteCustomField',
            data: data
        }
        DS.send(action, function(response){
            if(response.success) {
                var template = session.customerTemplates[data.template_id];
                var fields = [];
                var index = 0;
                for(var i=0;i<template.custom_fields.length;i++) {
                    var field = template.custom_fields[i];
                    if(data.field_id == field._id) {
                        continue;
                    } else {
                        fields[index++] = field;
                    }
                }
                template.custom_fields = fields;
                target.closest('form#'+data.field_id).remove();
            }
        });
    },

    showEditCustomField: function(data, target) {
        var template = session.customerTemplates[data.template_id];
        var fields = template.custom_fields;
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
        DS.getView('customer/custom_field_edit', function(view){
            var pane = $('#add_customer_field_pane');
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
            pane.find('#choose_custom_field_type').val(field.type);
            if(field.choices){
                var choice = field.choices[0];
                var pane1 = $("#field_attr_pane");
                var count=0;
                var str='';
                for(var key in field.choices){
                    if(count==0){
                      str = '<div class="row-select-box" style="position: relative;">'+
                            '<a class="plus ds_do_action" ds_action="customer.plusCustomField" ds_data=""></a>'+
                            '<input type="hidden" name="choiceskey[]"  value="'+key+'">' +
                            '<input class="select-box" type="text" name="choices[]" maxlength="60" value="'+field.choices[key]+'"' +
                            'style="height: 17px;">'+
                            '</div>';
                    } else{
                        str += '<div class="row-select-box" style="position: relative;">'+
                            '<a class="reduce ds_do_action" ds_action="customer.reduceCustomField" ds_data=""></a>'+
                            '<input type="hidden" name="choiceskey[]"  value="'+key+'">' +
                            '<input class="select-box" type="text" name="choices[]" maxlength="60" value="'+field.choices[key]+'"' +
                            'style="height: 17px;">'+
                            '</div>';

                    }
                    count++;
                }

                pane1.html(str);
            }
        });
    },

    editCustomField: function(data, target) {
        var template = session.customerTemplates[data.template_id];
        var fields = template.custom_fields;
        data.required = (data.required == 'yes')?"required":"";
        var select={};
        var max= 0,keys=[];
        if(data.choices && data.choiceskey){
            for(var k=0;k<data.choiceskey.length;k++){
                 keys.push(parseInt(data.choiceskey[k]));
            }
            max=Math.max.apply(Math,keys);

            for(var k=0;k<data.choices.length;k++){
                if(k+1>data.choiceskey.length){
                    max++;
                    select[""+max]=data.choices[k];
                }else{
                    select[data.choiceskey[k]]=data.choices[k];
                }
            }
            data.choices=select;
            delete  data.choiceskey;
        }else if(data.choices){
            for(var k=0;k<data.choices.length;k++){
                select[""+k]=data.choices[k];
            }
            data.choices=select;
        }
        var action = {
            action: 'customer.editCustomField',
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
                handler.customer.refreshCustomField(template);
                handler.customer.closeAddCustomerField(template._id);
            }
        });
    },

    plusCustomField: function(data, target) {
        var pane = target.closest("#field_attr_pane");
        var str = '<div class="row-select-box" style="position: relative;">'+
            '<a class="reduce ds_do_action" ds_action="customer.reduceCustomField" ds_data=""></a>'+
            '<input class="select-box" type="text" name="choices[]" maxlength="60" style="height: 17px;">'+
            '</div>';
        pane.append(str);
    },

    reduceCustomField: function(data, target) {
        target.closest('.row-select-box').remove();
    },

    showEditStatus: function (data, target) {
        var item = session.customerTemplates[data];
        var str = item.call_type == 'in'?'in':'out';
        DS.getView('customer/config_status_'+str, function(view) {
            var pane = $('#showEditStatusTemplateModal');
            pane.empty();
            var html = view;
            for(var i =0; i<10;i++) {
                if(item.status['status'+i]) {
                    html = html.replace(RegExp('__status'+i, 'g'), item.status['status'+i])
                        .replace(RegExp('__id','g'), item._id);
                } else {
                    html = html.replace(RegExp('__status'+i, 'g'), '')
                        .replace(RegExp('__id','g'), item._id);
                }
            }
            pane.html(html);
        });
    },
    editStatus: function (data, target) {
        var status = {};
        for(var i in data) {
            var item = data[i];
            if(item != ""){
                status[i] = item;
            }
        }
        var action = {
            action: 'customer.editStatus',
            data: {
                status: status,
                id: target.attr('template-id')
            }
        }
        DS.send(action, function(response){
            if(response.success){
                session.customerTemplates[response.id].status = status;
                $('#showEditStatusTemplateModal').modal('hide');
                handler.customer.showCustomerTemplateDetail(response.id);
            }
        });
    },
    showEditSource: function (data, src) {
        var item = session.customerTemplates[data];
        DS.getView('customer/config_source', function(view) {
            var pane = $('#showEditSourceTemplateModal');
            pane.empty();
            view = view.replace(/__id/g, item._id);
            pane.html(view);

            var source=item.source;
            if(source && source.length>0){
                var sourceView=[];
                var plusTmpl='<div class="row-select-box" style="position: relative;"><a class="plus ds_do_action" ds_action="customer.plusCustomField" ds_data=""></a><input type="hidden" name="key[]" value="__key"/><input class="select-box" type="text" name="choices[]" value="__name"/></div>';
                var reduceTmpl='<div class="row-select-box" style="position: relative;"><a class="reduce ds_do_action" ds_action="customer.reduceCustomField" ds_data=""></a><input type="hidden" name="key[]" value="__key"/><input class="select-box" type="text" name="choices[]" value="__name"/></div>';
                var html = "";
                for(var k=0;k<source.length;k++){
                    if(k==0){
                        html=render.replaceDataByObject(source[k],plusTmpl);
                    } else{
                        html+=render.replaceDataByObject(source[k],reduceTmpl);
                    }

                }
                pane.find('#field_attr_pane').html(html);
            }
        });
    },
    saveSource: function (data, src) {
        var id=src.attr('template-id');
        var names =data.choices;
        var keys  =data.key;
        var source=[];
//        console.dir(names);
        for(var i=0;i<names.length;i++){
            if(keys[i]){
                source.push({key:keys[i],name:names[i]});
            } else{
                source.push({key:"",name:names[i]});
            }

        }
        var action = {
            action: 'customer.editSource',
            data: {
                source: source,
                id: id
            }
        }
        DS.send(action, function(response){
            if(response.success){
                session.customerTemplates[id].source = response.data;
                $('#showEditSourceTemplateModal').modal('hide');
                handler.customer.showCustomerTemplateDetail(id);
            }
        });
    },
    showEditFields: function(data){
        var item = session.customerTemplates[data];
        DS.getView('customer/fields', function(view){
            var pane = $('#showEditFieldsTemplateModal');
            pane.empty();
            var html = view;
            for(var i in item.stable_fields) {
                var field = item.stable_fields[i];
                html = html.replace(RegExp('__'+field.name,'g'), field.value);
            }
            html = html.replace(RegExp('__id','g'), item._id)
            html = html.replace(RegExp('__[a-zA-Z]+', 'g'), "");
            pane.html(html);
        });
    },

    editFields: function (data, target) {
        var fields = {};
        for(var i in data) {
            var item = data[i];
            if(item != ""){
                fields[i] = item;
            }
        }
        var action = {
            action: 'customer.editFields',
            data: {
                fields: fields,
                id: target.attr('template-id')
            }
        }
        DS.send(action, function(response){
            if(response.success){
                session.customerTemplates[response.id].stable_fields = fields;
                $('#showEditFieldsTemplateModal').modal('hide');
                handler.customer.showCustomerTemplateDetail(response.id);
            }
        });
    },

    uniqueName : function(data, target) {
        var item = session.customerTemplates[data];
        var action = {
            action: 'customer.uniqueField',
            data: {
                id: data,
                unique : !item.unique_name,
                field: 'unique_name'
            }
        };
        DS.send(action, function(response){
            if(response.success){
                item.unique_name = !item.unique_name;
                target[0].checked = item.unique_name;
            }
        });
    },

    uniqueNum: function(data, target) {
        var item = session.customerTemplates[data];
        var action = {
            action: 'customer.uniqueField',
            data: {
                id: data,
                unique : !item.unique_phone,
                field: 'unique_phone'
            }
        };
        DS.send(action, function(response){
            if(response.success){
                item.unique_phone = !item.unique_phone;
                target[0].checked = item.unique_phone;
            }
        });
    },

    callPop: function(data, target) {
        var item = session.customerTemplates[data];
        var action = {
            action: 'customer.callPop',
            data: {
                id: data,
                call_popup: !item.call_popup
            }
        };
        DS.send(action, function(response){
            if(response.success){
                item.call_popup = !item.call_popup;
                target[0].checked = item.call_popup;
            }
        });
    }

}