Ext.define('App.model.report.sales.personal.Month', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name: 'salesName',
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
            name: "payAccSum",
            type: 'number'
        },
        {
            name: 'currentMonthPayAcc',
            type: 'number'
        },
        {
            name: 'newCurrentPayAcc',
            type: 'number'
        },
        {
            name: 'rechargeMoney',
            type: 'number'
        },
        {
            name: "consumSum",
            type: 'number'
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
            name: "400consume",
            type: 'number'
        },
    ]

});
