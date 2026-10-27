Ext.define('App.view.account.account.setProductMinConsume', {
    extend: 'Ext.window.Window',
    alias: 'widget.setProductMinConsumeWindow',
    width: 340,
    layout: {
        type: 'anchor'
    },
    modal: true,
    title: '低消设置',
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
                    items: this.getMinConsumeItems()
                }
            ],
            buttons: [
                {
                    text: '保存',
                    id: 'btn_save_product_minConsume'
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
    getMinConsumeItems : function(){
        var items = [];
        var fieldset = {
            xtype: 'fieldset',
            title: '低消设置',
            collapsible: true,
            defaultType: 'textfield',
            items : [
                {
                    name: '_id',
                    value: this.data._id,
                    hidden: true
                },
                {
                    fieldLabel: '低消费用(元)',
                    name: 'minConsume',
                    value: this.data.minConsume,
                    allowBlank: false
                },
            ]
        };

        items.push(fieldset);
        return items;
    }

});
