Ext.define('App.view.system.invoice', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.invoiceQueryPanel',
    requires: ['App.model.system.InvoiceVo'],
    layout: {
        type: 'anchor'
    },
    store: null,
    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            modal: true,
            items: this.getItems()
        });
        me.callParent(arguments);
    },
    getItems: function () {
        var items = new Array();
        var form={
                xtype: 'form',
                frame: true,
                class: 'query',
                title: '',
                bodyStyle: 'padding:2px 2px 0',
                fieldDefaults: {
                    msgTarget: 'side',
                    labelWidth: 80,
                    labelAlign: 'right'
                },
                items: [
                    {
                        xtype: 'fieldset',
                        class: "query",
                        title: '发票申请查询',
                        collapsible: true,
                        layout: 'column',
                        defaultType: 'textfield',
                        items: [
                            {
                                fieldLabel: '申请时间',
                                labelWidth: 80,
                                xtype: 'datefield',
                                format: 'Y-m-d',
                                name: 'begin',
                                columnWidth: .24
                            },
                            {
                                xtype: 'label',
                                text: '至',
                                columnWidth: .02
                            },
                            {
                                xtype: 'datefield',
                                format: 'Y-m-d',
                                name: 'end',
                                hideLabel: true,
                                columnWidth: .14
                            },
                            {
                                fieldLabel: '账号',
                                name: 'account',
                                columnWidth: .25
                            },
                            {
                                fieldLabel: '状态',
                                xtype: 'combobox',
                                name: 'status',
                                editable: false,
                                store: App.util.AppUtil.getDicStore('invoiceStatus'),
                                displayField: 'codeName',
                                valueField: 'codeValue',
                                columnWidth: .25
                            }
                        ]
                    },
                    {
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
                                class: 'query',
                                width: 90,
                                text: '查询'
                            },
                            {
                                xtype: 'button',
                                class: 'reset',
                                width: 90,
                                text: '重置'
                            },
                            {
                                xtype: 'button',
                                calss: 'export',
                                width: 90,
                                text: '导出'
                            }

                        ]
                    }
                ]
            };
        items.push(form);
        var grid={
            xtype: 'gridpanel',
            title: '发票申请列表',
            margin: '10 ',
            class: 'query',
            forceFit: true,
            loadMask: true,
            store: this.getDataStore(),
            columnLines: true,
            dockedItems: [
                {
                    xtype: 'toolbar',
                    class: 'dock',
                    items: [
                        {
                            iconCls: 'set_icon_cls',
                            text: '开具发票',
                            id: 'finish_invoice_tool',
                            disabled: true,
                            needSelect: true
                        },
                        {
                            iconCls: 'edit_icon_cls',
                            text: '修改',
                            id: 'update_invoice_detail',
                            disabled: true,
                            needSelect: true
                        },
                        {
                            iconCls: 'find_icon_cls',
                            text: '明细',
                            id: 'query_invoice_detail',
                            disabled: true,
                            needSelect: true
                        },
                        {
                            iconCls: 'find_icon_cls',
                            text: '专票明细',
                            id: 'query_invoice_professional_detail',
                            disabled: true,
                            needSelect: true
                        }

                    ]
                }
            ],

            columns: [
                {
                    header: '账号',
                    dataIndex: 'account',
                    align: 'center'
                },
                //{
                //    dataIndex: 'money',
                //    width: 120,
                //    align: 'center',
                //    header: '代理用户',
                //    renderer: function(value){
                //        return App.util.AppUtil.getRendererValue(value, 'systemUser');
                //    },
                //    hidden:App.util.AppUtil.isHideWidget()
                //},
                {
                    header: '申请时间',
                    dataIndex: 'createTime',
                    align: 'center'
                },
                {
                    header: '发票金额(元)',
                    dataIndex: 'money',
                    align: 'center'
                },
                {
                    header: '发票抬头(元)',
                    dataIndex: 'info.invoiceTitle',
                    align: 'center'
                },
                {
                    header: '状态',
                    dataIndex: 'status',
                    align: 'center',
                    renderer: function(value){
                        return App.util.AppUtil.getRendererValue(value, 'invoiceStatus');
                    }
                }
            ],
            viewConfig: {
                forceFit: true
            },
            bbar: Ext.create('Ext.PagingToolbar', {
                store: this.getDataStore(),
                pageSize: 10,
                displayInfo: true,
                displayMsg: '当前记录 {0} - {1} 共 {2}',
                emptyMsg: "没有记录可显示",
                plugins: Ext.create('Ext.ux.ProgressBarPager', {})
            })
        };
        items.push(grid);
        return items;
    },
    getDataStore: function () {
        if (this.store === null) {
            this.store = App.util.AppUtil.getGridStore("app.invoice.queryInvoiceList2Bill",{},"App.model.system.InvoiceVo");
            this.store.loadPage(1);
        }
        return this.store;
    }
});