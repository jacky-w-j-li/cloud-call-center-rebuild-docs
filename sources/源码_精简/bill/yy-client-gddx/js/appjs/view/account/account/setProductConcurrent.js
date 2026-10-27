Ext.define('App.view.account.account.setProductConcurrent', {
    extend: 'Ext.window.Window',
    alias: 'widget.setProductConcurrentWindow',
    width: 400,
    layout: {
        type: 'anchor'
    },
    modal: true,
    title: '并发设置',
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
                            title: '并发信息',
                            collapsible: true,
                            defaultType: 'textfield',
                            items: [
                                {
                                    name: '_id',
                                    value: this.data._id,
                                    hidden: true
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '坐席透传号共享数量',
                                    name: 'agentCallerIDNumSame',
                                    id:'txt_product_cc_display_num_same',
                                    allowDecimals:false,
                                    allowBlank: true,
                                    minValue:1,
                                    value: this.data.agentCallerIDNumSame,
                                    labelWidth: 150,
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '多透传并发控制倍数',
                                    name: 'maxInMultiple',
                                    id:'txt_product_cc_max_in_multiple',
                                    allowDecimals:false,
                                    allowBlank: true,
                                    minValue:1,
                                    value: this.data.maxInMultiple,
                                    labelWidth: 150,
                                },
                                {
                                    fieldLabel: '节点',
                                    name: 'pbx',
                                    id:'combox_product_cc_pbx',
                                    value: this.data.pbx[0].PBX,
                                    editable: false,
                                    xtype: 'combobox',
                                    editable: false,
                                    store: this.getPbxStore(),
                                    displayField: 'NickName',
                                    valueField: 'PBX',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    allowBlank: false,
                                    labelWidth: 150,
                                    listeners: {
                                        change: function (obj, newvalue) {
                                            var maxIn = obj.up('fieldset').down("#txt_product_cc_in");
                                            var maxOut = obj.up('fieldset').down("#txt_product_cc_out");
                                            var maxInAcc = obj.up('fieldset').down("#txt_product_cc_max_in");
                                            var win=obj.up("window");
                                            for (var i = 0; i < win.data.pbx.length; i++) {
                                                var pbx = win.data.pbx[i];
                                                if(pbx.PBX==newvalue){
                                                    maxIn.setValue(pbx.maxInbound);
                                                    maxOut.setValue(pbx.maxOutbound);
                                                    maxInAcc.setValue(pbx.maxIn);
                                                }
                                            }
                                        }
                                    }
                                },

                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '呼入并发',
                                    labelWidth: 150,
                                    name: 'maxInbound',
                                    id:'txt_product_cc_in',
                                    allowDecimals:false,
                                    allowBlank: false,
                                    labelWidth: 120,
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '呼出并发',
                                    labelWidth: 150,
                                    name: 'maxOutbound',
                                    id:'txt_product_cc_out',
                                    allowDecimals:false,
                                    allowBlank: false,
                                    labelWidth: 120,
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '最大呼入并发',
                                    labelWidth: 150,
                                    name: 'maxIn',
                                    id:'txt_product_cc_max_in',
                                    allowDecimals:false,
                                    allowBlank: true,
                                    labelWidth: 120,
                                },
                                {
                                    xtype: 'displayfield',
                                    fieldLabel: '',
                                    name: '',
                                    value: '-1为不控制'
                                }
                            ]
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: '保存',
                    id: 'btn_save_product_concurrent'
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
    getPbxStore: function () {
        var pbxs=this.data.pbx;
//        console.dir(pbxs);
        var fields = [];
        if (pbxs && pbxs.length > 0) {
            var code = pbxs[0];
            for (var p in code) {
                fields.push(p);
            }
        }
        var store = Ext.create('Ext.data.Store', {
            fields: fields,
            data: pbxs
        });
        return store;
    }

});
