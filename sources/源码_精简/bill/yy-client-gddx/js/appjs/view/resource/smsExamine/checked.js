Ext.define('App.view.resource.smsExamine.checked', {
    extend: 'Ext.window.Window',
    alias: 'widget.smsExamineCheckedWin',
    width: 550,
    layout: {
        type: 'anchor'
    },
    minSmsSplitBaseNum : 66,
    modal: true,
    title: '短信模板',
    account: null,
    templateValue: null,
    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            items: [
                {
                    xtype: 'form',
                    frame: true,
                    title: '',
                    bodyStyle: 'padding:2px 2px 0',
                    fieldDefaults: {
                        msgTarget: 'side',
                        labelWidth: 90,
                        labelAlign: 'right'
                    },
                    items: this.getItems()
                }
            ],
            buttons: [
                {
                    text: '通过',
                    id: 'btn_add_sms_examine'
                },
                {
                    text: '关闭',
                    handler: function (obj) {
                        var win = obj.up('window');
                        win.close();
                    }
                }
            ]
        });
        me.callParent(arguments);

        //初始化 radio赋值
       if(this.templateValue==1){
            Ext.getCmp('templateRadio0').setValue(true);
        }else if(this.templateValue==2){
            Ext.getCmp('templateRadio1').setValue(true);
        }else if(this.templateValue==3){
           Ext.getCmp('templateRadio2').setValue(true);
       }
            Ext.getCmp('radio2').setValue(true);


    },
    getItems : function(){
        var items = [];
        var fieldset = {
            xtype: 'fieldset',
            title: '审核',
            id: 'account_smsExamine_query_grid',
            collapsible: true,
            defaultType: 'textfield',
            items : [
                {
                    name: '_id',
                    value: this.account.get('_id'),
                    hidden: true
                },
                {
                    name: 'account',
                    value: this.account.get('account'),
                    hidden: true
                },
                {
                    fieldLabel: '模板名称',
                    name: 'name',
                    value: this.account.get('name'),
                },{
                    fieldLabel: '模板内容',
                    name: 'content',
                    id:'content',
                    xtype:'textareafield',
                    value: this.account.get('content'),
                    listeners:{
                        blur: this.delSpecialChar
                    }
                },{
                    fieldLabel: '模板签名',
                    name: 'sign',
                    xtype: 'combobox',
                    value: this.account.get('signToCheck'),
                  /*  store: App.util.AppUtil.getDicStore('smsSign',true,{type:"smsSign",account:this.account.get('_id')}),*/
                    typeAhead: true,
                    queryMode: 'local',
                },
             {
                    fieldLabel: '报备通道',
                    id:'df_smsChannel',
                    name: 'df_smsChannel',
                    xtype: 'combobox',
                    allowBlank: false,
                    layout: {
                        type: 'hbox',
                        pack: 'center',
                        align: 'middle'
                    },
                    store:App.util.AppUtil.getDicStore('smsChannel',true),
                    displayField: 'codeName',
                    valueField: 'codeValue',
                    typeAhead: true,
                    queryMode: 'local'

                },
                {
                    fieldLabel: '短信类型',
                    xtype: 'radiogroup',
                    defaultType: 'radiofield',
                    name: 'templateType',
                    value:3,
                    items:this.getTemplateType()
                },
                {
                    fieldLabel: '是否启用分运营商',
                    xtype: 'radiogroup',
                    defaultType: 'radiofield',
                    name: 'operatorStrategy',
                    items: [
                        {
                            boxLabel: '是',
                            name: 'operatorStrategy',
                            inputValue: true,
                            id:'radio1'
                        }, {
                            boxLabel: '否',
                            name: 'operatorStrategy',
                            inputValue: false,
                            id:'radio2'
                            //checked: true
                        }
                    ],  listeners: {
                        change: this.openOperatorChange
                    }
                },  {
                    fieldLabel: '移动报备通道',
                    name: 'yd_smsChannel',
                    id:'yd_smsChannel',
                    xtype: 'combobox',
                    layout: {
                        type: 'hbox',
                        pack: 'center',
                        align: 'middle'
                    },
                    store:App.util.AppUtil.getDicStore('smsChannel',true),
                    displayField: 'codeName',
                    valueField: 'codeValue',
                    typeAhead: true,
                    queryMode: 'local'

                },{
                    fieldLabel: '电信报备通道',
                    name: 'dx_smsChannel',
                    id:'dx_smsChannel',
                    xtype: 'combobox',
                    store:App.util.AppUtil.getDicStore('smsChannel',true),
                    displayField: 'codeName',
                    valueField: 'codeValue',
                    typeAhead: true,
                    queryMode: 'local'

                }, {
                    fieldLabel: '联通报备通道',
                    name: 'lt_smsChannel',
                    id:'lt_smsChannel',
                    xtype: 'combobox',
                    store:App.util.AppUtil.getDicStore('smsChannel',true),
                    displayField: 'codeName',
                    valueField: 'codeValue',
                    typeAhead: true,
                    queryMode: 'local'

                }
            ]
        };
        items.push(fieldset);
        return items;
    },
    getGroupItems : function (){
        var channels = App.util.AppUtil.getDicCache("smsChannel") || [];
        var items = [];
        var win = this;
        for (var i in channels){
            if(channels[i].codeValue){
                var item = {
                    boxLabel: channels[i].codeName,
                    name: 'smsChannel',
                    inputValue: channels[i].codeValue,
                    smsSplitBaseNum: channels[i].smsSplitBaseNum,
                    checked: false,
                    listeners:{
                        change: function (obj, newVal) {
                            if (newVal) {
                                if(obj.smsSplitBaseNum < win.minSmsSplitBaseNum){
                                    App.util.AppUtil.msg("通道短信分割字数小于最小短信分割字数"+win.minSmsSplitBaseNum);
                                    obj.setValue(false);
                                }
                            }
                        }
                    }
                };
                items.push(item);
            }
        }
        return items;
    },
    openOperatorChange:function (obj,newValue){

        var fieldset = obj.up('fieldset');
        var items = null;
        var type = newValue.operatorStrategy;
        if (type == true) {

            //显示
            Ext.getCmp('yd_smsChannel').setDisabled(false);
            Ext.getCmp('yd_smsChannel').setVisible(true);

            Ext.getCmp('dx_smsChannel').setDisabled(false);
            Ext.getCmp('dx_smsChannel').setVisible(true);

            Ext.getCmp('lt_smsChannel').setDisabled(false);
            Ext.getCmp('lt_smsChannel').setVisible(true);
            type=null;
        } else if (type == false||type.length>1) {

            //隐藏
            Ext.getCmp('yd_smsChannel').setDisabled(true);
            Ext.getCmp('yd_smsChannel').setVisible(false);
            //重置下拉框选中值（初始化）
            Ext.getCmp('yd_smsChannel').reset();

            Ext.getCmp('dx_smsChannel').setDisabled(true);
            Ext.getCmp('dx_smsChannel').setVisible(false);
            Ext.getCmp('dx_smsChannel').reset();

            Ext.getCmp('lt_smsChannel').setDisabled(true);
            Ext.getCmp('lt_smsChannel').setVisible(false);
            Ext.getCmp('lt_smsChannel').reset();
            items=null;
        }

    },
    getTemplateType:function () {
     var tags={};
        App.util.AppUtil.requestSync('bill.resource.queryTemplateType',{},function(data){
            tags=data.list;
        });
        var items = [];
        for(var i in tags){
            var item = {
                boxLabel: tags[i].code_name,
                name: 'templateType',
                id:'templateRadio'+i,
                inputValue: tags[i].code_value,
                checked: false
            };
            items.push(item);
        }
        return items;
    },

    delSpecialChar:function(obj){
        var content=obj.value;
        content = content.replace(/\/'/g,"'");
        content = content.replace(/\/"/g,'"');
        var contentarr = content.split('"');
        var str = "";
        var str2 = "";
        for(var j = 0;j< contentarr.length-1;j++){
            str+=contentarr[j]+(j%2?'”':'“');
        }
        str+=contentarr[j];
        contentarr = str.split("'");
        for(var j = 0;j<contentarr.length-1;j++){
            str2 += contentarr[j]+(j%2?'’':'‘');
        }
        str2 +=contentarr[j];
        var reg1 = new RegExp("<[^<]*>", "gi")
        str2 = str2.replace(reg1,'');
        var reg2 = new RegExp("</", "gi")
        str2 = str2.replace(reg2,'');
        if(str2.substr(str2.length-1,1) == '\\'&&str2.substr(str2.length-2,2) != '\\\\'){
            str2 = str2+'\\'
        }

        Ext.getCmp('content').setValue(str2);
    }

});