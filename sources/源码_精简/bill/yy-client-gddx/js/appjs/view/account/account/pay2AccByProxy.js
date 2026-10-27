Ext.define('App.view.account.account.pay2AccByProxy', {
    extend: 'Ext.window.Window',
    alias: 'widget.pay2AccByProxyWin',
    width: 340,
    layout: {
        type: 'anchor'
    },
    modal: true,
    account: null,
    title: '给账号充值',

    initComponent: function() {
        var me = this;
        Ext.applyIf(me, {
            items: [
                {
                    xtype: 'form',
                    frame: true,
                    title: '',
                    bodyStyle: 'padding:2px 2px 0',
                    fieldDefaults: {
                        msgTarget: 'side',
                        labelWidth: 90,
                        labelAlign: 'right'
                    },
                    items: [
                        {
                            xtype: 'fieldset',
                            title: '充值信息',
                            collapsible: true,
                            defaultType: 'textfield',
                            items: [
                                {
                                    name: "account",
                                    value: this.account,
                                    hidden: true
                                },
                                {
                                    xtype: "numberfield",
                                    name: "money",
                                    fieldLabel: "金额(元)",
                                    decimalPrecision : 4,
                                    value: 1,
                                    maxValue: App.util.AppUtil.formatTrueFee(gloab_client_user.balance+(gloab_client_user.overdraw||0)),
                                    minValue: 1,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'displayfield',
                                    fieldLabel: '可支付余额(元)',
                                    name:'balance',
                                    value: App.util.AppUtil.formatTrueFee(gloab_client_user.balance+(gloab_client_user.overdraw||0)),
                                    id:'proxy_balance'
                                },
                                {
                                    xtype: 'displayfield',
                                    fieldLabel: '实际余额(元)',
                                    name:'actualBalance',
                                    value: App.util.AppUtil.formatTrueFee(gloab_client_user.balance)
                                },
                                {
                                    xtype: 'displayfield',
                                    fieldLabel: '透支额度(元)',
                                    name:'overdraw',
                                    value: App.util.AppUtil.formatTrueFee(gloab_client_user.overdraw||0)
                                }
                            ]
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: '确认',
                    class: 'submit'
                },
                {
                    text: '关闭',
                    handler: function (obj) {
                        var win = obj.up('window');
                        win.close();
                    }
                }
            ]
        });
        me.callParent(arguments);
    }

});