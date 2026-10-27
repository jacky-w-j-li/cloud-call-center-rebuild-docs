Ext.define('App.view.resource.smsExamine.showSmsDetail', {
    extend: 'Ext.window.Window',
    alias: 'widget.showSmsDetailWin',
    width: 500,
    layout: {
        type: 'column',
    },
    modal: true,
    title: '短信详情',
    account: null,
    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            items: [
                {
                    xtype: 'form',
                    frame: true,
                    loadMask: true,
                    forceFit: true, //自动填充宽度
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
            forceFit: true,
            width: 470,
            defaultType: 'textfield',
            items : [
                {
                    fieldLabel: '_id',
                    name: '_id',
                    value: this.account.get("_id"),
                    width:350,
                    hidden:true
                },
                {
                    fieldLabel: '名称',
                    name: 'name',
                    value: this.account.get("name"),
                    width:350,
                    readOnly:true
                },
                {
                    fieldLabel: '账户编号',
                    name: 'name',
                    value: this.account.get("account"),
                    width:350,
                    readOnly:true
                },
                {
                    fieldLabel: '签名',
                    name: 'name',
                    value: this.account.get("signToCheck"),
                    width:350,
                    readOnly:true
                },
                {
                    fieldLabel: '内容',
                    xtype: 'textarea',
                    value: this.account.get("content"),
                    width:350,
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

