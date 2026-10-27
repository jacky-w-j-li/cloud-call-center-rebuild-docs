Ext.define('App.view.account.account.revocationMinConsume', {
    extend: 'Ext.window.Window',
    alias: 'widget.revocationMinConsumeWin',
    width: 340,
    layout: {
        type: 'anchor'
    },
    account: null,
    monthId:null,
    companyName:null,
    refundMoney:null,
    title: '撤销低消',
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
                            title: '撤销低消信息',
                            collapsible: true,
                            defaultType: 'textfield',
                            items: [
                                {
                                    name: "account",
                                    value: this.account,
                                    hidden: true
                                },
                                {
                                    name: "monthId",
                                    value: this.monthId,
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
                                    fieldLabel: '撤销金额(元)',
                                    cls :"field_disable_cls",
                                    readOnly : true,
                                    name : "refundMoney",
                                    value:me.refundMoney/10000,
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