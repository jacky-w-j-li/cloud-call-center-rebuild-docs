Ext.define('App.view.account.account.setAccount', {
    extend: 'Ext.window.Window',
    requires: ['App.model.account.ServiceFare','App.model.account.AccountSetLog'],
    alias: 'widget.accountSetWin',
    height: 550,
    width: 850,
    title: '账户设置',
    autoScroll: true,
    data: null,
    logStore: null,
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
                            id: 'account_serviceno_config_panel_new',
                            title: '服务号设置',
                            items: []
                        },
                        {
                            xtype: 'panel',
                            frame: true,
                            id: 'account_400_config_panel',
                            title: '400设置',
                            items: []
                        },
                        {
                            xtype: 'form',
                            frame: true,
                            id: 'account_overdraw__panel',
                            title: '透支设置',
                            items: this.getAccountOverdrawItems(),
                            hidden : App.util.AppUtil.hasLimit("account_set_overDraw")
                        },
                        {
                            xtype: 'panel',
                            frame: true,
                            id: 'account_alert_config_panel',
                            title: '预警设置',
                            items: this.getAccountAlertItems()
                        },
                        {
                            xtype: 'panel',
                            frame: true,
                            id: 'account_IDD_config_panel',
                            title: '国际长途',
                            items: this.getAccountIDDItems()
                        },
                        {
                            xtype: 'panel',
                            frame: true,
                            id: 'account_invoice_config_panel',
                            title: '发票设置',
                            items: this.getInvoiceSetItems(),
                            hidden : App.util.AppUtil.hasLimit("account_set_invoice")
                        }
                    ]
                }
            ]
        });
        me.callParent(arguments);
    },
    getPriceItems: function () {
        var self=this;
        var items = new Array();
        var fieldset = {
            xtype: 'fieldset',
            title: '资费设置',
            collapsible: true,
            layout: 'column',
            cls: 'backgroud_blue',
            defaultType: 'textfield',
            items: [
                {
                    name: '_id',
                    value: this.data.account._id,
                    hidden: true
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: '外呼单价(元/分钟)',
                    value: this.data.account.outCallPrice,
                    name: 'outCallPrice',
                    maxValue: 1000000,
                    columnWidth: .33,
                    minValue:gloab_client_user.price,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right'
                },
                {
                    id:'set_pay_off',
                    xtype:'checkboxfield',
                    boxLabel: '禁用客户在用户中心充值',
                    name: 'payFlag',
//                    inputValue: '1',
                    style: {
                        marginLeft: '50px'
                    },
                    columnWidth: 1,
                    checked:false
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
                    id: 'price_confirm_button',
                    text: '确认'
                },
                {
                    xtype: 'button',
                    width: 90,
                    id: 'viewlog_price_button',
                    text: '查看日志'
                }

            ]
        };
        items.push(buttons);
        return items;
    },
    isCheck:function(){
        if(this.data.account.payFlag){
            return true;
        }
        return false;
    },

    getAccountOverdrawItems : function(){
        var items = [];

        var fieldset = {
            xtype: 'fieldset',
            title: '账户透支设置',
            collapsible: true,
            layout: 'column',
            cls: 'backgroud_blue',
            defaultType: 'textfield',
            items : [
                {
                    xtype : 'textfield',
                    name: '_id',
                    value: this.data.account._id,
                    hidden: true
                },{

                    xtype: 'numberfield',
                    fieldLabel: '账户透支金额(元)',
                    value: this.data.account.overdraw,
                    name: 'overdraw',
                    minValue: 0,
                    columnWidth: .33,
                    msgTarget: 'side',
                    labelWidth: 100,
                    labelAlign: 'right'
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
                    id: 'over_confirm_button',
                    text: '确认'
                },
                {
                    xtype: 'button',
                    width: 90,
                    id: 'viewlog_over_button',
                    text: '查看日志'
                }

            ]
        }
        items.push(buttons);

        return items;

    },
    getAccountAlertItems: function () {
        var items = new Array();
        var fieldset = {
            xtype: 'fieldset',
            title: '通话预警设置',
            collapsible: true,
            layout: 'column',
            cls: 'backgroud_blue',
            defaultType: 'textfield',
            items: [
//                {
//                    name: 'outCallMinutes',
//                    value: this.data.account.outCallMinutes,
//                    fieldCls: 'field_disable_cls',
//                    readOnly : true,
//                    fieldLabel: '外呼分钟数',
//                    columnWidth: .33
//                },
                {
                    name: '_id',
                    value: this.data.account._id,
                    hidden: true
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: '账号余额预警值(元)',
                    value: this.data.account.dialAlert,
                    name: 'dialAlert',
                    minValue: 0,
                    columnWidth: .5,
                    msgTarget: 'side',
                    labelWidth: 200,
                    labelAlign: 'right'
                }
            ]
        }
        items.push(fieldset);
       /* var serviceNumSet = {
            xtype: 'fieldset',
            title: '服务号预警设置',
            collapsible: true,
            layout: 'column',
            cls: 'backgroud_blue',
            defaultType: 'textfield',
            items: [
                {xtype: 'numberfield',
                    fieldLabel: '服务号预警值(天)',
                    value: this.data.account.serviceNumAlert,
                    name: 'serviceNumAlert',
                    maxValue: 1000000,
                    columnWidth: .33,
                    msgTarget: 'side',
                    labelWidth: 100,
                    labelAlign: 'right'}
            ]
        }
        items.push(serviceNumSet);
        var num400Set = {
            xtype: 'fieldset',
            title: '400号预警设置',
            collapsible: true,
            layout: 'column',
            cls: 'backgroud_blue',
            defaultType: 'textfield',
            items: [
                {xtype: 'numberfield',
                    fieldLabel: '400号预警值(天)',
                    value: this.data.account.num400Alert,
                    name: 'num400Alert',
                    maxValue: 1000000,
                    columnWidth: .33,
                    msgTarget: 'side',
                    labelWidth: 100,
                    labelAlign: 'right'}
            ]
        }
        items.push(num400Set);*/
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
                    id: 'alert_confirm_button',
                    text: '确认'
                }
