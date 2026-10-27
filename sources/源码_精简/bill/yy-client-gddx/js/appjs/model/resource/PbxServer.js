Ext.define('App.model.resource.PbxServer', {
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
            name: 'createTime',
            type: 'string'
        },
        {
            name : 'lastUpdateTime',
            type : 'string'
        },
        {
            name : 'ip',
            type : 'string'
        },
        {
            name : 'port',
            type : 'string'
        },
        {
            name: 'backInfo',
            type: 'string'
        }
    ]

});
