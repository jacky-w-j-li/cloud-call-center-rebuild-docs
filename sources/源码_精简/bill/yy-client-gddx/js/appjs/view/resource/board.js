Ext.define('App.view.resource.board', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.boardQueryPanel',
    requires: ['App.model.resource.Board'],
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
                            title: '机柜查询',
                            collapsible: true,
                            layout: 'column',
                            defaultType: 'textfield',
                            items: [
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '编号',
                                    name: '_id',
                                    columnWidth: .25
                                },
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '名称',
                                    name: 'name',
                                    columnWidth: .25
                                },
                                {
                                    fieldLabel: '区域',
                                    xtype: 'combobox',
                                    name: 'location',
                                    editable: false,
                                    store: App.util.AppUtil.getDicStore('location', true),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    columnWidth: .25,
                                    listeners :{
                                        change : function(obj,value){
                                            var combox = me.down("combobox[name='building']");
                                            combox.reset();
                                            combox.store.removeAll();
                                            App.util.AppUtil.getDicStoreData('building',{location:value},function(data){
                                                combox.store.loadData(data);
                                            });
                                        }
                                    }
                                },{
                                    xtype:'combobox',
                                    hidden: true,
                                    store : App.util.AppUtil.getDicStore('building', true)
                                },
                                {
                                    fieldLabel: '大楼',
                                    xtype: 'combobox',
                                    name: 'building',
                                    editable: false,
                                    store: Ext.create('Ext.data.Store', {
                                        autoLoad: true,
                                        model: 'App.model.common.DicCache',
                                        data: []
                                    }),
                                    queryMode : 'local',
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
                    title: '机柜列表',
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
                                    text: '修改',
                                    id: 'update_board_tool',
                                    disabled: true,
                                    needSelect: true
                                },
                                {
                                    iconCls: 'delete_icon_cls',
                                    text: '删除',
                                    id: 'delete_board_tool',
                                    disabled: true,
                                    needSelect: true
                                },
                                {
                                    iconCls: 'add_icon_cls',
                                    text: '添加',
                                    id: 'add_board_tool',
                                    needSelect: false
                                }
                            ]
                        }
                    ],

                    columns: [
                        {
                            dataIndex: '_id',
                            width: 120,
                            align: 'center',
                            header: '机柜编号'
                        },
                        {
                            dataIndex: 'name',
                            width: 90,
                            align: 'center',
                            header: '机柜名称'
                        },
                        {
                            dataIndex: 'location',
                            header: '地区',
                            align: 'center',
                            renderer: function(value){
                                return App.util.AppUtil.getRendererValue(value, 'location');
                            }
                        },
                        {
                            dataIndex: 'building',
                            header: '大楼',
                            align: 'center',
                            renderer: function(value){
                                return App.util.AppUtil.getRendererValue(value, 'building');
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
            this.store = App.util.AppUtil.getGridStore('bill.resource.queryBoard', {}, 'App.model.resource.Board');
            this.store.loadPage(1);
        }
        return this.store;
    }
});