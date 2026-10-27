Ext.define('App.view.account.account.intlFeeEdit',{
    extend: 'Ext.window.Window',
    alias: 'widget.intlFeeEdit',
    width: 850,
    layout: {
        type: 'column',
    },
    modal: true,
    title: '编辑国际长途资费设置',
    record:null,
    line:null,
    codes:null,
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
                            title: '国际长途资费设置',
                            id: 'cust_fee_set',
                            collapsible: false,
                            defaultType: 'textfield',
                            layout: 'column',
                            cls: 'background_blue',
                            items:[
                                {
                                    decimalPrecision: 4,
                                    fieldLabel: '区域代码',
                                    value: this.getFieldValue("code"),
                                    name: 'code',
                                    columnWidth: .333,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    allowBlank: false,
                                    listeners:{
                                        blur:function(obj){
                                            var newValue = obj.getValue();
                                            var win = obj.up('window');
                                            var price = win.down('numberfield[name="price"]');
                                            var line = win.line;
                                            var editMode = win.editMode;
                                            var codes = win.codes;

                                            App.util.AppUtil.request('bill.resource.findIntl', {code:newValue,line:line}, function (data, self) {
                                                var intl;
                                                if(data.success){
                                                   intl = (data.list || [])[0];
                                                }
                                                if(codes && codes.indexOf(newValue) != -1){
                                                    Ext.MessageBox.alert('错误', '区域代码已添加!');
                                                    obj.setValue(null);
                                                    return;
                                                }

                                                if(intl){
                                                    Ext.MessageBox.confirm('确认', '确认'+ (editMode == 'addNew'?'添加':'更新') + '国际长途目的地 ' + intl.dest +' 吗?', function(btn){
                                                        if(btn != 'yes'){
                                                            obj.setValue(null);
                                                        }else{
                                                            if(!price.getValue()){
                                                                price.setValue(intl.priceWithTax / 10000);
                                                            }
                                                        }
                                                    });
                                                }else{
                                                    Ext.MessageBox.alert('错误', '未找到区域代码!',function(){
                                                        obj.setValue(null);
                                                        price.setValue(null);
                                                    });
                                                }
                                            });
                                        }
                                    }
                                },
                                {
                                    decimalPrecision: 4,
                                    fieldLabel: '价格(元)',
                                    value: this.getFieldValue("price"),
                                    name: 'price',
                                    columnWidth: .333,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    allowBlank: false,
                                    xtype:'numberfield',
                                },
                                {
                                    fieldLabel: '备注',
                                    value: this.getFieldValue("memo"),
                                    name: 'memo',
                                    columnWidth:.333,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    xtype: 'textfield',
                                }
                            ]
                        }
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