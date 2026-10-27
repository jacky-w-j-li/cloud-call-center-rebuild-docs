Ext.define('App.model.resource.InRoute', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name: "number",
            type: 'string'
        },
        {
            name: "pbx",
            type: 'string'
        },
        {
            name: "boardId",
            type: 'string'
        },
        {
            name: 'createTime',
            type: 'string'
        },
        {
            name: 'lastUpdateTime',
            type: 'string'
        },
        {
            name: "backInfo",
            type: "string"
        }
    ]

});
