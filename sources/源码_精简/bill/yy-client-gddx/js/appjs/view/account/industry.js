Ext.define('App.view.account.industry', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.industryQueryPanel',
    requires: ['App.model.account.Industry'],
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
                        title: '行业查询',
                        collapsible: false,
                        layout: 'column',
                        defaultType: 'textfield',
                        items: [
                            {
                                xtype: 'textfield',
                                fieldLabel: '行业名称',
                                name: 'name',
                                columnWidth:.25,
                            },
                            {
                                xtype: 'combobox',
                                fieldLabel: '行业大类',
                                store:  App.util.AppUtil.getDicStore("industry",true,{categoryLevel:"1"}),
                                displayField: 'codeName',
                                valueField: 'codeValue',
                                typeAhead: true,
                                columnWidth: .25,
                                name:   "parent",
                            },
                            {
                                fieldLabel:'行业分类等级',
                                name:'categoryLevel',
                                xtype:"combobox",
                                store:App.util.AppUtil.getDicStore("industryCategoryLevel"),
                                displayField: 'codeName',
                                valueField: 'codeValue',
                                typeAhead: true,
                                columnWidth: .25,
                                listeners:
                                {
                                    select:function(obj,selected) {
                                        var selectedRecord = selected[0];
                                        var fieldset = obj.up("fieldset");
                                        var parent = fieldset.down("combobox[name=parent]");
                                        var level = selectedRecord.get('codeValue');
                                        if(level == 1){
                                            parent.setValue(null);
                                            parent.setVisible(false);
                                        }else{
                                            parent.setVisible(true);
                                        }
                                    }
                                }
                            },
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
                    title: '行业列表',
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
                                    id: 'toolbar_update_industry',
                                    disabled: true,
                                    needSelect: true,
                                },
                                {
                                    iconCls: 'delete_icon_cls',
                                    text: '删除',
                                    id: 'toolbar_delete_industry',
                                    disabled: true,
                                    needSelect: true,
                                },
                                {
                                    iconCls: 'add_icon_cls',
                                    text:'添加',
                                    id: 'toolbar_add_industry',
                                    disabled:false,
                                },
                            ]
                        }
                    ],
                    columns:[
                        {
                            dataIndex: 'name',
                            width:50,
                            align:'center',
                            header:'行业名称',
                        },
                        {
                            dataIndex: 'categoryLevel',
                            width:50,
                            align:'center',
                            header:"分类等级",
                            renderer : function(value , mate , row){
                                value = value || "";
                                return App.util.AppUtil.getRendererValue(value, 'industryCategoryLevel');
                            }
                        },
                        {
                            dataIndex: 'parent',
                            width:50,
                            align:'center',
                            header:"行业大类",
                            renderer : function(value , mate , row){
                                value = value || "";
                                return App.util.AppUtil.getRendererValue(value, 'industry',true);
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
            this.store = App.util.AppUtil.getGridStore('bill.account.queryIndustry', {}, 'App.model.account.Industry');
            this.store.loadPage(1);
        }
        return this.store;

    }
});

























