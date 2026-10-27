Ext.define('App.controller.proxy.batchPayAndSetMin', {
    extend : 'Ext.app.Controller',
    views : [],
    models : [],
    initFlag : false,
    init : function() {
        this.control({
            'batchPayAndSetMinPanel  button#batch_pay_query_btn':{
                click: this.queryAccs
            },
            'batchPayAndSetMinPanel  button#batch_pay_button':{
                click: this.batchPay
            },
            'batchPayAndSetMinPanel  button#batch_pay_reset_button':{
                click: this.batchReset
            },
            'batchPayAndSetMinPanel  button#show_edit_money_tool':{
                click: this.showEditMoney
            },
            'batchEditMoneyWindow  button#btn_batch_edit_money':{
                click: this.editMoney
            },

            'batchSetMinPanel  button#show_edit_min_tool':{
                click: this.showEditMin
            },
            'batchEditMinWindow  button#btn_batch_edit_min':{
                click: this.editMinMoney
            },
            'batchPayAndSetMinPanel >  panel#batch_set_minConsume_panel': {
                beforeactivate: this.showBatchSetMinView
            },
            'batchSetMinPanel  button#batch_set_query_btn':{
                click: this.queryAccsSet
            },
            'batchSetMinPanel  button#batch_set_minConsume_button':{
                click: this.batchSetMin
            },
            'batchSetMinPanel  button#batch_set_minConsume_reset_button':{
                click: this.batchReset
            }
        });
        this.initFlag = true;
    },
    refs : [
        {
            ref: 'batchPayAndSetMinPanel',
            selector: 'batchPayAndSetMinPanel'
        },
        {
            ref: 'batchSetMinPanel',
            selector: 'batchSetMinPanel'
        },
        {
            ref:"batchEditMoneyWindow",
            selector:'batchEditMoneyWindow'
        },
        {
            ref:"batchEditMinWindow",
            selector:'batchEditMinWindow'
        }

    ],
    showEditMin : function(obj){
        var win = Ext.create('App.view.proxy.batchEditMinsume', {
            animateTarget: obj
        });
        win.show();
    },
    editMinMoney: function(obj){
        var money = Ext.getCmp("batch_edit_min_text").getValue();
        var grid = Ext.getCmp("batch_set_grid");
        var rows = grid.getSelectionModel().getSelection();

        var store = grid.store;
        var items = store.data.items;
        for(var i=0;i<items.length;i++){
            for(var y=0;y<rows.length;y++){
                if(rows[y].data.account == items[i].data.account){
                    items[i].data.minConsume = money;
                }
            }
        }
        grid.store.loadData(items);
        var win = obj.up("window");
        win.close();
    },
    showEditMoney : function(obj){
        var win = Ext.create('App.view.proxy.batchEditMoney', {
            animateTarget: obj
        });
        win.show();
    },
    editMoney: function(obj){
        var money = Ext.getCmp("batch_edit_money_text").getValue();
        var grid = Ext.getCmp("batch_pay_grid");
        var rows = grid.getSelectionModel().getSelection();

        var store = grid.store;
        var items = store.data.items;
        for(var i=0;i<items.length;i++){
            for(var y=0;y<rows.length;y++){
                if(rows[y].data.account == items[i].data.account){
                    items[i].data.money = money;
                }
            }
        }
        grid.store.loadData(items);
        var win = obj.up("window");
        win.close();
    },
    showBatchSetMinView : function(obj){
        if(obj.items.length==0){
            var panel = Ext.create('App.view.proxy.batchSetMin', {
                animateTarget: obj
            });
            obj.add(panel);
        }
    },
    queryAccsSet:function(obj){
        var form = obj.up('panel');
        var grid=form.up('panel').down('gridpanel');
        if (form.form.isValid()) {
            var feeSet = form.down('#batch_set_query_fieldset');
            var feeSetData = App.util.AppUtil.getFormParam(feeSet);
            var info = {
                product: 'cc',
                beginNum: feeSetData.beginNum,
                endNum: feeSetData.endNum,
                beginCost: parseFloat(feeSetData.beginCost),
                endCost: parseFloat(feeSetData.endCost)
            };
            grid.store.proxy.extraParams.data = Ext.JSON.encode(info);
            grid.store.load();
        }
    },
    queryAccs:function(obj){
        var form = obj.up('panel');
        var grid=form.up('panel').down('gridpanel');
        if (form.form.isValid()) {
            var feeSet = form.down('#batch_pay_query_fieldset');
            var feeSetData = App.util.AppUtil.getFormParam(feeSet);
            var info = {
                product: 'cc',
                beginNum: feeSetData.beginNum,
                endNum: feeSetData.endNum,
                beginCost: parseFloat(feeSetData.beginCost),
                endCost: parseFloat(feeSetData.endCost)
            };
            grid.store.proxy.extraParams.data = Ext.JSON.encode(info);
            grid.store.load();
        }
    },
    batchPay : function(obj){
        var me=this;
        //var panel = obj.up('panel');
        var grid=obj.up('gridpanel');
        var rows = grid.getSelectionModel().getSelection();
        if(!rows.length > 0){
            App.util.AppUtil.msg("请选择需要充值的账户！");
            return;
        }else{
            var count = 0;//对充值金额为0的账户进行计数
            var payData = [];
            var payFee = 0.0;
            for(var i =0;i<rows.length;i++){
                var row = rows[i].data;
                var money=parseFloat(row.money);
                if(money>0) {
                    payFee += money;
                    var rowData = {
                        account: row.account,
                        companyName: row.companyName,
                        money: money
                    };
                    payData.push(rowData);
                }else{
                    count++;
                }
            }
            payFee = App.util.AppUtil.formatRoundMoney(payFee);
            if(count == row.length || payFee ==0){
                App.util.AppUtil.msg("充值失败：充值金额不能全部为0！");
                return;
            }
            var data={
                //payType:payType,
                payFee:payFee,
                payData:payData,
                product:"cc"
            };
            if(count>0){
                if(!confirm("您选择了"+rows.length+"个账户，其中"+count+"个账户充值金额为0，总费用为"+payFee+"元，确认要充值吗？")){
                    return;
                }else{
                    App.util.AppUtil.request('bill.proxy.batchPay', data, function (data, self) {
                        if (data.success) {
                            me.syncBalance();
                            grid.store.load();
                            App.util.AppUtil.msg("批量充值成功！");
                        } else {
                            App.util.AppUtil.msg(data.message);
                        }
                    }, this);
                }
            }else{
                if(!confirm("您选择了"+rows.length+"个账户，总费用为"+payFee+"元，确认要充值吗？")){
                    return;
                }else{
                    App.util.AppUtil.request('bill.proxy.batchPay', data, function (data, self) {
                        if (data.success) {
                            me.syncBalance();
                            grid.store.load();
                            App.util.AppUtil.msg("批量充值成功！");
                        } else {
                            App.util.AppUtil.msg(data.message);
                        }
                    }, this);
                }
            }
        }
    },
    syncBalance: function () {
        var win = Ext.getCmp("main_head_panel");
        var pane = win.down("#user_balance_head");
        App.util.AppUtil.request('bill.account.getSystemInfoById', null, function (data, self) {
            if (data.success) {
                gloab_client_user.balance = data.user.balance;
                var balance = App.util.AppUtil.formatTrueFee(gloab_client_user.balance);
                pane.update('余额：[' + '<span style="color:blue;">' + balance + '</span>' + ']元')
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },
    batchReset:function(obj){
        //var grid = obj.up("gridpanel");
        var grid = obj.up('gridpanel');
        //var grid=panel.down('gridpanel');
        grid.store.load();
    },
    batchSetMin:function(obj){
        //var grid = obj.up("gridpanel");
        //var panel = obj.up('panel');
        var grid=Ext.getCmp("batch_set_grid");
        var columns=grid.getSelectionModel().getSelection();
        if(!columns.length > 0){
            App.util.AppUtil.msg("请选择需要设置低消的账户！");
            return;
        }
        var data=[];
        for(var i=0;i<columns.length;i++){
            var column=columns[i].data;
            var minConsume=parseFloat(column.minConsume);
            var setData={
                account:column.account,
                minConsume:minConsume
            };
            data.push(setData);
        }
        if(!confirm("您确认要为这"+data.length+"个账户设置低消吗？")){
            return;
        }else {
            App.util.AppUtil.request('bill.proxy.batchSetMinConsume', data, function (data2, self) {
                if (data2.success) {
                    grid.store.load();
                    Ext.getCmp("batch_pay_grid").store.load();//重置批量充值的数据源
                    App.util.AppUtil.msg("批量设置低消成功！");
                } else {
                    App.util.AppUtil.msg(data2.message);
                }
            }, this);
        }
    }

})