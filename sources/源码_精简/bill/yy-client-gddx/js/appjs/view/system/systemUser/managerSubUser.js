/**
 * Created by zhangyang on 15/3/20.
 */
Ext.define('App.view.system.systemUser.managerSubUser', {
    extend: 'Ext.window.Window',
    requires: [],
    alias: 'widget.subUserManagerWin',
    height: 600,
    width: 850,
    title: '子账号管理',
    accountId: null,
    data: null,
    productStore: null,
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
                            title: '子账号',
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
                                    id : 'subUser_manager_grid',
                                    forceFit: true,
                                    columnLines: true,
                                    margin: '0 0 10 0',
                                    columnWidth: .99,
                                    store: this.getAccountProductStore(),
                                    dockedItems : [
                                        {
                                            xtype: 'toolbar',
                                            class: 'dock',
                                            items :[
                                                {
                                                    iconCls: 'add_icon_cls',
                                                    text: '添加',
                                                    id: 'subUser_manager_add_tool',
                                                    disabled: true,
                                                    needSelect: true
                                                },
                                                {
                                                    iconCls: 'edit_icon_cls',
                                                    text: '修改',
                                                    id: 'subUser_manager_update_tool',
                                                    disabled: true,
                                                    needSelect: true
                                                },
                                                {
                                                    iconCls: 'delete_icon_cls',
                                                    text: '删除',
                                                    id: 'subUser_manager_delete_tool',
                                                    disabled: true,
                                                    needSelect: true
                                                },
                                                {
                                                    iconCls: 'edit_icon_cls',
                                                    text: '权限配置',
                                                    id: 'subUser_manager_limit_set',
                                                    disabled: true,
                                                    needSelect: true
                                                }
                                            ]
                                        }
                                    ],
                                    columns: [
                                        {
                                            header: '产品类型',
                                            dataIndex: 'product',
                                            align: 'center',
                                            renderer : function(value){
                                                return App.util.AppUtil.getRendererValue(value,'product');
                                            }
                                        },
                                        {
                                            header: '开通时间',
                                            dataIndex: 'createTime',
                                            align: 'center'
                                        },
                                        {
                                            header: '开通节点',
                                            dataIndex: 'node',
                                            align: 'center',
                                            renderer : function(value){
                                                return App.util.AppUtil.getRendererValue(value,'board');
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
                            items: [
                                {
                                    xtype: 'fieldset',
                                    collapsible: true,
                                    title: '新产品开通',
                                    cls: 'backgroud_blue',
                                    defaultType: 'textfield',
                                    items: [
                                        {
                                            name : "account",
                                            value : this.accountId,
                                            id : "open_product_account",
                                            hidden  :true
                                        },
                                        {
                                            fieldLabel: '开通产品',
                                            name: 'product',
                                            id :"open_product_radio",
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
                    id : "open_product_feeset",
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                            name : "transferFee",
                            border: false,
                            bodyCls: 'backgroud_blue',
                            id: 'transferFee_detail_panel',
                            columnWidth: 1,
                            items: [
                            ]
                        },
                        {
                            xtype: 'numberfield',
                            fieldLabel: '低消',
                            value: 0,
                            name: 'minConsume',
                            columnWidth: .33,
                            decimalPrecision : 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue:0,
                            allowBlank: false
                        },
                        {
                            xtype: 'numberfield',
                            fieldLabel: '呼入并发(元/路)',
                            value: 10,
                            name: 'concurrentPrice',
                            columnWidth: .33,
                            decimalPrecision : 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue:gloab_concurrentPrice,
                            allowBlank: false
                        },
                        {
                            xtype: 'numberfield',
                            fieldLabel: '话费折扣(元/分钟)',
                            value: 0,
                            name: 'discount',
                            columnWidth: .33,
                            decimalPrecision : 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue:0,
                            allowBlank: false,
                            hidden:App.util.AppUtil.isHide2()
                        },
                        /* ------------------------新加国际长途----------------------------------*/
                        {
                            xtype: 'combobox',
                            fieldLabel: '国际长途策略',
                            name: 'internationalStrategy',
                            editable: false,
                            value :0,
                            store: App.util.AppUtil.getDicStore('internationalStrategy'),
                            displayField: 'codeName',
                            valueField: 'codeValue',
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
                                    var panel = obj.up('fieldset').down("#internationalFee_detail_panel");
                                    panel.removeAll();
                                    var items = [
                                        {
                                            xtype: 'numberfield',
                                            fieldLabel: '港/澳/台(元/分钟)',
                                            value: 1,
                                            name: 'intl_fee1',
                                            columnWidth: .33,
                                            decimalPrecision : 4,
                                            msgTarget: 'side',
                                            labelWidth: 150,
                                            labelAlign: 'right',
                                            minValue: 0,
                                            /*maxValue: 0.3,*/
                                            allowBlank: false
                                        },
                                        {
                                            xtype: 'numberfield',
                                            fieldLabel: '美国/加拿大(元/分钟)',
                                            value: 2,
                                            name: 'intl_fee2',
                                            columnWidth: .33,
                                            decimalPrecision : 4,
                                            msgTarget: 'side',
                                            labelWidth: 150,
                                            labelAlign: 'right',
                                            minValue: 0,
                                            /* maxValue: 0.3,*/
                                            allowBlank: false
                                        },
                                        {
                                            xtype: 'numberfield',
                                            fieldLabel: '其他(元/分钟)',
                                            value: 2,
                                            name: 'intl_fee3',
                                            columnWidth: .33,
                                            decimalPrecision : 4,
                                            msgTarget: 'side',
                                            labelWidth: 150,
                                            labelAlign: 'right',
                                            minValue: 0,
                                            /* maxValue: 0.3,*/
                                            allowBlank: false
                                        }
                                    ];
                                    panel.add(items);
                                }
                            }
                        },
                        {
                            xtype: 'panel',
                            layout: "column",
                            border: false,
                            bodyCls: 'backgroud_blue',
                            id: 'internationalFee_detail_panel',
                            columnWidth: 1,
                            items: []

                        }
                        /* ---------------------------------------------------------------*/
                    ]
                },
                {
                    xtype: 'fieldset',
                    title: '节点选择',
                    id : "open_product_node",
                    collapsible: true,
                    layout: 'column',
                    cls: 'backgroud_blue',
                    defaultType: 'textfield',
                    items: [
                        {
                            xtype: 'combobox',
                            fieldLabel: '产品开通节点',
                            name: 'node',
                            editable: false,
                            store: App.util.AppUtil.getDicStore('board'),
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
                            id :'open_new_product',
                            width : 100,
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
                    id : "open_product_feeset",
                    layout: 'column',
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
                            labelAlign: 'right',
                            allowBlank: false,
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                                                decimalPrecision : 4,
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
                            ]
                        },{
                            xtype: 'numberfield',
                            fieldLabel: '低消',
                            value: 0,
                            name: 'minConsume',
                            columnWidth: .33,
                            decimalPrecision : 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue:0,
                            allowBlank: false
                        },
                        {
                            xtype: 'numberfield',
                            fieldLabel: '低消赠送分钟数',
                            value: 0,
                            name: 'giveMinute',
                            columnWidth: .33,
                            decimalPrecision : 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue: 0,
                            allowBlank: false
                        },
                        {
                            xtype: 'numberfield',
                            fieldLabel: '话费折扣(元/分钟)',
                            value: 0,
                            name: 'discount',
                            columnWidth: .33,
                            decimalPrecision : 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue:0,
                            allowBlank: false,
                            hidden:App.util.AppUtil.isHide2()
                        },
                        {
                            xtype: 'combobox',
                            fieldLabel: '低消生效日期',
                            name: 'effectYear',
                            store: [["","空"],["2015","2015"],["2016","2016"],["2017","2017"],["2018","2018"],["2019","2019"],["2020","2020"]],
                            typeAhead: true,
                            queryMode: 'local',
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            editable:false,
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
                            store: [["","空"],["01","01"],["02","02"],["03","03"],["04","04"],["05","05"],["06","06"],
                                ["07","07"],["08","08"],["09","09"],["10","10"],["11","11"],["12","12"]],
                            typeAhead: true,
                            queryMode: 'local',
                            editable:false,
                            hideLabel: true,
                            columnWidth: .08
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
                                    fieldLabel: '标准版license',
                                    value: 100,
                                    name: 'callinLicence',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue:App.util.AppUtil.formatTrueFee(gloab_client_user.callinLicence||0),
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '外呼版license',
                                    value: 100,
                                    name: 'calloutLicence',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue:App.util.AppUtil.formatTrueFee(gloab_client_user.calloutLicence||0),
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '监控版license',
                                    value: 10,
                                    name: 'monitorLicence',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue:App.util.AppUtil.formatTrueFee(gloab_client_user.monitorLicence||0),
                                    allowBlank: false
                                }
                            ]
                        },
                        /* ------------------------新加国际长途----------------------------------*/
                        {
                            xtype: 'combobox',
                            fieldLabel: '国际长途策略',
                            name: 'internationalStrategy',
                            editable: false,
                            value :0,
                            store: App.util.AppUtil.getDicStore('internationalStrategy'),
                            displayField: 'codeName',
                            valueField: 'codeValue',
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
                                    var panel = obj.up('fieldset').down("#internationalFee_detail_panel");
                                    panel.removeAll();
                                    var items = [
                                        {
                                            xtype: 'numberfield',
                                            fieldLabel: '港/澳/台(元/分钟)',
                                            value: 1,
                                            name: 'intl_fee1',
                                            columnWidth: .33,
                                            decimalPrecision : 4,
                                            msgTarget: 'side',
                                            labelWidth: 150,
                                            labelAlign: 'right',
                                            minValue: 0,
                                            /*maxValue: 0.3,*/
                                            allowBlank: false
                                        },
                                        {
                                            xtype: 'numberfield',
                                            fieldLabel: '美国/加拿大(元/分钟)',
                                            value: 2,
                                            name: 'intl_fee2',
                                            columnWidth: .33,
                                            decimalPrecision : 4,
                                            msgTarget: 'side',
                                            labelWidth: 150,
                                            labelAlign: 'right',
                                            minValue: 0,
                                            /* maxValue: 0.3,*/
                                            allowBlank: false
                                        },
                                        {
                                            xtype: 'numberfield',
                                            fieldLabel: '其他(元/分钟)',
                                            value: 2,
                                            name: 'intl_fee3',
                                            columnWidth: .33,
                                            decimalPrecision : 4,
                                            msgTarget: 'side',
                                            labelWidth: 150,
                                            labelAlign: 'right',
                                            minValue: 0,
                                            /* maxValue: 0.3,*/
                                            allowBlank: false
                                        }
                                    ];
                                    panel.add(items);
                                }
                            }
                        },
                        {
                            xtype: 'panel',
                            layout: "column",
                            border: false,
                            bodyCls: 'backgroud_blue',
                            id: 'internationalFee_detail_panel',
                            columnWidth: 1,
                            items: []

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
                                    minValue: App.util.AppUtil.formatTrueFee(gloab_client_user.smsFee||0),
                                    allowBlank: false
                                }
                            ]
                        }
                        /* ---------------------------------------------------------------*/

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
                            id :'open_new_product',
                            width : 100,
                            style: {
                                marginBottom: '10px'
                            }
                        }
                    ]
                }

            ];
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
    }
});
