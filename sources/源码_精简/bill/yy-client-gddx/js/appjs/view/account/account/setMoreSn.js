Ext.define('App.view.account.account.setMoreSn', {
    extend: 'Ext.window.Window',
    alias: 'widget.setMoreSnWindow',
    width: 350,
    layout: {
        type: 'anchor'
    },
    modal: true,
    title: '企业总机多服务号呼入设置',
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
                    items: this.getMoreSnItems()
                }
            ],
            buttons: [
                {
                    text: '保存',
                    id: 'btn_save_zj_moreSn'
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
    getMoreSnItems : function(){
        var items = [];
        var fieldset = {
            xtype: 'fieldset',
            title: '设置',
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
                    fieldLabel: '开启总机多服务号呼入',
                    name: 'isMoreSn',
                    id:"ZJ_isMoreSn",
                    xtype: 'radiogroup',
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    items: [
                        {
                            boxLabel: '是',
                            name: 'isMoreSn',
                            inputValue: 'true',
                            checked:true
                        },
                        {
                            boxLabel: '否',
                            name: 'isMoreSn',
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
