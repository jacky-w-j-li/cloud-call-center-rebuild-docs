Ext.require('App.view.MultiComboBox');
Ext.define('App.view.account.account', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.accountQueryPanel',
    requires: ['App.model.account.Account'],
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
                            title: '账户查询',
                            id:'account_query_field',
                            collapsible: true,
                            layout: 'column',
                            defaultType: 'textfield',
                            items: [
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '账户编号',
                                    name: '_id',
                                    columnWidth: .25
                                },
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '登录名',
                                    name: 'name',
                                    columnWidth: .25
                                },
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '企业名称',
                                    name: 'companyName',
                                    columnWidth: .25
                                },
                                {
                                    fieldLabel: '账户状态',
                                    xtype: 'combobox',
                                    name: 'status',
                                    editable: false,
                                    store: App.util.AppUtil.getDicStore('accountStatus'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    columnWidth: .25
                                },
                                {
                                    fieldLabel: '账户来源',
                                    xtype: 'combobox',
                                    name: 'createMethod',
                                    editable: false,
                                    store: App.util.AppUtil.getDicStore('accountOrigin'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    columnWidth: .25,
                                    hidden:App.util.AppUtil.isHideWidget()
                                },
                                {
                                    fieldLabel: '账户类型',
                                    xtype: 'combobox',
                                    name: 'accountType',
                                    store: App.util.AppUtil.getDicStore('accountType'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    columnWidth: .25
                                },
                                {
                                    fieldLabel: '创建人',
                                    xtype: 'combobox',
                                    name: 'createUser',
                                    store: this.getCreateUserStore(),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    columnWidth: .25,
                                    //hidden:App.util.AppUtil.isHideWidget()
                                },

                                {
                                    fieldLabel: '客户经理',
                                    xtype: 'combobox',
                                    name: 'customerCare',
                                    store: App.util.AppUtil.getDicStore('systemUser'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    columnWidth: .25,
                                    hidden:App.util.AppUtil.isHideWidget()
                                },
                                {
                                    fieldLabel: '技术顾问',
                                    xtype: 'combobox',
                                    name: 'consultant',
                                    store: App.util.AppUtil.getDicStore('systemUser'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    columnWidth: .25,
                                    hidden:App.util.AppUtil.isHideWidget()
                                },
                             /*   {
                                    fieldLabel: '业务标记',
                                    xtype: 'combobox',
                                    name: 'businessTag',
                                    store: App.util.AppUtil.getDicStore('businessTag'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    columnWidth: .25,
                                    hidden:App.util.AppUtil.isHideWidget()
                                },*/
                                {
                                    xtype:'multicombobox',
                                    columnWidth :.25,
                                    fieldLabel : '业务标记',
                                    name: 'businessTag',
                                    store : App.util.AppUtil.getDicStore('businessTag'),
                                    triggerAction: 'all',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    displayField: "codeName",
                                    valueField: "codeValue",
                                    editable: true,
                                    multiSelect:true,
                                    hidden:App.util.AppUtil.isHideWidget()

                                },
                                {
                                    fieldLabel: '余额低于',
                                    xtype: 'numberfield',
                                    name: 'balanceCeiling',
                                    columnWidth:.25,
                                },
                                {
                                    fieldLabel: '创建日期',
                                    xtype: 'datefield',
                                    format: 'Y-m-d',
                                    name: 'createTimeBegin',
                                    columnWidth: .15
                                },
                                {
                                    xtype: 'label',
                                    text: '⤑',
                                    columnWidth: .01
                                },
                                {
                                    xtype: 'datefield',
                                    format: 'Y-m-d',
                                    name: 'createTimeEnd',
                                    hideLabel: true,
                                    columnWidth: .09
                                },
                                {
                                    fieldLabel: '行业',
                                    xtype: 'combobox',
                                    store: App.util.AppUtil.getDicStore('industry'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    columnWidth: .25,
                                    name: 'industry',
                                },
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '财务账户编号',
                                    name: 'financeAccount',
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
                    title: '账户列表',
                    margin: '10 ',
                    class: 'query',
                    id:'account_query_grid',
                    forceFit: true,
                    loadMask: true,
                    store: this.getDataStore(),
                    columnLines: true,
                    dockedItems: [
                        {
                            xtype: 'toolbar',
                            class: 'dock',
                            autoScroll:true,
                            items: [
                                {
                                    xtype: 'buttongroup',
                                    columns: 13,
                                    floatable:true,
                                    defaults: {
                                        scale: 'small'
                                    },
                                    style:{width:'100%'},
                                    items:[
                                        {
                                            iconCls: 'add_icon_cls',
                                            text: '添加账户',
                                            id: 'addTryAccount_tool',
                                            needSelect: false,
                                            hidden : App.util.AppUtil.hasLimit("account_account_add")
                                        },
                                        {
                                            iconCls: 'edit_icon_cls',
                                            text: '修改',
                                            id: 'accountInfo_tool',
                                            disabled: true,
                                            needSelect: true,
                                            hidden : App.util.AppUtil.hasLimit("account_account_update")
                                        },
                                        {
                                            iconCls: 'set_icon_cls',
                                            text: '停用',
                                            id: 'accountStop_tool',
                                            disabled: true,
                                            needSelect: true,
                                            hidden : App.util.AppUtil.hasLimit("account_account_stop")
                                        },
                                        {
                                            iconCls: 'set_icon_cls',
                                            text: '重开',
                                            id: 'accountReopen_tool',
                                            disabled: true,
                                            needSelect: true,
                                            hidden : App.util.AppUtil.hasLimit("account_account_reopen")
                                        },
                                        {
                                            iconCls: 'set_icon_cls',
                                            text: '设置',
                                            id: 'accountSet_tool',
                                            disabled: true,
                                            needSelect: true,
                                            hidden : App.util.AppUtil.hasLimit("account_account_set")
                                        },
                                        {
                                            iconCls: 'find_icon_cls',
                                            text: '查询',
                                            id: 'accountFind_tool',
                                            disabled: true,
                                            needSelect: true,
                                            hidden : App.util.AppUtil.hasLimit("account_account_find")
                                        },
                                        {
                                            iconCls: 'count_icom_cls',
                                            text: '产品',
                                            id: 'product_tool',
                                            disabled: true,
                                            needSelect: true,
                                            hidden : App.util.AppUtil.hasLimit("account_account_product")
                                        },
//                                {
//                                    iconCls: 'add_icon_cls',
//                                    text: '添加网关sip',
//                                    id: 'addGatewaySip_tool',
//                                    disabled: true,
//                                    needSelect: true,
//                                    hidden:App.util.AppUtil.isHideWidget()
//                                },
//                                {
//                                    iconCls: 'email_go_cls',
//                                    text: '申请网关sip',
//                                    id: 'askGatewaySip_tool',
//                                    disabled: true,
//                                    needSelect: true,
//                                    hidden:App.util.AppUtil.isHideWidget(1)
//                                },
                                        {
                                            iconCls: 'set_icon_cls',
                                            text: '充值',
                                            id: 'accountPay_tool',
                                            disabled: true,
                                            needSelect: true,
                                            hidden : App.util.AppUtil.hasLimit("account_account_recharge")
                                        },
                                        {
                                            iconCls: 'set_icon_cls',
                                            text: '扣费',
                                            id: 'accountDeduction_tool',
                                            disabled: true,
                                            needSelect: true,
                                            hidden : App.util.AppUtil.hasLimit("account_account_deduction")
                                        },
                                        {
                                            iconCls: 'set_icon_cls',
                                            text: '短信备案',
                                            id: 'smsSign_tool',
                                            disabled: true,
                                            needSelect: true,
                                            hidden : App.util.AppUtil.hasLimit("account_account_smsSign")
                                        },
                                        {
                                            iconCls: 'set_icon_cls',
                                            text: '业务标记',
                                            id: 'businessTag_tool',
                                            disabled: true,
                                            needSelect: true,
                                            hidden : App.util.AppUtil.hasLimit("account_account_businessTag")
                                        },
                                        {
                                            iconCls: 'link_go_cls',
                                            text: '跳转到用户中心',
                                            id: 'redirect_ucenter',
                                            disabled: true,
                                            needSelect: true,
                                            hidden : App.util.AppUtil.hasLimit("account_account_redirect")
                                        },
                                        {
                                            iconCls: 'link_go_cls',
                                            text: '跳转到呼叫中心',
                                            id: 'redirect_cc',
                                            disabled: true,
                                            needSelect: true,
                                            hidden : App.util.AppUtil.hasLimit("account_cc_redirect")
                                        },
                                        {
                                            iconCls: 'link_go_cls',
                                            text: '跳转到云客服',
                                            id: 'redirect_cc_in',
                                            disabled: true,
                                            needSelect: true,
                                            hidden : App.util.AppUtil.hasLimit("account_cc_in_redirect")
                                        },
                                        {
                                            iconCls: 'link_go_cls',
                                            text: '跳转到云电销',
                                            id: 'redirect_cc_out',
                                            disabled: true,
                                            needSelect: true,
                                            hidden : App.util.AppUtil.hasLimit("account_cc_out_redirect")
                                        },
                                        {
                                            iconCls: 'set_icon_cls',
                                            text: '拆借',
                                            id: 'borrow_tool',
                                            disabled: true,
                                            needSelect: true,
                                            hidden : App.util.AppUtil.hasLimit("account_account_borrow")
                                        },
                                        {
                                            iconCls: 'set_icon_cls',
                                            text: '绑定财务账户',
                                            id: 'bind_finance_account',
                                            disabled: true,
                                            needSelect: true,
                                            hidden : App.util.AppUtil.hasLimit("account_bind_finance_account")
                                        },
                                        {
                                            iconCls: 'set_icon_cls',
                                            text: '解绑财务账户',
                                            id: 'unbind_finance_account',
                                            disabled: true,
                                            needSelect: true,
                                            hidden : App.util.AppUtil.hasLimit("account_unbind_finance_account")
                                        },
                                        {
                                            iconCls: 'set_icon_cls',
                                            text: '返还代理充值',
                                            id: 'refund_tool',
                                            disabled: true,
                                            needSelect: true,
                                            hidden : App.util.AppUtil.hasLimit("account_balance_refund")
                                        },
                                        {
                                            iconCls: 'set_icon_cls',
                                            text: '补扣低消',
                                            id: 'supplementDectuct_minConsume_tool',
                                            disabled: true,
                                            needSelect: true,
                                            hidden : App.util.AppUtil.hasLimit("account_deduct_cc_minConsume")
                                        },
                                        {
                                            iconCls: 'set_icon_cls',
                                            text: '撤销低消',
                                            id: 'revocation_minConsume_tool',
                                            disabled: true,
                                            needSelect: true,
                                            hidden : App.util.AppUtil.hasLimit("account_backout_cc_minConsume")
                                        },
                                        {
                                            iconCls: 'set_icon_cls',
                                            text: '退费',
                                            id: 'account_turnBalance_tool',
                                            disabled: true,
                                            needSelect: true,
                                            hidden : App.util.AppUtil.hasLimit("account_account_turnBalance")
                                        },
                                   /*     {
                                            iconCls: 'set_icon_cls',
                                            text: '设置拨号次数',
                                            id: 'account_call_sum_tool',
                                            disabled: true,
                                            needSelect: true,
                                            hidden:App.util.AppUtil.isHide2()
                                        },
                                        {
                                            iconCls: 'set_icon_cls',
                                            text: '开放号码拨号限制',
                                            id: 'open_call_sum_tool',
                                            disabled: true,
                                            needSelect: true,
                                            hidden:App.util.AppUtil.isHide2()
                                        },
                                        {
                                            iconCls: 'set_icon_cls',
                                            text: '开放账户拨号限制',
                                            id: 'open_account_call_sum_tool',
                                            disabled: true,
                                            needSelect: true,
                                            hidden:App.util.AppUtil.isHide2()
                                        },*/
                                    ]
                                }
                            ]
                        }
                    ],

                    columns: [
                        {
                            dataIndex: '_id',
                            width: 120,
                            align: 'center',
                            header: '账户编号'
                        },
                        {
                            dataIndex: 'name',
                            width: 90,
                            align: 'center',
                            header: '账户名称'
                        },
                        {
                            dataIndex: 'accountType',
                            width: 80,
                            align: 'center',
                            header: '类型',
                            renderer : function(value , mate , row){
                                if (!value){
                                    return '普通账户';
                                }
                                value = value || "";
                                var randerValue = App.util.AppUtil.getRendererValue(value, 'accountType');
                                if (value == randerValue) {
                                    return "错误类型";
                                }
                                else {
                                    return randerValue;
                                }
                            }
                        },
                        {
                            dataIndex: 'companyName',
                            header: '公司名称',
                            align: 'center',
                            width: 180
                        },
                        {
                            dataIndex: 'createMethod',
                            align: 'center',
                            header: '账号来源',
                            renderer: function(value , mate , row){
                                if(value == 'www'){
                                    var origin = App.util.AppUtil.getRendererValue(value, 'accountOrigin');
                                    var area = App.util.AppUtil.getRendererValue(row.data.area || "", 'wwwArea');
                                    return origin+"(" + area + ")";
                                } else {
                                    return App.util.AppUtil.getRendererValue(value, 'accountOrigin');
                                }
                            },
                            hidden:App.util.AppUtil.isHideWidget()
                        },
                        {
                            dataIndex: 'businessTag',
                            header: '业务标记',
                            align: 'center',
                            renderer : function(value , mate , row){
                                value = value || [];
                                var result = "";
                                for(var i in value){
                                    result += App.util.AppUtil.getRendererValue(value[i], 'businessTag');
                                    result += ","
                                }
                                if(result.length > 1){
                                    result= result.substring(0,result.length -1);
                                }
                                return result;
                            }
                        },
                        {
                            dataIndex: 'subIndustry',
                            align: 'center',
                            header: '行业',
                            renderer : function(value , mate , row){
                                value = value || "";
                                return App.util.AppUtil.getRendererValue(value, 'industry');
                            }
                        },
                        {
                            dataIndex: 'createUser',
                            align: 'center',
                            header: '创建人',
                            renderer: function(value,meta,row){
                                var realProxy = row.raw.realProxy;
                                if(realProxy){
                                    value = realProxy;
                                }
                                return App.util.AppUtil.getRendererValue(value, 'systemUser');
                            }
                            //,
                            //hidden:App.util.AppUtil.isHideWidget()
                        },
                        {
                            dataIndex: 'customerCare',
                            align: 'center',
                            header: '客户经理',
                            renderer: function(value){
                                return App.util.AppUtil.getRendererValue(value, 'systemUser');
                            },
                            hidden:App.util.AppUtil.isHideWidget()
                        },
                        {
                            dataIndex: 'consultant',
                            align: 'center',
                            header: '技术顾问',
                            renderer: function(value){
                                return App.util.AppUtil.getRendererValue(value, 'systemUser');
                            },
                            hidden:App.util.AppUtil.isHideWidget()
                        },
                        {
                            dataIndex: 'status',
                            align: 'center',
                            header: '状态',
                            renderer: function(value){
                                return App.util.AppUtil.getRendererValue(value, 'accountStatus');
                            }
                        },
                        {
                            dataIndex: 'balance',
                            align: 'center',
                            header: '余额(元)',
                            renderer: function(value){
                                var balance = value/10000 || 0;
                                return Math.round(balance*100)/100;
                            }
                        },
                        {
                            dataIndex: 'totalPay',
                            align: 'center',
                            header: '累计充值(元)',
                            renderer: function(value){
                                var totalPay = value/10000 || 0;
                                return Math.round(totalPay*100)/100;
                            }
                        },
                        {
                            dataIndex: 'totalConsume',
                            align: 'center',
                            header: '累计消费(元)',
                            renderer: function(value){
                                var totalConsume = value/10000 || 0;
                                return Math.round(totalConsume*100)/100;
                            }
                        },
                        {
                            dataIndex: 'createTime',
                            header: '创建日期',
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
            this.store = App.util.AppUtil.getGridStore('bill.account.queryAccount', {}, 'App.model.account.Account');
            this.store.loadPage(1);

            var thisPanel = this;
            this.store.on({ 'load': function (store, records, successful) {
                var rawData = store.getProxy().getReader().rawData;
                var prepay = App.util.AppUtil.formatTrueFee(rawData.prepay);
                var due = App.util.AppUtil.formatTrueFee(rawData.due);

                var pagingToolbar = thisPanel.down('gridpanel').down('pagingtoolbar');
                if(thisPanel.summary){
                    pagingToolbar.remove(thisPanel.summary);
                };

                thisPanel.summary = new Ext.panel.Panel({
                    width: 600,
                    height:30,
                    border:0,
                    bodyStyle: 'background-color:#99bce8;margin-left:200px',
                    layout: {
                        type: 'hbox',
                        align: 'middle',
                        pack: 'center',
                    },
                    items: [{
                        xtype: 'label',
                        text: '预收款: ' + prepay +'元',
                        margins: '0 0 0 10'
                    },{
                        xtype: 'label',
                        text: '应收款: ' + due +'元',
                        margins: '0 0 0 10'
                    }]
                });

                pagingToolbar.insert(11,thisPanel.summary);
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
