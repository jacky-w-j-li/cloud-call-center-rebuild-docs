handler.callRecord ={
    callRecordConfig: function() {
        handler.callRecord.getAccountCallRecord({}, $(""));
    },
    getAccountCallRecord : function(data, src){
        data.page = src.val() || 1;
        data.limit = handler.account.queryPageSize;
        DS.getView("callRecord/callRecordList_item", function (view) {
            var pane = $("#callRecord_list_pane");
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
                    DS.updatePagination("query_callRecord_form", count, data.limit, data.page);
                } else {
                    alert("查询账户异常！");
                }
            });
        });
    },
    showCallRecordConfig: function(data) {
        var index = data.indexOf(",");
        var pane=$("#account_callRecord_config");
        pane.show();
        var account = data.substring(0, index);
        var accountName = data.substring(index + 1, data.length);
        pane.find(".accountName").html(accountName);
        pane.find(".add-custom-field").attr("ds_data", account);

        pane.find('.config_main').empty();
        var accountAction = {
            action : 'manager.account.queryAccountById',
            data :{_id:account}
        };
        DS.send(accountAction,function(response){
            if(response.success){
                var accountObj = response.data;
                var sendData = {};
                sendData.account = account;
                var action = {
                    action: 'callRecord.getCallRecordTemplate',
                    data: sendData
                };
                DS.send(action, function(response) {
                    if (response.success) {
                        var items = response.data;
                        session.callRecordTmpl = {};
                        var navItems = "";
                        var nav = pane.find('.config_nav');
                        nav.empty();
                        var currentSelect = pane.find("#current_call_config");
                        currentSelect.empty();
                        currentSelect.attr("account",accountObj._id);
                        currentSelect.append("<option value=''>--请选择--</option>");
                        for (var i in items) {
                            var item = items[i];
                            session.callRecordTmpl[item._id] = item;
                            navItems += '<li><a class="ds_do_action" ds_action="callRecord.showTmplDetail" ds_data="' + item._id + '">' +
                                '<i class="icon-chevron-right"></i>'+item.name+'</a></li>';
                            currentSelect.append("<option value="+item._id+">"+item.name+"</option>");
                        }
                        currentSelect.val(accountObj.currentCallRecord);
                        nav.append(navItems);
                        nav.find('li a:first').click();
                        resize();
                    }else{
                        $().alertmessage('showError', errMsg);
                    }
                });

            } else {
                $().alertmessage('showError', "查询账户信息异常！");
            }
        });


    },
    showTmplDetail: function(data) {
        var pane=$("#account_callRecord_config");
        DS.getView('callRecord/callRecord_detail', function(view){
            var container = pane.find('.config_main');
            container.empty();
            container.html(view.replace(/__id/g, data));
            var item = session.callRecordTmpl[data];
            var html = [];
            for(var i in item.types) {
                var type = item.types[i];
                html.push(type.name);
            }
            pane.find('.config_types').html(html.join(","));
            handler.callRecord.refreshCustomField(item);
        });
    },
    showAddTmpl: function(account){
        var pane=$("#account_callRecord_config");
        DS.getView('callRecord/callRecord_tmpl_add', function (view) {
            view=view.replace(/__account/g,account)
            var modal = pane.find('#addCallRecordTemplateModal');
            modal.empty();
            modal.html(view);
        });
    },
    addTmpl: function(data) {
        var pane=$("#account_callRecord_config");
        var action = {
            action: 'callRecord.addCallRecordTemplate',
            data: data
        }
        DS.send(action, function(response) {
            if(response.success) {
                $().alertmessage('showSuccess', "添加成功");
                session.callRecordTmpl[response.data._id] = response.data;
                var html = '<li><a class="ds_do_action" ds_action="callRecord.showTmplDetail" ds_data="' + response.data._id + '">' + '<i class="icon-chevron-right"></i>' + data.name + '</a></li>'
                var container = pane.find('.config_nav');
                container.append(html);
                pane.find('#addCallRecordTemplateModal').modal('hide');
                pane.find('li a[appdata="' + response.data._id + '"]').click();
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    showEditTypes: function (data, target) {
        var pane=$("#account_callRecord_config");
        var item = session.callRecordTmpl[data];
        DS.getView('callRecord/callRecord_types', function(view) {
            var container = pane.find('#callRecord_types_modal');
            container.empty();
            view = view.replace(/__id/g, item._id);
            container.html(view);

            var types=item.types;
            if(types && types.length>0){
                var plusTmpl='<div class="row-select-box" style="position: relative;"><a class="plus ds_do_action" ds_action="callRecord.plusCustomField" ds_data=""></a><input type="hidden" name="key[]" value="__key"/><input class="select-box" type="text" name="choices[]" value="__name"/></div>';
                var reduceTmpl='<div class="row-select-box" style="position: relative;"><a class="reduce ds_do_action" ds_action="callRecord.reduceCustomField" ds_data=""></a><input type="hidden" name="key[]" value="__key"/><input class="select-box" type="text" name="choices[]" value="__name"/></div>';
                var html = "";
                for(var k=0;k<types.length;k++){
                    if(k==0){
                        html=render.replaceDataByObject(types[k],plusTmpl);
                    } else{
                        html+=render.replaceDataByObject(types[k],reduceTmpl);
                    }

                }
                container.find('.field_attr_pane').html(html);
            }
        });
    },
    saveTypes: function (data, src) {
        var id=src.attr('template-id');
        var names =data.choices;
        var keys  =data.key;
        var types=[];
        for(var i=0;i<names.length;i++){
            if(keys[i]){
                types.push({key:keys[i],name:names[i]});
            } else{
                types.push({key:"",name:names[i]});
            }

        }
        var action = {
            action: 'callRecord.editTypes',
            data: {
                types: types,
                id: id
            }
        }
        var pane=$("#account_callRecord_config");
        DS.send(action, function(response){
            if(response.success){
                session.callRecordTmpl[id].types = response.data;
                pane.find('#callRecord_types_modal').modal('hide');
                handler.callRecord.showTmplDetail(id);
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },

    /**************************custom fields start*******************************/
    refreshCustomField: function(template) {
        var pane=$("#account_callRecord_config");
        var container = pane.find('.custom_fields_pane');
        container.empty();
        DS.getView('callRecord/custom_field_item', function(view){
            var html = '';
            for(var i = 0; i< template.custom_fields.length;i++) {
                var field = template.custom_fields[i];
                html += view.replace(/__name/g, field.name).replace(/__type/g, field.type)
                    .replace(new RegExp('__template', 'g'), template._id).replace(new RegExp('__id', 'g'), field._id);
            }
            container.html(html);
        });
    },
    showAddCustomField: function(data, target) {
        DS.getView('callRecord/custom_field_add', function(view) {
            var pane = target.parent();
            pane.empty();
            var html = view.replace(new RegExp('__id', 'g'), data);
            pane.html(html);
        });
    },

    addCustomField: function(data, target) {
        var template = session.callRecordTmpl[data.template];
        data.required = (data.required == 'yes')?"required":"";
        var action = {
            action: 'callRecord.addCustomField',
            data: data
        }
        DS.send(action, function(response) {
            if(response.success) {
                data._id = response._id;
                delete data["template"];
                template.custom_fields.push(data);
                handler.callRecord.refreshCustomField(template);
                handler.callRecord.closeAddCustomField(template._id);
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },

    closeAddCustomField: function(data) {
        var container=$("#account_callRecord_config");
        var pane = container.find('.custom_field_add_pane');
        pane.empty();
        pane.html('<span class="add-custom-field enabled ds_do_action" ' +
            'ds_action="callRecord.showAddCustomField" ' +
            'ds_data="'+data+'">添加自定义字段</span>');
    },

    moveCustomFieldUp: function(data, target) {
        if(target.closest("form").prev("form").length==0){
            return;
        }
        data.moveUp = true;
        var action = {
            action: 'callRecord.moveCustomField',
            data: data
        };
        DS.send(action, function(response){
            if(response.success) {
                var template = session.callRecordTmpl[data.template_id];
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
                handler.callRecord.refreshCustomField(template);
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },

    moveCustomFieldDown: function(data, target) {
        if(target.closest("form").next("form").length==0){
            return;
        }
        data.moveUp = false;
        var action = {
            action: 'callRecord.moveCustomField',
            data: data
        };
        DS.send(action, function(response) {
            if(response.success) {
                var template = session.callRecordTmpl[data.template_id];
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
                handler.callRecord.refreshCustomField(template);
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },

    deleteCustomField: function(data, target) {
        var action = {
            action: 'callRecord.deleteCustomField',
            data: data
        }
        DS.send(action, function(response){
            if(response.success) {
                var template = session.callRecordTmpl[data.template_id];
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
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },

    showEditCustomField: function(data, target) {
        var container=$("#account_callRecord_config");
        var template = session.callRecordTmpl[data.template_id];
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
        DS.getView('callRecord/custom_field_edit', function(view){
            var pane = container.find('.custom_field_add_pane');
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
            pane.find('.choose_custom_field_type').val(field.type);
            if(field.choices){
                var choice = field.choices[0];
                var pane1 = pane.find(".field_attr_pane");
                var count=0;
                var str='';
                for(var key in field.choices){
                    if(count==0){
                        str = '<div class="row-select-box" style="position: relative;">'+
                            '<a class="plus ds_do_action" ds_action="callRecord.plusCustomField" ds_data=""></a>'+
                            '<input type="hidden" name="choiceskey[]"  value="'+key+'">' +
                            '<input class="select-box" type="text" name="choices[]" maxlength="60" value="'+field.choices[key]+'"' +
                            'style="height: 17px;">'+
                            '</div>';
                    } else{
                        str += '<div class="row-select-box" style="position: relative;">'+
                            '<a class="reduce ds_do_action" ds_action="callRecord.reduceCustomField" ds_data=""></a>'+
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
        var template = session.callRecordTmpl[data.template_id];
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
            action: 'callRecord.editCustomField',
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
                handler.callRecord.refreshCustomField(template);
                handler.callRecord.closeAddCustomField(template._id);
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },

    plusCustomField: function(data, target) {
        var pane = target.closest(".field_attr_pane");
        var str = '<div class="row-select-box" style="position: relative;">'+
            '<a class="reduce ds_do_action" ds_action="callRecord.reduceCustomField" ds_data=""></a>'+
            '<input class="select-box" type="text" name="choices[]" maxlength="60" style="height: 17px;">'+
            '</div>';
        pane.append(str);
    },

    reduceCustomField: function(data, target) {
        target.closest('.row-select-box').remove();
    }
}
