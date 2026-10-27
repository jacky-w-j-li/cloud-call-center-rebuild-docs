handler.config.role= {
    pageSize:10,
    config_role: function (menu) {
        var container=$("#view_role_config");
        container.find('#query_role_condition').keydown(function (event) {
            if (event.keyCode == 13) {
                event.preventDefault();
                event.stopImmediatePropagation();
                container.find('.btn_role_search').click();
            }
        });
        handler.config.role.queryRoleList();
    },
    queryRoleList: function (data, src) {
        var container=$("#view_role_config");
        data=data||{};
        if(src){
            data.page = src.attr("value") || 1;
        }else{
            data.page = 1;
        }
        data.limit=handler.config.role.pageSize;
        var formID = "role_query_frm";
        var action = {
            action: 'config.role.queryRole',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var roles = response.list;
                var html = [];
                DS.getView('config/role/config_role_item', function (view) {
                    for (var i = 0; i < roles.length; i++) {
                        var role = roles[i];
                        if(!role.memo){
                            role.memo='';
                        }
                        if(!role.scope){
                            role.scope='';
                        }
                        html.push(DS.renderMethodViewNew(view,role));
                    }
                    container.find('#role_list_pane').html(html.join(""));
                    DS.updatePagination(formID, response.count, handler.config.role.pageSize, data.page);
                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        });

    },
    showRoleAdd: function (data) {
        var container=$("#view_role_config");
        DS.getView('config/role/config_role_add', function (view) {
            var pane = container.find("#role_detail_pane");
            pane.html(view);
            var action = {
                action: 'config.role.showRoleAdd',
                data: {}
            };
            DS.send(action, function (response) {
                if (response.success) {
                    handler.config.role.initRoleAdd(response.funcs);
                }else{
                    $().alertmessage('showError', errMsg);
                }
            });
        });
    },
    saveRole: function (data) {
        var container=$("#view_role_config")
        var treeObj = $.fn.zTree.getZTreeObj("role_funcTree");
        var nodes = treeObj.getCheckedNodes();
        var limits=[];
        for(var i=0;i<nodes.length;i++){
            limits.push(nodes[i].id);
        }
        data.limits_in=limits;

        //
        data.scope_out = {"call":"level","customer":"level","business":"level","custTask":"level","custApproval":"level","sms":"level"}
        data.scope_in = {
            "call":data.call,
            "customer":data.customer,
            "business":data.business,
            "chat":data.chat,
            "email":data.email,
            "qc":data.qc,
            "question":data.question,
            "sms":data.sms}
        data.scope = "level";
        delete data.call;
        delete data.customer;
        delete data.sms;
        delete data.custTask;
        delete data.chat;
        delete data.question;
        delete data.qc;
        delete data.email;
        //

        var action = {
            action: "config.role.addRole",
            data: data
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                $().alertmessage('showSuccess', "增加角色成功");
                addCache('roles',rep.data);
                container.find("#role_detail_pane").empty();
                handler.config.role.queryRoleList();
            } else {
                $().alertmessage('showError', rep.message||errMsg);
            }
        })
    },
    delRoleView: function (data) {
        var container=$("#view_role_config");
        var con = confirm("确定要删除该角色吗？");
        if (!con) {
            return false;
        }
        var action = {
            action: 'config.role.delRole',
            data: {_id: data._id}
        };
        DS.send(action, function (response) {
            if (response.success) {
                removeCache("roles",data._id);
                $().alertmessage('showSuccess', "删除成功");
                handler.config.role.queryRoleList();
            } else {
                $().alertmessage('showError', errMsg);
            }
        });
    },
    showRoleView: function (data, src) {
        var container=$("#view_role_config");
        DS.getView('config/role/config_role_edit', function (view) {
            var pane = container.find("#role_detail_pane");
            pane.empty();
            pane.html(view);
            var action = {
                action: 'config.role.showRoleEdit',
                data: {_id: data._id}
            };
            DS.send(action, function (response) {
                if (response.success) {
                    var role = response.role;
                    var funcs = response.funcs;
                    var scope=role.scope||"level";
                    container.find("#frm_role_edit").find("input[name=display_name]").val(role.display_name);
                    container.find("#frm_role_edit").find("textarea[name=memo]").val(role.memo);
                    container.find("#frm_role_edit").find("input[name=_id]").val(role._id);
                    //container.find("#frm_role_edit").find("input[name=scope]").each(function(){
                    //    var val=$(this).val();
                    //    if(val==scope){
                    //        $(this).prop("checked",true);
                    //    }
                    //});
                    $("#scopeCall option[value='"+role.scope_in.call+"']").attr("selected","selected");
                    $("#scopeCustomer option[value='"+role.scope_in.customer+"']").attr("selected","selected");
                    $("#scopeBusiness option[value='"+role.scope_in.business+"']").attr("selected","selected");
                    $("#scopeChat option[value='"+role.scope_in.chat+"']").attr("selected","selected");
                    $("#scopeEmail option[value='"+role.scope_in.email+"']").attr("selected","selected");
                    $("#scopeQc option[value='"+role.scope_in.qc+"']").attr("selected","selected");
                    $("#scopeQuestion option[value='"+role.scope_in.question+"']").attr("selected","selected");
                    $("#scopeSms option[value='"+role.scope_in.sms+"']").attr("selected","selected");
                    handler.config.role.initRoleUpdate(funcs,role.limits_in);
                }else{
                    $().alertmessage('showError', errMsg);
                }
            });
        });
    },
    updateRole: function (data) {
        var container=$("#view_role_config");
        var treeObj = $.fn.zTree.getZTreeObj("role_funcTree");
        var nodes = treeObj.getCheckedNodes();
        var limits=[];
        for(var i=0;i<nodes.length;i++){
            limits.push(nodes[i].id);
        }
        data.limits_in=limits;

        data.scope_in = {
            "call":data.call,
            "customer":data.customer,
            "business":data.business,
            "chat":data.chat,
            "email":data.email,
            "qc":data.qc,
            "question":data.question,
            "sms":data.sms}
        data.scope = "level";
        delete data.call;
        delete data.customer;
        delete data.sms;
        delete data.custTask;
        delete data.chat;
        delete data.question;
        delete data.qc;
        delete data.email;

        var action = {
            action: "config.role.updateRole",
            data: data
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                $().alertmessage('showSuccess', "修改角色成功");
                updateCache("roles",data._id,data);
                container.find("#role_detail_pane").empty();
                handler.config.role.queryRoleList();
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    },
    cancelDeal: function (src) {
        var container=$("#view_role_config");
        container.find('#role_detail_pane').empty();
    },
    initRoleAdd: function (data) {
        var container=$("#view_role_config");
        var setting = {
            check: {
                enable: true
            }
        };
        $.fn.zTree.init(container.find("#role_funcTree"), setting, data);
    },
    initRoleUpdate: function (data,limits) {
        var container=$("#view_role_config");
        var setting = {
            check: {
                enable: true
            }
        };
        $.fn.zTree.init(container.find("#role_funcTree"), setting, data);
        var zTree = $.fn.zTree.getZTreeObj("role_funcTree"),
            nodes = zTree.getNodes();
        var nodeArray = zTree.transformToArray(nodes);
        for (var i=0, l=nodeArray.length; i<l; i++) {
            var node=nodeArray[i];
            if($.inArray(node.id,limits)!=-1){
                zTree.checkNode(node, true, false, false);
            }
        }
    },
    showFieldDesc:function(type,val){
        var desc='';
        if(type=='scope'){
            if(val=='level'){
                desc='我和我的下属';
            }else if(val=='all'){
                desc='所有人';
            }else if(val=='dept'){
                desc='本部门';
            }else if(val=='deptLevel'){
                desc='本部门及下级部门';
            }
        }
        return desc;
    }
}