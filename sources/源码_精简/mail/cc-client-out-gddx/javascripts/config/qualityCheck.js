/**
 * Created by chenguang on 8/21/14.
 */
$(document).on('click', '.ds-config-quality-check-add-config', function(){
    var html = handler.config.qualityCheck.getQualityCheckListItem();
    $('#config_quality_check_template_config_table_pane').append(html);
});
$(document).on('click', '.ds-config-quality-check-remove-config', function(){
    var self = $(this);
    var tr = self.parents('tr');
    tr.remove();
})

handler.config.qualityCheck = {
    currentTemplates : null,
    showTemplateStatus: function(status,reverse){
        if(status && status == 'true'){
            if(reverse)
                return '停用';
            return '启用';
        }else{
            if(reverse)
                return '启用';
            return '停用';
        }
    },
    changeQualityCheckTemplateStatus: function(data){
        var action = {
            action: 'config.qualityCheck.changeQualityCheckTemplateStatus',
            data: {
                _id : data.split(',')[0],
                currentStatus : data.split(',')[1]
            }
        };
        DS.send(action, function (response) {
            if (response.success) {
                handler.config.qualityCheck.config_quality_check_template();
                $().alertmessage('showSuccess', "更改质检模板状态成功！");
            } else {
                $().alertmessage('showError', '更新质检模板状态失败！');
            }
        });
    },
    getQualityCheckConfigs: function(){
        if(handler.qualityCheck.currentTemplate == null){
            var templates = getCache('qualityCheckTemplates');
            if(templates.length >0)
                handler.qualityCheck.currentTemplate = templates[0];
            else
                return [];
        }
        var configs = handler.qualityCheck.currentTemplate.config;
        configs = configs.sort(function(a, b) {
            if(parseInt(b.weight) != parseInt(a.weight)){
                return parseInt(b.weight) - parseInt(a.weight);
            }else{
                return parseInt(b.order) - parseInt(a.order);
            }
        });
        return configs;
    },
    config_quality_check_template: function(data) {
        var action = {
            action: 'config.qualityCheck.queryQualityCheckTemplate',
            data: {
                account: session.user.account
            }
        };
        DS.send(action, function (response) {
            if (response.success) {
                var configs = response.list;
                handler.config.qualityCheck.currentTemplates = configs;
                if(configs.length > 0) {
                    DS.getView("config/qualityCheck/quality_check_template_item", function (view) {
                        var config = null;
                        var html = [];
                        for(var i= 0,len=configs.length;i<len;i++) {
                            config = configs[i];
                            html.push(DS.renderMethodViewNew(view, config));
                        }
                        var pane = $("#config_quality_check_template_pane");
                        pane.empty();
                        pane.html(html.join(''));
                    });
                } else {
                    $("#config_quality_check_template_pane").html('');
                }
            } else {
                $("#config_quality_check_template_pane").html('');
            }
        });
    },
    saveQualityCheckTemplate: function(data) {
        if(!handler.config.qualityCheck.checkAualityStandard(data)){
            return;
        }
        data.config = [
            {
                "order" : 1,
                "name" : "专业水平",
                "weight" : "40"
            },
            {
                "order" : 2,
                "name" : "态度语气",
                "weight" : "30"
            },
            {
                "order" : 3,
                "name" : "解决程度",
                "weight" : "30"
            }
        ]
        var action = {
            action: 'config.qualityCheck.saveQualityCheckTemplate',
            data: data
        };
        DS.send(action, function (response) {
            if(response.success){
                handler.config.qualityCheck.config_quality_check_template();
                $("#config_quality_check_template_container").html('');
            } else {
                alert('保存失败，请重新保存');
            }
        });
    },
    saveEditQualityCheckTemplate: function(data){
        if(!handler.config.qualityCheck.checkAualityStandard(data)){
            return;
        }
        delete data.config_name;
        delete data.config_weight;
        delete data.config_fatal;
        var configs = [];
        var tbody = $("#config_quality_check_template_config_table_pane");
        var trs = tbody.children("tr");
        var weightCount = 0;
        for(var i=0 ; i < trs.length ; i++){
            var tds = $(trs[i]).children("td");
            var name = null;
            var weight = null;
            var fatal = null;
            for(var j=0 ; j <tds.length ;j++){
                var tmpName = $(tds[j]).children("input[name='config_name']");
                var tmpWeight = $(tds[j]).children("input[name='config_weight']");
                var tmpFatal = $(tds[j]).children("input[name='config_fatal']");
                if(tmpName.length>0){
                    name = tmpName;
                }
                if(tmpWeight.length >0){
                    weight = tmpWeight
                }
                if(tmpFatal.length >0){
                    fatal = tmpFatal
                }
            }
            if(name.val() == ''|| weight.val() ==''){
                alert('质检项名字和权重必须填写!');
                return
            }
            configs.push({order:i+1,name:name.val(),weight:weight.val(),fatal:fatal[0].checked});
            weightCount += parseInt(weight.val());
        }
        if(weightCount!=100){
            alert('质检项权重之和相加必须等于100!');
            return;
        }
        data.config = configs;
        var action = {
            action: 'config.qualityCheck.saveQualityCheckTemplate',
            data: data
        };
        DS.send(action, function (response) {
            if(response.success){
                handler.config.qualityCheck.config_quality_check_template();
                $("#config_quality_check_template_container").html('');
            } else {
                alert('保存失败，请重新保存');
            }
        });
    },
    showAddQualityCheckConfig: function(data) {
        DS.getView("config/qualityCheck/add_quality_check_config", function (view) {
            var pane = $("#config_quality_check_container");
            pane.empty();
            pane.html(view);
        });
    },
    showAddQualityCheckTemplate: function(data) {
        DS.getView("config/qualityCheck/add_quality_check_template", function (view) {
            var pane = $("#config_quality_check_template_container");
            pane.empty();
            pane.html(view);
        });
    },
    saveQualityCheckConfig: function(data) {
        var weight = data.WEIGHT;
        if(!/^\d+$/.test(weight) || weight=='0' || /^0/.test(weight)) {
            alert('请正确填写权重：1至100之间的整数');
            return false;
        }
        var configs = handler.config.cdr.currentConfigs;
        var weightAmount = 0;
        var config = null;
        for(var ind in configs) {
            config = configs[ind];
            if(config._id != data._id){
                weightAmount += parseInt(config.WEIGHT);
            }
        }
        weightAmount += parseInt(weight);

        if (weightAmount > 100) {
            alert('所有质检项权重之和已大于100，请先调整已有的权重');
            return false;
        }

        var action = {
            action: 'config.cdr.saveQualityCheckConfig',
            data: data
        };
        sendAction(action, function (response) {
            if(response.success){
                handler.config.cdr.config_quality_check();
                $("#config_quality_check_container").html('');
            } else {
                alert('保存失败，请重新保存');
            }
        });
    },
    confirmDelQualityConfig : function(data){
        getBufferedView('config/cdr/confirm_delete_quality_config', function (view) {
            var panel = $('#confirm_del_quality_config_pane');
            panel.html('');
            view = view.replace(/__doDeleteButton/g, "<a class='btn btn-danger action' appaction='config.cdr.deleteQualityCheckConfig' appdata='"+data+"'>确认删除</a>");

            panel.append(view);
            $('#confirm_del_quality_config_Modal').modal();
        });
    },
    deleteQualityCheckConfig: function(data) {
        var action = {
            action: 'config.cdr.deleteQualityCheckConfig',
            data: {
                _id: data
            }
        };
        sendAction(action, function (response) {
            if(response.success){
                handler.config.cdr.config_quality_check();
                alert('删除质检项成功！');
            } else {
                alert('删除失败，请重试');
            }
        });
    },
    cancelQualityCheckTemplate: function(){
        $("#config_quality_check_template_container").html('');
    },
    showEditQualityCheckTemplate: function(data) {
        var templates = handler.config.qualityCheck.currentTemplates;
        var template = null;
        for(var ind in templates) {
            template = templates[ind];
            if(template._id == data) {
                break;
            }
        }
        if(template) {
            DS.getView("config/qualityCheck/edit_quality_check_template", function (view) {
                var pane = $("#config_quality_check_template_container");
                pane.empty();
                pane.html(view);
                objectToForm($('#config_quality_template_update_form'), template);
                if(template.config){
                    var tablePane = $("#config_quality_check_template_config_table_pane");
                    var oneHtml = '<tr class="info"><td><input name="config_name" class="input" value="__name"/></td>' +
                        '<td><input name="config_weight" class="input-small" value="__weight" maxlength="2"/>%'+
                        '<input type="checkbox" name="config_fatal" style="margin: 4px 3px 0px 5px;" __fatal/>是否致命项'+
                        '</td>'+
                        //'<td><input name="config_weight" class="input-small" value="__weight" maxlength="2"/>%</td>'+
                        '<td><a href="#" class="ds-config-quality-check-remove-config"><i class="icon-minus"></i></a></td></tr>';

                    for(var i=0;i<template.config.length;i++){
                        var __fatal = "";
                        if(template.config[i].fatal){
                            __fatal = "checked";
                        }
                        var html = oneHtml.replace(/__name/,template.config[i].name)
                            .replace(/__weight/,template.config[i].weight)
                            .replace(/__fatal/,__fatal);

                        tablePane.append(html);
                    }
                }
            });
        } else {
            alert('此模板已无效');
            handler.config.qualityCheck.config_quality_check_template();
        }
    },
    getQualityCheckListItem: function(){
        var html = [];
        html.push('<tr class="info"><td><input name="config_name" class="input"/></td>');
        html.push('<td><input name="config_weight" class="input-small" maxlength="2"/>%');
        html.push('<input type="checkbox" name="config_fatal" style="margin: 4px 3px 0px 5px;"/>是否致命项');
        html.push('</td>');
        html.push('<td><a href="#" class="ds-config-quality-check-remove-config"><i class="icon-minus"></i></a></td></tr>');
        return html.join('');
    },
    checkAualityStandard: function(data){
        if(parseInt(data['A-begin']) >=100 || parseInt(data['A-begin']) <= parseInt(data['B-end'])){
            alert('优秀 的开始分值有误，请重新输入！');
            return false;
        }
        if(parseInt(data['B-begin']) >= parseInt(data['B-end']) || parseInt(data['B-end']) <= parseInt(data['C-begin'])
            || parseInt(data['B-end']) + 1 != parseInt(data['A-begin'])){
            alert('合格 分值有误，请重新输入！必须是连续的区间。');
            return false;
        }
        if(parseInt(data['C-begin']) >= parseInt(data['C-end']) || parseInt(data['C-end']) >= parseInt(data['B-begin'])
            || parseInt(data['C-end']) + 1 != parseInt(data['B-begin'])){
            alert('提醒 分值有误，请重新输入！必须是连续的区间。');
            return false;
        }
        if(parseInt(data['D-end']) <= 0 || parseInt(data['D-end']) >= parseInt(data['C-begin'])
            || parseInt(data['D-end']) + 1 != parseInt(data['C-begin'])){
            alert('不合格 的结束分值有误，请重新输入！必须是连续的区间。');
            return false;
        }
        return true;
    }
}

