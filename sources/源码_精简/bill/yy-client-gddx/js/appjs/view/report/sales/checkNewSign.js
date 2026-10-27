Ext.define('App.view.report.sales.checkNewSign',{
    extend: 'Ext.grid.Panel',
    alias: 'widget.checkNewSign',
    xtype: 'grid',
    store: Ext.create('Ext.data.JsonStore', {
        fields: [
            {name: 'account', type: 'string'},
            {name: 'accountName', type: 'string'},
            {name: 'accountCompanyName', type: 'string'}
        ],

        pageSize: 1000,
        proxy:{
            type:'pagingmemory',
            reader: {
                type: 'json'
            },
        },
        autoLoad : false
    }),
    data:null,
    columnLines: true,
    bodyStyle: 'padding:0',
    header: false,
    viewConfig: {
        forceFit: true,
        getRowClass: function(record, rowIndex, rowParams, store) {
            if (record.raw.newSignFlag < 0){
                return 'red_back';
            }else{
                return 'green_back';
            }
        },
    },
    initComponent: function(){
        Ext.applyIf(this, {
            columns: [
                {
                    dataIndex: 'account',
                    width: 120,
                    align: 'center',
                    text: '账户编号',
                },
                {
                    dataIndex: 'accountName',
                    width: 120,
                    align: 'center',
                    text: '账户名称',
                },
                {
                    dataIndex: 'accountCompanyName',
                    width: 260,
                    align: 'center',
                    text: '企业名称',
                },
            ],
        });

        this.callParent(arguments);
        this.store.proxy.data = this.data;
        this.store.load();
        this.getView().refresh();
    },
    loadData : function(data){
        this.data = data;
        this.store.proxy.data = data;
        this.store.load();
        this.getView().refresh();
    }
});