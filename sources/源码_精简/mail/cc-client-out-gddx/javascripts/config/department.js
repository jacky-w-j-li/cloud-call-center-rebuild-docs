handler.config.dept= {
    pageSize:10,
    rootDept:{},
    config_dept: function (menu) {
        var container=$("#view_dept_config");
        container.find('#query_dept_condition').keydown(function (event) {
            if (event.keyCode == 13) {
                event.preventDefault();
                event.stopImmediatePropagation();
                container.find('.btn_role_search').click();
            }
        });
        var depts = getCache("depts");
        for(var i=0;i<depts.length;i++){
            if(depts[i].pId == ""){
                handler.config.dept.rootDept = depts[i];
                break;
            }
        }

        //初始多选列表
        var inputId="observer_owner_select_input";
        var containerId="observer_owner_select_user";
        utils.loadAgentTabBox(inputId,containerId,{width:"220",height:"15",maxHeight:292,hideTab:2,isRadio:false,commonTab:false},false,false);
        //

        handler.config.dept.queryDeptList();
        handler.config.dept._initAdvanceSearch(container);
    },
    queryDeptList: function (data, src) {
        data=data||{};
        if(src){
            data.page = src.attr("value") || 1;
        }else{
            data.page = 1;
        }
        data.limit=handler.config.dept.pageSize;
        var action = {
            action: 'config.dept.queryDeptList',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                handler.config.dept.initDeptTree(response.depts);
            }else{
                $().alertmessage('showError', response.message);
            }
        });
    },
    queryDeptUsers: function (data, src) {
        data=data||{};
        var isAdvanceSearch=data.isAdvanceSearch;
        delete  data.isAdvanceSearch;

        //未分配部门
        if(data == "noDept"){
            $("#queryDeptID").val("noDept");
            data = {};
            data.deptId = "noDept";
        }
        //
        var container=$("#view_dept_config");

        if(src && src.hasClass("refresh")){
            var json=container.find(".search_condition").html();
            if(json){
                data = $.evalJSON(unescapeHtml(json));
                data = removeEmptyProperty(data);
            }
        }else{
            handler._setSearchCondition(data,container);
        }


        var frmId = "frm_deptConfig_search";
        if(isAdvanceSearch=="1"){
            frmId = "frm_config_dept_user_advanced_search";
            data.deptId = $("#queryDeptID").val();
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
            action: 'config.dept.queryUser',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                if(src && !src.hasClass("refresh")){
                    DS.showSearchTips(container.find("#"+frmId));
                }
                var users = response.list;
                if(users.length > 0){
                    var html = [];
                    DS.getView('config/dept/dept_user_item', function (view) {
                        for (var i = 0; i < users.length; i++) {
                            var user = users[i];
                            var dept = getCache("depts",user.deptId);
                            user.role = showOptionDesc("roles",user.role);
                            if(!dept){
                                user.deptName = "-";
                            }else{
                                user.deptName = dept.name;
                            }
                            if(user.status && user.status != "disable"){
                                user.status = "启用";
                            }else{
                                user.status = "已停用";
                            }
                            html.push(DS.renderMethodViewNew(view,user));
                        }
                        container.find('#dept_user_list_pane').html(html.join(""));
                        container.find('#dept_user_list_pane').find('td:contains("已停用")').css('color','red');
                    });
                } else {
                    var html='<tr style="text-align: center;"><td colspan="7">未找到座席!</td></tr>';
                    container.find('#dept_user_list_pane').html(html);
                }
                DS.updatePagination(frmId, response.count, handler.config.dept.pageSize, data.page);
                container.find('#deptConfig_advanced_search_pane').addClass("hidden");
            }else{
                $().alertmessage('showError', response.message);
            }
        });
    },
    _initAdvanceSearch:function(searchPane){
        searchPane=searchPane.find(".config_left");
        searchPane.find(".deptConfig_advanced_search").bind("click",function(e){
            e.stopPropagation();
            var offset=searchPane.find(".quick_search").offset();
            var _p=searchPane.find("#deptConfig_advanced_search_pane");
            _p.css({top:offset.top+24+"px",left:offset.left+"px"});
            _p.toggleClass("hidden");
        });
        var html=getDicOptions("roles");
        searchPane.find("select[name='role']").html(html);
        if(searchPane.find(".ds_owner").length>0){
            var agents=getCache("agents");
            utils.loadSearchInput({ id: "config_dept_user_search_owner_select_user",
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
                    $("#config_dept_user_search_owner_select_input").val(object._id);
                },
                onKeyChanged: function () {
                    if ($("#config_dept_user_search_owner_select_user_input").val() != "") {
                        $("#config_dept_user_search_owner_select_input").val("serachInputNoresult");
                    } else {
                        $("#config_dept_user_search_owner_select_input").val("");
                    }
                }
            });
        }
    },
    resetForm:function(data,src){
        handler.resetForm(data,src);
    },
    changeUserUpdateIvrInfo:function(data){
        var pane = $("#dept_user_modal").find("#frm_dept_user_update");
        if(pane.find("input[name=updateIvrInfo]").attr("checked")){
            pane.find('.user_update_ivr_info_div').find('input').removeAttr("readonly");
            pane.find('.user_update_ivr_info_div').find('select').removeAttr("disabled");
        }else{
            pane.find('.user_update_ivr_info_div').find('input').attr("readonly","readonly");
            pane.find('.user_update_ivr_info_div').find('select').attr("disabled","disabled");
        }
    },
    initDeptTree: function (data) {
        var container=$("#view_dept_config");
        var setting = {
            view: {
                addHoverDom: addHoverDom,
                removeHoverDom: removeHoverDom,
                selectedMulti: false,
                showIcon: false
            },
            edit: {
                enable: true,
                editNameSelectAll: true,
                showRemoveBtn: showRemoveBtn,
                showRenameBtn: showRenameBtn,
                renameTitle:"修改",
                removeTitle:'删除'
            },
            data: {
                key:{
                    name:"name"
                },
                simpleData: {
                    enable: true,
                    idKey:"_id",
                    pIdKey:"pId",
                    rootPid:""
                }
            },
            callback: {
                beforeDrop: beforeDrop,
                beforeDrag: beforeDrag,
                beforeEditName: beforeEditName,
                beforeRemove: beforeRemove,
                onDrop: onDrop,
                onClick:searchDeptUsers
            }
        };
        var treeObj = $.fn.zTree.init(container.find("#dept_tree_main"), setting, data);
        treeObj.expandAll(true);
        //var rootDept =
        var sel=treeObj.getNodeByParam('_id',handler.config.dept.rootDept._id);
        $("#"+sel.tId+"_a").click();
    },
    addDept : function(data,src){
        if(data.observer == "serachInputNoresult"){
            $().alertmessage('showError', "您输入的观察者不在同事列表中");
            return;
        }

        if(data.observer != ""){
            data.observer = data.observer.split(",")
        }else{
            data.observer = [];
            if($("#observer_owner_select_user").find(".tabbox_agent_result").find("span").length > 0){
                var spans = $("#observer_owner_select_user").find(".tabbox_agent_result").find("span");
                for(var i=0;i<spans.length;i++){
                    data.observer.push(spans[i].getAttribute("userid"));
                }
            }
        }



        if (src.hasClass("disabled")) return false;
        if(!data.name || data.name ==""){
            $().alertmessage('showError', "部门名称必须填写!");
            return;
        }
        if(!data.order || data.order == ""){
            $().alertmessage('showError', "排序号不能为空!");
            return;
        }
        if(data.order.length > 9 ){
            $().alertmessage('showError', "排序号不能输入大于9位的数字");
            return;
        }
        src.addClass("disabled");

        var action = {
            action: 'config.dept.addDept',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                addCache("depts",response.dept);
                var pane = $("#dept_modal");
                pane.modal('hide');
                pane.find('.deptForm')[0].reset();
                $().alertmessage('showSuccess', "新增部门成功");
                handler.config.dept.queryDeptList();
            }else{
                $().alertmessage('showError', response.message);
            }
            src.removeClass('disabled');
        });
    },
    updateDept : function(data,src){

        if(data.observer == "serachInputNoresult"){
            $().alertmessage('showError', "您输入的观察者不在同事列表中");
            return;
        }

        if(data.observer != ""){
            data.observer = data.observer.split(",");
        }else {
            data.observer = [];
            if($("#observer_owner_select_user").find(".tabbox_agent_result").find("span").length > 0){
                var spans = $("#observer_owner_select_user").find(".tabbox_agent_result").find("span");
                for(var i=0;i<spans.length;i++){
                    data.observer.push(spans[i].getAttribute("userid"));
                }
            }
        }

        if (src.hasClass("disabled")) return false;
        if(!data.name || data.name ==""){
            $().alertmessage('showError', "部门名称必须填写!");
            return;
        }
        if(!data.order || data.order == ""){
            $().alertmessage('showError', "排序号不能为空!");
            return;
        }

        if(data.order.length > 9 ){
            $().alertmessage('showError', "排序号不能输入大于9位的数字");
            return;
        }

        src.addClass("disabled");

        var action = {
            action: 'config.dept.updateDept',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var pane = $("#dept_modal");
                pane.modal('hide');
                pane.find('.deptForm')[0].reset();
                //修改缓存
                updateCache("depts",data._id,response.dept);
                $().alertmessage('showSuccess', "修改部门成功");
                handler.config.dept.queryDeptList();
            }else{
                $().alertmessage('showError', response.message);
            }
            src.removeClass('disabled');
        });
    },
    delDept : function(data,src){
        var action = {
            action: 'config.dept.delDept',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                removeCache("depts",data.deptId);
                $().alertmessage('showSuccess', "删除部门成功");
                handler.config.dept.queryDeptList();
            }else{
                $().alertmessage('showError', response.message);
            }
        });
    },
    moveDept : function(data,src){
        var action = {
            action: 'config.dept.moveDept',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                $().alertmessage('showSuccess', "移动部门成功");
                handler.config.dept.queryDeptList();
            }else{
                $().alertmessage('showError', response.message);
            }
        });
    },
    showFieldDesc:function(type,val){
        var desc='';
        if(type=='department'){
            var department = getCache('department',val||'NA');
            if(department){
                desc=department.name;
            }
        }
        if (type=='parentId'){
            var owner = getCache('agents',val||'NA');
            if(owner){
                desc=owner.displayName;
            }
        }
        return desc;
    },
    showUserUpdate : function(data,src){
        DS.getView("config/dept/dept_user_update",function (view){
            var pane = $("#dept_user_modal");
            pane.find('.modal-title').text('修改座席');
            pane.find('.modal-body').html(view);
            //设置座席会话数
            for(var i = 1;i<=50;i++){
                $('#minImDealCount').append("<option value="+i+">"+i+"</option>");
            }
            for(var i = 1;i<=100;i++){
                $('#maxImDealCount').append("<option value="+i+">"+i+"</option>");
            }

            var userPane = pane.find(".modal-body");
            var action = {
                action: 'config.user.getUserById',
                data:data
            };
            DS.send(action, function (response) {
                if (response.success) {
                    var user = response.user;
                    if(!user.parentId){
                        user.parentId='';
                    }
                    handler.config.dept.beforeinitUserInfo(userPane,user);
                    //初始化下拉列表
                    var selectOptionHtml = "";
                    var depts = getCache("depts");
                    for(var i=0;i<depts.length;i++){
                        var d = depts[i];
                        if(d.pId)  selectOptionHtml += '<option value="'+ d._id+'">'+ d.name+'</option>';
                    }
                    $('#deptSelect').html("<option value=''>请选择</option>"+selectOptionHtml);

                    $('#deptSelect').multiselect({
                        nonSelectedText: '点击选择部门',
                        maxHeight: 200
                    });
                    if(user.deptId) $('#deptSelect').multiselect('select', user.deptId);
                    $('#deptSelect').multiselect().multiselect('rebuild');
                    pane.width(620).modal();
                }else{
                    $().alertmessage('showError', response.message);
                }
            });
        })
    },
    beforeinitUserInfo:function(pane,user){
        var action = {
            action: 'config.user.getCallInternation',
            data:user.account
        }
        DS.send(action, function (response) {
            if (response.iscallinternation) {
                pane.find("#agent_max_call").after('<div class="control-group" id="callinternation"> <label class="control-label">开启国际电话服务</label> <div class="controls"> <input type="checkbox" name="iscallinternation" checked> </div> </div>');
            }
            handler.config.dept._initUserInfo(pane,user);
        });
    },
    _initUserInfo:function(pane,user){
        pane.find("#frm_dept_user_update").find("input[name=displayName]").val(user.displayName);
        pane.find("#frm_dept_user_update").find("input[name=_id]").val(user._id);
        pane.find("#frm_dept_user_update").find("input[name=exten]").val(user.exten);
        pane.find("#frm_dept_user_update").find("input[name=mobile]").val(user.mobile);
        pane.find("#frm_dept_user_update").find("input[name=email]").val(user.email);
        pane.find("#frm_dept_user_update").find("input[name=AutoBusyTime]").val(user.AutoBusyTime);
        pane.find("#frm_dept_user_update").find("select[name=type]").val(user.type);
        pane.find("#frm_dept_user_update").find("select[name=maxImDealCount]").val(user.maxImDealCount);
        pane.find("#frm_dept_user_update").find("select[name=minImDealCount]").val(user.minImDealCount);
        pane.find("#frm_dept_user_update").find("input[name=iscallinternation]").prop("checked",user.iscallinternation);
        // pane.find("#frm_dept_user_update").find("input[name=password]").val(user.password);
        pane.find("#frm_dept_user_update").find("input[name=maxEmailDealCount]").val(user.maxEmailDealCount);
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
            utils.loadSearchInput({ id: "config_dept_user_owner_select_user",
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
                    $("#config_dept_user_owner_select_input").val(object._id);
                },
                onKeyChanged: function () {
                    if ($("#config_dept_user_owner_select_user_input").val() != "") {
                        $("#config_dept_user_owner_select_input").val("serachInputNoresult");
                    } else {
                        $("#config_dept_user_owner_select_input").val("");
                    }
                }
            });

            if(agentName){
                pane.find("#frm_dept_user_update").find("input[name=parentId]").val(user.parentId);
                pane.find("#frm_dept_user_update").find("#config_dept_user_owner_select_user_input").val(agentName);
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

        //初始化下拉列表
        var selectOptionHtml = "";
        var depts = getCache("depts");
        for(var i=0;i<depts.length;i++){
            var d = depts[i];
            if(d.pId)  selectOptionHtml += '<option value="'+ d._id+'">'+ d.name+'</option>';
        }
        $('#dept_batch_Select').html("<option value=''>请选择</option>"+selectOptionHtml);

        $('#dept_batch_Select').multiselect({
            nonSelectedText: '点击选择部门',
            maxHeight: 200
        });

        if(pane.find(".ds_owner").length>0){
            var agents=getCache("agents");
            var _agents=[];
            for(var i=0;i<agents.length;i++){
                var u=agents[i];
                if(u.status=='enable'){
                    _agents.push(u);
                }
            }
            utils.loadSearchInput({ id: "config_dept_user_owner_batch_select_user",
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
                    $("#config_dept_user_owner_batch_select_input").val(object._id);
                },
                onKeyChanged: function () {
                    if ($("#config_dept_user_owner_batch_select_input").val() != "") {
                        $("#config_dept_user_owner_batch_select_input").val("serachInputNoresult");
                    } else {
                        $("#config_dept_user_owner_batch_select_input").val("");
                    }
                }
            });
        }
    },
    showBatchUpdate:function(data,src){
        DS.getView("config/dept/dept_user_batch_update",function (view){
            var container=$("#view_dept_config");
            var pane = $("#dept_user_modal");
            pane.find('.modal-title').text('批量修改座席');
            pane.find('.modal-body').html(view);
            //设置座席会话数
            for(var i = 1;i<=50;i++){
                $('#minImDealCount').append("<option value="+i+">"+i+"</option>");
            }
            for(var i = 1;i<=100;i++){
                $('#maxImDealCount').append("<option value="+i+">"+i+"</option>");
            }
            handler.config.dept._initUserBatch(pane);
            var leftPane=container.find(".config_left");
            var count =  leftPane.find(".pagination .result_count").text();
            $(".cust_count",pane).text(count);

            pane.width(750).modal();
        })
    },
    batchUpdateUser:function(data,src){
        if(!data.selectRoles && data.flag=='role'){
            $().alertmessage("showError","座席角色不能为空");
            return;
        }
        if(data.flag=='imDealCount' && (parseInt(data.maxImDealCount) < parseInt(data.minImDealCount))){
            $().alertmessage("showError","座席最大能同时接待会话数 不能小于 座席最小能同时接待会话数");
            return;
        }
        var container=$("#view_dept_config");
        var pane = $("#dept_user_modal");
        var leftPane=container.find(".config_left");
        var query = handler._getSearchCondition(leftPane,"1");
        query.deptId = $("#queryDeptID").val();
        var total = parseInt(pane.find(".cust_count").text());
        var set={};
        if(data.flag=='parentId'){
            set={flag:data.flag,parentId:data.parentId};
        }else if(data.flag=='imDealCount'){
            set={flag:data.flag, maxImDealCount: data.maxImDealCount,minImDealCount: data.minImDealCount, maxEmailDealCount: data.maxEmailDealCount, imClaimStatus:data.imClaimStatus};
        }else if(data.flag=='dept'){
            set={flag:data.flag,deptId:data.deptId || ""}
        }else{
            set={flag:data.flag,role:data.selectRoles||[]}
        }

        var action={
            action:'config.user.batchUpdateUser',
            data: {query:query,set:set,total:total}
        };
        DS.send(action,function(rep){
            if(rep.success){
                leftPane.find('.refresh').click();
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
    updateUser: function (data) {
        if(!data.selectRoles){
            $().alertmessage("showError","座席角色不能为空");
            return;
        }
        if(parseInt(data.maxImDealCount) < parseInt(data.minImDealCount)){
            $().alertmessage("showError","座席最大能同时接待会话数 不能小于 座席最小能同时接待会话数");
            return;
        }
        var container=$("#view_dept_config");
        var leftPane=container.find(".config_left");
        var action = {
            action: "config.user.updateUser",
            data: {
                _id:data._id,
                deptId:data.deptId,
                parentId:data.parentId,
                maxImDealCount: data.maxImDealCount,
                minImDealCount: data.minImDealCount,
                role:data.selectRoles||[],
                iscallinternation:data.iscallinternation,

                maxEmailDealCount: data.maxEmailDealCount
            }
        };
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
                container.find("#dept_user_modal").modal("hide");
                container.find("#dept_user_modal .modal-body").empty();
                leftPane.find('.refresh').click();
            }else{
                $().alertmessage('showError',rep.message||errMsg);
            }
        })
    },


}
//tree_utils
var log, className = "dark";
function beforeDrag(treeId, treeNodes) {
    for (var i=0,l=treeNodes.length; i<l; i++) {
        if (treeNodes[i].drag === false || treeNodes[i]._id == handler.config.dept.rootDept._id) {
            return false;
        }
    }
    if(!isHasFunc("func_dept_move")){
        return false;
    }
    return true;
}
function beforeDrop(treeId, treeNodes, targetNode, moveType) {
    if(!targetNode) return false;
    if(targetNode.drop) return false;
    for (var i=0,l=treeNodes.length; i<l; i++) {
        if (treeNodes[i].drag === false || treeNodes[i]._id == handler.config.dept.rootDept._id) {
            return false;
        }
    }
    if(!confirm("确认要将部门["+treeNodes[0].name+"]移动至["+targetNode.name+"]下吗?"))return false;

    return true;

}
function onDrop(event, treeId, treeNodes, targetNode, moveType){
    if(!targetNode) return false;
    var datas = [];
    for (var i=0,l=treeNodes.length; i<l; i++) {
        var dept = {};
        dept._id = treeNodes[i]._id;
        dept.pId  = targetNode._id;
        dept.treePath = targetNode.treePath + treeNodes[i]._id +"/";
        datas.push(dept);
        replaecTreePath(dept,treeNodes[i].children,datas);
    }
    handler.config.dept.moveDept(datas);
}

