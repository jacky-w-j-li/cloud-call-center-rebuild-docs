Ext.define('App.model.account.AccountProduct', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name: 'product',
            type: 'string'
        },
        {
            name: "account",
            type: 'string'
        },
        {
            name: 'createTime',
            type: 'string'
        },
        {
            name: 'node',
            type: 'string'
        },
        {
            name: 'zjOutRoute',
            type: 'string'
        },
        {
            name: 'pbx',
            type: 'array',
        },
        {
            name: 'zjTransferRoute',
            type: 'string'
        },
        {
            name: 'dialPriceStrategy',
            type: 'string'
        },
        {
            name: 'dialFee',
            type: 'object'
        },
        {
            name: 'transferFeeStrategy',
            type: 'string'
        },
        {
            name: 'operatorsResource',
            type: 'string'
        },
        {
            name: 'transferFee',
            type: 'object'
        },
        {
            name: 'minConsume',
            type: 'string'
        },
        {
            name: 'callinLicence',
            type: 'string'
        },
        {
            name: 'standardLicence',
            type: 'string'
        },
        {
            name: 'calloutLicence',
            type: 'string'
        },
        {
            name: "giveMinute",
            type: "string"
        },
        {
            name: 'smsFee',
            type: 'number'
        },
        {
            name: 'open_sms_dispatch',
            type: 'boolean'
        },
        {
            name: 'sms_dispatch_url',
            type: 'string'
        }
    ]

});
