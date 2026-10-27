/**
 * Created by apple on 15/8/11.
 * author ZZX
 */
Ext.define('App.view.account.account.smsEdit', {
    extend: 'Ext.window.Window',
    requires: ['App.model.account.SmsEdit'],
    alias: 'widget.smsEditWin',
    height: 600,
    width: 1000,
    title: '短信备案',
    autoScroll: true,
    account: null,
    data: {},
    store: null,
    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            modal: true,
            items: [{
                xtype: 'tabpanel',
                activeTab: 0,
                items: [{
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
                    items: []
                }]
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
//            items.push(form);

        var grid = {
            xtype: 'gridpanel',
            title: '模版列表',
            class: 'query',
            margin: '10',
            id: 'account_smsEdit_query_grid',
            forceFit: true,
            loadMask: true,
            store: this.getDataStore(),
            columnLines: true,
            dockedItems: [
                {
                    xtype: 'toolbar',
                    class: 'dock',
                    items: [
                        {
                            iconCls: 'add_icon_cls',
                            text: '添加模版',
                            id: 'btn_show_add_sms_edit',
                            needSelect: false
                        },
                        {
                            iconCls: 'edit_icon_cls',
                            text: '修改模版',
                            id: 'btn_show_update_sms_edit',
                            needSelect: true
                        },
                        {
                            iconCls: 'delete_icon_cls',
                            text: '删除模版',
                            id: 'btn_delete_sms_edit',
                            //disabled: true,
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
                    hidden: true,
                },
                {
                    dataIndex: 'name',
                    align: 'center',
                    header: '模版名称',
                    width: 100,
                    renderer: function (value) {
                        var val = value.replace("【", "");
                        return val.replace("】", "");
                    }
                },
                {
                    dataIndex: 'content',
                    align: 'center',
                    header: '模版内容',
                    width: 400,
                }
            ],
            viewConfig: {
                forceFit: true
            },
            bbar: Ext.create('Ext.PagingToolbar', {
                store: this.getDataStore(),
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
    getDataStore: function () {
        if (this.store === null) {
            this.store = App.util.AppUtil.getGridStore('bill.account.querySmsEditList', {account: this.account.get("_id")}, 'App.model.account.SmsEdit');
            this.store.loadPage(1);
        }
        return this.store;
    }
});
