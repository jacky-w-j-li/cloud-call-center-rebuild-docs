Ext.define('App.model.resource.Board', {
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
            name: 'status',
            type: 'string'
        },
        {
            name: 'location',
            type: 'string'
        },
        {
            name : 'building',
            type : 'string'
        },
        {
            name: 'memo',
            type: 'string'
        },
        {
            name:'owner',
            type:'string'
        }
    ]

});