Ext.define('App.view.resource.zj.board.set', {
    extend: 'Ext.window.Window',
    alias: 'widget.zjsetBoardWindow',
    requires: ['App.model.resource.OutRoute','App.model.resource.CallLine','App.model.resource.InRoute','App.model.resource.PbxServer'],
    height: 550,
    width: 850,
    layout: {
        type: 'anchor'
    },
    modal: true,
    data: null,
    title: '机柜配置',
    outRouteStore: null,
    inRouteStore: null,
    outLineStore: null,
    serverStore: null,

    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            items: [
                {
                    xtype: 'tabpanel',
                    activeTab: 0,
                    items: [
                        {
                            xtype: 'panel',
                            frame: true,
                            id: 'zj_calloutRoute_config_panel',
                            title: '外呼路由',
                            items: this.getOutRouteItems()
                        },
                        {
                            xtype: 'panel',
                            frame: true,
                            id: 'zj_calloutLine_config_panel',
                            title: '外呼中继',
                            items: this.getOutLineItems()
                        },
                        {
                            xtype: 'panel',
                            frame: true,
                            id: 'zj_server_config_panel',
                            title: '机器管理',
                            items: this.getServerItems()

                        }
                    ]
                }
            ]
        });
        me.callParent(arguments);
    },
    getOutRouteItems: function () {
        var items = [];
        items.push({
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
                    title: '外呼路由',
                    collapsible: true,
                    layout: 'column',
                    defaultType: 'textfield',
                    items: [
                        {
                            xtype: 'textfield',
                            fieldLabel: '路由编号',
                            name: 'number',
                            columnWidth: .25
                        },
                        {
                            xtype: 'textfield',
                            fieldLabel: '路由名称',
                            name: 'name',
                            columnWidth: .25
                        },
                        {
                            xtype: 'hiddenfield',
                            name: 'boardId',
                            value:this.data._id
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
        });
        items.push({
            xtype: 'gridpanel',
            title: '路由列表',
            margin: '10 ',
            class: 'query',
            forceFit: true,
            loadMask: true,
            store: this.getOutRouteDataStore(),
            columnLines: true,
            dockedItems: [
                {
                    xtype: 'toolbar',
                    class: 'dock',
                    items: [
                        {
                            iconCls: 'set_icon_cls',
                            text: '修改',
                            id: 'zj_update_outRoute_tool',
                            disabled: true,
                            needSelect: true
                        },
                        {
                            iconCls: 'delete_icon_cls',
                            text: '删除',
                            id: 'zj_delete_outRoute_tool',
                            disabled: true,
                            needSelect: true
                        },
                        {
                            iconCls: 'add_icon_cls',
                            text: '添加',
                            id: 'zj_add_outRoute_tool',
                            needSelect: false
                        },
                        {
                            iconCls: 'add_icon_cls',
                            text: '路由生效',
                            id: 'zj_effect_outRoute_tool',
                            needSelect: false
                        }
                    ]
                }
            ],
            columns: [
                {
                    dataIndex: 'number',
                    width: 120,
                    align: 'center',
                    header: '路由编号'
                },
                {
                    dataIndex: 'name',
                    width: 90,
                    align: 'center',
                    header: '路由名称'
                },
                {
                    dataIndex: 'context',
                    header: '路由内容',
                    align: 'center'
                },
                {
                    dataIndex: 'backInfo',
                    header: '备注',
                    align: 'center'
                }
            ],
            viewConfig: {
                forceFit: true
            },
            bbar: Ext.create('Ext.PagingToolbar', {
                store: this.getOutRouteDataStore(),
                pageSize: 10,
                displayInfo: true,
                displayMsg: '当前记录 {0} - {1} 共 {2}',
                emptyMsg: "没有记录可显示",
                plugins: Ext.create('Ext.ux.ProgressBarPager', {})
            })
        });
        return items;
    },
    getOutLineItems: function () {
        var items = [];
        items.push({
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
                    title: '外呼中继',
                    collapsible: true,
                    layout: 'column',
                    defaultType: 'textfield',
                    items: [
                        {
                            xtype: 'textfield',
                            fieldLabel: '线路编号',
                            name: 'number',
                            columnWidth: .25
                        },
                        {
                            xtype: 'hiddenfield',
                            name: 'boardId',
                            value:this.data._id
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
        });
        items.push({
            xtype: 'gridpanel',
            title: '线路列表',
            margin: '10 ',
            class: 'query',
            forceFit: true,
            loadMask: true,
            store: this.getOutLineDataStore(),
            columnLines: true,
            dockedItems: [
                {
                    xtype: 'toolbar',
                    class: 'dock',
                    items: [
                        {
                            iconCls: 'set_icon_cls',
                            text: '修改',
                            id: 'zj_update_outLine_tool',
                            disabled: true,
                            needSelect: true
                        },
                        {
                            iconCls: 'delete_icon_cls',
                            text: '删除',
                            id: 'zj_delete_outLine_tool',
                            disabled: true,
                            needSelect: true
                        },
                        {
                            iconCls: 'add_icon_cls',
                            text: '添加',
                            id: 'zj_add_outLine_tool',
                            needSelect: false
                        },
                        {
                            iconCls: 'add_icon_cls',
                            text: '路由生效',
                            id: 'zj_effect_outLine_tool',
                            needSelect: false
                        }
                    ]
                }
            ],
            columns: [
                {
                    dataIndex: 'number',
                    width: 120,
                    align: 'center',
                    header: '线路编号'
                },
                {
                    dataIndex: 'context',
                    header: '线路内容',
                    align: 'center'
                },
                {
                    dataIndex: 'backInfo',
                    header: '备注',
                    align: 'center'
                }
            ],
            viewConfig: {
                forceFit: true
            },
            bbar: Ext.create('Ext.PagingToolbar', {
                store: this.getOutLineDataStore(),
                pageSize: 10,
                displayInfo: true,
                displayMsg: '当前记录 {0} - {1} 共 {2}',
                emptyMsg: "没有记录可显示",
                plugins: Ext.create('Ext.ux.ProgressBarPager', {})
            })
        });
        return items;
    },
    getServerItems: function () {
        var items = [];
        items.push({
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
                    title: '机器管理',
                    collapsible: true,
                    layout: 'column',
                    defaultType: 'textfield',
                    items: [
                        {
                            xtype: 'textfield',
                            fieldLabel: '机器编号',
                            name: 'number',
                            columnWidth: .25
                        },
                        {
                            xtype: 'textfield',
                            fieldLabel: '机器名称',
                            name: 'name',
                            columnWidth: .25
                        },
                        {
                            xtype: 'hiddenfield',
                            name: 'boardId',
                            value:this.data._id
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
        });
        items.push({
            xtype: 'gridpanel',
            title: '路由列表',
            margin: '10 ',
            class: 'query',
            forceFit: true,
            loadMask: true,
            store: this.getServerDataStore(),
            columnLines: true,
            dockedItems: [
                {
                    xtype: 'toolbar',
                    class: 'dock',
                    items: [
                        {
                            iconCls: 'set_icon_cls',
                            text: '修改',
                            id: 'zj_update_server_tool',
                            disabled: true,
                            needSelect: true
                        },
                        {
                            iconCls: 'delete_icon_cls',
                            text: '删除',
                            id: 'zj_delete_server_tool',
                            disabled: true,
                            needSelect: true
                        },
                        {
                            iconCls: 'add_icon_cls',
                            text: '添加',
                            id: 'zj_add_server_tool',
                            needSelect: false
                        }
                    ]
                }
            ],
            columns: [
                {
                    dataIndex: 'number',
                    width: 120,
                    align: 'center',
                    header: '机器编号'
                },
                {
                    dataIndex: 'name',
                    width: 90,
                    align: 'center',
                    header: '机器名称'
                },
                {
                    dataIndex: 'ip',
                    align: 'center',
                    header: 'ip地址'
                },
                {
                    dataIndex: 'port',
                    align: 'center',
                    header: '端口'
                },
                {
                    dataIndex: 'backInfo',
                    header: '备注',
                    align: 'center'
                }
            ],
            viewConfig: {
                forceFit: true
            },
            bbar: Ext.create('Ext.PagingToolbar', {
                store: this.getServerDataStore(),
                pageSize: 10,
                displayInfo: true,
                displayMsg: '当前记录 {0} - {1} 共 {2}',
                emptyMsg: "没有记录可显示",
                plugins: Ext.create('Ext.ux.ProgressBarPager', {})
            })
        });
        return items;
    },
    getServerDataStore : function () {
        if (this.serverStore === null) {
            this.serverStore = App.util.AppUtil.getGridStore('bill.resource.zj.queryBoardServer', {boardId: this.data._id}, 'App.model.resource.PbxServer');
            this.serverStore.loadPage(1);
        }
        return this.serverStore;
    },
    getOutLineDataStore: function () {
        if (this.outLineStore === null) {
            this.outLineStore = App.util.AppUtil.getGridStore('bill.resource.zj.queryBoardOutLine', {boardId: this.data._id}, 'App.model.resource.CallLine');
            this.outLineStore.loadPage(1);
        }
        return this.outLineStore;
    },
    getOutRouteDataStore: function () {
        if (this.outRouteStore === null) {
            this.outRouteStore = App.util.AppUtil.getGridStore('bill.resource.zj.queryBoardOutRoute', {boardId: this.data._id}, 'App.model.resource.OutRoute');
            this.outRouteStore.loadPage(1);
        }
        return this.outRouteStore;
    }

});
