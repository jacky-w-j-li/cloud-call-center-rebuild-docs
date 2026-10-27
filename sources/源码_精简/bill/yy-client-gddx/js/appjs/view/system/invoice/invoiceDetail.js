Ext.define('App.view.system.invoice.invoiceDetail', {
    extend: 'Ext.window.Window',
    requires: ['App.model.system.InvoicePayVo'],
    alias: 'widget.invoiceDetailWin',
    height: 500,
    width: 850,
    title: '发票明细',
    layout: 'fit',
    data: null,
    payStore: null,
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
                            title: '基本信息',
                            frame: true,
                            autoScroll: true,
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
                    fieldLabel: '发票编号',
                    value: this.data.invoiceNo,
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
                    columnWidth: .6
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
                    fieldLabel: '物流公司',
                    value: this.data.transport,
                    columnWidth: .5
                },
                {
                    fieldLabel: '快递编号',
                    value: this.data.expressNo,
                    columnWidth: .5
                },
                {
                    xtype: 'textarea',
                    fieldLabel: '备注',
                    value: this.data.memo,
                    columnWidth: 1
                },
                {
                    xtype: 'textarea',
                    fieldLabel: '取消原因',
                    value: this.data.reason,
                    columnWidth: 1
                }
            ]

        }
        items.push(baseInfo);

        var payInfoPanel = {
            xtype: 'tabpanel',
            activeTab: 0,
            deferredRender: false,
            items: [
                {
                    xtype: 'panel',
                    title: '关联充值单据',
                    autoScroll: true,
                    frame: true,
                    items: [
                        {
                            xtype: 'grid',
                            forceFit: true,
                            columnLines: true,
                            margin: '0 0 10 0',
                            columnWidth: .99,
                            store: this.getPayStore(),
                            columns: [
                                {
                                    header: '流水号',
                                    dataIndex: '_id',
                                    align: 'center'
                                },
                                {
                                    dataIndex: 'bank',
                                    align: 'center',
                                    header: '支付方式',
                                    renderer : function(value){
                                        return App.util.AppUtil.getRendererValue(value,"payBank");
                                    }
                                },
                                {
                                    dataIndex: 'pay_time',
                                    align: 'center',
                                    header: '充值时间'
                                },
                                {
                                    dataIndex: 'money',
                                    header: '金额(元)',
                                    align: 'center'
                                },
                                {
                                    dataIndex: 'flag',
                                    align: 'center',
                                    header: '类型',
                                    renderer : function(value){
                                        return App.util.AppUtil.getRendererValue(value,"userPayType");
                                    }
                                },
                                {
                                    dataIndex: 'memo',
                                    header: '备注',
                                    align: 'center'
                                }

                            ]
                        }
                    ]
                }
            ]
        }
        items.push(payInfoPanel);
        return items;
    },
    getPayStore: function () {
        if (!this.payStore) {
            this.payStore = Ext.create('Ext.data.Store', {
                model: 'App.model.system.InvoicePayVo',
                data: this.data.payList
            });
        }
        //console.dir(this.payStore)
        return this.payStore;
    }
});
