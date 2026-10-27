Ext.define('App.model.resource.SipNum', {
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
            name: 'exten',
            type: 'string'
        },
        {
            name: 'pbx',
            type: 'string'
        },
        {
            name: 'secret',
            type: 'string'
        },
        {
            name: 'type',
            type: 'string'
        },
        {
            name: 'user',
            type: 'string'
        },
        {
            name: 'userData',
            type: 'object'
        }
    ]

});