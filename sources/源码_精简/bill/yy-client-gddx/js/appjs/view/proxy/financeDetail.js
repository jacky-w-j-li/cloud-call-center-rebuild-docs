Ext.define('App.view.proxy.financeDetail', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.financeDetailQueryPanel',
    requires: ['App.model.proxy.FinanceDetail'],
    layout: {
        type: 'anchor'
    },
    data:{},
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
        var financeStat = {
            xtype: 'fieldset',
            collapsible: true,
            title: '收支汇总',
            cls: 'backgroud_blue',
            defaults: {
                msgTarget: 'side',
                labelWidth: 80,
                labelAlign: 'right'
//                fieldCls: 'field_disable_cls'
//                readOnly: true
            },
            defaultType: 'displayfield',
            layout: {
                type: 'column'
            },
            items: [
                {
                    fieldLabel: '收入',
                    id:'finance_all_in',
                    value: "",
                    columnWidth: .25
                },
                {
                    fieldLabel: '支出',
                    id:'finance_all_out',
                    value:'',
                    columnWidth: .25
                }
            ]
        };
        var statPanel={
            xtype: 'panel',
            frame: true,
            title: '',
            bodyStyle: 'padding:2px 2px 0',
            items:financeStat,
            style:{marginBottom:'10px'}
        }
        items.push(statPanel);
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
                            xtype: 'combobox',
                            fieldLabel: '收支类型',
                            name: 'financeType',
                            editable: false,
                            store: this.getFinanceTypeStore(),
                            displayField: 'codeName',
                            valueField: 'codeValue',
                            columnWidth: .25
                        },
                        {
                            xtype: 'textfield',
                            fieldLabel: '流水号',
                            name: '_id',
                            columnWidth: .25
                        },
                        {
                            xtype: 'combobox',
                            fieldLabel: '资金来源',
                            name: 'source',
                            editable: false,
                            store: this.getFlagStore(),
                            displayField: 'codeName',
                            valueField: 'codeValue',
                            columnWidth: .25
                        },
                        {
                            xtype: 'textfield',
                            fieldLabel: '客户编号',
                            name: 'account',
                            columnWidth: .25
                        },
                        {
                            fieldLabel: '入账时间',
                            labelWidth: 80,
                            xtype: 'datefield',
                            format: 'Y-m-d',
                            name: 'begin',
                            columnWidth: .24
                        },
                        {
                            xtype: 'label',
                            text: '至',
                            columnWidth: .02
                        },
                        {
                            xtype: 'datefield',
                            format: 'Y-m-d',
                            name: 'end',
                            hideLabel: true,
                            columnWidth: .14
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
//                            class: 'query',
                            id:'btn_finance_all_query',
                            width: 90,
                            text: '查询'
                        },
                        {
                            xtype: 'button',
                            class: 'reset',
                            width: 90,
                            text: '重置'
                        },
                        {
                            xtype: 'button',
                            calss: 'export',
                            id:"btn_export_finance_cust",
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
            dockedItems: [
                {
                    xtype: 'toolbar',
                    class: 'dock',
                    items: [
                        {
                            iconCls: 'find_icon_cls',
                            text: '详情',
                            id: 'btn_proxy_finance_detail',
                            disabled: true,
                            needSelect: true
                        }
                    ]
                }
            ],
            columns: [
                {
                    dataIndex: 'pay_time',
                    align: 'center',
                    header: '入账时间'
                },
                {
                    dataIndex: '_id',
                    align: 'center',
                    header: '流水号'
                },
//                {
//                    dataIndex: 'account',
//                    align: 'center',
//                    header: '账户编号'
//                },
                {
                    dataIndex: 'accountName',
                    align: 'center',
                    header: '所属客户'
                },
                {
                    dataIndex: 'source',
                    align: 'center',
                    header: '资金来源',
                    renderer : function(value,metaData,record){
                        var _row=record.data;
                        var flag=_row.flag;
                        var desc= App.util.AppUtil.getRendererValue(value,"proxySource");
                        if(value=='payCallFee'){
                            var date=_row.pay_time;
                            date=date.split(" ")[0];
                            desc=date+" "+desc;
                        }else if(value=='payCall400Fee'){
                            var date=_row.pay_time;
                            var num400=_row.sn.serviceno;
                            date=date.split(" ")[0];
                            desc=date+" "+desc+"("+num400+")";
                        }else if(value=='refund'){
                            desc=desc;
                        }else if(value=='paySmsFee'){
                            var date=_row.pay_time;
                            date=date.split(" ")[0];
                            desc=date+" "+desc;
                        }else if(value=='payCallMin'){
                            if(flag=='payCall400Min'){
                                var num400=_row.sn.serviceno;
                                desc=desc+"("+num400+")";
                            }else if(flag=='payCallZJMin'){
                                desc=desc+"(总机)";
                            }else if(flag=='payCallCCMin'){
                                desc=desc+"(呼叫中心)";
                            }

                        }else if(value=='buyDialMin'){
                            desc="充值外呼话费(已废弃)";
//                        }else if(value=='systemAdjust'){
//                            desc="系统冲账";
                        }
                        return desc;
                    }
                },
                {
                    dataIndex: 'source',
                    align: 'center',
                    header: '收支类型',
                    renderer : function(value){
                        var desc="";
                        if(value=='payAccount'|| value=='proxyWithDraw'|| value=='revocationMinConsume'){
                            desc="支出";
                        }else{
                            desc="收入";
                        }
                        return desc;
                    }
                },
                {
                    dataIndex: 'income',
                    header: '收支金额(元)',
                    align: 'center',
                    renderer : function(value,metaData,record,rowIndex){
                        var _row=record.data;
                        var val=parseFloat(value);
                        if(_row.source=='payAccount'|| _row.source=='proxyWithDraw'|| _row.source=='revocationMinConsume'){
                            val="<span style='color: red;'>-"+val+"</span>";
                        }else{
                            if(val>0){
                                val="<span style='color: green;'>+"+val+"</span>";
                            }else{
                                val="<span style='color: green;'>"+val+"</span>";
                            }
                        }
                        return  val;
                    }
                },
                {
                    dataIndex: 'currentBalance',
                    header: '账户余额(元)',
                    align: 'center'

                }
            ],
            viewConfig: {
                forceFit: true
            },
            bbar: Ext.create('Ext.PagingToolbar', {
                store: this.getDataStore(),
                pageSize: 10,
                displayInfo: true,
                displayMsg: '当前记录 {0} - {1} 共 {2}',
                emptyMsg: "没有记录可显示",
                plugins: Ext.create('Ext.ux.ProgressBarPager', {})
            })
        };
        items.push(grid);

        return items;
    },
    getFlagStore: function () {
        var store=App.util.AppUtil.getDicStore('proxySource');
//        store.filter("codeValue", /^(?!payAccByBill).+$/);
        return store;
    },
    getFinanceTypeStore: function () {
        var store=App.util.AppUtil.getDicStore('financeType');
        return store;
    },
    getIncome: function () {
        var _income=parseFloat(this.data.income||0);
        var income="<span style='color: green;display: inline-block;'>+"+this.data.income+"</span> 元";
        if(_income<0){
            income="<span style='color: green;display: inline-block;'>"+this.data.income+"</span> 元";
        }
        var num="<span style='display: inline-block;margin-left: 20px;'>"+this.data.incomeNum+"</span> 笔";
        var html=income+num;
        return html;
    },
    getOutlay: function () {
        var income="<span style='color:red;display: inline-block;'>-"+this.data.outlay+"</span> 元";
        var num="<span style='display: inline-block;margin-left: 20px;'>"+this.data.outlayNum+"</span> 笔";
        var html=income+num;
        return html;
    },
    getDataStore: function () {
        if (this.store === null) {
            this.store = App.util.AppUtil.getGridStore('bill.proxy.queryProxyFinanceDetail', {}, 'App.model.proxy.FinanceDetail');
            this.store.loadPage(1);
        }
        return this.store;
    }
});