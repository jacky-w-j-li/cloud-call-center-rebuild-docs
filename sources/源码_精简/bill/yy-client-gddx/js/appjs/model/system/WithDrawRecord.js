Ext.define('App.model.system.WithDrawRecord', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name: "uid",
            type: 'string'
        },
        {
            name: 'time',
            type: 'string'
        },
        {
            name: 'status',
            type: 'string'
        },
        {
            name: "money",
            type: 'string'
        },
        {
            name:"procedureFee",
            type:"string"
        }
    ]

});