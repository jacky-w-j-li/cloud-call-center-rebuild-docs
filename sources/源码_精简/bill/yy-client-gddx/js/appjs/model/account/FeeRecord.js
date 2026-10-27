Ext.define('App.model.account.FeeRecord', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name: "proxy",
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
            name: "money",
            type: 'number'
        },
        {
            name: "bank",
            type: 'string'
        }
    ]

});