Ext.define('App.view.resource.location.updateBuilding', {
    extend: 'Ext.window.Window',
    alias: 'widget.updateBuildingWindow',
    width: 400,
    layout: {
        type: 'anchor'
    },
    modal: true,
    data: null,
    title: '更新写字楼信息',

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
                            title: '写字楼信息',
                            collapsible: true,
                            defaultType: 'textfield',
                            items: [
                                {
                                    fieldLabel: '编号',
                                    name: '_id',
                                    value: this.data._id,
                                    readOnly: true,
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '名称',
                                    name: 'name',
                                    value: this.data.name,
                                    maxLength: 50,
                                    maxLengthText: '最大长度不能超过50个字符！',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '联系人',
                                    name: 'linkman',
                                    value: this.data.linkman,
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '联系电话',
                                    name: 'tel',
                                    value: this.data.tel,
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '地址',
                                    xtype: 'textarea',
                                    name: 'addr',
                                    value: this.data.addr,
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '备注',
                                    name: 'memo',
                                    value: this.data.memo,
                                    xtype: 'textarea'
                                }
                            ]
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: '更新',
                    id: 'update_building_button'
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