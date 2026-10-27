Ext.define('App.view.resource.intl.edit',{
    extend: 'Ext.window.Window',
    alias: 'widget.editIntl',
    width: 850,
    layout: {
        type: 'column',
    },
    modal: true,
    title: '编辑国际长途',
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
                            title: '国际长途信息',
                            id: 'intl_info',
                            collapsible: false,
                            defaultType: 'textfield',
                            layout:'column',
                            cls: 'background_blue',
                            items: [
                                {
                                    fieldLabel:'编号',
                                    name:'_id',
                                    value: this.getFieldValue("_id"),
                                    columnWidth:.5,
                                    readOnly : true,
                                    hidden : this.editMode == 'addNew',
                                },
                                {
                                    xtype: 'combobox',
                                    fieldLabel: '线路',
                                    name:'line',
                                    editable:true,
                                    store: App.util.AppUtil.getDicStore('line',true,{line_type:"international"}),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    columnWidth:.5,
                                    value: this.getFieldValue('line'),
                                    allowBlank: false,
                                    readOnly : this.editMode != 'addNew',
                                },
                                {
                                    fieldLabel:'区域代码',
                                    name:'code',
                                    maxLength: 50,
                                    columnWidth: .5,
                                    value: this.getFieldValue("code"),
                                    allowBlank: false,
                                    readOnly : this.editMode != 'addNew',
                                },
                                {
                                    fieldLabel:'目的地',
                                    name:'dest',
                                    maxLength: 50,
                                    columnWidth: .5,
                                    value: this.getFieldValue("dest"),
                                    allowBlank: false
                                },
                                {
                                    xtype:'numberfield',
                                    fieldLabel:'不含税价(元)',
                                    value: this.getFieldValue('price')/10000,
                                    name: 'price',
                                    minValue: 0,
                                    maxValue: 100,
                                    columnWidth:.5,
                                    decimalPrecision: 4,
                                    allowBlank: false,
                                },
                                {
                                    xtype:'numberfield',
                                    fieldLabel:'含税价(元)',
                                    value: this.getFieldValue('priceWithTax')/10000,
                                    name: 'priceWithTax',
                                    minValue: 0,
                                    maxValue: 100,
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