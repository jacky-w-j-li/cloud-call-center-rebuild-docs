Ext.define('App.view.account.account.deductionFee', {
    extend: 'Ext.window.Window',
    alias: 'widget.deductionFeeWin',
    width: 340,
    layout: {
        type: 'anchor'
    },
    modal: true,
    account: null,
    title: '扣费',
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
                            title: '扣费信息',
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
                                    fieldLabel: "扣费金额(元)",
                                    value: 0,
                                    maxValue: 100000,
                                    minValue:0.01,
                                    decimalPrecision : 4,
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '类型',
                                    xtype: 'combobox',
                                    name: 'userPayType',
                                    editable : false,
                                    store: App.util.AppUtil.getDicStore('userPayType',true,{group:'deduct'}),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    allowBlank:false
                                },
                                {
                                    fieldLabel: '备注',
                                    name: 'memo',
                                    xtype: 'textarea',
                                    allowBlank:false
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