function beforeEditName(treeId, treeNode) {
    var pane = $("#dept_modal");
    pane.find('.modal-title').text('编辑部门');
    if(treeNode.getParentNode()){
        pane.find('#deptParentName').val(treeNode.getParentNode().name);
    }
    pane.find('#deptName').val(treeNode.name);
    pane.find('#deptId').val(treeNode._id);
    pane.find('#note').val(treeNode.note);
    pane.find('#order').val(treeNode.order);

    var members = treeNode.observer;
    if(members){
        var users = getCache("agents");
        var html = "";
        var membersList = "";
        var memeberPane = $("#observer_owner_select_user").find(".tabbox_agent_result").empty();
        var uName = "";
        for(var b = 0;b<members.length;b++){
            for(var i=0;i<users.length;i++){
                var u = users[i];
                if(u._id == members[b]){
                    uName = u.displayName;
                    break;
                }
            }
            html = '<span userid="'+members[b]+'"><b class="delete_result">x</b>'+uName+'</span>';
            memeberPane.append(html);
            if(b == members.length-1){
                membersList += members[b];
            }else{
                membersList += members[b]+",";
            }
        }
        pane.find("input[name='observer']").val(membersList);
    }

    pane.find('.saveOrUpdate').attr("ds_action","config.dept.updateDept");
    pane.width(750);
    pane.modal();
    return false;
}
function beforeRemove(treeId, treeNode) {
    if(!confirm("确认要删除部门["+treeNode.name+"]吗?"))return false;
    if(treeNode.isParent){
        alert("移除失败,请先删除下级部门");
        return false;
    }
    handler.config.dept.delDept({"deptId":treeNode._id});
    return false;
}

