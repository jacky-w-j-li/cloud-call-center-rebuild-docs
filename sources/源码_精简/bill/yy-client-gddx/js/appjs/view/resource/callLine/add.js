Ext.define('App.view.resource.callLine.add', {
    extend: 'Ext.window.Window',
    alias: 'widget.addLineWindow',
    width: 850,
    layout: {
        type: 'column'
    },
    modal: true,
    title: '新增线路',
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
                        labelWidth: 160,
                        labelAlign: 'right'
                    },
                    items: [
                        {
                            xtype: 'fieldset',
                            title: '线路信息',
                            id:'line_add_info',
                            collapsible: true,
                            defaultType: 'textfield',
                            layout: 'column',
                            cls: 'backgroud_blue',
                            items: [
                                {
                                    fieldLabel: '线路编号',
                                    name: '_id',
                                    columnWidth: .5,
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '名称',
                                    name: 'name',
                                    maxLength: 50,
                                    maxLengthText: '最大长度不能超过50个字符！',
                                    columnWidth: .5,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'combobox',
                                    fieldLabel: '线路类型',
                                    name: 'type',
                                    editable: false,
                                    store: App.util.AppUtil.getDicStore('lineType'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    columnWidth: .34,
                                    allowBlank: false,
                                    listeners: {
                                        change: function (obj, newvalue) {
                                            var strategy = newvalue;
                                            var panel = obj.up('fieldset').down("#line_dialFee_detail_panel");
                                            panel.removeAll();
                                            var items = [];
                                            if (strategy == "internal") {
                                                items=[
                                                    {
                                                        xtype: 'combobox',
                                                        fieldLabel: '本地固话资费策略',
                                                        name: 'dial_localTelStrategy',
                                                        editable: false,
                                                        store: App.util.AppUtil.getDicStore('dialPriceStrategy'),
                                                        displayField: 'codeName',
                                                        valueField: 'codeValue',
                                                        typeAhead: true,
                                                        queryMode: 'local',
                                                        columnWidth: .34,
                                                        allowBlank: false,
                                                        listeners: {
                                                            change: function (obj, newvalue) {
                                                                var strategy = newvalue;
                                                                var panel = obj.up('fieldset').down("#localTelFee_detail_panel");
                                                                panel.removeAll();
                                                                var items = [];
                                                                if (strategy == "minute") {
                                                                    items =[
                                                                        {
                                                                            xtype: 'numberfield',
                                                                            fieldLabel: '资费(元/分钟)',
                                                                            value: 0.07,
                                                                            name: 'dial_localTel',
                                                                            columnWidth: .34,
                                                                            decimalPrecision : 4,
                                                                            minValue: 0,
                                                                            maxValue: 0.3,
                                                                            allowBlank: false
                                                                        }
                                                                    ];
                                                                } else if (strategy == "second6") {
                                                                    items = [
                                                                        {
                                                                            xtype: 'numberfield',
                                                                            fieldLabel: '资费(元/6秒)',
                                                                            value: 0.007,
                                                                            name: 'dial_localTel',
                                                                            columnWidth: .34,
                                                                            decimalPrecision : 4,
                                                                            minValue: 0,
                                                                            maxValue: 0.3,
                                                                            allowBlank: false
                                                                        }
                                                                    ];
                                                                } else if (strategy == "minute3") {
                                                                    items = [
                                                                        {
                                                                            xtype: 'numberfield',
                                                                            fieldLabel: '前3分钟资费(元)',
                                                                            value: 0.2,
                                                                            name: 'dial_localTelPrefix',
                                                                            columnWidth: .34,
                                                                            decimalPrecision : 4,
                                                                            minValue: 0,
                                                                            maxValue: 1,
                                                                            allowBlank: false
                                                                        },
                                                                        {
                                                                            xtype: 'numberfield',
                                                                            fieldLabel: '以后每分钟(元/分钟)',
                                                                            value: 0.1,
                                                                            name: 'dial_localTel',
                                                                            columnWidth: .34,
                                                                            decimalPrecision : 4,
                                                                            minValue: 0,
                                                                            maxValue: 0.3,
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
                                                        id: 'localTelFee_detail_panel',
                                                        columnWidth:.34,
                                                        items:[]
                                                    },

                                                    {
                                                        xtype: 'combobox',
                                                        fieldLabel: '本地手机资费策略',
                                                        name: 'dial_localStrategy',
                                                        editable: false,
                                                        store: App.util.AppUtil.getDicStore('dialPriceStrategy'),
                                                        displayField: 'codeName',
                                                        valueField: 'codeValue',
                                                        typeAhead: true,
                                                        queryMode: 'local',
                                                        columnWidth: .34,
                                                        allowBlank: false,
                                                        listeners: {
                                                            change: function (obj, newvalue) {
                                                                var strategy = newvalue;
                                                                var panel = obj.up('fieldset').down("#localFee_detail_panel");
                                                                panel.removeAll();
                                                                var items = [];
                                                                if (strategy == "minute") {
                                                                    items =[
                                                                        {
                                                                            xtype: 'numberfield',
                                                                            fieldLabel: '资费(元/分钟)',
                                                                            value: 0.07,
                                                                            name: 'dial_local',
                                                                            columnWidth: .34,
                                                                            decimalPrecision : 4,
                                                                            minValue: 0,
                                                                            maxValue: 0.3,
                                                                            allowBlank: false
                                                                        }
                                                                    ];
                                                                } else if (strategy == "second6") {
                                                                    items = [
                                                                        {
                                                                            xtype: 'numberfield',
                                                                            fieldLabel: '资费(元/6秒)',
                                                                            value: 0.007,
                                                                            name: 'dial_local',
                                                                            columnWidth: .34,
                                                                            decimalPrecision : 4,
                                                                            minValue: 0,
                                                                            maxValue: 0.3,
                                                                            allowBlank: false
                                                                        }
                                                                    ];
                                                                } else if (strategy == "minute3") {
                                                                    items = [
                                                                        {
                                                                            xtype: 'numberfield',
                                                                            fieldLabel: '前3分钟资费(元)',
                                                                            value: 0.2,
                                                                            name: 'dial_localPrefix',
                                                                            columnWidth: .34,
                                                                            decimalPrecision : 4,
                                                                            minValue: 0,
                                                                            maxValue: 1,
                                                                            allowBlank: false
                                                                        },
                                                                        {
                                                                            xtype: 'numberfield',
                                                                            fieldLabel: '以后每分钟(元/分钟)',
                                                                            value: 0.1,
                                                                            name: 'dial_local',
                                                                            columnWidth: .34,
                                                                            decimalPrecision : 4,
                                                                            minValue: 0,
                                                                            maxValue: 0.3,
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
                                                        id: 'localFee_detail_panel',
                                                        columnWidth:.34,
                                                        items:[]
                                                    },

                                                    {
                                                        xtype: 'combobox',
                                                        fieldLabel: '长途固话资费策略',
                                                        name: 'dial_remoteTelStrategy',
                                                        editable: false,
                                                        store: App.util.AppUtil.getDicStore('dialPriceStrategy'),
                                                        displayField: 'codeName',
                                                        valueField: 'codeValue',
                                                        typeAhead: true,
                                                        queryMode: 'local',
                                                        columnWidth:.34,
                                                        allowBlank: false,
                                                        listeners: {
                                                            change: function (obj, newvalue) {
                                                                var strategy = newvalue;
                                                                var panel = obj.up('fieldset').down("#remoteTelFee_detail_panel");
                                                                panel.removeAll();
                                                                var items = [];
                                                                if (strategy == "minute") {
                                                                    items =[
                                                                        {
                                                                            xtype: 'numberfield',
                                                                            fieldLabel: '资费(元/分钟)',
                                                                            value: 0.07,
                                                                            name: 'dial_remoteTel',
                                                                            columnWidth: .34,
                                                                            decimalPrecision : 4,
                                                                            minValue: 0,
                                                                            maxValue: 0.3,
                                                                            allowBlank: false
                                                                        }
                                                                    ];
                                                                } else if (strategy == "second6") {
                                                                    items = [
                                                                        {
                                                                            xtype: 'numberfield',
                                                                            fieldLabel: '资费(元/6秒)',
                                                                            value: 0.007,
                                                                            name: 'dial_remoteTel',
                                                                            columnWidth: .34,
                                                                            decimalPrecision : 4,
                                                                            minValue: 0,
                                                                            maxValue: 0.3,
                                                                            allowBlank: false
                                                                        }
                                                                    ];
                                                                } else if (strategy == "minute3") {
                                                                    items = [
                                                                        {
                                                                            xtype: 'numberfield',
                                                                            fieldLabel: '前3分钟资费(元)',
                                                                            value: 0.2,
                                                                            name: 'dial_remoteTelPrefix',
                                                                            columnWidth: .34,
                                                                            decimalPrecision : 4,
                                                                            minValue: 0,
                                                                            maxValue: 1,
                                                                            allowBlank: false
                                                                        },
                                                                        {
                                                                            xtype: 'numberfield',
                                                                            fieldLabel: '以后每分钟(元/分钟)',
                                                                            value: 0.1,
                                                                            name: 'dial_remoteTel',
                                                                            columnWidth: .34,
                                                                            decimalPrecision : 4,
                                                                            minValue: 0,
                                                                            maxValue: 0.3,
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
                                                        id: 'remoteTelFee_detail_panel',
                                                        columnWidth:.34,
                                                        items:[]
                                                    },

                                                    {
                                                        xtype: 'combobox',
                                                        fieldLabel: '长途手机资费策略',
                                                        name: 'dial_remoteStrategy',
                                                        editable: false,
                                                        store: App.util.AppUtil.getDicStore('dialPriceStrategy'),
                                                        displayField: 'codeName',
                                                        valueField: 'codeValue',
                                                        typeAhead: true,
                                                        queryMode: 'local',
                                                        columnWidth:.34,
                                                        allowBlank: false,
                                                        listeners: {
                                                            change: function (obj, newvalue) {
                                                                var strategy = newvalue;
                                                                var panel = obj.up('fieldset').down("#remoteFee_detail_panel");
                                                                panel.removeAll();
                                                                var items = [];
                                                                if (strategy == "minute") {
                                                                    items =[
                                                                        {
                                                                            xtype: 'numberfield',
                                                                            fieldLabel: '资费(元/分钟)',
                                                                            value: 0.07,
                                                                            name: 'dial_remote',
                                                                            columnWidth: .34,
                                                                            decimalPrecision : 4,
                                                                            minValue: 0,
                                                                            maxValue: 0.3,
                                                                            allowBlank: false
                                                                        }
                                                                    ];
                                                                } else if (strategy == "second6") {
                                                                    items = [
                                                                        {
                                                                            xtype: 'numberfield',
                                                                            fieldLabel: '资费(元/6秒)',
                                                                            value: 0.007,
                                                                            name: 'dial_remote',
                                                                            columnWidth: .34,
                                                                            decimalPrecision : 4,
                                                                            minValue: 0,
                                                                            maxValue: 0.3,
                                                                            allowBlank: false
                                                                        }
                                                                    ];
                                                                } else if (strategy == "minute3") {
                                                                    items = [
                                                                        {
                                                                            xtype: 'numberfield',
                                                                            fieldLabel: '前3分钟资费(元)',
                                                                            value: 0.2,
                                                                            name: 'dial_remotePrefix',
                                                                            columnWidth: .34,
                                                                            decimalPrecision : 4,
                                                                            minValue: 0,
                                                                            maxValue: 1,
                                                                            allowBlank: false
                                                                        },
                                                                        {
                                                                            xtype: 'numberfield',
                                                                            fieldLabel: '以后每分钟(元/分钟)',
                                                                            value: 0.1,
                                                                            name: 'dial_remote',
                                                                            columnWidth: .34,
                                                                            decimalPrecision : 4,
                                                                            minValue: 0,
                                                                            maxValue: 0.3,
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
                                                        id: 'remoteFee_detail_panel',
                                                        columnWidth:.34,
                                                        items:[]
                                                    }

                                                ];

                                            }else if(strategy == "international"){
                                                items = [
                                                    {
                                                        xtype: 'numberfield',
                                                        fieldLabel: '港/澳/台(元/分钟)',
                                                        value: 1,
                                                        name: 'intl_fee1',
                                                        columnWidth: .33,
                                                        decimalPrecision : 4,
                                                        minValue: 0,
                                                        allowBlank: false
                                                    },
                                                    {
                                                        xtype: 'numberfield',
                                                        fieldLabel: '美国/加拿大(元/分钟)',
                                                        value: 2,
                                                        name: 'intl_fee2',
                                                        columnWidth: .33,
                                                        decimalPrecision : 4,
                                                        minValue: 0,
                                                        allowBlank: false
                                                    },
                                                    {
                                                        xtype: 'numberfield',
                                                        fieldLabel: '其他地区(元/分钟)',
                                                        value: 3,
                                                        name: 'intl_fee3',
                                                        columnWidth: .33,
                                                        decimalPrecision : 4,
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
                                    layout: "column",
                                    border: false,
                                    bodyCls: 'backgroud_blue',
                                    id: 'line_dialFee_detail_panel',
                                    columnWidth: 1,
                                    items: []
                                },
                                {
                                    fieldLabel: '备注',
                                    name: 'memo',
                                    xtype: 'textarea',
                                    columnWidth: 1
                                }
                            ]
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: '创建',
                    id: 'commit_button'
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