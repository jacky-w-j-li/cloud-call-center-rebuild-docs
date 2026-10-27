Ext.define('App.view.account.query.findCostRecord', {
    extend: 'Ext.window.Window',
    requires: [],
    alias: 'widget.findCostRecordWin',
    height: 300,
    width: 750,
    title: '代理消费查询',
    layout: 'fit',
    data: null,
    initComponent: function () {
        Ext.QuickTips.init();
        var me = this;
        Ext.applyIf(me, {
            modal: true,
            items: [
                {
                    xtype: 'tabpanel',
                    activeTab: 0,
                    deferredRender: false,
                    items: [
                        {
                            xtype: 'panel',
                            title: '详细信息',
                            frame: true,
                            items: this.getItems()
                        }
                    ]
                }
            ]
        });
        me.callParent(arguments);
    },
    getItems: function () {
        var items = new Array();
        var fieldSet = {
            xtype: 'fieldset',
            id: 'account_find_accountInfo',
            collapsible: true,
            title: '详细信息',
            cls: 'backgroud_blue',
            defaults: {
                msgTarget: 'side',
                labelWidth: 80,
                labelAlign: 'right',
                fieldCls: 'field_disable_cls',
                readOnly: true
            },
            defaultType: 'textfield',
            layout: {
                type: 'column'
            },
            items: [
                {
                    fieldLabel: '流水号',
                    value: this.data._id,
                    columnWidth: .33
                },

                {
                    fieldLabel: '账户编号',
                    value: this.data.account,
                    columnWidth: .33
                },
                {
                    fieldLabel: '所属代理',
                    value: App.util.AppUtil.getRendererValue(this.data.proxy, 'systemUser'),
                    columnWidth: .33,
                    hidden:App.util.AppUtil.isHideWidget()
                },
                {
                    fieldLabel: '用途',
                    value: App.util.AppUtil.getRendererValue(this.data.flag,"userPayType"),
                    columnWidth: .33
                },
//                {
//                    fieldLabel: '支付方式',
//                    value: App.util.AppUtil.getRendererValue(this.data.payType,"payType"),
//                    columnWidth: .33
//                },
                {
                    fieldLabel: '消费时间',
                    value: this.data.pay_time,
                    columnWidth: .33
                },
                {
                    fieldLabel: '充入账号金额(元)',
                    value: this.data.money,
                    columnWidth: .33
                },
//                {
//                    fieldLabel: '消费金额(元)',
//                    value: this.data.billFee,
//                    columnWidth: .33
//                },
                {
                    fieldLabel: '明细',
                    value: this.showDeatil(),
                    columnWidth: 0.99
                }
            ]

        }
        items.push(fieldSet);
        return items;
    },
    showDeatil:function(){
        var row=this.data;
        var sn=row.sn;
        var flag=row.flag;
        var totalFee=parseFloat(row.money);
        var content='';
        var serviceFlag= row.serviceFlag;
        if(serviceFlag=="400"){
            if(flag=='buySn'){
                content='购买号码'+row.sn.serviceno+",购买时长"+row.sn.month+"个月";
            }else if(flag=='snRenew'){
                content="续费号码"+row.sn.serviceno+",续费时长"+row.sn.month+"个月";
            }else if(flag=='buyDialMin'){
                content="购买外呼话费"+row.totalFee+"元";
            }
        }else{
            if(flag=='buySn'){
                content='购买号码'+row.sn.serviceno+",购买时长"+row.sn.month+"个月,并发数"+row.sn.concurrent+"个";
            }else if(flag=='snRenew'){
                content="续费号码"+row.sn.serviceno+",续费时长"+row.sn.month+"个月";
            }else if(flag=='buyConcurrent'){
                content="续费号码"+row.sn.serviceno+",新增并发数"+row.sn.concurrent+"个";
            }else if(flag=='buyDialMin'){
                content="购买外呼话费"+row.totalFee+"元";
            }
        }
//        if(flag=='buySn'){
//            content="购买时长"+sn.month+"个月,并发数"+sn.concurrent+"个,赠送外呼时长"+dialMins+"分钟";
//        }else if(flag=='snRenew'){
//            content="续费时长"+sn.month+"个月,赠送外呼时长"+dialMins+"分钟";
//        }else if(flag=='buyConcurrent'){
//            content="新增并发数"+sn.concurrent+"个,赠送外呼时长"+dialMins+"分钟";
//        }else if(flag=='buyDialMin'){
//            content="购买外呼时长"+(totalFee/outCallPrice)+"分钟";
//        }
        return content;
    }

});