Ext.define('App.view.system.logo', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.logoQueryPanel',
    requires: ['App.model.system.Logo'],
    layout: {
        type: 'anchor'
    },
    store: null,

    initComponent: function () {
        var me = this;
        Ext.applyIf(me,{
            items: [
                {
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
                            title: 'logo查询',
                            collapsible: true,
                            layout: 'column',
                            defaultType: 'textfield',
                            items: [
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '域名',
                                    name: '_id',
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
                    title: 'logo列表',
                    margin: '10 ',
                    class: 'query',
                    id:"logo_query_grid",
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
                                    iconCls: 'add_icon_cls',
                                    text: '添加',
                                    id: 'add_logo_tool',
                                    needSelect: false
                                },
                                {
                                    iconCls: 'set_icon_cls',
                                    text: '修改',
                                    id: 'update_logo_tool',
                                    disabled: true,
                                    needSelect: true
                                },
                                {
                                    iconCls: 'delete_icon_cls',
                                    text: '删除',
                                    id: 'delete_logo_tool',
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
                            header: '域名'
                        },
                        {
                            dataIndex: 'phone',
                            width: 90,
                            align: 'center',
                            header: '联系电话'
                        },
                        {
                            dataIndex: 'email',
                            header: '联系邮箱',
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
            this.store = App.util.AppUtil.getGridStore('bill.system.queryLogo', {}, 'App.model.system.Logo');
            this.store.loadPage(1);
        }
        return this.store;
    }
});