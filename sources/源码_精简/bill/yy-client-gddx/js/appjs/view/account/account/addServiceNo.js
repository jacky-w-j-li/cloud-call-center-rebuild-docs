Ext.define('App.view.account.account.addServiceNo', {
    extend: 'Ext.window.Window',
    alias: 'widget.addServiceNoWin',
    width: 800,
    layout: {
        type: 'anchor'
    },
    modal: true,
    title: '选择服务号',
    store:null,
    accountId:null,
    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            items: [
                {
                    xtype: 'panel',
                    frame: true,
                    border:false,
                    items: this.getItems()
                }
            ],
            buttons: [
                {
                    text: '选中',
                    id: 'serviceno_select_button',
                    disabled: true,
                    needSelect: true
                },
                {
                    text: '关闭',
                    handler: function (obj) {
                        var win = obj.up('window');
                        win.close();
                    }
                }
            ]
        });
        me.callParent(arguments);
    },
    getItems:function(){
        var items=[];
        var form={
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
                        title: '服务号查询',
                        collapsible: true,
                        layout: 'column',
                        defaultType: 'textfield',
                        items: [
                            {
                                name: 'status',
                                value:'free',
                                hidden:true
                            },
                            {
                                fieldLabel: '服务号码',
                                name: '_id',
                                columnWidth: .33
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
                            }
                        ]
                    }
                ]
            };
        items.push(form);
        var grid= {
            xtype: 'gridpanel',
            title: '服务号列表',
            margin: '10 ',
            class: 'query',
            forceFit: true,
            loadMask: true,
            store: this.getDataStore(),
            columnLines: true,
            columns: [
                {
                    dataIndex: '_id',
                    width: 120,
                    align: 'center',
                    header: '服务号码'
                },
                {
                    dataIndex: 'monthRent',
                    header: '月租',
                    align: 'center'
                },
                {
                    dataIndex: 'memo',
                    width: 90,
                    align: 'center',
                    header: '备注'
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

        };
        items.push(grid);
        return items;
    },
    getDataStore: function () {
        if (this.store === null) {
            this.store = App.util.AppUtil.getGridStore('bill.account.queryNormalServiceNoList', {status:'free'}, 'App.model.account.ServiceNo');
            this.store.loadPage(1);
        }
        return this.store;
    }

});