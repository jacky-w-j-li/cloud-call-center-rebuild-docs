Ext.define('App.view.resource.zj.board.addOutRoute', {
    extend: 'Ext.window.Window',
    alias: 'widget.zjaddBoardOutRouteWindow',
    width: 400,
    layout: {
        type: 'anchor'
    },
    modal: true,
    boardId : null,
    title: '新增外呼路由',

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
                                    fieldLabel: '路由名称',
                                    name: 'name',
                                    maxLength: 50,
                                    maxLengthText: '最大长度不能超过50个字符！',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '路由内容',
                                    xtype : "textarea",
                                    name: 'context',
                                    allowBlank: false
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
