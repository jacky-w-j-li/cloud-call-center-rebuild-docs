Ext.define('App.model.system.UserRole', {
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
            name: 'desc',
            type: 'string'
        },
        {
            name : "createTime",
            type : 'string'
        },
        {
            name: 'lastUpdateTime',
            type: 'string'
        }
    ]

});
