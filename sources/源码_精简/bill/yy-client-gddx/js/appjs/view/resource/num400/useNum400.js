Ext.define('App.view.resource.num400.useNum400', {
    extend: 'Ext.window.Window',
    alias: 'widget.useNum400Window',
    width: 400,
    layout: {
        type: 'anchor'
    },
    modal: true,
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
                        labelAlign: 'right'
                    },
                    items: [
                        {
                            xtype: 'fieldset',
                            title: '账户信息',
                            collapsible: true,
                            defaultType: 'textfield',
                            items: [
                                {
                                    fieldLabel: '400',
                                    name: '_id',
                                    value: this.data,
                                    cls :"field_disable_cls",
                                    readOnly : true
                                },
                                {
                                    fieldLabel: '应用产品',
                                    xtype: 'combobox',
                                    name: 'product',
                                    editable: false,
                                    store: App.util.AppUtil.getDicStore('productType'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '账户编号',
                                    id : "use_num400_account_id",
                                    name: 'account',
                                    maxLength: 50,
                                    maxLengthText: '请输入正确的账户编号！',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '账户名称',
                                    name : "name",
                                    cls :"field_disable_cls",
                                    readOnly : true,
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '公司名称',
                                    name : "companyName",
                                    cls :"field_disable_cls",
                                    readOnly : true,
                                    allowBlank: false
                                }

                            ]
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: '保存',
                    id: 'use_num400_button'
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
