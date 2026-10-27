Ext.define('App.model.resource.smsExamine',{
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
            name: 'signToCheck',
            type: 'string',
        },
        {
            name: 'content',
            type: 'string',
        },
        {
            name: 'account',
            type: 'string',
        },
        {
            name: 'status',
            type: 'string',
        },
        {
            name: 'templateType',
            type: 'string'
        },
        {
            name:'smsChannel',
            type:'string'
        }
    ]
})