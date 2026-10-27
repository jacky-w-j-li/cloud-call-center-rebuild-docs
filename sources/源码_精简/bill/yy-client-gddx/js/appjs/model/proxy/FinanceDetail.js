Ext.define('App.model.proxy.FinanceDetail', {
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
            name: 'source',
            type: 'string'
        },
        {
            name: "billFee",
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
            name: "money",
            type: 'string'
        },
        {
            name: "accountName",
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
            name: "currentBalance",
            type: 'string'
        },

        {
            name: "product",
            type: 'string'
        },
        {
            name: "discount",
            type: 'string'
        }
    ]

});