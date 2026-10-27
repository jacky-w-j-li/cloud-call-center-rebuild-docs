Ext.define('App.controller.resource.cc.pbx', {
    extend: 'Ext.app.Controller',
    views: [],
    models: [],
    initFlag: false,
    refs: [
        {
            ref: 'queryGrid',
            selector: 'ccpbxQueryPanel > grid[class="query"]'
        },
        {
            ref: 'ccaddPbxWindow',
            selector: 'ccaddPbxWindow'
        }

    ],
    init: function () {
        this.control({
                'ccpbxQueryPanel >  button#cc_add_pbx_tool': {
                    click: this.showAddPbx
                },
                'ccaddPbxWindow >  button#create_new_pbx_button': {
                    click: this.addPbx
                },
                'ccaddPbxWindow >  button#batch_create_new_pbx_button': {
                    click: this.batchAddPbx,
                },
                'ccpbxQueryPanel >  button#cc_update_pbx_tool': {
                    click: this.showUpdatePbx
                },
                'ccupdatePbxWindow >  button#update_pbx_button': {
                    click: this.updatePbx
                },
                'ccpbxQueryPanel > grid[class="query"]': {
                    selectionchange: this.enableDockItems,
                    itemdblclick: this.showUpdatePbx
                },
                'ccpbxQueryPanel >  button#cc_delete_pbx_tool': {
                    click: this.deletePbx
                },
                'ccaddPbxWindow >  textfield[name="_id"]': {
                    change: this.addChangeID
                },
                'ccaddPbxWindow >  textfield[name="assAddr"]': {
                    change: this.addChangeASS
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
                App.util.AppUtil.request('bill.resource.cc.updatePbx', {_id: id, status: 'disable'}, function (data) {
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
        App.util.AppUtil.request('bill.resource.cc.getPbxInfo', {_id: id}, function (data, self) {
            if (data.success) {
                var win = Ext.create('App.view.resource.cc.pbx.update', {
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
            data.ifEnableAdd=data.ifEnableAdd.ifEnableAdd;
            App.util.AppUtil.request('bill.resource.cc.updatePbx', data, function (data, self) {
                //if (data.success) {
                //    App.util.AppUtil.msg("更新pbx成功！");
                //    win.close();
                //    self.getQueryGrid().store.load();
                //} else {
                //    App.util.AppUtil.msg(data.message);
                //}
                if(data.tag){
                    App.util.AppUtil.msg("更新pbx成功！添加cc信任ip成功！");
                    win.close();
                    self.getQueryGrid().store.load();
                }else if (data.success & !data.tag) {
                    App.util.AppUtil.msg(data.message);
                    win.close();
                    self.getQueryGrid().store.load();
                }else {
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
            App.util.AppUtil.request('bill.resource.cc.addPbx', data, function (data, self) {
                //if (data.success) {
                //    App.util.AppUtil.msg("添加pbx成功！");
                //    win.close();
                //    self.getQueryGrid().store.load();
                //} else {
                //    App.util.AppUtil.msg(data.message);
                //}
                if(data.tag){
                    App.util.AppUtil.msg("添加pbx成功！添加cc信任ip成功！");
                    win.close();
                    self.getQueryGrid().store.load();
                }else if (data.success & !data.tag) {
                    App.util.AppUtil.msg(data.message);
                    win.close();
                    self.getQueryGrid().store.load();
                }else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    batchAddPbx: function(obj) {
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.resource.cc.batchAddPbx', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("批量添加pbx成功！");
                    win.close();
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    showAddPbx: function (obj) {
        var win = Ext.create('App.view.resource.cc.pbx.add', {
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
    },
    addChangeID: function(obj,newValue) {
        var win = this.getCcaddPbxWindow();
        var nameField = win.down('textfield[name="name"]');

        nameField.setValue(newValue);
    },
    addChangeASS: function(obj,newValue) {
        if(!/^http:\/\/(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(newValue)){
            return;
        }
        var ip = newValue.replace('http://','');
        if(!ip || ip == ''){
            return;
        }

        var win = this.getCcaddPbxWindow();
        var configAddrField = win.down('textfield[name="configAddr"]');
        var sipAddrField = win.down('textfield[name="sipAddr"]');
        var encryptSipAddrField = win.down('textfield[name="encryptSipAddr"]');
        var routeIpField = win.down('textfield[name="routeIp"]');

        configAddrField.setValue('http://' + ip + ':7789');
        sipAddrField.setValue(ip + ':6060');
        encryptSipAddrField.setValue(ip + ':6070');
        routeIpField.setValue(ip);
    }


})
