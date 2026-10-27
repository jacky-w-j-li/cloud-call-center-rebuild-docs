Ext.define('App.view.resource.serviceNumDb', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.serviceNumDbQueryPanel',
    requires: ['App.model.resource.ServiceNum'],
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
                            title: '服务号查询',
                            collapsible: true,
                            layout: 'column',
                            defaultType: 'textfield',
                            items: [
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '服务号',
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
                                }

                            ]
                        }
                    ]
                },
                {
                    xtype: 'gridpanel',
                    title: '服务号资源列表',
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
                            ]
                        }
                    ],

                    columns: [
                        {
                            dataIndex: '_id',
                            width: 120,
                            align: 'center',
                            header: '服务号'
                        },
                        {
                            dataIndex: 'status',
                            width: 90,
                            align: 'center',
                            header: '状态',
                            renderer : function(value){
                                return App.util.AppUtil.getRendererValue(value,"serviceNumStatus");
                            }
                        },
                        {
                            dataIndex: 'monthRent',
                            header: '预设客户月租',
                            align: 'center'
                        },
                        {
                            dataIndex : 'monthRentProxy',
                            header : '您的月租',
                            align: 'center'
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
            this.store = App.util.AppUtil.getGridStore('bill.resource.queryServiceNumDb', {}, 'App.model.resource.ServiceNum');
            this.store.loadPage(1);
        }
        return this.store;
    }
});
