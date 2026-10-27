Ext.define('App.view.resource.zj.board.addServer', {
    extend: 'Ext.window.Window',
    alias: 'widget.zjaddBoardServerWindow',
    width: 400,
    layout: {
        type: 'anchor'
    },
    modal: true,
    boardId : null,
    title: '新增机器',

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
                            title: '机器信息',
                            collapsible: true,
                            defaultType: 'textfield',
                            items: [
                                {
                                    name : "boardId",
                                    value : this.boardId,
                                    hidden: true
                                },
                                {
                                    fieldLabel: '机器编号',
                                    name: 'number',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '机器名称',
                                    name: 'name',
                                    maxLength: 50,
                                    maxLengthText: '最大长度不能超过50个字符！',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: 'ip地址',
                                    name: 'ip',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '端口',
                                    name: 'port',
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
