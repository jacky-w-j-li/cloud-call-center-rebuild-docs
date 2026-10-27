Ext.define('App.view.account.account.productManager', {
    extend: 'Ext.window.Window',
    requires: ['App.model.resource.Product', 'App.model.account.AccountProduct'],
    alias: 'widget.productManagerWin',
    height: 650,
    width: 950,
    title: '产品管理',
    autoScroll:true,
    accountId: null,
    data: null,
    productStore: null,
    zjBoards:null,
    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            modal: true,
            items: [
                {
                    xtype: 'panel',
                    frame: true,
                    items: [
                        {
                            xtype: 'fieldset',
                            collapsible: true,
                            title: '账户已开通产品',
                            cls: 'backgroud_blue',
                            defaults: {
                                msgTarget: 'side',
                                labelWidth: 80,
                                labelAlign: 'right',
                                fieldCls: 'field_disable_cls',
                                readOnly: true
                            },
                            defaultType: 'textfield',
                            items: [
                                {
                                    xtype: 'grid',
                                    id: 'account_product_grid',
                                    forceFit: true,
                                    columnLines: true,
                                    margin: '0 0 10 0',
                                    columnWidth: .99,
                                    store: this.getAccountProductStore(),
                                    dockedItems: [
                                        {
                                            xtype: 'toolbar',
                                            class: 'dock',
                                            margin: '10 ',
                                            forceFit: true,
                                            loadMask: true,
                                            items: [
                                                {
                                                    iconCls: 'edit_icon_cls',
                                                    text: '查看/设置',
                                                    id: 'account_product_set',
                                                    disabled: true,
                                                    needSelect: true,
                                                    hidden: App.util.AppUtil.hasLimit("account_product_chargesSet")
                                                },
                                                {
                                                    iconCls: 'edit_icon_cls',
                                                    text: '并发设置',
                                                    id: 'account_product_concurrent_set',
                                                    disabled: true,
                                                    needSelect: true,
                                                    hidden: App.util.AppUtil.hasLimit("account_product_concurrent")
                                                },
                                                {
                                                    iconCls: 'edit_icon_cls',
                                                    text: '录音设置',
                                                    id: 'account_product_record_set',
                                                    disabled: true,
                                                    needSelect: true
                                                },
                                                {
                                                    iconCls: 'edit_icon_cls',
                                                    text: '通话记录设置',
                                                    id: 'account_product_cdr_set',
                                                    disabled: true,
                                                    needSelect: true
                                                },
                                                {
                                                    iconCls: 'edit_icon_cls',
                                                    text: '短信通道设置',
                                                    id: 'account_product_smsChannel_set',
                                                    disabled: true,
                                                    needSelect: true
                                                },
                                                {
                                                    iconCls: 'edit_icon_cls',
                                                    text: '多服务号呼入',
                                                    id: 'account_product_moreSn_set',
                                                    disabled: true,
                                                    needSelect: true,
                                                    hidden: App.util.AppUtil.hasLimit("account_product_isMoreSn")
                                                },
                                                {
                                                    iconCls: 'edit_icon_cls',
                                                    text: '低消设置',
                                                    id: 'account_product_minConsume_set',
                                                    disabled: true,
                                                    needSelect: true,
                                                    hidden: App.util.AppUtil.hasLimit("account_product_minConsume")
                                                },
                                                {
                                                    iconCls: 'set_icon_cls',
                                                    text: '总机线路配置',
                                                    id: 'account_product_zj_line_set',
                                                    disabled:true,
                                                    hidden : App.util.AppUtil.hasLimit('account_product_zj_line_set'),
                                                    needSelect:true,
                                                    product:'zj',
                                                },
                                                {
                                                    iconCls: 'set_icon_cls',
                                                    text: '短信密码串配置',
                                                    id: 'account_product_sms_pwd_set',
                                                    disabled:true,
                                                    hidden : App.util.AppUtil.hasLimit('account_product_sms_pwd_set'),
                                                    needSelect:true,
                                                    product:'cc',
                                                },
                                                //,{
                                                //    iconCls: 'edit_icon_cls',
                                                //    text: '短信签名',
                                                //    id: 'account_product_sms_set',
                                                //    disabled: true,
                                                //    needSelect: true
                                                //}
                                            ]
                                        },{
                                            xtype: 'toolbar',
                                            class: 'dock',
                                            items:[
                                                {
                                                    iconCls: 'set_icon_cls',
                                                    text: '短信推送配置',
                                                    id: 'account_product_sms_dispatch_set',
                                                    disabled:true,
                                                    hidden : App.util.AppUtil.hasLimit('account_product_sms_dispatch_set'),
                                                    needSelect:true,
                                                    product:'cc',
                                                },
                                                {
                                                    iconCls: 'set_icon_cls',
                                                    text: '拨号次数设置',
                                                    id: 'account_call_sum_tool',
                                                    disabled: true,
                                                    needSelect: true,
                                                    hidden:App.util.AppUtil.isHide2(),
                                                    product:'cc',
                                                },
                                                {
                                                    iconCls: 'set_icon_cls',
                                                    text: '号码拨号设置',
                                                    id: 'open_call_sum_tool',
                                                    disabled: true,
                                                    needSelect: true,
                                                    hidden:App.util.AppUtil.isHide2(),
                                                    product:'cc',
                                                },
                                                {
                                                    iconCls: 'set_icon_cls',
                                                    text: '账户拨号设置',
                                                    id: 'open_account_call_sum_tool',
                                                    disabled: true,
                                                    needSelect: true,
                                                    hidden:App.util.AppUtil.isHide2(),
                                                    product:'cc',
                                                },
                                            ]
                                        }
                                    ],
                                    columns: [
                                        {
                                            header: '产品类型',
                                            dataIndex: 'product',
                                            align: 'center',
                                            renderer: function (value) {
                                                return App.util.AppUtil.getRendererValue(value, 'product');
                                            }
                                        },
                                        {
                                            header: '开通时间',
                                            dataIndex: 'createTime',
                                            align: 'center'
                                        },
                                        {
                                            header: '开通机柜',
                                            dataIndex: 'node',
                                            align: 'center',
                                            renderer: function (value,metaData,record) {
                                                if(record.get('product') == 'zj'){
                                                    return App.util.AppUtil.getRendererValue(value, 'board');
                                                }else{
                                                    return App.util.AppUtil.getRendererValue(value, 'ccBoard');
                                                }
                                            }
                                        }
                                    ]
                                }
                            ]
                        },
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
                            hidden: App.util.AppUtil.hasLimit("account_product_chargesSet"),
                            items: [
                                {
                                    xtype: 'fieldset',
                                    collapsible: true,
                                    title: '新产品开通',
                                    cls: 'backgroud_blue',
                                    defaultType: 'textfield',
                                    items: [
                                        {
                                            name: "account",
                                            value: this.accountId,
                                            id: "open_product_account",
                                            hidden: true
                                        },
                                        {
                                            fieldLabel: '开通产品',
                                            name: 'product',
                                            id: "open_product_radio",
                                            xtype: 'radiogroup',
                                            items: this.getAccessProduct(this.data),
                                            listeners: {
                                                change: this.productChange
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        });
        me.callParent(arguments);
    },
    getAccessProduct: function (openProduct) {
        var products = App.util.AppUtil.getDicCache("product");
        products = products || [];
        openProduct = openProduct || [];
        var accessProducts = [];
        for (var i = 0; i < products.length; i++) {
            var isOpen = false;
            for (var m = 0; m < openProduct.length; m++) {
                if (openProduct[m].product == products[i].codeValue) {
                    isOpen = true;
                    break;
                }
            }
            if (!isOpen) {
                accessProducts.push({
                    boxLabel: products[i].codeName,
                    name: 'product',
                    inputValue: products[i].codeValue
                });

            }
        }
        return accessProducts;
    },
    productChange: function (obj, newValue) {
        var me = this;
        var product = newValue.product;
        if (product instanceof Array) {
            return;
        }
        var fieldset = obj.up('fieldset');

        while (fieldset.items.items.length > 2) {
            fieldset.remove(fieldset.items.items[fieldset.items.items.length - 1]);
        }
        var items = null;
        if (product == "zj") {
            items = [
                {
                    xtype: 'fieldset',
                    title: '资费设置',
                    collapsible: true,
                    layout: 'column',
                    id: "open_product_feeset",
                    cls: 'backgroud_blue',
                    defaultType: 'textfield',
                    items: [
                        {
                            xtype: 'combobox',
                            fieldLabel: '外呼资费策略',
                            name: 'dialFeeStrategy',
                            editable: false,
                            store: App.util.AppUtil.getDicStore('dialPriceStrategy'),
                            displayField: 'codeName',
                            valueField: 'codeValue',
                            typeAhead: true,
                            queryMode: 'local',
                            columnWidth: .33,
                            msgTarget: 'side',
                            labelWidth: 150,
                            value: 'minute',
                            labelAlign: 'right',
                            allowBlank: false,
                            listeners: {
                                change: function (obj, newvalue) {
                                    var strategy = newvalue;
                                    var panel = obj.up('fieldset').down("#dialFee_detail_panel");
                                    panel.removeAll();
                                    var items = [];
                                    if (strategy == "minute") {
                                        items = [
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '手机市话(元/分钟)',
                                                value: 0.15,
                                                name: 'dial_local',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '手机长途(元/分钟)',
                                                value: 0.15,
                                                name: 'dial_remote',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '固话市话(元/分钟)',
                                                value: 0.15,
                                                name: 'dial_localTel',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '固话长途(元/分钟)',
                                                value: 0.15,
                                                name: 'dial_remoteTel',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            }
                                        ];
                                    } else if (strategy == "second6") {
                                        items = [
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '市话(元/6秒)',
                                                value: 0.015,
                                                name: 'dial_local',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '长途(元/6秒)',
                                                value: 0.015,
                                                name: 'dial_remote',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            }
                                        ];

                                    } else if (strategy == "minute3") {
                                        items = [
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '本地前3分钟资费(元)',
                                                value: 0.2,
                                                name: 'dial_prefixMin',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 1,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '本地以后每分钟(元/分钟)',
                                                value: 0.15,
                                                name: 'dial_local',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '长途(元/分钟)',
                                                value: 0.15,
                                                name: 'dial_remote',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            }
                                        ];
                                    } else if (strategy == "minute3s6") {
                                        items = [
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '本地前3分钟资费(元)',
                                                value: 0.2,
                                                name: 'dial_prefixMin',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 1,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '本地以后每分钟(元/分钟)',
                                                value: 0.15,
                                                name: 'dial_local',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '长途(元/6秒)',
                                                value: 0.015,
                                                name: 'dial_remote',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            }
                                        ];
                                    }
                                    panel.add(items);
                                }
                            }
                        },
                        {
                            xtype: 'panel',
                            layout: "column",
                            border: false,
                            bodyCls: 'backgroud_blue',
                            id: 'dialFee_detail_panel',
                            columnWidth: 1,
                            items: [
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '手机市话(元/分钟)',
                                    value: 0.15,
                                    name: 'dial_local',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '手机长途(元/分钟)',
                                    value: 0.15,
                                    name: 'dial_remote',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '固话市话(元/分钟)',
                                    value: 0.15,
                                    name: 'dial_localTel',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '固话长途(元/分钟)',
                                    value: 0.15,
                                    name: 'dial_remoteTel',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                }
                            ]
                        },
                        {
                            xtype: 'combobox',
                            fieldLabel: '呼转资费策略',
                            name: 'transferFeeStrategy',
                            editable: false,
                            store: App.util.AppUtil.getDicStore('dialPriceStrategy'),
                            displayField: 'codeName',
                            valueField: 'codeValue',
                            typeAhead: true,
                            queryMode: 'local',
                            columnWidth: .33,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            value: 'minute',
                            allowBlank: false,
                            listeners: {
                                change: function (obj, newvalue) {
                                    var strategy = newvalue;
                                    var panel = obj.up('fieldset').down("#transferFee_detail_panel");
                                    panel.removeAll();
                                    var items = [];
                                    if (strategy == "minute") {
                                        items = [
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '手机市话(元/分钟)',
                                                value: 0.15,
                                                name: 'transfer_local',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '手机长途(元/分钟)',
                                                value: 0.15,
                                                name: 'transfer_remote',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '固话市话(元/分钟)',
                                                value: 0.15,
                                                name: 'transfer_localTel',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '固话长途(元/分钟)',
                                                value: 0.15,
                                                name: 'transfer_remoteTel',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            }
                                        ];
                                    } else if (strategy == "second6") {
                                        items = [

                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '市话(元/6秒)',
                                                value: 0.015,
                                                name: 'transfer_local',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '长途(元/6秒)',
                                                value: 0.015,
                                                name: 'transfer_remote',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            }
                                        ];

                                    } else if (strategy == "minute3") {
                                        items = [
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '本地前3分钟资费(元)',
                                                value: 0.2,
                                                name: 'transfer_prefixMin',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 1,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '本地以后每分钟(元/分钟)',
                                                value: 0.15,
                                                name: 'transfer_local',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '长途(元/分钟)',
                                                value: 0.15,
                                                name: 'transfer_remote',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            }
                                        ];
                                    } else if (strategy == "minute3s6") {
                                        items = [
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '本地前3分钟资费(元)',
                                                value: 0.2,
                                                name: 'transfer_prefixMin',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 1,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '本地以后每分钟(元/分钟)',
                                                value: 0.15,
                                                name: 'transfer_local',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '长途(元/6秒)',
                                                value: 0.015,
                                                name: 'transfer_remote',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            }
                                        ];
                                    }
                                    panel.add(items);
                                }
                            }
                        },
                        {
                            xtype: 'panel',
                            layout: "column",
                            name: "transferFee",
                            border: false,
                            bodyCls: 'backgroud_blue',
                            id: 'transferFee_detail_panel',
                            columnWidth: 1,
                            items: [
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '手机市话(元/分钟)',
                                    value: 0.15,
                                    name: 'transfer_local',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '手机长途(元/分钟)',
                                    value: 0.15,
                                    name: 'transfer_remote',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '固话市话(元/分钟)',
                                    value: 0.15,
                                    name: 'transfer_localTel',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '固话长途(元/分钟)',
                                    value: 0.15,
                                    name: 'transfer_remoteTel',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                }
                            ]
                        },
                        {
                            xtype: 'numberfield',
                            fieldLabel: '低消',
                            value: 0,
                            name: 'minConsume',
                            columnWidth: .33,
                            decimalPrecision: 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue: 0,
                            allowBlank: false
                        },
                        {
                            xtype: 'numberfield',
                            fieldLabel: '呼入并发(元/路)',
                            value: 50,
                            name: 'concurrentPrice',
                            columnWidth: .33,
                            decimalPrecision: 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue: gloab_concurrentPrice,
                            allowBlank: false
                        },
                        {
                            xtype: 'numberfield',
                            fieldLabel: '话费折扣(元/分钟)',
                            value: 0,
                            name: 'discount',
                            columnWidth: .33,
                            decimalPrecision: 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue: 0,
                            allowBlank: false,
                            hidden: App.util.AppUtil.isHide2()
                        },
                        {
                            xtype: 'fieldset',
                            title: '国际长途资费',
                            columnWidth:1,
                            name:'intlFeeSet',
                            collapsible: true,
                            id: "intl_fee_set",
                            layout: 'column',
                            cls: 'backgroud_blue',
                            items:[
                                {
                                    xtype: 'checkbox',
                                    fieldLabel: '开通国际长途',
                                    labelWidht: 50,
                                    name: 'isOpenIntl',
                                    id: 'open_product_intl_is_open_intl',
                                    columnWidth: .2,
                                },
                                {
                                    xtype: 'combobox',
                                    fieldLabel: '线路',
                                    labelWidth:50,
                                    name:'intlLine',
                                    id:'open_product_intl_fee_line',
                                    editable:true,
                                    store: App.util.AppUtil.getDicStore('line',true,{line_type:"international"}),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    columnWidth: .25,
                                    hidden:true,
                                },
                                {
                                    xtype: 'checkbox',
                                    fieldLabel: '允许其他区域',
                                    labelWidth: 100,
                                    name: 'allowOther',
                                    id: 'open_product_intl_allow_other',
                                    columnWidth: .25,
                                    hidden:true,
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '其他区域价格',
                                    labelWidth: 80,
                                    name: 'otherPrice',
                                    id: 'open_product_intl_other_price',
                                    columnWidth: .2,
                                    hidden:true,
                                    minValue: 10,
                                },
                                {
                                    xtype:'grid',
                                    class: 'query',
                                    forceFit: true,
                                    data:null,
                                    id:'open_product_intl_fee_grid',
                                    columnLines: true,
                                    bodyStyle: 'padding:0',
                                    columnWidth:1,
                                    header: false,
                                    hidden:true,
                                    store: Ext.create('Ext.data.JsonStore', {
                                        fields:[
                                            {name:'code',type:'string'},
                                            {name:'price',type:'number'},
                                            {name:'memo',type:'string'},
                                        ],
                                        pageSize: 1000,
                                        proxy:{
                                            type:'pagingmemory',
                                            reader: {
                                                type: 'json'
                                            },
                                        },
                                        autoLoad:false,
                                    }),
                                    dockedItems: [
                                        {
                                            xtype: 'toolbar',
                                            class: 'dock',
                                            items: [
                                                {
                                                    iconCls: 'set_icon_cls',
                                                    text: '修改',
                                                    id: 'update_intl_fee_tool',
                                                    disabled: true,
                                                    needSelect: true
                                                },
                                                {
                                                    iconCls: 'delete_icon_cls',
                                                    text: '删除',
                                                    id: 'delete_intl_fee_tool',
                                                    disabled: true,
                                                    needSelect: true
                                                },
                                                {
                                                    iconCls: 'add_icon_cls',
                                                    text: '添加',
                                                    id: 'add_intl_fee_tool',
                                                    needSelect: false
                                                }
                                            ]
                                        }
                                    ],

                                    columns: [
                                        {
                                            dataIndex: 'code',
                                            width: 90,
                                            align: 'center',
                                            header: '区域代码'
                                        },
                                        {
                                            dataIndex: 'price',
                                            header: '价格',
                                            align: 'center',
                                            width: 90,
                                            renderer: function(price){
                                                return price;
                                            }
                                        },
                                        {
                                            dataIndex: 'memo',
                                            header: '备注',
                                            align: 'center',
                                        }
                                    ],
                                    viewConfig: {
                                        forceFit: true
                                    },
                                }
                            ]
                        },
                        {
                            xtype: 'panel',
                            layout: "column",
                            border: false,
                            bodyCls: 'backgroud_blue',
                            columnWidth: 1,
                            items: [
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '短信资费(元/条)',
                                    value: 0.1,
                                    name: 'smsFee',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: App.util.AppUtil.formatTrueFee(gloab_client_user.smsFee || 0),
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '短信折扣(元/条)',
                                    value: 0,
                                    name: 'smsDiscount',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    allowBlank: false,
                                    hidden: App.util.AppUtil.isHide2()
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '最小短信分割字数',
                                    value: 0,
                                    name: 'smsSplitBaseNum',
                                    columnWidth: .33,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 1,
                                    maxValue: 70,
                                    value: 66,
                                    allowBlank: true,
                                    hidden: App.util.AppUtil.isHide2()
                                }
                            ]
                        }
                    ]
                },
                {
                    xtype: 'fieldset',
                    title: '节点选择',
                    id: "open_product_node",
                    collapsible: true,
                    layout: 'column',
                    cls: 'backgroud_blue',
                    defaultType: 'textfield',
                    items: [
                        {
                            xtype: 'combobox',
                            fieldLabel: 'PBX实例',
                            name: 'node',
                            editable: false,
                            store: this.up('window').getZJPbxStore(this.up("window").zjBoards),
                            displayField: 'codeName',
                            valueField: 'codeValue',
                            typeAhead: true,
                            queryMode: 'local',
                            columnWidth: .33,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            allowBlank: false
                        }
                    ]
                },
                {
                    xtype: 'fieldset',
                    layout: {
                        type: 'hbox',
                        pack: 'center',
                        align: 'middle'
                    },
                    cls: 'no_border',
                    items: [
                        {
                            xtype: "button",
                            text: "确认开通",
                            id: 'open_new_product',
                            width: 100,
                            style: {
                                marginBottom: '10px'
                            }
                        }
                    ]
                }

            ];
        } else if (product == "cc") {
            items = [
                {
                    xtype: 'fieldset',
                    title: '资费设置',
                    collapsible: true,
                    id: "open_product_feeset",
                    layout: 'column',
                    cls: 'backgroud_blue',
                    defaultType: 'textfield',
                    items: [
                        {
                            xtype: 'combobox',
                            fieldLabel: '外呼版licence策略',
                            name: 'calloutLicenceStrategy',
                            value: 'defined',
                            editable: false,
                            store: [["defined", "自定义"], ["licencePrice", "按licence套餐"]],
                            //store: App.util.AppUtil.getDicStore('calloutLicenceStrategy'),
                            //displayField: 'codeName',
                            //valueField: 'codeValue',
                            typeAhead: true,
                            queryMode: 'local',
                            columnWidth: .33,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            allowBlank: false,
                            listeners: {
                                change: function (obj, newvalue) {
                                    var strategy = newvalue;
                                    var panel = obj.up('fieldset').down("#callout_licence_strategy_panel");
                                    panel.removeAll();
                                    var items = [];
                                    if (strategy == "defined") {
                                        items = [
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '低消',
                                                value: 0,
                                                name: 'minConsume',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '低消赠送分钟数',
                                                value: 0,
                                                name: 'giveMinute',
                                                columnWidth: .33,
                                                decimalPrecision: 0,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'panel',
                                                layout: "column",
                                                border: false,
                                                bodyCls: 'backgroud_blue',
                                                columnWidth: 1,
                                                items: [
                                                    {
                                                        xtype: 'combobox',
                                                        fieldLabel: '低消生效日期',
                                                        name: 'effectYear',
                                                        value: "",
                                                        store: [["", "空"], ["2015", "2015"], ["2016", "2016"], ["2017", "2017"], ["2018", "2018"], ["2019", "2019"], ["2020", "2020"]],
                                                        typeAhead: true,
                                                        queryMode: 'local',
                                                        msgTarget: 'side',
                                                        labelWidth: 150,
                                                        labelAlign: 'right',
                                                        editable: false,
                                                        columnWidth: .28
                                                    },
                                                    {
                                                        xtype: 'label',
                                                        text: '--',
                                                        columnWidth: .02
                                                    },
                                                    {
                                                        xtype: 'combobox',
                                                        name: 'effectMonth',
                                                        value: "",
                                                        store: [["", "空"], ["01", "01"], ["02", "02"], ["03", "03"], ["04", "04"], ["05", "05"], ["06", "06"],
                                                            ["07", "07"], ["08", "08"], ["09", "09"], ["10", "10"], ["11", "11"], ["12", "12"]],
                                                        typeAhead: true,
                                                        queryMode: 'local',
                                                        editable: false,
                                                        hideLabel: true,
                                                        columnWidth: .08
                                                    }
                                                ]
                                            }
                                        ];
                                    } else if (strategy == "licencePrice") {
                                        items = [
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '套餐价格(元)',
                                                value: 100,
                                                name: 'calloutLicence',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '赠送分钟数(月/坐席)',
                                                value: 1000,
                                                name: 'calloutMinute',
                                                columnWidth: .33,
                                                decimalPrecision: 0,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                allowBlank: false
                                            }
                                            //{
                                            //    xtype: 'label',
                                            //    style:'color:red;margin-left:25px;',
                                            //    text: '温馨提示：外呼版licence数量在用户中心添加和调整',
                                            //    columnWidth: .66
                                            //},
                                        ];
                                    }
                                    panel.add(items);
                                }
                            }
                        },
                        {
                            xtype: 'panel',
                            layout: "column",
                            border: false,
                            bodyCls: 'backgroud_blue',
                            id: 'callout_licence_strategy_panel',
                            columnWidth: 1,
                            items: [
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '低消',
                                    value: 0,
                                    name: 'minConsume',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '低消赠送分钟数',
                                    value: 0,
                                    name: 'giveMinute',
                                    columnWidth: .33,
                                    decimalPrecision: 0,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'panel',
                                    layout: "column",
                                    border: false,
                                    bodyCls: 'backgroud_blue',
                                    columnWidth: 1,
                                    items: [
                                        {
                                            xtype: 'combobox',
                                            fieldLabel: '低消生效日期',
                                            name: 'effectYear',
                                            value: "",
                                            store: [["", "空"], ["2015", "2015"], ["2016", "2016"], ["2017", "2017"], ["2018", "2018"], ["2019", "2019"], ["2020", "2020"]],
                                            typeAhead: true,
                                            queryMode: 'local',
                                            msgTarget: 'side',
                                            labelWidth: 150,
                                            labelAlign: 'right',
                                            editable: false,
                                            columnWidth: .28
                                        },
                                        {
                                            xtype: 'label',
                                            text: '--',
                                            columnWidth: .02
                                        },
                                        {
                                            xtype: 'combobox',
                                            name: 'effectMonth',
                                            value: "",
                                            store: [["", "空"], ["01", "01"], ["02", "02"], ["03", "03"], ["04", "04"], ["05", "05"], ["06", "06"],
                                                ["07", "07"], ["08", "08"], ["09", "09"], ["10", "10"], ["11", "11"], ["12", "12"]],
                                            typeAhead: true,
                                            queryMode: 'local',
                                            editable: false,
                                            hideLabel: true,
                                            columnWidth: .08
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            xtype: 'combobox',
                            fieldLabel: '外呼资费策略',
                            name: 'dialFeeStrategy',
                            editable: false,
                            store: App.util.AppUtil.getDicStore('dialPriceStrategy'),
                            displayField: 'codeName',
                            valueField: 'codeValue',
                            typeAhead: true,
                            queryMode: 'local',
                            columnWidth: .33,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            allowBlank: false,
                            value: 'minute',
                            listeners: {
                                change: function (obj, newvalue) {
                                    var strategy = newvalue;
                                    var panel = obj.up('fieldset').down("#dialFee_detail_panel");
                                    panel.removeAll();
                                    var items = [];
//                                    console.log(strategy);
                                    if (strategy == "minute") {
                                        items = [
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '手机市话(元/分钟)',
                                                value: 0.15,
                                                name: 'dial_local',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '手机长途(元/分钟)',
                                                value: 0.15,
                                                name: 'dial_remote',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '固话市话(元/分钟)',
                                                value: 0.15,
                                                name: 'dial_localTel',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '固话长途(元/分钟)',
                                                value: 0.15,
                                                name: 'dial_remoteTel',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            }
                                        ];
                                    } else if (strategy == "second6") {
                                        items = [

                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '市话(元/6秒)',
                                                value: 0.015,
                                                name: 'dial_local',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '长途(元/6秒)',
                                                value: 0.015,
                                                name: 'dial_remote',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            }
                                        ];

                                    } else if (strategy == "minute3") {
                                        items = [
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '本地前3分钟资费(元)',
                                                value: 0.2,
                                                name: 'dial_prefixMin',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 1,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '本地以后每分钟(元/分钟)',
                                                value: 0.15,
                                                name: 'dial_local',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '长途(元/分钟)',
                                                value: 0.15,
                                                name: 'dial_remote',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            }
                                        ];
                                    } else if (strategy == "minute3s6") {
                                        items = [
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '本地前3分钟资费(元)',
                                                value: 0.2,
                                                name: 'dial_prefixMin',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 1,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '本地以后每分钟(元/分钟)',
                                                value: 0.15,
                                                name: 'dial_local',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '长途(元/6秒)',
                                                value: 0.015,
                                                name: 'dial_remote',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            }
                                        ];
                                    }
                                    panel.add(items);

                                }
                            }
                        },
                        {
                            xtype: 'panel',
                            layout: "column",
                            border: false,
                            bodyCls: 'backgroud_blue',
                            id: 'dialFee_detail_panel',
                            columnWidth: 1,
                            items: [
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '手机市话(元/分钟)',
                                    value: 0.15,
                                    name: 'dial_local',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '手机长途(元/分钟)',
                                    value: 0.15,
                                    name: 'dial_remote',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '固话市话(元/分钟)',
                                    value: 0.15,
                                    name: 'dial_localTel',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '固话长途(元/分钟)',
                                    value: 0.15,
                                    name: 'dial_remoteTel',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                }
                            ]
                        },
                        {
                            xtype: 'combobox',
                            fieldLabel: '呼转资费策略',
                            name: 'transferFeeStrategy',
                            editable: false,
                            store: App.util.AppUtil.getDicStore('dialPriceStrategy'),
                            displayField: 'codeName',
                            valueField: 'codeValue',
                            typeAhead: true,
                            queryMode: 'local',
                            columnWidth: .33,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            value: 'minute',
                            allowBlank: false,
                            listeners: {
                                change: function (obj, newvalue) {
                                    var strategy = newvalue;
                                    var panel = obj.up('fieldset').down("#transferFee_detail_panel");
                                    panel.removeAll();
                                    var items = [];
                                    if (strategy == "minute") {
                                        items = [
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '手机市话(元/分钟)',
                                                value: 0.15,
                                                name: 'transfer_local',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '手机长途(元/分钟)',
                                                value: 0.15,
                                                name: 'transfer_remote',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '固话市话(元/分钟)',
                                                value: 0.15,
                                                name: 'transfer_localTel',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '固话长途(元/分钟)',
                                                value: 0.15,
                                                name: 'transfer_remoteTel',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            }
                                        ];
                                    } else if (strategy == "second6") {
                                        items = [

                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '市话(元/6秒)',
                                                value: 0.015,
                                                name: 'transfer_local',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '长途(元/6秒)',
                                                value: 0.015,
                                                name: 'transfer_remote',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            }
                                        ];

                                    } else if (strategy == "minute3") {
                                        items = [
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '本地前3分钟资费(元)',
                                                value: 0.2,
                                                name: 'transfer_prefixMin',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 1,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '本地以后每分钟(元/分钟)',
                                                value: 0.15,
                                                name: 'transfer_local',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '长途(元/分钟)',
                                                value: 0.15,
                                                name: 'transfer_remote',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            }
                                        ];
                                    } else if (strategy == "minute3s6") {
                                        items = [
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '本地前3分钟资费(元)',
                                                value: 0.2,
                                                name: 'transfer_prefixMin',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 1,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '本地以后每分钟(元/分钟)',
                                                value: 0.15,
                                                name: 'transfer_local',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            },
                                            {
                                                xtype: 'numberfield',
                                                fieldLabel: '长途(元/6秒)',
                                                value: 0.015,
                                                name: 'transfer_remote',
                                                columnWidth: .33,
                                                decimalPrecision: 4,
                                                msgTarget: 'side',
                                                labelWidth: 150,
                                                labelAlign: 'right',
                                                minValue: 0,
                                                maxValue: 0.3,
                                                allowBlank: false
                                            }
                                        ];
                                    }
                                    panel.add(items);

                                }
                            }
                        },
                        {
                            xtype: 'panel',
                            layout: "column",
                            border: false,
                            bodyCls: 'backgroud_blue',
                            id: 'transferFee_detail_panel',
                            columnWidth: 1,
                            items: [
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '手机市话(元/分钟)',
                                    value: 0.15,
                                    name: 'transfer_local',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '手机长途(元/分钟)',
                                    value: 0.15,
                                    name: 'transfer_remote',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '固话市话(元/分钟)',
                                    value: 0.15,
                                    name: 'transfer_localTel',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '固话长途(元/分钟)',
                                    value: 0.15,
                                    name: 'transfer_remoteTel',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                }
                            ]
                        },
                        {
                            xtype: 'numberfield',
                            fieldLabel: '话费折扣(元/分钟)',
                            value: 0,
                            name: 'discount',
                            columnWidth: .33,
                            decimalPrecision: 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue: 0,
                            allowBlank: false,
                            hidden: App.util.AppUtil.isHide2()
                        },
                        {
                            xtype: 'panel',
                            layout: "column",
                            border: false,
                            bodyCls: 'backgroud_blue',
                            columnWidth: 1,
                            items: [
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '标准版',
                                    value: 99,
                                    //readOnly: true,
                                    name: 'serviceLicence',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: App.util.AppUtil.formatTrueFee(gloab_client_user.serviceLicence || 0),
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '企业版',
                                    value: 399,
                                    name: 'callinLicence',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: App.util.AppUtil.formatTrueFee(gloab_client_user.callinLicence || 0),
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '监控版',
                                    value: 50,
                                    name: 'monitorLicence',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: App.util.AppUtil.formatTrueFee(gloab_client_user.monitorLicence || 0),
                                    allowBlank: false
                                }
                            ]
                        },
                        {
                            xtype: 'fieldset',
                            title: '国际长途资费',
                            columnWidth:1,
                            name:'intlFeeSet',
                            collapsible: true,
                            id: "intl_fee_set",
                            layout: 'column',
                            cls: 'backgroud_blue',
                            items:[
                                {
                                    xtype: 'checkbox',
                                    fieldLabel: '开通国际长途',
                                    labelWidht: 50,
                                    name: 'isOpenIntl',
                                    id: 'open_product_intl_is_open_intl',
                                    columnWidth: .2,
                                },
                                {
                                    xtype: 'combobox',
                                    fieldLabel: '线路',
                                    labelWidth:50,
                                    name:'intlLine',
                                    id:'open_product_intl_fee_line',
                                    editable:true,
                                    store: App.util.AppUtil.getDicStore('line',true,{line_type:"international"}),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    columnWidth: .25,
                                    hidden:true,
                                },
                                {
                                    xtype: 'checkbox',
                                    fieldLabel: '允许其他区域',
                                    labelWidth: 100,
                                    name: 'allowOther',
                                    id: 'open_product_intl_allow_other',
                                    columnWidth: .25,
                                    hidden:true,
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '其他区域价格',
                                    labelWidth: 80,
                                    name: 'otherPrice',
                                    id: 'open_product_intl_other_price',
                                    columnWidth: .2,
                                    hidden:true,
                                    minValue: 10,
                                },
                                {
                                    xtype:'grid',
                                    class: 'query',
                                    forceFit: true,
                                    data:null,
                                    id:'open_product_intl_fee_grid',
                                    columnLines: true,
                                    bodyStyle: 'padding:0',
                                    columnWidth:1,
                                    header: false,
                                    hidden:true,
                                    store: Ext.create('Ext.data.JsonStore', {
                                        fields:[
                                            {name:'code',type:'string'},
                                            {name:'price',type:'number'},
                                            {name: 'memo', type:'string'},
                                        ],
                                        pageSize: 1000,
                                        proxy:{
                                            type:'pagingmemory',
                                            reader: {
                                                type: 'json'
                                            },
                                        },
                                        autoLoad:false,
                                    }),
                                    dockedItems: [
                                        {
                                            xtype: 'toolbar',
                                            class: 'dock',
                                            items: [
                                                {
                                                    iconCls: 'set_icon_cls',
                                                    text: '修改',
                                                    id: 'update_intl_fee_tool',
                                                    disabled: true,
                                                    needSelect: true
                                                },
                                                {
                                                    iconCls: 'delete_icon_cls',
                                                    text: '删除',
                                                    id: 'delete_intl_fee_tool',
                                                    disabled: true,
                                                    needSelect: true
                                                },
                                                {
                                                    iconCls: 'add_icon_cls',
                                                    text: '添加',
                                                    id: 'add_intl_fee_tool',
                                                    needSelect: false
                                                }
                                            ]
                                        }
                                    ],

                                    columns: [
                                        {
                                            dataIndex: 'code',
                                            width: 90,
                                            align: 'center',
                                            header: '区域代码'
                                        },
                                        {
                                            dataIndex: 'price',
                                            header: '价格',
                                            align: 'center',
                                            width:90,
                                            renderer: function(price){
                                                return price;
                                            }
                                        },
                                        {
                                            dataIndex: 'memo',
                                            header: '备注',
                                            align: 'center',
                                        }
                                    ],
                                    viewConfig: {
                                        forceFit: true
                                    },
                                }
                            ]
                        },
                        {
                            xtype: 'panel',
                            layout: "column",
                            border: false,
                            bodyCls: 'backgroud_blue',
                            columnWidth: 1,
                            items: [
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '短信资费(元/条)',
                                    value: 0.1,
                                    name: 'smsFee',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: App.util.AppUtil.formatTrueFee(gloab_client_user.smsFee || 0),
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '短信折扣(元/条)',
                                    value: 0,
                                    name: 'smsDiscount',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    allowBlank: false,
                                    hidden: App.util.AppUtil.isHide2()
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '最小短信分割字数',
                                    name: 'smsSplitBaseNum',
                                    columnWidth: .33,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 1,
                                    maxValue: 70,
                                    value:66,
                                    allowBlank: true,
                                    hidden: App.util.AppUtil.isHide2()
                                },
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '微信第三方平台appid',
                                    name: 'wechatAppId',
                                    columnWidth: .33,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 1,
                                    maxValue: 70,
                                    //hidden: App.util.AppUtil.isHide2()
                                },
                            ]
                        }
                        /* ---------------------------------------------------------------*/

                    ]
                },
