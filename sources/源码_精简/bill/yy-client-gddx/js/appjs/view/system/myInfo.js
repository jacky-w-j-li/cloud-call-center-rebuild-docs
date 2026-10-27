Ext.define('App.view.system.myInfo', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.myInfoQueryPanel',
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
//                {
//                    fieldLabel: '总收入(元)',
//                    id:'myinfo_totalFee',
//                    value: (this.data.totalFee/1000 || 0),
//                    columnWidth: .33
//                },
//                {
//                    fieldLabel: '已支取(元)',
//                    id:'myinfo_consume',
//                    value: (this.data.consume/1000 || 0) ,
//                    columnWidth: .33
//                },
                {
                    fieldLabel: '余额(元)',
                    id:'myinfo_balance',
                    value: App.util.AppUtil.formatTrueFee(this.data.balance||0),
                    columnWidth: .25
                },
                {
                    xtype: 'button',
                    width: 90,
                    id: 'take_income_button',
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
//        var myBaseInfo = {
//            xtype: 'fieldset',
//            id: 'account_find_systemUserInfo',
//            collapsible: true,
//            title: '账户基本信息',
//            cls: 'backgroud_blue',
//            defaults: {
//                msgTarget: 'side',
//                labelWidth: 80,
//                labelAlign: 'right',
//                fieldCls: 'field_disable_cls',
//                readOnly: true
//            },
//            defaultType: 'textfield',
//            layout: {
//                type: 'column'
//            },
//            items: [
//                {
//                    fieldLabel: '用户名称',
//                    value: this.data.name,
//                    columnWidth: .33
//                },
//                {
//                    fieldLabel: '外呼单价',
//                    value: (this.data.price || 0) + "元/分钟",
//                    columnWidth: .33
//                },
//                {
//                    fieldLabel: '月租返利',
//                    value: (this.data.monthRentPrice || 0) + "元",
//                    columnWidth: .33
//                },
//                {
//                    fieldLabel: '登录名',
//                    value: this.data.loginName,
//                    columnWidth: .33
//                },
//                {
//                    fieldLabel: '身份',
//                    value: App.util.AppUtil.getRendererValue(this.data.identity, 'userIdentity'),
//                    columnWidth: .33
//                },
//                {
//                    fieldLabel: '创建时间',
//                    value: this.data.createTime,
//                    columnWidth: .33
//                },
//                {
//                    fieldLabel: '联系人姓名',
//                    value: this.data.linkManName,
//                    columnWidth: .33
//                },
//                {
//                    fieldLabel: '联系人电话',
//                    value: this.data.linkManPhone,
//                    columnWidth: .33
//                },
//                {
//                    fieldLabel: '联系人邮箱',
//                    value: this.data.linkManEmail,
//                    columnWidth: .33
//                },
//                {
//                    xtype:'textarea',
//                    fieldLabel: '备注',
//                    value: this.data.memo,
//                    columnWidth: .80
//                }
//
//            ]
//        }
//        items.push(myBaseInfo);
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