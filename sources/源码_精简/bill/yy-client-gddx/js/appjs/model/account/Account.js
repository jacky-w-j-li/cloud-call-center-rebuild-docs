Ext.define('App.model.account.Account', {
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
            name: "accountType",
            type: 'string'
        },
        {
            name: 'companyName',
            type: 'string'
        },
        {
            name: 'linkManName',
            type: 'string'
        },
        {
            name: 'linkManPhone',
            type: 'string'
        },
        {
            name: 'linkManEmail',
            type: 'string'
        },
        {
            name : "createMethod",
            type : "string"
        },
        {
            name: 'memo',
            type: 'string'
        },
        {
            name: 'createTime',
            type: 'string'
        },
        {
            name: 'status',
            type: 'string'
        },
        {
            name: "pbx",
            type: "object"
        },
        {
            name:'createUser',
            type:'string'
        },
        {
            name:'customerCare',
            type:'string'
        },
        {
            name:'consultant',
            type:'string'
        },
        {
            name:'managerPassword',
            type:'string'

        },
        {
            name:'balance',
            type:'number'
        },
        {
            name : 'totalPay',
            type : 'number'
        },
        {
            name : 'totalConsume',
            type : 'number'
        },
        {
            name:'consume',
            type:'string'

        },
        {
            name:'salePre',
            type:'string'
        },
        {
            name:'maintainer',
            type:'string'
        },
        {
            name:'stopReason',
            type:'string'
        },
        {
            name:'area',
            type:'string'
        },
        {
            name : 'businessTag',
            type : 'array'
        },
        {
            name : "industry",
            type : "string",
        },
        {
            name : "subIndustry",
            type : "string",
        }
    ]

});
