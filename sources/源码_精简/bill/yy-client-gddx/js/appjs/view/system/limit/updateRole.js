Ext.define('App.view.system.limit.updateRole', {
    extend: 'Ext.window.Window',
    alias: 'widget.updateSystemRoleWindow',
    width: 340,
    layout: {
        type: 'anchor'
    },
    modal: true,
    title: '修改系统角色',
    data : null,

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
                            title: '系统角色信息',
                            collapsible: true,
                            defaultType: 'textfield',
                            items: [
                                {
                                    name : "_id",
                                    hidden:true,
                                    value : this.data._id
                                },
                                {
                                    fieldLabel: '角色名称',
                                    name: 'name',
                                    value : this.data.name,
                                    maxLength: 50,
                                    maxLengthText: '最大长度不能超过50个字符！',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '描述',
                                    name: 'desc',
                                    value : this.data.desc,
                                    xtype: 'textarea'
                                }
                            ]
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: '修改',
                    id: 'update_role_button'
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
