Ext.define('App.view.account.account.stopAccount', {
    extend: 'Ext.window.Window',
    alias: 'widget.stopAccountWindow',
    width: 340,
    layout: {
        type: 'anchor'
    },
    modal: true,
    account: null,
    title: '停用账户',
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
                            title: '信息',
                            collapsible: true,
                            defaultType: 'textfield',
                            items: [
//                                {
//                                    xtype: 'label',
//                                    html: '<p><strong style="color: red;">停用账号会释放其所占用的所有资源，如服务号，sip号</strong></p>'
//                                },
                                {
                                    name: '_id',
                                    value: this.account.get('_id'),
                                    hidden: true
                                },
                                {
                                    fieldLabel: '停用原因',
                                    name: 'stopReason',
                                    xtype: 'textarea',
                                    allowBlank:false
                                },
                                {
                                    name: 'currSatus',
                                    hidden: true,
                                    value: this.account.get('status'),
                                }
                            ]
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: '确认',
                    id: 'btn_stop_account'
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
