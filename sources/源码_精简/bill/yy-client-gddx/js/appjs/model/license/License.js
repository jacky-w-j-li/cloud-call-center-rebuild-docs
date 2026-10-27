Ext.define('App.model.license.License', {
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
            name: 'status',
            type: 'string'
        },
        {
            name: 'createTime',
            type: 'string'
        },
        {
            name: 'endTime',
            type: 'string'
        },
        {
            name: 'bingUser',
            type: 'string'
        },
        {
            name: 'type',
            type: 'string'
        },
        {
            name: "createUser",
            type: "string"
        }
    ]

});