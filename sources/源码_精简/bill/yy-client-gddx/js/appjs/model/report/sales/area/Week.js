Ext.define('App.model.report.sales.area.Week', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name: 'beginTime',
            type: 'string'
        },
        {
            name: 'year',
            type: 'string'
        },
        {
            name: 'month',
            type: 'string'
        },
        {
            name: 'day',
            type: 'string'
        },
        {
            name: 'reportType',
            type: 'string'
        },
        {
            name: 'area',
            type: 'string'
        },
        {
            name: "payAccSum",
            type: 'int'
        },
        {
            name: 'payAcc',
            type: 'int'
        },
        {
            name: 'newPayAcc',
            type: 'int'
        },
        {
            name: 'paySum',
            type: 'int'
        }
    ]

});
