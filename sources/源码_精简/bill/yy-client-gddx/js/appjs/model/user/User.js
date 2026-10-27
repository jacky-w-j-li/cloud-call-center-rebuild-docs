Ext.define('App.model.user.User', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name: "pbx",
            type: 'string'
        },
        {
            name: 'account',
            type: 'string'
        },
        {
            name : "accountData",
            type : 'object'
        },
        {
            name: 'exten',
            type: 'string'
        },
        {
            name: 'password',
            type: 'string'
        },
        {
            name: 'displayName',
            type: 'string'
        },
        {
            name: 'mobile',
            type: 'string'
        },
        {
            name : "email",
            type : "string"
        },
        {
            name: 'didNum',
            type: 'string'
        },
        {
            name: 'isAdmin',
            type: 'string'
        },
        {
            name: 'sipExten',
            type: 'string'
        },
        {
            name: "mobileExten",
            type: "string"
        },
        {
            name : "createTime",
            type : "string"
        },
        {
            name : "status",
            type : "string"
        },
        {
            name : "directNum",
            type : 'string'
        }
    ]

});