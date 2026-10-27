Ext.define('App.controller.account.user', {
    extend: 'Ext.app.Controller',
    views: [],
    models: [],
    initFlag: false,
    refs: [
        {
            ref: 'queryGrid',
            selector: 'accountUserQueryPanel > grid[class="query"]'
        }

    ],
    init: function () {
        this.control(
            {
                'accountUserQueryPanel > grid[class="query"]': {
                    selectionchange: this.enableDockItems,
                    itemdblclick: this.showUserFind
                },
                'accountUserQueryPanel >  button#account_user_query_tool': {
                    click: this.showUserFind
                },
                'accountUserQueryPanel >  button#account_user_update_tool': {
                    click: this.showUserUpdate
                },
                'updateUserInfoWindow >  button#update_user_button': {
                    click: this.updateUserInfo
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
        var userId = selection.get("_id");
        App.util.AppUtil.request('bill.user.getUserInfo', {_id: userId}, function (data, self) {
            if (data.success) {
                var win = Ext.create('App.view.account.user.findUser', {
                    data: data.data,
                    animateTarget: obj
                });
                win.setTitle(selection.get('displayName') + '---->' + '查询');
                win.show();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },
    showUserUpdate: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var userId = selection.get("_id");
        App.util.AppUtil.request('bill.user.getUserInfo', {_id: userId}, function (data) {
            if (data.success) {
                var win = Ext.create('App.view.account.user.updateUserInfo', {
                    data: data.data.user,
                    animateTarget: obj
                });
                win.setTitle(selection.get('displayName') + '---->' + '修改');
                win.show();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },
    updateUserInfo : function(obj){
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.user.updateUserInfo', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("修改用户信息成功！");
                    win.close();
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    }

})