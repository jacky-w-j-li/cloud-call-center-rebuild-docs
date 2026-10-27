Ext.define('App.model.system.SystemUser', {
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
            name: 'loginName',
            type: 'string'
        },
        {
            name : "password",
            type : 'string'
        },
        {
            name: 'status',
            type: 'string'
        },
        {
            name: 'identity',
            type: 'string'
        },
        {
            name: 'linkManName',
            type: 'string'
        },
        {
            name: 'linkManEmail',
            type: 'string'
        },
        {
            name: 'linkManPhone',
            type: 'string'
        },
        {
            name : "memo",
            type : "string"
        },

        {
            name: 'overdraw',
            type: 'string'
        },
        {
            name: 'role',
            type: 'object'
        },
        {
            name: 'proxyLevel',
            type: 'string'
        },
        {
            name: 'balance',
            type: 'string'
        },
        {
            name: 'createTime',
            type: 'string'
        },
        {
            name: 'monthRentPercent',
            type: 'string'
        },
        {
            name:'parent',
            type:'string'
        },
        {
            name : 'smsFee',
            type : 'number'
        },
        {
            name : 'smsPercent',
            type : 'number'
        },
        {
            name : 'callEventUrl',
            type : 'string'
        },
        {
            name: 'proxyType',
            type: 'string'
        },
        {
            name: 'realProxy',
            type: 'string',
        }
    ]

});