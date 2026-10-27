Ext.define('App.model.resource.Queue', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name: "status",
            type: 'string'
        },
        {
            name: 'account',
            type: 'string'
        },
        {
            name: 'accountData',
            type: 'object'
        },
        {
            name: 'type',
            type: 'string'
        },
        {
            name: 'pbx',
            type: 'string'
        }
    ]

});