function showRemoveBtn(treeId, treeNode) {
    if(!isHasFunc("func_dept_delete")){
        return false;
    }
    return treeNode._id != handler.config.dept.rootDept._id;
}
function showRenameBtn(treeId, treeNode) {
    if(!isHasFunc("func_dept_update")){
        return false;
    }
    return treeNode._id != handler.config.dept.rootDept._id;
}

function addHoverDom(treeId, treeNode) {
    if(!isHasFunc("func_dept_add")){
        return false;
    }
    var sObj = $("#" + treeNode.tId + "_span");
    if (treeNode.editNameFlag || $("#addBtn_"+treeNode.tId).length>0) return;
    var addStr = "<span class='button add' id='addBtn_" + treeNode.tId
        + "' title='添加' onfocus='this.blur();'></span>";
    sObj.after(addStr);
    var btn = $("#addBtn_"+treeNode.tId);
    if (btn) btn.bind("click", function(){
        var pane = $("#dept_modal");
        pane.find('.modal-title').text('添加部门');
        var qid=uuid.v1();
        pane.find('#deptParentName').val(treeNode.name);
        pane.find('#pId').val(treeNode._id);
        pane.find('#deptId').val(qid)
        pane.find('.tabbox_agent_result').empty();
        pane.find('#deptName').val("");
        pane.find('#order').val(0);
        pane.find('#observer').val("");
        pane.find('#note').val("");
        pane.find('#treePath').val(treeNode.treePath+qid+"/")
        pane.find('.saveOrUpdate').attr("ds_action","config.dept.addDept");
        pane.width(620).modal();
    });
};
function removeHoverDom(treeId, treeNode) {
    $("#addBtn_"+treeNode.tId).unbind().remove();
};
/**
 * 递归算出子节点treePath
 * @param parentNode 父节点
 * @param childrenNodes 子节点
 * @param datas 最终数组
 */
function replaecTreePath(parentNode,childrenNodes,datas){
    if(childrenNodes){
        for (var i=0,l=childrenNodes.length; i<l; i++) {
            var dept = {};
            dept._id = childrenNodes[i]._id;
            dept.pId  = parentNode._id;
            dept.treePath = parentNode.treePath + childrenNodes[i]._id +"/";
            datas.push(dept);
            replaecTreePath(dept,childrenNodes[i].children,datas);
        }
    }
}
function searchDeptUsers(event, treeId, treeNode){
    var data = {"deptId":treeNode._id};
    $("#queryDeptID").val(treeNode._id);
    if(treeNode._id == handler.config.dept.rootDept._id){
        delete data.deptId;
        $("#queryDeptID").val("");
    }
    //清空查询条件
    $("#dept_pane").find(".remove_filter2").click();
    $("#deptConfig_advanced_search_pane").find("#frm_config_dept_user_advanced_search").get(0).reset();;
    handler.config.dept.queryDeptUsers(data);
}