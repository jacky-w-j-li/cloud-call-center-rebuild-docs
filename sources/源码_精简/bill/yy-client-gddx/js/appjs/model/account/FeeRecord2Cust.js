Ext.define('App.model.account.FeeRecord2Cust', {
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
            name: "money",
            type: 'number'
        },
        {
            name: "bank",
            type: 'string'
        },
        {
            name: "accountName",
            type: 'string'
        },
        {
            name:"accCompanyName",
            type:"string"
        },
        {
            name: "createUser",
            type: 'string'
        },
        {
            name:"proxy",
            type:"string"
        },
        {
            name:"product",
            type:"string"
        },
        {
            name:'memo',
            type:'string',
        }
    ]

});