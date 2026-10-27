/**
 * Created by apple on 15/8/17.
 */
Ext.define('App.view.resource.manualSms', {
    extend: 'Ext.panel.Panel',
    requires: ['App.model.resource.SmsSend'],
    alias: 'widget.manualSmsPanel',
    title: '人工审核短信',
    store: null,
    checkedStore: null,
    autoScroll: false,
    layout: {
        type: 'anchor'
    },
    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            modal: true,
            items: [
                {
                    xtype: 'tabpanel',
                    activeTab: 0,
                    items: [
                        {
                            xtype: 'panel',
                            frame: true,
                            title: '待审核',
                            items: this.getSmsCheckItems()
                        },
                        {
                            xtype: 'panel',
                            frame: true,
                            title: '已审核',
                            items: this.getSmsCheckedItems()
                        }
                    ]
                }
            ]
        });
        me.callParent(arguments);
    },
    getSmsCheckedItems: function () {
        var items = [];
        var form =
        {
            xtype: 'form',
            frame: true,
            class: "query",
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
                    title: '已审核短信查询',
                    collapsible: true,
                    layout: 'column',
                    defaultType: 'textfield',
                    items: [
                        {
                            name: "m7Status",
                            fieldLabel: '审核状态',
                            xtype: 'combobox',
                            store : Ext.create('Ext.data.Store', {
                                fields: ['codeName', 'codeValue'],
                                data : [
                                    {"codeName":"通过", "codeValue":"pass"},
                                    {"codeName":"未通过", "codeValue":"unpass"}
                                ]
                            }),
                            displayField: 'codeName',
                            valueField: 'codeValue',
                            typeAhead: true,
                            queryMode: 'local',
                            columnWidth: .25
                        },
                        {
                            xtype: 'textfield',
                            fieldLabel: '账户编号',
                            name: 'account',
                            columnWidth: .25
                        },
                        {
                            xtype: 'textfield',
                            fieldLabel: '手机号',
                            name: 'num',
                            columnWidth: .25
                        }, {
                            fieldLabel: '通道',
                            name: 'smsChannel',
                            xtype: 'combobox',
                            store: App.util.AppUtil.getDicStore('smsChannel', true),
                            displayField: 'codeName',
                            valueField: 'codeValue',
                            typeAhead: true,
                            queryMode: 'local',
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
                        }

                    ]
                }
            ]
        };
        items.push(form);
        var grid = Ext.create('Ext.grid.Panel', {
            autoScroll: true,
            margin: '10 0 0 0',
            title: '短信列表',
            id: 'manual_sms_checked_grid',
            class: 'query',
            forceFit: true,
            loadMask: true,
            store: this.getCheckedDataStore(),
            columnLines: true,
            dockedItems: [
                {
                    xtype: 'toolbar',
                    class: 'dock',
                    items: [
                        {
                            iconCls: 'find_icon_cls',
                            text: '短信详情',
                            id: 'sms_checked_find_tool',
                            disabled: true,
                            needSelect: true
                        }
                    ]
                }
            ],
            columns: [
                {header: '手机号', dataIndex: 'num', width: 100},
                {header: '短信内容', dataIndex: 'content', flex: 4},
                {header: '发送时间', dataIndex: 'submitTime', width: 120},
                {header: '签名', dataIndex: 'signDisplay', width: 100},
                {
                    header: '通道',
                    dataIndex: 'smsChannel',
                    width: 100,
                    renderer: function (value) {
                        return App.util.AppUtil.getRendererValue(value, 'smsChannel');
                    }
                },
                {
                    header: '审核结果', dataIndex: 'm7Status', width: 100
                },
                {
                    header: '审核人', dataIndex: 'checkUser', width: 100
                },
                {
                    header: '审核时间', dataIndex: 'checkTime', width: 100
                }

            ],
            viewConfig: {
                forceFit: true
            },
            bbar: Ext.create('Ext.PagingToolbar', {
                store: this.getCheckedDataStore(),
                pageSize: 15,
                displayInfo: true,
                displayMsg: '当前记录 {0} - {1} 共 {2}',
                emptyMsg: "没有记录可显示",
                plugins: Ext.create('Ext.ux.ProgressBarPager', {})
            })
        });
        items.push(grid);
        return items;
    },
    getSmsCheckItems: function () {
        var items = new Array();
        var form =
        {
            xtype: 'form',
            frame: true,
            title: '',
            class: "query",
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
                    title: '审核短信查询',
                    collapsible: true,
                    layout: 'column',
                    defaultType: 'textfield',
                    items: [
                        {
                            name: "m7Status",
                            value: "check",
                            hidden: true
                        },
                        {
                            xtype: 'textfield',
                            fieldLabel: '账户编号',
                            name: 'account',
                            columnWidth: .3
                        },
                        {
                            xtype: 'textfield',
                            fieldLabel: '手机号',
                            name: 'num',
                            columnWidth: .3
                        }, {
                            fieldLabel: '通道',
                            name: 'smsChannel',
                            xtype: 'combobox',
                            store: App.util.AppUtil.getDicStore('smsChannel', true),
                            displayField: 'codeName',
                            valueField: 'codeValue',
                            typeAhead: true,
                            queryMode: 'local'
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
                            id: 'query_btn_sms_check',
                            class: 'query',
                            width: 90,
                            text: '查询'
                        },
                        {
                            xtype: 'button',
                            id: 'query_btn_rest',
                            class: 'reset',
                            width: 90,
                            text: '重置'
                        }

                    ]
                }
            ]
        };
        items.push(form);

        var selModel = Ext.create('Ext.selection.CheckboxModel', {
            checkOnly: true,
            mode: 'multi'
        });
        var grid = Ext.create('Ext.grid.Panel', {
            autoScroll: true,
            margin: '10 0 0 0',
            //height: 350,
            title: '短信列表',
            id: 'manual_sms_check_grid',
            class: 'query',
            selModel: selModel,
            selType: 'checkboxmodel',
            forceFit: true,
            loadMask: true,
            store: this.getDataStore(),
            columnLines: true,
            //plugins: [cellEditing],
            dockedItems: [
                {
                    xtype: 'toolbar',
                    class: 'dock',
                    items: [
                        {
                            iconCls: 'turnUsing_icon_cls',
                            text: '通过',
                            id: 'sms_check_pass_tool',
                            disabled: true,
                            needSelect: true,
                        },
                        {
                            iconCls: 'delete_icon_cls',
                            text: '不通过',
                            id: 'sms_check_unpass_tool',
                            disabled: true,
                            needSelect: true
                        },
                        {
                            iconCls: 'find_icon_cls',
                            text: '短信详情',
                            id: 'sms_check_find_tool',
                            disabled: true,
                            needSelect: true
                        }
                    ]
                }
            ],
            columns: [
                {header: '手机号', dataIndex: 'num', width: 100},
                {header: '短信内容', dataIndex: 'content', flex: 4},
                {header: '发送时间', dataIndex: 'submitTime', width: 120},
                {header: '签名', dataIndex: 'signDisplay', width: 100},
                {
                    header: '通道',
                    dataIndex: 'smsChannel',
                    width: 100,
                    renderer: function (value) {
                        return App.util.AppUtil.getRendererValue(value, 'smsChannel');
                    }
                }

            ],
            viewConfig: {
                forceFit: true
            },
            bbar: Ext.create('Ext.PagingToolbar', {
                store: this.getDataStore(),
                pageSize: 15,
                displayInfo: true,
                displayMsg: '当前记录 {0} - {1} 共 {2}',
                emptyMsg: "没有记录可显示",
                plugins: Ext.create('Ext.ux.ProgressBarPager', {})
            })
        });
        items.push(grid);
        return items;


    },

    getDataStore: function () {
        if (this.store === null) {
            this.store = App.util.AppUtil.getGridStore('bill.resource.getCheckSms', {m7Status: "check"}, 'App.model.resource.SmsSend', 15);
            this.store.loadPage(1);
        }
        return this.store;
    },
    getCheckedDataStore : function () {
        if (this.checkedStore === null) {
            this.checkedStore = App.util.AppUtil.getGridStore('bill.resource.getCheckedSms', {}, 'App.model.resource.SmsSend', 15);
            this.checkedStore.loadPage(1);
        }
        return this.checkedStore;
    }
});
