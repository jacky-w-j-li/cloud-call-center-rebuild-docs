Ext.define('App.view.system.systemUser.findWithdraw', {
    extend: 'Ext.window.Window',
    requires: [],
    alias: 'widget.findWithdrawWin',
    height: 500,
    width: 850,
    title: '用户查询',
    layout: 'fit',
    withdraw: null,
    payee:null,
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
        var fieldset = {
            xtype: 'fieldset',
            id: 'systemuser_find_withdraw',
            collapsible: true,
            title: '信息',
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
                    value: this.withdraw._id,
                    columnWidth: .33
                },

                {
                    fieldLabel: '代理用户',
                    value: App.util.AppUtil.getRendererValue(this.withdraw.uid, 'systemUser'),
                    columnWidth: .33
                },
                {
                    fieldLabel: '日期',
                    value: this.withdraw.time,
                    columnWidth: .33
                },

                {
                    fieldLabel: '金额(元)',
                    value: this.withdraw.money,
                    columnWidth: .33
                },
                {
                    fieldLabel: '手续费(元)',
                    value: this.withdraw.procedureFee||0,
                    columnWidth: .33
                },
                {
                    fieldLabel: '状态',
                    value: App.util.AppUtil.getRendererValue(this.withdraw.status, 'withdrawStatus'),
                    columnWidth: .33
                },
                {
                    fieldLabel: '收款方户名',
                    value: this.payee.cardName,
                    columnWidth: .33
                },
                {
                    fieldLabel: '收款方地址',
                    value: this.payee.address,
                    columnWidth: .33
                },
                {
                    fieldLabel: '收款方开户行',
                    value: this.payee.bank,
                    columnWidth: .33
                },
                {
                    fieldLabel: '收款方账号',
                    value: this.payee.cardNo,
                    columnWidth: .33
                }

            ]

        }
        items.push(fieldset);
        return items;
    }

});