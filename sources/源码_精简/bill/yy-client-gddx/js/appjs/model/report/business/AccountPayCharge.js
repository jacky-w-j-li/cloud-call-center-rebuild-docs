Ext.define('App.model.report.business.AccountPayCharge',{
    extend: 'Ext.data.Model',
    fields: [
        {
            name : 'order',
            type : 'number'
        },
        {
            name : 'month',
            type : 'string',
        },
        {
            name : 'account',
            type : 'string'
        },
        {
            name : 'accountName',
            type : 'string'
        },
        {
            name : 'accountCompanyName',
            type : 'string'
        },
        {
            name : 'pay',
            type : 'number'
        },
        {
            name : 'actualConsume',
            type : 'number'
        },
        {
            name : 'totalPay',
            type : 'number',
        },
        {
            name : 'totalConsume',
            type : 'number',
        },
        {
            name : 'currBalance',
            type : 'number',
        }

    ]
});