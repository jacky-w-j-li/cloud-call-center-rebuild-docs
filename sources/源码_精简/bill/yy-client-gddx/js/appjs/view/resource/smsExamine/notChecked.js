Ext.define('App.view.resource.smsExamine.notChecked',{
    extend: 'Ext.window.Window',
    alias: 'widget.notCheckedWin',
    width: 850,
    layout: {
        type: 'anchor'
    },
    modal: true,
    title: '不通过审核',
    record:null,
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
                        labelWidth: 90,
                        labelAlign: 'right',
                    },
                    items:[
                        {
                            xtype:'fieldset',
                            title: '短信',
                            id: 'sms_channel_info',
                            collapsible: true,
                            defaultType: 'textfield',
                            layout:'column',
                            cls: 'background_blue',
                            items: [
                                {
                                    fieldLabel:'工单编号',
                                    name:'_id',
                                    value: this.getFieldValue("_id"),
                                    columnWidth:.45,
                                    readOnly : true
                                },
                                {
                                    fieldLabel:'名称',
                                    name:'name',
                                    maxLength: 50,
                                    columnWidth: .45,
                                    value: this.getFieldValue("name"),
                                    readOnly : true
                                },
                                {  fieldLabel:'短信内容',
                                    name:'content',
                                    xtype: 'textarea',
                                    value: this.getFieldValue("content"),
                                    columnWidth:.9,
                                    readOnly : true
                                },
                                {
                                    fieldLabel: '未通过审核原因',
                                    name: 'messages',
                                    allowBlank: false,
                                    xtype: 'textarea',
                                    columnWidth: .9
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
                    text:'不通过',
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