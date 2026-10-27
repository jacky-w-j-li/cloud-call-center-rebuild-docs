Ext.define('App.model.resource.Pbx', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name: "status",
            type: 'string'
        },
        {
            name: 'name',
            type: 'string'
        },
        {
            name: 'sipAddr',
            type: 'string'
        },
        {
            name: 'assAddr',
            type: 'string'
        },
        {
            name: 'configAddr',
            type: 'string'
        },
        {
            name: 'encryptSipAddr',
            type: 'string'
        },
        {
            name: 'routeIp',
            type: 'string'
        },
        {
            name: 'routePort',
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
            name: 'memo',
            type: 'string'
        },
        {
            name: 'board',
            type: 'string'
        },{
            name:'ifEnableAdd',
            type:'string'
        }
    ]

});