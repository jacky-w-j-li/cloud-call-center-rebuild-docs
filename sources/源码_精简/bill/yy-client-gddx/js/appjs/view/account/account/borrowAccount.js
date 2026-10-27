Ext.define('App.view.account.account.borrowAccount', {
    extend: 'Ext.window.Window',
    alias: 'widget.borrowAccountWin',
    width: 340,
    layout: {
        type: 'anchor'
    },
    modal: true,
    account: null,
    title: '账户拆借',
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
                            title: '拆借信息',
                            collapsible: true,
                            defaultType: 'textfield',
                            items: [
                                {
                                    name: "account",
                                    value: this.account,
                                    hidden: true
                                },
                                {
                                    fieldLabel: '账户名称',
                                    id : "borrow_account_name",
                                    name: 'name',
                                    maxLength: 50,
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '公司名称',
                                    name : "companyName",
                                    cls :"field_disable_cls",
                                    readOnly : true,
                                    allowBlank: false
                                },
                                {
                                    xtype: "numberfield",
                                    name: "borrowMoney",
                                    fieldLabel: "拆借金额(元)",
                                    value: 0,
                                    minValue:0,
                                    decimalPrecision : 4,
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