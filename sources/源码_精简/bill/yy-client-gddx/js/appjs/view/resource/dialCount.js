Ext.define('App.view.resource.dialCount', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.dialCountQueryPanel',
    requires: ['App.model.resource.dialCount'],
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
                        title: '拨号计数查询',
                        collapsible: false,
                        layout: 'column',
                        defaultType: 'textfield',
                        items: [
                            {
                                xtype: 'textfield',
                                fieldLabel: '号码',
                                name: '_id',
                                columnWidth:.25,
                            },
                            {
                                xtype: 'textfield',
                                fieldLabel: '平台拨打次数',
                                name: 'callCount',
                                columnWidth:.25,
                            },
                            {
                                xtype: 'textfield',
                                fieldLabel: '平台剩余次数',
                                name: 'residualCount',
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
                    title: '拨号计数列表',
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
                                    id: 'toolbar_update_dial_count',
                                    disabled: true,
                                    needSelect: true,
                                },
                             /*   {
                                    iconCls: 'set_icon_cls',
                                    text: '设置',
                                    id: 'toolbar_set_dial_count',
                                    disabled: true,
                                    needSelect: true,
                                },*/

                                {
                                    iconCls: 'delete_icon_cls',
                                    text: '删除',
                                    id: 'toolbar_delete_dial_count',
                                    disabled: true,
                                    needSelect: true,
                                },
                                {
                                    iconCls: 'add_icon_cls',
                                    text:'添加',
                                    id: 'toolbar_add_dial_count',
                                    disabled:false,
                                },
                            ]
                        }
                    ],
                    columns:[
                        {
                            dataIndex:'_id',
                            width: 50,
                            align: 'center',
                            header: '号码',
                            renderer:function (obj) {
                                number=obj;
                                return obj;
                            }
                        },
                        {
                            dataIndex: 'callCount',
                            width:90,
                            align:'center',
                            header:'平台拨打次数',
                            renderer:function (obj) {
                                count=obj;
                                return obj;
                            }
                        },
                        {
                            dataIndex: 'residualCount',
                            width:90,
                            align:'center',
                            header:'平台剩余拨打次数',
                            renderer : this.getResidualCount
                        }
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
            this.store = App.util.AppUtil.getGridStore('bill.resource.queryDialCount', {}, 'App.model.resource.dialCount');
            this.store.loadPage(1);
        }
        return this.store;

    },
    getResidualCount:function () {
        var data="pt"+number;
        var cache = [];
        var sum;
        App.util.AppUtil.requestSync("bill.resource.queryCallSum", data, function (data) {
                cache = data.list;
            });
        if(count-cache>0){
            sum=count-cache;
        }else if(count-cache<=0){
            sum=0;
        }
        return  sum;
    }
});
var number;
var count;