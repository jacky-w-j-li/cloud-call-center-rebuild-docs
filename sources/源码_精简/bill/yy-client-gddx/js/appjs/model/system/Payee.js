Ext.define('App.model.system.Payee', {
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
            name: 'createTime',
            type: 'string'
        },
        {
            name: "cardName",
            type: 'string'
        },
        {
            name: 'address',
            type: 'string'
        },
        {
            name: 'bank',
            type: 'string'
        },
        {
            name: 'cardNo',
            type: 'string'
        }
    ]
});