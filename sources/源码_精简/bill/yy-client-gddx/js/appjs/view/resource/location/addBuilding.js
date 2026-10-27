Ext.define('App.view.resource.location.addBuilding', {
    extend: 'Ext.window.Window',
    alias: 'widget.addBuildingWindow',
    width: 400,
    layout: {
        type: 'anchor'
    },
    modal: true,
    locationId : null,
    title: '新增写字楼',

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
                            title: '写字楼信息',
                            collapsible: true,
                            defaultType: 'textfield',
                            items: [
                                {
                                    fieldLabel: '编号',
                                    name: '_id',
                                    allowBlank: false
                                },{
                                    name : 'location',
                                    value : this.locationId,
                                    hidden:true
                                },
                                {
                                    fieldLabel: '名称',
                                    name: 'name',
                                    maxLength: 50,
                                    maxLengthText: '最大长度不能超过50个字符！',
                                    allowBlank: false
                                },{
                                    fieldLabel: '联系人',
                                    name: 'linkman',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '联系电话',
                                    name: 'tel',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '地址',
                                    xtype: 'textarea',
                                    name: 'addr',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '备注',
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
                    text: '创建',
                    id: 'create_new_building_button'
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