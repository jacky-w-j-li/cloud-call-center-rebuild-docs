Ext.define('App.view.resource.smsChannel', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.smsChannelQueryPanel',
    requires: ['App.model.resource.SmsChannel'],
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
                        title: '短信通道查询',
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
                                xtype: 'textfield',
                                fieldLabel: '名称',
                                name: 'name',
                                columnWidth:.25,
                            },
                            {
                                xtype: 'combobox',
                                fieldLabel: '类型',
                                name:'type',
                                editable:true,
                                store: this.getSmsChannelTypeStore(),
                                displayField: 'codeName',
                                valueField: 'codeValue',
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
                    title: '通道列表',
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
                                    id: 'toolbar_update_sms_channel',
                                    disabled: true,
                                    needSelect: true,
                                },
                                {
                                    iconCls: 'delete_icon_cls',
                                    text: '删除',
                                    id: 'toolbar_delete_sms_channel',
                                    disabled: true,
                                    needSelect: true,
                                },
                                {
                                    iconCls: 'add_icon_cls',
                                    text:'添加',
                                    id: 'toolbar_add_sms_channel',
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
                            header: '编号',
                        },
                        {
                            dataIndex: 'name',
                            width:90,
                            align:'center',
                            header:'名称',
                        },
                        {
                            dataIndex: 'type',
                            width:50,
                            align: 'center',
                            header: '类型',
                            renderer: function(value){
                                if(!value){
                                    return '';
                                }
                                return App.util.AppUtil.getRendererValue(value,'smsChannelType');
                            }
                        },
                        {
                            dataIndex: 'price',
                            header: '成本(元/条)',
                            align: 'center',
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
            this.store = App.util.AppUtil.getGridStore('bill.resource.querySmsChannel', {}, 'App.model.resource.SmsChannel');
            this.store.loadPage(1);
        }
        return this.store;

    },
    getSmsChannelTypeStore: function(){
        return App.util.AppUtil.getDicStore('smsChannelType');
    }
});

























