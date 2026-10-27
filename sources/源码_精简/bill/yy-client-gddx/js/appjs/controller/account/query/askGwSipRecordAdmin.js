Ext.define('App.controller.account.query.askGwSipRecordAdmin', {
    extend : 'Ext.app.Controller',
    views : [],
    models : [],
    initFlag : false,
    refs : [
        {
            ref: 'askGwSipRecordAdminPanel',
            selector: 'askGwSipRecordAdminPanel'
        },

        {
            ref: 'askGwSipGrid',
            selector: 'askGwSipRecordAdminPanel > grid[class="query"]'
        }
    ],
    init: function () {
        this.control({
                'askGwSipRecordAdminPanel button#finish_asksip_tool': {
                    click: this.finishAsk
                },
                'askGwSipRecordAdminPanel > grid[class="query"]': {
                    selectionchange: this.enableDockItems
                }
            }
        );
        this.initFlag = true;
    },
    enableDockItems: function (selModel, selections) {
        var grid = this.getAskGwSipGrid();
        var toolbar = grid.child('toolbar[class="dock"]');
        var items = toolbar.items.items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].needSelect) {
                if(i==0 && selections.length>0 && selections[0].get("status")=='finish'){
                    items[i].setDisabled(true);
                }else{
                    items[i].setDisabled(selections.length === 0);
                }
            }
        }
    },
    finishAsk: function (obj) {
        var selection = this.getAskGwSipGrid().getSelectionModel().getSelection()[0];
        var status=selection.get("status");
        if(status=='finish'){
            App.util.AppUtil.msg("该申请已经完成！");
            return;
        }
        if(!confirm('确认完成该申请吗?'))return;

        var data={_id:selection.get("_id")};
        App.util.AppUtil.request('bill.systemUser.finishAskGwSip', data, function (data, self) {
            if (data.success) {
                App.util.AppUtil.msg("申请请求已经完成");
                self.getAskGwSipGrid().store.load();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    }

})