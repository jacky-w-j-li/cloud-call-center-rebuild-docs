Ext.define('App.view.resource.intl', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.intlQueryPanel',
    requires: ['App.model.resource.Intl'],
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
                        title: '国际长途查询',
                        collapsible: false,
                        layout: 'column',
                        defaultType: 'textfield',
                        items: [
                            {
                                xtype: 'textfield',
                                fieldLabel: '编号',
                                name: '_id',
                                columnWidth:.25,
                            },
                            {
                                xtype: 'combobox',
                                fieldLabel: '线路',
                                name:'line',
                                editable:true,
                                store: App.util.AppUtil.getDicStore('line',true,{line_type:"international"}),
                                displayField: 'codeName',
                                valueField: 'codeValue',
                                columnWidth:.25,
                            },
                            {
                                xtype: 'textfield',
                                fieldLabel: '区域代码',
                                name: 'code',
                                columnWidth:.25,
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
                    title: '国际长途列表',
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
                                    id: 'toolbar_update_intl',
                                    disabled: true,
                                    needSelect: true,
                                },
                                {
                                    iconCls: 'delete_icon_cls',
                                    text: '删除',
                                    id: 'toolbar_delete_intl',
                                    disabled: true,
                                    needSelect: true,
                                },
                                {
                                    iconCls: 'add_icon_cls',
                                    text:'添加',
                                    id: 'toolbar_add_intl',
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
                            header: '编号',
                        },
                        {
                            dataIndex: 'line',
                            width:70,
                            align: 'center',
                            header: '线路',
                            renderer: function(value){
                                if(!value){
                                    return '';
                                }
                                return App.util.AppUtil.getRendererValue(value,'line');
                            }
                        },
                        {
                            dataIndex: 'code',
                            width:50,
                            align:'center',
                            header:'区域代码',
                        },
                        {
                            dataIndex: 'dest',
                            header: '目的地',
                            align: 'center',
                        },
                        {
                            dataIndex: 'price',
                            header: '不含税价',
                            align:'center',
                            renderer: function(value){
                                return value/10000;
                            }
                        },
                        {
                            dataIndex: 'priceWithTax',
                            header: '含税价',
                            align:'center',
                            renderer: function(value){
                                return value/10000;
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
            this.store = App.util.AppUtil.getGridStore('bill.resource.queryIntl', {}, 'App.model.resource.Intl');
            this.store.loadPage(1);
        }
        return this.store;

    }
});

























