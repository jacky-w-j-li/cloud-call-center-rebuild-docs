/**
 * Created by kivi on 2016/10/31.
 */
Ext.define('App.view.account.account.bindFinanceAccount', {
    extend: 'Ext.window.Window',
    alias: 'widget.bindFinanceAccountWin',
    width: 340,
    layout: {
        type: 'anchor'
    },
    modal: true,
    account: null,
    title: '绑定财务账户',
    initComponent: function() {
        var me = this;
        Ext.applyIf(me, {
            items: [
                {
                    xtype: 'form',
                    frame: true,
                    title: '',
                    bodyStyle: 'padding:2px 2px 0',
                    fieldDefaults: {
                        msgTarget: 'side',
                        labelWidth: 90,
                        labelAlign: 'right'
                    },
                    items: [
                        {
                            xtype: 'fieldset',
                            title: '绑定财务账户',
                            collapsible: true,
                            defaultType: 'textfield',
                            items: [
                                {
                                    name: "account",
                                    value: this.account,
                                    hidden: true
                                },
                                {
                                    name: "financeAccount",
                                    value: "",
                                    hidden: true
                                },
                                {
                                    fieldLabel: '财务账户名称',
                                    id : "finance_account_name",
                                    name: 'name',
                                    maxLength: 50,
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '公司名称',
                                    name : "companyName",
                                    cls :"field_disable_cls",
                                    readOnly : true,
                                    allowBlank: false
                                }
                            ]
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: '确认',
                    class: 'submit'
                },
                {
                    text: '关闭',
                    handler: function (obj) {
                        var win = obj.up('window');
                        win.close();
                    }
                }
            ]
        });
        me.callParent(arguments);
    }

});