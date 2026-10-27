Ext.define('App.view.resource.openIntlFee', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.openIntlFeeQueryPanel',
    requires: ['App.model.resource.OpenIntlFee'],
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
                            title: '历史查询',
                            collapsible: true,
                            layout: 'column',
                            defaultType: 'textfield',
                            items: [
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '号码',
                                    name: 'num',
                                    columnWidth: .25
                                },
                                {
                                    fieldLabel: '开通时间',
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
                                }

                            ]
                        }
                    ]
                },
                {
                    xtype: 'gridpanel',
                    title: '历史列表',
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
                                    iconCls: 'add_icon_cls',
                                    text: '开通国际长途',
                                    id: 'btn_intlFee_add',
                                    needSelect: false
                                },{
                                    iconCls: 'find_icon_cls',
                                    text: '详情',
                                    id: 'btn_openIntlFee_show_detail',
                                    disabled: true,
                                    needSelect: true
                                },{
                                    iconCls: 'delete_icon_cls',
                                    text: '删除',
                                    id: 'delete_intlFee_tool',
                                    disabled: true,
                                    needSelect: true
                                }
                            ]
                        }
                    ],

                    columns: [
                        {
                            dataIndex: '_id',
                            align: 'center',
                            header: '',
                            hidden:true
                        },
                        {
                            dataIndex: 'createTime',
                            align: 'center',
                            header: '日期'
                        },
                        {
                            dataIndex: 'num',
                            align: 'center',
                            header: '号码'
                        },
                        {
                            dataIndex: 'operator',
                            align: 'center',
                            header: '操作人',
                            renderer: function(value){
                                return App.util.AppUtil.getRendererValue(value, 'systemUser');
                            }
                        },
                        {
                            dataIndex: 'memo',
                            width: 120,
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
            this.store = App.util.AppUtil.getGridStore('bill.resource.queryOpenIntlFeeHistory', {}, 'App.model.resource.OpenIntlFee');
            this.store.loadPage(1);
        }
        return this.store;
    }
});