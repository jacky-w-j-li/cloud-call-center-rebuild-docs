Ext.define('App.view.system.systemUser.groupFinanceSetWin', {
    extend: 'Ext.window.Window',
    requires: [],
    alias: 'widget.groupFinanceSetWin',
    width: 340,
    layout: {
        type: 'column',
    },
    modal: true,
    eidtDefaultLineFee:false,
    title: '集团财务设置',
    record:null,
    configLineIds:null,
    initComponent: function(){
        Ext.applyIf(this,{
            items:[
                {
                    xtype: 'form',
                    frame: true,
                    title: '',
                    bodyStyle: 'padding:2px 2px 0;',
                    fieldDefaults: {
                        msgTarget: 'side',
                        labelWidth: 160,
                        labelAlign: 'right',
                    },
                    items:[
                        {
                            xtype:'fieldset',
                            title:'集团财务设置',
                            collapsible: false,
                            cls: 'background_blue',
                            items:[
                                {
                                    xtype: 'combobox',
                                    fieldLabel: '实际代理',
                                    name: 'realProxy',
                                    labelStyle: 'width:55px',
                                    editable:true,
                                    value:this.getFieldValue('realProxy'),
                                    store: App.util.AppUtil.getDicStore('proxy'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    columnWidth:.25,
                                    msgTarget:'side',
                                },
                                {
                                    xtype: 'hiddenfield',
                                    name: '_id',
                                    value: this.getFieldValue('_id'),
                                },

                            ]
                        },

                    ]
                }
            ],
            buttons: [
                {
                    text: '保存',
                    id: 'commit_button',
                },
                {
                    text:'关闭',
                    id:'close',
                    handler:function(obj){
                        obj.up('window').close();
                    }
                }
            ]
        });
        this.callParent(arguments);
    },

    getFieldValue:function(fieldName){
        if(!this.record){
            return 0;
        }
        return this.record.get(fieldName);
    },

});