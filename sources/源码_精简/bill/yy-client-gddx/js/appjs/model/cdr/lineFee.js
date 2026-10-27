Ext.define('App.model.cdr.lineFee', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name: "line",
            type: 'string'
        },
        {
            name: 'date',
            type: 'string'
        },
        {
            name: "calls",
            type: 'string'
        },
        {
            name: "localPhoneMinutes",
            type: 'string'
        },
        {
            name: "remotePhoneMinutes",
            type: 'object'
        },
        {
            name: "localTelMinutes",
            type: 'string'
        },
        {
            name: "remoteTelMinutes",
            type: 'string'
        },
        {
            name: "localPhoneSecond6",
            type: 'string'
        },
        {
            name: "remotePhoneSecond6",
            type: 'string'
        },
        {
            name: "localTelSecond6",
            type: 'string'
        },

        {
            name: "remoteTelSecond6",
            type: 'string'
        },

        {
            name: "cost",
            type: 'string'
        },

        {
            name: "earn",
            type: 'string'
        },
        {
            name: "createTime",
            type: 'string'
        }
    ]

});