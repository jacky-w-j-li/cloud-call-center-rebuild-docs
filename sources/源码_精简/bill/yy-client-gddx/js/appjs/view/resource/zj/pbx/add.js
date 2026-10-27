Ext.define('App.view.resource.zj.pbx.add', {
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
                                    allowBlank: false,
                                    value: '.0',
                                    regex: /^\S+\.\d+$/,
                                    regexText: '请填写合法的实例ID',
                                },
                                {
                                    fieldLabel: '实例名称',
                                    name: 'name',
                                    maxLength: 50,
                                    maxLengthText: '最大长度不能超过50个字符！',
                                    allowBlank: false,
                                    value: '.0',
                                    regex: /^\S+\.\d+$/,
                                    regexText: '请填写合法的实例名称',
                                },
                                {
                                    fieldLabel: 'ass地址',
                                    name: 'assAddr',
                                    allowBlank: false,
                                    value: 'http://',
                                    regex: /^http:\/\/(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).*$/,
                                    regexText: '请填写合法的地址',
                                },
                                {
                                    fieldLabel: 'config地址',
                                    name: 'configAddr',
                                    allowBlank: false,
                                    value: 'http://:7789',
                                    regex: /^http:\/\/(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?):\d+$/,
                                    regexText: '请填写合法的地址',
                                },
                                {
                                    fieldLabel: 'sip地址',
                                    name: 'sipAddr',
                                    allowBlank: false,
                                    value: ':6060',
                                    regex: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?):\d+$/,
                                    regexText: '请填写合法的地址',
                                },
                                {
                                    fieldLabel: 'sip加密地址',
                                    name: 'encryptSipAddr',
                                    allowBlank: false,
                                    value: ':6070',
                                    regex: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?):\d+$/,
                                    regexText: '请填写合法的地址',
                                },
                                {
                                    fieldLabel: '路由ip',
                                    name: 'routeIp',
                                    allowBlank: false,
                                    value: '',
                                    regex: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
                                    regexText: '请填写合法的地址',
                                },
                                {
                                    fieldLabel: '路由port',
                                    name: 'routePort',
                                    allowBlank: false,
                                    value: '6060',
                                    regex: /^\d+$/,
                                    regexText: '请填写合法的端口',
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
                    text: '批量创建',
                    id: 'batch_create_new_pbx_button',
                },
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
