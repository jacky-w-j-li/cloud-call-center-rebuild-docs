/**
 * Created by apple on 15/8/17.
 */
Ext.define('App.view.resource.approveServiceNum', {
    extend: 'Ext.panel.Panel',
    requires: ['App.model.resource.ApproveServiceNum'],
    alias: 'widget.approveServiceNumWin',
    title: '服务号审核',
    store:null,
    autoScroll : false,
    layout: {
        type: 'anchor'
    },
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
                            title: '账户查询',
                            id:'approve_query_field',
                            collapsible: true,
                            layout: 'column',
                            defaultType: 'textfield',
                            items: [
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '账户编号',
                                    name: 'account',
                                    columnWidth: .3
                                },
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '服务号',
                                    name: 'serviceno',
                                    columnWidth: .3
                                },
                                {
                                    xtype: 'textfield',
                                    xtype: 'combobox',
                                    fieldLabel: '服务号状态',
                                    name: 'type',
                                    columnWidth: .3,
                                    store :type,
                                    editable : true,
                                    triggerAction:'all',
                                    valueField : 'abbr',
                                    displayField : 'name',
                                    value: type.data.first()
                                },
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
                                }
                            ]
                        }
                    ]
                },
                {
                    xtype: 'gridpanel',
                    title: '审核列表',
                    margin: '10 ',
                    class: 'query',
                    id:'serviceNum_query_grid',
                    forceFit: true,
                    loadMask: true,
                    store: this.getDataStore(),
                    columnLines: true,
                    dockedItems: [
                        {
                            xtype: 'toolbar',
                            class: 'dock',
                            autoScroll:true,
                            items: [
                                {
                                    xtype: 'buttongroup',
                                    columns: 13,
                                    floatable:true,
                                    defaults: {
                                        scale: 'small'
                                    },
                                    style:{width:'100%'},
                                    items:[
                                        {
                                            iconCls: 'add_icon_cls',
                                            text: '通过',
                                            id: 'serviceNum_pass_update',
                                            disabled: true,
                                            needSelect: true
                                        },
                                        {
                                            iconCls: 'delete_icon_cls',
                                            text: '不通过',
                                            id: 'serviceNum_unpass_update',
                                            disabled: true,
                                            needSelect: true
                                        }
                                    ]
                                }

                            ]
                        }
                    ],

                    columns: [
                        {
                            dataIndex: 'account',
                            width: 180,
                            align: 'center',
                            header: '账户编号'
                        },
                        {
                            dataIndex: 'serviceno',
                            width: 180,
                            align: 'center',
                            header: '服务号'
                        },
                        {
                            dataIndex: 'product',
                            width: 180,
                            align: 'center',
                            header: '产品',
                            renderer: function(value){
                                return App.util.AppUtil.getRendererValue(value, 'productType');
                            }
                        },
                        {
                            dataIndex: 'createTime',
                            header: '申请时间',
                            align: 'center',
                            width: 180
                        },
                        {
                            dataIndex: 'type',
                            header: '状态',
                            align: 'center',
                            width: 180,
                            renderer: function(value){
                                return App.util.AppUtil.getRendererValue(value, 'approve');
                            }
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

    getDataStore:function(){
        if (this.store === null) {
            this.store = App.util.AppUtil.getGridStore('app.account.findServiceNumApprove',{type:'verify'},
                'App.model.resource.ApproveServiceNum');
            this.store.loadPage(1);
        }
        return this.store;
    }
});
var type = Ext.create('Ext.data.Store', {
    fields: ['abbr', 'name'],
    data: [
        {"abbr": "verify", "name": "待审核"},
        {"abbr": "pass", "name": "已通过"},
        {"abbr": "unpass", "name": "未通过"}

    ]
});
