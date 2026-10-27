Ext.define('App.view.resource.num400', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.num400QueryPanel',
    requires: ['App.model.resource.Num400'],
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
                            title: '400查询',
                            collapsible: true,
                            layout: 'column',
                            defaultType: 'textfield',
                            items: [
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '400号码',
                                    name: '_id',
                                    columnWidth: .25
                                },
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '账户编号',
                                    name: 'account',
                                    columnWidth: .25
                                },
                                {
                                    fieldLabel: '号码状态',
                                    xtype: 'combobox',
                                    name: 'status',
                                    editable: false,
                                    store: App.util.AppUtil.getDicStore('serviceNumStatus'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    columnWidth: .25
                                },
                                {
                                    fieldLabel: 'pbx',
                                    xtype: 'combobox',
                                    name: 'pbx',
                                    editable: false,
                                    store: App.util.AppUtil.getDicStore('pbx'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    columnWidth: .25
                                },
                                {
                                    fieldLabel: '到期时间',
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
                    title: '400号码列表',
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
                                    id: 'set_num400_tool',
                                    hidden : App.util.AppUtil.hasLimit("resource_num400_set"),
                                    disabled: true,
                                    needSelect: true
                                },
                                {
                                    iconCls: 'set_icon_cls',
                                    text: '设置初始资费',
                                    id: 'set_num400_tool_init',
                                    hidden : App.util.AppUtil.hasLimit("resource_num400_setInit"),
                                    disabled: true,
                                    needSelect: true
                                },
                                {
                                    iconCls: 'set_icon_cls',
                                    text: '占用号码',
                                    id: 'set_num400_tool_use',
//                                    hidden : App.util.AppUtil.hasLimit("resource_num400_use"),
                                    disabled: true,
                                    needSelect: true
                                },
                                {
                                    iconCls: 'delete_icon_cls',
                                    text: '删除',
                                    id: 'delete_num400_tool',
                                    hidden : App.util.AppUtil.hasLimit("resource_num400_delete"),
                                    disabled: true,
                                    needSelect: true
                                },
                                {
                                    iconCls: 'add_icon_cls',
                                    text: '添加',
                                    id: 'add_num400_tool',
                                    hidden : App.util.AppUtil.hasLimit("resource_num400_add"),
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
                            header: '400号码'
                        },
                        {
                            dataIndex : "owner",
                            align: 'center',
                            header: '所属代理',
                            renderer : function (value) {
                                return App.util.AppUtil.getRendererValue(value, "proxy");
                            }
                        },
                        {
                            dataIndex: 'status',
                            width: 90,
                            align: 'center',
                            header: '状态',
                            renderer: function (value) {
                                return App.util.AppUtil.getRendererValue(value, "serviceNumStatus");
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
                            renderer: function (value) {
                                return value.companyName;
                            }
                        },
                        {
                            dataIndex: 'min400Consume',
                            header: '低消(元)',
                            align: 'center'
                        },
                        {
                            dataIndex: 'dial400FeeStrategy',
                            header: '资费策略',
                            align: 'center',
                            renderer : function(value){
                                return App.util.AppUtil.getRendererValue(value,"dialPriceStrategy");
                            }
                        },
                        {
                            dataIndex: 'concurrent',
                            header: '并发',
                            align: 'center',
                            renderer : function(value){
                                return value || -1;
                            }
                        },
//                        {
//                            dataIndex: 'beginTime',
//                            header: '租用时间',
//                            align: 'center'
//                        },{
//                            dataIndex : 'endTime',
//                            header : '到期时间',
//                            align : 'center'
//                        },
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
            this.store = App.util.AppUtil.getGridStore('bill.resource.queryNum400', {}, 'App.model.resource.Num400');
            this.store.loadPage(1);
        }
        return this.store;
    }
});
