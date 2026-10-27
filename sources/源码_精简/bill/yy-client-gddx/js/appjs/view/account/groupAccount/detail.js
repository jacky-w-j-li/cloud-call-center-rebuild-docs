Ext.define('App.view.account.groupAccount.detail', {
    extend: 'Ext.window.Window',
    requires: ['App.model.account.GroupAccount'],
    alias: 'widget.showGroupAccountDetailWin',
    height: 300,
    width: 750,
    title: '详情',
    layout: 'fit',
    data: null,
    initComponent: function () {
        Ext.QuickTips.init();
        var me = this;
        Ext.applyIf(me, {
            modal: true,
            items: [
                {
                    xtype: 'tabpanel',
                    activeTab: 0,
                    deferredRender: false,
                    items: [
                        {
                            xtype: 'panel',
                            title: '详细信息',
                            frame: true,
                            autoScroll : true,
                            bodyStyle: 'overflow-x:scroll; overflow-y:hidden',
                            items: this.getItems()
                        }
                    ]
                }
            ]
        });
        me.callParent(arguments);
    },
    getItems: function () {
        var items = new Array();
        var fieldSet = {
            xtype: 'fieldset',
            collapsible: true,
            title: '详细信息',
            width:"100%",
            cls: 'backgroud_blue',
            defaults: {
                msgTarget: 'side',
                labelWidth: 80,
                labelAlign: 'right',
                readOnly: true
            },
            defaultType: 'displayfield',
            layout: {
                type: 'anchor'
            },
            items: [
                {
                    xtype: 'textareafield',
                    //grow: true,
                    value: this.data.accountList,
                    fieldLabel: '集团账户',
                    anchor: '80%'
                },
                {
                    xtype: 'textareafield',
                    //grow: true,
                    value: this.data.memo,
                    fieldLabel: '备注',
                    anchor: '80%'
                },
                {
                    fieldLabel: '创建时间',
                    value: this.data.createTime,
                    columnWidth: .33
                }
            ]

        }
        items.push(fieldSet);
        return items;
    }

});