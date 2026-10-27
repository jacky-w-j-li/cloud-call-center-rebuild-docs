Ext.define('App.model.account.YtxSmsTemplate', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'string'
        },
        {
            name: "account",
            type: 'string'
        },
        {
            name: 'accountName',
            type: 'string'
        },
        {
            name: 'name',
            type: 'string'
        },
        {
            name: "ytxtemplateid",
            type: 'string',
        },
        {
            name: 'templatesign',
            type: 'string'
        },
        {
            name: 'templatebody',
            type: 'string'
        },
        {
            name: 'ytxverification',
            type: 'number',
        },
        {
            name: 'smsChannel',
            type: 'object'
        }
    ]
});