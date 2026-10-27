Ext.define('App.view.cdr.lineFee', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.lineFeeQueryPanel',
    requires: ['App.model.cdr.lineFee'],
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
                            fieldLabel: '创建时间',
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
                            xtype: 'combobox',
                            fieldLabel: '线路名称',
                            name: 'line',
                            store: App.util.AppUtil.getDicStore('line'),  //wwh
                            displayField: 'codeName',
                            valueField: 'codeValue',
                            typeAhead: true,
                            queryMode: 'local'
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
                            id:'btn_lineFee_all_query',
                            width: 90,
                            text: '查询'
                        },
                        {
                            xtype: 'button',
                            class: 'reset',
                            width: 90,
                            text: '重置'
                        },
//                        {
//                            xtype: 'button',
//                            calss: 'export',
//                            width: 90,
//                            text: '导出'
//                        }
                        {
                            xtype: 'button',
                            calss: 'export',
                            id:"btn_export_line_fee",
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
                            id: 'btn_cdr_lineFee_detail',
                            disabled: true,
                            needSelect: true
                        }
                    ]
                }
            ],
            columns: [
                {
                    dataIndex: 'createTime',
                    align: 'center',
                    header: '创建时间'
                },
                {
                    dataIndex: 'line',
                    header: '线路名称',
                    align: 'center',
                    renderer: function(value){
                        return App.util.AppUtil.getRendererValue(value, 'line');
                    }
                },
                {
                    dataIndex: 'calls',
                    align: 'center',
                    header: '通话数'
                },
                {
                    dataIndex: 'localPhoneMinutes',
                    align: 'center',
                    header: '本地手机(分钟)'
                },
                {
                    dataIndex: 'remotePhoneMinutes',
                    align: 'center',
                    header: '长途手机(分钟)'
                },
                {
                    dataIndex: 'localTelMinutes',
                    align: 'center',
                    header: '本地固话(分钟)'
                },
                {
                    dataIndex: 'remoteTelMinutes',
                    align: 'center',
                    header: '长途固话(分钟)'
                },
                {
                    dataIndex: 'cost',
                    header: '成本(元)',
                    align: 'center',
                    renderer : function(value,metaData,record,rowIndex){
                        value=App.util.AppUtil.formatTrueFee(value);
                        var _row=record.data;
                        var val=parseFloat(value);
                        return  val;
                    }
                },
                {
                    dataIndex: 'earn',
                    header: '利润(元)',
                    align: 'center',
                    renderer :function(value,metaData,record,rowIndex){
                        value=App.util.AppUtil.formatTrueFee(value);
                        var val=parseFloat(value);

                        if(val>0){
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
            this.store = App.util.AppUtil.getGridStore('bill.cdr.queryCdrLineFeeDetail', {}, 'App.model.cdr.lineFee');
            this.store.loadPage(1);
        }
        return this.store;
    }
});
