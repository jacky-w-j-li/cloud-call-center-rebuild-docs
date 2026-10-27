Ext.define('App.view.resource.serviceNum.add', {
    extend: 'Ext.window.Window',
    alias: 'widget.addServiceNumWin',
    width: 340,
    layout: {
        type: 'anchor'
    },
    modal: true,
    title: '添加服务号',
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
                    id: 'serviceNum_new_button'
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
                    name: 'serviceNum',
//                    regex: /^0\d{5,14}$/,
//                    regexText: '服务号必须是有区号的5~14位数字',
                    allowBlank: false,
                    fieldLabel: '服务号'
                },
                {
                    fieldLabel: '类型',
                    xtype: 'combobox',
                    name: 'type',
                    editable: false,
                    allowBlank: false,
                    store: App.util.AppUtil.getDicStore('serviceNumType'),
                    displayField: 'codeName',
                    valueField: 'codeValue',
                    columnWidth: .25
                },
                {
                    fieldLabel: '运营商',
                    xtype: 'combobox',
                    name: 'sp',
                    editable: false,
                    allowBlank: false,
                    store: App.util.AppUtil.getDicStore('spType'),
                    displayField: 'codeName',
                    valueField: 'codeValue',
                    columnWidth: .25
                },
                {
                    xtype: 'numberfield',
                    decimalPrecision : 4,
                    name: 'monthRent',
                    maxValue: 100000,
                    value : 50,
                    validator:function(value){
                        var minValue=Ext.getCmp("minValue_2");
                        if(this.getValue()<minValue.getValue()){
                            return "不能小于代理月租"+minValue.getValue();
                        }else {
                            return true;
                        }
                    },
                    allowBlank: false,
                    fieldLabel: '月租'
                },
                {
                    xtype: 'numberfield',
                    name: 'monthRentProxy',
                    id:"minValue_2",
                    decimalPrecision : 4,
                    value : 15,
                    maxValue: 100000,
                    allowBlank: false,
                    fieldLabel: '代理月租'
                },
                {
                    fieldLabel: '机柜',
                    xtype: 'combobox',
                    name: 'board',
                    editable: false,
                    allowBlank: false,
                    store: App.util.AppUtil.getDicStore('board',true),
                    displayField: 'codeName',
                    valueField: 'codeValue',
                    columnWidth: .25
                },
                {
                    fieldLabel: '绑定400号',
                    xtype: 'combobox',
                    name: 'bind400',
                    editable: true,
                    store: App.util.AppUtil.getDicStore('serviceNum400',true),
                    displayField: 'codeName',
                    valueField: 'codeValue',
                    columnWidth: .25
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
                    fieldLabel: '开始服务号',
                    name: 'beginServiceNum',
//                    regex: /^0\d{5,14}$/,
//                    regexText: '服务号必须是有区号的5~14位数字',
                    allowBlank: false
                },
                {
                    xtype: 'textfield',
                    fieldLabel: '结束服务号',
                    name: 'endServiceNum',
//                    regex: /^0\d{5,14}$/,
//                    regexText: '服务号必须是有区号的5~14位数字',
                    allowBlank: false

                },
                {
                    fieldLabel: '类型',
                    xtype: 'combobox',
                    name: 'type',
                    editable: false,
                    allowBlank: false,
                    store: App.util.AppUtil.getDicStore('serviceNumType'),
                    displayField: 'codeName',
                    valueField: 'codeValue',
                    columnWidth: .25
                },
                {
                    fieldLabel: '运营商',
                    xtype: 'combobox',
                    name: 'sp',
                    editable: false,
                    allowBlank: false,
                    store: App.util.AppUtil.getDicStore('spType'),
                    displayField: 'codeName',
                    valueField: 'codeValue',
                    columnWidth: .25
                },
                {
                    xtype: 'numberfield',
                    name: 'monthRent',
                    decimalPrecision : 4,
                    value : 50,
                    maxValue: 100000,
                    validator:function(value){
                        var minValue=Ext.getCmp("minValue_3");
                        if(this.getValue()<minValue.getValue()){
                            return "不能小于代理月租"+minValue.getValue();
                        }else {
                            return true;
                        }
                    },
                    allowBlank: false,
                    fieldLabel: '月租'
                },
                {
                    xtype: 'numberfield',
                    name: 'monthRentProxy',
                    id:"minValue_3",
                    decimalPrecision : 4,
                    value : 15,
                    maxValue: 100000,
                    allowBlank: false,
                    fieldLabel: '代理月租'
                },
                {
                    fieldLabel: '机柜',
                    xtype: 'combobox',
                    name: 'board',
                    editable: false,
                    allowBlank: false,
                    store: App.util.AppUtil.getDicStore('board',true),
                    displayField: 'codeName',
                    valueField: 'codeValue',
                    columnWidth: .25
                },
                {
                    fieldLabel: '绑定400号',
                    xtype: 'combobox',
                    name: 'bind400',
                    editable: true,
                    store: App.util.AppUtil.getDicStore('serviceNum400',true),
                    displayField: 'codeName',
                    valueField: 'codeValue',
                    columnWidth: .25
                }
            ]
        }
        fieldset.add(items);
    }
});
