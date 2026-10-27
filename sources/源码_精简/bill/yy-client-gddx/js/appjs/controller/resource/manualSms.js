/**
 * Created by apple on 15/8/13.
 */
Ext.define('App.controller.resource.manualSms', {
    extend: 'Ext.app.Controller',
    requires: [],
    views: [],
    refs: [
        {
            ref: 'smsCheckGrid',
            selector: 'manualSmsPanel >  grid#manual_sms_check_grid'
        },
        {
            ref: 'smsCheckedGrid',
            selector: 'manualSmsPanel >  grid#manual_sms_checked_grid'
        },
        {
            ref: 'checkUnpassMsgWin',
            selector: 'checkUnpassMsgWin'
        }
    ],
    initFlag: false,
    init: function () {
        this.control({
            'manualSmsPanel >  grid#manual_sms_check_grid':{
                selectionchange: this.enableDockItems,
                itemdblclick: this.showSmsInfoWin
            },
            'manualSmsPanel >  button#sms_check_pass_tool': {
                click: this.smsCheckPass
            },
            'manualSmsPanel >  button#sms_check_unpass_tool':{
                click: this.showUnpassMessageWin
            },
            'checkUnpassMsgWin >  button#manualSms_check_unpass_message_button':{
                click: this.smsCheckUnPass
            },
            'manualSmsPanel >  button#sms_check_find_tool':{
                click: this.showSmsInfoWin
            },
            'manualSmsPanel >  grid#manual_sms_checked_grid':{
                selectionchange: this.enableCheckedDockItems,
                itemdblclick: this.showSmsCheckedInfoWin
            },
            'manualSmsPanel >  button#sms_checked_find_tool':{
                click: this.showSmsCheckedInfoWin
            }
        });
        this.initFlag = true;
    },
    enableCheckedDockItems : function(selModel, selections){
        var grid = this.getSmsCheckedGrid();
        var toolbar = grid.child('toolbar[class="dock"]');
        var items = toolbar.items.items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].needSelect) {
                items[i].setDisabled(selections.length === 0);
            }
        }
    },
    showSmsCheckedInfoWin : function(obj , row){
        var grid = this.getSmsCheckedGrid();
        var selection = grid.getSelectionModel().getSelection()[0];//多选 只选择第1个元素
        var id = null;
        if(!selection){
            id = row.data._id;
        } else {
            id = selection.get("_id");
        }
        App.util.AppUtil.request('bill.resource.getCheckSmsById', {_id:id}, function (data, self) {
            if (data.success) {
                var win = Ext.create('App.view.resource.manualSms.checkedSmsInfoWin', {
                    data: data.data,
                    animateTarget: obj
                });
                win.show();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },
    enableDockItems: function (selModel, selections) {
        var grid = this.getSmsCheckGrid();
        var toolbar = grid.child('toolbar[class="dock"]');
        var items = toolbar.items.items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].needSelect) {
                items[i].setDisabled(selections.length === 0);
            }
        }
    },
    showSmsInfoWin: function (obj,row){
        var grid = this.getSmsCheckGrid();
        var selection = grid.getSelectionModel().getSelection()[0];//多选 只选择第1个元素
        var id = null;
        if(!selection){
            id = row.data._id;
        } else {
            id = selection.get("_id");
        }
        App.util.AppUtil.request('bill.resource.getCheckSmsById', {_id:id}, function (data, self) {
            if (data.success) {
                var win = Ext.create('App.view.resource.manualSms.checkSmsInfoWin', {
                    data: data.data,
                    animateTarget: obj
                });
                win.show();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },
    showUnpassMessageWin : function(obj){
        var grid = this.getSmsCheckGrid();
        var rows = grid.getSelectionModel().getSelection();
        var data = [];
        var verifyUser = gloab_client_user.loginName;
        if(rows.length < 1){
            App.util.AppUtil.msg("没有勾选短信！");
            return;
        }
        for(var i=0; i<rows.length;i++){
            data.push({_id:rows[i].data._id,account:rows[i].data.account});
        };
        var sendData = {
            checkUser : verifyUser,
            smsList : data,
            check : "unpass"
        };
        var win = Ext.create('App.view.resource.manualSms.checkUnpassSmsMessageWin', {
            data: sendData,
            animateTarget: obj
        });
        win.show();
    },
    smsCheckUnPass : function(obj){
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            var message = data.message || "";
            var sendData = win.data ||{};
            sendData.message = message;
            App.util.AppUtil.request('bill.resource.checkSmsByUser', sendData, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("修改短信状态成功！");
                    win.close();
                    self.getSmsCheckGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    smsCheckPass: function(obj){
        var grid = this.getSmsCheckGrid();
        var rows = grid.getSelectionModel().getSelection();
        var data = [];
        var verifyUser = gloab_client_user.loginName;
        if(rows.length < 1){
            App.util.AppUtil.msg("没有勾选短信！");
            return;
        }
        for(var i=0; i<rows.length;i++){
            data.push({_id:rows[i].data._id,account:rows[i].data.account});
        };
        var sendData = {
            checkUser : verifyUser,
            smsList : data,
            check : "pass"
        };
        App.util.AppUtil.request('bill.resource.checkSmsByUser', sendData, function (data, self) {
            if (data.success) {
                App.util.AppUtil.msg("修改短信状态成功！");
                grid.store.load();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    }


});
