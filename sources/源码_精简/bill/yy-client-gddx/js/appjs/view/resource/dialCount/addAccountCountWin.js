Ext.define('App.view.resource.dialCount.addAccountCountWin', {
    extend: 'Ext.window.Window',
    requires: ['App.model.resource.dialCountSet'],
    alias: 'widget.addAccountCountWin',
    height: 500,
    width: 800,
    title: '账户拨号限制',
    autoScroll: true,
    account: null,
    data: {},
    store: null,
    initComponent: function () {

        var me = this;
        Ext.applyIf(me, {
            modal: true,
                        items: [{
                            xtype:'form',
                            frame: true ,
                            class: 'query',
                            title: '',
                            fieldDefaults: {
                                msgTarget: 'side',
                                labelWidth: 80,
                                labelAlign: 'right',
                            },

                            items: [{

                                xtype: 'gridpanel',
                                margin: '10 ',
                                id: 'account_count_query_grid',
                                loadMask: true, //添加覆盖遮罩
                                class: 'query',
                                forceFit: true, //自动填充宽度
                                store: this.getDataStore(this.account.get('_id')),
                                columnLines: true,
                                dockedItems: [
                                    {
                                        xtype: 'toolbar',
                                        class: 'dock',
                                        items: [
                                            {
                                                iconCls: 'add_icon_cls',
                                                text: '添加账户限制',
                                                id: 'btn_show_add_account_count',
                                                needSelect: false,
                                            },
                                            {
                                                iconCls: 'edit_icon_cls',
                                                text: '修改账户限制',
                                                id: 'btn_show_update_account_count',
                                                disabled: true,
                                                needSelect: true
                                            },
                                            {
                                                iconCls: 'delete_icon_cls',
                                                text: '删除账户限制',
                                                id: 'btn_delete_account_count',
                                                value: this.account.get('_id'),
                                                disabled: true,
                                                needSelect: true
                                            }
                                        ]
                                    }
                                ],
                                columns: [
                                    {
                                        name: '_id',
                                        value: this.account.get('_id'),
                                        hidden: true
                                    },

                                    {
                                        dataIndex: '_NIndex',
                                        align: 'center',
                                        hidden: true
                                    },

                                    {
                                        dataIndex: 'name',
                                        align: 'center',
                                        header: '账户编号',
                                    },
                                    {
                                        dataIndex: 'companyName',
                                        align: 'center',
                                        header: '公司名称'
                                    },
                                    {
                                        dataIndex: 'accountCount',
                                        align: 'center',
                                        header: '拨号次数'
                                    },
                                    {
                                        dataIndex: 'accountResidualCount',
                                        align: 'center',
                                        header: '剩余拨号次数'
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
                            }]
                        }
                        ]
        });
        me.callParent(arguments);
    },
    getDataStore :function(_id){

    if (this.store === null) {
        this.store = App.util.AppUtil.getGridStore('bill.resource.queryAccountCount', {_id:_id}, 'App.model.resource.dialCountSet');
        this.store.loadPage(1);
    }
    return this.store;
},


});
