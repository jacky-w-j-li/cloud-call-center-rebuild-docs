Ext.define('App.view.account.account.intlFeeSet', {
    extend: 'Ext.grid.Panel',
    alias: 'widget.accountIntlFeeSet',
    xtype:'grid',
    class: 'query',
    forceFit: true,
    data:null,
    columnLines: true,
    bodyStyle: 'padding:0',
    header: false,
    store: Ext.create('Ext.data.JsonStore', {
        fields:[
            {name:'code',type:'string'},
            {name:'price',type:'number'},
        ],
        pageSize: 1000,
        proxy:{
            type:'pagingmemory',
            reader: {
                type: 'json'
            },
        },
        autoLoad:false,
    }),
    dockedItems: [
        {
            xtype: 'toolbar',
            class: 'dock',
            items: [
                {
                    iconCls: 'set_icon_cls',
                    text: '修改',
                    id: 'update_intl_fee_tool',
                    disabled: true,
                    needSelect: true
                },
                {
                    iconCls: 'delete_icon_cls',
                    text: '删除',
                    id: 'delete_intl_fee_tool',
                    disabled: true,
                    needSelect: true
                },
                {
                    iconCls: 'add_icon_cls',
                    text: '添加',
                    id: 'add_intl_fee_tool',
                    needSelect: false
                }
            ]
        }
    ],

    columns: [
        {
            dataIndex: 'code',
            width: 90,
            align: 'center',
            header: '区域代码'
        },
        {
            dataIndex: 'price',
            header: '价格',
            align: 'center',
            renderer: function(price){
                return price;
            }
        }
    ],
    viewConfig: {
        forceFit: true
    },
});