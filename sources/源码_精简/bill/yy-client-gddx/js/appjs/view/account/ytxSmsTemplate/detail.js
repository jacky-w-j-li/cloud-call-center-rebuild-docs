Ext.define('App.view.account.ytxSmsTemplate.detail',{
    extend: 'Ext.window.Window',
    alias: 'widget.ytxSmsTemplateSDetail',
    width: 850,
    layout: {
        type: 'column',
    },
    modal: true,
    title: '备案详情',
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
                        labelWidth: 70,
                        labelAlign: 'right',
                    },
                    items:[
                        {
                            xtype:'fieldset',
                            title: '备案信息',
                            id: 'display_num_record_info',
                            collapsible: false,
                            defaultType: 'textfield',
                            layout:'column',
                            cls: 'background_blue',
                            defaults: {
                                msgTarget: 'side',
                                labelWidth: 80,
                                labelAlign: 'right',
                                fieldCls: 'field_disable_cls',
                                readOnly: true
                            },
                            items: [
                                {
                                    fieldLabel: '账户编号',
                                    value:this.getFieldValue("account"),
                                    columnWidth: .25
                                },
                                {
                                    fieldLabel: '企业名称',
                                    value:this.getFieldValue("accountName"),
                                    columnWidth:.25
                                },
                                {
                                    fieldLabel: '模板名称',
                                    value: this.getFieldValue("name"),
                                    columnWidth: .25
                                },
                                {
                                    fieldLabel: '签名',
                                    value: this.getFieldValue("templatesign"),
                                    columnWidth:.25,
                                },
                                {
                                    fieldLabel: '模板内容',
                                    value: this.getFieldValue("templatebody"),
                                    columnWidth:1,
                                },
                                {
                                    fieldLabel: '通道',
                                    value: function (value) {
                                        var ytxChannel;
                                        value.every(function(channel){
                                            if(channel == "ytx" || channel == "ytxyx"){
                                                ytxChannel = channel;
                                                return false;
                                            }
                                            return true;
                                        });
                                        if(ytxChannel){
                                            return App.util.AppUtil.getRendererValue(ytxChannel, 'smsChannel');
                                        }else{
                                            return "";
                                        }
                                    }(this.getFieldValue('smsChannel')),
                                    columnWidth:0.25,
                                },
                                {
                                    fieldLabel: '备案ID',
                                    value:this.getFieldValue('ytxtemplateid'),
                                    columnWidth:0.25,
                                },
                                {
                                    fieldLabel: 'APPID',
                                    value:function(value){
                                        var ytxChannel;
                                        value.every(function(channel){
                                            if(channel == "ytx" || channel == "ytxyx"){
                                                ytxChannel = channel;
                                                return false;
                                            }
                                            return true;
                                        });

                                        return {ytx:'8a216da854ff8dcc0155054e58a5091a',ytxyx:'8a216da85607361a0156075237130034'}[ytxChannel];
                                    }(this.getFieldValue('smsChannel')),
                                    columnWidth:0.5
                                },
                                {
                                    fieldLabel: '审核状态',
                                    value:App.util.AppUtil.getRendererValue(this.getFieldValue('ytxverification'), 'ytxSmsTemplateAuditStatus'),
                                    columnWidth:0.25
                                }
                            ],
                        }
                    ]
                }
            ]
        });
        this.callParent(arguments);
    },
    getFieldValue:function(fieldName){
        if(!this.record){
            return '';
        }
        return this.record.raw[fieldName];
    },
});