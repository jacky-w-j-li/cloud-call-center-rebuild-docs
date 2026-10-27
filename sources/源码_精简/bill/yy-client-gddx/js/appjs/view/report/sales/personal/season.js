Ext.define('App.view.report.sales.personal.season', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.reportSalesPersonalSeason',
    requires: ['App.model.report.sales.personal.Season'],
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
        var month = data.getMonth();

        var yearValue = 0;
        //定义季度变量
        var quarter = '';
        if (month < 3) {
            quarter = '4';
            yearValue = data.getFullYear() - 1;
        } else if (month < 6 && month > 2) {
            quarter = '1';
            yearValue = data.getFullYear();
        } else if (month < 9 && month > 5) {
            quarter = '2';
            yearValue = data.getFullYear();
        } else {
            quarter = '3';
            yearValue = data.getFullYear();
        }
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

                            fieldLabel: '年份',
                            xtype: 'combobox',
                            name: 'year',
                            store: states1,
                            id: "btn_personal_year",
                            displayField: 'name1',
                            valueField: 'abbr1',
                            columnWidth: .25,
                            value: yearValue
                        },
                        {
                            fieldLabel: '季度',
                            xtype: 'combobox',
                            name: 'season',
                            id: "btn_area1_season",
                            store: states2,
                            displayField: 'name2',
                            valueField: 'abbr2',
                            columnWidth: .25,
                            value: quarter
                        },
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
                            id: "btn_reset_season",
                            width: 90,
                            text: '重置'
                        },
                        {
                            xtype: 'button',
                            calss: 'export',
                            id: "btn_export_season",
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
                    fields: ['salesName'],
                    title: '销售人'
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
                    xField: 'salesName',
                    yField: 'rechargeMoney',
                    tips: {
                        trackMouse: true,
                        width: 140,
                        height: 32,
                        renderer: function (storeItem, item) {
                            this.setTitle(storeItem.get('salesName') + '充值金额 ' + storeItem.get('rechargeMoney'));
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
                    dataIndex: 'salesName',
                    width: 50,
                    align: 'center',
                    header: '名称'
                },
                {
                    dataIndex: 'season',
                    width: 20,
                    align: 'center',
                    header: '季度'
                },
                {
                    dataIndex: 'payAccSum',
                    width: 60,
                    align: 'center',
                    header: '总付费企业数'
                },
                {
                    dataIndex: 'currentMonthPayAcc',
                    width: 70,
                    align: 'center',
                    header: '本季度付费企业数'
                },
                {
                    dataIndex: 'newCurrentPayAcc',
                    header: '本季度新增付费企业数',
                    align: 'center',
                    width: 70
                },
                {
                    dataIndex: 'rechargeMoney',
                    width: 70,
                    align: 'center',
                    header: '本季度充值金额(元)'
                },

                {
                    dataIndex: 'consumSum',
                    width: 70,
                    align: 'center',
                    header: '本季度消费(元)',
                    renderer: function (value) {
                        if (value == 0 || value == value) {
                            value = value / 10000;
                        }
                        ;
                        return value;
                    }
                },
                {
                    dataIndex: 'licensesFee',
                    width: 70,
                    align: 'center',
                    header: '本季度坐席消费(元)',
                    renderer: function (value) {
                        if (value == 0 || value == value) {
                            value = value / 10000;
                        }
                        ;
                        return value;
                    }
                },
                {
                    dataIndex: 'callFee',
                    width: 70,
                    align: 'center',
                    header: '本季度话费(元)',
                    renderer: function (value) {
                        if (value == 0 || value == value) {
                            value = value / 10000;
                        }
                        ;
                        return value;
                    }
                },
                {
                    dataIndex: 'smsFee',
                    width: 70,
                    align: 'center',
                    header: '本季度短信消费(元)',
                    renderer: function (value) {
                        if (value == 0 || value == value) {
                            value = value / 10000;
                        }
                        ;
                        return value;
                    }
                },
                {
                    dataIndex: 'numberFee',
                    width: 70,
                    align: 'center',
                    header: '本季度号码消费(元)',
                    renderer: function (value) {
                        if (value == 0 || value == value) {
                            value = value / 10000;
                        }
                        ;
                        return value;
                    }
                },
                {
                    dataIndex: '400consume',
                    width: 70,
                    align: 'center',
                    header: '本季度400消费(元)',
                    renderer: function (value) {
                        if (value == 0 || value == value) {
                            value = value / 10000;
                        }
                        ;
                        return value;
                    }
                },


            ],
            viewConfig: {
                forceFit: true
            }
        }
        items.push(grid);

        return items;
    },
    getDataStore: function () {
        if (this.store === null) {
            var data = new Date();
            if (data.getMonth() < 3 && data.getMonth() > -1) {
                this.store = App.util.AppUtil.getGridStore('bill.report.queryPersonalSeasonReport', {
                    year: (data.getFullYear() - 1).toString(),
                    season: '4'
                }, 'App.model.report.sales.personal.Season');
            } else if (data.getMonth() < 6 && data.getMonth() > 2) {
                this.store = App.util.AppUtil.getGridStore('bill.report.queryPersonalSeasonReport', {
                    year: data.getFullYear().toString(),
                    season: '1'
                }, 'App.model.report.sales.personal.Season');
            } else if (data.getMonth() < 9 && data.getMonth() > 5) {
                this.store = App.util.AppUtil.getGridStore('bill.report.queryPersonalSeasonReport', {
                    year: data.getFullYear().toString(),
                    season: '2'
                }, 'App.model.report.sales.personal.Season');
            } else {
                this.store = App.util.AppUtil.getGridStore('bill.report.queryPersonalSeasonReport', {
                    year: data.getFullYear().toString(),
                    season: '3'
                }, 'App.model.report.sales.personal.Season');
            }
            this.store.load();
        }
        return this.store;
    }
});
var states1 = Ext.create('Ext.data.Store', {
    fields: ['abbr1', 'name1'],
    data: [
        {"abbr1": "2015", "name1": 2015},
        {"abbr1": "2016", "name1": 2016},
        {"abbr1": "2017", "name1": 2017},
        {"abbr1": "2018", "name1": 2018},
        {"abbr1": "2019", "name1": 2019},
        {"abbr1": "2020", "name1": 2020},
        {"abbr1": "2021", "name1": 2021},
        {"abbr1": "2022", "name1": 2022},
        {"abbr1": "2023", "name1": 2023},
        {"abbr1": "2024", "name1": 2024},
        {"abbr1": "2025", "name1": 2025}

    ]
});
var states2 = Ext.create('Ext.data.Store', {
    fields: ['abbr2', 'name2'],
    data: [
        {"abbr2": "1", "name2": 1},
        {"abbr2": "2", "name2": 2},
        {"abbr2": "3", "name2": 3},
        {"abbr2": "4", "name2": 4}

    ]
});


