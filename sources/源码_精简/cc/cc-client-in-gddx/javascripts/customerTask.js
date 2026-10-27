handler.customer.task={
    limit:10,
    paneId:"#view_nav_dial_task",
    quickAry:[],
    currentDailyTask:0,//每日任务量
    currentDailyCalled:0,//每日拨打量
    currentDailyTaskAgent:0,//每日分钟数
    currentUnit:1,//任务类型 1有效通话,2有效时长
    curSubMenu:'',
    myMenus:['dial_task_notClosed', 'dial_task_closed'],
    trunkArr:localStorage.task ? JSON.parse(localStorage.task) : [],//本地任务列表是否完成标记
    branchObj:{},
    task_main: function(menu){
        var pane=$(handler.customer.task.paneId);
        //判断菜单权限
        if(isHasFunc("func_dail_task_manage")){
            pane.find(".btn_agent_dial_task").click();
            handler.customer.task.quickAry.push({n:"已关闭",v:"close"});
            handler.customer.task.quickAry.push({n:"已归档",v:"archive"});
        }else{
            pane.find(".btn_dial_task_notClosed").remove();
            pane.find(".btn_dial_task_closed").remove();
            pane.find(".btn_agent_dial_task").click();
        }
    },
    task_agent_main : function(menu){
        var pane=$("#view_nav_agent_dial_task");
        pane.find(".btn_agent_dial_task").click();
    },
    queryDialTaskList:function(data,src){
        data = data ||{};
        var menu = data;
        var sendData = {};
        if(src && src.hasClass("ds_form_action")){//查询按钮
            menu = data.menu;
            if(data.taskName && data.taskName!=""){
                sendData.taskName = data.taskName;
            }
        }else if(src && !src.hasClass("ds_do_action")) {//分页
            var frm = $("#customer_advanced_search");
            menu = frm.find("input[name='menu']").val();
            var taskName = frm.find("input[name='taskName']").val();
            if(taskName && taskName!=""){
                sendData.taskName = taskName;
            }
        }else if(src && src.hasClass("refresh")) {//刷新
            var frm = $("#customer_advanced_search");
            var taskName = frm.find("input[name='taskName']").val();
            if(taskName && taskName!=""){
                sendData.taskName = taskName;
            }
        }
        var container=$("#import_list_dial_task_notClosed");
        var page=1;
        if(src && !src.hasClass("ds_do_action"))page=src.val();
        if(!page)page=1;
        sendData.page=page;
        sendData.limit=handler.customer.task.limit;
        var formID = "frm_customer_advanced_search_dial_task_notClosed";
        var listPane = container.find('.list-inside');
        var action = {
            action: 'app.customer.task.queryDialTaskList',
            data: sendData
        };
        DS.send(action, function (response) {
            if (response.success) {
                var list = response.list;
                if(list.length > 0){
                    var html = [];
                    for (var i = 0; i < list.length; i++) {
                        var _obj=list[i];
                        handler.customer.task._initDialTaskNullFields(_obj);
                        _obj.agentsNum = _obj.agents.length;
                        html.push($('#customer_task_page_item').tmpl(_obj).get(0).outerHTML);
                    }
                    listPane.html(html.join(""));
                    resize();
                }else{
                    var html='<div class="alert">未找到外呼任务!</div>';
                    listPane.html(html);
                    resize();
                }
                DS.updatePagination(formID, response.count, handler.customer.task.limit, sendData.page);
            }else{
                $().alertmessage('showError',response.message|| errMsg);
            }
        });
    },
    queryCloseDialTaskList:function(data,src){
        data = data ||{};
        var menu = data;
        var sendData = {};
        menu = data.menu;
        var container=$("#import_list_dial_task_closed");
        data.status = container.find("#frm_customer_advanced_search").find("input[name='status']").val()
        if(data.taskName && data.taskName!=""){
            sendData.taskName = data.taskName;
        }
        if(data.status && data.status !=""){
            sendData.status = data.status;
        }
        var page=1;
        if(src && !src.hasClass("ds_do_action"))page=src.val();
        if(!page)page=1;
        sendData.page=page;
        sendData.limit=handler.customer.task.limit;
        var formID = "frm_customer_advanced_search_dial_task_closed";
        var listPane = container.find('.list-inside');
        var action = {
            action: 'app.customer.task.queryCloseDialTaskList',
            data: sendData
        };
        DS.send(action, function (response) {
            if (response.success) {
                var list = response.list;
                if(list.length > 0){
                    var html = [];
                    for (var i = 0; i < list.length; i++) {
                        var _obj=list[i];
                        handler.customer.task._initDialTaskNullFields(_obj);
                        _obj.agentsNum = _obj.agents.length;
                        html.push($('#customer_close_task_page_item').tmpl(_obj).get(0).outerHTML);
                    }
                    listPane.html(html.join(""));
                    resize();
                }else{
                    var html='<div class="alert">未找到外呼任务!</div>';
                    listPane.html(html);
                    resize();
                }
                DS.updatePagination(formID, response.count, handler.customer.task.limit, sendData.page);
            }else{
                $().alertmessage('showError',response.message|| errMsg);
            }
        });
    },
    //管理员-已拨号码
    searchDialedAdvanced: function(data, src) {
        DS.showSearchTips($("#frm_called_advanced_search"),false);
        $("#customer_advanced_called_search_pane").addClass("hidden");
        handler.customer.task.queryDialedNumberTaskList(data,src);
    },
    queryDialedNumberTaskList:function(data,src){
        data = data ||{};
        var menu = data;
        var sendData = {};
        if(src && src.hasClass("ds_form_action")){//查询按钮
            menu = data.menu;
            if(data.phone && data.phone!=""){
                sendData.phone = data.phone;
            }
        }else if(src && !src.hasClass("ds_do_action")) {//分页
            var frm = $("#frm_customer_called_advanced_search");
            menu = frm.find("input[name='menu']").val();
            var phone = frm.find("input[name='phone']").val();
            if(phone && phone!=""){
                sendData.phone = phone;
            }
        }else if(src && src.hasClass("refresh")) {//刷新
            var frm = $("#frm_customer_called_advanced_search");
            var phone = frm.find("input[name='phone']").val();
            if(phone && phone!=""){
                sendData.phone = phone;
            }
        }
        //高级查询
        if(data.isAdvanceSearch){
            if(data.phone){
                sendData.phone = data.phone;
            }
            if(data.taskName){
                sendData.taskName = data.taskName;
            }
            if(data.dialTag){
                sendData.dialTag = data.dialTag;
            }
            if(data.custStatus){
                sendData.custStatus = data.custStatus;
            }
            if(data.owner){
                sendData.owner = data.owner;
            }

        }
        var container=$("#import_list_dial_task_dialedNumber");
        var page=1;
        if(src && !src.hasClass("ds_do_action"))page=src.val();
        if(!page)page=1;
        sendData.page=page;
        sendData.limit=handler.customer.task.limit;
        var formID = "frm_customer_advanced_search_dial_task_dialedNumber";
        var listPane = container.find('.list-inside');
        var action = {
            action: 'app.customer.task.queryDialedNumberTaskList',
            data: sendData
        };
        DS.send(action, function (response) {
            if (response.success) {
                var list = response.list;
                if(list.length > 0){
                    var html = [];
                    for (var i = 0; i < list.length; i++) {
                        var _obj=list[i];
                        var owner = "";
                        _obj.ownerId =_obj.owner;
                        if(_obj.owner != "NA"){
                            owner = handler.customer.task.getAgentName( _obj.owner);
                        }
                        _obj.owner = owner;
                        _obj.lastTime = handler.getFormatDateTime(new Date(_obj.lastTime));
                        var _t=handler.formatShortTime(_obj.shortTime);
                        _obj.shortTime = _t.name;
                        var timeLen=handler.customer.task.getCallTimeLength(_obj.timeLen);
                        _obj.timeLen=timeLen;
                        handler.customer.task._initDialTaskNullFields(_obj);
                        html.push($('#customer_dialedNumber_task_page_item').tmpl(_obj).get(0).outerHTML);
                    }
                    listPane.html(html.join(""));
                    resize();
                }else{
                    var html='<div class="alert">未找到已拨号码!</div>';
                    listPane.html(html);
                    resize();
                }
                DS.updatePagination(formID, response.count, handler.customer.task.limit, sendData.page);
            }else{
                $().alertmessage('showError',response.message|| errMsg);
            }
        });
    },
    getCallTimeLength: function (callTimeLength) {
        if (callTimeLength && $.isNumeric(callTimeLength)) {
            return timeToHHmmss(callTimeLength);
        } else {
            return '00:00:00';
        }
    },
    _initCalledSearch:function(){
        var searchPane = $("#import_list_dial_task_dialedNumber");
        searchPane.find(".customer_advanced_called_search").bind("click",function(e){
            e.stopPropagation();
            var offset=searchPane.find(".quick_search").offset();
            var _p=searchPane.find("#customer_advanced_called_search_pane");
            _p.css({top:offset.top+28+"px",left:offset.left+"px"});
            _p.toggleClass("hidden");
        });

        var url = 'customer/task/dial_task_agent_called_search';
        DS.getView(url, function(view){
            view=DS.renderViewNew(view);
            searchPane.find("#customer_advanced_called_search_pane").html(view);
        });
    },

    showCalledTaskInfo : function (menu,src){
        var paneMenu = $("#view_dial_task_list_content");
        var data = {};
        var tId=src.find('input[name=_id]').val();
        var phone=src.find('input[name=phone]').val();
        data._id = tId;
        data.phone=phone;
        var action = {
            action:'app.customer.task.queryCallSheet',
            data:data
        };
        DS.send(action,function(response){
            if(response.success){

                DS.getView('customer/task/dial_task_agent_content', function (view) {
                    var createUser = handler.customer.task.getAgentName( response.createUser);
                    var taskStatus = response.taskStatus;
                    if(taskStatus == "dealing"){
                        taskStatus = "进行中";
                    }else if(taskStatus == "close"){
                        taskStatus = "已关闭";
                    }
                    var owner = response.owner;
                    if(owner != "NA"){
                        owner = handler.customer.task.getAgentName( response.owner);
                    }
                    var callSheet = response.callSheet;
                    var city=(callSheet.PROVINCE==callSheet.DISTRICT)?callSheet.PROVINCE:callSheet.PROVINCE+"-"+callSheet.DISTRICT;
                    view = view.replace(/_#taskName#_/g,response.taskName).replace(/_#createUser#_/g,createUser)
                        .replace(/_#taskStatus#_/g,taskStatus).replace(/_#memo#_/g,response.memo).replace(/_#owner#_/g,owner).replace(/_#city#_/g,city);

                    view = DS.renderMethodViewNew(view,callSheet);
                    paneMenu.html(view);
                    var pane = $("#agent_called_update_info");
                    resizeRightContent(pane);
                    //

                    var pageType = "called";

                    handler.customer.task.randerUpdateCustomerView(response,pane,pageType);
                });


            }else{

            }
        });
    },
    randerUpdateCustomerView : function (data,pane,pageType){
        if(data.count > 1){
            handler.customer.task.loadCustAddByTelFirst(data,sample,pane,pageType);
        }else{
            var loadViewPath = "customer/task/dial_task_agent_update_customer";
            var tmplScript = "#tmpl_custmanage_agent_update";
            var iccDiv = "#icc_agent_update_customer_customerAddDiv";
            if(pageType == "called") {
                loadViewPath = "customer/task/dial_task_agent_called_update_cust";
                tmplScript = "#tmpl_custmanage_agent_callled_update";
                iccDiv = "#icc_agent_called_update_customer_customerAddDiv"
            }
            DS.getView(loadViewPath, function (view) {
                pane.empty();
                pane.html(view);
                var container=pane.find(iccDiv);
                var item=data.customer;
                var owner=item.owner;
                var tmpl = getCache('custTmpls')[0];
                var o=pane.find("#cust_update_id");
                o.val(item._id);
                var qid=uuid.v1();
                tmpl.qiniuId=qid;
                pane.find(tmplScript).tmpl(tmpl).appendTo(container);
                handler.customer._initQiniuCustomerUpload(qid,container);

                pane.find('.date_picker').datepicker({
                    changeMonth: true,
                    changeYear: true,
                    showButtonPanel: true
                });
                var html=generateCCOptions(proviceCityDicKey);
                container.find("select[name='province']").html(html);
                handler.customer.renderCustUpdate(pane.find("form"),item,pane);

                //load user
                var menu=pane.find(".edit_customer").attr("menu")||"";
                var inputId=menu+"_owner_customerUpdate_input";
                var containerId=menu+"_owner_customerUpdate_user";

                var _agents=filterUserByScope('custTask');
                var _uids=[];
                for (var i = 0; i < _agents.length; i++) {
                    var obj = _agents[i];
                    _uids.push(obj._id);
                }
                if(isHasFunc("func_popup_commonCust_owner")){
                    _uids.push("");
                }
                if($.inArray(owner,_uids)!=-1||session.user.scope=='all'){
                    utils.loadAgentComboBox(inputId,containerId,{width:"140",height:"17"},true);
                    //set owner name
                    var agentName="";
                    var agents=getCache("agents");
                    for(var i=0;i<agents.length;i++){
                        var u=agents[i];
                        if(item.owner== u._id){
                            agentName= u.displayName;
                            break;
                        }
                    }
                    if(agentName){
                        pane.find(".edit_customer").find("#"+containerId+"_input").val(agentName);
                    }
                }else{
                    var agent=getCache("agents",owner||"NA");
                    if(agent){
                        var html='<span style="line-height:23px">'+agent.displayName+'</span>';
                        pane.find(".edit_customer").find("#"+containerId).html(html);
                    }else{
                        var html='<span style="line-height:23px">无</span>';
                        pane.find(".edit_customer").find("#"+containerId).html(html);
                    }
                }
                pane.find(".btn_cancel_edit").click(function(){
                    pane.empty();
                    dsevent.publish(dsevent.evt.customerAddCancel);
                });
            });
        }
    },
    //管理员-修改客户资料
    convertData : function(data,src){
        src.css("border","1px solid #37b5ed");
        var datas = data.split(",");
        var cid = datas[0];
        var sendData ={};
        sendData.cid = cid;
        var pane = $("#agent_called_update_info");
        var action = {
            action:'app.customer.task.convertDataByPhone',
            data:sendData
        };
        DS.send(action,function(response){
            if(response.success){
                DS.getView("customer/task/dial_task_agent_update_customer", function (view) {
                    pane.empty();
                    pane.html(view);
                    var container=pane.find("#icc_agent_update_customer_customerAddDiv");
                    var item=response.customer;
                    var owner=item.owner;
                    var tmpl = getCache('custTmpls')[0];
                    var o=pane.find("#cust_update_id");
                    o.val(item._id);
                    var qid=uuid.v1();
                    tmpl.qiniuId=qid;
                    pane.find("#tmpl_custmanage_agent_update").tmpl(tmpl).appendTo(container);
                    handler.customer._initQiniuCustomerUpload(qid,container);

                    pane.find('.date_picker').datepicker({
                        changeMonth: true,
                        changeYear: true,
                        showButtonPanel: true
                    });
                    var html=generateCCOptions(proviceCityDicKey);
                    container.find("select[name='province']").html(html);
                    handler.customer.renderCustUpdate(pane.find("form"),item,pane);

                    //load user
                    var menu=pane.find(".edit_customer").attr("menu")||"";
                    var inputId="dial_task_agent_owner_select_input";
                    var containerId="dial_task_agent_owner_select_user";

                    var _agents=filterUserByScope();
                    var _uids=[];
                    for (var i = 0; i < _agents.length; i++) {
                        var obj = _agents[i];
                        _uids.push(obj._id);
                    }
                    if(isHasFunc("func_popup_commonCust_owner")){
                        _uids.push("");
                    }
                    if($.inArray(owner,_uids)!=-1||session.user.scope=='all'){
                        utils.loadAgentComboBox(inputId,containerId,{width:"140",height:"17"},true);
                        //set owner name
                        var agentName="";
                        var agents=getCache("agents");
                        for(var i=0;i<agents.length;i++){
                            var u=agents[i];
                            if(item.owner== u._id){
                                agentName= u.displayName;
                                break;
                            }
                        }
                        if(agentName){
                            pane.find(".edit_customer").find("#"+containerId+"_input").val(agentName);
                        }
                    }else{
                        var agent=getCache("agents",owner||"NA");
                        if(agent){
                            var html='<span style="line-height:23px">'+agent.displayName+'</span>';
                            pane.find(".edit_customer").find("#"+containerId).html(html);
                        }else{
                            var html='<span style="line-height:23px">无</span>';
                            pane.find(".edit_customer").find("#"+containerId).html(html);
                        }
                    }
                    pane.find(".btn_cancel_edit").click(function(){
                        pane.empty();
                        dsevent.publish(dsevent.evt.customerAddCancel);
                    });
                });

            }else{

            }
        });
    },
    quick_subMenu_search: function (submenu,src) {
        var lastMenu=handler.customer.task.curSubMenu||'';
        var searchPane = src.closest(".left_column");
        searchPane.find(".model_submenu button").removeClass("active");
        src.addClass("active");
        handler.customer.task.curSubMenu=submenu;
        //handler.cancelDealToolbar("customer",lastMenu);
        if(submenu=='dial_task_notClosed'){
            handler.swapSubMenu(submenu,'customer/task/dial_task_list_page',"dial_task_list",true,true);
        }else if(submenu=='dial_task_closed') {
            handler.swapSubMenu(submenu,'customer/task/dial_close_task_list_page','dial_task_list',true,true);
        }else if(submenu=='dial_task_dialedNumber') {
            handler.swapSubMenu(submenu,'customer/task/dial_dialedNumber_list_page','dial_task_list',true,true);
        }else if(submenu=='dial_agent_task'){
            handler.swapSubMenu(submenu,'customer/task/task_agent_list',"dial_task_list",true,true);
        }else if(submenu=='dial_agent_task_called') {
            handler.swapSubMenu(submenu,'customer/task/task_agent_called_list','dial_task_list',true,true);
        }
    },
    showTaskAdd:function(menu,src){
        var pane=$("#view_dial_task_list_content");
        var tmpls=getCache('custTmpls');
        var dbType=tmpls[0]._id;
        DS.getView('customer/task/dial_task_add',function(view){
            view=view.replace(/_#menu#_/g,menu);
            pane.empty();
            pane.html(view);
            var s2=pane.find("select[name='source']").get(0);
            handler.customer.task.showSourceOption(dbType,s2,null,1);
        });
    },
    showSourceOption:function(dbType,node,val,selected){
        var dic=getCache('custTmpls',dbType).source;
        if(!dic) return;
        var len = dic.length;
        var count=0;
        for (var i = 0; i < len; i++) {
            var l=dic[i].options;
            var o = document.createElement("option");
            node.options.add(o);
            o.innerText = dic[i].name;
            o.value = dic[i].key;
            if (val) {
                if (o.value == val)
                    o.selected = true;
            } else {
                if (!selected) {
                    if (i == 0) o.selected = true;
                }
            }
            // if (len == 1) o.selected = true;
        }
    },
    //未关闭
    dial_task_list_page: function (menu) {
        $('.dial_task_normal_search').click();
    },
    //已关闭
    dial_close_task_list_page: function (menu) {
        //$('.dial_close_task_normal_search').click();
        var searchPane = $("#import_list_dial_task_closed");
        initQuickMenu(searchPane,handler.customer.task.quickAry,"customerTask");
    },
    customerTask_quick_search: function (data,src) {
        if(src){
            var searchPane = src.closest(".list_check_pane");
        }else{
            var searchPane = $("#import_list_dial_task_closed");
            src = searchPane.find(".quick_menu a[ds_data='"+data+"']");
        }
        searchPane.find(".quick_menu a").removeClass("quick_card_active");
        src.addClass("quick_card_active");
        searchPane.find(".quick_desc").text(src.text());
        searchPane.find("#frm_customer_advanced_search").find("input[name='status']").val(data);

        var menuLeft=searchPane.find(".quick_card");
        var _wl=menuLeft.outerWidth(true);
        //searchPane.find(".textbox_wrap").css({"margin-left":_wl+"px"});
        var pane=$("#view_dial_task_list_content");
        pane.empty();
        var btn=searchPane.find('.dial_close_task_normal_search');
        btn.click();
    },
    dial_dialedNumber_list_page: function(menu){
        $('.dial_dialedNumber_task_normal_search').click();
        handler.customer.task._initCalledSearch();
    },
    saveDialTask:function(data,src){
        if (src.hasClass("disabled")) return false;
        if(!data.taskName || data.taskName == ""){
            $().alertmessage('showError', "任务名称必须填写！");
            src.removeClass('disabled');
            return;
        }
        if(!data.effective || data.effective == ''){
            $().alertmessage('showError', "有效通话时长不能为空！");
            src.removeClass('disabled');
            return;
        }
        var dailyTaskAllAgent = data.dailyTaskAllAgent;
        if(dailyTaskAllAgent==""){
            $().alertmessage("showError",'基础任务量不能为空!');
            return;
        }
        if(dailyTaskAllAgent==0){
            $().alertmessage("showError",'基础任务量不能为0!');
            return;
        }
        if(!data.agents || data.agents.length ==0){
            $().alertmessage('showError', "请至少选择一个参与座席！");
            src.removeClass('disabled');
            return;
        }
        var container=$("#view_dial_task_list_content");
        var pane =container.find('#frm_customer_task_add');
        var menu =data.menu;
        var dTask = [];
        delete data.menu;
        var da = data.dailyTask;
        for(var i=0;i<da.length;i++){
            var daily = da[i];
            if(daily && parseInt(daily)>0){
                dTask.push(parseInt(daily));
            }
        }
        if(data.agents.length!=dTask.length){
            $().alertmessage("showError","座席任务量不能为空或0!");
            return;
        }
        data.dailyTask=dTask;
        data.effective = parseInt(data.effective);
        data.dailyTaskAllAgent = parseInt(data.dailyTaskAllAgent);
        src.addClass("disabled");
        var action = {
            action: "app.customer.task.saveDialTask",
            data: data
        };
        if(data.selectAllAgent !=null){
            delete data.selectAllAgent;
        }

        DS.send(action, function (rep) {
            if (rep.success) {
                $().alertmessage('showSuccess', "添加外呼任务成功");
                pane.empty();
                handler.customer.task.queryDialTaskList(menu);
            } else {
                $().alertmessage('showError', rep.message||errMsg);
            }
            src.removeClass('disabled');
        });

    },
    closeDialTask:function(data){
        var taskName = data.taskName;
        var taskId = data.taskId;
        var p=$('#batch_modal');
        DS.getView('customer/task/close_task',function(view){
            view = view.replace(/_#taskName#_/g,taskName).replace(/_#taskId#_/g,taskId);
            p.find('.modal-title').text('关闭任务');
            p.find(".modal-body").html(view);
            p.width(600);
            p.modal();
        });
    },
    closeTask:function(data,src){
        var menu = data.menu;
        var action = {
            action: "app.customer.task.closeDialTask",
            data: data
        };
        DS.send(action,function(response){
            if(response.success){
                $().alertmessage('showSuccess','任务关闭成功!');
                $('#batch_modal').modal('hide');
                handler.customer.task.queryDialTaskList(menu);
                var pane=$("#view_dial_task_list_content");
                pane.empty();
            }else{
                $().alertmessage('showError', response.message||errMsg);
            }
        });
    },
    cancelDeal: function (id,src) {
        var container=$("#view_dial_task_list_content");
        container.find('#'+id).empty();
    },
    getSourceName:function(val){
        var dic=getCache('custTmpls')[0].source;
        if(!dic) return;
        var len = dic.length;
        for (var i = 0; i < len; i++) {
            if(dic[i].key==val){
                return dic[i].name;
            }
        }
    },
    showDialTaskInfo:function(menu,src){
        var tId=src.find('input[name=_id]').val();
        handler.customer.task.loadDialTaskInfo(tId,menu);
    },
    loadDialTaskInfo:function(tId,menu){
        var pane=$("#view_dial_task_list_content");
        var action = {
            action: 'app.customer.task.queryDialTaskById',
            data: tId
        };
        DS.send(action, function (response) {
            if (response.success) {
                var task = response.data;
                var html = [];
                task.agentsNum = task.agents.length;
                var calledStat = response.calledStat;
                var total = task.total;
                var wCalled = total - calledStat;
                var sou = task.source;
                var source = handler.customer.task.getSourceName(sou)||"";
                var createUser = handler.customer.task.getAgentName(task.createUser);
                DS.getView('customer/task/dial_task_info', function (view) {
                    handler.customer.task._initDialTaskNullFields(task);
                    view=view.replace(/_#menu#_/g,menu).replace(/_#agents#_/g,task.agents).replace(/_#taskId#_/g,task._id)
                        .replace(/_#createUser#_/g,createUser).replace(/_#wCalled#_/g,wCalled).replace(/_#calledStat#_/,calledStat)
                        .replace(/_#source#_/g,source);
                    html.push(DS.renderMethodViewNew(view,task));
                    pane.empty();
                    pane.html(html.join(""));
                    if(task.unit == "1"){
                        $(".task_head_title i").html("任务考核:有效通话数");
                    }else{
                        $(".task_head_title i").html("任务考核:有效通话时长");
                    }
                });
            }else{
                $().alertmessage('showError', response.message||errMsg);
            }
        });
    },
    getAgentName: function (agentID) {
        if(agentID == 'interface'){
            return '接口调用';
        }
        var agent = getCacheByKey('agents', '_id', agentID);
        if (agent) {
            return agent.displayName+'['+agent.exten+']';
        } else {
            return '';
        }
    },
    showCloseDialTaskInfo:function(menu,src){
        var tId=src.find('input[name=_id]').val();
        handler.customer.task.loadCloseDialTaskInfo(tId,menu);
    },
    loadCloseDialTaskInfo:function(tId,menu){
        var pane=$("#view_dial_task_list_content");
        var action = {
            action: 'app.customer.task.queryDialTaskById',
            data: tId
        };
        DS.send(action, function (response) {
            if (response.success) {
                var task = response.data;
                var html = [];
                task.agentsNum = task.agents.length;
                var calledStat = response.calledStat;
                var total = task.total;
                var wCalled = total - calledStat;
                var sou = task.source;
                var source = handler.customer.task.getSourceName(sou);
                var createUser = handler.customer.task.getAgentName(task.createUser);
                var status = task.status;
                var url = "";
                if(status == "close"){
                    url = 'customer/task/dial_close_task_info';
                }else if(status == "archive"){
                    url = 'customer/task/dial_archive_task_info';
                }
                DS.getView(url, function (view) {
                    handler.customer.task._initDialTaskNullFields(task);
                    view=view.replace(/_#menu#_/g,menu).replace(/_#agents#_/g,task.agents).replace(/_#taskId#_/g,task._id)
                        .replace(/_#createUser#_/g,createUser).replace(/_#wCalled#_/g,wCalled).replace(/_#calledStat#_/,calledStat)
                        .replace(/_#source#_/g,source);
                    html.push(DS.renderMethodViewNew(view,task));
                    pane.empty();
                    pane.html(html.join(""));
                    if(task.unit == "1"){
                        $(".task_head_title i").html("任务考核:有效通话数");
                    }else{
                        $(".task_head_title i").html("任务考核:有效通话时长");
                    }
                });
            }else{
                $().alertmessage('showError', response.message||errMsg);
            }
        });
    },
    _initDialTaskNullFields:function(item){
        if(!item.taskName){
            item.taskName="";
        }
        if(!item.shortTime){
            item.shortTime="";
        }
        if(!item.callNo){
            item.callNo = "";
        }
        if(!item.shortCallTimeLength){
            item.shortCallTimeLength = "";
        }
        if(!item.memo){
            item.memo="";
        }
        if(!item.agents){
            item.agents=[];
        }
        if(!item.status){
            item.status="";
        }else{
            if(item.status=="dealing"){
                item.status="进行";
            }else if(item.status=="close"){
                item.status="已关闭";
            }else if(item.status=="archive"){
                item.status="已归档";
            }
        }
        if(!item.taskStatus){
            item.taskStatus="";
        }else{
            if(item.taskStatus=="dealing"){
                item.taskStatus="进行中";
            }else if(item.taskStatus=="close"){
                item.taskStatus="已关闭";
            }
        }
        if(!item.account){
            item.account="";
        }
        if(!item.total){
            item.total=0;
        }
        if(!item.assigned){
            item.assigned=0;
        }
        if(!item.createTime){
            item.createTime="";
        }
    },
    _initCloseDialTaskNullFields:function(item){
        if(!item.taskName){
            item.taskName="";
        }
        if(!item.memo){
            item.memo="";
        }
        if(!item.agents){
            item.agents=[];
        }
        if(!item.status){
            item.status="";
        }else{
            if(item.status=="dealing"){
                item.status="进行";
            }else if(item.status=="close"){
                item.status="关闭";
            }else if(item.status=="archive"){
                item.status="归档";
            }
        }
        if(!item.account){
            item.account="";
        }
        if(!item.total){
            item.total=0;
        }
        //if(!item.assigned){
        //    item.assigned=0;
        //}
        if(!item.createTime){
            item.createTime="";
        }
        if(!item.lastUpdateTime){
            item.lastUpdateTime="";
        }
    },
    _initDialTaskUserNullFields:function(data){
        if(!data._id){
            data._id = "";
        }
        if(!data.total){
            data.total=0;
        }
        if(!data.dailyTask){
            data.dailyTask=0;
        }
        if(!data.called){
            data.called=0;
        }
        if(!data.linked){
            data.linked=0;
        }
        if(!data.tCalled){
            data.tCalled=0;
        }
        if(!data.tLinked){
            data.tLinked = 0;
        }
        if(!data.createTime){
            data.createTime="";
        }
        if(!data.displayName){
            data.displayName="";
        }
        var tmls=getCache('custTmpls');
        var status = tmls[0].status;
        for(var i in status){
            if(!data[i]){
                data[i]=0;
            }
        }
    },
    _initAgentTaskNullFields:function(data){

    },
    getUnassigned:function(total,assigned){
        return total-assigned;
    },
    //移除座席
    removeDialTaskAgent:function(data,src){
        var arr=data.split("|");
        var id = arr[0];
        var displayName = arr[1];
        var menu =arr[2];
        var arr2=id.split("_");
        var taskId=arr2[0];
        var agentId=arr2[1];
        var p=$('#batch_modal');
        DS.getView('customer/task/remove_dial_task_agent',function(view){
            p.find('.modal-title').text('移除座席');
            view=view.replace(/_#taskId#_/g,taskId).replace(/_#agentId#_/g,agentId).replace(/_#displayName#_/g,displayName).replace(/_#menu#_/g,menu);
            p.find(".modal-body").html(view);
            p.width(600);
            p.modal();
        });

    },
    removeTaskAgent:function(data,src){
        var taskId = data.taskId;
        var agentId = data.agentId;
        var menu = data.menu;
        var action={
            action:"app.customer.task.removeDialTaskAgent",
            data:{taskId:taskId,agentId:agentId}
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                var p=$('#batch_modal');
                p.modal('hide');
                handler.customer.task.loadDialTaskInfo(taskId,menu);
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    showSelectUser:function(data){
        var menu = data.menu;
        var agents = data.agents;
        var taskId = data.taskId;
        var p=$('#batch_modal');
        DS.getView('customer/task/task_select_user',function(view){
            p.find('.modal-title').text('选择参与任务的座席');
            view=view.replace(/_#menu#_/g,menu).replace(/_#agents#_/g,agents).replace(/_#taskId#_/g,taskId);
            p.find(".modal-body").html(view);
            p.width(600);
            p.modal();
        });
    },
    saveAgentsAssign:function(data,src){
        if(!data.agents || data.agents.length ==0){
            $().alertmessage('showError',"请选择参与座席!");
            return;
        }
        //var dTask = [];
        //var dTasks = [];
        //var da = data.dailyTask;
        //for(var i=0;i<da.length;i++){
        //    var daily = da[i].toString();
        //    if(daily==""){
        //        continue;
        //    }
        //    dTask.push(daily);
        //}
        //for(var j=0;j<data.agents.length;j++){
        //    var dailys = dTask[j];
        //    dTasks.push(dailys);
        //}
        var taskId = data.taskId;
        var sendData = {
            _id:taskId,
            agents:data.agents,
            //dailyTask:dTasks
        };
        var action = {
            action: "app.customer.task.saveAgentsAssign",
            data: sendData
        };

        DS.send(action, function (rep) {
            if (rep.success) {
                $().alertmessage('showSuccess', "添加参与座席成功");
                $('#batch_modal').modal('hide');
                handler.customer.task.loadDialTaskInfo(taskId,data.menu);
            } else {
                $().alertmessage('showError', rep.message||errMsg);
            }
        })
    },

    getTaskName:function(taskId){
        if(taskId==null){
            return "";
        }
        var taskDic = getCache("taskCache");
        for(var i=0;i<taskDic.length;i++){
            var obj = taskDic[i];
            if(obj._id == taskId){
                return obj.taskName || "";
            }
        }
        return "";
    },
    getDialStatus:function(taskCalled){
        if(!taskCalled){
            return "";
        }
        if(taskCalled =="2"){
            return "未拨打";
        }else if(taskCalled =="0"){
            return "未接听";
        }else if(taskCalled =="1"){
            return "已接听";
        }
        return "";
    },

    showAssignCustForAgent:function(data,src){
        var arr = data.split("|");
        var id = arr[0];
        var total = arr[1];
        var called = arr[2];
        var arr2 =id.split("_");
        var taskId = arr2[0];
        var agent = arr2[1];

        var p=$('#batch_modal');
        var pane=$(handler.customer.task.paneId);
        var noAssigned = parseInt(pane.find(".task_import_section .noAssigned").text());
        var noCall = handler.customer.task.calculateNum('noCall',total,called);
        DS.getView('customer/task/agent_customer_assign',function(view){
            p.find('.modal-title').text('调整数量');
            view=view.replace(/_#agent#_/g,agent).replace(/_#taskId#_/g,taskId).replace(/_#noAssigned#_/g,noAssigned).replace(/_#noCall#_/g,noCall);
            p.find(".modal-body").html(view);
            if(src.hasClass("icon-plus")) {
                $("#update_popover").find(".update_popover_addNum").show();
            }else if(src.hasClass("icon-minus")){
                $("#update_popover").find(".update_popover_reduceNum").show();
            }
            p.width(600);
            p.modal();
        });
    },
    saveAssignCustForAgent:function(data,src){
        var pane = $("#update_popover");
        var noAssigned = parseInt(pane.find(".noAssigned").text());
        var noCall =  parseInt(pane.find(".noCall").text());
        var status = getCache("custTmpls")[0].status;
        var action={};
        if(data.addNum == "" && data.reduceNum == ""){
            $().alertmessage('showError', "请填写数量");
            return;
        }else if(data.addNum !=""){
            if(parseInt(data.addNum,10) > noAssigned){
                $().alertmessage('showError', "增加数量不能大于待分配客户数量");
                return;
            }
            action.action = "app.customer.task.saveCustAssign";
            action.data={total:noAssigned,taskId:data.taskId,status:status,owners:[{owner:data.agentId,count:parseInt(data.addNum,10)}] };
        }else{
            if(parseInt(data.reduceNum,10) > noCall){
                $().alertmessage('showError', "减少数量不能大于未拨打客户数量");
                return;
            }
            action.action = "app.customer.task.reduceCustForAgent";
            action.data={taskId:data.taskId,agentId:data.agentId,reduceNum:data.reduceNum,noCall:noCall,status:status};
        }
        DS.send(action, function (rep) {
            if (rep.success) {
                $().alertmessage('showSuccess', "调整座席未拨打客户数量成功");
                $('#batch_modal').modal('hide');
                handler.customer.task.loadTaskInfo(data.taskId,data.menu);
                //handler.customer.task.reLoadNum(data.taskId);
            }else{
                if(rep.code=='1001'){
                    $().alertmessage('showError', "待分配客户数量发生变化，请重新确认后再操作");
                }else{
                    $().alertmessage('showError',rep.message || errMsg);
                }
            }
        });
    },

    showTaskAssign:function(data,src){
        var pane=$(handler.customer.task.paneId);
        var p=$('#batch_modal');
        var taskId = data.taskId;
        var agents = data.agents.split(",");
        var menu = data.menu;
        var sendData = {
            taskId:taskId,
            agents:data.agents,
        };
        var action = {
            action :"app.customer.task.showDailyTask",
            data : sendData
        }
        DS.send(action,function(rep){
            var effective = rep.effective;
            var dailyTaskAllAgent = rep.dailyTaskAllAgent;
            var unit = rep.unit;
            var memo = rep.memo;
            var list = rep.list||[];
            DS.getView('customer/task/dial_customer_assign',function(view){
                view=view.replace(/_#taskId#_/g,taskId).replace(/_#menu#_/g,menu).replace(/_#agents#_/,agents).replace(/_#memo#_/g,memo);
                p.find('.modal-title').text('修改日均任务');
                p.find(".modal-body").html(view);
                p.width(650);
                p.modal();
                var users=filterUserByScope();
                var _agents =[];
                for(var i=0;i<agents.length;i++){
                    var agentId = agents[i];
                    for(var j=0;j<users.length;j++){
                        var user = users[j];
                        if(user._id==agentId){
                            for(var w=0;w<list.length;w++){
                                var li = list[w];
                                if(user._id==li.agent){
                                    user.dailyTask = li.dailyTask;
                                    _agents.push(user);
                                }
                            }
                        }
                    }
                }
                //参与座席
                _agents=handler.customer.task._bubbleSort(_agents);
                var html=[];
                for(var i=0;i<_agents.length;i++){
                    var u=_agents[i];
                    if(u.status=='enable'){
                        var tmpl= p.find("#tmpl_task_cust_assign").tmpl(u).get(0).outerHTML;
                        // if((i+1)%3==1){
                        //     html.push('<div class="row-fluid">'+tmpl);
                        // }else if((i+1)%3==0){
                        //     html.push(tmpl+'</div>');
                        // }else{
                        html.push(tmpl);
                        // }
                    }
                }
                // if(_agents.length%3==1){
                //     html.push('<div class="span8"></div></div>');
                // }else if(_agents.length%3==2){
                //     html.push('<div class="span4"></div></div>');
                // }
                $(".task_cust_assgin_container",p).html(html.join(""));
                $(".user_cust",p).keyup(function (event) {
                    var e = event.keyCode;
                    if ((e >= 48 && e <= 57) ||(e >= 96 && e <= 105) || e == 8) {
                        var len = $(".user_cust",p).length;
                        var sum = 0;
                        for(var xx=0;xx<len;xx++){
                            var inputval = $(".user_cust",p).get(xx).value;
                            if(inputval){
                                sum+= parseInt($(".user_cust",p).get(xx).value);
                            }
                        }
                    }
                });
                var unitT = "";
                if (unit == "1") {
                    unitT = "通";
                } else {
                    unitT = "分钟";
                }
                p.find("input[name=dailyTaskAllAgent]").val(dailyTaskAllAgent);
                p.find("input[name=effective]").val(effective);
                $(".unit").html(unitT);
                $("input[name='unit'][value="+unit+"]").attr("checked",true)
            });
        });
    },
    _bubbleSort: function(array) {
        var i = 0,
            len = array.length,
            j, d;
        for (; i < len; i++) {
            for (j = 0; j < len; j++) {
                if (parseInt(array[i].exten,10) < parseInt(array[j].exten,10)) {
                    d = array[j];
                    array[j] = array[i];
                    array[i] = d;
                }
            }
        }
        return array;
    },
    saveDailyTask:function(data,src){
        var p=$('#batch_modal');
        var owners=data.owner;
        var assigns=data.assign;
        var taskId=data.taskId;
        var menu = data.menu;
        var dailyTaskAllAgent = data.dailyTaskAllAgent;
        if(dailyTaskAllAgent==""){
            $().alertmessage("showError",'基础任务量不能为空!');
            return;
        }
        if(dailyTaskAllAgent==0){
            $().alertmessage("showError",'基础任务量不能为0!');
            return;
        }
        if(!assigns){
            $().alertmessage("showError",'您还没有参与座席，请增加参与座席后再分配!');
            p.modal('hide');
            return;
        }
        var total = parseInt(p.find(".cust_count").text());
        var filter=[];
        var assginNum=0;
        for(var i=0;i<assigns.length;i++) {
            var t=assigns[i];
            if(t && parseInt(t)>0){
                assginNum+=parseInt(t,10);
                filter.push({owner:owners[i],count:parseInt(t,10)});
            }else{
                $().alertmessage("showError","座席任务量不能为空或0!");
                return;
            }
        }
        data.dailyTaskAllAgent = parseInt(dailyTaskAllAgent,10);
        data.owners = filter;
        if(assginNum>total){
            $().alertmessage('showError', "分配客户的总数不能超过【"+total+"】个");
            return;
        }
        var action={
            action:'app.customer.task.saveDailyTask',
            data : data
        };
        DS.send(action,function(rep){
            if(rep.success){
                $().alertmessage('showSuccess', "修改完成");
                p.modal('hide');
                handler.customer.task.loadDialTaskInfo(taskId,menu);
            }else{
                if(rep.code=='1001'){
                    $().alertmessage('showError', "您分配的数据总数发生变化，请重新确认后再操作");
                }else{
                    $().alertmessage('showError',rep.message || errMsg);
                }
            }
        },"POST");
    },

    cancelCustAssign:function(){
        $('#batch_modal').modal('hide');
    },
    /*******import excel**************/
    importCust:function(data,src){
        if (src.hasClass("disabled")) return false;
        var taskId = data.taskId;
        var menu = data.menu;
        if(menu){
            delete data.menu;
        }
        data.dic={};
        data.flag="start";
        data.batchNo=data.batchNo+(data.batchRemark=='添加批次说明'?'':data.batchRemark);
        delete data.batchRemark;
        if (document.getElementById("fileToUpload").files.length == 0){
            $().alertmessage('showError', "请选择文件!");
            return;
        }
        if(data.batchNo==""){
            $().alertmessage('showError', "导入批次不能为空");
            return;
        }
        src.addClass("disabled");
        var action = {
            action: 'app.customer.task.import',
            data: data
        };
        DS.send(action,function(rep) {
            if(rep.success){
                $().alertmessage('showSuccess', "号码已导入");
                handler.customer.task.loadDialTaskInfo(taskId,menu);
                handler.customer.task.queryDialTaskList(data,src);
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
            var file = $("#fileToUpload");
            file.after(file.clone().val(""));
            file.remove();
            var pane=$("#customer_task_import_add");
            pane.find("input[name='batchNo']").val("");
            src.removeClass("disabled");
        });

    },
    uploadSucess:function(evt){
        var rep = $.parseJSON(evt.target.responseText);
        if(rep && !rep.success){
            $().alertmessage('showError', "上传文件失败，请检查网络或文件是否正确");
            return;
        }
        var fileName=rep.filePath.substring(rep.filePath.lastIndexOf("/")+1);
        var trueName=rep.fileName;
        var pane=$("#customer_task_import_add");
        pane.find("input[name='fileName']").val(fileName);
        pane.find("input[name='trueName']").val(trueName);
        var time=getDateNo();
        pane.find("input[name='batchNo']").val(time);
    },
    //重置导入详情查询
    resetImportDetail:function(data,src){
        var frm=src.closest("form");
        frm[0].reset();
    },
    uploadError:function(evt){
        $().alertmessage('showError', "上传失败");
    },
    //显示导入明细
    showTaskImportDetail:function(data){
        var taskId = data.taskId;
        var p=$('#batch_modal');
        DS.getView('customer/task/dial_task_import_detail',function(view){
            view=view.replace(/_#taskId#_/g,taskId);
            p.width(600);
            p.find('.modal-title').text('导入明细');
            p.find(".modal-body").html(view);
            p.find(".task_query_import_detail").click();
            p.modal();
        });
    },
    showDuplicateData:function(data){
        var taskId = data.taskId;
        var p=$("#batch_modal");
        DS.getView('customer/task/dial_customer_duplicate_data',function(view){
            view=view.replace(/_#taskId#_/g,taskId);
            p.width(600);
            p.find('.modal-title').text('重复数据');
            p.find(".modal-body").html(view);
            p.find(".task_query_duplicate_data_detail").click();
            p.modal();
        });
    },
    showNADataDetail:function(data){
        var taskId = data.taskId;
        var p=$("#batch_modal");
        DS.getView('customer/task/dial_customer_na_data',function(view){
            view=view.replace(/_#taskId#_/g,taskId);
            p.width(600);
            p.find('.modal-title').text('未拨号码');
            p.find('.modal-body').html(view);
            p.find(".task_query_na_data_detail").click();
            p.modal();
        });
    },
    //导出未拨号码
    exportDataDetail:function(data,src){
        var taskId = data.taskId;
        var query = {taskId:taskId};
        var action = {
            action: 'app.customer.task.exportCustomerTask',
            data: {Method:'exportCustomerTask',Query:query}
        };
        DS.send(action,function(rep) {
            if(rep.Succeed){
                downloadFile(rep.path);
                $().alertmessage('showSuccess', "导出成功，请到文件目录下查看!");
            }else{
                if(rep.message == '404'){
                    $().alertmessage('showError', "导出失败，可导出未拨号码数量为0!");
                }else{
                    $().alertmessage('showError', rep.message||errMsg);
                }
            }
        });
    },
    //导出录音
    exportDialSound : function(data,src){
        var action = {
            action: 'app.customer.task.exportDialSound',
            data: data
        };
        DS.send(action,function(rep) {
            if(rep.success){
                var p=$("#batch_modal");
                DS.getView('customer/task/exportDialSoundSuccess',function(view){
                    p.width(600);
                    p.find('.modal-title').text('导出录音');
                    p.find('.modal-body').html(view);
                    p.modal();
                });
            }else{
                if(rep.message == '404'){
                    $().alertmessage('showError', "导出录音失败，可获得录音数量为0!");
                }else{
                    $().alertmessage('showError', "导出录音失败"+rep.message);
                }
            }
        });
    },
    downloadTmpl:function(){
        var url="./template/customerTask_template.xlsx?1";
        DS.downloadFile(url);
    },
    queryImportDetail:function(data,src){
        var p=$('#batch_modal');
        data=data||{};
        var page=1;
        page=src.val();
        var frm = $("#task_import_detail_query_form");
        data.taskId = frm.find("input[name='taskId']").val();
        var batchNo = frm.find("input[name='batchNo']").val();
        if(batchNo && batchNo!=""){
            data.batchNo = batchNo;
        }

        if(!page)page=1;
        data.page=page;
        data.limit=handler.customer.task.limit;
        var action = {
            action: 'app.customer.task.queryImportDetail',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var list = response.list;
                var count = response.count;
                if (list.length > 0){
                    DS.getView('customer/task/dial_task_import_detail_item', function (view) {
                        var html = [];
                        for (var i = 0;i<list.length; i++) {
                            var row = list[i];
                            row.flagDic=getDicCacheName('impTaskStatus',row.flag);
                            handler.customer.task._initImportDetailFiled(row);
                            html.push(DS.renderMethodViewNew(view, row));
                        }
                        p.find('.task_import_detail_list').html(html.join(''));
                    });
                } else {
                    var html='<tr><td class="text-center" colspan="10">没有记录!</td></tr>';
                    p.find('.task_import_detail_list').html(html);
                }
                var frmId="frm_task_import_detail_search";
                DS.updatePagination(frmId, count, data.limit, data.page);
            }else{
                $().alertmessage('showError', response.message||errMsg);
            }
        });
    },
    queryDuplicateDataDetail:function(data,src){
        var p=$('#batch_modal');
        data=data||{};
        var page=1;
        if(src && !src.hasClass("ds_form_action")){
            page=src.val();
            var frm = $("#task_duplicate_detail_query_form");
            data.taskId = frm.find("input[name='taskId']").val();
        }
        if(!page)page=1;
        data.page=page;
        data.limit=handler.customer.task.limit;
        var action = {
            action: 'app.customer.task.queryDuplicateDataDetail',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var list = response.list;
                var count = response.count;
                if (list.length > 0){
                    var html = [];
                    DS.getView('customer/task/dial_customer_duplicate_data_item', function (view) {
                        for (var i = 0;i<list.length; i++) {
                            var _obj = list[i];
                            handler.customer.task._initDuplicateDataDetailFiled(_obj);
                            html.push(DS.renderMethodViewNew(view,_obj));
                        }
                        p.find('.task_duplicate_data_detail_list').html(html.join(''));
                    });
                } else {
                    var html='<tr><td class="text-center" colspan="10">没有记录!</td></tr>';
                    p.find('.task_duplicate_data_detail_list').html(html);
                }
                var frmId="frm_task_duplicate_detail_search";
                DS.updatePagination(frmId, count, data.limit, data.page);
            }else{
                $().alertmessage('showError', response.message||errMsg);
            }
        });
    },
    queryNADataDetail:function(data,src){
        var p=$('#batch_modal');
        data=data||{};
        var page=1;
        if(src && !src.hasClass("ds_form_action")){
            page=src.val();
            var frm = $("#task_na_detail_query_form");
            data.taskId = frm.find("input[name='taskId']").val();
        }
        if(!page)page=1;
        data.page=page;
        data.limit=handler.customer.task.limit;
        var action = {
            action: 'app.customer.task.queryNADataDetail',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var list = response.list;
                var count = response.count;
                if (list.length > 0){
                    DS.getView('customer/task/dial_customer_na_data_item', function (view) {
                        var html = [];
                        for (var i = 0;i<list.length; i++) {
                            var row = list[i];
                            handler.customer.task._initDuplicateDataDetailFiled(row);
                            html.push(DS.renderMethodViewNew(view, row));
                        }
                        p.find('.task_na_data_detail_list').html(html.join(''));
                    });
                } else {
                    var html='<tr><td class="text-center" colspan="10">没有记录!</td></tr>';
                    p.find('.task_na_data_detail_list').html(html);
                }
                var frmId="frm_task_na_detail_search";
                DS.updatePagination(frmId, count, data.limit, data.page);
            }else{
                $().alertmessage('showError', response.message||errMsg);
            }
        });
    },
    _initImportDetailFiled:function(data){
        if(!data.status){
            data.status="";
        }
        if(!data.source1){
            data.source1="";
        }
        if(!data.createTime){
            data.createTime="";
        }
        if(!data.creator){
            data.creator="";
        }
    },
    _initDuplicateDataDetailFiled:function(data){
        if(!data.name){
            data.name="";
        }
        if(!data.phone){
            data.phone="";
        }
        if(!data.title){
            data.title="";
        }
    },
    showFieldDesc:function(type,val,dbType){
        var desc='';
        var dic=getCache('custTmpls',dbType);

        if(type=="impCustomerStatus"){
            var status = dic.status ||{};
            if(status[val]){
                desc=status[val];
            }
        }else if(type=="impCustomerSource1"){
            var source = dic["source"] ||[];
            for(var i=0;i<source.length;i++){
                var l = source[i];
                if(l.key ==val){
                    desc= l.name;
                }
            }
        }else if(type=="impCustomerCreator"){
            var agents=getCache("agents");
            for(var i=0;i<agents.length;i++){
                var l = agents[i];
                if(l._id ==val){
                    desc= l.displayName+"["+ l.exten+"]";
                }
            }
        }else if(type=="impCustomerIsPhone"){
            if(val=="global"){
                desc = "全局";
            }else if(val == "allPlan"){
                desc = "所有任务";
            }else if(val == "plan"){
                desc = "当前任务";
            }
        }
        return desc;
    },
    showTaskImort:function(data,src){
        var taskId = data.taskId;
        var p=$('#batch_modal');
        DS.getView('customer/task/customer_import_add',function(view){
            view=view.replace(/_#taskId#_/g,taskId);
            p.find('.modal-title').html('<span class="active ds_do_action" ds_action="customer.task.showImportTab" ds_data="customer_task_import_add" style="font-size: 16px;">导入号码</span><span class="ds_do_action" ds_action="customer.task.showImportTab" ds_data="customer_task_import_history" style="font-size: 16px;">导入历史</span>');
            p.find(".modal-body").html(view);
            p.width(730);
            p.find(".task_query_import_detail").click();
            p.modal();
        });
    },
    showImportTab:function(data ,src){
        var pane = $("#"+data);
        src.addClass("active").siblings().removeClass("active");
        pane.show().siblings().hide();
    },

    parseCustomFields:function(customFields){
        var fields=[];
        for(var i=0;i<customFields.length;i++){
            var row=customFields[i];
            fields.push(row);
        }
        return fields;
    },
    autoAssgin:function(data,src){
        var frm=src.closest("form");
        var assgins=frm.find("input[name='assign[]']");
        var total = parseInt(frm.find(".cust_count").text());
        var num=frm.find("input[name='dailyTaskAllAgent']").val();
        assgins.each(function(i){
            $(this).val(num);
        });
        for(var i=0;i<total-(assgins.length*num);i++){
            assgins[i].value=parseInt(assgins[i].value)+1;
        }
        frm.find(".cust_more_count").text("0");
    },
    resetAssgin:function(data,src){
        var frm=src.closest("form");
        var assgins=frm.find("input[name='assign[]']");
        var total = parseInt(frm.find(".cust_count").text());
        assgins.each(function(i){
            $(this).val("0");
        });
        frm.find(".cust_more_count").text(total);
    },
    archiveCustomer: function(data,src){
        var taskName = data.taskName;
        var taskId = data.taskId;
        var p=$('#batch_modal');
        DS.getView('customer/task/archive_task',function(view){
            view = view.replace(/_#taskName#_/g,taskName).replace(/_#taskId#_/g,taskId);
            p.find('.modal-title').text('归档任务');
            p.find(".modal-body").html(view);
            p.width(600);
            p.modal();
        });
    },
    archiveTask:function(data,src){
        var menu = data.menu;
        var action = {
            action:'app.customer.task.archiveCustomer',
            data: data
        }
        DS.send(action, function (response) {
            if(response.success){
                $().alertmessage('showSuccess', "归档成功!");
                $('#batch_modal').modal('hide');
                handler.customer.task.queryCloseDialTaskList(menu);
                var pane  = $("#view_dial_task_list_content");
                pane.empty();
            }else{
                $().alertmessage('showError',response.message||errMsg );
            }
        });
    },


    //wyktest
    //座席-查询座席任务列表
    queryAgentTaskList :function (data,src){
        var sendData ={};
        if(src && src.hasClass("ds_form_action")){//查询按钮
            menu = data.menu;
            if(data.taskName && data.taskName!=""){
                sendData.taskName = data.taskName;
            }
        }else if(src && !src.hasClass("ds_do_action")) {//分页
            var frm = $("#frm_task_agent_search");
            menu = frm.find("input[name='menu']").val();
            var taskName = frm.find("input[name='taskName']").val();
            if(taskName && taskName!=""){
                sendData.taskName = taskName;
            }
        }
        var page=1;
        if(src && !src.hasClass("ds_do_action"))page=src.val();
        if(!page)page=1;
        sendData.page=page;
        sendData.limit = handler.customer.task.limit
        sendData.agentId = session.user._id;
        var action = {
            action:'app.customer.task.queryAgentTaskList',
            data:sendData
        };
        DS.send(action,function(response){
            if(response.success){
                var list = response.list;
                var formID ="frm_task_agent_search";
                if(list.length > 0){
                    DS.getView("customer/task/task_agent_list", function (data) {
                        $("#view_agent_dial_task_list").html(data);
                        var listPane = $('#agent_list_pane');
                        var html = [];
                        for (var i = 0; i < list.length; i++) {
                            var _obj=list[i];
                            handler.customer.task._initDialTaskNullFields(_obj);
                            html.push($('#customer_agent_task_page_item').tmpl(_obj).get(0).outerHTML);
                        }
                        listPane.html(html.join(""));
                        resize();
                        DS.updatePagination(formID, response.count, sendData.limit, sendData.page);
                    });
                }else{
                    var listPane = $('#agent_list_pane');
                    var html='<div class="alert">未找到任务!</div>';
                    listPane.html(html);
                    resize();
                    DS.updatePagination(formID, response.count, sendData.limit, sendData.page);
                }
            }else{

            }
        });
    },
    rebuildTaskid: function (taskid) {
        var keylist = taskid.split('-');
        var keystr = keylist.join('');
        return keystr;
    },
    buildStorageObj: function (taskId, value) {
        var cacheStr = '';
        var cacheObj = {};
        cacheStr = '{"taskid"'+':"'+taskId+'","value"'+':"'+value+'"}';
        cacheObj = JSON.parse(cacheStr);
        return cacheObj;
    },
    mergeStorageObj: function (branch) {
        var newArr = [];
        if (handler.customer.task.trunkArr.length > 0) {
            for (var i=0;i<handler.customer.task.trunkArr.length;i++) {
                if (handler.customer.task.trunkArr[i].taskid == branch.taskid) {
                    handler.customer.task.trunkArr[i].value = branch.value;
                }
                newArr[i] = handler.customer.task.trunkArr[i];
            }
            handler.customer.task.trunkArr = newArr;
        } else {
            handler.customer.task.trunkArr.push(branch);
        };
    },
    saveStorageObj: function (taskId,boole) {
        var localStr = '';
        handler.customer.task.branchObj = handler.customer.task.buildStorageObj(taskId, boole);
        handler.customer.task.mergeStorageObj(handler.customer.task.branchObj);
        localStr = JSON.stringify(handler.customer.task.trunkArr);
        localStorage.task = localStr;
    },
    checkStorageObj: function (taskId) {
        var localArr = localStorage.task ? JSON.parse(localStorage.task) : [],
            control = 'false';
        for (var i=0;i<localArr.length;i++) {
            if (localArr[i].taskid) {
                control = localArr[i].taskid == taskId ? localArr[i].value : 'false';
                return control;
            }
        }
        return control;
    },
    showAgentTaskInfo:function(data,src){
        var sendData = {};
        sendData.taskId = data;
        var newTaskId = handler.customer.task.rebuildTaskid(data);
        sendData.agent = session.user._id;
        var action = {
            action:'app.customer.task.queryAutoCallPhone',
            data:sendData
        };

        //当前任务统计信息
        var currentDailyTask = handler.customer.task.currentDailyTask;
        var currentDailyCalled = handler.customer.task.currentDailyCalled;
        var currentDailyTaskAgent = handler.customer.task.currentDailyTaskAgent;
        var unit = handler.customer.task.currentUnit;

        //任务类型为有效通话
        if(unit == 1 ){
            if(currentDailyCalled >= currentDailyTask && currentDailyTask!=0){
                // 完成任务
                if (handler.customer.task.checkStorageObj(newTaskId) == 'false') {
                    var pop = $("#task_status_pop");
                    pop.find("dl").removeClass("nono").find("dd").html("您已完成当日任务");
                    pop.width(350).css({"background": "#f2f2f2", "min-width": "350px"});
                    pop.modal();
                    handler.customer.task.saveStorageObj(newTaskId,'true');
                }
            }else{
                // 没有完成任务
                if (handler.customer.task.checkStorageObj(newTaskId)) {
                    // 完成过任务并重置了任务
                    handler.customer.task.saveStorageObj(newTaskId,'false');
                }
            }
        }else{
            if(currentDailyTaskAgent >= currentDailyTask && currentDailyTask!=0){
                if (handler.customer.task.checkStorageObj(newTaskId) == 'false') {
                    var pop = $("#task_status_pop");
                    pop.find("dl").removeClass("nono").find("dd").html("您已完成当日任务");
                    pop.width(350).css({"background": "#f2f2f2", "min-width": "350px"});
                    pop.modal();
                    handler.customer.task.saveStorageObj(newTaskId,'false');
                }
            }else{
                // 没有完成任务
                if (handler.customer.task.checkStorageObj(newTaskId)) {
                    // 完成过任务并重置了任务
                    handler.customer.task.saveStorageObj(newTaskId,'false');
                }
            }
        }

        DS.send(action,function(response){
            if(response.success){
                if(response.notFindNumber){
                    var pop = $("#task_status_pop");
                    pop.find("dl").addClass("nono").find("dd").html("当前任务已没有未拨号码");
                    pop.width(350).css({"background": "#f2f2f2", "min-width": "350px"});
                    pop.modal();
                    //进行中如果没有号码.清空上下元素 重新加载
                    if($("#agent_save_or_update_info").find(".task_intrbg").length == 0) {
                        var sendData = {"taskId":response.task._id}
                        handler.customer.task._loadTaskDailStats(sendData,"",function(dataStats){
                            $("#agent_save_or_update_info").empty().prepend('' +
                                '<div class="task_intrbg"></div>    <div class="customer_container clearfix">'+
                                '</div> <div class="cust_tab_content"> </div>');
                            var percent = 100 * dataStats.taskUserDaily.linked / (dataStats.taskUser.dailyTask || 1)||0;
                            if (dataStats.taskUserDaily.linked>dataStats.taskUser.dailyTask) {
                                percent = 100;
                            }
                            handler.customer.task.drawCircleView([100-percent,percent],dataStats.taskUserDaily.linked);
                            $('#agent_task_detail_pane').empty();
                            $("#agent_task_detail").tmpl(dataStats).appendTo('#agent_task_detail_pane');handler.customer.task.drawCircleView([100-percent,percent],dataStats.taskUserDaily.linked);
                        });
                    }
                }else{
                    DS.getView("customer/task/task_agent_content", function (view) {
                        //渲染页面样本号码信息
                        $("#view_dial_task_list_content").html(view).find(".task_intrbg").remove();
                        $("#agent_task_detail_pane").empty();
                        $("#agent_sample_detail").tmpl(response).appendTo('#agent_task_detail_pane');

                        var sendData = {"taskId":response.task._id}
                        handler.customer.task._loadTaskDailStats(sendData,"",function(dataStats){
                            var percent = 100 * dataStats.taskUserDaily.linked / (dataStats.taskUser.dailyTask || 1)||0;
                            if (dataStats.taskUserDaily.linked>dataStats.taskUser.dailyTask) {
                                percent = 100;
                            }
                            handler.customer.task.drawCircleView([100-percent,percent],dataStats.taskUserDaily.linked);
                        });

                        var pane = $("#agent_save_or_update_info");
                        pane.data("custInfo",{
                            name:response.sample.name,
                            sampleId:response.sample._id,
                            source:response.task.source,
                            taskId:response.task._id,
                            phone:response.sample.phone,
                            note:response.sample.title,
                            flag:'taskAgentAdd'});

                        //挂断所需数据
                        var commitInfo = $("#agent_task_commit_info");
                        commitInfo.data("commitInfo",{
                            sampleId:response.sample._id,
                            unit:response.task.unit,
                            taskId:data});

                        //新获取才打电话
                        if(response.isNewFlag){
                            softphonebar_dialout(checkEncryptTel(response.sample.phone),"SAMPLEID:"+response.sample._id);
                        }
                        //渲染用户添加或修改用户界面
                        handler.customer.task.queryCustByPhone(response,null);
                    });
                }

            }else{
                $().alertmessage('showError', response.message||errMsg);
            }
        });

        //handler.customer.task.queryTaskDetail(data,menu);
    },
    //座席-任务明细
    queryTaskDetail : function (data,menu){
        var action = {
            action:'app.customer.task.queryTaskDetail',
            data:data
        };
        DS.send(action,function(response){
            if(response.success){
                //查到未播号码
                if(response.sample){
                    handler.customer.task.showAgentTaskInfo(data);
                }else{
                    var percent = 100 * response.taskUserDaily.linked / (response.taskUser.dailyTask || 1)||0;
                    if (response.task.unit==1) {
                        response.task.uword = "通";
                    }else{
                        response.task.uword = "分钟";
                    }
                    //设置任务信息
                    handler.customer.task.currentDailyTask = response.taskUser.dailyTask;
                    handler.customer.task.currentDailyCalled = response.taskUserDaily.linked;
                    handler.customer.task.currentDailyTaskAgent = response.taskUser.dailyTaskAgent;
                    handler.customer.task.currentUnit = response.task.unit;

                    DS.getView("customer/task/task_agent_content", function (view) {
                        var html ={};
                        $("#view_dial_task_list_content").html(view);
                        var  pane = $("#view_dial_task_list_content");
                        var createUser = handler.customer.task.getAgentName(response.task.createUser);
                        handler.customer.task._initDialTaskNullFields(response.task);
                        response.task.createUser =  createUser;
                        $("#agent_task_detail").tmpl(response).appendTo('#agent_task_detail_pane');
                        handler.customer.task.drawCircleView([100-percent,percent],response.taskUserDaily.linked);
                        var lesHeight = $(window).height() - 51 - 143;
                        $("#agent_sample_info").css("height", lesHeight);
                    });
                }
            }else{
                $().alertmessage('showError', response.message||errMsg);
            }
        });
    },
    //座席-获得当前任务列表中的一个电话
    queryAutoCallPhone : function (data,src){
        //handler.customer.task.autoCallIndex = 0;
        var sendData ={};
        sendData.taskId = data;
        var action = {
            action:'app.customer.task.queryAutoCallPhone',
            data:sendData
        };
        DS.send(action,function(response){
            if(response.success){
                if(response.sample.phone){

                    //拨打电话
                    $("#agent_sample_info").empty();
                    //response.taskId = data;
                    $("#agent_sample_detail").tmpl(response.sample).appendTo('#agent_sample_info');
                    $("#currentPhone").text(response.sample.phone);
                    // softphonebar_dialout(response.doc.phone[0].tel,"SAMPLEID:"+response.doc._id);
                    handler.customer.task.queryCustByPhone(response.sample,src);

                }else{
                    $().alertmessage('showError', "没有可以拨打的电话！");
                }
            }else{
                $().alertmessage('showError', response.message||errMsg);
            }
        });
    },
    _loadCalledTaskInfo : function (taskId,phone,owner){
        var data  = {};
        data._id = taskId;
        data.phone = phone;
        data.owner = owner;
        var action = {
            action:'app.customer.task.queryCallSheetByCustSample',
            data:data
        };
        DS.send(action,function(response){
            if(response.success){
                var pane = $("#agent_called_task_info").find(".cust_tab_content");

                var url = "customer/task/task_agent_called_info";
                if(!response.callSheet){
                    url ="customer/task/task_agent_called_info_nosheet";
                }
                DS.getView(url, function (view) {
                    $("#agent_called_task_info").find(".cust_tab_content").empty();
                    //通话详情
                    var agentName = handler.customer.task.getAgentName(response.createUser);
                    var taskStatus = response.taskStatus;
                    if(taskStatus == "dealing"){
                        taskStatus = "进行中";
                    }else if(taskStatus == "close"){
                        taskStatus = "已关闭";
                    }
                    var owner = response.sample.owner;
                    if(owner != "NA"){
                        owner = handler.customer.task.getAgentName(response.sample.owner);
                    }
                    var callSheet = response.callSheet;
                    if(callSheet){
                        var city=(callSheet.PROVINCE==callSheet.DISTRICT)?callSheet.PROVINCE:callSheet.PROVINCE+"-"+callSheet.DISTRICT;
                        view = view.replace(/_#taskName#_/g,response.taskName).replace(/_#createUser#_/g,agentName)
                            .replace(/_#taskStatus#_/g,taskStatus).replace(/_#createTime#_/g,response.createTime).replace(/_#memo#_/g,response.title).replace(/_#owner#_/g,owner).replace(/_#city#_/g,city)
                            .replace(/_#phone#_/g,checkHideTel(response.sample.phone)).replace(/_#title#_/g,response.sample.title)
                            .replace(/_#custName#_/g,response.sample.name);
                        showCdrTel(response.callSheet);
                        view = DS.renderMethodViewNew(view, response.callSheet);
                    }else{
                        view = view.replace(/_#taskName#_/g,response.taskName).replace(/_#createUser#_/g,agentName)
                            .replace(/_#taskStatus#_/g,taskStatus).replace(/_#createTime#_/g,response.createTime).replace(/_#memo#_/g,response.title).replace(/_#owner#_/g,owner)
                            .replace(/_#phone#_/g,checkHideTel(response.sample.phone)).replace(/_#title#_/g,response.sample.title)
                            .replace(/_#custName#_/g,response.sample.name);
                    }
                    $("#agent_called_task_info").find(".cust_tab_content").append(view);
                    pane.height($(window).height()-306);
                });

            }else{
                $().alertmessage('showError', response.message);
            }
        });

    },
    callNextPhone : function (data) {
        var phoneArry = handler.customer.task.autoCallPhoneArry;
        handler.customer.task.autoCallIndex +=1;
        var currentIndex =handler.customer.task.autoCallIndex;
        var sampleId = handler.customer.task.autoCallPhoneSampleId;
        if(currentIndex >= phoneArry.length){
            $().alertmessage('showError', "没有可以继续拨打的号码");
        }else{
            $("#currentPhone").text(phoneArry[currentIndex].tel);
            softphonebar_dialout(phoneArry[currentIndex].tel,"SAMPLEID:"+sampleId);
            console.log(currentIndex + ":" + phoneArry[currentIndex]);
            console.log(currentIndex);
        }

    },
    showMarkList: function (data) {
        _softphonebar_endListen();  //挂断电话
        var p = $('#show_choose_dailtag_Modal');
        p.find('.modal-title').text('请标记本次通话分类');
        var dialTags = getDicCache("dialTag");
        var dialHtml = "";
        for (var i = 0; i < dialTags.length; i++) {
            dialHtml += '<li class="ds_do_action" ds_action="customer.task.saveDialInfo" ds_data="'+dialTags[i].code_value+'">'+dialTags[i].code_name+'</li>';
        }
        var view = "<ul class='mark_list'>" +
            "<li class='ds_do_action' ds_action='customer.task.saveDialInfo' ds_data='dealing'>已接听</li>" +
            dialHtml +
            "<p style='margin:10px 0 0;line-height:20px;'>*标记为占线的号码会回到资源池，待其余号码拨完后重拨</p>";
        p.find(".modal-body").html(view);
        p.width(250).css("min-width", "250px").find(".close").hide();
        p.modal();
    },
    //
    queryCustByPhone :function (data,src){
        var sendData ={};
        sendData.phone = data.sample.phone;
        sendData.custId = data.sample.custId;
        //sendData.phone = "10086";
        var action = {
            action:'app.customer.task.queryCustByPhone',
            data:sendData
        };
        DS.send(action,function(response){
            if(response.success){
                var pane = $("#agent_save_or_update_info");
                handler.customer.task.randerCustAddOrUpdateView(response,data,pane);
            }else{

            }
        });
    },
    showAgentCalledTaskInfo : function (menu,src){
        var data = {};
        var tId=src.find('input[name=_id]').val();
        var phone=src.find('input[name=phone]').val();
        var taskName =src.find('input[name=taskName]').val();
        var source =src.find('input[name=source]').val();
        var createTime =src.find('input[name=createTime]').val();
        var createUser =src.find('input[name=createUser]').val();
        var owner =src.find('input[name=owner]').val();
        data._id = tId;
        data.phone=getEncryptTel(phone);
        data.owner=owner;
        var action = {
            action:'app.customer.task.queryCallSheetByCustSample',
            data:data
        };
        DS.send(action,function(response){
            if(response.success){
                DS.getView("customer/task/dial_task_agent_content", function (contentview) {
                    var url = "customer/task/task_agent_called_info";
                    if(!response.callSheet){
                        url ="customer/task/task_agent_called_info_nosheet";
                    }
                    DS.getView(url, function (view) {
                        var html ={};
                        $("#view_dial_task_list_content").html(contentview);
                        var pane = $("#agent_called_save_or_update_info");
                        var calledDetailPane = $("#agent_task_called_detail_pane");
                        var taskPane = $("#agent_task_called_detail_pane");
                        //清空一下任务div,有隐藏高度
                        $("#agent_save_or_update_info").empty().height(0);
                        $("#agent_task_custinfo").empty();

                        var paneData = $("#agent_called_task_info");
                        //设置新增用户时的数据
                        paneData.data("custInfo",{
                            name:response.sample.name,
                            sampleId:response.sample._id,
                            source:source,
                            taskId:tId,
                            phone:response.phone,
                            note:response.sample.title,
                            flag:'taskAgentCalledAdd'});


                        //通话详情
                        var agentName = handler.customer.task.getAgentName(createUser);
                        var taskStatus = response.taskStatus;
                        if(taskStatus == "dealing"){
                            taskStatus = "进行中";
                        }else if(taskStatus == "close"){
                            taskStatus = "已关闭";
                        }
                        var owner = response.sample.owner;
                        if(owner != "NA"){
                            owner = handler.customer.task.getAgentName(response.sample.owner);
                        }
                        var callSheet = response.callSheet;
                        if(callSheet){
                            var city=(callSheet.PROVINCE==callSheet.DISTRICT)?callSheet.PROVINCE:callSheet.PROVINCE+"-"+callSheet.DISTRICT;
                            view = view.replace(/_#taskName#_/g,response.taskName).replace(/_#createUser#_/g,agentName)
                                .replace(/_#taskStatus#_/g,taskStatus).replace(/_#createTime#_/g,response.createTime).replace(/_#memo#_/g,response.title).replace(/_#owner#_/g,owner).replace(/_#city#_/g,city)
                                .replace(/_#phone#_/g,checkHideTel(response.sample.phone)).replace(/_#title#_/g,response.sample.title)
                                .replace(/_#custName#_/g,response.sample.name);
                            showCdrTel(response.callSheet);
                            view = DS.renderMethodViewNew(view, response.callSheet);
                        }else{
                            view = view.replace(/_#taskName#_/g,response.taskName).replace(/_#createUser#_/g,agentName)
                                .replace(/_#taskStatus#_/g,taskStatus).replace(/_#createTime#_/g,response.createTime).replace(/_#memo#_/g,response.title).replace(/_#owner#_/g,owner)
                                .replace(/_#phone#_/g,checkHideTel(response.sample.phone)).replace(/_#title#_/g,response.sample.title)
                                .replace(/_#custName#_/g,response.sample.name);
                        }

                        //$("#agent_called_task_info").find(".cust_tab_content").append(view);
                        pane.find(".cust_tab_content").height($(window).height()-306);
                        var pageType = "called";
                        handler.customer.task.randerCustAddOrUpdateView(response,response,pane,pageType,view);
                    });

                });
            }else{
                $().alertmessage('showError', response.message);
            }
        });
    },
    randerCustAddOrUpdateView : function (data,sample,pane,pageType,view){
        if(data.isNewCustomer){
            handler.customer.task.loadCustAddByTelFirst(data,sample,pane,pageType,view);
        }else{
            if(data.count > 1){
                handler.customer.task.loadCustMultiByTel(data,sample,pane,pageType);
            }else {
                //定位到一个用户
                if(pageType == "called"){
                    $("#agent_called_task_info").data("custInfo",{
                        name:sample.sample.name,
                        sampleId:sample.sample._id,
                        phone:sample.phone,
                        owner:sample.sample.owner,
                        taskId:sample.taskId,
                        flag:'taskAgentCalledAdd'});
                    handler.customer.loadCustInfo(data.customer._id,"task_agent","agentCalledCustInfo",sample._id,null,function(){
                        $("#agent_called_task_info").find(".func_tab.active").click();
                    });
                } else{
                    handler.customer.loadCustInfo(data.customer._id,"task_agent","agentCustInfo",null,null,function(){
                        $("#agent_save_or_update_info").find(".func_tab.active").click();
                    });
                }
            }
        }
    },
    loadCustAddByTelFirst : function (data,taskSample,pane,pageType,view){
        var pageData = {};
        pageData.phone = taskSample.sample.phone;
        var pane = $("#agent_save_or_update_info");
        $("#agent_save_or_update_info").find(".task_intrbg").remove();
        if(pageType =="called"){
            pane = $("#agent_called_task_info");
            pane.empty();//清空pane，以免resize上面的dom高度撑开
            var custInfo = {
                name:taskSample.sample.name,
                sampleId:taskSample.sample._id,
                source:taskSample.source,
                taskId:taskSample.taskId,
                phone:taskSample.sample.phone,
                note:taskSample.sample.title,
                flag:'taskAgentCalledAdd'
            };
            pane.data("custInfo",custInfo);

            $("#tmpl_task_agent_popup_one_customer_called").tmpl(taskSample).appendTo(pane);
            $("#agent_called_task_info").find(".test").append(view);
        }else{
            var custInfo = {
                name:taskSample.sample.name,
                sampleId:taskSample.sample._id,
                source:taskSample.task.source,
                taskId:taskSample.task._id,
                phone:taskSample.sample.phone,
                note:taskSample.sample.title,
                flag:'taskAgentAdd'}
            pane.data("custInfo",custInfo);
            var paneId = "agent_save_or_update_info";
            var popupId = "";
            handler.call.loadCustNoPopInfo(taskSample.sample.phone,paneId,popupId,"","","",custInfo);
        }
    },
    _initCustInfo : function (pane,custInfo){
        var _param = custInfo;
        phone=_param.phone;
        name=_param.name;
        note=_param.note;
        source=_param.source;
        if(name){
            pane.find("input[name='name']").val(name);
        }
        if(phone){
            pane.find("input[name='tel[]']").val(checkHideTel(phone,pane.find("input[name='tel[]']")));
        }
        if(note){
            pane.find("input[name='title']").val(note);
        }
        if(source){
            pane.find("select[name=custsource1]").find("option[value="+source+"]").attr("selected",true);
        }
    },
    loadCustMultiByTel : function (data,taskSample,pane,pageType){
        var pageData = {};
        pageData.phone = taskSample.phone;
        var pane = $("#agent_called_task_info");
        $("#agent_save_or_update_info").find(".task_intrbg").remove();
        if(pageType =="called"){
            pageData.paneId ="agent_called_task_info";
            pane = $("#agent_called_task_info");
            $("#agent_called_task_info").attr("phone",taskSample.phone);
            $("#agent_called_task_info").data("custInfo",{
                name:taskSample.sample.name,
                sampleId:taskSample.sample._id,
                phone:taskSample.phone,
                owner:taskSample.sample.owner,
                taskId:taskSample.taskId,
                flag:'taskAgentCalledAdd'});
            $("#tmpl_task_agent_popup_more_customer_called").tmpl(pageData).prependTo(pane);
            $("#agent_called_task_info").find(".func_tab.active").click();
        }else{
            pageData.paneId ="agent_task_custinfo";
            $("#agent_task_custinfo").attr("phone",taskSample.phone);
            $("#agent_task_custinfo").data("custInfo",{
                name:taskSample.sample.name,
                sampleId:taskSample.sample._id,
                source:taskSample.task.source,
                taskId:taskSample.taskId,
                phone:taskSample.phone,
                flag:'taskAgentAdd'});
            handler.call.loadCustMorePopInfo(taskSample.phone,data.list, "agent_save_or_update_info", true,"agent_task_custinfo",data.count,"","");
            //$("#tmpl_task_agent_popup_more_customer").tmpl(pageData).appendTo(pane);
        }
    },
    reloadTaskAgentPane : function (userId,taskId,sampleId,pane,flag){
        if(flag == "taskAgentCalledAdd" || flag == "taskAgentCalledChoose"){
            $("#agent_save_or_update_info").empty();
        }else if(flag == "taskAgentAdd" || flag == "taskAgentChoose" ) {
            $("#agent_save_or_update_info").find(".task_intrbg").remove();
        }

        var sendData = {};
        sendData.taskId = taskId;
        sendData.sampleId = sampleId;
        sendData.custId = userId;
        var action = {
            action: 'app.customer.task.updateSampleAndDaily',
            data: sendData
        };
        if(flag == "taskAgentCalledChoose"){
            DS.send(action,function(rep){
                if(rep.success){
                    handler.customer.loadCustInfo(userId,"task_agent","agentCalledCustInfo",null,null,function(){
                        $("#agent_called_task_info").find(".func_tab.active").click();
                    });
                }else{
                    $().alertmessage('showError', "更新统计表失败");
                }
            })
        }else if(flag == "taskAgentChoose"){
            DS.send(action,function(rep){
                if(rep.success){
                    handler.customer.loadCustInfo(userId,"task_agent","agentCustInfo",null,null,function(){
                        $("#agent_called_task_info").find(".func_tab.active").click();
                    });
                }else{
                    $().alertmessage('showError', "更新统计表失败");
                }
            })

        }else{
            DS.send(action,function(rep){
                if(rep.success){
                    if(flag == "taskAgentCalledAdd"){
                        handler.customer.loadCustInfo(userId,"task_agent","agentCalledCustInfo",null,null,function(){
                            $("#agent_called_task_info").find(".func_tab.active").click();
                        });
                    }
                    else{
                        handler.customer.loadCustInfo(userId,"task_agent","agentCustInfo",null,null,function(){
                            $("#agent_save_or_update_info").find(".func_tab.active").click();
                        });
                    }
                }else{
                    $().alertmessage('showError', "更新统计表失败");
                }
            })
        }
    },
    chooseDailTag : function (data,src){
        var pane=$("#show_choose_dailtag_Modal");
        DS.getView('customer/task/agent_task_choose_dialtag',function(view){
            var body=pane.find(".modal-body");
            body.html(view);
            pane.modal();
        });
    },
    saveDialInfo : function (data,src){
        var sendData = {};
        var _param=$("#agent_task_commit_info").data("commitInfo");
        var text = src.text();
        sendData.dialTag  = data;
        sendData.taskId = _param.taskId;
        var newTaskId = handler.customer.task.rebuildTaskid(_param.taskId);
        sendData.sampleId = _param.sampleId;
        sendData.unit = _param.unit;
        sendData.agentId = session.user._id;
        var action = {
            action: 'app.customer.task.updateSampleAndDailyDialInfo',
            data: sendData
        };
        DS.send(action,function(rep){
            if(rep.success){
                handler.customer.task._loadTaskDailStats(sendData,text,function(response){
                    var percent = 100 * response.taskUserDaily.linked / (response.taskUser.dailyTask || 1)||0;
                    handler.customer.task.drawCircleView([100-percent,percent],response.taskUserDaily.linked);
                    $("#tips_m").removeClass("mark-un").addClass("mark-success").text(text);
                    $(".call_next").show().siblings("button").hide();
                    $('#show_choose_dailtag_Modal').find(".close").click();//当前任务统计信息

                    var currentDailyTask = handler.customer.task.currentDailyTask;
                    var currentDailyCalled = handler.customer.task.currentDailyCalled;
                    var currentDailyTaskAgent = handler.customer.task.currentDailyTaskAgent;
                    var unit = handler.customer.task.currentUnit;
                    //任务类型为有效通话
                    if(unit == 1 ){
                        if(currentDailyCalled >= currentDailyTask && currentDailyTask!=0){
                            // 完成任务
                            if (handler.customer.task.checkStorageObj(sendData.taskId) == 'false') {
                                var pop = $("#task_status_pop");
                                pop.find("dl").removeClass("nono").find("dd").html("您已完成当日任务");
                                pop.width(350).css({"background": "#f2f2f2", "min-width": "350px"});
                                pop.modal();
                                handler.customer.task.saveStorageObj(sendData.taskId,'true');
                            }
                        }else{
                            // 没有完成任务
                            if (handler.customer.task.checkStorageObj(newTaskId)) {
                                // 完成过任务并重置了任务
                                handler.customer.task.saveStorageObj(newTaskId,'false');
                            }
                        }
                    }else{
                        if(currentDailyTaskAgent >= currentDailyTask && currentDailyTask!=0){
                            if (handler.customer.task.checkStorageObj(sendData.taskId) == 'false') {
                                var pop = $("#task_status_pop");
                                pop.find("dl").removeClass("nono").find("dd").html("您已完成当日任务");
                                pop.width(350).css({"background": "#f2f2f2", "min-width": "350px"});
                                pop.modal();
                                handler.customer.task.saveStorageObj(newTaskId,'false');
                            }
                        }else{
                            // 没有完成任务
                            if (handler.customer.task.checkStorageObj(newTaskId)) {
                                // 完成过任务并重置了任务
                                handler.customer.task.saveStorageObj(newTaskId,'false');
                            }
                        }
                    }
                });
            }else{
                $().alertmessage('showError', "更新统计表失败");
            }
        })
    },
    _loadTaskDailStats : function(sendData,text,callback){
        //再次查询任务表和统计表,设置页面统计信息,缓存每日拨打量
        var actionDaily = {
            action: 'app.customer.task.queryDailyStats',
            data: sendData
        };
        DS.send(actionDaily,function(response){
            //任务明细
            handler.customer.task.currentDailyTask = response.taskUser.dailyTask;
            handler.customer.task.currentDailyCalled = response.taskUserDaily.linked;
            handler.customer.task.currentDailyTaskAgent = response.taskUser.dailyTaskAgent;
            handler.customer.task.currentUnit = response.task.unit;
            callback(response);
        });
    },
    //当发现号码错误的时候,修改数据库号码状态,跳过本条
    currentPhoneErr : function(){
        var pane = $("#agent_save_or_update_info");
        var _parm = pane.data("custInfo");
        var sendData = {"sampleId":_parm.sampleId};
        var action = {
            action: 'app.customer.task.currentPhoneErr',
            data: sendData
        };
        DS.send(action,function(response){
            if(response.success){
                $("#tips_m").removeClass("mark-un").addClass("mark-success").text("号码有误");
                $(".call_next").show().siblings("button").hide();
                $('#show_choose_dailtag_Modal').find(".close").click();//当前任务统计信息
            }else{
                $().alertmessage('showError', response.message);
            }
        });

    },
    saveCustomer : function (data,src){
        if (src.hasClass("disabled")) return false;
        var flag=src.attr("flag");
        data.dealSrc=flag;
        var tels=data.tel,memos=data.memo;
        var phone=[];
        for(var i=0;i<tels.length;i++) {
            if($.trim(tels[i])){
                //过滤中间空格
                tels[i] = tels[i].replace(/\s/g,"");
                phone.push({tel:tels[i],memo:memos[i]});
            }
        }
        delete data.tel;
        delete data.memo;
        var emails = data.email,eMemos=data.eMemo;
        var email=[];
        if(emails){
            for(var i=0;i<emails.length;i++) {
                if($.trim(emails[i])){
                    email.push({email:emails[i],memo:eMemos[i]});
                }
            }
            delete data.email;
            delete data.eMemo;
            data.email=email;
        }
        data.owner = session.user._id;
        var wxNums=data.num,wxMemo=data.wxMemo;
        var weixin=[];
        if(wxNums){
            for(var i=0;i<wxNums.length;i++) {
                if($.trim(wxNums[i])){
                    weixin.push({num:wxNums[i],memo:wxMemo[i]});
                }
            }
            delete data.num;
            delete data.wxMemo;
            data.weixin=weixin;
        }
        var popupId=data.popupId;
        delete data.popupId;

        var paneId=data.callId;
        var callId=data.callId;
        callId=data.callId.split("_")[0];
        data.callId=callId;
        data.actionType="self";
        data.phone=phone;
        var custName=data.name;
        data.attachs=[];
        var pane=src.closest(".edit_customer");
        pane.find(".thumbnails_customer .attachitem").each(function(i){
            var files={
                id:$(this).attr("ds_data"),
                name:$(this).text(),
                type:$(this).attr("suffix"),
                isNew:$(this).attr("isNew")
            };
            data.attachs.push(files);
        });
//        console.dir(data);
        src.addClass("disabled");
        var action = {
            action: 'app.customer.addCustomer',
            data: data
        };
        DS.send(action,function(rep){
            if(rep.success){
                //更新样本表userId，和每日通话表
                var sendData = {};
                sendData.taskId = $("#agent_sample_info").find("#saveTaskId").val();
                sendData.sampleId = $("#agent_sample_info").find("#saveSampleId").val();
                sendData.custId = rep.data._id;
                var action = {
                    action: 'app.customer.task.updateSampleAndDaily',
                    data: sendData
                };
                DS.send(action,function(rep){
                    if(rep.success){
                        //成功
                    }else{
                        $().alertmessage('showError', "更新统计表失败");
                    }
                })


            }else{
                if(rep.code=='1001'){
                    $().alertmessage('showError', "电话号码重复");
                }else if(rep.code=='1002'){
                    $().alertmessage('showError', "客户名称重复");
                }else{
                    $().alertmessage('showError', rep.message || errMsg);
                }
            }
        });
    },
    updateCustomer : function (data,src){
        data.owner =session.user._id;
        var pane=src.closest(".contact_summary");
        var container=pane.find(".baseinfo");
        var tels=data.tel,memos=data.memo;
        var phone=[];
        for(var i=0;i<tels.length;i++) {
            if($.trim(tels[i])){
                //过滤中间空格
                tels[i] = tels[i].replace(/\s/g,"");
                phone.push({tel:tels[i],memo:memos[i]});
            }
        }
        delete data.tel;
        delete data.memo;
        data.phone=phone;

        var emails = data.email,eMemos=data.eMemo;
        var email=[];
        if(emails){
            for(var i=0;i<emails.length;i++) {
                if($.trim(emails[i])){
                    email.push({email:emails[i],memo:eMemos[i]});
                }
            }
            delete data.email;
            delete data.eMemo;
            data.email=email;
        }

        var wxNums=data.num,wxMemo=data.wxMemo;
        var weixin=[];
        if(wxNums){
            for(var i=0;i<wxNums.length;i++) {
                if($.trim(wxNums[i])){
                    weixin.push({num:wxNums[i],memo:wxMemo[i]});
                }
            }
            delete data.num;
            delete data.wxMemo;
            data.weixin=weixin;
        }

        data.attachs=[];
        pane.find(".thumbnails_customer .attachitem").each(function(i){
            var files={
                id:$(this).attr("ds_data"),
                name:$(this).text(),
                type:$(this).attr("suffix"),
                isNew:$(this).attr("isNew")
            };
            data.attachs.push(files);
        });

        var menu=src.attr("menu")||"";
        var flag=src.attr("ds_attr")||"";
        var action = {
            action: 'app.customer.updateCustomer',
            data: data
        };
        DS.send(action,function(rep){
            if(rep.success){
                alert("更新成功！");
            }else{
                if(rep.code=='1001'){
                    $().alertmessage('showError', "电话号码重复");
                }else if(rep.code=='1002'){
                    $().alertmessage('showError', "客户名称重复");
                }else{
                    $().alertmessage('showError', rep.message || errMsg);
                }
            }
        });
    }
    ,
    //座席-已拨任务号码查询
    queryAgentCalledTaskList : function (data,src){
        var sendData ={};

        if(src && src.hasClass("ds_form_action")){//查询按钮
            menu = data.menu;
            if(data.phone && data.phone!=""){
                sendData.phone = data.phone;
            }
        }else if(src && !src.hasClass("ds_do_action")) {//分页
            var frm = $("#frm_task_agent_called_search");
            menu = frm.find("input[name='menu']").val();
            var phone = frm.find("input[name='phone']").val();
            if(phone && phone!=""){
                sendData.phone = phone;
            }
        }
        //高级查询
        if(data.isAdvanceSearch){
            if(data.phone){
                sendData.phone = data.phone;
            }
            if(data.taskName){
                sendData.taskName = data.taskName;
            }
            if(data.dialStatus){
                sendData.dialStatus = data.dialStatus;
            }
            if(data.custStatus){
                sendData.custStatus = data.custStatus;
            }
        }

        var page=1;
        if(src && !src.hasClass("ds_do_action"))page=src.val();
        if(!page)page=1;
        sendData.page=page;
        sendData.limit = handler.customer.task.limit
        sendData.owner = session.user._id;
        var formID = "frm_task_agent_called_search";
        var action = {
            action:'app.customer.task.queryAgentCalledTaskList',
            data:sendData
        };
        DS.send(action,function(response){
            if(response.success){
                var list = response.list;
                if(list.length > 0){
                    DS.getView("customer/task/task_agent_called_list", function (view) {
                        $("#view_agent_dial_task_list").html(view);
                        var listPane = $('#agent_called_list_pane');
                        var html = [];
                        for (var i = 0; i < list.length; i++) {
                            var _obj=list[i];
                            _obj.createUser = handler.customer.task.getAgentName( _obj.createUser);
                            html.push($('#customer_agent_called_task_page_item').tmpl(_obj).get(0).outerHTML);
                        }
                        listPane.html(html.join(""));
                        handler.customer.task._initAgenctCalledSearch();
                        DS.updatePagination(formID, response.count, sendData.limit, sendData.page);
                    });
                }else{
                    var listPane = $('#agent_called_list_pane');
                    var html='<div class="alert">未找已拨号码!</div>';
                    listPane.html(html);
                    DS.updatePagination(formID, response.count, sendData.limit, sendData.page);
                }
            }else{
            }
        });
    },
    _initAgenctCalledSearch:function(){
        var searchPane = $("#contact_list_agent_called_list");
        searchPane.find(".agent_called_advanced_search").bind("click",function(e){
            e.stopPropagation();
            var offset=searchPane.find(".quick_search").offset();
            var _p=searchPane.find("#agenct_called_advanced_search_pane");
            _p.css({top:offset.top+28+"px",left:offset.left+"px"});
            _p.toggleClass("hidden");

            var url = 'customer/task/task_agent_called_search';
            DS.getView(url, function(view){
                view=DS.renderViewNew(view);
                searchPane.find("#agenct_called_advanced_search_pane").html(view);
            });

        });
    },
    searchCalledAdvanced: function(data, src) {
        DS.showSearchTips($("#frm_agent_called_advanced_search"),false);
        $("#agenct_called_advanced_search_pane").addClass("hidden");
        handler.customer.task.queryAgentCalledTaskList(data,src);
    },
    //座席-将号码转换为客户资料
    convertDataByPhone : function(data,src){
        var datas = data.split(",");
        var cid = datas[0];
        var sendData ={};
        sendData.cid = cid;
        var pane = $("#agent_save_or_update_info");
        var action = {
            action:'app.customer.task.convertDataByPhone',
            data:sendData
        };
        DS.send(action,function(response){
            if(response.success){
                DS.getView("customer/task/task_agent_update_customer", function (view) {
                    pane.empty();
                    pane.html(view);
                    var container=pane.find("#icc_agent_update_customer_customerAddDiv");
                    var item=response.customer;
                    var owner=item.owner;
                    var tmpl = getCache('custTmpls')[0];
                    var o=pane.find("#cust_update_id");
                    o.val(item._id);
                    var qid=uuid.v1();
                    tmpl.qiniuId=qid;
                    pane.find("#tmpl_custmanage_agent_update").tmpl(tmpl).appendTo(container);
                    handler.customer._initQiniuCustomerUpload(qid,container);

                    pane.find('.date_picker').datepicker({
                        changeMonth: true,
                        changeYear: true,
                        showButtonPanel: true
                    });
                    var html=generateCCOptions(proviceCityDicKey);
                    container.find("select[name='province']").html(html);
                    handler.customer.renderCustUpdate(pane.find("form"),item,pane);

                    //load user
                    var inputId="agent_owner_customerUpdate_input";
                    var containerId="agent_owner_customerUpdate_user";

                    var _agents=filterUserByScope();
                    var _uids=[];
                    for (var i = 0; i < _agents.length; i++) {
                        var obj = _agents[i];
                        _uids.push(obj._id);
                    }
                    if(isHasFunc("func_popup_commonCust_owner")){
                        _uids.push("");
                    }
                    if($.inArray(owner,_uids)!=-1||session.user.scope=='all'){
                        //utils.loadAgentComboBox(inputId,containerId,{width:"140",height:"17"},false);
                        //set owner name
                        var agentName="";
                        var agents=getCache("agents");
                        for(var i=0;i<agents.length;i++){
                            var u=agents[i];
                            if(item.owner== u._id){
                                agentName= u.displayName;
                                break;
                            }
                        }
                        if(agentName){
                            pane.find("#displayOwner").html(agentName);
                        }
                    }else{
                        var agent=getCache("agents",owner||"NA");
                        if(agent){
                            var html='<span style="line-height:23px">'+agent.displayName+'</span>';
                            pane.find(".edit_customer").find("#"+containerId).html(html);
                        }else{
                            var html='<span style="line-height:23px">无</span>';
                            pane.find(".edit_customer").find("#"+containerId).html(html);
                        }
                    }
                    pane.find(".btn_cancel_edit").click(function(){
                        pane.empty();
                        dsevent.publish(dsevent.evt.customerAddCancel);
                    });
                });

            }else{

            }
        });
    },
    quick_subMenu_search_agent: function (submenu,src) {
        var lastMenu=handler.customer.task.curSubMenu||'';
        var searchPane = src.closest(".left_column");
        searchPane.find(".model_submenu button").removeClass("active");
        src.addClass("active");
        handler.customer.task.curSubMenu=submenu;
        if(submenu=='dial_agent_task'){
            handler.swapSubMenu(submenu,'customer/task/task_agent_list',"agent_dial_task_list",true,true);
        }else if(submenu=='dial_agent_task_called') {
            handler.swapSubMenu(submenu,'customer/task/task_agent_called_list','agent_dial_task_list',true,true);
        }
    },
    task_agent_list :function (data,src){
        handler.customer.task.queryAgentTaskList(data,src);
    },
    task_agent_called_list: function (data,src){
        handler.customer.task.queryAgentCalledTaskList(data,src);
    },
    drawCircleView: function(data,total){
        var pane = document.getElementById("daily_chart");
        var canvas = pane.getElementsByTagName("canvas")[0];
        var span = pane.getElementsByTagName("span")[0];
        var ctx = canvas.getContext("2d");
        var startPoint= 1.5 * Math.PI;
        var color = ["#dad8d8","#37b5ed"];
        if (!total) {
            total = 0;
        };
        $(span).html(total);
        for(var i=0;i<data.length;i++){
            ctx.fillStyle = color[i];
            ctx.strokeStyle = color[i];
            ctx.beginPath();
            ctx.moveTo(50,50);
            ctx.arc(50,50,50,startPoint,startPoint-Math.PI*2*(data[i]/100),true);
            ctx.fill();
            ctx.stroke();
            startPoint -= Math.PI*2*(data[i]/100);
        }
    },
    changeUnit: function (data, src) {
        var pane = src.parent();
        if (data == "duration") {
            var num = 90;
            var unit = "分钟";
        } else {
            var num = 50;
            var unit = "通";
        }
        pane.find("input[name=dailyTaskAllAgent]").val(num);
        $("input[name='agents[]']:checked").siblings("input[name='dailyTask[]']").val(num);
        $(".unit").html(unit);
    },
    reCallPhone : function(data,src){
        var dataArry = data.split(",");
        if(dataArry.length == 2){
            softphonebar_dialout(dataArry[0],"SAMPLEID:"+dataArry[1]);
        }else{
            alert("号码拨打错误");
        }
    },
    //计算拨打统计
    calculateNum:function(type,num1,num2){
        var num1=parseInt(num1) || 0;
        var num2=parseInt(num2) || 0;
        if(type=="noCall" || type=="noLink"){
            return num1-num2;
        }else if(type=="finishRate" || type=="linkRate"){
            var GetPercent=function(total,num ) {
                num = parseFloat(num);
                total = parseFloat(total);
                if (isNaN(num) || isNaN(total)) {
                    return "-";
                }
                return total <= 0 ? "0%" : (Math.round(num / total * 10000) / 100.00 + "%");
            }
            return GetPercent(num1,num2);
        }
    },
    whetherToRemove:function(rTime,st,rData){
        if(st==="normal"){
            var html =  "<a href='#' class='ds_do_action' ds_action='customer.task.removeDialTaskAgent' ds_data='"+rData+"'>移除座席</a>"
            return html;
        }else if(st==="remove"){
            var html =  rTime+"被移除";
            return html;
        }
    }
}




