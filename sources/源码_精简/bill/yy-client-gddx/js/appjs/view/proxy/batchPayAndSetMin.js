Ext.define('App.view.proxy.batchPayAndSetMin', {
    extend: 'Ext.panel.Panel',
    requires: ['App.model.proxy.BatchPay'],
    alias: 'widget.batchPayAndSetMinPanel',
    title: '批量充值和设置低消',
    store:null,
    autoScroll : false,
    layout: {
        type: 'anchor'
    },
    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            modal: true,
            items: [
                {
                    xtype: 'tabpanel',
                    activeTab: 0,
                    items: [
                        {
                            xtype: 'panel',
                            frame: true,
                            id: 'batch_pay_panel',
                            title: '批量充值',
                            items: this.getBatchPayItems()
                        },
                        {
                            xtype: 'panel',
                            frame: true,
                            id: 'batch_set_minConsume_panel',
                            title: '批量设置低消',
                            item:[],
                            hidden:App.util.AppUtil.hasLimit("proxy_batchSetMin")
                        }
                    ]
                }
            ]
        });
        me.callParent(arguments);
    },
    getBatchPayItems:function(){
        var items = new Array();
        var form =
        {
            xtype: 'form',
            frame: true,
            title: '',
            class:'query',
            bodyStyle: 'padding:2px 2px 0',
            fieldDefaults: {
                msgTarget: 'side',
                labelWidth: 80,
                labelAlign: 'right'
            },
            items: [
                {
                    xtype: 'fieldset',
                    title: '下属账户查询',
                    id:'batch_pay_query_fieldset',
                    collapsible: true,
                    class:'query',
                    layout: 'column',
                    defaultType: 'textfield',
                    items: [
                        {
                            fieldLabel: '账户编号',
                            labelWidth: 80,
                            xtype: 'textfield',
                            name: 'beginNum',
                            columnWidth: .24
                        },
                        {
                            xtype: 'label',
                            text: '至',
                            columnWidth: .02
                        },
                        {
                            xtype: 'textfield',
                            name: 'endNum',
                            hideLabel: true,
                            columnWidth: .16
                        },
                        {
                            fieldLabel: '低消费用(元)',
                            labelWidth: 80,
                            xtype: 'textfield',
                            name: 'beginCost',
                            columnWidth: .24
                        },
                        {
                            xtype: 'label',
                            text: '至',
                            columnWidth: .02
                        },
                        {
                            xtype: 'textfield',
                            name: 'endCost',
                            hideLabel: true,
                            columnWidth: .16
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
                            id:'batch_pay_query_btn',
                            width: 90,
                            text: '查询'
                        },
                        {
                            xtype: 'button',
                            id:'batch_pay_reset_btn',
                            class:'reset',
                            width: 90,
                            text: '重置'
                        }

                    ]
                }
            ]
        };
        items.push(form);

        var selModel = Ext.create('Ext.selection.CheckboxModel',{
            checkOnly:true,
            mode:'multi',//multi,simple,single；默认为多选multi
            listeners: {
                selectionchange: function(sm, selections) {
                    grid.down('#show_edit_money_tool').setDisabled(selections.length == 0);
                }
            }
        });
        var cellEditing = Ext.create('Ext.grid.plugin.CellEditing', {
            clicksToEdit: 1,
            listeners : {
                edit : function(editor,obj) {
                },
                beforeedit : function(obj,opt) {
                    if(obj.field != 'money'){
                        return false;
                    }else{
                        var model = grid.getSelectionModel();
                        var rows = model.getSelection();
                        rows.push(obj.record);
                        model.select(rows);//传入的是record整行
                    }
                }
            }
        });
        var grid =Ext.create('Ext.grid.Panel',{
            autoScroll : true,
            margin:'10 0 0 0',
            height:300,
            title:'账户列表',
            selModel:selModel,
            selType: 'checkboxmodel',
            id:'batch_pay_grid',
            forceFit: true,
            loadMask: true,
            store: this.getDataStore(),
            columnLines: true,
            plugins: [cellEditing],
            dockedItems: [
                {
                    xtype: 'toolbar',
                    class: 'dock',
                    items: [
                        {
                            iconCls: 'edit_icon_cls',
                            text: '修改',
                            disabled: true,
                            id: 'show_edit_money_tool'
                        },
                        {
                            xtype:"tbtext",
                            text:"注意：点击充值金额单元格对单个账户编辑"
                        }

                    ]
                },
                {
                    xtype: 'toolbar',
                    dock: 'bottom',
                    ui: 'footer',
                    layout: {
                        pack: 'center'
                    },
                    items: [{
                        xtype: 'button',
                        minWidth: 80,
                        id:"batch_pay_button",
                        text: '充值'
                    },{
                        xtype: 'button',
                        minWidth: 80,
                        id:"batch_pay_reset_button",
                        text: '重置'
                    }]
                }
            ],
            columns: [
                {header: '账户编号', dataIndex: 'account', flex: 1},
                {header: '账户名称', dataIndex: 'name', flex: 1},
                {header: '公司名称', dataIndex: 'companyName', flex: 1},
                {header: '账户余额(元)', dataIndex: 'balance', flex: 1},
                {header: '低消(元)', dataIndex: 'minConsume', flex: 1},
                {
                    header: '充值金额(元)',
                    flex:1,
                    dataIndex: 'money',
                    editor: {
                        xtype: 'numberfield',
                        minValue: 0,
                        allowBlank: false
                    }
                }
            ]
        });
        items.push(grid);

        return items;
    },

    getDataStore:function(){
        if (this.store === null) {
            this.store = App.util.AppUtil.getGridStore('bill.proxy.queryProxyAccInfo',
                {product: 'cc'}, 'App.model.proxy.BatchPay');
            this.store.load();
        }
        return this.store;
    }

});
