/**
 * Created by apple on 15/8/13.
 */
Ext.define('App.controller.resource.approveServiceNum', {
    extend: 'Ext.app.Controller',
    requires: [],
    views: [],
    refs: [
        {
            ref: 'queryGrid',
            selector: 'approveServiceNumWin > grid[class="query"]',
        },
        {
            ref: 'unpassApproveWindow',
            selector: 'unpassApproveWindow'
        },
    ],
    initFlag: false,
    init: function () {
        this.control({
            'approveServiceNumWin >  button#serviceNum_pass_update': {
                click: this.serviceNum_pass_update
            },
            'approveServiceNumWin >  button#serviceNum_unpass_update':{
                click: this.showUnpassInfo
            },
            'unpassApproveWindow >  button#btn_unpass_approve': {
                click: this.unpassApprove
            },
            'approveServiceNumWin > grid[class="query"]': {
                selectionchange: this.enableDockItems
            }
        });
        this.initFlag = true;
    },
    enableDockItems: function (selModel, selections) {
        var grid = this.getQueryGrid();
        var toolbar = grid.child('toolbar[class="dock"]');
        var items = toolbar.items.items;
        items=items[0].items.items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].needSelect) {
                items[i].setDisabled(selections.length === 0);
            }
        }
    },
    showUnpassInfo: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        if(selection.data.type=='unpass'){
            App.util.AppUtil.msg("该服务号已经未通过审核");
            return;
        }
        var win = Ext.create('App.view.resource.approveUnpass', {
            account: selection,
            animateTarget: obj
        });

        win.setTitle('审核不通过---->' + selection.get('serviceno'));
        win.show();
    },
    unpassApprove: function (obj) {
        if(!confirm('确认不通过此号码吗？'))return;
        var win = this.getUnpassApproveWindow();
        var form = win.down('form');
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('app.account.updateServiceNum_unpass', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("审核不通过此号码成功！");
                    var win = self.getUnpassApproveWindow();
                    win.close();
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    serviceNum_pass_update: function(obj){
        if(!confirm('确认通过此号码吗？'))return;
        var grid = Ext.getCmp("serviceNum_query_grid");
        var selection = grid.getSelectionModel().getSelection()[0];
        if(selection.data.type=='pass'){
            App.util.AppUtil.msg("该服务号已经审批通过");
            return;
        }
        App.util.AppUtil.request('app.account.updateServiceNum_pass', selection.data, function (data,self) {
            if (data.success) {
                App.util.AppUtil.msg("修改服务号申请状态成功！");
                grid.store.load();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    }
});