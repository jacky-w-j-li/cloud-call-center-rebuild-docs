Ext.define('App.model.account.TelRecord', {
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
            name : "accountObj",
            type : "object"
        },
        {
            name : "type",
            type : 'string'
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
            name: 'beginTime',
            type: 'string'
        },
        {
            name: "endTime",
            type: 'string'
        },
        {
            name : "beginTimeDisplay",
            type : 'string'
        },
        {
            name : "endTimeDisplay",
            type : "string"
        },
        {
            name: 'line',
            type: 'string'
        },
        {
            name: 'seconds6',
            type: 'string'
        },
        {
            name: 'minutes',
            type: 'string'
        }
    ]

});