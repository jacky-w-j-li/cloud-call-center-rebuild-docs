Ext.define('App.view.account.account.setCdrDay', {
    extend: 'Ext.window.Window',
    alias: 'widget.setCdrDayWindow',
    width: 350,
    layout: {
        type: 'anchor'
    },
    modal: true,
    title: '呼叫中心通话记录设置',
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
                    items: this.getRecordItems()
                }
            ],
            buttons: [
                {
                    text: '保存',
                    id: 'btn_save_cc_cdr'
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
    getRecordItems : function(){
        var items = [];
        var fieldset = {
            xtype: 'fieldset',
            title: '通话记录设置',
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
                    xtype: 'numberfield',
                    fieldLabel: '保存时间(天)',
                    value: this.data.cdrClearDuration,
                    name: 'cdrClearDuration',
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    allowBlank: false
                },
//                {
//                    xtype: "checkboxfield",
//                    name: "cdrClearKeepDealing",
//                    fieldLabel: "",
//                    boxLabel: "已接通的记录是否删除",
//                    checked:true
//                },
                {
                    fieldLabel: '保留已接通的记录',
                    name: 'cdrClearKeepDealing',
                    id:"cdrSet_cdrClearKeepDealing",
                    xtype: 'radiogroup',
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    items: [
                        {
                            boxLabel: '是',
                            name: 'cdrClearKeepDealing',
                            inputValue: 'true',
                            checked:true
                        },
                        {
                            boxLabel: '否',
                            name: 'cdrClearKeepDealing',
                            inputValue: 'false'
                        }
                    ]
                }
            ]
        };
        items.push(fieldset);
        return items;
    }


});
