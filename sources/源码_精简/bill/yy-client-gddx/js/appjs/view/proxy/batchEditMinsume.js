Ext.define('App.view.proxy.batchEditMinsume', {
    extend: 'Ext.window.Window',
    alias: 'widget.batchEditMinWindow',
    width: 340,
    layout: {
        type: 'anchor'
    },
    modal: true,
    account: null,
    title: '统一编辑低消费用',
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
                            title: '编辑',
                            collapsible: true,
                            defaultType: 'textfield',
                            items: [
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '金额(元)',
                                    name: 'money',
                                    id:"batch_edit_min_text",
                                    minValue: 0,
                                    allowBlank: false
                                }
                            ]
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: '确认',
                    id: 'btn_batch_edit_min'
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
