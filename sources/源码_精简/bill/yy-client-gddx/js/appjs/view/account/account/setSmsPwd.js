Ext.define('App.view.account.account.setSmsPwd', {
    extend: 'Ext.window.Window',
    alias: 'widget.setSmsPwdWindow',
    width: 350,
    layout: {
        type: 'anchor'
    },
    modal: true,
    productModel:null,
    title: '短信接口密码串设置',
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
                    items: this.getPWD()
                }
            ],
            buttons: [
                {
                    text: '保存',
                    id: 'saveProductSmsPwd'
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
    getPWD : function(){
        var items = [];
        var fieldset = {
            xtype: 'fieldset',
            title: '短信接口密码串设置',
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
                    fieldLabel: '密码串',
                    name: 'templateSmsInterfacePassword',
                    value: this.getPWDStr(),
                }
            ]
        };
        items.push(fieldset);
        return items;
    },
    getPWDStr : function(){
        var pwd = this.productModel.get('templateSmsInterfacePassword');
        if(pwd){
            return pwd;
        }else{
            return function(){
                var text = "";
                var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                for(var i=0; i < 10; i++){
                    text += possible.charAt(Math.floor(Math.random() * possible.length));
                }

                return text;
            }();
        }
    }
});
