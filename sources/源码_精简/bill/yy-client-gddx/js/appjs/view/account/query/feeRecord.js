Ext.define('App.view.account.query.feeRecord', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.feeRecordQueryPanel',
    requires: ['App.model.account.FeeRecord'],
    layout: {
        type: 'anchor'
    },
    store: null,
    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            items: [
                {
                    xtype: 'tabpanel',
                    activeTab: 0,
                    items: [
                        {
                            xtype: 'panel',
                            frame: true,
                            id: 'proxy_fee_panel',
                            title: '代理充值',
                            items:this.getItems()
                        },
                        {
                            xtype: 'panel',
                            frame: true,
                            id: 'customer_fee_panel',
                            title: '客户充值',
                            items: []
                        }
                    ]
                }
            ]
        });

        me.callParent(arguments);

    },
    getItems:function(){
        var items = new Array();
        var form={
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
                    title: '充值查询',
                    collapsible: true,
                    layout: 'column',
                    defaultType: 'textfield',
                    items: [
                        {
                            xtype: 'textfield',
                            fieldLabel: '流水号',
                            name: '_id',
                            columnWidth: .25
                        },
                        {
                            xtype: 'combobox',
                            fieldLabel: '充值类型',
                            name: 'flag',
                            editable: false,
                            store: App.util.AppUtil.getDicStore('userPayType'),
                            displayField: 'codeName',
                            valueField: 'codeValue',
                            columnWidth: .25
                        },
                        {
                            fieldLabel: '充值时间',
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
                            fieldLabel: '代理',
                            xtype: 'combobox',
                            name: 'proxy',
                            store: App.util.AppUtil.getDicStore('systemUser'),
                            displayField: 'codeName',
                            valueField: 'codeValue',
                            typeAhead: true,
                            queryMode: 'local',
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
        };
        items.push(form);

        var grid={
            xtype: 'gridpanel',
            title: '充值列表',
            margin: '10 ',
            class: 'query',
            forceFit: true,
            loadMask: true,
            features: [{
                ftype: 'summary'
            }],
            store: this.getDataStore(),
            columnLines: true,
            columns: [
                {
                    dataIndex: '_id',
                    align: 'center',
                    header: '流水号'
                },
                {
                    dataIndex: 'proxy',
                    align: 'center',
                    header: '代理',
                    renderer : function(value){
                        return App.util.AppUtil.getRendererValue(value,"systemUser");
                    },
                    hidden:App.util.AppUtil.isHideWidget()
                },
                {
                    dataIndex: 'flag',
                    align: 'center',
                    header: '充值类型',
                    renderer : function(value){
                        return App.util.AppUtil.getRendererValue(value,"userPayType");
                    }
                },
                {
                    dataIndex: 'bank',
                    align: 'center',
                    header: '支付方式',
                    renderer : function(value){
                        return App.util.AppUtil.getRendererValue(value,"payBank");
                    }
                },
                {
                    dataIndex: 'pay_time',
                    align: 'center',
                    header: '充值时间',
                },
                {
                    dataIndex: 'money',
                    header: '充值金额(元)',
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

        };
        items.push(grid);

        return items;
    },
    getDataStore: function () {
        if (this.store === null) {
            this.store = App.util.AppUtil.getGridStore('bill.account.query.queryProxyFeeRecord', {}, 'App.model.account.FeeRecord');
            this.store.loadPage(1);
        }

        //总计
        var thisPanel = this;
        this.store.on({ 'load': function (store, records, successful) {
            var rawData = store.getProxy().getReader().rawData;
            var totalFee = rawData.totalFee;
            var pagingToolbar = thisPanel.down('gridpanel').down('pagingtoolbar');
            if(thisPanel.summary){
                pagingToolbar.remove(thisPanel.summary);
            };

            thisPanel.summary = new Ext.panel.Panel({
                html: '<span style="background-color:#dfe9f6;border-color:#dfe9f6;font-size:11px;">' + '总金额:' + totalFee + '元</span>',
            });
            pagingToolbar.add(thisPanel.summary);
        }});

        return this.store;
    }
});