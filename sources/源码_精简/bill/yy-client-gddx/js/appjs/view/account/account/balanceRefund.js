Ext.define('App.view.account.account.balanceRefund', {
    extend: 'Ext.window.Window',
    alias: 'widget.balanceRefundWin',
    width: 340,
    layout: {
        type: 'anchor'
    },
    modal: true,
    account: null,
    _id:null,
    companyName:null,
    refundMoney:null,
    createUser:null,
    title: '清退余额',
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
                            title: '清退信息',
                            collapsible: true,
                            defaultType: 'textfield',
                            items: [
                                {
                                    name: "account",
                                    value: this.account,
                                    hidden: true
                                },
                                {
                                    name: "createUser",
                                    value: this._id,
                                    hidden: true
                                },
                                {
                                    fieldLabel: '公司名称',
                                    name : "companyName",
                                    cls :"field_disable_cls",
                                    readOnly : true,
                                    value:me.companyName,
                                    allowBlank: false
                                },
                                {
                                    xtype: "numberfield",
                                    fieldLabel: '清退金额(元)',
                                    name : "refundMoney",
                                    value:me.refundMoney/10000,
                                    allowBlank: false,
                                    minValue:0,
                                    maxValue:me.refundMoney/10000
                                },
                                {
                                    fieldLabel: '去向',
                                    name : "direction",
                                    cls :"field_disable_cls",
                                    readOnly : true,
                                    value:me.createUser,
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