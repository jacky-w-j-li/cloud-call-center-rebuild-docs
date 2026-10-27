Ext.define('App.view.account.groupAccount.add', {
    extend: 'Ext.window.Window',
    alias: 'widget.addGroupAccountWindow',
    width: 500,
    layout: {
        type: 'column'
    },
    modal: true,
    title: '新增集团账户',
    initComponent: function () {
        var me = this;
        var addHandler = function(){
            var fieldcontainer = {
                xtype: 'fieldcontainer',
                fieldLabel: '集团账户',
                labelWidth: 80,
                layout: 'hbox',
                items: [
                    {
                        xtype: 'textfield',
                        width:150,
                        allowBlank: false
                    },
                    {
                        xtype: 'splitter'
                    },
                    {
                        xtype: 'button',
                        width:22,
                        iconCls: 'add_icon_cls',
                        listeners :  {
                            click: function() {
                                var form = me.down('form');
                                form.add(addHandler());
                                form.doLayout();
                            }
                        }
                    },
                    {
                        xtype: 'splitter'
                    },
                    {
                        xtype: 'button',
                        width:22,
                        iconCls: 'delete_icon_cls',
                        listeners :  {
                            click: function() {
                                var form = me.down('form');
                                form.remove(this.up('fieldcontainer'));
                                form.doLayout();
                            }
                        }
                    }
                ]
            };
            return fieldcontainer;
        };
        Ext.applyIf(me, {
            items: [
                {
                    xtype: 'form',
                    frame: true,
                    title: '',
                    width:'100%',
                    height:300,
                    layout: 'anchor',
                    autoScroll : true,
                    bodyStyle: 'overflow-x:hidden; overflow-y:scroll; padding:2px 2px 0',
                    fieldDefaults: {
                        msgTarget: 'side',
                        labelWidth: 80,
                        labelAlign: 'right'
                    },
                    items: [
                        {
                            fieldLabel: '备注',
                            name: 'memo',
                            xtype: 'textarea',
                            columnWidth: 1
                        },
                        {
                            xtype: 'fieldcontainer',
                            fieldLabel: '集团账户',
                            labelWidth: 80,
                            layout: 'hbox',
                            items: [
                                {
                                    xtype: 'textfield',
                                    width:150,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'splitter'
                                },
                                {
                                    xtype: 'button',
                                    width:22,
                                    iconCls: 'add_icon_cls',
                                    listeners :  {
                                        click: function() {
                                            var form = me.down('form');
                                            form.add(addHandler());
                                            form.doLayout();
                                        }
                                    }
                                },
                                {
                                    xtype: 'splitter'
                                },
                                {
                                    xtype: 'button',
                                    width:22,
                                    iconCls: 'delete_icon_cls',
                                    listeners :  {
                                        click: function() {
                                            var form = me.down('form');
                                            form.remove(this.up('fieldcontainer'));
                                            form.doLayout();
                                        }
                                    }
                                }

                            ]
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: '创建',
                    id: 'commit_button'
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
    }


});