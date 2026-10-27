Ext.define('App.view.resource.smsExamine.showMessageDetail', {
    extend: 'Ext.window.Window',
    alias: 'widget.showMessageDetailWin',
    width: 500,
    layout: {
        type: 'column',
    },
    modal: true,
    title: '沟通信息详情',
    account: null,
    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            items: [
                {
                    xtype: 'form',
                    frame: true,
                    loadMask: true,

                    bodyStyle: 'padding:2px 2px 0',
                    fieldDefaults: {
                        msgTarget: 'side',
                        labelWidth: 120,
                        labelAlign: 'right',
                        readOnly: true
                    },
                    collapsible: false,
                    defaultType: 'textfield',
                    layout: {
                        type: 'column'
                    },
                    items: this.getSmsItems()
                }
            ]

        });
        me.callParent(arguments);
    },
    getSmsItems : function(){
        var items = [];
        var fieldset = {
            xtype: 'fieldset',
            title: '短信详情',
            collapsible: true,
            width: 470,
            defaultType: 'textfield',
            items : [
                {
                    fieldLabel: '角色',
                    name: 'name',
                    value: this.account.get("from"),
                    width: 350,
                    readOnly:true
                },
                {
                    fieldLabel: '时间',
                    name: 'name',
                    width: 350,
                    value: this.account.get("time"),
                    readOnly:true
                },
                {
                    fieldLabel: '沟通信息',
                    xtype: 'textarea',
                    value: this.account.get("content"),
                    width:350,
                    height:100,
                    name: 'messages',
                    readOnly: true
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

