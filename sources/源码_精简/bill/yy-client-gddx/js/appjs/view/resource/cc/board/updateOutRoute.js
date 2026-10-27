Ext.define('App.view.resource.cc.board.updateOutRoute', {
    extend: 'Ext.window.Window',
    alias: 'widget.ccupdateBoardOutRouteWindow',
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
                                    fieldLabel: '路由编号',
                                    name: 'number',
                                    value: this.data.number,
                                    //readOnly: true,
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '路由名称',
                                    name: 'name',
                                    value: this.data.name,
                                    maxLength: 50,
                                    maxLengthText: '最大长度不能超过50个字符！',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '路由内容',
                                    xtype: 'textarea',
                                    name: 'context',
                                    allowBlank:false,
                                    value : this.data.context
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
