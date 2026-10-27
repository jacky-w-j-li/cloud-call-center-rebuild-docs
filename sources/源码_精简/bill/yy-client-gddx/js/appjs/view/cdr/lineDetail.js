Ext.define('App.view.cdr.lineDetail', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.lineDetailQueryPanel',
    requires: ['App.model.cdr.lineDetail'],
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
                            id:'btn_line_detail_query',
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
                            id:"btn_export_line_detail",
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
                            id: 'btn_cdr_show_line_detail',
                            disabled: true,
                            needSelect: true
                        }
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
                    dataIndex: 'line',
                    header: '线路名称',
                    align: 'center',
                    renderer: function(value){
                        return App.util.AppUtil.getRendererValue(value, 'line');
                    }
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
                {
                    dataIndex: 'type',
                    align: 'center',
                    header: '呼叫类型',
                    renderer : function(value){
                        return App.util.AppUtil.getRendererValue(value,"callTypeCC");
                    }
                },
                {
                    dataIndex: 'isLocal',
                    header: '通信类型',
                    align: 'center',
                    renderer : function(value){
                        var desc="";
                        value=value+"";
                        if(value==="true"){
                            desc='本地';
                        }else{
                            desc='长途';
                        }
                        return  desc;
                    }
                },
                {
                    dataIndex: 'isIntl',
                    header: '国际长途',
                    align: 'center',
                    renderer : function(value){
                        var desc="";
                        value=value+"";
                        if(value==="true"){
                            desc='是';
                        }else{
                            desc='否';
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
                    dataIndex: 'income',
                    header: '代理收入(元)',
                    align: 'center',
                    renderer : function(value){
                        return App.util.AppUtil.formatTrueFee(value);
                    }
                },
                {
                    dataIndex: 'cost',
                    header: '成本(元)',
                    align: 'center',
                    renderer : function(value){
                        return App.util.AppUtil.formatTrueFee(value);
                    }
                },
                {
                    dataIndex: 'earn',
                    header: '利润(元)',
                    align: 'center',
                    renderer : function(value){
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
            this.store = App.util.AppUtil.getGridStore('bill.cdr.queryCdrLineDetail', {}, 'App.model.cdr.lineDetail');
            this.store.loadPage(1);
        }
        return this.store;
    }
});