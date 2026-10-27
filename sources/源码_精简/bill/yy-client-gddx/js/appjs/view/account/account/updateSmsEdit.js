/**
 * Created by apple on 15/8/12.
 */
Ext.define('App.view.account.account.updateSmsEdit', {
    extend: 'Ext.window.Window',
    alias: 'widget.updateSmsEditWindow',
    width: 440,
    height:400,
    layout: {
        type: 'anchor'
    },
    modal: true,
    title: '更新短信模版',
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
                    id: 'btn_update_sms_edit'
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
            height:300,
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
                {
                    xtype: 'textfield',
                    fieldLabel: '模版名称',
                    value: this.data.name,
                    name: 'name',
                    msgTarget: 'side',
                    labelAlign: 'right',
                    allowBlank: false
                },
                {
                    xtype: 'textarea',
                    fieldLabel: '模版内容',
                    value: this.data.content,
                    autoHeight:true,
                    name: 'content',
                    msgTarget: 'side',
                    width: 350,
                    height:250,
                    labelAlign: 'right',
                    allowBlank: false,
                }
            ]
        };
        items.push(fieldset);
        return items;
    }


});
