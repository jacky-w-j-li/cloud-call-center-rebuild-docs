Ext.define('App.view.resource.zj.board.updateServer', {
    extend: 'Ext.window.Window',
    alias: 'widget.zjupdateBoardServerWindow',
    width: 400,
    layout: {
        type: 'anchor'
    },
    modal: true,
    title: '更新机器信息',
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
                            title: '机器信息',
                            collapsible: true,
                            defaultType: 'textfield',
                            items: [
                                {
                                    name : "_id",
                                    value : this.data._id,
                                    hidden:true
                                },
                                {
                                    fieldLabel: '机器编号',
                                    name: 'number',
                                    value: this.data.number,
                                    readOnly: true,
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '机器名称',
                                    name: 'name',
                                    value: this.data.name,
                                    maxLength: 50,
                                    maxLengthText: '最大长度不能超过50个字符！',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: 'IP地址',
                                    name: 'ip',
                                    allowBlank:false,
                                    value : this.data.ip
                                },
                                {
                                    fieldLabel: '端口',
                                    name: 'port',
                                    allowBlank:false,
                                    value : this.data.port
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
