Ext.define('App.view.account.account.buyServiceNo', {
    extend: 'Ext.window.Window',
    requires: [''],
    alias: 'widget.buyServiceNoWin',
    height: 400,
    width: 600,
    title: '号码付款',
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
                            title: '号码付款',
                            items: [
//                                {
//                                    xtype: 'panel',
//                                    frame: true,
//                                    title: '',
//                                    bodyStyle: 'padding:2px;',
//                                    html:'<h3>号码:0105312222 月租:20元 赠送时长: 100</h3>'
//                                },

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
                                    items:this.getItems()
                                }
                            ]
                        }
                    ]
                }
            ]
        });
        me.callParent(arguments);
    },
    getItems: function () {
        var self=this;
        var items = new Array();
        var fieldset = {
            xtype: 'fieldset',
            title: '号码付款',
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
                    xtype: 'label',
                    id: 'pay_tips',
                    html: '<p>请您在8小时内完成支付，避免被他人抢注，还剩<strong class="lock_timer" style="color: red;"></strong></p>',
                    anchor: '100%'
                },

                {
                    xtype: 'hiddenfield',
                    name: 'flag',
                    value: 'buySn'
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
                    fieldLabel: '并发数',
                    value: "1",
                    name: 'concurrent',
                    allowDecimals:false,
                    maxValue: 1000000,
                    minValue:1,
                    anchor: '50%',
                    listeners: {
                        change: function(field, value) {
                            value = parseInt(value, 10);
                            self.initSnInfo();
                        }
                    },
                    allowBlank: false
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: '购买时长',
                    value: "1",
                    name: 'month',
                    allowDecimals:false,
                    maxValue: 1000000,
                    minValue:1,
                    anchor: '50%',
                    listeners: {
                        change: function(field, value) {
                            value = parseInt(value, 10);
                            self.initSnInfo();
                        }
                    },
                    allowBlank: false
                },

                {
                    xtype: 'displayfield',
                    fieldLabel: '客户费用(元)',
                    name:'money',
                    value: this.data.money,
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
                    value: this.data.billMoney,
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
                    id: 'sn_buy_button',
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
    calculateFee:function(data){
        var p1=parseFloat(data.monthRent);
        var rate=parseFloat(data.callMinutes)||0;
        var p3=parseInt(data.concurrent,10)||1;
        var p4=parseInt(data.month,10)||1;
        var billMonthRent=data.billMonthRent;
        var totalFee=Math.round(p1*p3*p4*100)/100;
        var dialMins=Math.round(totalFee*rate);
        var billMoney=Math.round(billMonthRent*p3*p4*100)/100;
        data.dialMins=dialMins;
        data.money=totalFee;
        data.billMoney=billMoney;
    },

    initSnInfo:function(){
        var self=this;
        var fieldSet = self.down("fieldset");
        var data = App.util.AppUtil.getFormParam(fieldSet);
        this._setVal(data);
        self.calculateFee(data);
        self.down("#pay_dialMins").setValue(data.dialMins);
        self.down("#pay_fee").setValue(data.money);
        self.down("#bill_pay_fee").setValue(data.billMoney);
    },
    _setVal:function(data){
        data.billMonthRent=this.data.billMonthRent;
        data.billOutCallPrice=this.data.billOutCallPrice;
        data.accOutCallPrice=this.data.accOutCallPrice;
        data.accOutCallMinutes=this.data.accOutCallMinutes;
    }

});