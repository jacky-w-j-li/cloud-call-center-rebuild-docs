Ext.define('App.view.resource.location.setLocation', {
    extend: 'Ext.window.Window',
    alias: 'widget.setLocationWin',
    requires: ['App.model.resource.Building'],
    height: 570,
    width: 850,
    layout: 'fit',
    modal: true,
    store: null,
    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            items: [
                {
                    xtype: 'panel',
                    frame: true,
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
                                    title: '写字楼查询',
                                    collapsible: true,
                                    layout: 'column',
                                    defaultType: 'textfield',
                                    items: [
                                        {
                                            xtype: 'textfield',
                                            name: 'location',
                                            value: this.locationId,
                                            hidden: true
                                        },
                                        {
                                            xtype: 'textfield',
                                            fieldLabel: '编号',
                                            name: '_id',
                                            columnWidth: .5
                                        },
                                        {
                                            xtype: 'textfield',
                                            fieldLabel: '名称',
                                            name: 'name',
                                            columnWidth: .5
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
                            title: '写字楼列表',
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
                                            id: 'update_building_tool',
                                            disabled: true,
                                            needSelect: true
                                        },
                                        {
                                            iconCls: 'delete_icon_cls',
                                            text: '删除',
                                            id: 'delete_building_tool',
                                            disabled: true,
                                            needSelect: true
                                        },
                                        {
                                            iconCls: 'add_icon_cls',
                                            text: '添加',
                                            id: 'add_building_tool',
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
                                    header: '编号'
                                },
                                {
                                    dataIndex: 'name',
                                    width: 90,
                                    align: 'center',
                                    header: '名称'
                                },
                                {
                                    dataIndex: 'addr',
                                    width: 90,
                                    align: 'center',
                                    header: '地址'
                                },
                                {
                                    dataIndex: 'tel',
                                    width: 90,
                                    align: 'center',
                                    header: '联系电话'
                                },
                                {
                                    dataIndex: 'linkman',
                                    width: 90,
                                    align: 'center',
                                    header: '联系人'
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
                }
            ]
        });

        me.callParent(arguments);
    },
    getDataStore: function () {
        if (this.store === null) {
            this.store = App.util.AppUtil.getGridStore('bill.resource.queryLoactionBuilding', {location: this.locationId}, 'App.model.resource.Building');
            this.store.loadPage(1);
        }
        return this.store;
    }

});
