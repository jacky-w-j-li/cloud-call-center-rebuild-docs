Ext.define('App.view.account.account.renewServiceNo', {
    extend: 'Ext.window.Window',
    requires: [''],
    alias: 'widget.renewServiceNoWin',
    height: 400,
    width: 600,
    title: '续费',
    autoScroll: true,
    data: null,
    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            modal: true,
            items: [
                {
                    xtype: 'tabpanel',
                    activeTab: 0,
                    items: [
                        {
                            xtype: 'panel',
                            frame: true,
                            title: '续时长',
                            id:'renew_month_panel',
                            items: [
                                {
                                    xtype: 'form',
                                    frame: true,
                                    title: '',
                                    bodyStyle: 'padding:2px 2px 0',
                                    fieldDefaults: {
                                        msgTarget: 'side',
                                        labelWidth: 100,
                                        labelAlign: 'right'
                                    },
                                    items:this.getMonthItems()
                                }
                            ]
                        },
                        {
                            xtype: 'panel',
                            frame: true,
                            title: '增加并发数',
                            id:'renew_concurrent_panel',
                            items: [
                                {
                                    xtype: 'form',
                                    frame: true,
                                    title: '',
                                    bodyStyle: 'padding:2px 2px 0',
                                    fieldDefaults: {
                                        msgTarget: 'side',
                                        labelWidth: 100,
                                        labelAlign: 'right'
                                    },
                                    items:this.getConcurrentItems()
                                }
                            ]
                        },
                        {
                            xtype: 'panel',
                            frame: true,
                            title: '购买外呼时长',
                            id:'renew_dialmins_panel',
                            items: [
                                {
                                    xtype: 'form',
                                    frame: true,
                                    title: '',
                                    bodyStyle: 'padding:2px 2px 0',
                                    fieldDefaults: {
                                        msgTarget: 'side',
                                        labelWidth: 100,
                                        labelAlign: 'right'
                                    },
                                    items:this.getDialItems()
                                }
                            ]
                        }
                    ]
                }
            ]
        });
        me.callParent(arguments);
    },
    getMonthItems: function () {
        var self=this;
        var items = new Array();
        var fieldset = {
            xtype: 'fieldset',
            title: '续时长',
            collapsible: true,
            layout: 'anchor',
            cls: 'backgroud_blue',
            defaultType: 'textfield',
            items: [
                {
                    xtype:'panel',
                    layout:"column",
                    border:false,
                    bodyCls:'backgroud_blue',
                    anchor: '100%',
                    defaults: {
                        labelStyle: "width:auto",
                        labelAlign: 'left'
                    },
                    items:[
                        {
                            xtype: 'displayfield',
                            fieldLabel: '服务号',
                            name:'serviceno',
                            value: this.data._id,
                            columnWidth: .33
                        },
                        {
                            xtype: 'displayfield',
                            fieldLabel: '当前月租(元)',
                            value: this.data.monthRent,
                            name: 'monthRent',
                            columnWidth: .33
                        },
                        {
                            xtype: 'displayfield',
//                            hideLabel:true,
                            fieldLabel: '赠送时长(分钟)',
                            value: this.data.dialMins,
                            name: 'dialMins',
                            id:'pay_dialMins',
                            columnWidth: .33
                        }
                    ]
                },
                {
                    xtype: 'hiddenfield',
                    name: 'flag',
                    value: 'snRenew'
                },
                {
                    xtype: 'hiddenfield',
                    name: 'serviceFlag',
                    value: this.data.flag
                },
                {
                    xtype: 'hiddenfield',
                    name: 'concurrent',
                    value: this.data.concurrent
                },
                {
                    xtype: 'hiddenfield',
                    name: 'callMinutes',
                    value: this.data.callMinutes
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: '续购时长',
                    value: "1",
                    name: 'month',
                    allowDecimals:false,
                    maxValue: 1000000,
                    minValue:1,
                    anchor: '50%',
                    listeners: {
                        change: function(field, value) {
                            value = parseInt(value, 10);
                            self.initMonth(this);
                        }
                    },
                    allowBlank: false
                },
                {
                    xtype: 'displayfield',
                    fieldLabel: '客户费用(元)',
                    name:'money',
                    value: '0',
                    anchor: '100%',
                    id:'pay_fee',
                    hidden:true
                },
                {
                    xtype: 'displayfield',
                    fieldLabel: '实际月租(元)',
                    name:'proxyMonthRent',
                    value: '0',
                    anchor: '100%',
                    value:gloab_client_user.monthRentPrice
                },
                {
                    xtype: 'displayfield',
                    fieldLabel: '实际费用(元)',
                    name:'billMoney',
                    value: '0',
                    anchor: '100%',
                    id:'bill_pay_fee'
                },
                {
                    xtype: 'displayfield',
                    fieldLabel: '我的余额(元)',
                    name:'balance',
                    value: '0',
                    anchor: '100%',
                    id:'pay_balance'
                }

            ]
        };
        items.push(fieldset);
        var buttons = {
            xtype: 'fieldset',
            layout: {
                type: 'hbox',
                pack: 'center',
                align: 'middle'
            },
            cls: 'no_border',
            items: [
                {
                    xtype: 'button',
                    width: 90,
                    id: 'sn_renew_month_button',
                    text: '支付'
                },
                {
                    xtype: 'button',
                    width: 90,
                    text: '关闭',
                    handler: function (obj) {
                        var win = obj.up('window');
                        win.close();
                    }
                }
            ]
        };
        items.push(buttons);
        return items;
    },
    getConcurrentItems: function () {
        var self=this;
        var items = new Array();
        var fieldset = {
            xtype: 'fieldset',
            title: '增加并发数',
            collapsible: true,
            layout: 'anchor',
            cls: 'backgroud_blue',
            defaultType: 'textfield',
            items: [
                {
                    xtype:'panel',
                    layout:"column",
                    border:false,
                    bodyCls:'backgroud_blue',
                    anchor: '100%',
                    defaults: {
                        labelStyle: "width:auto",
                        labelAlign: 'left'
                    },
                    items:[
                        {
                            xtype: 'displayfield',
                            fieldLabel: '服务号',
                            name:'serviceno',
                            value: this.data._id,
                            columnWidth: .33
                        },
                        {
                            xtype: 'displayfield',
                            fieldLabel: '当前月租(元)',
                            value: this.data.monthRent,
                            name: 'monthRent',
                            columnWidth: .33
                        },
                        {
                            xtype: 'displayfield',
//                            hideLabel:true,
                            fieldLabel: '赠送时长(分钟)',
                            value: this.data.dialMins,
                            name: 'dialMins',
                            id:'pay_dialMins_concurrent',
                            columnWidth: .33
                        }
                    ]
                },

                {
                    xtype: 'hiddenfield',
                    name: 'flag',
                    value: 'buyConcurrent'
                },
                {
                    xtype: 'hiddenfield',
                    name: 'serviceFlag',
                    value: this.data.flag
                },
                {
                    xtype: 'hiddenfield',
                    name: 'callMinutes',
                    value: this.data.callMinutes
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: '新增并发数',
                    value: "1",
                    name: 'concurrent',
                    allowDecimals:false,
                    maxValue: 1000000,
                    minValue:1,
                    anchor: '50%',
                    listeners: {
                        change: function(field, value) {
                            value = parseInt(value, 10);
                            self.initConcurrent(this);
                        }
                    },
                    allowBlank: false
                },

                {
                    xtype: 'displayfield',
                    fieldLabel: '客户费用(元)',
                    name:'money',
                    value: '0',
                    anchor: '100%',
                    id:'pay_fee_concurrent',
                    hidden:true
                },
                {
                    xtype: 'displayfield',
                    fieldLabel: '实际月租(元)',
                    name:'proxyMonthRent',
                    value: '0',
                    anchor: '100%',
                    value:gloab_client_user.monthRentPrice
                },
                {
                    xtype: 'displayfield',
                    fieldLabel: '实际费用(元)',
                    name:'billMoney',
                    value: '0',
                    anchor: '100%',
                    id:'bill_pay_fee_concurrent'
                },
                {
                    xtype: 'displayfield',
                    fieldLabel: '我的余额(元)',
                    name:'balance',
                    value: '0',
                    anchor: '100%',
                    id:'pay_balance_concurrent'
                }

            ]
        };
        items.push(fieldset);
        var buttons = {
            xtype: 'fieldset',
            layout: {
                type: 'hbox',
                pack: 'center',
                align: 'middle'
            },
            cls: 'no_border',
            items: [
                {
                    xtype: 'button',
                    width: 90,
                    id: 'sn_renew_concurrent_button',
                    text: '支付'
                },
                {
                    xtype: 'button',
                    width: 90,
                    text: '关闭',
                    handler: function (obj) {
                        var win = obj.up('window');
                        win.close();
                    }
                }
            ]
        };
        items.push(buttons);
        return items;
    },

    getDialItems: function () {
        var self=this;
        var items = new Array();
        var fieldset = {
            xtype: 'fieldset',
            title: '购买外呼时长',
            collapsible: true,
            layout: 'anchor',
            cls: 'backgroud_blue',
            defaultType: 'textfield',
            items: [
                {
                    xtype:'panel',
                    layout:"column",
                    border:false,
                    bodyCls:'backgroud_blue',
                    anchor: '100%',
                    defaults: {
                        labelStyle: "width:auto",
                        labelAlign: 'left'
                    },
                    items:[
                        {
                            xtype: 'displayfield',
                            fieldLabel: '服务号',
                            name:'serviceno',
                            value: this.data._id,
                            columnWidth: .33
                        },
                        {
                            xtype: 'displayfield',
                            fieldLabel: '当前月租(元)',
                            value: this.data.monthRent,
                            name: 'monthRent',
                            columnWidth: .33
                        },
                        {
                            xtype: 'displayfield',
//                            hideLabel:true,
                            fieldLabel: '赠送时长(分钟)',
                            value: this.data.dialMins,
                            name: 'dialMins',
                            id:'pay_dialMins_dial',
                            columnWidth: .33
                        }
                    ]
                },
                {
                    xtype: 'hiddenfield',
                    name: 'flag',
                    value: 'buyDialMin'
                },
                {
                    xtype: 'hiddenfield',
                    name: 'serviceFlag',
                    value: this.data.flag
                },
                {
                    xtype: 'hiddenfield',
                    name: 'callMinutes',
                    value: this.data.callMinutes
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: '充值金额(元)',
                    value: "",
                    name: 'money',
                    allowDecimals:false,
                    maxValue: 1000000,
                    minValue:1,
                    anchor: '50%',
                    listeners: {
                        change: function(field, value) {
                            value = parseInt(value, 10);
                            self.initDialMins(this);
                        }
                    },
                    allowBlank: false
                },
                {
                    xtype: 'displayfield',
                    fieldLabel: '折算分钟数',
                    name:'mins',
                    value: '0',
                    anchor: '100%',
                    id:'pay_fee_dial'
                },
                {
                    xtype: 'displayfield',
                    fieldLabel: '实际费用(元)',
                    name:'billMoney',
                    value: '0',
                    anchor: '100%',
                    id:'bill_pay_fee_dial'
                },
                {
                    xtype: 'displayfield',
                    fieldLabel: '我的余额(元)',
                    name:'balance',
                    value: '0',
                    anchor: '100%',
                    id:'pay_balance_dial'
                }

            ]
        };
        items.push(fieldset);
        var buttons = {
            xtype: 'fieldset',
            layout: {
                type: 'hbox',
                pack: 'center',
                align: 'middle'
            },
            cls: 'no_border',
            items: [
                {
                    xtype: 'button',
                    width: 90,
                    id: 'sn_renew_dial_button',
                    text: '支付'
                },
                {
                    xtype: 'button',
                    width: 90,
                    text: '关闭',
                    handler: function (obj) {
                        var win = obj.up('window');
                        win.close();
                    }
                }
            ]
        };
        items.push(buttons);
        return items;
    },
    calculateFee:function(data,init){
        var p1=parseFloat(data.monthRent);
        var rate=parseFloat(data.callMinutes)||0;
        var p3=parseInt(data.concurrent,10)||1;
        var p4=parseInt(data.month,10)||1;
        if(init){
            p4=1;
        }
        var billMonthRent=data.billMonthRent;
        var totalFee=Math.round(p1*p3*p4*100)/100;
        var dialMins=Math.round(totalFee*rate);
        var billMoney=Math.round(billMonthRent*p3*p4*100)/100;
        data.dialMins=dialMins;
        data.money=totalFee;
        data.billMoney=billMoney;
    },
    calculateConcurrentFee:function(data,init){
        var month=this.data.monthNum;
        var p1=parseFloat(data.monthRent);
        var p3=parseInt(data.concurrent,10)||0;
        var rate=parseFloat(data.callMinutes)||0;
        var billMonthRent=data.billMonthRent;
        if(init){
            p3=1;
        }
        var totalFee=Math.round(p1*p3*month*100)/100;
        var dialMins=Math.round(totalFee*rate);
        var billMoney=Math.round(billMonthRent*p3*month*100)/100;
        data.dialMins=dialMins;
        data.money=totalFee;
        data.month='';
        data.billMoney=billMoney;
    },
    calculateDialFee:function(data){
        var money=parseFloat(data.money)||0;
        var billSingle=data.billOutCallPrice;
        var single=data.accOutCallPrice;
        var mins=Math.round(money/single);
        var billMoney=Math.round(mins*billSingle*100)/100;

        data.mins=mins;
        data.billMoney=billMoney;
    },

    initMonth:function(src){
        var self=this;
        var fieldSet = src.up("fieldset");
        var data = App.util.AppUtil.getFormParam(fieldSet);
        this._setVal(data);
        self.calculateFee(data);
        self.down("#pay_dialMins").setValue(data.dialMins);
        self.down("#pay_fee").setValue(data.money);
        self.down("#bill_pay_fee").setValue(data.billMoney);
    },
    initConcurrent:function(src){
        var self=this;
        var fieldSet = src.up("fieldset");
        var data = App.util.AppUtil.getFormParam(fieldSet);
        this._setVal(data);
        self.calculateConcurrentFee(data);
        self.down("#pay_dialMins_concurrent").setValue(data.dialMins);
        self.down("#pay_fee_concurrent").setValue(data.money);
        self.down("#bill_pay_fee_concurrent").setValue(data.billMoney);
    },
    initDialMins:function(src){
        var self=this;
        var fieldSet = src.up("fieldset");
        var data = App.util.AppUtil.getFormParam(fieldSet);
        this._setVal(data);
        self.calculateDialFee(data);
        self.down("#pay_fee_dial").setValue(data.mins);
        self.down("#bill_pay_fee_dial").setValue(data.billMoney);
    },
    _setVal:function(data){
        data.billMonthRent=this.data.billMonthRent;
        data.billOutCallPrice=this.data.billOutCallPrice;
        data.accOutCallPrice=this.data.accOutCallPrice;
        data.accOutCallMinutes=this.data.accOutCallMinutes;
    }


});