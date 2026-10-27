Ext.define('App.view.resource.cc.board.addInRoute', {
    extend: 'Ext.window.Window',
    alias: 'widget.ccaddBoardInRouteWindow',
    width: 400,
    layout: {
        type: 'anchor'
    },
    modal: true,
    boardId : null,
    title: '新增呼入路由',

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
                        width : 300
                    },
                    items: [
                        {
                            xtype: 'fieldset',
                            title: '路由信息',
                            collapsible: true,
                            defaultType: 'textfield',
                            items: [
                                {
                                    name : "boardId",
                                    value : this.boardId,
                                    hidden: true
                                },
                                {
                                    fieldLabel: '呼入号码',
                                    name: 'number',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '路由pbx',
                                    name: 'pbx',
                                    xtype : "combobox",
                                    allowBlank: false,
                                    editable: false,
                                    store: App.util.AppUtil.getDicStore('ccPbx',true),
                                    displayField: 'codeName',
                                    valueField: 'codeValue'
                                },
                                {
                                    fieldLabel: '备注',
                                    name: 'backInfo',
                                    xtype: 'textarea'
                                }
                            ]
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: '创建',
                    id: 'commit_button'
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
