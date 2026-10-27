/**
 * Created by sG on 2015/10/1.
 */
Ext.define('App.model.report.business.Month', {
    extend: 'Ext.data.Model',
    fields: [
        {

            name: "month",
            type: 'string'
        },
        {
            name : 'accSum',
            type : 'number'
        },
        {
            name : 'newAcc',
            type : 'number'
        },
        {
            name : 'lostAcc',
            type : 'number'
        },
        {
            name : 'payAccSum',
            type : 'number'
        },
        {
            name : 'newPayAcc',
            type : 'number'
        },
        {
            name : 'payAcc',
            type : 'number'
        },
        {
            name : 'consumeAcc',
            type : 'number'
        },
        {
            name : 'payRate',
            type : 'number'
        },
        {
            name : 'paySum',
            type : 'number'
        },
        {
            name : 'actualConsume',
            type : 'number'
        },
        {
            name : 'paySum',
            type : 'number'
        },
        {
            name : 'operCost',
            type : 'number'
        },
    ]

});
