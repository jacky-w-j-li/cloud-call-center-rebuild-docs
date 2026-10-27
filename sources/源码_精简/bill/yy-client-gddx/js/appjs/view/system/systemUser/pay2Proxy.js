Ext.define('App.view.system.systemUser.pay2Proxy', {
    extend: 'Ext.window.Window',
    alias: 'widget.pay2ProxyWin',
    width: 340,
    layout: {
        type: 'anchor'
    },
    modal: true,
    uid: null,
    title: '给代理充值',
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
                                    name: "_id",
                                    value: this.uid,
                                    hidden: true
                                },
                                {
                                    xtype: "numberfield",
                                    name: "money",
                                    fieldLabel: "金额(元)",
                                    value: 0,
                                    maxValue: 100000,
                                    decimalPrecision : 4,
//                                    minValue: 1,
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '备注',
                                    name: 'memo',
                                    xtype: 'textarea',
                                    allowBlank: false
                                }
                            ]
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: '确认',
                    id:"btn_save_pay_proxy",
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