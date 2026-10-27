Ext.define('App.view.resource.sp', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.spQueryPanel',
    requires: ['App.model.resource.Sp'],
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
                            title: '运营商查询',
                            collapsible: true,
                            layout: 'column',
                            defaultType: 'textfield',
                            items: [
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '编号',
                                    name: '_id',
                                    columnWidth: .25
                                },
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '名称',
                                    name: 'name',
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
                    title: '运营商列表',
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
                                    id: 'update_sp_tool',
                                    disabled: true,
                                    needSelect: true
                                },
                                {
                                    iconCls: 'delete_icon_cls',
                                    text: '删除',
                                    id: 'delete_sp_tool',
                                    disabled: true,
                                    needSelect: true
                                },
                                {
                                    iconCls: 'add_icon_cls',
                                    text: '添加',
                                    id: 'add_sp_tool',
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
                            header: '运营商编号'
                        },
                        {
                            dataIndex: 'name',
                            width: 90,
                            align: 'center',
                            header: '运营商名称'
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
            this.store = App.util.AppUtil.getGridStore('bill.resource.querySp', {}, 'App.model.resource.Sp');
            this.store.loadPage(1);
        }
        return this.store;
    }
});