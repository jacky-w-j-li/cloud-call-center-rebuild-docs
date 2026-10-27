Ext.define('App.view.account.account.businessTagManager', {
    extend: 'Ext.window.Window',
    alias: 'widget.businessTagManager',
    width: 500,
    layout: {
        type: 'anchor'
    },
    modal: true,
    data : null,
    account: null,
    title: '业务标记管理',

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
                            title: '业务标记信息',
                            collapsible: true,
                            defaultType: 'textfield',
                            items: [
                                {
                                    name: "account",
                                    value: this.account,
                                    hidden: true
                                },
                                {
                                    xtype: "checkboxgroup",
                                    name : "businessTag",
                                    columns: 3,
                                    fieldLabel: "标记",
                                    items: this.getBusinessTagItem(me)
                                }
                            ]
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: '标记',
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
    },
    getBusinessTagItem : function (self){
        var tags = App.util.AppUtil.getDicCache("businessTag") || [];
        var items = [];
        for(var i in tags){
            var item = {
                boxLabel: tags[i].codeName,
                name: 'tag',
                inputValue: tags[i].codeValue,
                checked: false
            };
            for(var k in self.data){
                if(self.data[k] == tags[i].codeValue){
                    item.checked = true;
                    break;
                }
            }
            items.push(item);
        }
        return items;
    }

});
