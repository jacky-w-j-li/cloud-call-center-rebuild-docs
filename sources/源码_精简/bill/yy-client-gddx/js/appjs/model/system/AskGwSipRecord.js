Ext.define('App.model.system.AskGwSipRecord', {
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
            name: 'createTime',
            type: 'string'
        },
        {
            name: 'uid',
            type: 'string'
        },
        {
            name: 'num',
            type: 'string'
        },
        {
            name: 'isFax',
            type: 'string'
        },
        {
            name: "status",
            type: 'string'
        }
    ]

});