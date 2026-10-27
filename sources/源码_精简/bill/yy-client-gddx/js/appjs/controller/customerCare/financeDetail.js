Ext.define('App.controller.customerCare.financeDetail', {
    extend : 'Ext.app.Controller',
    views : [],
    models : [],
    initFlag : false,
    refs : [
        {
            ref: 'customerCareFinanceDetailQueryPanel',
            selector: 'customerCareFinanceDetailQueryPanel'
        },
        {
            ref: 'financeDetailGrid',
            selector: 'customerCareFinanceDetailQueryPanel > grid[class="query"]'
        }

    ],
    init : function() {
        this.control({
            'customerCareFinanceDetailQueryPanel': {
                afterrender: this.initAll
            },

            'customerCareFinanceDetailQueryPanel button#btn_finance_all_query':{
                click : this.queryAllGrid
            },

            'customerCareFinanceDetailQueryPanel > grid[class="query"]': {
                selectionchange: this.enableDockItems,
                itemdblclick: this.showFinanceDetail
            },
            'customerCareFinanceDetailQueryPanel button#btn_proxy_finance_detail':{
                click : this.showFinanceDetail
            },
            'customerCareFinanceDetailQueryPanel button#btn_export_finance_cust':{
                click:this.exportFinanceCust
            }

        });
        this.initFlag = true;
    },
    initAll: function (obj) {
        var panel=this.getCustomerCareFinanceDetailQueryPanel();
        App.util.AppUtil.request('bill.customerCare.queryFinanceState', {}, function (data, self) {
            if (data.success) {
                panel.data=data.stat;
                panel.down("displayfield[id='customerCare_finance_all_in']").setValue(panel.getIncome());
                panel.down("displayfield[id='customerCare_finance_all_out']").setValue(panel.getOutlay());
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },
    queryAllGrid: function (obj) {
        console.log("show ....")
        var panel=this.getCustomerCareFinanceDetailQueryPanel();
        var form = obj.up("form");
        if (form.form.isValid()) {
            var fieldSet = form.down("fieldset[class='query']");
            var param = App.util.AppUtil.getFormParam(fieldSet);

            App.util.AppUtil.request('bill.customerCare.queryFinanceState',param, function (data, self) {
                if (data.success) {
                    panel.data=data.stat;
                    panel.down("displayfield[id='customerCare_finance_all_in']").setValue(panel.getIncome());
                    panel.down("displayfield[id='customerCare_finance_all_out']").setValue(panel.getOutlay());
                    var grid = form.up("panel").down("grid[class='query']");
                    grid.store.proxy.extraParams.data = Ext.JSON.encode(param);
                    grid.store.loadPage(1);
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    showFinanceDetail: function (obj) {
        var selection = this.getFinanceDetailGrid().getSelectionModel().getSelection()[0];
        var win = Ext.create('App.view.customerCare.showFinanceDetail', {
            data: selection.raw,
            animateTarget: obj
        });
        win.setTitle(selection.get('_id') + '---->' + '收支详情');
        win.show();
    },
    enableDockItems: function (selModel, selections) {
        var grid = this.getFinanceDetailGrid();
        var toolbar = grid.child('toolbar[class="dock"]');
        var items = toolbar.items.items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].needSelect) {
                items[i].setDisabled(selections.length === 0);
            }
        }
    },


    //收支明细excel导出的方法
    exportFinanceCust : function(obj){

    }
})