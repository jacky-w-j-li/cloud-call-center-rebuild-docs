/**
 * Created by sG on 2015/11/11.
 */
Ext.define('App.model.report.proxy.Global', {
    extend: 'Ext.data.Model',
    fields: [
        {
            name: "_id",
            type: 'String'
        },
        {
            name: "monthId",
            type: 'String'
        },
        {
            name: "channelTotalCount",
            type: 'number'
        },
        {
            name: "payChannelTotalCount",
            type: 'number'
        },
        {
            name: "payChannelCount",
            type: 'number'
        },
        {
            name: "actualConsume",
            type: 'number'
        },
        {
            name: "licenceConsume",
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