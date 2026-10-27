Ext.define('App.view.cdr.showLineDetail', {
    extend: 'Ext.window.Window',
    requires: [],
    alias: 'widget.showLineDetailWin',
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
                    fieldLabel: '开始时间',
                    value: this.data.beginTimeDisplay,
                    columnWidth: .33
                },
                {
                    fieldLabel: '结束时间',
                    value: this.data.endTimeDisplay,
                    columnWidth: .33
                },
                {
                    fieldLabel: '客户编号',
                    value: this.data.account,
                    columnWidth: .33
                },
                {
                    fieldLabel: '线路名称',
                    value: this.showLineName(),
                    columnWidth: .33
                },
                {
                    fieldLabel: '产品类型',
                    value : this.showProduct(),
                    columnWidth: .33
                },
                {
                    fieldLabel: '主叫地',
                    value: this.data.callerProvince+"-"+this.data.callerCity,
                    columnWidth: .33
                },
                {
                    fieldLabel: '被叫地',
                    value:this.data.calleeProvince+"-"+this.data.calleeCity,
                    columnWidth: .33
                },
                {
                    fieldLabel: '主叫号码',
                    value:this.data.cid,
                    columnWidth: .33
                },
                {
                    fieldLabel: '被叫号码',
                    value:this.data.did,
                    columnWidth: .33
                },
                {
                    fieldLabel: '呼叫类型',
                    value : this.showType(),
                    columnWidth: .33
                },
                {
                    fieldLabel: '通信类型',
                    value : this.showIsLocal(),
                    columnWidth: .33
                },
                {
                    fieldLabel: '国际长途',
                    value : this.showIsIntl(),
                    columnWidth: .33
                },
                {
                    fieldLabel: '计费策略',
                    value : this.showFeeStrategy(),
                    columnWidth: .33
                },
                {
                    fieldLabel: '时长',
                    value : this.data.minutes+"分钟",
                    columnWidth: .33
                },
                {
                    fieldLabel: '时长',
                    value : this.data.seconds+"秒",
                    columnWidth: .33
                },
                {
                    fieldLabel: '时长',
                    value : this.data.seconds6+"个6秒",
                    columnWidth: .33
                },
                {
                    fieldLabel: '客户消费',
                    value : this.showConsume()+"元",
                    columnWidth: .33
                },
                {
                    fieldLabel: '折扣',
                    value : this.showDiscount()+"元",
                    columnWidth: .33
                },
                {
                    fieldLabel: '代理收入',
                    value : this.showIncome()+"元",
                    columnWidth: .33
                },
                {
                    fieldLabel: '成本',
                    value : this.showCost()+"元",
                    columnWidth: .33
                },
                {
                    fieldLabel: '利润',
                    value : this.showEarn()+"元",
                    columnWidth: .33
                }
            ]

        }
        items.push(fieldSet);
        return items;
    },
    showProduct:function(){
        var value=this.data.product;
        var desc="";
        if(value==="cc"){
            desc='呼叫中心';
        }else{
            desc='企业总机';
        }
        return  desc;
    },
    showType:function(){
        var value=this.data.type;
        return App.util.AppUtil.getRendererValue(value,"callTypeCC");
    },
    showLineName:function(){
        var val=parseFloat(this.data.line);
        val=App.util.AppUtil.getRendererValue(val, 'line');
        return  val;
    },
    showIsLocal:function(){
        var value=this.data.isLocal||"false";
        var desc="";
        if(value==="false"){
            desc='长途';
        }else{
            desc='本地' ;
        }
        return  desc;
    },
    showIsIntl:function(){
        var value=this.data.isIntl||"false";
        var desc="";
        if(value==="false"){
            desc='否';
        }else{
            desc='是' ;
        }
        return  desc;
    },
    showFeeStrategy:function(){
        var value=this.data.feeStrategy;
        var desc="";
        if(value==="minute"){
            desc='分钟';
        }else{
            desc='6秒';
        }
        return  desc;
    },
    showConsume:function(){
        var val=parseFloat(this.data.consume);
        val=App.util.AppUtil.formatTrueFee(val);
        return  val;
    },
    showDiscount:function(){
        var val=parseFloat(this.data.discount);
        val=App.util.AppUtil.formatTrueFee(val);
        return  val;
    },
    showIncome:function(){
        var val=parseFloat(this.data.income);
        val=App.util.AppUtil.formatTrueFee(val);
        return  val;
    },
    showCost:function(){
        var val=parseFloat(this.data.cost);
        val=App.util.AppUtil.formatTrueFee(val);
        return  val;
    },
    showEarn:function(){
        var val=parseFloat(this.data.earn);
        val=App.util.AppUtil.formatTrueFee(val);
        if(val>0){
            val="<span style='color: green;'>"+val+"</span>";
        }else{
            val="<span style='color: red;'>"+val+"</span>";
        }
        return  val;
    }

});