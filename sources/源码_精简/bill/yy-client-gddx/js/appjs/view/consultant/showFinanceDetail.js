Ext.define('App.view.consultant.showFinanceDetail', {
    extend: 'Ext.window.Window',
    requires: [],
    alias: 'widget.showConsultantFinanceDetailWin',
    height: 300,
    width: 750,
    title: '详情',
    layout: 'fit',
    data: null,
    initComponent: function () {
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
                readOnly: true
            },
            defaultType: 'displayfield',
            layout: {
                type: 'column'
            },
            items: [
                {
                    fieldLabel: '入账时间',
                    value: this.data.create_time,
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

                {
                    fieldLabel: '收支金额',
                    value : this.showIncome()+"元",
                    columnWidth: .33
                },
                {
                    fieldLabel: '账户余额',
                    value: (this.data.currentBalance/10000).toFixed(2)+"元",
                    columnWidth: .33,

                },
            ]

        }
        items.push(fieldSet);
        return items;
    },
    showSource:function(){
        var value=this.data.source;
        var desc= App.util.AppUtil.getRendererValue(value,"consultantSource");
        return desc;
    },
    showIncome:function(){
        var val=(this.data.income/10000).toFixed(2);
        if(this.data.source == 'payAccount'){
            val="<span style='color: green;'>"+val+"</span>";
        }else{
            val="<span style='color: red;'>-"+val+"</span>";
        }

        return  val;
    }

});