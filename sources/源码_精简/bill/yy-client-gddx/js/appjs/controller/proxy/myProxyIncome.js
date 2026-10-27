Ext.define('App.controller.proxy.myProxyIncome', {
    extend: 'Ext.app.Controller',
    views: [],
    models: [],
    initFlag: false,
    refs: [
        {
            ref: 'myProxyIncomeQueryPanel',
            selector: 'myProxyIncomeQueryPanel'
        },
        {
            ref: 'queryGrid',
            selector: 'myProxyIncomeQueryPanel > grid[class="query"]'
        }

    ],
    init: function () {
        this.control({
                'myProxyIncomeQueryPanel > grid[class="query"]': {
                    selectionchange: this.enableDockItems,
                    itemdblclick: this.showUserFind
                },
                'myProxyIncomeQueryPanel >  button#findSystemUser_tool': {
                    click: this.showUserFind
                },
                'myProxyIncomeQueryPanel >  button#proxy_myProxyIncome_query': {
                   // click:
                }
            }
        );
        this.initFlag = true;
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
    showUserFind: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var uid = selection.get("_id");
        App.util.AppUtil.request('bill.proxy.getSysUserInfo', {_id: uid}, function (data, self) {
            if (data.success) {
                var win = Ext.create('App.view.proxy.findSystemUser', {
                    data: data.data,
                    animateTarget: obj
                });
                win.setTitle(selection.get('name') + '---->' + '用户查询');
                win.show();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    }

});
