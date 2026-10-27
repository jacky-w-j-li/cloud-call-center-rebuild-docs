Ext.define('App.model.account.ServiceNo', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name: "account",
            type: 'string'
        },
        {
            name: 'flag',
            type: 'string'
        },
        {
            name: 'monthRent',
            type: 'string'
        },
        {
            name : "monthRentProxy",
            type : 'string'
        },
        {
            name: 'status',
            type: 'string'
        },
        {
            name: "createTime",
            type: 'string'
        },
        {
            name:"memo",
            type:'String'
        },
        {
            name:"concurrent",
            type:'String'
        },
        {
            name:"product",
            type:'String'
        },
        {
            name:"endTime",
            type:'String'
        }
    ]
});
