Ext.define('App.view.system.invoice.invoiceDeal', {
    extend: 'Ext.window.Window',
    requires: [],
    alias: 'widget.invoiceDealWin',
    height: 450,
    width: 800,
    title: '发票处理',
    layout: 'fit',
    data: null,
    initComponent: function () {
        Ext.QuickTips.init();
        var me = this;
        Ext.applyIf(me, {
            modal: true,
            items: [
                {
                    xtype: 'tabpanel',
                    activeTab: 0,
                    deferredRender: false,
                    items: [
                        {
                            xtype: 'panel',
                            title: '开具发票',
                            frame: true,
                            items: this.getBaseInfo()
                        }
                    ]
                }
            ]
        });
        me.callParent(arguments);
    },
    getBaseInfo: function () {
        var items = new Array();
        var baseInfo = {
            xtype: 'fieldset',
            collapsible: true,
            title: '开票信息',
            cls: 'backgroud_blue',
            defaults: {
                msgTarget: 'side',
                labelWidth: 80,
                labelAlign: 'right',
                fieldCls: 'field_disable_cls',
                readOnly: true
            },
            defaultType: 'textfield',
            layout: {
                type: 'column'
            },
            items: [
                {
                    fieldLabel: '发票金额(元)',
                    value: this.data.money,
                    columnWidth: .5
                },
                {
                    fieldLabel: '发票抬头',
                    value: this.data.info.invoiceTitle,
                    columnWidth: .5
                },
                {
                    fieldLabel: '发票状态',
                    value: App.util.AppUtil.getRendererValue(this.data.status, 'invoiceStatus'),
                    columnWidth: .5
                },
                {
                    fieldLabel: '发票类型',
                    value: App.util.AppUtil.getRendererValue(this.data.info.invoiceType, 'invoiceType'),
                    columnWidth: .5
                },
                {
                    fieldLabel: '发票内容',
                    value: this.data.info.content,
                    columnWidth: .5
                },
                {
                    fieldLabel: '申请时间',
                    value: this.data.createTime,
                    columnWidth: .5
                },
                {
                    fieldLabel: '收件人',
                    value: this.data.addr.userName,
                    columnWidth: .5
                },
                {
                    fieldLabel: '收取地址',
                    value: this.data.addr.addr,
                    columnWidth: .5
                },
                {
                    fieldLabel: '邮编',
                    value: this.data.addr.post,
                    columnWidth: .5
                },
                {
                    fieldLabel: '联系电话',
                    value: this.data.addr.phone,
                    columnWidth: .5
                },
                {
                    fieldLabel: '备注',
                    value: this.data.memo,
                    columnWidth: 1
                }
            ]

        }
        items.push(baseInfo);

        var dealField = {
            xtype: 'fieldset',
            title: '处理发票',
            id : 'invoice_set_fieldset',
            collapsible: true,
            layout: 'column',
            cls: 'backgroud_blue',
            defaultType: 'textfield',
            items :[
                {
                    name: '_id',
                    value: this.data._id,
                    hidden: true
                },
                {
                    fieldLabel: '状态',
                    name: 'status',
                    xtype: 'radiogroup',
                    //labelWidth: 150,
                    //labelAlign: 'right',
                    items: this.getRadiaoItems(this.data),
                    columnWidth: 0.8,
                    allowBlank: false,
                    listeners: {
                        change: this.statusChange
                    }
                },
                {
                    xtype: 'panel',
                    layout: "column",
                    border: false,
                    bodyCls: 'backgroud_blue',
                    id: 'invoice_deal_info_panel',
                    columnWidth: 1,
                    items: this.getDealItem()
                }
            ]
        };
        items.push(dealField);

        var buttons = {
            xtype: 'fieldset',
            layout: {
                type: 'hbox',
                pack: 'center',
                align: 'middle'
            },
            cls: 'no_border',
            items: [
                {
                    xtype: 'button',
                    width: 90,
                    id: 'btn_deal_invoice',
                    text: '保存'
                }
            ]
        };
        items.push(buttons);

        var form={
            xtype: 'form',
            frame: true,
            title: '',
            style:{
                border:0,
                padding:0
            },
            items:items
        }
        return form;
    },
    statusChange: function (obj, newValue) {
        var parent=obj.up("window");
        var status = newValue.status;
        if (status instanceof Array) {
            return;
        }
        var fieldset = obj.up('fieldset');
        var panel = fieldset.down("#invoice_deal_info_panel");
        panel.removeAll();
        var items = [];
        if (status == "deal") {
            items=parent.getDealItem();
        }else{
            items=parent.getCancelItem();
        }
        panel.add(items);
        //if(status=='cancel'){
        //    fieldset.down("#field_invoice_transport").allowBlank=true;
        //    fieldset.down("#field_invoice_expressNo").allowBlank=true;
        //}else{
        //    fieldset.down("#field_invoice_transport").allowBlank=false;
        //    fieldset.down("#field_invoice_expressNo").allowBlank=false;
        //}
        //fieldset.doLayout();
    },
    getDealItem: function () {
        var result = [
            {
                xtype: 'textfield',
                fieldLabel: '物流公司',
                value: this.data.transport,
                id:'field_invoice_transport',
                name: 'transport',
                columnWidth: 0.8,
                allowBlank: false
            },
            {
                xtype: 'textfield',
                fieldLabel: '快递编号',
                id:'field_invoice_expressNo',
                value: this.data.expressNo,
                name: 'expressNo',
                columnWidth: 0.8,
                allowBlank: false
            },
            {
                xtype: 'textfield',
                fieldLabel: '发票编号',
                value: this.data.invoiceNo,
                name: 'invoiceNo',
                columnWidth: 0.8
            }
        ];
        return result;
    },
    getCancelItem: function () {
        var result = [
            {
                fieldLabel: '取消原因',
                name: 'reason',
                xtype: 'textarea',
                allowBlank: false,
                columnWidth: 0.8
            }
        ];
        return result;
    },
    getRadiaoItems: function (data) {
        var radiaos =[];
        var f1={
            boxLabel: "已开发票",
            name: 'status',
            inputValue: "deal",
            checked:true
        };
        var f2={
            boxLabel: "取消开票",
            name: 'status',
            inputValue: "cancel"
        };
        radiaos.push(f1);
        radiaos.push(f2);
        return radiaos;
    }

});
