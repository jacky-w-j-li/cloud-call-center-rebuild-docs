Ext.define('App.model.resource.SmsChannel',{
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name: 'name',
            type: 'string',
        },
        {
            name: 'type',
            type: 'string',
        },
        {
            name: 'createTime',
            type: 'string',
        },
        {
            name: 'updateTime',
            type: 'string',
        },
        {
            name: 'memo',
            type: 'string',
        },
        {
            name:'price',
            type:'number',
        }
    ]
})