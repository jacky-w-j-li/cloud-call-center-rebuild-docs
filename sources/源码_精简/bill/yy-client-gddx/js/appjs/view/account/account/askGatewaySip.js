Ext.define('App.view.account.account.askGatewaySip', {
    extend: 'Ext.window.Window',
    requires: [],
    alias: 'widget.askGatewaySipWin',
    width: 600,
    title: '申请网关sip号',
    autoScroll: true,
    data: null,
    accountId:null,
    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            modal: true,
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
                    items: this.getItems()
                }
            ]
        });
        me.callParent(arguments);
    },
    getItems: function () {
        var items = new Array();
        var fieldset = {
            xtype: 'fieldset',
            title: '申请信息',
            collapsible: true,
            layout: 'anchor',
            cls: 'backgroud_blue',
            defaultType: 'textfield',
            items: [
                {
                    name: 'account',
                    value:this.accountId,
                    hidden:true
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: '申请个数',
                    hideTrigger : true,//隐藏微调按钮
                    decimalPrecision : 2,//精确到小数点后两位
                    allowDecimals:false,//允许输入小数
                    nanText :'请输入有效的数字',//无效数字提示
                    minValue:1,
                    maxValue:100,
                    name: 'num',
                    allowBlank:false
                },
                {
                    xtype:'checkboxfield',
                    boxLabel: '是否需要接传真',
                    name: 'isFax',
//                    inputValue: '1',
                    anchor: '100%'
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
                    id: 'ask_gw_confirm_button',
                    text: '提交'
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