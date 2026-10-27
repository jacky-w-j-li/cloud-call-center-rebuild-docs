Ext.define('App.model.resource.dialCount', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name: "callCount",
            type: 'string'
        },
        {
            name:'residualCount',
            type:'string'
        }
    ]

});