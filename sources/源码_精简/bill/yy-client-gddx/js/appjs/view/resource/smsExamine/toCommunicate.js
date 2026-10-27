Ext.define('App.view.resource.smsExamine.toCommunicate', {
    extend: 'Ext.window.Window',
    requires: ['App.model.resource.toCommunicate'],
    alias: 'widget.toCommunicate',
    height: 500,
    width: 800,
    title: '沟通列表',
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
                                                text: '添加沟通',
                                                id: 'btn_show_add_count',
                                                needSelect: false,
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
                                        dataIndex: 'from',
                                        align: 'center',
                                        header: '名称',
                                    },
                                    {
                                        dataIndex: 'content',
                                        align: 'center',
                                        header: '内容'
                                    },
                                    {
                                        dataIndex: 'time',
                                        align: 'center',
                                        header: '时间'
                                    }
                                ]

                            }]
                        }
                        ]
        });
        me.callParent(arguments);
    },
    getDataStore :function(_id){

    if (this.store === null) {
        this.store = App.util.AppUtil.getGridStore('bill.resource.querySmsExamineMessages', {_id:_id}, 'App.model.resource.toCommunicate');
        this.store.loadPage(1);
    }
    return this.store;
}


});
