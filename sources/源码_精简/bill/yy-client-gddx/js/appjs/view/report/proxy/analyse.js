/**
 * Created by sG on 2015/11/11.
 */
Ext.define('App.view.report.proxy.analyse', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.reportProxyAnalyse',
    requires: ['App.model.report.proxy.Analyse'],
    layout: {
        type: 'anchor'
    },

    store: null,
    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            items: this.getItems()
        });
        me.callParent(arguments);
    },

    getItems: function () {
        var data = new Date();
        var monthValue = monthStore.getAt(new Date().getMonth()).get("value");
        var yearValue  = data.getFullYear();

        var items = new Array();
        var form = {
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
                            fieldLabel: '年',
                            xtype: 'combobox',
                            name: 'year',
                            id: "analyseyear",
                            store: yearStore,
                            displayField: 'name',
                            valueField: 'value',
                            value: yearValue
                        },
                        {
                            fieldLabel: '月',
                            xtype: 'combobox',
                            name: 'month',
                            id: "analysemonth",
                            store: monthStore,
                            displayField: 'name',
                            valueField: 'value',
                            value: monthValue
                        },
                        {
                            fieldLabel: '排序方式',
                            xtype: 'combobox',
                            name: 'sort',
                            store: sortStore,
                            displayField: 'name',
                            valueField: 'value',
                            value: sortStore.data.first()
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
                            id: "btn_reset_year_month",
                            width: 90,
                            text: '重置'
                        },
                        {
                            xtype: 'button',
                            calss: 'export',
                            id: "btn_export_analyse",
                            width: 90,
                            text: '导出'
                        }
                    ]
                }
            ]
        };
        items.push(form);

        var paySumchart = {
            xtype: 'chart',
            style: 'background:#fff',
            animate: true,
            store: this.getDataStore(),
            shadow: true,
            theme: 'Category1',
            axes: [
                {
                    type: 'Numeric',
                    minimum: 0,
                    position: 'left',
                    fields: ['rechargeMoney'],
                    title: '充值金额',
                    grid: {
                        odd: {
                            opacity: 1,
                            fill: '#ddd',
                            stroke: '#bbb',
                            'stroke-width': 0.5
                        }
                    }
                }, {
                    type: 'Category',
                    position: 'bottom',
                    fields: ['channelName'],
                    title: '渠道名称'
                }
            ],
            series: [
                {
                    type: 'line',
                    smooth: true,
                    highlight: {
                        size: 7,
                        radius: 7
                    },
                    fill: true,
                    axis: 'left',
                    xField: 'channelName',
                    yField: 'rechargeMoney',
                    tips: {
                        trackMouse: true,
                        width: 140,
                        height: 32,
                        renderer: function (storeItem) {
                            this.setTitle(storeItem.get('channelName') + '充值金额 ' + storeItem.get('rechargeMoney'));
                        }
                    },
                    markerConfig: {
                        type: 'circle',
                        radius: 4
                    },
                    style: {
                        fill: '#80A080'
                    }
                }
            ]
        };

        var chartPaySumPanel = {
            title: "充值金额图表",
            margin: '10 ',
            frame: true,
            collapseMode: 'header',
            collapsed: true,
            collapsible: true,
            layout: 'fit',//宽度自定义
            height: 350, //高度
            items: [paySumchart]
        };


        items.push(chartPaySumPanel);
        var grid = {
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
                    dataIndex: 'rank',
                    width: 100,
                    align: 'center',
                    header: '排名'
                },
                {
                    dataIndex: 'channelName',
                    width: 100,
                    align: 'center',
                    header: '渠道名称'
                },
                {
                    dataIndex: 'actualConsume',
                    width: 100,
                    align: 'center',
                    header: '消费金额',
                    renderer: function (value) {
                        return value / 10000;
                    }
                },
                {
                    dataIndex: 'totalPay',
                    width: 100,
                    align: 'center',
                    header: '充值金额',
                    renderer: function (value) {
                        return value / 10000;
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
            var data = new Date();
            this.store = App.util.AppUtil.getReportGridStore('bill.proxy.queryChannelAnalyseReport', {
                year: data.getFullYear().toString(),
                sort: 'totalPay',
                month: monthStore.getAt(new Date().getMonth()).get("value")
            }, 'App.model.report.proxy.Analyse');

            this.store.load();
        }
        return this.store;
    }
});
//年份
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
//月份
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

var sortStore = Ext.create('Ext.data.Store', {
    fields: ['value', 'name'],
    data: [
        {"value": "totalPay", "name": "充值金额"},
        {"value": "actualConsume", "name": "消费金额"}

    ]
});

