Ext.define('App.view.account.account.supplementDeductionMinConsume', {
    extend: 'Ext.window.Window',
    alias: 'widget.supplementDeductionMinConsumeWin',
    width: 340,
    layout: {
        type: 'anchor'
    },
    account: null,
    monthId:null,
    companyName:null,
    ductionMoney:null,
    calloutLicence:null,
    calloutMinute:null,
    title: '补扣低消',
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
                            title: '补扣低消信息',
                            collapsible: true,
                            defaultType: 'textfield',
                            items: [
                                //{
                                //    xtype: 'displayfield',
                                //    fieldLabel: '',
                                //    name: '',
                                //    value: '<span class="withDraw_display">补扣金额=最低消费-实际消费</span>'
                                //},
                                {
                                    name: "account",
                                    value: this.account,
                                    hidden: true
                                },
                                {
                                    name: "calloutLicence",
                                    value: this.calloutLicence,
                                    hidden: true
                                },
                                {
                                    name: "calloutMinute",
                                    value: this.calloutMinute,
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
                                    //xtype: "numberfield",
                                    fieldLabel: '补扣金额(元)',
                                    cls :"field_disable_cls",
                                    readOnly : true,
                                    name : "ductionMoney",
                                    value:me.ductionMoney/10000,
                                    allowBlank: false
                                    //minValue:0,
                                    //maxValue:me.minConsume
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