Ext.define('App.model.resource.ApproveServiceNum', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name : "type",
            type : 'string'
        },
        {
            name: 'account',
            type: 'string'
        },
        {
            name: 'product',
            type: 'string'
        },
        {
            name: 'createTime',
            type: 'string'
        },
        {
            name:'serviceno',
            type:'string'
        }

    ]

});
