Ext.define('App.view.cdr.showLineFee', {
    extend: 'Ext.window.Window',
    requires: [],
    alias: 'widget.showLineFeeWin',
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
                    fieldLabel: '创建时间',
                    value: this.data.createTime,
                    columnWidth: .33
                },
                {
                    fieldLabel: '线路名称',
                    value: this.showLineName(),
                    columnWidth: .33
                },
                {
                    fieldLabel: '通话数',
                    value:this.data.calls,
                    columnWidth: .33
                },
//                {
//                    fieldLabel: '支付方式',
//                    value: App.util.AppUtil.getRendererValue(this.data.payType,"payType"),
//                    columnWidth: .33
//                },
                {
                    fieldLabel: '成本',
                    value : this.showCost()+"元",
                    columnWidth: .33
                },
                {
                    fieldLabel: '利润',
                    value : this.showEarn()+"元",
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
    showLineName:function(){
        var val=parseFloat(this.data.line);
        val=App.util.AppUtil.getRendererValue(val, 'line');
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
    },
    showDeatil:function(){
        var row=this.data;
        var content='';
//        var serviceFlag= row.serviceFlag;
        content="共"+row.calls+"通电话,本地手机:" +row.localPhoneCalls+"通,长途手机:"+row.remotePhoneCalls+"通,本地固话:"
            +row.localTelCalls+"通,长途固话:"+row.remoteTelCalls+"通," +
        "美国/加拿大:"+row.mjCalls+"通,港/澳/台:"+row.gatCalls+"通,其他地区:"+row.otherCalls+"通;"
        +"本地手机:"+row.localPhoneMinutes+"分钟,长途手机:"+row.remotePhoneMinutes+"分钟,本地固话:"+
        row.localTelMinutes+"分钟,长途固话:"+row.remoteTelMinutes+"分钟," +
        "本地手机:"+row.localPhoneSecond6+"个6秒,长途手机:"+row.remotePhoneSecond6+"个6秒,本地固话:"+
        row.localTelSecond6+"个6秒,长途固话:"+row.remoteTelSecond6+"个6秒,"
        +"美国/加拿大:"+row.mjMinutes+"分钟,港/澳/台:"+row.gatMinutes+"分钟,其他地区:"+row.otherMinutes+"分钟";

        return content;
    }

});