Ext.define('App.view.account.account.smsSign', {
    extend: 'Ext.window.Window',
    requires: ['App.model.account.SmsSign','App.model.account.SmsTemplete'],
    alias: 'widget.smsSignWin',
    height: 500,
    width: 800,
    title: '短信签名',
    autoScroll: true,
    account: null,
    data: {},
    store: null,
    templeteStore : null,
    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            modal: true,
            items: [{
                xtype: 'tabpanel',
                activeTab: 0,
                items: [
                    {
                        xtype: 'panel',
                        frame: true,
                        id: 'account_sms_sign_config_panel',
                        title: '签名',
                        items: this.getSignItems()
                    }, {
                        xtype: 'panel',
                        frame: true,
                        id: 'account_sms_templete_config_panel',
                        title: '模板',
                        items: this.getTempleteItems()
                    },{
                        xtype: 'panel',
                        title: '敏感词校验',
                        fitToFrame: true,
                        //html: '<iframe id="account_sms_text_hexie_valid" src="http://register.7moor.com/interface/httpmake7moor.html" frameborder="0" width="100%" height="100%"></iframe>',
                        listeners: {
                            afterrender:function(obj){
                                    var iframe = Ext.create('Ext.form.Panel', {
                                        html: '<iframe id="account_sms_text_hexie_valid" src="http://register.7moor.com/interface/httpmake7moor.html" frameborder="0" width="100%" height="400px"></iframe>',
                                    });
                                    obj.add(iframe);
                                    obj.doLayout();
                                }
                            }
                        }
                    ]
            }]
        });
        me.callParent(arguments);
    },
    getSignItems: function () {
        var items = new Array();
        var form = {
            xtype: 'form',
            frame: true,
            class: 'query',
            title: '',
            bodyStyle: 'padding:2px 2px 0',
            fieldDefaults: {
                msgTarget: 'side',
                labelWidth: 80,
                labelAlign: 'right'
            },
            items: [
                {
                    xtype: 'fieldset',
                    class: "query",
                    title: '短信签名查询',
                    collapsible: true,
                    layout: 'column',
                    defaultType: 'textfield',
                    items: [
                        {
                            xtype: 'hidden',
                            name: 'account',
                            value: this.account.get("_id")
                        },
                        {
                            xtype: 'textfield',
                            fieldLabel: '签名',
                            name: 'name',
                            columnWidth: .25
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
                }
            ]
        };

        var grid = {
            xtype: 'gridpanel',
            preventHeader : true,
            title: '签名列表',
            margin: '10 ',
            id: 'account_smsSign_query_grid',
            class : 'smsSign',
            forceFit: true,
            loadMask: true,
            store: this.getSignDataStore(),
            columnLines: true,
            dockedItems: [
                {
                    xtype: 'toolbar',
                    class: 'dock',
                    items: [
                        {
                            iconCls: 'add_icon_cls',
                            text: '添加签名',
                            id: 'btn_show_add_sms_sign',
                            needSelect: false
                        },
                        {
                            iconCls: 'edit_icon_cls',
                            text: '修改签名',
                            id: 'btn_show_update_sms_sign',
                            disabled: true,
                            needSelect: true
                        },
                        {
                            iconCls: 'delete_icon_cls',
                            text: '删除签名',
                            id: 'btn_delete_sms_sign',
                            disabled: true,
                            needSelect: true
                        }
                    ]
                }
            ],
            columns: [
                {
                    dataIndex: '_id',
                    align: 'center',
                    header: '',
                    hidden: true
                },
                {
                    dataIndex: 'name',
                    align: 'center',
                    header: '签名',
                    renderer: function (value) {
                        var val = value.replace("【", "");
                        return val.replace("】", "");
                    }
                },
                {
                    dataIndex: 'subcode',
                    align: 'center',
                    header: 'subcode'
                }
            ],
            viewConfig: {
                forceFit: true
            },
            bbar: Ext.create('Ext.PagingToolbar', {
                store: this.getSignDataStore(),
                pageSize: 10,
                displayInfo: true,
                displayMsg: '当前记录 {0} - {1} 共 {2}',
                emptyMsg: "没有记录可显示",
                plugins: Ext.create('Ext.ux.ProgressBarPager', {})
            })
        };
        items.push(grid);
        return items;
    },
    getTempleteItems : function(){
        var items = [];
        var grid = {
            xtype: 'gridpanel',
            preventHeader : true,
            margin: '10 ',
            id: 'account_smsTemplete_query_grid',
            class :'smsTemplete',
            forceFit: true,
            loadMask: true,
            store: this.getTempleteStore(),
            columnLines: true,
            dockedItems: [
                {
                    xtype: 'toolbar',
                    class: 'dock',
                    items: [
                        {
                            iconCls: 'add_icon_cls',
                            text: '添加模板',
                            id: 'btn_show_add_sms_templete',
                            needSelect: false
                        },
                        {
                            iconCls: 'edit_icon_cls',
                            text: '修改模板',
                            id: 'btn_show_update_sms_templete',
                            disabled: true,
                            needSelect: true
                        },
                        {
                            iconCls: 'delete_icon_cls',
                            text: '删除模板',
                            id: 'btn_delete_sms_templete',
                            disabled: true,
                            needSelect: true
                        }
                    ]
                }
            ],
            columns: [
                {
                    dataIndex: '_id',
                    align: 'center',
                    header: '',
                    hidden: true
                },
                {
                    dataIndex: 'name',
                    align: 'center',
                    header: '模板名称'
                },
                {
                    dataIndex: 'num',
                    align: 'center',
                    header: '模板编号'
                },{
                    dataIndex: 'content',
                    align: 'center',
                    header: '模板内容'
                },{
                    dataIndex: 'sign',
                    align: 'center',
                    header: '模板签名',
                    renderer : function(value){
                        return App.util.AppUtil.getRendererValue(value, 'smsSign',true);
                    }
                }
            ],
            viewConfig: {
                forceFit: true
            },
            bbar: Ext.create('Ext.PagingToolbar', {
                store: this.getTempleteStore(),
                pageSize: 10,
                displayInfo: true,
                displayMsg: '当前记录 {0} - {1} 共 {2}',
                emptyMsg: "没有记录可显示",
                plugins: Ext.create('Ext.ux.ProgressBarPager', {})
            })
        };
        items.push(grid);
        return items;
    },
    getSignDataStore: function () {
        if (this.store === null) {
            this.store = App.util.AppUtil.getGridStore('bill.account.querySmsSignList', {account: this.account.get("_id")}, 'App.model.account.SmsSign');
            this.store.loadPage(1);
        }
        return this.store;
    },
    getTempleteStore : function (){
        if(this.templeteStore === null){
            this.templeteStore = App.util.AppUtil.getGridStore('bill.account.querySmsTempleteList', {account: this.account.get("_id")}, 'App.model.account.SmsTemplete');
            this.templeteStore.loadPage(1);
        }
        return this.templeteStore;
    }
});
