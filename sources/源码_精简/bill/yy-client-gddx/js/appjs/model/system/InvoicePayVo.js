Ext.define('App.model.system.InvoicePayVo', {
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
            name: 'pay_time',
            type: 'string'
        },
        {
            name: 'flag',
            type: 'string'
        },
        {
            name: 'memo',
            type: 'string'
        },
        {
            name: "money",
            type: 'number'
        },
        {
            name: "bank",
            type: 'string'
        }
    ]

});