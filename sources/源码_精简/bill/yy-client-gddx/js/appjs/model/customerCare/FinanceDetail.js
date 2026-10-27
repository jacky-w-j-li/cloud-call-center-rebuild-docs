Ext.define('App.model.customerCare.FinanceDetail', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name: 'create_time',
            type: 'string'
        },
        {
            name: 'source',
            type: 'string'
        },
        {
            name: "accountName",
            type: 'string'
        },
        {
            name: "income",
            type: 'number'
        },
        {
            name: "currentBalance",
            type: 'number'
        },
        {
            name: "account",
            type: "string"
        }
    ]

});