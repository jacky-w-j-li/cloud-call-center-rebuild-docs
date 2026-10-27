Ext.define('App.view.account.groupAccount', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.groupAccountSetPanel',
    requires: ['App.model.account.GroupAccount'],
    layout: {
        type: 'anchor'
    },
    store: null,

    initComponent: function () {
        var me = this;
        Ext.applyIf(me,{
            items: [
                {
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
                            title: '查询',
                            collapsible: true,
                            layout: 'column',
                            defaultType: 'textfield',
                            items: [
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '账户编号',
                                    name: 'account',
                                    columnWidth: .25
                                },{
                                    fieldLabel: '创建时间',
                                    labelWidth: 80,
                                    xtype: 'datefield',
                                    format: 'Y-m-d',
                                    name: 'begin',
                                    columnWidth: .24
                                },
                                {
                                    xtype: 'label',
                                    text: '至',
                                    columnWidth: .02
                                },
                                {
                                    xtype: 'datefield',
                                    format: 'Y-m-d',
                                    name: 'end',
                                    hideLabel: true,
                                    columnWidth: .14
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
                },
                {
                    xtype: 'gridpanel',
                    title: '集团账户关系列表',
                    id:"group_account_grid",
                    margin: '10 ',
                    class: 'query',
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
                                    iconCls: 'find_icon_cls',
                                    text: '详情',
                                    id: 'btn_groupAccount_show_detail',
                                    disabled: true,
                                    needSelect: true
                                },
                                {
                                    iconCls: 'add_icon_cls',
                                    text: '添加',
                                    id: 'add_group_account_tool',
                                    needSelect: false
                                },
                                {
                                    iconCls: 'set_icon_cls',
                                    text: '修改',
                                    id: 'update_group_account_tool',
                                    disabled: true,
                                    needSelect: true
                                },
                                {
                                    iconCls: 'delete_icon_cls',
                                    text: '删除',
                                    id: 'delete_group_account_tool',
                                    disabled: true,
                                    needSelect: true
                                }
                            ]
                        }
                    ],

                    columns: [
                        {
                            dataIndex: '_id',
                            width: 150 ,
                            hidden:true
                        },
                        {
                            dataIndex: 'accountList',
                            width: 150 ,
                            align: 'center',
                            header: '集团账户'
                        },
                        {
                            dataIndex: 'memo',
                            header: '备注',
                            align: 'center'
                        },
                        {
                            dataIndex: 'createTime',
                            width:90,
                            align: 'center',
                            header: '创建时间'
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

                }
            ]
        });
        me.callParent(arguments);
    },
    getDataStore: function () {
        if (this.store === null) {
            this.store = App.util.AppUtil.getGridStore('bill.account.queryGroupAccount', {}, 'App.model.account.GroupAccount');
            this.store.loadPage(1);
        }
        return this.store;
    }
});