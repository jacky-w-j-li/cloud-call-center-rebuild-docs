Ext.define('App.view.resource.serviceNum.set', {
    extend: 'Ext.window.Window',
    alias: 'widget.setServiceNumInfoWindow',
    width: 340,
    layout: {
        type: 'anchor'
    },
    single:true,
    modal: true,
    data: null,
    title: '账户信息',
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
                                    fieldLabel: '修改类型',
                                    name: 'serviceNumSetType',
                                    xtype: 'radiogroup',
                                    value: {serviceNumSetType: this.single ? 'single' : 'all'},
                                    items: [
                                        {
                                            boxLabel: '单个',
                                            name: 'serviceNumSetType',
                                            inputValue: 'single',
                                            hidden : !this.single
                                        },
                                        {
                                            boxLabel: '批量',
                                            name: 'serviceNumSetType',
                                            inputValue: 'all'
                                        }
                                    ],
                                    listeners: {
                                        change: function(obj,newValue){
                                            //批量的
                                            var beginServiceNumField = obj.up('window').down('textfield[name="beginServiceNum"]');
                                            var endServiceNumField = obj.up('window').down('textfield[name="endServiceNum"]');

                                            //单个的
                                            var bind400Field = obj.up('window').down('combobox[name="bind400"]');
                                            var idField = obj.up('window').down('textfield[name="_id"]');
                                            var concurrentField = obj.up('window').down('numberfield[name="concurrent"]');
                                            if(newValue.serviceNumSetType == 'all'){
                                                beginServiceNumField.setVisible(true);
                                                beginServiceNumField.allowBlank = false;
                                                endServiceNumField.setVisible(true);
                                                endServiceNumField.allowBlank = false;

                                                //单个的
                                                idField.setVisible(false);
                                                bind400Field.setVisible(false);
                                                concurrentField.setVisible(false);
                                                concurrentField.allowBlank = true;
                                            }else{
                                                beginServiceNumField.setVisible(false);
                                                beginServiceNumField.allowBlank = true;
                                                endServiceNumField.setVisible(false);
                                                endServiceNumField.allowBlank = true;

                                                //单个的
                                                idField.setVisible(true);
                                                bind400Field.setVisible(true);
                                                concurrentField.setVisible(true);
                                                concurrentField.allowBlank = false;
                                            }
                                        }
                                    }
                                },
                                {
                                    name: '_id',
                                    fieldLabel: '服务号',
                                    value: this.getFieldValue('_id'),
                                    readOnly : true,
                                    hidden: !this.single,
                                },{
                                    xtype: 'textfield',
                                    fieldLabel: '开始服务号',
                                    name: 'beginServiceNum',
                                    regex: /^\d+$/,
                                    regexText: '不合法的服务号',
                                    hidden: this.single,
                                    allowBlank: this.single,
                                },
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '结束服务号',
                                    name: 'endServiceNum',
                                    regex: /^\d+$/,
                                    regexText: '不合法的服务号',
                                    hidden: this.single,
                                    allowBlank: this.single,
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '月租',
                                    name: 'monthRent',
                                    decimalPrecision : 4,
                                    value: this.getFieldValue('monthRent'),
                                    minValue:this.getFieldValue('monthRentProxy')||0,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '并发',
                                    name: 'concurrent',
                                    value: this.getFieldValue('concurrent'),
                                    allowBlank: !this.single,
                                    readOnly : true,
                                    hidden : !this.single,
                                },
//                                {
//                                    xtype : 'numberfield',
//                                    fieldLabel: '通话分钟赠送比例',
//                                    name: 'callMinutes',
//                                    value: this.getFieldValue('callMinutes,
//                                    allowBlank: false
//                                },
                                {
                                    fieldLabel: '绑定400号',
                                    xtype: 'combobox',
                                    name: 'bind400',
                                    editable: true,
                                    store: App.util.AppUtil.getDicStore('serviceNum400',true),
                                    value:this.getFieldValue('bind400'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    hidden: !this.single,
                                },
                                {
                                    name: 'status',
                                    xtype: 'combobox',
                                    align: 'center',
                                    fieldLabel: '状态',
                                    store: App.util.AppUtil.getDicStore("serviceNumStatus"),
                                    value: this.getFieldValue('status'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    allowBlank:false,
                                },
                                {
                                    fieldLabel: '备注',
                                    name: 'memo',
                                    value: this.getFieldValue('memo'),
                                    xtype: 'textarea'
                                }
                            ]
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: '保存',
                    id: 'set_serviceNum_button'
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
    },
    getFieldValue : function(name){
        if(this.data){
            return this.data[name];
        }
        return null;
    }

});
