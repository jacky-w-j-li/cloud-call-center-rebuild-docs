Ext.define('App.view.system.systemUser.externalDialFees', {
    extend: 'Ext.grid.Panel',
    alias: 'widget.externalDialFees',
    xtype: 'grouped-header-grid',
    store: Ext.create('Ext.data.JsonStore', {
        fields: [
            //线路
            {name: 'lineIds',type:'array'},
            //通话资费与分成
            {name: 'local', type: 'number',mapping:'dialFee.local'},
            {name: 'remote',type: 'number',mapping:'dialFee.remote'},
            {name: 'localTel',type: 'number',mapping:'dialFee.localTel'},
            {name: 'remoteTel',type: 'number',mapping:'dialFee.remoteTel'},
            {name: 'dialPercent',type: 'number',mapping:'dialPercent'},
            //400资费与分成
            {name:'400local',type:'number',mapping:'dial400Fee.local'},
            {name:'400remote',type:'number',mapping:'dial400Fee.remote'},
            {name:'num400Percent',type:'number',mapping:'num400Percent'},
            //国际长途资费与分成
            //{name:'intlFee1',type:'number',mapping:'internationalFee.fee1'},
            //{name:'intlFee2',type:'number',mapping:'internationalFee.fee2'},
            //{name:'intlFee3',type:'number',mapping:'internationalFee.fee3'},
            {name:'intlPercent',type:'number',mapping:'intlPercent'},
        ],
        pageSize: 1000,
        proxy:{
            type:'pagingmemory',
            reader: {
                type: 'json'
            },
        },
        save:function(){
            var data = [];
            this.each(function(record){
                var raw = {};
                raw.lineIds = record.get('lineIds');

                raw.dialFee = {
                    local: record.get('local'),
                    remote: record.get('remote'),
                    localTel: record.get('localTel'),
                    remoteTel: record.get('remoteTel'),
                };
                raw.dialPercent = record.get('dialPercent');

                raw.dial400Fee = {
                    local: record.get('400local'),
                    remote: record.get('400remote'),
                };
                raw.num400Percent = record.get('num400Percent');

                raw.internationalFee = {
                    fee1: record.get('intlFee1'),
                    fee2: record.get('intlFee2'),
                    fee3: record.get('intlFee3'),
                };
                raw.intlPercent = record.get('intlPercent');

                data.push(raw);
            });

            this.proxy.data = data;
        },
        autoLoad:false,
    }),
    data:null,
    columnLines: true,
    bodyStyle: 'padding:0',
    header: false,
    viewConfig: {
        stripeRows: true
    },
    initComponent: function(){
        Ext.applyIf(this,{
            dockedItems: [
                {
                    xtype: 'toolbar',
                    class: 'dock',
                    items: [
                        {
                            iconCls: 'set_icon_cls',
                            text: '修改',
                            id: 'toolbar_update_line_fee',
                            disabled: true,
                            needSelect: true,
                        },
                        {
                            iconCls: 'delete_icon_cls',
                            text: '删除',
                            id: 'toolbar_delete_line_fee',
                            disabled: true,
                            needSelect: true,
                        },
                        {
                            iconCls: 'add_icon_cls',
                            text:'添加',
                            id: 'toolbar_add_line_fee',
                            disabled:false,
                        },


                    ]
                }
            ],
            columns:[
                {
                    dataIndex: 'lineIds',
                    width: 250,
                    align: 'center',
                    text: '线路',
                    renderer:function(lineIds){
                        if(!lineIds){
                            return '默认';
                        }

                        var lineNames = [];
                        lineIds.forEach(function(lineId){
                            var lineName = App.util.AppUtil.getRendererValue(lineId, 'line');
                            lineNames.push(lineName);
                        });
                        return lineNames.join();
                    }
                },
                {
                    text:'通话资费设置',
                    columns:[
                        {
                            text: '手机市话',
                            width:70,
                            align:'center',
                            dataIndex:'local',

                        },
                        {
                            text: '手机长途',
                            width:70,
                            align:'center',
                            dataIndex:'remote',
                        },
                        {
                            text:'固话市话',
                            width:70,
                            align:'center',
                            dataIndex:'localTel',
                        },
                        {
                            text:'固话长途',
                            width:70,
                            align:'center',
                            dataIndex:'remoteTel',
                        },
                        {
                            text:'分成比例',
                            width:70,
                            align:'center',
                            dataIndex:'dialPercent',
                        }
                    ],
                },
                {
                    text: '400资费设置',
                    columns:[
                        {
                            text: '400市话',
                            width:70,
                            align:'center',
                            dataIndex:'400local',
                        },
                        {
                            text: '400长途',
                            width:70,
                            align:'center',
                            dataIndex:'400remote',
                        },
                        {
                            text:'分成比例',
                            width:70,
                            align:'center',
                            dataIndex:'num400Percent',
                        },

                    ]
                },
                {
                    text: '国际长途资费设置',
                    columns:[
                        {
                            text: '分成比例',
                            align:'center',
                            width:140,
                            dataIndex:'intlPercent',
                        }
                    ]
                }
            ],
            viewConfig: {
                forceFit: true
            },/*
            bbar: Ext.create('Ext.PagingToolbar', {
                store: this.store,
                pageSize: 10,
                displayInfo: true,
                displayMsg: '当前记录 {0} - {1} 共 {2}',
                emptyMsg: "没有记录可显示",
                plugins: Ext.create('Ext.ux.ProgressBarPager', {})
            })*/
        });
        this.callParent(arguments);
        this.store.proxy.data = this.data;
        this.store.load();
        //this.store.loadRawData(this.data);
    },
    refresh:function(){
        this.getView().refresh();
        //this.getStore().save();
        //this.down('pagingtoolbar').doRefresh();
    }
});