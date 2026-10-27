Ext.define('App.controller.account.query.costRecord', {
    extend : 'Ext.app.Controller',
    views : [],
    models : [],
    initFlag : false,
    refs : [
        {
            ref: 'costRecordQueryPanel',
            selector: 'costRecordQueryPanel'
        },
        {
            ref: 'costRecordGrid',
            selector: 'costRecordQueryPanel panel#proxy_cost_panel grid[class="query"]'
        },
        {
            ref: 'costRecord2CustPanel',
            selector: 'costRecord2CustPanel'
        },
        {
            ref: 'costRecord2CustGrid',
            selector: 'costRecord2CustPanel grid[class="query"]'
        }
    ],
    init : function() {
        this.control({
            'costRecordQueryPanel button#cost_find_tool':{
                click : this.showCostInfo
            },
            'costRecordQueryPanel panel#proxy_cost_panel grid[class="query"]': {
                selectionchange: this.enableDockItems,
                itemdblclick: this.showCostInfo
            },
            'costRecordQueryPanel >  panel#customer_cost_panel': {
                beforeactivate: this.showCustView
            },
            'costRecord2CustPanel button#customer_cost_find_tool':{
                click : this.showCostInfo2Cust
            },
            'costRecord2CustPanel grid[class="query"]': {
                selectionchange: this.enableDockItems2Cust,
                itemdblclick: this.showCostInfo2Cust
            }
        });
        this.initFlag = true;
    },
    showCostInfo: function (obj) {
        var selection = this.getCostRecordGrid().getSelectionModel().getSelection()[0];
        var win = Ext.create('App.view.account.query.findCostRecord', {
            data: selection.raw,
            animateTarget: obj
        });
        win.setTitle(selection.get('_id') + '---->' + '代理消费明细查询');
        win.show();
    },
    enableDockItems: function (selModel, selections) {
        var grid = this.getCostRecordGrid();
        var toolbar = grid.child('toolbar[class="dock"]');
        var items = toolbar.items.items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].needSelect) {
                items[i].setDisabled(selections.length === 0);
            }
        }
    },
    showCostInfo2Cust: function (obj) {
        var selection = this.getCostRecord2CustGrid().getSelectionModel().getSelection()[0];
        var win = Ext.create('App.view.account.query.findCostRecord2Cust', {
            data: selection.raw,
            animateTarget: obj
        });
        win.setTitle(selection.get('_id') + '---->' + '客户消费明细查询');
        win.show();
    },
    enableDockItems2Cust: function (selModel, selections) {
        var grid = this.getCostRecord2CustGrid();
        var toolbar = grid.child('toolbar[class="dock"]');
        var items = toolbar.items.items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].needSelect) {
                items[i].setDisabled(selections.length === 0);
            }
        }
    },
    showCustView : function(obj){
        if(obj.items.length==0){
            var panel = Ext.create('App.view.account.query.costRecord2Cust', {
                animateTarget: obj
            });
            obj.add(panel);
        }
    }

})