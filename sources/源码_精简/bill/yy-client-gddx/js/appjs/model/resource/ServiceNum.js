Ext.define('App.model.resource.ServiceNum', {
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
            name : "type",
            type : 'string'
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
            name: 'monthRent',
            type: 'string'
        },
        {
            name : 'monthRentProxy',
            type :'string'
        },
        {
            name: 'callMinutes',
            type : 'string'
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
            name:"concurrent",
            type : 'string'
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
            name: 'pbx',
            type: 'string'
        },
        {
            name: 'memo',
            type: 'string'
        },
        {
            name : 'board',
            type : 'string'
        },
        {
            name : 'lastAccount',
            type : 'string'
        },
        {
            name:'bind400',
            type:'string'
        },
        {
            name:'failNum',
            type:'string'
        },
        {
            name:'sp',
            type:'string'
        },
        {
            name:'owner',
            type:'string'
        },
        {
            name:"flag_dhb",
            type:"string",
        },
        {
            name:"flag_360",
            type:"string",
        },
        {
            name:"Solution_state",
            type:"string",
        }

    ]

});
