Ext.define('App.view.system.systemUser.withDraw', {
    extend: 'Ext.window.Window',
    requires: [],
    alias: 'widget.withDrawWin',
    width: 600,
    title: '收入支取',
    autoScroll: true,
    data: null,
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
            title: '支取信息',
            collapsible: true,
            layout: 'anchor',
            cls: 'backgroud_blue',
            defaultType: 'textfield',
            items: [
                {
                    name:'payeeId',
                    hidden:true
                },
                {
                    name:'maxMoney',
                    fieldLabel: '可支取金额(元)',
                    readOnly:true,
                    value:App.util.AppUtil.formatTrueFee((this.data.balance-(this.data.sum*10000))||0),
                    fieldCls: 'field_disable_cls'
                },
                {
                    xtype: 'displayfield',
                    fieldLabel: '',
                    name: '',
//                    cls:"withDraw_display",
//                    style:"color:red;",
                    value: '<span class="withDraw_display">建议金额达到500再支取，由于银行转账要收手续费，低于500的支取，将会扣除2元手续费！</span>'
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: '支取金额(元)',
                    hideTrigger : true,//隐藏微调按钮
                    decimalPrecision : 2,//精确到小数点后两位
                    allowDecimals:true,//允许输入小数
                    nanText :'请输入有效的数字，最多保留小数点后两位',//无效数字提示
                    minValue:1,
                    maxValue:App.util.AppUtil.formatTrueFee((this.data.balance-(this.data.sum*10000))||0),
                    name: 'money',
                    allowBlank:false
                },
                {
                    xtype:'panel',
                    layout:"column",
                    border:false,
                    bodyCls:'backgroud_blue',
                    anchor: '100%',
                    items:[
                        {
                            xtype:'textfield',
                            fieldLabel: '收款方户名',
                            name: 'cardName',
                            maxLength: 20,
                            maxLengthText: '最大长度不能超过20个字符！',
                            allowBlank: false,
                            columnWidth: .75,
                            id:'field_payee_cardName'
                        },
                        {
                            xtype: 'button',
                            width: 90,
                            id: 'show_payee_button',
                            text: '收款方信息查询',
                            columnWidth: .25
                        }
                    ]
                },
                {
                    xtype:'textfield',
                    fieldLabel: '收款方地址',
                    name: 'address',
                    maxLength: 100,
                    maxLengthText: '最大长度不能超过100个字符！',
                    allowBlank: false,
                    anchor: '100%'
                },
                {
                    xtype:'textfield',
                    fieldLabel: '收款方开户行',
                    name: 'bank',
                    maxLength: 100,
                    maxLengthText: '最大长度不能超过100个字符！',
                    allowBlank: false,
                    anchor: '100%'
                },
                {
                    fieldLabel: '收款方账号',
                    name: 'cardNo',
                    maxLength: 50,
                    maxLengthText: '最大长度不能超过50个字符！',
                    allowBlank: false,
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
                    id: 'withdraw_confirm_button',
                    text: '确认'
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