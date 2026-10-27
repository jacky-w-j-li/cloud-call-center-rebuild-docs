Ext.define('App.view.account.user.updateUserInfo', {
    extend: 'Ext.window.Window',
    alias: 'widget.updateUserInfoWindow',
    width: 340,
    layout: {
        type: 'anchor'
    },
    modal: true,
    data: null,
    title: '用户信息',
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
                            title: '用户信息',
                            collapsible: true,
                            defaultType: 'textfield',
                            items: [
                                {
                                    name: '_id',
                                    value: this.data._id,
                                    hidden: true
                                },
                                {
                                    fieldLabel: '工号',
                                    name: 'exten',
                                    value: this.data.exten,
                                    readOnly : true
                                },
                                {
                                    fieldLabel: '用户姓名',
                                    name: 'displayName',
                                    value: this.data.displayName,
                                    maxLength: 30,
                                    maxLengthText: '最大长度不能超过30个字符！',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '密码',
                                    name: 'password',
                                    value: this.data.password,
                                    maxLength: 50,
                                    maxLengthText: '最大长度不能超过50个字符！',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '手机',
                                    name: 'mobile',
                                    value: this.data.mobile
                                },
                                {
                                    fieldLabel: '邮箱',
                                    name: 'email',
                                    value: this.data.email
                                }
                            ]
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: '保存',
                    id: 'update_user_button'
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