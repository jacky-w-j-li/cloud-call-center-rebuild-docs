Ext.define('App.view.account.query.telRecord', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.telRecordQueryPanel',
    requires: ['App.model.account.TelRecord'],
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
                            title: '话单查询',
                            collapsible: true,
                            layout: 'column',
                            defaultType: 'textfield',
                            items: [
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '账户编号',
                                    name: 'account',
                                    columnWidth: .33
                                },
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '主叫号码',
                                    name: 'cid',
                                    columnWidth: .33
                                },
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '被叫号码',
                                    name: 'did',
                                    columnWidth: .33
                                },
                                {
                                    fieldLabel: '呼叫时间',
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
                    title: '话单列表',
                    margin: '10 ',
                    class: 'query',
                    forceFit: true,
                    loadMask: true,
                    store: this.getDataStore(),
                    columnLines: true,
                    columns: [
                        {
                            dataIndex: 'account',
                            align: 'center',
                            header: '账户编号'
                        },
                        {
                            dataIndex: "accountObj",
                            align: 'center',
                            header: '公司名称',
                            renderer : function(value) {
                                return value.companyName;
                            }
                        },
                        {
                            dataIndex: 'cid',
                            align: 'center',
                            header: '主叫号码'
                        },
                        {
                            dataIndex: 'did',
                            align: 'center',
                            header: '被叫号码'
                        },
                        {
                            dataIndex: 'beginTimeDisplay',
                            header: '开始时间',
                            align: 'center'
                        },
                        {
                            dataIndex: 'endTimeDisplay',
                            header: '结束时间',
                            align: 'center'
                        },
                        {
                            dataIndex: 'seconds6',
                            align: 'center',
                            header: '通话时长(6秒)'
                        },
                        {
                            dataIndex: 'minutes',
                            align: 'center',
                            header: '通话时长(分)'
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
            this.store = App.util.AppUtil.getGridStore('bill.account.query.queryTelRecord', {}, 'App.model.account.TelRecord');
            this.store.loadPage(1);
        }
        return this.store;
    }
});