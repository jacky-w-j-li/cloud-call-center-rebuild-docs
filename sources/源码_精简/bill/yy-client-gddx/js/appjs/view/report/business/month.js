Ext.define('App.view.report.business.month', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.reportBusinessMonth',
    requires: ['App.model.report.business.Month'],
    layout: {
        type: 'anchor'
    },
    store: null,

    initComponent: function () {
        var me = this;
        var data = new Date();
        var yearValue = data.getFullYear();

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

                                    fieldLabel: '年份',
                                    xtype: 'combobox',
                                    name: 'year',
                                    store: states1,
                                    id:"operation_query_year",
                                    displayField: 'name1',
                                    valueField: 'abbr1',
                                    columnWidth: .25,
                                    value:yearValue
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
                                    //id:'query_month',
                                    width: 90,
                                    text: '查询'
                                },
                                {
                                    xtype: 'button',
                                    class: 'reset',
                                    id: 'btn_reset_Month_report',
                                    width: 90,
                                    text: '重置'
                                },
                                {
                                    xtype: 'button',
                                    id: 'btn_export_Month_report',
                                    calss: 'export',
                                    width: 90,
                                    text: '导出'
                                }
                            ]
                        }
                    ]
                },
                {//对应图表
                    xtype: 'panel',
                    title: "实际消费金额",
                    margin: '10 ',
                    frame: true,
                    collapseMode: 'header',
                    collapsed: true,
                    collapsible: true,
                    layout: 'fit',//宽度自定义
                    height: 350, //高度
                    items: [
                        {
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
                                    fields: ['payUse'],
                                    title: '实际消费金额',
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
                                    fields: ['month'],
                                    title: '时间'
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
                                    xField: 'month',
                                    yField: 'payUse',
                                    tips: {
                                        trackMouse: true,
                                        width: 140,
                                        height: 32,
                                        renderer: function (storeItem, item) {
                                            this.setTitle(storeItem.get('month') + '充值金额 ' + storeItem.get('payUse'));
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
                        }
                    ]
                },
                {
                    xtype: 'gridpanel',
                    title: '运营月报列表',
                    margin: '10 ',
                    class: 'query',
                    id: '',
                    store: this.getDataStore(),
                    forceFit: true,
                    loadMask: true,
                    columnLines: true,
                    columns: [
                        {
                            dataIndex: 'month',
                            width: 80,
                            align: 'center',
                            header: '月份'
                        },
                        {
                            dataIndex: 'newAcc',
                            width: 110,
                            align: 'center',
                            header: '本月新增企业数'
                        },
                        {
                            dataIndex: 'lostAcc',
                            header: '本月流失企业数',
                            align: 'center',
                            width: 120
                        },
                        {
                            dataIndex: 'newPayAcc',
                            align: 'center',
                            header: '本月新增付费企业数',
                            width: 130
                        },
                        {
                            dataIndex: 'payAcc',
                            header: '本月付费企业数',
                            align: 'center'
                        },
                        {
                            dataIndex: 'consumeAcc',
                            header: '本月消费企业数',
                            align: 'center'
                        },
                        {
                            dataIndex: 'payAccSum',
                            align: 'center',
                            header: '付费企业总数'
                        },
                        {
                            dataIndex: 'accSum',
                            width: 100,
                            align: 'center',
                            header: '企业总数'
                        },
                        {
                            dataIndex: 'payRate',
                            header: '付费率',
                            align: 'center',
                            width: 60,
                            renderer: function (value) {
                                return Math.round(value * 100).toString()+'%';
                            }
                        },
                        {
                            dataIndex: 'paySum',
                            header: '本月充值总金额',
                            align: 'center',
                            renderer: function (value) {
                                return value / 10000;
                            }
                        },
                        {
                            dataIndex: 'actualConsume',
                            header: '本月实际消费金额',
                            align: 'center',
                            renderer: function (value) {
                                return value / 10000;
                            }
                        },
                        {
                            dataIndex: 'operCost',
                            header: '本月运营成本',
                            align: 'center',
                            renderer: function (value) {
                                return value / 10000;
                            }
                        }
                    ],
                    viewConfig: {
                        forceFit: true
                    }
                }
            ]
        });

        me.callParent(arguments);
    },
    //通过它去服务器渲染
    getDataStore: function () {
        if (this.store === null) {
            var data = new Date();
            this.store = App.util.AppUtil.getReportGridStore('bill.operation.queryMonthReport', {year: data.getFullYear().toString()}, 'App.model.report.business.Month');
            this.store.load();
        }
        return this.store;
    }
});

var states1 = Ext.create('Ext.data.Store', {
    fields: ['abbr1', 'name1'],
    data : [
        {"abbr1":"2016", "name1":2016},
        {"abbr1":"2017", "name1":2017},
        {"abbr1":"2018", "name1":2018},
        {"abbr1":"2019", "name1":2019},
        {"abbr1":"2020", "name1":2020},
        {"abbr1":"2021", "name1":2021},
        {"abbr1":"2022", "name1":2022},
        {"abbr1":"2023", "name1":2023},
        {"abbr1":"2024", "name1":2024},
        {"abbr1":"2025", "name1":2025}

    ]
});
