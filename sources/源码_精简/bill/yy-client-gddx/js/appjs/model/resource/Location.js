Ext.define('App.model.resource.Location', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name: "name",
            type: 'string'
        },
        {
            name: "status",
            type: "string"
        },
        {
            name: 'memo',
            type: 'string'
        }
    ]

});