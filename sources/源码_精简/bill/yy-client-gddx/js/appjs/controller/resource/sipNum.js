Ext.define('App.controller.resource.sipNum', {
    extend: 'Ext.app.Controller',
    requires: [],
    views: [],
    refs: [
        {
            ref: 'queryGrid',
            selector: 'sipNumQueryPanel > grid[class="query"]'
        }
    ],
    initFlag: false,
    init: function () {
        this.control({
            'sipNumQueryPanel >  button#update_sip_tool': {
                click: this.showUpdateSipNum
            },
            'updateSipWindow >  button[class="submit"]':{
                click: this.updateSipNum
            },
            'sipNumQueryPanel > grid[class="query"]': {
                selectionchange: this.enableDockItems,
                itemdblclick: this.showUpdateSipNum
            }
        });
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
    updateSipNum : function(obj){
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);

            if(data.isFax.isFax==true && data.codeConfig.code !="alaw"){
                App.util.AppUtil.msg("为传真机时，只能选择 alaw 编码！");
                return;
            }else{
                data.isFax=data.isFax.isFax;
                App.util.AppUtil.request('bill.resource.updateSipNum', data, function (data, self) {
                    if (data.success) {
                        App.util.AppUtil.msg("更新sip号成功！");
                        win.close();
                        self.getQueryGrid().store.load();
                    } else {
                        App.util.AppUtil.msg(data.message);
                    }
                }, this);
            }
        }
    },
    showUpdateSipNum: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        App.util.AppUtil.request('bill.resource.getSipNumInfo', {_id: id}, function (data, self) {
            if (data.success) {
                var win = Ext.create('App.view.resource.sipNum.update', {
                    data: data.data,
                    animateTarget: obj
                });
                win.setTitle("sip号修改");
                win.show();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    }

});