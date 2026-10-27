Ext.define('App.view.report.sales.personal.personal', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.reportSalesPersonal',
    requires: ['App.model.report.sales.personal.Personal'],
    layout: {
        type: 'anchor'
    },

    store: null,
    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            items:this.getItems()
        });
        me.callParent(arguments);
    },

    getItems:function(){
        var items = new Array();
        var form={
            xtype: 'form',
            frame: true,
            class: 'query',
            title: '',
            bodyStyle: 'padding:2px 2px 0',
            fieldDefaults: {
                msgTarget: 'side',
                labelWidth: 80,
                labelAlign: 'right'
            },
            items: [
                {
                    xtype: 'fieldset',
                    class: "query",
                    title: '查询',
                    collapsible: true,
                    layout: 'column',
                    defaultType: 'textfield',
                    items: [
                        {
                            fieldLabel: '考核周期',
                            xtype: 'combobox',
                            name: 'timeType',
                            store: checkType,
                            id : "sales_personal_query_timeType",
                            displayField: 'name',
                            valueField: 'value',
                            columnWidth: .25,
                            value: checkType.data.first()
                        },
                        {
                            fieldLabel: '年',
                            xtype: 'combobox',
                            name: 'year',
                            id: "sales_personal_query_year",
                            store: yearStore,
                            displayField: 'name',
                            valueField: 'value',
                            columnWidth: .25,
                            value: new Date().getFullYear()
                        },
                        {
                            fieldLabel: '季度',
                            xtype: 'combobox',
                            name: 'season',
                            id: "sales_personal_query_season",
                            store: seasonStore,
                            displayField: 'name',
                            valueField: 'value',
                            hidden : true,
                            columnWidth: .25
                        },
                        {
                            fieldLabel: '月',
                            xtype: 'combobox',
                            name: 'month',
                            id: "sales_personal_query_month",
                            store: monthStore,
                            displayField: 'name',
                            valueField: 'value',
                            columnWidth: .25,
                            value : monthStore.getAt(new Date().getMonth()).get("value"),
                        },
                        {

                            fieldLabel: '地域',
                            xtype: 'combobox',
                            name: 'area',
                            store: this.getProxyTypeStore(),
                            displayField: 'codeName',
                            valueField: 'codeValue',
                            typeAhead: true,
                            columnWidth: .25
                        },
                        {
                            xtype : 'hiddenfield',
                            name : 'withChannels',
                            value : App.util.AppUtil.hasLimit2("report_sales_channels")?1:null
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
                            xtype: 'button',
                            class: 'query',
                            width: 90,
                            text: '查询'
                        },
                        {
                            xtype: 'button',
                            class: 'reset',
                            id:"sales_personal_query_reset_btn",
                            width: 90,
                            text: '重置'
                        },
                        {
                            xtype: 'button',
                            calss: 'export',
                            id:"sales_personal_export_btn",
                            width: 90,
                            text: '导出'
                        }

                    ]
                }
            ]
        };
        items.push(form);
        var grid={
            xtype: 'gridpanel',
            title: '列表',
            margin: '10 ',
            class: 'query',
            forceFit: true,
            loadMask: true,
            store: this.getDataStore(),
            columnLines: true,
            columns: [
                {
                    dataIndex: 'saleName',
                    width: 50,
                    align: 'center',
                    header: '销售'
                },
                {
                    dataIndex: 'totalPayAccCount',
                    width: 60,
                    align: 'center',
                    header: '总付费企业数'
                },
                {
                    dataIndex: 'payAccCount',
                    width: 70,
                    align: 'center',
                    header: '付费企业数'
                },
                {
                    dataIndex: 'newPayAccCount',
                    header: '新增付费企业数',
                    align: 'center',
                    width: 70
                },
                {
                    dataIndex: 'totalPay',
                    width: 70,
                    align: 'center',
                    header: '充值金额',
                    renderer: function(value){
                        return value/10000;
                    }
                },

                {
                    dataIndex: 'actualConsume',
                    width: 70,
                    align: 'center',
                    header: '实际消费',
                    renderer: function(value){
                        return value/10000;
                    }
                },
                {
                    dataIndex: 'licenceConsume',
                    width: 70,
                    align: 'center',
                    header: 'Licence消费',
                    renderer: function(value){
                        return value/10000;
                    }
                },
                {
                    dataIndex: 'outCallConsume',
                    width: 70,
                    align: 'center',
                    header: '外呼话费',
                    renderer: function(value){
                        return value/10000;
                    }
                },
                {
                    dataIndex: 'smsConsume',
                    width: 70,
                    align: 'center',
                    header: '短信消费',
                    renderer: function(value){
                        return value/10000;
                    }
                },
                {
                    dataIndex: 'snConsume',
                    width: 70,
                    align: 'center',
                    header: '号码消费',
                    renderer: function(value){
                        return value/10000;
                    }
                },
                {
                    dataIndex: '_400Consume',
                    width: 70,
                    align: 'center',
                    header: '400话费',
                    renderer: function(value){
                        return value/10000;
                    }
                },
                {
                    dataIndex: 'flowConsume',
                    width: 70,
                    align: 'center',
                    header: '流量消费',
                    renderer: function(value){
                        return value/10000;
                    }
                },
                {
                    dataIndex: 'voiceConsume',
                    width: 70,
                    align: 'center',
                    header: '语音验证码消费',
                    renderer: function(value){
                        return value/10000;
                    }
                },
                {
                    dataIndex: 'minConsume',
                    width: 70,
                    align: 'center',
                    header: '话费低消',
                    renderer: function(value){
                        return value/10000;
                    }
                },
                {
                    dataIndex: 'workPay',
                    width: 70,
                    align: 'center',
                    header: '实施费用',
                    renderer: function(value){
                        return value/10000;
                    }
                },
                {
                    dataIndex: 'hardwarePay',
                    width: 70,
                    align: 'center',
                    header: '硬件费用',
                    renderer: function(value){
                        return value/10000;
                    }
                },
                {
                    dataIndex: 'tapePay',
                    width: 70,
                    align: 'center',
                    header: '录音费用',
                    renderer: function(value){
                        return value/10000;
                    }
                },
                {
                    dataIndex: 'otherPay',
                    width: 70,
                    align: 'center',
                    header: '其他费用',
                    renderer: function(value){
                        return value/10000;
                    }
                }
            ],
            viewConfig: {
                forceFit: true
            }
        };
        items.push(grid);

        return items;
    },
    getDataStore: function () {
        if (this.store === null) {
            var data=new Date();
            var withChannels = App.util.AppUtil.hasLimit2("report_sales_channels")?1:null;
            this.store = App.util.AppUtil.getReportGridStore('bill.sales.querySalesPersonalReport', {timeType:"month",year: data.getFullYear().toString(), month: monthStore.getAt(new Date().getMonth()).get("value"),withChannels:withChannels}, 'App.model.report.sales.personal.Personal');

            this.store.load();
        }
        return this.store;
    },
    getProxyTypeStore : function() {
        if (!App.util.AppUtil.hasLimit2("report_sales_channels")) {
            var store = Ext.create('Ext.data.Store', {
                autoLoad: false,
                model: 'App.model.common.DicCache',
                data: [
                    {
                        "codeType": "proxyType",
                        "codeOrder": 1,
                        "codeName": "华北",
                        "codeValue": "mysales"
                    },
                    {
                        "codeType": "proxyType",
                        "codeOrder": 1,
                        "codeName": "华东",
                        "codeValue": "hd"
                    },
                    {
                        "codeType": "proxyType",
                        "codeOrder": 1,
                        "codeName": "华南",
                        "codeValue": "hn"
                    }
                ],
                proxy: {
                    type: 'memory',
                    reader: {
                        type: 'json'
                    }
                }
            });

            return store;
        }

        return App.util.AppUtil.getDicStore('proxyType');
    }
});
var yearStore = Ext.create('Ext.data.Store', {
    fields: ['value', 'name'],
    data: [
        {"value": "2016", "name": 2016},
        {"value": "2017", "name": 2017},
        {"value": "2018", "name": 2018},
        {"value": "2019", "name": 2019},
        {"value": "2020", "name": 2020},
        {"value": "2021", "name": 2021},
        {"value": "2022", "name": 2022},
        {"value": "2023", "name": 2023},
        {"value": "2024", "name": 2024},
        {"value": "2025", "name": 2025}

    ]
});
var monthStore = Ext.create('Ext.data.Store', {
    fields: ['value', 'name'],
    data: [
        {"value": "01", "name": 1},
        {"value": "02", "name": 2},
        {"value": "03", "name": 3},
        {"value": "04", "name": 4},
        {"value": "05", "name": 5},
        {"value": "06", "name": 6},
        {"value": "07", "name": 7},
        {"value": "08", "name": 8},
        {"value": "09", "name": 9},
        {"value": "10", "name": 10},
        {"value": "11", "name": 11},
        {"value": "12", "name": 12}
    ]
});

var checkType = Ext.create('Ext.data.Store', {
    fields: ['value', 'name'],
    data: [
        {"value": "month", "name": "月"},
        {"value": "season", "name": "季度"},
        {"value": "year", "name": "年"}
    ]
});
var seasonStore = Ext.create('Ext.data.Store', {
    fields: ['value', 'name'],
    data: [
        {"value": "1", "name": "第一季度"},
        {"value": "2", "name": "第二季度"},
        {"value": "3", "name": "第三季度"},
        {"value": "4", "name": "第四季度"}
    ]
});
