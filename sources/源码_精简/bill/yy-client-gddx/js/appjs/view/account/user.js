Ext.define('App.view.account.user', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.accountUserQueryPanel',
    requires: ["App.model.user.User"],
    layout: {
        type: 'anchor'
    },
    store: null,

    initComponent: function () {
        var me = this;

        Ext.applyIf(me, {
            items: [
                {
                    xtype: 'form',
                    frame: true,
                    title: '',
                    class: 'query',
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
                            title: '用户查询',
                            collapsible: true,
                            layout: 'column',
                            defaultType: 'textfield',
                            items: [
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '账户编号',
                                    name: 'account',
                                    columnWidth: .25
                                },
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '工号',
                                    name: 'exten',
                                    columnWidth: .25
                                },
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '用户姓名',
                                    name: 'displayName',
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
                },
                {
                    xtype: 'gridpanel',
                    title: '用户列表',
                    margin: '10 ',
                    class: "query",
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
                                    iconCls: 'edit_icon_cls',
                                    text: '修改',
                                    id: 'account_user_update_tool',
                                    disabled: true,
                                    needSelect: true
                                },
                                {
                                    iconCls: 'set_icon_cls',
                                    text: '设置',
                                    id: 'account_user_Set_tool',
                                    disabled: true,
                                    needSelect: true
                                },
                                {
                                    iconCls: 'find_icon_cls',
                                    text: '查询',
                                    id: 'account_user_query_tool',
                                    disabled: true,
                                    needSelect: true
                                }
//                                ,
//                                {
//                                    iconCls: 'add_icon_cls',
//                                    text: '添加用户',
//                                    id: 'account_user_add_tool',
//                                    account: false
//                                }
                            ]
                        }
                    ],

                    columns: [
//                        {
//                            dataIndex: '_id',
//                            width: 120,
//                            align: 'center',
//                            header: '用户编号'
//                        },
                        {
                            dataIndex: 'displayName',
                            header: '用户姓名',
                            align: 'center',
                            width: 90
                        },
                        {
                            dataIndex: 'account',
                            header: '账户编号',
                            align: 'center'
                        },
                        {
                            dataIndex: 'accountData',
                            header: '账户名称',
                            align: 'center',
                            renderer: function (value) {
                                return value.companyName;
                            }
                        },
                        {
                            dataIndex: 'exten',
                            header: '工号',
                            align: 'center'
                        },
                        {
                            dataIndex: "mobile",
                            header: '直线电话',
                            align: 'center'
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

                }
            ]
        });
        me.callParent(arguments);
    },
    getDataStore: function () {
        if (this.store === null) {
            this.store = App.util.AppUtil.getGridStore('bill.user.queryUser', {}, 'App.model.user.User');
            this.store.loadPage(1);
        }
        return this.store;
    }
});