Ext.define('App.model.account.AccountSetLog', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name: "time",
            type: 'string'
        },
        {
            name: 'account',
            type: 'string'
        },
        {
            name: 'user',
            type: 'string'
        },
        {
            name: 'type',
            type: 'string'
        },
        {
            name: 'content',
            type: 'string'
        }
    ]

});