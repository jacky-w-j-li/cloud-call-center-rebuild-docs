Ext.define('App.view.account.groupAccount.update', {
    extend: 'Ext.window.Window',
    alias: 'widget.updateGroupAccountWindow',
    width: 500,
    layout: {
        type: 'column'
    },
    modal: true,
    data:null,
    title: '修改集团账户关系',
    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            items: [
                {
                    xtype: 'form',
                    frame: true,
                    title: '',
                    width:'100%',
                    layout: 'anchor',
                    height:300,
                    autoScroll : true,
                    bodyStyle: 'overflow-x:hidden; overflow-y:scroll; padding:2px 2px 0',
                    fieldDefaults: {
                        msgTarget: 'side',
                        labelWidth: 80,
                        labelAlign: 'right'
                    },
                    items:this.getItems(me)
                }
            ],
            buttons: [
                {
                    text: '修改',
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
    },

    addHandler : function(me){
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
                            form.add(me.addHandler(me));
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
    },
    getItems:function(me){
        var items = new Array();
        var id =
        {
            fieldLabel: '',
            hidden:true,
            name: '_id',
            value:this.data._id,
            xtype: 'textfield',
            columnWidth: 1
        };
        items.push(id);

        var memo =
            {
                fieldLabel: '备注',
                name: 'memo',
                value:this.data.memo,
                xtype: 'textarea',
                columnWidth: 1
            };
        items.push(memo);

        var accountList = this.data.accountList;
        var index = 0;
        var listHandler = function(){
            if(index == accountList.length){
                return;
            }else{
                var account = accountList[index];
                var item = {
                    xtype: 'fieldcontainer',
                    fieldLabel: '集团账户',
                    labelWidth: 80,
                    layout: 'hbox',
                    items: [
                        {
                            xtype: 'textfield',
                            width:150,
                            value:account,
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
                                    form.add(me.addHandler(me));
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
                items.push(item);
                index++;
                listHandler();
            }
        };
        listHandler();
        return items;
    }


});