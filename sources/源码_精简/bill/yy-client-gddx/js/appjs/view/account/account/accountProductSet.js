Ext.define('App.view.account.account.accountProductSet', {
    extend: 'Ext.window.Window',
    requires: ['App.model.resource.Product', 'App.model.account.AccountProduct'],
    alias: 'widget.accountProductSetWin',
    width: 850,
    title: '产品管理',
    autoScroll: true,
    autoHeight :true,
    data: null,
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
                            title: '产品基本信息',
                            cls: 'backgroud_blue',
                            defaults: {
                                msgTarget: 'side',
                                labelWidth: 80,
                                labelAlign: 'right',
                                fieldCls: 'field_disable_cls',
                                readOnly: true
                            },
                            defaultType: 'textfield',
                            layout: {
                                type: 'column'
                            },
                            items: [
                                {
                                    fieldLabel: '产品名称',
                                    value: App.util.AppUtil.getRendererValue(this.data.product, "product"),
                                    columnWidth: .33
                                },
                                {
                                    fieldLabel: '开通节点',
                                    value: App.util.AppUtil.getRendererValue(this.data.node, "board"),
                                    columnWidth: .33
                                },
                                {
                                    fieldLabel: '开通时间',
                                    value: this.data.createTime,
                                    columnWidth: .33
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
                                    title: '产品明细',
                                    layout: 'column',
                                    id: "account_product_feeset",
                                    cls: 'backgroud_blue',
                                    defaultType: 'textfield',
                                    items: this.getProductFeeItem(this.data.product)
                                }
                            ]
                        }

                    ]
                }
            ],
            buttons: [
                {
                    text: "关闭",
                    handler: function (obj) {
                        obj.up("window").close();
                    }
                },
                {
                    text: "更新",
                    class: 'submit'
                }
            ]
        });
        me.callParent(arguments);
        me.on({
            show:function(obj){
                var height = obj.getHeight();
                if(height > 800){
                   obj.setHeight(800);
                }
            }
        })
    },
    getProductFeeItem: function (product) {
        var me = this;
        var feeItem = [];
        if (product == "zj") {
            feeItem = [
                {
                    xtype: 'combobox',
                    fieldLabel: '外呼资费策略',
                    name: 'dialFeeStrategy',
                    editable: false,
                    value: this.data.dialFeeStrategy,
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
                    items: this.getCurrentItem(product, "dial")
                },
                {
                    xtype: 'combobox',
                    fieldLabel: '呼转资费策略',
                    name: 'transferFeeStrategy',
                    editable: false,
                    value: this.data.transferFeeStrategy,
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
                    items: this.getCurrentItem(product, 'transfer')
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: '低消(元)',
                    value: this.data.minConsume,
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
                    value: this.data.concurrentPrice,
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
                    value: this.data.discount,
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
                /* ------------------------新加国际长途----------------------------------*/
                //{
                //    xtype: 'combobox',
                //    fieldLabel: '国际长途策略',
                //    name: 'internationalStrategy',
                //    editable: false,
                //    value: this.data.internationalStrategy,
                //    store: App.util.AppUtil.getDicStore('internationalStrategy'),
                //    displayField: 'codeName',
                //    valueField: 'codeValue',
                //    typeAhead: true,
                //    queryMode: 'local',
                //    columnWidth: .33,
                //    msgTarget: 'side',
                //    labelWidth: 150,
                //    labelAlign: 'right',
                //    allowBlank: false,
                //    listeners: {
                //        change: function (obj, newvalue) {
                //            var strategy = newvalue;
                //            var panel = obj.up('fieldset').down("#internationalFee_detail_panel");
                //            panel.removeAll();
                //            var items = [
                //                {
                //                    xtype: 'numberfield',
                //                    fieldLabel: '港/澳/台(元/分钟)',
                //                    value: 1.2,
                //                    name: 'intl_fee1',
                //                    columnWidth: .33,
                //                    decimalPrecision: 4,
                //                    msgTarget: 'side',
                //                    labelWidth: 150,
                //                    labelAlign: 'right',
                //                    minValue: 0,
                //                    /*maxValue: 0.3,*/
                //                    allowBlank: false
                //                },
                //                {
                //                    xtype: 'numberfield',
                //                    fieldLabel: '美国/加拿大(元/分钟)',
                //                    value: 2.4,
                //                    name: 'intl_fee2',
                //                    columnWidth: .33,
                //                    decimalPrecision: 4,
                //                    msgTarget: 'side',
                //                    labelWidth: 150,
                //                    labelAlign: 'right',
                //                    minValue: 0,
                //                    /* maxValue: 0.3,*/
                //                    allowBlank: false
                //                },
                //                {
                //                    xtype: 'numberfield',
                //                    fieldLabel: '其他(元/分钟)',
                //                    value: 3.6,
                //                    name: 'intl_fee3',
                //                    columnWidth: .33,
                //                    decimalPrecision: 4,
                //                    msgTarget: 'side',
                //                    labelWidth: 150,
                //                    labelAlign: 'right',
                //                    minValue: 0,
                //                    /* maxValue: 0.3,*/
                //                    allowBlank: false
                //                }
                //            ];
                //
                //            var intlFeeSet = this.data.intlFeeSet  || {};
                //            items = items.concat([
                //                {
                //                    xtype: 'combobox',
                //                    fieldLabel: '线路',
                //                    name:'intlLine',
                //                    editable:true,
                //                    store: App.util.AppUtil.getDicStore('line',true,{line_type:"international"}),
                //                    displayField: 'codeName',
                //                    valueField: 'codeValue',
                //                    columnWidth:.25,
                //                    labelWidth:50,
                //                    value:intlFeeSet.line,
                //                },
                //                {
                //                    xtype:'grid',
                //                    class: 'query',
                //                    forceFit: true,
                //                    data:null,
                //                    columnLines: true,
                //                    bodyStyle: 'padding:0',
                //                    columnWidth:1,
                //                    id:'opened_product_intl_fee_grid',
                //                    header: false,
                //                    store: Ext.create('Ext.data.JsonStore', {
                //                        fields:[
                //                            {name:'code',type:'string'},
                //                            {name:'price',type:'number'},
                //                        ],
                //                        pageSize: 1000,
                //                        proxy:{
                //                            type:'pagingmemory',
                //                            reader: {
                //                                type: 'json'
                //                            },
                //                        },
                //                        autoLoad:true,
                //                        data:intlFeeSet.fees,
                //                    }),
                //                    dockedItems: [
                //                        {
                //                            xtype: 'toolbar',
                //                            class: 'dock',
                //                            items: [
                //                                {
                //                                    iconCls: 'set_icon_cls',
                //                                    text: '修改',
                //                                    id: 'update_intl_fee_tool',
                //                                    disabled: true,
                //                                    needSelect: true
                //                                },
                //                                {
                //                                    iconCls: 'delete_icon_cls',
                //                                    text: '删除',
                //                                    id: 'delete_intl_fee_tool',
                //                                    disabled: true,
                //                                    needSelect: true
                //                                },
                //                                {
                //                                    iconCls: 'add_icon_cls',
                //                                    text: '添加',
                //                                    id: 'add_intl_fee_tool',
                //                                    needSelect: false
                //                                }
                //                            ]
                //                        }
                //                    ],
                //
                //                    columns: [
                //                        {
                //                            dataIndex: 'code',
                //                            width: 90,
                //                            align: 'center',
                //                            header: '区域代码'
                //                        },
                //                        {
                //                            dataIndex: 'price',
                //                            header: '价格(元)',
                //                            align: 'center',
                //                            renderer: function(price){
                //                                return price/10000;
                //                            }
                //                        }
                //                    ],
                //                    viewConfig: {
                //                        forceFit: true
                //                    },
                //                }
                //            ]);
                //            panel.add(items);
                //        }
                //    }
                //},
                {
                    xtype: 'panel',
                    layout: "column",
                    border: false,
                    bodyCls: 'backgroud_blue',
                    id: 'internationalFee_detail_panel',
                    columnWidth: 1,
                    items: this.getIntlItem()

                },
                /* ---------------------------------------------------------------*/
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
                            value: this.data.smsFee,
                            name: 'smsFee',
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
                            fieldLabel: '短信折扣(元/条)',
                            value: this.data.smsDiscount,
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
                            value: this.data.smsSplitBaseNum,
                            name: 'smsSplitBaseNum',
                            columnWidth: .33,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue: 1,
                            maxValue:70,
                            allowBlank: true,
                            hidden: App.util.AppUtil.isHide2()
                        }
                    ]
                }
            ]
        } else if (product == "cc") {
            feeItem = [
                {
                    xtype: 'textfield',
                    name: "calloutLicenceId",
                    value: this.data.calloutLicenceId || "",
                    hidden: true
                },
                {
                    xtype: 'combobox',
                    fieldLabel: '外呼版lincence策略',
                    name: 'calloutLicenceStrategy',
                    editable: false,
                    value: this.data.calloutLicenceStrategy || "defined",
                    store: [["defined", "自定义"], ["licencePrice", "按licence套餐"]],
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
                                        value: me.data.calloutLicence,
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
                                        value: me.data.calloutMinute,
                                        name: 'calloutMinute',
                                        columnWidth: .33,
                                        decimalPrecision: 0,
                                        msgTarget: 'side',
                                        labelWidth: 150,
                                        labelAlign: 'right',
                                        minValue: 0,
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
                    id: 'callout_licence_strategy_panel',
                    columnWidth: 1,
                    items: this.getCalloutLicenceItems()
                },
                {
                    xtype: 'combobox',
                    fieldLabel: '外呼资费策略',
                    name: 'dialFeeStrategy',
                    editable: false,
                    value: this.data.dialFeeStrategy,
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
//                            console.log(strategy);
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
                    items: this.getCurrentItem(product, "dial")
                },
                {
                    xtype: 'combobox',
                    fieldLabel: '呼转资费策略',
                    name: 'transferFeeStrategy',
                    editable: false,
                    value: this.data.transferFeeStrategy,
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
                    items: this.getCurrentItem(product, "transfer")
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: '话费折扣(元/分钟)',
                    value: this.data.discount,
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
                            value: this.data.serviceLicence,
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
                            value: this.data.callinLicence,
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
                            value: this.data.monitorLicence,
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
                /* ------------------------国际长途----------------------------------*/
                //{
                //    xtype: 'combobox',
                //    fieldLabel: '国际长途策略',
                //    name: 'internationalStrategy',
                //    editable: false,
                //    value: this.data.internationalStrategy,
                //    store: App.util.AppUtil.getDicStore('internationalStrategy'),
                //    displayField: 'codeName',
                //    valueField: 'codeValue',
                //    typeAhead: true,
                //    queryMode: 'local',
                //    columnWidth: .33,
                //    msgTarget: 'side',
                //    labelWidth: 150,
                //    labelAlign: 'right',
                //    allowBlank: false,
                //    listeners: {
                //        change: function (obj, newvalue) {
                //            var strategy = newvalue;
                //            var panel = obj.up('fieldset').down("#internationalFee_detail_panel");
                //            panel.removeAll();
                //            var items = [
                //                {
                //                    xtype: 'numberfield',
                //                    fieldLabel: '港/澳/台(元/分钟)',
                //                    value: 1.2,
                //                    name: 'intl_fee1',
                //                    columnWidth: .33,
                //                    decimalPrecision: 4,
                //                    msgTarget: 'side',
                //                    labelWidth: 150,
                //                    labelAlign: 'right',
                //                    minValue: 0,
                //                    /*maxValue: 0.3,*/
                //                    allowBlank: false
                //                },
                //                {
                //                    xtype: 'numberfield',
                //                    fieldLabel: '美国/加拿大(元/分钟)',
                //                    value: 2.4,
                //                    name: 'intl_fee2',
                //                    columnWidth: .33,
                //                    decimalPrecision: 4,
                //                    msgTarget: 'side',
                //                    labelWidth: 150,
                //                    labelAlign: 'right',
                //                    minValue: 0,
                //                    /* maxValue: 0.3,*/
                //                    allowBlank: false
                //                },
                //                {
                //                    xtype: 'numberfield',
                //                    fieldLabel: '其他(元/分钟)',
                //                    value: 3.6,
                //                    name: 'intl_fee3',
                //                    columnWidth: .33,
                //                    decimalPrecision: 4,
                //                    msgTarget: 'side',
                //                    labelWidth: 150,
                //                    labelAlign: 'right',
                //                    minValue: 0,
                //                    /* maxValue: 0.3,*/
                //                    allowBlank: false
                //                }
                //            ];
                //
                //            //var intlFeeSet = this.data.intlFeeSet || {};
                //            //items = items.concat([
                //            //    {
                //            //        xtype: 'combobox',
                //            //        fieldLabel: '线路',
                //            //        name:'intlLine',
                //            //        editable:true,
                //            //        store: App.util.AppUtil.getDicStore('line',true,{line_type:"international"}),
                //            //        displayField: 'codeName',
                //            //        valueField: 'codeValue',
                //            //        columnWidth:.25,
                //            //        labelWidth:50,
                //            //        value: intlFeeSet.line,
                //            //    },
                //            //    {
                //            //        xtype:'grid',
                //            //        class: 'query',
                //            //        forceFit: true,
                //            //        id : 'opened_product_intl_fee_grid',
                //            //        data:null,
                //            //        columnLines: true,
                //            //        bodyStyle: 'padding:0',
                //            //        columnWidth:1,
                //            //        header: false,
                //            //        store: Ext.create('Ext.data.JsonStore', {
                //            //            fields:[
                //            //                {name:'code',type:'string'},
                //            //                {name:'price',type:'number'},
                //            //            ],
                //            //            pageSize: 1000,
                //            //            proxy:{
                //            //                type:'pagingmemory',
                //            //                reader: {
                //            //                    type: 'json'
                //            //                },
                //            //            },
                //            //            autoLoad:true,
                //            //            data: intlFeeSet.fees,
                //            //        }),
                //            //        dockedItems: [
                //            //            {
                //            //                xtype: 'toolbar',
                //            //                class: 'dock',
                //            //                items: [
                //            //                    {
                //            //                        iconCls: 'set_icon_cls',
                //            //                        text: '修改',
                //            //                        id: 'update_intl_fee_tool',
                //            //                        disabled: true,
                //            //                        needSelect: true
                //            //                    },
                //            //                    {
                //            //                        iconCls: 'delete_icon_cls',
                //            //                        text: '删除',
                //            //                        id: 'delete_intl_fee_tool',
                //            //                        disabled: true,
                //            //                        needSelect: true
                //            //                    },
                //            //                    {
                //            //                        iconCls: 'add_icon_cls',
                //            //                        text: '添加',
                //            //                        id: 'add_intl_fee_tool',
                //            //                        needSelect: false
                //            //                    }
                //            //                ]
                //            //            }
                //            //        ],
                //            //
                //            //        columns: [
                //            //            {
                //            //                dataIndex: 'code',
                //            //                width: 90,
                //            //                align: 'center',
                //            //                header: '区域代码'
                //            //            },
                //            //            {
                //            //                dataIndex: 'price',
                //            //                header: '价格(元)',
                //            //                align: 'center',
                //            //                renderer: function(price){
                //            //                    return price/10000;
                //            //                }
                //            //            }
                //            //        ],
                //            //        viewConfig: {
                //            //            forceFit: true
                //            //        },
                //            //    }
                //            //]);
                //            panel.add(items);
                //        }
                //    }
                //},
                {
                    xtype: 'panel',
                    layout: "column",
                    border: false,
                    bodyCls: 'backgroud_blue',
                    id: 'internationalFee_detail_panel',
                    columnWidth: 1,
                    items: this.getIntlItem()

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
                            value: this.data.smsFee,
                            name: 'smsFee',
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
                            fieldLabel: '短信折扣(元/条)',
                            value: this.data.smsDiscount,
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
                            value: this.data.smsSplitBaseNum,
                            name: 'smsSplitBaseNum',
                            columnWidth: .33,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue: 1,
                            maxValue: 70,
                            allowBlank: true,
                            hidden: App.util.AppUtil.isHide2()
                        },
                        {
                            xtype: 'textfield',
                            fieldLabel: '微信第三方平台appid',
                            name: 'wechatAppId',
                            value: this.data.wechatAppId,
                            columnWidth: .33,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue: 1,
                            maxValue: 70,
                            //hidden: App.util.AppUtil.isHide2()
                        }
                    ]
                }

                /* ---------------------------------------------------------------*/
            ];
        } else if (product == "ll") {
            feeItem = [
                {
                    fieldLabel: "运营商",
                    value: "中国移动（单位：元）",
                    name: 'operatorsResource',
                    columnWidth: .40,
                    labelWidth: 150,
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
                    items: this.getIntlItemYD()
                },
                {
                    fieldLabel: "运营商",
                    value: "中国联通（单位：元）",
                    name: 'operatorsResource',
                    columnWidth: .40,
                    labelWidth: 150,
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
                    items: this.getIntlItemLT()
                },
                {
                    fieldLabel: "运营商",
                    value: "中国电信（单位：元）",
                    name: 'operatorsResource',
                    columnWidth: .40,
                    labelWidth: 150,
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
                    items: this.getIntlItemDX()
                }
            ]
        } else if (product == 'yy') {
            feeItem = [{
                xtype: 'numberfield',
                fieldLabel: '语音资费(元/分钟)',
                value: me.data.voiceFee,
                name: 'voiceFee',
                columnWidth: .33,
                decimalPrecision: 4,
                msgTarget: 'side',
                labelWidth: 150,
                labelAlign: 'right',
                minValue: 0,
                maxValue: 1,
                allowBlank: false
            }];
        } else if (product == 'custFee') {
            feeItem = [{
                xtype: 'fieldset',
                title: '自定义扣费设置',
                collapsible: true,
                layout: 'fit',
                columnWidth: 1,
                id: "opened_product_cust_fee",
                cls: 'backgroud_blue',
                items:[
                    {
                        xtype:'grid',
                        class: 'query',
                        id: 'opened_product_cust_fee_grid',
                        productId:me.data._id,
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
                                {name:'state',type:'string'},
                                {name:'id',type:'string'},
                            ],
                            pageSize: 1000,
                            proxy:{
                                type:'pagingmemory',
                                reader: {
                                    type: 'json'
                                },
                            },
                            autoLoad:true,
                            data:me.data.custFees,
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
                                dataIndex: 'state',
                                header: '状态',
                                align: 'center',
                                renderer: function(value){
                                    return App.util.AppUtil.getRendererValue(value, 'custFeeState');
                                }
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
                    }
                ]
            },{
                xtype: 'fieldset',
                title: '手续费率设置',
                collapsible: true,
                layout: 'column',
                columnWidth:1,
                cls: 'backgroud_blue',
                defaultType: 'textfield',
                items:[
                    {
                        xtype: 'numberfield',
                        id: "open_product_cust_fee_poundage",
                        fieldLabel: '手续费率(百分之)',
                        value: me.data.poundage,
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
            },]
        }
        feeItem.push({
            xtype: 'textfield',
            name: "_id",
            value: this.data._id,
            hidden: true
        });
        return feeItem;
    },
    getCurrentItem: function (product, type) {
        var result = [];
        var strategy, key, prefix;
        if (type == "dial") {
            strategy = this.data.dialFeeStrategy;
            key = "dialFee";
            prefix = "dial";
        } else if (type == "transfer") {
            strategy = this.data.transferFeeStrategy;
            key = "transferFee";
            prefix = "transfer";
        }
        if (product == "zj") {
            if (strategy == "minute") {
                result = [
                    {
                        xtype: 'numberfield',
                        fieldLabel: '手机市话(元/分钟)',
                        value: this.data[key].local,
                        name: prefix + '_local',
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
                        value: this.data[key].remote,
                        name: prefix + '_remote',
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
                        value: this.data[key].localTel,
                        name: prefix + '_localTel',
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
                        value: this.data[key].remoteTel,
                        name: prefix + '_remoteTel',
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
                result = [
                    {
                        xtype: 'numberfield',
                        fieldLabel: '市话(元/6秒)',
                        value: this.data[key].local,
                        name: prefix + '_local',
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
                        value: this.data[key].remote,
                        name: prefix + '_remote',
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
                result = [
                    {
                        xtype: 'numberfield',
                        fieldLabel: '本地前3分钟资费(元)',
                        value: this.data[key].prefixMin,
                        name: prefix + '_prefixMin',
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
                        value: this.data[key].local,
                        name: prefix + '_local',
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
                        value: this.data[key].remote,
                        name: prefix + '_remote',
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
                result = [
                    {
                        xtype: 'numberfield',
                        fieldLabel: '本地前3分钟资费(元)',
                        value: this.data[key].prefixMin,
                        name: prefix + '_prefixMin',
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
                        value: this.data[key].local,
                        name: prefix + '_local',
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
                        fieldLabel: '长途(元/6s)',
                        value: this.data[key].remote,
                        name: prefix + '_remote',
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
        } else if (product == "cc") {
            if (strategy == "minute") {
                result = [
                    {
                        xtype: 'numberfield',
                        fieldLabel: '手机市话(元/分钟)',
                        value: this.data[key].local,
                        name: prefix + '_local',
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
                        value: this.data[key].remote,
                        name: prefix + '_remote',
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
                        value: this.data[key].localTel,
                        name: prefix + '_localTel',
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
                        value: this.data[key].remoteTel,
                        name: prefix + '_remoteTel',
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
                result = [
                    {
                        xtype: 'numberfield',
                        fieldLabel: '市话(元/6秒)',
                        value: this.data[key].local,
                        name: prefix + '_local',
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
                        value: this.data[key].remote,
                        name: prefix + '_remote',
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
                result = [
                    {
                        xtype: 'numberfield',
                        fieldLabel: '本地前3分钟资费(元)',
                        value: this.data[key].prefixMin,
                        name: prefix + '_prefixMin',
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
                        value: this.data[key].local,
                        name: prefix + '_local',
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
                        value: this.data[key].remote,
                        name: prefix + '_remote',
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
                result = [
                    {
                        xtype: 'numberfield',
                        fieldLabel: '本地前3分钟资费(元)',
                        value: this.data[key].prefixMin,
                        name: prefix + '_prefixMin',
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
                        value: this.data[key].local,
                        name: prefix + '_local',
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
                        fieldLabel: '长途(元/6s)',
                        value: this.data[key].remote,
                        name: prefix + '_remote',
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
        }
        return result;
    },
    getIntlItem: function () {
        var result = [];
        var strategy, key, prefix;
        //strategy = this.data.internationalStrategy;
        //key = "internationalFee";
        //prefix = "intl";

        var intlFeeSet = this.data.intlFeeSet || {};
        var intlLine = intlFeeSet.line;
        var intlFees = intlFeeSet.fees || [];
        var intlAllowOther = intlFeeSet.allowOther;
        var intlOtherPrice = intlFeeSet.otherPrice;
        var intlIsOpenIntl = intlFeeSet.isOpenIntl;

        result = result.concat([
            {
                xtype: 'fieldset',
                title: '国际长途资费',
                columnWidth:1,
                name:'intlFeeSet',
                collapsible: true,
                id: "opened_intl_fee_set",
                layout: 'column',
                cls: 'backgroud_blue',
                items:[
                    {
                        xtype: 'checkbox',
                        fieldLabel: '开通国际长途',
                        labelWidht: 50,
                        name: 'isOpenIntl',
                        id: 'opened_product_intl_is_open_intl',
                        columnWidth: .2,
                        checked:intlIsOpenIntl,
                    },
                    {
                        xtype: 'combobox',
                        fieldLabel: '线路',
                        labelWidth:50,
                        name:'intlLine',
                        id:'opened_product_intl_fee_line',
                        editable:true,
                        store: App.util.AppUtil.getDicStore('line',true,{line_type:"international"}),
                        displayField: 'codeName',
                        valueField: 'codeValue',
                        columnWidth: .25,
                        hidden:!intlIsOpenIntl,
                        value:intlLine,
                    },
                    {
                        xtype: 'checkbox',
                        fieldLabel: '允许其他区域',
                        labelWidth: 100,
                        name: 'allowOther',
                        id: 'opened_product_intl_allow_other',
                        columnWidth: .25,
                        hidden:!intlIsOpenIntl,
                        checked:intlAllowOther,
                    },
                    {
                        xtype: 'numberfield',
                        fieldLabel: '其他区域价格',
                        labelWidth: 80,
                        name: 'otherPrice',
                        id: 'opened_product_intl_other_price',
                        columnWidth: .2,
                        hidden:!intlAllowOther,
                        minValue: 3,
                        value:intlOtherPrice,
                    },
                    {
                        xtype:'fieldset',
                        title:'指定主叫号码',
                        id: 'opened_product_intl_cid_set',
                        hidden:!intlIsOpenIntl,
                        collapsible: true,
                        cls: 'background_blue',
                        columnWidth:1,
                        items:[
                            {
                                html:'<div class="line_indent" id="cid_list_div"><span class="line_tag" hidden="true"></span></div>'
                            },
                            {
                                xtype: 'combobox',
                                fieldLabel: '添加号码',
                                id:'opened_product_intl_combo_add_cid',
                                labelStyle: 'width:55px',
                                margin:'10 0 10 0',
                                name:'cids',
                                editable:true,
                                store: App.util.AppUtil.getDicStore('serviceNum',true,{account:this.data.account,product:this.data.product}),
                                displayField: 'codeName',
                                valueField: 'codeValue',
                                columWidht:.333,
                                msgTarget:'side',
                                autoSelect:false,
                                enableKeyEvents:true,
                            },
                        ]
                    },
                    {
                        xtype:'grid',
                        class: 'query',
                        forceFit: true,
                        data:null,
                        id:'opened_product_intl_fee_grid',
                        columnLines: true,
                        bodyStyle: 'padding:0',
                        columnWidth:1,
                        header: false,
                        hidden:!intlIsOpenIntl,
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
                            autoLoad:true,
                            data:intlFees,
                        }),
                        dockedItems: [
                            {
                                xtype: 'toolbar',
                                class: 'dock',
                                items: [
                                    {
                                        iconCls: 'set_icon_cls',
                                        text: '修改',
                                        id: 'opened_update_intl_fee_tool',
                                        disabled: true,
                                        needSelect: true
                                    },
                                    {
                                        iconCls: 'delete_icon_cls',
                                        text: '删除',
                                        id: 'opened_delete_intl_fee_tool',
                                        disabled: true,
                                        needSelect: true
                                    },
                                    {
                                        iconCls: 'add_icon_cls',
                                        text: '添加',
                                        id: 'opened_add_intl_fee_tool',
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
                                align:'center',
                            }
                        ],
                        viewConfig: {
                            forceFit: true
                        },
                    }
                ]
            }]);


        return result;
    },
    getIntlItemLT: function () {
        var result = [];
        var key, prefix;
        key = "fee";
        prefix = "fee";
        result = [
            {
                xtype: 'numberfield',
                fieldLabel: '20M',
                value: this.data[key]['200001'],
                name: prefix + '_200001',
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
                value: this.data[key]['200002'],
                name: prefix + '_200002',
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
                value: this.data[key]['200003'],
                name: prefix + '_200003',
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
                value: this.data[key]['200004'],
                name: prefix + '_200004',
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
                value: this.data[key]['200005'],
                name: prefix + '_200005',
                columnWidth: .33,
                decimalPrecision: 4,
                msgTarget: 'side',
                labelWidth: 150,
                labelAlign: 'right',
                minValue: 0,
                maxValue: 1000,
                allowBlank: false
            }
        ];

        return result;
    },
    getIntlItemYD: function () {
        var result = [];
        var key, prefix;
        key = "fee";
        prefix = "fee";
        result = [
            {
                xtype: 'numberfield',
                fieldLabel: '10M',
                value: this.data[key]['100001'],
                name: prefix + '_100001',
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
                value: this.data[key]['100002'],
                name: prefix + '_100002',
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
                value: this.data[key]['100003'],
                name: prefix + '_100003',
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
                value: this.data[key]['100004'],
                name: prefix + '_100004',
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
                value: this.data[key]['100005'],
                name: prefix + '_100005',
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
                value: this.data[key]['100006'],
                name: prefix + '_100006',
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
                value: this.data[key]['100007'],
                name: prefix + '_100007',
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
                value: this.data[key]['100008'],
                name: prefix + '_100008',
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
                value: this.data[key]['100009'],
                name: prefix + '_100009',
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
                value: this.data[key]['100010'],
                name: prefix + '_100010',
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
                value: this.data[key]['100011'],
                name: prefix + '_100011',
                columnWidth: .33,
                decimalPrecision: 4,
                msgTarget: 'side',
                labelWidth: 150,
                labelAlign: 'right',
                minValue: 0,
                maxValue: 1000,
                allowBlank: false
            }
        ];

        return result;
    },
    getIntlItemDX: function () {
        var result = [];
        var key, prefix;
        key = "fee";
        prefix = "fee";
        result = [
            {
                xtype: 'numberfield',
                fieldLabel: '5M',
                value: this.data[key]['300001'],
                name: prefix + '_300001',
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
                value: this.data[key]['300002'],
                name: prefix + '_300002',
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
                value: this.data[key]['300003'],
                name: prefix + '_300003',
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
                value: this.data[key]['300004'],
                name: prefix + '_300004',
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
                value: this.data[key]['300005'],
                name: prefix + '_300005',
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
                value: this.data[key]['300006'],
                name: prefix + '_300006',
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
                value: this.data[key]['300007'],
                name: prefix + '_300007',
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
                value: this.data[key]['300008'],
                name: prefix + '_300008',
                columnWidth: .33,
                decimalPrecision: 4,
                msgTarget: 'side',
                labelWidth: 150,
                labelAlign: 'right',
                minValue: 0,
                maxValue: 1000,
                allowBlank: false
            }
        ];


        return result;
    },
    getCalloutLicenceItems: function () {
        var me = this;
        var items = [];
        if (me.data.calloutLicenceStrategy == "licencePrice") {
            items = [
                {
                    xtype: 'numberfield',
                    fieldLabel: '套餐价格(元)',
                    value: this.data.calloutLicence,
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
                    value: this.data.calloutMinute,
                    name: 'calloutMinute',
                    columnWidth: .33,
                    decimalPrecision: 0,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    allowBlank: false
                }
            ];
        } else {
            items = [
                {
                    xtype: 'numberfield',
                    fieldLabel: '低消',
                    value: this.data.minConsume,
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
                    value: this.data.giveMinute,
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
                            value: this.data.effectYear,
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
                            value: this.data.effectMonth,
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
        }
        return items;
    },
    getCurrentPrice: function () {
        var me = this;
        var items = [];
        var num = parseInt(me.data.calloutLicenceNum || 0);
        if (!this.data.licencePriceType || this.data.licencePriceType == "100") {
            items = [
                {
                    xtype: 'numberfield',
                    fieldLabel: '100元套餐价格(元)',
                    value: this.data.calloutLicence["100"].price,
                    name: '100_price',
                    columnWidth: .33,
                    decimalPrecision: 4,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    allowBlank: false,
                    listeners: {
                        change: function (obj, value) {
                            var field1 = obj.up("fieldset").down("#account_product_set_minConsume");
                            //value = parseFloat(value);
                            //field.setValue(App.util.AppUtil.formatRoundMoney(value * num));

                            me.calculateMinconsume(value, num, field1);
                        }
                    }
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: '赠送分钟数(月/坐席)',
                    value: this.data.calloutLicence["100"].minute,
                    name: '100_minute',
                    columnWidth: .33,
                    decimalPrecision: 0,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    allowBlank: false,
                    listeners: {
                        change: function (obj, value) {
                            var field2 = obj.up("fieldset").down("#account_product_set_giveMinute");
                            //value = parseInt(value);
                            //field.setValue(parseInt(value * num));
                            me.calculateGiveMinute(value, num, field2);
                        }
                    }
                }
            ];
        } else if (this.data.licencePriceType == "200") {
            items = [
                {
                    xtype: 'numberfield',
                    fieldLabel: '200元套餐价格(元)',
                    value: this.data.calloutLicence["200"].price,
                    name: '200_price',
                    columnWidth: .33,
                    decimalPrecision: 4,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    allowBlank: false,
                    listeners: {
                        change: function (obj, value) {
                            var field1 = obj.up("fieldset").down("#account_product_set_minConsume");
                            //value = parseFloat(value);
                            //field.setValue(App.util.AppUtil.formatRoundMoney(value * num));
                            me.calculateMinconsume(value, num, field1);
                        }
                    }
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: '赠送分钟数(月/坐席)',
                    value: this.data.calloutLicence["200"].minute,
                    name: '200_minute',
                    columnWidth: .33,
                    decimalPrecision: 0,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    allowBlank: false,
                    listeners: {
                        change: function (obj, value) {
                            var field2 = obj.up("fieldset").down("#account_product_set_giveMinute");
                            //value = parseInt(value);
                            //field.setValue(parseInt(value * num));
                            me.calculateGiveMinute(value, num, field2);
                        }
                    }
                }
            ];
        } else if (this.data.licencePriceType == "300") {
            items = [
                {
                    xtype: 'numberfield',
                    fieldLabel: '300元套餐价格(元)',
                    value: this.data.calloutLicence["300"].price,
                    name: '300_price',
                    columnWidth: .33,
                    decimalPrecision: 4,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    allowBlank: false,
                    listeners: {
                        change: function (obj, value) {
                            var field1 = obj.up("fieldset").down("#account_product_set_minConsume");
                            //value = parseFloat(value);
                            //field.setValue(App.util.AppUtil.formatRoundMoney(value * num));
                            me.calculateMinconsume(value, num, field1);
                        }
                    }
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: '赠送分钟数(月/坐席)',
                    value: this.data.calloutLicence["300"].minute,
                    name: '300_minute',
                    columnWidth: .33,
                    decimalPrecision: 0,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    allowBlank: false,
                    listeners: {
                        change: function (obj, value) {
                            var field2 = obj.up("fieldset").down("#account_product_set_giveMinute");
                            //value = parseInt(value);
                            //field.setValue(parseInt(value * num));
                            me.calculateGiveMinute(value, num, field2);
                        }
                    }
                }
            ];
        } else if (this.data.licencePriceType == "400") {
            items = [
                {
                    xtype: 'numberfield',
                    fieldLabel: '400元套餐价格(元)',
                    value: this.data.calloutLicence["400"].price,
                    name: '400_price',
                    columnWidth: .33,
                    decimalPrecision: 4,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    allowBlank: false,
                    listeners: {
                        change: function (obj, value) {
                            var field1 = obj.up("fieldset").down("#account_product_set_minConsume");
                            //value = parseFloat(value);
                            //field.setValue(App.util.AppUtil.formatRoundMoney(value * num));

                            me.calculateMinconsume(value, num, field1);
                        }
                    }
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: '赠送分钟数(月/坐席)',
                    value: this.data.calloutLicence["400"].minute,
                    name: '400_minute',
                    columnWidth: .33,
                    decimalPrecision: 0,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    allowBlank: false,
                    listeners: {
                        change: function (obj, value) {
                            var field2 = obj.up("fieldset").down("#account_product_set_giveMinute");
                            //value = parseInt(value);
                            //field.setValue(parseInt(value * num));
                            me.calculateGiveMinute(value, num, field2);
                        }
                    }
                }
            ];
        }
        return items;
    },
    calculateMinconsume: function (value, num, panel) {
        value = parseFloat(value);
        panel.setValue(App.util.AppUtil.formatRoundMoney(value * num));
    },
    calculateGiveMinute: function (value, num, panel) {
        value = parseInt(value);
        panel.setValue(parseInt(value * num));
    }

});
