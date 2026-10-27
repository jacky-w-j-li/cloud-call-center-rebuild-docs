Ext.define('App.view.system.systemUser.callEvent2Proxy', {
    extend: 'Ext.window.Window',
    alias: 'widget.callEvent2ProxyWin',
    width: 340,
    layout: {
        type: 'anchor'
    },
    modal: true,
    uid: null,
    callEventUrl:"",
    title: '事件地址配置',
    initComponent: function() {
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
                            title: '事件信息',
                            collapsible: true,
                            defaultType: 'textfield',
                            items: [
                                {
                                    name: "_id",
                                    value: this.uid,
                                    hidden: true
                                },
                                {
                                    fieldLabel: '地址',
                                    name: 'callEventUrl',
                                    regex: /^http/,
                                    regexText: '请输入正确的格式！',
//                                    allowBlank: false,
                                    value:this.callEventUrl
                                }
                            ]
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: '确认',
                    id:"btn_save_callEvent_proxy",
                    class: 'submit'
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