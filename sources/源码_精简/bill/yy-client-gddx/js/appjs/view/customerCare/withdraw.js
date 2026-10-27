Ext.define('App.view.customerCare.withdraw', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.withdrawQueryPanel',
    requires: ['App.model.system.SystemUser','App.model.system.WithDrawRecord'],
    layout: {
        type: 'anchor'
    },
    data:{},
    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            items: this.getMyBaseInfo()
        });
        me.callParent(arguments);
    },
    getMyBaseInfo: function () {
        var items = [];
        var myIncome = {
            xtype: 'fieldset',
            collapsible: true,
            title: '我的收入',
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
                    fieldLabel: '余额(元)',
                    id:'withdraw_balance',
                    value: App.util.AppUtil.formatTrueFee(this.data.balance||0),
                    columnWidth: .25
                },
                {
                    xtype: 'button',
                    width: 90,
                    id: 'withdraw_income_button',
                    text: '支取',
                    columnWidth: .08
                }
            ]
        };
        var panel={
            xtype: 'panel',
            frame: true,
            title: '',
            bodyStyle: 'padding:2px 2px 0',
            items:myIncome,
            style:{marginBottom:'10px'}
        }
        items.push(panel);
        return items;
    },
    getDataStore: function () {
        App.util.AppUtil.request('bill.systemUser.getMyInfo', {}, function (data, self) {
            if (data.success) {
                this.data=data.data;
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    }
});