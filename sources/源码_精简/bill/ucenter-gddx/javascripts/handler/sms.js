
handler.sms = {
    smsTemplateDataCache: {},
    smsTemplateToCheckStatusCache:[],
    smsTemplateTypeCache:[],
    smsSignCache:[],
    getTemplateToCheckStatusName: function (status) {
        var stat = handler.sms.smsTemplateToCheckStatusCache;
        for(var i=0;i<stat.length;i++){
            if(stat[i].code_value == status){
                return stat[i].code_name;
            }
        }
        return '未知';
    },
    getTemplateTypeName: function (tpltype) {
        var tpltypes = handler.sms.smsTemplateTypeCache;
        for(var i=0;i<tpltypes.length;i++){
            if(tpltypes[i].code_value == tpltype){
                return tpltypes[i].code_name;
            }
        }
        return '未知';

    },
    sms_template_new: function (data) {
        var tpltypes = handler.sms.smsTemplateTypeCache;
        var html = "";
        for(var i=0;i<tpltypes.length;i++){
            html += '<input type="radio" name="templateType" value="'+tpltypes[i].code_value+'"/>'+tpltypes[i].code_name+'&nbsp;&nbsp;';
        }
        DS.getView('cc/sms/sms_template_new', function (view) {
            view = view.replace('_smsTemplateTypeToReplace_',html);
            var p=$('#show_sms_template_new_modal');
            p.find(".modal-dialog").width(800);
            p.find(".modal-body").html(view);
            p.modal();
        });
    },
    postSmsTemplate: function (data,src) {
        console.log('wktest...pppppp');
        data.account  = session.account._id;
        if(! data.account){
            return $().alertmessage('showError','未知账户');
        }
        if(data.signToCheck && data.name && data.content && data.templateType){
            var action = {data:data,action:'app.smsTemplateToCheck.postSmsTemplate'}
            DS.send(action,function(res){
                if(res.success){
                    $('#sms_template_new_name').val('');
                    $('#sms_template_new_content').val('');
                    $('#sms_template_new_sign').val('');
                    $().alertmessage('showSuccess',"成功添加报备短信模版");

                }else{
                    $().alertmessage('showError','抱歉，添加报备短信模版失败');
                }
            });

        }else{
            $().alertmessage('showError','请完善模版信息');
        }

    },
    updateSmsTemplateToCheck:function(data){
        var action = {
            action: 'app.smsTemplateToCheck.updateSmsTemplateToCheck',
            data: data
        }
        if(data._id&&data.signToCheck && data.name && data.content&&data.templateType){

            DS.send(action,function(res){
                if(res.success){
                    $().alertmessage('showSuccess',"修改成功");
                    $('#sms_template_to_check_query_link').trigger('click');
                }else{
                    $().alertmessage('showError','修改失败');
                }
            });

        }else{
            $().alertmessage('showError','请完善模版信息');
        }
    },
    sms_template_to_check_query:function(data){
        handler.sms.initSmsDict();
        $("#right_pane").find('.ds_date').datetimepicker({
//            changeMonth: true,
//            changeYear: true,
//            minDate:0,
            showButtonPanel: true
        });
        $('#sms_template_to_check_query_link').trigger('click');
    },
    searchSmsTemplateToCheck: function(data,src){

        data=data||{};
        var pane=$("#right_pane");
        data.pageSize = 5;
        data.page = 1;
        if(src && src.attr("value")){
            data.page = src.attr("value");
        }else{
            var frmData = DS.getDataOfForm($("#sms_template_to_check_query_form"));
            data=frmData.data;
            data.page = pane.find(".pagination li[class='active']").find("a").attr("value")||1;
            data.pageSize = 5 ;
        }
        data.status = {'$ne':3};
        handler.sms.smsTemplateToCheckDataCache = {};
        var cache = handler.sms.smsTemplateToCheckDataCache;
        var action = {
            action: 'app.smsTemplateToCheck.querySmsTemplateToCheck',
            data: data
        }
        DS.send(action, function (res) {
            if (res.success) {
                var list = res.list;
                console.log('wktest...'+list.length);
                if (list.length > 0) {
                    DS.getView('cc/sms/sms_template_to_check_table_item', function (view) {
                        DS.getView('cc/sms/sms_template_to_check_table_item_checked',function(view1) {
                            DS.getView('cc/sms/sms_template_to_check_table_item_refused',function(view2) {
                                var html = [];
                                var smsTemp = null;
                                for (var j = 0; j < list.length; j++) {
                                    smsTemp = list[j];
                                    if (smsTemp.signToCheck) {
                                        smsTemp.signToDisplay = smsTemp.signToCheck;
                                    } else {
                                        var signs = handler.sms.smsSignCache;
                                        for (var i = 0; i < signs.length; i++) {
                                            if (signs[i]._id == smsTemp.sign) {
                                                smsTemp.signToDisplay = signs[i].name;
                                            }
                                        }
                                    }
                                    if (smsTemp.status == 1) {
                                        html.push(DS.renderMethodViewNew(view1, smsTemp));
                                        if (cache) {
                                            cache[smsTemp._id] = smsTemp;
                                        }
                                    }else if(smsTemp.status == 2) {
                                        html.push(DS.renderMethodViewNew(view2, smsTemp));
                                        if (cache) {
                                            cache[smsTemp._id] = smsTemp;
                                        }
                                    }else {
                                        html.push(DS.renderMethodViewNew(view, smsTemp));
                                        if (cache) {
                                            cache[smsTemp._id] = smsTemp;
                                        }
                                    }
                                }
                                $('#sms_template_to_check_tbody').html(html.join(''));
                            });
                        });
                    });
                } else {
                    $('#sms_template_to_check_tbody').html('');
                }
                DS.updatePagination('sms_template_to_check_query_form', res.count, data.pageSize, data.page);
                $('.result_count').text(res.count);
            } else {
                $().alertmessage('showError','查询失败，请重新查询');
            }
        });
    },
    showSmsTemplateToCheckMessage: function (_id) {
        //var currentSmsTempMes = handler.sms.smsTemplateToCheckDataCache[data].messages;
        var currentSmsTempMes = [];
        var action = {
            action: 'app.smsTemplateToCheck.querySmsTemplateToCheckMessage',
            data: _id
        }
        DS.send(action, function (res) {
            if (res.success) {
                if(res.data.signToCheck){
                    res.data.signToDisplay = res.data.signToCheck;
                }else{
                    var signs = handler.sms.smsSignCache;
                    for(var j=0;j<signs.length;j++){
                        if(signs[j]._id == res.data.sign){
                            res.data.signToDisplay = signs[i].name;
                        }
                    }
                }
                var tpltypes = handler.sms.smsTemplateTypeCache;
                for(var k=0;k<tpltypes.length;k++){
                    if(tpltypes[k].code_value == res.data.templateType ){
                       res.data.templateTypeToDisplay = tpltypes[k].code_name;
                    }
                }
                currentSmsTempMes = res.data.messages;
                DS.getView('cc/sms/show_sms_template_to_check_messages', function (view) {
                    var messageToReplace = '<tr><th>内容</th><th>发送人</th><th>时间</th></tr>';

                    for(var j=0;j<currentSmsTempMes.length;j++){
                        messageToReplace += '<tr><td>'+currentSmsTempMes[j].content+'</td><td>'+currentSmsTempMes[j].from+'</td><td>'+currentSmsTempMes[j].time+'</td><tr/>';
                    }
                    view = view.replace('_messageToReplace_',messageToReplace);
                    view = view.replace('_idToReplace_',_id);
                    view = DS.renderMethodViewNew(view, res.data);
                    $('#right_pane').html(view);
                });
            } else {
                $().alertmessage('showError','查询失败，请重新查询');
                return ;
            }
        });

    },
    addSmsTemplateToCheckMessages: function(data){
        if(!data.content || data.content.trim()== ''){
            return $().alertmessage('showError','请输入回复内容');
        }
        data.time = DS.getCurrentDateTime();
        data.from = session.account._id;
        var action = {action:'app.smsTemplateToCheck.addSmsTemplateToCheckMessages',data:data}
        DS.send(action,function(res){
            if(res.success){
                $().alertmessage('showSuccess','回复成功');
                $('#message_content').val('');
                var newMes = '<tr><td>'+data.content+'</td><td>'+data.from+'</td><td>'+data.time+'</td></tr>';
                $('#sms_messages_table').append(newMes);
            }else{
                $().alertmessage('showError','回复失败，请稍后再试');
            }
        });
    },
    cancelSmsTemplateToCheck:function(data,src){
        var action = {action:'app.smsTemplateToCheck.cancelSmsTemplateToCheck',data:{_id:data}};
        DS.send(action,function(res){
            if(res.success){
                $().alertmessage('showSuccess','取消成功');
                $('#sms_template_to_check_query_link').trigger('click');
            }else{
                $().alertmessage('showError','取消失败，请稍后再试');
            }
        });
    },
    showModifySmsTemplateToCheck: function(data){
        var smsTemplate = handler.sms.smsTemplateToCheckDataCache[data];
        DS.getView('cc/sms/modify_sms_template_to_check', function (view) {
            view = DS.renderMethodViewNew(view,smsTemplate);
            var html = '';
            var tpltypes = handler.sms.smsTemplateTypeCache;
            for(var i=0;i<tpltypes.length;i++){
                if(tpltypes[i].code_value == smsTemplate.templateType){
                    html += '<input checked="checked" type="radio" name="templateType" value="'+tpltypes[i].code_value+'"/>'+tpltypes[i].code_name+'&nbsp;&nbsp;';
                }else{
                    html += '<input type="radio" name="templateType" value="'+tpltypes[i].code_value+'"/>'+tpltypes[i].code_name+'&nbsp;&nbsp;';
                }
            }
            view = view.replace('_smsTemplateTypeToReplace_',html);
            var p=$('#modify_sms_template_modal');
            p.find(".modal-dialog").width(800);
            p.find(".modal-body").html(view);
            p.modal();
        });
    },
    resetSms: function (data, src) {
        var form = src.closest('form');
        form.get(0).reset();
        $(form).find("span[contenteditable='true']").text("").css("display", "inline-block");
        $(form).find(".smsTemplateTitle,.batchSmsTemplateTitle").empty();
        var owner = $("#create_user_select_input");
        if (owner.length > 0) {
            owner.val("");
        }
        if (data == 'send') {
            $("#smsContentPane").find("span").text('');
            $("#smsContentPane").find("span").css("display", "inline-block");
            $("#smsVarsListPane").find("input").val('');
        } else if (data == 'batch') {
            $("#batchSmsContentPane").find("span").text('');
            $("#batchSmsContentPane").find("span").css("display", "inline-block");
            $("#batchSmsVarsListPane").find("input").val('');
        }
        if (form.find('.smsTemplate').length > 0) {
            form.find('.smsTemplate').val(handler.sms.smsCurTemplate.num);
        }
        if (form.find('.batchSmsTemplate').length > 0) {
            form.find('.batchSmsTemplate').val(handler.sms.smsBatchCurTemplate.num);
        }
    },
    initSmsDict:function(){
        if(handler.sms.smsTemplateTypeCache.length == 0){
            var action = {
                action: 'app.smsTemplateToCheck.getCCDicCodes',
                data: {code_type:'smsTemplateType'}
            }
            DS.send(action,function(res){
                    if(res.success){
                        handler.sms.smsTemplateTypeCache = res.list
                    }
                }
            );
        }
        if(handler.sms.smsSignCache.length == 0){
            var action = {
                action: 'app.smsTemplateToCheck.getAccountSigns',
                data:{account:session.account._id}
            }
            DS.send(action,function(res){
                    if(res.success){
                        handler.sms.smsSignCache = res.list
                    }
                }
            );
        }
        if(handler.sms.smsTemplateToCheckStatusCache.length == 0){
            var action = {
                action: 'app.smsTemplateToCheck.getCCDicCodes',
                data: {code_type:'smsTemplateToCheckStatus'}
            }
            DS.send(action,function(res){
                    if(res.success){
                        handler.sms.smsTemplateToCheckStatusCache = res.list
                    }
                }
            );
        }
    },
    showSmsTemplateRefusedReason:function(_id){
        var action = {
            action: 'app.smsTemplateToCheck.querySmsTemplateToCheckMessage',
            data: _id
        }
        DS.send(action, function (res) {
            if (res.success) {
                var reason = "未知原因，请咨询管理员";
                if(res.data.messages.length >= 1){
                    for(var i=res.data.messages.length - 1;i>=0;i--){
                        if(res.data.messages[i].from == 'admin'){
                            reason = res.data.messages[i].content;
                            break;
                        }
                    }
                }
                $().alertmessage('showError',reason);
            } else {
                $().alertmessage('showError','查询失败，请稍后再试');
            }
        });
    }
}

