Ext.define('App.view.resource.num400.add', {
    extend: 'Ext.window.Window',
    alias: 'widget.addNum400Win',
    width: 400,
    layout: {
        type: 'anchor'
    },
    modal: true,
    title: '添加400号',
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
                                    fieldLabel: '添加类型',
                                    name: 'serviceNumAddType',
                                    xtype: 'radiogroup',
                                    items: [
                                        {
                                            boxLabel: '单个',
                                            name: 'serviceNumAddType',
                                            inputValue: 'single'
                                        },
                                        {
                                            boxLabel: '批量',
                                            name: 'serviceNumAddType',
                                            inputValue: 'all'
                                        }
                                    ],
                                    listeners: {
                                        change: this.serviceAddTypeChange
                                    }
                                }
                            ]
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: '添加',
                    id: 'num400_new_button'
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
    serviceAddTypeChange: function (obj, newValue) {
        var fieldset = obj.up('fieldset');
        while (fieldset.items.items.length > 1) {
            fieldset.remove(fieldset.items.items[fieldset.items.items.length - 1]);
        }
        var items = null;
        var type = newValue.serviceNumAddType;
        if (type.length == 2) {
            return;
        }
        if (type == 'single') {
            items = [
                {
                    xtype: 'textfield',
                    name: 'num400',
                    regex: /^\d{5,14}$/,
                    regexText: '400号码必须为5~14位数字',
                    allowBlank: false,
                    fieldLabel: '400号码'
                },
                {
                    xtype: 'combobox',
                    name: 'owner',
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
                    name: 'min400Consume',
                    decimalPrecision : 4,
                    value : 100,
                    allowBlank: false,
                    fieldLabel: '低消'
                },
                {
                    xtype: 'combobox',
                    name: 'dial400FeeStrategy',
                    allowBlank: false,
                    fieldLabel: '资费策略',
                    editable: false,
                    store: App.util.AppUtil.getDicStore('dialPriceStrategy'),
                    displayField: 'codeName',
                    valueField: 'codeValue',
                    typeAhead: true,
                    queryMode: 'local',
                    listeners :{
                        change:function (obj ,newvalue) {
                            var strategy = newvalue;
                            var panel = obj.up('fieldset').down("#400add_dialFee_detail_panel");
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
//                    layout: "column",
                    border: false,
                    bodyCls: 'backgroud_blue',
                    id: '400add_dialFee_detail_panel',
//                    columnWidth: 1,
                    items: [
                    ]
                },
                {
                    xtype: 'textarea',
                    name: 'memo',
                    maxLength: 70,
                    maxLengthText: '最大长度不得超过70个字！',
                    fieldLabel: '备注'
                }
            ];
        } else if (type == 'all') {
            items = [
                {
                    xtype: 'textfield',
                    fieldLabel: '开始400号',
                    name: 'beginNum',
                    regex: /^\d{5,14}$/,
                    regexText: '服务号必须为5~14位数字',
                    allowBlank: false
                },
                {
                    xtype: 'textfield',
                    fieldLabel: '结束400号',
                    name: 'endNum',
                    regex: /^\d{5,14}$/,
                    regexText: '400号必须为5~14位数字',
                    allowBlank: false

                },
                {
                    xtype: 'combobox',
                    name: 'owner',
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
                    name: 'min400Consume',
                    value : 100,
                    decimalPrecision : 4,
                    allowBlank: false,
                    fieldLabel: '低消'
                },
                {
                    xtype: 'combobox',
                    name: 'dial400FeeStrategy',
                    allowBlank: false,
                    fieldLabel: '资费策略',
                    editable: false,
                    store: App.util.AppUtil.getDicStore('dialPriceStrategy'),
                    displayField: 'codeName',
                    valueField: 'codeValue',
                    typeAhead: true,
                    queryMode: 'local',
                    listeners :{
                        change:function (obj ,newvalue) {
                            var strategy = newvalue;
                            var panel = obj.up('fieldset').down("#400add_dialFee_detail_panel");
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
                                        name: 'remote',
                                        decimalPrecision : 4,
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
//                    layout: "column",
                    border: false,
                    bodyCls: 'backgroud_blue',
                    id: '400add_dialFee_detail_panel',
//                    columnWidth: 1,
                    items: [
                    ]
                }
            ]
        }
        fieldset.add(items);
    }

});
