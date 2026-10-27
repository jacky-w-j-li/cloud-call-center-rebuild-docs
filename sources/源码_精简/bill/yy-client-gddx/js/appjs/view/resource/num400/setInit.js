Ext.define('App.view.resource.num400.setInit', {
    extend: 'Ext.window.Window',
    alias: 'widget.setNum400InitWindow',
    width: 400,
    layout: {
        type: 'anchor'
    },
    modal: true,
    data: null,
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
                                    xtype: 'numberfield',
                                    fieldLabel: '低消',
                                    name: 'min400Consume',
                                    decimalPrecision : 4,
                                    value: this.data.initFee.min400Consume,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '代理低消',
                                    decimalPrecision : 4,
                                    name: 'min400ConsumeProxy',
                                    value: this.data.initFee.min400ConsumeProxy,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'combobox',
                                    name: 'dial400FeeStrategy',
                                    allowBlank: false,
                                    fieldLabel: '资费策略',
                                    value: this.data.initFee.dial400FeeStrategy,
                                    editable: false,
                                    store: this.getDialPriceStrategy(),
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
                                    items: this.getCurrentFeeItem(this.data.initFee.dial400FeeStrategy)
                                }
                            ]
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: '保存',
                    id: 'set_num400_init_button'
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
        if (strategy == "minute") {
            feeItem = [
                {
                    xtype: 'numberfield',
                    fieldLabel: '市话(元/分钟)',
                    value: this.data.initFee.dial400Fee.local,
                    name: 'local',
                    decimalPrecision : 4,
                    minValue: 0,
                    allowBlank: false
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: '长途(元/分钟)',
                    value: this.data.initFee.dial400Fee.remote,
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
                    value: this.data.initFee.dial400Fee.local,
                    name: 'local',
                    decimalPrecision : 4,
                    minValue: 0,
                    allowBlank: false
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: '长途(元/6秒)',
                    value: this.data.initFee.dial400Fee.remote,
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
                    value: this.data.initFee.dial400Fee.prefixMin,
                    name: 'prefixMin',
                    decimalPrecision : 4,
                    minValue: 0,
                    allowBlank: false
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: '本地以后每分钟(元/分钟)',
                    value: this.data.initFee.dial400Fee.local,
                    name: 'local',
                    decimalPrecision : 4,
                    minValue: 0,
                    allowBlank: false
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: '长途(元/分钟)',
                    value: this.data.initFee.dial400Fee.remote,
                    name: 'remote',
                    decimalPrecision : 4,
                    minValue: 0,
                    allowBlank: false

                }
            ]
        }

        return feeItem;
    },
    getDialPriceStrategy: function () {
        var store=App.util.AppUtil.getDicStore('dialPriceStrategy400');
//        store.filter("codeValue", 'minute3s6');
//        store.filterBy(
//            function(rec,id){
//                var val=rec.get("codeValue");
//                if(val == 'minute3s6'){
//                    return false;
//                }else {
//                    return true;
//                }
//            }
//        )
        return store;
    }


});
