Ext.define('App.view.resource.location.updateLocation', {
    extend: 'Ext.window.Window',
    alias: 'widget.updateLocationWindow',
    width: 400,
    layout: {
        type: 'anchor'
    },
    modal: true,
    title: '区域信息修改',
    data : null,
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
                            title: '区域信息',
                            collapsible: true,
                            defaultType: 'textfield',
                            items: [
                                {
                                    fieldLabel: '地区编号',
                                    name: '_id',
                                    value : this.data._id,
                                    readOnly : true,
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '名称',
                                    value : this.data.name,
                                    name: 'name',
                                    maxLength: 50,
                                    maxLengthText: '最大长度不能超过50个字符！',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '备注',
                                    value : this.data.memo,
                                    name: 'memo',
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
                    id: 'update_location_button'
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