Ext.define('App.model.account.SmsTemplete', {
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
            name: "name",
            type: "string"
        },
        {
            name: "num",
            type: 'string'
        }, {
            name: "content",
            type: "string"
        }, {
            name: "varCount",
            type: "int"
        }, {
            name: "sign",
            type: "string"
        },
        {
            name: "smsChannel",
            type: "Object",
        }
    ]

});
