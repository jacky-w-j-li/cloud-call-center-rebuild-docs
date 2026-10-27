Ext.define('App.controller.system.myInfo', {
    extend: 'Ext.app.Controller',
    views: [],
    models: [],
    initFlag: false,
    refs: [
        {
            ref: 'myInfoQueryPanel',
            selector: 'myInfoQueryPanel'
        },
        {
            ref: 'withDrawWin',
            selector: 'withDrawWin'
        },
        {
            ref: 'payeeWin',
            selector: 'payeeWin'
        },
        {
            ref: 'myInfoGrid',
            selector: 'myInfoQueryPanel > grid[class="query"]'
        },
        {
            ref: 'queryPayeeGrid',
            selector: 'payeeWin > grid[class="query"]'
        },
        {
            ref: 'refWithdrawGrid',
            selector: 'withdrawManageQueryPanel > grid[class="query"]'
        }
    ],
    init: function () {
        this.control({
                'myInfoQueryPanel': {
                    afterrender: this.initMyInfo
                },
                'myInfoQueryPanel >  button#take_income_button': {
                    click: this.showWithDraw
                },
                'withDrawWin >  button#withdraw_confirm_button': {
                    click: this.saveWithDraw
                },
                'withDrawWin >  button#show_payee_button': {
                    click: this.showPayee
                },
                'payeeWin > grid[class="query"]': {
                    selectionchange: this.enableDockItems,
                    itemdblclick: this.setPayee
                },
                'payeeWin >  button#payee_select_tool': {
                    click: this.setPayee
                }
            }
        );
        this.initFlag = true;
    },
    enableDockItems: function (selModel, selections) {
        var grid = this.getQueryPayeeGrid();
        var toolbar = grid.child('toolbar[class="dock"]');
        var items = toolbar.items.items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].needSelect) {
                items[i].setDisabled(selections.length === 0);
            }
        }
    },
    showWithDraw: function (obj) {
        var user = this.getMyInfoQueryPanel().data;
        App.util.AppUtil.request('bill.systemUser.queryMylWithdraw', {}, function (result, self) {
            if (result.success) {
                var sum=result.sum;
                user.sum=sum;
                var win = Ext.create('App.view.system.systemUser.withDraw', {
                    data: user,
                    animateTarget: obj
                });
                win.setTitle(user.name + '---->' + '支取');
                win.show();
            } else {
                App.util.AppUtil.msg(result.message);
            }
        }, this);

    },
    saveWithDraw: function (obj) {
        var win = this.getWithDrawWin();
        var form = win.down('form');
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.systemUser.saveWithDraw', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("支取请求已经发送，3个工作日内处理！");
                    var win = self.getWithDrawWin();
                    win.close();
                    self.getRefWithdrawGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    showPayee: function (obj) {
        App.util.AppUtil.request('bill.systemUser.queryPayeeList', {}, function (data, self) {
            if (data.success) {
                var win = Ext.create('App.view.system.systemUser.payee', {
                    data: data.list,
                    animateTarget: obj
                });
                win.setTitle('选择收款人');
                win.show();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },
    setPayee:function(obj){
        var win =this.getPayeeWin();
        var selection = this.getQueryPayeeGrid().getSelectionModel().getSelection()[0];
        var withdraw = this.getWithDrawWin();
        var form = withdraw.down('form');
        var fieldset = form.down('fieldset');
        fieldset.down("textfield[name='payeeId']").setValue(selection.get("_id"));
        fieldset.down("textfield[name='cardName']").setValue(selection.get("cardName"));
        fieldset.down("textfield[name='address']").setValue(selection.get("address"));
        fieldset.down("textfield[name='bank']").setValue(selection.get("bank"));
        fieldset.down("textfield[name='cardNo']").setValue(selection.get("cardNo"));
        win.close();
    },
    initMyInfo: function (obj) {
        var panel=this.getMyInfoQueryPanel();
        App.util.AppUtil.request('bill.systemUser.getMyInfo', {}, function (data, self) {
            if (data.success) {
                var item=data.data;
                panel.data=data.data;
                panel.down("textfield[id='myinfo_balance']").setValue(App.util.AppUtil.formatTrueFee(item.balance||0));
                var controller = gloab_application.getController("App.controller.system.withdrawManage");
                if (!controller.initFlag) {
                    controller.init();
                }
                var withdraw = Ext.create("App.view.system.withdrawManage", {});
                panel.add(withdraw);
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);

    }
});