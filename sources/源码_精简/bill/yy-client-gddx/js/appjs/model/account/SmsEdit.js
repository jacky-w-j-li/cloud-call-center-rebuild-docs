/**
 * Created by apple on 15/8/11.
 */
Ext.define('App.model.account.SmsEdit', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: '_id',
            type: 'object'
        },
        {
            name: "account",      //账户编号
            type: 'string'
        },
        {
            name: "accountName",  //账户名称
            type: 'string'
        },
        {
            name: "companyName",  //公司名称
            type: 'string'
        },
        {
            name : "name",
            type : "string"
        },
        {
            name : "content",
            type : 'string'
        }
    ]

});