handler.qualityCheck = {
    sysConfigName: '质检评分项配置',
    isGradeInputBindEvent : false,
    currentGrade:{},
    currentQueryAction:null,
    currentQualityCheckCallSheets: null,
    currentQualityCheckCallSheetIndex: null,
    currentTemplate: null,
    randomTemplate: null,
    randomFlag: null,
    qualityCheckMsgFlag: true,
    qualityCheck_main: function(data){
        console.log($('.quality_check_tab').find('li:first-child').find("a"));
        $('.quality_check_tab').find('li:first-child').find("a").click();
    },
    validateGrade: function(src){
        if(!/^\d+$/.test(src.val())){
            alert('评分只能填写0-100的整数');
            src.focus();
            return false;
        }
        if(parseInt(src.val()) > 100) {
            alert('评分的范围是0至100，请重新评分');
            src.focus();
            return false;
        }
        return true;
    },
    bindGradeInputEvent: function(){
        $(document).on('change', '#callSheetOtherInfoPanel .call_sheet_grade', function(event){
            event.preventDefault();
            event.stopImmediatePropagation();

            var self = handler.qualityCheck;
            var fatal_flag = false;
            var src = $(event.target);
            if(!src.val()){
                return false;
            }
            var validation = self.validateGrade(src);
            if(!validation){
                return false;
            }
            var callSheetQualityCheckConfig = handler.config.qualityCheck.getQualityCheckConfigs();
            //var gradeInputName = src.attr('name');
            var currentGrade = self.currentGrade;
            var inputs = $("#callSheetGradeTable .input-prepend input");
            for(var i=0;i<inputs.length;i++){
                var input = inputs[i];
                var gradeInputName = input.name;
                var option = null;

                for(var ind in callSheetQualityCheckConfig) {
                    option = callSheetQualityCheckConfig[ind];
                    if(option.order == gradeInputName) {
                        if(option.fatal && parseInt(input.value)<60){
                            fatal_flag = true;
                            break;
                        }
                        if(input.value){
                            currentGrade[gradeInputName] = parseInt(option.weight) * parseInt(input.value) / 100;
                        }else{
                            currentGrade[gradeInputName] = 0;
                        }
                        break;
                    }
                }
                if(fatal_flag)break;
            }

            if(fatal_flag){
                $('#gradeAmount').text(0);
            }else{
                var amount = 0;
                for(var gradeItem in currentGrade) {
                    amount += currentGrade[gradeItem];
                }
                $('#gradeAmount').text(Math.round(amount * 100) / 100);
            }
        });
        handler.qualityCheck.isGradeInputBindEvent = true;
    },
    quality_check: function(data, src) {
        var self = handler.qualityCheck;
        var query = {};
        if (data == 'quality_check'){
            handler.qualityCheck._initQualityCheckRandomTemplate();
            handler.cdr.initCallSheetCondition('qualityCheckMainPanel');
            $('#qualityCheckTemplates').html(self.initQualityCheckRadio());
            self.initQualityCheckRandomRadio();
        }else{
            delete data.currentTemplate;
            //delete data.randomTemplate;
            query = handler.cdr.getSearchCondition(data);
        }
        if(src){
            query.page = src.val() || 1;
        }else{
            query.page = 1;
        }

        var cdrId = "";
        var ifRandom = $('#quality_record_random_checkbox').is(':checked');
        if(ifRandom){
            cdrId = 'quality_check_query_random';
            self.randomFlag = 'query';
            if(!self.randomTemplate || self.randomTemplate.length==0){
                if(self.qualityCheckMsgFlag){
                    alert('请添加抽查条件模板！');
                }
                return;
            }
        }else{
            cdrId = 'quality_check_query';
            delete query.randomTemplate;
            delete query.RANDOMNUM;
        }

        self.getQualityCheckCallSheet(query,cdrId,function(res){
            DS.updatePagination('qualityCheckQueryFrm', res.count, handler.cdr.queryPageSize, query.page);
            var isBindEvent = self.isGradeInputBindEvent;
            if(!isBindEvent) {
                self.bindGradeInputEvent();
            }
        });
    },
    quality_check_random: function(data, src) {
        var self = handler.qualityCheck;
        self.randomFlag = 'random';
        if(!self.randomTemplate || self.randomTemplate.length==0){
            alert('请添加抽查条件模板！');
            return;
        }

        var self = handler.qualityCheck;
        var query = {};
        delete data.currentTemplate;
        query = handler.cdr.getSearchCondition(data);
        if(src){
            query.page = src.val() || 1;
        }else{
            query.page = 1;
        }
        query.reset = true;

        self.getQualityCheckCallSheet(query,'quality_check_query_random',function(res){
            DS.updatePagination('qualityCheckQueryFrm', res.count, handler.cdr.queryPageSize, query.page);
            var isBindEvent = self.isGradeInputBindEvent;
            if(!isBindEvent) {
                self.bindGradeInputEvent();
            }
        });
    },
    addAndSelect_random_template: function(data, src){
        if(!data.TEMPLATE_NAME || data.TEMPLATE_NAME == ""){
            alert('请填写模板名称！');
            return;
        }

        if(!data.RANDOMNUM || data.RANDOMNUM == ""){
            alert('请填写随机抽取质检记录的条数，不超过1000条！');
            return;
        }
        if(data.RANDOMNUM > 1000){
            alert('请注意，随机数最大为1000！');
            return;
        }
        if(data.RANDOMNUM == 0){
            alert('请注意，随机数最小为1！');
            return;
        }

        var self = handler.qualityCheck;
        var query = {};
        delete data.currentTemplate;
        delete data.randomTemplate;
        query = handler.cdr.getSearchCondition(data);
        if(src){
            query.page = src.val() || 1;
        }else{
            query.page = 1;
        }

        self.getQualityCheckCallSheet(query,'quality_check_query_random_template_addAndSelect',function(res){
            DS.updatePagination('qualityCheckQueryFrm', res.count, handler.cdr.queryPageSize, query.page);
            self.initQualityCheckRandomRadio(res.randomTemplate);
            $('#qualityCheckMainPanel .quality_check_random_template_add_pane_show').click();
            var isBindEvent = self.isGradeInputBindEvent;
            if(!isBindEvent) {
                self.bindGradeInputEvent();
            }
        });
    },
    add_random_template: function(data, src){
        if(!data.TEMPLATE_NAME || data.TEMPLATE_NAME == ""){
            alert('请填写模板名称！');
            return;
        }
        if(!data.RANDOMNUM || data.RANDOMNUM == ""){
            alert('请填写随机抽取质检记录的条数，不超过1000条！');
            return;
        }
        if(data.RANDOMNUM > 1000){
            alert('请注意，随机数最大为1000！');
            return;
        }
        if(data.RANDOMNUM == 0){
            alert('请注意，随机数最小为1！');
            return;
        }

        var self = handler.qualityCheck;
        delete data.currentTemplate;
        delete data.randomTemplate;
        var query = handler.cdr.getSearchCondition(data);

        var action = {
            action : 'app.qualityCheck.addQualityCheckRandomTemplates',
            data : query
        }

        DS.send(action,function(res){
            if(!res.success){
                if(res.code == 0){
                    alert(res.message);
                    return;
                }else{
                    alert("保存失败，请稍后再试！");
                    return;
                }
            }
            self.initQualityCheckRandomRadio();
            $('#qualityCheckMainPanel .quality_check_random_template_add_pane_show').click();
        });
    },
    remove_random_template: function(data, src){
        var self = handler.qualityCheck;
        var action = {
            action : 'app.qualityCheck.removeQualityCheckRandomTemplates',
            data : {randomTemplate : data.randomTemplate}
        }

        DS.send(action,function(res){
            if(!res.success){
                alert('质检抽查模板删除失败，请稍后再试！');
                return;
            }

            self.initQualityCheckRandomRadio('remove');
        });
    },
    _initQualityCheckRandomTemplate: function(){
        var templatePane = $('#qualityCheckMainPanel');
        templatePane.find(".quality_check_random_template_add_pane_show").bind("click",function(e){
            e.stopPropagation();
            var offset=templatePane.find(".quality_check_random_template_add_pane_show").offset();
            var _p=templatePane.find("#quality_check_random_template_add_pane");
            if(offset.left > 500){
                _p.css({top:offset.top+20+"px",left:"500px"});
            }else{
                _p.css({top:offset.top+20+"px",left:offset.left+"px"});
            }

            _p.toggleClass("hidden");
            $('#qualityCheckQueryFrm_random .quality_resetForm').click();//调用重置按钮
        });
        var url = 'qualityCheck/quality_check_random_template_add';
        DS.getView(url, function(view){
            if(view){
                view=DS.renderViewNew(view);

                templatePane.find("#quality_check_random_template_add_pane").html(view);
                handler.cdr.initCallSheetCondition('qualityCheckQueryFrm_random');
            }
        });
    },
    initQualityCheckRandomRadio : function(randomTemplate){
        var templates = null;
        var action = {
            action : 'app.qualityCheck.getQualityCheckRandomTemplates'
        }
        DS.send(action,function(res){
            if(!res.success){
                alert('质检抽查模板加载失败！');
                return;
            }
            templates = res.list;
            handler.qualityCheck.randomTemplate = templates;
            if(randomTemplate == 'remove'){
                handler.qualityCheck.changeQualityCheckRandomTemplate('remove');
                if(!templates || templates.length == 0){
                    DS.updatePagination('qualityCheckQueryFrm', 0, handler.cdr.queryPageSize, 1);
                    render.qualityCheck.renderQualityCallSheetTable([],'quality_check_query');
                }
            }else if(randomTemplate){
                handler.qualityCheck.changeQualityCheckRandomTemplate(randomTemplate);
                if(!templates || templates.length == 0){
                    return '请配置质检模板！';
                }
            }else{
                handler.qualityCheck.changeQualityCheckRandomTemplate('qualityCheckRandomTemplates','progress');
                if(!templates || templates.length == 0){
                    return '请配置质检模板！';
                }
            }


            var one = '<input type="radio" name="randomTemplate" class="qualityCheckRadio" value="___id" __checked>__name&nbsp;&nbsp;&nbsp;';
            var html = '';
            for(var i=0 ; i<templates.length ; i++){
                if(randomTemplate && randomTemplate != 'remove'){
                    if(templates[i]._id == randomTemplate) {
                        html += one.replace(/___id/,templates[i]._id)
                            .replace(/__checked/,'checked')
                            .replace(/__name/,templates[i].TEMPLATE_NAME);
                    }else{
                        html += one.replace(/___id/,templates[i]._id)
                            .replace(/__checked/,'')
                            .replace(/__name/,templates[i].TEMPLATE_NAME);
                    }
                }else{
                    if(i == 0) {
                        html += one.replace(/___id/,templates[i]._id)
                            .replace(/__checked/,'checked')
                            .replace(/__name/,templates[i].TEMPLATE_NAME);
                        if(randomTemplate == 'remove'){
                            var data = {randomTemplate : templates[i]._id};
                            var self = handler.qualityCheck;
                            self.quality_check(data);
                        }

                    }else{
                        html += one.replace(/___id/,templates[i]._id)
                            .replace(/__checked/,'')
                            .replace(/__name/,templates[i].TEMPLATE_NAME);
                    }
                }
            }

            $('#qualityCheckRandomTemplates').html(html);
        });
    },
    changeQualityCheckRandomTemplate : function(data,flag){
        var templates = handler.qualityCheck.randomTemplate;
        var choiceId = null;
        if(data == 'qualityCheckRandomTemplates')
            choiceId = $('#'+data).find("input[name='randomTemplate']:checked").val();
        else
            choiceId = data;


        var random_num = $("#quality_check_template_random_num");//抽查条数
        var time_start = $("#quality_check_datetime_picker_start_show");
        var time_end = $("#quality_check_datetime_picker_end_show");
        var agent = $("#quality_record_disposal_agent_input_show");//通话座席
        var call_type = $("#qualityCheckMainPanel form[id='qualityCheckQueryFrm'] select[name='CONNECT_TYPE']");//呼叫类型
        var queue = $("#qualityCheckMainPanel form[id='qualityCheckQueryFrm'] select[name='ERROR_MEMO']");//技能组
        var investigate = $("#qualityCheckMainPanel form[id='qualityCheckQueryFrm'] select[name='INVESTIGATE']");//满意度
        var time_length_begin = $("#qualityCheckMainPanel form[id='qualityCheckQueryFrm'] input[name='CALL_TIME_LENGTH_BEGIN']");//通话时长-开始
        var time_length_end = $("#qualityCheckMainPanel form[id='qualityCheckQueryFrm'] input[name='CALL_TIME_LENGTH_END']");//通话时长-结束

        //先将显示数据全部清空
        random_num.val('');
        time_start.val('');
        agent.val('');
        time_end.val('');
        call_type.val('');
        queue.val('');
        investigate.val('');
        time_length_begin.val('');
        time_length_end.val('');
        if(data == 'remove' || flag == 'change'){
            $(".quality_check_random_progress").text("0/0");
        }

        for(var i=0 ; i<templates.length ; i++){
            var template = templates[i];
            if(data == 'remove' || !choiceId || template._id == choiceId){
                var query = template.query;

                if(template.TEMPLATE_NUM){
                    random_num.val(template.TEMPLATE_NUM);
                }else{
                    random_num.val('');
                }

                if(query.BEGIN_TIME){
                    time_start.val(query.BEGIN_TIME);
                }else{
                    time_start.val('');
                }

                if(query.DISPOSAL_AGENT){
                    var agents = getCache("agents");
                    for(var a=0;a<agents.length;a++){
                        if(agents[a]._id == query.DISPOSAL_AGENT)
                            agent.val(agents[a].displayName+"["+agents[a].exten+"]");
                    }
                }else{
                    agent.val('');
                }

                if(query.END_TIME)
                    time_end.val(query.END_TIME);
                else
                    time_end.val('');

                if(query.CONNECT_TYPE)
                    call_type.val(query.CONNECT_TYPE);
                else
                    call_type.val('');

                if(query.ERROR_MEMO)
                    queue.val(query.ERROR_MEMO);
                else
                    queue.val('');

                if(query.INVESTIGATE)
                    investigate.val(query.INVESTIGATE);
                else
                    investigate.val('');

                if(query.CALL_TIME_LENGTH_BEGIN)
                    time_length_begin.val(query.CALL_TIME_LENGTH_BEGIN);
                else
                    time_length_begin.val('');

                if(query.CALL_TIME_LENGTH_END)
                    time_length_end.val(query.CALL_TIME_LENGTH_END);
                else
                    time_length_end.val('');
                break;
            }
        }
    },
    getQualityCheckCallSheet: function(data, cdrId, callback) {
        var self = handler.qualityCheck;
        data.pageSize = handler.cdr.queryPageSize;
        data.cdrId = cdrId;
        var action = {
            action : 'app.qualityCheck.getQualityCheckCallSheet',
            data : data
        }
        DS.send(action,function(res){
            if(!res.success){
                if(cdrId == 'quality_check_query_random_template_addAndSelect' && res.code == 0){
                    alert(res.message);
                    return;
                }
                alert('系统获取不到需要评分的记录');
                return;
            }

            self.currentQueryAction = action;
            self.currentQualityCheckCallSheets = res.list;

            if(cdrId == 'quality_check_query_random' || cdrId == 'quality_check_query_random_template_addAndSelect'){
                if(res.countAll==0){
                    if(cdrId == 'quality_check_query_random_template_addAndSelect'){
                        alert('没有符合条件的通话记录！');
                    }else if(cdrId == 'quality_check_query_random'){
                        if(self.randomFlag == 'query')
                            alert('没有符合条件的通话记录或者未抽取！');
                        else if(self.randomFlag == 'random')
                            alert('没有符合条件的通话记录！');
                    }

                }
                $(".quality_check_random_progress").text((res.count?res.count:0) + "/" + (res.countAll?res.countAll:0));
                if(!res.count){
                    res.count = 0;
                }
                cdrId = 'quality_check_query'
            }
            render.qualityCheck.renderQualityCallSheetTable(res.list,cdrId);
            callback(res);
        });
    },
    qualityCheckPaginationToChange: function(data,src){
        var page = src.val() || 1;
        data.page = page;
        handler.cdr.callSheetQualityCheck.getQualityCheckCallSheet(data,'quality_check_query',function(res){
            $(".class_list span.quality_check_result_count").text(res.count);
            var list = $(".class_list #quality_check_query_index li");
            updatePagination(list, res.count, handler.cdr.cdrPageSize, page);
        });
    },
    qualityCheckListPaginationToChange: function(data, src) {
        var page = src.val() || 1;
        data.page = page;
        handler.cdr.callSheetQualityCheck.queryQualityCheckList(data);
    },
    showGradeDetail : function(data){
        var templates = getCache('qualityCheckTemplates');
        if(templates.length == 0){
            alert('您还没有质检模板！不能进行质检！');
            return;
        }
        var self = handler.qualityCheck;
        // clear currentGrade
        self.currentGrade = {};
        // init qualityCheckCallSheetCache and qualityCheckCallSheetIndex
        var currentIndex = -1;
        var callSheet = null;
        self.currentQualityCheckCallSheetIndex = {};
        for(var i= 0,len=self.currentQualityCheckCallSheets.length;i<len;i++) {
            callSheet = self.currentQualityCheckCallSheets[i];
            if(callSheet['CALL_SHEET_ID'] == data){
                currentIndex = i;
            }
            self.currentQualityCheckCallSheetIndex[callSheet['CALL_SHEET_ID']] = callSheet;
        }
        self.currentQualityCheckCallSheets.splice(0, currentIndex);
        self.showGradeDetailInCache();
    },
    closeCallSheetGradeDetail: function(){
        var self = handler.qualityCheck;
        self.qualityCheckMsgFlag = false;
        $('#callSheetQualityCheckQueryBtn').trigger('click');
        self.qualityCheckMsgFlag = true;
    },
    showGradeDetailInCache : function(data){
        // get callSheet data in cache ,so callSheetID param not need.
        var dataObject = {
            callSheetID : '',
            getDataMethod : handler.qualityCheck.getCallSheetGrade,
            otherInfoViewName : 'qualityCheck/call_sheet_grade'
        }
        handler.qualityCheck.showDetail(dataObject);
    },
    showDetail : function(data){
        DS.getView('qualityCheck/show_quality_check_cdr_business_detail', function(view){
            DS.getView(data.otherInfoViewName, function(otherInfoView){
                data.getDataMethod(data.callSheetID, function(res){
                    showCdrTel(res.cdr);
                    var html ='';
                    html += view.replace('__callSheetOtherInfo', otherInfoView)
                        .replace('__AUDIO_AUTO_PLAY',res.recordAutoPlay);
                    html = DS.renderMethodViewNew(html, res.cdr);
                    html = html.replace(/__CALL_SHEET_GRADE_CONFIG/g, render.qualityCheck.renderCallSheetGradeTable());
                    var panel = $('#modal_panel');
                    panel.empty();
                    panel.append(html);
                    $('#cdrDetailCloseBtn').attr('ds_data', 'qualityCheck.closeCallSheetGradeDetail');
                    $('#callSheetOtherInfoPanel').show();
                    $('#show_cdr_detail_Modal').modal({'backdrop':'static'});
                    handler.qualityCheck.recordListenLog(res.cdr.CALL_SHEET_ID);

                    $(".fatal_warning").tooltip({trigger:'hover',html:true,title:'致命项，如果评分低于60则总分为0！'});

                    //show call business info
                    var callBack = function(err, list) {
                        var content = $("#callSheetQualityCheckBusinessInfo");
                        content.empty();
                        if(!err) {
                            if(list.length != 0) {
                                DS.getView('customer/active_history_content_item',function(view) {
                                    var val = "";
                                    for(var i = 0; i < list.length; i++) {
                                        val += render.renderActiveHistory(list[i], view, "business");
                                    }
                                    content.append(val);
                                });
                            } else {
                                content.html("<div class='timeLine_list_noResult'>没有纪录!</div>");
                            }
                        } else
                            content.html("<div class='timeLine_list_noResult'>查询出错!</div>");
                    }
                    handler.business.getCustomerHistoryBusinessByCallId(res.cdr.CUSTOMER_ID, res.cdr.CALL_SHEET_ID, callBack);
                });
            });
        });
    },
    getCallSheetGrade: function(data,callback){
        var currentCallSheet = handler.qualityCheck.currentQualityCheckCallSheets[0];
        callback({
            cdr: currentCallSheet,
            callSheetGrade: true,
            recordAutoPlay: 'autoplay="autoplay"'
        });
    },
    showNextCallSheetGrade: function(){
        var dataObject = {
            callSheetID : '',
            getDataMethod : handler.qualityCheck.getCallSheetGrade,
            otherInfoViewName : 'qualityCheck/call_sheet_grade'
        }
        handler.qualityCheck.showNextCallSheetGradeDetail(dataObject);
    },
    showNextCallSheetGradeDetail : function(data){
        DS.getView('qualityCheck/call_sheet_grade_item', function(view){
            DS.getView(data.otherInfoViewName, function(otherInfoView){
                data.getDataMethod(data.callSheetID, function(res){
                    showCdrTel(res.cdr);
                    var html ='';
                    html += view.replace('__callSheetOtherInfo', otherInfoView)
                        .replace('__AUDIO_AUTO_PLAY',res.recordAutoPlay);
                    html = DS.renderMethodViewNew(html, res.cdr);
                    html = html.replace(/__CALL_SHEET_GRADE_CONFIG/g, render.qualityCheck.renderCallSheetGradeTable());
                    var panel = $('#cdr_detail_wrapper');
                    panel.empty();
                    panel.append(html);
                    $('#cdr_detail_wrapper .input_first').focus();
                    handler.qualityCheck.recordListenLog(res.cdr.CALL_SHEET_ID);
                    //show call business info
                    var callBack = function(err, list) {
                        var content = $("#callSheetQualityCheckBusinessInfo");
                        content.empty();
                        if(!err) {
                            if(list.length != 0) {
                                DS.getView('customer/active_history_content_item',function(view) {
                                    var val = "";
                                    for(var i = 0; i < list.length; i++) {
                                        val += render.renderActiveHistory(list[i], view, "business");
                                    }
                                    content.append(val);
                                });
                            } else {
                                content.html("<div class='timeLine_list_noResult'>没有纪录!</div>");
                            }
                        } else
                            content.html("<div class='timeLine_list_noResult'>查询出错!</div>");
                    }
                    handler.business.getCustomerHistoryBusinessByCallId(res.cdr.CUSTOMER_ID, res.cdr.CALL_SHEET_ID, callBack);
                });
            });
        });
    },
    getMoreQualityCheckCallSheet: function(){
        var self = handler.qualityCheck;
        var action = self.currentQueryAction;
        var lastCallSheet = self.currentQualityCheckCallSheets[self.currentQualityCheckCallSheets.length - 1];
        if(lastCallSheet) {
            action.data = $.evalJSON(action.data);
            action.data.OFFERING_TIME = {"$lt": lastCallSheet.OFFERING_TIME};
            DS.send(action,function(res){
                delete action.OFFERING_TIME;
                if(!res.success){
                    return;
                }
                if(res.list && res.list.length > 0){
                    var callSheet = null;
                    for(var i= 0,len=res.list.length;i<len;i++) {
                        callSheet = res.list[i];
                        self.currentQualityCheckCallSheetIndex[callSheet['CALL_SHEET_ID']] = callSheet;
                    }
                    self.currentQualityCheckCallSheets = self.currentQualityCheckCallSheets.concat(res.list);
                }
            });
        }
    },
    saveCallSheetGrade: function(data) {
        var self = handler.qualityCheck;
        var grade = $('#gradeAmount').text();
        grade = parseFloat(grade);
        if(!$.isNumeric(grade)) {
            alert('保存失败：当前总分无效');
            return false;
        }
        var gradeInputs = $('#callSheetGradeTable .call_sheet_grade');
        var gradeInput = null;

        for(var i= 0,len = gradeInputs.length;i<len;i++) {
            gradeInput = gradeInputs[i];
            if(!self.validateGrade($(gradeInput))){
                $(gradeInput).focus();
                return false;
            }
        }
        var callSheetID = data.callSheetID;
        var currentCallSheet = self.currentQualityCheckCallSheetIndex[callSheetID];
        self.currentGrade._id = callSheetID;
        self.currentGrade.OFFERING_TIME = currentCallSheet.OFFERING_TIME;
        self.currentGrade.DISPOSAL_AGENT = currentCallSheet.DISPOSAL_AGENT;
        self.currentGrade.CALL_NO = currentCallSheet.CALL_NO;
        self.currentGrade.CALLED_NO = currentCallSheet.CALLED_NO;
        self.currentGrade.CONNECT_TYPE = currentCallSheet.CONNECT_TYPE;
        self.currentGrade.ERROR_MEMO = currentCallSheet.ERROR_MEMO;
        self.currentGrade.CALL_TIME_LENGTH = currentCallSheet.CALL_TIME_LENGTH;
        self.currentGrade.FILE_SERVER = currentCallSheet.FILE_SERVER;
        self.currentGrade.RECORD_FILE_NAME = currentCallSheet.RECORD_FILE_NAME;
        self.currentGrade.INVESTIGATE = currentCallSheet.INVESTIGATE;
        self.currentGrade.GRADE_AMOUNT = grade;
        self.currentGrade.COMMENTS = data.COMMENTS;
        self.currentGrade.TEMPLATE = self.currentTemplate._id;
        var action = {
            action: 'app.qualityCheck.saveCallSheetGrade',
            data: {
                CALL_SHEET_ID: data.callSheetID,
                QUALITY_GRADE: grade,
                COMMENTS: data.COMMENTS,
                GRADE_DATA: self.currentGrade
            }
        }
        DS.send(action, function(res){
            if(res.success) {
                self.currentQualityCheckCallSheets.shift();
                delete self.currentQualityCheckCallSheetIndex[data.callSheetID];
                self.currentGrade = {};
                if(self.currentQualityCheckCallSheets.length <= 0) {
                    alert('已完成全部评分。');
                    $('#show_cdr_detail_Modal').modal('hide');
                    $('#callSheetQualityCheckQueryBtn').trigger('click');
                } else {
                    if(self.currentQualityCheckCallSheets.length < 5) {
                        setTimeout(self.getMoreQualityCheckCallSheet, 1000);
                    }
                    self.showNextCallSheetGrade();
                    $().alertmessage('showSuccess','评分成功！请评价下一条。');
                }
            } else {
                alert('保存评分失败，请重新保存');
                return false;
            }
        });
    },
    quality_check_query: function(data){
        render.qualityCheck.renderQualityCheckForQuery();
        handler.qualityCheck.queryCallSheetGradeResult(data);
    },
    queryCallSheetGradeResult: function(data,src){
        if(typeof data == 'string') {
            $('#qualityCheckAgentTemplates').html(handler.qualityCheck.initQualityCheckListRadio());
            if(handler.qualityCheck.currentTemplate != null){
                data = {TEMPLATE: handler.qualityCheck.currentTemplate._id};
            }else{
                var templates = getCache('qualityCheckTemplates');
                if(templates.length > 0){
                    data = {TEMPLATE: templates[0]._id};
                }else{
                    data = {};
                }
            }
        }
        if(src){
            data.page = src.val() || 1;
        }
        data.pageSize = handler.cdr.queryPageSize;
        var query = handler.cdr.getSearchCondition(data);
        var action = {
            action: 'app.qualityCheck.queryCallSheetGradeResult',
            data: query
        }
        DS.send(action, function(res){
            $('#quality_check_query_query_table_data').html('');
            if(res.success) {
                render.qualityCheck.renderQualityCheckResultTable(res);
            } else {
                alert('查询失败，请重新查询');
                return false;
            }
        });
    },
    exportCallSheetGradeResultExcel: function(data){
        var query = handler.cdr.getSearchCondition(data);
        query.accountId = session.user.account;
        query.user = session.user._id;
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'exportCallSheetGradeResult',Query:data}
        };
        DS.send(action,function(rep) {
            if(rep.Succeed){
                downloadFile(rep.path);
            }
        });
    },
    quality_check_list_query: function(data) {
        handler.cdr.initCallSheetCondition('qualityCheckListQueryPanel');
        if(data == 'quality_check_list_query'){
            $('#qualityCheckListTemplates').html(handler.qualityCheck.initQualityCheckListRadio());
            if(handler.qualityCheck.currentTemplate != null){
                data = {TEMPLATE: handler.qualityCheck.currentTemplate._id};
            }else{
                var templates = getCache('qualityCheckTemplates');
                if(templates.length > 0){
                    data = {TEMPLATE: templates[0]._id};
                }else{
                    data = {};
                }
            }
        }
        handler.qualityCheck.queryQualityCheckList(data);
    },
    queryQualityCheckList: function(data,src){
        if(data.GRADE_MIN > 100 || data.GRADE_MIN < 0){
            alert("请输入正确的单项评分分数！");
            return;
        }
        if(data.GRADE_MAX > 100 || data.GRADE_MAX < 0){
            alert("请输入正确的单项评分分数！");
            return;
        }
        if(data.GRADE_MAX < data.GRADE_MIN){
            alert("请输入正确的单项评分分数！");
            return;
        }
        data.pageSize = handler.cdr.queryPageSize;
        if(!src || src.val() == '') {
            data.page = 1;
        }else{
            data.page = src.val() || 1;
        }
        var query = handler.cdr.getSearchCondition(data);
        if(query.LEVEL){
            var curTemplate = handler.qualityCheck.currentTemplate;
            if(query.LEVEL == 'A'){
                query.GRADE_AMOUNT = {$gte: parseFloat(curTemplate['A-begin']) - 0.5};
            }else if(query.LEVEL == 'B'){
                query.GRADE_AMOUNT = {$gte: parseFloat(curTemplate['B-begin']) - 0.5, $lte: parseFloat(curTemplate['B-end']) + 0.4};
            }else if(query.LEVEL == 'C'){
                query.GRADE_AMOUNT = {$gte: parseFloat(curTemplate['C-begin']) - 0.5, $lte: parseFloat(curTemplate['C-end']) + 0.4};
            }else if(query.LEVEL == 'D'){
                query.GRADE_AMOUNT = {$lte: parseFloat(curTemplate['D-end']) + 0.4};
            }
            delete query.LEVEL;
        }
        var action = {
            action: 'app.qualityCheck.queryCallSheetGradeList',
            data: query
        }
        DS.send(action, function(res){
            render.qualityCheck.renderQualityCheckListConfig();
            render.qualityCheck.renderQualityCheckList(res.list);
            DS.updatePagination('qualityCheckListQueryFrm', res.count, handler.cdr.queryPageSize, data.page);
        });
    },
    exportQualityCheckListExcel : function(data){
        if(data.GRADE_MIN > 100 || data.GRADE_MIN < 0){
            alert("请输入正确的单项评分分数！");
            return;
        }
        if(data.GRADE_MAX > 100 || data.GRADE_MAX < 0){
            alert("请输入正确的单项评分分数！");
            return;
        }
        if(data.GRADE_MAX < data.GRADE_MIN){
            alert("请输入正确的单项评分分数！");
            return;
        }
        var query = handler.cdr.getSearchCondition(data);
        if(query.LEVEL){
            var curTemplate = handler.qualityCheck.currentTemplate;
            if(query.LEVEL == 'A'){
                query.GRADE_AMOUNT = {$gte: parseFloat(curTemplate['A-begin']) - 0.5};
            }else if(query.LEVEL == 'B'){
                query.GRADE_AMOUNT = {$gte: parseFloat(curTemplate['B-begin']) - 0.5, $lte: parseFloat(curTemplate['B-end']) + 0.4};
            }else if(query.LEVEL == 'C'){
                query.GRADE_AMOUNT = {$gte: parseFloat(curTemplate['C-begin']) - 0.5, $lte: parseFloat(curTemplate['C-end']) + 0.4};
            }else if(query.LEVEL == 'D'){
                query.GRADE_AMOUNT = {$lte: parseFloat(curTemplate['D-end']) + 0.4};
            }
            delete query.LEVEL;
        }
        query.accountId = session.user.account;
        query.type = 'QualityCheckListExport';
        query.user = session.user._id;
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'exportQualityCheckList',Query:data}
        };
        DS.send(action,function(rep) {
            if(rep.Succeed){
                downloadFile(rep.path);
            }
        });
    },
    showQualityComments : function(data){
        DS.getView('qualityCheck/showQualityComments', function(view){
            var action = {
                action : 'app.qualityCheck.showQualityComments',
                data : data
            }
            DS.send(action,function(res){
                if(res.success){
                    var panel = $('#show_quality_comments_pane');
                    panel.empty();
                    panel.append(view.replace(/__QUALITY_COMMENTS/g,res.data));
                    $('#show_quality_comments_Modal').modal();
                }
            });
        });
    },
    changeQualityCheckTemplate : function(data){
        var templates = getCache('qualityCheckTemplates');
        if(data == 'qualityCheckTemplates'){
            var choiceId = $('#'+data).find("input[name='currentTemplate']:checked").val();
        }else{
            var choiceId = $('#'+data).find("input[name='TEMPLATE']:checked").val();
        }
        for(var i=0 ; i<templates.length ; i++){
            if(templates[i]._id == choiceId){
                handler.qualityCheck.currentTemplate = templates[i];
                break;
            }
        }
        $(".qualityCheckRadio[value='"+choiceId+"']").attr("checked",true);
        handler.qualityCheck.quality_check_list_query('quality_check_list_query');
        handler.qualityCheck.quality_check_query('quality_check_query');
    },
    recordListenLog : function(data){
        var action = {
            action : 'app.qualityCheck.recordListenLog',
            data : {
                CALL_SHEET_ID : data
            }
        }
        DS.send(action,function(res){
            //ignore res
        });
    },
    showListenLog : function(data,src){
        var page = src.val() || 1;
        if(src.val() == ''){
            DS.getView('qualityCheck/showListenLog', function(view){
                view = view.replace(/__callSheetId/,data);
                var panel = $('#modal_panel');
                panel.empty();
                panel.append(view);
                $('#show_listen_log_Modal').modal();

                var action = {
                    action : 'app.qualityCheck.queryListenLog',
                    data : {
                        CALL_SHEET_ID : data,
                        page : page,
                        pageSize : handler.cdr.queryPageSize
                    }
                }
                DS.send(action,function(res){
                    var oneRow = '<tr><td>__user</td><td>__time</td></tr>';
                    var html = '';
                    for(var i=0;i<res.list.length;i++){
                        html+= oneRow.replace(/__user/,handler.cdr.getAgentName(res.list[i].userId))
                            .replace(/__time/,res.list[i].time);
                    }
                    $('#listen_log_table_data').html(html);
                    DS.updatePagination('showListenLogForm', res.count, handler.cdr.queryPageSize, page);
                });
            });
        }else{
            var page = src.val()||1;
            var action = {
                action : 'app.qualityCheck.queryListenLog',
                data : {
                    CALL_SHEET_ID : data.callSheetId,
                    page : page,
                    pageSize : handler.cdr.queryPageSize
                }
            }
            DS.send(action,function(res){
                var oneRow = '<tr><td>__user</td><td>__time</td></tr>';
                var html = '';
                for(var i=0;i<res.list.length;i++){
                    html+= oneRow.replace(/__user/,handler.cdr.getAgentName(res.list[i].userId))
                        .replace(/__time/,res.list[i].time);
                }
                $('#listen_log_table_data').html(html);
                DS.updatePagination('showListenLogForm', res.count, handler.cdr.queryPageSize, page);
            });
        }
    },
    initQualityCheckRadio : function(){
        var templates = getCache('qualityCheckTemplates');
        var one = '<input type="radio" name="currentTemplate" class="qualityCheckRadio" value="___id" __checked>__name&nbsp;&nbsp;&nbsp;';
        var html = '';
        if(!templates || templates.length == 0){
            return '请配置质检模板！';
        }
        for(var i=0 ; i<templates.length ; i++){
            if(i == 0) {
                html += one.replace(/___id/,templates[i]._id)
                    .replace(/__checked/,'checked')
                    .replace(/__name/,templates[i].name);
            }else{
                html += one.replace(/___id/,templates[i]._id)
                    .replace(/__checked/,'')
                    .replace(/__name/,templates[i].name);
            }
        }
        return html;
    },
    initQualityCheckListRadio : function(){
        var templates = getCache('qualityCheckTemplates');
        var one = '<input type="radio" name="TEMPLATE" class="qualityCheckRadio" value="___id" __checked>__name&nbsp;&nbsp;&nbsp;';
        var html = '';
        if(!templates || templates.length == 0){
            return '请配置质检模板！';
        }
        var currentId = null;
        if(handler.qualityCheck.currentTemplate != null){
            currentId = handler.qualityCheck.currentTemplate._id;
        }
        for(var i=0 ; i<templates.length ; i++){
            if(currentId){
                if(templates[i]._id == currentId) {
                    html += one.replace(/___id/,templates[i]._id)
                        .replace(/__checked/,'checked')
                        .replace(/__name/,templates[i].name);
                }else{
                    html += one.replace(/___id/,templates[i]._id)
                        .replace(/__checked/,'')
                        .replace(/__name/,templates[i].name);
                }
            }else{
                if(i == 0) {
                    html += one.replace(/___id/,templates[i]._id)
                        .replace(/__checked/,'checked')
                        .replace(/__name/,templates[i].name);
                }else{
                    html += one.replace(/___id/,templates[i]._id)
                        .replace(/__checked/,'')
                        .replace(/__name/,templates[i].name);
                }
            }
        }
        return html;
    },
    getQualityCheckLevel : function(data){
        if(handler.qualityCheck.currentTemplate != null){
            var template = handler.qualityCheck.currentTemplate;
            var amonut = Math.round(parseFloat(data));
            var Ab = parseInt(template['A-begin']);
            var Bb = parseInt(template['B-begin']);
            var Be = parseInt(template['B-end']);
            var Cb = parseInt(template['C-begin']);
            var Ce = parseInt(template['C-end']);
            var De = parseInt(template['D-end']);
            if(amonut >= Ab){
                return '优秀';
            }
            if(amonut >= Bb && amonut <= Be){
                return '合格';
            }
            if(amonut >= Cb && amonut <= Ce){
                return '提醒';
            }
            if(amonut <= De){
                return '不合格';
            }
        }else{
            return '';
        }
    }
}