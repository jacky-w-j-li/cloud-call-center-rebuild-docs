Ext.define('App.view.system.systemUser', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.systemUserQueryPanel',
    requires: ['App.model.system.SystemUser'],
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
                            title: '系统用户查询',
                            collapsible: true,
                            layout: 'column',
                            defaultType: 'textfield',
                            items: [

                                {
                                    xtype: 'textfield',
                                    fieldLabel: '用户名称',
                                    name: 'name',
                                    columnWidth: .25
                                },
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '登录名',
                                    name: 'loginName',
                                    columnWidth: .25
                                },
                                {
                                    fieldLabel: '状态',
                                    xtype: 'combobox',
                                    name: 'status',
                                    editable: false,
                                    store: App.util.AppUtil.getDicStore('licenseStatus'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    columnWidth: .25
                                },
                                {
                                    fieldLabel: '身份',
                                    xtype: 'combobox',
                                    name: 'identity',
                                    store: App.util.AppUtil.getDicStore('userIdentity'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    columnWidth: .25,
                                    typeAhead: true,
                                    queryMode: 'local'
                                },
                                {
                                    fieldLabel: '角色',
                                    xtype: 'combobox',
                                    name: 'role',
                                    store: App.util.AppUtil.getDicStore('role'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    columnWidth: .25,
                                    typeAhead: true,
                                    queryMode: 'local'
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
                                   //id:'btn_export_system_user',//该功能暂时不添加
                                    width: 90,
                                    text: '导出'
                                }

                            ]
                        }
                    ]
                },
                {
                    xtype: 'gridpanel',
                    title: '系统用户列表',
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
                                    id: 'addSystemUser_tool',
                                    needSelect: false,
                                    hidden : App.util.AppUtil.hasLimit("user_add")
                                },
                                {
                                    iconCls: 'edit_icon_cls',
                                    text: '修改',
                                    id: 'showSystemUser_tool',
                                    disabled: true,
                                    needSelect: true,
                                    hidden : App.util.AppUtil.hasLimit("user_update")
                                },
                                {
                                    iconCls: 'set_icon_cls',
                                    text: '设置',
                                    id: 'systemUserSet_tool',
                                    disabled: true,
                                    needSelect: true,
                                    hidden : App.util.AppUtil.hasLimit("user_setFee")
                                },
                                {
                                    iconCls: 'find_icon_cls',
                                    text: '查询',
                                    id: 'findSystemUser_tool',
                                    disabled: true,
                                    needSelect: true
                                },
                                {
                                    iconCls: 'set_icon_cls',
                                    text: '充值',
                                    id: 'btn_pay_proxy',
                                    disabled: true,
                                    needSelect: true,
                                    hidden : App.util.AppUtil.hasLimit("user_pay2Proxy")
                                },
                                {
                                    iconCls: 'set_icon_cls',
                                    text: '事件对接',
                                    id: 'btn_callEvent_proxy',
                                    disabled: true,
                                    needSelect: true
                                },
                                {
                                    iconCls: 'set_icon_cls',
                                    text: '集团财务设置',
                                    id: 'btn_group_finance_set',
                                    disabled: true,
                                    needSelect: true
                                },
                                {
                                    iconCls: 'set_icon_cls',
                                    text: '停用',
                                    id: 'btn_stop',
                                    disabled: true,
                                    needSelect: true,
                                    hidden : App.util.AppUtil.hasLimit("user_stopUser")
                                }

                            ]
                        }
                    ],

                    columns: [
                        {
                            dataIndex: 'name',
                            width: 120,
                            align: 'center',
                            header: '用户名称'
                        },
                        {
                            dataIndex: 'loginName',
                            width: 90,
                            align: 'center',
                            header: '登录名'
                        },
                        {
                            dataIndex: 'identity',
                            header: '身份',
                            align: 'center',
                            renderer: function(value){
                                return App.util.AppUtil.getRendererValue(value, 'userIdentity');
                            }
                        },
                        {
                            dataIndex: 'role',
                            header: '角色',
                            align: 'center',
                            renderer: function(value){
                                return App.util.AppUtil.getRendererValueForArray(value, 'role');
                            }
                        },
                        {
                            dataIndex: 'parent',
                            header: '上级',
                            align: 'center',
                            renderer: function(value){
                                return App.util.AppUtil.getRendererValue(value, 'systemUser');
                            }
                        },
                        {
                            dataIndex: 'createTime',
                            header: '创建日期',
                            align: 'center'
                        },
                        {
                            dataIndex: 'status',
                            align: 'center',
                            header: '状态',
                            renderer: function(value){
                                 return App.util.AppUtil.getRendererValue(value, 'licenseStatus');
                            }
                        },
                        {
                            dataIndex: 'balance',
                            align: 'center',
                            header: '余额(元)',
                            renderer: function(value){
                                return value/10000 || 0;
                            }
                        },
                        {
                            dataIndex: 'overdraw',
                            align: 'center',
                            header: '透支额度(元)',
                            renderer: function(value){
                                return value/10000 || 0;
                            }
//                            renderer: function(value,meta,row){
//                                var leave=(row.raw.totalFee - row.raw.consume)/1000||0;
//                                return Math.round(leave*100)/100;
//                            }
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
            this.store = App.util.AppUtil.getGridStore('bill.systemUser.queryUserList', {}, 'App.model.system.SystemUser');
            this.store.loadPage(1);
        }
        return this.store;
    }
});
