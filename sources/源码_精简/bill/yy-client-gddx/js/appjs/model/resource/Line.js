Ext.define('App.model.resource.Line', {
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
            name: 'status',
            type: 'string'
        },
        {
            name: 'dialFee',
            type: 'object'
        },
        {
            name: 'internationalFee',
            type: 'object'
        },
        {
            name: 'sp',
            type: 'string'
        },
        {
            name: 'memo',
            type: 'string'
        },
        {
            name: 'type',
            type: 'string'
        },

    ]

});