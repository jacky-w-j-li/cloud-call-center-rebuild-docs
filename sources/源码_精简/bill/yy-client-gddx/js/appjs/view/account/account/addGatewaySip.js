Ext.define('App.view.account.account.addGatewaySip', {
    extend: 'Ext.window.Window',
    alias: 'widget.addGatewaySip',
    width: 340,
    layout: {
        type: 'anchor'
    },
    modal: true,
    account: null,
    title: '新增账户网关sip号',

    initComponent: function () {
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
                            title: 'sip号信息',
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
                                    name: "number",
                                    fieldLabel: "数量",
                                    value: 1,
                                    maxValue: 10000,
                                    minValue: 1,
                                    allowBlank: false
                                },
                                {
                                    xtype: "checkboxgroup",
                                    name : "ruleConfig",
                                    columns: 1,
                                    fieldLabel: "是否连续",
                                    items: [
                                        {
                                            boxLabel: '',
                                            name: 'successional',
                                            inputValue: true,
                                            checked: true
                                        }
                                    ]
                                },
                                {
                                    xtype: "checkboxgroup",
                                    name : "codeConfig",
                                    columns: 3,
                                    fieldLabel: "编码",
                                    allowBlank : false,
                                    items: [
                                        {
                                            boxLabel: 'G729',
                                            name: 'code',
                                            inputValue: "G729",
                                            checked: true
                                        },
                                        {
                                            boxLabel: 'alaw',
                                            name: 'code',
                                            inputValue: "alaw"
                                        },
                                        {
                                            boxLabel: 'ulaw',
                                            name: 'code',
                                            inputValue: "ulaw"
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: '创建',
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