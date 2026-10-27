Ext.define('App.view.system.withdrawManage', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.withdrawManageQueryPanel',
    requires: ['App.model.system.WithDrawRecord'],
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
                        title: '支取请求查询',
                        collapsible: true,
                        layout: 'column',
                        defaultType: 'textfield',
                        items: [
                            {
                                fieldLabel: '流水号',
                                name: '_id',
                                columnWidth: .25
                            },
                            {
                                fieldLabel: '代理用户',
                                xtype: 'combobox',
                                name: 'uid',
                                editable: true,
                                store: App.util.AppUtil.getDicStore('systemUser'),
                                displayField: 'codeName',
                                valueField: 'codeValue',
                                columnWidth: .25,
                                typeAhead: true,
                                queryMode: 'local',
                                hidden:App.util.AppUtil.isHideWidget()
                            },
                            {
                                fieldLabel: '状态',
                                xtype: 'combobox',
                                name: 'status',
                                editable: false,
                                store: App.util.AppUtil.getDicStore('withdrawStatus'),
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
            title: '支取记录列表',
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
                            text: '完成付款',
                            id: 'finish_withdraw_tool',
                            disabled: true,
                            needSelect: true,
                            hidden:App.util.AppUtil.isHideWidget()
                        },
                        {
                            iconCls: 'set_icon_cls',
                            text: '查询',
                            id: 'query_withdraw_tool',
                            disabled: true,
                            needSelect: true
                        },
                        {
                            iconCls: 'set_icon_cls',
                            text: '撤消提现',
                            id: 'revert_withdraw_tool',
                            disabled: true,
                            needSelect: true,
                            hidden:App.util.AppUtil.isHideWidget()
                        }
                    ]
                }
            ],

            columns: [
                {
                    header: '流水号',
                    dataIndex: '_id',
                    align: 'center'
                },
                {
                    dataIndex: 'uid',
                    width: 120,
                    align: 'center',
                    header: '代理用户',
                    renderer: function(value){
                        return App.util.AppUtil.getRendererValue(value, 'systemUser');
                    },
                    hidden:App.util.AppUtil.isHideWidget()
                },
                {
                    header: '日期',
                    dataIndex: 'time',
                    align: 'center'
                },
                {
                    header: '金额(元)',
                    dataIndex: 'money',
                    align: 'center'
                },
                {
                    header: '手续费(元)',
                    dataIndex: 'procedureFee',
                    align: 'center'
                },
                {
                    header: '状态',
                    dataIndex: 'status',
                    align: 'center',
                    renderer: function(value){
                        return App.util.AppUtil.getRendererValue(value, 'withdrawStatus');
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
            this.store = App.util.AppUtil.getGridStore("bill.systemUser.queryWithdrawList",{},"App.model.system.WithDrawRecord");
            this.store.loadPage(1);
        }
        return this.store;
    }
});