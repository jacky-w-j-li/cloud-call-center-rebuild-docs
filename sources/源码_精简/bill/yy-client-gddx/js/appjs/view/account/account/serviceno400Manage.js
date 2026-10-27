Ext.define('App.view.account.account.serviceno400Manage', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.serviceno400QueryPanel',
    requires: ['App.model.resource.Num400'],
    layout: {
        type: 'anchor'
    },
    store: null,
    accountId:null,
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
                                    name: 'account',
                                    value:this.accountId,
                                    hidden:true
                                },
                                {
                                    fieldLabel: '号码',
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
                    title: '400列表',
                    margin: '',
                    class: 'query',
                    forceFit: true,
                    loadMask: true,
                    store: this.getDataStore(this.accountId),
                    columnLines: true,
                    dockedItems: [
                        {
                            xtype: 'toolbar',
                            class: 'dock',
                            items: [
                                {
                                    iconCls: 'set_icon_cls',
                                    text: '设置',
                                    id: 'btn_400_set_tool',
                                    disabled: true,
                                    needSelect: true,
                                    hidden:App.util.AppUtil.hasLimit("account_set_400")
                                }
                            ]
                        }
                    ],
                    columns: [
                        {
                            dataIndex: '_id',
                            width: 120,
                            align: 'center',
                            header: '400'
                        },
                        {
                            dataIndex: 'product',
                            header: '所属产品',
                            align: 'center',
                            renderer:function(value){
                                var desc="";
                                if(value=='cc'){
                                    desc='呼叫中心';
                                }else if(value=='zj'){
                                    desc="企业总机";
                                }
                                return desc;
                            }
                        },
                        {
                            dataIndex: 'min400Consume',
                            header: '低消(元)',
                            align: 'center',
                            renderer:function(value){
                                return App.util.AppUtil.formatTrueFee(value);
                            }
                        },
                        {
                            dataIndex: 'dial400FeeStrategy',
                            width: 90,
                            align: 'center',
                            header: '资费策略',
                            renderer: function (value) {
                                return App.util.AppUtil.getRendererValue(value, 'dialPriceStrategy');
                            }
                        },
                        {
                            dataIndex: 'status',
                            header: '状态',
                            align: 'center',
                            renderer:function(value){
                                return App.util.AppUtil.getRendererValue(value,"serviceNumStatus");
                            }
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
                        store: this.getDataStore(this.accountId),
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
    getDataStore: function (account) {
        if (this.store === null) {
            this.store = App.util.AppUtil.getGridStore('bill.account.querySet400ServiceNoList', {account:account}, 'App.model.resource.Num400');
            this.store.loadPage(1);
        }
        return this.store;
    }
});