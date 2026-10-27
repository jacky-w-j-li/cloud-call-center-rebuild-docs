handler.config.customerCommon= {
    limit:10,
    config_customerCommon:function(menu) {
        var custCategorys = getCache("custCategorys");
        var pane = $("#customerCommon_query_panel");
        pane.find(".refresh").click();
        $("#customerCommon_info_pane").hide();
    },
    queryCommon:function(data,src){
        data.limit = handler.config.customerCommon.limit;
        data.page = src.val()|| 1;
        var action = {
            action:'config.customerCommon.queryCommon',
            data:data
        };
       var pane =  $("#customerCommon_list_panel");
        var commonListPane=pane.find(".customerCommon_list");
        DS.send(action,function(rep){
            if(rep.success){
                var list = rep.list;
                if(list.length>0){
                    DS.getView('config/customerCommon/customerCommon_item',function(view){
                        var html = [];
                        for(var i=0;i<list.length;i++){
                            var common = list[i];
                            var managers = "";
                            var members = "";
                            var category = common.category;
                                var managerList = common.managers;
                                var memberList  = common.members;

                                if(managerList.length>0){
                                        for(var h =0;h<managerList.length;h++){
                                            if(h == managerList.length - 1){
                                                managers = managers+handler.config.customerCommon.getUserName(managerList[h]);
                                            }else{
                                                managers = managers+handler.config.customerCommon.getUserName(managerList[h])+",";
                                            }
                                        }
                                        common.managers = managers;
                                }else{
                                        common.managers = managers;
                                }
                                if(memberList.length>0){
                                    for(var j=0;j<memberList.length;j++){
                                        if(j == memberList.length-1){
                                            members = members+handler.config.customerCommon.getUserName(memberList[j]);
                                        }else{
                                            members = members+handler.config.customerCommon.getUserName(memberList[j])+",";
                                        }
                                    }
                                    common.members = members;
                                }else{
                                    common.members = members;
                                }
                            html.push(DS.renderMethodViewNew(view,common));
                        }
                        commonListPane.html(html.join(''));
                    });
                }else{
                    commonListPane.html('');
                }
                DS.updatePagination('customerCommon_form', rep.count,data.limit, data.page);
            }else{
                alert("查询失败，请重新查询!");
            }
        })
    },
    sysOrNewAddCommon:function(category,cName,cId){
        var html  = "";
        var ht =  "<a href='#' class='ds_do_action' ds_action='config.customerCommon.queryCustomerCommonInfo' ds_data='"+cId+"'>查看</a>"+
                     "&nbsp;&nbsp;"+
                     "<a href='#' class='ds_do_action' ds_action='config.customerCommon.upCustomerCommon' ds_data='"+cId+"'>修改</a>&nbsp;&nbsp;";
        if(category=="0"||category == "1" || category == "2"){
            html = ht;
            return html;
        }else{
            var uHtml = "<a href='#' class='ds_do_action' ds_action='config.customerCommon.showDeleteCustomerCommon' ds_data='"+cId+"|"+cName+"'>删除</a>";
            html = ht + uHtml;
            return html;
        }
    },
    returnCommon:function(data,src){
        //$("tr").removeClass("active");
        $("#customerCommon_form").find("tr").removeClass("active");
        $('#customerCommon_info_pane').hide();
        //$('#customerCommon_list_panel').show();
        $("#customerCommon_info_pane").find("input[name='selectAllCustomer']").attr("checked",false);
        $("#customerCommon_info_pane").find("input[name='selectAll']").val(0);
    },
    queryCustomerCommonInfo:function(data,src){
        $("#customerCommon_add_pane").hide();
        $("#customerCommon_amend_pane").hide();
        var panel = $("#frm_customerCommon_info_pane");
        panel.find('[name="customerName"]').val('');
        panel.find('[name="selectAllCustomer"]').prop('checked',false);
        var pane = $('#customerCommon_info_pane');
        //$('#customerCommon_list_panel').hide();
        $(src).closest("tr").addClass("active").siblings().removeClass("active");
        var page=1;
        if(src && !src.hasClass("ds_form_action"))page=src.val();
        if(!page)page=1;
        var sendData = {};
        sendData.page=page;
        var commonId = "";
        if(data.commonId){
            commonId = data.commonId;
        }else{
            commonId = data;
        }
        sendData.commonId = commonId;
        if(data.customerName&&data.customerName!=""){
            sendData.name = data.customerName;
        }
        pane.find("input[name='commonId']").val(commonId);
        var mareListPane = pane.find(".customer_list");
        mareListPane.empty();
        var action = {
            action:'config.customerCommon.queryCustomerCommonInfo',
            data:sendData
        };
        DS.send(action,function(rep){
            if(rep.success){
                var common = rep.common;
                var cName = common.cName;
                $(".cName").html(cName);
                var managers = "";
                for(var h =0;h< common.managers.length;h++){
                    managers = managers+ '<li>'+handler.config.customerCommon.getUserName(common.managers[h])+'</li>';
                }
                var category = common.category;
                pane.find("input[name='saleType']").val(category);
                if(category=="4"){
                    $(".saleChance").show();
                    $(".customerCommon").hide();
                    $(".recycleCustomerCommon").show();
                    $(".needImport").show();
                }else if(category=="3"||category=="0"){
                    $(".saleChance").hide();
                    $(".customerCommon").show();
                    $(".recycleCustomerCommon").show();
                    $(".needImport").show();
                }else{
                    $(".saleChance").hide();
                    $(".customerCommon").hide();
                    $(".recycleCustomerCommon").hide();
                    $(".needImport").hide();
                }
                $(".managers").html(managers);
                var members = "";
                for(var j=0;j<common.members.length;j++){
                        members = members+'<li>'+handler.config.customerCommon.getUserName(common.members[j])+'</li>';
                }
                $(".members").html(members);
                var rules = "<li>默认状态领取上限为【"+common.ruleNum+"】个</li>";
                $(".rules").html(rules);
                var recycle = "";
                for(var kk in common.recycle){
                     if(kk == "deNum"){
                         if(category=="4"){
                             recycle += "默认状态,【"+common.recycle[kk]+"】分钟无有效的通话,自动回收到公海.</br></br>";
                         }else if(category=="0"||category=="3"){
                             recycle += "默认状态,【"+common.recycle[kk]+"】天无有效的通话,自动回收到公海.</br></br>";
                         }
                    }else if(kk == "foNum"){
                         recycle += "跟进状态,【"+common.recycle[kk]+"】天无完成的联系计划或有效的通话,自动回收到公海.";
                     }
                }
                if(recycle == ""){
                    recycle = "不回收";
                }
                $(".recycle").html(recycle);
                var list = rep.list;
                if(list.length>0){
                    for(var i in list){
                        var custsource1 = list[i]['custsource1'];
                        if(!custsource1){
                            list[i]['custsource1']='';
                        }
                        mareListPane.append($("#tmpl_customer_item").tmpl(list[i]));
                    }
                }
                DS.updatePagination('frm_customerCommon_info_pane', rep.count, handler.config.customerCommon.limit, page);
                pane.show();
            }
        });

    },


    addCustomerCommon: function (data,src) {
        //var p=$('#batch_modal');
        $("#customerCommon_info_pane").hide();
        $("#customerCommon_amend_pane").hide();
        var p=$('#customerCommon_add_pane');
        p.show();
        DS.getView('config/customerCommon/addCustomerCommon',function(view){
            //p.find('.modal-title').text('新建公海');
            p.find(".createSeas").html(view);
            //p.width(685).find(".modal-body");
            //p.modal({backdrop:'static'});
        });
    },
    upCustomerCommon: function (data,src) {
        $(src).closest("tr").addClass("active").siblings().removeClass("active");
        var commonId = data;
        //console.dir(commonId);
        //var p=$('#batch_modal');
        $("#customerCommon_info_pane").hide();
        $("#customerCommon_add_pane").hide();
        var p=$('#customerCommon_amend_pane');
        p.show();
        DS.getView('config/customerCommon/upCustomerCommon',function(view){
            view = view.replace(/_#commonId#_/g,commonId);
            //p.find('.modal-title').text('修改公海');
            p.find(".amendSeas").html(view);
            //p.width(685);
            //p.modal({backdrop:'static'});
            var action = {
                action : 'config.customerCommon.queryCommonById',
                data:commonId
            };
            DS.send(action,function(rep){
                if(rep.success){
                    var common = rep.common;
                    var cName = common.cName;
                    var managers = common.managers;
                    var members = common.members;
                    var category = common.category;
                    if(category=="4"){
                        $(".claimCustomer").hide();
                        $(".invalidCustonerCommon").hide();
                        $(".lostCustonerCommon").hide();

                        $(".unit").html("分钟");
                    }else if(category=="1"){
                        $(".claimCustomer").hide();
                        $(".recyleCustomer").hide();
                        $(".invalidCustonerCommon").show();
                        $(".lostCustonerCommon").hide();
                        $(".categoryCustomerCommon").hide();
                        $(".categoryMembers").find(".control-label").removeClass("required");
                    }else if(category=="2"){
                        $(".claimCustomer").hide();
                        $(".recyleCustomer").hide();
                        $(".lostCustonerCommon").show();
                        $(".invalidCustonerCommon").hide();
                        $(".categoryCustomerCommon").hide();
                        $(".categoryMembers").find(".control-label").removeClass("required");
                    }else{
                        $(".invalidCustonerCommon").hide();
                        $(".lostCustonerCommon").hide();
                        $(".claimCustomer").show();
                        $(".unit").html("天");
                        var ruleNum = common.ruleNum;

                    }
                    $("input[name='cate'][value="+category+"]").attr("checked",true);
                    var recycle = common.recycle || [];
                    if(recycle){
                        for(var k in recycle){
                            if(k=="deNum"){
                                p.find("input[name='deNum']").val(recycle[k]);
                            }else if(k == "foNum"){
                                p.find("input[name='foNum']").val(recycle[k]);
                            }
                        }
                    }
                    var users = getCache("agents");
                    if(managers){
                        var html = "";
                        var managersList = "";
                        var managerPane = $("#managers_owner_select_adminUser").find(".tabbox_agent_result");
                        var uName = "";
                        for(var m = 0;m<managers.length;m++){
                            for(var i=0;i<users.length;i++){
                                var u = users[i];
                                if(u._id == managers[m]){
                                    uName = u.displayName;
                                    break;
                                }
                            }
                            html = '<span userid="'+managers[m]+'"><b class="delete_result">x</b>'+uName+'</span>';
                            managerPane.append(html);
                            if(m==managers.length-1){
                                managersList += managers[m];
                            }else{
                                managersList += managers[m]+",";
                            }
                        }
                        p.find("input[name='managers']").val(managersList);
                    }
                    if(members){
                        var html = "";
                        var membersList = "";
                        var memeberPane = $("#members_owner_select_memberUser").find(".tabbox_agent_result");
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
                        p.find("input[name='members']").val(membersList);
                    }
                    p.find("input[name='cName']").val(cName);
                    p.find("input[name='ruleNum']").val(ruleNum);
                    p.find("input[name='category']").val(category);
                }
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
    cancelModal:function(e){
        //console.log($(e).find("tr"));
        $("#customerCommon_form").find("tr").removeClass("active");
        if(e == 'frm_customerCommon_update'){
            $('#customerCommon_amend_pane').hide();
        }else if(e == 'frm_customerCommon_add'){
            $('#customerCommon_add_pane').hide();
        }
    },
    saveCustomerCommon:function(data,src){
        delete data.ownercomManagers;
        delete data.ownercomMembers;
        if (src.hasClass("disabled")) return false;
        if(!data.cName || data.cName ==""){
            $().alertmessage('showError', "公海名称必须填写!");
            return;
        }
        if(!data.managers || data.managers == "" || data.managers == "serachInputNoresult"){
            $().alertmessage('showError', "请至少选择一个存在的管理员!");
            return;
        }
        if(!data.members || data.members == "" || data.members == "serachInputNoresult"){
            $().alertmessage('showError',"请至少选择一个存在的成员!");
            return;
        }
        var managers = [];
        var managerList = data.managers.split(",");
        delete data.managers;
        for(var m = 0;m<managerList.length;m++){
            managers.push(managerList[m]);
        }
        data.managers = managers;
        var members = [];
        var memberList = data.members.split(",");
        delete data.members;
        for(var b = 0;b<memberList.length;b++){
            members.push(memberList[b]);
        }
        data.members = members;
        var deNum = data.deNum;
        delete data.deNum;
        var foNum = data.foNum;
        delete data.foNum;
        var recycle = {};
        if(deNum!=""){
            recycle.deNum = deNum;
        }
        if(foNum!=""){
            recycle.foNum = foNum;
        }
        data.recycle = recycle;
        var category = data.category;
        if(category=="4"){
            delete data.ruleNum;
        }
        src.addClass("disabled");
        var action = {
            action:'config.customerCommon.saveCustomerCommon',
            data:data
        };
        DS.send(action,function(rep){
            if (rep.success) {
                $().alertmessage('showSuccess', "添加公海成功");
                addCache("custCategorys",rep.data);
                handler.config.customerCommon.cancelModal('frm_customerCommon_add');
                handler.config.customerCommon.queryCommon(data,src);
            } else {
                $().alertmessage('showError', rep.message||errMsg);
            }
            src.removeClass('disabled');
        });
    },
    getUserName: function (agentID) {
        if(agentID == 'interface'){
            return '接口调用';
        }
        var agent = getCacheByKey('agents', '_id', agentID);
        if (agent) {
            //return agent.displayName+'['+agent.exten+']';
            return agent.displayName;
        } else {
            return '';
        }
    },
    saveUpCustomerCommon:function(data,src){
        delete data.ownercomManagers;
        delete data.ownercomMembers;
        delete data.cate;
        if (src.hasClass("disabled")) return false;
        if(!data.cName || data.cName ==""){
            $().alertmessage('showError', "公海名称必须填写!");
            return;
        }
        if(!data.managers || data.managers == "" || data.managers == "serachInputNoresult"){
            $().alertmessage('showError', "请至少选择一个存在管理员!");
            return;
        }
        var category = data.category;
        delete data.category;
        if(category=="4"){
            delete data.ruleNum;
        }
        if(category!="1"&&category!="2"){
            if(!data.members || data.members == "" || data.members == "serachInputNoresult"){
                $().alertmessage('showError',"请至少选择一个存在成员!");
                return;
            }
        }
        var managers = [];
        var managerList = data.managers.split(",");
        delete data.managers;
        for(var m = 0;m<managerList.length;m++){
            if(managerList[m]!=""){
                managers.push(managerList[m]);
            }
        }
        data.managers = managers;
        var members = [];
        var memberList = data.members.split(",");
        delete data.members;
        for(var b = 0;b<memberList.length;b++){
            if(memberList[b]!=""){
                members.push(memberList[b]);
            }
        }
        data.members = members;
        var deNum = data.deNum;
        delete data.deNum;
        var foNum = data.foNum;
        delete data.foNum;
        var recycle = {};
        if(deNum!=""){
            recycle.deNum = deNum;
        }
        if(foNum!="") {
            recycle.foNum = foNum;
        }
        data.recycle = recycle;
        src.addClass("disabled");
        var action = {
            action:'config.customerCommon.UpCustomerCommon',
            data:data
        };
        DS.send(action,function(rep){
            if (rep.success) {
                $().alertmessage('showSuccess', "修改公海成功");
                rep.data.category = category;
                updateCache("custCategorys",rep.data._id,rep.data);
                handler.config.customerCommon.cancelModal('frm_customerCommon_update');
                handler.config.customerCommon.queryCommon(data,src);
            } else {
                if(rep.code=="1001"){
                    $().alertmessage('showError','该公海已经删除,不可以再修改!');
                    handler.config.customerCommon.cancelModal('frm_customerCommon_update');
                }else{
                    $().alertmessage('showError', rep.message||errMsg);
                }
            }
            src.removeClass('disabled');
        });
    },
    initImportInfo:function(){
        var pane=$("#customerCommon_import_pane");
        var type=pane.find("select[name='dbType']");
        type.empty();
        handler.customer.getCustDbType(type.get(0),null,null,1);
        var dt=type.val();
        type.change();
        var time=getDateNo();
        pane.find("input[name='batchNo']").val(time);
    },
    uploadSucess:function(evt){
//       console.log(evt.target.responseText);
        var rep = $.parseJSON(evt.target.responseText);
        if(rep && !rep.success){
            $().alertmessage('showError', "上传文件失败，请检查网络或文件是否正确");
            return;
        }
        var fileName=rep.filePath.substring(rep.filePath.lastIndexOf("/")+1);
        var trueName=rep.fileName;
        handler.config.customerCommon.getXlsHeads(trueName,fileName);
    },
    getXlsHeads:function(trueName,fileName){
        var pane=$("#customerCommon_import_pane");
        var action = {
            action: 'app.customer.getXlsHeads',
            data: {
                trueName:trueName,
                fileName:fileName
            }
        };
        DS.send(action,function(response){
            if(response.success){
                pane.find("input[name='fileName']").val(fileName);
                pane.find("input[name='trueName']").val(trueName);
                pane.find("input[name='xlsHeads']").val($.toJSON(response.heads));
                handler.config.customerCommon.initImportInfo();
//                handler.customer.uploadHeads=response.heads;
//                f(response.heads);
                pane.find("#cust_imp_baseinfo").show();
            }else{
                $().alertmessage('showError', response.message||errMsg);
            }
        });
    },
    uploadError:function(evt){
        $().alertmessage('showError', "上传失败");
    },
    showCustomerCommonImort:function(data,src){
        var commonId = data.commonId;
        var saleType = data.saleType;
        var p=$('#batch_modal');
        DS.getView('config/customerCommon/customer_import_add',function(view){
            view=view.replace(/_#commonId#_/g,commonId).replace(/_#saleType#_/g,saleType);
            p.find('.modal-title').html('<span class="active ds_do_action" ds_action="config.customerCommon.showImportTab" ds_data="customerCommon_import_pane" style="font-size: 16px;">导入客户</span><span class="ds_do_action" ds_action="config.customerCommon.showImportTab" ds_data="customer_import_history" style="font-size: 16px;">导入历史</span>');
            p.find(".modal-body").html(view);
            var pa = $("#customerCommon_import_pane");
            var type=pa.find("select[name='dbType']");
            type.change(function(){
                var v=$(this).val();
                if(!v)return;
                var s1=pa.find("select[name='status']"),s2=pa.find("select[name='source1']");
                s1.empty();s2.empty();
                handler.customer.getOptionDic(v,'status',s1.get(0));
                handler.customer.showSourceOption(v,s2.get(0));
                var heads=pa.find("input[name='xlsHeads']").val();
                heads=eval(heads);
                var html=handler.customer.xlsRelation(v,heads);
                var pane2=pa.find("#import_cust_relations_container");
                pane2.html(html);
            });
            p.width(730);
            p.find(".customer_import_detail").click();
            p.modal();
        });
    },
    importCust:function(data,src){
        if (src.hasClass("disabled")) return false;
        if(!data.dbType){
            $().alertmessage('showError', "必须选择一个数据库");
            return;
        }
        data.dic={};
        data.flag="start";
        data.batchNo=data.batchNo+(data.batchRemark=='添加批次说明'?'':data.batchRemark);
        delete data.batchRemark;
        var hasName=0;
        if(handler.customer.dicFields){
            for(var i=0;i<data.heads.length;i++){
                var field=data.heads[i];
                if(field=='name'){
                    hasName=1;
                }
                var temp=handler.customer.dicFields[field];
                if(temp){
                    data.dic[field]= temp;
                }
            }
        }
        if(!hasName){
            $().alertmessage('showError', "导入客户字段必须包括姓名,请检查关联关系!");
            return false;
        }
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
            action: 'app.customer.import',
            data: data
        };
        DS.send(action,function(rep) {
            if(rep.success){
                dsevent.publish(dsevent.evt.importCustomer,rep.row);
                $().alertmessage('showSuccess','导入成功!');
                handler.config.customerCommon.queryCustomerCommonInfo(data,src);
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
            var file = $("#fileToUpload");
            file.after(file.clone().val(""));
            file.remove();
            var pane=$("#customerCommon_import_pane");
            pane.find("input[name='batchNo']").val("");
            src.removeClass("disabled");
            pane.find("#cust_imp_baseinfo").hide();
        });
    },
    queryImportDetail:function(data,src){
        var p=$('#batch_modal');
        data=data||{};
        var page=1;
        page=src.val();
        var batchNo = data.batchNo;
        if(batchNo && batchNo!=""){
            data.batchNo = batchNo;
        }

        if(!page)page=1;
        data.page=page;
        data.limit=handler.config.customerCommon.limit;
        var action = {
            action: 'config.customerCommon.queryImportDetail',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var list = response.list;
                var count = response.count;
                if (list.length > 0){
                    DS.getView('config/customerCommon/import_detail_item', function (view) {
                        var html = [];
                        for (var i = 0;i<list.length; i++) {
                            var row = list[i];
                            row.flagDic=getDicCacheName('impTaskStatus',row.flag);
                            html.push(DS.renderMethodViewNew(view, row));
                        }
                        p.find('.import_detail_list').html(html.join(''));
                    });
                } else {
                    var html='<tr><td class="text-center" colspan="10">没有记录!</td></tr>';
                    p.find('.import_detail_list').html(html);
                }
                var frmId="frm_import_detail_search";
                DS.updatePagination(frmId, count, data.limit, data.page);
            }else{
                $().alertmessage('showError', response.message||errMsg);
            }
        });
    },
    //重置导入详情查询
    resetImportDetail:function(data,src){
        var frm=src.closest("form");
        frm[0].reset();
    },
    showImportTab:function(data ,src){
        var pane = $("#"+data);
        src.addClass("active").siblings().removeClass("active");
        pane.show().siblings().hide();
    },
    addCustomer:function(data,src){
        var menu = data.menu;
        var commonId = data.commonId;
        var saleType = data.saleType;
        var p=$('#batch_modal');
        $('#batch_modal').fadeIn();
        $(".modal-backdrop").fadeIn();
        DS.getView('config/customerCommon/customer_add',function(view){
            view=view.replace(/_#menu#_/g,menu).replace(/_#dealSrc#_/g,"customer")
                .replace(/_#callNo#_/g,"").replace(/_#commonId#_/g,commonId).replace(/_#saleType#_/g,saleType);
            p.find('.modal-title').text('添加客户');
            p.find(".modal-body").html(view);
            p.siblings(".cust_tab_content").empty().height("auto");
            var o=p.find("#icc_add_customer_dbType");
            var tmpls=getCache('custTmpls');
            if(tmpls && tmpls.length>0){
                var dbType=tmpls[0]._id;
                o.val(dbType);
                handler.customer.loadCustAddTmpl(dbType,p);
            }
            p.width(600);
            p.modal({backdrop:'static'});
        });
    },
    showPopUpdate: function(data,src){
        var cid=data;
        var pane = $('#customerCommon_info_pane');
        var commonId = pane.find("input[name='commonId']").val();
        var dbType="";
        var tmpls=getCache('custTmpls');
        if(tmpls&&tmpls.length>0){
            dbType = tmpls[0]._id;
        }
        var pane=$('#batch_modal');
        $('#batch_modal').fadeIn();
        $(".modal-backdrop").fadeIn();
        DS.getView("config/customerCommon/customer_update_pop", function (view) {
            pane.find('.modal-title').text('更新客户');
            view=view.replace(/_#id#_/g,cid).replace(/_#menu#_/g,"customer_common").replace(/_#flag#_/g,"customer").replace(/_#commonId#_/g,commonId);
            pane.find(".modal-body").html(view);
            pane.find(".func_hide").remove();
            handler.customer.loadCustUpdateTmpl(cid,dbType,pane,function(){
                pane.width(600);
                pane.modal({backdrop:'static'});
            });
        });
    },
    saveCustomer:function(data,src){
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
        var commonId = data.commonId;
        delete data.commonId;

        data.owner = commonId;
        data.callId=callId;
        data.actionType="self";
        data.phone=phone;
        var custName=data.name;
        data.attachs=[];
        data.categoryId = commonId;
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
        src.addClass("disabled");
        var action = {
            action: 'app.customer.addCustomer',
            data: data
        };
        DS.send(action,function(rep){
            if(rep.success){
                $().alertmessage('showSuccess', "增加客户成功!");
                handler.config.customerCommon.cancelModal();
                data.commonId = commonId;
                handler.config.customerCommon.queryCustomerCommonInfo(data,src);
                var _pane=$('#batch_modal');
                _pane.find(".modal-body").empty();
                _pane.modal("hide");
            }else{
                if(rep.code=='1001'){
                    $().alertmessage('showError', "电话号码重复");
                }else if(rep.code=='1002'){
                    $().alertmessage('showError', "客户名称重复");
                }else{
                    $().alertmessage('showError', rep.message|| errMsg);
                }
            }
            src.removeClass("disabled");
        });
    },
    updateCustomer:function(data,src){
        if (src.hasClass("disabled")) return false;
        var pane=src.closest(".contact_summary");
        var tels=data.tel,memos=data.memo;
        if(tels){
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
        }

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
        src.addClass("disabled");
        var action = {
            action: 'app.customer.updateCustomer',
            data: data
        };
        DS.send(action,function(rep){
            if(rep.success){
                $().alertmessage('showSuccess', "修改客户成功!");
                handler.config.customerCommon.cancelModal();
                handler.config.customerCommon.queryCustomerCommonInfo(data,src);
                dsevent.publish(dsevent.evt.customerUpdate, data);
                dsevent.publish(dsevent.evt.refreshCustomerName, {custId: data._id, custName: data.name});
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
    //导出客户
    exportCustomer:function(data,src){
        var commonId = data.commonId;
        var num = 0;
        var query = {};
        var dbType = getCache('custTmpls')[0]._id;
        var isAll = $("#customerCommon_info_pane").find("input[name='selectAll']").val();
        if(isAll==1){
            num = $("#customerCommon_info_pane").find(".result_count").text();
            query = {dbType:dbType,categoryId:commonId};
        }else{
            var pane = $("#customerCommon_info_pane").find('.customer_list');
            var ma = pane.find("input[type=checkbox]:checked");
            num = ma.length;
            var idS = [];
            $.each(ma,function(key, item){
                idS.push($(item).val());
            });
            query = {_id:{"$in":idS},dbType:dbType};
        }
        if(num==0){
            $().alertmessage('showError',"请选择一条记录");
            return;
        }
        num=parseInt(num,10)||0;
        if(num<=0){
            $().alertmessage('showError', "请至少选择一条进行操作!");
            return;
        }
        if(num>10000){
            $().alertmessage('showError', "最多导出10000条,请分多次导出!");
            return;
        }
        query.menu = "customerCommon";
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'exportCustomer2In',Query:query}
        };
        DS.send(action,function(rep) {
            if(rep.Succeed){
                downloadFile(rep.path);
                $().alertmessage('showSuccess','导出成功!');
                $("#customerCommon_info_pane").find("input[name='selectAllCustomer']").attr("checked",false);
                $("#customerCommon_info_pane").find("input[name='selectAll']").val(0);
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    showCustAssign:function(data,src){
        var pane = $("#customerCommon_info_pane").find('.customer_list');
        var ma = pane.find("input[type=checkbox]:checked");
        if(ma.length==0){
            $().alertmessage('showError',"请选择一条记录");
            return;
        }
        var num = ma.length;
        num=parseInt(num,10)|| 0;
        if(num<=0){
            $().alertmessage('showError', "请至少选择一条进行操作！");
            return;
        }
        var menu = data.menu;
        var commonId = data.commonId;
        var pane=$('#batch_modal');
        DS.getView('config/customerCommon/customer_assign',function(view){
            pane.find('.modal-title').text('分配客户');
            view=view.replace(/_#menu#_/g,menu).replace(/_#commonId#_/g,commonId);
            pane.find(".modal-body").html(view);
            var users=filterUserByScope('customer');
            users=handler.customer._bubbleSort(users);
            users=copyEnableUser(true,users);
            var html=[];
            for(var i=0;i<users.length;i++){
                var u=users[i];
                var tmpl=pane.find("#tmpl_cust_assgin").tmpl(u).get(0).outerHTML;
                if((i+1)%3==1){
                    html.push('<div class="row-fluid">'+tmpl);
                }else if((i+1)%3==0){
                    html.push(tmpl+'</div>');
                }else{
                    html.push(tmpl);
                }
            }
            if(users.length%3==1){
                html.push('<div class="span8"></div></div>');
            }else if(users.length%3==2){
                html.push('<div class="span4"></div></div>');
            }
            $(".cust_assgin_container",pane).html(html.join(""));
            $(".user_cust",pane).keyup(function (event) {
                var e = event.keyCode;
                if ((e >= 48 && e <= 57) ||(e >= 96 && e <= 105) || e == 8) {
                    var len = $(".user_cust",pane).length;
                    var sum = 0;
                    for(var xx=0;xx<len;xx++){
                        var inputval = $(".user_cust",pane).get(xx).value;
                        if(inputval){
                            sum+= parseInt($(".user_cust",pane).get(xx).value);
                        }
                    }
                    $(".cust_more_count",pane).text(parseInt($(".cust_count",pane).text())-sum);
                }
            });
            $(".cust_count",pane).text(num);
            $(".cust_more_count",pane).text(num);
            pane.width(700);
            pane.modal();
        });
    },
    saveCustAssign:function(data,src){
        var pane = $("#customerCommon_info_pane").find('.customer_list');
        var ma = pane.find("input[type=checkbox]:checked");
        var idS = [];
        $.each(ma,function(key, item){
            idS.push($(item).val());
        });
        var dbType = getCache('custTmpls')[0]._id;
        var query = {_id:{"$in":idS},dbType:dbType};
        var owners=data.owner;
        var assigns=data.assign;
        var p=$("#batch_modal");
        var total = parseInt(p.find(".cust_count").text());
        var filter=[];
        var assginNum=0;
        for(var i=0;i<assigns.length;i++) {
            var t=assigns[i];
            if(t && parseInt(t)>0){
                assginNum+=parseInt(t,10);
                filter.push({owner:owners[i],count:parseInt(t,10)});
            }
        }
        if(assginNum>total){
            $().alertmessage('showError', "分配客户的总数不能超过【"+total+"】个");
            return;
        }
        var action={
            action:'app.customer.saveCustAssign2In',
            data : {query:query,owners:filter,total:total}
        };
        DS.send(action,function(rep){
            if(rep.success){
                dsevent.publish(dsevent.evt.customerRefresh);
                $().alertmessage('showSuccess', "分配完成");
               handler.config.customerCommon.cancelModal();
                handler.config.customerCommon.queryCustomerCommonInfo(data,src);
            }else{
                if(rep.code=='1001'){
                    $().alertmessage('showError', "您分配的数据总数发生变化，请重新确认后再操作");
                }else{
                    $().alertmessage('showError', errMsg);
                }
            }
        },"POST");
    },

    generateOptions: function (obj, ary, val, selected) {
        if ($.isArray(ary)) {
            var len = ary.length;
            for (var i = 0; i < len; i++) {
                var o = document.createElement("OPTION");
                obj.options.add(o);
                o.innerText = ary[i].n;
                o.value = ary[i].v;
                if (val) {
                    if (o.value == val)
                        o.selected = true;
                } else {
                    if (!selected) {
                        if (i == 0) o.selected = true;
                    }
                }
                if (len == 1) o.selected = true;
            }
        } else{
            for(var key in ary){
                var o = document.createElement("OPTION");
                obj.options.add(o);
                o.innerText = ary[key];
                o.value = key;
                if (val) {
                    if (o.value == val)
                        o.selected = true;
                } else {
                    if (!selected) {
                        if (i == 0) o.selected = true;
                    }
                }
                if (len == 1) o.selected = true;
            }
        }
    },

    _initCustomerCommon:function(pane){
                var ary = {};
                var list = getCache("custCategorys");
                if (list.length > 0) {
                    for(var i=0;i<list.length;i++){
                        var m = list[i];
                        var managers = m.managers;
                        var category = m.category;
                        var userId = session.user._id;
                        if(category=="0"||category=="3"||category=="4"){
                            if($.inArray(userId,managers)!=-1){
                                ary[m._id] = m.cName;
                            }
                        }
                    }
                }
                var node=pane.find("select[name='cName']");
                handler.config.customerCommon.generateOptions(node.get(0),ary);
    },
    transferCustomer:function(data,src){
        var num = 0;
        var isAll = $("#customerCommon_info_pane").find("input[name='selectAll']").val();
        if(isAll==1){
            num = $("#customerCommon_info_pane").find(".result_count").text();
        }else{
            var pane = $("#customerCommon_info_pane").find('.customer_list');
            var ma = pane.find("input[type=checkbox]:checked");
            num = ma.length;
        }
        if(num==0){
            $().alertmessage('showError',"请选择一条记录");
            return;
        }
        $('#batch_modal').fadeIn();
        $(".modal-backdrop").fadeIn();
        DS.getView('config/customerCommon/customer_batch_transfer',function(view){
            view = view.replace(/_#commonId#_/g,data.commonId);
            var p=$('#batch_modal');
            p.find('.modal-title').text('转移客户');
            p.find(".modal-body").html(view);
            handler.config.customerCommon._initCustomerCommon(p);
            $(".cust_count",p).text(num);
            p.width(600);
            p.modal({backdrop:'static'});
        });
    },
    batchTransferCustomerCommon:function(data , src){
        var menu=data.menu;
        var commonId=data.commonId;
        var p=$('#batch_modal');
        var isAll = $("#customer_sale_chance_info_pane").find("input[name='selectAll']").val();
        var query = {};
        if(isAll==1){
            query = {categoryId:commonId};
        }else{
            var pane = $("#customerCommon_info_pane").find('.customer_list');
            var ma = pane.find("input[type=checkbox]:checked");
            var idS = [];
            $.each(ma,function(key, item){
                idS.push($(item).val());
            });
            query = {_id:{"$in":idS},categoryId:commonId};
        }
        var total = parseInt(p.find(".cust_count").text());
        var action={
            action:'config.customerCommon.batchTransferCustomerCommon',
            data: {query:query,commonId:data.cName,total:total}
        };
        DS.send(action,function(rep){
            if(rep.success){
                $().alertmessage('showSuccess', "转移客户成功");
                handler.config.customerCommon.cancelModal();
                handler.config.customerCommon.queryCustomerCommonInfo(data,src);
                $("#customerCommon_info_pane").find("input[name='selectAllCustomer']").attr("checked",false);
                $("#customerCommon_info_pane").find("input[name='selectAll']").val(0);
            }else{
                if(rep.code=='1001'){
                    $().alertmessage('showError', "您转移的数据总数发生变化，请重新确认后再操作");
                }else{
                    $().alertmessage('showError', errMsg);
                }
            }
        });
    },
    showDeleteCustomerCommon:function(data,src){
        var q = data.split("|");
        var name = q[1];
        var commonId = q[0];
        var action = {
            action:'config.customerCommon.queryCustomerCommonCustomer',
            data:commonId
        };
        DS.send(action,function(rep){
            if(rep.success){
                if(rep.count>0){
                    var view = "<p>公海【"+name+"】中存在客户，不可以删除!</p>"
                    var p=$('#confirm_modalBox');
                    p.find(".modal-body").html(view);
                    p.find(".ds_do_action").attr({"ds_action":"customer.cancelConfirmModal","ds_data":""})
                    p.width(600);
                    p.modal();
                }else{
                    var view = "<p>公海【"+name+"】删除后，将不能恢复,确认删除吗？</p>";
                    var p=$('#confirm_modalBox');
                    p.find(".modal-body").html(view);
                    p.find(".ds_do_action").attr({"ds_action":"config.customerCommon.deleteCustomerCommon","ds_data":commonId})
                    p.width(600);
                    p.modal();
                }
            }
        });
    },
    deleteCustomerCommon:function(data,src) {
        var commonId = data;
        var sendData = {
            commonId: data
        }
        var action = {
            action: 'config.customerCommon.deleteCustomerCommon',
            data: sendData
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                $().alertmessage('showSuccess', '删除公海成功!');
                removeCache("custCategorys", commonId);
                handler.customer.cancelConfirmModal();
                handler.config.customerCommon.queryCommon(sendData, src);
                var pane = $('#customerCommon_info_pane');
                pane.hide();
            } else {
                $().alertmessage('showError', rep.message || errMsg);
            }
        });
    },
    changeUnit: function (data, src) {
        var pane = src.parent();
        if (data == "duration") {
         $(".claimCustomer").hide();
         var unit = "分钟";
        } else {
            $(".claimCustomer").show();
            var unit = "天";
        }
        $(".unit").html(unit);
    }
    //initCustomerCommon:function(data,src){
    //    var action = {
    //        action : 'config.customerCommon.initCustomerCommon',
    //        data:[]
    //    };
    //    DS.send(action,function(rep){
    //       if(rep.success){
    //           $().alertmessage('showSuccess','系统设置公海成功!');
    //           handler.config.customerCommon.queryCommon({},src);
    //       }else{
    //           $().alertmessage('showError',rep.message || errMsg);
    //       }
    //    });
    //}
}