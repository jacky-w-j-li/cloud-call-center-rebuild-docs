Ext.define('App.view.account.query.feeRecord2Cust', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.feeRecord2CustPanel',
    requires: ['App.model.account.FeeRecord2Cust'],
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
                                    xtype: 'textfield',
                                    fieldLabel: '账户编号',
                                    name: 'account',
                                    columnWidth: .25
                                },
                                {
                                    xtype: 'combobox',
                                    fieldLabel: '所属人',
                                    name: 'proxy',
                                    //editable: false,
                                    store: this.getCreateUserStore(),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    columnWidth: .25,
                                    //hidden:App.util.AppUtil.isHideWidget()
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
                                    id:"btn_export_fee_cust",
                                    width: 90,
                                    text: '导出'
                                }

                            ]
                        }
                    ]
                },
                {
                    xtype: 'gridpanel',
                    title: '充值列表',
                    margin: '10 ',
                    class: 'query',
                    forceFit: true,
                    loadMask: true,
                    store: this.getDataStore(),
                    features: [{
                        ftype: 'summary'
                    }],
                    columnLines: true,
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
                            dataIndex: 'accountName',
                            align: 'center',
                            header: '账户名称'
                        },
                        {
                            dataIndex: 'accCompanyName',
                            align: 'center',
                            header: '公司名称'
                        },
                        {
                            dataIndex: 'createUser',
                            align: 'center',
                            header: '代理',
                            //hidden:App.util.AppUtil.isHideWidget(),
                            renderer : function(value){
                                var dic = App.util.AppUtil.getDicCache("proxy");
                                if (dic) {
                                    for (var i = 0; i < dic.length; i++) {
                                        if (value == dic[i].codeValue) {
                                            return dic[i].codeName;
                                            break;
                                        }
                                    }
                                    return "";
                                } else {
                                    return "";
                                }
                            }
                        },
                        {
                            dataIndex: 'product',
                            align: 'center',
                            header: '产品',
                            renderer : function(value){
                                return App.util.AppUtil.getRendererValue(value,"productType");
                            }
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
            this.store = App.util.AppUtil.getGridStore('bill.account.query.queryFeeRecord', {}, 'App.model.account.FeeRecord2Cust');
            this.store.loadPage(1);

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

        }
        return this.store;
    },
    getCreateUserStore: function(){
        if(gloab_client_user.identity == 'proxy'){
            var store =  App.util.AppUtil.getDicStore('proxyUserAllLower',true,{userId:gloab_client_user._id});
            return store;
        }
        return App.util.AppUtil.getDicStore('systemUser');
    },
});