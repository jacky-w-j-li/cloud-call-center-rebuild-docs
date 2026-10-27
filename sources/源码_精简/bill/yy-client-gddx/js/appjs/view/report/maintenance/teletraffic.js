Ext.define('App.view.report.maintenance.teletraffic', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.reportTeletraffic',
    requires: ['App.model.report.maintenance.Teletraffic'],
    layout: {
        type: 'anchor'
    },
    store:null,
    chartStore:null,
    initComponent: function (){
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
                                    fieldLabel: '统计周期',
                                    xtype: 'combobox',
                                    name: 'timeType',
                                    store: checkType,
                                    id : "maintenance_teletraffic_query_timeType",
                                    displayField: 'name',
                                    valueField: 'value',
                                    columnWidth: .25,
                                    value: checkType.data.first()
                                },
                                {
                                    fieldLabel: '年',
                                    xtype: 'combobox',
                                    name: 'year',
                                    id: "maintenance_teletraffic_query_year",
                                    store: yearStore,
                                    displayField: 'name',
                                    valueField: 'value',
                                    columnWidth: .25,
                                    hidden : true,
                                    value: new Date().getFullYear()
                                },
                                {
                                    fieldLabel: '季度',
                                    xtype: 'combobox',
                                    name: 'season',
                                    id: "maintenance_teletraffic_query_season",
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
                                    id: "maintenance_teletraffic_query_month",
                                    store: monthStore,
                                    displayField: 'name',
                                    valueField: 'value',
                                    columnWidth: .25,
                                    hidden : true,
                                    value : monthStore.getAt(new Date().getMonth()).get("value")
                                },
                                {
                                    fieldLabel: '天',
                                    name:'day',
                                    xtype: 'datefield',
                                    id: "maintenance_teletraffic_query_day",
                                    store: monthStore,
                                    format: 'Y-m-d',
                                    columnWidth: .25,
                                    listeners : {
                                        render : function(datefield) {
                                            datefield.setValue(new Date());
                                        }
                                    }
                                },
                                {
                                    fieldLabel: '时间',
                                    labelWidth: 80,
                                    xtype: 'datefield',
                                    format: 'Y-m-d',
                                    name: 'beginDate',
                                    id :"maintenance_teletraffic_query_custom",
                                    hidden : true,
                                    columnWidth: .24
                                },
                                {
                                    xtype: 'label',
                                    text: '⤑',
                                    id :"maintenance_teletraffic_query_custom1",
                                    hidden : true,
                                    columnWidth: .02
                                },
                                {
                                    xtype: 'datefield',
                                    format: 'Y-m-d',
                                    name: 'endDate',
                                    hideLabel: true,
                                    id :"maintenance_teletraffic_query_custom2",
                                    hidden : true,
                                    columnWidth: .14
                                },
                                {
                                    fieldLabel: '线路',
                                    xtype: 'combobox',
                                    name: 'lines',
                                    id :"maintenance_teletraffic_query_lines",
                                    store: App.util.AppUtil.getDicStore('line'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    columnWidth:.25,
                                    multiSelect: true,
                                    editable:false,
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
                                    id:"maintenance_teletraffic_query_find_btn",
                                    width: 90,
                                    text: '查询'
                                },
                                {
                                    xtype: 'button',
                                    class: 'reset',
                                    id: "maintenance_teletraffic_query_reset_btn",
                                    width: 90,
                                    text: '重置'
                                },
                                {
                                    xtype: 'button',
                                    calss: 'export',
                                    id: "maintenance_teletraffic_query_check_export_btn",
                                    width: 90,
                                    text: '导出'
                                }

                            ]
                        }
                    ]
                },
                {
                    title: "图表",
                    padding: '5',
                    frame: true,
                    collapseMode: 'header',
                    collapsed: true,
                    collapsible: true,
                    layout: 'fit',//宽度自定义
                    height: 500, //高度
                    name: 'chartPanel',
                },
                {
                    xtype: 'gridpanel',
                    title: '列表',
                    margin: '10 ',
                    class: 'query',
                    forceFit: true,
                    store: this.getDataStore(),
                    columnLines: true,
                    columns: [
                        {
                            dataIndex: 'line',
                            width: 50,
                            align: 'center',
                            header: '线路',
                            renderer: function(value){
                                var name = App.util.AppUtil.getRendererValue(value, 'line');
                                if(!name || name == ''){
                                    name = '未知线路';
                                }
                                return name;
                            }
                        },
                        {
                            dataIndex: 'milliseconds',
                            width: 70,
                            align: 'center',
                            header: '话务量(分钟)',
                            renderer: function(value){
                                return Math.round(value / (1000 * 60));
                            }
                        }
                    ],
                    viewConfig: {
                        forceFit: true,
                    }
                }
            ]
        });

        me.callParent(arguments);
    },
    getDataStore: function () {
        if (this.store === null) {
            this.store = App.util.AppUtil.getReportGridStore('bill.maintenance.queryMaintenanceTeletrafficReport', {timeType:"day",day: App.util.AppUtil.getCurrentDate()}, 'App.model.report.maintenance.Teletraffic');

            var thisPanel = this;
            this.store.on({'load': function (store) {
                var rawData = store.getProxy().getReader().rawData;
                var chartData = [];
                var lineNames = [];
                var records = rawData.chartList;
                records = records.concat();

                records.forEach(function(record){
                    if(lineNames.indexOf(record.name) < 0){
                        lineNames.push(record.name);
                    }

                    record.time = thisPanel.formatTime(record.time);
                });

                while(records.length > 0){
                    var record = records.pop();

                    var lineTraffic = {}
                    lineTraffic.time = record.time;
                    lineTraffic[record.name] = Math.round(record.milliseconds / (1000 * 60));

                    records.reduceRight(function(prev, item, index,arr) {
                        if(item.time == lineTraffic.time){
                            lineTraffic[item.name] = Math.round(item.milliseconds / (1000 * 60));
                            arr.splice(index, 1);
                        }
                    },[]);
                    chartData.push(lineTraffic);
                }

                chartData.sort(function(a,b){
                    if(a.time < b.time){
                        return -1;
                    }else{
                        return 1;
                    }
                })
                chartData.push({time:''});

                var seriesArr = [];
                lineNames.forEach(function(item){
                    var series = {
                        type: 'line',
                        highlight: {
                            size: 7,
                            radius: 7
                        },
                        axis: 'left',
                        xField: 'time',
                        yField: item,
                        smooth: true,
                        markerConfig: {
                            type: 'circle',
                            size: 4,
                            radius: 4,
                            'stroke-width': 0.5
                        },
                        tips: {
                            trackMouse: true,
                            width: 250,
                            height: 20,
                            renderer: function (storeItem) {
                                this.setTitle(item + " : " + storeItem.get(item) + '分钟');
                            }
                        }
                    };
                    seriesArr.push(series);
                });

                thisPanel.getChartStore(true,lineNames).loadData(chartData);
                thisPanel.refreshChart(seriesArr,lineNames);
            }});


            this.store.load();
        }
        return this.store;
    },
    refreshChart: function(seriesArr,fields){
        if(this.chart){
            this.down('panel[name="chartPanel"]').removeAll();
            this.chart = null;
        }

        this.chart ={
            xtype: 'chart',
            style: 'background:#fff;',
            animate: true,
            store: this.getChartStore(),
            shadow: true,
            theme: 'Category1',
            legend: {
                position : 'bottom',
                itemSpacing : 5,
                padding : 5,
                listCount: 12,
            },
            axes: [{
                type: 'Numeric',
                position: 'left',
                fields: fields,
                title: '话务量(分钟)',
                minimum:0,
                grid: {
                    odd: {
                        opacity: 0.8,
                        fill: '#ddd',
                        stroke: '#bbb',
                        'stroke-width': 0.8
                    }
                },
            }, {
                type: 'Category',
                position: 'bottom',
                fields: ['time'],
                title: '时间',
                label   : {
                    rotate:{degrees:270}
                }
            }],
            series: seriesArr
        };

        this.down('panel[name="chartPanel"]').add(this.chart);
    },
    getChartStore: function(newStore,lineNameArr){
        if(newStore) {
            this.chartStore = Ext.create('Ext.data.JsonStore', {
                fields: ['time'].concat(lineNameArr),
                data: []
            });
        }

        return this.chartStore;
    },
    formatTime: function(value){
        if(value.length >= 6){
            value = value.slice(0, 4) + "/" + value.slice(4);
        }
        if(value.length > 7){
            value = value.slice(0,-2) + "/" + value.slice(-2);
        }

        return value;

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
        {"value": "day", "name": "天"},
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
