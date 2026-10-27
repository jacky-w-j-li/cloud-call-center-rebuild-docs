Ext.define('App.view.system.systemUser.pay', {
    extend: 'Ext.window.Window',
    requires: [''],
    alias: 'widget.payWin',
    width: 450,
    title: '账号充值',
    autoScroll: true,
    user:null,
    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            modal: true,
            items: [
                {
                    xtype: 'tabpanel',
                    activeTab: 0,
                    items: [
                        {
                            xtype: 'panel',
                            frame: true,
                            title: '账号充值',
                            items: [
                                {
                                    xtype: 'form',
                                    frame: true,
                                    title: '',
                                    bodyStyle: 'padding:2px 2px 0',
                                    fieldDefaults: {
                                        msgTarget: 'side',
                                        labelWidth: 100,
                                        labelAlign: 'right'
                                    },
                                    items:this.getItems()
                                }
                            ]
                        }
                    ]
                }
            ]
        });
        me.callParent(arguments);
    },
    getItems: function () {
        var self=this;
        var items = new Array();
        var fieldset = {
            xtype: 'fieldset',
            title: '账号充值',
            collapsible: true,
            layout: 'anchor',
            cls: 'backgroud_blue',
            defaultType: 'textfield',
            items: [
                {
                    xtype: 'hiddenfield',
                    name: 'flag',
                    value: 'pay'
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: '充值金额(元)',
                    value: "",
                    name: 'money',
                    allowDecimals:true,
                    maxValue: 1000000,
                    minValue:0.01,
                    anchor: '80%',
                    allowBlank: false
                },
                {
                    fieldLabel: '支付方式',
                    xtype: 'combobox',
                    name: 'bank',
                    editable: false,
                    store: App.util.AppUtil.getDicStore('payBank'),
                    displayField: 'codeName',
                    valueField: 'codeValue',
                    anchor: '80%',
                    allowBlank: false
                }

            ]
        };
        items.push(fieldset);
        var buttons = {
            xtype: 'fieldset',
            layout: {
                type: 'hbox',
                pack: 'center',
                align: 'middle'
            },
            cls: 'no_border',
            items: [
                {
                    xtype: 'button',
                    width: 90,
                    id: 'sn_pay_button',
                    text: '确认支付'
                },
                {
                    xtype: 'button',
                    width: 90,
                    text: '关闭',
                    handler: function (obj) {
                        var win = obj.up('window');
                        win.close();
                    }
                }
            ]
        };
        items.push(buttons);
        return items;
    }



});