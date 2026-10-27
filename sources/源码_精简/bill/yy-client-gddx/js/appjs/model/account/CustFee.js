Ext.define('App.model.account.CustFee', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name: 'name',
            type: 'string'
        },
        {
            name: 'pricePeriod',
            type: 'string',
        },
        {
            name: 'price',
            type: 'number',
        },
        {
            name: 'autoRenew',
            type: 'boolean',
        },
        {
            name: 'memo',
            type: 'string',
        }
    ]

});