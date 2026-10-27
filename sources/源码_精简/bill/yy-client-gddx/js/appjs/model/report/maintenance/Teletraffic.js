Ext.define('App.model.report.maintenance.Teletraffic', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name: 'line',
            type: 'string'
        },
        {
            name: 'name',
            type: 'string'
        },
        {
            name: 'time',
            type: 'string'
        },
        {
            name: "milliseconds",
            type: 'number'
        }
    ]

});
