Ext.define('App.view.account.ytxSmsTemplate', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.ytxSmsTemplatePanel',
    requires: ["App.model.account.YtxSmsTemplate"],
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
                    title: '',
                    class: 'query',
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
                            title: '云通讯短信模板备案查询',
                            collapsible: true,
                            layout: 'column',
                            defaultType: 'textfield',
                            items: [
                                {
                                    xtype: 'textfield',
                                    fieldLabel: '账户编号',
                                    name: 'account',
                                    columnWidth: .25
                                },
                                {
                                    xtype:'combobox',
                                    fieldLabel: '审核状态',
                                    name:'ytxverification',
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    columnWidth: .25,
                                    store:App.util.AppUtil.getDicStore('ytxSmsTemplateAuditStatus'),
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
                    title: '备案列表',
                    margin: '10 ',
                    class: "query",
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
                                    iconCls: 'sync_icon_cls',
                                    text: '同步状态',
                                    id: 'ytxSmsTemplate_tool_sync',
                                    disabled: true,
                                    needSelect: true,
                                },
                            ]
                        }
                    ],
                    columns: [
                        {
                            dataIndex: 'account',
                            header: '账户编号',
                            align: 'center',
                        },
                        {
                            dataIndex: 'accountName',
                            header: '企业名称',
                            align: 'center',
                        },
                        {
                            dataIndex: 'name',
                            header: '模板名称',
                            align: 'center',
                        },
                        {
                            dataIndex: 'templatesign',
                            header: '签名',
                            align: 'center',
                        },
                        {
                            dataIndex: 'templatebody',
                            header: '模板内容',
                            align: 'center',
                        },
                        {
                            dataIndex: 'smsChannel',
                            header: '通道',
                            align: 'center',
                            renderer: function (value) {
                                var ytxChannel;
                                value.every(function(channel){
                                    if(channel == "ytx" || channel == "ytxyx"){
                                        ytxChannel = channel;
                                        return false;
                                    }
                                    return true;
                                });
                                if(ytxChannel){
                                    return App.util.AppUtil.getRendererValue(ytxChannel, 'smsChannel');
                                }else{
                                    return "";
                                }
                            }
                        },
                        {
                            dataIndex: 'ytxtemplateid',
                            header: '备案ID',
                            align: 'center'
                        },
                        {
                            dataIndex: 'ytxverification',
                            header: '审核状态',
                            align: 'center',
                            renderer: function (value) {
                                return App.util.AppUtil.getRendererValue(value, 'ytxSmsTemplateAuditStatus');
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
    getDataStore: function () {
        if (this.store === null) {
            this.store = App.util.AppUtil.getGridStore('bill.account.queryYtxSmsTemplate', {}, 'App.model.account.YtxSmsTemplate');
            this.store.loadPage(1);
        }
        return this.store;
    }
});