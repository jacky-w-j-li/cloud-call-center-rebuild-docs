Ext.define('App.view.resource.serviceNum.setInit', {
    extend: 'Ext.window.Window',
    alias: 'widget.setServiceNumInitWindow',
    width: 340,
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
                            title: '服务号信息',
                            collapsible: true,
                            defaultType: 'textfield',
                            items: [
                                {
                                    name: '_id',
                                    fieldLabel: '服务号',
                                    value: this.data._id,
                                    readOnly : true
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '初始月租',
                                    decimalPrecision : 4,
                                    name: 'monthRentInit',
                                    value: this.data.monthRentInit,
                                    validator:function(value){
                                        var minValue=Ext.getCmp("minValue_1");
                                        if(this.getValue()<minValue.getValue()){
                                            return "不能小于代理月租"+minValue.getValue();
                                        }else {
                                            return true;
                                        }
                                    },
                                    allowBlank: false
                                },{
                                    xtype: 'numberfield',
                                    id:"minValue_1",
                                    fieldLabel: '代理月租',
                                    decimalPrecision : 4,
                                    name: 'monthRentProxy',
                                    value: this.data.monthRentProxy,
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
                    id: 'set_serviceNum_init_button'
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
