Ext.define('App.model.resource.OpenIntlFee', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name: "num",
            type: 'string'
        },
        {
            name: "type",
            type: 'string'
        },
        {
            name: 'memo',
            type: 'string'
        },
        {
            name: 'operator',
            type: 'string'
        },
        {
            name: 'createTime',
            type: 'string'
        }
    ]

});