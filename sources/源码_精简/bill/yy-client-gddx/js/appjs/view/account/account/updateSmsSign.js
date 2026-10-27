Ext.define('App.view.account.account.updateSmsSign', {
    extend: 'Ext.window.Window',
    alias: 'widget.updateSmsSignWindow',
    width: 350,
    layout: {
        type: 'anchor'
    },
    modal: true,
    title: '更新短信签名',
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
                    items: this.getSmsItems()
                }
            ],
            buttons: [
                {
                    text: '更新',
                    id: 'btn_update_sms_sign'
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
                //用于查询后执行更新
                {
                    xtype : 'textfield',
                    name: '_id',
                    value: this.data._id,
                    hidden: true
                },
                //用于查询在数据库中是否已存在记录
//                {
//                    xtype : 'textfield',
//                    name: 'account',
//                    value: this.data.account,
//                    hidden: true
//                },
                {
                    xtype: 'textfield',
                    fieldLabel: '签名',
                    value: this.data.name,
                    name: 'name',
                    id:'name',
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    allowBlank: false,
                    listeners:{
                        blur: this.delSpecialChar
                    }
                },
                {
                    xtype: 'textfield',
                    fieldLabel: 'subcode',
                    value: this.data.subcode,
                    name: 'subcode',
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    allowBlank: false,
                    disabled:true
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
