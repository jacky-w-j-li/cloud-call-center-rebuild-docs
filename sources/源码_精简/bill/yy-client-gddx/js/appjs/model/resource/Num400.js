Ext.define('App.model.resource.Num400', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name : "owner",
            type : 'string'
        },
        {
            name: "status",
            type: 'string'
        },
        {
            name: 'account',
            type: 'string'
        },
        {
            name : 'accountData',
            type : 'object'
        },
        {
            name: 'min400Consume',
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
            name : 'dial400FeeStrategy',
            type :'string'
        },
        {
            name : 'dial400Fee',
            type : 'object'
        },
        {
            name: 'pbx',
            type: 'string'
        },
        {
            name: 'product',
            type: 'string'
        },
        {
            name: 'memo',
            type: 'string'
        },
        {
            name : "beginTime",
            type : "string"
        },
        {
            name : "endTime",
            type : "string"
        },
        {
            name :"concurrent",
            type :"string"
        },
        {
            name:"initFee",
            type:"object"
        }
    ]

});
