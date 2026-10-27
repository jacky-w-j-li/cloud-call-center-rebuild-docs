Ext.define('App.controller.system.limit', {
    extend: 'Ext.app.Controller',
    views: [],
    models: [],
    initFlag: false,
    refs: [
        {
            ref: 'addSystemRoleWindow',
            selector: 'addSystemRoleWindow'
        },
        {
            ref: 'systemRoleQueryPanel',
            selector: 'systemRoleQueryPanel'
        },
        {
            ref: 'queryGrid',
            selector: 'systemRoleQueryPanel > grid[class="query"]'
        },
        {
            ref: 'updateSystemRoleWindow',
            selector: 'updateSystemRoleWindow'
        },
        {
            ref: 'editRoleLimitWindow',
            selector: 'editRoleLimitWindow'
        }
    ],
    init: function () {
        this.control({
                'systemRoleQueryPanel >   button#addSystemRole_tool': {
                    click: this.showAddRole
                },
                'addSystemRoleWindow >  button#create_new_role_button': {
                    click: this.addRole
                },
                'systemRoleQueryPanel >   button#updateSystemRole_tool': {
                    click: this.showUpdateRole
                },
                'systemRoleQueryPanel >  button#configSystemRole_tool': {
                    click: this.showConfigRole
                },
                'updateSystemRoleWindow >  button#update_role_button': {
                    click: this.updateRole
                },
                'systemRoleQueryPanel > grid[class="query"]': {
                    selectionchange: this.enableDockItems,
                    itemdblclick: this.showConfigRole
                },
                'editRoleLimitWindow > treepanel#user_limit_config_tree': {
                    checkchange: this.treeCheckChange
                },
                'editRoleLimitWindow >  button#edit_role_limit_confirm': {
                    click: this.updateRoleLimit
                }
            }
        );
        this.initFlag = true;
    },
    updateRoleLimit: function (obj) {
        var tree = obj.up("window").down('treepanel#user_limit_config_tree');
        var records = tree.getView().getChecked();
        var limit = new Array();
        Ext.Array.each(records, function (rec) {
            limit.push(rec.get("id"));
        });

        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        App.util.AppUtil.request("bill.systemUser.updateRoleLimits",{_id:id,limits:limit}, function(data,self){
            if(data.success){
                App.util.AppUtil.msg("修改权限成功！");
                obj.up("window").close();
                self.getQueryGrid().store.load();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        });


//        App.util.AppUtil.request('editSysRoleLimit', Ext.JSON.encode(jsonData), this.toEditRoleLimitHandler, this);
    },
    treeCheckChange: function (node, checked) {
        node.expand();
        node.set('checked', checked);
        var self = this;
        node.eachChild(function (child) {
            self.treeCheckChange(child, checked);
        });
    },
    showConfigRole: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var id = selection.get("_id");

        App.util.AppUtil.request('bill.systemUser.getRoleLimits', {_id: id}, function (data, self) {
            if (data.success) {
                var limits = data.limits || [];
                var role = data.role || {};
                App.util.AppUtil.processUserLimit(limits,role.limits);
                var dataRoot = {};
                dataRoot.expanded = true;
                dataRoot.text = '系统权限配置';
                dataRoot.children = limits;
                var editRoleLimit = Ext.create('App.view.system.limit.editRoleLimit', {
                    animateTarget: obj
                });
                editRoleLimit.show();
                editRoleLimit.down('treepanel#user_limit_config_tree').store.setRootNode(dataRoot);
                editRoleLimit.down('treepanel#user_limit_config_tree').expandAll();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        });
    },
    enableDockItems: function (selModel, selections) {
        var grid = this.getQueryGrid();
        var toolbar = grid.child('toolbar[class="dock"]');
        var items = toolbar.items.items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].needSelect) {
                items[i].setDisabled(selections.length === 0);
            }
        }
    },
    showUpdateRole: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        App.util.AppUtil.request('bill.systemUser.getUserRoleInfo', {_id: id}, function (data, self) {
            if (data.success) {
                var win = Ext.create('App.view.system.limit.updateRole', {
                    data: data.data,
                    animateTarget: obj
                });
                win.setTitle(selection.get('name') + '---->' + '角色配置');
                win.show();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },
    updateRole: function (obj) {
        var win = obj.up("window");
        var form = win.down('form');
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.systemUser.udpateUserRole', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("修改角色成功！");
                    win.close();
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }

    },
    showAddRole: function (obj) {
        var win = Ext.create('App.view.system.limit.addRole', {
            animateTarget: obj
        });
        win.show();
    },
    addRole: function (obj) {
        var win = obj.up("window");
        var form = win.down('form');
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.systemUser.addUserRole', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("添加角色成功！");
                    win.close();
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    }
});
