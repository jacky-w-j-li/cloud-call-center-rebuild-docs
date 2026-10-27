/**
 * Created by apple on 15/8/11.
 */
Ext.define('App.view.account.account.addSmsEdit', {
    extend: 'Ext.window.Window',
    alias: 'widget.addSmsEditWindow',
    width: 600,
    height:400,
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
                    id: 'btn_add_sms_edit'
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
            title: '短信模版',
            collapsible: true,
            defaultType: 'textfield',
            items : [
                {
                    fieldLabel: '账户编号',
                    name: 'account',                //账户编号
                    value: this.account.get('_id'),
                    readOnly:true,
                    //hidden: true
                },
                {
                    fieldLabel: '账户名称',
                    name: 'accountName',                //账户名称
                    value: this.account.get('name'),
                    readOnly:true,
                    //hidden: true
                },
                {
                    fieldLabel: '公司名称',
                    name: 'companyName',            //公司名称
                    value: this.account.get('companyName'),
                    readOnly:true,
                    //hidden: true
                },
                {
                    fieldLabel: '模版名称',
                    name: 'name',
                    allowBlank: false
                },
                {
                    fieldLabel: '模版内容',
                    xtype: 'textarea',
                    name: 'content',
                    allowBlank: false,
                    width: 400,
                    height:200,
                }
            ]
        };
        items.push(fieldset);
        return items;
    }


});