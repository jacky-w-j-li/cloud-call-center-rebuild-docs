Ext.define('App.view.resource.serviceNumWhiteList.edit',{
    extend: 'Ext.window.Window',
    alias: 'widget.editServiceNumWhiteList',
    width: 850,
    layout: {
        type: 'column',
    },
    modal: true,
    title: '编辑白名单号段信息',
    record:null,
    editMode:'addNew',
    initComponent: function(){
        Ext.applyIf(this,{
            items:[
                {
                    xtype: 'form',
                    frame: true,
                    title: '',
                    bodyStyle: 'padding:2px 2px 0',
                    fieldDefaults: {
                        msgTarget: 'side',
                        labelWidth: 160,
                        labelAlign: 'right',
                    },
                    items:[
                        {
                            xtype:'fieldset',
                            title: '号码段信息',
                            id: 'serviceNumWhiteList_info',
                            collapsible: false,
                            defaultType: 'textfield',
                            layout:'column',
                            cls: 'background_blue',
                            items: [
                                {
                                    fieldLabel:'号码段',
                                    name:'_id',
                                    value: this.getFieldValue("_id"),
                                    columnWidth:.5,
                                    minLength:10,
                                    regex:/^\d+$/,
                                    regexText:'请填写纯数字',
                                    readOnly : this.editMode != 'addNew',
                                    allowBlank: false,
                                },
                                {
                                    xtype: 'combobox',
                                    fieldLabel: '运营商',
                                    name:'operator',
                                    editable:true,
                                    store: App.util.AppUtil.getDicStore('operator'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    columnWidth:.5,
                                    value: this.getFieldValue('operator'),
                                    allowBlank: false,
                                },
                                {
                                    fieldLabel: '备注',
                                    name: 'memo',
                                    xtype: 'textarea',
                                    value: this.getFieldValue('memo'),
                                    columnWidth: 1
                                },
                            ],
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: this.editMode=='addNew'?'添加':'更新',
                    id: 'commit_button',
                },
                {
                    text:'关闭',
                    handler: function(obj){
                        var win = obj.up('window');
                        win.close();
                    }
                }
            ]
        });
        this.callParent(arguments);
    },
    getFieldValue:function(fieldName){
        if(!this.record){
            return '';
        }
        return this.record.get(fieldName);
    }
});