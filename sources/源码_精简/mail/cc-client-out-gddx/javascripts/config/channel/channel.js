/**
 * Created by wangwh on 2015/4/27.
 */
handler.config.channel = {
    pageSize: 10,
    emailReg: /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/,
    phoneReg:/((\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$)/,
    wechatUrl:"",
    config_channel:function (id) {
        var pane=$("#view_config_channel");
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
    showEmailQueueAdd: function (data) {
        var container=$("#view_config_channel");
        DS.getView('config/channel/config_email_queue_add', function (view) {
            var pane = container.find("#config_email_queue_container");
            pane.empty();
            pane.html(view);
            handler.config.channel.renderMailQueueAgentAssign();
            $(".show_result ul").html("");
        });
        var rHeight = $(".left_col").height() - 80;
        $("#config_email_queue_container").css("height",rHeight);
    },
    renderMailQueueAgentAssign: function () {
        var agentArr = getCache("agents");
        var allHtml = [];
        var allHtmlResult = [];
        var agent = null;
        var tempHtml = null;
        var tempHtmlResult = null;
        for (var i= 0,len=agentArr.length;i<len;i++) {
            tempHtml = allHtml;
            tempHtmlResult = allHtmlResult;
            agent = agentArr[i];
            if (agent.displayName) {
            };
            if (agent.status && agent.status == 'enable'){
                tempHtml.push('<li class="not_select"><span class="set_name" id="');
                tempHtml.push(agent._id);
                tempHtml.push('_show">')
                tempHtml.push(agent.displayName+'-');
                tempHtml.push(agent.exten);
                tempHtml.push('</span><span class="set_add" ds_action="config.channel.addAgentAssign" ds_data="config_email_agent_add">');
                tempHtml.push(agent._id);
                tempHtml.push('</span></li>');


                tempHtmlResult.push('<li><span class="set_name" id="queue_agent_');
                tempHtmlResult.push(agent._id);
                tempHtmlResult.push('">')
                tempHtmlResult.push(agent.displayName+'-');
                tempHtmlResult.push(agent.exten);
                tempHtmlResult.push('</span>');
                tempHtmlResult.push('<label ds_action="config.channel.deleteAgentAssign" name="');
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
            $("#agentAssignTable > ul").html(allHtml.join(''));
        }else {
            $("#agentAssignTable").css('display', 'none');
        }
        if (allHtmlResult.length > 0) {
            $("#agentAssignResult > ul").html(allHtmlResult.join(''));
        }
        $('#agentAssignAutoComplete').bind('keyup', function(){
            if (this.value) {
                var searchAgent = this.value;
                var allAgentDom = $("#agentAssignTable");
                var noSelectAgentArr = allAgentDom.find(".not_select").find(".set_name");
                if (searchAgent) {
                    for (var i = 0; i < noSelectAgentArr.length; i++) {
                      noSelectText = noSelectAgentArr[i].innerText;
                      if (noSelectText.indexOf(searchAgent)>=0) {
                        allAgentDom.find(".not_select").eq(i).show();
                      }else{
                        allAgentDom.find(".not_select").eq(i).hide();
                      }
                    };
                }

            }else{
                $(".not_select").show();
            }
        });
        // var agentNameArr = agentArr.map(function(item){
        //     return item.displayName + "-" + item.exten;
        // });
        // $('#agentAssignAutoComplete').bind('keyup', function(){
        //     if (event.keyCode == 13) {
        //         if (this.value) {
        //             var agentExten = this.value.substring(this.value.indexOf('[') + 1, this.value.indexOf(']'));
        //             if (agentExten) {
        //                 var searchAgent = getCacheByKey('agents', 'exten', agentExten);
        //                 if (searchAgent) {
        //                     $('#locationAgentHref').attr('href', '#queue_agent_' + searchAgent._id);
        //                     $('#locationAgentHref').get(0).click();
        //                     $('#queue_agent_' + searchAgent._id).get(0).click();
        //                 }
        //             }

        //         }
        //     }
        // });
        // $('#agentAssignAutoComplete').typeahead({
        //     source: agentNameArr
        // });
    },
    deleteAgentAssign: function (src) {
        agentID = src.attr('name');
        src.parent().remove();
        $('#'+agentID).closest("li").addClass("not_select").show();
        $("#agentAssignAutoComplete").val("");
        $("#agentAssignTable").find(".not_select").show();
    },
    addAgentAssign: function (src) {
        var container=$(".show_result");
        agentID = src.text();
        agentName = src.siblings(".set_name").text();
        src.parent().removeClass("not_select").hide();
        agentNum = container.find("li").length+1;//取值的时候最新的一条还没插入
        liHeight = container.find("li").height();
        scrollHeight = liHeight * agentNum;
        agents ={
            agentID: agentID,
            agentName: agentName
        }
        DS.getView('config/channel/config_email_agent_add', function (view) {
            container.find('ul').append(DS.renderMethodViewNew(view,agents));
        });
        container.scrollTop(scrollHeight);
        if (src.parent().siblings("li:visible").length==0) {
        $("#agentAssignAutoComplete").val("");
        $("#agentAssignTable").find(".not_select").show();
    }
    },
    saveEmailQueue: function (data) {
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
            proiority = "0";
            assignedArr.push(agentID + ':' + proiority);
        }
        var sendData = {};
        sendData.MemberToken = JSON.stringify(assignedArr);

        sendData.DisplayName = data.DisplayName;
        sendData.Exten = data.Exten;
        sendData.Timeout = data.Timeout;
        sendData.WaitCount = data.WaitCount;
        sendData.Joinempty = data.Joinempty;
        sendData.Strategy = data.Strategy;
        sendData.ToPeerWhenQueueEmpty = data.ToPeerWhenQueueEmpty;
        if('id' in data){
            sendData.id = data.id;
        }
        var container=$("#view_config_channel");
        var pane =container.find('#config_email_queue_container');
        var action = {
            action: "config.channel.addOrUpdateEmailQueue",
            data: sendData
        };
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
        })
    },
    queryEmailQueueList: function (data, src) {
        var container=$("#view_config_channel");
        data=data||{};
        if(src){
            data.page = src.attr("value") || 1;
        }else{
            data.page = 1;
        }
        data.limit=handler.config.channel.pageSize;
        var formID = "email_queue_query_frm";
        var action = {
            action: 'config.channel.queryEmailQueue',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var emailQueues = response.list;
                var html = [];
                DS.getView('config/channel/config_email_queue_item', function (view) {
                    for (var i = 0; i < emailQueues.length; i++) {
                        html.push(DS.renderMethodViewNew(view,emailQueues[i]));
                    }
                    if (html!='') {
                    container.find('#email_queue_list_pane').html(html.join(""));
                }else{
                    container.find('#email_queue_list_pane').html('<tr><td colspan="5" style="text-align:center;height:58px;line-height:58px;">目前没有技能组信息！</td></tr>')
                }
                    DS.updatePagination(formID, response.count, handler.config.channel.pageSize, data.page);
                });
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

                    handler.config.channel.renderMailQueueAgentAssign();
                    var members = mailQueue.AssignMembers;
                    if (members && members.length > 0) {
                        var member = null, arr = null;
                        for (var ind in members) {
                            member = members[ind];
                            $('#' + member.agentID + '_assignment').attr('checked', 'true').parent().parent().show();
                            $('#' + member.agentID + '_priority').val(member.penalty);
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
                var html = [];
                DS.getView('config/channel/config_webchat_item', function (view) {
                    for (var i = 0; i < webchats.length; i++) {
                        var webchat = webchats[i];
                        webchat.webchatUrl = webchatUrl;
                        var accessId = webchat.accessId;
                        var embedScript = "<script type=\"text/javascript\" src=\"" + webchatUrl + "/javascripts/7moorInit.js?accessId=" + accessId + "\"></script>";
                        webchat.embedScript = embedScript;
                        html.push(DS.renderMethodViewNew(view,webchat));
                    }
                    container.find('#webchat_list_pane').html(html.join(""));
                    DS.updatePagination(formID, response.count, handler.config.channel.pageSize, data.page);
                });
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
            $("input").prop("checked",true);
        }else{
            $("input").prop("checked",false);
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
        var con = confirm("确定要删除该微信接入号吗？");
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
            uptoken_url: '/action?action=app.weixin.getUptoken&data={}&sessionId=' + session.id,
            domain: "http://7xj0za.com1.z0.glb.clouddn.com/",
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
                    pane.closest(".right_content_pane").find("#webchat_preview_logo").attr("src","http://7xj0za.com1.z0.glb.clouddn.com/"+logo.val());
                    pane.closest(".right_content_pane").find("#webchat_preview_logoB").attr("src","http://7xj0za.com1.z0.glb.clouddn.com/"+logo.val());
                    pane.closest(".right_content_pane").find("#webchat_preview_logoA").attr("href","http://7xj0za.com1.z0.glb.clouddn.com/"+logo.val());

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
                var html = [];
                DS.getView('config/channel/config_mobileSdk_item', function (view) {
                    for (var i = 0; i < webchats.length; i++) {
                        var webchat = webchats[i];
                        html.push(DS.renderMethodViewNew(view,webchat));
                    }
                    container.find('#Mobilesdk_list_pane').html(html.join(""));
                    DS.updatePagination(formID, response.count, handler.config.channel.pageSize, data.page);
                });
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
        $(src).closest("tr").addClass("active").siblings().removeClass("active");
        if( "string" == typeof data){
            accessId = data;
        }else{
            accessId = data.accessId;
        }
        var html = template("tmpl_mobilesdk_config_instruction", {accessId:accessId});
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
        var new_src=handler.config.channel.wechatUrl + "/?account=" + session.user.account;
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
                handler.config.channel.wechatUrl = response.wechatUrl;
                var wechatList = response.list;
                var lis = "";
                if (wechatList) {
                    for (var i=0;i<wechatList.length;i++ ){
                        var wechat=wechatList[i];
                        lis += '<li class="text-overflow workbench_li"><a href="#' + wechat._id + '"index="'+i+'" class="ds_do_action" ds_action="config.channel.showWeixinInfo">' + wechatList[i].nick_name + '</a></li>';
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
                        var i=$(src).attr('index');
                        var wechat=wechatList[i];
                        handler.config.channel.wechatUrl = response.wechatUrl;
                        var realView = DS.renderMethodViewNew(view, wechat);
                        weixinInfo.html(realView);
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
                                optionsHtml += '<option selected="selected" value="' + mailQueues[m].Exten + '">' + mailQueues[m].DisplayName + '</option>';
                                selected = true;
                            }else{
                                optionsHtml += '<option value="' + mailQueues[m].Exten + '">' + mailQueues[m].DisplayName + '</option>';
                            }
                        }
                        $('#wechat_topeer').html(optionsHtml);
                        if(!selected){
                            $('#wechat_topeer').css("border", "2px #fa5f5f solid");
                            $(".peer-tips").html("请务必选择技能组后保存");
                        }else{
                            $(".peer-tips").html("");
                        }
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

        data.robot = false; //智能机器人暂不开放
        var action = {
            action : "config.channel.updateWechat",
            data: data
        }
        DS.send(action, function(response){
            if(response.success){
                $().alertmessage("showSuccess", "保存数据成功");
                handler.config.channelDic.addNewWebchatDic();
            }else{
                $().alertmessage("showError", "保存数据失败");
            }
        });
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
                        menu_url: "http://",
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
                                subHtml += '<span class="weixin-sub-menu active ds_do_action" ds_action="config.channel.showWeixinMenuSub" id="subMenu_'+(i+1)+'_'+(j+2)+'">' + sub.name + '</span>';
                                var menu_id = 'subMenu_'+(i+1)+'_'+(j+2);
                                var menu_sets ={
                                    menu_id: menu_id,
                                    menu_name: sub.name,
                                    menu_level: "子菜单",
                                    menu_namelimet: "字数不超过8个汉字或16个字母",
                                    menu_type: sub.type,
                                    menu_key: sub.key,
                                    menu_url: sub.url,
                                    menu_class: "sub-menu"
                                };
                                DS.getView('config/channel/config_weixin_menu_set', function (view) {
                                    $("#weixin-all-menu").find(".form-btn-center").before(DS.renderMethodViewNew(view,menu_sets));
                                    if(menu_sets.menu_type == "click") {
                                        $("#"+menu_sets.menu_id+"_set .menu_type label").eq(0).find("input").click();
                                    }else if(menu_sets.menu_type == "view") {
                                        $("#"+menu_sets.menu_id+"_set .menu_type label").eq(1).find("input").click();
                                    };
                                });
                            });
                        }
                        var menu_id = 'subMenu_'+(i+1)+'_1';
                        var menu_sets ={
                            menu_id: menu_id,
                            menu_name: val.name,
                            menu_level: "主菜单",
                            menu_namelimet: "字数不超过4个汉字或8个字母",
                            menu_type: val.type,
                            menu_key: val.key,
                            menu_url: val.url,
                            menu_class: "main-menu"
                        };
                        tempHtml +='<li><p>' + subHtml + '<span class="add-sub-menu ds_do_action" ds_action="config.channel.addWeixinMenuSub"></span><b></b></p><span class="weixin-main-menu ds_do_action" ds_action="config.channel.showWeixinMenuMain" id="subMenu_'+(i+1)+'_1">' + val.name + '</span></li>';
                        DS.getView('config/channel/config_weixin_menu_set', function (view) {
                            $("#weixin-all-menu").find(".form-btn-center").before(DS.renderMethodViewNew(view,menu_sets));
                            if(menu_sets.menu_type == "click") {
                                $("#"+menu_sets.menu_id+"_set .menu_type label").eq(0).find("input").click();
                            }else if(menu_sets.menu_type == "view"){
                                $("#"+menu_sets.menu_id+"_set .menu_type label").eq(1).find("input").click();
                            };
                        if (val.sub_button) {
                            $("#subMenu_"+(i+1)+"_1_set").find(".row_item").eq(2).hide().siblings(".webchat-menudetails").hide().find("textarea").removeAttr("required").end().siblings("span").hide();
                            if ($(".weixin-config-showbottom").find("li").length>1) {
                                $(".weixin-config-showbottom").find("li").eq(0).find(".weixin-main-menu").click();
                            }
                        }
                        });   
                    });
                    if (buttonArr.button.length<3) {
                        container.find(".weixin-config-showbottom").html(tempHtml+'<li class="null"><span style="background:none" class="weixin-main-menu ds_do_action" ds_action="config.channel.addWeixinMenuMain"></span></li>');
                        if ($(".weixin-config-showbottom").find("li").length>1) {
                        $(".weixin-config-showbottom").find("li").eq(0).find(".weixin-main-menu").click();
                        }
                    }else{
                        container.find(".weixin-config-showbottom").html(tempHtml);
                        if ($(".weixin-config-showbottom").find("li").length>1) {
                        $(".weixin-config-showbottom").find("li").eq(0).find(".weixin-main-menu").click();
                        }
                    }
                });

            }else{
                $().alertmessage('showError', response.message||errMsg);
                if ($(".weixin-config-show").length==0) {
                    src.show();
                }
            }

        });
    },
    createMenu:function(data){
        var appid = data.weixin_id;
        var events = new Array();
        var menus = {};
        var buttonArray = new Array();
        var buttons = $('.main-menu');
        $.each(buttons,function(i,val){//遍历一级菜单
            var buttonName = $(val).find('[name="menu_name"]').val();
            var butId = $(val).attr('id').substr(0,9);
            var sub_button = $("[id^='"+butId+"'].sub-menu");
            if(sub_button.length>0){
                var subbuttonArray = new Array();
                $.each(sub_button,function(j,doc) {//遍历二级菜单
                    var subbuttonName = $(doc).find('[name="menu_name"]').val();
                    var subbuttonType = $(doc).find('.weixin_radio:checked').val();
                    if (subbuttonType == '0') {
                        var subbuttonContent = $(doc).find('[name="content"]').val();
                        var uid = uuid.v1();
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
                    } else {
                        var url = $(doc).find('[name="wechat_menuUrl"]').val();
                        subbuttonArray[j] = {
                            "type": 'view',
                            "name": subbuttonName,
                            "url": url
                        }
                    }
                });
                buttonArray[i] = {
                    "name":buttonName,
                    "sub_button":subbuttonArray
                }
            }else {
                var buttonType = $(val).find('.weixin_radio:checked').val();
                if (buttonType == '0') {
                    var buttonContent = $(val).find('[name="content"]').val();
                    var uid = uuid.v4();
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
                } else if (buttonType == '1') {
                    var url = $(val).find('[name="wechat_menuUrl"]').val();
                    buttonArray[i] = {
                        "type": 'view',
                        "name": buttonName,
                        "url": url
                    }
                }
            }
        });
        menus.button = buttonArray;
        var action = {
            action: 'config.channel.createWeixinMenu',
            data: {_id: appid,menus: menus,events:events}
        };
        console.log(events);
        DS.send(action, function (response) {
            if (response.success) {
                $().alertmessage("showSuccess", "发布成功");
                handler.config.channel.getMenu({_id:appid});
            }else{
                $().alertmessage('showError', response.message||errMsg);
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
            menu_url: "http://",
            menu_class: "main-menu"
        }
        if (buttonNum==1) {//一个主菜单都没有
            var newButtonId = menu_sets.menu_id = "subMenu_1_1";
        }else{//至少有一个主菜单
            var LastButtonId = pane.parent().find("li").eq(buttonNum-2).find(".weixin-main-menu").attr("id").substr(8,2);
            var tempNum = parseInt(LastButtonId)+1;
            var newButtonId = menu_sets.menu_id = "subMenu_"+tempNum+"_1";
        }
        pane.removeClass("null").html('<span id="'+newButtonId+'" class="weixin-main-menu ds_do_action" ds_action="config.channel.showWeixinMenuMain">菜单名称</span><p><span class="add-sub-menu ds_do_action" ds_action="config.channel.addWeixinMenuSub"></span><b></b></p>');
        DS.getView('config/channel/config_weixin_menu_set', function (view) {
            $("#weixin-all-menu").find(".form-btn-center").before(DS.renderMethodViewNew(view,menu_sets));
            if(menu_sets.menu_type == "click") {
                $("#"+newButtonId+"_set .menu_type label").eq(0).find("input").click();
            }else if(menu_sets.menu_type == "view"){
                $("#"+newButtonId+"_set .menu_type label").eq(1).find("input").click();
            };
        });
        if ( buttonNum<3 && addButton==1) {
            pane.parent().append('<li class="null"><span style="background:none" class="weixin-main-menu ds_do_action" ds_action="config.channel.addWeixinMenuMain"></span></li>');
        }
        $("#"+newButtonId).click();
        $("#delete_menu").val(newButtonId);

    },
    showWeixinMenuMain:function(data,src){
        var subNum = src.find("p");
        var pane = src.parent("li");
        var menu_id = src.attr("id");
        var setObj = $("#"+menu_id+"_set");
        if (subNum) {
            pane.addClass("active").find("p").addClass("active").find("span").removeClass("active");
            pane.siblings().removeClass("active").find(".active").removeClass("active");
        }
        $("#delete_menu").val(menu_id).attr("ds_action","config.channel.deleteWeixinMenuConfirmDialog");
        $(setObj).show().siblings(".single-menu").hide();
    },
    addWeixinMenuSub:function(data,src){
        var menu_sets ={
            menu_id: "subMenu_",
            menu_level: "子菜单",
            menu_name: "子菜单名称",
            menu_namelimet: "字数不超过8个汉字或16个字母",
            menu_type: "click",
            menu_key: "",
            menu_url: "http://",
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
        src.before('<span id="'+newButtonId+'" class="weixin-sub-menu ds_do_action" ds_action="config.channel.showWeixinMenuSub">子菜单名称</span>');
        $("#"+newButtonId).click();
        $("#subMenu_" + MainNum + "_1_set").find(".row_item").eq(2).hide().siblings(".webchat-menudetails").hide().find("[required]").removeAttr("required").end().siblings("span").hide();
        $("#delete_menu").val(newButtonId);
    },
    showWeixinMenuSub:function(data,src){
        var menu_id = src.attr("id");
        var setObj = $("#"+menu_id+"_set");
        src.addClass("active").siblings().removeClass("active").parents("li").removeClass("active");
        $("#delete_menu").val(menu_id).attr("ds_action","config.channel.deleteWeixinMenu");
        $(setObj).show().siblings(".single-menu").hide();
    },
    deleteWeixinMenuConfirmDialog:function(data,src){
        var menuId = src.val();
        var menuIdIndex = menuId.lastIndexOf('_')+1;
        var menuObj = $("#" + menuId + "_set");
        var menuName = menuObj.find(".weixin-menu-name").text();
        var data = {
            confirmDesc : "确定要删除菜单 '"+menuName+"' 吗？",
            confirmAction : "config.channel.deleteWeixinMenu"
        }
        if (menuId.substr(menuIdIndex,1)=="1") {
            data.confirmDesc = "确定要删除菜单 '"+menuName+"' 及 '"+menuName+"' 下的子菜单吗？";
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
        var menuId =src.val();
        var menuIdIndex = menuId.lastIndexOf("_")+1;
        var menuButton = $("#"+menuId);
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
            $("#"+mainMenuId+"_set").find(".row_item").eq(2).show().siblings(".webchat-menudetails").show().find("textarea").attr("required","required").end().siblings("span").show();
            $(".null-menu").html('您已删除所有自定义的菜单，请确认后点击"保存并发布"')
            $("#weixin-all-menu .ds_form_action").addClass("show");
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
            pane.find(".webchat-jump-url").show().find("input").attr("required","required").attr("datatype","Url").end().siblings().hide().find("textarea").removeAttr("required");
            pane.next("span").hide();
        }else{
            pane.find(".webchat-send-msg").show().find("textarea").attr("required","required").end().siblings().hide().find("input").removeAttr("required").removeAttr("datatype");
            pane.next("span").show();
        }
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
            pane.find("span.active").html(name);
        }else{
            pane.find("li.active .weixin-main-menu").html(name);
        }
        var msgNameObj = src.closest(".single-menu").find("input[msgname],textarea[msgname]");
        for (var j = 0 ; j <msgNameObj.length; j++) {
            var nameNum = $(msgNameObj[j]).attr("msgname").length;
            var msgName = $(msgNameObj[j]).attr("msgname").substr(nameNum-4,4);
            console.log(msgName);
            if(j!=0){
                $(msgNameObj[j]).attr("msgname",name+"的"+msgName);
            }
        };
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
                var html = [];
                DS.getView('config/channel/config_weixin_dock_item', function (view) {
                    for (var i = 0; i < webchats.length; i++) {
                        var webchat = webchats[i];
                        webchat.webchatUrl = webchatUrl;
                        var accessId = webchat._id;
                        var embedScript = "<script type=\"text/javascript\" src=\"" + webchatUrl + "/javascripts/7moorInit.js?accessId=" + accessId + "\"></script>";
                        webchat.embedScript = embedScript;
                        html.push(DS.renderMethodViewNew(view,webchat));
                    }
                    container.find('#weiXin_dock_list_pane').html(html.join(""));
                    DS.updatePagination(formID, response.count, handler.config.channel.pageSize, data.page);
                });
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


    /************************global set****************************/
    channel_global_set:function(menu){
        var pane=$("#view_channel_global_set");
        var action = {
            action: 'config.channel.getGlobalSetById',
            data: {}
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                var row = rep.row;
                if(row){
                    pane.find("input[name='_id']").val(row._id);
                    pane.find("input[name='break_len']").val(row.break_len);
                    pane.find("input[name='break_tips_len']").val(row.break_tips_len);
                    pane.find("textarea[name='break_tips']").val(row.break_tips);
                    pane.find("textarea[name='msg']").val(row.msg);
                    pane.find("input[name='queueNumSwitch']").attr("checked", row.queueNumSwitch);

                    if(row.isLeaveMsg=='1'){
                        pane.find("input[id='isLeaveMsg_y']").prop("checked",true);
                    }else{
                        pane.find("input[id='isLeaveMsg_n']").prop("checked",true);
                        pane.find(".msg_div").show();
                    }
                }
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    changeIsLeaveMsg:function(data,src){
        var pane=$("#view_channel_global_set");
        if(data=='1'){
            pane.find(".msg_div").hide();
            pane.find(".msg_div").find("textarea").val("");
        }else{
            pane.find(".msg_div").show();
        }
    },
    saveGlobalSet: function (data,src) {
        if (src.hasClass("disabled")) return false;
        var pane=$("#view_channel_global_set");
        src.addClass("disabled");
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
    }
}