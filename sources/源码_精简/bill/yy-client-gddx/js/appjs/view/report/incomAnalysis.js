Ext.define('App.view.report.incomAnalysis', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.reportIncomAnalysis',
    requires: ['App.model.report.IncomAnalysis'],
    layout: {
        type: 'anchor'
    },

    store: null,
    chartStore : null,
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
                            id:"btn_reset_incomAnalysis_month",
                            width: 90,
                            text: '重置'
                        },
                        {
                            xtype: 'button',
                            calss: 'export',
                            id:"btn_export_incomAnalysis_month",
                            width: 90,
                            text: '导出'
                        }

                    ]
                }
            ]
        };
        items.push(form);
        var me = this;
        var paySumchart = {
            layout: 'fit',
            items: {
                xtype: 'chart',
                id: 'chartCmp324325423423',
                animate: true,
                store:  this.getChartStore(),
                shadow: true,
                legend: {
                    position: 'right'
                },
                insetPadding: 20,
                series: [{
                    type: 'pie',
                    angleField: 'value',
                    showInLegend: true,
                    tips: {
                        trackMouse: true,
                        width: 200,
                        height: 28,
                        renderer: function(storeItem, item) {
                            // calculate and display percentage on hover
                            var total = 0;
                            me.getChartStore().each(function(rec) {
                                total += rec.get('value');
                            });
                            this.setTitle(storeItem.get('key') + ': '+(storeItem.get('value')/10000) +"\n"+"比例:"+ Math.round(storeItem.get('value') / total * 100) + '%');
                        }
                    },
                    highlight: {
                        segment: {
                            margin: 20
                        }
                    },
                    label: {
                        field: 'key',
                        display: 'rotate',
                        contrast: true,
                        font: '18px Arial'
                    }
                }]
            }

        };

        var chartPaySumPanel = {
            title : "收入分析图表",
            margin: '10 ',
            frame: false,
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
                    dataIndex: 'year',
                    width: 40,
                    align: 'center',
                    header: '年'
                },
                {
                    dataIndex: 'month',
                    width: 30,
                    align: 'center',
                    header: '月份'
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
                    dataIndex: 'consume400',
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
    getChartStore : function(){
       if(this.chartStore === null){
           var chartModel = Ext.define('chartData', {
               extend: 'Ext.data.Model',
               fields: [
                   {name: 'key', type: 'string'},
                   {name: 'value',  type: "int"}
               ]
           });
           this.chartStore =  Ext.create('Ext.data.Store',{
               model :chartModel
           });
       }
        return this.chartStore;
    },
    getDataStore: function () {
        if (this.store === null) {
            var data=new Date();
            if(data.getMonth()<9 && data.getMonth()>0){
                this.store = App.util.AppUtil.getGridStore('bill.report.queryIncomAnalysisReport',{year:data.getFullYear().toString(),month:"0"+(data.getMonth()).toString()}, 'App.model.report.IncomAnalysis');
            }else if(data.getMonth()==0){
                this.store = App.util.AppUtil.getGridStore('bill.report.queryIncomAnalysisReport',{year:(data.getFullYear()-1).toString(),month:"12"}, 'App.model.report.IncomAnalysis');
            }else {
                this.store = App.util.AppUtil.getGridStore('bill.report.queryIncomAnalysisReport',{year:data.getFullYear().toString(),month:(data.getMonth()).toString()}, 'App.model.report.IncomAnalysis');
            }
            this.store.load();
        }
        var me = this;
        this.store.addListener("datachanged",function(changeStore,opt){
            if(me.chartStore === null){
                var chartModel = Ext.define('chartData', {
                    extend: 'Ext.data.Model',
                    fields: [
                        {name: 'key', type: 'string'},
                        {name: 'value',  type: "int"}
                    ]
                });
                me.chartStore =  Ext.create('Ext.data.Store',{
                    model :chartModel
                });
            }
            me.chartStore.removeAll();
            var countData = {
                smsFee : 0,
                numberFee:0,
                consume400:0,
                licensesFee:0,
                callFee : 0
            };
            for(var i=0;i<changeStore.getCount();i++){
                var obj = changeStore.getAt(i);
                countData.licensesFee += obj.data.licensesFee;
                countData.callFee += obj.data.callFee;
                countData.smsFee += obj.data.smsFee;
                countData.numberFee += obj.data.numberFee;
                countData.consume400 += obj.data.consume400;
            }
            me.chartStore.add({
                key : "licensesFee",
                value : countData.licensesFee
            });
            me.chartStore.add({
                key : "callFee",
                value : countData.callFee
            });
            me.chartStore.add({
                key : "smsFee",
                value : countData.smsFee
            });
            me.chartStore.add({
                key : "numberFee",
                value : countData.numberFee
            });
            me.chartStore.add({
                key : "consume400",
                value : countData.consume400
            });
        });
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


