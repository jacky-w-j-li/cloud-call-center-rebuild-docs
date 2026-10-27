Ext.define('App.controller.resource.pbx', {
    extend: 'Ext.app.Controller',
    views: [],
    models: [],
    initFlag: false,
    refs: [
        {
            ref: 'queryGrid',
            selector: 'pbxQueryPanel > grid[class="query"]'
        }

    ],
    init: function () {
        this.control({
                'pbxQueryPanel >  button#add_pbx_tool': {
                    click: this.showAddPbx
                },
                'addPbxWindow >  button#create_new_pbx_button': {
                    click: this.addPbx
                },
                'pbxQueryPanel >  button#update_pbx_tool': {
                    click: this.showUpdatePbx
                },
                'updatePbxWindow >  button#update_pbx_button': {
                    click: this.updatePbx
                },
                'pbxQueryPanel > grid[class="query"]': {
                    selectionchange: this.enableDockItems,
                    itemdblclick: this.showUpdatePbx
                },
                'pbxQueryPanel >  button#delete_pbx_tool': {
                    click: this.deletePbx
                }
            }
        );
        this.initFlag = true;
    },
    deletePbx: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        var self = this;
        Ext.Msg.confirm("警告", "确认删除pbx[" + id + "]?", function (result) {
            if (result == "yes") {
                App.util.AppUtil.request('bill.resource.updatePbx', {_id: id, status: 'disable'}, function (data) {
                    if (data.success) {
                        App.util.AppUtil.msg("删除pbx成功！");
                        self.getQueryGrid().store.load();
                    } else {
                        App.util.AppUtil.msg(data.message);
                    }
                }, this);
            }
        });
    },
    showUpdatePbx: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        App.util.AppUtil.request('bill.resource.getPbxInfo', {_id: id}, function (data, self) {
            if (data.success) {
                var win = Ext.create('App.view.resource.pbx.update', {
                    data: data.data,
                    animateTarget: obj
                });
                win.setTitle("pbx修改");
                win.show();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },
    updatePbx: function (obj) {
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.resource.updatePbx', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("更新pbx成功！");
                    win.close();
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    addPbx: function (obj) {
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.resource.addPbx', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("添加pbx成功！");
                    win.close();
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    showAddPbx: function (obj) {
        var win = Ext.create('App.view.resource.pbx.add', {
            animateTarget: obj
        });
        win.show();
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
    }


})