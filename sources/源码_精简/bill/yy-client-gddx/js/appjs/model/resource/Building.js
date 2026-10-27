Ext.define('App.model.resource.Building', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name : 'location',
            type:'string'
        },
        {
            name: "name",
            type: 'string'
        },
        {
            name: 'tel',
            type: 'string'
        },
        {
            name: 'linkman',
            type: 'string'
        },
        {
            name: "addr",
            type: "string"
        },
        {
            name: 'memo',
            type: 'string'
        }
    ]

});