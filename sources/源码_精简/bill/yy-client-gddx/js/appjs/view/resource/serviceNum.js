Ext.define('App.view.resource.serviceNum', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.serviceNumQueryPanel',
    requires: ['App.model.resource.ServiceNum'],
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
                            title: '服务号查询',
                            collapsible: true,
                            layout: 'column',
                            defaultType: 'textfield',
                            items: [
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '服务号',
                                    name: '_id',
                                    columnWidth: .25
                                },
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '账户编号',
                                    name: 'account',
                                    columnWidth: .25
                                },
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '账户状态',
                                    name: 'accountStatus',
                                    xtype: 'combobox',
                                    editable: false,
                                    store: App.util.AppUtil.getDicStore('accountStatus'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    columnWidth: .25
                                },
                                {
                                    fieldLabel: '服务号状态',
                                    xtype: 'combobox',
                                    name: 'status',
                                    editable: false,
                                    store: App.util.AppUtil.getDicStore('serviceNumStatus'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    columnWidth: .25
                                },

                                {
                                    xtype: 'combobox',
                                    hidden:true,
                                    store: App.util.AppUtil.getDicStore('board')
                                },
                                {
                                    fieldLabel: 'pbx',
                                    xtype: 'combobox',
                                    name: 'pbx',
                                    editable: false,
                                    store: App.util.AppUtil.getDicStore('pbx'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    columnWidth: .25
                                },
                                {
                                    fieldLabel: '到期时间',
                                    xtype: 'datefield',
                                    format: 'Y-m-d',
                                    name: 'begin',
                                    columnWidth: .15
                                },
                                {
                                    xtype: 'label',
                                    text: '⤑',
                                    columnWidth: .01
                                },
                                {
                                    xtype: 'datefield',
                                    format: 'Y-m-d',
                                    name: 'end',
                                    hideLabel: true,
                                    columnWidth: .09
                                },
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '400号码',
                                    name: 'bind400',
                                    columnWidth: .25
                                },
                                {
                                    fieldLabel: '类型',
                                    xtype: 'combobox',
                                    name: 'type',
                                    editable: false,
                                    store: App.util.AppUtil.getDicStore('serviceNumType'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    columnWidth: .25
                                },
                                {
                                    fieldLabel: '运营商',
                                    xtype: 'combobox',
                                    name: 'sp',
                                    editable: false,
                                    store: App.util.AppUtil.getDicStore('spType'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    columnWidth: .25
                                },
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '欠费次数',
                                    name: 'failNum',
                                    columnWidth: .25
                                },
                                {
                                    fieldLabel: '所属人',
                                    xtype: 'combobox',
                                    name: 'owner',
                                    store: this.getProxyStore2(),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    editable:true,
                                    columnWidth: .25,
                                    hidden:App.util.AppUtil.isHideWidget()
                                },
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '电话邦标记',
                                    name: 'flag_dhb',
                                    columnWidth: .25
                                },
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '360标记',
                                    name: 'flag_360',
                                    columnWidth: .25
                                },
                                {
                                    fieldLabel: '处理状态',
                                    xtype: 'combobox',
                                    name: 'Solution_state',
                                    editable: false,
                                    store: App.util.AppUtil.getDicStore('numTag'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
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
                    title: '服务号列表',
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
                                    iconCls: 'set_icon_cls',
                                    text: '设置',
                                    id: 'set_serviceNum_tool',
                                    hidden : App.util.AppUtil.hasLimit("resource_serviceNum_set"),
                                    disabled: false,
                                    needSelect: false
                                },
                                {
                                    iconCls: 'set_icon_cls',
                                    text: '设置初始资费',
                                    id: 'set_serviceNum_init_tool',
                                    hidden : App.util.AppUtil.hasLimit("resource_serviceNum_setInit"),
                                    disabled: true,
                                    needSelect: true
                                },
                                {
                                    iconCls: 'delete_icon_cls',
                                    text: '删除',
                                    id: 'delete_serviceNum_tool',
                                    hidden : App.util.AppUtil.hasLimit("resource_serviceNum_delete"),
                                    disabled: true,
                                    needSelect: true
                                },
                                {
                                    iconCls: 'add_icon_cls',
                                    text: '添加',
                                    id: 'add_serviceNum_tool',
                                    hidden : App.util.AppUtil.hasLimit("resource_serviceNum_add"),
                                    needSelect: false
                                },
                                {
                                    iconCls: 'set_icon_cls',
                                    text: '释放停用号码',
                                    id: 'btn_serviceNum_free',
                                    hidden : App.util.AppUtil.hasLimit("resource_serviceNum_free"),
                                    disabled: true,
                                    needSelect: true
                                },
                                {
                                    iconCls: 'set_icon_cls',
                                    text: '停用号码',
                                    id: 'btn_serviceNum_stop',
                                    hidden : App.util.AppUtil.hasLimit("resource_serviceNum_stop"),
                                    disabled: true,
                                    needSelect: true
                                },
                                {
                                    iconCls: 'set_icon_cls',
                                    text: '标记已处理',
                                    id: 'btn_serviceNum_flag',
                                    disabled: true,
                                    needSelect: true
                                }
                            ]
                        }
                    ],

                    columns: [
                        {
                            dataIndex: '_id',
                            width: 120,
                            align: 'center',
                            header: '服务号'
                        },
                        {
                            dataIndex: 'status',
                            width: 90,
                            align: 'center',
                            header: '状态',
                            renderer : function(value){
                                return App.util.AppUtil.getRendererValue(value,"serviceNumStatus");
                            }
                        },
                        {
                            dataIndex: 'account',
                            header: '账户编号',
                            align: 'center'
                        },
                        {
                            dataIndex: 'accountData',
                            header: '公司名称',
                            align: 'center',
                            renderer: function (value) {
                                return value.companyName;
                            }
                        },
                        {
                            dataIndex: 'monthRent',
                            header: '月租',
                            align: 'center'
                        },
                        {
                            dataIndex : 'monthRentProxy',
                            header : '代理月租',
                            align: 'center'
                        },
                        {
                            dataIndex : 'concurrent',
                            header : '并发',
                            align : 'center'
                        },
//                        {
//                            dataIndex: 'callMinutes',
//                            header: '赠送通话时长比率',
//                            align: 'center'
//                        },
                        {
                            dataIndex: 'beginTime',
                            header: '租用时间',
                            align: 'center'
                        },{
                            dataIndex : 'endTime',
                            header : '到期时间',
                            align : 'center'
                        },
                        {
                            dataIndex : 'board',
                            header : '机柜',
                            align : 'center',
                            renderer : function(value){
                                return App.util.AppUtil.getRendererValue(value, 'board');
                            }
                        },
                        {
                            dataIndex: 'bind400',
                            header: '绑定400',
                            align: 'center'
                        },
                        {
                            dataIndex: "owner",
                            header: '所属人',
                            align: 'center',
                            renderer : function(value){
                                return App.util.AppUtil.getRendererValue(value, 'systemUser');
                            }
                        },
                        {
                            dataIndex: 'type',
                            header: '类型',
                            align: 'center',
                            renderer : function(value){
                                return App.util.AppUtil.getRendererValue(value, 'serviceNumType');
                            }
                        },
                        {
                            dataIndex: 'failNum',
                            header: '欠费次数',
                            align: 'center'
                        },
                        {
                            dataIndex: 'flag_dhb',
                            header: '电话邦标记',
                            align: 'center'
                        },
                        {
                            dataIndex: 'flag_360',
                            header: '360标记',
                            align: 'center'
                        },
                        {
                            dataIndex: 'Solution_state',
                            header: '处理状态',
                            align: 'center',
                            renderer : function(value){
                                return App.util.AppUtil.getNumTagValue(value, 'numTag');
                            }

                        },
                        {
                            dataIndex: 'memo',
                            header: '备注',
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
            this.store = App.util.AppUtil.getGridStore('bill.resource.queryServiceNum', {}, 'App.model.resource.ServiceNum');
            this.store.loadPage(1);
        }
        return this.store;
    },
    getProxyStore2: function () {
        var store = App.util.AppUtil.getDicStore('systemUser');
        store.each(function (item) {
            if (gloab_client_user.identity == 'proxy') {
                if (item.get("codeValue") !== gloab_client_user._id) {
                    store.remove(item);
                }
            } else {
                if (item.get("identity") != "proxy") {
                    store.remove(item);
                }
            }

        });
        var Rlqimo={
            codeName: "容联七陌",
            codeValue:" "
        };
        store.add(Rlqimo)
        return store;
    }
});
