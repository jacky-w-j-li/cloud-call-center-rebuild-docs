Ext.define('App.model.system.InvoiceVo', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name: "account",
            type: 'string'
        },
        {
            name: 'createTime',
            type: 'string'
        },
        {
            name: 'status',
            type: 'string'
        },
        {
            name: "money",
            type: 'string'
        },
        {
            name: "sendType",
            type: 'string'
        },
        {
            name:"info",
            type:"object"
        },
        {
            name:"addr",
            type:"object"
        },
        {
            name:"info.invoiceTitle",
            type:""
        }
    ]

});