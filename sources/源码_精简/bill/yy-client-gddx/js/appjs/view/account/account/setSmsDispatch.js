Ext.define('App.view.account.account.setSmsDispatch', {
    extend: 'Ext.window.Window',
    alias: 'widget.setSmsDispatchWindow',
    width: 350,
    layout: {
        type: 'anchor'
    },
    modal: true,
    productModel:null,
    title: '短信推送设置',
    data: null,
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
                    items: this.getDispatch()
                }
            ],
            buttons: [
                {
                    text: '保存',
                    id: 'saveProductSmsDispatch'
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
    getDispatch : function(){
        var items = [];
        var fieldset = {
            xtype: 'fieldset',
            title: '短信推送设置',
            collapsible: true,
            defaultType: 'textfield',
            items : [
                {
                    xtype : 'textfield',
                    name: '_id',
                    value: this.productModel.get("_id"),
                    hidden: true
                },
                {
                    xtype:"checkbox",
                    fieldLabel: '开启短信推送',
                    name: 'open_sms_dispatch',
                    checked:this.productModel.get("open_sms_dispatch")
                },
                {
                    fieldLabel: '推送地址',
                    name: 'sms_dispatch_url',
                    value: this.productModel.get("sms_dispatch_url"),
                }
            ]
        };
        items.push(fieldset);
        return items;
    }
});
