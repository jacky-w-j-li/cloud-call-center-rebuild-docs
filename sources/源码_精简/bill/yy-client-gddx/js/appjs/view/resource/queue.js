Ext.define('App.view.resource.queue', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.queueQueryPanel',
    requires: ['App.model.resource.Queue'],
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
                            title: '技能组查询',
                            collapsible: true,
                            layout: 'column',
                            defaultType: 'textfield',
                            items: [
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '技能组号',
                                    name: '_id',
                                    columnWidth: .25
                                },
                                {
                                    xtype: 'textfield',
                                    xtype: 'combobox',
                                    fieldLabel: '状态',
                                    name: 'status',
                                    editable: false,
                                    store: App.util.AppUtil.getDicStore('sipNumStatus'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    columnWidth: .25
                                },
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '账户编号',
                                    name: 'account',
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
                    title: '技能组列表',
                    margin: '10 ',
                    class: 'query',
                    forceFit: true,
                    loadMask: true,
                    store: this.getDataStore(),
                    columnLines: true,
//                    dockedItems: [
//                        {
//                            xtype: 'toolbar',
//                            class: 'dock',
//                            items: [
//
//                                {
//                                    iconCls: 'set_icon_cls',
//                                    text: '修改',
//                                    id: 'update_pbx_tool',
//                                    disabled: true,
//                                    needSelect: true
//                                },
//                                {
//                                    iconCls: 'delete_icon_cls',
//                                    text: '删除',
//                                    id: 'delete_pbx_tool',
//                                    disabled: true,
//                                    needSelect: true
//                                },
//                                {
//                                    iconCls: 'add_icon_cls',
//                                    text: '添加',
//                                    id: 'add_pbx_tool',
//                                    needSelect: false
//                                }
//                            ]
//                        }
//                    ],

                    columns: [
                        {
                            dataIndex: '_id',
                            width: 120,
                            align: 'center',
                            header: '技能组号'
                        },
                        {
                            dataIndex: 'status',
                            width: 90,
                            align: 'center',
                            header: '状态',
                            renderer : function(value){
                                return App.util.AppUtil.getRendererValue(value,"sipNumStatus");
                            }
                        },
                        {
                            dataIndex: 'account',
                            header: '账户编号',
                            align: 'center'
                        },
                        {
                            dataIndex: 'accountData',
                            header: '公司名称',
                            align: 'center',
                            renderer : function (value){
                                return value.companyName;
                            }
                        },
                        {
                            dataIndex: 'type',
                            header: '类型',
                            align: 'center'
                        },
                        {
                            dataIndex: 'pbx',
                            header: 'pbx',
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
            this.store = App.util.AppUtil.getGridStore('bill.resource.queryQueue', {}, 'App.model.resource.Queue');
            this.store.loadPage(1);
        }
        return this.store;
    }
});