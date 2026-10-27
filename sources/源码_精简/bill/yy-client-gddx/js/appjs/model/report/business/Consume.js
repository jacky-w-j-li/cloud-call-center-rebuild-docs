Ext.define('App.model.report.business.Consume', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: 'monthId',
            type: 'string'
        },

        {
            name: 'totalPayAccCount',
            type: 'number'
        },
        //{
        //    name: 'payAccCount',
        //    type: 'number'
        //},
        {
            name: "newPayAccCount",
            type: 'number'
        },
        //{
        //    name: 'totalPay',
        //    type: 'number'
        //},
        {
            name: 'actualConsume',
            type: 'number'
        },
        {
            name: 'licenceConsume',
            type: 'number'
        },
        {
            name: "outCallConsume",
            type: 'number'
        },
        {
            name: "smsConsume",
            type: 'number'
        },
        {
            name: "snConsume",
            type: 'number'
        },
        {
            name: "_400Consume",
            type: 'number'
        },
        {
            name: "flowConsume",
            type: 'number'
        },
        {
            name: "voiceConsume",
            type: 'number'
        },
        {
            name:'minConsume',
            type:'number'
        },
        {
            name:'workPay',
            type:'number',
        },
        {
            name:'hardwarePay',
            type:'number',
        },
        {
            name:'tapePay',
            type:'number',
        },
        {
            name:'otherPay',
            type:'number',
        }
    ]

});
