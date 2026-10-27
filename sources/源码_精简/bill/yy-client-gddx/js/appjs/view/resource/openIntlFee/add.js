Ext.define('App.view.resource.openIntlFee.add', {
    extend: 'Ext.window.Window',
    alias: 'widget.addIntlFee',
    width: 340,
    layout: {
        type: 'anchor'
    },
    modal: true,
    title: '开通国际长途',
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
                            title: '开通信息',
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
                                            inputValue: 'single',
                                            checked : true
                                        }
                                        //,
                                        //{
                                        //    boxLabel: '批量',
                                        //    name: 'serviceNumAddType',
                                        //    inputValue: 'all'
                                        //}
                                    ],
                                    listeners: {
                                        change: this.serviceAddTypeChange
                                    }
                                },
                                {
                                    xtype: 'textfield',
                                    name: 'num',
                //                    regex: /^0\d{5,14}$/,
                //                    regexText: '服务号必须是有区号的5~14位数字',
                                    allowBlank: false,
                                    fieldLabel: '服务号'
                                },
                                {
                                    xtype: 'textarea',
                                    name: 'memo',
                                    maxLength: 70,
                                    maxLengthText: '最大长度不得超过70个字！',
                                    fieldLabel: '备注'
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
                    name: 'num',
//                    regex: /^0\d{5,14}$/,
//                    regexText: '服务号必须是有区号的5~14位数字',
                    allowBlank: false,
                    fieldLabel: '服务号'
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
                    xtype: 'textarea',
                    name: 'memo',
                    maxLength: 70,
                    maxLengthText: '最大长度不得超过70个字！',
                    fieldLabel: '备注'
                }
            ]
        }
        fieldset.add(items);
    }
});
