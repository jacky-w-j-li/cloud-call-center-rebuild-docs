Ext.define('App.view.resource.manualSms.checkUnpassSmsMessageWin', {
    extend: 'Ext.window.Window',
    alias: 'widget.checkUnpassMsgWin',
    width: 400,
    layout: {
        type: 'anchor'
    },
    modal: true,
    data : null,
    title: '添加审核原因',

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
                            title: '审核原因',
                            collapsible: true,
                            defaultType: 'textfield',
                            items: [
                                {
                                    fieldLabel: '审核信息',
                                    name: 'message',
                                    xtype: 'textarea'
                                }
                            ]
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: '执行',
                    id: 'manualSms_check_unpass_message_button'
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
