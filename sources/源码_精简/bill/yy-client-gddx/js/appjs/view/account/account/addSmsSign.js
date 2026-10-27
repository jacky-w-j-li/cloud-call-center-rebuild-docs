Ext.define('App.view.account.account.addSmsSign', {
    extend: 'Ext.window.Window',
    alias: 'widget.addSmsSignWindow',
    width: 350,
    layout: {
        type: 'anchor'
    },
    modal: true,
    title: '短信签名',
    account: null,
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
                    items: this.getSmsItems()
                }
            ],
            buttons: [
                {
                    text: '保存',
                    id: 'btn_add_sms_sign'
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
            title: '短信签名',
            collapsible: true,
            defaultType: 'textfield',
            items : [
                {
                    name: 'account',
                    value: this.account.get('_id'),
                    hidden: true
                },
                {
                    fieldLabel: '签名',
                    name: 'name',
                    id:'name',
                    allowBlank: false,
                    listeners:{
                        blur: this.delSpecialChar
                            //this.stripscript
                    }
                }
            ]
        };
        items.push(fieldset);
        return items;
    },
    //字符过滤处理
    filterCharacter :function(obj) {
        var content=obj.value;
        if(content){
            var pattern =  new RegExp("[`~!@#$%^&*()+_=—|《-》:;\\<>/~！@#￥%…………&*———+|]");
            var rs = "";
            for (var i = 0; i < content.length; i++) {
                rs= rs+content.substr(i, 1).toString().replace(pattern, '');
            }
            rs= rs.replace( ",","，").replace( ".","。");
            Ext.getCmp('name').setValue(rs);
        }
    },

delSpecialChar:function(obj){
    var content=obj.value;
    content = content.replace(/\/'/g,"'");
    content = content.replace(/\/"/g,'"');
    var contentarr = content.split('"');
    var str = "";
    var str2 = "";
    for(var j = 0;j< contentarr.length-1;j++){
        str+=contentarr[j]+(j%2?'”':'“');
    }
    str+=contentarr[j];
    contentarr = str.split("'");
    for(var j = 0;j<contentarr.length-1;j++){
        str2 += contentarr[j]+(j%2?'’':'‘');
    }
    str2 +=contentarr[j];
    var reg1 = new RegExp("<[^<]*>", "gi")
    str2 = str2.replace(reg1,'');
    var reg2 = new RegExp("</", "gi")
    str2 = str2.replace(reg2,'');
    if(str2.substr(str2.length-1,1) == '\\'&&str2.substr(str2.length-2,2) != '\\\\'){
        str2 = str2+'\\'
    }

    Ext.getCmp('name').setValue(str2);
}


});
