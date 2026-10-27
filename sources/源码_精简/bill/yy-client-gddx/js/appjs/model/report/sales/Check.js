Ext.define('App.model.report.sales.Check', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name : 'day',
            type : "string"
        },
        {
            name: 'user',
            type: 'string'
        },
        {
            name: 'create',
            type: 'int'
        },
        {
            name: 'turnUsing',
            type: 'int'
        },
        {
            name: 'newPay',
            type: 'int'
        },
        {
            name: 'oldPay',
            type: 'int'
        },
        {
            name: "systemPayCount",
            type: 'int'
        },
        {
            name: 'hardWarePayCount',
            type: 'int'
        }
    ]

});
