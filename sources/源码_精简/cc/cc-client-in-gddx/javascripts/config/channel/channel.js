/**
 * Created by wangwh on 2015/4/27.
 */
handler.config.channel = {
    pageSize: 10,
    emailReg: /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/,
    phoneReg:/((\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$)/,
    wechatUrl:"",
    menuid:"",
    appid:"",
    wechatKmEditor:null,
    emailIdiograph:null,
    evaluateUrl:null,
    robot:false,
    quckReplayData:'webchat',
    config_channel:function (id) {
        var pane=$("#view_config_channel");
        var menus = [
            'email_insert'
        ];
        for(var i=0; i<menus.length; i++){
            if(!isHasMenu(menus[i])){
                pane.find(".sub-nav>.tab_" + menus[i]).remove();
            }else{
                pane.find(".sub-nav>.tab_" + menus[i]).show();
            }
        }
        handler.config.channel.queryEmailQueueList();
    },
    queryPublicConfig: function(data){
        if(session.account.imMaxDealCount)
            $('#public_max_deal_im_count').val(session.account.imMaxDealCount);
        else
            $('#public_max_deal_im_count').val(5);
    },
    savePublicConfig: function(data){
        //saveMultiChannelPublicConfig
        var action = {
            action: 'config.channel.saveMultiChannelPublicConfig',
            data: {imMaxDealCount: parseInt(data.imMaxDealCount)}
        };
        DS.send(action, function (response) {
            if (response.success) {
                $('#public_max_deal_im_count').val(data.imMaxDealCount);
                session.account.imMaxDealCount = parseInt(data.imMaxDealCount);
                $().alertmessage('showSuccess', "保存成功");
            }else{
                $().alertmessage('showError',response.message|| errMsg);
            }
        });
    },
    queryEmailList: function (data, src) {
        var container=$("#view_config_channel");
        data=data||{};
        if(src){
            data.page = src.attr("value") || 1;
        }else{
            data.page = 1;
        }
        data.limit=handler.config.channel.pageSize;
        var formID = "email_query_frm";
        var action = {
            action: 'config.channel.queryEmail',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var emails = response.list;
                var html = [];
                DS.getView('config/channel/config_email_item', function (view) {
                    for (var i = 0; i < emails.length; i++) {
                        var email = emails[i];
                        if(!email.mailDisplayName){
                            email.mailDisplayName='';
                        }
                        html.push(DS.renderMethodViewNew(view,email));
                    }
                    container.find('#email_list_pane').html(html.join(""));
                    DS.updatePagination(formID, response.count, handler.config.channel.pageSize, data.page);
                });
            }else{
                $().alertmessage('showError',response.message|| errMsg);
            }
        });
    },
    showEmailTypeDesc:function(type,val){
        var dic=getCache(type);
        var temp = "";
        for(var i=0;i<dic.length;i++){
            if(dic[i].code_value == val){
                temp = dic[i].code_name;
                return temp;
            }
        }
        return temp;
    },
    getOptionDic:function(type,val){
        var dic=getCache(type);
        var html=["<option value='' selected>--请选择--</option>"];
        if(val){
            html=["<option value=''>--请选择--</option>"];
        }
        var selectOptionHtml = "<option value='__value' selected>__name</option>";
        var optionHtml = "<option value='__value'>__name</option>";

        for (var i=0;i<dic.length;i++) {
            if(val && val==dic[i].code_value){
                html.push(selectOptionHtml.replace(/__value/g,dic[i].code_value).replace(/__name/g,dic[i].code_name));
            } else{
                html.push(optionHtml.replace(/__value/g,dic[i].code_value).replace(/__name/g,dic[i].code_name));
            }
        }
        return html.join("");
    },
    showEmailAdd: function (data) {
        var container=$("#view_config_channel");
        var panel = container.find("#config_email_container");
        DS.getView('config/channel/config_email_add', function (view) {
            var pane = container.find("#config_email_container");
            pane.empty();
            pane.html(view);
            var dicHtml = handler.config.channel.getOptionDic("emailType");
            panel.find("select[name='type']").html(dicHtml);
            var mailQueues = getCache('mailQueues');
            var optionsHtml = '<option selected="selected" value="0">--请选择--</option>';
            for(var i=0 ;i<mailQueues.length; i++){
                optionsHtml += '<option value="'+mailQueues[i].Exten+'">'+mailQueues[i].DisplayName+'</option>';
            }
            $('#email_topeer').html(optionsHtml);
        });
    },
    cancelEmailDeal: function (src) {
        var container=$("#view_config_channel");
        container.find('#config_email_container').empty();
        container.find('#config_email_queue_container').empty();
        container.find('#config_weixin_container').empty();
        container.find('#config_webchat_container').empty();
        container.find('#config_Mobilesdk_container').empty();
    },
    saveEmail: function (data) {
        var container=$("#view_config_channel");
        var pane =container.find('#config_email_container');
        var mailId = data.mailId;

        if (!mailId || !handler.config.channel.emailReg.test(mailId)) {
            $().alertmessage('showError', "请正确填写邮箱账户名！");
            return;
        }
        var action = {
            action: "config.channel.addEmailCfg",
            data: data
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                $().alertmessage('showSuccess', "增加邮箱成功");
                pane.empty();
                handler.config.channel.queryEmailList();
            } else {
                $().alertmessage('showError', rep.message||errMsg);
            }
        })
    },
    showUpdateEmailView: function (data, src) {
        var container=$("#view_config_channel");
        var panel = container.find("#config_email_container");
        var action = {
            action: 'config.channel.queryEmailCfgById',
            data: {_id: data._id}
        };
        DS.send(action, function (response) {
            if (response.success) {
                var mail = response.mail;
                var html = [];
                $(src).closest("tr").addClass("active").siblings().removeClass("active");
                DS.getView('config/channel/config_email_edit', function (view) {
                    html.push(DS.renderMethodViewNew(view,mail));
                    panel.empty();
                    panel.html(html.join(""));
                    var dicHtml = handler.config.channel.getOptionDic("emailType",mail.type);
                    panel.find("select[name='type']").html(dicHtml);
                    var mailQueues = getCache('mailQueues');
                    var optionsHtml = '<option selected="selected" value="0">--请选择--</option>';
                    for(var i=0 ;i<mailQueues.length; i++){
                        if(mailQueues[i].Exten == mail.ToPeer){
                            optionsHtml += '<option selected="selected" value="'+mailQueues[i].Exten+'">'+mailQueues[i].DisplayName+'</option>';
                        }else{
                            optionsHtml += '<option value="'+mailQueues[i].Exten+'">'+mailQueues[i].DisplayName+'</option>';
                        }
                    }
                    optionSelect(panel.find("select[name='isDefault']"),mail.isDefault);
                    $('#email_topeer').html(optionsHtml);
                });
            }else{
                $().alertmessage('showError', response.message||errMsg);
            }
        });
    },
    updateEailCfg : function (data) {
        var container=$("#view_config_channel");
        var panel = container.find("#config_email_container");
        var mailId = data.mailId;
        if (!mailId || !handler.config.channel.emailReg.test(mailId)) {
            $().alertmessage('showError', "请正确填写邮箱账户名！");
            return;
        }
        var action = {
            action: "config.channel.updateEmailCfg",
            data: data
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                $().alertmessage('showSuccess', "设置邮箱成功！");
                panel.empty();
                handler.config.channel.queryEmailList();
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        })
    },
    showDelEmailView: function (data) {
        var con = confirm("确定要删除该邮箱吗？");
        if (!con) {
            return false;
        }
        var action = {
            action: 'config.channel.deleteEmailCfg',
            data: {_id: data._id}
        };
        DS.send(action, function (response) {
            if (response.success) {
                $().alertmessage('showSuccess', "删除成功");
                handler.config.channel.queryEmailList();
            } else {
                $().alertmessage('showError', response.message||errMsg);
            }
        });
    },
    showEmailQueueAdd: function (data,src) {
        var container=$("#view_config_channel");
        DS.getView('config/channel/config_email_queue_add', function (view) {
            var pane = container.find("#config_email_queue_container");
            pane.empty();
            pane.html(view);
            handler.config.channel.renderMailQueueAgentAssign(data,src);
            $(".show_result ul").html("");
        });
        var rHeight = $(".left_col").height() - 80;
        $("#config_email_queue_container").css("height",rHeight);
    },
    renderMailQueueAgentAssign: function (data,src) {
        var agentArr = getCache("agents");
        var allHtml = [];
        var allHtmlResult = [];
        var agent = null;
        var tempHtml = null;
        var tempHtmlResult = null;
        var flag = src.attr("flag");
        for (var i= 0,len=agentArr.length;i<len;i++) {
            tempHtml = allHtml;
            tempHtmlResult = allHtmlResult;
            agent = agentArr[i];
            if (agent.displayName) {
            }
            if (agent.status && agent.status == 'enable'){
                tempHtml.push('<li class="not_select"><span class="set_name" id="');
                tempHtml.push(agent._id);
                tempHtml.push('_show">');
                tempHtml.push(agent.displayName+'-');
                tempHtml.push(agent.exten);
                if(flag){
                   tempHtml.push('</span><span class="set_add" ds_action="config.channel.addAgentAssign" ds_data="config_email_agent_add">');
                }else{
                    tempHtml.push('</span><span class="set_add" ds_action="config.channel.addAgentAssign" ds_data="config_email_agent_add" custom="use">');
                }
                tempHtml.push(agent._id);
                tempHtml.push('</span></li>');


                tempHtmlResult.push('<li><span class="set_name" id="queue_agent_');
                tempHtmlResult.push(agent._id);
                tempHtmlResult.push('">');
                tempHtmlResult.push(agent.displayName+'-');
                tempHtmlResult.push(agent.exten);
                tempHtmlResult.push('</span>');
                if(flag){
                tempHtmlResult.push('<input type="text" onkeyup="value=value.replace(/[^\\d]/g,\'\')" name="priority" class="form-control input-sm number" id="'+agent._id+'_priority" value=0 style="width: 33px;text-align: center;" required="" datatype="Number,Range" min="0" msg="您输入的优先级有误">');
                }
                tempHtmlResult.push('<label style="margin-top: 3px;" ds_action="config.channel.deleteAgentAssign" name="');
                tempHtmlResult.push(agent._id + '_show">');
                tempHtmlResult.push('<input type="checkbox" name="');
                tempHtmlResult.push(agent._id + '_assignment');
                tempHtmlResult.push('" id="');
                tempHtmlResult.push(agent._id + '_assignment');
                tempHtmlResult.push('"/>');
                tempHtmlResult.push('</label></li>');
            }
        }
        if (allHtml.length > 0) {
            if(flag) {
                $("#agentAssignTable > ul").html(allHtml.join(''));
            }else{
                $("#customAgentAssignTable>ul").html(allHtml.join(''));
            }
        }else {
            if(flag) {
                $("#agentAssignTable > ul").css('display', 'none');
            }else{
                $("#customAgentAssignTable>ul").css('display', 'none');
            }
            //$("#agentAssignTable").css('display', 'none');
        }
        if (allHtmlResult.length > 0) {
            $("#agentAssignResult > ul").html(allHtmlResult.join(''));
        }
        $('#agentAssignAutoComplete').bind('keyup', function(){
            if (this.value) {
                var searchAgent = this.value;
                if(flag){
                    var allAgentDom = $("#agentAssignTable");
                }else{
                    var allAgentDom = $("#customAgentAssignTable");
                }
                var noSelectAgentArr = allAgentDom.find(".not_select").find(".set_name");
                if (searchAgent) {
                    for (var i = 0; i < noSelectAgentArr.length; i++) {
                      noSelectText = noSelectAgentArr[i].innerText;
                      if (noSelectText.indexOf(searchAgent)>=0) {
                        allAgentDom.find(".not_select").eq(i).show();
                      }else{
                        allAgentDom.find(".not_select").eq(i).hide();
                      }
                }
                    ;
                }

            }else{
                $(".not_select").show();
            }
        });

    },
    deleteAgentAssign: function (src) {
        var agentID = src.attr('name');
        var flag=src.attr("flag");
        src.parent().remove();
        $("#agentAssignAutoComplete").val("");
        if(flag){
            $("#customAgentAssignTable").find('#'+agentID).closest("li").addClass("not_select").show();
          $("#customAgentAssignTable").find(".not_select").show();
        }else{
            $("#agentAssignTable").find('#'+agentID).closest("li").addClass("not_select").show();
            $("#agentAssignTable").find(".not_select").show();
        }

    },
    addAgentAssign: function (src) {
        var container=$("#agentAssignPanel").find(".show_result");
        //var container=src.closest(".right_content_pane").find(".show_result")
        var agentID = src.text();
        var custom=src.attr("custom");
        if(custom){
            container=$('#config_weixin_custom').find(".show_result");
        }
        var agentName = src.siblings(".set_name").text();
        src.parent().removeClass("not_select").hide();
        var agentNum = container.find("li").length + 1;//取值的时候最新的一条还没插入
        var liHeight = container.find("li").height();
        var scrollHeight = liHeight * agentNum;
        agents ={
            agentID: agentID,
            agentName: agentName,
        };
        DS.getView('config/channel/config_email_agent_add', function (view) {
            container.find('ul').append(DS.renderMethodViewNew(view,agents));
            if(custom){
                container.find('#'+agents.agentID+'priority').hide();
                container.find('#'+agents.agentID+'priority+label').attr("flag","use")
            }
        });
        container.scrollTop(scrollHeight);
        if (src.parent().siblings("li:visible").length==0) {
        $("#agentAssignAutoComplete").val("");
        $("#agentAssignTable").find(".not_select").show();
        }
    },
    saveEmailQueue: function (data) {
        var reg=/^[0-9]*$/;
        if(!reg.test(data.MemoryTime)||data.MemoryTime<=0){
            $("#queueMemoryTime").css("border","1px solid red");
            alert("记忆时间必须是纯数字并且大于0！");
            return;
        }
        if(data.Exten){
            handler.config.channel.nextSaveEmailQueue(data);
        }else{
            var action = {
                action: 'config.ivr.queue.getFreeQueueNo',
                data: null
            }
            DS.send(action, function (rep) {
                if (rep.success) {
                    data.Exten = rep.num;
                    handler.config.channel.nextSaveEmailQueue(data);
                } else {
                    alert('取空闲技能组失败');
                }
            });
        }
    },
    nextSaveEmailQueue: function(data){
        var panel = $('#panel_email_queue_config').find(".show_result");
        var assignedchkArr = $('label', panel);
        var assigned = null, assignedArr = [], chkName = null, agentID = null, proiority = null;
        for (var i = 0, len = assignedchkArr.length; i < len; i++) {
            assigned = $(assignedchkArr[i]);
            chkName = assigned.attr('name');
            agentID = chkName.split('_')[0];
            proiority = assigned.closest('li').find('.number').val();
            assignedArr.push(agentID + ':' + proiority);
        }
        var sendData = {};
        sendData.MemberToken = JSON.stringify(assignedArr);

        sendData.assignRule = data.assignRule;
        sendData.DisplayName = data.DisplayName;
        sendData.Exten = data.Exten;
        sendData.Timeout = data.Timeout;
        sendData.WaitCount = data.WaitCount;
        sendData.Joinempty = data.Joinempty;
        sendData.Strategy = data.Strategy;
        sendData.IsMemory=data.IsMemory;
        sendData.MemoryTime=data.MemoryTime;
        sendData.ToPeerWhenQueueEmpty = data.ToPeerWhenQueueEmpty;
        if('id' in data){
            sendData.id = data.id;
        }
        var container=$("#view_config_channel");
        var pane =container.find('#config_email_queue_container');
        var action = {
            action: "config.channel.addOrUpdateEmailQueue",
            data: sendData
        };//请求地址
        DS.send(action, function (rep) {
            if (rep.success) {
                $().alertmessage('showSuccess', "保存渠道技能组成功");
                pane.empty();
                handler.config.channel.queryEmailQueueList();
                if('mailQueues' in session.dicMap){
                    delete session.dicMap.mailQueues;
                }
            } else {
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },

    queryEmailQueueList: function (data, src) {
        var container=$("#view_config_channel");
        data=data||{};
        if(src){
            data.page = src.attr("value") || 1;
        }else{
            data.page = 1;
        }
        data.limit=handler.config.channel.pageSize;//10
        var formID = "email_queue_query_frm";
        var action = {
            action: 'config.channel.queryEmailQueue',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var emailQueues = response.list;
                if(emailQueues.length>0) {
                    container.find('#email_queue_list_pane').empty();
                    for (var i = 0; i < emailQueues.length; i++) {
                        var emailQueuesList = emailQueues[i];
                        var configEmailQueue = template("config_email_queue_item_template", emailQueuesList);
                        container.find('#email_queue_list_pane').append(configEmailQueue)
                    }
                }else{
                    container.find('#email_queue_list_pane').html('<tr><td colspan="5" style="text-align:center;height:58px;line-height:58px;">目前没有技能组信息！</td></tr>')

                }
                DS.updatePagination(formID, response.count, handler.config.channel.pageSize, data.page);
            }else{
                $().alertmessage('showError',response.message|| errMsg);
            }
        });
    },
    showDelEmailQueue: function (data) {
        var con = confirm("确定要删除该邮箱技能组吗？");
        if (!con) {
            return false;
        }
        var action = {
            action: 'config.channel.deleteEmailQueue',
            data: {_id: data._id}
        };
        DS.send(action, function (response) {
            if (response.success) {
                $().alertmessage('showSuccess', "删除成功");
                handler.config.channel.queryEmailQueueList();
            } else {
                $().alertmessage('showError', response.message||errMsg);
            }
        });
    },
    showUpdateEmailQueueView: function (data, src) {
        var container=$("#view_config_channel");
        var panel = container.find("#config_email_queue_container");
        var action = {
            action: 'config.channel.queryEmailQueueById',
            data: {_id: data._id}
        };
        DS.send(action, function (response) {
            if (response.success) {
                var mailQueue = response.mailQueue;
                var html = [];
                $(src).closest("tr").addClass("active").siblings().removeClass("active");
                DS.getView('config/channel/config_email_queue_edit', function (view) {
                    html.push(DS.renderMethodViewNew(view,mailQueue));
                    panel.empty();
                    panel.html(html.join(""));

                    $('#agentAssignResult_select').val(mailQueue.AssignRule);
                    handler.config.channel.renderMailQueueAgentAssign(data,src);
                    if(!response.mailQueue.MemoryTime){
                        $("#queueMemoryTime").val("120");
                    }
                    if(response.mailQueue.IsMemory==true){
                        $("#queueIsMemory").attr("checked","checked")
                    }else{
                        $("#queueIsMemory").removeAttr("checked")
                    }
                    var members = mailQueue.AssignMembers;
                    if (members && members.length > 0) {
                        var member = null, arr = null;
                        for (var ind in members) {
                            member = members[ind];
                            $('#' + member.agentID + '_assignment').attr('checked', 'true').parent().parent().show();
                            var priority=member.penalty?member.penalty:0;
                           $('#' + member.agentID + '_priority').val(priority);
                            $('#' + member.agentID + '_show').parent().removeClass("not_select").hide();
                        }
                    }
                    panel.find(".show_result").find("li:hidden").remove();
                });
            }else{
                $().alertmessage('showError', response.message||errMsg);
            }
        });
            rHeight = $(".left_col").height()-80;
            $("#config_email_queue_container").css("height",rHeight);
    },
    showWeixinAdd: function (data) {
        var container=$("#view_config_channel");
        var panel = container.find("#config_weixin_container");
        DS.getView('config/channel/config_weixin_add', function (view) {
            var pane = container.find("#config_weixin_container");
            pane.empty();
            pane.html(view);
            var mailQueues = getCache('mailQueues');
            var optionsHtml = '<option selected="selected" value="0">--请选择--</option>';
            for(var i=0 ;i<mailQueues.length; i++){
                optionsHtml += '<option value="'+mailQueues[i].Exten+'">'+mailQueues[i].DisplayName+'</option>';
            }
            $('#weixin_topeer').html(optionsHtml);
        });
    },
    saveWeixin: function (data) {
        var container=$("#view_config_channel");
        var pane =container.find('#config_weixin_container');

        var action = {
            action: "config.channel.addWeixinCfg",
            data: data
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                $().alertmessage('showSuccess', "增加微信服务号成功");
                pane.empty();
                handler.config.channel.queryWeixinList();
            } else {
                $().alertmessage('showError', rep.message||errMsg);
            }
        })
    },
    queryWeixinList: function (data, src) {
        var container=$("#view_config_channel");
        data=data||{};
        if(src){
            data.page = src.attr("value") || 1;
        }else{
            data.page = 1;
        }
        data.limit=handler.config.channel.pageSize;
        var formID = "weixin_query_frm";
        var action = {
            action: 'config.channel.queryWeixin',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var weixins = response.list;
                var html = [];
                DS.getView('config/channel/config_weixin_item', function (view) {
                    for (var i = 0; i < weixins.length; i++) {
                        var weixin = weixins[i];
                        html.push(DS.renderMethodViewNew(view,weixin));
                    }
                    container.find('#weixin_list_pane').html(html.join(""));
                    DS.updatePagination(formID, response.count, handler.config.channel.pageSize, data.page);
                });
            }else{
                $().alertmessage('showError',response.message|| errMsg);
            }
        });
    },
    showDelWeixinView: function (data) {
        var con = confirm("确定要删除该微信服务号吗？");
        if (!con) {
            return false;
        }
        var action = {
            action: 'config.channel.deleteWeixinCfg',
            data: {_id: data._id}
        };
        DS.send(action, function (response) {
            if (response.success) {
                $().alertmessage('showSuccess', "删除成功");
                handler.config.channel.queryWeixinList();
            } else {
                $().alertmessage('showError', response.message||errMsg);
            }
        });
    },
    showUpdateWeixinView: function (data, src) {
        var container=$("#view_config_channel");
        var panel = container.find("#config_weixin_container");
        var action = {
            action: 'config.channel.queryWeixinCfgById',
            data: {_id: data._id}
        };
        DS.send(action, function (response) {
            if (response.success) {
                var weixin = response.data;
                var html = [];
                DS.getView('config/channel/config_weixin_edit', function (view) {
                    html.push(DS.renderMethodViewNew(view,weixin));
                    panel.empty();
                    panel.html(html.join(""));

                    var mailQueues = getCache('mailQueues');
                    var optionsHtml = '<option selected="selected" value="0">--请选择--</option>';
                    for(var i=0 ;i<mailQueues.length; i++){
                        if(mailQueues[i].Exten == weixin.ToPeer){
                            optionsHtml += '<option selected="selected" value="'+mailQueues[i].Exten+'">'+mailQueues[i].DisplayName+'</option>';
                        }else{
                            optionsHtml += '<option value="'+mailQueues[i].Exten+'">'+mailQueues[i].DisplayName+'</option>';
                        }
                    }
                    optionSelect(panel.find("select[name='isDefault']"),weixin.isDefault);
                    $('#weixin_topeer').html(optionsHtml);
                });
            }else{
                $().alertmessage('showError', response.message||errMsg);
            }
        });
    },
    updateWeixinCfg: function(data){
        var container=$("#view_config_channel");
        var panel = container.find("#config_weixin_container");
        var action = {
            action: "config.channel.updateWeixinCfg",
            data: data
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                $().alertmessage('showSuccess', "修改微信公众号成功！");
                panel.empty();
                handler.config.channel.queryWeixinList();
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        })
    },
    showFieldDesc:function(type,val){
        var desc='';
        if(type=='isDefault'){
            if(val=='1'){
                desc="是";
            }else if(val=='0'){
                desc="否";
            }
        }
        return desc;
    },
    showAskDialogFlow: function () {
        DS.getView('config/channel/ask_dialog_flow', function (view) {
            var pane = $('#ask_dialog_webchat');
            pane.empty();
            pane.html(view);
        });
    },
    showWebchatAdd: function (data) {
        var mailQueues = getCache('mailQueues');
        if(mailQueues.length<=0){
            $().alertmessage('showError', "您还没设置技能组，请先到【渠道技能组】添加技能组!");
            return;
        }
        var container=$("#view_config_channel");
        var panel = container.find("#config_webchat_container");
        DS.getView('config/channel/config_webchat_add', function (view) {
            var pane = container.find("#config_webchat_container");
            pane.empty();
            pane.html(view);
            var robotConfig = getCache('robotConfig');
            if(!robotConfig || robotConfig.length == 0){
                $("#webchat_modal_hidden a:first").click();
                robotConfig = [];
            }
            var robotOptionsHtml = '<option selected="selected" value="">--请选择--</option>';
            for(var i=0 ;i<robotConfig.length; i++){
                robotOptionsHtml += '<option value="'+robotConfig[i]._id+'">'+robotConfig[i].robot_type+'</option>';
            }
            $("#webchat_robot").html(robotOptionsHtml);

            var optionsHtml = '<option selected="selected" value="0">--请选择--</option>';
            for(var i=0 ;i<mailQueues.length; i++){
                optionsHtml += '<option value="'+mailQueues[i].Exten+'">'+mailQueues[i].DisplayName+'</option>';
            }
            panel.find('#webchat_topeer').html(optionsHtml);
            $('#webchat_accessId').val(uuid.v1());
            handler.config.channel._initWebchatQiniuImg();
        });
    },
    saveWebchat: function (data) {
        if(!data.typename || data.typename.length<=0){
            $().alertmessage('showError', "请选择技能组");
            return;
        }

        data.ToPeer = handler.config.channel.getSkillGroups(data.typename);
        var havePeer = false;
        for(var i=0; i<data.ToPeer.length; i++){
            var peer = data.ToPeer[i];
            if(peer.status == "enable"){
                havePeer = true;
            }
        }
        if(!havePeer){
            $().alertmessage('showError', "请至少启用一个技能组");
            return;
        }
        delete data.typename;
        var container=$("#view_config_channel");
        var pane =container.find('#config_webchat_container');
        var action = {
            action: "config.channel.addWebchatCfg",
            data: data
        };

        data.platform = "web";
        data.serviceStates = 1;
        DS.send(action, function (rep) {
            if (rep.success) {
                $().alertmessage('showSuccess', "增加webchat接入号成功");
                pane.empty();
                data.webchatUrl = rep.webchatUrl || "http://webchat.7moor.com";
                handler.config.channel.queryWebchatList();
                handler.config.channel.showWebchatConfigInstruction(data);
                handler.config.channelDic.addNewWebchatDic();
            } else {
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    queryWebchatList: function(data, src){
        var container=$("#view_config_channel");
        data=data||{};
        if(src){
            data.page = src.attr("value") || 1;
        }else{
            data.page = 1;
        }
        data.platform = "web";
        data.limit=handler.config.channel.pageSize;
        var formID = "webchat_query_frm";
        var action = {
            action: 'config.channel.queryWebchat',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var webchats = response.list;
                var webchatUrl = response.webchatUrl|| "http://webchat.7moor.com";
                if(webchats.length>0) {
                    container.find('#webchat_list_pane').empty();
                    for (var i = 0; i < webchats.length; i++) {
                        var webchat = webchats[i];
                        webchat.webchatUrl = webchatUrl;
                        var accessId = webchat.accessId;
                        var embedScript = "<script type=\"text/javascript\" src=\"" + webchatUrl + "/javascripts/7moorInit.js?accessId=" + accessId + "\"></script>";
                        webchat.embedScript = embedScript;
                        var configWebchat=template("config_webchat_item_template",webchat)
                        container.find('#webchat_list_pane').append(configWebchat);
                    }
                    DS.updatePagination(formID, response.count, handler.config.channel.pageSize, data.page);
                }else{
                    var html='<tr style="text-align: center;"><td colspan="2" style="text-align:center;height:58px;line-height:58px;">目前没有在线客服配置信息!</td></tr>';
                    container.find('#webchat_list_pane').html(html);
                }
            }else{
                $().alertmessage('showError',response.message|| errMsg);
            }
        });
    },
    showUpdateWebchatView: function(data, src){
        var container=$("#view_config_channel");
        var panel = container.find("#config_webchat_container");
        var action = {
            action: 'config.channel.queryWebchatCfgById',
            data: {_id: data._id}
        };
        DS.send(action, function (response) {
            if (response.success) {
                var webchat = response.data;
                $(src).closest("tr").addClass("active").siblings().removeClass("active");
                webchat.webchatUrl = response.webchatUrl || "http://webchat.7moor.com";
                if(webchat.cssStyle && webchat.cssStyle.onlineText){
                    webchat.onlineText = webchat.cssStyle.onlineText;
                }else{
                    webchat.onlineText = "";
                }
                if(webchat.cssStyle && webchat.cssStyle.offlineText){
                    webchat.offlineText = webchat.cssStyle.offlineText;
                }else{
                    webchat.offlineText = "";
                }
                if(webchat.cssStyle && webchat.cssStyle.styleColor){
                    webchat.styleColor = webchat.cssStyle.styleColor;
                }

                if(!webchat.styleColor){
                    webchat.styleColor = "19CAA6"; //默认风格颜色
                }
                var html = [];
                DS.getView('config/channel/config_webchat_edit', function (view) {
                    html.push(DS.renderMethodViewNew(view,webchat));
                    panel.empty();
                    panel.html(html.join(""));

                    var robotConfig = getCache('robotConfig');
                    if(!robotConfig || robotConfig.length == 0){
                        robotConfig = [];
                    }
                    var robotOptionsHtml = '<option selected="selected" value="">--请选择--</option>';
                    for(var i=0 ;i<robotConfig.length; i++){
                        if(robotConfig[i]._id == webchat.robot){
                            robotOptionsHtml += '<option selected="selected" value="'+robotConfig[i]._id+'">'+robotConfig[i].robot_type+'</option>';
                        }else{
                            robotOptionsHtml += '<option value="'+robotConfig[i]._id+'">'+robotConfig[i].robot_type+'</option>';
                        }
                    }
                    $("#webchat_robot").html(robotOptionsHtml);
                    var toPeer = webchat.ToPeer;
                    handler.config.channel.setSkillsGroup(toPeer, panel, "myModal");

                    var mailQueues = getCache('mailQueues');
                    var optionsHtml = '<option selected="selected" value="0">--请选择--</option>';
                    for(var i=0 ;i<mailQueues.length; i++){
                        if(mailQueues[i].Exten == webchat.ToPeer){
                            optionsHtml += '<option selected="selected" value="'+mailQueues[i].Exten+'">'+mailQueues[i].DisplayName+'</option>';
                        }else{
                            optionsHtml += '<option value="'+mailQueues[i].Exten+'">'+mailQueues[i].DisplayName+'</option>';
                        }
                    }
                    panel.find('#webchat_topeer').html(optionsHtml);
                    $('#webchat_showAgentName').attr("checked",webchat.showAgentName);
                    $('#webchat_csr').attr("checked",webchat.webchat_csr);
                    $('#webchat_serviceStates').val(webchat.serviceStates);

                    if(!webchat.companyLogo){
                        $('#webchat_config_edit_companyLogo').remove();
                    }

                    $(".webchat_style_li").each(function(){
                        if($(this).attr("ds_data") == webchat.styleColor){
                           $(this).addClass("ok").siblings().removeClass("ok");
                            return false;
                        }
                    });
                    var pane = container.find(".right_content_pane");
                    handler.config.channel._initWebchatPreviewStyle(webchat.styleColor, pane);
                    handler.config.channel._initWebchatQiniuImg();
                });
            }else{
                $().alertmessage('showError', response.message||errMsg);
            }
        });
    },

    setSkillsGroup:function(toPeer, panel, modal){
        var peers = [];
        if(typeof toPeer == "object"){
            peers = toPeer;
        }else if(typeof toPeer == "string"){
            var peer = getCacheByKey('mailQueues', "Exten", toPeer);
            if(peer){
                peers.push({name: peer.DisplayName, id: toPeer, status: "enable"});
            }

        }
        for(var i=0; i< peers.length; i++){
            var peer = peers[i];
            if(peer.status == "disable"){
                peer.displayClass = "disable_color";
                peer.dataContent = "点击启用";
            }else{
                peer.displayClass = "able_color";
                peer.dataContent = "点击停用";
            }
            peer.value = peer.name+","+peer.id+","+peer.status;
            var skillGroup="<li class='ds_focus_action'>" +
                "<a data-toggle='popover' data-placement='top' data-trigger='hover focus' data-original-title='"+peer.dataContent+"' class='ds_do_action "+peer.displayClass+"'  ds_action='config.channel.switchover'>"+ peer.name +"</a>" +
                "<span class='delete ds_do_action' ds_action='config.channel.deleteSkillGroup'></span>" +
                "<span class='edit ds_do_action' ds_action='config.channel.editSkillGroup' ds_data='"+modal+"'></span>" +
                "<input name='typename[]' type='hidden' value='"+peer.value+"'>"+
                "</li>";
            panel.find(".skillgroup_container").find("ul.sg_container").append(skillGroup);
            $("[data-toggle='popover']").popover();
        }
    },
    addShowSkillGroup:function(data,src){
        var pane = $(src).closest(".right_content_pane");
       $('#'+data).modal().css({
            'margin-top': function () {
                return ($(this).height() * 1.5);
            }
        });
        $('#'+data).find("input").val("");
        $('#'+data+' option:eq(0)').attr("selected","selected");
        pane.find("#webchat_showTypeName").prop("checked",true);
        $("#"+data+" button.btn-position").attr("ds_action","config.channel.addSkillGroup");
        $("#"+data+" button.btn-position").attr("ds_data", data);

        pane.find("#webchat_topeer").change(function(){
            if(pane.find("#type_name").val()=='' ||pane.find("#type_name").val()==null){
                var selectText=$("#"+data).find("option:selected").text();
                pane.find("#type_name").val(selectText);
            }
        });
    },
    addSkillGroup:function(data,src){
        var pane = $(src).closest(".right_content_pane");
        var containter= pane.find(".skillgroup_container");
        var value=pane.find("#type_name").val();
        var skillGroup="";
        var selectoption=src.parent().find("option:selected").val();
        var totalValue=value+","+selectoption;
        var isDef = true;
        var pattern=/[^\s]/;
        var bool=pattern.test($("#"+data+" input").val());
        if($("#"+data+" input").val()==''){
            $().alertmessage('showError', "类型名称不能为空");
            return;
        }
        if(!bool){
            $().alertmessage('showError', "类型名称必须填写");
            return;
        }

        if($("#"+data+" select").val()==0){
            $().alertmessage('showError', "请选择技能组");
            return;
        }

        if($('#webchat_showTypeName').is(':checked')){
            skillGroup="<li class='ds_focus_action'>" +
                "<a data-toggle='popover' data-placement='top' data-trigger='hover focus' data-original-title='点击停用' class='ds_do_action able_color'  ds_action='config.channel.switchover'>"+value+"</a>" +
                "<span class='delete ds_do_action' ds_action='config.channel.deleteSkillGroup'></span>" +
                "<span class='edit ds_do_action' ds_action='config.channel.editSkillGroup' ds_data='"+data+"'></span>" +
                "<input name='typename[]' type='hidden' value='"+value+","+selectoption+",enable'>"+
                "</li>" ;
        }else{
            skillGroup="<li class='ds_focus_action'>" +
                "<a data-toggle='popover' data-placement='top' data-trigger='hover focus' data-original-title='点击启用' class='disable_color ds_do_action'  ds_action='config.channel.switchover'>"+value+"</a>" +
                "<span class='delete ds_do_action' ds_action='config.channel.deleteSkillGroup'></span>" +
                "<span class='edit ds_do_action' ds_action='config.channel.editSkillGroup' ds_data='"+data+"'></span>" +"" +
                "<input name='typename[]' type='hidden' value='"+value+","+selectoption+",disable'>"+
                "</li>";
        }


        pane.find("ul.sg_container input").each(function () {
            var value = $(this).val();
            var peer = value.split(",")[1];
            if (peer == selectoption) {
                $().alertmessage('showError', "技能组重复");
                isDef = false;
                return false;
            }
        });
        if (isDef){
            containter.find("ul.sg_container").append(skillGroup);
             $("[data-toggle='popover']").popover();
            $('#'+data+' option:eq(0)').attr("selected","selected");
            $('#'+data).modal('hide');
        }
    },
    switchover:function(data,src){
        var input = src.parent().find("input");
        var value = input.val();
        if(src.hasClass("disable_color")){
            src.removeClass("disable_color");
            src.addClass("able_color");
            src.attr("data-original-title","点击停用");
            value = value.replace(",disable", ",enable");
        }else{
            src.addClass("disable_color");
            src.removeClass("able_color");
            src.attr("data-original-title","点击启用");
            value = value.replace(",enable", ",disable");
        }
        input.val(value);
    },
    deleteSkillGroup:function(data,src){
        src.parent().remove();
    },
    editSkillGroup:function(data,src){
        var pane = $(src).closest(".right_content_pane");
        $('#'+data).modal().css({
            'margin-top': function () {
                return ($(this).height() * 1.5);
            }
        });
        var index=src.parent().index()-1;
        var value=pane.find(".skillgroup_container").find("li").eq(index).find('input').val();
        $('#useless').val(index);
        var arr=value.split(",");
        var value=arr[0];
        $("#"+data).find('input').val(value);
        var selectValue=arr[1];
        $('#'+data+' option[value="'+selectValue+'"]').attr("selected","true");

        if(pane.find(".skillgroup_container").find('a').eq(index).hasClass("able_color")){
            $('#'+data).find("input").prop("checked",true);
        }else{
            $('#'+data).find("input").prop("checked",false);
        }
        $("#"+data+" button.btn-position").attr("ds_action","config.channel.confirmSkillGroup");
        $("#"+data+" button.btn-position").attr("ds_data", data);
        pane.find("#webchat_topeer").change(function(){
            if(pane.find("#type_name").val()=='' ||pane.find("#type_name").val()==null){
                var selectText=$("#"+data).find("option:selected").text();
                pane.find("#type_name").val(selectText);
            }
        });

    },
    confirmSkillGroup:function(data,src){
        var pane = $(src).closest(".right_content_pane");
        var inputValue=src.parent().find('input').val();
        var selectOptionValue=src.parent().find("option:selected").val();
        var totalValue=inputValue+","+selectOptionValue;
        var isDef = true;
        var pattern=/[^\s]/;
        var bool=pattern.test($("#myModal input").val());

        var index=$('#useless').val();
        if($("#"+data+" input").val()==''){
            $().alertmessage('showError', "类型名称不能为空");
            return;
        }
        if(!bool){
            $().alertmessage('showError', "类型名称必须填写");
            return;
        }
        if($("#"+data+" select").val()==0){
            $().alertmessage('showError', "请选择技能组");
            return;
        }


        pane.find("ul.sg_container input").not(pane.find("ul.sg_container").find('li').eq(index).find('input')).each(function () {
            var value = $(this).val();
            var peer = value.split(",")[1];
            if (peer == selectOptionValue) {
                $().alertmessage('showError', "技能组重复");
                isDef = false;
                return false;
            }
        });

        if (isDef) {
            pane.find(".skillgroup_container").find("a").eq(index).text(inputValue);

            $('#'+data).modal('hide');
        }
        if($('#webchat_showTypeName').is(':checked')){
            $(".skillgroup_container").find("li").eq(index).find("input").val(inputValue + "," + selectOptionValue+",enable");
            $(".skillgroup_container").find('a').eq(index).addClass("able_color");
            $(".skillgroup_container").find('a').eq(index).removeClass("disable_color");
            $(".skillgroup_container").find('a').eq(index).attr("data-original-title","点击停用");
        }else{
            $(".skillgroup_container").find("li").eq(index).find("input").val(inputValue + "," + selectOptionValue+",disable");
            $(".skillgroup_container").find('a').eq(index).removeClass("able_color");
            $(".skillgroup_container").find('a').eq(index).addClass("disable_color");
            $(".skillgroup_container").find('a').eq(index).attr("data-original-title","点击启用");
        }

    },


    _initWebchatPreviewStyle: function(color, pane){
        var webchat_preview = pane.find(".webchat_preview_container");
        webchat_preview.css("border-color","#" + color);
        //webchat_preview.css("border-right-color","#" + color);
        //webchat_preview.css("border-left-color","#" + color);
        webchat_preview.find(".webchat_preview_header").css("background-color", "#"+color);
        webchat_preview.find(".webchat_preview_msg_toolbar_footer span").css("background-color", "#"+color);
        webchat_preview.find(".webchat_preview_outerright p").css("border-color", "transparent transparent transparent #"+color);
        webchat_preview.find(".webchat_preview_customer").css("background-color", "#"+color);

    },

    getSkillGroups: function(types){
        var skillArr = [];
        for(var i=0; i<types.length; i++){
            var type = types[i];
            var arr = type.split(",");
            var obj = {
                name: arr[0],
                id: arr[1],
                status:arr[2]
            }
            skillArr.push(obj);
        }
        return skillArr;
    },

    updateWebchatCfg: function(data){
        if(!data.typename || data.typename.length<=0){
            $().alertmessage('showError', "请选择技能组");
            return;
        }
        data.ToPeer = handler.config.channel.getSkillGroups(data.typename);
        var havePeer = false;
        for(var i=0; i<data.ToPeer.length; i++){
            var peer = data.ToPeer[i];
            if(peer.status == "enable"){
                havePeer = true;
            }
        }
        if(!havePeer){
            $().alertmessage('showError', "请至少启用一个技能组");
            return;
        }
        delete data.typename;
        var container=$("#view_config_channel");
        var panel = container.find("#config_webchat_container");
        delete data.webchatUrl;
        var action = {
            action: "config.channel.updateWebchatCfg",
            data: data
        };
        data.platform = "web";
        data.serviceStates = 1;
        DS.send(action, function (rep) {
            if (rep.success) {
                $().alertmessage('showSuccess', "修改Webchat接入号成功！");
                panel.empty();
                handler.config.channel.queryWebchatList();
                handler.config.channel.showWebchatConfigInstruction(data);
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        })
    },
    showDelWebchatView: function (data) {
        var con = confirm("确定要删除该在线客服接入号吗？");
        if (!con) {
            return false;
        }
        var action = {
            action: 'config.channel.deleteWebchatCfg',
            data: {_id: data._id}
        };
        DS.send(action, function (response) {
            if (response.success) {
                $().alertmessage('showSuccess', "删除成功");
                handler.config.channel.queryWebchatList();
            } else {
                $().alertmessage('showError', response.message||errMsg);
            }
        });
    },
    delWebchatConfigImg:function(key,src){
        var tr=src.closest("tr");
        var table=src.closest("table");
        var action = {
            action: "app.weixin.delFile",
            data: {key:key}
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                var result=rep.data;
                if(!result){
                    tr.remove();
                    if(table.find("tbody>tr").length==0){
                        table.hide();
                    }
                    var pane = $("#config_webchat_container");
                    pane.find("#webchat_preview_logo").attr("src", "");
                }

            } else {
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },

    changeWebchatPreviewComName: function(data, src){
        $("#webchat_preview_sercompany").html(data);
    },

    _initWebchatQiniuImg:function(wxId,pane){
        var pane=$('#frm_webchat_add');
        //var containerId= wxId+'-container-qiniu';
        var containerId = 'webchat_companyLogo-container-qiniu';
        var progressId= 'webchat_companyLogo-fsUploadProgress';
        var uploader = Qiniu.uploader({
            runtimes: 'flash,html4',
            browse_button: 'webchat_companyLogo-pickfiles',
            multi_selection:false,
            container:containerId,
            drop_element: containerId,
            max_file_size: '10mb',
            flash_swf_url: '/javascripts/qiniu/plupload/Moxie.swf',
            dragdrop: true,
            chunk_size: '4mb',
            uptoken_url: '/action?action=app.webchat.getImUptoken&data={}&sessionId=' + session.id,
            domain: qiniu7moorImDomain,
            // downtoken_url: '/downtoken',
            unique_names: false,
            save_key: false,
            auto_start: true,
            filters: {
                mime_types : [
                    { title : "Image files", extensions : "jpg,jpeg,gif,png,bmp" }
                ]
            },
            init: {
                'FilesAdded': function(up, files) {
                    console.log('FilesAdded');
                    pane.find(".webchat_companyLogo_container").show();
                    plupload.each(files, function(file) {
                        var progress = new FileProgress(file, progressId);
                        progress.setStatus("等待...");
                    });
                },
                'BeforeUpload': function(up, file) {
                    console.log('BeforeUpload');
                    if($('.webchat_companyLogo_container').find('tbody').find('tr').length > 0){
                        $('.webchat_companyLogo_container').find('tbody').find('tr').find('a.ds_do_action').click();
                    }
                    var progress = new FileProgress(file, progressId);
                    var chunk_size = plupload.parseSize(this.getOption('chunk_size'));
                    if (up.runtime === 'html5' && chunk_size) {
                        progress.setChunkProgess(chunk_size);
                    }
                },
                'UploadProgress': function(up, file) {
                    console.log('UploadProgress');
                    var progress = new FileProgress(file, progressId);
                    var chunk_size = plupload.parseSize(this.getOption('chunk_size'));
                    progress.setProgress(file.percent + "%", up.total.bytesPerSec, chunk_size);
                },
                'UploadComplete': function() {
                    if($('#webchat_config_edit_companyLogo').length > 0){
                        $('#webchat_config_edit_companyLogo').remove();
                    }
                    $().alertmessage('showSuccess', "图片上传成功");
                    var logo = pane.find("input[name='companyLogo']");
                    pane.closest(".right_content_pane").find("#webchat_preview_logo").attr("src",logo.val());
                    pane.closest(".right_content_pane").find("#webchat_preview_logoB").attr("src",logo.val());
                    pane.closest(".right_content_pane").find("#webchat_preview_logoA").attr("href",logo.val());

                },
                'FileUploaded': function(up, file, info) {
                    var progress = new FileProgress(file, progressId);
                    progress.setComplete(up, info, 'webchatConfig');
                },
                'Error': function(up, err, errTip) {
//                    $('table').show();
                    pane.find(".webchat_companyLogo_container").show();
                    var progress = new FileProgress(err.file, progressId);
                    progress.setError();
                    progress.setStatus(errTip);
                },
                'Key': function(up, file) {
                    var date=getCurrentDate();
                    var today = new Date();
                    var time=today.getTime();
                    var fileName=file.name;
                    var fileSuffix="";
                    if(fileName){
                        fileSuffix = fileName.substring(fileName.lastIndexOf('.'), fileName.length);
                    }
                    var key = session.user.account+"/webchatConfig/"+date+"/"+time+"/"+uuid.v1()+fileSuffix;
                    console.info("Key2========="+key);
                    return key;
                }
            }
        });
        $('#'+containerId).on(
            'dragenter',
            function(e) {
                e.preventDefault();
                $('#'+containerId).addClass('draging');
                e.stopPropagation();
            }
        ).on('drop', function(e) {
                e.preventDefault();
                $('#'+containerId).removeClass('draging');
                e.stopPropagation();
            }).on('dragleave', function(e) {
                e.preventDefault();
                $('#'+containerId).removeClass('draging');
                e.stopPropagation();
            }).on('dragover', function(e) {
                e.preventDefault();
                $('#'+containerId).addClass('draging');
                e.stopPropagation();
            });
//        uploader.bind('FileUploaded', function() {
//            console.log('hello man,a file is uploaded');
//        });
//        console.info("_initQiniuImg======111111");
//        console.dir(uploader);
    },

    selectEmebedScript: function(data, src){
        src.select();
    },

    checkWebSiteEmebedScript: function(data, src){
        src.attr("disabled", "disabled");
        src.html("检测中...");
        var action = {
            action: "config.channel.checkWebSiteEmebedScript",
            data: data
        };
        DS.send(action, function(req){
            src.html("开始检测");
            src.removeAttr("disabled");
            if(req.success){
                src.next("span").removeClass("check_fail");
                src.next("span").addClass("check_ok");
                src.next("span").html("检测结果：成功！ <img src='../img/client/customer/pass_icon.png'/>");
                $().alertmessage("showSuccess", "植入成功！");

            }else{
                src.next("span").removeClass("check_ok");
                src.next("span").addClass("check_fail");
                src.next("span").html("检测结果：失败！ <img src='../img/client/customer/notpass_icon.png'/>");
                $().alertmessage("showError", req.message || "网站植入脚本失败，请仔细检查遍您是否正确按照配置操作说明进行在线客服的配置，或者联系我司帮助您解决您在配置中所遇到的问题");
            }
        });
    },

    changeWebchatStyle: function(data, src){
        src.addClass("ok").siblings("li").removeClass("ok");
        src.closest("ul").siblings( "#webchat_styleColor").val(data);
        var pane = src.closest(".right_content_pane");
        handler.config.channel._initWebchatPreviewStyle(data, pane);
    },

    showWebchatConfigInstruction: function(data, src){
        var container=$("#view_config_channel");
        var panel = container.find("#config_webchat_container");
        var accessId = "";
        var webchatUrl = "";
        if( "string" == typeof data){
            accessId = data.split("$$$")[0];
            webchatUrl = data.split("$$$")[1] || "http://webchat.7moor.com";
        }else{
            accessId = data.accessId;
            webchatUrl = data.webchatUrl  || "http://webchat.7moor.com";
        }
        $(src).closest("tr").addClass("active").siblings().removeClass("active");
        var html = template("tmpl_webchat_config_instruction", {accessId:accessId, webchatUrl: webchatUrl});
        panel.html(html);
        $(src).closest("tr").addClass("active").siblings().removeClass("active");
        $("#embed_script").text("<script type='text/javascript' src='" + webchatUrl + "/javascripts/7moorInit.js?accessId="+accessId+"&autoShow=true' async='async'></script>");
        var clip = new ZeroClipboard([document.getElementById("copybtn_embed_script"), document.getElementById("copybtn_customer_service_btn")]);
        clip.on("aftercopy", function(e){
            $().alertmessage("showSuccess", "复制内容成功");
        });

    },

    queryMobilesdkList: function(data, src){
        var container=$("#view_config_channel");
        data=data||{};
        if(src){
            data.page = src.attr("value") || 1;
        }else{
            data.page = 1;
        }
        data.limit=handler.config.channel.pageSize;
        data.platform = "sdk";
        var formID = "mobilesdk_query_frm";
        var action = {
            action: 'config.channel.queryWebchat',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var webchats = response.list;
                handler.config.channel.androidDownloadUrl = response.version.androidDownloadUrl;
                handler.config.channel.androidSdkDocUrl = response.version.androidSdkDocUrl;
                handler.config.channel.iosDownloadUrl = response.version.iosDownloadUrl;
                handler.config.channel.iosSdkDocUrl = response.version.iosSdkDocUrl;
                handler.config.channel.androidVersion = response.version.androidVersion;
                handler.config.channel.iosVersion = response.version.iosVersion;
                if(webchats.length>0) {
                    container.find('#Mobilesdk_list_pane').empty();
                    for (var i = 0; i < webchats.length; i++) {
                        var webchat = webchats[i];
                        var webchatMobileSdk=template("config_mobileSdk_item_template",webchat);
                        container.find('#Mobilesdk_list_pane').append(webchatMobileSdk);
                    }
                    DS.updatePagination(formID, response.count, handler.config.channel.pageSize, data.page);
                }else{
                    var html='<tr style="text-align: center;"><td colspan="2" style="height:58px;line-height:58px;text-align:center">目前没有移动在线客服配置信息!</td></tr>';
                    container.find('#Mobilesdk_list_pane').html(html);
                }
            }else{
                $().alertmessage('showError',response.message|| errMsg);
            }
        });
    },

    showMobilesdkAdd: function (data) {
        var mailQueues = getCache('mailQueues');
        if(mailQueues.length<=0){
            $().alertmessage('showError', "您还没设置技能组，请先到【渠道技能组】添加技能组!");
            return;
        }
        var container=$("#view_config_channel");
        DS.getView('config/channel/config_mobileSdk_add', function (view) {
            var pane = container.find("#config_Mobilesdk_container");
            pane.empty();
            pane.html(view);

            var robotConfig = getCache('robotConfig');
            if(!robotConfig || robotConfig.length == 0){
                $("#webchat_modal_hidden a:first").click();
                robotConfig = [];
            }
            var robotOptionsHtml = '<option selected="selected" value="">--请选择--</option>';
            for(var i=0 ;i<robotConfig.length; i++){
               robotOptionsHtml += '<option value="'+robotConfig[i]._id+'">'+robotConfig[i].robot_type+'</option>';
            }
            $("#mobilesdk_robot").html(robotOptionsHtml);

            var optionsHtml = '<option selected="selected" value="0">--请选择--</option>';
            for(var i=0 ;i<mailQueues.length; i++){
                optionsHtml += '<option value="'+mailQueues[i].Exten+'">'+mailQueues[i].DisplayName+'</option>';
            }
            pane.find('#webchat_topeer').html(optionsHtml);
            $('#mobilesdk_accessId').val(uuid.v1());
            handler.config.channel._initWebchatQiniuImg();
        });
    },

    saveMobileSdkCfg: function (data) {
        //if(data.ToPeer<=0){
        //    $().alertmessage('showError', "请选择技能组");
        //    return;
        //}
        if(!data.typename || data.typename.length<=0){
            $().alertmessage('showError', "请选择技能组");
            return;
        }
        data.ToPeer = handler.config.channel.getSkillGroups(data.typename);
        var havePeer = false;
        for(var i=0; i<data.ToPeer.length; i++){
            var peer = data.ToPeer[i];
            if(peer.status == "enable"){
                havePeer = true;
            }
        }
        if(!havePeer){
            $().alertmessage('showError', "请至少启用一个技能组");
            return;
        }
        delete data.typename;

        var container=$("#view_config_channel");
        var pane =container.find('#config_Mobilesdk_container');
        data.platform = "sdk";
        data.serviceStates = 1;
        var action = {
            action: "config.channel.addWebchatCfg",
            data: data
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                $().alertmessage('showSuccess', "增加手机客服接入号成功");
                pane.empty();
                handler.config.channel.queryMobilesdkList();
                handler.config.channel.showMobileSdkConfigInstruction(data);
                handler.config.channelDic.addNewWebchatDic();
            } else {
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },

    showUpdateMobileSdkView: function(data,src){
        var container=$("#view_config_channel");
        var panel = container.find("#config_Mobilesdk_container");
        var action = {
            action: 'config.channel.queryWebchatCfgById',
            data: {_id: data._id}
        };
        DS.send(action, function (response) {
            if (response.success) {
                var webchat = response.data;
                var html = [];
                $(src).closest("tr").addClass("active").siblings().removeClass("active");
                DS.getView('config/channel/config_mobileSdk_edit', function (view) {

                    html.push(DS.renderMethodViewNew(view,webchat));
                    panel.empty();
                    panel.html(html.join(""));
                    var robotConfig = getCache('robotConfig');
                    if(!robotConfig || robotConfig.length == 0){
                        robotConfig = [];
                    }
                    var robotOptionsHtml = '<option selected="selected" value="">--请选择--</option>';
                    for(var i=0 ;i<robotConfig.length; i++){
                        if(robotConfig[i]._id == webchat.robot){
                            robotOptionsHtml += '<option selected="selected" value="'+robotConfig[i]._id+'">'+robotConfig[i].robot_type+'</option>';
                        }else{
                            robotOptionsHtml += '<option value="'+robotConfig[i]._id+'">'+robotConfig[i].robot_type+'</option>';
                        }
                    }
                    $("#mobilesdk_robot").html(robotOptionsHtml);
                    var toPeer = webchat.ToPeer;
                    handler.config.channel.setSkillsGroup(toPeer, panel, "sdkSkillModal");

                    var mailQueues = getCache('mailQueues');
                    var optionsHtml = '<option selected="selected" value="0">--请选择--</option>';
                    for(var i=0 ;i<mailQueues.length; i++){
                        if(mailQueues[i].Exten == webchat.ToPeer){
                            optionsHtml += '<option selected="selected" value="'+mailQueues[i].Exten+'">'+mailQueues[i].DisplayName+'</option>';
                        }else{
                            optionsHtml += '<option value="'+mailQueues[i].Exten+'">'+mailQueues[i].DisplayName+'</option>';
                        }
                    }
                    panel.find('#webchat_topeer').html(optionsHtml);

                    $('#mobilesdk_serviceStates').val(webchat.serviceStates);
                    $('#sdkchat_csr').attr("checked",webchat.webchat_csr);
                    var pane = container.find(".right_content_pane")
                    handler.config.channel._initWebchatPreviewStyle(webchat.styleColor, pane);
                    handler.config.channel._initWebchatQiniuImg();

                });
            }else{
                $().alertmessage('showError', response.message||errMsg);
            }
        });
    },

    updateMobileSdkCfg: function(data){
        //if(data.ToPeer<=0){
        //    $().alertmessage('showError', "请选择技能组");
        //    return;
        //}

        if(!data.typename || data.typename.length<=0){
            $().alertmessage('showError', "请选择技能组");
            return;
        }
        data.ToPeer = handler.config.channel.getSkillGroups(data.typename);
        var havePeer = false;
        for(var i=0; i<data.ToPeer.length; i++){
            var peer = data.ToPeer[i];
            if(peer.status == "enable"){
                havePeer = true;
            }
        }
        if(!havePeer){
            $().alertmessage('showError', "请至少启用一个技能组");
            return;
        }
        delete data.typename;

        var container=$("#view_config_channel");
        var panel = container.find("#config_Mobilesdk_container");
        data.platform = "sdk";
        data.serviceStates = 1;
        var action = {
            action: "config.channel.updateWebchatCfg",
            data: data
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                $().alertmessage('showSuccess', "修改手机客服接入号成功！");
                panel.empty();
                handler.config.channel.queryMobilesdkList();
                handler.config.channel.showMobileSdkConfigInstruction(data);
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        })
    },
    showDelMobileSdkView: function (data) {
        var con = confirm("确定要删除该Webchat接入号吗？");
        if (!con) {
            return false;
        }
        var action = {
            action: 'config.channel.deleteWebchatCfg',
            data: {_id: data._id}
        };
        DS.send(action, function (response) {
            if (response.success) {
                $().alertmessage('showSuccess', "删除成功");
                handler.config.channel.queryMobilesdkList();
            } else {
                $().alertmessage('showError', response.message||errMsg);
            }
        });
    },
    showMobileSdkConfigInstruction: function(data, src){
        var container=$("#view_config_channel");
        var panel = container.find("#config_Mobilesdk_container");
        var accessId = "";
        var androidDownloadUrl = handler.config.channel.androidDownloadUrl || "http://7xqpis.com1.z0.glb.clouddn.com/M7KF-1.0.1%28Android%29.rar";
        var androidSdkDocUrl = handler.config.channel.androidSdkDocUrl|| "http://7xqpis.com1.z0.glb.clouddn.com/%E5%AE%B9%E8%81%94%E4%B8%83%E9%99%8C%E5%AE%A2%E6%9C%8DIMSDK%E9%9B%86%E6%88%90%E6%96%87%E6%A1%A3%28Android%29.pdf";
        var iosDownloadUrl = handler.config.channel.iosDownloadUrl|| "http://7xqpis.com1.z0.glb.clouddn.com/%E5%AE%B9%E8%81%94%E4%B8%83%E9%99%8C%E5%AE%A2%E6%9C%8DIMSDK%28iOS%29.zip";
        var iosSdkDocUrl = handler.config.channel.iosSdkDocUrl || "http://7xqpis.com1.z0.glb.clouddn.com/%E5%AE%B9%E8%81%94%E4%B8%83%E9%99%8C%E5%AE%A2%E6%9C%8DIMSDK%E9%9B%86%E6%88%90%E6%96%87%E6%A1%A3%28iOS%29.zip";
        var androidVersion = handler.config.channel.androidVersion || "v1.0";
        var iosVersion = handler.config.channel.iosVersion || "v1.0";
        $(src).closest("tr").addClass("active").siblings().removeClass("active");
        if( "string" == typeof data){
            accessId = data;
        }else{
            accessId = data.accessId;

        }
        var html = template("tmpl_mobilesdk_config_instruction",
            {androidVersion: androidVersion, iosVersion: iosVersion,accessId:accessId,
                androidDownloadUrl:androidDownloadUrl, androidSdkDocUrl:androidSdkDocUrl,iosDownloadUrl:iosDownloadUrl,iosSdkDocUrl:iosSdkDocUrl});
        panel.html(html);
        $(src).closest("tr").addClass("active").siblings().removeClass("active");
        $("#embed_mobilesdk_android").text(accessId);
        $("#embed_mobilesdk_ios").text(accessId);
        var clip = new ZeroClipboard([document.getElementById("copybtn_embed_mobilesdk_android"),document.getElementById("copybtn_embed_mobilesdk_ios")]);
        clip.on("aftercopy", function(e){
            $().alertmessage("showSuccess", "复制内容成功");
        });
    },

    changeAppChatConfigTab: function(data, src){
        var panelId = src.closest("#config_Mobilesdk_container");
        panelId.find(".webchat_config_instruction").hide();
        panelId.find(".webchat_config_instruction."+data).show();
    },

    queryRobot: function(data, src){
        var pane=$("#view_company_identity");
        var container=pane.find(".zhichi_rebot_deal");
        var action = {
            action: 'config.channel.queryRobotById',
            data: {account: session.user.account}
        };
        DS.send(action, function (response) {
            if (response.success) {
                var robot = response.data;
                var tmpl=' <a href="#" class="text_action_blue ds_do_action" ds_action="config.channel.saveRobot" ds_data="智齿">开通</a>';
                if(robot && robot._id){
                    tmpl='<a href="#" class="text_action_blue ds_do_action" ds_action="config.channel.showRobotLoginUrl"  ds_data="'+robot._id+'"><span>配置</span></a>';
                }
                container.html(tmpl);
            }else{
                $().alertmessage('showError', response.message||errMsg);
            }
        });
    },
    showEnableRobot: function() {
        var modal = $("#modal_enable_robot");
        var body=modal.find(".modal-body");
        var accInfo=handler.getMyAccInfo();
        //console.dir(accInfo);
        DS.getView("config/account/account_robot_enable", function (view) {
            var render=template.compile(view);
            body.html(render(accInfo));
            modal.modal();
        });
    },
    showRobotAdd: function(){
        var container=$("#view_config_channel");
        DS.getView('config/channel/config_robot_add', function (view) {
            var pane = container.find("#config_robot_container");
            pane.empty();
            pane.html(view);
        });
    },

    saveRobot: function(data, src){
        //var pane=$("#modal_enable_robot");
        //var mailId = data.robot_email;
        //var phone = data.robot_phone;
        //if (!mailId || !handler.config.channel.emailReg.test(mailId)) {
        //    $().alertmessage('showError', "请正确填写邮箱账户名！");
        //    return;
        //}
        //if(phone && !handler.config.channel.phoneReg.test(phone)){
        //    $().alertmessage('showError', "请正确填写联系电话！");
        //    return;
        //}
        var action = {
            action: "config.channel.addRobotCfg",
            data: {robot_type: data}
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                $().alertmessage('showSuccess', "开通智齿机器人客服成功");
                //pane.modal("hide");
                handler.config.channel.queryRobot();
                if('robotConfig' in session.dicMap){
                    delete session.dicMap.robotConfig;
                }
            } else {
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },

    //updateRobot: function(data, src){
    //    var container=$("#view_config_channel");
    //    var panel = container.find("#config_robot_container");
    //    var action = {
    //        action: "config.channel.updateRobotCfg",
    //        data: data
    //    };
    //    DS.send(action, function (rep) {
    //        if (rep.success) {
    //            $().alertmessage('showSuccess', "修改智能机器人成功！");
    //            panel.empty();
    //            handler.config.channel.queryRobotList();
    //        }else{
    //            $().alertmessage('showError', rep.message||errMsg);
    //        }
    //    })
    //},

    showUpdateRobotView: function(id,src){
        var pane=$("#modal_enable_robot_view");
        var action = {
            action: 'config.channel.queryRobotById',
            data: {_id: id}
        };
        DS.send(action, function (response) {
            if (response.success) {
                var robot = response.data;
                DS.getView("config/account/account_robot_info", function (view) {
                    var render=template.compile(view);
                    var body=pane.find(".modal-body");
                    body.html(render(robot));
                    pane.modal();
                })
            }else{
                $().alertmessage('showError', response.message||errMsg);
            }
        });
    },

    showRobotLoginUrl: function(data, src){
        var action = {
            action: 'config.channel.robotLogin',
            data: {_id: data}
        };

        DS.send(action, function (response) {
            if (response.success) {
                var robotLoginUrl = response.data;
                src.attr("target", "_blank");
                src.attr("href", robotLoginUrl);
                src.removeAttr("class");
                var span = src.find("span");
                span.click();
                src.attr("href", "#");
                src.attr("class", "text_action_blue ds_do_action");
            }else{
                $().alertmessage("showError","登录链接获取失败");
            }
        },null,false);
    },

    showRobotPaneView:function(){
        $(".chat_robot_config").click();
    },


    openWeiXinAuthOperation: function(){
        //$.ajax({
        //    type: "GET",
        //    url: 'http://wechat.7moor.com/action?action=getPreAuthCode&account='+ session.user.account,
        //    timeout: 10000,
        //    cache: false,
        //    async: false,
        //    dataType: "jsonp",
        //    jsonp: "callback",
        //    success: function (data, status) {
        //        //console.log(data);
        //        //window.open(data);
        //        $("#wechat_modal_hidden a").click();
        //    },
        //    error: function (xhr, status, error) {
        //        $().alertmessage("showError","授权链接获取失败");
        //    }
        //});
        var pane=$('#panel_wechat_config');
        pane.find('.weixin_auth').hide();
        pane.find('.weixin_info').hide();
        var new_src=handler.config.channel.wechatUrl + "/?account=" + session.user.account+"&appId="+ (session.account.wechatAppId || "");
        pane.find('#weixin_public').attr({src:new_src});
        pane.find('#weixin_public').show();
    },
    weixinAuthorization:function(){
        var pane=$('#panel_wechat_config');
        var con=$('#workbench_lists li.active');
        //for(var i=0;i<con.length;i++){
        con.removeClass("active");
        //}
        pane.find('.weixin_auth').show();
        pane.find('.weixin_info').hide();
        pane.find('#weixin_public').hide();
    },
    weixinTitleAuth:function(e){
        var ev = e || window.event;
        var obj = ev.target || ev.srcElement;
        $(obj).closest("span").addClass("act_two").siblings().removeClass("act_two");
        $(obj).closest("li.relative").addClass("active");
        handler.config.channel.showWeixinInfoContent();
    },
    showWeixinInfoContent: function(p){
        if($("#config_email_queue_container").length>0){
            $("#config_email_queue_container").html("");
        }
        var pane=$('#panel_wechat_config');
        pane.find('.weixin_auth').show();
        pane.find('.weixin_info').hide();
        pane.find('#weixin_public').hide();
        var action = {
            action : "config.channel.queryWechat",
            data:{}
        };
        DS.send(action, function(response){
            handler.config.channel.wechatUrl = response.wechatUrl;
            if(response.success) {
                if(response.list[0]){
                    handler.config.channel.robot = response.list[0].robot ? true : false;
                }
                handler.config.channel.wechatUrl = response.wechatUrl;
                var wechatList = response.list;
                var lis = "";
                if (wechatList) {
                    for (var i=0;i<wechatList.length;i++ ){
                        var wechat=wechatList[i];
                        lis += '<li class="text-overflow workbench_li" ><a href="javascript:;"  class="ds_do_action" ds_action="config.channel.showWeixinInfo" value='+i+' ds_data="' + wechat._id + '">' + wechatList[i].nick_name + '</a></li>';
                    }
                    $('#workbench_lists').empty().html(lis);
                    if(!p){ //p未定义 为删除的情况或加载进来的情况两种
                        $("#workbench_lists li:last-child a").click();
                    }else{  //p定义了 为授权成功
                        $("#workbench_lists li:first-child a").click();
                    }
                }
            }
        });
    },
    refreshWeixinInfo: function(){
        var p=true;
        handler.config.channel.showWeixinInfoContent(p);
    },
    showWeixinInfo: function(data,src){
        $(src).closest("li").addClass("active").siblings().removeClass("active");
        var mailQueues = getCache("mailQueues");
        var pane = $("#panel_wechat_config");
        var weixinpublic =  pane.find('#weixin_public');
        weixinpublic.hide();
        if(!mailQueues || mailQueues.length == 0){
            $().alertmessage("showError", "您还没设置技能组，请先到【渠道技能组】添加技能组!");
            $("#view_config_channel").find(".sub-nav").find("li:first").find("a").click();
            return;
        }
        var authPane = pane.find(".weixin_auth");
        var weixinInfo = pane.find(".weixin_info");
        var action = {
            action : "config.channel.queryWechat",
            data:{}
        };
        DS.send(action, function(response){
            if(response.success){
                var wechatList = response.list;
                if (wechatList) {
                    authPane.hide();
                    weixinInfo.show();
                    weixinpublic.hide();
                    DS.getView('config/channel/config_wechat_edit', function(view){
                        var wechat='';
                        var PushTime=[];
                        for(var i=0;i<wechatList.length;i++){
                            if(wechatList[i].welcomePushTime){
                                PushTime.push(wechatList[i].welcomePushTime);
                            }

                            if(data==wechatList[i]._id){
                                wechat=wechatList[i];
                                continue;
                            }
                        }
                        if(!wechat){
                            var wx_name=$(src)[0].innerHTML;
                            $().alertmessage("showError", "微信公众号"+wx_name+"已失效");
                            handler.config.channel.weixinTitleAuth();
                            return;
                        }
                        handler.config.channel.wechatUrl = response.wechatUrl;
                        var realView = DS.renderMethodViewNew(view, wechat);
                        weixinInfo.html(realView);
                        var indexNum=src.attr("value");
                        src.closest("#workbench_box").siblings(".weixin_info").find("input[value="+PushTime[indexNum]+"]").attr("checked","checked");
                        var robotConfig = getCache('robotConfig');
                        if(!robotConfig || robotConfig.length == 0){
                            robotConfig = [];
                            $("#wechat_robot").attr("disabled", "disabled");
                        }
                        var robotOptionsHtml = '<option value="">--请选择--</option>';
                        for (var j = 0; j < robotConfig.length; j++) {
                            if (robotConfig[j]._id == wechat.robot) {
                                robotOptionsHtml += '<option selected="selected" value="' + robotConfig[j]._id + '">' + robotConfig[j].robot_type + '</option>';
                            } else {
                                robotOptionsHtml += '<option value="' + robotConfig[j]._id + '">' + robotConfig[j].robot_type + '</option>';
                            }
                        }
                        $("#wechat_robot").html(robotOptionsHtml);
                        var optionsHtml = '<option selected="selected" value="0">--请选择--</option>';
                        var selected = false;
                        for (var m = 0; m < mailQueues.length; m++) {
                            if (mailQueues[m].Exten == wechat.to_peer) {
                                optionsHtml += '<option selected="selected" value="' + mailQueues[m].Exten + '" account="'+mailQueues[m].Account+'">' + mailQueues[m].DisplayName + '</option>';
                                selected = true;
                            }else{
                                optionsHtml += '<option value="' + mailQueues[m].Exten + '" account="'+mailQueues[m].Account+'">' + mailQueues[m].DisplayName + '</option>';
                            }
                        }
                        $('#wechat_topeer').html(optionsHtml);
                        if(wechat.robot){
                            $('#wechat_robot').attr('ds_data','robot');
                        }else{
                            $('#wechat_robot').attr('ds_data','');
                        }
                        if(!selected){
                            $('#wechat_topeer').css("border", "2px #fa5f5f solid");
                            $(".peer-tips").html("请务必选择技能组后保存");
                        }else{
                            $(".peer-tips").html("");
                        }
                        $('#wechat_welcome').val(wechat.welcome_msg).attr("title",wechat.welcome_msg);
                        $('#convert_words').val(wechat.convert_words).attr("title",wechat.convert_words);
                        $('#wechat_finishMsg').val(wechat.finish_msg).attr("title",wechat.finish_msg);
                        handler.config.channel.evaluateUrl = "https://open.weixin.qq.com/connect/oauth2/authorize?appid=" + wechat.authorizer_appid + "&redirect_uri=" + handler.config.channel.wechatUrl + "/oAuthWx&response_type=code&scope=snsapi_base&state=evaluate_in&component_appid=" + wechat.appId + "#wechat_redirect";
                        wechat.webchat_csr ? $('#webchat_csr').attr("checked",true) : $('#webchat_csr').attr("checked",false);
                        $('#wechat_finishMsg').val(wechat.finish_msg).attr("title",wechat.finish_msg);
                        var action1 = {
                            action : "config.channel.checkWeixinMenu",
                            data: {_id:wechat._id}
                        }
                        DS.send(action1, function(response){
                            if(response.success){
                                //$(".config-byself").hide();
                                handler.config.channel.getMenu({_id:wechat._id});
                            }else{
                                $(".config-byself").show();
                            }
                        });
                    });
                }else{
                    handler.config.channel.wechatUrl = response.wechatUrl;
                    console.log(response.wechatUrl);
                    if (!response.msg) {
                        $().alertmessage("showError", response.message);
                    }
                    authPane.show();
                    weixinInfo.hide();
                    weixinpublic.hide();
                }
            }else{
                $().alertmessage("showError", "获取信息失败");
            }
        });
    },

    updateWechat: function(data){
        if(data.to_peer<=0){
            $().alertmessage("showError", "请选择技能组");
            return;
        }
        data.robot = data.robot ? data.robot : false;
        $("#wechat_welcome").attr("title", $.trim(data.welcome_msg) || "");
        $("#convert_words").attr("title", $.trim(data.convert_words) || "");
        $("#wechat_finishMsg").attr("title", $.trim(data.finish_msg) || "");
        var action = {
            action : "config.channel.updateWechat",
            data: data
        }
        DS.send(action, function(response){
            if(response.success){
                if( data.robot){
                    $('#wechat_robot').attr('ds_data','robot');
                }else{
                    $('#wechat_robot').attr('ds_data','');
                }
                $().alertmessage("showSuccess", "保存数据成功");
                handler.config.channel.robot = data.robot ? true : false;
                handler.config.channelDic.addNewWebchatDic();
            }else{
                $().alertmessage("showError", "保存数据失败");
            }
        });
        var bind=$("#weixin_custom").find(".cfg-bind-custom[tamp='tamp']");
        if(bind.length>0){
            bind.click();
        }
    },

    deleteWechat: function(data){
        var action = {
            action : "config.channel.deleteWechat",
            data: {_id:data}
        };
        DS.send(action, function(response){
            if(response.success){
                $().alertmessage("showSuccess", "删除数据成功");
                var pane = $("#panel_wechat_config");
                var authPane = pane.find(".weixin_auth");
                var weixinInfo = pane.find(".weixin_info");
                authPane.show();
                weixinInfo.hide();
                handler.config.channel.showWeixinInfoContent();
            }else{
                $().alertmessage("showError", "删除数据失败");
            }
        });
    },

    showDeleteWechatConfirmDialog:function(data){
        data.confirmDesc = "确定要删除该已授权公众号吗？";
        data.confirmAction = "config.channel.deleteWechat";
        var html = template("tmpl_channel_config_confirm_dialogbox", data);
        var pane = $("#channal_config_confirm_pane");
        pane.html("");
        pane.html(html);
        pane.find("#a_config_confirm_dialogbox").click();
    },

    //微信菜单
    getMenu:function(data){
        var container = $(".weixin-form");
        var src = $(".config-byself");
        handler.config.channel.appid = data._id;
        var action = {
            action: 'config.channel.getWeixinMenu',
            data: {_id: data._id}
        };
        src.hide();
        DS.send(action, function (response) {
            if (response.success) {
                var buttonArr = response.menus;
                var html=[];
                DS.getView('config/channel/config_weixin_menu_main', function (view) {
                    var mainHtml =[];
                    var tempHtml =[];
                    var subHtml =[];
                    var weixinName = $("#wechat_nickName").text();
                    var menu_sets ={
                        menu_id: "subMenu_",
                        menu_level: "主菜单",
                        menu_name: "菜单名称",
                        menu_namelimet: "字数不超过4个汉字或8个字母",
                        menu_type: "",
                        menu_key: "",
                        menu_key2: "",
                        menu_url: "http://",
                        evaluate_url: handler.config.channel.evaluateUrl,
                        menu_class: "main-menu",
                        weixin_id: data._id
                    };
                    container.empty();
                    container.html(DS.renderMethodViewNew(view,menu_sets));
                    $(".weixin-config-showtop").html(weixinName);
                    $.each(buttonArr.button,function(i,val){
                        subHtml =[];
                        if (val.sub_button) {
                            sub_button = val.sub_button;
                            $.each(sub_button,function(j,sub){
                                var media_id=sub.media_id||'';
                                subHtml += '<span class="weixin-sub-menu active ds_do_action" ds_action="config.channel.showWeixinMenuSub" id="subMenu_'+(i+1)+'_'+(j+2)+'" media_id="'+media_id+'" title="'+sub.name+'" >' + sub.name + '</span>';
                                var menu_id = 'subMenu_'+(i+1)+'_'+(j+2);
                                var menu_sets ={
                                    menu_id: menu_id,
                                    menu_name: sub.name,
                                    menu_level: "子菜单",
                                    menu_namelimet: "字数不超过8个汉字或16个字母",
                                    menu_type: sub.type,
                                    menu_key: "",
                                    menu_key2: "",
                                    menu_robot: sub.robot,
                                    menu_url: "",
                                    evaluate_url: "",
                                    menu_class: "sub-menu"
                                };
                                if(sub.robot){
                                    menu_sets.menu_key2=sub.key;
                                }else{
                                    menu_sets.menu_key=sub.key;
                                }
                                var url=sub.url||"";
                                if(url.indexOf("state=evaluate_in")>0){
                                    menu_sets.evaluate_url=sub.url;
                                }else{
                                    menu_sets.menu_url=sub.url;
                                }
                                DS.getView('config/channel/config_weixin_menu_set', function (view) {
                                    $("#weixin-all-menu").find(".form-btn-center").before(DS.renderMethodViewNew(view,menu_sets));
                                    if (menu_sets.menu_type == "click" || menu_sets.menu_type == "media_id") {
                                        if (menu_sets.menu_robot) {
                                            $("#" + menu_sets.menu_id + "_set .menu_type label").eq(2).find("input").click();
                                        } else {
                                            $("#" + menu_sets.menu_id + "_set .menu_type label").eq(0).find("input").click();
                                            if (menu_sets.menu_type == "click") {
                                                $("#" + menu_sets.menu_id + "_set").find(".txt")[0].click();
                                            }
                                        }
                                    } else if (menu_sets.menu_type == "view") {
                                        if (url.indexOf("state=evaluate_in") > 0) {
                                            $("#" + menu_sets.menu_id + "_set .menu_type label").eq(3).find("input").attr("research","research")
                                            $("#" + menu_sets.menu_id + "_set .menu_type label").eq(3).find("input").click();
                                            $("#" + menu_sets.menu_id + "_set .menu_type label").eq(3).find("input").removeAttr("research");

                                        } else {
                                            $("#" + menu_sets.menu_id + "_set .menu_type label").eq(1).find("input").click();
                                        }
                                    };
                                });
                            });
                        }
                        var media_id=val.media_id||'';
                        var menu_id = 'subMenu_'+(i+1)+'_1';
                        var menu_sets ={
                            menu_id: menu_id,
                            menu_name: val.name,
                            menu_level: "主菜单",
                            menu_namelimet: "字数不超过4个汉字或8个字母",
                            menu_type: val.type,
                            menu_key: "",
                            menu_key2: "",
                            menu_url: "",
                            evaluate_url: "",
                            menu_robot: val.robot,
                            menu_class: "main-menu"
                        };
                        if(val.robot){
                            menu_sets.menu_key2=val.key;
                        }else{
                            menu_sets.menu_key=val.key;
                        }
                        var url=val.url||"";
                        if(url.indexOf("state=evaluate_in")>0){
                            menu_sets.evaluate_url=val.url;
                        }else{
                            menu_sets.menu_url=val.url;
                        }
                        tempHtml +='<li><p>' + subHtml + '<span class="add-sub-menu ds_do_action" ds_action="config.channel.addWeixinMenuSub"></span><b></b></p><span class="weixin-main-menu weixin-primary ds_do_action" ds_action="config.channel.showWeixinMenuMain" media_id="'+media_id+'" id="subMenu_'+(i+1)+'_1">' + val.name + '</span></li>';
                        DS.getView('config/channel/config_weixin_menu_set', function (view) {
                            $("#weixin-all-menu").find(".form-btn-center").before(DS.renderMethodViewNew(view,menu_sets));
                            if (menu_sets.menu_type == "click" || menu_sets.menu_type == "media_id") {
                                $("#" + menu_sets.menu_id + "_set .menu_type label").eq(0).find("input").click();
                                if (menu_sets.menu_robot) {
                                    $("#" + menu_sets.menu_id + "_set .menu_type label").eq(2).find("input").click();
                                } else {
                                    $("#" + menu_sets.menu_id + "_set .menu_type label").eq(0).find("input").click();
                                    if (menu_sets.menu_type == "click") {
                                        $("#" + menu_sets.menu_id + "_set").find(".txt")[0].click();
                                    }
                                }
                            }else if(menu_sets.menu_type == "view"){
                                if(url.indexOf("state=evaluate_in")>0){
                                    $("#"+menu_sets.menu_id+"_set .menu_type label").eq(3).find("input").attr("research","research")
                                    $("#"+menu_sets.menu_id+"_set .menu_type label").eq(3).find("input").click();
                                    $("#"+menu_sets.menu_id+"_set .menu_type label").eq(3).find("input").removeAttr("research");
                                }else{
                                    $("#"+menu_sets.menu_id+"_set .menu_type label").eq(1).find("input").click();
                                }
                            };
                            if (val.sub_button) {
                                $("#subMenu_"+(i+1)+"_1_set").find(".row_item").eq(2).hide().siblings(".webchat-menudetails").hide().find("textarea").removeAttr("required").end().siblings("span").hide();
                                if ($(".weixin-config-showbottom").find("li").length>1) {
                                    $(".weixin-config-showbottom").find("li").eq(0).find(".weixin-main-menu").click();
                                }
                            }
                            if (buttonArr.button.length<3) {
                                container.find(".weixin-config-showbottom").html(tempHtml+'<li class="null"><span style="background:none" class="weixin-main-menu ds_do_action" ds_action="config.channel.addWeixinMenuMain"></span></li>');
                            }else{
                                container.find(".weixin-config-showbottom").html(tempHtml);
                            }
                            if ($(".weixin-config-showbottom").find("li").length>1) {
                                $(".weixin-config-showbottom").find("li").eq(0).find(".weixin-main-menu").click();
                            }
                        });
                    });
                });

            }else{
                $().alertmessage('showError', response.message||errMsg);
                if ($(".weixin-config-show").length==0) {
                    src.show();
                }
            }

        });
    },
    createMenu: function (data,src) {

        var appid = data.weixin_id;
        var events = new Array();
        var menus = {};
        var buttonArray = new Array();
        var buttons = $('.weixin-primary');
        var error=true;
        var error_num=1;
        var errot_txt= '错误消息: \r';
        var flag=true;
        $.each(buttons, function (i, val) {//遍历一级菜单
            var menu_id = $(val).attr('id')||"";
            if(menu_id==""){
                return false;
            }
            var new_val = $("#"+menu_id+"_set");
            var buttonName = $(new_val).find('[name="menu_name"]').val();
            var butId = $(new_val).attr('id').substr(0, 9);
            var sub_button = $(val).closest('li').find('.weixin-sub-menu');
            if (sub_button.length > 0) {
                var subbuttonArray = new Array();
                $.each(sub_button, function (j, doc) {//遍历二级菜单
                    var sub_menu_id = $(doc).attr('id')||"";
                    if(sub_menu_id==""){
                        return false;
                    }
                    var new_doc = $("#"+sub_menu_id+"_set");
                    var subbuttonName = $(new_doc).find('[name="menu_name"]').val();
                    var subbuttonType = $(new_doc).find('.weixin_radio:checked').val();
                    var menuId = $(new_doc).attr('id').substr(0, $(new_doc).attr('id').lastIndexOf("_"));
                    if (subbuttonType == '0') {
                        var media_con = $(new_doc).find('.txtpic.selected');
                        var media_id = $(new_doc).find('.menu_media_id').val() || $("#"+menuId).attr("media_id");
                        if (media_con.length && media_id) {
                            subbuttonArray[j] = {
                                "type": "media_id",
                                "name": subbuttonName,
                                "media_id": media_id
                            }
                        } else {
                            var uid = uuid.v1();
                            subbuttonArray[j] = {
                                "type": 'click',
                                "name": subbuttonName,
                                "key": uid
                            };
                            var subbuttonContent = $(new_doc).find('[name="content"]').val();
                            var _newContent = $.trim(subbuttonContent);
                            if(!_newContent&&error){
                                $(new_doc).find('[name="content"]').val("");
                                errot_txt +=error_num+".["+subbuttonName+"]菜单的内容必须填写\r";
                                error_num += 1;
                                error = false;
                            }else if(subbuttonContent.length>600&&error){
                                errot_txt +=error_num+".["+subbuttonName+"]菜单的文字消息长度不能超过600\r";
                                error_num += 1;
                                error = false;
                            }
                            var clickData = {
                                appid: appid,
                                eventKey: uid,
                                content: subbuttonContent,
                                contentType: 'text'
                            };
                            events.push(clickData);
                        }
                    } else if(subbuttonType == '1'){
                        var url = $(new_doc).find('[name="wechat_menuUrl"]').val();
                        subbuttonArray[j] = {
                            "type": 'view',
                            "name": subbuttonName,
                            "url": url
                        }
                    }else if(subbuttonType == '2'){
                        var subbuttonContent = $(new_doc).find('[name="contentRobot"]').val();
                        var uid = "robot";
                        var _newContent = $.trim(subbuttonContent);
                        if(!_newContent&&error){
                            $(new_doc).find('[name="contentRobot"]').val("");
                            errot_txt +=error_num+".["+subbuttonName+"]转人工的内容必须填写\r";
                            error_num += 1;
                            error = false;
                        }else if(subbuttonContent.length>600&&error){
                            errot_txt +=error_num+".["+subbuttonName+"]转人工的文字消息长度不能超过600\r";
                            error_num += 1;
                            error = false;
                    }
                        subbuttonArray[j] = {
                            "type": 'click',
                            "name": subbuttonName,
                            "key": uid
                        }
                        var clickData = {
                            appid: appid,
                            eventKey: uid,
                            content: subbuttonContent,
                            contentType:'text'
                        }
                        events.push(clickData);
                    }else if(subbuttonType == '3'){
                        var url = $(new_doc).find('[name="wechat_evaluateUrl"]').val();
                        subbuttonArray[j] = {
                            "type": 'view',
                            "name": subbuttonName,
                            "url": url
                        }
                    }
                });
                buttonArray[i] = {
                    "name": buttonName,
                    "sub_button": subbuttonArray
                }
            } else {
                var buttonType = $(new_val).find('.weixin_radio:checked').val();
                if (buttonType == '0') {
                    var media_con = $(new_val).find('.txtpic.selected');
                    var menuId = $(new_val).attr('id').substr(0, $(new_val).attr('id').lastIndexOf("_"));
                    var media_id = $(new_val).find('.menu_media_id').val() || $("#"+menuId).attr("media_id");
                    if (media_con.length && media_id) {
                        buttonArray[i] = {
                            "type": "media_id",
                            "name": buttonName,
                            "media_id": media_id
                        }
                    } else {
                        var uid = uuid.v4();
                        buttonArray[i] = {
                            "type": 'click',
                            "name": buttonName,
                            "key": uid
                        }
                        var buttonContent = $(new_val).find('[name="content"]').val();
                        var _newContent = $.trim(buttonContent);
                        if(!_newContent && error){
                            errot_txt +=error_num+".["+buttonName+"]菜单的内容必须填写\r";
                            error_num += 1;
                            error = false;
                        }else if(buttonContent.length>600 && error){
                            errot_txt +=error_num+".["+buttonName+"]菜单的文字消息长度不能超过600\r";
                            error_num += 1;
                            error = false;
                        }
                        var clickData = {
                            appid: appid,
                            eventKey: uid,
                            content: buttonContent,
                            contentType: 'text'
                        }
                        events.push(clickData);
                    }
                } else if (buttonType == '1') {
                    var url = $(new_val).find('[name="wechat_menuUrl"]').val();
                    buttonArray[i] = {
                        "type": 'view',
                        "name": buttonName,
                        "url": url
                    }
                }else if(buttonType == '2'){
                    var buttonContent = $(new_val).find('[name="contentRobot"]').val();
                    var uid = "robot";
                    var _newContent = $.trim(buttonContent);
                    if(!_newContent&&error){
                        $(new_val).find('[name="contentRobot"]').val("");
                        errot_txt +=error_num+".["+buttonName+"]转人工的内容必须填写\r";
                        error_num += 1;
                        error = false;
                    }else if(buttonContent.length>600&&error){
                        errot_txt +=error_num+".["+buttonName+"]转人工的文字消息长度不能超过600\r";
                        error_num += 1;
                        error = false;
                }
                    buttonArray[i] = {
                        "type": 'click',
                        "name": buttonName,
                        "key": uid
            }
                    var clickData = {
                        appid: appid,
                        eventKey: uid,
                        content: buttonContent,
                        contentType:'text'
                    }
                    events.push(clickData);
                }else if(buttonType == '3'){
                    var url = $(new_val).find('[name="wechat_evaluateUrl"]').val();
                    buttonArray[i] = {
                        "type": 'view',
                        "name": buttonName,
                        "url": url
                    }
                }
            }
        });
        menus.button = buttonArray;
        if(!error){
            alert(errot_txt);
            return false;
        }
        var action = {
            action: 'config.channel.createWeixinMenu',
            data: {_id: appid, menus: menus, events: events}
        };

        var n=0;
        for(var i=0;i<events.length;i++){
            if(events[i].eventKey == 'robot') {
                n++;
                if(n>1){
                    $().alertmessage('showError',"只能有一个转人工");
                    return
                }
                if($('#wechat_robot').attr('ds_data')==''){
                    $().alertmessage('showError',"请选择机器人选项，否则不能发布转人工的内容");
                    return
                }
            }
        }

            DS.send(action, function (response) {
                if (response.success) {
                    $().alertmessage("showSuccess", "发布成功");
                    handler.config.channel.getMenu({_id: appid});
                } else {
                    $().alertmessage('showError', response.message || errMsg);
                }
            });
    },
    addWeixinMenuMain:function(data,src){
        var pane = src.parent("li");
        var menu_id = "";
        var buttonNum = pane.parent().find("li").length;
        var addButton = pane.parent().find(".null").length;
        var mainHtml =[];
        var tempHtml =[];
        var subHtml =[];
        var weixinName = $("#wechat_nickName").text();
        var menu_sets ={
            menu_id: "subMenu_",
            menu_level: "主菜单",
            menu_name: "菜单名称",
            menu_namelimet: "字数不超过4个汉字或8个字母",
            menu_type: "click",
            menu_key: "",
            menu_key2: "",
            menu_url: "http://",
            evaluate_url: handler.config.channel.evaluateUrl,
            menu_class: "main-menu"
        }
        if (buttonNum==1) {//一个主菜单都没有
            var newButtonId = menu_sets.menu_id = "subMenu_1_1";
        }else{//至少有一个主菜单
            var LastButtonId = pane.parent().find("li").eq(buttonNum-2).find(".weixin-main-menu").attr("id").substr(8,2);
            var tempNum = parseInt(LastButtonId)+1;
            var newButtonId = menu_sets.menu_id = "subMenu_"+tempNum+"_1";
        }
        pane.removeClass("null").html('<span id="'+newButtonId+'" class="weixin-main-menu weixin-primary ds_do_action" ds_action="config.channel.showWeixinMenuMain" media_id="" ds_data="">菜单名称</span><p><span class="add-sub-menu ds_do_action" ds_action="config.channel.addWeixinMenuSub"></span><b></b></p>');
        DS.getView('config/channel/config_weixin_menu_set', function (view) {
            $("#weixin-all-menu").find(".form-btn-center").before(DS.renderMethodViewNew(view,menu_sets));
            if(menu_sets.menu_type == "click") {
                $("#"+newButtonId+"_set .menu_type label").eq(0).find("input").click();
            }else if(menu_sets.menu_type == "view"){
                $("#"+newButtonId+"_set .menu_type label").eq(1).find("input").click();
            };
        });
        if ( buttonNum<3 && addButton==1) {
            pane.parent().append('<li class="null"><span style="background:none" class="weixin-main-menu ds_do_action" ds_action="config.channel.addWeixinMenuMain" media_id="" ds_data=""></span></li>');
        }
        $("#"+newButtonId).click();
        $("#delete_menu").val(newButtonId);

    },
    showWeixinMenuMain:function(data,src){
        var subNum = src.find("p");
        var pane = src.parent("li");
        var menu_id = src.attr("id");
        var media_id = src.attr("media_id");
        var setObj = $("#"+menu_id+"_set");
        var p_lis=pane.find('.weixin-sub-menu');
        var input_lis = setObj.find('.webchat-menudetails').find('input[msgname],textarea[msgname]');
        if(p_lis.length>0&&!pane.hasClass('wx_disabled')){
            for(var i=0;i<input_lis.length;i++){
                $(input_lis[j]).attr('disabled','disabled');
            }
            pane.addClass('wx_disabled');
        }else{
            for(var j=0;j<input_lis.length;j++){
                $(input_lis[j]).removeAttr('disabled');
            }
        }
        handler.config.channel.menuid=menu_id;
        if (subNum) {
            pane.addClass("active").find("p").addClass("active").find("span").removeClass("active");
            pane.siblings().removeClass("active").find(".active").removeClass("active");
        }
        if(media_id){
            handler.config.channel.getMediaCon(media_id,setObj,src)
        }
        $("#delete_menu").val(menu_id).attr("ds_action","config.channel.deleteWeixinMenuConfirmDialog");
        $(setObj).show().siblings(".single-menu").hide();
    },
    getMediaCon:function(media_id,setObj,src){
        var imgTXT="<div class='hasSavedMsg' style='border:1px solid #ccc;'><input class='center_check' type='hidden'/><h4 class='h4'></h4><h6 class='h6'></h6><img class='cover_pic' src=''/><div class='article'></div><a class='source_article_url' href='' target='_blank'>阅读原文</a><p class='digest'></p><p class='input_hidden_container'></p></div><div class='option'><span class='ds_do_action' ds_action='config.channel.editWeiXinTuWen'>编辑</span></div>";
        var data = {
            "_id": handler.config.channel.appid,
            "mediaId":media_id
        };
        var action = {
            action: 'config.channel.getMaterial',
            data: data
        };
        DS.send(action, function (response) {
            if(response.success){
                var rep=response.data;
                var errcode=rep.errcode||"";
                if(errcode){
                    $(src).attr('media_id','');
                    setObj.find(".menu_media_id").val('');
                    $().alertmessage('showError', "该素材已被删除");
                }else{
                    setObj.find(".menu_media_id").val(media_id);
                    setObj.find(".img_media_id").val(rep.thumb_media_id);
                    setObj.find(".tab_panel").find(".tab_content").eq(0).html(imgTXT);
                    setObj.find(".hasSavedMsg").find(".center_check").val(rep.show_cover_pic);
                    setObj.find(".hasSavedMsg").find("h4.h4").html(rep.title);
                    setObj.find(".hasSavedMsg").find("h6.h6").html(rep.author);
                    setObj.find(".hasSavedMsg").find("div.article").html(rep.content);
                    setObj.find(".hasSavedMsg").find("p.digest").html(rep.digest);
                    setObj.find(".hasSavedMsg").find(".source_article_url").attr("href",rep.content_source_url);
                    setObj.find(".hasSavedMsg").find("img.cover_pic").attr("src",rep.url+"?imageView2/1/w/900/h/500");
                }
            }
        });
    },
    addWeixinMenuSub:function(data,src){
        var pane_li=src.closest('li');
        var main_id=pane_li.find('.weixin-main-menu').attr('id');
        $(".main-menu").find(".row_item3").find("label>input").removeAttr("stamp");
        if(!pane_li.hasClass('wx_disabled')){
            var _input = $("#"+main_id+"_set").find('.webchat-menudetails').find("input[msgname],textarea[msgname]");
            for(var i=0;i<_input.length;i++){
                $(_input[i]).attr("disabled","disabled");
            }
            pane_li.addClass('wx_disabled');
        }

        var menu_sets ={
            menu_id: "subMenu_",
            menu_level: "子菜单",
            menu_name: "子菜单名称",
            menu_namelimet: "字数不超过8个汉字或16个字母",
            menu_type: "click",
            menu_key: "",
            menu_key2: "",
            menu_url: "http://",
            evaluate_url: handler.config.channel.evaluateUrl,
            menu_class: "sub-menu"
        }
        var subNum = src.siblings("span").length;
        var MainNum = parseInt(src.parent().siblings(".weixin-main-menu").attr("id").substr(8,2));
        if (subNum>0) {
            var LastButtonId = src.parent().find("span").eq(subNum-1).attr("id");
            var numIndex = LastButtonId.lastIndexOf('_')+1;
            var tempNum = parseInt(LastButtonId.substr(numIndex,2))+1||1;
            var newButtonId = menu_sets.menu_id = "subMenu_" + MainNum + "_" + tempNum;
        }else{
            var newButtonId = menu_sets.menu_id = "subMenu_" + MainNum + "_2";
        }
        DS.getView('config/channel/config_weixin_menu_set', function (view) {
            $("#weixin-all-menu").find(".form-btn-center").before(DS.renderMethodViewNew(view,menu_sets));
            if(menu_sets.menu_type == "click") {
                $("#"+newButtonId+"_set .menu_type label").eq(0).find("input").click();
            }else if(menu_sets.menu_type == "view"){
                $("#"+newButtonId+"_set .menu_type label").eq(1).find("input").click();
            };
        });
        src.before('<span id="'+newButtonId+'" class="weixin-sub-menu ds_do_action" ds_action="config.channel.showWeixinMenuSub" media_id="" titile="子菜单名称" ds_data="">子菜单名称</span>');
        $("#"+newButtonId).click();
        $("#subMenu_" + MainNum + "_1_set").find(".row_item").eq(2).hide().siblings(".webchat-menudetails").hide().find("[required]").removeAttr("required").end().siblings("span").hide();
        $("#delete_menu").val(newButtonId);

    },
    showWeixinMenuSub:function(data,src){
        var menu_id = src.attr("id");
        var menu_media_id = src.attr("media_id");
        var setObj = $("#"+menu_id+"_set");
        handler.config.channel.menuid=menu_id;
        src.addClass("active").siblings().removeClass("active").parents("li").removeClass("active");
        $("#delete_menu").val(menu_id).attr("ds_action","config.channel.deleteWeixinMenu");
        $(setObj).show().siblings(".single-menu").hide();
        var media_id = $(src).attr("media_id");
        if(media_id){
            handler.config.channel.getMediaCon(media_id,setObj,src)
        }
    },
    deleteWeixinMenuConfirmDialog:function(data,src){
        var menuId = src.val();
        var menuIdIndex = menuId.lastIndexOf('_')+1;
        var menuObj = $("#" + menuId + "_set");
        var menuName = menuObj.find(".weixin-name").val();
        var sub_menu = $("#"+menuId).parent().find('.weixin-sub-menu');
        var data = {
            confirmDesc : "确定要删除菜单 '"+menuName+"' 吗？",
            confirmAction : "config.channel.deleteWeixinMenu"
        }
        if (menuId.substr(menuIdIndex,1)=="1"&&sub_menu.length>0) {
            data.confirmDesc = "确定要删除菜单 '"+menuName+"' 及其子菜单吗？";
        }
        var html = template("tmpl_channel_config_confirm_dialogbox", data);
        var pane = $("#channal_config_confirm_pane");
        pane.html("");
        pane.html(html);
        pane.find("#a_config_confirm_dialogbox").click();
    },
    deleteWeixinMenu:function(data){
        var src = $("#delete_menu");
        var pane = $(".weixin-config-showbottom");
        var addButton = pane.find(".null").length;
        var menuId = src.val();
        var menuIdIndex = menuId.lastIndexOf("_")+1;
        var menuButton = $("#"+menuId);
        var li_pane = $(menuButton).closest('li');
        var menuSet = $("#"+menuId+"_set");
        if (menuId.substr(menuIdIndex,1)=="1") {
            var menuSets = menuButton.siblings("p").find(".weixin-sub-menu");
            $.each(menuSets,function(i,val){
                var obj = $("#" + $(val).attr('id')+"_set");
                obj.remove();
            });
            menuButton.parents("li").remove();
        }
        var subButtonNum = menuButton.siblings(".weixin-sub-menu").length;
        if (subButtonNum ==0) {//被删除的是最后一个子菜单
            var mainMenuId = menuButton.parents("li").find(".weixin-main-menu").attr("id");
            $("#weixin-all-menu .main-menu").find(".row_item3 input").attr("stamp","stamp");
            $("#"+mainMenuId+"_set").find(".row_item").eq(2).show().siblings(".webchat-menudetails").show().find("textarea[name='content']").end().siblings("span").show();
            $(".null-menu").html('您已删除所有自定义的菜单，请确认后点击"保存并发布"')
            $("#weixin-all-menu .ds_form_action").addClass("show");
            li_pane.removeClass('wx_disabled');
        }
        menuButton.remove();
        menuSet.remove();
        if (addButton==0 && pane.find("li").length < 3) {//三个变两个加个添加按钮
            pane.append('<li class="null"><span style="background:none" class="weixin-main-menu ds_do_action" ds_action="config.channel.addWeixinMenuMain"></span></li>');
        }
        if (pane.find(".weixin-sub-menu").length>0 && pane.find("li").length >1) {
            pane.find(".active").removeClass("active");
            pane.find(".weixin-sub-menu").eq(0).click().parent().addClass("active");
        }else if(pane.find("li").length >1){
            pane.find(".active").removeClass("active");
            pane.find(".weixin-main-menu").eq(0).click().parent().addClass("active");
        }
    },
    changeWeixinMenuType:function(data,src){
        var type = src.val();
        var pane = src.parent().parent().parent().siblings(".webchat-menudetails");
        if (type=="1") {
            pane.find(".webchat-jump-evaluate-url").find("input").removeAttr("required");
            pane.find(".webchat-jump-url").show().find("input").attr("required","required").attr("datatype","Url").end().siblings().hide().find("textarea").removeAttr("required");
            var val_input = pane.find(".webchat-jump-url").find('input[name=wechat_menuUrl]');
            if (!val_input.val()) {
                val_input.val("http://")
            }
            pane.next("span").hide();
            }else if(type == '0'){
                pane.find(".webchat-send-msg").show().children("textarea").end().siblings().hide().find("input").removeAttr("required").removeAttr("datatype");
                pane.find(".webchat-send-msg").siblings().find('textarea').removeAttr("required");
                pane.next("span").show();
            }else if(type == '2'){
                pane.find(".webchat-send-robot-msg").show().children("textarea").end().siblings().hide().find("input").removeAttr("required").removeAttr("datatype");
                pane.find(".webchat-send-robot-msg").siblings().find('textarea').removeAttr("required");
                pane.next("span").show();
            }else if(type == '3') {
                pane.find(".webchat-jump-url").find("input").removeAttr("datatype");
                pane.find(".webchat-jump-evaluate-url").show().find("input").attr("required", "required").attr("datatype", "Url").end().siblings().hide().find("textarea").removeAttr("required");
                var val_input = pane.find(".webchat-jump-evaluate-url").find('input[name=wechat_evaluateUrl]');
                if (!val_input.val()) {
                    val_input.val(handler.config.channel.evaluateUrl)
                }
                pane.next("span").hide();
                var str=src.attr("research")||"";
                if(!str){
                    var len = $(".weixin_sat[stamp='stamp']:checked").length;
                    if (len > 1) {
                        var con = confirm("已经有满意度调查了，您确定继续添加吗？");

                        if (!con) {
                            src.closest(".menu_type").find(".weixin_sendMs").attr("checked", "checked");
                            src.closest(".single-menu").find(".webchat-send-msg").show();
                            src.removeAttr("checked");
                            src.closest(".single-menu").find(".webchat-jump-evaluate-url").hide();
                        }
                    }
                }
            }
    },
    changeSendMenuType:function(data,src){
        var i=src.index();
        src.addClass("selected").siblings().removeClass("selected");
            src.closest(".tab_navs_panel").next().find("div.tab_content").eq(i).css("display","block").siblings().css("display","none");
    },
    showWeiXinEditModal:function(data,src){
        handler.config.channel._initWeiXinQiniuImg();
        $('#weixin_myModal').modal({backdrop:'static',keyboard:false}).find('.ke-statusbar').hide();
        //$('#weixin_myModal').scrollTop=$('#weixin_myModal').scrollHeight;
        $('#weixin_myModal').scrollTop(0);
        $('#weixin_myModal .modal-dialog').scrollTop(0);
        var container=$('#weixin_myModal');
        var id=src.closest(".single-menu").attr("id");
        $("#weiXinSaveIndex").val(id);
        $("#imgMediaId").val("");
        $("#menuMediaId").val("");
        container.find("[class^='wordsNum']").text('0');
        container.find(".pb-input-text").eq(0).val('');
        container.find(".pb-input-text").eq(1).val('');
        container.find(".digest").val('');
        container.find(".input_source").val('http://');
        container.find("img").attr("src",'');
        container.find("input[name='checkbox']").attr("checked",false);
        $(".ke-edit-iframe").contents().find(".ke-content").html('');
    },
    editWeiXinTuWen:function(data,src){
        handler.config.channel._initWeiXinQiniuImg();
        $('#weixin_myModal').modal({backdrop:'static',keyboard:false}).find('.ke-statusbar').hide();
        var container=$('#weixin_myModal');
        var id=src.closest(".single-menu").attr("id");
        $("#weiXinSaveIndex").val(id);
        $("#imgMediaId").val("");
        $("#menuMediaId").val("");
        var pane=$("#"+id);
        var h4value=pane.find('.hasSavedMsg').find("h4.h4")[0].innerText;
        $(".wordsNum1").text(h4value.length);
        var h6value=pane.find('.hasSavedMsg').find("h6.h6")[0].innerText;
        $(".wordsNum2").text(h6value.length);
        var digestHtml=pane.find('.hasSavedMsg').find("p.digest").text();
        $(".wordsNum3").text(digestHtml.length);
        var keHtml=pane.find(".hasSavedMsg").find("div.article").html();
        var imgSrc=pane.find("img.cover_pic").attr("src");
        var sourceUrl=pane.find(".source_article_url").attr("href");
        var menu_media_id=$(src).closest('.webchat-menudetails').find('.menu_media_id').val();
        var img_media_id=$(src).closest('.webchat-menudetails').find('.img_media_id').val();
        var cent_check=pane.find(".hasSavedMsg").find(".center_check").val();
        if(parseInt(cent_check)){
            container.find("#checkbox2").attr('checked',true);
        }
        container.find(".pb-input-text").eq(0).val(h4value);
        container.find(".pb-input-text").eq(1).val(h6value);
        container.find(".digest").val(digestHtml);
        container.find("img.square").attr("src",imgSrc);
        container.find(".input_source").val(sourceUrl);
        container.find("#menuMediaId").val(menu_media_id);
        container.find("#imgMediaId").val(img_media_id);
        $(".ke-edit-iframe").contents().find(".ke-content").html(keHtml);
    },
    _initWeiXinQiniuImg : function(){
        var pane=$('#weixin_myModal');
        var containerId = 'weiXin_icon-container-qiniu';
        var progressId= 'weiXin_icon-fsUploadProgress';
        var uploader = Qiniu.uploader({
            runtimes: 'flash,html4',
            browse_button: 'weiXin_icon-pickfiles',
            multi_selection:false,
            container:containerId,
            drop_element: containerId,
            max_file_size: '1MB',
            flash_swf_url: '/javascripts/qiniu/plupload/Moxie.swf',
            dragdrop: true,
            chunk_size: '1MB',
            uptoken_url: '/action?action=app.webchat.getImUptoken&data={}&sessionId=' + session.id,
            domain: qiniu7moorImDomain,
            // downtoken_url: '/downtoken',
            unique_names: false,
            save_key: false,
            auto_start: true,
            filters: {
                mime_types : [
                    { title : "Image files", extensions : "jpg,png" }
                ]
            },
            init: {
                'FilesAdded': function(up, files) {
                    //pane.find(".userEdit_icon_container").show();
                    plupload.each(files, function(file) {
                        var progress = new FileProgress(file, progressId);
                        progress.setStatus("等待...");
                    });
                },
                'BeforeUpload': function(up, file) {
                    if($('.weiXin_icon_container').find('tbody').find('tr').length > 0){
                        $('.weiXin_icon_container').find('tbody').find('tr').find('a.ds_do_action').click();
                    }
                    var progress = new FileProgress(file, progressId);
                    var chunk_size = plupload.parseSize(this.getOption('chunk_size'));
                    if (up.runtime === 'html5' && chunk_size) {
                        progress.setChunkProgess(chunk_size);
                    }
                },
                'UploadProgress': function(up, file) {
                    var progress = new FileProgress(file, progressId);
                    var chunk_size = plupload.parseSize(this.getOption('chunk_size'));
                    progress.setProgress(file.percent + "%", up.total.bytesPerSec, chunk_size);
                },
                'UploadComplete': function() {
                    var logo = pane.find("input[name='im_icon']").val();
                    var data = {url:qiniu7moorImDomain + logo,_id: handler.config.channel.appid};
                    var action = {
                        action: 'config.channel.saveWeixinMaterial',
                        data: data
                    };
                    DS.send(action, function (rep) {
                        if (rep.success) {
                            var media_id = rep.media_id;
                            $("#imgMediaId").val(media_id);
                            pane.find(".S_line5").attr("src",logo+"?imageView2/1/w/900/h/500");
                            $().alertmessage('showSuccess', "图片上传成功");
                        } else {
                            $().alertmessage('showError', rep.message||errMsg);
                        }
                    });
                },
                'FileUploaded': function(up, file, info) {
                    var progress = new FileProgress(file, progressId);
                    progress.setComplete(up, info, 'weiXin_icon');
                },
                'Error': function(up, err, errTip) {
                    //pane.find(".userEdit_icon_container").show();
                    var progress = new FileProgress(err.file, progressId);
                    progress.setError();
                    progress.setStatus(errTip);
                    alert(errTip);
                },
                'Key': function(up, file) {
                    var date=getCurrentDate();
                    var today = new Date();
                    var time=today.getTime();
                    var fileName=file.name;
                    var fileSuffix="";
                    if(fileName){
                        fileSuffix = fileName.substring(fileName.lastIndexOf('.'), fileName.length);
                    }
                    var key = session.user.account+"/icon/"+date+"/"+time+"/"+uuid.v1()+fileSuffix;
                    console.info("Key2========="+key);
                    return key;
                }
            }
        });
        $('#'+containerId).on(
            'dragenter',
            function(e) {
                e.preventDefault();
                $('#'+containerId).addClass('draging');
                e.stopPropagation();
            }
        ).on('drop', function(e) {
            e.preventDefault();
            $('#'+containerId).removeClass('draging');
            e.stopPropagation();
        }).on('dragleave', function(e) {
            e.preventDefault();
            $('#'+containerId).removeClass('draging');
            e.stopPropagation();
        }).on('dragover', function(e) {
            e.preventDefault();
            $('#'+containerId).addClass('draging');
            e.stopPropagation();
        });
    },
    showLastWords:function(data,src,event){
        var num=src.val().length;
        var e = event || window.event;
        if(num>120){
            var val=src.val().slice(0,120);
            src.val(val);
            num=120;
        }
        src.next().find("span").eq(0).text(num);
    },
    deleteWeiXinPics:function(data,src){
        var con = confirm("确定要删图片吗？");
        if (!con) {
            return false;
        }
        src.parent().prev().find(".square").attr("src","");
        $("imgMediaId").val('');
    },
    saveWeiXinImgTxt:function(data,src){
        var rep=function(o){
           var result= o.replace(/"/g,'&quot;').replace(/ /g,'&nbsp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
            return result;
        };
        var id=$("#weiXinSaveIndex").val();
        var pane=$("#"+id);
        var imgTXT="<div class='hasSavedMsg' style='border:1px solid #ccc;'><input class='center_check' type='hidden'/><h4 class='h4'></h4><h6 class='h6'></h6><img class='cover_pic' src=''/><div class='article'></div><a class='source_article_url' href='' target='_blank'>阅读原文</a><p class='digest'></p><p class='input_hidden_container'></p></div><div class='option'><span class='ds_do_action' ds_action='config.channel.editWeiXinTuWen'>编辑</span></div>";
        var h4value=$("#weixin_myModal").find(".pb-input-text").eq(0).val();
        if($.trim(h4value)==""){
            $().alertmessage('showError', "标题不能为空");
            $("#weixin_myModal").find(".pb-input-text").eq(0).val("");
            $("#weixin_myModal").find(".wordsNum1").text('0');
            return false;
        }
        var h4rep=rep(h4value);
        var h6value=$("#weixin_myModal").find(".pb-input-text").eq(1).val();
        if($.trim(h6value)==""){
            $().alertmessage('showError', "作者不能为空");
            $("#weixin_myModal").find(".pb-input-text").eq(1).val("");
            $("#weixin_myModal").find(".wordsNum2").text('0');
            return false;
        }
        var h6rep=rep(h6value);
        var keHtml='';
        keHtml=handler.config.channel.wechatKmEditor.text();
        if($.trim(keHtml)==""){
            $().alertmessage('showError', "内容不能为空");
            handler.config.channel.wechatKmEditor.html("");
            return false;
        }else{
            keHtml=$(".ke-edit-iframe").contents().find(".ke-content").html();
        }
        var kerep=rep(keHtml);
        var imgSrc=$("#weixin_myModal").find("img.square").attr("src");
        if(imgSrc==''||imgSrc==null){
            $().alertmessage('showError', "请上传图片");
            return false;
        }
        var input_source_value=$("#weixin_myModal").find(".input_source").val();
        function isUrl(str){
            var reg = /^((http|ftp|https):\/\/)(([a-zA-Z0-9\._-]+\.[a-zA-Z]{2,6})|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,4})*(\/[a-zA-Z0-9\&%_\.\/-~-]*)?/;
            return reg.test(str);
        }
        if(input_source_value==''||input_source_value==null){
            $().alertmessage('showError', "请输入原文链接");
            return false;
        }else if(!isUrl(input_source_value)){
            $().alertmessage('showError', "请输入正确的原文链接");
            return false;
        }
        //}
        var _digest = $("#weixin_myModal").find(".digest").val().trim();
        if(_digest == ''){
            var str=$(".ke-edit-iframe").contents().find(".ke-content")[0].innerText;
            var target=str.substr(0,54);
        }
        var digestHtml=$("#weixin_myModal").find(".digest").val().trim()||target;
        var digestrep=rep(digestHtml);
        var imgMediaId=$("#imgMediaId").val();
        var menuMediaId=$("#menuMediaId").val();
        var checkbox=$('#checkbox2').is(':checked');
        console.log(digestrep);
        var data = {news: {
            "title": escape(escape(h4value)),
            "thumb_media_id": imgMediaId,
            "author": escape(escape(h6value)),
            "digest": escape(escape(digestHtml)),
            "show_cover_pic": checkbox ? 1 : 0,
            "content": escape(escape(keHtml)),
            "content_source_url": escape(escape(input_source_value))
        },
            "_id": handler.config.channel.appid,
            "mediaId":menuMediaId
        };
        var action = {
            action: 'config.channel.saveNewsMaterial',
            data: data
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                pane.find(".tab_panel").find(".tab_content").eq(0).html(imgTXT);
                var check=checkbox ? 1 : 0;
                pane.find(".hasSavedMsg").find(".center_check").val(check);
                pane.find(".hasSavedMsg").find("h4.h4").html(h4value);
                pane.find(".hasSavedMsg").find("h6.h6").html(h6value);
                pane.find(".hasSavedMsg").find("div.article").html(keHtml);
                pane.find(".hasSavedMsg").find("p.digest").html(digestHtml);
                pane.find(".hasSavedMsg").find(".source_article_url").attr("href",input_source_value);
                pane.find(".hasSavedMsg").find("img.cover_pic").attr("src",imgSrc);
                var hiddenInput="<input type='hidden' name='tuwen_title' value="+h4rep+"><input type='hidden' name='tuwen_writer' value="+h6rep+"><input type='hidden' name='tuwen_content' value="+kerep+"><input type='hidden' name='tuwen_source' value="+input_source_value+"><input type='hidden' name='tuwen_img' value="+imgSrc+"><input type='hidden' name='tuwen_digest' value="+digestrep+">";
                $(".input_hidden_container").html(hiddenInput);
                $(".input_hidden_container").find('input').val();
                $("#weixin_myModal").modal("hide");
                $("#"+handler.config.channel.menuid+"_set").find('.menu_media_id').val(rep.media_id);
                $("#"+handler.config.channel.menuid+"_set").find('.img_media_id').val(imgMediaId);
                $().alertmessage('showSuccess', "设置成功");
            } else {
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    deleteWeiXinEdit:function(data,src){
        var menu_media_id=$(src).closest('.webchat-menudetails').find('.menu_media_id').val();
        var data = {
            "_id": Math.random(),
            "mediaId":menu_media_id
        };
        var action = {
            action: 'config.channel.removeNewsMaterial',
            data: data
        };
        DS.send(action, function (response) {
            if(response.success){
                src.closest(".tab_content").html("<div class='create_access ds_do_action' ds_action='config.channel.showWeiXinEditModal'><span class='add_img_text' data-toggle='modal'></span><p class='newtxt'>新建图文消息</p></div>");
            }
        });
    },
    changeWeixinMenuName:function(data,src){
        var pane = $(".weixin-config-showbottom");
        var name = src.val();
        for(var t=0,i=0;i<name.length;i++){
            var s=name.charCodeAt(i);
            s>=1&&126>=s||s>=65376&&65439>=s?t++:t+=2;
            if ((src.parent().parent().parent().hasClass("main-menu") && t>8)||(src.parent().parent().parent().hasClass("sub-menu") && t>16)) {
                name = name.substr(0,i)
                src.val(name);
                $().alertmessage('showError', "字数超过限制");
                break;
            }
        }
        if (pane.find("span.active").length>0) {
            pane.find("span.active").html(name).attr('title',name);
        }else{
            pane.find("li.active .weixin-main-menu").html(name);
        }
        var msgNameObj = src.closest(".single-menu").find("input[msgname],textarea[msgname]");
        for (var j = 0 ; j <msgNameObj.length; j++) {
            var nameNum = $(msgNameObj[j]).attr("msgname").length;
            var msgName = $(msgNameObj[j]).attr("msgname").substr(nameNum-4,4);
            if(j!=0){
                $(msgNameObj[j]).attr("msgname",name+"的"+msgName);
            }
            if(j==1){
                $(msgNameObj[j]).attr("msg","["+name+"的"+msgName+"]请输入正确的地址");
            }
        }
    },
    /**
     * 微信对接配置查询列表
     * @param data
     * @param src
     */
    queryDockWeiXinList: function(data, src, e){
        var ev = e || window.event;
        var obj = ev.target || ev.srcElement;
        $(obj).closest("span").addClass("act_two").siblings().removeClass("act_two");
        $(obj).closest("li.relative").addClass("active");
        var container=$("#view_config_channel");
        data=data||{};
        if(src){
            data.page = src.attr("value") || 1;
        }else{
            data.page = 1;
        }
        data.platform = "web";
        data.limit=handler.config.channel.pageSize;
        var formID = "dockWeiXin_query_frm";
        var action = {
            action: 'config.channel.queryDockWeiXinList',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var webchats = response.list;
                var webchatUrl = response.webchatUrl|| "http://webchat.7moor.com";
                container.find('#weiXin_dock_list_pane').empty();
                    for (var i = 0; i < webchats.length; i++) {
                        var webchat = webchats[i];
                        webchat.webchatUrl = webchatUrl;
                        var accessId = webchat._id;
                        var embedScript = "<script type=\"text/javascript\" src=\"" + webchatUrl + "/javascripts/7moorInit.js?accessId=" + accessId + "\"></script>";
                        webchat.embedScript = embedScript;
                        var weixinDock=template("config_weixin_dock_item",webchat);
                        container.find('#weiXin_dock_list_pane').append(weixinDock);
                    }
                    DS.updatePagination(formID, response.count, handler.config.channel.pageSize, data.page);
            }else{
                $().alertmessage('showError',response.message|| errMsg);
            }
        });
    },

    /**
     * 微信对接详情
     * @param data
     * @param src
     */
    showDockWeixinView: function(data, src){
        var mailQueues = getCache("mailQueues");
        if(!mailQueues || mailQueues.length == 0){
            $().alertmessage("showError", "您还没设置技能组，请先到【渠道技能组】添加技能组!");
            $("#view_config_channel").find(".sub-nav").find("li:first").find("a").click();
            return;
        }
        var container=$("#view_config_channel");
        var panel = container.find("#config_weixin_dock");
        var action = {
            action: 'config.channel.getDockWeixin',
            data: {_id: data._id}
        };
        DS.send(action, function (response) {
            var wechat = response.data;
            if (response.success) {
                var webchat = response.data;
                var html = [];
                $(src).closest("tr").addClass("active").siblings().removeClass("active");
                DS.getView('config/channel/config_weixin_dock_edit', function (view) {
                    html.push(DS.renderMethodViewNew(view,webchat));
                    panel.empty();
                    panel.html(html.join(""));
                    var optionsHtml = '<option selected="selected" value="0">--请选择--</option>';
                    var selected = false;
                    for(var i=0 ;i<mailQueues.length; i++){
                        if(mailQueues[i].Exten == wechat.to_peer){
                            optionsHtml += '<option selected="selected" value="'+mailQueues[i].Exten+'">'+mailQueues[i].DisplayName+'</option>';
                            selected = true;
                        }else{
                            optionsHtml += '<option value="'+mailQueues[i].Exten+'">'+mailQueues[i].DisplayName+'</option>';
                        }
                    }
                    $("#to_peer").html(optionsHtml);

                });
            }else{
                $().alertmessage('showError', response.message||errMsg);
            }
        });
    },
    showDelDockWeixinView: function (data) {
        var con = confirm("确定要删除该Webchat接入号吗？");
        if (!con) {
            return false;
        }
        var action = {
            action: 'config.channel.delDockWeixin',
            data: {_id: data._id}
        };
        DS.send(action, function (response) {
            if (response.success) {
                $().alertmessage('showSuccess', "删除成功");
                var container=$("#view_config_channel");
                var pane =container.find('#config_weixin_dock');
                pane.empty();
                handler.config.channel.queryDockWeiXinList();
            } else {
                $().alertmessage('showError', response.message||errMsg);
            }
        });
    },
    showWeixinDockConfig: function(data, src){
        var container=$("#view_config_channel");
        var panel = container.find("#config_weixin_dock");

        $(src).closest("tr").addClass("active").siblings().removeClass("active");
        var html = template("tmpl_weixin_config_instruction");
        panel.html(html);
        $(src).closest("tr").addClass("active").siblings().removeClass("active");
        $("#weixin_script").text(handler.config.channel.wechatUrl + "/Icallback");
        var clip = new ZeroClipboard([document.getElementById("copybtn_weixin_script")]);
        clip.on("aftercopy", function(e){
            $().alertmessage("showSuccess", "复制内容成功");
        });
        $('#weixin_token').text(data.token);
        var clip = new ZeroClipboard([document.getElementById("copybtn_weixin_token")]);
        clip.on("aftercopy", function(e){
            $().alertmessage("showSuccess", "复制内容成功");
        });


    },
    showDockWeixinAdd: function(data, src){
        var mailQueues = getCache("mailQueues");
        if(!mailQueues || mailQueues.length == 0){
            $().alertmessage("showError", "您还没设置技能组，请先到【渠道技能组】添加技能组!");
            $("#view_config_channel").find(".sub-nav").find("li:first").find("a").click();
            return;
        }
        var container=$("#view_config_channel");
        var panel = container.find("#config_weixin_dock");
        var action = {
            action: 'config.channel.getDockWeixin',
            data: {_id: data._id}
        };
        DS.send(action, function (response) {
            if (response.success) {
                var webchat = response.data;
                var html = [];
                DS.getView('config/channel/config_weixin_dock_add', function (view) {
                    html.push(DS.renderMethodViewNew(view,webchat));
                    panel.empty();
                    panel.html(html.join(""));
                    var optionsHtml = '<option selected="selected" value="0">--请选择--</option>';
                    var selected = false;
                    for(var i=0 ;i<mailQueues.length; i++){
                        optionsHtml += '<option value="'+mailQueues[i].Exten+'">'+mailQueues[i].DisplayName+'</option>';

                    }
                    $("#to_peer").html(optionsHtml);
                });
            }else{
                $().alertmessage('showError', response.message||errMsg);
            }
        });
    },
    updateDockweixinCfg: function(data){
        if(data.to_peer<=0){
            $().alertmessage("showError", "请选择技能组");
            return;
        }
        var container=$("#view_config_channel");
        var panel = container.find("#config_weixin_dock");
        var action = {
            action: 'config.channel.updateDockWeixin',
            data: data
        };
        data._id = data.id;
        delete data.id;
        DS.send(action, function (rep) {
            if (rep.success) {
                $().alertmessage('showSuccess', "修改成功！");
                panel.empty();
                handler.config.channel.queryDockWeiXinList(data);
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        })
    },
    saveWeixinDock: function (data) {
        var postData = {};
        if(data.to_peer<=0){
            $().alertmessage("showError", "请选择技能组");
            return;
        }
        var container=$("#view_config_channel");
        var pane =container.find('#config_weixin_dock');
        postData.authorizer_appid = data.authorizer_appid;
        postData.nick_name = data.nick_name;
        postData.sendUrl = data.sendUrl;
        postData.to_peer = data.to_peer;
        var action = {
            action: 'config.channel.saveDockWeixin',
            data: postData
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                $().alertmessage('showSuccess', "增加成功");
                pane.empty();
                handler.config.channel.queryDockWeiXinList(data);
            } else {
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },

    /**
     * 微信客服账号管理详情
     * @param data
     * @param src
     */
    showWeixinCustomDetail: function(data, src, e){
        var ev = e || window.event;
        var obj = ev.target || ev.srcElement;
        $(obj).closest("span").addClass("act_two").siblings().removeClass("act_two");
        $(obj).closest("li.relative").addClass("active");
        var container=$("#view_config_channel").find('#weixin_custom_list_pane');
        data=data||{};
        if(src){
            data.page = src.attr("value") || 1;
        }else{
            data.page = 1;
        }
        data.limit=handler.config.channel.pageSize;
        var formID = "weiXin_custom_frm";
        var action = {
            action: 'config.channel.weixinGetAllCustomService',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                container.empty();
                if(response.data.length<=0){
                    container.html('<tr><td colspan="3" style="text-align:center;height:58px;line-height:58px;">目前没有微信客服账号信息！</td></tr>');
                    $("#config_weixin_custom").html("");
                }
                for(var i=0;i<response.data.length;i++){
                   var weixinName=$("#workbench_lists a[ds_data="+response.data[i].appid+"]").html();
                    response.data[i].weixinName=weixinName;
                    var customTemplate=template("config_weixin_custom_item",response.data[i]);
                    container.append(customTemplate);
                }
                DS.updatePagination(formID, response.count, handler.config.channel.pageSize, data.page);
            }else{
                $().alertmessage('showError',response.message|| errMsg);
            }
        });
    },
    addWeixinCustomDetail:function(){
        var custom={};
        var str='';
        var appLi=$("#workbench_lists .workbench_li a");
        appLi.each(function(index,node){
            custom[index]={};
            custom[index].weixinName=$(node).html();
            custom[index].appid=$(node).attr("ds_data");
            custom[index].imgUrl="./img/user.png";
            custom[index].kf_account='';
        })
        $("#config_weixin_custom").empty();
        if(appLi.length<=0){
            $().alertmessage('showError',"请先授权微信公众号！");
        }
        for(var i=0 ;i<appLi.length; i++){
            var customTemplete=template("weixin_custom_templete",custom[i]);
            $("#config_weixin_custom").html(customTemplete);
           str+='<option value='+custom[i].appid+' kf_account='+custom[i].kf_account+'>'+custom[i].weixinName+'</option>';
        }
        $("#weixin_weixin_name").append(str);
        handler.config.channel._initEditCustomQiniuImg();

    },
    cancleWeixinCustomDetial:function(){
        $("#config_weixin_custom").html("");
    },
    saveWeixinCustomDetial:function(data){
        var pane=$("#config_weixin_custom");
        var customName=$("#weixin_custom_name").val();
        var weixinName=$("#weixin_weixin_name").val();
        var newImg=pane.find(".S_line5");
        var customData={},action={};
        var kf_account=$("#weixin_weixin_name option[value="+weixinName+"]").attr("kf_account");
        if(customName==''){
            $().alertmessage('showError', "客服昵称不能为空！");
            $("#weixin_custom_name").css("border","1px solid red")
            return;
        }
        if(data.wenxin_name<=0){
            $().alertmessage('showError', "请选择微信名称！");
            $("#weixin_weixin_name").css("border","1px solid red");
            return;
        }
        newImg.attr("flag")?customData.imgUrl=newImg.attr("src"):customData.imgUrl='';
        customData.appid=weixinName;
        customData.nickname=customName;
        if(kf_account){
            customData.kf_account=kf_account;
            action.action="config.channel.weixinUpdateCustomService";
        }else{
            customData.kf_account="";
            action.action="config.channel.weixinAddCustomService";
        }
        action.data=customData

        DS.send(action,function(response){
            if(response.success){
                $("#config_weixin_custom").html("");
                $().alertmessage('showSuccess', "保存成功！");
                handler.config.channel.showWeixinCustomDetail();
            }else{
                $().alertmessage('showError', response.message.replace('/^[\u4e00-\u9fa5]+$/'));
                $("#weixin_weixin_name").css("border","1px solid red");
            }

        })
    },
    changeWeixinCustomDetail:function(data,src){
        var pane=src.closest("tr").find(".cfg_webchatCustomName");
        var imgUrl= src.attr("imgUrl");
        var appId=src.closest("tr").find(".cfg_webchatName").attr("value");
        var customData={},str='',custom={};
        customData.kf_account=pane.attr("kf_account");
        customData.nickname=pane.html();
        if(imgUrl==''){
            imgUrl="./img/user.png"
        }
        customData.imgUrl=imgUrl;
         customData.appid=appId;
        var container=$("#config_weixin_custom");
        var weixinName=$("#workbench_lists a[ds_data="+appId+"]").html();
        customData.weixinName=weixinName;
        var appLi=$("#workbench_lists .workbench_li a");
        appLi.each(function(index,node){
            custom[index]={};
            custom[index].weixinName=$(node).html();
            custom[index].appid=$(node).attr("ds_data");
        });
        var customTemplete=template("weixin_custom_templete",customData);
        container.html(customTemplete);
        for(var i=0;i<appLi.length;i++){
            str+='<option value='+custom[i].appid+' kf_account='+ customData.kf_account+'>'+custom[i].weixinName+'</option>';
        }
        $("#weixin_weixin_name").append(str);
        $("option[value="+data+"]").attr("selected","selected");
        $("#weixin_weixin_name option[value='0']").remove();
        var newImg=imgUrl.indexOf("qiniucdn");
        if(newImg==-1&&imgUrl!="./img/user.png"){
            $("#customEdit_icon-container-qiniu .S_line5").hide();
            $("#customer-photo-iframe").show();
        }
        handler.config.channel._initEditCustomQiniuImg();
    },
    delWeixinCustomDetail:function(data,src){
        var con = confirm("确定要删除该微信客服账号吗？");
        if (!con) {
            return false;
        }
        var customData={};
        customData.appid=data;
        customData.kf_account=src.closest("tr").find(".cfg_webchatCustomName").attr("kf_account");
        var action = {
            action: 'config.channel.weixinDelCustomService',
            data:customData
        };
        DS.send(action, function (response) {
            if (response.success) {
                $().alertmessage('showSuccess', "删除成功");
                var container=$("#view_config_channel");
                var pane =container.find('#config_weixin_custom');
                pane.empty();
                handler.config.channel.showWeixinCustomDetail();
            } else {
                $().alertmessage('showError', response.message||errMsg);
            }
        });
    },
    showCustomBindSeatEmailQueue:function(data,src,report){
        var agentArr = getCache("agents");
        var flag = src.attr("flag");
        var queuedata={};
        var allHtml=[];
        var allHtmlResult=[];
        var tempHtml=null,tempHtmlResult=null;
        var pane=$("#wechat_topeer").find("option:selected");
        queuedata.Account=pane.attr("account");
        queuedata.Exten=pane.val();
        var action={
            action:"config.channel.queryEmailQueue",
            data:queuedata
        }
       DS.send(action,function(response){
           if(response.success){
               for(var i=0;i<response.list.length;i++){
                   tempHtml = allHtml;
                   tempHtmlResult = allHtmlResult;
                   var resData=response.list[i];
                   for(var j=0;j<resData.AssignMembers.length;j++){
                       tempHtml.push('<li class="not_select"><span class="set_name" id="');
                       tempHtml.push(resData.AssignMembers[j].agentID);
                       tempHtml.push('_show" tamp="tamp">');
                       for (var m= 0,len=agentArr.length;m<len;m++) {
                           if(agentArr[m]._id==resData.AssignMembers[j].agentID){
                               tempHtml.push(agentArr[m].displayName+"-"+agentArr[m].exten);
                               break;
                           }
                       }
                       tempHtml.push('</span><span class="set_add" ds_action="config.channel.addAgentAssign" ds_data="config_email_agent_add" custom="use">');
                       tempHtml.push(resData.AssignMembers[j].agentID);
                       tempHtml.push('</span></li>');
             }
           }
               if(allHtml.length>0){
                   $("#customAgentAssignTable ul").html(tempHtml.join(''))
               }else{
                   $("#customAgentAssignTable").css("display","none")
               }
           }
           $('#agentAssignAutoComplete').bind('keyup', function(){
               if (this.value) {
                   var searchAgent = this.value;
                   if(flag){
                       var allAgentDom = $("#agentAssignTable");
                   }else{
                       var allAgentDom = $("#customAgentAssignTable");
                   }
                   var noSelectAgentArr = allAgentDom.find(".not_select").find(".set_name");
                   if (searchAgent) {
                       for (var i = 0; i < noSelectAgentArr.length; i++) {
                           noSelectText = noSelectAgentArr[i].innerText;
                           if (noSelectText.indexOf(searchAgent)>=0) {
                               allAgentDom.find(".not_select").eq(i).show();
                           }else{
                               allAgentDom.find(".not_select").eq(i).hide();
                           }
                       }
                       ;
                   }

               }else{
                   $(".not_select").show();
               }
           });
           if(typeof(report) == "function"){
               report();
           }
       })
    },
    showCustomBindSeat:function(data,src){
        var pane=$("#config_weixin_custom");
        src.attr("tamp","tamp");
        src.parents("tr").siblings().find(".cfg-bind-custom").removeAttr("tamp");
        var seatTempalte=template("custom_bind_seat_item");
        pane.html(seatTempalte);
        handler.config.channel.showCustomBindSeatEmailQueue(data,src,function(){
            handler.config.channel.showCustomBindSeatDetail(data,src)
        });
        var rHeight = $(".left_col").height()-80;
        $("#config_weixin_custom").css("height",rHeight);
    },
    showCustomBindSeatDetail:function(data,src){
        var pane=$("#config_weixin_custom");
        var kf_account=src.attr("kf_account");
        var nickname=src.attr("nickname");
        var tempHtmlResult=[];
         pane.find(".bin-seat-webchat").attr("kf_account",kf_account);
        pane.find(".asth").html(nickname);
        var action={
            action:"config.channel.weixinGetCustomServiceBindUsers",
            data: { kf_account: kf_account}
        }
        DS.send(action,function(response){
            if(response.success){
                for(var i=0;i<response.data.length;i++){
                    var resData=response.data[i];
                    if($("#customAgentAssignTable ul").find("span[id='"+resData+"_show']").length<=0){
                        continue;
                    }
                    tempHtmlResult.push('<li><span class="set_name" id="queue_agent_');
                    tempHtmlResult.push(resData);
                    tempHtmlResult.push('">');
                    tempHtmlResult.push($("#customAgentAssignTable #"+resData+"_show").html());
                    tempHtmlResult.push('</span>');
                    tempHtmlResult.push('<label style="margin-top: 3px;" ds_action="config.channel.deleteAgentAssign" name="');
                    tempHtmlResult.push(resData+ '_show" flag="use">');
                    tempHtmlResult.push('<input type="checkbox" name="');
                    tempHtmlResult.push(resData+ '_assignment');
                    tempHtmlResult.push('" id="');
                    tempHtmlResult.push(resData+ '_assignment');
                    tempHtmlResult.push('" tamp="tamp"/>');
                    tempHtmlResult.push('</label></li>');
                    }
                $("#config_weixin_custom .show_result ul").html(tempHtmlResult.join(""));
                }else{
                $().alertmessage('showError',"服务异常！");
            }
            for(var j=0;j<response.data.length;j++){
                var resDataTure=response.data[j];
                $(' #' + resDataTure + '_show[tamp="tamp"]').parent().removeClass("not_select").hide();
                $(' #' + resDataTure + '_assignment[tamp="tamp"]').attr('checked', 'true').parent().parent().show();
            }
        })
    },
    bindSeatToWebchatCustom:function(data,src){
        var data={};
        var panel = $("#config_weixin_custom").find(".show_result");
        var assignedchkArr = $('label', panel);
        var  agentID = []
        for (var i = 0, len = assignedchkArr.length; i < len; i++) {
            agentID.push($(assignedchkArr[i]).attr('name').split('_')[0]);
        }
        data.kf_account=src.attr("kf_account");
        data.users=agentID;
        var action={
            action:'config.channel.weixinBindUsersToCustomService',
            data:data
        }
        DS.send(action,function(response){
            if(response.success){
                $().alertmessage('showSuccess', "微信客服账号绑定坐席成功！");
                $("#config_weixin_custom").html("");
            }
        })
    },
    _initEditCustomQiniuImg:function(){
        var pane=$("#config_weixin_custom");
        var containerId = 'customEdit_icon-container-qiniu';
        var progressId= 'customEdit_icon-fsUploadProgress';
        var uploader = Qiniu.uploader({
            runtimes: 'flash,html4',
            browse_button: 'customEdit_icon-pickfiles',
            multi_selection:false,
            container:containerId,
            drop_element: containerId,
            max_file_size: '5mb',
            flash_swf_url: '/javascripts/qiniu/plupload/Moxie.swf',
            dragdrop: true,
            chunk_size: '4mb',
            uptoken_url: '/action?action=app.webchat.getImUptoken&data={}&sessionId=' + session.id,
            domain: qiniu7moorImDomain,
            // downtoken_url: '/downtoken',
            unique_names: false,
            save_key: false,
            auto_start: true,
            filters: {
                mime_types : [
                    { title : "Image files", extensions : "jpg,png" }
                ]
            },
            init: {
                'FilesAdded': function(up, files) {
                    //pane.find(".userEdit_icon_container").show();
                    plupload.each(files, function(file) {
                        var progress = new FileProgress(file, progressId);
                        progress.setStatus("等待...");
                    });
                },
                'BeforeUpload': function(up, file) {
                    if($('.customEdit_icon_container').find('tbody').find('tr').length > 0){
                        $('.customEdit_icon_container').find('tbody').find('tr').find('a.ds_do_action').click();
                    }
                    var progress = new FileProgress(file, progressId);
                    var chunk_size = plupload.parseSize(this.getOption('chunk_size'));
                    if (up.runtime === 'html5' && chunk_size) {
                        progress.setChunkProgess(chunk_size);
                    }
                },
                'UploadProgress': function(up, file) {
                    var progress = new FileProgress(file, progressId);
                    var chunk_size = plupload.parseSize(this.getOption('chunk_size'));
                    progress.setProgress(file.percent + "%", up.total.bytesPerSec, chunk_size);
                },
                'UploadComplete': function() {
                    var logo = pane.find("input[name='im_icon']");
                    //pane.find(".S_line5").attr("src",qiniu7moorImDomain+logo.val()+"?imageView2/1/w/50/h/50").attr("flag","on");
                    pane.find(".S_line5").attr("src",logo.val()+"?imageView2/1/w/50").attr("flag","on");
                    $().alertmessage('showSuccess', "图片上传成功");
                },
                'FileUploaded': function(up, file, info) {
                    var progress = new FileProgress(file, progressId);
                    progress.setComplete(up, info, 'userEdit_icon');
                },
                'Error': function(up, err, errTip) {
                    //pane.find(".userEdit_icon_container").show();
                    var progress = new FileProgress(err.file, progressId);
                    progress.setError();
                    progress.setStatus(errTip);
                    alert(errTip);
                },
                'Key': function(up, file) {
                    var date=getCurrentDate();
                    var today = new Date();
                    var time=today.getTime();
                    var fileName=file.name;
                    var fileSuffix="";
                    if(fileName){
                        fileSuffix = fileName.substring(fileName.lastIndexOf('.'), fileName.length);
                    }
                    var key = session.user.account+"/icon/"+date+"/"+time+"/"+uuid.v1()+fileSuffix;
                    //console.info("Key2========="+key);
                    return key;
                }
            }
        });
        $('#'+containerId).on(
            'dragenter',
            function(e) {
                e.preventDefault();
                $('#'+containerId).addClass('draging');
                e.stopPropagation();
            }
        ).on('drop', function(e) {
                e.preventDefault();
                $('#'+containerId).removeClass('draging');
                e.stopPropagation();
            }).on('dragleave', function(e) {
                e.preventDefault();
                $('#'+containerId).removeClass('draging');
                e.stopPropagation();
            }).on('dragover', function(e) {
                e.preventDefault();
                $('#'+containerId).addClass('draging');
                e.stopPropagation();
            });
    },

    /************************global set****************************/
    channel_global_set:function(menu){
        var pane=$("#view_channel_global_set");
        var action = {
            action: 'config.channel.getGlobalSetById',
            data: {}
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                var row = rep.row || {};
                if(row){
                    var n_html = template('view_channel_global_set',row);
                    pane.html(n_html);
                    if(row.isLeaveMsg=='1'){
                        pane.find("input[id='isLeaveMsg_y']").prop("checked",true);
                        pane.find(".leavemsg_div").show();
                        pane.find(".msg_div").hide();
                    }else{
                        pane.find("input[id='isLeaveMsg_n']").prop("checked",true);
                        pane.find(".msg_div").show();
                        pane.find(".leavemsg_div").hide();
                    }
                    if(row.chatCheck=='1'){
                        pane.find("input[id='chatCheckOn']").prop("checked",true);
                        pane.find(".chat_check").show();
                    }else{
                        pane.find("input[id='chatCheckOff']").prop("checked",true);
                    }
                    if(row.autoCloseSession == '1'){
                        pane.find("input[id='autoEndSessionOn']").prop("checked",true);
                        handler.config.channel.changeCloseSessionCheck('1',row.autoCloseSessionType);
                    }else{
                        pane.find("input[id='autoEndSessionOff']").prop("checked",true);
                    }
                    if(row.setWarnMsg=='1'){
                        pane.find("input[id='warnMsgOn']").prop("checked",true);
                        pane.find(".warn_msg_check").show();
                    }else{
                        pane.find("input[id='warnMsgOff']").prop("checked",true);
                        pane.find(".warn_msg_check").hide();
                    }
                    pane.removeClass('hidden');
                }
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    changeIsLeaveMsg:function(data,src){
        var pane=$("#view_channel_global_set");
        if(data=='1'){
            pane.find(".leavemsg_div").show();
            pane.find(".msg_div").hide();
            pane.find(".msg_div").find("textarea").val("");
        }else{
            pane.find(".msg_div").show();
            pane.find(".leavemsg_div").hide();
            pane.find(".leavemsg_div").find("textarea").val("");
        }
    },
    saveGlobalSet: function (data,src) {
        if (src.hasClass("disabled")) return false;
        var pane=$("#view_channel_global_set");
        src.addClass("disabled");
        if(data.goodNum && (data.goodNum == 0 || data.goodNum <= data.badNum)){
            $().alertmessage('showError', "优质会话的访客消息条数不能为0或者小于等于劣质会话的");
            return;
        }
        if(data.goodNum){
            data.goodNum = parseInt(data.goodNum);
            data.badNum = parseInt(data.badNum || 0);
        }
        if(data.autoCloseSessionType){
            var name_index = $("#autoCloseSessionType").get(0).selectedIndex;
            var name_pane = $("#autoCloseSessionType").find('option')[name_index];
            data.autoCloseSessionName =$(name_pane).attr('val_name');
        }
        var action = {
            action: 'config.channel.saveGlobalSet',
            data: data
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                var row =rep.row;
                pane.find("input[name='_id']").val(row._id);
                $().alertmessage('showSuccess', "设置成功");
            } else {
                $().alertmessage('showError', rep.message||errMsg);
            }
            src.removeClass("disabled");
        });
    },

    changeChatCheck: function(data, src){
        var pane=$("#view_channel_global_set");
        if(data=='0'){
            pane.find(".chat_check").hide();
        }else{
            pane.find(".chat_check").show();
        }
    },
    /* 快捷回复查询 */
    queryAllTitle:function(data,src){
        handler.config.channelDic.relActiveAdd(data,src);
        handler.config.channel.quckReplayData = 'webchat';
        var pane=$('#panel_quck_replay');
        DS.getView('config/channel/config_quickReplay_webchat', function (view) {
            pane.find('#panel_quck_replay_content').html(view);
            pane.find('#config_quck_replay').html('');
            data=data||{};
            if(src){
                data.page = src.attr("value") || 1;
            }else{
                data.page = 1;
            }
            data.moduleType='webchat';
            data.limit=handler.config.channel.pageSize;
            if(handler.config.channel.quckReplayData == 'email'){
                data.moduleType = 'email';
            }
            var action = {
                action: 'config.channel.queryAllTitle',
                data: data
            };
            DS.send(action, function (response) {
                if (response.success) {
                    pane.find('#quick_replay_import').show();
                    pane.find('#quick_replay_frm').hide();
                    pane.find('#quick_replay_back').hide();
                    pane.find('#quick_replay_table').html('');
                    pane.find('.replay_by_list').hide();
                    pane.find('.replay_lists').show();
                    pane.find('.content_lists_replay').removeClass('height');
                    pane.find('.search_quick_replay').hide();
                    pane.find('#query_by_content').val('');
                    var webchats = response.list;
                    var html='';
                    var tags='';
                    pane.find('.replay_lists').html(html);
                    for(var i=0;i<webchats.length;i++){
                        var replay=webchats[i];
                        html += '<div class="rep_li ds_do_action" name="'+replay.name+'" id="'+replay._id+'" ds_action="config.channel.queryByTitle" ><span class="li_title">'+replay.name+'</span><span class="li_num">'+replay.count+'</span></div>';
                        tags += '<li id="'+replay._id+'" name=""></li>'
                    }
                    pane.find('.replay_lists').append(html);
                    var all='<div class="rep_li_all ds_do_action" id="allTitle" ds_action="config.channel.queryByTitle" ><span class="li_title">全部</span><span class="li_num">'+response.count+'</span></div>';
                    pane.find('.replay_lists').append(all);
                }else{
                    $().alertmessage('showError',response.message|| errMsg);
                }
            });
        });

    },
    queryTagsByName:function(data,src){
        var container=$("#panel_quck_replay");
        data=data||{};
        data.tagsId = container.find('#quick_replay_dataid').attr('dataid');
        if($('#query_by_content').val()) {
            data.content = $('#query_by_content').val();
            data.tagsId = container.find('#quick_replay_dataid').attr('dataid');
            if (src) {
                data.page = src.attr("value") || 1;
            } else {
                data.page = 1;
            }
            data.limit = 5;
            var formID = "quick_tags_name_frm";
            var formDO = "config.channel.queryTagsByName";
            var _html = template('tmpl_quck_replay_turning',{formID:formID,formDO:formDO});
            $('#quick_replay_frm').html(_html);
            var action = {
                action: 'config.channel.queryQuickReplyByContent',
                data: data
            };
            DS.send(action, function (response) {
                if (response.success) {
                    container.find('#quick_replay_import').hide();
                    container.find('.replay_lists').hide();
                    container.find('.content_lists_replay').addClass('height');
                    container.find('#quick_replay_back').show();
                    container.find('#quick_replay_frm').show();
                    container.find('.replay_by_list').show();
                    //container.find('#quick_replay_table').show();
                    var replylists = response.list;
                    var html = [];
                    DS.getView('config/channel/config_quickReplay_item', function (view) {
                        for (var i = 0; i < replylists.length; i++) {
                            html.push(DS.renderMethodViewNew(view, replylists[i]));
                        }
                        if (html != '') {
                            container.find('#quick_replay_table').html(html.join(""));
                        } else {
                            container.find('#quick_replay_table').html('<tr><td colspan="5" style="text-align:center;height:58px;line-height:58px;">目前没有技能组信息！</td></tr>')
                        }
                        for (var j = 0; j < replylists.length; j++) {
                            var tags = replylists[j].tags;
                            var tags_con = container.find('#quick_replay_table').find('.quickReplay_tags');
                            for (var k = 0; k < tags.length; k++) {
                                var tag_li = '<span tagid="' + tags[k]._id + '"class="ds_do_action" ds_action="cconfig.channel.queryByTitle" name="' + tags[k].name + '">#' + tags[k].name + '</span>';
                                $(tags_con[j]).append(tag_li);
                            }
                        }
                        DS.updatePagination(formID, response.count, 5, data.page);
                    })
                } else {
                    $().alertmessage('showError', response.message || errMsg);
                }
            });
        }else{
            handler.config.channel.queryByTitle(data);
        }
    },
    editQuickReplayTag:function(){
        var availableTags = new Array();
        var tag_con=$('#panel_quck_replay').find('.replay_lists').find('.rep_li');
        for(var i=0;i<tag_con.length;i++){
            if($(tag_con[i]).attr('name')){
                availableTags[i]=$(tag_con[i]).attr('name');
            }
        }
        $( "#add_replay_label" ).autocomplete({
            source: availableTags
        });
    },
    queryByTitle:function(data,src){
        var container=$("#panel_quck_replay");
        data=data||{};
        if(src){
            data.page = src.attr("value") || 1;
        }else{
            data.page = 1;
        }
        data.limit=5;
        var parent=$(src).parent('.quickReplay_tags');
        if(parent.length){
            data.id=$(src).attr('tagid');
        }else if(data.tagsId) {
            data.id = data.tagsId;
            data.tagsId = '';
        }else{
            data.id=$(src).attr('id')?$(src).attr('id'):container.find('#quick_replay_dataid').attr('dataid');
        }
        var formID = "quick_replay_query_frm";
        var formDO = "config.channel.queryByTitle";
        var html = template('tmpl_quck_replay_turning',{formID:formID,formDO:formDO});
        $('#quick_replay_frm').html(html);
        data.moduleType = 'webchat';
        if(handler.config.channel.quckReplayData == 'email'){
            data.moduleType = 'email';
        }
        var action = {
            action: 'config.channel.queryQuickReplyByTitle',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                container.find('#quick_replay_import').hide();
                container.find('#quick_replay_dataid').attr('dataid',data.id);
                container.find('.replay_lists').hide();
                container.find('.content_lists_replay').addClass('height');
                container.find('#quick_replay_back').show();
                container.find('#quick_replay_frm').show();
                container.find('#quick_vague_frm').hide();
                container.find('.replay_by_list').show();
                container.find('.search_quick_replay').show();
                var replylists = response.list;
                var html = [];
                DS.getView('config/channel/config_quickReplay_item', function (view) {
                    for (var i = 0; i < replylists.length; i++) {
                        html.push(DS.renderMethodViewNew(view, replylists[i]));
                    }
                    if (html != '') {
                        container.find('#quick_replay_table').html(html.join(""));
                    } else {
                        container.find('#quick_replay_table').html('<tr><td colspan="5" style="text-align:center;height:58px;line-height:58px;">目前没有技能组信息！</td></tr>')
                    }
                    for (var j = 0;j < replylists.length;j++){
                        var tags=replylists[j].tags;
                        var tags_con=container.find('#quick_replay_table').find('.quickReplay_tags');
                        for(var k = 0;k<tags.length;k++){
                            var tag_li='<span tagid="'+tags[k]._id+'" class="ds_do_action" ds_action="config.channel.queryByTitle" name="'+tags[k].name+'">#'+tags[k].name+'</span>';
                            if(tags[k]._id!="001_other_tags"){
                                $(tags_con[j]).append(tag_li);
                            }
                        }
                    }
                    DS.updatePagination(formID, response.count, 5, data.page);
                })
            }else{
                $().alertmessage('showError',response.message|| errMsg);
            }
        });
    },
    quickReplayEdit:function(data,src){
        var tag_con=$(src).closest('tr').find('.quickReplay_tags').find('span');
        var tags = new Array();
        for(var i=0;i<tag_con.length;i++){
            tags[i]={id:$(tag_con[i]).attr('tagid'),name:$(tag_con[i]).attr('name')};
        }
        data.tags=tags;
        var action = {
            action: 'config.channel.queryQuickReplyById',
            data: data
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                $(src).closest("tr").addClass("active").siblings().removeClass("active");
                var quickReplay=rep.list[0];
                var pane=$('#config_quck_replay');
                DS.getView('config/channel/config_quickReplay_edit', function (view) {
                    pane.html(view);
                    pane.find('.quick_replay_con_id').attr('id','');
                    pane.find('#quick_replay_content').val(quickReplay.content);
                    pane.find('.quick_replay_con_id').attr('id',quickReplay._id);
                    for (var i=0;i<tags.length;i++){
                        handler.config.channel.saveQuickReplayTag(tags[i].name);
                    }
                    pane.find('#quick_replay_content').focus();
                });
            } else {
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    quickReplayDelete:function(data,src){
        var pane=$('#config_quck_replay');
        pane.html('');
        data.moduleType = 'webchat';
        if(handler.config.channel.quckReplayData == 'email'){
            data.moduleType='email';
        }
        var action = {
            action: 'config.channel.deleteQuickReply',
            data: data
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                $().alertmessage('showSuccess', "删除成功");
                $(src).closest('tr').empty();
                handler.config.channel.queryByTitle();
                //$('#quick_replay_btn').click();
            } else {
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    saveQuickReplay:function(){
        var container=$("#panel_quck_replay");
        var pane =container.find('.sub-right');
        var data = {};
        var tag_con=container.find('.replay_label');
        var qucik_content = $('#quick_replay_content').val()
        data.content = $.trim(qucik_content);
        if(data.content){
            var tags = new Array();
            for(var i=0;i<tag_con.length;i++){
                tags[i]={id:$(tag_con[i]).attr('id'),name:$(tag_con[i]).attr('val')};
            }
            data.tags=tags;
            data.moduleType = 'webchat';
            if(handler.config.channel.quckReplayData == 'email'){
                data.moduleType = 'email';
            }
            var action = {
                action: 'config.channel.addQuickReply',
                data: data
            };
            DS.send(action, function (rep) {
                if (rep.success) {
                    $().alertmessage('showSuccess', "保存成功");
                    pane.find('#config_quck_replay').html('');
                    $('#quick_replay_btn_box').find('span.act_two a').click();
                } else {
                    $().alertmessage('showError', rep.message||errMsg);
                }
            });
        }else{
            $().alertmessage('showError','快捷回复不能为空');
        }
    },
    quickReplayAdd:function(){
        var pane=$('#config_quck_replay');
        DS.getView('config/channel/config_quickReplay_add', function (view) {
            pane.html(view).find('#quick_replay_content').focus();
        });
    },
    saveQuickReplayTag:function(data){
        var pane=$('#add_replay_label');
        var pane_val=pane.val() ? pane.val() : data;
        if(!pane_val){
            return
        }
        pane_val = $.trim(pane_val);
        if(!pane_val){
            $().alertmessage('showError','标签名不能为空');
            return pane.val('');
        }
        var flag=false;
        var lis=pane.closest('.replay_label_lis').find('.replay_label');
        if(lis.length){
            for(var i=0;i<lis.length;i++){
                if (pane_val==$(lis[i]).attr('val')){
                    return $().alertmessage('showError','不能添加相同的标签名');
                }else{
                    flag=true;
                }
            }
        }else{
                flag=true;
        }
        if(pane_val && flag){
            var con='<div class="replay_label" id="" val="'+pane_val+'">'+pane_val+'<span class="close_replay_label" onclick="$(this).closest(\'.replay_label\').remove();"></span></div>';
            pane.closest('.add_replay_label_box').before(con);
            $(pane)[0].focus();
            pane.val('');
        }
    },
    saveEditQuickReplay:function(){
        var container=$("#panel_quck_replay");
        var pane =container.find('.sub-right');
        var data = {};
        var tag_con=container.find('.replay_label');
        var quick_content = $('#quick_replay_content').val();
        data.content = $.trim(quick_content);
        data._id=pane.find('.quick_replay_con_id').attr('id');
        var tags = new Array();
        for(var i=0;i<tag_con.length;i++){
            tags[i]={_id:$(tag_con[i]).attr('id'),name:$(tag_con[i]).attr('val')};
        }
        data.tags=tags;
        data.moduleType = 'webchat';
        if(handler.config.channel.quckReplayData == 'email'){
            data.moduleType = 'email';
        }
        if(data.content){
            var action = {
                action: 'config.channel.updateQuickReply',
                data: data
            };
            DS.send(action, function (rep) {
                if (rep.success) {
                    $().alertmessage('showSuccess', "保存成功");
                    pane.find('#config_quck_replay').html('');
                    $('#quick_replay_btn_box').find('span.act_two a').click();
                } else {
                    $().alertmessage('showError', rep.message||errMsg);
                }
            });
        }else{
            $().alertmessage('showError','快捷回复不能为空');
        }
    },
    /*导入快捷回复页面展示*/
    importQuickReplay:function(){
        var pane=$('#config_quck_replay');
        DS.getView('config/channel/config_quickReplay_import', function (view) {
            pane.html(view);
        });
    },
    /*邮件接入*/
    emailInsertSet: function () {
        var pane = $('#panel_email_insert');
        var data = data || {};
        var action = {
            action: 'config.channel.emailConfigEnter',
            data: data
        };
        DS.send(action, function (res) {
            var emailDomain = res.emailDomain;
            if (res.success) {
                var emailName = res.uname;
                var email = res.data;
                DS.getView('config/channel/config_email', function (view) {
                    view = view.replace("_#emailDomain#_", emailDomain);
                    pane.find('.span8').html(view);
                    var container = pane.find('#panel_email_insert_form');
                    emailName += "@"+emailDomain;
                    container.find('.title_email_addtess').attr('email',emailName).html(emailName);
                    var emailModel = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\n'+
                        '<html>\n'+
                        '<head>\n'+
                        '   <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />\n'+
                        '   <style type="text/css">\n'+
                        '   table td {\n'+
                        '    border-collapse: collapse;\n'+
                        '   }\n'+
                        '   </style>\n'+
                        '</head>\n'+
                        '<body style="width: 100%; margin: 0; padding: 0;">\n'+
                        '   <table border="0" style="padding: 10px ; line-height: 18px; font-family: \'Lucida Grande\',Verdana,Arial,sans-serif; font-size: 12px; color:#444444;">\n'+
                        '       <tr style="padding: 10px ; "><td>{content}</td></tr>\n'+
                        '       <br><tr style="padding: 10px ; "><td>{sign}</td></tr>\n'+
                        '       <tr style="color: #aaaaaa; margin: 10px 0 14px 0; padding-top: 10px; border-top: 1px solid #eeeeee;">\n'+
                        '          <td>{history}\n</td>'+
                        '       </tr>\n'+
                        '   </table>\n'+
                        '</body>\n'+
                        '</html>\n';
                    if (email) {
                        container.find('.email_addtess_btn').html('已开通');
                        container.find('.email_addtess_btn').attr('ds_action', '');
                        container.find('.email_sbox').find('.email_addtess_head').addClass('success');
                        container.find('.email_addtess_save').removeAttr('disabled');
                        container.find('.email_sbox').find('.add_email_adderss').removeAttr('disabled');
                        container.find('.title_email_addtess').attr('email',email.name).html(email.name);
                        var independent = email.emailRelate;
                        var peers = getCache("mailQueues");
                        var signs = getCache("emailSign") || [];
                        if (independent.length) {
                            var tmpl = '';
                            for (var i = 0; i < independent.length; i++) {
                                independent[i].peers = peers;
                                independent[i].signs = signs;
                                var item = template("tmpl_email_company_service_item", independent[i]);
                                tmpl += item;
    }
                            container.find('.Independent_email_ul').html(tmpl);
                            container.find(".Independent_email_btn b").popover();
                            container.find('.email_alone_address').find('.email_addtess_head').addClass('active');
}
                        emailModel = email.emailModel || emailModel;
                    }
                    container.find("input[name=emailModel]").val(emailModel);
                    sdkDemoEditor2.setValue(emailModel);
                    container.find('.email_templet_con').hide();
                })
            } else {
                $().alertmessage('showError', response.message || errMsg);
            }
        })
    },

    /*添加邮箱地址*/
    addIndependentEmail: function (data, src) {
        var pane = $('#panel_email_insert_form');
        var peers = getCache("mailQueues");
        var peer = "";
        if(peers && peers.length>0){
            peer = peers[0].Exten;
        }
        DS.getView('config/channel/config_email_add_postbox', function (view) {
            pane.find('.add_Independent_email').html(DS.renderViewNew(view, {peer: peer}));
            pane.find('.add_Independent_email').find('#Independent_email_form').attr('relationEmailId', '');
            if (data) {
                var con = $(src).closest('.Independent_email_li');
                //handler.config.channel.obtainEmailSkillGroup('', '', con.attr('skill'));//获取技能组
                pane.find('.add_Independent_email').find('.email_name_input').val(data);
                pane.find('.add_Independent_email').find('#Independent_email_form').attr('relationEmailId', con.attr('id'));
                pane.find('.add_Independent_email').find('.weixin_radio').attr('checked', 'true');
                pane.find('.add_Independent_email').find('.confirm').removeAttr('disabled');
            } else {
                //handler.config.channel.obtainEmailSkillGroup('', '');//获取技能组
            }
            pane.find('#Independent_email_box').modal({backdrop: 'static', keyboard: false});
        })
    },
    /*开通邮箱*/
    empowerEmail: function (data, src) {
        data = {};
        data.name = $(src).closest('.dredge_email_addtess').find('.title_email_addtess').html();
        var action = {
            action: 'config.channel.emailServerOpen',
            data: data
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                $().alertmessage('showSuccess', "开通成功");
                $(src).html('已开通');
                $(src).attr('ds_action', '');
                $(src).closest('#panel_email_insert_form').find('.email_sbox').find('.email_addtess_head').addClass('success');
                $(src).closest('#panel_email_insert_form').find('.email_addtess_save').removeAttr('disabled');
                $(src).closest('#panel_email_insert_form').find('.email_sbox').find('.add_email_adderss').removeAttr('disabled');
                //handler.config.channel.obtainEmailSkillGroup('', 'dredge');
            } else {
                $().alertmessage('showError', rep.message || errMsg);
            }
        });
    },
    /* 保存当前修改 */
    saveIndependentEmail: function (data, src) {
        data = {};
        var peers = getCache("mailQueues");
        var signs = getCache("emailSign") || [];
        var pane = $(src).closest('#Independent_email_form');
        var email = pane.find(".email_name_input").val();
        var reg = /^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/;
        if (email.trim() == "") {
            $().alertmessage('showError', '邮箱不能为空');
            pane.find(".email_name_input").focus();
            return false;
        } else if (!reg.test(email)) {
            $().alertmessage('showError', '邮箱格式不正确');
            pane.find(".email_name_input").focus();
            return false;
        } else {
            var email_li=$('#panel_email_insert_form').find('.Independent_email_ul').find('i');
            if(email_li.length){
                for(var i=0;i<email_li.length;i++){
                    var old_email=$(email_li[i]).attr('title');
                    if(email==old_email){
                        $().alertmessage('showError', '该邮箱已经被关联');
                        return false;
                    }
                }
            }
            data.relationMailId = email;//关联email的名称
            data.emailRelskillGroup = pane.find("#email_skillGroup_add").val();//关联email的技能组
            data.relationEmailArrId = pane.attr('relationEmailId');//关联email的id
            var action = {
                action: 'config.channel.addOrEditEmailConfig',
                data: data
            };
            DS.send(action, function (rep) {
                var independent = rep.data;
                var email_id = pane.attr('relationEmailId');
                if (rep.success) {
                    var tmpl = '';
                    if (email_id) {
                        pane.closest("#panel_email_insert_form").find('#' + email_id).remove();
                    }


                    independent.peers = peers;
                    independent.signs = signs;
                    var item = template("tmpl_email_company_service_item", independent);

                    pane.closest("#panel_email_insert_form").find('.Independent_email_ul').append(item);
                    //pane.closest("#panel_email_insert_form").find(".Independent_email_btn b").popover();
                    pane.closest("#panel_email_insert_form").find(".Independent_email_btn b").popover();
                    $(src).closest(".email_btn").find('.get-back').click();
                    $(src).closest('#panel_email_insert_form').find('.email_alone_address').find('.email_addtess_head').addClass('active');
                    $().alertmessage('showSuccess', rep.message);
                    // 60秒后查询数据库获取验证结果
                    function zhixing (){
                        var mail = {};
                        mail.mailId = rep.data.id;
                        mail.to = rep.data.email;
                        handler.config.channel.provingEmail(mail,$("#"+independent.id).find('.refresh_independent'));
                    }
                    setTimeout(zhixing,60000);
                } else {
                    $().alertmessage('showError', rep.message || errMsg);
                }
            });
        }
    },
    /*  重新验证邮箱*/
    afreshProving:function(data,src){
        data = {};
        data.to=$(src).closest('.Independent_email_li').attr('email');
        data.name=$(src).closest('#panel_email_insert_form').find('.title_email_addtess').attr('email');
        data.mailId= $(src).closest('.Independent_email_li').attr('id');

        //获取数据库验证结果,验证通过,不在执行邮件发送过程 modified by wangyn
        var action = {
            action: 'config.channel.checkRelationEmail',
            data: data
        };
        DS.send(action, function (rep) {
            if(rep.data=='verifyPass'){
                $(src).closest('.Independent_email_li').addClass("verifyPass");
                $(src).closest('.Independent_email_li').find(".independent_success").removeClass("hidden");
                $().alertmessage('showSuccess', '您的 '+data.to+' 邮箱关联成功');
            }else{
                //验证没有通过,发送验证邮件进行验证
                var action = {
                    action: 'config.channel.sendCheckEmail',
                    data: data
                };
                DS.send(action, function (rep) {
                    if(rep.success){
                        $().alertmessage('showSuccess', rep.message);
                        function zhixing (){
                            handler.config.channel.provingEmail(data,src);
                        }
                        var circle=setTimeout(zhixing,60000);
                    }else{
                        $().alertmessage("showError", rep.message);
                    }
                });
            }
        });
    },
    provingEmail:function(data, src){
        var action = {
            action: 'config.channel.checkRelationEmail',
            data: data
        };
        DS.send(action, function (rep) {
            if(rep.success){
                if(rep.data=='verifyPass'){
                    $(src).closest('.Independent_email_li').addClass("verifyPass");
                    $(src).closest('.Independent_email_li').find(".independent_success").removeClass("hidden");
                    $().alertmessage('showSuccess', '您的 '+data.to+' 邮箱关联成功');
                }
            } else {
                $().alertmessage('showError', rep.message || errMsg);
            }
        });
    },
    closeIndependentBox: function (data, src) {
        $(src).closest('#Independent_email_box').find('.modal-header').find('button').click();
    },
    showEmailSaveBtn: function (data, src) {
        data = {};
        if ($(src).attr('checked')) {
            $(src).closest('#Independent_email_form').find('.confirm').removeAttr('disabled');
        } else {
            $(src).closest('#Independent_email_form').find('.confirm').attr('disabled', 'disabled');
        }
    },
    deleteIndependentEmail: function (data, src) {
        if(!confirm('确认删除企业客服邮箱吗？'))return;
        data = {};
        data.delID = $(src).closest('.Independent_email_li').attr('id');
        var action = {
            action: 'config.channel.delRelationEmail',
            data: data
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                $('#email_setup_independent').empty();
                var pane = $(src).closest('.Independent_email_ul');
                $(src).closest('.Independent_email_li').remove();
                var con = pane.find('.Independent_email_li');
                if (!con.length) {
                    pane.closest('.email_alone_address').find('.email_addtess_head').removeClass('active');
                }
                $().alertmessage('showSuccess', rep.message);
            } else {
                $().alertmessage('showError', rep.message || errMsg);
            }
        });
    },
    editIndependentEmail: function (data, src) {
        var value = $(src).closest('.Independent_email_li').attr('email');
        handler.config.channel.addIndependentEmail(value, src);
    },
    /*邮件接入保存*/
    saveEmailInsert: function (data, src) {
        var pane = $('#panel_email_insert_form');
        pane.find('.email_templet_con').hide();
        var emailRelate = [];
        pane.find(".Independent_email_li").each(function(index,ele){
            var email = {};
            email.id = $(ele).attr("id");
            email.sign = $(ele).attr("sign");
            email.skillGroup = $(ele).attr("skill");
            emailRelate.push(email);
        });
        data.emailModel = sdkDemoEditor2.getValue();
        data.emailRelate = emailRelate;
        var action = {
            action: 'config.channel.saveRelationEmailConfig',
            data: data
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                $().alertmessage('showSuccess', rep.message);
            } else {
                $().alertmessage('showError', rep.message || errMsg);
            }
        });
    },
    changeEmailRelatePeer: function(src){
        var span = $(src).closest(".Independent_email_li");
        var skillGroup = $(src).val();

        var action = {
            action: 'config.channel.updateEmailRelateConfig',
            data: {skillGroup: skillGroup, id:span.attr("id")}
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                $().alertmessage('showSuccess', "更改技能组成功");
                span.attr("skill", skillGroup);
            } else {
                $().alertmessage('showError', rep.message || errMsg);
            }
        });
    },
    changeEmailRelateSign: function(src){
        var span = $(src).closest(".Independent_email_li");
        var sign = $(src).val();

        var action = {
            action: 'config.channel.updateEmailRelateConfig',
            data: {sign: sign, id:span.attr("id")}
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                $().alertmessage('showSuccess', "更改邮件签名成功");
                span.attr("sign", sign);
            } else {
                $().alertmessage('showError', rep.message || errMsg);
            }
        });
    },
    showEmailIdiograph:function(data,src){
        handler.config.channelDic.relActiveAdd(data,src);
        DS.getView('config/channelDic/email_idiograph', function (view) {
            var pane = $('#config_channel_idiograph_pane');
            pane.html(view);
            handler.config.channel.queryMailSignature()
        })
    },
    queryMailSignature:function(data,src){
        var container = $("#view_config_channel");
        data = data || {};
        if (src) {
            data.page = src.attr("value") || 1;
        } else {
            data.page = 1;
        }
        data.limit = handler.config.channel.pageSize;
        var formID = "mail_signature_query_frm";
        var action = {
            action: 'config.channel.querySignList',
            data: data
        };
        DS.send(action, function (response) {
        /*var response={  count: 2,
                        list: [{    ToPeer: "10000140",
                                    _id: "69ca96e0-6292-11e5-856c-2f30428d83f2",
                                    mailName: "tntkaka2@163.com"
                                   },
                                {   ToPeer: "10000140",
                                    _id: "69ca96e0-6292-11e5-856c-2f30428d83f2",
                                    mailName: "tntkaka2@163.com"
                                    }
                        ],
                        message: "200 ok!",
                        success: true}*/
            if (response.success) {
                var emails = response.list;
                var html = [];
                var view=$('#tmpl_email_idiograph').html();
                for (var i = 0; i < emails.length; i++) {
                    var email = emails[i];
                    html.push(DS.renderMethodViewNew(view, email));
                }
                container.find('#mail_signature_pane').html(html.join(""));
                DS.updatePagination(formID, response.count, handler.config.channel.pageSize, data.page);
            } else {
                $().alertmessage('showError', response.message || errMsg);
            }
        });
    },
    showMailSignatureAdd:function(){
        var container = $("#view_config_channel");
        var panel = container.find("#config_mail_idiograph_container");
        DS.getView('config/channel/config_mail_idiograph_add', function (view) {
            var pane = container.find("#config_mail_idiograph_container");
            pane.empty();
            pane.html(view);
        });
    },
    saveIdiograph:function(data){
        var container = $("#view_config_channel");
        var pane = container.find('#config_mail_idiograph_container');
        data.content= handler.config.channel.emailIdiograph.html();
        if(data.content){
            data.content.replace(/\r\n/g,"\r").replace(/\r/g,"\r\n");
        }
        var action = {
            action: "config.channel.saveEmailSign",
            data: data
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                $().alertmessage('showSuccess', "增加邮件签名成功");
                pane.empty();
                handler.config.channel.queryMailSignature();
                getCache("emailSign", null ,true)
            } else {
                $().alertmessage('showError', rep.message || errMsg);
            }
        })
    },
    updateIdiograph:function(data,src){
        var container = $("#view_config_channel");
        var panel = container.find("#config_mail_idiograph_container");
        data.content= handler.config.channel.emailIdiograph.html();
        var action = {
            action: "config.channel.updateEmailSign",
            data: data
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                $().alertmessage('showSuccess', "设置邮件签名成功！");
                $(src).closest('#config_channel_idiograph_pane').find('.refresh')[0].click();
                panel.empty();
                getCache("emailSign", null ,true)
            } else {
                $().alertmessage('showError', rep.message || errMsg);
            }
        })
    },
    showUpdateMailSignature:function(data,src){
        var container = $("#view_config_channel");
        var panel = container.find("#config_mail_idiograph_container");
        var action = {
            action: 'config.channel.getSignById',
            data: {_id: data._id}
        };
        DS.send(action, function (response) {
            if (response.success) {
                var mailSign = response.data;
                var html = [];
                $(src).closest("tr").addClass("active").siblings().removeClass("active");
                DS.getView('config/channel/config_mail_idiograpg_edit', function (view) {
                    html.push(DS.renderMethodViewNew(view, mailSign));
                    panel.empty();
                    panel.html(html.join(""));
                    var con=mailSign.content;
                    handler.config.channel.emailIdiograph.html(con);
                });
            } else {
                $().alertmessage('showError', response.message || errMsg);
            }
        });
    },
    delMailSignature: function (data,src) {
        var con = confirm("确定要删除该签名吗？");
        if (!con) {
            return false;
        }
        var action = {
            action: 'config.channel.deleteEmailSign',
            data: {_id: data._id}
        };
        var container = $("#view_config_channel");
        var pane = container.find('#config_mail_idiograph_container');
        DS.send(action, function (response) {
            if (response.success) {
                removeCache("emailSign",data._id);
                $().alertmessage('showSuccess', "删除成功");
                pane.empty();
                handler.config.channel.queryMailSignature();
            } else {
                $().alertmessage('showError', errMsg);
            }
        });
    },
    showEmailTemplet:function(data,src){
        src.closest('.email_templet').find('.email_templet_con').show();
    },
    quickReplayWebchat:function(data,src){
        var _html = $('#panel_quck_replay_content').text();
        if(_html != ''){
            return;
        }
        handler.config.channel.queryAllTitle(data,src);
    },
    quickReplayEmail:function(data,src){
        handler.config.channelDic.relActiveAdd(data,src);
        handler.config.channel.quckReplayData = 'email';
        DS.getView('config/channel/config_qucikReplay_email', function (view) {
            var pane=$('#panel_quck_replay');
            pane.find('#panel_quck_replay_content').html(view);
            pane.find('#config_quck_replay').html('');
            data=data||{};
            if(src){
                data.page = src.attr("value") || 1;
            }else{
                data.page = 1;
            }
            data.limit=handler.config.channel.pageSize;
            data.moduleType = 'email';
            var action = {
                action: 'config.channel.queryAllTitle',
                data: data
            };
            DS.send(action, function (response) {
                if (response.success) {
                    pane.find('#quick_replay_import').show();
                    pane.find('#quick_replay_frm').hide();
                    pane.find('#quick_replay_back').hide();
                    pane.find('#quick_replay_table').html('');
                    pane.find('.replay_by_list').hide();
                    pane.find('.replay_lists').show();
                    pane.find('.content_lists_replay').removeClass('height');
                    pane.find('.search_quick_replay').hide();
                    pane.find('#query_by_content').val('');
                    var webchats = response.list;
                    var html='';
                    var tags='';
                    pane.find('.replay_lists').html(html);
                    for(var i=0;i<webchats.length;i++){
                        var replay=webchats[i];
                        html += '<div class="rep_li ds_do_action" name="'+replay.name+'" id="'+replay._id+'" ds_action="config.channel.queryByTitle" ><span class="li_title">'+replay.name+'</span><span class="li_num">'+replay.count+'</span></div>';
                        tags += '<li id="'+replay._id+'" name=""></li>'
                    }
                    pane.find('.replay_lists').append(html);
                    var all='<div class="rep_li_all ds_do_action" id="allTitle" ds_action="config.channel.queryByTitle" ><span class="li_title">全部</span><span class="li_num">'+response.count+'</span></div>';
                    pane.find('.replay_lists').append(all);
                }else{
                    $().alertmessage('showError',response.message|| errMsg);
                }
            });
        })
    },
    quickReplayAddEmail:function(){
        var pane=$('#config_quck_replay');
        DS.getView('config/channel/config_quickReplay_add', function (view) {
            pane.html(view).find('#quick_replay_content').focus();
        });
    },
    changeCloseSessionCheck:function(data,type){
        var pane=$("#view_channel_global_set");
        if(data == 1){
            handler.config.channel.showCloseSessionCheck(type);
        }else{
            pane.find('.close_session_check').hide();
        }
    },
    changeWarnMsgCheck:function(data,src){
        var pane=$("#view_channel_global_set");
            if(data=='1'){
               pane.find(".warn_msg_check").show();
            }else{
                pane.find(".warn_msg_check").hide();
            }
    },
    showCloseSessionCheck:function(key){
        var pane=$("#view_channel_global_set");
        var dics=getCache('channelDic');
        var n_dics=[];
        for (var i = 0; i < dics.length; i++) {
            var obj = dics[i];
            if(obj.type=="webchat"){
                n_dics=obj.options||[];
                break;
            }
        }
        if(n_dics.length==0){
            $().alertmessage('showError', "请通知管理员设置‘在线咨询结束会话类别’");
            pane.find("input[id='autoEndSessionOff']").prop("checked",true);
            return;
        }
        console.log(n_dics);
        var html_opt = '';
        var seleted = '';
        for(var a=0;a<n_dics.length;a++){
            var one_name = n_dics[a].name;
            var one_option = n_dics[a].options || [];
            if(one_option.length){
                var two = n_dics[a].options;
                for(var b=0;b<two.length;b++){
                    var two_name = two[b].name;
                    var twp_option = two[b].options || [];
                    if(twp_option.length){
                        var three = two[b].options;
                        for(var c=0;c<three.length;c++){
                            var three_name = three[c].name;
                            if(key == three[c].key){
                                seleted = "selected='selected'";
                            }else{
                                seleted = "";
                            }
                            html_opt += "<option value='"+three[c].key+"' "+seleted+" val_name='"+three_name+"'>"+one_name+"—>"+two_name+"—>"+three_name+"</option>";
                        }
                    }else{
                        if(key == two[b].key){
                            seleted = "selected='selected'";
                        }else{
                            seleted = "";
                        }
                        html_opt += "<option value='"+two[b].key+"' "+seleted+" val_name='"+two_name+"'>"+one_name+"—>"+two_name+"</option>";
                    }
                }
            }else{
                if(key == n_dics[a].key){
                    seleted = "selected='selected'";
                }else{
                    seleted = "";
                }
                html_opt += "<option value='"+n_dics[a].key+"' "+seleted+" val_name='"+one_name+"'>"+one_name+"</option>";
            }
        }
        $('#autoCloseSessionType').html(html_opt);
        pane.find('.close_session_check').show();
    },
    showEmailCategory:function(data,src){
        var content = $('#email_setup_independent');
        var email = $(src).closest('.Independent_email_li').attr('email') || content.find('input[name="email"]').val();
        var relateMailId = $(src).closest('.Independent_email_li').attr('id') || content.find('input[name="sendMailId"]').val();
        var n_data = {};
        n_data.relateMailId =relateMailId;
        if(src){
            n_data.page = src.attr("value") || 1;
        }else{
            n_data.page = 1;
        }
        n_data.limit=handler.config.channel.pageSize;//10
        n_data.email = email;
        var formID = "email_setup_independent_frm";
        var action = {
            action: 'config.channel.showMailCategory',
            data: n_data
        };
        DS.send(action,function(rep){
            if(rep.success){
                var list = rep.list;
                var _html = '';
                if(list.length){
                    for(var i=0;i<list.length;i++){
                        var lis = list[i];
                        lis.relateMailId = relateMailId;
                        lis.relateMailAddr = email;
                        _html += template('tmpl_email_setup_list',lis);
                    }
                }else{
                    _html = '<tr><td colspan="5" style="text-align: center;">当前没有分类</td></tr>';
                }
                var data_new = {
                    relateMailAddr:email,
                    relateMailId:relateMailId
                };
                var item = template('tmpl_email_setup_independent', data_new);
                content.html(item);
                content.find('.setup_independent_tbody').html(_html);
                DS.updatePagination(formID, rep.count, handler.config.channel.pageSize, n_data.page);
            }else{
                $().alertmessage('showError',rep.message|| errMsg);
            }
        })
    },
    showEmailIndependentAdd:function(data,src){
        var relateMailAddr = $(src).attr('relateMailAddr');
        var _data = {
            "categoryId":"",
            "relateMailId":data,
            "relateMailAddr":relateMailAddr,
            "categoryName":""
        }
        var pane = $('#modal_email_setup_box');
        pane.html(template('tmpl_email_setup_box_modal',_data));
        pane.find('.email_satisfy_condition').html($("#tmpl_email_setup_box_li_new").html());
        pane.find('.icon-minus:last').removeClass('icon-minus').addClass('icon-plus');
        pane.modal();
    },
    emailRuleSetLiAdd:function(data,src){
        if($(src).hasClass('icon-plus')){
            $(src).removeClass('icon-plus').addClass('icon-minus');
            var pane = $(src).closest('ul');
            var html = $("#tmpl_email_setup_box_li_new").html();
            pane.append(html);
        }else{
            $(src).closest('li').remove();
        }
    },
    saveEmailSetCategory:function(data,src){
        var rules = new Array();
        for(var i=0;i<data.name.length;i++){
            var rul = {
                name:data.name[i],
                type:data.type[i],
                content:data.content[i]
            }
            rules.push(rul);
        }
        var n_data = {
            categoryId:data.categoryId,
            relateMailId:data.relateMailId,
            relateMailAddr:data.relateMailAddr,
            categoryName:data.categoryName,
            rulesType:data.rulesType,
            rules:rules
        };
        var action = {
            action : "config.channel.saveAndUpdateMailCategory",
            data: n_data
        };
        DS.send(action,function(rep){
            if(rep.success){
                $('#modal_email_setup_box').modal('hide');
                var n_src = $("#"+data.relateMailId).find('.setup_independent_btn');
                handler.config.channel.showEmailCategory(n_src.attr('ds_data'),n_src);
                $().alertmessage('showSuccess', "保存成功");
            }else if(rep.duplication){
                $(src).closest('form').find('input[name="categoryName"]').val('').focus();
                $().alertmessage('showError',rep.message||errMsg);
            }else{
                $().alertmessage('showError',rep.message||errMsg);
            }
        })
    },
    showEmailIndependentMdoify:function(data,src){
        var action = {
            action : "config.channel.editMailCategory",
            data : {
                "categoryId" : data.categoryId
            }
        }
        DS.send(action,function(rep){
            if(rep.success){
                $(src).closest("tr").addClass("active").siblings().removeClass("active");
                data.categoryName = rep.categoryName;
                data.rulesType = rep.rulesType;
                var pane = $('#modal_email_setup_box');
                pane.html(template('tmpl_email_setup_box_modal',data));
                var _html = '';
                for(var i=0;i<rep.list.length;i++){
                    var lis = rep.list[i];
                    _html += template('tmpl_email_setup_box_li',lis);
                }
                pane.find('.email_satisfy_condition').html(_html);
                pane.find('.icon-minus:last').removeClass('icon-minus').addClass('icon-plus');
                pane.modal();
            }else{
                $().alertmessage('showError',rep.message||errMsg);
            }
        })

    },
    deleteEmailIndependent:function(data,src){
        var con = confirm("确定要删除该邮件分类吗？");
        if (!con) {
            return false;
        }
        var action = {
            action : 'config.channel.deleteMailCategory',
            data : {
                "categoryId" : data.categoryId
            }
        }
        DS.send(action,function(rep){
            if(rep.success){
                var _id = $(src).closest('form').find('input[name="relateMailId"]').val();
                var pane = $("#"+_id);
                pane.find('.setup_independent_btn').click();
            }else{
                $().alertmessage('showError',rep.message||errMsg);
            }
        })
    }

}
