Ext.define('App.view.account.account.custFeeEdit',{
    extend: 'Ext.window.Window',
    alias: 'widget.custFeeEdit',
    width: 850,
    layout: {
        type: 'column',
    },
    modal: true,
    title: '编辑自定义扣费',
    record:null,
    editMode:'addNew',
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
                    items: [
                        {
                            xtype: 'fieldset',
                            title: '自定义扣费设置',
                            id: 'cust_fee_set',
                            collapsible: false,
                            defaultType: 'textfield',
                            layout: 'column',
                            cls: 'background_blue',
                            items: [
                                {
                                    decimalPrecision: 4,
                                    fieldLabel: '名称',
                                    value: this.getFieldValue("name"),
                                    name: 'name',
                                    columnWidth: .5,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    allowBlank: false,
                                },
                                {
                                    xtype: 'combobox',
                                    fieldLabel: '计价周期',
                                    name:'pricePeriod',
                                    editable:false,
                                    store: App.util.AppUtil.getDicStore('custFeePricePeriod'),
                                    value: this.getFieldValue('pricePeriod'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    columnWidth:.5,
                                    labelWidth: 150,
                                    msgTarget:'side',
                                    allowBlank:false,
                                },
                                {
                                    decimalPrecision: 4,
                                    fieldLabel: '单价(元)',
                                    value: this.getFieldValue("price"),
                                    name: 'price',
                                    columnWidth: .5,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    allowBlank: false,
                                    xtype:'numberfield',
                                },
                                {
                                    xtype: 'checkbox',
                                    fieldLabel: '是否自动续费',
                                    checked: this.getFieldValue('autoRenew'),
                                    columnWidth: .5,
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    name: 'autoRenew',
                                },
                                {
                                    fieldLabel: '备注',
                                    name: 'memo',
                                    value: this.getFieldValue('memo'),
                                    xtype: 'textarea',
                                    columnWidth: .5,
                                    labelAlign: 'right',
                                    labelWidth: 150,
                                }
                            ],
                        },
                    ],
                }
            ],
            buttons: [
                {
                    text: this.editMode=='addNew'?'添加':'更新',
                    id: 'commit_button',
                },
                {
                    text:'关闭',
                    id:'close',
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
            return null;
        }
        return this.record.get(fieldName);
    },
    updateRecord:function(){
        var form = this.down('form');
        var record = this.record;
        if(record.get('state') != 'stop'){
            App.util.AppUtil.msg("非停用状态下的扣费不允许更新!");
            return false;
        }

        form.getForm().getFields().each(function(field){
            var fieldName = field.getName();
            var fieldVal = field.getValue();

            record.set(fieldName,fieldVal);
        });

        record.commit();

        return true;
    },
    getRecord:function(){
        var form = this.down('form');
        var record = {};

        form.getForm().getFields().each(function(field){
            var fieldName = field.getName();
            var fieldVal = field.getValue();

            record[fieldName] = fieldVal;
        });
        return record;
    },
});