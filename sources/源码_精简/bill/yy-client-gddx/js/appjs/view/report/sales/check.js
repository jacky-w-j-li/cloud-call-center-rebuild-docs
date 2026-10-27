Ext.define('App.view.report.sales.check', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.reportSalesCheck',
    requires: ['App.model.report.sales.Check'],
    layout: {
        type: 'anchor'
    },

    store: null,
    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            items: [

                {
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
                                    id : "sales_check_query_timeType",
                                    displayField: 'name',
                                    valueField: 'value',
                                    columnWidth: .25,
                                    value: checkType.data.first()
                                },
                                {
                                    fieldLabel: '年',
                                    xtype: 'combobox',
                                    name: 'year',
                                    id: "sales_check_query_year",
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
                                    id: "sales_check_query_season",
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
                                    id: "sales_check_query_month",
                                    store: monthStore,
                                    displayField: 'name',
                                    valueField: 'value',
                                    columnWidth: .25,
                                    value : monthStore.getAt(new Date().getMonth()).get("value")
                                },
                                {
                                    fieldLabel: '时间',
                                    labelWidth: 80,
                                    xtype: 'datefield',
                                    format: 'Y-m-d',
                                    name: 'beginDate',
                                    id :"sales_check_query_custom",
                                    hidden : true,
                                    columnWidth: .24
                                },
                                {
                                    xtype: 'label',
                                    text: '至',
                                    id :"sales_check_query_custom1",
                                    hidden : true,
                                    columnWidth: .02
                                },
                                {
                                    xtype: 'datefield',
                                    format: 'Y-m-d',
                                    name: 'endDate',
                                    hideLabel: true,
                                    id :"sales_check_query_custom2",
                                    hidden : true,
                                    columnWidth: .14
                                },
                                {

                                    fieldLabel: '地域',
                                    xtype: 'combobox',
                                    name: 'area',
                                    store: this.getProxyTypeStore(),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    columnWidth: .25
                                },
                                {
                                    fieldLabel: '销售/代理',
                                    xtype: 'combobox',
                                    id :"sales_check_query_form_proxy",
                                    name: 'user',
                                    store: this.getProxyStore(),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    columnWidth: .25
                                },
                                {
                                    fieldLabel: '团队',
                                    xtype: 'combobox',
                                    id : 'sales_check_query_form_proxy_leader',
                                    name: 'leader',
                                    store: App.util.AppUtil.getDicStore('proxyLeader',true),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead:true,
                                    queryMode:'local',
                                    columnWidth:.25,
                                    hidden : App.util.AppUtil.hasLimit("report_sales_check")
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
                                    id:"sales_check_query_find_btn",
                                    width: 90,
                                    text: '查询'
                                },
                                {
                                    xtype: 'button',
                                    class: 'reset',
                                    id: "sales_check_query_reset_btn",
                                    width: 90,
                                    text: '重置'
                                },
                                {
                                    xtype: 'button',
                                    calss: 'export',
                                    id: "sales_query_check_export_btn",
                                    width: 90,
                                    text: '导出'
                                }

                            ]
                        }
                    ]
                },
                {
                    xtype: 'gridpanel',
                    title: '列表',
                    margin: '10 ',
                    class: 'query',
                    forceFit: true,
                    loadMask: true,
                    store: this.getDataStore(),
                    columnLines: true,
                    selType: 'cellmodel',
                    columns: [
                        {
                            dataIndex: 'user',
                            width: 50,
                            align: 'center',
                            header: '销售',
                            renderer: function (value) {
                                return App.util.AppUtil.getRendererValue(value, 'systemUser');
                            }
                        },
                        {
                            dataIndex: 'day',
                            align: 'center',
                            id: "sales_check_query_grid_column_day",
                            hidden: true,
                            header: '日期'
                        },
                        {
                            dataIndex: 'create',
                            width: 60,
                            align: 'center',
                            header: '创建客户数'
                        },
                        {
                            dataIndex: 'turnUsing',
                            width: 70,
                            align: 'center',
                            header: '签约客户数'
                        },
                        {
                            dataIndex: 'newPay',
                            header: '新签客户回款',
                            align: 'center',
                            width: 70
                        },
                        {
                            dataIndex: 'oldPay',
                            width: 70,
                            align: 'center',
                            header: '老客户续费回款'
                        },

                        {
                            dataIndex: 'systemPayCount',
                            width: 70,
                            align: 'center',
                            header: '系统回款总金额'
                        },
                        {
                            dataIndex: 'hardWarePayCount',
                            width: 70,
                            align: 'center',
                            header: '硬件回款总金额'
                        }
                    ],
                    viewConfig: {
                        forceFit: true,
                        listeners: {
                            cellclick : function(view, cell, cellIndex, record,row, rowIndex, e) {
                                var clickedDataIndex = view.panel.headerCt.getHeaderAtIndex(cellIndex).dataIndex;
                                var clickedCellValue = record.get(clickedDataIndex);
                                if(clickedDataIndex != 'turnUsing' || !record.raw.turnUsingAccount || record.raw.turnUsingAccount.length == 0){
                                    return;
                                }

                                var newSignWin = Ext.create('Ext.window.Window', {width:510,height:200,autoScroll:true,modal:true,title:'签约客户列表'});
                                var newSignGrid = Ext.create('App.view.report.sales.checkNewSign', {data:record.raw.turnUsingAccount});
                                newSignWin.add(newSignGrid);
                                newSignWin.show();
                            }

                        }
                    }
                }
            ]
        })

        me.callParent(arguments);
    },


    getDataStore: function () {
        if (this.store === null) {
            var data = new Date();
            var withChannels = App.util.AppUtil.hasLimit2("report_sales_channels")?1:null;
            this.store = App.util.AppUtil.getReportGridStore('bill.sales.querySalesCheckReport', {timeType:"month",year: data.getFullYear().toString(), month: monthStore.getAt(new Date().getMonth()).get("value"),withChannels:withChannels}, 'App.model.report.sales.Check');
            this.store.load();
        }
        return this.store;
    },
    getProxyStore : function(){
        if(!App.util.AppUtil.hasLimit2("report_sales_channels")){
            return App.util.AppUtil.getDicStore('systemUser',true,{identity:"proxy",proxyType:{$nin:['other','channel']}});
        }

        return App.util.AppUtil.getDicStore('systemUser',true,{identity:"proxy"});
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
        {"value": "year", "name": "年"},
        {"value": "custom", "name": "自定义"}
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
