Ext.define('App.view.resource.sp.update', {
    extend: 'Ext.window.Window',
    alias: 'widget.updateSpWindow',
    width: 850,
    layout: {
//        type: 'anchor'
        type: 'column'
    },
    modal: true,
    data: null,
    title: '修改运营商',
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
                            collapsible: true,
                            defaultType: 'textfield',
                            layout: 'column',
                            cls: 'backgroud_blue',
                            items: [
                                {
                                    fieldLabel: '运营商编号',
                                    name: '_id',
                                    value: this.data._id,
                                    readOnly: true,
                                    columnWidth: .5,
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '名称',
                                    name: 'name',
                                    value: this.data.name,
                                    maxLength: 50,
                                    maxLengthText: '最大长度不能超过50个字符！',
                                    columnWidth: .5,
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '备注',
                                    value: this.data.memo,
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
                    text: '保存',
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