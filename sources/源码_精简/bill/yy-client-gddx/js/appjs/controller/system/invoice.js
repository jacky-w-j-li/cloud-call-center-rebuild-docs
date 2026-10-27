Ext.define('App.controller.system.invoice', {
    extend: 'Ext.app.Controller',
    views: [],
    models: [],
    initFlag: false,
    refs: [
        {
            ref: 'invoiceQueryPanel',
            selector: 'invoiceQueryPanel'
        },
        {
            ref: 'invoiceGrid',
            selector: 'invoiceQueryPanel > grid[class="query"]'
        },
        {
            ref: 'invoiceDealWin',
            selector: 'invoiceDealWin'
        },
        {
            ref: 'invoiceUpdateWin',
            selector: 'invoiceUpdateWin'
        },
        {
            ref: 'invoiceProfessionalWin',
            selector: 'invoiceProfessionalWin'
        }
    ],
    init: function () {
        this.control({
                'invoiceQueryPanel >  button#finish_invoice_tool': {
                    click: this.showDealInvoice
                },
                'invoiceQueryPanel > grid[class="query"]': {
                    selectionchange: this.enableDockItems,
                    itemdblclick: this.viewInvoice
                },
                'invoiceQueryPanel >  button#query_invoice_detail': {
                    click: this.viewInvoice
                },
                'invoiceDealWin >  button#btn_deal_invoice': {
                    click: this.dealInvoice
                },
                'invoiceQueryPanel >  button#update_invoice_detail': {
                    click: this.showUpdateInvoice
                },
                'invoiceUpdateWin >  button#btn_update_invoice': {
                    click: this.updateInvoice
                },
                'invoiceQueryPanel >  button#query_invoice_professional_detail': {
                    click: this.showProfessinalInvoice
                }

            }
        );
        this.initFlag = true;
    },
    enableDockItems: function (selModel, selections) {
        var grid = this.getInvoiceGrid();
        var toolbar = grid.child('toolbar[class="dock"]');
        var items = toolbar.items.items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].needSelect) {
                if((i==0) && selections.length>0) {
                    var status = selections[0].get("status");
                    if (status == 'deal' || status == 'cancel') {
                        items[i].setDisabled(true);
                    } else {
                        items[i].setDisabled(selections.length === 0);
                    }
                }else if((i==1) && selections.length>0){
                    var status = selections[0].get("status");
                    if (status == 'deal') {
                        items[i].setDisabled(false);
                    } else {
                        items[i].setDisabled(true);
                    }
                }else if((i==3) && selections.length>0){
                    var info=selections[0].get("info")||{};
                    var invoiceType =info.invoiceType;
                    if (invoiceType == 'professional') {
                        items[i].setDisabled(false);
                    } else {
                        items[i].setDisabled(true);
                    }
                }else{
                    items[i].setDisabled(selections.length === 0);
                }
            }
        }
    },
    viewInvoice: function (obj) {
        var selection = this.getInvoiceGrid().getSelectionModel().getSelection()[0];
        var param={_id:selection.get("_id")};
        App.util.AppUtil.request('app.invoice.getInvoiceById', param, function (data, self) {
            if (data.success) {
                var win = Ext.create('App.view.system.invoice.invoiceDetail', {
                    data: data.row,
                    animateTarget: obj
                });
                win.setTitle('发票明细');
                win.show();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },

    showDealInvoice: function (obj) {
        var selection = this.getInvoiceGrid().getSelectionModel().getSelection()[0];
        var status=selection.get("status");
        if(status=='deal'||status=='cancel'){
            App.util.AppUtil.msg("该申请已经完成！");
            return;
        }
        var param={_id:selection.get("_id")};
        App.util.AppUtil.request('app.invoice.getInvoiceById', param, function (data, self) {
            if (data.success) {
                var win = Ext.create('App.view.system.invoice.invoiceDeal', {
                    data: data.row,
                    animateTarget: obj
                });
                win.setTitle('开具发票');
                win.show();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);

    },

    dealInvoice: function (obj) {
        var form = obj.up("form");
        if (form.form.isValid()) {
            var data = App.util.AppUtil.getFormParam(form.down("fieldset#invoice_set_fieldset"));
            data.status=data.status.status;
            App.util.AppUtil.request('app.invoice.dealInvoice',data,function(data,self){
                if(data.success){
                    App.util.AppUtil.msg("提交成功！");
                    var win = self.getInvoiceDealWin();
                    win.close();
                    self.getInvoiceGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            },this);
        }
    },
    showUpdateInvoice: function (obj) {
        var selection = this.getInvoiceGrid().getSelectionModel().getSelection()[0];
        var status=selection.get("status");
        if(status!='deal'){
            App.util.AppUtil.msg("该发票不能修改！");
            return;
        }
        var param={_id:selection.get("_id")};
        App.util.AppUtil.request('app.invoice.getInvoiceById', param, function (data, self) {
            if (data.success) {
                var win = Ext.create('App.view.system.invoice.invoiceUpdate', {
                    data: data.row,
                    animateTarget: obj
                });
                win.setTitle('修改发票');
                win.show();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);

    },
    updateInvoice:function(obj){
        var form = obj.up("form");
        if (form.form.isValid()) {
            var data = App.util.AppUtil.getFormParam(form.down("fieldset#invoice_update_info_fieldset"));
            App.util.AppUtil.request('app.invoice.updateInvoice',data,function(data,self){
                if(data.success){
                    App.util.AppUtil.msg("提交成功！");
                    var win = self.getInvoiceUpdateWin();
                    win.close();
                    self.getInvoiceGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            },this);
        }
    },
    showProfessinalInvoice: function (obj) {
        var selection = this.getInvoiceGrid().getSelectionModel().getSelection()[0];
        var  info=selection.get("info");
        var invoiceType=info.invoiceType;
        if(invoiceType!='professional'){
            App.util.AppUtil.msg("请选择专票！");
            return;
        }
        var param={_id:info._id};
        App.util.AppUtil.request('app.invoice.getInfoById', param, function (data, self) {
            if (data.success) {
                var win = Ext.create('App.view.system.invoice.invoiceProfessional', {
                    data: data.row,
                    animateTarget: obj
                });
                win.setTitle('查看专票');
                win.show();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);

    }


});