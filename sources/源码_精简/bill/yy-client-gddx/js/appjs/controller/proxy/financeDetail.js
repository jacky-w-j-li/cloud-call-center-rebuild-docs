Ext.define('App.controller.proxy.financeDetail', {
    extend : 'Ext.app.Controller',
    views : [],
    models : [],
    initFlag : false,
    refs : [
        {
            ref: 'financeDetailQueryPanel',
            selector: 'financeDetailQueryPanel'
        },
        {
            ref: 'financeDetailGrid',
            selector: 'financeDetailQueryPanel > grid[class="query"]'
        }

    ],
    init : function() {
        this.control({
            'financeDetailQueryPanel': {
                afterrender: this.initAll
            },

            'financeDetailQueryPanel button#btn_finance_all_query':{
                click : this.queryAllGrid
            },

            'financeDetailQueryPanel > grid[class="query"]': {
                selectionchange: this.enableDockItems,
                itemdblclick: this.showFinanceDetail
            },
            'financeDetailQueryPanel button#btn_proxy_finance_detail':{
                click : this.showFinanceDetail
            },
            'financeDetailQueryPanel button#btn_export_finance_cust':{
                click:this.exportFinanceCust
            }

        });
        this.initFlag = true;
    },
    initAll: function (obj) {
        var panel=this.getFinanceDetailQueryPanel();
        App.util.AppUtil.request('bill.proxy.queryFinanceStat', {}, function (data, self) {
            if (data.success) {
                panel.data=data.stat;
//                console.dir(panel.data);
                panel.down("displayfield[id='finance_all_in']").setValue(panel.getIncome());
                panel.down("displayfield[id='finance_all_out']").setValue(panel.getOutlay());
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },
    queryAllGrid: function (obj) {
        var panel=this.getFinanceDetailQueryPanel();
        var form = obj.up("form");
        if (form.form.isValid()) {
            var fieldSet = form.down("fieldset[class='query']");
            var param = App.util.AppUtil.getFormParam(fieldSet);
//            console.dir(param);
            App.util.AppUtil.request('bill.proxy.queryFinanceStat',param, function (data, self) {
                if (data.success) {
//                    console.dir(data)
                    panel.data=data.stat;
                    panel.down("displayfield[id='finance_all_in']").setValue(panel.getIncome());
                    panel.down("displayfield[id='finance_all_out']").setValue(panel.getOutlay());

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
        var win = Ext.create('App.view.proxy.showFinanceDetail', {
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
        var form = obj.up("form");
        if (form.form.isValid()) {
            var fieldSet = form.down("fieldset[class='query']");
            var data = App.util.AppUtil.getFormParam(fieldSet);
            data.Method="exportFinancedetail";
          // console.dir(data);
            App.util.AppUtil.request('bill.export.exportBillXls', data, function (rep, self) {
                if (rep.Succeed) {
                    self.downloadFile(rep.path);
//                    App.util.AppUtil.msg("导出成功！");
                } else {
                    App.util.AppUtil.msg(rep.message);
                }
            }, this);
        }
    },
    downloadFile: function (fileUrl) {
//        var url = fileUrl + "&sessionId=" + session.id;
        var url = fileUrl;
        var container = {
            id: 'downloadFile_Frame',
            tag: 'iframe',
            style: 'display:none'
        };
        var frame=Ext.getDom("downloadFile_Frame");
//        console.info(url);
        if(!frame){
            Ext.DomHelper.append(Ext.getBody(),container);
            frame=Ext.getDom("downloadFile_Frame");
        }

//        console.dir(frame);
        frame.src=url;
    }
})