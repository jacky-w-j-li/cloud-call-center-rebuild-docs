Ext.define('App.model.proxy.CallDetail', {
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
            name: 'type',
            type: 'string'
        },
        {
            name: 'cid',
            type: 'string'
        },
        {
            name: 'did',
            type: 'string'
        },
        {
            name: "beginTimeDisplay",
            type: 'string'
        },
        {
            name: "endTimeDisplay",
            type: 'string'
        },
        {
            name: "product",
            type: 'string'
        },
        {
            name: "callerProvince",
            type: 'string'
        },
        {
            name: "callerCity",
            type: 'string'
        },
        {
            name: "calleeProvince",
            type: 'string'
        },
        {
            name: "calleeCity",
            type: 'string'
        },
        {
            name: "seconds",
            type: 'string'
        },
        {
            name: "minutes",
            type: 'string'
        },
        {
            name: "isLocal",
            type: 'string'
        },
        {
            name: "feeStrategy",
            type: 'string'
        },
        {
            name: "proxy",
            type: 'string'
        },
        {
            name: "consume",
            type: 'string'
        },
        {
            name: "discount",
            type: 'string'
        },
        {
            name: "income",
            type: 'string'
        }
    ]

});