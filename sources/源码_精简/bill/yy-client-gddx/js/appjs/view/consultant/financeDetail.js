Ext.define('App.view.consultant.financeDetail', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.consultantFinanceDetailQueryPanel',
    requires: ['App.model.consultant.FinanceDetail'],
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
            },
            defaultType: 'displayfield',
            layout: {
                type: 'column'
            },
            items: [
                {
                    fieldLabel: '收入',
                    id:'consultant_finance_all_in',
                    value: "",
                    columnWidth: .25
                },{
                    fieldLabel: '支出',
                    id:'consultant_finance_all_out',
                    value: "",
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
                            xtype: 'textfield',
                            fieldLabel: '流水号',
                            name: '_id',
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
                    dataIndex: 'create_time',
                    align: 'center',
                    header: '入账时间'
                },
                {
                    dataIndex: '_id',
                    align: 'center',
                    header: '流水号'
                },
                {
                    dataIndex: 'accountName',
                    align: 'center',
                    header: '所属客户'
                },
                {
                    dataIndex: 'source',
                    align: 'center',
                    header: '资金来源',
                    renderer : function(value){
                        var desc= App.util.AppUtil.getRendererValue(value,"consultantSource");
                        return desc;
                    }
                },
                {
                    dataIndex: 'source',
                    align: 'center',
                    header: '收支类型',
                    renderer : function(value){
                        var desc="";
                        if(value=='payAccount'){
                            desc="收入";
                        }else{
                            desc="支出";
                        }
                        return desc;
                    }
                },
                {
                    dataIndex: 'income',
                    header: '收支金额(元)',
                    align: 'center',
                    renderer : function(value,metaData,record){
                        var _row=record.data;
                        var val=value/10000;
                        console.log(_row.source);
                        if(_row.source=='payAccount'){
                            if(val>0){
                                val="<span style='color: green;'>+"+val+"</span>";
                            }else{
                                val="<span style='color: green;'>"+val+"</span>";
                            }
                        }else{
                            val="<span style='color: red;'>-"+val+"</span>";
                        }
                        return  val;
                    }
                },
                {
                    dataIndex: 'currentBalance',
                    header: '账户余额(元)',
                    align: 'center',
                    renderer : function(value){
                        return value/10000;
                    }
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
    getIncome: function () {
        var _income=(this.data.income||0)/10000;
        var income="<span style='color: green;display: inline-block;'>+"+_income+"</span> 元";
        if(_income<0){
            income="<span style='color: green;display: inline-block;'>"+_income+"</span> 元";
        }
        var num="<span style='display: inline-block;margin-left: 20px;'>"+this.data.incomeNum+"</span> 笔";
        var html=income+num;
        return html;
    },
    getOutlay: function () {
        var _outlay = this.data.outlay/10000;
        var outlay="<span style='color:red;display: inline-block;'>-"+_outlay+"</span> 元";
        var num="<span style='display: inline-block;margin-left: 20px;'>"+this.data.outlayNum+"</span> 笔";
        var html=outlay+num;
        return html;
    },
    getDataStore: function () {
        if (this.store === null) {
            this.store = App.util.AppUtil.getGridStore('bill.consultant.queryFinanceDetail', {}, 'App.model.consultant.FinanceDetail');
            this.store.loadPage(1);
        }
        return this.store;
    }
});