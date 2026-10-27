Ext.define('App.model.resource.Intl',{
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name: 'code',
            type: 'string',
        },
        {
            name: 'line',
            type: 'string',
        },
        {
            name: 'dest',
            type: 'string',
        },
        {
            name:'price',
            type:'number',
        },
        {
            name:'priceWithTax',
            type:'number',
        },
        {
            name: 'memo',
            type: 'string',
        }
    ]
})