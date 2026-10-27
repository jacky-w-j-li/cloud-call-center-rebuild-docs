/// add by kivi 2016-09-27 ///
Ext.define('App.model.consultant.FinanceDetail', {
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