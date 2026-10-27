Ext.define('App.model.resource.OutRoute', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name : "number",
            type :'string'
        },
        {
            name: "name",
            type: 'string'
        },
        {
            name: "boardId",
            type: 'string'
        },
        {
            name: 'context',
            type: 'string'
        },
        {
            name: 'createTime',
            type: 'string'
        },
        {
            name : 'lastUpdateTime',
            type : 'string'
        },
        {
            name: 'backInfo',
            type: 'string'
        }
    ]

});
