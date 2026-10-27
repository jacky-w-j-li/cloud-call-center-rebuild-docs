handler.config.user= {
    pageSize:10,
    config_user: function (menu) {
        var searchPane=$("#view_user_config");
        handler.config.user._initAdvanceSearch(searchPane);
        var btn=searchPane.find('.userConfig_normal_search');
        btn.click();
    },
    searchUser: function(data, src){
        var container=$("#view_user_config");
        if(src.hasClass("refresh")){
            var searchPane = container.find('.config_left');
            var param=handler._getSearchCondition(searchPane,"1");
            var a=searchPane.find(".pagination li.active>a");
            if(a.length>0){
                param.page= a.attr("value");
            }
            handler.config.user._queryUserList(param,null);
        }else{
            handler.config.user._queryUserList(data,src);
        }
    },
    _queryUserList: function (data, src) {
        data=data||{};
        var isAdvanceSearch=data.isAdvanceSearch;
        delete  data.isAdvanceSearch;

        var container=$("#view_user_config");
        handler._setSearchCondition(data,container);

        var frmId = "frm_userConfig_search";
        if(isAdvanceSearch=="1"){
            frmId = "frm_config_user_advanced_search";
        }
        container.find(".pagination").attr({for:frmId});

        var page=data.page;
        if(src && src.hasClass("page_on")){
            page=src.attr("value");
        }
        if(!page)page=1;
        data.page=page;
        data.limit=handler.config.user.pageSize;

        var action = {
            action: 'config.user.queryUser',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                DS.showSearchTips(container.find("#"+frmId));
                var users = response.list;
                if(users.length > 0){
                    var html = [];
                    DS.getView('config/user/user_item', function (view) {
                        for (var i = 0; i < users.length; i++) {
                            var user = users[i];
                            user.role = showOptionDesc("roles",user.role);
                            html.push(DS.renderMethodViewNew(view,user));
                        }
                        container.find('#user_list_pane').html(html.join(""));
                    });
                } else {
                    var html='<tr style="text-align: center;"><td colspan="4">未找到座席!</td></tr>';
                    container.find('#user_list_pane').html(html);
                }
                DS.updatePagination(frmId, response.count, handler.config.user.pageSize, data.page);
                container.find('#uerConfig_advanced_search_pane').addClass("hidden");
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    _initAdvanceSearch:function(searchPane){
        searchPane=searchPane.find(".config_left");
        searchPane.find(".userConfig_advanced_search").bind("click",function(e){
//            searchPane.find("#uerConfig_advanced_search_pane").toggle();
            e.stopPropagation();
            var offset=searchPane.find(".quick_search").offset();
            var _p=searchPane.find("#uerConfig_advanced_search_pane");
            _p.css({top:offset.top+24+"px",left:offset.left+"px"});
            _p.toggleClass("hidden");
        });
        var html=getDicOptions("roles");
        searchPane.find("select[name='role']").html(html);
        if(searchPane.find(".ds_owner").length>0){
            var agents=getCache("agents");
            utils.loadSearchInput({ id: "config_user_search_owner_select_user",
                width: "110",
                height: "17",
                tip: "按姓名、拼音搜索",
                data: agents,
                searchField: ["displayName","exten"],
                pinyinField: ["displayName"],
                listField: ["displayName"],
                userIdField: "_id",
                showField: "displayName",
                showAllList: true,
                callbackFuc: function (object) {
                    $("#config_user_search_owner_select_input").val(object._id);
                },
                onKeyChanged: function () {
                    if ($("#config_user_search_owner_select_user_input").val() != "") {
                        $("#config_user_search_owner_select_input").val("serachInputNoresult");
                    } else {
                        $("#config_user_search_owner_select_input").val("");
                    }
                }
            });
        }
    },
    resetForm:function(data,src){
        handler.resetForm(data,src);
    },
    changeUserUpdateIvrInfo:function(data){
        var pane = $('#user_detail_pane').find("#frm_user_update");
        if(pane.find("input[name=updateIvrInfo]").attr("checked")){
            pane.find('.user_update_ivr_info_div').find('input').removeAttr("readonly");
            pane.find('.user_update_ivr_info_div').find('select').removeAttr("disabled");
        }else{
            pane.find('.user_update_ivr_info_div').find('input').attr("readonly","readonly");
            pane.find('.user_update_ivr_info_div').find('select').attr("disabled","disabled");
        }
    },
    updateUser: function (data) {
        if(data.maxImDealCount < data.minImDealCount){
            $().alertmessage("showError","座席最大能同时接待会话数 不能小于 座席最小能同时接待会话数");
            return;
        }
        var container=$("#view_user_config");
        var leftPane=container.find(".config_left");
        var action = {
            action: "config.user.updateUser",
            data: {
                _id:data._id,
                parentId:data.parentId,
                maxImDealCount: data.maxImDealCount,
                minImDealCount: data.minImDealCount,
                imClaimStatus: data.imClaimStatus,
                role:data.selectRoles||[],
                iscallinternation:data.iscallinternation,
                gatewayLoginWay:data.gatewayLoginWay,
                sipLoginWay:data.sipLoginWay,
                localLoginWay: data.localLoginWay,
                iscallinternation:data.iscallinternation,

                maxEmailDealCount: data.maxEmailDealCount
            }
        };
       // action.data.ivrInfo.maxIvr = data.maxIvr;
        if(data.updateIvrInfo){
            if(data.exten.length != 4 || data.exten.substr(0,1) == '0' || data.exten.substr(0,1) == '9'){
                alert('工号必须是4位数字，不能用0和9开头');
                return;
            }
            action.data.ivrInfo = {};
            action.data.ivrInfo._id = data._id;
            action.data.ivrInfo.displayName = data.displayName;
            action.data.ivrInfo.exten = data.exten;
            if(data.password != ''){
                action.data.ivrInfo.password = data.password;
            }
            action.data.ivrInfo.mobile = data.mobile;
            action.data.ivrInfo.email = data.email;
            action.data.ivrInfo.AutoBusyTime = data.AutoBusyTime;
            action.data.ivrInfo.type = data.type;
        }
        DS.send(action, function (rep) {
            if (rep.success) {
                $().alertmessage('showSuccess', "修改座席成功");
                container.find("#user_detail_pane").empty();
                leftPane.find('.refresh').click();
            }else{
                $().alertmessage('showError',rep.message||errMsg);
            }
        })
    },
    showUserUpdate: function (id, src) {
        var container=$("#view_user_config");
        $(src).closest("tr").addClass("active").siblings().removeClass("active");
        DS.getView('config/user/user_update', function (view) {
            var pane = container.find("#user_detail_pane");
            pane.html(view);
            //设置座席会话数
            for(var i = 1;i<=50;i++){
                $('#minImDealCount').append("<option value="+i+">"+i+"</option>");
            }
            for(var i = 1;i<=100;i++){
                $('#maxImDealCount').append("<option value="+i+">"+i+"</option>");
            }

            var action = {
                action: 'config.user.getUserById',
                data:id
            };
            DS.send(action, function (response) {
                console.log(response);
                if (response.success) {
                    var user = response.user;
                    if(!user.parentId){
                        user.parentId='';
                    }
                    handler.config.user.beforeinitUserInfo(pane,user);
                }else{
                    $().alertmessage('showError', errMsg);
                }
            });
        });
    },
    beforeinitUserInfo:function(pane,user){
        var action = {
            action: 'config.user.getCallInternation',
            data:user.account
        }
        DS.send(action, function (response) {
            if (response.iscallinternation) {
                pane.find("#agent_max_call").after('<div class="control-group" id="callinternation"> <label class="control-label">开启国际电话服务</label> <div class="controls pt10"> <input type="checkbox" name="iscallinternation" checked> </div> </div>');
            }
            handler.config.user._initUserInfo(pane,user);
        });
    },
    _initUserInfo:function(pane,user){
        pane.find("#frm_user_update").find("input[name=displayName]").val(user.displayName);
        pane.find("#frm_user_update").find("input[name=_id]").val(user._id);
        pane.find("#frm_user_update").find("input[name=exten]").val(user.exten);
        pane.find("#frm_user_update").find("input[name=mobile]").val(user.mobile);
        pane.find("#frm_user_update").find("input[name=email]").val(user.email);
        pane.find("#frm_user_update").find("input[name=AutoBusyTime]").val(user.AutoBusyTime);
        pane.find("#frm_user_update").find("select[name=type]").val(user.type);
        pane.find("#frm_user_update").find("select[name=maxImDealCount]").val(user.maxImDealCount);
        pane.find("#frm_user_update").find("select[name=minImDealCount]").val(user.minImDealCount);
        pane.find("#frm_user_update").find("input[name=iscallinternation]").prop("checked",user.iscallinternation);
        pane.find("#frm_user_update").find("input[name=password]").val(user.password);
        pane.find("#frm_user_update").find("input[name=localLoginWay]").prop("checked",user.localLoginWay);
        pane.find("#frm_user_update").find("input[name=sipLoginWay]").prop("checked",user.sipLoginWay);
        pane.find("#frm_user_update").find("input[name=gatewayLoginWay]").prop("checked",user.gatewayLoginWay);
        //pane.find("#frm_user_update").find("input[name=password]").val(user.password);
        pane.find("#frm_user_update").find("input[name=maxEmailDealCount]").val(user.maxEmailDealCount);
        var  swapOption=function(src, det) {
            var _src = src.find("option:selected");
            _src.appendTo(det);
        }
        var s1=pane.find(".left_role");
        var s2=pane.find(".right_role");
        var b1=pane.find(".left_middle");
        var b2=pane.find(".right_middle");
        s1.dblclick(function() {
            swapOption(s1, s2);
        });
        s2.dblclick(function() {
            swapOption(s2, s1);
        });
        b1.click(function() {
            swapOption(s1, s2);
        });
        b2.click(function() {
            swapOption(s2, s1);
        });
        var html=getDicOptions("roles",null,"no",user.role);
        pane.find(".left_role").html(html);
        html=getDicOptions("roles",null,"no",user.role,true);
        pane.find(".right_role").html(html);

        if(pane.find(".ds_owner").length>0){
            var agents=getCache("agents");
            var _agents=[];
            var agentName="";
            for(var i=0;i<agents.length;i++){
                var u=agents[i];
                if(u.status=='enable'){
                    _agents.push(u);
                }
                if(user.parentId== u._id){
                    agentName= u.displayName;
                }
            }
            utils.loadSearchInput({ id: "config_user_owner_select_user",
                width: "110",
                height: "17",
                tip: "按姓名、拼音搜索",
                data: _agents,
                searchField: ["displayName","exten"],
                pinyinField: ["displayName"],
                listField: ["displayName"],
                userIdField: "_id",
                showField: "displayName",
                showAllList: true,
                callbackFuc: function (object) {
                    $("#config_user_owner_select_input").val(object._id);
                },
                onKeyChanged: function () {
                    if ($("#config_user_owner_select_user_input").val() != "") {
                        $("#config_user_owner_select_input").val("serachInputNoresult");
                    } else {
                        $("#config_user_owner_select_input").val("");
                    }
                }
            });

            if(agentName){
                pane.find("#frm_user_update").find("input[name=parentId]").val(user.parentId);
                pane.find("#frm_user_update").find("#config_user_owner_select_user_input").val(agentName);
            }
        }
    },
    _initUserBatch:function(pane){
        var  swapOption=function(src, det) {
            var _src = src.find("option:selected");
            _src.appendTo(det);
        }
        var s1=pane.find(".left_role");
        var s2=pane.find(".right_role");
        var b1=pane.find(".left_middle");
        var b2=pane.find(".right_middle");
        s1.dblclick(function() {
            swapOption(s1, s2);
        });
        s2.dblclick(function() {
            swapOption(s2, s1);
        });
        b1.click(function() {
            swapOption(s1, s2);
        });
        b2.click(function() {
            swapOption(s2, s1);
        });
        var html=getDicOptions("roles",null,"no");
        pane.find(".left_role").html(html);

        if(pane.find(".ds_owner").length>0){
            var agents=getCache("agents");
            var _agents=[];
            for(var i=0;i<agents.length;i++){
                var u=agents[i];
                if(u.status=='enable'){
                    _agents.push(u);
                }
            }
            utils.loadSearchInput({ id: "config_user_owner_select_user",
                width: "110",
                height: "17",
                tip: "按姓名、拼音搜索",
                data: _agents,
                searchField: ["displayName","exten"],
                pinyinField: ["displayName"],
                listField: ["displayName"],
                userIdField: "_id",
                showField: "displayName",
                showAllList: true,
                callbackFuc: function (object) {
                    $("#config_user_owner_select_input").val(object._id);
                },
                onKeyChanged: function () {
                    if ($("#config_user_owner_select_user_input").val() != "") {
                        $("#config_user_owner_select_input").val("serachInputNoresult");
                    } else {
                        $("#config_user_owner_select_input").val("");
                    }
                }
            });
        }
    },
    showBatchUpdate:function(data,src){
        var container=$("#view_user_config");
        var pane=container.find("#user_detail_pane");
        var leftPane=container.find(".config_left");
        DS.getView('config/user/user_batch_update',function(view){
            pane.empty();
            pane.html(view);
            handler.config.user._initUserBatch(pane);
            container.find("#user_list_pane tr").removeClass("active");
            var count =  leftPane.find(".pagination .result_count").text();
            $(".cust_count",pane).text(count);
            pane.find(".btn_cancel_edit").click(function(){
                pane.empty();
            });
            //设置座席会话数
            for(var i = 1;i<=50;i++){
                $('#minImDealCount').append("<option value="+i+">"+i+"</option>");
            }
            for(var i = 1;i<=100;i++){
                $('#maxImDealCount').append("<option value="+i+">"+i+"</option>");
            }
        });
    },
    batchUpdateUser:function(data,src){
        if(data.maxImDealCount < data.minImDealCount){
            $().alertmessage("showError","座席最大能同时接待会话数 不能小于 座席最小能同时接待会话数");
            return;
        }
        var container=$("#view_user_config");
        var pane=container.find("#user_detail_pane");
        var leftPane=container.find(".config_left");
        var query = handler._getSearchCondition(leftPane,"1")||1;
        var total = parseInt(pane.find(".cust_count").text());
        var set={};
        if(data.flag=='parentId'){
            set={flag:data.flag,parentId:data.parentId};
        }else if(data.flag=='imDealCount'){
            set={flag:data.flag, maxImDealCount: data.maxImDealCount,minImDealCount: data.minImDealCount, maxEmailDealCount: data.maxEmailDealCount, imClaimStatus:data.imClaimStatus};
        }else if(data.flag=='callinternation'){
            set={flag:data.flag, iscallinternation:data.iscallinternation};
        }else if(data.flag=='loginWay'){
            set={flag:data.flag, localLoginWay:data.localLoginWay,sipLoginWay:data.sipLoginWay,gatewayLoginWay:data.gatewayLoginWay};
        }else{
            set={flag:data.flag,role:data.selectRoles||[]}
        }

        var action={
            action:'config.user.batchUpdateUser',
            data: {query:query,set:set,total:total}
        };
        DS.send(action,function(rep){
            if(rep.success){
                leftPane.find('.userConfig_normal_search').click();
                if(rep.code=='1002'){
                    $().alertmessage('showError', rep.message,{stayTime:5000});
                }else{
                    $().alertmessage('showSuccess',"批量修改座席成功");
                }
            }else{
                if(rep.code=='1001'){
                    $().alertmessage('showError', "您分配的数据总数发生变化，请重新确认后再操作");
                }else{
                    $().alertmessage('showError', rep.message||errMsg);
                }
            }
        });
    },
    showFieldDesc:function(type,val){
        var desc='';
        if(type=='parentId'){
            var owner=getCache('agents',val||'NA');
            if(owner){
                desc=owner.displayName;
            }
        }
        return desc;
    }
}