Ext.define('App.view.account.query.costRecord2Cust', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.costRecord2CustPanel',
    requires: ['App.model.account.CostRecord2Cust'],
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
                            title: '消费查询',
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
                                    fieldLabel: '用途',
                                    name: 'flag',
                                    editable: false,
                                    store: this.getFlagStore(),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    columnWidth: .25
                                },
                                {
                                    fieldLabel: '消费时间',
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
                                    xtype: 'textfield',
                                    fieldLabel: '账户编号',
                                    name: 'account',
                                    columnWidth: .25
                                },
                                {
                                    fieldLabel: '所属代理',
                                    xtype: 'combobox',
                                    name: 'proxy',
                                    store: App.util.AppUtil.getDicStore('systemUser'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    columnWidth: .25,
                                    hidden:App.util.AppUtil.isHideWidget(),
                                    editable:true
                                },
                                {
                                    xtype: 'combobox',
                                    fieldLabel: '产品',
                                    name: 'product',
                                    editable: false,
                                    store: App.util.AppUtil.getDicStore('productType'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
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
                    title: '消费列表',
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
                                    iconCls: 'find_icon_cls',
                                    text: '查询',
                                    id: 'customer_cost_find_tool',
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
                            header: '流水号'
                        },
//                        {
//                            dataIndex: 'account',
//                            align: 'center',
//                            header: '账户编号'
//                        },
                        {
                            dataIndex: 'product',
                            align: 'center',
                            header: '产品',
                            renderer : function(value){
                                return App.util.AppUtil.getRendererValue(value,"productType");
                            }
                        },
                        {
                            dataIndex: 'accountName',
                            align: 'center',
                            header: '账户名称'
                        },
                        {
                            dataIndex: 'proxy',
                            align: 'center',
                            header: '所属代理',
                            renderer : function(value){
                                return App.util.AppUtil.getRendererValue(value,"systemUser");
                            },
                            //hidden:App.util.AppUtil.isHideWidget()
                        },
                        {
                            dataIndex: 'flag',
                            align: 'center',
                            header: '用途',
                            renderer : function(value){
                                return App.util.AppUtil.getRendererValue(value,"userPayType");
                            }
                        },
                        {
                            dataIndex: 'payType',
                            align: 'center',
                            header: '支付方式',
                            renderer : function(value){
                                return App.util.AppUtil.getRendererValue(value,"payType");
                            }
                        },
                        {
                            dataIndex: 'pay_time',
                            align: 'center',
                            header: '消费时间'
                        },
                        {
                            dataIndex: 'totalFee',
                            header: '消费金额(元)',
                            align: 'center'
                        },
//                        {
//                            dataIndex: 'sn',
//                            align: 'center',
//                            header: '明细',
//                            renderer : function(obj){
//                                var row=arguments[2].raw;
//                                var flag=row.flag;
//                                var totalFee=parseFloat(row.totalFee);
//                                var rate=parseFloat(obj.callMinutes)||2;
//                                var outCallPrice=parseFloat(obj.outCallPrice);
//                                var dialMins=totalFee*rate;
//                                var content='';
//                                if(flag=='buySn'){
//                                    content="购买时长"+obj.month+"个月,并发数"+obj.concurrent+"个,赠送外呼时长"+dialMins+"分钟";
//                                }else if(flag=='snRenew'){
//                                    content="续费时长"+obj.month+"个月,赠送外呼时长"+dialMins+"分钟";
//                                }else if(flag=='buyConcurrent'){
//                                    content="新增并发数"+obj.concurrent+"个,赠送外呼时长"+dialMins+"分钟";
//                                }else if(flag=='buyDialMin'){
//                                    content="购买外呼时长"+(totalFee/outCallPrice)+"分钟";
//                                }
//                                return content;
//                            }
//                        },
                        {
                            dataIndex: 'income',
                            header: '收入(元)',
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
    getFlagStore: function () {
        var store=App.util.AppUtil.getDicStore('userPayType');
        store.filter("codeValue", /^(?!pay).+$/);
        return store;
    },
    getDataStore: function () {
        if (this.store === null) {
            this.store = App.util.AppUtil.getGridStore('bill.account.queryCostRecord', {}, 'App.model.account.CostRecord2Cust');
            this.store.loadPage(1);
        }
        return this.store;
    }
});