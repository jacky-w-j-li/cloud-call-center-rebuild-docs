Ext.define('App.view.resource.dialCount.add',{
    extend: 'Ext.window.Window',
    alias: 'widget.addDialCount',
    width: 340,
    layout: {
        type: 'anchor'
    },
    modal: true,
    title: '',
    record:null,
    editMode:'addNew',
    initComponent: function(){
        Ext.applyIf(this,{
            items:[
                {
                    xtype: 'form',
                    frame: true,
                    id:'form',
                    title: this.editMode=='addNew'?'添加拨号计数':'编辑拨号计数',
                    bodyStyle: 'padding:2px 2px 0',
                    fieldDefaults: {
                        msgTarget: 'side',
                        labelWidth: 90,
                        labelAlign: 'right',
                    },
                    items:[
                        {
                            xtype:'fieldset',
                            title: '拨号计数',
                            id: 'sms_channel_info',
                            collapsible: false,
                            defaultType: 'textfield',
                           // layout:'column',
                            bodyStyle: 'padding:2px 2px 0',
                            fieldDefaults: {
                                msgTarget: 'side',
                                labelWidth: 90,
                                labelAlign: 'right',
                            },
                            cls: 'background_blue',
                            items: [
                                {
                                    fieldLabel:'号码',
                                    name:'_id',
                                    value: this.getFieldValue("_id"),
                                    allowBlank:false,
                                    columnWidth:.5,
                                    text:this.editMode=='addNew'?false:true,
                                    readOnly :this.editMode=='addNew'?false:true,
                                    listeners:{
                                        blur:this.chechNum
                                    }
                                },
                                {
                                    fieldLabel:'平台拨打次数',
                                    xtype: 'numberfield',
                                    name:'callCount',
                                    maxLength: 50,
                                    columnWidth: .5,
                                    value: this.getFieldValue("callCount"),
                                    allowBlank: false
                                },
                                {
                                    hidden:true,
                                    name:'_id',
                                    value: this.getFieldValue('_id')
                                },
                            ]
                        }
                    ]
                }
            ],
            buttons: [
            {
                text: this.editMode=='addNew'?'添加':'更新',
                id: 'commit_button_dial',
            },
                {
                    text: '关闭',
                    handler: function (obj) {
                        var win = obj.up('window');
                        win.close();
                    }
                }]

        });
        this.callParent(arguments);
    },
    getFieldValue:function(fieldName){
        if(!this.record){
            return '';
        }
        return this.record.get(fieldName);
    },
    chechNum:function (obj) {
        if(!obj.text){
            App.util.AppUtil.request('bill.resource.queryDialId',obj.value,function(data){
                if(data.success){
                    if(data.count.length>0){
                        App.util.AppUtil.msg('此号码已添加！');
                        Ext.getCmp('form').getForm().reset();
                    }
                }
            });

        }
    }


});