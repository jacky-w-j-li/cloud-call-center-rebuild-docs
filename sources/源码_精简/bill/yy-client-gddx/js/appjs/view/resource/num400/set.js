Ext.define('App.view.resource.num400.set', {
    extend: 'Ext.window.Window',
    alias: 'widget.setNum400InfoWindow',
    width: 500,
    layout: {
        type: 'anchor'
    },
    modal: true,
    data: null,
    title: '400信息',
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
                        labelWidth: 150,
                        labelAlign: 'right'
                    },
                    items: [
                        {
                            xtype: 'fieldset',
                            title: '400号信息',
                            collapsible: true,
                            defaultType: 'textfield',
                            items: [
                                {
                                    name: '_id',
                                    fieldLabel: '400号',
                                    value: this.data._id,
                                    readOnly: true
                                },
                                {
                                    xtype: 'combobox',
                                    name: 'owner',
                                    value : this.data.owner,
                                    fieldLabel: '所属代理',
                                    editable:true,
                                    store: App.util.AppUtil.getDicStore('proxy'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local'
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '低消',
                                    decimalPrecision : 4,
                                    name: 'min400Consume',
                                    value: this.data.min400Consume,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '话费折扣(元/分钟)',
                                    decimalPrecision : 4,
                                    name: 'discount',
                                    value: this.data.discount||0,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '并发',
                                    decimalPrecision : 0,
                                    name: 'concurrent',
                                    value: this.data.concurrent || -1,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'combobox',
                                    name: 'dial400FeeStrategy',
                                    allowBlank: false,
                                    fieldLabel: '资费策略',
                                    value: this.data.dial400FeeStrategy,
                                    editable: false,
                                    store: App.util.AppUtil.getDicStore('dialPriceStrategy400'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    listeners: {
                                        change: function (obj, newvalue) {
                                            var strategy = newvalue;
                                            var panel = obj.up('fieldset').down("#400set_dialFee_detail_panel");
                                            panel.removeAll();
                                            var items = [];
                                            if (strategy == "minute") {
                                                items = [
                                                    {
                                                        xtype: 'numberfield',
                                                        fieldLabel: '市话(元/分钟)',
                                                        value: 0.07,
                                                        decimalPrecision : 4,
                                                        name: 'local',
                                                        minValue: 0,
                                                        allowBlank: false
                                                    },
                                                    {
                                                        xtype: 'numberfield',
                                                        fieldLabel: '长途(元/分钟)',
                                                        value: 0.08,
                                                        decimalPrecision : 4,
                                                        name: 'remote',
                                                        msgTarget: 'side',
                                                        minValue: 0,
                                                        allowBlank: false
                                                    }
                                                ];
                                            } else if (strategy == "second6") {
                                                items = [

                                                    {
                                                        xtype: 'numberfield',
                                                        fieldLabel: '市话(元/6秒)',
                                                        value: 0.007,
                                                        decimalPrecision : 4,
                                                        name: 'local',
                                                        minValue: 0,
                                                        allowBlank: false
                                                    },
                                                    {
                                                        xtype: 'numberfield',
                                                        fieldLabel: '长途(元/6秒)',
                                                        value: 0.007,
                                                        decimalPrecision : 4,
                                                        name: 'remote',
                                                        minValue: 0,
                                                        allowBlank: false
                                                    }
                                                ];

                                            } else if (strategy == "minute3") {
                                                items = [
                                                    {
                                                        xtype: 'numberfield',
                                                        fieldLabel: '本地前3分钟资费(元)',
                                                        value: 0.2,
                                                        decimalPrecision : 4,
                                                        name: 'prefixMin',
                                                        minValue: 0,
                                                        allowBlank: false
                                                    },
                                                    {
                                                        xtype: 'numberfield',
                                                        fieldLabel: '本地以后每分钟(元/分钟)',
                                                        value: 0.1,
                                                        decimalPrecision : 4,
                                                        name: 'local',
                                                        minValue: 0,
                                                        allowBlank: false
                                                    },
                                                    {
                                                        xtype: 'numberfield',
                                                        fieldLabel: '长途(元/分钟)',
                                                        value: 0.12,
                                                        decimalPrecision : 4,
                                                        name: 'remote',
                                                        minValue: 0,
                                                        allowBlank: false
                                                    }
                                                ];
                                            }
                                            panel.add(items);
                                        }
                                    }
                                },
                                {
                                    xtype: 'panel',
                                    border: false,
                                    bodyCls: 'backgroud_blue',
                                    id: '400set_dialFee_detail_panel',
                                    items: this.getCurrentFeeItem(this.data.dial400FeeStrategy)
                                },
//                                {
//                                    fieldLabel: '绑定服务号',
//                                    name: 'bindNum',
//                                    value: this.data.bindNum
//                                },
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
                    id: 'set_num400_button'
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
    },
    getCurrentFeeItem: function (strategy) {
        var feeItem = [];
        this.data.dial400Fee = this.data.dial400Fee || {};
        if (strategy == "minute") {
            feeItem = [
                {
                    xtype: 'numberfield',
                    fieldLabel: '市话(元/分钟)',
                    value: this.data.dial400Fee.local,
                    name: 'local',
                    minValue: 0,
                    decimalPrecision : 4,
                    allowBlank: false
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: '长途(元/分钟)',
                    value: this.data.dial400Fee.remote,
                    name: 'remote',
                    decimalPrecision : 4,
                    msgTarget: 'side',
                    minValue: 0,
                    allowBlank: false
                }
            ];
        } else if (strategy == "second6") {
            feeItem = [
                {
                    xtype: 'numberfield',
                    fieldLabel: '市话(元/6秒)',
                    value: this.data.dial400Fee.local,
                    name: 'local',
                    decimalPrecision : 4,
                    minValue: 0,
                    allowBlank: false
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: '长途(元/6秒)',
                    value: this.data.dial400Fee.remote,
                    name: 'remote',
                    decimalPrecision : 4,
                    minValue: 0,
                    allowBlank: false
                }
            ];
        } else if (strategy == 'minute3') {
            feeItem = [
                {
                    xtype: 'numberfield',
                    fieldLabel: '本地前3分钟资费(元)',
                    value: this.data.dial400Fee.prefixMin,
                    name: 'prefixMin',
                    decimalPrecision : 4,
                    minValue: 0,
                    allowBlank: false
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: '本地以后每分钟(元/分钟)',
                    value: this.data.dial400Fee.local,
                    name: 'local',
                    decimalPrecision : 4,
                    minValue: 0,
                    allowBlank: false
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: '长途(元/分钟)',
                    value: this.data.dial400Fee.remote,
                    name: 'remote',
                    decimalPrecision : 4,
                    minValue: 0,
                    allowBlank: false

                }
            ]
        }

        return feeItem;
    }

});
