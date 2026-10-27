handler.config.customer = {
    menuId:'',
    customerMain: function(menu) {
        var container=$("#view_"+menu);
        // handler.config.customer.menuId=menu;
        // handler.config.customer.showCustomerTemplate(menu);
        if(!isHasMenu("customer_status")){
            container.find(".sub-nav>.tab_customer_status").remove();
        }else{
            container.find(".sub-nav>.tab_customer_status").show();
        }
        if(!isHasMenu("customer_import")){
            container.find(".sub-nav>.tab_customer_import").remove();
        }else{
            container.find(".sub-nav>.tab_customer_import").show();
        }
        if(!isHasMenu("customer_high_seas")){
            container.find(".sub-nav>.tab_customer_high_seas").remove();
        }else{
            container.find(".sub-nav>.tab_customer_high_seas").show();
        }
        if(!isHasMenu("customer_titket_titketManager")){
            container.find(".sub-nav>.tab_customer_titket_titketManager").remove();
        }else{
            container.find(".sub-nav>.tab_customer_titket_titketManager").show();
        }
        if(!isHasMenu("customer_approval_approvalManager")){
            container.find(".sub-nav>.tab_customer_approval_approvalManager").remove();
        }else{
            container.find(".sub-nav>.tab_customer_approval_approvalManager").show();
        }
        container.find(".sub-nav li:first>a").click();
    },
    customerConfig: function(menu) {
        var container=$("#view_"+menu);
        handler.config.customer.menuId=menu;
        handler.config.customer.showCustomerTemplate(menu);
    },
    showCustomerTemplate: function(menu) {
        var container=$("#view_"+menu);
        var account=session.account.account;
        container.find("#customer_addCustomerTemplateModal").attr("ds_data", account);

        //container.find('#config_customer_template_pane').empty();
        var pane = container.find('#account_customer_config');
        var sendData = {};
        sendData.account = account;
        var action = {
            action: 'config.customer.getCustomerTemplate',
            data: sendData
        };
        DS.send(action, function(response) {
            if (response.success) {
                var items = response.data;
                session.customerTemplates = {};
                if(items && items.length>0){
                    var item = items[0];
                    if(!item.maxCommon) item.maxCommon=100;
                    session.customerTemplates[item._id] = item;
                    handler.config.customer.showCustomerTemplateDetail(item._id);
                }
                resize();
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },

    showAddCustomerTemplateItem: function (data) {
        var container=$("#view_"+handler.config.customer.menuId);
        var li=container.find("#config_customer_nav_pane li");
        if(li.length>0){
            $().alertmessage('showError', "客户数据库只能添加一个");
            return;
        }
        DS.getView('config/customer/config_add_customer_template', function (view) {
            var pane = container.find('#addCustomerTemplateModal');
            pane.empty();
            pane.html(view);
            container.find("#account_customer_account").val(data);
            pane.modal();
        });
    },

    addCustomerTemplate: function(data) {
        var container=$("#view_"+handler.config.customer.menuId);
        var action = {
            action: 'config.customer.addCustomerTemplate',
            data: data
        }
        DS.send(action, function(response) {
            if(response.success) {
                $().alertmessage('showSuccess', "添加成功!");
                session.customerTemplates[response.data._id] = response.data;
                //var html = '<li><a class="ds_do_action" ds_action="config.customer.showCustomerTemplateDetail" ds_data="' + response.data._id + '">' + '<i class="icon-chevron-right"></i>' + data.name + '</a></li>'
                //var pane = container.find('#config_customer_nav_pane');
                //pane.append(html);
                //pane.find('li a[ds_data="' + response.data._id + '"]').click();
                handler.config.customer.showCustomerTemplateDetail(response.data._id);
                container.find('#addCustomerTemplateModal').modal('hide');
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },

    showCustomerTemplateDetail: function(data) {
        var container=$("#view_"+handler.config.customer.menuId);
        DS.getView('config/customer/config_customer_detail', function(view){
            var pane = container.find('#config_customer_template_pane');
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

            var competitors=item.competitors;
            if(competitors && competitors.length>0){
                var competitorsView=[];
                for(var k=0;k<competitors.length;k++){
                    competitorsView.push(competitors[k].name);
                }
                pane.find('.config_customer_competitors').html(competitorsView.join(","));
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
            pane.find('.config_customer_maxCommon').html(item.maxCommon);
            handler.config.customer.refreshCustomField(item);

            pane.find("input[name='autoSave']").prop("checked",session.account.autoSave||false);
        });
    },

    refreshCustomField: function(template) {
        var container=$("#view_"+handler.config.customer.menuId);
        var pane = container.find('#custom_fields_pane');
        pane.empty();

        DS.getView('config/customer/custom_field_item', function(view){
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
        var container=$("#view_"+handler.config.customer.menuId);
        DS.getView('config/customer/customer_field_add', function(view) {
            var pane = target.parent();
            pane.empty();
            var html = view.replace(new RegExp('__id', 'g'), data);
            pane.html(html);
        });
    },

    addCustomerField: function(data, target) {
        var template = session.customerTemplates[data.template];
        data.required = (data.required == 'yes')?"required":"";
        data.noupdate = (data.noupdate == 'yes')?true:false;
        //console.dir(data)
        var type=data.type;
        if(type=='dropdown'||type=='checkbox'||type=='radio'){
            if(!data.choices || data.choices.length<=0){
                $().alertmessage('showError', "选项不能为空");
                return;
            }
        }
        var action = {
            action: 'config.customer.addCustomerField',
            data: data
        }
        DS.send(action, function(response) {
            if(response.success) {
                data._id = response._id;
                template.custom_fields.push(data);
                handler.config.customer.refreshCustomField(template);
                handler.config.customer.closeAddCustomerField(template._id);
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },

    closeAddCustomerField: function(data) {
        var container=$("#view_"+handler.config.customer.menuId);
        var pane = container.find("#add_customer_field_pane");
        pane.empty();
        var tmpl='<button type="button" data-toggle="modal" class="btn-add ds_do_action" ds_action="config.customer.showAddCustomerField" ds_data="'+data+'"> 添加自定义字段</button>';
        pane.html(tmpl);
        //pane.html('<span class="add-custom-field enabled ds_do_action" ' +
        //    'ds_action="config.customer.showAddCustomerField" ' +
        //    'ds_data="'+data+'">添加自定义字段</span>');
    },

    moveCustomFieldUp: function(data, target) {
        var container=$("#view_"+handler.config.customer.menuId);
//        if(target.hasClass('inactive'))
//            return;
        if(target.closest("form").prev("form").length==0){
            return;
        }
        data.moveUp = true;
        var action = {
            action: 'config.customer.moveCustomField',
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
                handler.config.customer.refreshCustomField(template);
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },

    moveCustomFieldDown: function(data, target) {
        var container=$("#view_"+handler.config.customer.menuId);
//        if(target.hasClass('inactive'))
//            return;
        if(target.closest("form").next("form").length==0){
            return;
        }
        data.moveUp = false;
        var action = {
            action: 'config.customer.moveCustomField',
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
                handler.config.customer.refreshCustomField(template);
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },

    deleteCustomField: function(data, target) {
        if(!confirm("确认删除这个字段吗?"))return;
        var action = {
            action: 'config.customer.deleteCustomField',
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
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },

    showEditCustomField: function(data, target) {
        var container=$("#view_"+handler.config.customer.menuId);
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
        DS.getView('config/customer/custom_field_edit', function(view){
            var pane = container.find('#add_customer_field_pane');
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
            if(field.noupdate){
                pane.find("#noupdate_optionsRadios1").prop("checked",true);
            }else{
                pane.find("#noupdate_optionsRadios2").prop("checked",true);
            }

            pane.find('#choose_custom_field_type').val(field.type);
            if(field.choices){
                var choice = field.choices[0];
                var pane1 = container.find("#field_attr_pane");
                var count=0;
                var str='';
                for(var key in field.choices){
                    if(count==0){
                      str = '<div class="row-select-box" style="position: relative;">'+
                            '<a class="plus ds_do_action" ds_action="config.customer.plusCustomField" ds_data=""></a>'+
                            '<input type="hidden" name="choiceskey[]"  value="'+key+'">' +
                            '<input class="select-box" type="text" name="choices[]" maxlength="60" value="'+field.choices[key]+'"' +
                            'style="height: 17px;">'+
                            '</div>';
                    } else{
                        str += '<div class="row-select-box" style="position: relative;">'+
                            '<a class="reduce ds_do_action" ds_action="config.customer.reduceCustomField" ds_data=""></a>'+
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
        data.noupdate = (data.noupdate == 'yes')?true:false;
        var select={};
        var max= 0,keys=[];
        var type=data.type;
        if(type=='dropdown'||type=='checkbox'||type=='radio'){
            if(!data.choices || data.choices.length<=0){
                $().alertmessage('showError', "选项不能为空");
                return;
            }
        }
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
            action: 'config.customer.editCustomField',
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
                handler.config.customer.refreshCustomField(template);
                handler.config.customer.closeAddCustomerField(template._id);
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },

    plusCustomField: function(data, target) {
        var pane = target.closest("#field_attr_pane");
        var str = '<div class="row-select-box" style="position: relative;">'+
            '<a class="reduce ds_do_action" ds_action="config.customer.reduceCustomField" ds_data=""></a>'+
            '<input class="select-box" type="text" name="choices[]">'+
            '</div>';
        pane.append(str);
    },
    plusCompetitorsField: function(data, target) {
        var pane = target.closest("#field_attr_pane");
        var str = '<div class="row-select-box" style="position: relative;">'+
            '<a class="reduce ds_do_action" ds_action="config.customer.reduceCustomField" ds_data=""></a>'+
            '<input class="select-box" type="text" name="choices[]">'+
            '</div>';
        pane.append(str);
    },

    reduceCustomField: function(data, target) {
        target.closest('.row-select-box').remove();
    },

    showEditStatus: function (data, target) {
        var container=$("#view_"+handler.config.customer.menuId);
        var item = session.customerTemplates[data];
        var str = item.call_type == 'in'?'in':'out';
        DS.getView('config/customer/config_status_'+str, function(view) {
            var pane = container.find('#showEditStatusTemplateModal');
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
        var container=$("#view_"+handler.config.customer.menuId);
        var status = {};
        for(var i in data) {
            var item = data[i];
            if(item != ""){
                status[i] = item;
            }
        }
        var action = {
            action: 'config.customer.editStatus',
            data: {
                status: status,
                id: target.attr('template-id')
            }
        }
        DS.send(action, function(response){
            if(response.success){
                session.customerTemplates[response.id].status = status;
                container.find('#showEditStatusTemplateModal').modal('hide');
                handler.config.customer.showCustomerTemplateDetail(response.id);
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    showEditSource: function (data, src) {
        var container=$("#view_"+handler.config.customer.menuId);
        var item = session.customerTemplates[data];
        DS.getView('config/customer/config_source', function(view) {
            var pane = container.find('#showEditSourceTemplateModal');
            pane.empty();
            view = view.replace(/__id/g, item._id);
            pane.html(view);

            var source=item.source;
            if(source && source.length>0){
                var sourceView=[];
                var plusTmpl='<div class="row-select-box" style="position: relative;"><a class="plus ds_do_action" ds_action="config.customer.plusCustomField" ds_data=""></a><input type="hidden" name="key[]" value="__key"/><input class="select-box" type="text" name="choices[]" value="__name"   msgName="来源"/></div>';
                var reduceTmpl='<div class="row-select-box" style="position: relative;"><a class="reduce ds_do_action" ds_action="config.customer.reduceCustomField" ds_data=""></a><input type="hidden" name="key[]" value="__key"/><input class="select-box" type="text" name="choices[]" value="__name"   msgName="来源"/></div>';
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
    showEditCompetitors: function (data, src) {
        var container=$("#view_"+handler.config.customer.menuId);
        var item = session.customerTemplates[data];
        DS.getView('config/customer/config_competitors', function(view) {
            var pane = container.find('#showEditCompetitorsTemplateModal');
            pane.empty();
            view = view.replace(/__id/g, item._id);
            pane.html(view);

            var competitors=item.competitors;
            if(competitors && competitors.length>0){
                var plusTmpl='<div class="row-select-box" style="position: relative;"><a class="plus ds_do_action" ds_action="config.customer.plusCompetitorsField" ds_data=""></a><input type="hidden" name="key[]" value="__key"/><input class="select-box" type="text" name="choices[]" value="__name"   msgName="竞争对手"/></div>';
                var reduceTmpl='<div class="row-select-box" style="position: relative;"><a class="reduce ds_do_action" ds_action="config.customer.reduceCustomField" ds_data=""></a><input type="hidden" name="key[]" value="__key"/><input class="select-box" type="text" name="choices[]" value="__name"   msgName="竞争对手"/></div>';
                var html = "";
                for(var k=0;k<competitors.length;k++){
                    if(k==0){
                        html=render.replaceDataByObject(competitors[k],plusTmpl);
                    } else{
                        html+=render.replaceDataByObject(competitors[k],reduceTmpl);
                    }

                }
                pane.find('#field_attr_pane').html(html);
            }
        });
    },
    saveSource: function (data, src) {
        var container=$("#view_"+handler.config.customer.menuId);
        var id=src.attr('template-id');
        var names =data.choices;
        var keys  =data.key;
        var source=[];

        for(var i=0;i<names.length;i++){
            var _n=$.trim(names[i]);
            //console.info("_n===="+_n+",key=="+keys[i]);
            if(_n){
                if(keys[i]){
                    source.push({key:keys[i],name:names[i]});
                } else{
                    source.push({key:"",name:names[i]});
                }
            }
        }
        var action = {
            action: 'config.customer.editSource',
            data: {
                source: source,
                id: id
            }
        }
        DS.send(action, function(response){
            if(response.success){
                session.customerTemplates[id].source = response.data;
                container.find('#showEditSourceTemplateModal').modal('hide');
                handler.config.customer.showCustomerTemplateDetail(id);
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    saveCompetitors: function (data, src) {
        var container=$("#view_"+handler.config.customer.menuId);
        var id=src.attr('template-id');
        var names =data.choices;
        var keys  =data.key;
        var competitors=[];

        for(var i=0;i<names.length;i++){
            var _n=$.trim(names[i]);
            //console.info("_n===="+_n+",key=="+keys[i]);
            if(_n){
                if(keys[i]){
                    competitors.push({key:keys[i],name:names[i]});
                } else{
                    competitors.push({key:"",name:names[i]});
                }
            }
        }
        var action = {
            action: 'config.customer.editCompetitors',
            data: {
                competitors: competitors,
                id: id
            }
        }
        DS.send(action, function(response){
            if(response.success){
                session.customerTemplates[id].competitors = response.data;
                container.find('#showEditCompetitorsTemplateModal').modal('hide');
                handler.config.customer.showCustomerTemplateDetail(id);
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    showEditFields: function(data){
        var container=$("#view_"+handler.config.customer.menuId);
        var item = session.customerTemplates[data];
        DS.getView('config/customer/fields', function(view){
            var pane = container.find('#showEditFieldsTemplateModal');
            pane.empty();
            var html = view;
            for(var i in item.stable_fields) {
                var field = item.stable_fields[i];
                html = html.replace(RegExp('__'+field.name, 'g'), field.value);
                if(field.required == 'required'){
                    //pane.find("#"+field.name+"_required").attr("checked",true);
                    html = html.replace(RegExp(field.name+'_required_checked', 'g'), "checked");
                }
                if(field.search){
                    html = html.replace(RegExp(field.name+'_search_checked', 'g'), "checked");
                }
                if(field.noupdate){
                    html = html.replace(RegExp(field.name+'_noupdate_checked', 'g'), "checked");
                }
            }
            html = html.replace(RegExp('__id','g'), item._id)
            html = html.replace(RegExp('__[a-zA-Z]+', 'g'), "");
            pane.html(html);
            if(item.template_type=='personal'){
                pane.find(".field_personal").show();
            }
        });
    },

    editFields: function (data, target) {
        //console.dir(data);
        var container=$("#view_"+handler.config.customer.menuId);
        var fields = new Array();
        //先遍历字段，创建对象
        for(var i in data) {
            var item = data[i];
            if(item != "") {
                var arr = i.split("_");
                var arr1 = arr[0];
                var arr2 = arr[1];
                if (!arr2) {
                    var field = {
                        name: arr1,
                        value: item,
                        required: "",
                        search: false,
                        noupdate:false
                    };
                    fields.push(field);
                }
            }
        }
        //然后遍历复选框，将其加在所属的对象里
        for(var i in data) {
            var item = data[i];
            if(item != "") {
                var arr = i.split("_");
                var arr1 = arr[0];
                var arr2 = arr[1];
                if (arr2) {
                    for(var o in fields){
                        var field = fields[o];
                        if(field.name == arr1){
                            if(arr2 == "required" && item) {
                                field.required = "required";
                            }else if(arr2 == "search" && item){
                                field.search = item;
                            }else if(arr2 == "noupdate" && item){
                                field.noupdate = item;
                            }
                        }
                    }
                }
            }
        }
        var action = {
            action: 'config.customer.editFields',
            data: {
                fields: fields,
                id: target.attr('template-id')
            }
        }
        DS.send(action, function(response){
            if(response.success){
                session.customerTemplates[response.id].stable_fields = fields;
                container.find('#showEditFieldsTemplateModal').modal('hide');
                handler.config.customer.showCustomerTemplateDetail(response.id);
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },

    uniqueName : function(data, target) {
        var container=$("#view_"+handler.config.customer.menuId);
        var item = session.customerTemplates[data];
        var action = {
            action: 'config.customer.uniqueField',
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
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },

    uniqueNum: function(data, target) {
        var item = session.customerTemplates[data];
        var action = {
            action: 'config.customer.uniqueField',
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
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },

    callPop: function(data, target) {
        var item = session.customerTemplates[data];
        var action = {
            action: 'config.customer.callPop',
            data: {
                id: data,
                call_popup: !item.call_popup
            }
        };
        DS.send(action, function(response){
            if(response.success){
                item.call_popup = !item.call_popup;
                target[0].checked = item.call_popup;
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    setAutoSave : function(data, src) {
        var isAuto=session.account.autoSave;
        var action = {
            action: 'config.customer.setAutoSave',
            data: {
                autoSave:!isAuto
            }
        };
        DS.send(action, function(response){
            if(response.success){
                session.account.autoSave=!isAuto;
                src[0].checked = session.account.autoSave;
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },

    //showEditMaxCommon: function (data, src) {
    //    var container=$("#view_"+handler.config.customer.menuId);
    //    var item = session.customerTemplates[data];
    //    DS.getView('config/customer/config_maxCommon', function(view) {
    //        var pane = container.find('#showEditMaxCommonTemplateModal');
    //        pane.empty();
    //        view=DS.renderMethodView(view,item);
    //        pane.html(view);
    //    });
    //},
    //saveMaxCommon: function (data, src) {
    //    var container=$("#view_"+handler.config.customer.menuId);
    //    var id=data._id;
    //    var action = {
    //        action: 'config.customer.saveMaxCommon',
    //        data: data
    //    }
    //    DS.send(action, function(response){
    //        if(response.success){
    //            session.customerTemplates[id].maxCommon = response.data;
    //            container.find('#showEditMaxCommonTemplateModal').modal('hide');
    //            handler.config.customer.showCustomerTemplateDetail(id);
    //        }else{
    //            $().alertmessage('showError', errMsg);
    //        }
    //    });
    //}

}