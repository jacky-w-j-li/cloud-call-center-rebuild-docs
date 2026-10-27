Ext.define('App.view.resource.pbx.add', {
    extend: 'Ext.window.Window',
    alias: 'widget.addPbxWindow',
    width: 400,
    layout: {
        type: 'anchor'
    },
    modal: true,

    title: '新增pbx',

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
                        labelAlign: 'right',
                        width : 300
                    },
                    items: [
                        {
                            xtype: 'fieldset',
                            title: 'pbx信息',
                            collapsible: true,
                            defaultType: 'textfield',
                            items: [
                                {
                                    fieldLabel: '实例id',
                                    name: '_id',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '实例名称',
                                    name: 'name',
                                    maxLength: 50,
                                    maxLengthText: '最大长度不能超过50个字符！',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: 'ass地址',
                                    name: 'assAddr',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: 'config地址',
                                    name: 'configAddr',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: 'sip地址',
                                    name: 'sipAddr',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: 'sip加密地址',
                                    name: 'encryptSipAddr',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '路由ip',
                                    name: 'routeIp',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '路由port',
                                    name: 'routePort',
                                    allowBlank: false
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
                                    fieldLabel: '备注',
                                    name: 'memo',
                                    xtype: 'textarea'
                                }
                            ]
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: '创建',
                    id: 'create_new_pbx_button'
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