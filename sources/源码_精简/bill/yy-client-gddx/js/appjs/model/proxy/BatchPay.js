Ext.define('App.model.proxy.BatchPay', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: "account",
            type: 'string'
        },
        {
            name : 'minConsume',
            type : 'number'
        },
        {
            name : 'companyName',
            type : 'string'
        },
        {
            name : 'name',
            type : 'string'
        },
        {
            name : 'balance',
            type : 'number'
        },
        {
            name : 'minConsumeBalance',
            type : 'number'
        },
        {
            name : 'money',
            type : 'number'
        },
    ]

});
