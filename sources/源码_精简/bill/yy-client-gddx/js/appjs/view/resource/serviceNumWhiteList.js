Ext.define('App.view.resource.serviceNumWhiteList', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.serviceNumWhiteListQueryPanel',
    requires: ['App.model.resource.ServiceNumWhiteList'],
    layout: {
        type: 'anchor'
    },
    store: null,
    initComponent: function() {
        var me = this;
        Ext.applyIf(me,{
            items: [
                {
                    xtype:'form',
                    frame: true ,
                    class: 'query',
                    title: '',
                    fieldDefaults: {
                        msgTarget: 'side',
                        labelWidth: 80,
                        labelAlign: 'right',
                    },
                    items:[{
                        xtype: 'fieldset',
                        class: 'query',
                        title: '号码查询',
                        collapsible: false,
                        layout: 'column',
                        defaultType: 'textfield',
                        items: [
                            {
                                xtype: 'textfield',
                                fieldLabel: '号码段',
                                name: '_id',
                                columnWidth:.25,
                            },
                            {
                                fieldLabel:'运营商',
                                name:"operator",
                                columnWidth:.25,
                                xtype: 'combobox',
                                editable:true,
                                store: App.util.AppUtil.getDicStore('operator'),
                                displayField: 'codeName',
                                valueField: 'codeValue',
                            }
                        ]
                    },
                        {
                            xtype: 'fieldset',
                            layout: {
                                type: 'hbox',
                                pack: 'center',
                                align: 'middle',
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
                        }]},
                {
                    xtype: 'gridpanel',
                    title: '白名单列表',
                    margin: '10',
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
                                    id: 'toolbar_update_serviceNumWhiteList',
                                    disabled: true,
                                    needSelect: true,
                                },
                                {
                                    iconCls: 'delete_icon_cls',
                                    text: '删除',
                                    id: 'toolbar_delete_serviceNumWhiteList',
                                    disabled: true,
                                    needSelect: true,
                                },
                                {
                                    iconCls: 'add_icon_cls',
                                    text:'添加',
                                    id: 'toolbar_add_serviceNumWhiteList',
                                    disabled:false,
                                },
                            ]
                        }
                    ],
                    columns:[
                        {
                            dataIndex:'_id',
                            width: 70,
                            align: 'center',
                            header: '号码段',
                        },
                        {
                            dataIndex: 'operator',
                            width:70,
                            align: 'center',
                            header: '运营商',
                            renderer: function(value){
                                if(!value){
                                    return '';
                                }
                                return App.util.AppUtil.getRendererValue(value,'operator');
                            }
                        },
                        {
                            dataIndex: 'memo',
                            header: '备注',
                            align: 'center',
                        },
                    ],
                    viewConfig: {
                        forceFit: true,
                    },
                    bbar: Ext.create('Ext.PagingToolbar',{
                        store: this.getDataStore(),
                        pageSize: 10,
                        displayInfo: true,
                        displayMsg: '当前记录 {0} - {1} 共 {2}',
                        emptyMsg: "没有记录可显示",
                        plugins: Ext.create('Ext.ux.ProgressBarPager',{})
                    })

                }
            ]
        });
        me.callParent(arguments);
    },
    getDataStore: function(){
        if (this.store === null) {
            this.store = App.util.AppUtil.getGridStore('bill.resource.queryServiceNumWhiteList', {}, 'App.model.resource.ServiceNumWhiteList');
            this.store.loadPage(1);
        }
        return this.store;

    }
});

























