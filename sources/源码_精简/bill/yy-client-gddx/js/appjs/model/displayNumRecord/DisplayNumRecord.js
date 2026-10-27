Ext.define('App.model.displayNumRecord.DisplayNumRecord', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name: 'account',
            type: 'string'
        },
        {
            name: 'accountName',
            type: 'string'
        },
        {
            name: 'displayNums',
            type: 'string'
        },
        {
            name: 'line',
            type: 'string'
        },
        {
            name: 'operator',
            type: 'string',
        },
        {
            name: 'memo',
            type: 'string'
        },
        {
            name: 'oathImgs',
            type: 'string',
        }
    ]

});