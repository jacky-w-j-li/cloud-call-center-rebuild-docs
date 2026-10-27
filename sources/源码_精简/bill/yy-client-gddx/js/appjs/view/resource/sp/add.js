Ext.define('App.view.resource.sp.add', {
    extend: 'Ext.window.Window',
    alias: 'widget.addSpWindow',
    width: 850,
    layout: {
        type: 'column'
    },
    modal: true,
    title: '新增运营商',
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
                        labelWidth: 160,
                        labelAlign: 'right'
                    },
                    items: [
                        {
                            xtype: 'fieldset',
                            title: '运营商信息',
                            id:'sp_add_info',
                            collapsible: true,
                            defaultType: 'textfield',
                            layout: 'column',
                            cls: 'backgroud_blue',
                            items: [
                                {
                                    fieldLabel: '运营商编号',
                                    name: '_id',
                                    columnWidth: .5,
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '运营商名称',
                                    name: 'name',
                                    maxLength: 50,
                                    maxLengthText: '最大长度不能超过50个字符！',
                                    columnWidth: .5,
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '备注',
                                    name: 'memo',
                                    xtype: 'textarea',
                                    columnWidth: 1
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