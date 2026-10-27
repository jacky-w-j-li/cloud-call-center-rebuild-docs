handler.customer.titket={
    limit:10,
    customer_titket_manager:function(menu,src){
        // handler.customer.titket.queryCustTitketList();
        var pane = $("#view_"+menu);
        pane.find(".dept_search").click();
        handler.customer.titket._initAdvanceSearch(pane);
        //切换奖罚类型清空填写内容
        $(".titketType").click(function(){
            $("#cust_titket_user_input").val("");
            $("#cust_titket_user_div_input").val("");
            $("#num").find("option[value='1']").attr("selected",true);
        });
        //
    },
    queryCustTitketList: function (data, src) {
        data=data||{};
        var isAdvanceSearch=data.isAdvanceSearch;
        delete  data.isAdvanceSearch;

        var container=$("#customer_titket_view");

        if(src && src.hasClass("refresh")){
            var json=container.find(".search_condition").html();
            if(json){
                data = $.evalJSON(unescapeHtml(json));
                data = removeEmptyProperty(data);
            }
            var a=container.find(".pagination li.active>a");
            if(a.length>0){
                data.page= a.attr("value");
            }
        }else{
            handler._setSearchCondition(data,container);
        }

        var frmId = "frm_customer_titket_search";
        if(isAdvanceSearch=="1"){
            frmId = "frm_customer_titket_advanced_search";
        }
        container.find(".pagination").attr({for:frmId});

        var page=data.page;
        if(src && src.hasClass("page_on")){
            page=src.attr("value");
        }
        if(!page)page=1;
        data.page=page;
        data.limit=handler.config.user.pageSize;
        data.limit=handler.customer.titket.limit;
        var action = {
            action: 'app.customer.titket.queryCustTitketList',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                if(src && !src.hasClass("refresh")){
                    DS.showSearchTips(container.find("#"+frmId));
                }
                var csutTitket = response.list;
                if(csutTitket.length > 0){
                    var html = [];
                    DS.getView('customer/titket/customer_titket_item', function (view) {
                        for (var i = 0; i < csutTitket.length; i++) {
                            var titket = csutTitket[i];
                            var user = getCache("agents",titket.user);
                            if(user){
                                titket.displayName = user.displayName;
                                if(titket.source =="system"){
                                    titket.source = "系统赠";
                                }else{
                                    var sourceUser = getCache("agents",titket.source);
                                    titket.source = sourceUser.displayName + "赠";
                                }
                                if(titket.status == 1){
                                    titket.active = "disabled"
                                }else{
                                    titket.disabled = "disabled"
                                }
                                handler.customer.titket.initTitketFiled(titket);
                                html.push(DS.renderMethodViewNew(view,titket));
                            }
                        }
                        container.find('#customer_titket_list_pane').html(html.join(""));
                    });
                } else {
                    var html='<tr style="text-align: center;"><td colspan="8">未找到奖罚劵!</td></tr>';
                    container.find('#customer_titket_list_pane').html(html);
                }
                DS.updatePagination(frmId, response.count, handler.config.dept.pageSize, data.page);
                container.find('#customer_titket_advanced_search_pane').addClass("hidden");
            }else{
                $().alertmessage('showError', response.message);
            }
        });
    },
    _initAdvanceSearch:function(searchPane){
        // searchPane= $("#"+searchPane);
        searchPane.find(".customer_titket_advanced_search").bind("click",function(e){
            e.stopPropagation();
            var offset=searchPane.find(".quick_search").offset();
            var _p=$("#customer_titket_advanced_search_pane");
            _p.css({top:offset.top+24+"px",left:offset.left+"px"});
            _p.toggleClass("hidden");
        });
    },
    resetForm:function(data,src){
        $("#cust_titket_user_input").val("");
        handler.resetForm(data,src);
    },
    initTitketFiled : function (titket) {
        if(titket.type == "0"){
            titket.strType = "罚劵";
        }else{
            titket.strType = "奖劵";
        }

        if(!titket.useTime){
            titket.useTime = "-";
        }

        if(titket.status == "0"){
            titket.status = "作废";
        }else if(titket.status == "1"){
            titket.status = "未使用";
        }else if(titket.status == "2"){
            titket.status = "已使用";
        }else if(titket.status == "3"){
            titket.status = "抵消";
        }

    },
    showAddPop : function(data,src){
        var pane = $("#customer_titket_modal");
        var containerId = "cust_titket_user_div";
        var inputId = "cust_titket_user_input";
        pane.find('.modal-title').text('增加奖罚劵');
        utils.loadAgentComboBox(inputId,containerId,{width:"140",height:"17"},true,null,null);
        pane.find('.saveOrUpdate').attr("ds_action","customer.titket.addTitket");
        pane.width(600);
        pane.modal();
    },
    showBatchUpdate : function(data,src){
        var container=$("#customer_titket_view");
        var leftPane=container.find(".config_left");
        var pane = $("#customer_titket_batch_update_modal");
        pane.find('.modal-title').text('批量修改');
        var count =  leftPane.find(".pagination .result_count").text();
        $(".titket_count",pane).text(count);
        pane.width(600);
        pane.modal();
    },
    batchUpdate : function(data,src){
        var container=$("#customer_titket_view");;
        var leftPane=container.find(".config_left");
        var pane = $("#customer_titket_batch_update_modal");
        var query = handler._getSearchCondition(leftPane,"1");
        query.account = session.account.account;
        var action = {
            action: 'app.customer.titket.batchUpdateTitket',
            data: {"query":query,"status":data.status}
        };
        DS.send(action, function (response) {
            if (response.success) {
                $().alertmessage('showSuccess', "批量修改成功!");
                pane.modal("hide");
                leftPane.find('.refresh').click();
            }else{
                $().alertmessage('showError', response.message);
            }
        });

    },
    addTitket : function(data,src){
        if (src.hasClass("disabled")) return false;
        if(!data.user || data.user == ""){
            $().alertmessage('showError', "座席不能为空!");
            return;
        }
        var type = data.type;
        src.addClass("disabled");

        var action = {
            action: 'app.customer.titket.addCustTitket',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var pane = $("#customer_titket_modal");
                $("#cust_titket_user_input").val("");
                pane.modal('hide');
                pane.find('.custTitketForm')[0].reset();
                if(type=="1"){
                    $().alertmessage('showSuccess', "新增奖券成功!");
                }else if(type=="0"){
                    $().alertmessage('showSuccess', "新增罚券成功!");
                }
                var leftPane=$("#customer_titket_view").find(".config_left");
                leftPane.find('.refresh').click();
            }else{
                $().alertmessage('showError', response.message);
            }
            src.removeClass('disabled');
            handler.workbench.queryCustTitketCount(session);
        });
    },
    activeCustTitket : function(data,src){
        var parm = data.split(",");
        var action = {
            action: 'app.customer.titket.updateCustTitket',
            data: {"_id":parm[0],"status":"1","type":parm[1],"user":parm[2]}
        };
        DS.send(action, function (response) {
            if (response.success) {
                $().alertmessage('showSuccess', "启用成功!");
                var leftPane=$("#customer_titket_view").find(".config_left");
                leftPane.find('.refresh').click();
            }else{
                $().alertmessage('showError', response.message);
            }
        });
    },
    disabledCustTitket : function(data,src){
        var parm = data.split(",");
        var action = {
            action: 'app.customer.titket.updateCustTitket',
            data: {"_id":parm[0],"status":"0","type":parm[1],"user":parm[2]}
        };
        DS.send(action, function (response) {
            if (response.success) {
                $().alertmessage('showSuccess', "作废成功!");
                var leftPane=$("#customer_titket_view").find(".config_left");
                leftPane.find('.refresh').click();
            }else{
                $().alertmessage('showError', response.message);
            }
            handler.workbench.queryCustTitketCount(session);
        });
    },
    settingCustTitketFlag : function (flag){
        //console.info("flag===="+flag)
        var action = {
            action: 'app.customer.titket.settingCustTitketFlag',
            data: flag
        };
        DS.send(action, function (response) {
            if (response.success) {
                var msg="您已关闭了自动领取商机，有新的商机不会再分配！";
                if(flag=="1"){
                    msg="您开启了自动领取商机，请注意查收！";
                }
                $().alertmessage('showSuccess', msg);
            }else{
                $().alertmessage('showError', response.message);
            }
        })
    },
    donationCustTitket : function (toUser,donationNum,callback){
        var action = {
            action: 'app.customer.titket.donationCustTitket',
            data: {"toUser":toUser,"donationNum":donationNum}
        };
        DS.send(action, function (response) {
            if (response.success) {
                $().alertmessage('showSuccess', "赠送成功!");
            }else{
                $().alertmessage('showError', response.message);
            }
            callback(response.success);
        })
    }
    ,
    test : function (data,src){
        //var action = {
        //    action: 'app.customer.titket.settingCustTitketFlag',
        //    data: "1"
        //};
        //var action = {
        //    action: 'app.customer.titket.queryCustTitketCount',
        //    data: {}
        //};
        var action = {
            action: 'app.customer.titket.donationCustTitket',
            data: {"toUser":"65ba6f20-06d0-11e6-b731-6178e761154d","donationNum":2}
        };
        //var action = {
        //    action: 'app.customer.titket.queryCustTitketList',
        //    data: {"user":"65ba6f20-06d0-11e6-b731-6178e761154d"}
        //};
        DS.send(action, function (response) {
            console.dir(response);
        })
    }
}







