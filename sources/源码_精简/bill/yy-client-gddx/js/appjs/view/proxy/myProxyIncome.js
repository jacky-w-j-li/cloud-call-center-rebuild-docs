Ext.define('App.view.proxy.myProxyIncome', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.myProxyIncomeQueryPanel',
    requires: ['App.model.proxy.MyProxyIncome'],
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
                            title: '查询',
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
                                    typeAhead: true,
                                    queryMode: 'local',
                                    columnWidth: .25
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
                                    id:'proxy_myProxyIncome_query',
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
                    title: '用户列表',
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
                                    text: '查询',
                                    id: 'findSystemUser_tool',
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
                            header: '收入(元)',
                            renderer: function(value){
                                value=App.util.AppUtil.formatTrueFee(value);
                                var val=parseFloat(value);

                                if(val>=0){
                                    val="<span style='color: green;'>"+val+"</span>";
                                }else{
                                    val="<span style='color: red;'>"+val+"</span>";
                                }
                                return  val;
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
            this.store = App.util.AppUtil.getGridStore('bill.proxy.queryUserIncomeList', {}, 'App.model.proxy.MyProxyIncome');
            this.store.loadPage(1);
        }
        return this.store;
    }
});