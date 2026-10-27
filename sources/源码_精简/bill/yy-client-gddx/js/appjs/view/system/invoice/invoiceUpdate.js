Ext.define('App.view.system.invoice.invoiceUpdate', {
    extend: 'Ext.window.Window',
    requires: [],
    alias: 'widget.invoiceUpdateWin',
    height: 450,
    width: 800,
    title: '发票修改',
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
                            title: '修改发票',
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
            title: '修改内容',
            id : 'invoice_update_info_fieldset',
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
                    id: 'btn_update_invoice',
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
    }


});
