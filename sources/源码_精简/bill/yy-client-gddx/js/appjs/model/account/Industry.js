Ext.define('App.model.account.Industry',{
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name:'name',
            type:'string',
        },
        {
            name:'categoryLevel',
            type:'number',
        },
        {
            name:'parent',
            type:'string'
        },
        {
            name: 'memo',
            type: 'string',
        }
    ]
})