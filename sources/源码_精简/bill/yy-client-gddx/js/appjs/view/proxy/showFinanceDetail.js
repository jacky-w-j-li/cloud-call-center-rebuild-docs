Ext.define('App.view.proxy.showFinanceDetail', {
    extend: 'Ext.window.Window',
    requires: [],
    alias: 'widget.showFinanceDetailWin',
    height: 300,
    width: 750,
    title: '详情',
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
//                fieldCls: 'field_disable_cls',
                readOnly: true
            },
            defaultType: 'displayfield',
            layout: {
                type: 'column'
            },
            items: [
                {
                    fieldLabel: '入账时间',
                    value: this.data.pay_time,
                    columnWidth: .33
                },
                {
                    fieldLabel: '流水号',
                    value: this.data._id,
                    columnWidth: .33
                },

                {
                    fieldLabel: '客户编号',
                    value: this.data.account,
                    columnWidth: .33
                },
                {
                    fieldLabel: '资金来源',
                    value:this.showSource(),
                    columnWidth: .33
                },
//                {
//                    fieldLabel: '支付方式',
//                    value: App.util.AppUtil.getRendererValue(this.data.payType,"payType"),
//                    columnWidth: .33
//                },

                {
                    fieldLabel: '收支金额',
                    value : this.showIncome()+"元",
                    columnWidth: .33
                },
                {
                    fieldLabel: '账户余额',
                    value: this.data.currentBalance+"元",
                    columnWidth: .33
                },
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
    showSource:function(){
        var _row=this.data;
        var value=this.data.source;
        var desc= App.util.AppUtil.getRendererValue(value,"proxySource");
        if(value=='payCallFee'|| value=='payCall400Fee'||value=='paySmsFee'){
            var date=_row.pay_time;
            date=date.split(" ")[0];
            desc=date+" "+desc;
        }else if(value=='buyDialMin'){
            desc="充值外呼话费(已废弃)";
//        }else if(value=='systemAdjust'){
//            desc="系统冲账";
        }
        return desc;
    },
    showIncome:function(){
        var _row=this.data;
        var val=parseFloat(this.data.income);
        if(_row.source=='payAccount'|| _row.source=='proxyWithDraw'|| _row.source=='revocationMinConsume'){
            val="<span style='color: red;'>-"+val+"</span>";
        }else{
            if(val>0){
                val="<span style='color: green;'>+"+val+"</span>";
            }else{
                val="<span style='color: green;'>"+val+"</span>";
            }
        }
        return  val;
    },
    showDeatil:function(){
        var row=this.data;
        var source=row.source;
        var flag=row.flag;
        var content='';
        var _sn=row.sn;
//        var serviceFlag= row.serviceFlag;
        if(source=='pay'){
            content="充值我的账户"+row.income+"元";
        }else if(source=='payAccount'){
            content="给我的客户"+row.accountName+"充值"+row.income+"元";
        }else if(source=='proxyWithDraw'){
            content="取现"+row.income+"元";
        }else if(source=='oweFee'){
            if(flag=='payCallZJMin'){
                content="自动扣费低消欠费，客户充值后返还剩余的收入"+row.income+"元";
            }else if(flag=='monthRent'){
                content="自动扣费月租欠费，客户充值后返还剩余的收入"+row.income+"元";
            }
            if(row.incomeId){
                content+=",关联的流水号"+row.incomeId;
            }
        }else if(source=='paySmsFee'){
            content="共"+_sn.num+"条短信,折扣金额"+(row.discount||0)+"元";
        }else if(source=='payCallFee'){
            content="共"+row.sn.calls+"通电话,本地固话"+row.sn.localTelMinutes+"分钟,本地手机"+row.sn.localPhoneMinutes+"分钟,长途固话"+row.sn.remoteTelMinutes+"分钟,长途手机"+row.sn.remotePhoneMinutes+"分钟,折扣金额"+(row.discount||0)+"元";
        }else if(source=='payCall400Fee'){
            content="400号为"+row.sn.serviceno+"共"+row.sn.calls+"通电话,本地通话"+row.sn.localMinutes+"分钟,长途通话"+row.sn.remoteMinutes+"分钟,折扣金额"+(row.discount||0)+"元";
        }else if(source=='payCallMin'){
            if(flag=='payCall400Min'){
                content="400号为"+_sn.serviceno+"共"+_sn.calls+"通电话,本地通话"+_sn.localMinutes+"分钟,长途通话"+_sn.remoteMinutes+"分钟,低消"+_sn.minConsume+"元,实际消费"+_sn.actualConsume+"元";
                if(_sn.oweMin){
                    content+=",客户账号低消欠"+_sn.oweMin+"元";
                }
            }else if(flag=='payCallZJMin'){
                content="总机低消收入,共"+_sn.calls+"通电话,本地通话"+_sn.localMinutes+"分钟,长途通话"+_sn.remoteMinutes+"分钟,低消"+_sn.minConsume+"元,实际消费"+_sn.actualConsume+"元";
                if(_sn.oweMin){
                    content+=",客户账号低消欠"+_sn.oweMin+"元";
                }
            }else if(flag=='payCallCCMin'){
                content="呼叫中心低消收入,共"+_sn.calls+"通电话,本地通话"+_sn.localMinutes+"分钟,长途通话"+_sn.remoteMinutes+"分钟,低消"+_sn.minConsume+"元,实际消费"+_sn.actualConsume+"元";
                if(_sn.oweMin){
                    content+=",客户低消欠"+_sn.oweMin+"元";
                }
            }

        }else if(source=='systemPay'){
//            content="用于系统计费方式变更，对历史数据的处理，话费收入由之前一次性返还后再扣变更为每天晚上返还前一天的收入";
            content=row.memo||"";
        }else if(source=='backoutPay'){
            content="撤销给我的客户"+row.accountName+"充值的"+row.income+"元";
        }else{
            if(flag=='buySn'){
                if(_sn.leaveDay){
                    content='购买号码'+_sn.serviceno+",购买时长"+_sn.leaveDay+"天,并发数"+_sn.concurrent+"个";
                }else{
                    content='购买号码'+_sn.serviceno+",购买时长"+_sn.month+"个月,并发数"+_sn.concurrent+"个";
                }
            }else if(flag=='snRenew'){
                if(_sn.leaveDay){
                    content="启用号码"+_sn.serviceno+",续费时长"+_sn.leaveDay+"天";
                }else{
                    content="续费号码"+_sn.serviceno+",续费时长"+_sn.month+"个月";
                }
            }else if(flag=='buyConcurrent'){
                content="续费号码"+row.sn.serviceno+",新增并发数"+row.sn.concurrent+"个";
            }else if(flag=='buyLicence'){
                content="购买"+App.util.AppUtil.getRendererValue(row.sn.licenceType,"licenceType")+",时长"+row.sn.month+"个月,licence数"+row.sn.num+"个";
            }else if(flag=='renewLicence'){
                content="续费"+App.util.AppUtil.getRendererValue(row.sn.licenceType,"licenceType")+",续费时长"+row.sn.month+"个月";
            }else if(flag=='buyDialMin'){
                content="购买外呼话费"+row.totalFee+"元(该来源已废弃，话费现在按天返还)";
            }else if(flag=='deductMonthRent'){
                content="扣除号码"+_sn.serviceno+"月租";
                if(_sn.oweMin){
                    content+=",客户月租欠"+_sn.oweMin+"元";
                }
            }
        }
        return content;
    }

});