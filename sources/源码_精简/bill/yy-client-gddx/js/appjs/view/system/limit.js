Ext.define('App.view.system.limit', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.systemRoleQueryPanel',
    requires: ['App.model.system.UserRole'],
    layout: {
        type: 'anchor'
    },
    store: null,

    initComponent: function () {
        var me = this;

        Ext.applyIf(me, {
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
                            title: '系统角色查询',
                            collapsible: true,
                            layout: 'column',
                            defaultType: 'textfield',
                            items: [

                                {
                                    xtype: 'textfield',
                                    fieldLabel: '角色名称',
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
                                },
                                {
                                    xtype: 'button',
                                    calss: 'export',
                                    width: 90,
                                    text: '导出'
                                }

                            ]
                        }
                    ]
                },
                {
                    xtype: 'gridpanel',
                    title: '系统角色列表',
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
                                    iconCls: 'add_icon_cls',
                                    text: '添加',
                                    id: 'addSystemRole_tool',
                                    needSelect: false
                                },
                                {
                                    iconCls: 'edit_icon_cls',
                                    text: '修改',
                                    id: 'updateSystemRole_tool',
                                    disabled: true,
                                    needSelect: true
                                },
                                {
                                    iconCls: 'set_icon_cls',
                                    text: '权限配置',
                                    id: 'configSystemRole_tool',
                                    disabled: true,
                                    needSelect: true
                                },{

                                    iconCls: 'delete_icon_cls',
                                    text: '删除',
                                    id: 'deleteSystemRole_tool',
                                    disabled: true,
                                    needSelect: true
                                }

                            ]
                        }
                    ],

                    columns: [
                        {
                            dataIndex: 'name',
                            width: 120,
                            align: 'center',
                            header: '角色名称'
                        },
                        {
                            dataIndex: 'desc',
                            width: 90,
                            align: 'center',
                            header: '角色描述'
                        },
                        {
                            dataIndex: 'createTime',
                            header: '创建时间',
                            align: 'center'
                        },
                        {
                            dataIndex: 'lastUpdateTime',
                            header: '最后更新时间',
                            align: 'center'
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
            this.store = App.util.AppUtil.getGridStore('bill.systemUser.queryUserRole', {}, 'App.model.system.UserRole');
            this.store.loadPage(1);
        }
        return this.store;
    }
});
