Ext.define('App.model.account.ServiceFare', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name: "fareType",
            type: 'string'
        },
        {
            name: 'leftFare',
            type: 'string'
        },
        {
            name: 'overFare',
            type: 'string'
        },
        {
            name: 'noticeFare',
            type: 'string'
        }
    ]

});