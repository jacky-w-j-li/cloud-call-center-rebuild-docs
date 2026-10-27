Ext.define('App.view.account.license', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.accountLicenseQueryPanel',
    requires: ['App.model.license.License'],
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
                    class: 'query',
                    frame: true,
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
                            title: 'lincese查询',
                            collapsible: true,
                            layout: 'column',
                            defaultType: 'textfield',
                            items: [
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '账户编号',
                                    name: 'accountId',
                                    columnWidth: .25
                                },
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '账户名称',
                                    name: 'accountName',
                                    columnWidth: .25
                                },
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '公司名称',
                                    name: 'companyName',
                                    columnWidth: .25
                                },
                                {
                                    xtype: 'textfield',
                                    fieldLabel: 'licenseId',
                                    name: '_id',
                                    columnWidth: .25
                                },
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '到期时间',
                                    name: 'endTime',
                                    columnWidth: .25
                                },
                                {
                                    fieldLabel: 'license状态',
                                    xtype: 'combobox',
                                    name: 'status',
                                    store: App.util.AppUtil.getDicStore('licenseStatus'),
                                    editable: false,
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    columnWidth: .25
                                },
                                {
                                    fieldLabel: 'license类型',
                                    xtype: 'combobox',
                                    name: 'type',
                                    store: App.util.AppUtil.getDicStore('licenseType'),
                                    editable: false,
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
                },
                {
                    xtype: 'gridpanel',
                    title: 'license列表',
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
                                    text: '设置',
//                                    hidden: App.util.AppUtil.hasLimit('billing_account_Query_accountSet'),
                                    id: 'account_license_Set_tool',
                                    disabled: true,
                                    needSelect: true
                                },
                                {
                                    iconCls: 'find_icon_cls',
                                    text: '查询',
                                    id: 'account_license_query_tool',
//                                    hidden: App.util.AppUtil.hasLimit('billing_account_Query_accountFind'),
                                    disabled: true,
                                    needSelect: true
                                }
                            ]
                        }
                    ],

                    columns: [
                        {
                            dataIndex: '_id',
                            width: 120,
                            align: 'center',
                            header: 'license编号'
                        },
                        {
                            dataIndex: 'account',
                            width: 90,
                            align: 'center',
                            header: '账户编号'
                        },
                        {
                            dataIndex: 'status',
                            width: 90,
                            align: 'center',
                            header: '状态'
                        },
                        {
                            dataIndex: 'createTime',
                            header: '创建时间',
                            align: 'center',
                            width: 90
                        },
                        {
                            dataIndex: 'endTime',
                            header: '到期时间',
                            align: 'center'
                        },
                        {
                            dataIndex: 'bingUser',
                            header: '绑定用户',
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
            this.store = App.util.AppUtil.getGridStore('app.license.queryLicense', {}, 'App.model.license.License');
            this.store.loadPage(1);
        }
        return this.store;
    },
    getDicStore: function (key) {
        var clientCache = gloab_cdic[key];
        var store = null;
        if (clientCache === undefined || clientCache === null) {
            store = Ext.create('Ext.data.Store', {
                autoLoad: true,
                model: 'App.model.common.DicCache',
                proxy: {
                    type: 'jsonp',
                    url: App.util.AppUtil.getDicUrl(key),
                    reader: {
                        type: 'json',
                        root: 'data.dicList'
                    }
                }
            });
            App.util.AppUtil.loadCache(key);
        } else {
            store = Ext.create('Ext.data.Store', {
                autoLoad: false,
                model: 'App.model.common.DicCache',
                data: clientCache,
                proxy: {
                    type: 'memory',
                    reader: {
                        type: 'json',
                        root: 'data.dicList'
                    }
                }
            });
        }

        return store;
    },
    appNodeRenderer: function (value) {
        return App.util.AppUtil.getRendererValue(value, 'appNode');
    },
    statusRenderer: function (value) {
        return App.util.AppUtil.getRendererValue(value, 'accountStatus');
    },
    showAccountInfo: function () {
        alert(1);
    }
});