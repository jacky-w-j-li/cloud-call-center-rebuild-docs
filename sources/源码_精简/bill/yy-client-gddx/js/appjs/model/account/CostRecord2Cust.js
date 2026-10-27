Ext.define('App.model.account.CostRecord2Cust', {
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
            name: 'payType',
            type: 'string'
        },
        {
            name: 'flag',
            type: 'string'
        },
        {
            name: "totalFee",
            type: 'string'
        },
        {
            name: "income",
            type: 'string'
        },
        {
            name: "proxy",
            type: 'string'
        },
        {
            name: "sn",
            type: 'object'
        },
        {
            name: "accountName",
            type: 'string'
        },
        {
            name: "product",
            type: 'string'
        }
    ]

});