Ext.define('App.model.system.SystemUserSetLog', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name: "time",
            type: 'string'
        },
        {
            name: 'uid',
            type: 'string'
        },
        {
            name: 'operator',
            type: 'string'
        },
        {
            name: 'type',
            type: 'string'
        },
        {
            name: 'content',
            type: 'string'
        }
    ]

});