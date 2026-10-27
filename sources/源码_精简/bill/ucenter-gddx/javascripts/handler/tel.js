handler.tel = {
    getMyServiceNo:function(){
        var pane=$("#right_pane");
        var action = {
            action:'app.tel.getMyServiceNo',
            data:{}
        };
        DS.send(action,function(rep){
            if(rep.success){
                var list=rep.list;
                var tab=pane.find("#ivr_tab");
                if (list.length > 0){
                    var tmpl='<li><a href="#" class="ds_do_action" ds_action="tel.getCallInfo" ds_data="_#_id#_"  data-toggle="tab">_#serviceNo#_</a></li>';
                    var html = [];
                    for (var i = 0, len = list.length; i < len; i++) {
                        var row = list[i];
                        html.push(DS.renderMethodViewNew(tmpl, row));
                    }
                    tab.html(html.join(''));
                    tab.find("li a:first").click();
                } else {
                    tab.html('请先选择一个号码作为服务号!');
                }
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    getCallInfo: function(id,src){
        var container=$("#ivr_tab_content");
        var action = {
            action:'app.tel.getCallInfo',
            data:{_id:id}
        }
        DS.send(action, function(response){
            if(response.success) {
                var flow=response.data;
                session.ivr = response.data;
                session.ivr.serviceAgent=session.ivr.serviceAgent||[];
                DS.getView('zj/tel/tel_item',function(view){
                    container.html(view);
                    container.find("input[name='_id']").val(flow._id);
                    //<span class="glyphicon glyphicon-remove"></span>
                    var snHtml=flow.serviceNo+'<button style="margin-left: 10px;" type="button" class="btn btn-xs btn-danger ds_do_action" ds_action="tel.deleteServiceNo" ds_param="'+flow._id+'" ds_data="'+flow.serviceNo+'">删除</button>';
                    container.find('#tel_service_no_label').empty().html(snHtml);

                    var weekView = container.find('#tel_week');
                    weekView.empty();
                    var weekStr = '';
                    for(var day in response.data.day){
                        weekStr += '<label>'+handler.tel._getWeekName(response.data.day[day])+'</label>'
                    }
                    weekView.html(weekStr);
                    container.find('#tel_startTime').empty().html(handler.tel._getTimeNum(response.data.startTimeHour)+':'
                        +handler.tel._getTimeNum(response.data.startTimeMinute));
                    container.find('#tel_endTime').empty().html(handler.tel._getTimeNum(response.data.endTimeHour)+':'
                        +handler.tel._getTimeNum(response.data.endTimeMinute));

                    if(session.ivr.w){
                        container.find('#w_music_name').empty().html(session.ivr.w.name);
                    }

                    if(session.ivr.ow) {
                        container.find('#ow_music_name').empty().html(session.ivr.ow.name);
                    }

                    container.find('#tel_ivr').val(session.ivr.ivr);
                    if(session.ivr.ivr == '0') {
                        container.find('#tel_agent_set_div').removeClass('hide');
                    } else {
                        container.find('#tel_serviceAgent_set_div').removeClass('hide');
                    }
                    var agent = "";
                    for(var i=0;i<session.ivr.agent.length;i++) {
                        var a = handler.tel._getUser(session.ivr.agent[i]);
                        agent += a.displayName+'('+a.exten+'), ';
                    }
                    if(agent){
                        agent = agent.substring(0, agent.length - 2);
                        container.find('#tel_agent_span').html(agent);
                    }
                    var serviceAgent = '';
                    for(var i=0;i<session.ivr.serviceAgent.length;i++) {
                        var a = handler.tel._getUser(session.ivr.serviceAgent[i]);
                        serviceAgent += a.displayName+'('+a.exten+'), ';
                    }
                    if(serviceAgent){
                        serviceAgent = serviceAgent.substring(0, serviceAgent.length - 2);
                        container.find('#tel_serviceAgent_span').html(serviceAgent);
                    }
                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },

    showEditTimeModal: function(src, data){
        DS.util.getBufferedView('zj/tel/time', function(view){
            if(view) {
                $('#tel_timeModal').find('.modal-body').empty().html(view);
            }
        });
    },

    editTime: function(data,src) {
        var container=$("#ivr_tab_content");
        var id=container.find("input[name='_id']").val();
        var myData = DS.getDataOfForm($('#time_form'));
//        console.dir(myData);
        myData.data._id=id;

        var action={
            action: 'app.tel.editTime',
            data: myData.data
        };
        DS.send(action, function(response){
            if(response.success) {
                $('#tel_timeModal').modal('hide');
                window.setTimeout(function(){
                    handler.tel.getCallInfo(id);
                },300);
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    changeIvr: function(data) {
        var container=$("#ivr_tab_content");
        var id=container.find("input[name='_id']").val();
        var val = container.find('#tel_ivr').val();
        var action={
            action: 'app.tel.setIvr',
            data: {
                _id:id,
                ivr:val
            }
        };
        DS.send(action, function(response){
            if(val == '0') {
                container.find('#tel_agent_set_div').removeClass('hide');
                container.find('#tel_serviceAgent_set_div').addClass('hide');
            } else {
                container.find('#tel_serviceAgent_set_div').removeClass('hide');
                container.find('#tel_agent_set_div').addClass('hide');
            }
        });
    },

    showAgentModal: function(data,src){
        var container=$("#ivr_tab_content");
        var html = '';
        var agents = {};
        for(var i=0;i<session.ivr.agent.length;i++) {
            agents[session.ivr.agent[i]]= true;
        }
        var users=getCache("agents")||[];
        for(var i=0;i<users.length;i++) {
            var user = users[i];
            if(user.product=='zj'){
                var checked = '';
                if(agents[user._id]){
                    checked = 'checked';
                }
                html += '<label class="checkbox-inline"><input type="checkbox" name="agent[]" value="'
                    +user._id+'" style="padding-top: 3px" fieldgroup="true" '+checked+'>'
                    +user.displayName+'('+user.exten+')'+'</label>';
//                html += '<label class="radio-inline"><input type="radio" name="agent" value="'
//                    +user._id+'" style="padding-top: 3px" '+checked+'>'
                    +user.displayName+'('+user.exten+')'+'</label>';
            }
        }
        container.find('#tel_agentForm').empty().html(html);
    },

    setAgent: function(data) {
        var container=$("#ivr_tab_content");
        var id=container.find("input[name='_id']").val();
        var val = DS.getDataOfForm(container.find('#tel_agentForm'));
        var action={
            action: 'app.tel.setAgent',
            data: {
                _id:id,
                agent:val.data.agent
            }
        };
        DS.send(action, function(response){
            if(response.success) {
                container.find('#tel_agentModal').modal('hide');
                window.setTimeout(function(){
                    handler.tel.getCallInfo(id);
                },300);
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    showServiceAgentModal: function(src, data){
        var container=$("#ivr_tab_content")
        var html = '';
        var agents = {};
        for(var i=0;i<session.ivr.serviceAgent.length;i++) {
            agents[session.ivr.serviceAgent[i]]= true;
        }
        var users=getCache("agents");
        for(var i=0;i<users.length;i++) {
            var user = users[i];
            if(user.product=='zj'){
                var checked = '';
                if(agents[user._id]){
                    checked = 'checked';
                }
                html += '<label class="checkbox-inline"><input type="checkbox" name="serviceAgent[]" value="'
                    +user._id+'" style="padding-top: 3px" fieldgroup="true" '+checked+'>'
                    +user.displayName+'('+user.exten+')'+'</label>';
            }
        }

        container.find('#tel_serviceAgentForm').empty().html(html);
    },

    setServiceAgent: function(data) {
        var container=$("#ivr_tab_content");
        var id=container.find("input[name='_id']").val();
        var val = DS.getDataOfForm(container.find('#tel_serviceAgentForm'));
//        console.dir(val);
        var action={
            action: 'app.tel.setServiceAgent',
            data:{
                _id:id,
                serviceAgent:val.data.serviceAgent||[]
            }
        };
        DS.send(action, function(response){
            if(response.success) {
                container.find('#tel_serviceAgentModal').modal('hide');
                window.setTimeout(function(){
                    handler.tel.getCallInfo(id);
                },300);
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    editWMusic: function(src, data) {
        var container=$("#ivr_tab_content");
        var id=container.find("input[name='_id']").val();
        DS.util.getBufferedView('zj/tel/w_music', function (view) {
            container.find("#uploadWModal").empty();
            view = view.replace('__session_id', session.id).replace("___id",id);
            container.find("#uploadWModal").html(view);
        });
    },

    editOWMusic: function(src, data) {
        var container=$("#ivr_tab_content");
        var id=container.find("input[name='_id']").val();
        DS.util.getBufferedView('zj/tel/ow_music', function (view) {
            container.find("#uploadOWModal").empty();
            view = view.replace('__session_id', session.id).replace("___id",id);
            container.find("#uploadOWModal").html(view);
        });
    },
    setW: function(src, data) {
        $('#upload_w_music').submit();
    },
    setOW: function(src, data) {
        $('#upload_ow_music').submit();
    },
    refresh: function(data,src) {
        window.setTimeout(function(){
            handler.tel.getCallInfo(session.ivr._id);
        },300);
    },
    playW: function(src, data) {
        var html='<audio controls="controls" preload="auto" autoplay src="/getFile?fileId='+session.ivr.w.id+'"></audio>';
        var p=$('#service_modal');
        p.find(".modal-dialog").width(380);
        p.find('.modal-title').text('欢迎语音');
        p.find(".modal-body").html(html);
        p.modal();
    },
    playOW: function(src, data) {
        var html='<audio controls="controls" preload="auto" autoplay src="/getFile?fileId='+session.ivr.ow.id+'"></audio>';
        var p=$('#service_modal');
        p.find(".modal-dialog").width(380);
        p.find('.modal-title').text('下班语音');
        p.find(".modal-body").html(html);
        p.modal();
    },
    downLoadWMusic:function(src, data){
        if(!session.ivr.w){
            $().alertmessage('showError', "不能下载默认语音或欢迎语音不存在!");
        }else{
            var form = $("<form>");   //定义一个form表单
            form.attr('style', 'display:none');   //在form表单中添加查询参数
            form.attr('target', '');
            form.attr('method', 'get');
            form.attr('action', "/getFile");

            var input1 = $('<input>');
            input1.attr('type', 'hidden');
            input1.attr('name', 'fileId');
            input1.attr('value', session.ivr.w.id);
            $('body').append(form);  //将表单放置在web中
            form.append(input1);   //将查询参数控件提交到表单上
            form.submit();
        }
    },
    downLoadOWMusic:function(src, data){
        if(!session.ivr.ow){
            $().alertmessage('showError', "不能下载默认语音或欢迎语音不存在!");
        }else{
            var form = $("<form>");   //定义一个form表单
            form.attr('style', 'display:none');   //在form表单中添加查询参数
            form.attr('target', '');
            form.attr('method', 'get');
            form.attr('action', "/getFile");

            var input1 = $('<input>');
            input1.attr('type', 'hidden');
            input1.attr('name', 'fileId');
            input1.attr('value', session.ivr.ow.id);
            $('body').append(form);  //将表单放置在web中
            form.append(input1);   //将查询参数控件提交到表单上
            form.submit();
        }
    },
    _getWeekName: function(day) {
        if(day == "2")
            return '一';
        if(day == "3")
            return '二'
        if(day == "4")
            return '三'
        if(day == "5")
            return '四'
        if(day == "6")
            return '五'
        if(day == "7")
            return '六'
        if(day == "1")
            return '日'
        return '';
    },
    _getTimeNum: function(num) {
        if(num < 10) {
            return '0'+num;
        } else return num;
    },

    _getUser: function(id) {
        var users=getCache("agents")||[];
        for(var i=0;i<users.length;i++) {
            var user = users[i];
            if(id == user._id) {
                return user;
            }
        }
        return null;
    },
/*    show400:function(){
        DS.getView('zj/tel/get400',function(view){
            view=DS.renderMethodViewNew(view, session.account);
            var p=$('#service_modal');
            p.find(".modal-dialog").width(500);
            p.find('.modal-title').text('申请400号码');
            p.find(".modal-body").html(view);
            p.modal();
        });
    },
    send400:function(data,src){
        var action={
            action:'app.tel.send400',
            data:data
        };
        DS.send(action,function(rep){
            if(rep.success){
                $().alertmessage('showSuccess', '您的申请已经提交');
                $("#service_modal").modal('hide');
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },*/

    showFreeServiceNo:function(data,src){
        var action={
            action:'app.account.queryFreeSnList',
            data:{product:handler.account.productType}
        }
        DS.send(action,function(rep){
            if(rep.success){
                var list=rep.list||[];
                var list400=rep.list400||[];
                list=list.concat(list400);
//                console.dir(list);
                var selectCount=rep.selectCount||0;
                if(list.length>0){
                    if(!rep.isMoreSn && selectCount>0){
                        $().alertmessage('showWarning', "只能绑定一个服务号");
                        return;
                    }
                    DS.getView('account/serviceno_free_list',function(view){
                        var p=$('#tel_ivr_modal');
                        p.find(".modal-dialog").width(850);
                        p.find('.modal-title').text('指定号码');
                        p.find(".modal-body").html(view);
//                        p.find(".ds_form_action").attr({ds_action:'agent.bindDidNum',ds_form:'#frm_didnum_data'});
                        var tmpl1='<div class="row">';
                        var tmpl='<div class="col-md-3 col1"><label><h3 style="display: inline-block;cursor: pointer;"><input type="radio" name="telNum" value="_#_id#_"> _#_id#_</h3></label></div>';
                        var html = [];
                        for (var i = 0, len = list.length; i < len; i++) {
                            var row = list[i];
                            if(i==0){
                                html.push(tmpl1);
                            }else if(i%4==0){
                                html.push("</div>");
                                html.push(tmpl1);
                            }
                            html.push(DS.renderMethodViewNew(tmpl, row));
                            if(i==len-1){
                                html.push("</div>");
                            }
                        }
                        /*for (var i = 0; i < list400.length; i++) {
                            var obj = list400[i];
                            if(i==0){
                                html.push(tmpl1);
                            }else if(i%4==0){
                                html.push("</div>");
                                html.push(tmpl1);
                            }
                            html.push(DS.renderMethodViewNew(tmpl, obj));
                            if(i==len-1){
                                html.push("</div>");
                            }
                        }*/
                        p.find('#service_free_list').html(html.join(''));
                        p.modal();
                    });
                }else{
                    $().alertmessage('showWarning', "您还没有购买任何号码");
                }
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    },
    bindServiceNo:function(data,src){
        if(!data.telNum){
            $().alertmessage('showError', "请至少选择一个号码");
            return;
        }
        var pane=$("#right_pane");
        var action={
            action:'app.account.bindServiceNo',
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                var tab=pane.find("#ivr_tab");
                pane.find('#tel_ivr_modal').modal('hide');
//                pane.find("#ivr_tab_content").html();
                var li=tab.find("li");
                if(li.length==0){
                    tab.empty();
                }
                var ivrId=rep.ivrId;
                var tmpl='<li><a href="#" class="ds_do_action" ds_action="tel.getCallInfo" ds_data="_#ivrId#_"  data-toggle="tab">_#sn#_</a></li>';
                var html =tmpl.replace(/_#ivrId#_/g,ivrId).replace(/_#sn#_/,data.telNum);
                tab.append(html);
                tab.find("li a[ds_data='"+ivrId+"']").click();
                //sync cache
                var num={_id:data.telNum,codeName:data.telNum,codeValue:data.telNum}
                addCache("ivrNums",num);
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        })
    },
    deleteServiceNo:function(num,src){
        if(!confirm("请确认要删该服务号吗？"))return;
        var pane=$("#right_pane");
        var ivrId=src.attr("ds_param");
        var action={
            action:'app.tel.deleteZJServiceNo',
            data:{_id:num,ivrId:ivrId}
        }
        DS.send(action,function(rep){
            if(rep.success){
                var container=$("#ivr_tab_content");
                container.empty();
                handler.tel.getMyServiceNo();
                //sync cache
                removeCache("ivrNums",num);
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    }
}