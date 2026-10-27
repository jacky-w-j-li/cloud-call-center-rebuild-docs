Ext.define('App.model.resource.ServiceNumWhiteList', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name:"operator",
            type:"string",
        },
        {
            name:"memo",
            type:"string",
        }

    ]

});