//                {
//                    xtype: 'button',
//                    width: 90,
//                    id: 'viewlog_alert_button',
//                    text: '查看日志'
//                }

            ]
        }
        items.push(buttons);
        return items;
    },
    getAccountIDDItems: function(){
        var items = new Array();
        var fieldset = {
            xtype: 'fieldset',
            title: '国际长途设置',
            collapsible: true,
            layout: 'column',
            cls: 'backgroud_blue',
            defaultType: 'textfield',
            items : [{
                name: '_id',
                value: this.data.account._id,
                hidden: true
            },{
                xtype: 'displayfield',
                id : "field_idd_config_status",
                fieldLabel: '国际长途状态',
                value: this.getIDDstatus(this.data.account.IDDstatus),
                msgTarget: 'side',
                labelWidth: 200,
                labelAlign: 'right'
            },{
                xtype: 'displayfield',
                name: 'IDDstatus',
                id : 'field_idd_config_status_value',
                value: this.getIDDvalue(this.data.account.IDDstatus),
                hidden: true
            }]
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
                    id: 'IDD_config_button',
                    text: this.getIDDoption(this.data.account.IDDstatus)
                }
            ]
        }
        items.push(buttons);
        return items;

    },
    getLogViewPanel: function (type) {
        var gridPanle = {
            xtype: 'gridpanel',
            title: '日志列表',
            class: 'query',
            forceFit: true,
            loadMask: true,
            store: this.getLogDataStore(type),
            columnLines: true,
            columns: [
                {
                    dataIndex: 'time',
                    width: 120,
                    align: 'center',
                    header: '时间'
                },
                {
                    dataIndex: 'user',
                    width: 70,
                    align: 'center',
                    renderer: this.userRender,
                    header: '操作人'
                },
                {
                    dataIndex: 'content',
                    header: '变更内容',
                    align: 'center',
                    width: 220
                }
            ],
            bbar: Ext.create('Ext.PagingToolbar', {
                store: this.getLogDataStore(type),
                displayInfo: true,
                displayMsg: '当前记录 {0} - {1} 共 {2}',
                emptyMsg: "没有记录可显示"
            })

        };

        var panel = Ext.create('Ext.form.Panel', {
            frame: true,
            class: 'query',
            title: '日志查看',
            dataType: type,
            fieldDefaults: {
                msgTarget: 'side',
                labelWidth: 90,
                labelAlign: 'right'
            },
            bodyStyle: 'padding:2px 2px 0',
            items: [
                {
                    xtype: 'fieldset',
                    title: '日志查询',
                    frame: true,
                    class: "query",
                    collapsible: true,
                    layout: 'column',
                    defaultType: 'textfield',
                    items: [
                        {
                            name : "type",
                            hidden: true,
                            value: type
                        },
                        {
                            name : "account",
                            value : this.data.account._id,
                            hidden : true
                        },
                        {
                            fieldLabel: '操作人',
                            name: 'user',
                            xtype: 'combobox',
                            store: App.util.AppUtil.getDicStore('systemUser'),
                            displayField: 'codeName',
                            valueField: 'codeValue',
                            typeAhead: true,
                            queryMode: 'local',
                            columnWidth: .33,
                            hidden:App.util.AppUtil.isHideWidget()
                        },
                        {
                            fieldLabel: '操作时间',
                            name: 'time',
                            xtype: 'datefield',
                            format: 'Y-m-d',
                            columnWidth: .33
                        }
                    ]
                },
                {
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
                            class: 'query',
                            width: 90,
                            text: '查询'
                        },
                        {
                            xtype: 'button',
                            class: 'reset',
                            width: 90,
                            text: '重置'
                        }

                    ]
                },
                gridPanle
            ]

        });
        return panel;
    },
    getInvoiceSetItems: function () {
        var items = new Array();
        var fieldset = {
            xtype: 'fieldset',
            title: '发票设置',
            collapsible: true,
            layout: 'column',
            cls: 'backgroud_blue',
            defaultType: 'textfield',
            items: [
                {
                    name: '_id',
                    value: this.data.account._id,
                    hidden: true
                },
                {
                    xtype:"checkbox",
                    boxLabel: '启用用户中心申请发票',
                    name: 'isInvoice',
                    id:'enable_cust_invoice',
                    checked:this.isInvoiceCheck()
                }

            ]
        }
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
                    id: 'btn_save_invoice_set',
                    text: '确认'
                }

            ]
        }
        items.push(buttons);
        return items;
    },

    isInvoiceCheck:function(){
        if(this.data.account.isInvoice){
            return true;
        }
        return false;
    },

    userRender: function (value) {
        return App.util.AppUtil.getRendererValue(value, 'systemUser');
    },
    getLogDataStore: function (type) {
        if (this.logStore == null) {
            var data = {};
            data.type = type;
            data.account = this.data.account._id;
            this.logStore = App.util.AppUtil.getGridStore("bill.account.queryAccountSetLog",data,"App.model.account.AccountSetLog");
            this.logStore.loadPage(1);
        }
        return this.logStore;
    },
    getIDDstatus : function(value){
        if(value && value === 'on'){
            return "<span color='green'>开通</span>";
        } else {
            return "<span color='red'>关闭</span>";
        }
    },
    getIDDoption : function(value){
        if(value && value === "on"){
            return "关闭国际长途";
        } else {
            return "开通国际长途";
        }
    },
    getIDDvalue : function(value){
        if(!value || value === "off"){
            return "on";
        } else {
            return "off";
        }
    }

});
