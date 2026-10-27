Ext.define('App.model.report.IncomAnalysis', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
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
            name: "licensesFee",
            type: 'number'
        },
        {
            name: "callFee",
            type: 'number'
        },
        {
            name: "smsFee",
            type: 'number'
        },
        {
            name: "numberFee",
            type: 'number'
        },
        {
            name: "consume400",
            type: 'number'
        },
    ]

});
