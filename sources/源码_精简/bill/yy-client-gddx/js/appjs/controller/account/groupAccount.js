Ext.define('App.controller.account.groupAccount', {
    extend: 'Ext.app.Controller',
    views: [],
    models: [],
    initFlag: false,
    refs: [
        {
            ref: 'groupAccountSetPanel',
            selector: 'groupAccountSetPanel > grid[class="query"]'
        },
        {
            ref: 'addGroupAccountWindow',
            selector: 'addGroupAccountWindow'
        },
        {
            ref: 'queryGrid',
            selector: 'groupAccountSetPanel > grid[class="query"]'
        },
        {
            ref: 'updateGroupAccountWindow',
            selector: 'updateGroupAccountWindow'
        },

    ],
    init: function () {
        this.control(
            {
                'groupAccountSetPanel >  button#add_group_account_tool': {
                    click: this.showAdd
                },
                'addGroupAccountWindow >  button#commit_button': {
                    click: this.add
                },
                'groupAccountSetPanel > grid[class="query"]': {
                    selectionchange: this.enableDockItems,
                    itemdblclick: this.showDetail
                },
                'groupAccountSetPanel >  button#btn_groupAccount_show_detail': {
                    click: this.showDetail
                },
                'groupAccountSetPanel >  button#update_group_account_tool': {
                    click: this.showUpdate
                },
                'updateGroupAccountWindow >  button#commit_button': {
                    click: this.update
                },
                'groupAccountSetPanel >  button#delete_group_account_tool': {
                    click: this.showDelete
                }
            }
        );
        this.initFlag = true;
    },
    getFCData :function(fc,data,list){
        fc.eachKey(function (key) {
            var field = fc.get(key);
            if (!field.isXType('label') && !field.isXType('button')) {
                if (field.isXType('textarea')) {
                    var value = field.getValue();
                    data.memo = value;
                }else if(field.isXType('textfield')){
                    var value = field.getValue();
                    data._id = value;
                } else if(field.isXType('fieldcontainer')){
                    var textItem = field.down('textfield');
                    var value = textItem.getValue();
                    if (value === 'undefined' || value === null) {
                        value = '';
                    }
                    if (value || value === 0) {
                        //防止重复输入
                        var result = true;
                        for(var index=0;index<list.length;index++){
                            var account = list[index];
                            if(account == value){
                                result = false;
                                break;
                            }
                        }
                        if(result){
                            list.push(value);
                        }
                    }
                }
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
    showAdd: function (obj) {
        var win = Ext.create('App.view.account.groupAccount.add', {
            animateTarget: obj
        });
        win.show();
    },
    add:function(obj){
        var win = obj.up("window");
        var form = win.down('form');
        var page = this;
        if(form.form.isValid()){
            var queryItems = form.items;
            if(queryItems.length < 2){
                page.getAddGroupAccountWindow().close();
                App.util.AppUtil.msg("添加失败：请至少填写一个账户！");
                return;
            }
            var accountList = new Array();
            var data = {};
            this.getFCData(queryItems,data,accountList);
            data.accountList = accountList;
            App.util.AppUtil.request('bill.account.addGroupAccount',data,function(data,self){
                if(data.success){
                    self.getAddGroupAccountWindow().close();
                    App.util.AppUtil.msg("添加集团账户关系成功");
                    var queryGrid =page.getQueryGrid();
                    queryGrid.store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            },this);
        }
    },
    showDetail:function(obj){
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var win = Ext.create('App.view.account.groupAccount.detail', {
            data: selection.data,
            animateTarget: obj
        });
        win.show();
    },
    showUpdate:function(obj){
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var win = Ext.create('App.view.account.groupAccount.update', {
            data: selection.data,
            animateTarget: obj
        });
        win.show();
    },
    update:function(obj){
        var win = obj.up("window");
        var form = win.down('form');
        var page = this;
        if(form.form.isValid()){
            var queryItems = form.items;
            if(queryItems.length < 3){
                page.getUpdateGroupAccountWindow().close();
                App.util.AppUtil.msg("更新失败：请至少填写一个账户！");
                return;
            }
            var accountList = new Array()
            var data = {};
            this.getFCData(queryItems,data,accountList);
            data.accountList = accountList;

            App.util.AppUtil.request('bill.account.updateGroupAccount',data,function(data,self){
                if(data.success){
                    self.getUpdateGroupAccountWindow().close();
                    App.util.AppUtil.msg("更新集团账户关系成功");
                    var queryGrid =page.getQueryGrid();
                    queryGrid.store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            },this);
        }
    },
    showDelete:function(obj){
        if(!confirm("您确定要删除该账户吗？")){
            return;
        }else{
            var page = this;
            var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
            var id = selection.data._id;
            var data = {
                _id:id
            };
            App.util.AppUtil.request('bill.account.deleteGroupAccount', data, function (data, self) {
                if (data.success) {
                    var queryGrid =page.getQueryGrid();
                    queryGrid.store.load();
                    App.util.AppUtil.msg("删除集团账户成功！");
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    }

})