Ext.define('App.view.proxy.call400Detail', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.call400DetailQueryPanel',
    requires: ['App.model.proxy.Call400Detail'],
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
                            fieldLabel: '起止时间',
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
                        },
                        {
                            xtype: 'textfield',
                            fieldLabel: '客户编号',
                            name: 'account',
                            columnWidth: .25
                        },
                        {
                            xtype: 'textfield',
                            fieldLabel: '号码',
                            name: 'combox',
                            columnWidth: .25
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
                            id:'btn_finance_call400_query',
                            width: 90,
                            text: '查询'
                        },
                        {
                            xtype: 'button',
                            class: 'reset',
                            width: 90,
                            text: '重置'
                        }
//                        {
//                            xtype: 'button',
//                            calss: 'export',
//                            width: 90,
//                            text: '导出'
//                        }
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
                    ]
                }
            ],
            columns: [
                {
                    dataIndex: 'beginTimeDisplay',
                    align: 'center',
                    header: '开始时间'
                },
                {
                    dataIndex: 'account',
                    align: 'center',
                    header: '客户编号'
                },
                {
                    dataIndex: 'callerProvince',
                    align: 'center',
                    header: '主叫地',
                    renderer : function(value,metaData,record,rowIndex){
                        var _row=record.data;
                        var val=value+"-"+_row.callerCity;
                        return  val;
                    }
                },
                {
                    dataIndex: 'calleeProvince',
                    align: 'center',
                    header: '被叫地',
                    renderer : function(value,metaData,record,rowIndex){
                        var _row=record.data;
                        var val=value+"-"+_row.calleeCity;
                        return  val;
                    }
                },
                {
                    dataIndex: 'cid',
                    align: 'center',
                    header: '主叫号码'
                },
                {
                    dataIndex: 'did',
                    align: 'center',
                    header: '被叫号码'
                },
//                {
//                    dataIndex: 'type',
//                    align: 'center',
//                    header: '呼叫类型',
//                    renderer : function(value){
//                        return "普通来电";
//                    }
//                },
                {
                    dataIndex: 'isLocal',
                    header: '通信类型',
                    align: 'center',
                    renderer : function(value){
                        var desc="";
                        if(value==="true"){
                            desc='本地';
                        }else{
                            desc='长途';
                        }
                        return  desc;
                    }
                },
                {
                    dataIndex: 'minutes',
                    header: '时长(分钟)',
                    align: 'center'
                },
                {
                    dataIndex: 'seconds',
                    header: '时长(秒)',
                    align: 'center'
                },
                {
                    dataIndex: 'consume',
                    header: '费用(元)',
                    align: 'center',
                    renderer : function(value){
                        return App.util.AppUtil.formatTrueFee(value);
                    }
                },
                {
                    dataIndex: 'discount',
                    header: '折扣(元)',
                    align: 'center',
                    renderer : function(value){
                        return App.util.AppUtil.formatTrueFee(value);
                    }
                },
                {
                    dataIndex: 'income',
                    header: '收入(元)',
                    align: 'center',
                    renderer : function(value){
                        return App.util.AppUtil.formatTrueFee(value);
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
    getDataStore: function () {
        if (this.store === null) {
            this.store = App.util.AppUtil.getGridStore('bill.proxy.queryProxyCall400Detail', {}, 'App.model.proxy.Call400Detail');
            this.store.loadPage(1);
        }
        return this.store;
    }
});