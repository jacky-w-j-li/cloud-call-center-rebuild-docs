Ext.define('App.view.account.displayNumRecord', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.displayNumRecordPanel',
    requires: ["App.model.displayNumRecord.DisplayNumRecord"],
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
                            title: '透传号码备案查询',
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
                                    fieldLabel: '透传号码',
                                    name: 'displayNums',
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
                    title: '备案列表',
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
                                    iconCls: 'add_icon_cls',
                                    text: '添加',
                                    id: 'toolbar_add_display_num_record',
                                },
                                {
                                    iconCls: 'edit_icon_cls',
                                    text: '修改',
                                    id: 'toolbar_update_display_num_record',
                                    disabled: true,
                                    needSelect: true
                                },
                                {
                                    iconCls: 'delete_icon_cls',
                                    text: '删除',
                                    id: 'toolbar_delete_display_num_record',
                                    disabled: true,
                                    needSelect: true
                                }
                            ]
                        }
                    ],
                    columns: [
                        {
                            dataIndex: 'account',
                            header: '账户编号',
                            align: 'center',
                        },
                        {
                            dataIndex: 'accountName',
                            header: '企业名称',
                            align: 'center',
                        },
                        {
                            dataIndex: 'line',
                            header: '线路',
                            align: 'center',
                            renderer: function(value){
                                return App.util.AppUtil.getRendererValue(value, 'line');
                            }
                        },
                        {
                            dataIndex: 'operator',
                            header: '操作员',
                            align: 'center',
                            renderer: function(value){
                                return App.util.AppUtil.getRendererValue(value, 'systemUser');
                            }
                        },
                        {
                            dataIndex: 'memo',
                            header: '备注',
                            align: 'center',
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
            this.store = App.util.AppUtil.getGridStore('bill.account.queryDisplayNumRecord', {}, 'App.model.displayNumRecord.DisplayNumRecord');
            this.store.loadPage(1);
        }
        return this.store;
    }
});