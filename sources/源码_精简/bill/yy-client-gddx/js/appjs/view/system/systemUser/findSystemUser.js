Ext.define('App.view.system.systemUser.findSystemUser', {
    extend: 'Ext.window.Window',
//    requires: ['App.model.resource.ServiceNum', 'App.model.resource.Num400'],
    alias: 'widget.findSystemUserWin',
    height: 500,
    width: 850,
    title: '用户查询',
    layout: 'fit',
    data: null,
    logStore: null,
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
                            title: '基本信息',
                            frame: true,
                            items: this.getUserBaseInfo()
                        }
                    ]
                }
            ]
        });
        me.callParent(arguments);
    },
    getUserBaseInfo: function () {
        var items = new Array();
        var userFeeFieldset = {
            xtype: 'fieldset',
            collapsible: true,
            title: '用户费用信息',
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
                    fieldLabel: '余额',
                    value: (this.data.balance/10000 || 0) + "元",
                    columnWidth: .33
                },
                {
                    fieldLabel: '透支额度',
                    value: (this.data.overdraw/10000 || 0) + "元",
                    columnWidth: .33
                }
//                {
//                    fieldLabel: '未支取',
//                    value: (Math.round(((this.data.totalFee - this.data.consume)/ 1000)*100)/100 || 0) + "元",
//                    columnWidth: .33
//                },
//                {
//                    fieldLabel: '外呼单价',
//                    value: (this.data.price || 0) + "元/分钟",
//                    columnWidth: .33
//                },
//                {
//                    fieldLabel: '月租',
//                    value: (this.data.monthRentPrice || 0) + "元",
//                    columnWidth: .33
//                }
            ]
        };
        items.push(userFeeFieldset);
        var userInfoFieldset = {
            xtype: 'fieldset',
            id: 'account_find_accountInfo',
            collapsible: true,
            title: '基本信息',
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
//                    fieldLabel: '账户编号',
//                    value: this.data.account._id,
//                    columnWidth: .33
//                },

                {
                    fieldLabel: '用户名称',
                    value: this.data.name,
                    columnWidth: .33
                },
                {
                    fieldLabel: '登录名',
                    value: this.data.loginName,
                    columnWidth: .33
                },
                {
                    fieldLabel: '身份',
                    value: App.util.AppUtil.getRendererValue(this.data.identity, 'userIdentity'),
                    columnWidth: .33
                },
                {
                    fieldLabel: '代理等级',
                    value: App.util.AppUtil.getRendererValue(this.data.proxyLevel, 'proxyLevel'),
                    columnWidth: .33
                },
                {
                    fieldLabel: '角色',
                    value: App.util.AppUtil.getRendererValueForArray(this.data.role, 'role'),
                    columnWidth: .33
                },
                {
                    fieldLabel: '联系人姓名',
                    value: this.data.linkManName,
                    columnWidth: .33
                },
                {
                    fieldLabel: '联系人电话',
                    value: this.data.linkManPhone,
                    columnWidth: .33
                },
                {
                    fieldLabel: '联系人邮箱',
                    value: this.data.linkManEmail,
                    columnWidth: .33
                },
                {
                    fieldLabel: '创建时间',
                    value: this.data.createTime,
                    columnWidth: .33
                },
                {
                    fieldLabel: '备注',
                    value: this.data.memo,
                    columnWidth: .33
                }
            ]

        }
        items.push(userInfoFieldset);
        return items;
    }

});