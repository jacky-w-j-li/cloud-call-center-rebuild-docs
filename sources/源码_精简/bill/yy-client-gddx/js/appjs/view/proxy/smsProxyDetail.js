Ext.define('App.view.proxy.smsProxyDetail', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.smsProxyDetailQueryPanel',
    requires: ['App.model.proxy.SmsProxyDetail'],
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
                            id:'btn_sms_detail_query',
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
                    dataIndex: 'account',
                    align: 'center',
                    header: '账户编号'
                },
                {
                    dataIndex: 'num',
                    align: 'center',
                    header: '接收方号码'
                },

                {
                    dataIndex: 'submitTime',
                    align: 'center',
                    header: '提交时间'
                },
//                {
//                    dataIndex: 'reportTime',
//                    align: 'center',
//                    header: '发出时间'
//                },
                {
                    dataIndex: 'product',
                    align: 'center',
                    header: '产品平台',
                    renderer : function(value){
                        return App.util.AppUtil.getRendererValue(value,"productType");
                    }
                },
                {
                    dataIndex: 'splitCount',
                    align: 'center',
                    header: '拆分条数'
                },
                {
                    dataIndex: 'consume',
                    align: 'center',
                    header: '费用(元)',
                    renderer : function(value){
                        return App.util.AppUtil.formatTrueFee(value);
                    }
                },
                {
                    dataIndex: 'discount',
                    align: 'center',
                    header: '折扣(元)',
                    renderer : function(value){
                        var val = 0;
                        if(value){
                            value=App.util.AppUtil.formatTrueFee(value);
                            val=parseFloat(value);
                        }
                        val="<span style='color: green;'>"+val+"</span>";
                        return  val;
                    }
                },
                {
                    dataIndex: 'income',
                    align: 'center',
                    header: '收入(元)',
                    renderer : function(value){
                        value=App.util.AppUtil.formatTrueFee(value);
                        var val=parseFloat(value);

                        if(val>=0){
                            val="<span style='color: green;'>"+val+"</span>";
                        }else{
                            val="<span style='color: red;'>"+val+"</span>";
                        }
                        return  val;
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
            this.store = App.util.AppUtil.getGridStore('bill.proxy.queryProxySmsDetail', {}, 'App.model.proxy.SmsProxyDetail');
            this.store.loadPage(1);
        }
        return this.store;
    }
});