//                {
//                    xtype: 'fieldset',
//                    title: '节点选择',
//                    id : "open_product_node",
//                    collapsible: true,
//                    layout: 'column',
//                    cls: 'backgroud_blue',
//                    defaultType: 'textfield',
//                    items: [
//                        {
//                            xtype: 'combobox',
//                            fieldLabel: '产品开通节点',
//                            name: 'node',
//                            editable: false,
//                            store: App.util.AppUtil.getDicStore('ccBoard'),
//                            displayField: 'codeName',
//                            valueField: 'codeValue',
//                            typeAhead: true,
//                            queryMode: 'local',
//                            columnWidth: .33,
//                            msgTarget: 'side',
//                            labelWidth: 150,
//                            labelAlign: 'right',
//                            allowBlank: false
//                        }
//                    ]
//                },
                {
                    xtype: 'fieldset',
                    layout: {
                        type: 'hbox',
                        pack: 'center',
                        align: 'middle'
                    },
                    cls: 'no_border',
                    items: [
                        {
                            xtype: "button",
                            text: "确认开通",
                            id: 'open_new_product',
                            width: 100,
                            style: {
                                marginBottom: '10px'
                            }
                        }
                    ]
                }

            ];
        } else if (product == "ll") {
            items = [
                {
                    xtype: 'fieldset',
                    title: '资费设置',
                    collapsible: true,
                    layout: 'column',
                    id: "open_product_feeset",
                    cls: 'backgroud_blue',
                    defaultType: 'textfield',
                    items: [
                        {
                            fieldLabel: "运营商",
                            editable: false,
                            name: 'operatorsResource',
                            columnWidth: .40,
                            labelWidth: 150,
                            value: "中国移动（单位：元）",
                            labelAlign: 'right',
                            readOnly: true
                        },
                        {
                            xtype: 'panel',
                            layout: "column",
                            border: false,
                            bodyCls: 'backgroud_blue',
                            id: 'llFee_detail_panel',
                            columnWidth: 1,
                            items: [
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '10M',
                                    value: 3,
                                    name: 'fee_100001',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 1000,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '30M',
                                    value: 5,
                                    name: 'fee_100002',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 1000,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '70M',
                                    value: 10,
                                    name: 'fee_100003',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 1000,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '150M',
                                    value: 20,
                                    name: 'fee_100004',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 1000,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '500M',
                                    value: 30,
                                    name: 'fee_100005',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 1000,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '1024M',
                                    value: 50,
                                    name: 'fee_100006',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 1000,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '2048M',
                                    value: 100,
                                    name: 'fee_100007',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 1000,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '3072M',
                                    value: 150,
                                    name: 'fee_100008',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 1000,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '4096M',
                                    value: 200,
                                    name: 'fee_100009',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 1000,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '6144M',
                                    value: 300,
                                    name: 'fee_100010',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 1000,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '11264M',
                                    value: 550,
                                    name: 'fee_100011',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 1000,
                                    allowBlank: false
                                }
                            ]
                        },
                        {
                            fieldLabel: "运营商",
                            editable: false,
                            name: 'operatorsResource',
                            columnWidth: .40,
                            labelWidth: 150,
                            value: "中国联通（单位：元）",
                            labelAlign: 'right',
                            readOnly: true
                        },
                        {
                            xtype: 'panel',
                            layout: "column",
                            border: false,
                            bodyCls: 'backgroud_blue',
                            id: 'ltFee_detail_panel',
                            columnWidth: 1,
                            items: [
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '20M',
                                    value: 3,
                                    name: 'fee_200001',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 10,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '50M',
                                    value: 6,
                                    name: 'fee_200002',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 50,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '100M',
                                    value: 10,
                                    name: 'fee_200003',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 50,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '200M',
                                    value: 15,
                                    name: 'fee_200004',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 50,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '500M',
                                    value: 30,
                                    name: 'fee_200005',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 50,
                                    allowBlank: false
                                }

                            ]
                        },
                        {
                            fieldLabel: "运营商",
                            editable: false,
                            name: 'operatorsResource',
                            columnWidth: .40,
                            labelWidth: 150,
                            value: "中国电信（单位：元）",
                            labelAlign: 'right',
                            readOnly: true
                        },
                        {
                            xtype: 'panel',
                            layout: "column",
                            border: false,
                            bodyCls: 'backgroud_blue',
                            id: 'dxFee_detail_panel',
                            columnWidth: 1,
                            items: [
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '5M',
                                    value: 1,
                                    name: 'fee_300001',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 1000,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '10M',
                                    value: 2,
                                    name: 'fee_300002',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 1000,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '30M',
                                    value: 5,
                                    name: 'fee_300003',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 1000,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '50M',
                                    value: 7,
                                    name: 'fee_300004',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 1000,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '100M',
                                    value: 10,
                                    name: 'fee_300005',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 1000,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '200M',
                                    value: 15,
                                    name: 'fee_300006',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 1000,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '500M',
                                    value: 30,
                                    name: 'fee_300007',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 1000,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '1024M',
                                    value: 50,
                                    name: 'fee_300008',
                                    columnWidth: .33,
                                    decimalPrecision: 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 1000,
                                    allowBlank: false
                                }

                            ]
                        }
                    ]
                },
                {
                    xtype: 'fieldset',
                    layout: {
                        type: 'hbox',
                        pack: 'center',
                        align: 'middle'
                    },
                    cls: 'no_border',
                    items: [
                        {
                            xtype: "button",
                            text: "确认开通",
                            id: 'open_new_product',
                            width: 100,
                            style: {
                                marginBottom: '10px'
                            }
                        }
                    ]
                }
            ];
        } else if(product == 'custFee'){
            items = [{
                xtype: 'fieldset',
                title: '扣费规则设置',
                collapsible: true,
                layout: 'fit',
                id: "open_product_cust_fee",
                cls: 'backgroud_blue',
                items:[
                    {
                        xtype:'grid',
                        class: 'query',
                        id: 'open_product_cust_fee_grid',
                        forceFit: true,
                        data:null,
                        columnLines: true,
                        bodyStyle: 'padding:0',
                        header: false,
                        store: Ext.create('Ext.data.JsonStore', {
                            fields:[
                                {name:'name',type:'string'},
                                {name:'pricePeriod',type:'string'},
                                {name:'price',type:'number'},
                                {name:'autoRenew',type:'boolean'},
                                {name:'memo',type:'string'},
                            ],
                            pageSize: 1000,
                            proxy:{
                                type:'pagingmemory',
                                reader: {
                                    type: 'json'
                                },
                            },
                            autoLoad:false,
                        }),
                        dockedItems: [
                            {
                                xtype: 'toolbar',
                                class: 'dock',
                                items: [
                                    {
                                        iconCls: 'set_icon_cls',
                                        text: '修改',
                                        id: 'update_cust_fee_tool',
                                        disabled: true,
                                        needSelect: true
                                    },
                                    {
                                        iconCls: 'delete_icon_cls',
                                        text: '删除',
                                        id: 'delete_cust_fee_tool',
                                        disabled: true,
                                        needSelect: true
                                    },
                                    {
                                        iconCls: 'add_icon_cls',
                                        text: '添加',
                                        id: 'add_cust_fee_tool',
                                        needSelect: false
                                    }
                                ]
                            }
                        ],

                        columns: [
                            {
                                dataIndex: 'name',
                                width: 90,
                                align: 'center',
                                header: '名称'
                            },
                            {
                                dataIndex: 'pricePeriod',
                                header: '计价周期',
                                align: 'center',
                                renderer: function(value){
                                    return App.util.AppUtil.getRendererValue(value, 'custFeePricePeriod');
                                }
                            },
                            {
                                dataIndex: 'price',
                                header: '单价',
                                align: 'center',
                                renderer: function(price){
                                    return price;
                                }
                            },
                            {
                                dataIndex: 'autoRenew',
                                header: '自动续费',
                                align: 'center',
                                renderer: function(autoRenew){
                                    return autoRenew? '是':'否'
                                }
                            },
                            {
                                dataIndex: 'memo',
                                header: '备注',
                                align: 'center'
                            }
                        ],
                        viewConfig: {
                            forceFit: true
                        }
                    },
                ]
            },{
                xtype: 'fieldset',
                title: '手续费率设置',
                collapsible: true,
                layout: 'column',
                cls: 'backgroud_blue',
                defaultType: 'textfield',
                items:[
                    {
                        xtype: 'numberfield',
                        id: "open_product_cust_fee_poundage",
                        fieldLabel: '手续费率(百分之)',
                        value: 0,
                        name: 'poundage',
                        columnWidth: .33,
                        msgTarget: 'side',
                        labelWidth: 150,
                        labelAlign: 'right',
                        minValue: 0,
                        maxValue: 100,
                        allowBlank: false
                    }
                ]
            },

                {
                    xtype: 'fieldset',
                    layout: {
                        type: 'hbox',
                        pack: 'center',
                        align: 'middle'
                    },
                    cls: 'no_border',
                    items: [
                        {
                            xtype: "button",
                            text: "确认开通",
                            id: 'open_new_cust_fee_product',
                            width: 100,
                            style: {
                                marginBottom: '10px'
                            }
                        }
                    ]
                }
            ];

        } else if (product == 'yy') {
            items = [{
                xtype: 'fieldset',
                title: '资费设置',
                collapsible: true,
                layout: 'column',
                id: "open_product_feeset",
                cls: 'backgroud_blue',
                defaultType: 'textfield',
                items:[{
                    xtype: 'numberfield',
                    fieldLabel: '语音资费(元/分钟)',
                    value: 0.06,
                    name: 'voiceFee',
                    columnWidth: .33,
                    decimalPrecision: 4,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    maxValue: 1,
                    allowBlank: false
                }]},
                {
                    xtype: 'fieldset',
                    layout: {
                        type: 'hbox',
                        pack: 'center',
                        align: 'middle'
                    },
                    cls: 'no_border',
                    items: [
                        {
                            xtype: "button",
                            text: "确认开通",
                            id: 'open_new_product',
                            width: 100,
                            style: {
                                marginBottom: '10px'
                            }
                        }
                    ]
                }];
        }

        fieldset.add(items);
    },
    getAccountProductStore: function () {
        if (!this.productStore) {
            this.productStore = Ext.create('Ext.data.Store', {
                model: 'App.model.account.AccountProduct',
                data: this.data || []
            });
        }
        return this.productStore;
    },
    getZJPbxStore: function (boards) {
        var store = App.util.AppUtil.getDicStore('pbx');
        boards=boards||[];
        store.each(function (item) {
            if (item.get("codeValue") == 'holly.ali.1.0'||item.get("codeValue") == 'holly.ali.1.1'
                ||item.get("codeValue") == 'holly.ali.1.2'||item.get("codeValue") == 'holly.ali.1.3') {
                store.remove(item);
            }else {
                var count=0;
                for (var i = 0; i < boards.length; i++) {
                    var obj = boards[i];
                    if(obj==item.raw.board){
                        count++
                        break;
                    }
                }
                if(count==0){
                    store.remove(item);
                }
            }
        });
        return store;
    }
});
