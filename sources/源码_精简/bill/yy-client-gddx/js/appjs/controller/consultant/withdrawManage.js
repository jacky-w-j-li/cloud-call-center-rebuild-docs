/// add by kivi 2016-09-27 ///
Ext.define('App.controller.consultant.withdrawManage', {
    extend: 'Ext.app.Controller',
    views: [],
    models: [],
    initFlag: false,
    refs: [
        {
            ref: 'consultantWithdrawManageQueryPanel',
            selector: 'consultantWithdrawManageQueryPanel'
        },

        {
            ref: 'consultantDrawManageGrid',
            selector: 'consultantWithdrawManageQueryPanel > grid[class="query"]'
        }
    ],
    init: function () {
        this.control({
                'consultantWithdrawManageQueryPanel >  button#consultant_finish_withdraw_tool': {
                    click: this.finishWithdraw
                },
                'consultantWithdrawManageQueryPanel >  button#consultant_revert_withdraw_tool': {
                    click: this.revertWithdraw
                },
                'consultantWithdrawManageQueryPanel > grid[class="query"]': {
                    selectionchange: this.enableDockItems,
                    itemdblclick: this.queryWithdraw
                },
                'consultantWithdrawManageQueryPanel >  button#consultant_query_withdraw_tool': {
                    click: this.queryWithdraw
                }

            }
        );
        this.initFlag = true;
    },
    enableDockItems: function (selModel, selections) {
        var grid = this.getConsultantDrawManageGrid();
        var toolbar = grid.child('toolbar[class="dock"]');
        var items = toolbar.items.items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].needSelect) {
                if((i==0 || i==2) && selections.length>0){
                    var status=selections[0].get("status");
                    if(status=='finish'||status=='revert'){
                        items[i].setDisabled(true);
                    }else{
                        items[i].setDisabled(selections.length === 0);
                    }
                }else{
                    items[i].setDisabled(selections.length === 0);
                }
            }
        }
    },
    finishWithdraw: function (obj) {
        var selection = this.getConsultantDrawManageGrid().getSelectionModel().getSelection()[0];
        var status=selection.get("status");
        if(status=='finish'){
            App.util.AppUtil.msg("该请求已经完成！");
            return;
        }
        if(!confirm('确认完成支付请求吗?'))return;

        var data={_id:selection.get("_id")};
        App.util.AppUtil.request('bill.systemUser.finishWithDraw', data, function (data, self) {
            if (data.success) {
                App.util.AppUtil.msg("已打款");
                self.getConsultantDrawManageGrid().store.load();
            } else {
                App.util.AppUtil.msg(data.message);
                self.getConsultantDrawManageGrid().store.load();
            }
        }, this);
    },
    queryWithdraw: function (obj) {
        var selection = this.getConsultantDrawManageGrid().getSelectionModel().getSelection()[0];
        var param={_id:selection.get("_id")};
        App.util.AppUtil.request('bill.systemUser.queryWithDrawInfo', param, function (data, self) {
            if (data.success) {
                var win = Ext.create('App.view.system.systemUser.findWithdraw', {
                    payee: data.payee,
                    withdraw:data.withdraw,
                    animateTarget: obj
                });
                win.setTitle(selection.get('_id') + '---->' + '查询');
                win.show();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },
    revertWithdraw: function (obj) {
        var selection = this.getConsultantDrawManageGrid().getSelectionModel().getSelection()[0];
        var status=selection.get("status");
        if(status=='finish'||status=='revert'){
            App.util.AppUtil.msg("该请求已经完成！");
            return;
        }
        if(!confirm('确认撤消此提现请求吗?'))return;

        var data={_id:selection.get("_id")};
        App.util.AppUtil.request('bill.systemUser.revertWithDraw', data, function (data, self) {
            if (data.success) {
                App.util.AppUtil.msg("撤消成功");
                self.getConsultantDrawManageGrid().store.load();
            } else {
                App.util.AppUtil.msg(data.message);
                self.getConsultantDrawManageGrid().store.load();
            }
        }, this);
    }

});