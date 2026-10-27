/**
 * Created by apple on 15/8/14.
 */
Ext.define('App.model.resource.SmsSend', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'object'
        },
        {
            name: "content",
            type: 'string'
        },
        {
            name: "sign",
            type: 'string'
        },
        {
            name: "product",
            type: 'string'
        },
        {
            name : "account",
            type : "string"
        },
        {
            name : "smsChannel",
            type : 'string'
        },
        {
            name : "splitCount",
            type : 'string'
        },
        {
            name : "createUser",
            type : 'string'
        },
        {
            name : "m7Status",
            type : 'string'
        },
        {
            name : "signDisplay",
            type : 'string'
        },
        {
            name : "submitTime",
            type : 'string'
        },
        {
            name : "type",
            type : 'string'
        },
        {
            name : "num",
            type : 'string'
        },
        {
            name : "by_errordescription",
            type : 'string'
        },
        {
            name : "mlrt_msgid",
            type : 'string'
        },
        {
            name : "checkUser",
            type : 'string'
        },
        {
            name : "checkTime",
            type : 'string'
        }
    ]

});
