Ext.define('App.model.resource.toCommunicate', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: 'from',
            type: 'string'
        },
        {
            name: "time",
            type: 'string'
        },
        {
            name:'content',
            type:'string'
        }
    ]

});