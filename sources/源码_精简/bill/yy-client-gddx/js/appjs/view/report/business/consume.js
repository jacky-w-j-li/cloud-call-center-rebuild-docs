Ext.define('App.view.report.business.consume', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.reportBusinessConsume',
    requires: ['App.model.report.business.Consume'],
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
        var yearValue=data.getFullYear();

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

                            fieldLabel: '地域',
                            xtype: 'combobox',
                            name: 'area',
                            store: this.getAreaStore(),
                            displayField: 'codeName',
                            valueField: 'codeValue',
                            typeAhead: true,
                            columnWidth: .25,
                        },
                        {

                            fieldLabel: '年份',
                            xtype: 'combobox',
                            name: 'year',
                            store: states1,
                            id:"business_consume_query_year",
                            displayField: 'name1',
                            valueField: 'abbr1',
                            columnWidth: .25,
                            value:yearValue
                        },
                        /*{
                            fieldLabel: '月份',
                            xtype: 'combobox',
                            name: 'month',
                            id:"btn_area1_month",
                            store: states2,
                            displayField: 'name2',
                            valueField: 'abbr2',
                            columnWidth: .25,
                            value:monthValue
                        },*/
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
                            id:"btn_reset_month",
                            width: 90,
                            text: '重置'
                        },
                        {
                            xtype: 'button',
                            calss: 'export',
                            id:"btn_export_month",
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
                    fields: ['paySum'],
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
                    fields: ['month'],
                    title: '时间'
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
                    xField: 'beginTime',
                    yField: 'paySum',
                    tips: {
                        trackMouse: true,
                        width: 140,
                        height: 32,
                        renderer: function(storeItem, item) {
                            this.setTitle(storeItem.get('month') + '充值金额 ' + storeItem.get('paySum'));
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
                    dataIndex: 'monthId',
                    width: 50,
                    align: 'center',
                    header: '月份',
                    renderer:function(monthId){
                       return monthId.slice(0, 4) + '-' + monthId.slice(4 + Math.abs(0));
                    }
                },
                {
                    dataIndex: 'totalPayAccCount',
                    width: 60,
                    align: 'center',
                    header: '总付费企业数'
                },
                //{
                //    dataIndex: 'payAccCount',
                //    width: 70,
                //    align: 'center',
                //    header: '本月付费企业数'
                //},
                {
                    dataIndex: 'newPayAccCount',
                    header: '本月新增付费企业数',
                    align: 'center',
                    width: 70
                },
                //{
                //    dataIndex: 'totalPay',
                //    width: 70,
                //    align: 'center',
                //    header: '本月充值金额',
                //    renderer: function(value){
                //    return value/10000;
                //}
                //},

                {
                    dataIndex: 'actualConsume',
                    width: 70,
                    align: 'center',
                    header: '本月实际消费',
                    renderer: function(value){
                        return value/10000;
                    }
                },
                {
                    dataIndex: 'licenceConsume',
                    width: 70,
                    align: 'center',
                    header: '本月Licence消费',
                    renderer: function(value){
                        return value/10000;
                    }
                },
                {
                    dataIndex: 'outCallConsume',
                    width: 70,
                    align: 'center',
                    header: '本月外呼话费',
                    renderer: function(value){
                        return value/10000;
                    }
                },
                {
                    dataIndex: 'smsConsume',
                    width: 70,
                    align: 'center',
                    header: '本月短信消费',
                    renderer: function(value){
                        return value/10000;
                    }
                },
                {
                    dataIndex: 'snConsume',
                    width: 70,
                    align: 'center',
                    header: '本月号码消费',
                    renderer: function(value){
                        return value/10000;
                    }
                },
                {
                    dataIndex: '_400Consume',
                    width: 70,
                    align: 'center',
                    header: '本月400话费',
                    renderer: function(value){
                        return value/10000;
                    }
                },
                {
                    dataIndex: 'flowConsume',
                    width: 70,
                    align: 'center',
                    header: '本月流量消费',
                    renderer: function(value){
                        return value/10000;
                    }
                },
                {
                    dataIndex: 'voiceConsume',
                    width: 70,
                    align: 'center',
                    header: '本月语音验证码消费',
                    renderer: function(value){
                        return value/10000;
                    }
                },
                {
                    dataIndex: 'minConsume',
                    width: 70,
                    align: 'center',
                    header: '本月话费低消',
                    renderer: function(value){
                        return value/10000;
                    }
                },
                {
                    dataIndex: 'workPay',
                    width: 70,
                    align: 'center',
                    header: '本月实施费用',
                    renderer: function(value){
                        return value/10000;
                    }
                },
                {
                    dataIndex: 'hardwarePay',
                    width: 70,
                    align: 'center',
                    header: '本月硬件费用',
                    renderer: function(value){
                        return value/10000;
                    }
                },
                {
                    dataIndex: 'tapePay',
                    width: 70,
                    align: 'center',
                    header: '本月录音费用',
                    renderer: function(value){
                        return value/10000;
                    }
                },
                {
                    dataIndex: 'otherPay',
                    width: 70,
                    align: 'center',
                    header: '本月其他费用',
                    renderer: function(value){
                        return value/10000;
                    }
                }

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
            var date=new Date();
            this.store = App.util.AppUtil.getReportGridStore('bill.operation.queryConsumeReport',{year:date.getFullYear().toString()}, 'App.model.report.business.Consume');

            this.store.load();
        }
        return this.store;
    },
    getAreaStore: function(){
        var store = App.util.AppUtil.getDicStore('proxyType');
        store.add({
            "codeType": "proxyType",
            "codeOrder": 1000,
            "codeName": "其他",
            "codeValue": "UNKOWN"
        });

        var data = [];
        store.each(function(record){
            var raw = {
                codeType: record.get('codeType'),
                codeOrder: record.get('codeOrder'),
                codeName: record.get('codeName'),
                codeValue: record.get('codeValue')
            }
            data.push(raw);
        });

        store.proxy.data = data;

        return store;
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
