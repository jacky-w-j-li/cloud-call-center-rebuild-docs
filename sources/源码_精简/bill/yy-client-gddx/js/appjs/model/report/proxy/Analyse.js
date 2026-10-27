/**
 * Created by sG on 2015/11/11.
 */
Ext.define('App.model.report.proxy.Analyse', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: "rank",
            type: 'number'
        },
        {
            name: "channelName",
            type: 'String'
        },
        {
            name: "actualConsume",
            type: 'number'
        },
        {
            name: "totalPay",
            type: 'number'
        }
    ]
});