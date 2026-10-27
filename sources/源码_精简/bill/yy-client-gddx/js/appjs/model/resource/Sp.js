Ext.define('App.model.resource.Sp', {
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
            name: 'memo',
            type: 'string'
        }
    ]

});