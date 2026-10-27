Ext.define('App.view.report.sales.personal.month', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.reportSalesPsersonalMonth',
    requires: ['App.model.report.sales.personal.Month'],
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
        var data = new Date();
        var monthValue=0;
        var yearValue=0;
        if(data.getMonth()==0){
            monthValue=12;
            yearValue=data.getFullYear()-1;
        }else{
            monthValue=data.getMonth();
            yearValue=data.getFullYear();
        }
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

                            fieldLabel: '年份',
                            xtype: 'combobox',
                            name: 'year',
                            store: states1,
                            id:"btn_area_personal_year",
                            displayField: 'name1',
                            valueField: 'abbr1',
                            columnWidth: .25,
                            value:yearValue
                        },
                        {
                            fieldLabel: '月份',
                            xtype: 'combobox',
                            name: 'month',
                            id:"btn_area_personal_month",
                            store: states2,
                            displayField: 'name2',
                            valueField: 'abbr2',
                            columnWidth: .25,
                            value:monthValue
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
                            id:"btn_reset_personal_month",
                            width: 90,
                            text: '重置'
                        },
                        {
                            xtype: 'button',
                            calss: 'export',
                            id:"btn_export_personal_month",
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
            axes:[
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
            series:[
                {
                    type: 'line',
                    smooth : true,
                    highlight: {
                        size: 7,
                        radius: 7
                    },
                    fill:true,
                    axis: 'left',
                    xField: 'salesName',
                    yField: 'rechargeMoney',
                    tips: {
                        trackMouse: true,
                        width: 140,
                        height: 32,
                        renderer: function(storeItem, item) {
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
            title : "充值金额图表",
            margin: '10 ',
            frame: true,
            collapseMode:'header',
            collapsed : true,
            collapsible : true,
            layout: 'fit',//宽度自定义
            height : 350, //高度
            items : [paySumchart]
        };


        items.push(chartPaySumPanel);


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
                    dataIndex: 'salesName',
                    width: 50,
                    align: 'center',
                    header: '名称'
                },
                {
                    dataIndex: 'month',
                    width: 20,
                    align: 'center',
                    header: '月份'
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
                    header: '本月付费企业数'
                },
                {
                    dataIndex: 'newCurrentPayAcc',
                    header: '本月新增付费企业数',
                    align: 'center',
                    width: 70
                },
                {
                    dataIndex: 'rechargeMoney',
                    width: 70,
                    align: 'center',
                    header: '本月充值金额(元)'
                },

                {
                    dataIndex: 'consumSum',
                    width: 70,
                    align: 'center',
                    header: '本月消费(元)',
                    renderer: function(value){
                        if(value==0||value==value){
                            value=value/10000;
                        };
                        return value;
                    }
                },
                {
                    dataIndex: 'licensesFee',
                    width: 70,
                    align: 'center',
                    header: '本月坐席消费(元)',
                    renderer: function(value){
                        if(value==0||value==value){
                            value=value/10000;
                        };
                        return value;
                    }
                },
                {
                    dataIndex: 'callFee',
                    width: 70,
                    align: 'center',
                    header: '本月话费(元)',
                    renderer: function(value){
                        if(value==0||value==value){
                            value=value/10000;
                        };
                        return value;
                    }
                },
                {
                    dataIndex: 'smsFee',
                    width: 70,
                    align: 'center',
                    header: '本月短信消费(元)',
                    renderer: function(value){
                        if(value==0||value==value){
                            value=value/10000;
                        };
                        return value;
                    }
                },
                {
                    dataIndex: 'numberFee',
                    width: 70,
                    align: 'center',
                    header: '本月号码消费(元)',
                    renderer: function(value){
                        if(value==0||value==value){
                            value=value/10000;
                        };
                        return value;
                    }
                },
                {
                    dataIndex: '400consume',
                    width: 70,
                    align: 'center',
                    header: '本月400消费(元)',
                    renderer: function(value){
                        if(value==0||value==value){
                            value=value/10000;
                        };
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
            var data=new Date();
            if(data.getMonth()<9 && data.getMonth()>0){
                this.store = App.util.AppUtil.getGridStore('bill.report.queryPersonalMonthReport',{year:data.getFullYear().toString(),month:"0"+(data.getMonth()+1).toString()}, 'App.model.report.sales.personal.Month');
            }else if(data.getMonth()==0){
                this.store = App.util.AppUtil.getGridStore('bill.report.queryPersonalMonthReport',{year:(data.getFullYear()-1).toString(),month:"12"}, 'App.model.report.sales.personal.Month');
            }else {
                this.store = App.util.AppUtil.getGridStore('bill.report.queryPersonalMonthReport',{year:data.getFullYear().toString(),month:(data.getMonth()+1).toString()}, 'App.model.report.sales.personal.Month');
            }
            this.store.load();
        }
        return this.store;
    }
});
var states1 = Ext.create('Ext.data.Store', {
    fields: ['abbr1', 'name1'],
    data : [
        {"abbr1":"2015", "name1":2015},
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
var states2 = Ext.create('Ext.data.Store', {
    fields: ['abbr2', 'name2'],
    data : [
        {"abbr2":"01", "name2":1},
        {"abbr2":"02", "name2":2},
        {"abbr2":"03", "name2":3},
        {"abbr2":"04", "name2":4},
        {"abbr2":"05", "name2":5},
        {"abbr2":"06", "name2":6},
        {"abbr2":"07", "name2":7},
        {"abbr2":"08", "name2":8},
        {"abbr2":"09", "name2":9},
        {"abbr2":"10", "name2":10},
        {"abbr2":"11", "name2":11},
        {"abbr2":"12", "name2":12}
    ]
});
