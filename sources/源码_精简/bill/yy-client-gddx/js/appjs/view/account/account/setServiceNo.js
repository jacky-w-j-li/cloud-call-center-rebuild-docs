Ext.define('App.view.account.account.setServiceNo', {
    extend: 'Ext.window.Window',
    requires: ['App.model.account.AccountSetLog'],
    alias: 'widget.setServiceNoWin',
    height: 600,
    width: 850,
    title: '月租设置',
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
                            title: '月租设置',
                            id: 'account_serviceno_set_panel',
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
        var items = new Array();
        var fieldset = {
            xtype: 'fieldset',
            title: '月租设置',
            collapsible: true,
            layout: 'column',
            cls: 'backgroud_blue',
            defaultType: 'textfield',
            items: [
                {
                    xtype: 'displayfield',
                    fieldLabel: '服务号',
                    name:'_id',
                    value: this.data._id,
                    columnWidth: .5
                },
                {
                    xtype: 'displayfield',
                    fieldLabel: '当前月租(元)',
                    value: this.data.monthRent,
                    name: 'monthRent',
                    columnWidth: .5,
                    minValue:0
                },
                {
                    fieldLabel: '号码类型',
                    name: 'flag',
                    value:this.data.flag,
                    xtype: 'combobox',
                    editable: false,
                    store: App.util.AppUtil.getDicStore('serviceNumFlag'),
                    displayField: 'codeName',
                    valueField: 'codeValue',
                    typeAhead: true,
                    queryMode: 'local',
                    columnWidth: .5,
                    allowBlank: false,
                    style:{
                        marginRight:'150px'
                    }
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: '新月租(元)',
                    name: 'newMonthRent',
                    columnWidth: .3,
                    minValue:gloab_client_user.monthRentPrice,
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
                    id: 'setServiceNo_button',
                    text: '确认'
                },
                {
                    xtype: 'button',
                    width: 90,
                    id: 'reselect_ServiceNo_button',
                    text: '重新选择号码',
                    hidden:true
                },
                {
                    xtype: 'button',
                    width: 90,
                    id: 'viewlog_sn_button',
                    text: '查看日志'
                }

            ]
        };
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
                            value : this.data.account,
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
    userRender: function (value) {
        return App.util.AppUtil.getRendererValue(value, 'systemUser');
    },
    getLogDataStore: function (type) {
        if (this.logStore == null) {
            var data = {};
            data.type = type;
            data.account = this.data.account;
            this.logStore = App.util.AppUtil.getGridStore("bill.account.querySnSetLog",data,"App.model.account.AccountSetLog");
            this.logStore.loadPage(1);
        }
        return this.logStore;
    }
});