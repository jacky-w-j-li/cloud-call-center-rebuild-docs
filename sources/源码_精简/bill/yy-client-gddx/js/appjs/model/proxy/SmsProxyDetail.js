Ext.define('App.model.proxy.SmsProxyDetail', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
//        {
//            name: "reportTime",
//            type: 'string'
//        },
        {
            name: 'num',
            type: 'string'
        },
        {
            name: 'account',
            type: 'string'
        },
        {
            name: 'content',
            type: 'string'
        },
        {
            name: "submitTime",
            type: 'string'
        },
        {
            name: "signDisplay",
            type: 'string'
        },
        {
            name: "sign",
            type: 'string'
        },
        {
            name: "smsId",
            type: 'string'
        },
        {
            name: "product",
            type: 'string'
        },
        {
            name: "consume",
            type: 'number'
        },
        {
            name: "proxy",
            type: 'string'
        },
        {
            name: "splitCount",
            type: 'string'
        },
        {
            name: "income",
            type: 'number'
        },
        {
            name: "discount",
            type: 'number'
        }
    ]

});