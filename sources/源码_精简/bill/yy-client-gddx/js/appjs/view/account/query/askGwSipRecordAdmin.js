Ext.define('App.view.account.query.askGwSipRecordAdmin', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.askGwSipRecordAdminPanel',
    requires: ['App.model.system.AskGwSipRecord'],
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
                            title: '查询',
                            collapsible: true,
                            layout: 'column',
                            defaultType: 'textfield',
                            items: [
                                {
                                    fieldLabel: '流水号',
                                    name: '_id',
                                    columnWidth: .25
                                },

                                {
                                    fieldLabel: '状态',
                                    xtype: 'combobox',
                                    name: 'status',
                                    editable: false,
                                    store: App.util.AppUtil.getDicStore('withdrawStatus'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    columnWidth: .25
                                },
                                {
                                    fieldLabel: '申请时间',
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
                                },
                                {
                                    xtype: 'combobox',
                                    store: App.util.AppUtil.getDicStore('systemUser'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    fieldLabel: '代理用户',
                                    name: 'uid',
                                    columnWidth: .25,
                                    hidden:App.util.AppUtil.isHideWidget()
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
                    title: '列表',
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
                                    text: '完成',
                                    id: 'finish_asksip_tool',
                                    disabled: true,
                                    needSelect: true
                                }
                            ],
                            hidden:App.util.AppUtil.isHideWidget()
                        }
                    ],
                    columns: [
                        {
                            header: '流水号',
                            dataIndex: '_id',
                            columnWidth: .25,
                            align: 'center'
                        },
                        {
                            dataIndex: 'uid',
                            header: '代理用户',
                            align: 'center',
                            renderer: function(value){
                                return App.util.AppUtil.getRendererValue(value, 'systemUser');
                            },
                            hidden:App.util.AppUtil.isHideWidget()
                        },
                        {
                            dataIndex: 'account',
                            align: 'center',
                            header: '账户编号'
                        },
                        {
                            dataIndex: 'createTime',
                            align: 'center',
                            header: '申请时间'
                        },
                        {
                            dataIndex: 'num',
                            header: '申请数量',
                            align: 'center'
                        },
                        {
                            dataIndex: 'isFax',
                            header: '是否接传真',
                            align: 'center',
                            renderer: function(value){
                                if(value){
                                    return '是';
                                }else{
                                    return '否';
                                }
                            }
                        },
                        {
                            header: '状态',
                            dataIndex: 'status',
                            align: 'center',
                            renderer: function(value){
                                return App.util.AppUtil.getRendererValue(value, 'withdrawStatus');
                            }
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
            this.store = App.util.AppUtil.getGridStore('bill.systemUser.queryAskGwSip', {}, 'App.model.system.AskGwSipRecord');
            this.store.loadPage(1);
        }
        return this.store;
    }
});