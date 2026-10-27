Ext.define('App.view.account.account.setSmsChannel', {
    extend: 'Ext.window.Window',
    alias: 'widget.setSmsChannelWindow',
    width: 350,
    layout: {
        type: 'anchor'
    },
    modal: true,
    title: '短信通道设置',
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
                    items: this.getSmsChannelItems()
                }
            ],
            buttons: [
                {
                    text: '保存',
                    id: 'saveProductSmsChannel'
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
    getSmsChannelItems : function(){
        var items = [];
        var fieldset = {
            xtype: 'fieldset',
            title: '短信通道设置',
            collapsible: true,
            defaultType: 'textfield',
            items : [
                {
                    xtype : 'textfield',
                    name: '_id',
                    value: this.data._id,
                    hidden: true
                },
                {
                    fieldLabel: '短信通道',
                    name: 'smsChannel',
                    value:this.data.smsChannel,
                    xtype: 'combobox',
                    store: App.util.AppUtil.getDicStore('smsChannel'),
                    displayField: 'codeName',
                    valueField: 'codeValue',
                    typeAhead: true,
                    queryMode: 'local',
                    allowBlank: false
                }
            ]
        };
        items.push(fieldset);
        return items;
    }


});
