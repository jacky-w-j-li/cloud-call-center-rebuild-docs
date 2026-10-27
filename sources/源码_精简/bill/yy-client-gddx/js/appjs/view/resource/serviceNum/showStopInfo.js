Ext.define('App.view.resource.serviceNum.showStopInfo', {
    extend: 'Ext.window.Window',
    alias: 'widget.showStopInfoWindow',
    width: 340,
    layout: {
        type: 'anchor'
    },
    modal: true,
    accountName:'',
    id:'',
    data: null,
    title: '停用号码信息',
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
                                    name: '_id',
                                    fieldLabel: '服务号',
                                    value: this.id,
                                    readOnly : true
                                },

                                {
                                    fieldLabel: '当前使用账号',
                                    value: this.accountName,
                                    readOnly : true
                                },
                                {
                                    fieldLabel: '上次使用账号',
                                    value: this.lastAccountName,
                                    readOnly : true
                                }
                            ]
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: '释放',
                    id: 'btn_free_stop_serviceNum'
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
