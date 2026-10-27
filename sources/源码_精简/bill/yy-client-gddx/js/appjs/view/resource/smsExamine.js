Ext.define('App.view.resource.smsExamine', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.smsExamine',
    requires: ['App.model.resource.smsExamine'],
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
                        title: '短信审核查询',
                        collapsible: false,
                        layout: 'column',
                        defaultType: 'textfield',
                        items: [
                            {
                                xtype: 'textfield',
                                fieldLabel: '账户编号',
                                name: 'account',
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
                                fieldLabel: '通道',
                                name:'df_smsChannel',
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
                    title: '短信列表',
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
                                    iconCls: 'turnUsing_icon_cls',
                                    text: '通过审核',
                                    id: 'toolbar_checked_sms_examine',
                                    disabled: true,
                                    needSelect: true,
                                },
                                {
                                    iconCls: 'delete_icon_cls',
                                    text: '不通过审核',
                                    id: 'toolbar_no_checked_sms_examine',
                                    disabled: true,
                                    needSelect: true,
                                },
                                {
                                    iconCls: 'add_icon_cls',
                                    text:'交流信息',
                                    id: 'toolbar_communicate_sms_examine',
                                    disabled: true,
                                    needSelect: true
                                },
                            ]
                        }
                    ],
                    columns:[
                        {
                            dataIndex:'_id',
                            width: 80,
                            align: 'center',
                            header: '工单编号',
                        },
                        {
                            dataIndex:'account',
                            width: 80,
                            align: 'center',
                            header: '账户编号',
                        },
                        {
                            dataIndex: 'name',
                            width:50,
                            align:'center',
                            header:'名称',
                        },
                        {
                            dataIndex: 'content',
                            width:200,
                            align:'center',
                            header:'短信内容',
                        },
                        {
                            dataIndex: 'signToCheck',
                            width:50,
                            align:'center',
                            header:'签名',
                        },
                        {
                            header: '通道',
                            dataIndex: 'smsChannel',
                            width: 100,
                            renderer: function (value) {
                                value=App.util.AppUtil.getRendererValue(value, 'smsChannel');
                                if(value=='--设置为空--'){
                                    value='';
                                }
                                return value;
                            }
                        },
                        {
                            dataIndex: 'status',
                            width:50,
                            align: 'center',
                            header: '状态',
                            renderer: function(value){
                                return App.util.AppUtil.getRendererValue(value,'smsTemplateToCheckStatus');
                            }
                        },
                        {
                            dataIndex: 'templateType',
                            width:50,
                            align:'center',
                            header:'类型',
                            hidden:true
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
            this.store = App.util.AppUtil.getGridStore('bill.resource.querySmsExamine', {}, 'App.model.resource.smsExamine');
            this.store.loadPage(1);
        }
        return this.store;

    },
    getSmsChannelTypeStore: function(){
        return App.util.AppUtil.getDicStore('smsChannel');
    }
});

























