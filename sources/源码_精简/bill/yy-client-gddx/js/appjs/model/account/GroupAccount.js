Ext.define('App.model.account.GroupAccount', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'object'
        },
        {
            name: "accountList",
            type: 'object'
        },
        {
            name:"createTime",
            type:'string'
        },
        {
            name: 'memo',
            type: 'string'
        }
    ]

});