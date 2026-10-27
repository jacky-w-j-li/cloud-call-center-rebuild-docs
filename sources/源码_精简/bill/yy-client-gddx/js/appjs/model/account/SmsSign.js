Ext.define('App.model.account.SmsSign', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'object'
        },
        {
            name: "account",
            type: 'string'
        },
        {
            name : "name",
            type : "string"
        },
        {
            name : "subcode",
            type : 'string'
        }
    ]

});