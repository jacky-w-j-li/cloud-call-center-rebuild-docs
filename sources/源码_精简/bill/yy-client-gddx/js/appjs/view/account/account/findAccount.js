Ext.define('App.view.account.account.findAccount', {
    extend: 'Ext.window.Window',
    requires: ['App.model.resource.ServiceNum', 'App.model.resource.Num400'],
    alias: 'widget.findAccountWin',
    height: 500,
    width: 850,
    title: '账户查询',
    layout: 'fit',
    data: null,
    logStore: null,
    serviceNumStore: null,
    num400Store: null,
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
                            items: this.getAccountBaseInfo()
                        }
                    ]
                }
            ]
        });
        me.callParent(arguments);
    },
    getAccountBaseInfo: function () {
        var items = new Array();
        var accountBalanceFieldset = {
            xtype: 'fieldset',
            collapsible: true,
            title: '账户费用信息',
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
                    fieldLabel: '账户余额',
                    value: this.data.account.balance.toFixed(2) + "元",
                    columnWidth: .33
                }
                ,
                {
                    fieldLabel: '透支',
                    value: (this.data.account.overdraw || 0) + "元",
                    columnWidth: .33
                }
            ]
        };
        items.push(accountBalanceFieldset);
        var accountInfoFieldset = {
            xtype: 'fieldset',
            id: 'account_find_accountInfo',
            collapsible: true,
            title: '账户基本信息',
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
                    fieldLabel: '账户编号',
                    value: this.data.account._id,
                    columnWidth: .33
                },
                {
                    fieldLabel: '账户名称',
                    value: this.data.account.name,
                    columnWidth: .33
                },
                {
                    fieldLabel: '账户密码',
                    value: this.data.account.managerPassword,
                    columnWidth: .33
                },
                {
                    fieldLabel: '公司名称',
                    value: this.data.account.companyName,
                    columnWidth: .33
                },
                {
                    fieldLabel: '状态',
                    value: App.util.AppUtil.getRendererValue(this.data.account.status, 'accountStatus'),
                    columnWidth: .33
                },
                {
                    fieldLabel: '创建日期',
                    value: this.data.account.createTime,
                    columnWidth: .33
                },
                {
                    fieldLabel: '联系人姓名',
                    value: this.data.account.linkManName,
                    columnWidth: .33
                },
                {
                    fieldLabel: '联系人电话',
                    value: this.data.account.linkManPhone,
                    columnWidth: .33
                },
                {
                    fieldLabel: '联系人邮箱',
                    value: this.data.account.linkManEmail,
                    columnWidth: .33
                },
                {
                    fieldLabel: '客户经理',
                    value: App.util.AppUtil.getRendererValue(this.data.account.customerCare, 'systemUser'),
                    columnWidth: .33
                },
                {
                    fieldLabel: '技术顾问',
                    value: App.util.AppUtil.getRendererValue(this.data.account.consultant, 'systemUser'),
                    columnWidth: .33
                },
                {
                    fieldLabel: '财务账户',
                    value: this.data.account.financeAccountName,
                    columnWidth: .33
                },
                {
                    fieldLabel: '备注',
                    value: this.data.account.memo,
                    columnWidth: .5
                },
                {
                    fieldLabel: '停用原因',
                    value: this.data.account.stopReason,
                    columnWidth: .5
                }
//                ,
//                {
//                    fieldLabel: '所分配PBX',
//                    value: this.data.account.pbx[0].pbx,
//                    columnWidth: .33
//                }
            ]

        }
        items.push(accountInfoFieldset);
        var accountInfoPanel = {
            xtype: 'tabpanel',
            activeTab: 0,
            deferredRender: false,
            items: [
                {
                    xtype: 'panel',
                    title: '服务号',
                    autoScroll: true,
                    frame: true,
                    items: [
                        {
                            xtype: 'grid',
                            forceFit: true,
                            columnLines: true,
                            margin: '0 0 10 0',
                            columnWidth: .99,
                            store: this.getAccountServiceNumStore(),
                            columns: [
                                {
                                    header: '服务号',
                                    dataIndex: '_id',
                                    align: 'center'
                                },
                                {
                                    header: '并发',
                                    dataIndex: 'concurrent',
                                    align: 'center'
                                },
                                {
                                    header: '月租',
                                    dataIndex: 'monthRent',
                                    align: 'center',
                                    renderer: function(value){
                                        return App.util.AppUtil.formatTrueFee(value);
                                    }
                                },
                                {
                                    header: '租用时间',
                                    align: 'center',
                                    dataIndex: 'beginTime'
                                },
                                {
                                    header: '到期时间',
                                    align: 'center',
                                    dataIndex: 'endTime'
                                }

                            ]
                        }
                    ]
                },
                {
                    xtype: 'panel',
                    title: '400号',
                    autoScroll: true,
                    frame: true,
                    items: [
                        {
                            xtype: 'grid',
                            forceFit: true,
                            columnLines: true,
                            margin: '0 0 10 0',
                            columnWidth: .99,
                            store: this.getAccountNum400Store(),
                            columns: [
                                {
                                    header: '400号',
                                    dataIndex: '_id',
                                    align: 'center'
                                },
                                {
                                    header: '月租',
                                    dataIndex: 'monthRent',
                                    align: 'center',
                                    renderer: function(value){
                                        return App.util.AppUtil.formatTrueFee(value);
                                    }
                                },
                                {
                                    header: '租用时间',
                                    align: 'center',
                                    dataIndex: 'startTime'
                                },
                                {
                                    header: '到期时间',
                                    align: 'center',
                                    dataIndex: 'endTime'
                                }

                            ]
                        }
                    ]
                }
            ]
        }
        items.push(accountInfoPanel);
        return items;
    },
    getAccountServiceNumStore: function () {
        if (!this.serviceNumStore) {
            this.serviceNumStore = Ext.create('Ext.data.Store', {
                model: 'App.model.resource.ServiceNum',
                data: this.data.serviceNum
            });
        }
        return this.serviceNumStore;
    },
    getAccountNum400Store: function () {
        if (!this.num400Store) {
            this.num400Store = Ext.create('Ext.data.Store', {
                model: 'App.model.resource.Num400',
                data: this.data.num400
            });
        }
        return this.num400Store;
    }
});
