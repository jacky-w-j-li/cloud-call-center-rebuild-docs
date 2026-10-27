Ext.define('App.view.resource.smsExamine.addCommunicate', {
    extend: 'Ext.window.Window',
    alias: 'widget.addCommunicateWin',
    width: 350,
    layout: {
        type: 'anchor'
    },
    modal: true,
    title: '沟通信息',
    record: null,
    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            items: [
                {
                    xtype: 'form',
                    frame: true,
                    title: '沟通信息',
                    bodyStyle: 'padding:2px 2px 0',
                    fieldDefaults: {
                        msgTarget: 'side',
                        labelWidth: 90,
                        labelAlign: 'right'
                    },
                    items: this.getSmsItems()
                }
            ],
            buttons: [
                {
                    text: '确认',
                    id: 'btn_addCommunicate',
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
    getSmsItems : function(){
        var items = [];
        var fieldset = {
            xtype: 'fieldset',
            title: '沟通信息',
            collapsible: true,
            defaultType: 'textfield',
            items : [
                {
                    fieldLabel: '_id',
                    name: '_id',
                    value: this.getFieldValue("_id"),
                    hidden:true
                },
                {
                    fieldLabel: '角色',
                    name: 'name',
                    value: 'admin',
                    readOnly:true
                },
                {
                    fieldLabel: '内容',
                    xtype: 'textarea',
                    allowBlank: false,
                    name: 'messages'
                }
            ]
        };
        items.push(fieldset);
        return items;
    },
    getFieldValue:function(fieldName){
        if(!this.record){
            return '';
        }
        return this.record.get(fieldName);
    }
});

