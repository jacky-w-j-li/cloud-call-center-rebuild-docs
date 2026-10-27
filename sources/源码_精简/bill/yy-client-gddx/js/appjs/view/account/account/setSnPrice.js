Ext.define('App.view.account.account.setSnPrice', {
    extend: 'Ext.window.Window',
    alias: 'widget.setSnPriceWindow',
    width: 340,
    layout: {
        type: 'anchor'
    },
    modal: true,
    data: null,
    title: '号码信息',
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
                            title: '服务号信息',
                            collapsible: true,
                            defaultType: 'textfield',
                            items: [
                                {
                                    name: '_id',
                                    fieldLabel: '服务号',
                                    value: this.data._id,
                                    readOnly : true
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '月租',
                                    name: 'monthRent',
                                    decimalPrecision : 4,
                                    value: App.util.AppUtil.formatTrueFee(this.data.monthRent),
                                    minValue:App.util.AppUtil.formatTrueFee(this.data.monthRentProxy),
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '备注',
                                    name: 'memo',
                                    value: this.data.memo,
                                    xtype: 'textarea'
                                }
                            ]
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: '保存',
                    id: 'btn_set_sn_price'
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
