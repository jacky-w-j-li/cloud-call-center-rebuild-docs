Ext.define('App.view.system.systemUser.payee', {
    extend: 'Ext.window.Window',
    requires: ['App.model.system.Payee'],
    alias: 'widget.payeeWin',
    width: 850,
    height:300,
    title: '收款人信息管理',
    autoScroll: true,
    payeeStore: null,
    data:null,
    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            modal: true,
            items: this.getItems()
        });
        me.callParent(arguments);
    },
    getItems: function () {
        var items = new Array();
        var grid={
            xtype: 'grid',
            class:'query',
            forceFit: true,
            columnLines: true,
            margin: '0 0 10 0',
            columnWidth: .99,
            store: this.getPayeeStore(),
            dockedItems: [
                {
                    xtype: 'toolbar',
                    class: 'dock',
                    items: [
                        {
                            iconCls: 'set_icon_cls',
                            text: '选中',
                            id: 'payee_select_tool',
                            disabled: true,
                            needSelect: true
                        }
                    ]
                }
            ],
            columns: [
                {
                    hidden:true,
                    dataIndex: '_id'
                },
                {
                    header: '户名',
                    dataIndex: 'cardName',
                    align: 'center'
                },
                {
                    header: '地址',
                    dataIndex: 'address',
                    align: 'center'
                },
                {
                    header: '开户行',
                    dataIndex: 'bank',
                    align: 'center'
                },
                {
                    header: '账号',
                    align: 'center',
                    dataIndex: 'cardNo'
                },
                {
                    header: '创建时间',
                    align: 'center',
                    dataIndex: 'createTime'
                }

            ]
        };
        items.push(grid);
        return items;
    },
    getPayeeStore: function () {
        if (!this.payeeStore) {
            this.payeeStore = Ext.create('Ext.data.Store', {
                model: 'App.model.system.Payee',
                data: this.data
            });
        }
        return this.payeeStore;
    }
});