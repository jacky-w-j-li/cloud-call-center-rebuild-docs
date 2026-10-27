Ext.define('App.view.resource.smsChannel.edit',{
    extend: 'Ext.window.Window',
    alias: 'widget.editSmsChannel',
    width: 850,
    layout: {
        type: 'column',
    },
    modal: true,
    title: '编辑短信通道',
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
                            title: '通道信息',
                            id: 'sms_channel_info',
                            collapsible: false,
                            defaultType: 'textfield',
                            layout:'column',
                            cls: 'background_blue',
                            items: [
                                {
                                    fieldLabel:'编号',
                                    name:'_id',
                                    value: this.getFieldValue("_id"),
                                    allowBlank:false,
                                    columnWidth:.5,
                                    readOnly : this.editMode != 'addNew',
                                },
                                {
                                    fieldLabel:'名称',
                                    name:'name',
                                    maxLength: 50,
                                    maxLengthText: '最大长度不能超过50个字符！',
                                    columnWidth: .5,
                                    value: this.getFieldValue("name"),
                                    allowBlank: false
                                },
                                {
                                    xtype: 'combobox',
                                    fieldLabel: '类型',
                                    name:'type',
                                    editable:true,
                                    store: this.getSmsChannelTypeStore(),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    columnWidth:.5,
                                    value: this.getFieldValue('type'),
                                    allowBlank: false,
                                },
                                {
                                    xtype:'numberfield',
                                    fieldLabel:'价格(元/条)',
                                    value: this.getFieldValue('price')/10000,
                                    name: 'price',
                                    minValue: 0,
                                    maxValue: 10,
                                    columnWidth:.5,
                                    decimalPrecision: 4,
                                    allowBlank: false,
                                },
                                {
                                    fieldLabel: '备注',
                                    name: 'memo',
                                    xtype: 'textarea',
                                    value: this.getFieldValue('memo'),
                                    columnWidth: 1
                                },
                                {
                                    hidden:true,
                                    name:'_id',
                                    value: this.getFieldValue('_id')
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
    },
    getSmsChannelTypeStore: function(){
        return App.util.AppUtil.getDicStore('smsChannelType');
    }
});