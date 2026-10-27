Ext.define('App.view.report.business.accountPayCharge', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.reportBusinessAccountPayCharge',
    requires: ['App.model.report.business.AccountPayCharge'],
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
                            store: yearStore,
                            displayField: 'name',
                            valueField: 'value',
                            value: yearValue
                        },
                        {
                            fieldLabel: '月',
                            xtype: 'combobox',
                            name: 'month',
                            store: monthStore,
                            displayField: 'name',
                            valueField: 'value',
                            value: monthValue
                        },
                        {
                            fieldLabel: '账户编号',
                            name: 'account',
                            id: 'account_pay_charge_query_account',
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
                            id: "btn_export_account_pay_charge",
                            width: 90,
                            text: '导出'
                        }
                    ]
                }
            ]
        };
        items.push(form);
        var grid = {
            xtype: 'gridpanel',
            title: '列表',
            margin: '10 ',
            class: 'query',
            id : 'account_pay_charge_grid',
            forceFit: true,
            loadMask: true,
            store: this.getDataStore(),
            columnLines: true,
            columns: [
                {
                    dataIndex: 'order',
                    width: 100,
                    align: 'center',
                    header: '排名'
                },
                {
                    dataIndex: 'month',
                    width: 100,
                    id:'account_pay_charge_column_month',
                    align: 'center',
                    header: '月份',
                    hidden: true,
                    renderer: function (value) {
                        return value.substr(-2,2);
                    }
                },
                {
                    dataIndex: 'account',
                    width: 100,
                    align: 'center',
                    header: '账户编号'
                },
                {
                    dataIndex: 'accountName',
                    width: 100,
                    align: 'center',
                    header: '账户名称'
                },
                {
                    dataIndex: 'accountCompanyName',
                    width: 100,
                    align: 'center',
                    header: '公司名称'
                },
                {
                    dataIndex: 'pay',
                    width: 100,
                    align: 'center',
                    header: '本月充值',
                    renderer: function (value) {
                        return value / 10000;
                    }
                },
                {
                    dataIndex: 'actualConsume',
                    width: 100,
                    align: 'center',
                    header: '本月消费',
                    renderer: function (value) {
                        return value / 10000;
                    }
                },
                {
                    dataIndex: 'totalPay',
                    width: 100,
                    align: 'center',
                    header: '累计充值',
                    renderer: function(value){
                        return value / 10000;
                    }
                },
                {
                    dataIndex: 'totalConsume',
                    width: 100,
                    align: 'center',
                    header: '累计消费',
                    renderer: function(value){
                        return value / 10000;
                    }
                },
                {
                    dataIndex: 'currBalance',
                    width: 100,
                    align: 'center',
                    header: '余额',
                    renderer: function(value){
                        return value / 10000;
                    }
                }
            ],
            viewConfig: {
                forceFit: true
            },
            bbar: Ext.create('Ext.PagingToolbar', {
                store: this.getDataStore(),
                pageSize: 20,
                displayInfo: true,
                displayMsg: '当前记录 {0} - {1} 共 {2}',
                emptyMsg: "没有记录可显示",
                plugins: Ext.create('Ext.ux.ProgressBarPager', {})
            }),
        };
        items.push(grid);
        return items;
    },
    getDataStore: function () {
        if (this.store === null) {
            var data = new Date();
            this.store = App.util.AppUtil.getReportGridStore('bill.operation.queryAccountPayChargeReport', {
                year: data.getFullYear().toString(),
                sort: 'pay',
                month: monthStore.getAt(new Date().getMonth()).get("value")
            }, 'App.model.report.business.AccountPayCharge');

            var thisPanel = this;
            this.store.on({
                'load' : function(){
                    var accountTextField = thisPanel.up('panel').down('textfield[name="account"]');
                    var grid = thisPanel.up('panel').down('#account_pay_charge_grid');

                    if(accountTextField.getValue() && accountTextField.getValue() != ''){
                        grid.down('#account_pay_charge_column_month').setVisible(true);
                    }else{
                        grid.down('#account_pay_charge_column_month').setVisible(false);
                    }
                }
            });

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
        {"value": "pay", "name": "本月充值"},
        {"value": "actualConsume", "name": "本月消费"},
        {"value": "totalPay", "name": "累计充值"},
        {"value": "totalConsume", "name": "累计消费"},
        {"value": "currBalance", "name": "余额"},
    ]
});

