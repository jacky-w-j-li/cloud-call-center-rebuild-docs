Ext.define('App.view.resource.pbx', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.pbxQueryPanel',
    requires: ['App.model.resource.Pbx'],
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
                            title: 'pbx查询',
                            collapsible: true,
                            layout: 'column',
                            defaultType: 'textfield',
                            items: [
                                {
                                    xtype: 'textfield',
                                    fieldLabel: 'pbxId',
                                    name: '_id',
                                    columnWidth: .25
                                },
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '名称',
                                    name: 'name',
                                    columnWidth: .25
                                },
                                {
                                    xtype: 'combobox',
                                    hidden:true,
                                    store: App.util.AppUtil.getDicStore('board')
                                },
                                {
                                    xtype: 'textfield',
                                    fieldLabel: 'sip注册地址',
                                    name: 'sipAddr',
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
                    title: 'pbx列表',
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
                                    text: '修改',
                                    id: 'update_pbx_tool',
                                    disabled: true,
                                    needSelect: true
                                },
                                {
                                    iconCls: 'delete_icon_cls',
                                    text: '删除',
                                    id: 'delete_pbx_tool',
                                    disabled: true,
                                    needSelect: true
                                },
                                {
                                    iconCls: 'add_icon_cls',
                                    text: '添加',
                                    id: 'add_pbx_tool',
                                    needSelect: false
                                }
                            ]
                        }
                    ],

                    columns: [
                        {
                            dataIndex: '_id',
                            width: 120,
                            align: 'center',
                            header: 'pbxId'
                        },
                        {
                            dataIndex: 'name',
                            width: 90,
                            align: 'center',
                            header: 'pbx名称'
                        },
                        {
                            dataIndex: 'sipAddr',
                            header: 'sip地址',
                            align: 'center'
                        },
                        {
                            dataIndex: 'assAddr',
                            header: 'ass地址',
                            align: 'center'
                        },
                        {
                            dataIndex: 'configAddr',
                            header: 'config地址',
                            align: 'center'
                        },
                        {
                            dataIndex: 'encryptSipAddr',
                            header: 'sip加密地址',
                            align: 'center'
                        },
                        {
                            dataIndex : 'board',
                            header : '机柜',
                            align : 'center',
                            renderer : function(value){
                                return App.util.AppUtil.getRendererValue(value, 'board');
                            }
                        },
                        {
                            dataIndex: 'memo',
                            header: '备注',
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
            this.store = App.util.AppUtil.getGridStore('bill.resource.queryPbx', {}, 'App.model.resource.Pbx');
            this.store.loadPage(1);
        }
        return this.store;
    }
});