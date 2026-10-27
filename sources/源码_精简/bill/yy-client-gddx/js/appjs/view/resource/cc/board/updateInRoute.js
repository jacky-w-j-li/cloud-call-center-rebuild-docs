Ext.define('App.view.resource.cc.board.updateInRoute', {
    extend: 'Ext.window.Window',
    alias: 'widget.ccupdateBoardInRouteWindow',
    width: 400,
    layout: {
        type: 'anchor'
    },
    modal: true,
    title: '更新路由信息',
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
                        labelAlign: 'right',
                        width: 300
                    },
                    items: [
                        {
                            xtype: 'fieldset',
                            title: '路由信息',
                            collapsible: true,
                            defaultType: 'textfield',
                            items: [
                                {
                                    name : "_id",
                                    value : this.data._id,
                                    hidden:true
                                },
                                {
                                    fieldLabel: '呼入号码',
                                    name: 'number',
                                    value: this.data.number,
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '路由pbx',
                                    name: 'pbx',
                                    xtype : "combobox",
                                    value: this.data.pbx,
                                    allowBlank: false,
                                    editable: false,
                                    store: App.util.AppUtil.getDicStore('ccPbx',true),
                                    displayField: 'codeName',
                                    valueField: 'codeValue'
                                },
                                {
                                    fieldLabel: '备注',
                                    name: 'backInfo',
                                    value: this.data.backInfo,
                                    xtype: 'textarea'
                                }
                            ]
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: '修改',
                    class: 'commit_button'
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
    }

});
